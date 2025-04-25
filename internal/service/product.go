package service

import (
	"context"
	"fmt"
	"time"

	"github.com/pkg/errors"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"FreshBox/internal/model"
)

// ProductService 商品服务
type ProductService struct {
	db          *gorm.DB
	logger      *zap.Logger
	userService *UserService
}

// NewProductService 创建商品服务
func NewProductService(db *gorm.DB, logger *zap.Logger, userService *UserService) *ProductService {
	return &ProductService{
		db:          db,
		logger:      logger,
		userService: userService,
	}
}

// CreateProduct 创建商品
func (s *ProductService) CreateProduct(ctx context.Context, product *model.Product, userID string) error {
	// 检查用户权限 - 假设只有管理员能创建
	isAdmin, err := s.userService.IsAdmin(ctx, userID)
	if err != nil {
		return errors.Wrap(err, "检查用户权限失败")
	}
	if !isAdmin {
		return errors.New("只有管理员可以创建商品")
	}

	// 验证必要字段
	if product.ManufacturerID == "" {
		return errors.New("必须提供生产商ID")
	}

	tx := s.db.Begin()
	if tx.Error != nil {
		return errors.Wrap(tx.Error, "开启事务失败")
	}

	// 验证生产商是否存在
	if err := tx.First(&model.Manufacturer{}, "id = ?", product.ManufacturerID).Error; err != nil {
		tx.Rollback()
		if err == gorm.ErrRecordNotFound {
			return errors.New("指定的生产商不存在")
		}
		return errors.Wrap(err, "验证生产商失败")
	}

	// 验证配料是否存在 (如果提供了配料信息)
	var validIngredients []*model.Ingredient
	if len(product.Ingredients) > 0 {
		var ingredientIDs []string
		for _, ing := range product.Ingredients {
			if ing.ID != "" {
				ingredientIDs = append(ingredientIDs, ing.ID)
			} else {
				tx.Rollback()
				return errors.New("提供的配料缺少ID")
			}
		}

		if err := tx.Where("id IN ?", ingredientIDs).Find(&validIngredients).Error; err != nil {
			tx.Rollback()
			return errors.Wrap(err, "验证配料失败")
		}
		if len(validIngredients) != len(ingredientIDs) {
			tx.Rollback()
			return errors.New("部分提供的配料ID无效或不存在")
		}
	}

	// 设置商品基本信息
	product.ID = GenerateUniqueID()
	product.Status = "available" // 初始状态为可用
	product.CreatorID = userID
	product.CreatedAt = time.Now()
	product.UpdatedAt = time.Now()

	// 创建商品记录 (不包括关联)
	productToCreate := *product       // 复制一份，避免关联数据干扰Create
	productToCreate.Ingredients = nil // 清除关联，后面单独处理
	if err := tx.Create(&productToCreate).Error; err != nil {
		tx.Rollback()
		return errors.Wrap(err, "保存商品失败")
	}

	// 关联配料
	if len(validIngredients) > 0 {
		if err := tx.Model(&productToCreate).Association("Ingredients").Replace(validIngredients); err != nil {
			tx.Rollback()
			return errors.Wrap(err, "关联商品配料失败")
		}
	}

	if err := tx.Commit().Error; err != nil {
		return errors.Wrap(err, "提交事务失败")
	}

	// 将生成的ID赋回原product对象，以便调用者获取
	product.ID = productToCreate.ID

	return nil
}

// GetProduct 获取商品详情 (预加载生产商和配料)
func (s *ProductService) GetProduct(ctx context.Context, id string) (*model.Product, error) {
	var product model.Product
	if err := s.db.Preload("Manufacturer").Preload("Ingredients").First(&product, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.Wrap(err, "商品不存在")
		}
		return nil, errors.Wrap(err, "查询商品失败")
	}
	return &product, nil
}

// UpdateProduct 更新商品信息
func (s *ProductService) UpdateProduct(ctx context.Context, id string, productData *model.Product, userID string) error {
	// 检查用户权限 - 假设只有管理员能更新
	isAdmin, err := s.userService.IsAdmin(ctx, userID)
	if err != nil {
		return errors.Wrap(err, "检查用户权限失败")
	}
	if !isAdmin {
		return errors.New("只有管理员可以更新商品")
	}

	tx := s.db.Begin()
	if tx.Error != nil {
		return errors.Wrap(tx.Error, "开启事务失败")
	}

	// 首先检查商品是否存在
	var existingProduct model.Product
	if err := tx.First(&existingProduct, "id = ?", id).Error; err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("商品不存在")
		}
		return errors.Wrap(err, "查询商品失败")
	}

	// 根据商品状态检查是否可以更新
	if existingProduct.Status != "available" {
		tx.Rollback()
		return errors.New("只有可用状态的商品可以更新")
	}

	// 验证新的生产商ID (如果更改了)
	if productData.ManufacturerID != "" && productData.ManufacturerID != existingProduct.ManufacturerID {
		if err := tx.First(&model.Manufacturer{}, "id = ?", productData.ManufacturerID).Error; err != nil {
			tx.Rollback()
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New("指定的新生产商不存在")
			}
			return errors.Wrap(err, "验证新生产商失败")
		}
	} else if productData.ManufacturerID == "" { // 不允许清空生产商
		productData.ManufacturerID = existingProduct.ManufacturerID
	}

	// 更新可修改的字段
	updates := map[string]interface{}{
		"name":              productData.Name,
		"category":          productData.Category,
		"description":       productData.Description,
		"image_url":         productData.ImageURL,
		"price":             productData.Price,
		"production_date":   productData.ProductionDate,
		"shelf_life_hours":  productData.ShelfLifeHours,
		"manufacturer_id":   productData.ManufacturerID,
		"batch_number":      productData.BatchNumber,
		"storage_condition": productData.StorageCondition,
		"updated_at":        time.Now(),
	}

	if err := tx.Model(&existingProduct).Updates(updates).Error; err != nil {
		tx.Rollback()
		return errors.Wrap(err, "更新商品基本信息失败")
	}

	// 更新配料关联 (如果提供了配料信息)
	if productData.Ingredients != nil { // 注意：如果传入空切片，会清除所有关联
		var validIngredients []*model.Ingredient
		if len(productData.Ingredients) > 0 {
			var ingredientIDs []string
			for _, ing := range productData.Ingredients {
				if ing.ID != "" {
					ingredientIDs = append(ingredientIDs, ing.ID)
				} else {
					tx.Rollback()
					return errors.New("提供的配料缺少ID")
				}
			}
			if err := tx.Where("id IN ?", ingredientIDs).Find(&validIngredients).Error; err != nil {
				tx.Rollback()
				return errors.Wrap(err, "验证新配料失败")
			}
			if len(validIngredients) != len(ingredientIDs) {
				tx.Rollback()
				return errors.New("部分提供的新配料ID无效或不存在")
			}
		}
		// 使用 Replace 更新关联
		if err := tx.Model(&existingProduct).Association("Ingredients").Replace(validIngredients); err != nil {
			tx.Rollback()
			return errors.Wrap(err, "更新商品配料关联失败")
		}
	}

	if err := tx.Commit().Error; err != nil {
		return errors.Wrap(err, "提交事务失败")
	}

	return nil
}

// DeleteProduct 删除商品
func (s *ProductService) DeleteProduct(ctx context.Context, id string, userID string) error {
	// 检查用户权限 - 假设只有管理员能删除
	isAdmin, err := s.userService.IsAdmin(ctx, userID)
	if err != nil {
		return errors.Wrap(err, "检查用户权限失败")
	}
	if !isAdmin {
		return errors.New("只有管理员可以删除商品")
	}

	tx := s.db.Begin()
	if tx.Error != nil {
		return errors.Wrap(tx.Error, "开启事务失败")
	}

	// 检查商品状态
	var product model.Product
	if err := tx.First(&product, "id = ?", id).Error; err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("商品不存在")
		}
		return errors.Wrap(err, "查询商品失败")
	}

	// 只有可用状态的商品可以删除
	if product.Status != "available" {
		tx.Rollback()
		return errors.New("只有可用状态的商品可以删除")
	}

	// 清除商品与配料的关联
	if err := tx.Model(&product).Association("Ingredients").Clear(); err != nil {
		tx.Rollback()
		return errors.Wrap(err, "清除商品配料关联失败")
	}

	// 删除商品
	if err := tx.Delete(&model.Product{}, "id = ?", id).Error; err != nil {
		tx.Rollback()
		return errors.Wrap(err, "删除商品失败")
	}

	if err := tx.Commit().Error; err != nil {
		return errors.Wrap(err, "提交事务失败")
	}

	return nil
}

// ListProducts 列出商品 (预加载生产商)
func (s *ProductService) ListProducts(ctx context.Context, opts model.ProductListOptions) ([]*model.Product, int64, error) {
	var products []*model.Product
	var total int64

	// 构建查询
	query := s.db.Model(&model.Product{}) //.Preload("Manufacturer") // 预加载制造商

	// 添加筛选条件
	if opts.MinPrice > 0 {
		query = query.Where("price >= ?", opts.MinPrice)
	}
	if opts.MaxPrice > 0 {
		query = query.Where("price <= ?", opts.MaxPrice)
	}
	if opts.Category != "" {
		query = query.Where("category = ?", opts.Category)
	}
	if opts.Status != "" {
		query = query.Where("status = ?", opts.Status)
	}
	if opts.Keyword != "" {
		query = query.Where("name LIKE ? OR description LIKE ?",
			"%"+opts.Keyword+"%", "%"+opts.Keyword+"%")
	}

	// 查询总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, errors.Wrap(err, "查询总数失败")
	}

	// 添加排序
	if opts.SortBy != "" {
		order := "ASC"
		if opts.Order == "desc" {
			order = "DESC"
		}

		switch opts.SortBy {
		case "price":
			query = query.Order(fmt.Sprintf("price %s", order))
		case "production_date":
			query = query.Order(fmt.Sprintf("production_date %s", order))
		case "shelf_life":
			query = query.Order(fmt.Sprintf("shelf_life_hours %s", order))
		case "created":
			query = query.Order(fmt.Sprintf("created_at %s", order))
		default:
			query = query.Order("created_at DESC") // 默认按创建时间倒序
		}
	} else {
		query = query.Order("created_at DESC") // 默认排序
	}

	// 分页
	if opts.Page < 1 {
		opts.Page = 1
	}
	if opts.Size < 1 {
		opts.Size = 10
	}
	query = query.Offset((opts.Page - 1) * opts.Size).Limit(opts.Size)

	// 执行查询 (包含预加载)
	if err := query.Preload("Manufacturer").Find(&products).Error; err != nil {
		return nil, 0, errors.Wrap(err, "查询商品列表失败")
	}

	return products, total, nil
}

// AddProductToBlindBox 将商品添加到盲盒
func (s *ProductService) AddProductToBlindBox(ctx context.Context, productID, blindBoxID string) error {
	tx := s.db.Begin()
	if tx.Error != nil {
		return errors.Wrap(tx.Error, "开启事务失败")
	}
	// 检查商品是否存在
	var product model.Product
	if err := tx.First(&product, "id = ?", productID).Error; err != nil {
		tx.Rollback()
		return errors.Wrap(err, "查询商品失败")
	}

	// 检查商品状态
	if product.Status != "available" {
		tx.Rollback()
		return errors.New("只有可用状态的商品可以加入盲盒")
	}

	// 检查盲盒是否存在
	var blindBox model.BlindBox
	if err := tx.First(&blindBox, "id = ?", blindBoxID).Error; err != nil {
		tx.Rollback()
		return errors.Wrap(err, "查询盲盒失败")
	}

	// 检查盲盒状态
	if blindBox.Status != "active" {
		tx.Rollback()
		return errors.New("只有活跃状态的盲盒可以添加商品")
	}

	// 更新商品状态和所属盲盒
	updates := map[string]interface{}{
		"status":       "in_blind_box",
		"blind_box_id": blindBoxID,
		"updated_at":   time.Now(),
	}

	if err := tx.Model(&model.Product{}).Where("id = ?", productID).Updates(updates).Error; err != nil {
		tx.Rollback()
		return errors.Wrap(err, "更新商品状态失败")
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		return errors.Wrap(err, "提交事务失败")
	}

	return nil
}

// RemoveProductFromBlindBox 从盲盒中移除商品
func (s *ProductService) RemoveProductFromBlindBox(ctx context.Context, productID string) error {
	tx := s.db.Begin()
	if tx.Error != nil {
		return errors.Wrap(tx.Error, "开启事务失败")
	}

	// 检查商品是否存在
	var product model.Product
	if err := tx.First(&product, "id = ?", productID).Error; err != nil {
		tx.Rollback()
		return errors.Wrap(err, "查询商品失败")
	}

	// 检查商品状态
	if product.Status != "in_blind_box" {
		tx.Rollback()
		return errors.New("只有在盲盒中的商品可以被移除")
	}

	// 更新商品状态和所属盲盒
	updates := map[string]interface{}{
		"status":       "available",
		"blind_box_id": nil, // 使用 nil 清除外键关联
		"updated_at":   time.Now(),
	}

	if err := tx.Model(&model.Product{}).Where("id = ?", productID).Updates(updates).Error; err != nil {
		tx.Rollback()
		return errors.Wrap(err, "更新商品状态失败")
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		return errors.Wrap(err, "提交事务失败")
	}

	return nil
}

// BatchAddProductsToBlindBox 批量将商品添加到盲盒
func (s *ProductService) BatchAddProductsToBlindBox(ctx context.Context, productIDs []string, blindBoxID string) error {
	tx := s.db.Begin()
	if tx.Error != nil {
		return errors.Wrap(tx.Error, "开启事务失败")
	}

	// 检查盲盒是否存在
	var blindBox model.BlindBox
	if err := tx.First(&blindBox, "id = ?", blindBoxID).Error; err != nil {
		tx.Rollback()
		return errors.Wrap(err, "查询盲盒失败")
	}

	// 检查盲盒状态
	if blindBox.Status != "active" {
		tx.Rollback()
		return errors.New("只有活跃状态的盲盒可以添加商品")
	}

	// 更新商品状态和所属盲盒
	now := time.Now()
	for _, productID := range productIDs {
		// 检查商品是否存在并且状态为可用
		var product model.Product
		if err := tx.First(&product, "id = ? AND status = ?", productID, "available").Error; err != nil {
			tx.Rollback()
			return errors.Wrapf(err, "商品 %s 不存在或状态不是可用", productID)
		}

		// 更新商品状态
		updates := map[string]interface{}{
			"status":       "in_blind_box",
			"blind_box_id": blindBoxID,
			"updated_at":   now,
		}

		if err := tx.Model(&model.Product{}).Where("id = ?", productID).Updates(updates).Error; err != nil {
			tx.Rollback()
			return errors.Wrapf(err, "更新商品 %s 状态失败", productID)
		}
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		return errors.Wrap(err, "提交事务失败")
	}

	return nil
}

// GetProductsByStatus 根据状态获取商品列表
func (s *ProductService) GetProductsByStatus(ctx context.Context, status string, page, size int) ([]*model.Product, int64, error) {
	var products []*model.Product
	var total int64

	// 构建查询
	query := s.db.Model(&model.Product{}).Where("status = ?", status)

	// 查询总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, errors.Wrap(err, "查询总数失败")
	}

	// 分页
	if page < 1 {
		page = 1
	}
	if size < 1 {
		size = 10
	}

	// 添加排序和分页
	query = query.Order("created_at DESC").Offset((page - 1) * size).Limit(size)

	// 执行查询 (预加载 Manufacturer)
	if err := query.Preload("Manufacturer").Find(&products).Error; err != nil {
		return nil, 0, errors.Wrap(err, "查询商品列表失败")
	}

	return products, total, nil
}

// GetProductsByBlindBox 获取盲盒内的商品
func (s *ProductService) GetProductsByBlindBox(ctx context.Context, blindBoxID string) ([]*model.Product, error) {
	var products []*model.Product

	if err := s.db.Preload("Manufacturer").Where("blind_box_id = ? AND status = ?", blindBoxID, "in_blind_box").Find(&products).Error; err != nil {
		return nil, errors.Wrap(err, "查询盲盒商品失败")
	}

	return products, nil
}

// CountProductsByBlindBox 统计盲盒内的商品数量
func (s *ProductService) CountProductsByBlindBox(ctx context.Context, blindBoxID string) (int64, error) {
	var count int64
	if err := s.db.Model(&model.Product{}).Where("blind_box_id = ? AND status = ?", blindBoxID, "in_blind_box").Count(&count).Error; err != nil {
		return 0, errors.Wrap(err, "统计盲盒商品数量失败")
	}
	return count, nil
}
