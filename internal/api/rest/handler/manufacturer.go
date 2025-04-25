package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"
	"go.uber.org/zap"

	"FreshBox/internal/model"
	"FreshBox/internal/service"
)

// ManufacturerHandler 生产商处理器
type ManufacturerHandler struct {
	manufacturerService *service.ManufacturerService
	logger              *zap.Logger
}

// NewManufacturerHandler 创建生产商处理器
func NewManufacturerHandler(manufacturerService *service.ManufacturerService) *ManufacturerHandler {
	logger, _ := zap.NewDevelopment()
	return &ManufacturerHandler{
		manufacturerService: manufacturerService,
		logger:              logger,
	}
}

// CreateManufacturer 创建生产商
func (h *ManufacturerHandler) CreateManufacturer(c *gin.Context) {
	var manufacturer model.Manufacturer
	if err := c.ShouldBindJSON(&manufacturer); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误", "details": err.Error()})
		return
	}

	userID := c.GetString("user_id") // 从 Auth 中间件获取
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权"})
		return
	}

	if err := h.manufacturerService.CreateManufacturer(c.Request.Context(), &manufacturer, userID); err != nil {
		h.logger.Error("创建生产商失败", zap.Error(err))
		// 根据错误类型返回不同的状态码
		if errors.Is(err, errors.New("生产商名称已存在")) {
			c.JSON(http.StatusConflict, gin.H{"error": "生产商名称已存在"})
		} else if errors.Is(err, errors.New("只有管理员可以创建生产商")) {
			c.JSON(http.StatusForbidden, gin.H{"error": "只有管理员可以创建生产商"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "创建生产商失败", "details": err.Error()})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":         "创建生产商成功",
		"manufacturer_id": manufacturer.ID,
	})
}

// GetManufacturer 获取生产商详情
func (h *ManufacturerHandler) GetManufacturer(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "生产商ID不能为空"})
		return
	}

	manufacturer, err := h.manufacturerService.GetManufacturer(c.Request.Context(), id)
	if err != nil {
		h.logger.Warn("获取生产商失败", zap.Error(err), zap.String("id", id))
		if errors.Is(err, errors.New("生产商不存在")) {
			c.JSON(http.StatusNotFound, gin.H{"error": "生产商不存在"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "获取生产商失败", "details": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, manufacturer)
}

// ListManufacturers 列出所有生产商
func (h *ManufacturerHandler) ListManufacturers(c *gin.Context) {
	manufacturers, err := h.manufacturerService.ListManufacturers(c.Request.Context())
	if err != nil {
		h.logger.Error("查询生产商列表失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询生产商列表失败", "details": err.Error()})
		return
	}

	// 包装一下返回结果，更符合列表接口规范
	c.JSON(http.StatusOK, gin.H{
		"manufacturers": manufacturers,
		"total":         len(manufacturers), // 如果有分页，这里是总数
	})
}

// UpdateManufacturer 更新生产商信息
func (h *ManufacturerHandler) UpdateManufacturer(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "生产商ID不能为空"})
		return
	}

	var manufacturer model.Manufacturer
	// 只绑定需要更新的字段，避免覆盖不想更新的字段
	if err := c.ShouldBindJSON(&manufacturer); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误", "details": err.Error()})
		return
	}

	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权"})
		return
	}

	if err := h.manufacturerService.UpdateManufacturer(c.Request.Context(), id, &manufacturer, userID); err != nil {
		h.logger.Error("更新生产商失败", zap.Error(err), zap.String("id", id))
		if errors.Is(err, errors.New("生产商不存在")) {
			c.JSON(http.StatusNotFound, gin.H{"error": "生产商不存在"})
		} else if errors.Is(err, errors.New("更新后的生产商名称已存在")) {
			c.JSON(http.StatusConflict, gin.H{"error": "更新后的生产商名称已存在"})
		} else if errors.Is(err, errors.New("只有管理员可以更新生产商")) {
			c.JSON(http.StatusForbidden, gin.H{"error": "只有管理员可以更新生产商"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "更新生产商失败", "details": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "更新生产商成功"})
}

// DeleteManufacturer 删除生产商
func (h *ManufacturerHandler) DeleteManufacturer(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "生产商ID不能为空"})
		return
	}

	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权"})
		return
	}

	if err := h.manufacturerService.DeleteManufacturer(c.Request.Context(), id, userID); err != nil {
		h.logger.Error("删除生产商失败", zap.Error(err), zap.String("id", id))
		// 更精细的错误处理
		errMsg := err.Error()
		if errors.Is(err, errors.New("生产商不存在")) {
			c.JSON(http.StatusNotFound, gin.H{"error": errMsg})
		} else if errors.Is(err, errors.New("只有管理员可以删除生产商")) {
			c.JSON(http.StatusForbidden, gin.H{"error": errMsg})
		} else if errors.Is(err, errors.New("无法删除生产商")) { // 需要service层返回更具体的错误类型或文本
			c.JSON(http.StatusConflict, gin.H{"error": errMsg})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "删除生产商失败", "details": errMsg})
		}
		return
	}

	c.Status(http.StatusNoContent) // 删除成功返回 204 No Content
}
