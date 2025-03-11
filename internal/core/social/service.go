package social

import (
	"context"
	"time"

	"github.com/pkg/errors"
	"gorm.io/gorm"
)

// TaskService 任务服务实现
type TaskService struct {
	db *gorm.DB
}

// NewTaskService 创建任务服务
func NewTaskService(db *gorm.DB) *TaskService {
	return &TaskService{
		db: db,
	}
}

// CreateTask 创建新任务
func (s *TaskService) CreateTask(ctx context.Context, task *Task) error {
	task.Status = TaskStatusPending
	task.CreatedAt = time.Now()

	result := s.db.Create(task)
	if result.Error != nil {
		return errors.Wrap(result.Error, "创建任务失败")
	}
	return nil
}

// UpdateTaskStatus 更新任务状态
func (s *TaskService) UpdateTaskStatus(ctx context.Context, taskID string, status TaskStatus) error {
	result := s.db.Model(&Task{}).Where("id = ?", taskID).Update("status", status)
	if result.Error != nil {
		return errors.Wrap(result.Error, "更新任务状态失败")
	}
	return nil
}

// GetTaskProgress 获取任务进度
func (s *TaskService) GetTaskProgress(ctx context.Context, taskID string) (*TaskProgress, error) {
	var task Task
	if err := s.db.First(&task, "id = ?", taskID).Error; err != nil {
		return nil, errors.Wrap(err, "获取任务失败")
	}

	progress := &TaskProgress{
		TaskID:    taskID,
		Status:    task.Status,
		UpdatedAt: time.Now(),
	}

	// 根据任务类型计算进度
	switch task.Type {
	case "recipe_challenge":
		progress.Progress = s.calculateRecipeProgress(taskID)
	case "donation_drive":
		progress.Progress = s.calculateDonationProgress(taskID)
	default:
		progress.Progress = 0
	}

	return progress, nil
}

// ListUserTasks 列出用户任务
func (s *TaskService) ListUserTasks(ctx context.Context, userID string) ([]*Task, error) {
	var tasks []*Task
	if err := s.db.Find(&tasks, "user_id = ?", userID).Error; err != nil {
		return nil, errors.Wrap(err, "查询用户任务失败")
	}
	return tasks, nil
}

// calculateRecipeProgress 计算食谱挑战进度
func (s *TaskService) calculateRecipeProgress(taskID string) float64 {
	// TODO: 实现具体的进度计算逻辑
	return 0.5
}

// calculateDonationProgress 计算捐赠活动进度
func (s *TaskService) calculateDonationProgress(taskID string) float64 {
	// TODO: 实现具体的进度计算逻辑
	return 0.7
}

// ContentService 内容服务实现
type ContentService struct {
	db *gorm.DB
}

// NewContentService 创建内容服务
func NewContentService(db *gorm.DB) *ContentService {
	return &ContentService{
		db: db,
	}
}

// UploadContent 上传任务相关内容
func (s *ContentService) UploadContent(ctx context.Context, content *TaskContent) error {
	content.CreatedAt = time.Now()

	result := s.db.Create(content)
	if result.Error != nil {
		return errors.Wrap(result.Error, "上传内容失败")
	}
	return nil
}

// GetContent 获取任务内容
func (s *ContentService) GetContent(ctx context.Context, contentID string) (*TaskContent, error) {
	var content TaskContent
	if err := s.db.First(&content, "id = ?", contentID).Error; err != nil {
		return nil, errors.Wrap(err, "获取内容失败")
	}
	return &content, nil
}
