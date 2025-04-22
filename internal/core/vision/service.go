package vision

import (
	"context"
	"time"

	"github.com/pkg/errors"
	"google.golang.org/grpc"
)

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
	if err != nil {
		return nil, errors.Wrap(err, "连接gRPC服务失败")
	}

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
}
