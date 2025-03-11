package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"github.com/spf13/viper"
	"go.uber.org/zap"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	"FreshBox/internal/api/rest"
	"FreshBox/internal/api/rest/handler"
	"FreshBox/internal/core/pricing"
	"FreshBox/internal/core/vision"
	"FreshBox/internal/service"
)

func main() {
	// 初始化配置
	if err := initConfig(); err != nil {
		panic(fmt.Sprintf("初始化配置失败: %v", err))
	}

	// 初始化日志
	logger, err := initLogger()
	if err != nil {
		panic(fmt.Sprintf("初始化日志失败: %v", err))
	}
	defer logger.Sync()

	// 初始化数据库
	db, err := initDB()
	if err != nil {
		logger.Fatal("初始化数据库失败", zap.Error(err))
	}

	// 初始化Redis
	redisClient := initRedis()
	defer redisClient.Close()

	// 初始化视觉服务
	visionService, err := vision.NewVisionService(
		fmt.Sprintf("%s:%d",
			viper.GetString("vision.grpc.host"),
			viper.GetInt("vision.grpc.port"),
		),
		0.8, // 置信度阈值
	)
	if err != nil {
		logger.Fatal("初始化视觉服务失败", zap.Error(err))
	}
	defer visionService.Close()

	// 初始化定价引擎
	pricingStrategy := pricing.NewTimeBasedStrategy(0.8, 72) // 最大折扣80%，72小时阈值
	pricingEngine := pricing.NewDefaultEngine(redisClient, pricingStrategy)

	// 初始化业务服务
	userService := service.NewUserService(db)
	boxService := service.NewBoxService(db, pricingEngine, visionService)

	// 初始化处理器
	userHandler := handler.NewUserHandler(userService)
	boxHandler := handler.NewBoxHandler(boxService)

	// 设置运行模式
	if viper.GetString("app.mode") == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// 设置路由
	r := rest.SetupRouter(userHandler, boxHandler)

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

func initDB() (*gorm.DB, error) {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		viper.GetString("mysql.username"),
		viper.GetString("mysql.password"),
		viper.GetString("mysql.host"),
		viper.GetInt("mysql.port"),
		viper.GetString("mysql.database"),
	)

	return gorm.Open(mysql.Open(dsn), &gorm.Config{})
}

func initRedis() *redis.Client {
	return redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%d", viper.GetString("redis.host"), viper.GetInt("redis.port")),
		Password: viper.GetString("redis.password"),
		DB:       viper.GetInt("redis.db"),
	})
}
