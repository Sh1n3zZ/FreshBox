package handler

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

// ImageHandler 图片处理器
type ImageHandler struct {
	logger *zap.Logger
}

// NewImageHandler 创建图片处理器
func NewImageHandler() *ImageHandler {
	logger, _ := zap.NewDevelopment()
	return &ImageHandler{
		logger: logger,
	}
}

// UploadImage 上传图片
func (h *ImageHandler) UploadImage(c *gin.Context) {
	// 获取类型参数
	imageType := c.DefaultQuery("type", "box")

	// 获取上传文件
	file, header, err := c.Request.FormFile("image")
	if err != nil {
		h.logger.Error("获取上传文件失败", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "请选择图片上传",
		})
		return
	}
	defer file.Close()

	// 检查文件大小
	if header.Size > 5*1024*1024 { // 限制5MB
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "图片大小不能超过5MB",
		})
		return
	}

	// 检查文件类型
	fileExt := strings.ToLower(filepath.Ext(header.Filename))
	if fileExt != ".jpg" && fileExt != ".jpeg" && fileExt != ".png" {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "只支持JPG、JPEG和PNG格式的图片",
		})
		return
	}

	// 读取图片内容
	imageData, err := ioutil.ReadAll(file)
	if err != nil {
		h.logger.Error("读取图片内容失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "读取图片内容失败",
		})
		return
	}

	// 生成随机文件名
	filename := uuid.New().String() + fileExt

	// 确定上传目录
	var uploadDir string
	switch imageType {
	case "box":
		uploadDir = "./uploads/boxes"
	case "user":
		uploadDir = "./uploads/users"
	case "product":
		uploadDir = "./uploads/products"
	default:
		uploadDir = "./uploads/others"
	}

	// 创建目录
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		h.logger.Error("创建上传目录失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "服务器错误：无法创建上传目录",
		})
		return
	}

	// 保存文件
	filepath := fmt.Sprintf("%s/%s", uploadDir, filename)
	if err := ioutil.WriteFile(filepath, imageData, 0644); err != nil {
		h.logger.Error("保存图片失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "保存图片失败",
		})
		return
	}

	// 生成URL
	imageURL := fmt.Sprintf("/static/%s/%s", strings.TrimPrefix(uploadDir, "./"), filename)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gin.H{
			"url":      imageURL,
			"filename": filename,
			"size":     header.Size,
		},
		"msg": "上传成功",
	})
}

// GetImage 获取图片
func (h *ImageHandler) GetImage(c *gin.Context) {
	// 图片类型和文件名
	imageType := c.Param("type")
	filename := c.Param("filename")

	// 检查文件是否存在
	uploadDir := fmt.Sprintf("./uploads/%s", imageType)
	filePath := fmt.Sprintf("%s/%s", uploadDir, filename)

	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{
			"code": 404,
			"msg":  "图片不存在",
		})
		return
	}

	// 返回文件
	c.File(filePath)
}
