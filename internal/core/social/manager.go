package social

import (
	"context"
	"time"

	"github.com/pkg/errors"
	"gorm.io/gorm"
)

// DefaultTaskManager 默认任务管理器实现
type DefaultTaskManager struct {
	db *gorm.DB
}

// NewDefaultTaskManager 创建默认任务管理器
func NewDefaultTaskManager(db *gorm.DB) *DefaultTaskManager {
	return &DefaultTaskManager{
		db: db,
	}
}

// CreateTask 创建新任务
func (m *DefaultTaskManager) CreateTask(ctx context.Context, task *Task) error {
	if task.ID == "" {
		return errors.New("任务ID不能为空")
	}

	task.Status = TaskStatusPending
	task.CreatedAt = time.Now()

	if err := m.db.WithContext(ctx).Create(task).Error; err != nil {
		return errors.Wrap(err, "创建任务失败")
	}

	return nil
}

// UpdateTaskStatus 更新任务状态
func (m *DefaultTaskManager) UpdateTaskStatus(ctx context.Context, taskID string, status TaskStatus) error {
	result := m.db.WithContext(ctx).Model(&Task{}).
		Where("id = ?", taskID).
		Update("status", status)

	if result.Error != nil {
		return errors.Wrap(result.Error, "更新任务状态失败")
	}
	if result.RowsAffected == 0 {
		return errors.New("任务不存在")
	}

	return nil
}

// GetTaskProgress 获取任务进度
func (m *DefaultTaskManager) GetTaskProgress(ctx context.Context, taskID string) (*TaskProgress, error) {
	var progress TaskProgress
	err := m.db.WithContext(ctx).
		Where("task_id = ?", taskID).
		First(&progress).Error

	if err == gorm.ErrRecordNotFound {
		return nil, errors.New("任务进度不存在")
	}
	if err != nil {
		return nil, errors.Wrap(err, "获取任务进度失败")
	}

	return &progress, nil
}

// ListUserTasks 列出用户任务
func (m *DefaultTaskManager) ListUserTasks(ctx context.Context, userID string) ([]*Task, error) {
	var tasks []*Task
	err := m.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&tasks).Error

	if err != nil {
		return nil, errors.Wrap(err, "查询用户任务失败")
	}

	return tasks, nil
}

// DefaultContentManager 默认内容管理器实现
type DefaultContentManager struct {
	db *gorm.DB
}

// NewDefaultContentManager 创建默认内容管理器
func NewDefaultContentManager(db *gorm.DB) *DefaultContentManager {
	return &DefaultContentManager{
		db: db,
	}
}

// UploadContent 上传任务相关内容
func (m *DefaultContentManager) UploadContent(ctx context.Context, content *TaskContent) error {
	if content.ID == "" {
		return errors.New("内容ID不能为空")
	}

	content.CreatedAt = time.Now()

	if err := m.db.WithContext(ctx).Create(content).Error; err != nil {
		return errors.Wrap(err, "上传任务内容失败")
	}

	return nil
}

// GetContent 获取任务内容
func (m *DefaultContentManager) GetContent(ctx context.Context, contentID string) (*TaskContent, error) {
	var content TaskContent
	err := m.db.WithContext(ctx).
		Where("id = ?", contentID).
		First(&content).Error

	if err == gorm.ErrRecordNotFound {
		return nil, errors.New("任务内容不存在")
	}
	if err != nil {
		return nil, errors.Wrap(err, "获取任务内容失败")
	}

	return &content, nil
}
