package rest

import (
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"

	"FreshBox/internal/api/rest/handler"
	"FreshBox/internal/api/rest/middleware"
)

// SetupRouter 设置路由
func SetupRouter(
	userHandler *handler.UserHandler,
	boxHandler *handler.BoxHandler,
	taskHandler *handler.TaskHandler,
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
	dashboardHandler := handler.NewDashboardHandler()

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

		// 公开的盲盒接口 - 不需要认证
		v1.GET("/boxes", boxHandler.ListBoxes)
		v1.GET("/boxes/:id", boxHandler.GetBox)

		// 仪表盘接口 - 公开接口（在实际生产环境中应该加上认证）
		dashboard := v1.Group("/dashboard")
		{
			dashboard.GET("/summary", dashboardHandler.GetSummary)
			dashboard.GET("/revenue", dashboardHandler.GetRevenueStats)
			dashboard.GET("/categories", dashboardHandler.GetBoxCategories)
			dashboard.GET("/user-activity", dashboardHandler.GetUserActivity)
			dashboard.GET("/donations", dashboardHandler.GetDonationStats)
			dashboard.GET("/recent-boxes", dashboardHandler.GetRecentBoxes)
			dashboard.GET("/top-tasks", dashboardHandler.GetTopPerformingTasks)
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
		}

		// 需要认证的接口
		protected := v1.Group("")
		protected.Use(middleware.Auth())
		{
			// 用户相关
			protected.GET("/user/profile", userHandler.GetProfile)
			protected.PUT("/user/profile", userHandler.UpdateProfile)

			// 盲盒相关 - 需要认证
			protected.POST("/boxes", boxHandler.CreateBox)
			protected.PUT("/boxes/:id", boxHandler.UpdateBox)
			protected.DELETE("/boxes/:id", boxHandler.DeleteBox)
			protected.POST("/boxes/:id/purchase", boxHandler.PurchaseBox)

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
