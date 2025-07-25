package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"FreshBox/internal/model"
	"FreshBox/internal/service"
	"FreshBox/internal/utils/response"
)

// TaskCommentHandler 任务评论处理器
type TaskCommentHandler struct {
	taskCommentService *service.TaskCommentService
}

// NewTaskCommentHandler 创建任务评论处理器实例
func NewTaskCommentHandler(taskCommentService *service.TaskCommentService) *TaskCommentHandler {
	return &TaskCommentHandler{
		taskCommentService: taskCommentService,
	}
}

// GetSubmissionComments 获取提交的所有评论
func (h *TaskCommentHandler) GetSubmissionComments(c *gin.Context) {
	submissionID := c.Param("submissionId")
	if submissionID == "" {
		response.Error(c, http.StatusBadRequest, "提交ID不能为空", nil)
		return
	}

	// 从JWT中获取用户ID（如果用户已登录）
	userID := ""
	if userIDInterface, exists := c.Get("user_id"); exists {
		userID = userIDInterface.(string)
	}

	comments, err := h.taskCommentService.GetSubmissionComments(submissionID, userID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "获取评论失败: "+err.Error(), err)
		return
	}

	response.Success(c, comments)
}

// CreateComment 创建评论
func (h *TaskCommentHandler) CreateComment(c *gin.Context) {
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

	var req struct {
		TaskID   string  `json:"task_id" binding:"required"`
		Content  string  `json:"content" binding:"required"`
		ParentID *string `json:"parent_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "请求参数错误: "+err.Error(), err)
		return
	}

	comment := &model.TaskComment{
		TaskID:       req.TaskID,
		SubmissionID: submissionID,
		UserID:       userID.(string),
		Content:      req.Content,
		ParentID:     req.ParentID,
	}

	err := h.taskCommentService.CreateComment(comment)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "创建评论失败: "+err.Error(), err)
		return
	}

	response.Success(c, comment)
}

// GetCommentByID 根据ID获取评论
func (h *TaskCommentHandler) GetCommentByID(c *gin.Context) {
	commentID := c.Param("commentId")
	if commentID == "" {
		response.Error(c, http.StatusBadRequest, "评论ID不能为空", nil)
		return
	}

	comment, err := h.taskCommentService.GetCommentByID(commentID)
	if err != nil {
		response.Error(c, http.StatusNotFound, "评论不存在", err)
		return
	}

	response.Success(c, comment)
}

// UpdateComment 更新评论
func (h *TaskCommentHandler) UpdateComment(c *gin.Context) {
	commentID := c.Param("commentId")
	if commentID == "" {
		response.Error(c, http.StatusBadRequest, "评论ID不能为空", nil)
		return
	}

	// 从JWT中获取用户ID
	userID, exists := c.Get("user_id")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "用户未登录", nil)
		return
	}

	// 检查评论是否存在且属于当前用户
	comment, err := h.taskCommentService.GetCommentByID(commentID)
	if err != nil {
		response.Error(c, http.StatusNotFound, "评论不存在", err)
		return
	}

	if comment.UserID != userID.(string) {
		response.Error(c, http.StatusForbidden, "无权修改此评论", nil)
		return
	}

	var req struct {
		Content string `json:"content" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "请求参数错误: "+err.Error(), err)
		return
	}

	comment.Content = req.Content

	err = h.taskCommentService.UpdateComment(comment)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "更新评论失败: "+err.Error(), err)
		return
	}

	response.Success(c, comment)
}

// DeleteComment 删除评论
func (h *TaskCommentHandler) DeleteComment(c *gin.Context) {
	commentID := c.Param("commentId")
	if commentID == "" {
		response.Error(c, http.StatusBadRequest, "评论ID不能为空", nil)
		return
	}

	// 从JWT中获取用户ID
	userID, exists := c.Get("user_id")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "用户未登录", nil)
		return
	}

	// 检查评论是否存在且属于当前用户
	comment, err := h.taskCommentService.GetCommentByID(commentID)
	if err != nil {
		response.Error(c, http.StatusNotFound, "评论不存在", err)
		return
	}

	if comment.UserID != userID.(string) {
		response.Error(c, http.StatusForbidden, "无权删除此评论", nil)
		return
	}

	err = h.taskCommentService.DeleteComment(commentID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "删除评论失败: "+err.Error(), err)
		return
	}

	response.Success(c, nil)
}

// LikeComment 点赞评论
func (h *TaskCommentHandler) LikeComment(c *gin.Context) {
	commentID := c.Param("commentId")
	if commentID == "" {
		response.Error(c, http.StatusBadRequest, "评论ID不能为空", nil)
		return
	}

	updatedComment, err := h.taskCommentService.LikeComment(commentID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "点赞失败: "+err.Error(), err)
		return
	}

	response.Success(c, updatedComment)
}

// UnlikeComment 取消点赞评论
func (h *TaskCommentHandler) UnlikeComment(c *gin.Context) {
	commentID := c.Param("commentId")
	if commentID == "" {
		response.Error(c, http.StatusBadRequest, "评论ID不能为空", nil)
		return
	}

	updatedComment, err := h.taskCommentService.UnlikeComment(commentID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "取消点赞失败: "+err.Error(), err)
		return
	}

	response.Success(c, updatedComment)
}

// GetUserComments 获取用户的所有评论
func (h *TaskCommentHandler) GetUserComments(c *gin.Context) {
	// 从JWT中获取用户ID
	userID, exists := c.Get("user_id")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "用户未登录", nil)
		return
	}

	comments, err := h.taskCommentService.GetUserComments(userID.(string))
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "获取用户评论失败: "+err.Error(), err)
		return
	}

	response.Success(c, comments)
}
