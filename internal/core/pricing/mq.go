package pricing

import (
	"context"
	"encoding/json"
	"time"

	"github.com/apache/rocketmq-client-go/v2/consumer"
	"github.com/apache/rocketmq-client-go/v2/primitive"
	"github.com/pkg/errors"
	"go.uber.org/zap"

	"FreshBox/internal/pkg/mq"
)

// PriceUpdateMessage 价格更新消息
type PriceUpdateMessage struct {
	ProductID     string    `json:"product_id"`
	ExpiryTime    time.Time `json:"expiry_time"`
	OriginalPrice float64   `json:"original_price"`
	Timestamp     int64     `json:"timestamp"`
}

// PriceMQHandler 价格消息处理器
type PriceMQHandler struct {
	mqClient      *mq.MQClient
	pricingEngine Engine
	logger        *zap.Logger
}

// NewPriceMQHandler 创建价格消息处理器
func NewPriceMQHandler(mqClient *mq.MQClient, pricingEngine Engine, logger *zap.Logger) *PriceMQHandler {
	return &PriceMQHandler{
		mqClient:      mqClient,
		pricingEngine: pricingEngine,
		logger:        logger,
	}
}

// SendPriceUpdateTask 发送价格更新任务
func (h *PriceMQHandler) SendPriceUpdateTask(ctx context.Context, productID string, expiryTime time.Time, originalPrice float64) error {
	msg := &PriceUpdateMessage{
		ProductID:     productID,
		ExpiryTime:    expiryTime,
		OriginalPrice: originalPrice,
		Timestamp:     time.Now().Unix(),
	}

	data, err := json.Marshal(msg)
	if err != nil {
		return errors.Wrap(err, "序列化价格更新消息失败")
	}

	mqMsg := &primitive.Message{
		Topic: mq.TopicPricing,
		Body:  data,
	}
	mqMsg.WithTag(mq.TagPriceUpdate)

	_, err = h.mqClient.Producer.SendSync(ctx, mqMsg)
	if err != nil {
		return errors.Wrap(err, "发送价格更新消息失败")
	}

	h.logger.Info("已发送价格更新任务", zap.String("productID", productID))
	return nil
}

// StartConsume 开始消费价格更新消息
func (h *PriceMQHandler) StartConsume() error {
	err := h.mqClient.PushConsumer.Subscribe(mq.TopicPricing, consumer.MessageSelector{
		Type:       consumer.TAG,
		Expression: mq.TagPriceUpdate,
	}, h.handlePriceMessage)

	if err != nil {
		return errors.Wrap(err, "订阅价格更新主题失败")
	}

	return h.mqClient.PushConsumer.Start()
}

// handlePriceMessage 处理价格更新消息
func (h *PriceMQHandler) handlePriceMessage(ctx context.Context, msgs ...*primitive.MessageExt) (consumer.ConsumeResult, error) {
	for i := range msgs {
		var priceMsg PriceUpdateMessage
		if err := json.Unmarshal(msgs[i].Body, &priceMsg); err != nil {
			h.logger.Error("解析价格更新消息失败", zap.Error(err))
			continue
		}

		h.logger.Info("处理价格更新消息", zap.String("productID", priceMsg.ProductID))

		// 调用价格引擎计算新价格
		newPrice, err := h.pricingEngine.CalculatePrice(ctx, priceMsg.ExpiryTime, priceMsg.OriginalPrice)
		if err != nil {
			h.logger.Error("计算价格失败", zap.Error(err), zap.String("productID", priceMsg.ProductID))
			continue
		}

		// 更新价格缓存
		if err := h.pricingEngine.UpdatePriceCache(ctx, priceMsg.ProductID, newPrice); err != nil {
			h.logger.Error("更新价格缓存失败", zap.Error(err), zap.String("productID", priceMsg.ProductID))
			continue
		}

		h.logger.Info("价格更新成功",
			zap.String("productID", priceMsg.ProductID),
			zap.Float64("originalPrice", priceMsg.OriginalPrice),
			zap.Float64("newPrice", newPrice),
		)

		// TODO: 可能需要发送价格变动通知
	}

	return consumer.ConsumeSuccess, nil
}
