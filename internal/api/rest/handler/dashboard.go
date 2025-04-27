package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"FreshBox/internal/model"
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

// GetRecentActivity 获取近期动态
func (h *DashboardHandler) GetRecentActivity(c *gin.Context) {
	// 获取最近的盲盒开启记录
	var openings []model.BlindBoxOpening
	if err := h.blindBoxService.GetRecentOpenings(c.Request.Context(), &openings); err != nil {
		h.logger.Error("获取近期动态失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取近期动态失败", "details": err.Error()})
		return
	}

	// 构建响应数据
	var activities []gin.H
	for _, opening := range openings {
		// 获取用户信息
		user, err := h.blindBoxService.GetUserInfo(c.Request.Context(), opening.UserID)
		if err != nil {
			h.logger.Error("获取用户信息失败", zap.Error(err), zap.String("user_id", opening.UserID))
			continue
		}

		// 获取盲盒信息
		blindBox, err := h.blindBoxService.GetBlindBox(c.Request.Context(), opening.BlindBoxID)
		if err != nil {
			h.logger.Error("获取盲盒信息失败", zap.Error(err), zap.String("box_id", opening.BlindBoxID))
			continue
		}

		// 计算时间差
		timeAgo := time.Since(opening.OpenedAt)
		var timeUnit string
		var timeValue int

		if timeAgo < time.Hour {
			timeUnit = "minutesAgo"
			timeValue = int(timeAgo.Minutes())
		} else if timeAgo < 24*time.Hour {
			timeUnit = "hoursAgo"
			timeValue = int(timeAgo.Hours())
		} else {
			timeUnit = "daysAgo"
			timeValue = int(timeAgo.Hours() / 24)
		}

		// 构建活动项
		activity := gin.H{
			"id":       opening.ID,
			"user":     user.Nickname,
			"avatar":   user.Avatar,
			"action":   "opened",
			"time":     timeValue,
			"timeUnit": timeUnit,
			"boxCount": 1,
			"boxName":  blindBox.Name,
			"openedAt": opening.OpenedAt.Format("2006-01-02 15:04:05"),
		}

		activities = append(activities, activity)
	}

	c.JSON(http.StatusOK, gin.H{
		"data": activities,
	})
}
