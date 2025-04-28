package vision

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"time"

<<<<<<< HEAD
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

	// 解析JSON结果
	var summary OCRSummary
	if err := json.Unmarshal([]byte(resp.Choices[0].Message.Content), &summary); err != nil {
		return nil, fmt.Errorf("failed to parse OCR summary: %w", err)
	}

	return &summary, nil
=======
	pb "FreshBox/ocr/proto"

	"github.com/pkg/errors"
	"google.golang.org/grpc"
)

// GRPCRecognition OCR图像识别服务实现
type GRPCRecognition struct {
	client    pb.OCRServiceClient
	timeout   time.Duration
	threshold float32 // 置信度阈值，修改为float32以匹配proto定义
}

// NewGRPCRecognition 创建OCR图像识别服务
func NewGRPCRecognition(conn *grpc.ClientConn, timeout time.Duration, threshold float64) *GRPCRecognition {
	return &GRPCRecognition{
		client:    pb.NewOCRServiceClient(conn),
		timeout:   timeout,
		threshold: float32(threshold), // 转换为float32
	}
}

// ProcessImage 处理单个图像OCR识别
func (r *GRPCRecognition) ProcessImage(ctx context.Context, imageData []byte, imageFormat string, autoRotate bool) (*OCRResult, error) {
	ctx, cancel := context.WithTimeout(ctx, r.timeout)
	defer cancel()

	// 调用gRPC服务
	resp, err := r.client.ProcessImage(ctx, &pb.ImageRequest{
		ImageData:   imageData,
		ImageFormat: imageFormat,
		AutoRotate:  autoRotate,
	})
	if err != nil {
		return nil, errors.Wrap(err, "调用OCR服务失败")
	}

	if !resp.Success {
		return nil, errors.Errorf("OCR识别失败: %s", resp.ErrorMessage)
	}

	// 转换响应
	textBlocks := make([]TextBlock, 0, len(resp.TextBlocks))
	for _, block := range resp.TextBlocks {
		// 过滤低于阈值的结果
		if block.Confidence < r.threshold {
			continue
		}

		textBlocks = append(textBlocks, TextBlock{
			Text:       block.Text,
			Confidence: block.Confidence,
			Box: BoundingBox{
				X1: block.Box.X1,
				Y1: block.Box.Y1,
				X2: block.Box.X2,
				Y2: block.Box.Y2,
				X3: block.Box.X3,
				Y3: block.Box.Y3,
				X4: block.Box.X4,
				Y4: block.Box.Y4,
			},
		})
	}

	return &OCRResult{
		Success:    resp.Success,
		TextBlocks: textBlocks,
	}, nil
}

// ProcessBatchImages 批量处理图像OCR识别
func (r *GRPCRecognition) ProcessBatchImages(ctx context.Context, images []ImageRequest) ([]*OCRResult, error) {
	ctx, cancel := context.WithTimeout(ctx, r.timeout)
	defer cancel()

	// 准备请求
	batchRequest := &pb.BatchImageRequest{
		Images: make([]*pb.ImageRequest, 0, len(images)),
	}

	for _, img := range images {
		batchRequest.Images = append(batchRequest.Images, &pb.ImageRequest{
			ImageData:   img.ImageData,
			ImageFormat: img.ImageFormat,
			AutoRotate:  img.AutoRotate,
		})
	}

	// 调用gRPC服务
	resp, err := r.client.ProcessBatchImages(ctx, batchRequest)
	if err != nil {
		return nil, errors.Wrap(err, "调用批量OCR服务失败")
	}

	if !resp.Success {
		return nil, errors.Errorf("批量OCR识别失败: %s", resp.ErrorMessage)
	}

	// 转换响应
	results := make([]*OCRResult, 0, len(resp.Results))
	for _, result := range resp.Results {
		textBlocks := make([]TextBlock, 0)
		for _, block := range result.TextBlocks {
			// 过滤低于阈值的结果
			if block.Confidence < r.threshold {
				continue
			}

			textBlocks = append(textBlocks, TextBlock{
				Text:       block.Text,
				Confidence: block.Confidence,
				Box: BoundingBox{
					X1: block.Box.X1,
					Y1: block.Box.Y1,
					X2: block.Box.X2,
					Y2: block.Box.Y2,
					X3: block.Box.X3,
					Y3: block.Box.Y3,
					X4: block.Box.X4,
					Y4: block.Box.Y4,
				},
			})
		}

		results = append(results, &OCRResult{
			Success:    result.Success,
			TextBlocks: textBlocks,
		})
	}

	return results, nil
}

// OCRResult OCR识别结果
type OCRResult struct {
	Success    bool
	TextBlocks []TextBlock
}

// TextBlock 文本块
type TextBlock struct {
	Text       string
	Confidence float32
	Box        BoundingBox
}

// BoundingBox 边界框
type BoundingBox struct {
	X1, Y1, X2, Y2, X3, Y3, X4, Y4 float32
}

// ImageRequest 图像请求
type ImageRequest struct {
	ImageData   []byte
	ImageFormat string
	AutoRotate  bool
>>>>>>> origin/master
}
