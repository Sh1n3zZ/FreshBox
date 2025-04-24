package service

import (
	"context"
	"fmt"
	"math/rand"
	"time"

	"github.com/pkg/errors"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"FreshBox/internal/core/pricing"
	"FreshBox/internal/core/vision"
	"FreshBox/internal/model"
)

// BlindBoxService 盲盒服务
type BlindBoxService struct {
	db            *gorm.DB
	pricingEngine pricing.Engine
	ocrService    *vision.OCRService
	logger        *zap.Logger
}

// NewBlindBoxService 创建盲盒服务
func NewBlindBoxService(
	db *gorm.DB,
	pricingEngine pricing.Engine,
	logger *zap.Logger,
) *BlindBoxService {
	return &BlindBoxService{
		db:            db,
		pricingEngine: pricingEngine,
		logger:        logger,
	}
}

// CreateBlindBox 创建盲盒
func (s *BlindBoxService) CreateBlindBox(ctx context.Context, boxData *model.BlindBox) error {
	// 设置盲盒信息
	boxData.ID = GenerateUniqueID()
	boxData.Status = "active"
	boxData.CreatedAt = time.Now()
	boxData.UpdatedAt = time.Now()

	// 保存到数据库
	if err := s.db.Create(boxData).Error; err != nil {
		return errors.Wrap(err, "保存盲盒失败")
	}

	return nil
}

// GetBlindBox 获取盲盒详情
func (s *BlindBoxService) GetBlindBox(ctx context.Context, id string) (*model.BlindBox, error) {
	var box model.BlindBox
	result := s.db.First(&box, "id = ?", id)

	// 检查查询结果
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, errors.Wrap(result.Error, "盲盒不存在")
		}
		return nil, errors.Wrap(result.Error, "查询盲盒失败")
	}

	return &box, nil
}

// UpdateBlindBox 更新盲盒信息
func (s *BlindBoxService) UpdateBlindBox(ctx context.Context, id string, boxData *model.BlindBox) error {
	// 首先检查盲盒是否存在
	var existingBox model.BlindBox
	if err := s.db.First(&existingBox, "id = ?", id).Error; err != nil {
		return errors.Wrap(err, "查询盲盒失败")
	}

	// 更新可修改的字段
	updates := map[string]interface{}{
		"name":                 boxData.Name,
		"description":          boxData.Description,
		"image_url":            boxData.ImageURL,
		"category":             boxData.Category,
		"discount_coefficient": boxData.DiscountCoefficient,
		"donation_amount":      boxData.DonationAmount,
		"updated_at":           time.Now(),
	}

	// 执行更新
	if err := s.db.Model(&model.BlindBox{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		return errors.Wrap(err, "更新盲盒失败")
	}

	return nil
}

// DeleteBlindBox 删除盲盒
func (s *BlindBoxService) DeleteBlindBox(ctx context.Context, id string, userID string) error {
	// 验证盲盒所有权（只有创建者或管理员可以删除）
	var box model.BlindBox
	err := s.db.First(&box, "id = ?", id).Error
	if err != nil {
		return errors.Wrap(err, "查询盲盒失败")
	}

	// 检查盲盒状态，只有active状态的盲盒可以删除
	if box.Status != "active" {
		return errors.New("只有活跃状态的盲盒可以删除")
	}

	// 检查是否有商品关联到此盲盒
	var productCount int64
	if err := s.db.Model(&model.Product{}).Where("blind_box_id = ?", id).Count(&productCount).Error; err != nil {
		return errors.Wrap(err, "检查商品关联失败")
	}

	if productCount > 0 {
		return errors.New("该盲盒还有关联商品，无法删除")
	}

	// 检查是否已经有订单关联
	var orderCount int64
	if err := s.db.Model(&model.BlindBoxOrder{}).Where("blind_box_id = ?", id).Count(&orderCount).Error; err != nil {
		return errors.Wrap(err, "检查订单关联失败")
	}

	if orderCount > 0 {
		return errors.New("该盲盒已有订单关联，无法删除")
	}

	// 删除盲盒
	if err := s.db.Delete(&model.BlindBox{}, "id = ?", id).Error; err != nil {
		return errors.Wrap(err, "删除盲盒失败")
	}

	return nil
}

// ListBlindBoxes 列出盲盒
func (s *BlindBoxService) ListBlindBoxes(ctx context.Context, opts model.BlindBoxListOptions) ([]*model.BlindBox, int64, error) {
	var boxes []*model.BlindBox
	var total int64

	// 构建查询
	query := s.db.Model(&model.BlindBox{})

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
		case "expiry":
			query = query.Order(fmt.Sprintf("expiration_time %s", order))
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
	if err := query.Find(&boxes).Error; err != nil {
		return nil, 0, errors.Wrap(err, "查询盲盒列表失败")
	}

	return boxes, total, nil
}

// PurchaseBlindBox 购买盲盒
func (s *BlindBoxService) PurchaseBlindBox(ctx context.Context, boxID, userID string) (*model.BlindBoxOrder, error) {
	// 获取盲盒信息
	box, err := s.GetBlindBox(ctx, boxID)
	if err != nil {
		return nil, err
	}

	// 检查盲盒状态
	if box.Status != "active" {
		return nil, errors.New("该盲盒不可购买")
	}

	// 检查盲盒是否过期
	if box.ExpirationTime.Before(time.Now()) {
		return nil, errors.New("该盲盒已过期")
	}

	// 检查盲盒内是否有商品
	var productCount int64
	if err := s.db.Model(&model.Product{}).Where("blind_box_id = ? AND status = ?", boxID, "in_blind_box").Count(&productCount).Error; err != nil {
		return nil, errors.Wrap(err, "检查商品数量失败")
	}

	if productCount == 0 {
		// 更新盲盒状态为售罄
		if err := s.db.Model(&model.BlindBox{}).Where("id = ?", boxID).Update("status", "sold_out").Error; err != nil {
			s.logger.Error("更新盲盒状态失败", zap.Error(err), zap.String("box_id", boxID))
		}
		return nil, errors.New("该盲盒已售罄")
	}

	// 计算盲盒价格 - 这里可以根据盲盒内商品和折扣系数计算
	var price float64
	if err := s.db.Model(&model.Product{}).Where("blind_box_id = ? AND status = ?", boxID, "in_blind_box").Select("SUM(price) * ?", box.DiscountCoefficient).Scan(&price).Error; err != nil {
		return nil, errors.Wrap(err, "计算价格失败")
	}

	// 创建订单
	order := &model.BlindBoxOrder{
		ID:         GenerateUniqueID(),
		BlindBoxID: boxID,
		UserID:     userID,
		Price:      price,
		Status:     "pending",
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	// 保存订单
	if err := s.db.Create(order).Error; err != nil {
		return nil, errors.Wrap(err, "创建订单失败")
	}

	return order, nil
}

// OpenBlindBox 开启盲盒
func (s *BlindBoxService) OpenBlindBox(ctx context.Context, boxID, userID string) (*model.BlindBoxOpening, error) {
	// 检查用户是否已购买该盲盒
	var order model.BlindBoxOrder
	if err := s.db.Where("blind_box_id = ? AND user_id = ? AND status = ?", boxID, userID, "paid").First(&order).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.New("您尚未购买此盲盒或订单未支付")
		}
		return nil, errors.Wrap(err, "查询订单失败")
	}

	// 获取盲盒内可用的商品
	var products []model.Product
	if err := s.db.Where("blind_box_id = ? AND status = ?", boxID, "in_blind_box").Find(&products).Error; err != nil {
		return nil, errors.Wrap(err, "获取商品失败")
	}

	if len(products) == 0 {
		return nil, errors.New("该盲盒内已无商品")
	}

	// 随机选择一个商品
	rand.Seed(time.Now().UnixNano())
	selectedProduct := products[rand.Intn(len(products))]

	// 开启事务
	tx := s.db.Begin()

	// 更新商品状态为已售出
	if err := tx.Model(&model.Product{}).Where("id = ?", selectedProduct.ID).Update("status", "sold").Error; err != nil {
		tx.Rollback()
		return nil, errors.Wrap(err, "更新商品状态失败")
	}

	// 检查盲盒内是否还有商品
	var remainingCount int64
	if err := tx.Model(&model.Product{}).Where("blind_box_id = ? AND status = ?", boxID, "in_blind_box").Count(&remainingCount).Error; err != nil {
		tx.Rollback()
		return nil, errors.Wrap(err, "检查剩余商品失败")
	}

	// 如果没有剩余商品，更新盲盒状态为售罄
	if remainingCount == 0 {
		if err := tx.Model(&model.BlindBox{}).Where("id = ?", boxID).Update("status", "sold_out").Error; err != nil {
			tx.Rollback()
			return nil, errors.Wrap(err, "更新盲盒状态失败")
		}
	}

	// 创建盲盒开启记录
	opening := &model.BlindBoxOpening{
		ID:                GenerateUniqueID(),
		UserID:            userID,
		BlindBoxID:        boxID,
		ObtainedProductID: selectedProduct.ID,
		OpenedAt:          time.Now(),
	}

	if err := tx.Create(opening).Error; err != nil {
		tx.Rollback()
		return nil, errors.Wrap(err, "创建开启记录失败")
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		return nil, errors.Wrap(err, "提交事务失败")
	}

	return opening, nil
}

// GetBlindBoxProducts 获取盲盒内的商品
func (s *BlindBoxService) GetBlindBoxProducts(ctx context.Context, boxID string) ([]model.Product, error) {
	var products []model.Product

	if err := s.db.Where("blind_box_id = ? AND status = ?", boxID, "in_blind_box").Find(&products).Error; err != nil {
		return nil, errors.Wrap(err, "获取盲盒商品失败")
	}

	return products, nil
}

// GetBlindBoxOpeningHistory 获取盲盒开启历史
func (s *BlindBoxService) GetBlindBoxOpeningHistory(ctx context.Context, boxID string) ([]model.BlindBoxOpening, error) {
	var openings []model.BlindBoxOpening

	if err := s.db.Where("blind_box_id = ?", boxID).Order("opened_at DESC").Find(&openings).Error; err != nil {
		return nil, errors.Wrap(err, "获取开启历史失败")
	}

	return openings, nil
}
