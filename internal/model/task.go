package model

import (
	"time"
)

// TaskDifficulty 任务难度类型
type TaskDifficulty string

const (
	DifficultyEasy   TaskDifficulty = "easy"
	DifficultyMedium TaskDifficulty = "medium"
	DifficultyHard   TaskDifficulty = "hard"
)

// TaskStatus 任务状态类型
type TaskStatus string

const (
	TaskStatusNotStarted TaskStatus = "not_started"
	TaskStatusInProgress TaskStatus = "in_progress"
	TaskStatusCompleted  TaskStatus = "completed"
)

// TaskStepType 任务步骤类型
type TaskStepType string

const (
	TaskStepTypePurchase TaskStepType = "purchase"
	TaskStepTypeCreate   TaskStepType = "create"
	TaskStepTypeSubmit   TaskStepType = "submit"
	TaskStepTypeOther    TaskStepType = "other"
)

// TaskInfo 任务简要信息
type TaskInfo struct {
	ID    string `json:"id" gorm:"primarykey;type:varchar(36)"`
	Title string `json:"title" gorm:"size:255;not null"`
	Image string `json:"image" gorm:"size:255"`
}

// TaskStep 挑战步骤
type TaskStep struct {
	ID          int          `json:"id" gorm:"primarykey;autoIncrement"`
	TaskID      string       `json:"task_id" gorm:"type:varchar(36);index;not null"`
	Title       string       `json:"title" gorm:"size:255;not null"`
	Description string       `json:"description" gorm:"type:text"`
	Type        TaskStepType `json:"type" gorm:"type:varchar(20);not null"`
	Status      *TaskStatus  `json:"status" gorm:"type:varchar(20)"`
	Order       int          `json:"order" gorm:"not null;default:0"`
	CreatedAt   time.Time    `json:"created_at" gorm:"type:datetime"`
	UpdatedAt   time.Time    `json:"updated_at" gorm:"type:datetime"`
}

// Task 挑战详情
type Task struct {
	ID           string         `json:"id" gorm:"primarykey;type:varchar(36)"`
	Title        string         `json:"title" gorm:"size:255;not null"`
	Description  string         `json:"description" gorm:"type:text"`
	Difficulty   TaskDifficulty `json:"difficulty" gorm:"type:varchar(20);not null"`
	Participants int            `json:"participants" gorm:"default:0"`
	Deadline     time.Time      `json:"deadline" gorm:"type:datetime;not null"`
	Tags         string         `json:"tags" gorm:"type:text"` // JSON array stored as string
	Image        string         `json:"image" gorm:"size:255"`
	Rewards      string         `json:"rewards" gorm:"size:255"`
	Status       *TaskStatus    `json:"status" gorm:"type:varchar(20)"`
	CreatorID    string         `json:"creator_id" gorm:"type:varchar(36);index"`
	Creator      User           `json:"creator" gorm:"foreignKey:CreatorID"`
	Steps        []TaskStep     `json:"steps" gorm:"foreignKey:TaskID"`
	CreatedAt    time.Time      `json:"created_at" gorm:"type:datetime"`
	UpdatedAt    time.Time      `json:"updated_at" gorm:"type:datetime"`
}

// TaskSubmission 挑战结果
type TaskSubmission struct {
	ID          string    `json:"id" gorm:"primarykey;type:varchar(36)"`
	TaskID      string    `json:"task_id" gorm:"type:varchar(36);index;not null"`
	Task        Task      `json:"task" gorm:"foreignKey:TaskID"`
	UserID      string    `json:"user_id" gorm:"type:varchar(36);index;not null"`
	User        User      `json:"user" gorm:"foreignKey:UserID"`
	Title       string    `json:"title" gorm:"size:255;not null"`
	Description string    `json:"description" gorm:"type:text"`
	Images      string    `json:"images" gorm:"type:text"` // JSON array stored as string
	Likes       int       `json:"likes" gorm:"default:0"`
	Comments    int       `json:"comments" gorm:"default:0"`
	CreatedAt   time.Time `json:"created_at" gorm:"type:datetime"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"type:datetime"`
}

// TaskSubmissionDTO 挑战结果数据传输对象
type TaskSubmissionDTO struct {
	ID          string `json:"id"`
	TaskID      string `json:"task_id"`
	UserID      string `json:"user_id"`
	Username    string `json:"username"`
	Avatar      string `json:"avatar"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Images      string `json:"images"` // JSON array as string
	Likes       int    `json:"likes"`
	Comments    int    `json:"comments"`
	CreatedAt   string `json:"created_at"`
}

// TaskDetailDTO 挑战详情数据传输对象
type TaskDetailDTO struct {
	ID           string         `json:"id"`
	Title        string         `json:"title"`
	Description  string         `json:"description"`
	Difficulty   TaskDifficulty `json:"difficulty"`
	Participants int            `json:"participants"`
	Deadline     string         `json:"deadline"`
	Tags         string         `json:"tags"` // JSON array as string
	Image        string         `json:"image"`
	Rewards      string         `json:"rewards"`
	Status       *TaskStatus    `json:"status"`
	Steps        []TaskStep     `json:"steps"`
	CreatedAt    string         `json:"created_at"`
}

// TaskComment 任务评论
type TaskComment struct {
	ID           string         `json:"id" gorm:"primarykey;type:varchar(36)"`
	TaskID       string         `json:"task_id" gorm:"type:varchar(36);index;not null"`
	Task         Task           `json:"task" gorm:"foreignKey:TaskID"`
	SubmissionID string         `json:"submission_id" gorm:"type:varchar(36);index;not null"`
	Submission   TaskSubmission `json:"submission" gorm:"foreignKey:SubmissionID"`
	UserID       string         `json:"user_id" gorm:"type:varchar(36);index;not null"`
	User         User           `json:"user" gorm:"foreignKey:UserID"`
	Content      string         `json:"content" gorm:"type:text;not null"`
	ParentID     *string        `json:"parent_id" gorm:"type:varchar(36);index"` // 父评论ID，用于回复功能
	Parent       *TaskComment   `json:"parent" gorm:"foreignKey:ParentID"`
	Replies      []TaskComment  `json:"replies" gorm:"foreignKey:ParentID"`
	Likes        int            `json:"likes" gorm:"default:0"`
	CreatedAt    time.Time      `json:"created_at" gorm:"type:datetime"`
	UpdatedAt    time.Time      `json:"updated_at" gorm:"type:datetime"`
}

// TaskCommentDTO 任务评论数据传输对象
type TaskCommentDTO struct {
	ID           string           `json:"id"`
	TaskID       string           `json:"task_id"`
	SubmissionID string           `json:"submission_id"`
	UserID       string           `json:"user_id"`
	Username     string           `json:"username"`
	Avatar       string           `json:"avatar"`
	Content      string           `json:"content"`
	ParentID     *string          `json:"parent_id"`
	Likes        int              `json:"likes"`
	ReplyCount   int              `json:"reply_count"`
	CreatedAt    string           `json:"created_at"`
	Replies      []TaskCommentDTO `json:"replies,omitempty"`
}
