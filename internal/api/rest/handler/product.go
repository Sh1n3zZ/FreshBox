package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"FreshBox/internal/model"
	"FreshBox/internal/service"
)

// ProductHandler 商品处理器
type ProductHandler struct {
	productService *service.ProductService
	logger         *zap.Logger
}

// NewProductHandler 创建商品处理器
func NewProductHandler(productService *service.ProductService) *ProductHandler {
	logger, _ := zap.NewDevelopment()
	return &ProductHandler{
		productService: productService,
		logger:         logger,
	}
}

// CreateProduct 创建商品
func (h *ProductHandler) CreateProduct(c *gin.Context) {
	var product model.Product
	if err := c.ShouldBindJSON(&product); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误", "details": err.Error()})
		return
	}

	// 设置创建者ID（从认证中获取）
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权"})
		return
	}
	product.CreatorID = userID

	err := h.productService.CreateProduct(c.Request.Context(), &product)
	if err != nil {
		h.logger.Error("创建商品失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建商品失败", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":    "创建商品成功",
		"product_id": product.ID,
	})
}

// GetProduct 获取商品详情
func (h *ProductHandler) GetProduct(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "商品ID不能为空"})
		return
	}

	product, err := h.productService.GetProduct(c.Request.Context(), id)
	if err != nil {
		h.logger.Error("获取商品失败", zap.Error(err), zap.String("product_id", id))
		c.JSON(http.StatusNotFound, gin.H{"error": "获取商品失败", "details": err.Error()})
		return
	}

	// 构建响应DTO
	productDTO := model.ProductDTO{
		ID:             product.ID,
		Name:           product.Name,
		Description:    product.Description,
		Price:          product.Price,
		Category:       product.Category,
		ImageURL:       product.ImageURL,
		Status:         product.Status,
		ProductionDate: service.FormatTime(product.ProductionDate),
		ShelfLifeHours: product.ShelfLifeHours,
		CreatedAt:      service.FormatTime(product.CreatedAt),
	}

	c.JSON(http.StatusOK, productDTO)
}

// ListProducts 列出商品
func (h *ProductHandler) ListProducts(c *gin.Context) {
	// 解析查询参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))
	category := c.Query("category")
	status := c.Query("status")
	keyword := c.Query("keyword")
	sortBy := c.Query("sort_by")
	order := c.Query("order")
	minPrice, _ := strconv.ParseFloat(c.Query("min_price"), 64)
	maxPrice, _ := strconv.ParseFloat(c.Query("max_price"), 64)

	// 构建查询选项
	opts := model.ProductListOptions{
		Page:     page,
		Size:     size,
		Category: category,
		Status:   status,
		Keyword:  keyword,
		SortBy:   sortBy,
		Order:    order,
		MinPrice: minPrice,
		MaxPrice: maxPrice,
	}

	// 查询商品列表
	products, total, err := h.productService.ListProducts(c.Request.Context(), opts)
	if err != nil {
		h.logger.Error("查询商品列表失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询商品列表失败", "details": err.Error()})
		return
	}

	// 构建响应DTO
	var productDTOs []model.ProductDTO
	for _, product := range products {
		productDTOs = append(productDTOs, model.ProductDTO{
			ID:             product.ID,
			Name:           product.Name,
			Description:    product.Description,
			Price:          product.Price,
			Category:       product.Category,
			ImageURL:       product.ImageURL,
			Status:         product.Status,
			ProductionDate: service.FormatTime(product.ProductionDate),
			ShelfLifeHours: product.ShelfLifeHours,
			CreatedAt:      service.FormatTime(product.CreatedAt),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"products": productDTOs,
		"total":    total,
		"page":     page,
		"size":     size,
	})
}

// UpdateProduct 更新商品
func (h *ProductHandler) UpdateProduct(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "商品ID不能为空"})
		return
	}

	var product model.Product
	if err := c.ShouldBindJSON(&product); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误", "details": err.Error()})
		return
	}

	// 设置ID
	product.ID = id

	err := h.productService.UpdateProduct(c.Request.Context(), id, &product)
	if err != nil {
		h.logger.Error("更新商品失败", zap.Error(err), zap.String("product_id", id))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新商品失败", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "更新商品成功",
		"product_id": id,
	})
}

// DeleteProduct 删除商品
func (h *ProductHandler) DeleteProduct(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "商品ID不能为空"})
		return
	}

	err := h.productService.DeleteProduct(c.Request.Context(), id)
	if err != nil {
		h.logger.Error("删除商品失败", zap.Error(err), zap.String("product_id", id))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除商品失败", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "删除商品成功",
		"product_id": id,
	})
}

// AddProductToBlindBox 将商品添加到盲盒
func (h *ProductHandler) AddProductToBlindBox(c *gin.Context) {
	productID := c.Param("id")
	if productID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "商品ID不能为空"})
		return
	}

	var req struct {
		BlindBoxID string `json:"blind_box_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误", "details": err.Error()})
		return
	}

	err := h.productService.AddProductToBlindBox(c.Request.Context(), productID, req.BlindBoxID)
	if err != nil {
		h.logger.Error("添加商品到盲盒失败", zap.Error(err),
			zap.String("product_id", productID),
			zap.String("blind_box_id", req.BlindBoxID))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "添加商品到盲盒失败", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "添加商品到盲盒成功",
		"product_id":   productID,
		"blind_box_id": req.BlindBoxID,
	})
}

// RemoveProductFromBlindBox 从盲盒中移除商品
func (h *ProductHandler) RemoveProductFromBlindBox(c *gin.Context) {
	productID := c.Param("id")
	if productID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "商品ID不能为空"})
		return
	}

	err := h.productService.RemoveProductFromBlindBox(c.Request.Context(), productID)
	if err != nil {
		h.logger.Error("从盲盒中移除商品失败", zap.Error(err), zap.String("product_id", productID))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "从盲盒中移除商品失败", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "从盲盒中移除商品成功",
		"product_id": productID,
	})
}

// BatchAddProductsToBlindBox 批量将商品添加到盲盒
func (h *ProductHandler) BatchAddProductsToBlindBox(c *gin.Context) {
	var req struct {
		ProductIDs []string `json:"product_ids" binding:"required"`
		BlindBoxID string   `json:"blind_box_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误", "details": err.Error()})
		return
	}

	err := h.productService.BatchAddProductsToBlindBox(c.Request.Context(), req.ProductIDs, req.BlindBoxID)
	if err != nil {
		h.logger.Error("批量添加商品到盲盒失败", zap.Error(err),
			zap.Strings("product_ids", req.ProductIDs),
			zap.String("blind_box_id", req.BlindBoxID))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "批量添加商品到盲盒失败", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "批量添加商品到盲盒成功",
		"product_count": len(req.ProductIDs),
		"blind_box_id":  req.BlindBoxID,
	})
}

// GetProductsByStatus 根据状态获取商品列表
func (h *ProductHandler) GetProductsByStatus(c *gin.Context) {
	status := c.Query("status")
	if status == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "状态参数不能为空"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))

	products, total, err := h.productService.GetProductsByStatus(c.Request.Context(), status, page, size)
	if err != nil {
		h.logger.Error("查询商品列表失败", zap.Error(err), zap.String("status", status))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询商品列表失败", "details": err.Error()})
		return
	}

	// 构建响应DTO
	var productDTOs []model.ProductDTO
	for _, product := range products {
		productDTOs = append(productDTOs, model.ProductDTO{
			ID:             product.ID,
			Name:           product.Name,
			Description:    product.Description,
			Price:          product.Price,
			Category:       product.Category,
			ImageURL:       product.ImageURL,
			Status:         product.Status,
			ProductionDate: service.FormatTime(product.ProductionDate),
			ShelfLifeHours: product.ShelfLifeHours,
			CreatedAt:      service.FormatTime(product.CreatedAt),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"products": productDTOs,
		"total":    total,
		"page":     page,
		"size":     size,
		"status":   status,
	})
}

// GetProductsByBlindBox 获取盲盒内的商品
func (h *ProductHandler) GetProductsByBlindBox(c *gin.Context) {
	boxID := c.Param("box_id")
	if boxID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "盲盒ID不能为空"})
		return
	}

	products, err := h.productService.GetProductsByBlindBox(c.Request.Context(), boxID)
	if err != nil {
		h.logger.Error("获取盲盒商品失败", zap.Error(err), zap.String("box_id", boxID))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取盲盒商品失败", "details": err.Error()})
		return
	}

	// 构建响应DTO
	var productDTOs []model.ProductDTO
	for _, product := range products {
		productDTOs = append(productDTOs, model.ProductDTO{
			ID:             product.ID,
			Name:           product.Name,
			Description:    product.Description,
			Price:          product.Price,
			Category:       product.Category,
			ImageURL:       product.ImageURL,
			Status:         product.Status,
			ProductionDate: service.FormatTime(product.ProductionDate),
			ShelfLifeHours: product.ShelfLifeHours,
			CreatedAt:      service.FormatTime(product.CreatedAt),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"products": productDTOs,
		"box_id":   boxID,
		"total":    len(productDTOs),
	})
}
