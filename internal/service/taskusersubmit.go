package service

import (
	"encoding/json"
	"time"

	"gorm.io/gorm"

	"FreshBox/internal/model"
)

// TaskSubmissionService 任务提交服务
type TaskSubmissionService struct {
	db *gorm.DB
}

// NewTaskSubmissionService 创建任务提交服务实例
func NewTaskSubmissionService(db *gorm.DB) *TaskSubmissionService {
	return &TaskSubmissionService{db: db}
}

// GetTaskSubmissions 获取任务的所有提交
func (s *TaskSubmissionService) GetTaskSubmissions(taskID string) ([]model.TaskSubmissionDTO, error) {
	var submissions []model.TaskSubmission
	var dtos []model.TaskSubmissionDTO

	err := s.db.Preload("User").Where("task_id = ?", taskID).Order("created_at DESC").Find(&submissions).Error
	if err != nil {
		return nil, err
	}

	for _, submission := range submissions {
		dto := model.TaskSubmissionDTO{
			ID:          submission.ID,
			TaskID:      submission.TaskID,
			UserID:      submission.UserID,
			Username:    submission.User.Username,
			Avatar:      submission.User.Avatar,
			Title:       submission.Title,
			Description: submission.Description,
			Images:      submission.Images,
			Likes:       submission.Likes,
			Comments:    submission.Comments,
			CreatedAt:   submission.CreatedAt.Format("2006-01-02"),
		}
		dtos = append(dtos, dto)
	}

	return dtos, nil
}

// CreateTaskSubmission 创建任务提交
func (s *TaskSubmissionService) CreateTaskSubmission(submission *model.TaskSubmission) error {
	submission.ID = GenerateUniqueID()
	submission.CreatedAt = time.Now()
	submission.UpdatedAt = time.Now()
	submission.Likes = 0
	submission.Comments = 0

	return s.db.Create(submission).Error
}

// GetTaskSubmissionByID 根据ID获取任务提交
func (s *TaskSubmissionService) GetTaskSubmissionByID(id string) (*model.TaskSubmission, error) {
	var submission model.TaskSubmission
	err := s.db.Preload("User").Preload("Task").Where("id = ?", id).First(&submission).Error
	if err != nil {
		return nil, err
	}
	return &submission, nil
}

// UpdateTaskSubmission 更新任务提交
func (s *TaskSubmissionService) UpdateTaskSubmission(submission *model.TaskSubmission) error {
	submission.UpdatedAt = time.Now()
	return s.db.Save(submission).Error
}

// DeleteTaskSubmission 删除任务提交
func (s *TaskSubmissionService) DeleteTaskSubmission(id string) error {
	return s.db.Where("id = ?", id).Delete(&model.TaskSubmission{}).Error
}

// LikeTaskSubmission 点赞任务提交
func (s *TaskSubmissionService) LikeTaskSubmission(id string) error {
	return s.db.Model(&model.TaskSubmission{}).Where("id = ?", id).UpdateColumn("likes", gorm.Expr("likes + ?", 1)).Error
}

// UnlikeTaskSubmission 取消点赞任务提交
func (s *TaskSubmissionService) UnlikeTaskSubmission(id string) error {
	return s.db.Model(&model.TaskSubmission{}).Where("id = ?", id).UpdateColumn("likes", gorm.Expr("GREATEST(likes - ?, 0)", 1)).Error
}

// GetUserTaskSubmissions 获取用户的任务提交
func (s *TaskSubmissionService) GetUserTaskSubmissions(userID string) ([]model.TaskSubmissionDTO, error) {
	var submissions []model.TaskSubmission
	var dtos []model.TaskSubmissionDTO

	err := s.db.Preload("User").Preload("Task").Where("user_id = ?", userID).Order("created_at DESC").Find(&submissions).Error
	if err != nil {
		return nil, err
	}

	for _, submission := range submissions {
		dto := model.TaskSubmissionDTO{
			ID:          submission.ID,
			TaskID:      submission.TaskID,
			UserID:      submission.UserID,
			Username:    submission.User.Username,
			Avatar:      submission.User.Avatar,
			Title:       submission.Title,
			Description: submission.Description,
			Images:      submission.Images,
			Likes:       submission.Likes,
			Comments:    submission.Comments,
			CreatedAt:   submission.CreatedAt.Format("2006-01-02"),
		}
		dtos = append(dtos, dto)
	}

	return dtos, nil
}

// ConvertImagesToJSON 将图片数组转换为JSON字符串
func ConvertImagesToJSON(images []string) (string, error) {
	jsonData, err := json.Marshal(images)
	if err != nil {
		return "", err
	}
	return string(jsonData), nil
}

// ConvertJSONToImages 将JSON字符串转换为图片数组
func ConvertJSONToImages(jsonStr string) ([]string, error) {
	var images []string
	err := json.Unmarshal([]byte(jsonStr), &images)
	if err != nil {
		return nil, err
	}
	return images, nil
}
