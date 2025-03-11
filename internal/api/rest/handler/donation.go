package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"FreshBox/internal/core/donation"
)

// CreateDonation 创建捐赠
func CreateDonation(c *gin.Context) {
	var req donation.Donation
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
		"data": req,
		"msg":  "创建成功",
	})
}

// GetDonation 获取捐赠详情
func GetDonation(c *gin.Context) {
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
		"data": donation.Donation{ID: id},
		"msg":  "获取成功",
	})
}

// GetDonationProof 获取捐赠凭证
func GetDonationProof(c *gin.Context) {
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
		"data": donation.DonationProof{
			ProofID:    "proof_xxx",
			DonationID: id,
		},
		"msg": "获取成功",
	})
}

// GetDonationTransaction 获取捐赠交易
func GetDonationTransaction(c *gin.Context) {
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
		"data": donation.Transaction{
			Hash: "0x...",
		},
		"msg": "获取成功",
	})
}
