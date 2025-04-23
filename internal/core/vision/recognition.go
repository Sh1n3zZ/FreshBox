package vision

import (
	"context"
	"encoding/base64"
	"fmt"
	"time"

	"github.com/sashabaranov/go-openai"
)

// OCRRecognizer 实现OCR图像识别功能
type OCRRecognizer struct {
	client    *openai.Client
	config    Config
	modelName string
}

// NewOCRRecognizer 创建新的OCR识别器
func NewOCRRecognizer(config Config) (*OCRRecognizer, error) {
	clientConfig := openai.DefaultConfig(config.APIKey)

	if config.Endpoint != "" {
		clientConfig.BaseURL = config.Endpoint
	}

	client := openai.NewClientWithConfig(clientConfig)

	return &OCRRecognizer{
		client:    client,
		config:    config,
		modelName: config.ModelName,
	}, nil
}

// RecognizeImage 实现OCR图像识别逻辑
func (r *OCRRecognizer) RecognizeImage(ctx context.Context, imageData []byte) (string, error) {
	// 创建超时上下文
	timeoutDuration := time.Duration(r.config.TimeoutSec) * time.Second
	ctx, cancel := context.WithTimeout(ctx, timeoutDuration)
	defer cancel()

	// 将图像数据转换为base64编码
	base64Image := base64.StdEncoding.EncodeToString(imageData)

	// 构建Vision API请求
	req := openai.ChatCompletionRequest{
		Model: r.modelName,
		Messages: []openai.ChatCompletionMessage{
			{
				Role: openai.ChatMessageRoleUser,
				MultiContent: []openai.ChatMessagePart{
					{
						Type: openai.ChatMessagePartTypeText,
						Text: "请识别并提取这张图片中的所有文本内容",
					},
					{
						Type: openai.ChatMessagePartTypeImageURL,
						ImageURL: &openai.ChatMessageImageURL{
							URL: fmt.Sprintf("data:image/jpeg;base64,%s", base64Image),
						},
					},
				},
			},
		},
		MaxTokens: r.config.MaxTokens,
	}

	// 发送请求
	resp, err := r.client.CreateChatCompletion(ctx, req)
	if err != nil {
		return "", fmt.Errorf("OCR recognition failed: %w", err)
	}

	// 提取识别结果
	if len(resp.Choices) > 0 {
		return resp.Choices[0].Message.Content, nil
	}

	return "", fmt.Errorf("no text content recognized")
}
