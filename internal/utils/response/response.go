package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// Response API响应结构
type Response struct {
	Code    int         `json:"code"`
	Data    interface{} `json:"data"`
	Msg     string      `json:"msg"`
	TraceID string      `json:"trace_id"`
}

// Success 成功响应
func Success(c *gin.Context, data interface{}) {
	traceID := c.GetString("trace_id")
	if traceID == "" {
		traceID = uuid.NewString()
	}

	c.JSON(http.StatusOK, Response{
		Code:    http.StatusOK,
		Data:    data,
		Msg:     "success",
		TraceID: traceID,
	})
}

// Error 错误响应
func Error(c *gin.Context, code int, msg string, err error) {
	traceID := c.GetString("trace_id")
	if traceID == "" {
		traceID = uuid.NewString()
	}

	if err != nil {
		// 记录日志
		c.Error(err)
	}

	c.JSON(code, Response{
		Code:    code,
		Data:    nil,
		Msg:     msg,
		TraceID: traceID,
	})
}

// BadRequest 400错误
func BadRequest(c *gin.Context, msg string, err error) {
	Error(c, http.StatusBadRequest, msg, err)
}

// Unauthorized 401错误
func Unauthorized(c *gin.Context, msg string, err error) {
	if msg == "" {
		msg = "未授权访问"
	}
	Error(c, http.StatusUnauthorized, msg, err)
}

// Forbidden 403错误
func Forbidden(c *gin.Context, msg string, err error) {
	if msg == "" {
		msg = "禁止访问"
	}
	Error(c, http.StatusForbidden, msg, err)
}

// NotFound 404错误
func NotFound(c *gin.Context, msg string, err error) {
	if msg == "" {
		msg = "资源不存在"
	}
	Error(c, http.StatusNotFound, msg, err)
}

// InternalError 500错误
func InternalError(c *gin.Context, msg string, err error) {
	if msg == "" {
		msg = "服务器内部错误"
	}
	Error(c, http.StatusInternalServerError, msg, err)
}
