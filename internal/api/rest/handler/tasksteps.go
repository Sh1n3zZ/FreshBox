package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"FreshBox/internal/model"
	"FreshBox/internal/service"
	"FreshBox/internal/utils/response"
)

// TaskStepHandler 任务步骤处理器
type TaskStepHandler struct {
	taskStepService *service.TaskStepService
	userService     *service.UserService
}

// NewTaskStepHandler 创建任务步骤处理器
func NewTaskStepHandler(taskStepService *service.TaskStepService, userService *service.UserService) *TaskStepHandler {
	return &TaskStepHandler{
		taskStepService: taskStepService,
		userService:     userService,
	}
}

// CreateTaskStep 创建任务步骤
func (h *TaskStepHandler) CreateTaskStep(c *gin.Context) {
	taskID := c.Param("id")
	if taskID == "" {
		response.Error(c, http.StatusBadRequest, "任务ID不能为空", nil)
		return
	}

	var req struct {
		Title       string             `json:"title" binding:"required"`
		Description string             `json:"description"`
		Type        model.TaskStepType `json:"type" binding:"required"`
		Order       int                `json:"order"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "参数错误", err)
		return
	}

	// 从JWT中获取用户ID
	userID, exists := c.Get("user_id")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "用户未登录", nil)
		return
	}

	step := &model.TaskStep{
		TaskID:      taskID,
		Title:       req.Title,
		Description: req.Description,
		Type:        req.Type,
		Order:       req.Order,
	}

	if err := h.taskStepService.CreateTaskStep(c.Request.Context(), step, userID.(string)); err != nil {
		if err.Error() == "只有管理员可以创建任务步骤" {
			response.Error(c, http.StatusForbidden, err.Error(), nil)
		} else if err.Error() == "任务不存在" {
			response.Error(c, http.StatusNotFound, err.Error(), err)
		} else {
			response.Error(c, http.StatusInternalServerError, "创建任务步骤失败", err)
		}
		return
	}

	response.Success(c, step)
}

// GetTaskStep 获取单个任务步骤
func (h *TaskStepHandler) GetTaskStep(c *gin.Context) {
	stepIDStr := c.Param("stepId")
	if stepIDStr == "" {
		response.Error(c, http.StatusBadRequest, "步骤ID不能为空", nil)
		return
	}

	stepID, err := strconv.Atoi(stepIDStr)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "步骤ID格式错误", err)
		return
	}

	step, err := h.taskStepService.GetTaskStep(c.Request.Context(), stepID)
	if err != nil {
		if err.Error() == "任务步骤不存在" {
			response.Error(c, http.StatusNotFound, err.Error(), err)
		} else {
			response.Error(c, http.StatusInternalServerError, "获取任务步骤失败", err)
		}
		return
	}

	response.Success(c, step)
}

// GetTaskSteps 获取任务的所有步骤
func (h *TaskStepHandler) GetTaskSteps(c *gin.Context) {
	taskID := c.Param("id")
	if taskID == "" {
		response.Error(c, http.StatusBadRequest, "任务ID不能为空", nil)
		return
	}

	steps, err := h.taskStepService.GetTaskSteps(c.Request.Context(), taskID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "获取任务步骤失败", err)
		return
	}

	response.Success(c, steps)
}

// UpdateTaskStep 更新任务步骤
func (h *TaskStepHandler) UpdateTaskStep(c *gin.Context) {
	stepIDStr := c.Param("stepId")
	if stepIDStr == "" {
		response.Error(c, http.StatusBadRequest, "步骤ID不能为空", nil)
		return
	}

	stepID, err := strconv.Atoi(stepIDStr)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "步骤ID格式错误", err)
		return
	}

	var req struct {
		Title       string             `json:"title"`
		Description string             `json:"description"`
		Type        model.TaskStepType `json:"type"`
		Order       int                `json:"order"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "参数错误", err)
		return
	}

	// 从JWT中获取用户ID
	userID, exists := c.Get("user_id")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "用户未登录", nil)
		return
	}

	updates := make(map[string]interface{})
	if req.Title != "" {
		updates["title"] = req.Title
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.Type != "" {
		updates["type"] = req.Type
	}
	if req.Order > 0 {
		updates["order"] = req.Order
	}

	if len(updates) == 0 {
		response.Error(c, http.StatusBadRequest, "没有可更新的字段", nil)
		return
	}

	if err := h.taskStepService.UpdateTaskStep(c.Request.Context(), stepID, updates, userID.(string)); err != nil {
		if err.Error() == "只有管理员可以更新任务步骤" {
			response.Error(c, http.StatusForbidden, err.Error(), nil)
		} else if err.Error() == "任务步骤不存在" {
			response.Error(c, http.StatusNotFound, err.Error(), err)
		} else {
			response.Error(c, http.StatusInternalServerError, "更新任务步骤失败", err)
		}
		return
	}

	response.Success(c, gin.H{"step_id": stepID})
}

// DeleteTaskStep 删除任务步骤
func (h *TaskStepHandler) DeleteTaskStep(c *gin.Context) {
	stepIDStr := c.Param("stepId")
	if stepIDStr == "" {
		response.Error(c, http.StatusBadRequest, "步骤ID不能为空", nil)
		return
	}

	stepID, err := strconv.Atoi(stepIDStr)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "步骤ID格式错误", err)
		return
	}

	// 从JWT中获取用户ID
	userID, exists := c.Get("user_id")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "用户未登录", nil)
		return
	}

	if err := h.taskStepService.DeleteTaskStep(c.Request.Context(), stepID, userID.(string)); err != nil {
		if err.Error() == "只有管理员可以删除任务步骤" {
			response.Error(c, http.StatusForbidden, err.Error(), nil)
		} else if err.Error() == "任务步骤不存在" {
			response.Error(c, http.StatusNotFound, err.Error(), err)
		} else {
			response.Error(c, http.StatusInternalServerError, "删除任务步骤失败", err)
		}
		return
	}

	response.Success(c, gin.H{"step_id": stepID})
}

// ReorderTaskSteps 重新排序任务步骤
func (h *TaskStepHandler) ReorderTaskSteps(c *gin.Context) {
	taskID := c.Param("id")
	if taskID == "" {
		response.Error(c, http.StatusBadRequest, "任务ID不能为空", nil)
		return
	}

	var req struct {
		StepOrders map[int]int `json:"step_orders" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "参数错误", err)
		return
	}

	// 从JWT中获取用户ID
	userID, exists := c.Get("user_id")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "用户未登录", nil)
		return
	}

	if err := h.taskStepService.ReorderTaskSteps(c.Request.Context(), taskID, req.StepOrders, userID.(string)); err != nil {
		if err.Error() == "只有管理员可以重新排序任务步骤" {
			response.Error(c, http.StatusForbidden, err.Error(), nil)
		} else {
			response.Error(c, http.StatusInternalServerError, "重新排序任务步骤失败", err)
		}
		return
	}

	response.Success(c, gin.H{"task_id": taskID})
}

// UpdateTaskStepStatus 更新任务步骤状态
func (h *TaskStepHandler) UpdateTaskStepStatus(c *gin.Context) {
	stepIDStr := c.Param("stepId")
	if stepIDStr == "" {
		response.Error(c, http.StatusBadRequest, "步骤ID不能为空", nil)
		return
	}

	stepID, err := strconv.Atoi(stepIDStr)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "步骤ID格式错误", err)
		return
	}

	var req struct {
		Status model.TaskStatus `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "参数错误", err)
		return
	}

	// 从JWT中获取用户ID
	userID, exists := c.Get("user_id")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "用户未登录", nil)
		return
	}

	if err := h.taskStepService.UpdateTaskStepStatus(c.Request.Context(), stepID, req.Status, userID.(string)); err != nil {
		if err.Error() == "任务步骤不存在" {
			response.Error(c, http.StatusNotFound, err.Error(), err)
		} else if err.Error() == "无权更新此步骤状态" {
			response.Error(c, http.StatusForbidden, err.Error(), nil)
		} else {
			response.Error(c, http.StatusInternalServerError, "更新任务步骤状态失败", err)
		}
		return
	}

	response.Success(c, gin.H{"step_id": stepID, "status": req.Status})
}

// GetTaskStepProgress 获取任务步骤进度
func (h *TaskStepHandler) GetTaskStepProgress(c *gin.Context) {
	taskID := c.Param("id")
	if taskID == "" {
		response.Error(c, http.StatusBadRequest, "任务ID不能为空", nil)
		return
	}

	progress, err := h.taskStepService.GetTaskStepProgress(c.Request.Context(), taskID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "获取任务步骤进度失败", err)
		return
	}

	response.Success(c, progress)
}
