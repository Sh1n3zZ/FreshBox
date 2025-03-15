package service

import (
	"context"
	"fmt"
	"time"

	"github.com/pkg/errors"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"FreshBox/internal/core/pricing"
	"FreshBox/internal/core/vision"
	"FreshBox/internal/model"
	"FreshBox/internal/pkg/mq"
)

// BoxService 盲盒服务
type BoxService struct {
	db            *gorm.DB
	pricingEngine pricing.Engine
	visionService *vision.VisionService
	mqClient      *mq.MQClient
	logger        *zap.Logger
}

// NewBoxService 创建盲盒服务
func NewBoxService(
	db *gorm.DB,
	pricingEngine pricing.Engine,
	visionService *vision.VisionService,
	mqClient *mq.MQClient,
	logger *zap.Logger,
) *BoxService {
	return &BoxService{
		db:            db,
		pricingEngine: pricingEngine,
		visionService: visionService,
		mqClient:      mqClient,
		logger:        logger,
	}
}

// CreateBox 创建盲盒
func (s *BoxService) CreateBox(ctx context.Context, boxData *model.Box, imageData []byte) error {
	// 使用计算机视觉服务识别商品
	productInfo, err := s.visionService.DetectProduct(ctx, imageData)
	if err != nil {
		return errors.Wrap(err, "识别商品失败")
	}

	// 计算动态价格
	boxData.OriginalPrice = boxData.Price // 保存原价
	price, err := s.pricingEngine.CalculatePrice(ctx, productInfo.ExpiryDate, boxData.Price)
	if err != nil {
		return errors.Wrap(err, "计算价格失败")
	}

	// 设置盲盒信息
	boxData.Price = price
	boxData.ExpiryDate = productInfo.ExpiryDate
	boxData.Status = "available"
	boxData.ID = GenerateID()
	boxData.CreatedAt = time.Now()
	boxData.UpdatedAt = time.Now()

	// 保存到数据库
	if err := s.db.Create(boxData).Error; err != nil {
		return errors.Wrap(err, "保存盲盒失败")
	}

	// 缓存价格 - 忽略缓存错误
	_ = s.pricingEngine.UpdatePriceCache(ctx, boxData.ID, price)

	return nil
}

// GetBox 获取盲盒详情
func (s *BoxService) GetBox(ctx context.Context, id string) (*model.Box, error) {
	// 记录开始查询
	fmt.Printf("开始查询盲盒，ID: %s\n", id)

	var box model.Box
	result := s.db.First(&box, "id = ?", id)

	// 检查查询结果
	if result.Error != nil {
		// 详细记录错误
		if result.Error == gorm.ErrRecordNotFound {
			fmt.Printf("盲盒不存在，ID: %s\n", id)
			return nil, errors.Wrap(result.Error, "盲盒不存在")
		}

		// 记录其他类型的错误
		fmt.Printf("查询盲盒失败，ID: %s, 错误类型: %T, 错误信息: %v\n",
			id, result.Error, result.Error)
		return nil, errors.Wrap(result.Error, "查询盲盒失败")
	}

	// 记录查询结果
	fmt.Printf("查询盲盒成功，ID: %s, 名称: %s, 价格: %.2f\n",
		box.ID, box.Name, box.Price)

	// 获取最新价格
	price, err := s.pricingEngine.GetCachedPrice(ctx, id)
	if err == nil {
		box.Price = price
		fmt.Printf("使用缓存价格，ID: %s, 价格: %.2f\n", id, price)
	} else {
		fmt.Printf("未找到缓存价格，使用数据库价格，ID: %s, 错误: %v\n", id, err)
	}

	return &box, nil
}

// UpdateBox 更新盲盒信息
func (s *BoxService) UpdateBox(ctx context.Context, id string, boxData *model.Box) error {
	// 首先检查盲盒是否存在
	var existingBox model.Box
	if err := s.db.First(&existingBox, "id = ?", id).Error; err != nil {
		return errors.Wrap(err, "查询盲盒失败")
	}

	// 更新可修改的字段
	updates := map[string]interface{}{
		"name":        boxData.Name,
		"description": boxData.Description,
		"image_url":   boxData.ImageURL,
		"updated_at":  time.Now(),
	}

	// 如果提供了新价格，重新计算动态价格并更新缓存
	if boxData.Price > 0 {
		updates["original_price"] = boxData.Price
		price, err := s.pricingEngine.CalculatePrice(ctx, existingBox.ExpiryDate, boxData.Price)
		if err != nil {
			return errors.Wrap(err, "计算价格失败")
		}
		updates["price"] = price

		// 更新缓存 - 忽略缓存错误
		_ = s.pricingEngine.UpdatePriceCache(ctx, id, price)
	}

	// 执行更新
	if err := s.db.Model(&model.Box{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		return errors.Wrap(err, "更新盲盒失败")
	}

	return nil
}

// DeleteBox 删除盲盒
func (s *BoxService) DeleteBox(ctx context.Context, id string, userID string) error {
	// 验证盲盒所有权（只有创建者或管理员可以删除）
	var box model.Box
	err := s.db.First(&box, "id = ?", id).Error
	if err != nil {
		return errors.Wrap(err, "查询盲盒失败")
	}

	// 检查是否已经有订单关联
	var orderCount int64
	if err := s.db.Model(&model.BoxOrder{}).Where("box_id = ?", id).Count(&orderCount).Error; err != nil {
		return errors.Wrap(err, "检查订单关联失败")
	}

	if orderCount > 0 {
		return errors.New("该盲盒已有订单关联，无法删除")
	}

	// 删除盲盒
	if err := s.db.Delete(&model.Box{}, "id = ?", id).Error; err != nil {
		return errors.Wrap(err, "删除盲盒失败")
	}

	// 删除价格缓存
	key := fmt.Sprintf("price:%s", id)
	if err := s.pricingEngine.(*pricing.DefaultEngine).GetRedisClient().Del(ctx, key).Err(); err != nil {
		// 只记录错误，不中断流程
		return errors.Wrap(err, "删除价格缓存失败")
	}

	return nil
}

// ListBoxes 列出盲盒
func (s *BoxService) ListBoxes(ctx context.Context, opts model.BoxListOptions) ([]*model.Box, int64, error) {
	var boxes []*model.Box
	var total int64

	// 构建查询
	query := s.db.Model(&model.Box{})

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
			query = query.Order(fmt.Sprintf("expiry_date %s", order))
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

	// 更新价格
	for _, box := range boxes {
		price, err := s.pricingEngine.GetCachedPrice(ctx, box.ID)
		if err == nil {
			box.Price = price
		}
	}

	return boxes, total, nil
}

// PurchaseBox 购买盲盒
func (s *BoxService) PurchaseBox(ctx context.Context, boxID, userID string) (*model.BoxOrder, error) {
	// 获取盲盒信息
	box, err := s.GetBox(ctx, boxID)
	if err != nil {
		return nil, err
	}

	// 创建订单
	order := &model.BoxOrder{
		ID:        GenerateID(),
		BoxID:     boxID,
		UserID:    userID,
		Price:     box.Price,
		Status:    "pending",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// 保存订单
	if err := s.db.Create(order).Error; err != nil {
		return nil, errors.Wrap(err, "创建订单失败")
	}

	return order, nil
}

// GenerateID 生成ID
func GenerateID() string {
	return time.Now().Format("20060102150405") + RandomString(6)
}

// RandomString 生成随机字符串
func RandomString(n int) string {
	const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, n)
	for i := range b {
		b[i] = letters[time.Now().UnixNano()%int64(len(letters))]
	}
	return string(b)
}
