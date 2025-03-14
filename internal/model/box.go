package model

import (
	"time"
)

// Box 盲盒模型
type Box struct {
	ID            string    `json:"id" gorm:"primarykey;type:varchar(36)"`
	Name          string    `json:"name" gorm:"size:100;not null"`
	Description   string    `json:"description" gorm:"size:500"`
	Price         float64   `json:"price" gorm:"not null"`
	OriginalPrice float64   `json:"original_price"`
	Category      string    `json:"category" gorm:"size:50;index"`
	ImageURL      string    `json:"image_url" gorm:"size:255"`
	Status        string    `json:"status" gorm:"size:20;default:'available'"` // available, sold, expired
	ExpiryDate    time.Time `json:"expiry_date" gorm:"type:datetime"`
	CreatorID     string    `json:"creator_id" gorm:"type:varchar(36);index"`
	Creator       User      `json:"creator" gorm:"foreignKey:CreatorID"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// BoxOrder 盲盒订单模型
type BoxOrder struct {
	ID          string    `json:"id" gorm:"primarykey;type:varchar(36)"`
	BoxID       string    `json:"box_id" gorm:"type:varchar(36);index"`
	Box         Box       `json:"box" gorm:"foreignKey:BoxID"`
	UserID      string    `json:"user_id" gorm:"type:varchar(36);index"`
	User        User      `json:"user" gorm:"foreignKey:UserID"`
	Price       float64   `json:"price" gorm:"not null"`
	Status      string    `json:"status" gorm:"size:20;default:'pending'"` // pending, paid, cancelled, completed
	PaymentType string    `json:"payment_type" gorm:"size:20"`
	PaymentID   string    `json:"payment_id" gorm:"size:64"`
	CreatedAt   time.Time `json:"created_at" gorm:"type:datetime"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"type:datetime"`
	PaidAt      time.Time `json:"paid_at" gorm:"type:datetime"`
}

// BoxListOptions 盲盒列表查询选项
type BoxListOptions struct {
	Page     int     // 页码
	Size     int     // 每页数量
	Category string  // 分类
	MinPrice float64 // 最低价格
	MaxPrice float64 // 最高价格
	SortBy   string  // 排序字段
	Order    string  // 排序顺序
	Keyword  string  // 搜索关键词
	Status   string  // 盲盒状态
}

// BoxDTO 盲盒数据传输对象
type BoxDTO struct {
	ID            string  `json:"id"`
	Name          string  `json:"name"`
	Description   string  `json:"description"`
	OriginalPrice float64 `json:"originalPrice"`
	CurrentPrice  float64 `json:"currentPrice"`
	Discount      float64 `json:"discount,omitempty"`
	Category      string  `json:"category"`
	ImageURL      string  `json:"imageUrl"`
	Status        string  `json:"status"`
	ExpiryDate    string  `json:"expiryDate"`
	CreatorName   string  `json:"creatorName,omitempty"`
	CreatedAt     string  `json:"createdAt"`
}

// BoxDetailDTO 盲盒详情数据传输对象
type BoxDetailDTO struct {
	BoxDTO
	NutritionFacts *NutritionFacts `json:"nutritionFacts,omitempty"`
	Allergens      []string        `json:"allergens,omitempty"`
	CreatorInfo    *UserInfo       `json:"creator,omitempty"`
}

// NutritionFacts 营养成分信息
type NutritionFacts struct {
	Calories int     `json:"calories"` // 卡路里
	Protein  float64 `json:"protein"`  // 蛋白质(g)
	Carbs    float64 `json:"carbs"`    // 碳水(g)
	Fat      float64 `json:"fat"`      // 脂肪(g)
}

// UserInfo 用户简略信息
type UserInfo struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Avatar  string `json:"avatar,omitempty"`
	Address string `json:"address,omitempty"`
}
