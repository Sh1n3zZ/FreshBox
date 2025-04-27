package vision

import "context"

// OCRService 定义OCR图像识别服务接口
type OCRService interface {
	// RecognizeImage 识别图像内容
	RecognizeImage(ctx context.Context, imageData []byte) (string, error)
	// SummarizeOCRResult 结构化处理OCR结果
	SummarizeOCRResult(ctx context.Context, ocrText string) (*OCRSummary, error)
}

// OCRSummary 定义OCR结果的结构化信息
type OCRSummary struct {
	ProductName           string `json:"product_name"`
	ProductDescription    string `json:"product_description"`
	ProductPrice          string `json:"product_price"`
	ProductShelfLife      string `json:"product_shelf_life"`
	ProductProductionDate string `json:"product_production_date"`
	ProductManufacturer   string `json:"product_manufacturer"`
	ProductBatchNumber    string `json:"product_production_batch_number"`
	ProductStorage        string `json:"product_storage_conditions"`
	ProductIngredients    []struct {
		Index      int    `json:"index"`
		Ingredient string `json:"ingredients"`
	} `json:"product_ingredients"`
}

// Config 定义OCR服务配置结构
type Config struct {
	APIKey           string
	Endpoint         string
	ModelName        string
	MaxTokens        int
	TimeoutSec       int
	OCRSummaryModel  string
	OCRSummaryPrompt string
}
