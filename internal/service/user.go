package service

import (
	"context"
	"time"

	"github.com/pkg/errors"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// User 用户信息
type User struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	Username  string    `json:"username" gorm:"uniqueIndex"`
	Password  string    `json:"-" gorm:"not null"`
	Email     string    `json:"email"`
	Phone     string    `json:"phone"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// UserService 用户服务
type UserService struct {
	db *gorm.DB
}

// NewUserService 创建用户服务
func NewUserService(db *gorm.DB) *UserService {
	return &UserService{
		db: db,
	}
}

// Register 用户注册
func (s *UserService) Register(ctx context.Context, user *User) error {
	// 检查用户名是否已存在
	var count int64
	if err := s.db.Model(&User{}).Where("username = ?", user.Username).Count(&count).Error; err != nil {
		return errors.Wrap(err, "检查用户名失败")
	}
	if count > 0 {
		return errors.New("用户名已存在")
	}

	// 加密密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return errors.Wrap(err, "加密密码失败")
	}

	// 设置用户信息
	user.ID = GenerateID()
	user.Password = string(hashedPassword)
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()

	// 保存到数据库
	if err := s.db.Create(user).Error; err != nil {
		return errors.Wrap(err, "创建用户失败")
	}

	return nil
}

// Login 用户登录
func (s *UserService) Login(ctx context.Context, username, password string) (*User, error) {
	var user User
	if err := s.db.Where("username = ?", username).First(&user).Error; err != nil {
		return nil, errors.Wrap(err, "用户不存在")
	}

	// 验证密码
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, errors.New("密码错误")
	}

	return &user, nil
}

// GetProfile 获取用户信息
func (s *UserService) GetProfile(ctx context.Context, id string) (*User, error) {
	var user User
	if err := s.db.First(&user, "id = ?", id).Error; err != nil {
		return nil, errors.Wrap(err, "获取用户信息失败")
	}

	return &user, nil
}

// UpdateProfile 更新用户信息
func (s *UserService) UpdateProfile(ctx context.Context, user *User) error {
	// 只允许更新部分字段
	updates := map[string]interface{}{
		"email":      user.Email,
		"phone":      user.Phone,
		"updated_at": time.Now(),
	}

	if err := s.db.Model(&User{}).Where("id = ?", user.ID).Updates(updates).Error; err != nil {
		return errors.Wrap(err, "更新用户信息失败")
	}

	return nil
}
