package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"FreshBox/internal/service"
)

// DashboardHandler 仪表盘处理器
type DashboardHandler struct {
	blindBoxService *service.BlindBoxService
	logger          *zap.Logger
}

// NewDashboardHandler 创建仪表盘处理器
func NewDashboardHandler(blindBoxService *service.BlindBoxService) *DashboardHandler {
	logger, _ := zap.NewDevelopment()
	return &DashboardHandler{
		blindBoxService: blindBoxService,
		logger:          logger,
	}
}

// GetDashboardStats 获取仪表盘统计数据
func (h *DashboardHandler) GetDashboardStats(c *gin.Context) {
	// 获取统计数据
	stats, err := h.blindBoxService.GetDashboardStats(c.Request.Context())
	if err != nil {
		h.logger.Error("获取仪表盘统计数据失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取仪表盘统计数据失败", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"stats": stats,
	})
}

// GetBlindBoxOpeningTrend 获取盲盒开启趋势
func (h *DashboardHandler) GetBlindBoxOpeningTrend(c *gin.Context) {
	// 获取时间范围参数
	startTimeStr := c.DefaultQuery("startTime", "")
	endTimeStr := c.DefaultQuery("endTime", "")

	// 解析时间
	startTime, err := time.Parse("2006-01-02", startTimeStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "开始时间格式错误"})
		return
	}

	endTime, err := time.Parse("2006-01-02", endTimeStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "结束时间格式错误"})
		return
	}

	// 获取趋势数据
	trendData, err := h.blindBoxService.GetBlindBoxOpeningTrend(c.Request.Context(), startTime, endTime)
	if err != nil {
		h.logger.Error("获取盲盒开启趋势失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取盲盒开启趋势失败", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": trendData,
	})
}
