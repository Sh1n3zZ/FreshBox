package service

import (
	"context"
	"time"

	"github.com/pkg/errors"
	"gorm.io/gorm"

	"FreshBox/internal/model"
)

// TaskStepService 任务步骤服务
type TaskStepService struct {
	db          *gorm.DB
	userService *UserService
}

// NewTaskStepService 创建任务步骤服务实例
func NewTaskStepService(db *gorm.DB, userService *UserService) *TaskStepService {
	return &TaskStepService{
		db:          db,
		userService: userService,
	}
}

// CreateTaskStep 创建任务步骤（仅限管理员）
func (s *TaskStepService) CreateTaskStep(ctx context.Context, step *model.TaskStep, adminID string) error {
	// 权限检查
	isAdmin, err := s.userService.IsAdmin(ctx, adminID)
	if err != nil {
		return errors.Wrap(err, "检查用户权限失败")
	}
	if !isAdmin {
		return errors.New("只有管理员可以创建任务步骤")
	}

	// 验证任务是否存在
	var task model.Task
	if err := s.db.WithContext(ctx).Where("id = ?", step.TaskID).First(&task).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return errors.New("任务不存在")
		}
		return errors.Wrap(err, "验证任务失败")
	}

	// 设置创建和更新时间
	step.CreatedAt = time.Now()
	step.UpdatedAt = time.Now()

	// 如果没有指定顺序，自动设置为最大顺序+1
	if step.Order == 0 {
		var maxOrder int
		s.db.WithContext(ctx).Model(&model.TaskStep{}).Where("task_id = ?", step.TaskID).Select("COALESCE(MAX(`order`), 0)").Scan(&maxOrder)
		step.Order = maxOrder + 1
	}

	if err := s.db.WithContext(ctx).Create(step).Error; err != nil {
		return errors.Wrap(err, "创建任务步骤失败")
	}
	return nil
}

// GetTaskStep 根据ID获取任务步骤
func (s *TaskStepService) GetTaskStep(ctx context.Context, stepID int) (*model.TaskStep, error) {
	var step model.TaskStep
	if err := s.db.WithContext(ctx).Where("id = ?", stepID).First(&step).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.New("任务步骤不存在")
		}
		return nil, errors.Wrap(err, "获取任务步骤失败")
	}
	return &step, nil
}

// GetTaskSteps 获取任务的所有步骤
func (s *TaskStepService) GetTaskSteps(ctx context.Context, taskID string) ([]model.TaskStep, error) {
	var steps []model.TaskStep
	if err := s.db.WithContext(ctx).Where("task_id = ?", taskID).Order("`order` ASC").Find(&steps).Error; err != nil {
		return nil, errors.Wrap(err, "获取任务步骤失败")
	}
	return steps, nil
}

// UpdateTaskStep 更新任务步骤（仅限管理员）
func (s *TaskStepService) UpdateTaskStep(ctx context.Context, stepID int, updates map[string]interface{}, adminID string) error {
	// 权限检查
	isAdmin, err := s.userService.IsAdmin(ctx, adminID)
	if err != nil {
		return errors.Wrap(err, "检查用户权限失败")
	}
	if !isAdmin {
		return errors.New("只有管理员可以更新任务步骤")
	}

	// 设置更新时间
	updates["updated_at"] = time.Now()

	// 执行更新
	tx := s.db.WithContext(ctx).Model(&model.TaskStep{}).Where("id = ?", stepID).Updates(updates)
	if tx.Error != nil {
		if tx.Error == gorm.ErrRecordNotFound {
			return errors.New("任务步骤不存在")
		}
		return errors.Wrap(tx.Error, "更新任务步骤失败")
	}
	if tx.RowsAffected == 0 {
		return errors.New("任务步骤不存在")
	}

	return nil
}

// DeleteTaskStep 删除任务步骤（仅限管理员）
func (s *TaskStepService) DeleteTaskStep(ctx context.Context, stepID int, adminID string) error {
	// 权限检查
	isAdmin, err := s.userService.IsAdmin(ctx, adminID)
	if err != nil {
		return errors.Wrap(err, "检查用户权限失败")
	}
	if !isAdmin {
		return errors.New("只有管理员可以删除任务步骤")
	}

	// 获取步骤信息
	var step model.TaskStep
	if err := s.db.WithContext(ctx).Where("id = ?", stepID).First(&step).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return errors.New("任务步骤不存在")
		}
		return errors.Wrap(err, "获取任务步骤失败")
	}

	// 开始事务
	tx := s.db.WithContext(ctx).Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 删除步骤
	if err := tx.Delete(&step).Error; err != nil {
		tx.Rollback()
		return errors.Wrap(err, "删除任务步骤失败")
	}

	// 重新排序剩余步骤
	if err := tx.Model(&model.TaskStep{}).
		Where("task_id = ? AND `order` > ?", step.TaskID, step.Order).
		UpdateColumn("`order`", gorm.Expr("`order` - 1")).Error; err != nil {
		tx.Rollback()
		return errors.Wrap(err, "重新排序步骤失败")
	}

	return tx.Commit().Error
}

// ReorderTaskSteps 重新排序任务步骤（仅限管理员）
func (s *TaskStepService) ReorderTaskSteps(ctx context.Context, taskID string, stepOrders map[int]int, adminID string) error {
	// 权限检查
	isAdmin, err := s.userService.IsAdmin(ctx, adminID)
	if err != nil {
		return errors.Wrap(err, "检查用户权限失败")
	}
	if !isAdmin {
		return errors.New("只有管理员可以重新排序任务步骤")
	}

	// 开始事务
	tx := s.db.WithContext(ctx).Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 批量更新步骤顺序
	for stepID, order := range stepOrders {
		if err := tx.Model(&model.TaskStep{}).
			Where("id = ? AND task_id = ?", stepID, taskID).
			Updates(map[string]interface{}{
				"`order`":    order,
				"updated_at": time.Now(),
			}).Error; err != nil {
			tx.Rollback()
			return errors.Wrap(err, "更新步骤顺序失败")
		}
	}

	return tx.Commit().Error
}

// UpdateTaskStepStatus 更新任务步骤状态
func (s *TaskStepService) UpdateTaskStepStatus(ctx context.Context, stepID int, status model.TaskStatus, userID string) error {
	// 获取步骤信息
	var step model.TaskStep
	if err := s.db.WithContext(ctx).Where("id = ?", stepID).First(&step).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return errors.New("任务步骤不存在")
		}
		return errors.Wrap(err, "获取任务步骤失败")
	}

	// 验证用户是否有权限更新此步骤（这里可以根据业务需求调整权限逻辑）
	// 例如：只有任务创建者或管理员可以更新步骤状态
	isAdmin, err := s.userService.IsAdmin(ctx, userID)
	if err != nil {
		return errors.Wrap(err, "检查用户权限失败")
	}

	if !isAdmin {
		// 如果不是管理员，检查是否为任务创建者
		var task model.Task
		if err := s.db.WithContext(ctx).Where("id = ?", step.TaskID).First(&task).Error; err != nil {
			return errors.Wrap(err, "获取任务信息失败")
		}
		if task.CreatorID != userID {
			return errors.New("无权更新此步骤状态")
		}
	}

	// 更新状态
	if err := s.db.WithContext(ctx).Model(&step).Updates(map[string]interface{}{
		"status":     status,
		"updated_at": time.Now(),
	}).Error; err != nil {
		return errors.Wrap(err, "更新步骤状态失败")
	}

	return nil
}

// GetTaskStepProgress 获取任务步骤进度
func (s *TaskStepService) GetTaskStepProgress(ctx context.Context, taskID string) (map[string]interface{}, error) {
	var steps []model.TaskStep
	if err := s.db.WithContext(ctx).Where("task_id = ?", taskID).Order("`order` ASC").Find(&steps).Error; err != nil {
		return nil, errors.Wrap(err, "获取任务步骤失败")
	}

	totalSteps := len(steps)
	completedSteps := 0
	inProgressSteps := 0

	for _, step := range steps {
		if step.Status != nil {
			switch *step.Status {
			case model.TaskStatusCompleted:
				completedSteps++
			case model.TaskStatusInProgress:
				inProgressSteps++
			}
		}
	}

	progress := float64(completedSteps) / float64(totalSteps)
	if totalSteps == 0 {
		progress = 0
	}

	return map[string]interface{}{
		"total_steps":       totalSteps,
		"completed_steps":   completedSteps,
		"in_progress_steps": inProgressSteps,
		"progress":          progress,
		"steps":             steps,
	}, nil
}
