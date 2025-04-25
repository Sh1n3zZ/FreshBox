package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"github.com/spf13/viper"
	"go.uber.org/zap"
	"gorm.io/driver/mysql"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"FreshBox/internal/api/rest"
	"FreshBox/internal/api/rest/handler"
	"FreshBox/internal/core/pricing"
	"FreshBox/internal/core/social"
	"FreshBox/internal/pkg/jwt"
	"FreshBox/internal/pkg/migration"
	"FreshBox/internal/service"
)

func main() {
	if err := initConfig(); err != nil {
		panic(fmt.Sprintf("初始化配置失败: %v", err))
	}

	logger, err := initLogger()
	if err != nil {
		panic(fmt.Sprintf("初始化日志失败: %v", err))
	}
	defer logger.Sync()

	// 设置JWT日志记录器
	jwt.SetLogger(logger)

	// 初始化JWT秘钥
	if err := jwt.InitJWTSecret(); err != nil {
		logger.Fatal("初始化JWT秘钥失败", zap.Error(err))
	}

	// 检查前端构建目录是否存在
	frontendDir := "./front/dist"
	if _, err := os.Stat(frontendDir); os.IsNotExist(err) {
		logger.Error("前端构建目录不存在，请确保已构建前端应用",
			zap.String("expected_path", frontendDir),
			zap.String("hint", "运行 'cd front && npm run build' 生成dist目录"))
		panic("前端构建目录不存在，请先构建前端应用")
	}

	db, err := initDB(logger)
	if err != nil {
		logger.Fatal("初始化数据库失败", zap.Error(err))
	}

	redisClient := initRedis()
	defer redisClient.Close()

	// 初始化定价引擎
	pricingStrategy := pricing.NewTimeBasedStrategy(0.8, 72) // 最大折扣80%，72小时阈值
	pricingEngine := pricing.NewDefaultEngine(redisClient, pricingStrategy)

	// 初始化SMTP配置
	smtpConfig := service.SMTPConfig{
		Host:                      viper.GetString("smtp.host"),
		Port:                      viper.GetInt("smtp.port"),
		Username:                  viper.GetString("smtp.username"),
		Password:                  viper.GetString("smtp.password"),
		FromEmail:                 viper.GetString("smtp.from_email"),
		FromName:                  viper.GetString("smtp.from_name"),
		VerificationSubject:       viper.GetString("smtp.verification_subject"),
		VerificationExpireMinutes: viper.GetInt("smtp.verification_expire_minutes"),
	}

	// 初始化业务服务
	mailService := service.NewMailService(db, smtpConfig)
	userService := service.NewUserService(db, mailService)
	// // 初始化以太坊客户端
	// ethClient, err := ethclient.Dial(viper.GetString("blockchain.polygon.rpc_url"))
	// if err != nil {
	// 	logger.Fatal("连接区块链网络失败", zap.Error(err))
	// }

	// // 初始化以太坊私钥
	// privateKey, err := crypto.HexToECDSA(viper.GetString("blockchain.polygon.private_key"))
	// if err != nil {
	// 	logger.Fatal("解析私钥失败", zap.Error(err))
	// }

	// // 创建交易签名者
	// chainID, err := ethClient.ChainID(context.Background())
	// if err != nil {
	// 	logger.Fatal("获取链ID失败", zap.Error(err))
	// }

	// auth, err := bind.NewKeyedTransactorWithChainID(privateKey, chainID)
	// if err != nil {
	// 	logger.Fatal("创建交易签名者失败", zap.Error(err))
	// }

	// // 初始化区块链服务
	// blockchainService, err := donation.NewPolygonService(
	// 	ethClient,
	// 	viper.GetString("blockchain.polygon.contract_address"),
	// 	auth,
	// 	viper.GetString("blockchain.polygon.ipfs_gateway"),
	// )
	// if err != nil {
	// 	logger.Fatal("初始化区块链服务失败", zap.Error(err))
	// }

	// 初始化盲盒服务和商品服务
	blindBoxService := service.NewBlindBoxService(db, pricingEngine, logger, userService)
	productService := service.NewProductService(db, logger, userService)

	// 初始化社交任务服务
	taskManager := social.NewDefaultTaskManager(db)
	contentManager := social.NewDefaultContentManager(db)

	manufacturerService := service.NewManufacturerService(db, logger, userService)
	ingredientService := service.NewIngredientService(db, logger, userService)

	// 初始化处理器
	userHandler := handler.NewUserHandler(userService)
	blindBoxHandler := handler.NewBlindBoxHandler(blindBoxService, productService)
	productHandler := handler.NewProductHandler(productService)
	manufacturerHandler := handler.NewManufacturerHandler(manufacturerService)
	ingredientHandler := handler.NewIngredientHandler(ingredientService)
	taskHandler := handler.NewTaskHandler(taskManager, contentManager)
	mailHandler := handler.NewMailHandler(mailService)

	// 设置运行模式
	if viper.GetString("app.mode") == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// 设置路由
	r := rest.SetupRouter(
		userHandler,
		blindBoxHandler,
		productHandler,
		manufacturerHandler,
		ingredientHandler,
		taskHandler,
		mailHandler,
	)

	// 服务前端构建文件
	r.Static("/assets", frontendDir+"/assets")
	r.StaticFile("/favicon.ico", frontendDir+"/favicon.ico")
	r.StaticFile("/", frontendDir+"/index.html")

	// 所有不匹配的路由都默认到index.html
	r.NoRoute(func(c *gin.Context) {
		// 如果是API请求，返回404
		if len(c.Request.URL.Path) >= 4 && c.Request.URL.Path[:4] == "/api" {
			c.JSON(http.StatusNotFound, gin.H{
				"code": 404,
				"msg":  "API not found",
			})
			return
		}
		// 否则返回前端应用
		c.File(frontendDir + "/index.html")
	})

	// 创建HTTP服务器
	srv := &http.Server{
		Addr:    fmt.Sprintf(":%d", viper.GetInt("app.port")),
		Handler: r,
	}

	// 优雅关闭
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("监听失败", zap.Error(err))
		}
	}()

	logger.Info("服务器启动成功",
		zap.Int("port", viper.GetInt("app.port")),
		zap.String("mode", viper.GetString("app.mode")),
		zap.String("frontend", frontendDir))

	// 等待中断信号
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("关闭服务器...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		logger.Fatal("服务器强制关闭", zap.Error(err))
	}

	logger.Info("服务器已退出")
}

func initConfig() error {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath("./configs")

	return viper.ReadInConfig()
}

func initLogger() (*zap.Logger, error) {
	var cfg zap.Config
	if viper.GetString("app.mode") == "production" {
		cfg = zap.NewProductionConfig()
	} else {
		cfg = zap.NewDevelopmentConfig()
	}

	return cfg.Build()
}

func initDB(logger *zap.Logger) (*gorm.DB, error) {
	// 尝试连接MySQL
	if viper.IsSet("mysql.host") {
		dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local",
			viper.GetString("mysql.username"),
			viper.GetString("mysql.password"),
			viper.GetString("mysql.host"),
			viper.GetInt("mysql.port"),
			viper.GetString("mysql.database"),
		)

		db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
		if err == nil {
			logger.Info("成功连接到MySQL数据库")
			// 执行数据库迁移
			if err := migration.Run(db); err != nil {
				return nil, fmt.Errorf("MySQL迁移失败: %v", err)
			}
			return db, nil
		}
		logger.Warn("连接MySQL失败，将使用SQLite作为备选", zap.Error(err))
	}

	// 如果MySQL连接失败或未配置，使用SQLite
	dbPath := "./data"
	if err := os.MkdirAll(dbPath, 0755); err != nil {
		return nil, fmt.Errorf("创建数据目录失败: %v", err)
	}

	sqlitePath := filepath.Join(dbPath, "freshbox.db")
	logger.Info("使用SQLite数据库", zap.String("path", sqlitePath))

	db, err := gorm.Open(sqlite.Open(sqlitePath), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("打开SQLite数据库失败: %v", err)
	}

	// 执行数据库迁移
	if err := migration.Run(db); err != nil {
		return nil, fmt.Errorf("SQLite迁移失败: %v", err)
	}

	return db, nil
}

func initRedis() *redis.Client {
	return redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%d", viper.GetString("redis.host"), viper.GetInt("redis.port")),
		Password: viper.GetString("redis.password"),
		DB:       viper.GetInt("redis.db"),
	})
}
