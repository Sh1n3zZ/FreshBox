package vision

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

// VisionMessage 图像识别消息
type VisionMessage struct {
	ImageID     string `json:"image_id"`
	ImageData   []byte `json:"image_data"`
	UserID      string `json:"user_id"`
	BoxID       string `json:"box_id,omitempty"`
	ImageFormat string `json:"image_format"`
	AutoRotate  bool   `json:"auto_rotate"`
	Timestamp   int64  `json:"timestamp"`
}

// VisionMQHandler 图像识别消息处理器
type VisionMQHandler struct {
	mqClient   *mq.MQClient
	ocrService *OCRService
	logger     *zap.Logger
}

// NewVisionMQHandler 创建图像识别消息处理器
func NewVisionMQHandler(mqClient *mq.MQClient, ocrService *OCRService, logger *zap.Logger) *VisionMQHandler {
	return &VisionMQHandler{
		mqClient:   mqClient,
		ocrService: ocrService,
		logger:     logger,
	}
}

// SendImageRecognitionTask 发送图像识别任务
func (h *VisionMQHandler) SendImageRecognitionTask(ctx context.Context, imageID string, imageData []byte, userID string) error {
	msg := &VisionMessage{
		ImageID:     imageID,
		ImageData:   imageData,
		UserID:      userID,
		ImageFormat: "jpg", // 默认格式
		AutoRotate:  true,  // 默认自动旋转
		Timestamp:   time.Now().Unix(),
	}

	data, err := json.Marshal(msg)
	if err != nil {
		return errors.Wrap(err, "序列化图像识别消息失败")
	}

	mqMsg := &primitive.Message{
		Topic: mq.TopicVision,
		Body:  data,
	}
	mqMsg.WithTag(mq.TagVisionRecognize)

	_, err = h.mqClient.Producer.SendSync(ctx, mqMsg)
	if err != nil {
		return errors.Wrap(err, "发送图像识别消息失败")
	}

	h.logger.Info("已发送图像识别任务", zap.String("imageID", imageID))
	return nil
}

// StartConsume 开始消费图像识别消息
func (h *VisionMQHandler) StartConsume() error {
	err := h.mqClient.PushConsumer.Subscribe(mq.TopicVision, consumer.MessageSelector{
		Type:       consumer.TAG,
		Expression: mq.TagVisionRecognize,
	}, h.handleVisionMessage)

	if err != nil {
		return errors.Wrap(err, "订阅图像识别主题失败")
	}

	return h.mqClient.PushConsumer.Start()
}

// handleVisionMessage 处理图像识别消息
func (h *VisionMQHandler) handleVisionMessage(ctx context.Context, msgs ...*primitive.MessageExt) (consumer.ConsumeResult, error) {
	for i := range msgs {
		var visionMsg VisionMessage
		if err := json.Unmarshal(msgs[i].Body, &visionMsg); err != nil {
			h.logger.Error("解析图像识别消息失败", zap.Error(err))
			continue
		}

		h.logger.Info("处理图像识别消息", zap.String("imageID", visionMsg.ImageID))

		// 调用OCR识别服务
		ocrResult, err := h.ocrService.ProcessImage(ctx, visionMsg.ImageData, visionMsg.ImageFormat, visionMsg.AutoRotate)
		if err != nil {
			h.logger.Error("OCR识别失败", zap.Error(err), zap.String("imageID", visionMsg.ImageID))
			// 失败后可以重试或记录
			continue
		}

		// 处理识别结果，这里可以存储到数据库或发送新的消息通知
		h.logger.Info("OCR识别成功",
			zap.String("imageID", visionMsg.ImageID),
			zap.Int("文本块数量", len(ocrResult.TextBlocks)),
		)

		// 记录识别到的文本
		for i, block := range ocrResult.TextBlocks {
			h.logger.Debug("识别文本",
				zap.Int("index", i),
				zap.String("text", block.Text),
				zap.Float32("confidence", block.Confidence),
			)
		}

		// TODO: 存储识别结果或发送后续处理消息
	}

	return consumer.ConsumeSuccess, nil
}
