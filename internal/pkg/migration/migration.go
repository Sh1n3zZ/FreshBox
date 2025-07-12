package migration

import (
	"log"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"FreshBox/internal/model"
	"FreshBox/internal/service"
)

// Run 执行数据库迁移
func Run(db *gorm.DB) error {
	log.Println("开始执行数据库迁移...")

	// 自动迁移数据表结构
	if err := autoMigrate(db); err != nil {
		log.Printf("自动迁移失败: %v\n", err)
		return err
	}

	log.Println("数据库迁移完成")
	return nil
}

// autoMigrate 执行表结构迁移
func autoMigrate(db *gorm.DB) error {
	log.Println("迁移用户表...")
	if err := db.AutoMigrate(&model.User{}); err != nil {
		return err
	}

	// 确保默认管理员用户存在
	var count int64
	if err := db.Model(&model.User{}).Where("role = ?", model.RoleAdmin).Count(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		// 加密默认管理员密码
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("FreshBox123456"), bcrypt.DefaultCost)
		if err != nil {
			return err
		}

		// 创建默认管理员用户
		adminUser := &model.User{
			ID:        service.GenerateUniqueID(),
			Username:  "admin",
			Email:     "admin@freshbox.com",
			Password:  string(hashedPassword),
			Role:      model.RoleAdmin,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		if err := db.Create(adminUser).Error; err != nil {
			return err
		}
		log.Println("已创建默认管理员用户")
	}

	log.Println("迁移生产商表...")
	if err := db.AutoMigrate(&model.Manufacturer{}); err != nil {
		return err
	}

	log.Println("迁移配料表...")
	if err := db.AutoMigrate(&model.Ingredient{}); err != nil {
		return err
	}

	log.Println("迁移商品表...")
	if err := db.AutoMigrate(&model.Product{}); err != nil {
		return err
	}

	log.Println("迁移盲盒表...")
	if err := db.AutoMigrate(&model.BlindBox{}); err != nil {
		return err
	}

	log.Println("迁移盲盒订单表...")
	if err := db.AutoMigrate(&model.BlindBoxOrder{}); err != nil {
		return err
	}

	log.Println("迁移盲盒开启记录表...")
	if err := db.AutoMigrate(&model.BlindBoxOpening{}); err != nil {
		return err
	}

	log.Println("迁移交易记录表...")
	if err := db.AutoMigrate(&model.Transaction{}); err != nil {
		return err
	}

	log.Println("迁移验证码表...")
	if err := db.AutoMigrate(&service.VerificationCode{}); err != nil {
		return err
	}

	log.Println("迁移任务表...")
	if err := db.AutoMigrate(&model.Task{}); err != nil {
		return err
	}

	log.Println("迁移任务步骤表...")
	if err := db.AutoMigrate(&model.TaskStep{}); err != nil {
		return err
	}

	log.Println("迁移任务提交表...")
	if err := db.AutoMigrate(&model.TaskSubmission{}); err != nil {
		return err
	}

	// 可以在这里添加其他迁移逻辑，如创建索引、添加默认数据等

	return nil
}
