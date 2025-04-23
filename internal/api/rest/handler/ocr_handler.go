package handler

import (
	"bytes"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"FreshBox/internal/core/vision"
	"FreshBox/internal/utils/response"
)

// OCRHandler 处理OCR相关请求
type OCRHandler struct {
	ocrService *vision.Service
}

// NewOCRHandler 创建新的OCR处理器
func NewOCRHandler() (*OCRHandler, error) {
	// 初始化OCR服务
	ocrService, err := vision.NewService()
	if err != nil {
		return nil, err
	}

	return &OCRHandler{
		ocrService: ocrService,
	}, nil
}

// UploadAndProcess 上传并处理单张图片
// @Summary 上传并识别图片文本
// @Description 上传图片并使用OCR识别其中的文本内容
// @Tags OCR
// @Accept multipart/form-data
// @Produce json
// @Param image formData file true "需要处理的图片"
// @Success 200 {object} response.Response{data=string} "返回识别结果"
// @Failure 400 {object} response.Response "请求错误"
// @Failure 500 {object} response.Response "服务器内部错误"
// @Router /api/v1/ocr/process [post]
// @Router /api/v1/ocr/process/secure [post]
func (h *OCRHandler) UploadAndProcess(c *gin.Context) {
	// 从请求中获取文件
	file, err := c.FormFile("image")
	if err != nil {
		response.BadRequest(c, "未能获取上传的图片: "+err.Error(), err)
		return
	}

	// 校验文件类型（不区分大小写）
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".bmp" {
		response.BadRequest(c, "不支持的图片格式，请上传jpg、jpeg、png或bmp格式", nil)
		return
	}

	// 打开上传的文件
	src, err := file.Open()
	if err != nil {
		response.InternalError(c, "无法打开上传的图片: "+err.Error(), err)
		return
	}
	defer src.Close()

	// 读取文件内容
	buffer := bytes.NewBuffer(nil)
	if _, err := io.Copy(buffer, src); err != nil {
		response.InternalError(c, "读取图片失败: "+err.Error(), err)
		return
	}

	// 调用OCR服务识别图片内容
	textContent, err := h.ocrService.RecognizeImage(c.Request.Context(), buffer.Bytes())
	if err != nil {
		response.InternalError(c, "图像识别失败: "+err.Error(), err)
		return
	}

	// 返回识别结果
	result := gin.H{
		"text": textContent,
		"msg":  "识别成功",
	}
	response.Success(c, result)
}

// BatchImageRequest 批量处理图片请求
type BatchImageRequest struct {
	ImageURLs []string `json:"image_urls" binding:"required,min=1"`
}

// BatchImageResponse 批量处理图片响应
type BatchImageResponse struct {
	Results map[string]string `json:"results"` // 图片URL到识别结果的映射
	Failed  map[string]string `json:"failed"`  // 失败的图片及原因
}

// ProcessBatchImages 批量处理图片
// @Summary 批量处理图片OCR
// @Description 批量处理多个图片URL的OCR识别
// @Tags OCR
// @Accept json
// @Produce json
// @Param request body BatchImageRequest true "包含图片URL的JSON"
// @Success 200 {object} response.Response{data=BatchImageResponse} "返回批量处理结果"
// @Failure 400 {object} response.Response "请求错误"
// @Failure 500 {object} response.Response "服务器内部错误"
// @Router /api/v1/ocr/batch [post]
func (h *OCRHandler) ProcessBatchImages(c *gin.Context) {
	var req BatchImageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "无效的请求格式: "+err.Error(), err)
		return
	}

	results := make(map[string]string)
	failed := make(map[string]string)

	// 处理每个URL
	for _, url := range req.ImageURLs {
		// 下载图片
		resp, err := http.Get(url)
		if err != nil {
			failed[url] = "下载图片失败: " + err.Error()
			continue
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			failed[url] = "下载图片失败，状态码: " + resp.Status
			continue
		}

		// 读取图片数据
		imgData, err := io.ReadAll(resp.Body)
		if err != nil {
			failed[url] = "读取图片数据失败: " + err.Error()
			continue
		}

		// 调用OCR服务
		text, err := h.ocrService.RecognizeImage(c.Request.Context(), imgData)
		if err != nil {
			failed[url] = "识别失败: " + err.Error()
			continue
		}

		// 保存结果
		results[url] = text
	}

	// 返回结果
	result := gin.H{
		"results":  results,
		"failed":   failed,
		"msg":      "批量处理完成",
		"total":    len(req.ImageURLs),
		"success":  len(results),
		"failures": len(failed),
	}
	response.Success(c, result)
}

// SaveImageOCR 上传、处理并保存OCR结果
// @Summary 上传图片并保存OCR结果
// @Description 上传图片，识别文本并保存结果到系统
// @Tags OCR
// @Accept multipart/form-data
// @Produce json
// @Param image formData file true "需要处理的图片"
// @Param description formData string false "图片描述"
// @Param category formData string false "图片分类"
// @Success 200 {object} response.Response "返回保存结果"
// @Failure 400 {object} response.Response "请求错误"
// @Failure 500 {object} response.Response "服务器内部错误"
// @Router /api/v1/ocr/save [post]
func (h *OCRHandler) SaveImageOCR(c *gin.Context) {
	// 从请求中获取文件
	file, err := c.FormFile("image")
	if err != nil {
		response.BadRequest(c, "未能获取上传的图片: "+err.Error(), err)
		return
	}

	// 获取其他表单数据
	description := c.PostForm("description")
	category := c.PostForm("category")

	// 校验文件类型（不区分大小写）
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".bmp" {
		response.BadRequest(c, "不支持的图片格式，请上传jpg、jpeg、png或bmp格式", nil)
		return
	}

	// 打开上传的文件
	src, err := file.Open()
	if err != nil {
		response.InternalError(c, "无法打开上传的图片: "+err.Error(), err)
		return
	}
	defer src.Close()

	// 读取文件内容
	buffer := bytes.NewBuffer(nil)
	if _, err := io.Copy(buffer, src); err != nil {
		response.InternalError(c, "读取图片失败: "+err.Error(), err)
		return
	}

	// 保存图片到服务器
	fileName := uuid.New().String() + ext
	savePath := filepath.Join("uploads", "ocr", fileName)

	// 确保目录存在
	if err := os.MkdirAll(filepath.Dir(savePath), 0755); err != nil {
		response.InternalError(c, "创建目录失败: "+err.Error(), err)
		return
	}

	// 保存文件
	if err := c.SaveUploadedFile(file, savePath); err != nil {
		response.InternalError(c, "保存文件失败: "+err.Error(), err)
		return
	}

	// 调用OCR服务识别图片内容
	textContent, err := h.ocrService.RecognizeImage(c.Request.Context(), buffer.Bytes())
	if err != nil {
		response.InternalError(c, "图像识别失败: "+err.Error(), err)
		return
	}

	// 这里可以添加保存OCR结果到数据库的逻辑
	// ...

	// 返回结果
	result := gin.H{
		"file_path":    "/static/uploads/ocr/" + fileName,
		"text_content": textContent,
		"description":  description,
		"category":     category,
		"msg":          "图像识别并保存成功",
	}
	response.Success(c, result)
}
