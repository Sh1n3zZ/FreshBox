package rest

import (
	"github.com/gin-gonic/gin"

	"FreshBox/internal/api/rest/handler"
	"FreshBox/internal/api/rest/middleware"
)

// SetupRouter 设置路由
func SetupRouter(
	userHandler *handler.UserHandler,
	boxHandler *handler.BoxHandler,
) *gin.Engine {
	r := gin.Default()

	// 全局中间件
	r.Use(middleware.Trace())
	r.Use(middleware.Logger())
	r.Use(middleware.Recovery())

	// API v1
	v1 := r.Group("/api/v1")
	{
		// 公开接口
		public := v1.Group("")
		{
			// 用户注册和登录
			public.POST("/register", userHandler.Register)
			public.POST("/login", userHandler.Login)
		}

		// 需要认证的接口
		auth := v1.Group("")
		auth.Use(middleware.Auth())
		{
			// 用户相关
			auth.GET("/profile", userHandler.GetProfile)
			auth.PUT("/profile", userHandler.UpdateProfile)

			// 盲盒相关
			auth.POST("/boxes", boxHandler.CreateBox)
			auth.GET("/boxes/:id", boxHandler.GetBox)
			auth.GET("/boxes", boxHandler.ListBoxes)
			auth.POST("/boxes/:id/purchase", boxHandler.PurchaseBox)
		}
	}

	return r
}
