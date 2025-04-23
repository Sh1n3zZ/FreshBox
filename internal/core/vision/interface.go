package vision

import "context"

// OCRService 定义OCR图像识别服务接口
type OCRService interface {
	// RecognizeImage 识别图像内容
	RecognizeImage(ctx context.Context, imageData []byte) (string, error)
}

// Config 定义OCR服务配置结构
type Config struct {
	APIKey     string
	Endpoint   string
	ModelName  string
	MaxTokens  int
	TimeoutSec int
}
