package migration

import (
	"log"

	"gorm.io/gorm"

	"FreshBox/internal/model"
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

	log.Println("迁移盲盒表...")
	if err := db.AutoMigrate(&model.Box{}); err != nil {
		return err
	}

	log.Println("迁移交易记录表...")
	if err := db.AutoMigrate(&model.Transaction{}); err != nil {
		return err
	}

	// 可以在这里添加其他迁移逻辑，如创建索引、添加默认数据等

	return nil
}
