package vision

import (
	"context"
	"fmt"
	"time"

	"github.com/spf13/viper"
)

// Service 实现OCR服务
type Service struct {
	recognizer OCRService
}

// NewService 创建OCR服务实例
func NewService() (*Service, error) {
	// 从配置文件中读取OpenAI相关配置
	apiKey := viper.GetString("vision.openai.api_key")
	endpoint := viper.GetString("vision.openai.endpoint")
	modelName := viper.GetString("vision.openai.model")
	maxTokens := viper.GetInt("vision.openai.max_tokens")
	timeoutSec := viper.GetInt("vision.openai.timeout_sec")

	if apiKey == "" {
		return nil, fmt.Errorf("vision.openai.api_key 配置缺失")
	}

	if modelName == "" {
		return nil, fmt.Errorf("vision.openai.model 配置缺失")
	}

	// 默认值处理
	if maxTokens <= 0 {
		maxTokens = 1000
	}

	if timeoutSec <= 0 {
		timeoutSec = 30
	}

	// 创建配置
	config := Config{
		APIKey:     apiKey,
		Endpoint:   endpoint,
		ModelName:  modelName,
		MaxTokens:  maxTokens,
		TimeoutSec: timeoutSec,
	}

	// 创建识别器
	recognizer, err := NewOCRRecognizer(config)
	if err != nil {
		return nil, fmt.Errorf("无法创建OCR识别器: %w", err)
	}

	return &Service{
		recognizer: recognizer,
	}, nil
}

// RecognizeImage 识别图像中的文本
func (s *Service) RecognizeImage(ctx context.Context, imageData []byte) (string, error) {
	// 设置超时上下文，避免长时间阻塞
	ctx, cancel := context.WithTimeout(ctx, 60*time.Second)
	defer cancel()

	// 调用底层识别器进行识别
	return s.recognizer.RecognizeImage(ctx, imageData)
}
