package vision

import (
	"context"
	"fmt"
	"time"

	"github.com/spf13/viper"
)

<<<<<<< HEAD
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
	ocrSummaryModel := viper.GetString("vision.openai.ocr_summary_model")
	ocrSummaryPrompt := viper.GetString("vision.openai.ocr_summary_prompt")

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

	if ocrSummaryModel == "" {
		ocrSummaryModel = "gpt-4"
	}

	// 创建配置
	config := Config{
		APIKey:           apiKey,
		Endpoint:         endpoint,
		ModelName:        modelName,
		MaxTokens:        maxTokens,
		TimeoutSec:       timeoutSec,
		OCRSummaryModel:  ocrSummaryModel,
		OCRSummaryPrompt: ocrSummaryPrompt,
	}

	// 创建识别器
	recognizer, err := NewOCRRecognizer(config)
=======
// OCRService OCR服务实现
type OCRService struct {
	grpcClient    *grpc.ClientConn
	modelEndpoint string
	confidence    float32
	recognition   *GRPCRecognition
}

// NewOCRService 创建OCR服务
func NewOCRService(endpoint string, confidence float64) (*OCRService, error) {
	conn, err := grpc.Dial(endpoint, grpc.WithInsecure())
>>>>>>> origin/master
	if err != nil {
		return nil, fmt.Errorf("无法创建OCR识别器: %w", err)
	}

<<<<<<< HEAD
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

// SummarizeOCRResult 结构化处理OCR结果
func (s *Service) SummarizeOCRResult(ctx context.Context, ocrText string) (*OCRSummary, error) {
	return s.recognizer.SummarizeOCRResult(ctx, ocrText)
=======
	recognition := NewGRPCRecognition(conn, 30*time.Second, confidence)

	return &OCRService{
		grpcClient:    conn,
		modelEndpoint: endpoint,
		confidence:    float32(confidence),
		recognition:   recognition,
	}, nil
}

// ProcessImage 处理图像OCR识别
func (s *OCRService) ProcessImage(ctx context.Context, imageData []byte, imageFormat string, autoRotate bool) (*OCRResult, error) {
	return s.recognition.ProcessImage(ctx, imageData, imageFormat, autoRotate)
}

// ProcessBatchImages 批量处理图像OCR识别
func (s *OCRService) ProcessBatchImages(ctx context.Context, images []ImageRequest) ([]*OCRResult, error) {
	return s.recognition.ProcessBatchImages(ctx, images)
}

// Close 关闭gRPC连接
func (s *OCRService) Close() error {
	if s.grpcClient != nil {
		return s.grpcClient.Close()
	}
	return nil
>>>>>>> origin/master
}
