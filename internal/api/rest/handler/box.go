package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"FreshBox/internal/service"
)

// Box 盲盒信息
type Box struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Price       float64 `json:"price"`
	Description string  `json:"description"`
	ImageURL    string  `json:"image_url"`
}

// BoxHandler 盲盒处理器
type BoxHandler struct {
	boxService *service.BoxService
	logger     *zap.Logger
}

// NewBoxHandler 创建盲盒处理器
func NewBoxHandler(boxService *service.BoxService) *BoxHandler {
	logger, _ := zap.NewDevelopment()
	return &BoxHandler{
		boxService: boxService,
		logger:     logger,
	}
}

// CreateBox 创建盲盒
func (h *BoxHandler) CreateBox(c *gin.Context) {
	var box Box
	if err := c.ShouldBindJSON(&box); err != nil {
		h.logger.Error("解析请求参数失败", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "无效的请求参数",
		})
		return
	}

	// 获取图片数据
	file, err := c.FormFile("image")
	if err != nil {
		h.logger.Error("获取图片失败", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "请上传商品图片",
		})
		return
	}

	// 读取图片数据
	src, err := file.Open()
	if err != nil {
		h.logger.Error("读取图片失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "读取图片失败",
		})
		return
	}
	defer src.Close()

	// 读取图片内容
	imageData := make([]byte, file.Size)
	if _, err := src.Read(imageData); err != nil {
		h.logger.Error("读取图片内容失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "读取图片内容失败",
		})
		return
	}

	// 调用服务层创建盲盒
	serviceBox := &service.Box{
		Name:        box.Name,
		Price:       box.Price,
		Description: box.Description,
		ImageURL:    box.ImageURL,
	}
	if err := h.boxService.CreateBox(c.Request.Context(), serviceBox, imageData); err != nil {
		h.logger.Error("创建盲盒失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "创建盲盒失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": serviceBox,
		"msg":  "创建成功",
	})
}

// GetBox 获取盲盒详情
func (h *BoxHandler) GetBox(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "ID不能为空",
		})
		return
	}

	// 调用服务层获取盲盒详情
	box, err := h.boxService.GetBox(c.Request.Context(), id)
	if err != nil {
		h.logger.Error("获取盲盒详情失败", zap.Error(err), zap.String("id", id))
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "获取盲盒详情失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": box,
		"msg":  "获取成功",
	})
}

// ListBoxes 列出盲盒
func (h *BoxHandler) ListBoxes(c *gin.Context) {
	// 解析分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))

	// 调用服务层获取盲盒列表
	boxes, total, err := h.boxService.ListBoxes(c.Request.Context(), page, size)
	if err != nil {
		h.logger.Error("获取盲盒列表失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "获取盲盒列表失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gin.H{
			"items": boxes,
			"total": total,
			"page":  page,
			"size":  size,
		},
		"msg": "获取成功",
	})
}

// PurchaseBox 购买盲盒
func (h *BoxHandler) PurchaseBox(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "ID不能为空",
		})
		return
	}

	// 获取用户ID（假设已经通过中间件设置）
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"code": 401,
			"msg":  "请先登录",
		})
		return
	}

	// 调用服务层购买盲盒
	order, err := h.boxService.PurchaseBox(c.Request.Context(), id, userID.(string))
	if err != nil {
		h.logger.Error("购买盲盒失败", zap.Error(err), zap.String("box_id", id), zap.Any("user_id", userID))
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "购买盲盒失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gin.H{
			"order_id": order.ID,
		},
		"msg": "购买成功",
	})
}
