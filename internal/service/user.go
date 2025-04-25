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
	Role      string    `json:"role" gorm:"type:varchar(20);default:'user'"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// RegisterRequest 用户注册请求
type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Code     string `json:"code" binding:"required"`
	Role     string `json:"role" binding:"omitempty,oneof=admin user"`
}

// UserService 用户服务
type UserService struct {
	db          *gorm.DB
	mailService *MailService
}

// NewUserService 创建用户服务
func NewUserService(db *gorm.DB, mailService *MailService) *UserService {
	return &UserService{
		db:          db,
		mailService: mailService,
	}
}

// Register 用户注册
func (s *UserService) Register(ctx context.Context, req *RegisterRequest) (*User, error) {
	// 验证邮箱验证码
	valid, err := s.mailService.VerifyCode(ctx, req.Email, req.Code)
	if err != nil {
		return nil, errors.Wrap(err, "验证码验证失败")
	}
	if !valid {
		return nil, errors.New("验证码无效或已过期")
	}

	// 检查用户名是否已存在
	var count int64
	if err := s.db.Model(&User{}).Where("username = ?", req.Username).Count(&count).Error; err != nil {
		return nil, errors.Wrap(err, "检查用户名失败")
	}
	if count > 0 {
		return nil, errors.New("用户名已存在")
	}

	// 检查邮箱是否已存在
	if err := s.db.Model(&User{}).Where("email = ?", req.Email).Count(&count).Error; err != nil {
		return nil, errors.Wrap(err, "检查邮箱失败")
	}
	if count > 0 {
		return nil, errors.New("邮箱已被注册")
	}

	// 加密密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.Wrap(err, "加密密码失败")
	}

	// 创建用户
	user := &User{
		ID:        GenerateUniqueID(),
		Username:  req.Username,
		Email:     req.Email,
		Password:  string(hashedPassword),
		Role:      req.Role,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// 保存到数据库
	if err := s.db.Create(user).Error; err != nil {
		return nil, errors.Wrap(err, "创建用户失败")
	}

	return user, nil
}

// Login 用户登录
func (s *UserService) Login(ctx context.Context, login, password string) (*User, error) {
	var user User
	// 同时查询用户名和邮箱
	if err := s.db.Where("username = ? OR email = ?", login, login).First(&user).Error; err != nil {
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
		"role":       user.Role,
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
