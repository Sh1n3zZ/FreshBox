package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"

	"FreshBox/internal/model"
	"FreshBox/internal/pkg/jwt"
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

// GetUserService 获取用户服务实例
func (h *UserHandler) GetUserService() *service.UserService {
	return h.userService
}

// Register 用户注册
// @Summary 用户注册
// @Description 注册新用户
// @Tags 用户
// @Accept json
// @Produce json
// @Param request body RegisterRequest true "注册请求"
// @Success 200 {object} RegisterResponse "注册成功"
// @Failure 400 {object} ErrorResponse "参数错误"
// @Failure 500 {object} ErrorResponse "服务器内部错误"
// @Router /api/v1/auth/register [post]
func (h *UserHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "请求参数无效",
		})
		return
	}

	// 创建注册请求
	registerReq := &service.RegisterRequest{
		Username: req.Username,
		Email:    req.Email,
		Password: req.Password,
		Code:     req.Code,
	}

	// 调用服务层进行注册（包含验证码验证）
	user, err := h.userService.Register(c, registerReq)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// 生成JWT令牌
	accessToken, refreshToken, err := jwt.GenerateTokenPair(user.ID, user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "生成令牌失败",
		})
		return
	}

	c.JSON(http.StatusOK, RegisterResponse{
		UserID:       user.ID,
		Username:     user.Username,
		Email:        user.Email,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	})
}

// Login 用户登录
// @Summary 用户登录
// @Description 用户登录并返回token
// @Tags 用户
// @Accept json
// @Produce json
// @Param request body LoginRequest true "登录请求"
// @Success 200 {object} LoginResponse "登录成功"
// @Failure 400 {object} ErrorResponse "参数错误"
// @Failure 500 {object} ErrorResponse "服务器内部错误"
// @Router /api/v1/auth/login [post]
func (h *UserHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "请求参数无效",
		})
		return
	}

	// 调用服务层进行登录
	user, err := h.userService.Login(c, req.Login, req.Password)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// 生成JWT令牌
	accessToken, refreshToken, err := jwt.GenerateTokenPair(user.ID, user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "生成令牌失败",
		})
		return
	}

	c.JSON(http.StatusOK, LoginResponse{
		UserID:       user.ID,
		Username:     user.Username,
		Email:        user.Email,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	})
}

// RefreshToken 刷新Token
// @Summary 刷新认证Token
// @Description 使用旧Token刷新获取新Token
// @Tags 用户
// @Accept json
// @Produce json
// @Param request body RefreshTokenRequest true "刷新Token请求"
// @Success 200 {object} RefreshTokenResponse "刷新成功"
// @Failure 400 {object} ErrorResponse "参数错误"
// @Failure 500 {object} ErrorResponse "服务器内部错误"
// @Router /api/v1/auth/refresh [post]
func (h *UserHandler) RefreshToken(c *gin.Context) {
	var req RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "请求参数无效",
		})
		return
	}

	// 验证刷新令牌
	claims, err := jwt.ValidateRefreshToken(req.Token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "无效的刷新令牌",
		})
		return
	}

	// 获取用户信息
	user, err := h.userService.GetUserByID(c, claims.UserID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "用户不存在",
		})
		return
	}

	// 生成新的令牌对
	accessToken, refreshToken, err := jwt.GenerateTokenPair(user.ID, user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "生成令牌失败",
		})
		return
	}

	c.JSON(http.StatusOK, RefreshTokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	})
}

// GetProfile 获取用户信息
// @Summary 获取用户信息
// @Description 获取当前登录用户的信息
// @Tags 用户
// @Accept json
// @Produce json
// @Success 200 {object} UserProfileResponse "获取成功"
// @Failure 400 {object} ErrorResponse "参数错误"
// @Failure 500 {object} ErrorResponse "服务器内部错误"
// @Router /api/v1/user/profile [get]
func (h *UserHandler) GetProfile(c *gin.Context) {
	// 从上下文中获取用户ID（中间件已经验证并设置）
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "未授权",
		})
		return
	}

	// 获取用户信息
	user, err := h.userService.GetProfile(c, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": errors.Wrap(err, "获取用户信息失败").Error(),
		})
		return
	}

	c.JSON(http.StatusOK, UserProfileResponse{
		UserID:   user.ID,
		Username: user.Username,
		Email:    user.Email,
		Avatar:   user.Avatar,
		Role:     user.Role,
	})
}

// UpdateProfile 更新用户信息
// @Summary 更新用户信息
// @Description 更新当前登录用户的信息
// @Tags 用户
// @Accept json
// @Produce json
// @Param request body UpdateProfileRequest true "更新信息请求"
// @Success 200 {object} UpdateProfileResponse "更新成功"
// @Failure 400 {object} ErrorResponse "参数错误"
// @Failure 500 {object} ErrorResponse "服务器内部错误"
// @Router /api/v1/user/profile [put]
func (h *UserHandler) UpdateProfile(c *gin.Context) {
	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "请求参数无效",
		})
		return
	}

	// 从上下文中获取用户ID（中间件已经验证并设置）
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "未授权",
		})
		return
	}

	// 获取当前用户信息
	user, err := h.userService.GetUserByID(c, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": errors.Wrap(err, "获取用户信息失败").Error(),
		})
		return
	}

	// 更新用户信息
	user.Username = req.Username
	user.Email = req.Email
	if req.Avatar != "" {
		user.Avatar = req.Avatar
	}

	if err := h.userService.UpdateProfile(c, user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": errors.Wrap(err, "更新用户信息失败").Error(),
		})
		return
	}

	c.JSON(http.StatusOK, UpdateProfileResponse{
		UserID:   user.ID,
		Username: user.Username,
		Email:    user.Email,
		Avatar:   user.Avatar,
		Role:     user.Role,
	})
}

// RegisterRequest 注册请求
type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Code     string `json:"code" binding:"required"` // 验证码
}

// RegisterResponse 注册响应
type RegisterResponse struct {
	UserID       string `json:"user_id"`
	Username     string `json:"username"`
	Email        string `json:"email"`
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

// LoginRequest 登录请求
type LoginRequest struct {
	Login    string `json:"login" binding:"required"` // 可以是邮箱或用户名
	Password string `json:"password" binding:"required"`
}

// LoginResponse 登录响应
type LoginResponse struct {
	UserID       string `json:"user_id"`
	Username     string `json:"username"`
	Email        string `json:"email"`
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

// RefreshTokenRequest 刷新Token请求
type RefreshTokenRequest struct {
	Token string `json:"token" binding:"required"`
}

// RefreshTokenResponse 刷新Token响应
type RefreshTokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

// UserProfileResponse 用户信息响应
type UserProfileResponse struct {
	UserID   string         `json:"user_id"`
	Username string         `json:"username"`
	Email    string         `json:"email"`
	Avatar   string         `json:"avatar,omitempty"`
	Role     model.UserRole `json:"role"`
}

// UpdateProfileRequest 更新用户信息请求
type UpdateProfileRequest struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Avatar   string `json:"avatar,omitempty"`
}

// UpdateProfileResponse 更新用户信息响应
type UpdateProfileResponse struct {
	UserID   string         `json:"user_id"`
	Username string         `json:"username"`
	Email    string         `json:"email"`
	Avatar   string         `json:"avatar,omitempty"`
	Role     model.UserRole `json:"role"`
}

// ListUsersResponse 用户列表响应
type ListUsersResponse struct {
	Users []UserInfo `json:"users"`
	Total int64      `json:"total"`
	Page  int        `json:"page"`
	Size  int        `json:"size"`
}

// UpdateUserRequest 更新用户请求
type UpdateUserRequest struct {
	Username string         `json:"username" binding:"required"`
	Email    string         `json:"email" binding:"required,email"`
	Role     model.UserRole `json:"role" binding:"required,oneof=admin user"`
	Avatar   string         `json:"avatar,omitempty"`
}

// UpdateUserResponse 更新用户响应
type UpdateUserResponse struct {
	Message string `json:"message"`
}

// DeleteUserResponse 删除用户响应
type DeleteUserResponse struct {
	Message string `json:"message"`
}

// UserInfo 用户信息
type UserInfo struct {
	ID       string         `json:"id"`
	Username string         `json:"username"`
	Email    string         `json:"email"`
	Role     model.UserRole `json:"role"`
	Avatar   string         `json:"avatar,omitempty"`
}

// ListUsers 获取用户列表（管理员功能）
// @Summary 获取用户列表
// @Description 管理员获取用户列表
// @Tags 用户管理
// @Accept json
// @Produce json
// @Param page query int false "页码" default(1)
// @Param size query int false "每页数量" default(10)
// @Param keyword query string false "搜索关键词"
// @Success 200 {object} ListUsersResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/admin/users [get]
func (h *UserHandler) ListUsers(c *gin.Context) {
	// 验证是否为管理员
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "未授权",
		})
		return
	}

	isAdmin, err := h.userService.IsAdmin(c, userID.(string))
	if err != nil || !isAdmin {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "无权限访问",
		})
		return
	}

	// 获取查询参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))
	keyword := c.Query("keyword")

	// 调用服务层获取用户列表
	users, total, err := h.userService.ListUsers(c, page, size, keyword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	// 构建响应
	response := ListUsersResponse{
		Users: make([]UserInfo, len(users)),
		Total: total,
		Page:  page,
		Size:  size,
	}

	for i, user := range users {
		response.Users[i] = UserInfo{
			ID:       user.ID,
			Username: user.Username,
			Email:    user.Email,
			Role:     user.Role,
			Avatar:   user.Avatar,
		}
	}

	c.JSON(http.StatusOK, response)
}

// UpdateUser 更新用户信息（管理员功能）
// @Summary 更新用户信息
// @Description 管理员更新用户信息
// @Tags 用户管理
// @Accept json
// @Produce json
// @Param user_id path string true "用户ID"
// @Param request body UpdateUserRequest true "更新信息"
// @Success 200 {object} UpdateUserResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/admin/users/{user_id} [put]
func (h *UserHandler) UpdateUser(c *gin.Context) {
	// 验证是否为管理员
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "未授权",
		})
		return
	}

	isAdmin, err := h.userService.IsAdmin(c, userID.(string))
	if err != nil || !isAdmin {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "无权限访问",
		})
		return
	}

	// 获取请求参数
	targetUserID := c.Param("user_id")
	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "请求参数无效",
		})
		return
	}

	// 构建更新数据
	updates := map[string]interface{}{
		"username": req.Username,
		"email":    req.Email,
		"role":     req.Role,
	}
	if req.Avatar != "" {
		updates["avatar"] = req.Avatar
	}

	// 调用服务层更新用户信息
	if err := h.userService.UpdateUserByAdmin(c, targetUserID, updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, UpdateUserResponse{
		Message: "用户信息更新成功",
	})
}

// DeleteUser 删除用户（管理员功能）
// @Summary 删除用户
// @Description 管理员删除用户
// @Tags 用户管理
// @Accept json
// @Produce json
// @Param user_id path string true "用户ID"
// @Success 200 {object} DeleteUserResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/admin/users/{user_id} [delete]
func (h *UserHandler) DeleteUser(c *gin.Context) {
	// 验证是否为管理员
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "未授权",
		})
		return
	}

	isAdmin, err := h.userService.IsAdmin(c, userID.(string))
	if err != nil || !isAdmin {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "无权限访问",
		})
		return
	}

	// 获取要删除的用户ID
	targetUserID := c.Param("user_id")

	// 调用服务层删除用户
	if err := h.userService.DeleteUser(c, targetUserID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, DeleteUserResponse{
		Message: "用户删除成功",
	})
}

// CreateUser 创建用户（管理员功能）
// @Summary 创建用户
// @Description 管理员创建新用户
// @Tags 用户管理
// @Accept json
// @Produce json
// @Param request body service.CreateUserRequest true "创建用户请求"
// @Success 200 {object} UserInfo
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/admin/users [post]
func (h *UserHandler) CreateUser(c *gin.Context) {
	// 验证是否为管理员
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "未授权",
		})
		return
	}

	isAdmin, err := h.userService.IsAdmin(c, userID.(string))
	if err != nil || !isAdmin {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "无权限访问",
		})
		return
	}

	var req service.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "请求参数无效",
		})
		return
	}

	// 调用服务层创建用户
	user, err := h.userService.CreateUserByAdmin(c, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, UserInfo{
		ID:       user.ID,
		Username: user.Username,
		Email:    user.Email,
		Role:     user.Role,
		Avatar:   user.Avatar,
	})
}
