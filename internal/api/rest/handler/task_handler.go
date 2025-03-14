package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"FreshBox/internal/core/social"
	"FreshBox/internal/utils/response"
)

// TaskHandler 社交任务处理器
type TaskHandler struct {
	taskManager    social.TaskManager
	contentManager social.ContentManager
}

// NewTaskHandler 创建任务处理器
func NewTaskHandler(taskManager social.TaskManager, contentManager social.ContentManager) *TaskHandler {
	return &TaskHandler{
		taskManager:    taskManager,
		contentManager: contentManager,
	}
}

// CreateTask 创建任务
func (h *TaskHandler) CreateTask(c *gin.Context) {
	var req struct {
		Type        string    `json:"type" binding:"required"`
		Title       string    `json:"title" binding:"required"`
		Description string    `json:"description" binding:"required"`
		Deadline    time.Time `json:"deadline" binding:"required"`
		Reward      float64   `json:"reward" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "参数错误", err)
		return
	}

	// 从请求中获取用户ID（假设中间件已设置）
	userID := c.GetString("user_id")
	if userID == "" {
		userID = "mock-user-id" // 模拟数据
	}

	task := &social.Task{
		ID:          uuid.NewString(),
		UserID:      userID,
		Type:        req.Type,
		Title:       req.Title,
		Description: req.Description,
		Status:      social.TaskStatusPending,
		CreatedAt:   time.Now(),
		Deadline:    req.Deadline,
		Reward:      req.Reward,
	}

	// 模拟创建任务
	// err := h.taskManager.CreateTask(c.Request.Context(), task)
	// if err != nil {
	// 	response.Error(c, http.StatusInternalServerError, "创建任务失败", err)
	// 	return
	// }

	response.Success(c, task)
}

// GetTask 获取任务
func (h *TaskHandler) GetTask(c *gin.Context) {
	taskID := c.Param("id")

	// 模拟返回固定数据
	task := &social.Task{
		ID:          taskID,
		UserID:      "mock-user-id",
		Type:        "recipe_challenge",
		Title:       "创意料理挑战",
		Description: "使用盲盒食材制作一道创意料理，并分享照片和做法",
		Status:      social.TaskStatusOngoing,
		CreatedAt:   time.Now().Add(-24 * time.Hour),
		Deadline:    time.Now().Add(6 * 24 * time.Hour),
		Reward:      50,
	}

	response.Success(c, task)
}

// GetTaskProgress 获取任务进度
func (h *TaskHandler) GetTaskProgress(c *gin.Context) {
	taskID := c.Param("id")

	// 模拟返回固定数据
	progress := &social.TaskProgress{
		TaskID:    taskID,
		Status:    social.TaskStatusOngoing,
		Progress:  0.65,
		UpdatedAt: time.Now(),
		Milestones: []string{
			"已购买盲盒",
			"已制作料理",
			"待上传照片",
			"待分享社区",
		},
	}

	response.Success(c, progress)
}

// UpdateTaskStatus 更新任务状态
func (h *TaskHandler) UpdateTaskStatus(c *gin.Context) {
	taskID := c.Param("id")

	var req struct {
		Status social.TaskStatus `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "参数错误", err)
		return
	}

	// 模拟更新状态
	// err := h.taskManager.UpdateTaskStatus(c.Request.Context(), taskID, req.Status)
	// if err != nil {
	// 	response.Error(c, http.StatusInternalServerError, "更新任务状态失败", err)
	// 	return
	// }

	response.Success(c, gin.H{
		"task_id": taskID,
		"status":  req.Status,
	})
}

// UploadTaskContent 上传任务内容
func (h *TaskHandler) UploadTaskContent(c *gin.Context) {
	taskID := c.Param("id")

	var req struct {
		Type     string `json:"type" binding:"required"`
		URL      string `json:"url" binding:"required"`
		Metadata string `json:"metadata"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "参数错误", err)
		return
	}

	content := &social.TaskContent{
		ID:        uuid.NewString(),
		TaskID:    taskID,
		Type:      req.Type,
		URL:       req.URL,
		Metadata:  req.Metadata,
		CreatedAt: time.Now(),
	}

	// 模拟上传内容
	// err := h.contentManager.UploadContent(c.Request.Context(), content)
	// if err != nil {
	// 	response.Error(c, http.StatusInternalServerError, "上传任务内容失败", err)
	// 	return
	// }

	response.Success(c, content)
}

// ListTasks 获取任务列表
func (h *TaskHandler) ListTasks(c *gin.Context) {
	// 可以接收查询参数如类型、状态等进行过滤
	taskType := c.Query("type")
	status := c.Query("status")

	// 模拟返回固定数据
	tasks := []*social.Task{
		{
			ID:          uuid.NewString(),
			UserID:      "mock-user-id-1",
			Type:        "recipe_challenge",
			Title:       "创意料理挑战",
			Description: "使用盲盒食材制作一道创意料理，并分享照片和做法",
			Status:      social.TaskStatusOngoing,
			CreatedAt:   time.Now().Add(-24 * time.Hour),
			Deadline:    time.Now().Add(6 * 24 * time.Hour),
			Reward:      50,
		},
		{
			ID:          uuid.NewString(),
			UserID:      "mock-user-id-2",
			Type:        "food_rescue",
			Title:       "食物拯救行动",
			Description: "收集并分享5个减少食物浪费的实用技巧",
			Status:      social.TaskStatusPending,
			CreatedAt:   time.Now().Add(-48 * time.Hour),
			Deadline:    time.Now().Add(3 * 24 * time.Hour),
			Reward:      30,
		},
		{
			ID:          uuid.NewString(),
			UserID:      "mock-user-id-3",
			Type:        "community_sharing",
			Title:       "社区分享会",
			Description: "组织一次小型的临期食品分享活动，并记录过程",
			Status:      social.TaskStatusCompleted,
			CreatedAt:   time.Now().Add(-7 * 24 * time.Hour),
			Deadline:    time.Now().Add(-2 * 24 * time.Hour),
			Reward:      100,
		},
	}

	// 根据查询参数过滤（如果提供了参数）
	var filtered []*social.Task
	for _, task := range tasks {
		if (taskType == "" || task.Type == taskType) &&
			(status == "" || string(task.Status) == status) {
			filtered = append(filtered, task)
		}
	}

	if filtered == nil {
		filtered = []*social.Task{}
	}

	response.Success(c, filtered)
}

// GetRecommendedTasks 获取推荐任务
func (h *TaskHandler) GetRecommendedTasks(c *gin.Context) {
	// 模拟返回固定数据
	tasks := []*social.Task{
		{
			ID:          uuid.NewString(),
			UserID:      "system",
			Type:        "recipe_challenge",
			Title:       "水果盲盒创意甜点",
			Description: "使用水果盲盒制作创意甜点，拍照分享获得奖励",
			Status:      social.TaskStatusPending,
			CreatedAt:   time.Now().Add(-12 * time.Hour),
			Deadline:    time.Now().Add(10 * 24 * time.Hour),
			Reward:      80,
		},
		{
			ID:          uuid.NewString(),
			UserID:      "system",
			Type:        "zero_waste",
			Title:       "零浪费厨房挑战",
			Description: "连续7天实践零浪费烹饪，分享你的经验和技巧",
			Status:      social.TaskStatusPending,
			CreatedAt:   time.Now().Add(-2 * 24 * time.Hour),
			Deadline:    time.Now().Add(14 * 24 * time.Hour),
			Reward:      120,
		},
	}

	response.Success(c, tasks)
}

// GetTaskContents 获取任务内容列表
func (h *TaskHandler) GetTaskContents(c *gin.Context) {
	taskID := c.Param("id")

	// 模拟返回固定数据
	contents := []*social.TaskContent{
		{
			ID:        uuid.NewString(),
			TaskID:    taskID,
			Type:      "image",
			URL:       "https://example.com/images/task1/image1.jpg",
			Metadata:  `{"description": "料理完成图", "tags": ["创意料理", "盲盒挑战"]}`,
			CreatedAt: time.Now().Add(-12 * time.Hour),
		},
		{
			ID:        uuid.NewString(),
			TaskID:    taskID,
			Type:      "text",
			URL:       "",
			Metadata:  `{"content": "今天使用了盲盒中的牛油果、西红柿和鸡蛋，做了一份健康早餐。牛油果还剩一半，计划明天做成沙拉。", "tags": ["经验分享", "食材规划"]}`,
			CreatedAt: time.Now().Add(-24 * time.Hour),
		},
	}

	response.Success(c, contents)
}

// GetPopularTasks 获取热门任务
func (h *TaskHandler) GetPopularTasks(c *gin.Context) {
	// 模拟返回固定数据
	tasks := []*social.Task{
		{
			ID:          uuid.NewString(),
			UserID:      "system",
			Type:        "group_challenge",
			Title:       "社区厨房大挑战",
			Description: "组队参与，使用临期食材制作美食并评比",
			Status:      social.TaskStatusOngoing,
			CreatedAt:   time.Now().Add(-5 * 24 * time.Hour),
			Deadline:    time.Now().Add(25 * 24 * time.Hour),
			Reward:      200,
		},
		{
			ID:          uuid.NewString(),
			UserID:      "system",
			Type:        "education",
			Title:       "食品安全科普任务",
			Description: "制作一份关于如何判断食品是否过期的科普内容",
			Status:      social.TaskStatusOngoing,
			CreatedAt:   time.Now().Add(-3 * 24 * time.Hour),
			Deadline:    time.Now().Add(11 * 24 * time.Hour),
			Reward:      60,
		},
	}

	response.Success(c, tasks)
}
