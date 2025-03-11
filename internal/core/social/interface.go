package social

import (
	"context"
	"time"
)

// TaskStatus 任务状态
type TaskStatus string

const (
	TaskStatusPending   TaskStatus = "pending"
	TaskStatusOngoing   TaskStatus = "ongoing"
	TaskStatusCompleted TaskStatus = "completed"
	TaskStatusFailed    TaskStatus = "failed"
)

// TaskManager 任务管理接口
type TaskManager interface {
	// CreateTask 创建新任务
	CreateTask(ctx context.Context, task *Task) error

	// UpdateTaskStatus 更新任务状态
	UpdateTaskStatus(ctx context.Context, taskID string, status TaskStatus) error

	// GetTaskProgress 获取任务进度
	GetTaskProgress(ctx context.Context, taskID string) (*TaskProgress, error)

	// ListUserTasks 列出用户任务
	ListUserTasks(ctx context.Context, userID string) ([]*Task, error)
}

// ContentManager 内容管理接口
type ContentManager interface {
	// UploadContent 上传任务相关内容
	UploadContent(ctx context.Context, content *TaskContent) error

	// GetContent 获取任务内容
	GetContent(ctx context.Context, contentID string) (*TaskContent, error)
}

// Task 任务信息
type Task struct {
	ID          string     `json:"id"`
	UserID      string     `json:"user_id"`
	Type        string     `json:"type"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Status      TaskStatus `json:"status"`
	CreatedAt   time.Time  `json:"created_at"`
	Deadline    time.Time  `json:"deadline"`
	Reward      float64    `json:"reward"`
}

// TaskProgress 任务进度
type TaskProgress struct {
	TaskID     string     `json:"task_id"`
	Status     TaskStatus `json:"status"`
	Progress   float64    `json:"progress"`
	UpdatedAt  time.Time  `json:"updated_at"`
	Milestones []string   `json:"milestones"`
}

// TaskContent 任务内容
type TaskContent struct {
	ID        string    `json:"id"`
	TaskID    string    `json:"task_id"`
	Type      string    `json:"type"`
	URL       string    `json:"url"`
	Metadata  string    `json:"metadata"`
	CreatedAt time.Time `json:"created_at"`
}
