package pricing

import (
	"context"
	"fmt"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/pkg/errors"
)

// DefaultEngine 默认的动态定价引擎实现
type DefaultEngine struct {
	rdb              *redis.Client
	discountStrategy DiscountStrategy
	cacheTTL         time.Duration
}

// NewDefaultEngine 创建新的动态定价引擎
func NewDefaultEngine(rdb *redis.Client, strategy DiscountStrategy) *DefaultEngine {
	return &DefaultEngine{
		rdb:              rdb,
		discountStrategy: strategy,
		cacheTTL:         24 * time.Hour, // 默认缓存24小时
	}
}

// CalculatePrice 计算商品价格
func (e *DefaultEngine) CalculatePrice(ctx context.Context, expiryTime time.Time, originalPrice float64) (float64, error) {
	// 计算剩余小时数
	remainingHours := time.Until(expiryTime).Hours()
	if remainingHours <= 0 {
		return 0, errors.New("商品已过期")
	}

	// 计算折扣系数
	discount := e.discountStrategy.CalculateDiscount(remainingHours)

	// 计算最终价格
	finalPrice := originalPrice * discount

	// 设置最低价格限制（原价的1%）
	minPrice := originalPrice * 0.01
	if finalPrice < minPrice {
		finalPrice = minPrice
	}

	return finalPrice, nil
}

// GetCachedPrice 获取缓存的价格
func (e *DefaultEngine) GetCachedPrice(ctx context.Context, productID string) (float64, error) {
	key := fmt.Sprintf("price:%s", productID)
	price, err := e.rdb.Get(ctx, key).Float64()
	if err == redis.Nil {
		return 0, errors.New("价格缓存不存在")
	}
	if err != nil {
		return 0, errors.Wrap(err, "获取缓存价格失败")
	}
	return price, nil
}

// UpdatePriceCache 更新价格缓存
func (e *DefaultEngine) UpdatePriceCache(ctx context.Context, productID string, price float64) error {
	key := fmt.Sprintf("price:%s", productID)
	err := e.rdb.Set(ctx, key, price, e.cacheTTL).Err()
	if err != nil {
		return errors.Wrap(err, "更新价格缓存失败")
	}
	return nil
}
