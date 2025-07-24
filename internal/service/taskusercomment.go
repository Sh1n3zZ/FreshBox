package service

import (
	"time"

	"gorm.io/gorm"

	"FreshBox/internal/model"
)

// TaskCommentService 任务评论服务
type TaskCommentService struct {
	db *gorm.DB
}

// NewTaskCommentService 创建任务评论服务实例
func NewTaskCommentService(db *gorm.DB) *TaskCommentService {
	return &TaskCommentService{db: db}
}

// GetSubmissionComments 获取提交的所有评论
func (s *TaskCommentService) GetSubmissionComments(submissionID string) ([]model.TaskCommentDTO, error) {
	var comments []model.TaskComment
	var dtos []model.TaskCommentDTO

	// 获取顶级评论（没有父评论的）
	err := s.db.Preload("User").Preload("Replies.User").
		Where("submission_id = ? AND parent_id IS NULL", submissionID).
		Order("created_at DESC").
		Find(&comments).Error
	if err != nil {
		return nil, err
	}

	for _, comment := range comments {
		dto := s.convertToDTO(comment)
		dtos = append(dtos, dto)
	}

	return dtos, nil
}

// CreateComment 创建评论
func (s *TaskCommentService) CreateComment(comment *model.TaskComment) error {
	comment.ID = GenerateUniqueID()
	comment.CreatedAt = time.Now()
	comment.UpdatedAt = time.Now()
	comment.Likes = 0

	return s.db.Create(comment).Error
}

// GetCommentByID 根据ID获取评论
func (s *TaskCommentService) GetCommentByID(id string) (*model.TaskComment, error) {
	var comment model.TaskComment
	err := s.db.Preload("User").Preload("Replies.User").Where("id = ?", id).First(&comment).Error
	if err != nil {
		return nil, err
	}
	return &comment, nil
}

// UpdateComment 更新评论
func (s *TaskCommentService) UpdateComment(comment *model.TaskComment) error {
	comment.UpdatedAt = time.Now()
	return s.db.Save(comment).Error
}

// DeleteComment 删除评论
func (s *TaskCommentService) DeleteComment(id string) error {
	// 先删除所有回复
	if err := s.db.Where("parent_id = ?", id).Delete(&model.TaskComment{}).Error; err != nil {
		return err
	}
	// 再删除主评论
	return s.db.Where("id = ?", id).Delete(&model.TaskComment{}).Error
}

// LikeComment 点赞评论
func (s *TaskCommentService) LikeComment(id string) error {
	return s.db.Model(&model.TaskComment{}).Where("id = ?", id).UpdateColumn("likes", gorm.Expr("likes + ?", 1)).Error
}

// UnlikeComment 取消点赞评论
func (s *TaskCommentService) UnlikeComment(id string) error {
	return s.db.Model(&model.TaskComment{}).Where("id = ?", id).UpdateColumn("likes", gorm.Expr("GREATEST(likes - ?, 0)", 1)).Error
}

// GetUserComments 获取用户的所有评论
func (s *TaskCommentService) GetUserComments(userID string) ([]model.TaskCommentDTO, error) {
	var comments []model.TaskComment
	var dtos []model.TaskCommentDTO

	err := s.db.Preload("User").Preload("Task").Preload("Submission").
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&comments).Error
	if err != nil {
		return nil, err
	}

	for _, comment := range comments {
		dto := s.convertToDTO(comment)
		dtos = append(dtos, dto)
	}

	return dtos, nil
}

// convertToDTO 将评论转换为DTO
func (s *TaskCommentService) convertToDTO(comment model.TaskComment) model.TaskCommentDTO {
	dto := model.TaskCommentDTO{
		ID:           comment.ID,
		TaskID:       comment.TaskID,
		SubmissionID: comment.SubmissionID,
		UserID:       comment.UserID,
		Username:     comment.User.Username,
		Avatar:       comment.User.Avatar,
		Content:      comment.Content,
		ParentID:     comment.ParentID,
		Likes:        comment.Likes,
		ReplyCount:   len(comment.Replies),
		CreatedAt:    comment.CreatedAt.Format("2006-01-02 15:04:05"),
	}

	// 转换回复
	if len(comment.Replies) > 0 {
		var replyDTOs []model.TaskCommentDTO
		for _, reply := range comment.Replies {
			replyDTO := model.TaskCommentDTO{
				ID:           reply.ID,
				TaskID:       reply.TaskID,
				SubmissionID: reply.SubmissionID,
				UserID:       reply.UserID,
				Username:     reply.User.Username,
				Avatar:       reply.User.Avatar,
				Content:      reply.Content,
				ParentID:     reply.ParentID,
				Likes:        reply.Likes,
				ReplyCount:   0, // 回复的回复暂时不计算
				CreatedAt:    reply.CreatedAt.Format("2006-01-02 15:04:05"),
			}
			replyDTOs = append(replyDTOs, replyDTO)
		}
		dto.Replies = replyDTOs
	}

	return dto
}
