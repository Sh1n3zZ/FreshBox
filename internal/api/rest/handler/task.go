package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"FreshBox/internal/core/social"
)

// CreateTask 创建任务
func CreateTask(c *gin.Context) {
	var task social.Task
	if err := c.ShouldBindJSON(&task); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "无效的请求参数",
		})
		return
	}

	// TODO: 调用业务逻辑处理

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": task,
		"msg":  "创建成功",
	})
}

// GetTask 获取任务详情
func GetTask(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "ID不能为空",
		})
		return
	}

	// TODO: 调用业务逻辑处理

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": social.Task{ID: id},
		"msg":  "获取成功",
	})
}

// GetTaskProgress 获取任务进度
func GetTaskProgress(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "ID不能为空",
		})
		return
	}

	// TODO: 调用业务逻辑处理

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": social.TaskProgress{
			TaskID:   id,
			Progress: 0.5,
		},
		"msg": "获取成功",
	})
}

// UpdateTaskStatus 更新任务状态
func UpdateTaskStatus(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "ID不能为空",
		})
		return
	}

	var req struct {
		Status social.TaskStatus `json:"status"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "无效的请求参数",
		})
		return
	}

	// TODO: 调用业务逻辑处理

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "更新成功",
	})
}

// UploadTaskContent 上传任务内容
func UploadTaskContent(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "ID不能为空",
		})
		return
	}

	var content social.TaskContent
	if err := c.ShouldBindJSON(&content); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code": 400,
			"msg":  "无效的请求参数",
		})
		return
	}

	content.TaskID = id

	// TODO: 调用业务逻辑处理

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": content,
		"msg":  "上传成功",
	})
}
