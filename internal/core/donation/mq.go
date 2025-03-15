package donation

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

// DonationMessage 捐赠消息
type DonationMessage struct {
	DonationID string `json:"donation_id"`
	TxHash     string `json:"tx_hash,omitempty"`
	Status     string `json:"status"`
	Timestamp  int64  `json:"timestamp"`
}

// DonationMQHandler 捐赠消息处理器
type DonationMQHandler struct {
	mqClient          *mq.MQClient
	blockchainService BlockchainService
	logger            *zap.Logger
}

// NewDonationMQHandler 创建捐赠消息处理器
func NewDonationMQHandler(mqClient *mq.MQClient, blockchainService BlockchainService, logger *zap.Logger) *DonationMQHandler {
	return &DonationMQHandler{
		mqClient:          mqClient,
		blockchainService: blockchainService,
		logger:            logger,
	}
}

// SendDonationCreated 发送捐赠创建消息
func (h *DonationMQHandler) SendDonationCreated(ctx context.Context, donationID string) error {
	msg := &DonationMessage{
		DonationID: donationID,
		Status:     "created",
		Timestamp:  time.Now().Unix(),
	}

	data, err := json.Marshal(msg)
	if err != nil {
		return errors.Wrap(err, "序列化捐赠创建消息失败")
	}

	mqMsg := &primitive.Message{
		Topic: mq.TopicDonation,
		Body:  data,
	}
	mqMsg.WithTag(mq.TagDonationCreate)

	_, err = h.mqClient.Producer.SendSync(ctx, mqMsg)
	if err != nil {
		return errors.Wrap(err, "发送捐赠创建消息失败")
	}

	h.logger.Info("已发送捐赠创建消息", zap.String("donationID", donationID))
	return nil
}

// SendDonationConfirmed 发送捐赠确认消息
func (h *DonationMQHandler) SendDonationConfirmed(ctx context.Context, donationID, txHash string) error {
	msg := &DonationMessage{
		DonationID: donationID,
		TxHash:     txHash,
		Status:     "confirmed",
		Timestamp:  time.Now().Unix(),
	}

	data, err := json.Marshal(msg)
	if err != nil {
		return errors.Wrap(err, "序列化捐赠确认消息失败")
	}

	mqMsg := &primitive.Message{
		Topic: mq.TopicDonation,
		Body:  data,
	}
	mqMsg.WithTag(mq.TagDonationConfirm)

	_, err = h.mqClient.Producer.SendSync(ctx, mqMsg)
	if err != nil {
		return errors.Wrap(err, "发送捐赠确认消息失败")
	}

	h.logger.Info("已发送捐赠确认消息",
		zap.String("donationID", donationID),
		zap.String("txHash", txHash),
	)
	return nil
}

// StartConsume 开始消费捐赠消息
func (h *DonationMQHandler) StartConsume() error {
	err := h.mqClient.PushConsumer.Subscribe(mq.TopicDonation, consumer.MessageSelector{
		Type:       consumer.TAG,
		Expression: mq.TagDonationCreate + "||" + mq.TagDonationConfirm,
	}, h.handleDonationMessage)

	if err != nil {
		return errors.Wrap(err, "订阅捐赠消息主题失败")
	}

	return h.mqClient.PushConsumer.Start()
}

// handleDonationMessage 处理捐赠消息
func (h *DonationMQHandler) handleDonationMessage(ctx context.Context, msgs ...*primitive.MessageExt) (consumer.ConsumeResult, error) {
	for i := range msgs {
		var donationMsg DonationMessage
		if err := json.Unmarshal(msgs[i].Body, &donationMsg); err != nil {
			h.logger.Error("解析捐赠消息失败", zap.Error(err))
			continue
		}

		h.logger.Info("处理捐赠消息",
			zap.String("donationID", donationMsg.DonationID),
			zap.String("status", donationMsg.Status),
		)

		switch msgs[i].GetTags() {
		case mq.TagDonationCreate:
			// 这里可以处理捐赠创建的后续逻辑
			// 例如发送通知邮件等
			h.logger.Info("处理捐赠创建事件", zap.String("donationID", donationMsg.DonationID))

		case mq.TagDonationConfirm:
			// 捐赠确认后生成凭证
			if donationMsg.TxHash == "" {
				h.logger.Error("捐赠交易哈希为空", zap.String("donationID", donationMsg.DonationID))
				continue
			}

			proof, err := h.blockchainService.GenerateProof(ctx, donationMsg.TxHash)
			if err != nil {
				h.logger.Error("生成捐赠凭证失败",
					zap.Error(err),
					zap.String("donationID", donationMsg.DonationID),
					zap.String("txHash", donationMsg.TxHash),
				)
				continue
			}

			h.logger.Info("成功生成捐赠凭证",
				zap.String("donationID", donationMsg.DonationID),
				zap.String("proofID", proof.ProofID),
			)

			// TODO: 存储凭证、发送通知等
		}
	}

	return consumer.ConsumeSuccess, nil
}
