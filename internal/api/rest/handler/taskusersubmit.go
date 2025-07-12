package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"FreshBox/internal/model"
	"FreshBox/internal/service"
	"FreshBox/internal/utils/response"
)

// TaskSubmissionHandler 任务提交处理器
type TaskSubmissionHandler struct {
	taskSubmissionService *service.TaskSubmissionService
}

// NewTaskSubmissionHandler 创建任务提交处理器实例
func NewTaskSubmissionHandler(taskSubmissionService *service.TaskSubmissionService) *TaskSubmissionHandler {
	return &TaskSubmissionHandler{
		taskSubmissionService: taskSubmissionService,
	}
}

// GetTaskSubmissions 获取任务的所有提交
func (h *TaskSubmissionHandler) GetTaskSubmissions(c *gin.Context) {
	taskID := c.Param("id")
	if taskID == "" {
		response.Error(c, http.StatusBadRequest, "任务ID不能为空", nil)
		return
	}

	submissions, err := h.taskSubmissionService.GetTaskSubmissions(taskID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "获取任务提交失败: "+err.Error(), err)
		return
	}

	response.Success(c, submissions)
}

// CreateTaskSubmission 创建任务提交
func (h *TaskSubmissionHandler) CreateTaskSubmission(c *gin.Context) {
	taskID := c.Param("id")
	if taskID == "" {
		response.Error(c, http.StatusBadRequest, "任务ID不能为空", nil)
		return
	}

	// 从JWT中获取用户ID
	userID, exists := c.Get("user_id")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "用户未登录", nil)
		return
	}

	var req struct {
		Title       string   `json:"title" binding:"required"`
		Description string   `json:"description" binding:"required"`
		Images      []string `json:"images" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "请求参数错误: "+err.Error(), err)
		return
	}

	// 将图片数组转换为JSON字符串
	imagesJSON, err := service.ConvertImagesToJSON(req.Images)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "图片数据转换失败", err)
		return
	}

	submission := &model.TaskSubmission{
		TaskID:      taskID,
		UserID:      userID.(string),
		Title:       req.Title,
		Description: req.Description,
		Images:      imagesJSON,
	}

	err = h.taskSubmissionService.CreateTaskSubmission(submission)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "创建任务提交失败: "+err.Error(), err)
		return
	}

	response.Success(c, submission)
}

// GetTaskSubmissionByID 根据ID获取任务提交
func (h *TaskSubmissionHandler) GetTaskSubmissionByID(c *gin.Context) {
	submissionID := c.Param("submissionId")
	if submissionID == "" {
		response.Error(c, http.StatusBadRequest, "提交ID不能为空", nil)
		return
	}

	submission, err := h.taskSubmissionService.GetTaskSubmissionByID(submissionID)
	if err != nil {
		response.Error(c, http.StatusNotFound, "任务提交不存在", err)
		return
	}

	response.Success(c, submission)
}

// UpdateTaskSubmission 更新任务提交
func (h *TaskSubmissionHandler) UpdateTaskSubmission(c *gin.Context) {
	submissionID := c.Param("submissionId")
	if submissionID == "" {
		response.Error(c, http.StatusBadRequest, "提交ID不能为空", nil)
		return
	}

	// 从JWT中获取用户ID
	userID, exists := c.Get("user_id")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "用户未登录", nil)
		return
	}

	// 检查提交是否存在且属于当前用户
	submission, err := h.taskSubmissionService.GetTaskSubmissionByID(submissionID)
	if err != nil {
		response.Error(c, http.StatusNotFound, "任务提交不存在", err)
		return
	}

	if submission.UserID != userID.(string) {
		response.Error(c, http.StatusForbidden, "无权修改此提交", nil)
		return
	}

	var req struct {
		Title       string   `json:"title" binding:"required"`
		Description string   `json:"description" binding:"required"`
		Images      []string `json:"images" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "请求参数错误: "+err.Error(), err)
		return
	}

	// 将图片数组转换为JSON字符串
	imagesJSON, err := service.ConvertImagesToJSON(req.Images)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "图片数据转换失败", err)
		return
	}

	submission.Title = req.Title
	submission.Description = req.Description
	submission.Images = imagesJSON

	err = h.taskSubmissionService.UpdateTaskSubmission(submission)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "更新任务提交失败: "+err.Error(), err)
		return
	}

	response.Success(c, submission)
}

// DeleteTaskSubmission 删除任务提交
func (h *TaskSubmissionHandler) DeleteTaskSubmission(c *gin.Context) {
	submissionID := c.Param("submissionId")
	if submissionID == "" {
		response.Error(c, http.StatusBadRequest, "提交ID不能为空", nil)
		return
	}

	// 从JWT中获取用户ID
	userID, exists := c.Get("user_id")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "用户未登录", nil)
		return
	}

	// 检查提交是否存在且属于当前用户
	submission, err := h.taskSubmissionService.GetTaskSubmissionByID(submissionID)
	if err != nil {
		response.Error(c, http.StatusNotFound, "任务提交不存在", err)
		return
	}

	if submission.UserID != userID.(string) {
		response.Error(c, http.StatusForbidden, "无权删除此提交", nil)
		return
	}

	err = h.taskSubmissionService.DeleteTaskSubmission(submissionID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "删除任务提交失败: "+err.Error(), err)
		return
	}

	response.Success(c, nil)
}

// LikeTaskSubmission 点赞任务提交
func (h *TaskSubmissionHandler) LikeTaskSubmission(c *gin.Context) {
	submissionID := c.Param("submissionId")
	if submissionID == "" {
		response.Error(c, http.StatusBadRequest, "提交ID不能为空", nil)
		return
	}

	err := h.taskSubmissionService.LikeTaskSubmission(submissionID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "点赞失败: "+err.Error(), err)
		return
	}

	response.Success(c, nil)
}

// UnlikeTaskSubmission 取消点赞任务提交
func (h *TaskSubmissionHandler) UnlikeTaskSubmission(c *gin.Context) {
	submissionID := c.Param("submissionId")
	if submissionID == "" {
		response.Error(c, http.StatusBadRequest, "提交ID不能为空", nil)
		return
	}

	err := h.taskSubmissionService.UnlikeTaskSubmission(submissionID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "取消点赞失败: "+err.Error(), err)
		return
	}

	response.Success(c, nil)
}

// GetUserTaskSubmissions 获取用户的任务提交
func (h *TaskSubmissionHandler) GetUserTaskSubmissions(c *gin.Context) {
	// 从JWT中获取用户ID
	userID, exists := c.Get("user_id")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "用户未登录", nil)
		return
	}

	submissions, err := h.taskSubmissionService.GetUserTaskSubmissions(userID.(string))
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "获取用户任务提交失败: "+err.Error(), err)
		return
	}

	response.Success(c, submissions)
}
