package model

import (
	"time"
)

// User 用户模型
type User struct {
	ID        string `gorm:"primarykey;type:varchar(36)"`
	CreatedAt time.Time
	UpdatedAt time.Time
	Username  string `gorm:"uniqueIndex;size:255"`
	Email     string `gorm:"uniqueIndex;size:255"`
	Password  string `gorm:"size:255"`
	Nickname  string `gorm:"size:50"`
	Avatar    string `gorm:"size:255"`
}

// Box 盲盒模型
type Box struct {
	ID          uint `gorm:"primarykey"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	Name        string `gorm:"size:100"`
	Description string `gorm:"size:500"`
	Price       float64
	ImageURL    string `gorm:"size:255"`
	Status      string `gorm:"size:20"` // available, sold
	OwnerID     string `gorm:"index;type:varchar(36)"`
	Owner       User   `gorm:"foreignKey:OwnerID"`
}

// Transaction 交易记录模型
type Transaction struct {
	ID        uint `gorm:"primarykey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	BoxID     uint   `gorm:"index"`
	Box       Box    `gorm:"foreignKey:BoxID"`
	BuyerID   string `gorm:"index;type:varchar(36)"`
	Buyer     User   `gorm:"foreignKey:BuyerID"`
	Price     float64
	Status    string `gorm:"size:20"` // pending, completed, cancelled
}
