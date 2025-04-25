package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"

	"FreshBox/internal/service"
)

// MailHandler 邮件处理器
type MailHandler struct {
	mailService *service.MailService
}

// NewMailHandler 创建邮件处理器
func NewMailHandler(mailService *service.MailService) *MailHandler {
	return &MailHandler{
		mailService: mailService,
	}
}

// SendVerificationCode 发送验证码
// @Summary 发送验证码
// @Description 向指定邮箱发送验证码
// @Tags 验证码
// @Accept json
// @Produce json
// @Param request body SendVerificationCodeRequest true "发送验证码请求"
// @Success 200 {object} SendVerificationCodeResponse "发送成功"
// @Failure 400 {object} ErrorResponse "参数错误"
// @Failure 500 {object} ErrorResponse "服务器内部错误"
// @Router /api/v1/auth/verification-code [post]
func (h *MailHandler) SendVerificationCode(c *gin.Context) {
	var req SendVerificationCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "请求参数无效",
		})
		return
	}

	// 验证邮箱格式
	if req.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "邮箱不能为空",
		})
		return
	}

	// 发送验证码
	_, err := h.mailService.SendVerificationCode(c, req.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": errors.Wrap(err, "发送验证码失败").Error(),
		})
		return
	}

	c.JSON(http.StatusOK, SendVerificationCodeResponse{
		Success: true,
		Message: "验证码已发送",
	})
}

// VerifyCode 验证验证码
// @Summary 验证验证码
// @Description 验证邮箱和验证码是否匹配
// @Tags 验证码
// @Accept json
// @Produce json
// @Param request body VerifyCodeRequest true "验证码验证请求"
// @Success 200 {object} VerifyCodeResponse "验证成功"
// @Failure 400 {object} ErrorResponse "参数错误"
// @Failure 500 {object} ErrorResponse "服务器内部错误"
// @Router /api/v1/auth/verify-code [post]
func (h *MailHandler) VerifyCode(c *gin.Context) {
	var req VerifyCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "请求参数无效",
		})
		return
	}

	// 验证邮箱和验证码
	if req.Email == "" || req.Code == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "邮箱和验证码不能为空",
		})
		return
	}

	// 验证验证码
	valid, err := h.mailService.VerifyCode(c, req.Email, req.Code)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	if !valid {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "验证码无效",
		})
		return
	}

	c.JSON(http.StatusOK, VerifyCodeResponse{
		Success: true,
		Message: "验证码验证成功",
	})
}

// SendVerificationCodeRequest 发送验证码请求
type SendVerificationCodeRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// SendVerificationCodeResponse 发送验证码响应
type SendVerificationCodeResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

// VerifyCodeRequest 验证码验证请求
type VerifyCodeRequest struct {
	Email string `json:"email" binding:"required,email"`
	Code  string `json:"code" binding:"required"`
}

// VerifyCodeResponse 验证码验证响应
type VerifyCodeResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}
