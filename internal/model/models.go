package model

import (
	"time"
)

// UserRole 用户角色类型
type UserRole string

const (
	RoleAdmin UserRole = "admin"
	RoleUser  UserRole = "user"
)

// User 用户模型
type User struct {
	ID        string    `gorm:"primarykey;type:varchar(36)"`
	CreatedAt time.Time `gorm:"type:datetime"`
	UpdatedAt time.Time `gorm:"type:datetime"`
	Username  string    `gorm:"uniqueIndex;size:255"`
	Email     string    `gorm:"uniqueIndex;size:255"`
	Password  string    `gorm:"size:255"`
	Nickname  string    `gorm:"size:50"`
	Avatar    string    `gorm:"size:255"`
	Role      UserRole  `gorm:"type:varchar(20);default:'user'"`
}

// StorageCondition 商品存储条件类型
type StorageCondition string

const (
	StorageRoomTemp StorageCondition = "常温"
	StorageChilled  StorageCondition = "冷藏"
	StorageFrozen   StorageCondition = "冷冻"
)

// Manufacturer 生产商模型
type Manufacturer struct {
	ID                  string    `json:"id" gorm:"primarykey;type:varchar(36)"`
	Name                string    `json:"name" gorm:"size:255;not null;uniqueIndex"`
	ContactPhone        string    `json:"contact_phone" gorm:"size:20"`
	Address             string    `json:"address" gorm:"size:512"`
	CertificationNumber string    `json:"certification_number" gorm:"size:100"`
	CreatedAt           time.Time `json:"created_at" gorm:"type:datetime"`
}

// IngredientCategory 配料分类类型
type IngredientCategory string

const (
	CategoryCereal   IngredientCategory = "谷物"
	CategoryFruitVeg IngredientCategory = "果蔬"
	CategoryProtein  IngredientCategory = "蛋白质"
	CategoryAdditive IngredientCategory = "添加剂"
	CategoryOther    IngredientCategory = "其他" // 添加一个默认或其他分类
)

// Ingredient 配料模型
type Ingredient struct {
	ID          string             `json:"id" gorm:"primarykey;type:varchar(36)"`
	Name        string             `json:"name" gorm:"size:255;not null;uniqueIndex"`
	Category    IngredientCategory `json:"category" gorm:"type:varchar(50);not null;index"`
	IsAllergen  bool               `json:"is_allergen" gorm:"default:false"`
	Description string             `json:"description" gorm:"type:text"`
	Products    []*Product         `json:"-" gorm:"many2many:product_ingredients;"`
}

// Product 商品模型
type Product struct {
	ID               string           `json:"id" gorm:"primarykey;type:varchar(36)"`
	Name             string           `json:"name" gorm:"size:255;not null"`
	Category         string           `json:"category" gorm:"size:50;not null;index"`
	Description      string           `json:"description" gorm:"size:500"`
	ImageURL         string           `json:"image_url" gorm:"size:255"`
	Price            float64          `json:"price" gorm:"not null"`
	ProductionDate   time.Time        `json:"production_date" gorm:"type:datetime;not null"`
	ShelfLifeHours   int              `json:"shelfLifeHours" gorm:"not null"`
	Status           string           `json:"status" gorm:"size:20;default:'available'"` // available, in_blind_box, sold
	BlindBoxID       string           `json:"BlindBoxID" gorm:"type:varchar(36);index"`
	BlindBox         *BlindBox        `json:"blind_box" gorm:"foreignKey:BlindBoxID"`
	CreatorID        string           `json:"creator_id" gorm:"type:varchar(36);index"`
	Creator          User             `json:"creator" gorm:"foreignKey:CreatorID"`
	ManufacturerID   string           `json:"manufacturerId" gorm:"type:varchar(36);not null;index"`
	Manufacturer     Manufacturer     `json:"manufacturer" gorm:"foreignKey:ManufacturerID"`
	BatchNumber      string           `json:"batch_number" gorm:"size:50"`
	StorageCondition StorageCondition `json:"storage_condition" gorm:"type:varchar(20);not null;default:'常温'"`
	Ingredients      []*Ingredient    `json:"ingredients" gorm:"many2many:product_ingredients;"`
	CreatedAt        time.Time        `json:"created_at" gorm:"type:datetime"`
	UpdatedAt        time.Time        `json:"updated_at" gorm:"type:datetime"`
}

// BlindBox 盲盒模型
type BlindBox struct {
	ID                  string    `json:"id" gorm:"primarykey;type:varchar(36)"`
	Name                string    `json:"name" gorm:"size:255;not null"`
	Description         string    `json:"description" gorm:"size:500"`
	DiscountCoefficient float64   `json:"discount_coefficient" gorm:"not null"`   // 动态定价系数
	Status              string    `json:"status" gorm:"size:20;default:'active'"` // active, sold_out
	ImageURL            string    `json:"image_url" gorm:"size:255"`
	ExpirationTime      time.Time `json:"expiration_time" gorm:"type:datetime;not null"`
	Category            string    `json:"category" gorm:"size:50;index"`
	DonationAmount      float64   `json:"donation_amount" gorm:"default:0.10"`
	CreatorID           string    `json:"creator_id" gorm:"type:varchar(36);index"`
	Creator             User      `json:"creator" gorm:"foreignKey:CreatorID"`
	CreatedAt           time.Time `json:"created_at" gorm:"type:datetime"`
	UpdatedAt           time.Time `json:"updated_at" gorm:"type:datetime"`
}

// BlindBoxOrder 盲盒订单模型
type BlindBoxOrder struct {
	ID          string    `json:"id" gorm:"primarykey;type:varchar(36)"`
	BlindBoxID  string    `json:"blind_box_id" gorm:"type:varchar(36);index"`
	BlindBox    BlindBox  `json:"blind_box" gorm:"foreignKey:BlindBoxID"`
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

// BlindBoxOpening 盲盒开启记录模型
type BlindBoxOpening struct {
	ID                string    `json:"id" gorm:"primarykey;type:varchar(36)"`
	UserID            string    `json:"user_id" gorm:"type:varchar(36);index;not null"`
	User              User      `json:"user" gorm:"foreignKey:UserID"`
	BlindBoxID        string    `json:"BlindBoxID" gorm:"type:varchar(36);index;not null"`
	BlindBox          BlindBox  `json:"blind_box" gorm:"foreignKey:BlindBoxID"`
	ObtainedProductID string    `json:"obtained_product_id" gorm:"type:varchar(36);not null"`
	ObtainedProduct   Product   `json:"obtained_product" gorm:"foreignKey:ObtainedProductID"`
	OpenedAt          time.Time `json:"opened_at" gorm:"type:datetime"`
}

// Transaction 交易记录模型
type Transaction struct {
	ID         uint      `gorm:"primarykey"`
	CreatedAt  time.Time `gorm:"type:datetime"`
	UpdatedAt  time.Time `gorm:"type:datetime"`
	BlindBoxID string    `gorm:"index;type:varchar(36)"`
	BlindBox   BlindBox  `gorm:"foreignKey:BlindBoxID"`
	ProductID  string    `gorm:"index;type:varchar(36)"`
	Product    Product   `gorm:"foreignKey:ProductID"`
	BuyerID    string    `gorm:"index;type:varchar(36)"`
	Buyer      User      `gorm:"foreignKey:BuyerID"`
	Price      float64
	Status     string `gorm:"size:20"` // pending, completed, cancelled
}

// BoxListOptions 盲盒列表查询选项
type BlindBoxListOptions struct {
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

// ProductListOptions 商品列表查询选项
type ProductListOptions struct {
	Page     int     // 页码
	Size     int     // 每页数量
	Category string  // 分类
	MinPrice float64 // 最低价格
	MaxPrice float64 // 最高价格
	SortBy   string  // 排序字段
	Order    string  // 排序顺序
	Keyword  string  // 搜索关键词
	Status   string  // 商品状态
}

// BlindBoxDTO 盲盒数据传输对象
type BlindBoxDTO struct {
	ID                  string  `json:"id"`
	Name                string  `json:"name"`
	Description         string  `json:"description"`
	DiscountCoefficient float64 `json:"discountCoefficient"`
	Category            string  `json:"category"`
	ImageURL            string  `json:"imageUrl"`
	Status              string  `json:"status"`
	ExpirationTime      string  `json:"expirationTime"`
	DonationAmount      float64 `json:"donationAmount"`
	CreatorName         string  `json:"creatorName,omitempty"`
	ProductCount        int     `json:"productCount,omitempty"`
	CreatedAt           string  `json:"createdAt"`
}

// BlindBoxDetailDTO 盲盒详情数据传输对象
type BlindBoxDetailDTO struct {
	BlindBoxDTO
	Products    []ProductDTO `json:"products,omitempty"`
	CreatorInfo *UserInfo    `json:"creator,omitempty"`
}

// ProductDTO 商品数据传输对象
type ProductDTO struct {
	ID               string           `json:"id"`
	Name             string           `json:"name"`
	Description      string           `json:"description"`
	Price            float64          `json:"price"`
	Category         string           `json:"category"`
	ImageURL         string           `json:"imageUrl"`
	Status           string           `json:"status"`
	ProductionDate   string           `json:"productionDate"`
	ShelfLifeHours   int              `json:"shelfLifeHours"`
	CreatorName      string           `json:"creatorName,omitempty"`
	CreatedAt        string           `json:"createdAt"`
	ManufacturerName string           `json:"manufacturerName,omitempty"`
	BatchNumber      string           `json:"batchNumber,omitempty"`
	StorageCondition StorageCondition `json:"storageCondition,omitempty"`
	Ingredients      []*IngredientDTO `json:"ingredients,omitempty"`
}

// IngredientDTO 配料数据传输对象
type IngredientDTO struct {
	ID          string             `json:"id"`
	Name        string             `json:"name"`
	Category    IngredientCategory `json:"category"`
	IsAllergen  bool               `json:"isAllergen"`
	Description string             `json:"description,omitempty"`
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
