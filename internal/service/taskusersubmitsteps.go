package service

import (
	"context"
	"time"

	"github.com/pkg/errors"
	"gorm.io/gorm"

	"FreshBox/internal/model"
)

// TaskStepProgressService 任务步骤进度服务
type TaskStepProgressService struct {
	db          *gorm.DB
	userService *UserService
}

// NewTaskStepProgressService 创建任务步骤进度服务实例
func NewTaskStepProgressService(db *gorm.DB, userService *UserService) *TaskStepProgressService {
	return &TaskStepProgressService{
		db:          db,
		userService: userService,
	}
}

// CreateTaskStepProgress 创建任务步骤进度记录
func (s *TaskStepProgressService) CreateTaskStepProgress(ctx context.Context, progress *model.TaskStepProgress) error {
	// 验证任务是否存在
	var task model.Task
	if err := s.db.WithContext(ctx).Where("id = ?", progress.TaskID).First(&task).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return errors.New("任务不存在")
		}
		return errors.Wrap(err, "验证任务失败")
	}

	// 验证步骤是否存在
	var step model.TaskStep
	if err := s.db.WithContext(ctx).Where("id = ? AND task_id = ?", progress.StepID, progress.TaskID).First(&step).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return errors.New("任务步骤不存在")
		}
		return errors.Wrap(err, "验证任务步骤失败")
	}

	// 检查是否已存在该用户的步骤进度记录
	var existingProgress model.TaskStepProgress
	if err := s.db.WithContext(ctx).Where("task_id = ? AND step_id = ? AND user_id = ?",
		progress.TaskID, progress.StepID, progress.UserID).First(&existingProgress).Error; err == nil {
		return errors.New("该步骤进度记录已存在")
	}

	// 设置创建和更新时间
	progress.CreatedAt = time.Now()
	progress.UpdatedAt = time.Now()

	// 设置默认状态
	if progress.Status == "" {
		progress.Status = model.TaskStatusNotStarted
	}

	// 设置开始时间
	if progress.Status == model.TaskStatusInProgress && progress.StartedAt == nil {
		now := time.Now()
		progress.StartedAt = &now
	}

	if err := s.db.WithContext(ctx).Create(progress).Error; err != nil {
		return errors.Wrap(err, "创建任务步骤进度失败")
	}
	return nil
}

// GetTaskStepProgress 根据ID获取任务步骤进度
func (s *TaskStepProgressService) GetTaskStepProgress(ctx context.Context, progressID string) (*model.TaskStepProgress, error) {
	var progress model.TaskStepProgress
	if err := s.db.WithContext(ctx).Preload("Task").Preload("Step").Preload("User").
		Where("id = ?", progressID).First(&progress).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.New("任务步骤进度记录不存在")
		}
		return nil, errors.Wrap(err, "获取任务步骤进度失败")
	}
	return &progress, nil
}

// GetUserTaskStepProgress 获取用户在特定任务步骤的进度
func (s *TaskStepProgressService) GetUserTaskStepProgress(ctx context.Context, taskID string, stepID int, userID string) (*model.TaskStepProgress, error) {
	var progress model.TaskStepProgress
	if err := s.db.WithContext(ctx).Preload("Task").Preload("Step").Preload("User").
		Where("task_id = ? AND step_id = ? AND user_id = ?", taskID, stepID, userID).First(&progress).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.New("任务步骤进度记录不存在")
		}
		return nil, errors.Wrap(err, "获取任务步骤进度失败")
	}
	return &progress, nil
}

// GetUserTaskProgress 获取用户在特定任务的所有步骤进度
func (s *TaskStepProgressService) GetUserTaskProgress(ctx context.Context, taskID string, userID string) ([]model.TaskStepProgress, error) {
	var progressList []model.TaskStepProgress
	if err := s.db.WithContext(ctx).Preload("Step").Preload("User").
		Where("task_id = ? AND user_id = ?", taskID, userID).
		Order("step_id ASC").Find(&progressList).Error; err != nil {
		return nil, errors.Wrap(err, "获取用户任务进度失败")
	}
	return progressList, nil
}

// UpdateTaskStepProgress 更新任务步骤进度
func (s *TaskStepProgressService) UpdateTaskStepProgress(ctx context.Context, progressID string, updates map[string]interface{}, userID string) error {
	// 获取进度记录
	var progress model.TaskStepProgress
	if err := s.db.WithContext(ctx).Where("id = ?", progressID).First(&progress).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return errors.New("任务步骤进度记录不存在")
		}
		return errors.Wrap(err, "获取任务步骤进度失败")
	}

	// 权限检查：只有记录的所有者或管理员可以更新
	isAdmin, err := s.userService.IsAdmin(ctx, userID)
	if err != nil {
		return errors.Wrap(err, "检查用户权限失败")
	}

	if !isAdmin && progress.UserID != userID {
		return errors.New("无权更新此进度记录")
	}

	// 处理状态变化
	if status, exists := updates["status"]; exists {
		newStatus := status.(model.TaskStatus)
		now := time.Now()

		// 如果状态变为进行中且还没有开始时间，设置开始时间
		if newStatus == model.TaskStatusInProgress && progress.StartedAt == nil {
			updates["started_at"] = &now
		}

		// 如果状态变为已完成，设置完成时间
		if newStatus == model.TaskStatusCompleted && progress.CompletedAt == nil {
			updates["completed_at"] = &now
		}
	}

	// 设置更新时间
	updates["updated_at"] = time.Now()

	// 执行更新
	tx := s.db.WithContext(ctx).Model(&progress).Updates(updates)
	if tx.Error != nil {
		return errors.Wrap(tx.Error, "更新任务步骤进度失败")
	}
	if tx.RowsAffected == 0 {
		return errors.New("任务步骤进度记录不存在")
	}

	return nil
}

// DeleteTaskStepProgress 删除任务步骤进度记录
func (s *TaskStepProgressService) DeleteTaskStepProgress(ctx context.Context, progressID string, userID string) error {
	// 获取进度记录
	var progress model.TaskStepProgress
	if err := s.db.WithContext(ctx).Where("id = ?", progressID).First(&progress).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return errors.New("任务步骤进度记录不存在")
		}
		return errors.Wrap(err, "获取任务步骤进度失败")
	}

	// 权限检查：只有记录的所有者或管理员可以删除
	isAdmin, err := s.userService.IsAdmin(ctx, userID)
	if err != nil {
		return errors.Wrap(err, "检查用户权限失败")
	}

	if !isAdmin && progress.UserID != userID {
		return errors.New("无权删除此进度记录")
	}

	if err := s.db.WithContext(ctx).Delete(&progress).Error; err != nil {
		return errors.Wrap(err, "删除任务步骤进度失败")
	}

	return nil
}

// GetTaskOverallProgress 获取任务整体进度统计
func (s *TaskStepProgressService) GetTaskOverallProgress(ctx context.Context, taskID string, userID string) (map[string]interface{}, error) {
	// 获取任务的所有步骤
	var steps []model.TaskStep
	if err := s.db.WithContext(ctx).Where("task_id = ?", taskID).Order("`order` ASC").Find(&steps).Error; err != nil {
		return nil, errors.Wrap(err, "获取任务步骤失败")
	}

	// 获取用户的进度记录
	var progressList []model.TaskStepProgress
	if err := s.db.WithContext(ctx).Where("task_id = ? AND user_id = ?", taskID, userID).Find(&progressList).Error; err != nil {
		return nil, errors.Wrap(err, "获取用户进度失败")
	}

	// 创建进度映射
	progressMap := make(map[int]*model.TaskStepProgress)
	for i := range progressList {
		progressMap[progressList[i].StepID] = &progressList[i]
	}

	totalSteps := len(steps)
	completedSteps := 0
	inProgressSteps := 0
	notStartedSteps := 0
	totalProgress := 0.0

	// 计算进度
	for _, step := range steps {
		if progress, exists := progressMap[step.ID]; exists {
			switch progress.Status {
			case model.TaskStatusCompleted:
				completedSteps++
				totalProgress += progress.Progress
			case model.TaskStatusInProgress:
				inProgressSteps++
				totalProgress += progress.Progress
			case model.TaskStatusNotStarted:
				notStartedSteps++
			}
		} else {
			notStartedSteps++
		}
	}

	// 计算平均进度
	averageProgress := 0.0
	if totalSteps > 0 {
		averageProgress = totalProgress / float64(totalSteps)
	}

	return map[string]interface{}{
		"total_steps":       totalSteps,
		"completed_steps":   completedSteps,
		"in_progress_steps": inProgressSteps,
		"not_started_steps": notStartedSteps,
		"average_progress":  averageProgress,
		"steps":             steps,
		"progress_list":     progressList,
	}, nil
}

// BatchUpdateTaskStepProgress 批量更新任务步骤进度
func (s *TaskStepProgressService) BatchUpdateTaskStepProgress(ctx context.Context, taskID string, userID string, updates []map[string]interface{}) error {
	// 开始事务
	tx := s.db.WithContext(ctx).Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	for _, update := range updates {
		stepID, ok := update["step_id"].(int)
		if !ok {
			tx.Rollback()
			return errors.New("步骤ID格式错误")
		}

		// 查找或创建进度记录
		var progress model.TaskStepProgress
		err := tx.Where("task_id = ? AND step_id = ? AND user_id = ?", taskID, stepID, userID).First(&progress).Error
		if err != nil {
			if err == gorm.ErrRecordNotFound {
				// 创建新记录
				progress = model.TaskStepProgress{
					ID:     GenerateUniqueID(),
					TaskID: taskID,
					StepID: stepID,
					UserID: userID,
				}
			} else {
				tx.Rollback()
				return errors.Wrap(err, "查询进度记录失败")
			}
		}

		// 更新字段
		if status, exists := update["status"]; exists {
			progress.Status = status.(model.TaskStatus)
		}
		if progressValue, exists := update["progress"]; exists {
			progress.Progress = progressValue.(float64)
		}
		if notes, exists := update["notes"]; exists {
			progress.Notes = notes.(string)
		}
		if evidence, exists := update["evidence"]; exists {
			progress.Evidence = evidence.(string)
		}

		// 处理时间字段
		now := time.Now()
		if progress.Status == model.TaskStatusInProgress && progress.StartedAt == nil {
			progress.StartedAt = &now
		}
		if progress.Status == model.TaskStatusCompleted && progress.CompletedAt == nil {
			progress.CompletedAt = &now
		}

		progress.UpdatedAt = now

		// 保存或更新
		if progress.CreatedAt.IsZero() {
			progress.CreatedAt = now
			if err := tx.Create(&progress).Error; err != nil {
				tx.Rollback()
				return errors.Wrap(err, "创建进度记录失败")
			}
		} else {
			if err := tx.Save(&progress).Error; err != nil {
				tx.Rollback()
				return errors.Wrap(err, "更新进度记录失败")
			}
		}
	}

	return tx.Commit().Error
}
