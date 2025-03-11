package service

import (
	"context"
	"time"

	"github.com/pkg/errors"
	"gorm.io/gorm"

	"FreshBox/internal/core/pricing"
	"FreshBox/internal/core/vision"
)

// Box 盲盒信息
type Box struct {
	ID          string    `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name"`
	Price       float64   `json:"price"`
	Description string    `json:"description"`
	ImageURL    string    `json:"image_url"`
	ExpiryDate  time.Time `json:"expiry_date"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// BoxService 盲盒服务
type BoxService struct {
	db            *gorm.DB
	pricingEngine pricing.Engine
	visionService vision.Recognition
}

// NewBoxService 创建盲盒服务
func NewBoxService(db *gorm.DB, pricingEngine pricing.Engine, visionService vision.Recognition) *BoxService {
	return &BoxService{
		db:            db,
		pricingEngine: pricingEngine,
		visionService: visionService,
	}
}

// CreateBox 创建盲盒
func (s *BoxService) CreateBox(ctx context.Context, box *Box, imageData []byte) error {
	// 使用计算机视觉服务识别商品
	productInfo, err := s.visionService.DetectProduct(ctx, imageData)
	if err != nil {
		return errors.Wrap(err, "识别商品失败")
	}

	// 计算动态价格
	price, err := s.pricingEngine.CalculatePrice(ctx, productInfo.ExpiryDate, box.Price)
	if err != nil {
		return errors.Wrap(err, "计算价格失败")
	}

	// 设置盲盒信息
	box.Price = price
	box.ExpiryDate = productInfo.ExpiryDate
	box.CreatedAt = time.Now()
	box.UpdatedAt = time.Now()

	// 保存到数据库
	if err := s.db.Create(box).Error; err != nil {
		return errors.Wrap(err, "保存盲盒失败")
	}

	// 缓存价格
	if err := s.pricingEngine.UpdatePriceCache(ctx, box.ID, price); err != nil {
		return errors.Wrap(err, "更新价格缓存失败")
	}

	return nil
}

// GetBox 获取盲盒详情
func (s *BoxService) GetBox(ctx context.Context, id string) (*Box, error) {
	var box Box
	if err := s.db.First(&box, "id = ?", id).Error; err != nil {
		return nil, errors.Wrap(err, "查询盲盒失败")
	}

	// 获取最新价格
	price, err := s.pricingEngine.GetCachedPrice(ctx, id)
	if err == nil {
		box.Price = price
	}

	return &box, nil
}

// ListBoxes 列出盲盒
func (s *BoxService) ListBoxes(ctx context.Context, page, size int) ([]*Box, int64, error) {
	var boxes []*Box
	var total int64

	// 查询总数
	if err := s.db.Model(&Box{}).Count(&total).Error; err != nil {
		return nil, 0, errors.Wrap(err, "查询总数失败")
	}

	// 分页查询
	if err := s.db.Offset((page - 1) * size).Limit(size).Find(&boxes).Error; err != nil {
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

// Order 订单信息
type Order struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	BoxID     string    `json:"box_id"`
	UserID    string    `json:"user_id"`
	Price     float64   `json:"price"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// PurchaseBox 购买盲盒
func (s *BoxService) PurchaseBox(ctx context.Context, boxID, userID string) (*Order, error) {
	// 获取盲盒信息
	box, err := s.GetBox(ctx, boxID)
	if err != nil {
		return nil, err
	}

	// 创建订单
	order := &Order{
		ID:        GenerateID(), // 需要实现ID生成函数
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
