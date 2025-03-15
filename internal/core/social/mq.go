package social

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

// TaskMessage 任务消息
type TaskMessage struct {
	TaskID    string     `json:"task_id"`
	UserID    string     `json:"user_id"`
	Type      string     `json:"type"`
	Status    TaskStatus `json:"status"`
	Progress  float64    `json:"progress,omitempty"`
	Timestamp int64      `json:"timestamp"`
}

// TaskMQHandler 任务消息处理器
type TaskMQHandler struct {
	mqClient    *mq.MQClient
	taskManager TaskManager
	logger      *zap.Logger
}

// NewTaskMQHandler 创建任务消息处理器
func NewTaskMQHandler(mqClient *mq.MQClient, taskManager TaskManager, logger *zap.Logger) *TaskMQHandler {
	return &TaskMQHandler{
		mqClient:    mqClient,
		taskManager: taskManager,
		logger:      logger,
	}
}

// SendTaskStatusUpdate 发送任务状态更新消息
func (h *TaskMQHandler) SendTaskStatusUpdate(ctx context.Context, taskID, userID string, status TaskStatus) error {
	msg := &TaskMessage{
		TaskID:    taskID,
		UserID:    userID,
		Status:    status,
		Timestamp: time.Now().Unix(),
	}

	data, err := json.Marshal(msg)
	if err != nil {
		return errors.Wrap(err, "序列化任务状态消息失败")
	}

	mqMsg := &primitive.Message{
		Topic: mq.TopicTask,
		Body:  data,
	}
	mqMsg.WithTag(mq.TagTaskUpdate)

	_, err = h.mqClient.Producer.SendSync(ctx, mqMsg)
	if err != nil {
		return errors.Wrap(err, "发送任务状态消息失败")
	}

	h.logger.Info("已发送任务状态更新消息",
		zap.String("taskID", taskID),
		zap.String("status", string(status)),
	)
	return nil
}

// SendTaskComplete 发送任务完成消息
func (h *TaskMQHandler) SendTaskComplete(ctx context.Context, taskID, userID string) error {
	msg := &TaskMessage{
		TaskID:    taskID,
		UserID:    userID,
		Status:    TaskStatusCompleted,
		Timestamp: time.Now().Unix(),
	}

	data, err := json.Marshal(msg)
	if err != nil {
		return errors.Wrap(err, "序列化任务完成消息失败")
	}

	mqMsg := &primitive.Message{
		Topic: mq.TopicTask,
		Body:  data,
	}
	mqMsg.WithTag(mq.TagTaskComplete)

	_, err = h.mqClient.Producer.SendSync(ctx, mqMsg)
	if err != nil {
		return errors.Wrap(err, "发送任务完成消息失败")
	}

	h.logger.Info("已发送任务完成消息", zap.String("taskID", taskID))
	return nil
}

// StartConsume 开始消费任务消息
func (h *TaskMQHandler) StartConsume() error {
	err := h.mqClient.PushConsumer.Subscribe(mq.TopicTask, consumer.MessageSelector{
		Type:       consumer.TAG,
		Expression: mq.TagTaskUpdate + "||" + mq.TagTaskComplete,
	}, h.handleTaskMessage)

	if err != nil {
		return errors.Wrap(err, "订阅任务消息主题失败")
	}

	return h.mqClient.PushConsumer.Start()
}

// handleTaskMessage 处理任务消息
func (h *TaskMQHandler) handleTaskMessage(ctx context.Context, msgs ...*primitive.MessageExt) (consumer.ConsumeResult, error) {
	for i := range msgs {
		var taskMsg TaskMessage
		if err := json.Unmarshal(msgs[i].Body, &taskMsg); err != nil {
			h.logger.Error("解析任务消息失败", zap.Error(err))
			continue
		}

		h.logger.Info("处理任务消息",
			zap.String("taskID", taskMsg.TaskID),
			zap.String("tag", msgs[i].GetTags()),
		)

		switch msgs[i].GetTags() {
		case mq.TagTaskUpdate:
			// 更新任务状态
			if err := h.taskManager.UpdateTaskStatus(ctx, taskMsg.TaskID, taskMsg.Status); err != nil {
				h.logger.Error("更新任务状态失败", zap.Error(err), zap.String("taskID", taskMsg.TaskID))
				continue
			}

		case mq.TagTaskComplete:
			// // 处理任务完成逻辑
			// // 这里可以添加奖励积分等逻辑
			// progress := &TaskProgress{
			// 	TaskID:    taskMsg.TaskID,
			// 	Status:    TaskStatusCompleted,
			// 	Progress:  100,
			// 	UpdatedAt: time.Now(),
			// }

			// 在实际应用中，需要将这个进度保存到数据库
			h.logger.Info("任务完成",
				zap.String("taskID", taskMsg.TaskID),
				zap.String("userID", taskMsg.UserID),
			)
		}
	}

	return consumer.ConsumeSuccess, nil
}
