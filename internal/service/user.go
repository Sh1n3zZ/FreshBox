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
	Email     string    `json:"email" gorm:"uniqueIndex"`
	Password  string    `json:"-" gorm:"not null"`
	Avatar    string    `json:"avatar,omitempty"`
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

	// 检查邮箱是否已存在
	if err := s.db.Model(&User{}).Where("email = ?", user.Email).Count(&count).Error; err != nil {
		return errors.Wrap(err, "检查邮箱失败")
	}
	if count > 0 {
		return errors.New("邮箱已被注册")
	}

	// 加密密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return errors.Wrap(err, "加密密码失败")
	}

	// 设置用户信息
	user.ID = GenerateUniqueID()
	user.Password = string(hashedPassword)
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()

	// 保存到数据库
	if err := s.db.Create(user).Error; err != nil {
		return errors.Wrap(err, "创建用户失败")
	}

	return nil
}

// LoginByEmail 使用邮箱登录
func (s *UserService) LoginByEmail(ctx context.Context, email, password string) (*User, error) {
	var user User
	if err := s.db.Where("email = ?", email).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.New("用户不存在")
		}
		return nil, errors.Wrap(err, "查询用户失败")
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
		if err == gorm.ErrRecordNotFound {
			return nil, errors.New("用户不存在")
		}
		return nil, errors.Wrap(err, "获取用户信息失败")
	}

	return &user, nil
}

// UpdateProfile 更新用户信息
func (s *UserService) UpdateProfile(ctx context.Context, user *User) error {
	updates := map[string]interface{}{
		"username":   user.Username,
		"email":      user.Email,
		"avatar":     user.Avatar,
		"updated_at": time.Now(),
	}

	if err := s.db.Model(&User{}).Where("id = ?", user.ID).Updates(updates).Error; err != nil {
		return errors.Wrap(err, "更新用户信息失败")
	}

	return nil
}

// GetUserByID 根据ID获取用户
func (s *UserService) GetUserByID(ctx context.Context, id string) (*User, error) {
	var user User
	if err := s.db.First(&user, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.New("用户不存在")
		}
		return nil, errors.Wrap(err, "获取用户失败")
	}
	return &user, nil
}
