package vision

import (
	"context"
	"time"
)

// Recognition 定义图像识别服务接口
type Recognition interface {
	// DetectProduct 检测商品信息
	DetectProduct(ctx context.Context, imageData []byte) (*ProductInfo, error)

	// ExtractMetadata 提取图像元数据
	ExtractMetadata(ctx context.Context, imageData []byte) (*ImageMetadata, error)
}

// ProductInfo 商品识别结果
type ProductInfo struct {
	ProductName    string    `json:"product_name"`
	ExpiryDate     time.Time `json:"expiry_date"`
	Confidence     float64   `json:"confidence"`
	BoundingBox    []float64 `json:"bounding_box"`
	Classification string    `json:"classification"`
}

// ImageMetadata 图像元数据
type ImageMetadata struct {
	CaptureTime time.Time `json:"capture_time"`
	Location    *Location `json:"location,omitempty"`
	Device      string    `json:"device"`
	Format      string    `json:"format"`
}

// Location 地理位置信息
type Location struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}
