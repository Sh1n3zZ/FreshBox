package middleware

import (
	"net/http"
	"runtime/debug"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

// Trace 添加跟踪ID
func Trace() gin.HandlerFunc {
	return func(c *gin.Context) {
		traceID := c.GetHeader("X-Trace-ID")
		if traceID == "" {
			traceID = uuid.NewString()
		}
		c.Set("trace_id", traceID)
		c.Header("X-Trace-ID", traceID)
		c.Next()
	}
}

// Logger 日志中间件
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 开始时间
		start := time.Now()

		// 处理请求
		c.Next()

		// 结束时间
		end := time.Now()
		latency := end.Sub(start)

		// 获取trace_id
		traceID, _ := c.Get("trace_id")

		// 记录日志
		zap.L().Info("access log",
			zap.String("method", c.Request.Method),
			zap.String("path", c.Request.URL.Path),
			zap.Int("status", c.Writer.Status()),
			zap.Duration("latency", latency),
			zap.String("trace_id", traceID.(string)),
		)
	}
}

// Recovery 恢复中间件
func Recovery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				// 获取trace_id
				traceID, _ := c.Get("trace_id")

				// 记录错误日志
				zap.L().Error("panic recovered",
					zap.Any("error", err),
					zap.String("trace_id", traceID.(string)),
					zap.String("stack", string(debug.Stack())),
				)

				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
					"code":     500,
					"msg":      "服务器内部错误",
					"trace_id": traceID,
				})
			}
		}()
		c.Next()
	}
}
