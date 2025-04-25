package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"FreshBox/internal/model"
	"FreshBox/internal/service"
)

// BlindBoxHandler 盲盒处理器
type BlindBoxHandler struct {
	blindBoxService *service.BlindBoxService
	productService  *service.ProductService
	logger          *zap.Logger
}

// NewBlindBoxHandler 创建盲盒处理器
func NewBlindBoxHandler(blindBoxService *service.BlindBoxService, productService *service.ProductService) *BlindBoxHandler {
	logger, _ := zap.NewDevelopment()
	return &BlindBoxHandler{
		blindBoxService: blindBoxService,
		productService:  productService,
		logger:          logger,
	}
}

// CreateBlindBox 创建盲盒
func (h *BlindBoxHandler) CreateBlindBox(c *gin.Context) {
	var box model.BlindBox
	if err := c.ShouldBindJSON(&box); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误", "details": err.Error()})
		return
	}

	// 设置创建者ID（从认证中获取）
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权"})
		return
	}
	box.CreatorID = userID

	// 设置过期时间（如果未提供）
	if box.ExpirationTime.IsZero() {
		box.ExpirationTime = time.Now().Add(72 * time.Hour) // 默认3天后过期
	}

	err := h.blindBoxService.CreateBlindBox(c.Request.Context(), &box, userID)
	if err != nil {
		h.logger.Error("创建盲盒失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建盲盒失败", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "创建盲盒成功",
		"box_id":  box.ID,
	})
}

// GetBlindBox 获取盲盒详情
func (h *BlindBoxHandler) GetBlindBox(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "盲盒ID不能为空"})
		return
	}

	box, err := h.blindBoxService.GetBlindBox(c.Request.Context(), id)
	if err != nil {
		h.logger.Error("获取盲盒失败", zap.Error(err), zap.String("box_id", id))
		c.JSON(http.StatusNotFound, gin.H{"error": "获取盲盒失败", "details": err.Error()})
		return
	}

	// 获取盲盒内的商品
	products, err := h.productService.GetProductsByBlindBox(c.Request.Context(), id)
	if err != nil {
		h.logger.Error("获取盲盒商品失败", zap.Error(err), zap.String("box_id", id))
	}

	// 构建响应DTO
	boxDTO := model.BlindBoxDetailDTO{
		BlindBoxDTO: model.BlindBoxDTO{
			ID:                  box.ID,
			Name:                box.Name,
			Description:         box.Description,
			DiscountCoefficient: box.DiscountCoefficient,
			Category:            box.Category,
			ImageURL:            box.ImageURL,
			Status:              box.Status,
			ExpirationTime:      service.FormatTime(box.ExpirationTime),
			DonationAmount:      box.DonationAmount,
			ProductCount:        len(products),
			CreatedAt:           service.FormatTime(box.CreatedAt),
		},
		Products: []model.ProductDTO{},
	}

	// 转换商品到DTO
	for _, p := range products {
		boxDTO.Products = append(boxDTO.Products, model.ProductDTO{
			ID:             p.ID,
			Name:           p.Name,
			Description:    p.Description,
			Price:          p.Price,
			Category:       p.Category,
			ImageURL:       p.ImageURL,
			Status:         p.Status,
			ProductionDate: service.FormatTime(p.ProductionDate),
			ShelfLifeHours: p.ShelfLifeHours,
			CreatedAt:      service.FormatTime(p.CreatedAt),
		})
	}

	c.JSON(http.StatusOK, boxDTO)
}

// ListBlindBoxes 列出盲盒
func (h *BlindBoxHandler) ListBlindBoxes(c *gin.Context) {
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
	opts := model.BlindBoxListOptions{
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

	// 查询盲盒列表
	boxes, total, err := h.blindBoxService.ListBlindBoxes(c.Request.Context(), opts)
	if err != nil {
		h.logger.Error("查询盲盒列表失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询盲盒列表失败", "details": err.Error()})
		return
	}

	// 构建响应DTO
	var boxDTOs []model.BlindBoxDTO
	for _, box := range boxes {
		// 获取盲盒内商品数量
		productCount, _ := h.productService.CountProductsByBlindBox(c.Request.Context(), box.ID)

		boxDTOs = append(boxDTOs, model.BlindBoxDTO{
			ID:                  box.ID,
			Name:                box.Name,
			Description:         box.Description,
			DiscountCoefficient: box.DiscountCoefficient,
			Category:            box.Category,
			ImageURL:            box.ImageURL,
			Status:              box.Status,
			ExpirationTime:      service.FormatTime(box.ExpirationTime),
			DonationAmount:      box.DonationAmount,
			ProductCount:        int(productCount),
			CreatedAt:           service.FormatTime(box.CreatedAt),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"boxes": boxDTOs,
		"total": total,
		"page":  page,
		"size":  size,
	})
}

// UpdateBlindBox 更新盲盒
func (h *BlindBoxHandler) UpdateBlindBox(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "盲盒ID不能为空"})
		return
	}

	var box model.BlindBox
	if err := c.ShouldBindJSON(&box); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误", "details": err.Error()})
		return
	}

	// 设置ID
	box.ID = id

	// 获取用户ID
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权"})
		return
	}

	err := h.blindBoxService.UpdateBlindBox(c.Request.Context(), id, &box, userID)
	if err != nil {
		h.logger.Error("更新盲盒失败", zap.Error(err), zap.String("box_id", id))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新盲盒失败", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "更新盲盒成功",
		"box_id":  id,
	})
}

// DeleteBlindBox 删除盲盒
func (h *BlindBoxHandler) DeleteBlindBox(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "盲盒ID不能为空"})
		return
	}

	// 获取用户ID
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权"})
		return
	}

	err := h.blindBoxService.DeleteBlindBox(c.Request.Context(), id, userID)
	if err != nil {
		h.logger.Error("删除盲盒失败", zap.Error(err), zap.String("box_id", id))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除盲盒失败", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "删除盲盒成功",
		"box_id":  id,
	})
}

// PurchaseBlindBox 购买盲盒
func (h *BlindBoxHandler) PurchaseBlindBox(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "盲盒ID不能为空"})
		return
	}

	// 获取用户ID
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权"})
		return
	}

	order, err := h.blindBoxService.PurchaseBlindBox(c.Request.Context(), id, userID)
	if err != nil {
		h.logger.Error("购买盲盒失败", zap.Error(err), zap.String("box_id", id))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "购买盲盒失败", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "购买盲盒成功",
		"order_id": order.ID,
		"box_id":   id,
		"price":    order.Price,
		"status":   order.Status,
	})
}

// OpenBlindBox 开启盲盒
func (h *BlindBoxHandler) OpenBlindBox(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "盲盒ID不能为空"})
		return
	}

	// 获取用户ID
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权"})
		return
	}

	opening, err := h.blindBoxService.OpenBlindBox(c.Request.Context(), id, userID)
	if err != nil {
		h.logger.Error("开启盲盒失败", zap.Error(err), zap.String("box_id", id))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "开启盲盒失败", "details": err.Error()})
		return
	}

	// 获取获得的商品详情
	product, err := h.productService.GetProduct(c.Request.Context(), opening.ObtainedProductID)
	if err != nil {
		h.logger.Error("获取商品详情失败", zap.Error(err), zap.String("product_id", opening.ObtainedProductID))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取商品详情失败", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "开启盲盒成功",
		"opening_id":   opening.ID,
		"box_id":       id,
		"product_id":   product.ID,
		"product_name": product.Name,
		"product_info": model.ProductDTO{
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
		},
		"opened_at": service.FormatTime(opening.OpenedAt),
	})
}

// GetBlindBoxOpeningHistory 获取盲盒开启历史
func (h *BlindBoxHandler) GetBlindBoxOpeningHistory(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "盲盒ID不能为空"})
		return
	}

	openings, err := h.blindBoxService.GetBlindBoxOpeningHistory(c.Request.Context(), id)
	if err != nil {
		h.logger.Error("获取盲盒开启历史失败", zap.Error(err), zap.String("box_id", id))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取盲盒开启历史失败", "details": err.Error()})
		return
	}

	var openingDTOs []gin.H
	for _, opening := range openings {
		// 获取用户信息
		// 此处应该调用userService获取用户信息，这里简化处理
		openingDTOs = append(openingDTOs, gin.H{
			"opening_id": opening.ID,
			"user_id":    opening.UserID,
			"box_id":     opening.BlindBoxID,
			"product_id": opening.ObtainedProductID,
			"opened_at":  service.FormatTime(opening.OpenedAt),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"openings": openingDTOs,
		"box_id":   id,
		"total":    len(openingDTOs),
	})
}
