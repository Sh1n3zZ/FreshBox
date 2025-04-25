package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"FreshBox/internal/model"
	"FreshBox/internal/service"
)

// IngredientHandler 配料处理器
type IngredientHandler struct {
	ingredientService *service.IngredientService
	logger            *zap.Logger
}

// NewIngredientHandler 创建配料处理器
func NewIngredientHandler(ingredientService *service.IngredientService) *IngredientHandler {
	logger, _ := zap.NewDevelopment()
	return &IngredientHandler{
		ingredientService: ingredientService,
		logger:            logger,
	}
}

// CreateIngredient 创建配料
func (h *IngredientHandler) CreateIngredient(c *gin.Context) {
	var ingredient model.Ingredient
	if err := c.ShouldBindJSON(&ingredient); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误", "details": err.Error()})
		return
	}

	// 获取用户ID (从认证中间件设置)
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权"})
		return
	}

	if err := h.ingredientService.CreateIngredient(c.Request.Context(), &ingredient, userID); err != nil {
		h.logger.Error("创建配料失败", zap.Error(err))
		// 根据错误类型返回不同状态码
		if err.Error() == "配料名称已存在" || err.Error() == "只有管理员可以创建配料" {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "创建配料失败", "details": err.Error()})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":       "创建配料成功",
		"ingredient_id": ingredient.ID,
	})
}

// GetIngredient 获取配料详情
func (h *IngredientHandler) GetIngredient(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "配料ID不能为空"})
		return
	}

	ingredient, err := h.ingredientService.GetIngredient(c.Request.Context(), id)
	if err != nil {
		h.logger.Warn("获取配料失败", zap.Error(err), zap.String("id", id))
		if err.Error() == "配料不存在" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "获取配料失败", "details": err.Error()})
		}
		return
	}

	// 使用IngredientDTO返回
	dto := model.IngredientDTO{
		ID:          ingredient.ID,
		Name:        ingredient.Name,
		Category:    ingredient.Category,
		IsAllergen:  ingredient.IsAllergen,
		Description: ingredient.Description,
	}
	c.JSON(http.StatusOK, dto)
}

// ListIngredients 列出所有配料
func (h *IngredientHandler) ListIngredients(c *gin.Context) {
	ingredients, err := h.ingredientService.ListIngredients(c.Request.Context())
	if err != nil {
		h.logger.Error("获取配料列表失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取配料列表失败", "details": err.Error()})
		return
	}

	// 转换成DTO列表
	var dtos []model.IngredientDTO
	for _, ing := range ingredients {
		dtos = append(dtos, model.IngredientDTO{
			ID:          ing.ID,
			Name:        ing.Name,
			Category:    ing.Category,
			IsAllergen:  ing.IsAllergen,
			Description: ing.Description,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"ingredients": dtos,
		"total":       len(dtos), // 如果没分页，total就是列表长度
	})
}

// UpdateIngredient 更新配料信息
func (h *IngredientHandler) UpdateIngredient(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "配料ID不能为空"})
		return
	}

	var data model.Ingredient
	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误", "details": err.Error()})
		return
	}

	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权"})
		return
	}

	if err := h.ingredientService.UpdateIngredient(c.Request.Context(), id, &data, userID); err != nil {
		h.logger.Error("更新配料失败", zap.Error(err), zap.String("id", id))
		if err.Error() == "配料不存在" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		} else if err.Error() == "只有管理员可以更新配料" || err.Error() == "更新后的配料名称已存在" {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "更新配料失败", "details": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "更新配料成功", "ingredient_id": id})
}

// DeleteIngredient 删除配料
func (h *IngredientHandler) DeleteIngredient(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "配料ID不能为空"})
		return
	}

	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未授权"})
		return
	}

	if err := h.ingredientService.DeleteIngredient(c.Request.Context(), id, userID); err != nil {
		h.logger.Error("删除配料失败", zap.Error(err), zap.String("id", id))
		if err.Error() == "配料不存在" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		} else if err.Error() == "只有管理员可以删除配料" || err.Error() == "无法删除配料，因为它已被产品使用" {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "删除配料失败", "details": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "删除配料成功", "ingredient_id": id})
}
