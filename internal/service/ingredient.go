package service

import (
	"context"

	"github.com/pkg/errors"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"FreshBox/internal/model"
)

// IngredientService 配料服务
type IngredientService struct {
	db          *gorm.DB
	logger      *zap.Logger
	userService *UserService // 用于权限检查
}

// NewIngredientService 创建配料服务
func NewIngredientService(db *gorm.DB, logger *zap.Logger, userService *UserService) *IngredientService {
	return &IngredientService{
		db:          db,
		logger:      logger,
		userService: userService,
	}
}

// CreateIngredient 创建配料
func (s *IngredientService) CreateIngredient(ctx context.Context, ingredient *model.Ingredient, userID string) error {
	// 检查用户权限
	isAdmin, err := s.userService.IsAdmin(ctx, userID)
	if err != nil {
		return errors.Wrap(err, "检查用户权限失败")
	}
	if !isAdmin {
		return errors.New("只有管理员可以创建配料")
	}

	// 检查配料名称是否已存在
	var count int64
	if err := s.db.Model(&model.Ingredient{}).Where("name = ?", ingredient.Name).Count(&count).Error; err != nil {
		return errors.Wrap(err, "检查配料名称失败")
	}
	if count > 0 {
		return errors.New("配料名称已存在")
	}

	ingredient.ID = GenerateUniqueID()

	if err := s.db.Create(ingredient).Error; err != nil {
		return errors.Wrap(err, "创建配料失败")
	}
	return nil
}

// GetIngredient 获取配料详情
func (s *IngredientService) GetIngredient(ctx context.Context, id string) (*model.Ingredient, error) {
	var ingredient model.Ingredient
	if err := s.db.First(&ingredient, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("配料不存在")
		}
		return nil, errors.Wrap(err, "查询配料失败")
	}
	return &ingredient, nil
}

// ListIngredients 列出所有配料 (可考虑分页和过滤)
// 注意：如果配料数量很多，应该实现分页
func (s *IngredientService) ListIngredients(ctx context.Context) ([]*model.Ingredient, error) {
	var ingredients []*model.Ingredient
	if err := s.db.Find(&ingredients).Error; err != nil {
		return nil, errors.Wrap(err, "查询配料列表失败")
	}
	return ingredients, nil
}

// UpdateIngredient 更新配料信息
func (s *IngredientService) UpdateIngredient(ctx context.Context, id string, data *model.Ingredient, userID string) error {
	// 检查用户权限
	isAdmin, err := s.userService.IsAdmin(ctx, userID)
	if err != nil {
		return errors.Wrap(err, "检查用户权限失败")
	}
	if !isAdmin {
		return errors.New("只有管理员可以更新配料")
	}

	tx := s.db.Begin()
	if tx.Error != nil {
		return errors.Wrap(tx.Error, "开启事务失败")
	}

	var existing model.Ingredient
	if err := tx.First(&existing, "id = ?", id).Error; err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("配料不存在")
		}
		return errors.Wrap(err, "查询配料失败")
	}

	// 检查更新后的名称是否与其它配料冲突
	if data.Name != "" && data.Name != existing.Name {
		var count int64
		if err := tx.Model(&model.Ingredient{}).Where("name = ? AND id != ?", data.Name, id).Count(&count).Error; err != nil {
			tx.Rollback()
			return errors.Wrap(err, "检查配料名称唯一性失败")
		}
		if count > 0 {
			tx.Rollback()
			return errors.New("更新后的配料名称已存在")
		}
	}

	updates := map[string]interface{}{}
	if data.Name != "" {
		updates["name"] = data.Name
	}
	if data.Category != "" { // 假设空字符串表示不更新
		updates["category"] = data.Category
	}
	// 布尔值通常直接更新
	updates["is_allergen"] = data.IsAllergen
	if data.Description != "" {
		updates["description"] = data.Description
	}

	if len(updates) > 0 {
		if err := tx.Model(&existing).Updates(updates).Error; err != nil {
			tx.Rollback()
			return errors.Wrap(err, "更新配料失败")
		}
	}

	if err := tx.Commit().Error; err != nil {
		return errors.Wrap(err, "提交事务失败")
	}
	return nil
}

// DeleteIngredient 删除配料
func (s *IngredientService) DeleteIngredient(ctx context.Context, id string, userID string) error {
	// 检查用户权限
	isAdmin, err := s.userService.IsAdmin(ctx, userID)
	if err != nil {
		return errors.Wrap(err, "检查用户权限失败")
	}
	if !isAdmin {
		return errors.New("只有管理员可以删除配料")
	}

	tx := s.db.Begin()
	if tx.Error != nil {
		return errors.Wrap(tx.Error, "开启事务失败")
	}

	var ingredient model.Ingredient
	if err := tx.First(&ingredient, "id = ?", id).Error; err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("配料不存在")
		}
		return errors.Wrap(err, "查询配料失败")
	}

	// 重要：检查该配料是否被任何产品使用
	var count int64
	if err := tx.Model(&model.Product{}).Where("id IN (SELECT product_id FROM product_ingredients WHERE ingredient_id = ?)", id).Count(&count).Error; err != nil {
		tx.Rollback()
		return errors.Wrap(err, "检查产品关联失败")
	}
	if count > 0 {
		tx.Rollback()
		return errors.New("无法删除配料，因为它已被产品使用")
	}

	// GORM的many2many关联在删除主记录时会自动处理关联表，但以防万一可以显式清除
	// if err := tx.Model(&ingredient).Association("Products").Clear(); err != nil {
	// 	tx.Rollback()
	// 	return errors.Wrap(err, "清除配料关联失败")
	// }

	if err := tx.Delete(&ingredient).Error; err != nil {
		tx.Rollback()
		return errors.Wrap(err, "删除配料失败")
	}

	if err := tx.Commit().Error; err != nil {
		return errors.Wrap(err, "提交事务失败")
	}
	return nil
}
