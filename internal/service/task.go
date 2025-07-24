package service

import (
	"context"
	"log"
	"time"

	"github.com/pkg/errors"
	"gorm.io/gorm"

	"FreshBox/internal/model"
)

// TaskService 任务服务
// 负责挑战任务的增删改查逻辑，实现真正的数据库交互
// 所有管理员相关校验依赖 UserService 的 IsAdmin 方法
//
// NOTE: 本服务只处理 Task 表相关逻辑，不处理提交、评论等内容
// 详见 taskusersubmit.go 与 taskusercomment.go

type TaskService struct {
	db          *gorm.DB
	userService *UserService
}

// NewTaskService 创建任务服务实例
func NewTaskService(db *gorm.DB, userService *UserService) *TaskService {
	return &TaskService{
		db:          db,
		userService: userService,
	}
}

// CreateTask 创建新任务（仅限管理员）
func (s *TaskService) CreateTask(ctx context.Context, task *model.Task, adminID string) error {
	isAdmin, err := s.userService.IsAdmin(ctx, adminID)
	if err != nil {
		return errors.Wrap(err, "检查用户权限失败")
	}
	if !isAdmin {
		return errors.New("只有管理员可以创建任务")
	}

	log.Printf("[DEBUG] CreateTask to DB tags: %v", task.Tags)

	task.ID = GenerateUniqueID()
	task.CreatorID = adminID
	task.CreatedAt = time.Now()
	task.UpdatedAt = time.Now()

	if err := s.db.WithContext(ctx).Create(task).Error; err != nil {
		return errors.Wrap(err, "创建任务失败")
	}
	return nil
}

// GetTask 根据ID获取任务
func (s *TaskService) GetTask(ctx context.Context, taskID string) (*model.Task, error) {
	var task model.Task
	if err := s.db.WithContext(ctx).Preload("Steps").Preload("Creator").Where("id = ?", taskID).First(&task).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.New("任务不存在")
		}
		return nil, errors.Wrap(err, "获取任务失败")
	}
	return &task, nil
}

// UpdateTaskStatus 更新任务状态（仅限管理员）
func (s *TaskService) UpdateTaskStatus(ctx context.Context, taskID string, status model.TaskStatus, adminID string) error {
	isAdmin, err := s.userService.IsAdmin(ctx, adminID)
	if err != nil {
		return errors.Wrap(err, "检查用户权限失败")
	}
	if !isAdmin {
		return errors.New("只有管理员可以更新任务状态")
	}

	if err := s.db.WithContext(ctx).Model(&model.Task{}).Where("id = ?", taskID).Update("status", status).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return errors.New("任务不存在")
		}
		return errors.Wrap(err, "更新任务状态失败")
	}
	return nil
}

// UpdateTask 更新任务详情（仅限管理员）
func (s *TaskService) UpdateTask(ctx context.Context, taskID string, updates map[string]interface{}, adminID string) error {
	// 权限检查
	isAdmin, err := s.userService.IsAdmin(ctx, adminID)
	if err != nil {
		return errors.Wrap(err, "检查用户权限失败")
	}
	if !isAdmin {
		return errors.New("只有管理员可以更新任务")
	}

	// 设置更新时间
	updates["updated_at"] = time.Now()

	if tags, ok := updates["tags"]; ok {
		log.Printf("[DEBUG] UpdateTask to DB tags: %v", tags)
	}

	// 执行更新
	tx := s.db.WithContext(ctx).Model(&model.Task{}).Where("id = ?", taskID).Updates(updates)
	if tx.Error != nil {
		if tx.Error == gorm.ErrRecordNotFound {
			return errors.New("任务不存在")
		}
		return errors.Wrap(tx.Error, "更新任务失败")
	}
	if tx.RowsAffected == 0 {
		return errors.New("任务不存在")
	}

	return nil
}

// ListTasks 按条件查询任务，返回总数便于分页
func (s *TaskService) ListTasks(ctx context.Context, difficulty, status string, page, size int) ([]*model.Task, int64, error) {
	if page <= 0 {
		page = 1
	}
	if size <= 0 {
		size = 10
	}

	query := s.db.WithContext(ctx).Model(&model.Task{})
	if difficulty != "" {
		query = query.Where("difficulty = ?", difficulty)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, errors.Wrap(err, "统计任务数量失败")
	}

	var tasks []*model.Task
	offset := (page - 1) * size
	if err := query.Preload("Creator").Preload("Steps").Order("created_at DESC").Offset(offset).Limit(size).Find(&tasks).Error; err != nil {
		return nil, 0, errors.Wrap(err, "查询任务列表失败")
	}
	return tasks, total, nil
}

// GetPopularTasks 根据参与人数排序获取热门任务
func (s *TaskService) GetPopularTasks(ctx context.Context, limit int) ([]*model.Task, error) {
	if limit <= 0 {
		limit = 10
	}
	var tasks []*model.Task
	if err := s.db.WithContext(ctx).Order("participants DESC").Limit(limit).Find(&tasks).Error; err != nil {
		return nil, errors.Wrap(err, "获取热门任务失败")
	}
	return tasks, nil
}

// GetRecommendedTasks 获取推荐任务（按截止日期最近排序）
func (s *TaskService) GetRecommendedTasks(ctx context.Context, limit int) ([]*model.Task, error) {
	if limit <= 0 {
		limit = 10
	}
	var tasks []*model.Task
	if err := s.db.WithContext(ctx).Order("deadline ASC").Limit(limit).Find(&tasks).Error; err != nil {
		return nil, errors.Wrap(err, "获取推荐任务失败")
	}
	return tasks, nil
}
