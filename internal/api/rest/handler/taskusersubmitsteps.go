package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"FreshBox/internal/model"
	"FreshBox/internal/service"
	"FreshBox/internal/utils/response"
)

// TaskStepProgressHandler 任务步骤进度处理器
type TaskStepProgressHandler struct {
	taskStepProgressService *service.TaskStepProgressService
	userService             *service.UserService
}

// NewTaskStepProgressHandler 创建任务步骤进度处理器
func NewTaskStepProgressHandler(taskStepProgressService *service.TaskStepProgressService, userService *service.UserService) *TaskStepProgressHandler {
	return &TaskStepProgressHandler{
		taskStepProgressService: taskStepProgressService,
		userService:             userService,
	}
}

// CreateTaskStepProgress 创建任务步骤进度记录
func (h *TaskStepProgressHandler) CreateTaskStepProgress(c *gin.Context) {
	taskID := c.Param("id")
	if taskID == "" {
		response.Error(c, http.StatusBadRequest, "任务ID不能为空", nil)
		return
	}

	var req struct {
		StepID   int              `json:"step_id" binding:"required"`
		Status   model.TaskStatus `json:"status"`
		Progress float64          `json:"progress"`
		Notes    string           `json:"notes"`
		Evidence string           `json:"evidence"`
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

	progress := &model.TaskStepProgress{
		ID:       service.GenerateUniqueID(),
		TaskID:   taskID,
		StepID:   req.StepID,
		UserID:   userID.(string),
		Status:   req.Status,
		Progress: req.Progress,
		Notes:    req.Notes,
		Evidence: req.Evidence,
	}

	if err := h.taskStepProgressService.CreateTaskStepProgress(c.Request.Context(), progress); err != nil {
		if err.Error() == "任务不存在" {
			response.Error(c, http.StatusNotFound, err.Error(), err)
		} else if err.Error() == "任务步骤不存在" {
			response.Error(c, http.StatusNotFound, err.Error(), err)
		} else if err.Error() == "该步骤进度记录已存在" {
			response.Error(c, http.StatusConflict, err.Error(), err)
		} else {
			response.Error(c, http.StatusInternalServerError, "创建任务步骤进度失败", err)
		}
		return
	}

	response.Success(c, progress)
}

// GetTaskStepProgress 获取单个任务步骤进度记录
func (h *TaskStepProgressHandler) GetTaskStepProgress(c *gin.Context) {
	progressID := c.Param("progressId")
	if progressID == "" {
		response.Error(c, http.StatusBadRequest, "进度记录ID不能为空", nil)
		return
	}

	progress, err := h.taskStepProgressService.GetTaskStepProgress(c.Request.Context(), progressID)
	if err != nil {
		if err.Error() == "任务步骤进度记录不存在" {
			response.Error(c, http.StatusNotFound, err.Error(), err)
		} else {
			response.Error(c, http.StatusInternalServerError, "获取任务步骤进度失败", err)
		}
		return
	}

	response.Success(c, progress)
}

// GetUserTaskStepProgress 获取用户在特定任务步骤的进度
func (h *TaskStepProgressHandler) GetUserTaskStepProgress(c *gin.Context) {
	taskID := c.Param("id")
	if taskID == "" {
		response.Error(c, http.StatusBadRequest, "任务ID不能为空", nil)
		return
	}

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

	progress, err := h.taskStepProgressService.GetUserTaskStepProgress(c.Request.Context(), taskID, stepID, userID.(string))
	if err != nil {
		if err.Error() == "任务步骤进度记录不存在" {
			response.Error(c, http.StatusNotFound, err.Error(), err)
		} else {
			response.Error(c, http.StatusInternalServerError, "获取用户任务步骤进度失败", err)
		}
		return
	}

	response.Success(c, progress)
}

// GetUserTaskProgress 获取用户在特定任务的所有步骤进度
func (h *TaskStepProgressHandler) GetUserTaskProgress(c *gin.Context) {
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

	progressList, err := h.taskStepProgressService.GetUserTaskProgress(c.Request.Context(), taskID, userID.(string))
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "获取用户任务进度失败", err)
		return
	}

	response.Success(c, progressList)
}

// UpdateTaskStepProgress 更新任务步骤进度
func (h *TaskStepProgressHandler) UpdateTaskStepProgress(c *gin.Context) {
	progressID := c.Param("progressId")
	if progressID == "" {
		response.Error(c, http.StatusBadRequest, "进度记录ID不能为空", nil)
		return
	}

	var req struct {
		Status   *model.TaskStatus `json:"status"`
		Progress *float64          `json:"progress"`
		Notes    string            `json:"notes"`
		Evidence string            `json:"evidence"`
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
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.Progress != nil {
		updates["progress"] = *req.Progress
	}
	if req.Notes != "" {
		updates["notes"] = req.Notes
	}
	if req.Evidence != "" {
		updates["evidence"] = req.Evidence
	}

	if len(updates) == 0 {
		response.Error(c, http.StatusBadRequest, "没有可更新的字段", nil)
		return
	}

	if err := h.taskStepProgressService.UpdateTaskStepProgress(c.Request.Context(), progressID, updates, userID.(string)); err != nil {
		if err.Error() == "任务步骤进度记录不存在" {
			response.Error(c, http.StatusNotFound, err.Error(), err)
		} else if err.Error() == "无权更新此进度记录" {
			response.Error(c, http.StatusForbidden, err.Error(), nil)
		} else {
			response.Error(c, http.StatusInternalServerError, "更新任务步骤进度失败", err)
		}
		return
	}

	response.Success(c, gin.H{"progress_id": progressID})
}

// DeleteTaskStepProgress 删除任务步骤进度记录
func (h *TaskStepProgressHandler) DeleteTaskStepProgress(c *gin.Context) {
	progressID := c.Param("progressId")
	if progressID == "" {
		response.Error(c, http.StatusBadRequest, "进度记录ID不能为空", nil)
		return
	}

	// 从JWT中获取用户ID
	userID, exists := c.Get("user_id")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "用户未登录", nil)
		return
	}

	if err := h.taskStepProgressService.DeleteTaskStepProgress(c.Request.Context(), progressID, userID.(string)); err != nil {
		if err.Error() == "任务步骤进度记录不存在" {
			response.Error(c, http.StatusNotFound, err.Error(), err)
		} else if err.Error() == "无权删除此进度记录" {
			response.Error(c, http.StatusForbidden, err.Error(), nil)
		} else {
			response.Error(c, http.StatusInternalServerError, "删除任务步骤进度失败", err)
		}
		return
	}

	response.Success(c, gin.H{"progress_id": progressID})
}

// GetTaskOverallProgress 获取任务整体进度统计
func (h *TaskStepProgressHandler) GetTaskOverallProgress(c *gin.Context) {
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

	progress, err := h.taskStepProgressService.GetTaskOverallProgress(c.Request.Context(), taskID, userID.(string))
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "获取任务整体进度失败", err)
		return
	}

	response.Success(c, progress)
}

// BatchUpdateTaskStepProgress 批量更新任务步骤进度
func (h *TaskStepProgressHandler) BatchUpdateTaskStepProgress(c *gin.Context) {
	taskID := c.Param("id")
	if taskID == "" {
		response.Error(c, http.StatusBadRequest, "任务ID不能为空", nil)
		return
	}

	var req struct {
		Updates []map[string]interface{} `json:"updates" binding:"required"`
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

	if err := h.taskStepProgressService.BatchUpdateTaskStepProgress(c.Request.Context(), taskID, userID.(string), req.Updates); err != nil {
		if err.Error() == "步骤ID格式错误" {
			response.Error(c, http.StatusBadRequest, err.Error(), err)
		} else {
			response.Error(c, http.StatusInternalServerError, "批量更新任务步骤进度失败", err)
		}
		return
	}

	response.Success(c, gin.H{"task_id": taskID, "updated_count": len(req.Updates)})
}
