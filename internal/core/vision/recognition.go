package vision

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
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

// extractJSONFromMarkdown 从markdown代码块中提取JSON内容
func extractJSONFromMarkdown(content string) string {
	// Remove leading and trailing whitespace
	content = strings.TrimSpace(content)

	// Check if content is wrapped in markdown code block
	if strings.HasPrefix(content, "```") {
		// Use regex to extract content between ```json and ```
		re := regexp.MustCompile("```(?:json)?\n?(.*?)\n?```")
		matches := re.FindStringSubmatch(content)
		if len(matches) > 1 {
			return strings.TrimSpace(matches[1])
		}

		// Fallback: try to extract content between first ``` and last ```
		lines := strings.Split(content, "\n")
		if len(lines) > 2 {
			// Skip first line (```) and last line (```)
			return strings.Join(lines[1:len(lines)-1], "\n")
		}
	}

	// Return original content if no markdown wrapper found
	return content
}

// SummarizeOCRResult 实现OCR结果的结构化处理
func (r *OCRRecognizer) SummarizeOCRResult(ctx context.Context, ocrText string) (*OCRSummary, error) {
	// 创建超时上下文
	timeoutDuration := time.Duration(r.config.TimeoutSec) * time.Second
	ctx, cancel := context.WithTimeout(ctx, timeoutDuration)
	defer cancel()

	// 构建Chat API请求
	req := openai.ChatCompletionRequest{
		Model: r.config.OCRSummaryModel,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleSystem,
				Content: r.config.OCRSummaryPrompt,
			},
			{
				Role:    openai.ChatMessageRoleUser,
				Content: ocrText,
			},
		},
		MaxTokens: r.config.MaxTokens,
	}

	// 发送请求
	resp, err := r.client.CreateChatCompletion(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("OCR summary failed: %w", err)
	}

	// 提取识别结果
	if len(resp.Choices) == 0 {
		return nil, fmt.Errorf("no summary content generated")
	}

	// 获取响应内容并提取JSON
	responseContent := resp.Choices[0].Message.Content
	jsonContent := extractJSONFromMarkdown(responseContent)

	// 解析JSON结果
	var summary OCRSummary
	if err := json.Unmarshal([]byte(jsonContent), &summary); err != nil {
		return nil, fmt.Errorf("failed to parse OCR summary: %w, original content: %s", err, responseContent)
	}

	return &summary, nil
}
