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
	// 检查用户权限
	isAdmin, err := s.userService.IsAdmin(ctx, userID)
	if err != nil {
		return errors.Wrap(err, "检查用户权限失败")
	}
	if !isAdmin {
		return errors.New("只有管理员可以创建商品")
	}

	// 设置商品基本信息
	product.ID = GenerateUniqueID()
	product.Status = "available" // 初始状态为可用
	product.CreatedAt = time.Now()
	product.UpdatedAt = time.Now()

	// 保存商品到数据库
	if err := s.db.Create(product).Error; err != nil {
		return errors.Wrap(err, "保存商品失败")
	}

	return nil
}

// GetProduct 获取商品详情
func (s *ProductService) GetProduct(ctx context.Context, id string) (*model.Product, error) {
	var product model.Product
	if err := s.db.First(&product, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.Wrap(err, "商品不存在")
		}
		return nil, errors.Wrap(err, "查询商品失败")
	}
	return &product, nil
}

// UpdateProduct 更新商品信息
func (s *ProductService) UpdateProduct(ctx context.Context, id string, productData *model.Product, userID string) error {
	// 检查用户权限
	isAdmin, err := s.userService.IsAdmin(ctx, userID)
	if err != nil {
		return errors.Wrap(err, "检查用户权限失败")
	}
	if !isAdmin {
		return errors.New("只有管理员可以更新商品")
	}

	// 首先检查商品是否存在
	var existingProduct model.Product
	if err := s.db.First(&existingProduct, "id = ?", id).Error; err != nil {
		return errors.Wrap(err, "查询商品失败")
	}

	// 根据商品状态检查是否可以更新
	if existingProduct.Status != "available" {
		return errors.New("只有可用状态的商品可以更新")
	}

	// 更新可修改的字段
	updates := map[string]interface{}{
		"name":        productData.Name,
		"description": productData.Description,
		"price":       productData.Price,
		"category":    productData.Category,
		"image_url":   productData.ImageURL,
		"updated_at":  time.Now(),
	}

	// 执行更新
	if err := s.db.Model(&model.Product{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		return errors.Wrap(err, "更新商品失败")
	}

	return nil
}

// DeleteProduct 删除商品
func (s *ProductService) DeleteProduct(ctx context.Context, id string, userID string) error {
	// 检查用户权限
	isAdmin, err := s.userService.IsAdmin(ctx, userID)
	if err != nil {
		return errors.Wrap(err, "检查用户权限失败")
	}
	if !isAdmin {
		return errors.New("只有管理员可以删除商品")
	}

	// 检查商品状态
	var product model.Product
	if err := s.db.First(&product, "id = ?", id).Error; err != nil {
		return errors.Wrap(err, "查询商品失败")
	}

	// 只有可用状态的商品可以删除
	if product.Status != "available" {
		return errors.New("只有可用状态的商品可以删除")
	}

	// 删除商品
	if err := s.db.Delete(&model.Product{}, "id = ?", id).Error; err != nil {
		return errors.Wrap(err, "删除商品失败")
	}

	return nil
}

// ListProducts 列出商品
func (s *ProductService) ListProducts(ctx context.Context, opts model.ProductListOptions) ([]*model.Product, int64, error) {
	var products []*model.Product
	var total int64

	// 构建查询
	query := s.db.Model(&model.Product{})

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

	// 执行查询
	if err := query.Find(&products).Error; err != nil {
		return nil, 0, errors.Wrap(err, "查询商品列表失败")
	}

	return products, total, nil
}

// AddProductToBlindBox 将商品添加到盲盒
func (s *ProductService) AddProductToBlindBox(ctx context.Context, productID, blindBoxID string) error {
	// 检查商品是否存在
	var product model.Product
	if err := s.db.First(&product, "id = ?", productID).Error; err != nil {
		return errors.Wrap(err, "查询商品失败")
	}

	// 检查商品状态
	if product.Status != "available" {
		return errors.New("只有可用状态的商品可以加入盲盒")
	}

	// 检查盲盒是否存在
	var blindBox model.BlindBox
	if err := s.db.First(&blindBox, "id = ?", blindBoxID).Error; err != nil {
		return errors.Wrap(err, "查询盲盒失败")
	}

	// 检查盲盒状态
	if blindBox.Status != "active" {
		return errors.New("只有活跃状态的盲盒可以添加商品")
	}

	// 开启事务
	tx := s.db.Begin()

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
	// 检查商品是否存在
	var product model.Product
	if err := s.db.First(&product, "id = ?", productID).Error; err != nil {
		return errors.Wrap(err, "查询商品失败")
	}

	// 检查商品状态
	if product.Status != "in_blind_box" {
		return errors.New("只有在盲盒中的商品可以被移除")
	}

	// 开启事务
	tx := s.db.Begin()

	// 更新商品状态和所属盲盒
	updates := map[string]interface{}{
		"status":       "available",
		"blind_box_id": nil,
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
	// 检查盲盒是否存在
	var blindBox model.BlindBox
	if err := s.db.First(&blindBox, "id = ?", blindBoxID).Error; err != nil {
		return errors.Wrap(err, "查询盲盒失败")
	}

	// 检查盲盒状态
	if blindBox.Status != "active" {
		return errors.New("只有活跃状态的盲盒可以添加商品")
	}

	// 开启事务
	tx := s.db.Begin()

	// 更新商品状态和所属盲盒
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
			"updated_at":   time.Now(),
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

	// 执行查询
	if err := query.Find(&products).Error; err != nil {
		return nil, 0, errors.Wrap(err, "查询商品列表失败")
	}

	return products, total, nil
}

// GetProductsByBlindBox 获取盲盒内的商品
func (s *ProductService) GetProductsByBlindBox(ctx context.Context, blindBoxID string) ([]*model.Product, error) {
	var products []*model.Product

	if err := s.db.Where("blind_box_id = ? AND status = ?", blindBoxID, "in_blind_box").Find(&products).Error; err != nil {
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
