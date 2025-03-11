package vision

import (
	"context"
	"time"

	pb "FreshBox/internal/core/vision/proto"

	"github.com/pkg/errors"
	"google.golang.org/grpc"
)

// GRPCRecognition gRPC图像识别服务实现
type GRPCRecognition struct {
	client    pb.VisionServiceClient
	timeout   time.Duration
	threshold float64 // 置信度阈值
}

// NewGRPCRecognition 创建gRPC图像识别服务
func NewGRPCRecognition(conn *grpc.ClientConn, timeout time.Duration, threshold float64) *GRPCRecognition {
	return &GRPCRecognition{
		client:    pb.NewVisionServiceClient(conn),
		timeout:   timeout,
		threshold: threshold,
	}
}

// DetectProduct 检测商品信息
func (r *GRPCRecognition) DetectProduct(ctx context.Context, imageData []byte) (*ProductInfo, error) {
	ctx, cancel := context.WithTimeout(ctx, r.timeout)
	defer cancel()

	// 调用gRPC服务
	resp, err := r.client.DetectProduct(ctx, &pb.DetectRequest{
		ImageData: imageData,
		Threshold: r.threshold,
	})
	if err != nil {
		return nil, errors.Wrap(err, "调用商品检测服务失败")
	}

	// 验证置信度
	if resp.Confidence < r.threshold {
		return nil, errors.Errorf("识别置信度不足: %.2f < %.2f", resp.Confidence, r.threshold)
	}

	// 转换响应
	expiryDate, err := time.Parse(time.RFC3339, resp.ExpiryDate)
	if err != nil {
		return nil, errors.Wrap(err, "解析过期时间失败")
	}

	return &ProductInfo{
		ProductName:    resp.ProductName,
		ExpiryDate:     expiryDate,
		Confidence:     resp.Confidence,
		BoundingBox:    []float64{resp.BoundingBox.X, resp.BoundingBox.Y, resp.BoundingBox.Width, resp.BoundingBox.Height},
		Classification: resp.Classification,
	}, nil
}

// ExtractMetadata 提取图像元数据
func (r *GRPCRecognition) ExtractMetadata(ctx context.Context, imageData []byte) (*ImageMetadata, error) {
	ctx, cancel := context.WithTimeout(ctx, r.timeout)
	defer cancel()

	// 调用gRPC服务
	resp, err := r.client.ExtractMetadata(ctx, &pb.MetadataRequest{
		ImageData: imageData,
	})
	if err != nil {
		return nil, errors.Wrap(err, "提取图像元数据失败")
	}

	// 解析时间
	captureTime, err := time.Parse(time.RFC3339, resp.CaptureTime)
	if err != nil {
		return nil, errors.Wrap(err, "解析拍摄时间失败")
	}

	metadata := &ImageMetadata{
		CaptureTime: captureTime,
		Device:      resp.Device,
		Format:      resp.Format,
	}

	// 如果有位置信息
	if resp.Location != nil {
		metadata.Location = &Location{
			Latitude:  resp.Location.Latitude,
			Longitude: resp.Location.Longitude,
		}
	}

	return metadata, nil
}
