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

	// API v1
	v1 := r.Group("/api/v1")
	{
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

			// 盲盒相关
			protected.POST("/boxes", boxHandler.CreateBox)
			protected.GET("/boxes/:id", boxHandler.GetBox)
			protected.GET("/boxes", boxHandler.ListBoxes)
			protected.POST("/boxes/:id/purchase", boxHandler.PurchaseBox)
		}
	}

	return r
}
