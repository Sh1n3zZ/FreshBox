package mq

import (
	"github.com/apache/rocketmq-client-go/v2"
	"github.com/apache/rocketmq-client-go/v2/consumer"
	"github.com/apache/rocketmq-client-go/v2/producer"
	"github.com/pkg/errors"
	"github.com/spf13/viper"
)

// MQClient RocketMQ客户端
type MQClient struct {
	Producer     rocketmq.Producer
	PushConsumer rocketmq.PushConsumer
}

// NewMQClient 创建RocketMQ客户端
func NewMQClient() (*MQClient, error) {
	// 读取RocketMQ配置
	namesrvAddrs := []string{viper.GetString("rocketmq.nameserver")}
	groupName := viper.GetString("rocketmq.producer.group")

	// 创建生产者
	p, err := rocketmq.NewProducer(
		producer.WithNameServer(namesrvAddrs),
		producer.WithGroupName(groupName),
		producer.WithRetry(2),
	)
	if err != nil {
		return nil, errors.Wrap(err, "创建RocketMQ生产者失败")
	}

	// 启动生产者
	if err := p.Start(); err != nil {
		return nil, errors.Wrap(err, "启动RocketMQ生产者失败")
	}

	// 创建消费者
	c, err := rocketmq.NewPushConsumer(
		consumer.WithNameServer(namesrvAddrs),
		consumer.WithGroupName(viper.GetString("rocketmq.consumer.group")),
	)
	if err != nil {
		return nil, errors.Wrap(err, "创建RocketMQ消费者失败")
	}

	return &MQClient{
		Producer:     p,
		PushConsumer: c,
	}, nil
}

// Close 关闭MQ连接
func (c *MQClient) Close() error {
	if err := c.Producer.Shutdown(); err != nil {
		return errors.Wrap(err, "关闭RocketMQ生产者失败")
	}

	if c.PushConsumer != nil {
		if err := c.PushConsumer.Shutdown(); err != nil {
			return errors.Wrap(err, "关闭RocketMQ消费者失败")
		}
	}

	return nil
}
