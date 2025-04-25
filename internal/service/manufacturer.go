package service

import (
	"context"
	"time"

	"github.com/pkg/errors"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"FreshBox/internal/model"
)

// ManufacturerService 生产商服务
type ManufacturerService struct {
	db          *gorm.DB
	logger      *zap.Logger
	userService *UserService // 用于权限检查
}

// NewManufacturerService 创建生产商服务
func NewManufacturerService(db *gorm.DB, logger *zap.Logger, userService *UserService) *ManufacturerService {
	return &ManufacturerService{
		db:          db,
		logger:      logger,
		userService: userService,
	}
}

// CreateManufacturer 创建生产商
func (s *ManufacturerService) CreateManufacturer(ctx context.Context, manufacturer *model.Manufacturer, userID string) error {
	// 检查用户权限
	isAdmin, err := s.userService.IsAdmin(ctx, userID)
	if err != nil {
		return errors.Wrap(err, "检查用户权限失败")
	}
	if !isAdmin {
		return errors.New("只有管理员可以创建生产商")
	}

	// 检查生产商名称是否已存在
	var count int64
	if err := s.db.Model(&model.Manufacturer{}).Where("name = ?", manufacturer.Name).Count(&count).Error; err != nil {
		return errors.Wrap(err, "检查生产商名称失败")
	}
	if count > 0 {
		return errors.New("生产商名称已存在")
	}

	manufacturer.ID = GenerateUniqueID()
	manufacturer.CreatedAt = time.Now()

	if err := s.db.Create(manufacturer).Error; err != nil {
		return errors.Wrap(err, "创建生产商失败")
	}
	return nil
}

// GetManufacturer 获取生产商详情
func (s *ManufacturerService) GetManufacturer(ctx context.Context, id string) (*model.Manufacturer, error) {
	var manufacturer model.Manufacturer
	if err := s.db.First(&manufacturer, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("生产商不存在")
		}
		return nil, errors.Wrap(err, "查询生产商失败")
	}
	return &manufacturer, nil
}

// ListManufacturers 列出所有生产商 (简单实现，无分页)
// TODO: 后续可添加分页和过滤功能
func (s *ManufacturerService) ListManufacturers(ctx context.Context) ([]*model.Manufacturer, error) {
	var manufacturers []*model.Manufacturer
	// 按创建时间降序排序
	if err := s.db.Order("created_at DESC").Find(&manufacturers).Error; err != nil {
		return nil, errors.Wrap(err, "查询生产商列表失败")
	}
	return manufacturers, nil
}

// UpdateManufacturer 更新生产商信息
func (s *ManufacturerService) UpdateManufacturer(ctx context.Context, id string, data *model.Manufacturer, userID string) error {
	// 检查用户权限
	isAdmin, err := s.userService.IsAdmin(ctx, userID)
	if err != nil {
		return errors.Wrap(err, "检查用户权限失败")
	}
	if !isAdmin {
		return errors.New("只有管理员可以更新生产商")
	}

	tx := s.db.Begin()
	if tx.Error != nil {
		return errors.Wrap(tx.Error, "开启事务失败")
	}

	var existing model.Manufacturer
	if err := tx.First(&existing, "id = ?", id).Error; err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("生产商不存在")
		}
		return errors.Wrap(err, "查询生产商失败")
	}

	// 检查更新后的名称是否与其它生产商冲突
	if data.Name != "" && data.Name != existing.Name {
		var count int64
		if err := tx.Model(&model.Manufacturer{}).Where("name = ? AND id != ?", data.Name, id).Count(&count).Error; err != nil {
			tx.Rollback()
			return errors.Wrap(err, "检查生产商名称唯一性失败")
		}
		if count > 0 {
			tx.Rollback()
			return errors.New("更新后的生产商名称已存在")
		}
	}

	// 只更新传入的非空字段
	updates := make(map[string]interface{})
	if data.Name != "" {
		updates["name"] = data.Name
	}
	// 对于可空字段，如果传入空字符串，我们可能需要允许清空，这里假设非空才更新
	if data.ContactPhone != "" {
		updates["contact_phone"] = data.ContactPhone
	}
	if data.Address != "" {
		updates["address"] = data.Address
	}
	if data.CertificationNumber != "" {
		updates["certification_number"] = data.CertificationNumber
	}

	if len(updates) > 0 {
		if err := tx.Model(&existing).Updates(updates).Error; err != nil {
			tx.Rollback()
			return errors.Wrap(err, "更新生产商失败")
		}
	} else {
		// 如果没有需要更新的字段，可以直接返回成功，避免不必要的事务提交
		tx.Rollback() // 回滚空事务
		return nil
	}

	if err := tx.Commit().Error; err != nil {
		return errors.Wrap(err, "提交事务失败")
	}
	return nil
}

// DeleteManufacturer 删除生产商
func (s *ManufacturerService) DeleteManufacturer(ctx context.Context, id string, userID string) error {
	// 检查用户权限
	isAdmin, err := s.userService.IsAdmin(ctx, userID)
	if err != nil {
		return errors.Wrap(err, "检查用户权限失败")
	}
	if !isAdmin {
		return errors.New("只有管理员可以删除生产商")
	}

	tx := s.db.Begin()
	if tx.Error != nil {
		return errors.Wrap(tx.Error, "开启事务失败")
	}

	var manufacturer model.Manufacturer
	if err := tx.First(&manufacturer, "id = ?", id).Error; err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("生产商不存在")
		}
		return errors.Wrap(err, "查询生产商失败")
	}

	// 重要：检查该生产商是否被任何产品关联
	var productCount int64
	if err := tx.Model(&model.Product{}).Where("manufacturer_id = ?", id).Count(&productCount).Error; err != nil {
		tx.Rollback()
		return errors.Wrap(err, "检查产品关联失败")
	}
	if productCount > 0 {
		tx.Rollback()
		return errors.Errorf("无法删除生产商 '%s'，因为它已被 %d 个产品关联", manufacturer.Name, productCount)
	}

	if err := tx.Delete(&manufacturer).Error; err != nil {
		tx.Rollback()
		return errors.Wrap(err, "删除生产商失败")
	}

	if err := tx.Commit().Error; err != nil {
		return errors.Wrap(err, "提交事务失败")
	}
	return nil
}
