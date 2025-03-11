package cache

import (
	"context"
	"encoding/json"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/pkg/errors"
)

// RedisCache Redis缓存实现
type RedisCache struct {
	client *redis.Client
}

// NewRedisCache 创建Redis缓存实例
func NewRedisCache(addr, password string, db int) *RedisCache {
	client := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       db,
	})

	return &RedisCache{
		client: client,
	}
}

// Set 设置缓存
func (c *RedisCache) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	data, err := json.Marshal(value)
	if err != nil {
		return errors.Wrap(err, "序列化数据失败")
	}

	if err := c.client.Set(ctx, key, data, expiration).Err(); err != nil {
		return errors.Wrap(err, "设置缓存失败")
	}

	return nil
}

// Get 获取缓存
func (c *RedisCache) Get(ctx context.Context, key string, value interface{}) error {
	data, err := c.client.Get(ctx, key).Bytes()
	if err != nil {
		if err == redis.Nil {
			return errors.New("缓存不存在")
		}
		return errors.Wrap(err, "获取缓存失败")
	}

	if err := json.Unmarshal(data, value); err != nil {
		return errors.Wrap(err, "反序列化数据失败")
	}

	return nil
}

// Delete 删除缓存
func (c *RedisCache) Delete(ctx context.Context, key string) error {
	if err := c.client.Del(ctx, key).Err(); err != nil {
		return errors.Wrap(err, "删除缓存失败")
	}
	return nil
}

// SetNX 如果key不存在则设置缓存（用于实现分布式锁）
func (c *RedisCache) SetNX(ctx context.Context, key string, value interface{}, expiration time.Duration) (bool, error) {
	data, err := json.Marshal(value)
	if err != nil {
		return false, errors.Wrap(err, "序列化数据失败")
	}

	ok, err := c.client.SetNX(ctx, key, data, expiration).Result()
	if err != nil {
		return false, errors.Wrap(err, "设置缓存失败")
	}

	return ok, nil
}

// Close 关闭连接
func (c *RedisCache) Close() error {
	return c.client.Close()
}
