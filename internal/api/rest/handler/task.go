package handler

import (
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"FreshBox/internal/core/social"
	"FreshBox/internal/model"
	"FreshBox/internal/service"
	"FreshBox/internal/utils/response"
)

// TaskHandler 社交任务处理器
type TaskHandler struct {
	taskService *service.TaskService
	userService *service.UserService
}

// NewTaskHandler 创建任务处理器
func NewTaskHandler(taskService *service.TaskService, userService *service.UserService) *TaskHandler {
	return &TaskHandler{
		taskService: taskService,
		userService: userService,
	}
}

// CreateTask 创建任务
func (h *TaskHandler) CreateTask(c *gin.Context) {
	var req struct {
		Type        string    `json:"type"`
		Title       string    `json:"title" binding:"required"`
		Description string    `json:"description" binding:"required"`
		Image       string    `json:"image" binding:"required"`
		Deadline    time.Time `json:"deadline" binding:"required"`
		Reward      string    `json:"reward" binding:"required"`
		Tags        string    `json:"tags"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "参数错误", err)
		return
	}

	log.Printf("[DEBUG] CreateTask received tags: %v", req.Tags)

	// 从请求中获取用户ID（假设中间件已设置）
	userID := c.GetString("user_id")
	if userID == "" {
		userID = "mock-user-id" // 模拟数据
	}

	// 管理员校验
	isAdmin, err := h.userService.IsAdmin(c.Request.Context(), userID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "检查用户权限失败", err)
		return
	}
	if !isAdmin {
		response.Error(c, http.StatusForbidden, "只有管理员可以创建任务", nil)
		return
	}

	task := &model.Task{
		Title:       req.Title,
		Description: req.Description,
		Image:       req.Image,
		Difficulty:  model.DifficultyMedium, // 默认
		Deadline:    req.Deadline,
		Rewards:     req.Reward,
		Tags:        req.Tags,
	}

	if err := h.taskService.CreateTask(c.Request.Context(), task, userID); err != nil {
		response.Error(c, http.StatusInternalServerError, "创建任务失败", err)
		return
	}

	response.Success(c, task)
}

// GetTask 获取任务
func (h *TaskHandler) GetTask(c *gin.Context) {
	taskID := c.Param("id")

	task, err := h.taskService.GetTask(c.Request.Context(), taskID)
	if err != nil {
		response.Error(c, http.StatusNotFound, err.Error(), err)
		return
	}

	response.Success(c, task)
}

// GetTaskProgress 获取任务进度
func (h *TaskHandler) GetTaskProgress(c *gin.Context) {
	taskID := c.Param("id")

	// 模拟返回固定数据
	progress := &social.TaskProgress{
		TaskID:    taskID,
		Status:    social.TaskStatusOngoing,
		Progress:  0.65,
		UpdatedAt: time.Now(),
		Milestones: []string{
			"已购买盲盒",
			"已制作料理",
			"待上传照片",
			"待分享社区",
		},
	}

	response.Success(c, progress)
}

// UpdateTaskStatus 更新任务状态
func (h *TaskHandler) UpdateTaskStatus(c *gin.Context) {
	taskID := c.Param("id")

	var req struct {
		Status model.TaskStatus `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "参数错误", err)
		return
	}

	// 管理员校验
	userID := c.GetString("user_id")
	if userID == "" {
		response.Error(c, http.StatusUnauthorized, "未授权", nil)
		return
	}
	isAdmin, err := h.userService.IsAdmin(c.Request.Context(), userID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "检查用户权限失败", err)
		return
	}
	if !isAdmin {
		response.Error(c, http.StatusForbidden, "只有管理员可以更新任务状态", nil)
		return
	}

	if err := h.taskService.UpdateTaskStatus(c.Request.Context(), taskID, req.Status, userID); err != nil {
		if err.Error() == "任务不存在" {
			response.Error(c, http.StatusNotFound, err.Error(), err)
		} else if err.Error() == "只有管理员可以更新任务状态" {
			response.Error(c, http.StatusForbidden, err.Error(), nil)
		} else {
			response.Error(c, http.StatusInternalServerError, "更新任务状态失败", err)
		}
		return
	}

	response.Success(c, gin.H{"task_id": taskID, "status": req.Status})
}

// UpdateTask 更新任务详情
func (h *TaskHandler) UpdateTask(c *gin.Context) {
	taskID := c.Param("id")

	var req struct {
		Type        string     `json:"type"`
		Title       string     `json:"title"`
		Description string     `json:"description"`
		Image       string     `json:"image"`
		Deadline    *time.Time `json:"deadline"`
		Reward      string     `json:"reward"`
		Tags        string     `json:"tags"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "参数错误", err)
		return
	}

	log.Printf("[DEBUG] UpdateTask received tags: %v", req.Tags)

	// 管理员校验
	userID := c.GetString("user_id")
	if userID == "" {
		response.Error(c, http.StatusUnauthorized, "未授权", nil)
		return
	}

	updates := make(map[string]interface{})
	if req.Type != "" {
		updates["type"] = req.Type
	}
	if req.Title != "" {
		updates["title"] = req.Title
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.Image != "" {
		updates["image"] = req.Image
	}
	if req.Deadline != nil {
		updates["deadline"] = *req.Deadline
	}
	if req.Reward != "" {
		updates["rewards"] = req.Reward
	}
	if req.Tags != "" {
		updates["tags"] = req.Tags
	}

	if len(updates) == 0 {
		response.Error(c, http.StatusBadRequest, "没有可更新的字段", nil)
		return
	}

	if err := h.taskService.UpdateTask(c.Request.Context(), taskID, updates, userID); err != nil {
		if err.Error() == "任务不存在" {
			response.Error(c, http.StatusNotFound, err.Error(), err)
		} else if err.Error() == "只有管理员可以更新任务" {
			response.Error(c, http.StatusForbidden, err.Error(), nil)
		} else {
			response.Error(c, http.StatusInternalServerError, "更新任务失败", err)
		}
		return
	}

	response.Success(c, gin.H{"task_id": taskID})
}

// UploadTaskContent 上传任务内容
func (h *TaskHandler) UploadTaskContent(c *gin.Context) {
	taskID := c.Param("id")

	var req struct {
		Type     string `json:"type" binding:"required"`
		URL      string `json:"url" binding:"required"`
		Metadata string `json:"metadata"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "参数错误", err)
		return
	}

	content := &social.TaskContent{
		ID:        uuid.NewString(),
		TaskID:    taskID,
		Type:      req.Type,
		URL:       req.URL,
		Metadata:  req.Metadata,
		CreatedAt: time.Now(),
	}

	// 模拟上传内容
	// err := h.contentManager.UploadContent(c.Request.Context(), content)
	// if err != nil {
	//  response.Error(c, http.StatusInternalServerError, "上传任务内容失败", err)
	//  return
	// }

	response.Success(c, content)
}

// ListTasks 获取任务列表
func (h *TaskHandler) ListTasks(c *gin.Context) {
	difficulty := c.Query("difficulty")
	status := c.Query("status")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))

	tasks, _, err := h.taskService.ListTasks(c.Request.Context(), difficulty, status, page, size)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "获取任务列表失败", err)
		return
	}

	response.Success(c, tasks)
}

// GetRecommendedTasks 获取推荐任务
func (h *TaskHandler) GetRecommendedTasks(c *gin.Context) {
	tasks, err := h.taskService.GetRecommendedTasks(c.Request.Context(), 10)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "获取推荐任务失败", err)
		return
	}
	response.Success(c, tasks)
}

// GetTaskContents 获取任务内容列表
func (h *TaskHandler) GetTaskContents(c *gin.Context) {
	taskID := c.Param("id")

	// 模拟返回固定数据
	contents := []*social.TaskContent{
		{
			ID:        uuid.NewString(),
			TaskID:    taskID,
			Type:      "image",
			URL:       "https://example.com/images/task1/image1.jpg",
			Metadata:  `{"description": "料理完成图", "tags": ["创意料理", "盲盒挑战"]}`,
			CreatedAt: time.Now().Add(-12 * time.Hour),
		},
		{
			ID:        uuid.NewString(),
			TaskID:    taskID,
			Type:      "text",
			URL:       "",
			Metadata:  `{"content": "今天使用了盲盒中的牛油果、西红柿和鸡蛋，做了一份健康早餐。牛油果还剩一半，计划明天做成沙拉。", "tags": ["经验分享", "食材规划"]}`,
			CreatedAt: time.Now().Add(-24 * time.Hour),
		},
	}

	response.Success(c, contents)
}

// GetPopularTasks 获取热门任务
func (h *TaskHandler) GetPopularTasks(c *gin.Context) {
	tasks, err := h.taskService.GetPopularTasks(c.Request.Context(), 10)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "获取热门任务失败", err)
		return
	}
	response.Success(c, tasks)
}
