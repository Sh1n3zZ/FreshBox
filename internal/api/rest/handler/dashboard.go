package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// DashboardHandler 仪表盘处理器
type DashboardHandler struct{}

// NewDashboardHandler 创建仪表盘处理器
func NewDashboardHandler() *DashboardHandler {
	return &DashboardHandler{}
}

// GetSummary 获取仪表盘摘要信息
func (h *DashboardHandler) GetSummary(c *gin.Context) {
	// Mock数据
	summary := gin.H{
		"total_boxes":          237,
		"boxes_sold_today":     42,
		"boxes_created_today":  15,
		"total_users":          483,
		"active_users_today":   89,
		"total_revenue":        8750.50,
		"revenue_today":        1250.75,
		"donation_amount":      2340.00,
		"completed_tasks":      156,
		"tasks_in_progress":    78,
		"average_discount":     "25%",
		"food_waste_prevented": "235kg",
	}

	c.JSON(http.StatusOK, gin.H{
		"code":     200,
		"data":     summary,
		"msg":      "获取仪表盘摘要成功",
		"trace_id": uuid.New().String(),
	})
}

// GetRevenueStats 获取收入统计
func (h *DashboardHandler) GetRevenueStats(c *gin.Context) {
	// Mock数据 - 最近7天的收入数据
	now := time.Now()
	stats := []gin.H{}

	for i := 6; i >= 0; i-- {
		date := now.AddDate(0, 0, -i)
		stats = append(stats, gin.H{
			"date":     date.Format("2006-01-02"),
			"revenue":  float64(300 + i*150 + (i%3)*75),
			"boxes":    10 + i*3 + (i%2)*2,
			"discount": 20 + (i%5)*2,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"code":     200,
		"data":     stats,
		"msg":      "获取收入统计成功",
		"trace_id": uuid.New().String(),
	})
}

// GetBoxCategories 获取盲盒类别统计
func (h *DashboardHandler) GetBoxCategories(c *gin.Context) {
	// Mock数据 - 盲盒类别分布
	categories := []gin.H{
		{"name": "蔬菜水果", "count": 78, "percentage": 32.9},
		{"name": "乳制品", "count": 45, "percentage": 19.0},
		{"name": "烘焙食品", "count": 38, "percentage": 16.0},
		{"name": "零食", "count": 32, "percentage": 13.5},
		{"name": "饮料", "count": 25, "percentage": 10.5},
		{"name": "其他", "count": 19, "percentage": 8.1},
	}

	c.JSON(http.StatusOK, gin.H{
		"code":     200,
		"data":     categories,
		"msg":      "获取盲盒类别统计成功",
		"trace_id": uuid.New().String(),
	})
}

// GetUserActivity 获取用户活跃度
func (h *DashboardHandler) GetUserActivity(c *gin.Context) {
	// Mock数据 - 最近30天的用户活跃数据
	now := time.Now()
	activities := []gin.H{}

	for i := 29; i >= 0; i-- {
		date := now.AddDate(0, 0, -i)
		base := 50 + (30-i)*3
		activities = append(activities, gin.H{
			"date":         date.Format("2006-01-02"),
			"active_users": base + (i%7)*10,
			"new_users":    5 + (i%5)*3,
			"purchases":    base/2 + (i%4)*5,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"code":     200,
		"data":     activities,
		"msg":      "获取用户活跃度成功",
		"trace_id": uuid.New().String(),
	})
}

// GetDonationStats 获取捐赠统计
func (h *DashboardHandler) GetDonationStats(c *gin.Context) {
	// Mock数据 - 捐赠统计
	donations := []gin.H{
		{"month": "一月", "amount": 230.50, "count": 12},
		{"month": "二月", "amount": 310.75, "count": 18},
		{"month": "三月", "amount": 280.00, "count": 15},
		{"month": "四月", "amount": 420.25, "count": 23},
		{"month": "五月", "amount": 350.50, "count": 19},
		{"month": "六月", "amount": 510.75, "count": 28},
		{"month": "七月", "amount": 460.00, "count": 25},
		{"month": "八月", "amount": 390.25, "count": 21},
		{"month": "九月", "amount": 430.50, "count": 24},
		{"month": "十月", "amount": 520.75, "count": 29},
		{"month": "十一月", "amount": 480.00, "count": 26},
		{"month": "十二月", "amount": 560.25, "count": 31},
	}

	c.JSON(http.StatusOK, gin.H{
		"code":     200,
		"data":     donations,
		"msg":      "获取捐赠统计成功",
		"trace_id": uuid.New().String(),
	})
}

// GetRecentBoxes 获取最近创建的盲盒
func (h *DashboardHandler) GetRecentBoxes(c *gin.Context) {
	// Mock数据 - 最近创建的盲盒
	boxes := []gin.H{
		{
			"id":             "box_" + uuid.New().String(),
			"name":           "新鲜水果盲盒",
			"price":          45.50,
			"original_price": 65.00,
			"discount":       30,
			"created_at":     time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
			"status":         "available",
			"category":       "蔬菜水果",
			"image_url":      "/static/uploads/boxes/fruit_box.jpg",
		},
		{
			"id":             "box_" + uuid.New().String(),
			"name":           "烘焙甜点盲盒",
			"price":          32.25,
			"original_price": 43.00,
			"discount":       25,
			"created_at":     time.Now().Add(-5 * time.Hour).Format(time.RFC3339),
			"status":         "available",
			"category":       "烘焙食品",
			"image_url":      "/static/uploads/boxes/bakery_box.jpg",
		},
		{
			"id":             "box_" + uuid.New().String(),
			"name":           "乳制品盲盒",
			"price":          28.50,
			"original_price": 38.00,
			"discount":       25,
			"created_at":     time.Now().Add(-8 * time.Hour).Format(time.RFC3339),
			"status":         "available",
			"category":       "乳制品",
			"image_url":      "/static/uploads/boxes/dairy_box.jpg",
		},
		{
			"id":             "box_" + uuid.New().String(),
			"name":           "零食综合盲盒",
			"price":          35.00,
			"original_price": 50.00,
			"discount":       30,
			"created_at":     time.Now().Add(-12 * time.Hour).Format(time.RFC3339),
			"status":         "sold",
			"category":       "零食",
			"image_url":      "/static/uploads/boxes/snack_box.jpg",
		},
		{
			"id":             "box_" + uuid.New().String(),
			"name":           "饮料盲盒",
			"price":          22.75,
			"original_price": 35.00,
			"discount":       35,
			"created_at":     time.Now().Add(-18 * time.Hour).Format(time.RFC3339),
			"status":         "sold",
			"category":       "饮料",
			"image_url":      "/static/uploads/boxes/drink_box.jpg",
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"code":     200,
		"data":     boxes,
		"msg":      "获取最近盲盒成功",
		"trace_id": uuid.New().String(),
	})
}

// GetTopPerformingTasks 获取表现最好的任务
func (h *DashboardHandler) GetTopPerformingTasks(c *gin.Context) {
	// Mock数据 - 表现最好的任务
	tasks := []gin.H{
		{
			"id":              "task_" + uuid.New().String(),
			"title":           "食材创新挑战",
			"participation":   156,
			"completion_rate": 78.5,
			"avg_time":        "3.5天",
			"type":            "recipe_challenge",
		},
		{
			"id":              "task_" + uuid.New().String(),
			"title":           "即将过期食品分享",
			"participation":   134,
			"completion_rate": 92.3,
			"avg_time":        "1.2天",
			"type":            "sharing",
		},
		{
			"id":              "task_" + uuid.New().String(),
			"title":           "剩余食材捐赠",
			"participation":   98,
			"completion_rate": 85.7,
			"avg_time":        "2.1天",
			"type":            "donation",
		},
		{
			"id":              "task_" + uuid.New().String(),
			"title":           "美食摄影挑战",
			"participation":   87,
			"completion_rate": 76.2,
			"avg_time":        "4.3天",
			"type":            "photo_challenge",
		},
		{
			"id":              "task_" + uuid.New().String(),
			"title":           "零浪费食谱分享",
			"participation":   75,
			"completion_rate": 80.0,
			"avg_time":        "3.8天",
			"type":            "recipe_sharing",
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"code":     200,
		"data":     tasks,
		"msg":      "获取任务表现成功",
		"trace_id": uuid.New().String(),
	})
}
