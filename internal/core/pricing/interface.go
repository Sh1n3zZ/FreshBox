package pricing

import (
	"context"
	"time"
)

// Engine 定义动态定价引擎接口
type Engine interface {
	// CalculatePrice 计算商品价格
	// expiryTime: 过期时间
	// originalPrice: 原始价格
	CalculatePrice(ctx context.Context, expiryTime time.Time, originalPrice float64) (float64, error)

	// GetCachedPrice 获取缓存的价格
	GetCachedPrice(ctx context.Context, productID string) (float64, error)

	// UpdatePriceCache 更新价格缓存
	UpdatePriceCache(ctx context.Context, productID string, price float64) error
}

// DiscountStrategy 折扣策略接口
type DiscountStrategy interface {
	// CalculateDiscount 计算折扣系数
	CalculateDiscount(remainingHours float64) float64
}
