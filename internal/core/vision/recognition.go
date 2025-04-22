package vision

import (
	"context"
	"time"

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
}
