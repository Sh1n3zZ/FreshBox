package handler

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"FreshBox/internal/model"
	"FreshBox/internal/service"
)

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
	contentType := c.Request.Header.Get("Content-Type")
	h.logger.Debug("请求内容类型", zap.String("Content-Type", contentType))

	var boxReq struct {
		Name        string  `json:"name"`
		Price       float64 `json:"price"`
		Description string  `json:"description"`
		ImageURL    string  `json:"imageUrl"`
		Category    string  `json:"category"`
	}
	var imageData []byte
	var err error

	// 处理不同类型的请求
	if contentType == "application/json" {
		// 纯JSON请求 - 图片通过URL引用
		if err := c.ShouldBindJSON(&boxReq); err != nil {
			h.logger.Error("解析JSON请求参数失败", zap.Error(err))
			c.JSON(http.StatusBadRequest, gin.H{
				"code": 400,
				"msg":  "无效的请求参数: " + err.Error(),
			})
			return
		}

		if boxReq.ImageURL == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"code": 400,
				"msg":  "图片URL不能为空",
			})
			return
		}
	} else if strings.Contains(contentType, "multipart/form-data") {
		// 含图片的multipart请求
		// 先解析表单字段
		if err := c.Request.ParseMultipartForm(10 << 20); err != nil { // 限制10MB
			h.logger.Error("解析表单失败", zap.Error(err))
			c.JSON(http.StatusBadRequest, gin.H{
				"code": 400,
				"msg":  "解析表单失败: " + err.Error(),
			})
			return
		}

		// 获取表单字段
		boxReq.Name = c.PostForm("name")
		boxReq.Description = c.PostForm("description")
		boxReq.Category = c.PostForm("category")
		priceStr := c.PostForm("price")
		if priceStr != "" {
			boxReq.Price, err = strconv.ParseFloat(priceStr, 64)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{
					"code": 400,
					"msg":  "价格格式无效",
				})
				return
			}
		}

		// 获取图片文件
		file, header, err := c.Request.FormFile("image")
		if err != nil {
			h.logger.Error("获取图片文件失败", zap.Error(err))
			c.JSON(http.StatusBadRequest, gin.H{
				"code": 400,
				"msg":  "请上传商品图片",
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
		imageData = make([]byte, header.Size)
		if _, err := file.Read(imageData); err != nil {
			h.logger.Error("读取图片内容失败", zap.Error(err))
			c.JSON(http.StatusInternalServerError, gin.H{
				"code": 500,
				"msg":  "读取图片内容失败",
			})
			return
		}

		// 生成随机文件名并保存图片
		filename := fmt.Sprintf("%s%s", service.GenerateID(), fileExt)
		uploadDir := "./uploads/boxes"
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			h.logger.Error("创建上传目录失败", zap.Error(err))
			c.JSON(http.StatusInternalServerError, gin.H{
				"code": 500,
				"msg":  "服务器错误：无法创建上传目录",
			})
			return
		}

		filepath := fmt.Sprintf("%s/%s", uploadDir, filename)
		if err := ioutil.WriteFile(filepath, imageData, 0644); err != nil {
			h.logger.Error("保存图片失败", zap.Error(err))
			c.JSON(http.StatusInternalServerError, gin.H{
				"code": 500,
				"msg":  "保存图片失败",
			})
			return
		}

		// 设置图片URL
		boxReq.ImageURL = fmt.Sprintf("/static/uploads/boxes/%s", filename)
	} else {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "不支持的内容类型，请使用application/json或multipart/form-data",
		})
		return
	}

	// 验证必填字段
	if boxReq.Name == "" || boxReq.Description == "" || boxReq.Price <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "名称、描述和价格为必填字段",
		})
		return
	}

	// 获取用户ID
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"code": 401,
			"msg":  "请先登录",
		})
		return
	}

	// 创建盲盒对象
	box := &model.Box{
		Name:        boxReq.Name,
		Price:       boxReq.Price,
		Description: boxReq.Description,
		ImageURL:    boxReq.ImageURL,
		Category:    boxReq.Category,
		CreatorID:   userID.(string),
	}

	// 调用服务层创建盲盒
	if err := h.boxService.CreateBox(c.Request.Context(), box, imageData); err != nil {
		h.logger.Error("创建盲盒失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "创建盲盒失败: " + err.Error(),
		})
		return
	}

	// 构造返回数据
	boxDTO := model.BoxDTO{
		ID:            box.ID,
		Name:          box.Name,
		Description:   box.Description,
		OriginalPrice: box.OriginalPrice,
		CurrentPrice:  box.Price,
		Category:      box.Category,
		ImageURL:      box.ImageURL,
		Status:        box.Status,
		ExpiryDate:    box.ExpiryDate.Format("2006-01-02"),
		CreatedAt:     box.CreatedAt.Format("2006-01-02 15:04:05"),
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": boxDTO,
		"msg":  "创建成功",
	})
}

// GetBox 获取盲盒详情
func (h *BoxHandler) GetBox(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		h.logger.Error("获取盲盒详情失败：ID不能为空")
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "ID不能为空",
		})
		return
	}

	// 检查用户认证状态
	userID, exists := c.Get("user_id")
	if !exists {
		h.logger.Error("获取盲盒详情失败：用户未认证",
			zap.String("box_id", id),
			zap.String("path", c.Request.URL.Path),
			zap.String("method", c.Request.Method),
			zap.String("client_ip", c.ClientIP()),
			zap.String("user_agent", c.Request.UserAgent()))

		// 由于不应该要求用户登录才能查看盲盒详情，这里不应该返回401错误
		// 而是继续处理，只是记录日志
		// 查看请求头中是否有认证信息
		authHeader := c.GetHeader("Authorization")
		h.logger.Debug("认证信息", zap.String("Authorization", authHeader))
	} else {
		h.logger.Info("用户已认证", zap.Any("user_id", userID))
	}

	// 调用服务层获取盲盒详情
	box, err := h.boxService.GetBox(c.Request.Context(), id)
	if err != nil {
		h.logger.Error("获取盲盒详情失败",
			zap.Error(err),
			zap.String("id", id),
			zap.String("error_type", fmt.Sprintf("%T", err)))

		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "获取盲盒详情失败: " + err.Error(),
		})
		return
	}

	// 计算折扣
	discount := 0.0
	if box.OriginalPrice > 0 {
		discount = (box.OriginalPrice - box.Price) / box.OriginalPrice * 100
	}

	// 构建详细信息
	boxDetail := model.BoxDetailDTO{
		BoxDTO: model.BoxDTO{
			ID:            box.ID,
			Name:          box.Name,
			Description:   box.Description,
			OriginalPrice: box.OriginalPrice,
			CurrentPrice:  box.Price,
			Discount:      discount,
			Category:      box.Category,
			ImageURL:      box.ImageURL,
			Status:        box.Status,
			ExpiryDate:    box.ExpiryDate.Format("2006-01-02"),
			CreatedAt:     box.CreatedAt.Format("2006-01-02 15:04:05"),
		},
		// 可以添加其他详细信息
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": boxDetail,
		"msg":  "获取成功",
	})
}

// ListBoxes 列出盲盒
func (h *BoxHandler) ListBoxes(c *gin.Context) {
	// 解析请求参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))
	minPrice, _ := strconv.ParseFloat(c.DefaultQuery("minPrice", "0"), 64)
	maxPrice, _ := strconv.ParseFloat(c.DefaultQuery("maxPrice", "0"), 64)
	category := c.Query("category")
	sortBy := c.DefaultQuery("sortBy", "created")
	order := c.DefaultQuery("order", "desc")
	keyword := c.Query("keyword")
	status := c.DefaultQuery("status", "available")

	// 创建查询选项
	opts := model.BoxListOptions{
		Page:     page,
		Size:     size,
		MinPrice: minPrice,
		MaxPrice: maxPrice,
		Category: category,
		SortBy:   sortBy,
		Order:    order,
		Keyword:  keyword,
		Status:   status,
	}

	// 调用服务层获取盲盒列表
	boxes, total, err := h.boxService.ListBoxes(c.Request.Context(), opts)
	if err != nil {
		h.logger.Error("获取盲盒列表失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "获取盲盒列表失败: " + err.Error(),
		})
		return
	}

	// 构建前端需要的数据结构
	var boxDTOs []model.BoxDTO
	for _, box := range boxes {
		// 格式化过期时间
		expiryDateStr := ""
		if !box.ExpiryDate.IsZero() {
			expiryDateStr = box.ExpiryDate.Format("2006-01-02")
		}

		// 计算折扣
		discount := 0.0
		if box.OriginalPrice > 0 {
			discount = (box.OriginalPrice - box.Price) / box.OriginalPrice * 100
		}

		boxDTOs = append(boxDTOs, model.BoxDTO{
			ID:            box.ID,
			Name:          box.Name,
			Description:   box.Description,
			OriginalPrice: box.OriginalPrice,
			CurrentPrice:  box.Price,
			Discount:      discount,
			Category:      box.Category,
			ImageURL:      box.ImageURL,
			Status:        box.Status,
			ExpiryDate:    expiryDateStr,
			CreatedAt:     box.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gin.H{
			"boxes":    boxDTOs,
			"total":    total,
			"page":     page,
			"pageSize": size,
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

	// 解析请求
	var req struct {
		Quantity      int    `json:"quantity" binding:"required,min=1"`
		PaymentMethod string `json:"paymentMethod" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Error("解析请求参数失败", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "无效的请求参数: " + err.Error(),
		})
		return
	}

	// 获取用户ID
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
		h.logger.Error("购买盲盒失败", zap.Error(err), zap.String("box_id", id), zap.String("user_id", userID.(string)))
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "购买盲盒失败: " + err.Error(),
		})
		return
	}

	// 构造返回数据
	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gin.H{
			"orderId":    order.ID,
			"boxId":      order.BoxID,
			"price":      order.Price,
			"status":     order.Status,
			"createdAt":  order.CreatedAt.Format(time.RFC3339),
			"paymentUrl": fmt.Sprintf("/api/v1/payments/%s", order.ID),
		},
		"msg": "下单成功",
	})
}

// UpdateBox 更新盲盒
func (h *BoxHandler) UpdateBox(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "ID不能为空",
		})
		return
	}

	// 获取用户ID
	_, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"code": 401,
			"msg":  "请先登录",
		})
		return
	}

	// 解析请求
	var req struct {
		Name        string  `json:"name" binding:"omitempty"`
		Price       float64 `json:"price" binding:"omitempty,gte=0"`
		Description string  `json:"description" binding:"omitempty"`
		ImageURL    string  `json:"imageUrl" binding:"omitempty"`
		Category    string  `json:"category" binding:"omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Error("解析请求参数失败", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "无效的请求参数: " + err.Error(),
		})
		return
	}

	// 创建更新对象
	box := &model.Box{
		Name:        req.Name,
		Price:       req.Price,
		Description: req.Description,
		ImageURL:    req.ImageURL,
		Category:    req.Category,
	}

	// 调用服务层更新盲盒
	if err := h.boxService.UpdateBox(c.Request.Context(), id, box); err != nil {
		h.logger.Error("更新盲盒失败", zap.Error(err), zap.String("id", id))
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "更新盲盒失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "更新成功",
	})
}

// DeleteBox 删除盲盒
func (h *BoxHandler) DeleteBox(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "ID不能为空",
		})
		return
	}

	// 获取用户ID
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"code": 401,
			"msg":  "请先登录",
		})
		return
	}

	// 调用服务层删除盲盒
	if err := h.boxService.DeleteBox(c.Request.Context(), id, userID.(string)); err != nil {
		h.logger.Error("删除盲盒失败", zap.Error(err), zap.String("id", id))
		c.JSON(http.StatusInternalServerError, gin.H{
			"code": 500,
			"msg":  "删除盲盒失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "删除成功",
	})
}
