package rest

import (
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"

	"FreshBox/internal/api/rest/handler"
	"FreshBox/internal/api/rest/middleware"
	"FreshBox/internal/service"
)

// SetupRouter 设置路由
func SetupRouter(
	userHandler *handler.UserHandler,
	blindBoxHandler *handler.BlindBoxHandler,
	productHandler *handler.ProductHandler,
	manufacturerHandler *handler.ManufacturerHandler,
	ingredientHandler *handler.IngredientHandler,
	taskHandler *handler.TaskHandler,
	mailHandler *handler.MailHandler,
	blindBoxService *service.BlindBoxService,
) *gin.Engine {
	r := gin.Default()

	// CORS配置
	corsConfig := cors.DefaultConfig()

	// 根据环境设置CORS
	if viper.GetString("app.mode") == "development" {
		corsConfig.AllowAllOrigins = true
		corsConfig.AllowCredentials = false // AllowAllOrigins为true时，必须设置为false
	} else {
		corsConfig.AllowOrigins = []string{
			viper.GetString("cors.allow_origin"),
			"http://localhost:3000",
			"http://localhost:3001",
		}
		corsConfig.AllowCredentials = viper.GetBool("cors.allow_credentials")
	}

	corsConfig.AllowMethods = []string{
		http.MethodGet,
		http.MethodPost,
		http.MethodPut,
		http.MethodPatch,
		http.MethodDelete,
		http.MethodOptions,
		http.MethodHead,
	}
	corsConfig.AllowHeaders = []string{
		"Origin",
		"Content-Type",
		"Content-Length",
		"Accept-Encoding",
		"X-CSRF-Token",
		"Authorization",
		"Accept",
		"Cache-Control",
		"X-Requested-With",
	}
	corsConfig.ExposeHeaders = []string{
		"Content-Length",
		"Authorization",
	}
	corsConfig.MaxAge = time.Duration(viper.GetInt("cors.max_age")) * time.Hour

	r.Use(cors.New(corsConfig))

	// 全局中间件
	r.Use(middleware.Trace())
	r.Use(middleware.Logger())
	r.Use(middleware.Recovery())

	// 静态文件服务
	r.Static("/static/uploads/boxes", "./uploads/boxes")
	r.Static("/static/uploads/users", "./uploads/users")
	r.Static("/static/uploads/others", "./uploads/others")
	r.Static("/static/uploads/ocr", "./uploads/ocr")

	// 图片处理
	imageHandler := handler.NewImageHandler()
	r.GET("/images/:type/:filename", imageHandler.GetImage)

	// OCR处理器初始化
	ocrHandler, err := handler.NewOCRHandler()
	if err != nil {
		panic(err)
	}

	// 仪表盘处理器
	dashboardHandler := handler.NewDashboardHandler(blindBoxService)

	// API v1
	v1 := r.Group("/api/v1")
	{
		// 上传图片接口 - 不需要认证
		v1.POST("/upload", imageHandler.UploadImage)

		// OCR接口 - 公开接口
		ocr := v1.Group("/ocr")
		{
			ocr.POST("/process", ocrHandler.UploadAndProcess)
			ocr.POST("/batch", ocrHandler.ProcessBatchImages)
			ocr.POST("/save", ocrHandler.SaveImageOCR)
		}

		// 仪表盘接口 - 公开接口（在实际生产环境中应该加上认证）
		dashboard := v1.Group("/dashboard")
		{
			dashboard.GET("/summary", dashboardHandler.GetDashboardStats)
			dashboard.GET("/blind-box-trend", dashboardHandler.GetBlindBoxOpeningTrend)
		}

		// 盲盒接口 - 部分需要认证
		blindBoxes := v1.Group("/blind-boxes")
		{
			// 公开接口
			blindBoxes.GET("", blindBoxHandler.ListBlindBoxes)                        // 获取盲盒列表
			blindBoxes.GET("/:id", blindBoxHandler.GetBlindBox)                       // 获取盲盒详情
			blindBoxes.GET("/:id/history", blindBoxHandler.GetBlindBoxOpeningHistory) // 获取盲盒开启历史

			// 需要认证的接口
			blindBoxesAuth := blindBoxes.Group("")
			blindBoxesAuth.Use(middleware.Auth())
			{
				blindBoxesAuth.POST("", blindBoxHandler.CreateBlindBox)                // 创建盲盒
				blindBoxesAuth.PUT("/:id", blindBoxHandler.UpdateBlindBox)             // 更新盲盒
				blindBoxesAuth.DELETE("/:id", blindBoxHandler.DeleteBlindBox)          // 删除盲盒
				blindBoxesAuth.POST("/:id/purchase", blindBoxHandler.PurchaseBlindBox) // 购买盲盒
				blindBoxesAuth.POST("/:id/open", blindBoxHandler.OpenBlindBox)         // 开启盲盒
			}
		}

		// 商品接口 - 部分需要认证
		products := v1.Group("/products")
		{
			// 公开接口
			products.GET("", productHandler.ListProducts)                      // 获取商品列表
			products.GET("/:id", productHandler.GetProduct)                    // 获取商品详情
			products.GET("/status", productHandler.GetProductsByStatus)        // 根据状态获取商品
			products.GET("/box/:box_id", productHandler.GetProductsByBlindBox) // 获取盲盒内商品

			// 需要认证的接口
			productsAuth := products.Group("")
			productsAuth.Use(middleware.Auth())
			{
				productsAuth.POST("", productHandler.CreateProduct)                                 // 创建商品
				productsAuth.PUT("/:id", productHandler.UpdateProduct)                              // 更新商品
				productsAuth.DELETE("/:id", productHandler.DeleteProduct)                           // 删除商品
				productsAuth.POST("/:id/add-to-box", productHandler.AddProductToBlindBox)           // 添加商品到盲盒
				productsAuth.POST("/:id/remove-from-box", productHandler.RemoveProductFromBlindBox) // 从盲盒移除商品
				productsAuth.POST("/batch-add-to-box", productHandler.BatchAddProductsToBlindBox)   // 批量添加商品到盲盒
			}
		}

		// 生产商接口 - 部分需要认证
		manufacturers := v1.Group("/manufacturers")
		{
			// 公开接口 (列表和详情通常是公开的)
			manufacturers.GET("", manufacturerHandler.ListManufacturers)   // 获取生产商列表
			manufacturers.GET("/:id", manufacturerHandler.GetManufacturer) // 获取生产商详情

			// 需要认证的接口 (通常是管理员操作)
			manufacturersAuth := manufacturers.Group("")
			manufacturersAuth.Use(middleware.Auth())
			{
				manufacturersAuth.POST("", manufacturerHandler.CreateManufacturer)       // 创建生产商
				manufacturersAuth.PUT("/:id", manufacturerHandler.UpdateManufacturer)    // 更新生产商
				manufacturersAuth.DELETE("/:id", manufacturerHandler.DeleteManufacturer) // 删除生产商
			}
		}

		// 配料接口 - 部分需要认证
		ingredients := v1.Group("/ingredients")
		{
			// 公开接口
			ingredients.GET("", ingredientHandler.ListIngredients)   // 获取配料列表
			ingredients.GET("/:id", ingredientHandler.GetIngredient) // 获取配料详情

			// 需要认证的接口
			ingredientsAuth := ingredients.Group("")
			ingredientsAuth.Use(middleware.Auth())
			{
				ingredientsAuth.POST("", ingredientHandler.CreateIngredient)       // 创建配料
				ingredientsAuth.PUT("/:id", ingredientHandler.UpdateIngredient)    // 更新配料
				ingredientsAuth.DELETE("/:id", ingredientHandler.DeleteIngredient) // 删除配料
			}
		}

		// 社交任务接口 - 部分公开
		tasks := v1.Group("/tasks")
		{
			// 公开接口
			tasks.GET("", taskHandler.ListTasks)                       // 获取任务列表
			tasks.GET("/recommended", taskHandler.GetRecommendedTasks) // 获取推荐任务
			tasks.GET("/popular", taskHandler.GetPopularTasks)         // 获取热门任务
			tasks.GET("/:id", taskHandler.GetTask)                     // 获取任务详情
			tasks.GET("/:id/progress", taskHandler.GetTaskProgress)    // 获取任务进度
			tasks.GET("/:id/contents", taskHandler.GetTaskContents)    // 获取任务内容列表

			// 需要认证的接口
			tasksAuth := tasks.Group("")
			tasksAuth.Use(middleware.Auth())
			{
				tasksAuth.POST("", taskHandler.CreateTask)                    // 创建任务
				tasksAuth.PUT("/:id/status", taskHandler.UpdateTaskStatus)    // 更新任务状态
				tasksAuth.POST("/:id/content", taskHandler.UploadTaskContent) // 上传任务内容
			}
		}

		// 认证相关接口
		auth := v1.Group("/auth")
		{
			auth.POST("/register", userHandler.Register)
			auth.POST("/login", userHandler.Login)
			auth.POST("/refresh", userHandler.RefreshToken)
			auth.POST("/verification-code", mailHandler.SendVerificationCode)
		}

		// 需要认证的接口
		protected := v1.Group("")
		protected.Use(middleware.Auth())
		{
			// 用户相关
			protected.GET("/user/profile", userHandler.GetProfile)
			protected.PUT("/user/profile", userHandler.UpdateProfile)

			// 上传图片 - 需要认证的上传（可选，如果需要认证）
			protected.POST("/upload/auth", imageHandler.UploadImage)

			// OCR - 需要认证的接口
			protected.POST("/ocr/process/secure", ocrHandler.UploadAndProcess)
			protected.POST("/ocr/save/secure", ocrHandler.SaveImageOCR)
		}
	}

	// 健康检查端点，用于监控和前端检测API可用性
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "ok",
			"timestamp": time.Now().Unix(),
			"version":   viper.GetString("app.version"),
		})
	})

	return r
}
