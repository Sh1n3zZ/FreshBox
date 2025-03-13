package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"

	"FreshBox/internal/pkg/jwt"
	"FreshBox/internal/pkg/validator"
	"FreshBox/internal/service"
)

// UserHandler 用户处理器
type UserHandler struct {
	userService *service.UserService
}

// NewUserHandler 创建用户处理器
func NewUserHandler(userService *service.UserService) *UserHandler {
	return &UserHandler{
		userService: userService,
	}
}

// Register 用户注册
func (h *UserHandler) Register(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    "INVALID_PARAMS",
			"message": "无效的请求参数",
		})
		return
	}

	// 创建用户
	user := &service.User{
		Username: req.Username,
		Email:    req.Email,
		Password: req.Password,
	}

	if err := h.userService.Register(c.Request.Context(), user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    "REGISTER_FAILED",
			"message": err.Error(),
		})
		return
	}

	// 生成令牌
	accessToken, refreshToken, err := jwt.GenerateTokenPair(user.ID, user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "TOKEN_GENERATION_FAILED",
			"message": "生成令牌失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"accessToken":  accessToken,
		"refreshToken": refreshToken,
		"user": gin.H{
			"id":        user.ID,
			"username":  user.Username,
			"email":     user.Email,
			"avatar":    user.Avatar,
			"createdAt": user.CreatedAt,
		},
	})
}

// Login 用户登录
func (h *UserHandler) Login(c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    "INVALID_PARAMS",
			"message": "无效的请求参数",
		})
		return
	}

	// 验证用户
	user, err := h.userService.LoginByEmail(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"code":    "LOGIN_FAILED",
			"message": err.Error(),
		})
		return
	}

	// 生成令牌
	accessToken, refreshToken, err := jwt.GenerateTokenPair(user.ID, user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "TOKEN_GENERATION_FAILED",
			"message": "生成令牌失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"accessToken":  accessToken,
		"refreshToken": refreshToken,
		"user": gin.H{
			"id":        user.ID,
			"username":  user.Username,
			"email":     user.Email,
			"avatar":    user.Avatar,
			"createdAt": user.CreatedAt,
		},
	})
}

// RefreshToken 刷新令牌
func (h *UserHandler) RefreshToken(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refreshToken" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    "INVALID_PARAMS",
			"message": "无效的请求参数",
		})
		return
	}

	// 验证刷新令牌
	claims, err := jwt.ValidateRefreshToken(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"code":    "INVALID_REFRESH_TOKEN",
			"message": "无效的刷新令牌",
		})
		return
	}

	// 获取用户信息
	user, err := h.userService.GetUserByID(c.Request.Context(), claims.UserID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"code":    "USER_NOT_FOUND",
			"message": "用户不存在",
		})
		return
	}

	// 生成新的令牌对
	accessToken, refreshToken, err := jwt.GenerateTokenPair(user.ID, user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "TOKEN_GENERATION_FAILED",
			"message": "生成令牌失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"accessToken":  accessToken,
		"refreshToken": refreshToken,
	})
}

// GetProfile 获取用户信息
func (h *UserHandler) GetProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"code":    "UNAUTHORIZED",
			"message": "未认证",
		})
		return
	}

	user, err := h.userService.GetProfile(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "PROFILE_FETCH_FAILED",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": gin.H{
			"id":        user.ID,
			"username":  user.Username,
			"email":     user.Email,
			"avatar":    user.Avatar,
			"createdAt": user.CreatedAt,
		},
	})
}

// UpdateProfile 更新用户信息
func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"code": 401,
			"msg":  "未认证",
		})
		return
	}

	var req validator.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "无效的请求参数",
		})
		return
	}

	// 验证请求参数
	if err := validator.Validate(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  err.Error(),
		})
		return
	}

	user := &service.User{
		ID:    userID.(string),
		Email: req.Email,
	}

	if err := h.userService.UpdateProfile(c.Request.Context(), user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  errors.Wrap(err, "更新用户信息失败").Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": user,
		"msg":  "更新成功",
	})
}
