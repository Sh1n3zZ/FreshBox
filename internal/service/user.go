package service

import (
	"context"
	"fmt"
	"math/rand"
	"time"

	"github.com/pkg/errors"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"FreshBox/internal/model"
)

// RegisterRequest 用户注册请求
type RegisterRequest struct {
	Username string         `json:"username" binding:"required"`
	Email    string         `json:"email" binding:"required,email"`
	Password string         `json:"password" binding:"required,min=6"`
	Code     string         `json:"code" binding:"required"`
	Role     model.UserRole `json:"role" binding:"omitempty,oneof=admin user"`
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
func (s *UserService) Register(ctx context.Context, req *RegisterRequest) (*model.User, error) {
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
	if err := s.db.Model(&model.User{}).Where("username = ?", req.Username).Count(&count).Error; err != nil {
		return nil, errors.Wrap(err, "检查用户名失败")
	}
	if count > 0 {
		return nil, errors.New("用户名已存在")
	}

	// 检查邮箱是否已存在
	if err := s.db.Model(&model.User{}).Where("email = ?", req.Email).Count(&count).Error; err != nil {
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
	user := &model.User{
		ID:        GenerateUniqueID(),
		Username:  req.Username,
		Email:     req.Email,
		Password:  string(hashedPassword),
		Role:      req.Role,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	if user.Role == "" {
		user.Role = model.RoleUser // Default role
	}

	// 保存到数据库
	if err := s.db.Create(user).Error; err != nil {
		return nil, errors.Wrap(err, "创建用户失败")
	}

	return user, nil
}

// Login 用户登录
func (s *UserService) Login(ctx context.Context, login, password string) (*model.User, error) {
	var user model.User
	// 同时查询用户名和邮箱
	if err := s.db.Where("username = ? OR email = ?", login, login).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.New("用户不存在,请检查用户名或邮箱")
		}
		return nil, errors.Wrap(err, "查询用户失败,请稍后再试")
	}

	// 验证密码
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, errors.New("密码错误")
	}

	return &user, nil
}

// GetProfile 获取用户信息
func (s *UserService) GetProfile(ctx context.Context, id string) (*model.User, error) {
	var user model.User
	if err := s.db.First(&user, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.New("用户不存在")
		}
		return nil, errors.Wrap(err, "获取用户信息失败")
	}

	return &user, nil
}

// UpdateProfile 更新用户信息
func (s *UserService) UpdateProfile(ctx context.Context, user *model.User) error {
	updates := map[string]interface{}{
		"username":   user.Username,
		"email":      user.Email,
		"avatar":     user.Avatar,
		"nickname":   user.Nickname,
		"role":       user.Role,
		"updated_at": time.Now(),
	}

	if err := s.db.Model(&model.User{}).Where("id = ?", user.ID).Updates(updates).Error; err != nil {
		return errors.Wrap(err, "更新用户信息失败")
	}

	return nil
}

// GetUserByID 根据ID获取用户
func (s *UserService) GetUserByID(ctx context.Context, id string) (*model.User, error) {
	var user model.User
	if err := s.db.First(&user, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.New("用户不存在")
		}
		return nil, errors.Wrap(err, "获取用户失败")
	}
	return &user, nil
}

// IsAdmin 判断用户是否为管理员
func (s *UserService) IsAdmin(ctx context.Context, userID string) (bool, error) {
	user, err := s.GetUserByID(ctx, userID)
	if err != nil {
		return false, err
	}
	return user.Role == model.RoleAdmin, nil
}

// ListUsers 获取用户列表（管理员功能）
func (s *UserService) ListUsers(ctx context.Context, page, size int, keyword string) ([]*model.User, int64, error) {
	var users []*model.User
	var total int64

	query := s.db.Model(&model.User{})
	if keyword != "" {
		query = query.Where("username LIKE ? OR email LIKE ? OR nickname LIKE ?", "%"+keyword+"%", "%"+keyword+"%", "%"+keyword+"%")
	}

	// 获取总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, errors.Wrap(err, "获取用户总数失败")
	}

	// 分页查询
	offset := (page - 1) * size
	if err := query.Offset(offset).Limit(size).Find(&users).Error; err != nil {
		return nil, 0, errors.Wrap(err, "获取用户列表失败")
	}

	return users, total, nil
}

// UpdateUserByAdmin 管理员更新用户信息
func (s *UserService) UpdateUserByAdmin(ctx context.Context, userID string, updates map[string]interface{}) error {
	// 检查用户是否存在
	var count int64
	if err := s.db.Model(&model.User{}).Where("id = ?", userID).Count(&count).Error; err != nil {
		return errors.Wrap(err, "检查用户失败")
	}
	if count == 0 {
		return errors.New("用户不存在")
	}

	// 更新用户信息
	if err := s.db.Model(&model.User{}).Where("id = ?", userID).Updates(updates).Error; err != nil {
		return errors.Wrap(err, "更新用户信息失败")
	}

	return nil
}

// DeleteUser 删除用户（管理员功能）
func (s *UserService) DeleteUser(ctx context.Context, userID string) error {
	// 检查用户是否存在
	var count int64
	if err := s.db.Model(&model.User{}).Where("id = ?", userID).Count(&count).Error; err != nil {
		return errors.Wrap(err, "检查用户失败")
	}
	if count == 0 {
		return errors.New("用户不存在")
	}

	// 删除用户
	if err := s.db.Delete(&model.User{}, "id = ?", userID).Error; err != nil {
		return errors.Wrap(err, "删除用户失败")
	}

	return nil
}

// CreateUserByAdmin 管理员创建用户
func (s *UserService) CreateUserByAdmin(ctx context.Context, req *CreateUserRequest) (*model.User, error) {
	// 检查用户名是否已存在
	var count int64
	if err := s.db.Model(&model.User{}).Where("username = ?", req.Username).Count(&count).Error; err != nil {
		return nil, errors.Wrap(err, "检查用户名失败")
	}
	if count > 0 {
		return nil, errors.New("用户名已存在")
	}

	// 检查邮箱是否已存在
	if err := s.db.Model(&model.User{}).Where("email = ?", req.Email).Count(&count).Error; err != nil {
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
	user := &model.User{
		ID:        GenerateUniqueID(),
		Username:  req.Username,
		Email:     req.Email,
		Password:  string(hashedPassword),
		Role:      req.Role,
		Avatar:    req.Avatar,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	if user.Role == "" {
		user.Role = model.RoleUser // Default role
	}

	// 保存到数据库
	if err := s.db.Create(user).Error; err != nil {
		return nil, errors.Wrap(err, "创建用户失败")
	}

	return user, nil
}

// CreateUserRequest 管理员创建用户请求
type CreateUserRequest struct {
	Username string         `json:"username" binding:"required"`
	Email    string         `json:"email" binding:"required,email"`
	Password string         `json:"password" binding:"required,min=6"`
	Role     model.UserRole `json:"role" binding:"required,oneof=admin user"`
	Avatar   string         `json:"avatar,omitempty"`
}

// GenerateMockUsers 生成模拟用户
func (s *UserService) GenerateMockUsers(tx *gorm.DB, count int) ([]model.User, error) {
	var users []model.User

	// 常用中文姓
	surnames := []string{"李", "王", "张", "刘", "陈", "杨", "黄", "赵", "吴", "周", "徐", "孙", "朱", "马", "胡", "郭", "林", "何", "高", "罗"}

	// 常用中文名
	firstNames := []string{"伟", "芳", "娜", "秀英", "敏", "静", "丽", "强", "磊", "军", "洋", "勇", "艳", "杰", "娟", "涛", "明", "超", "秀兰", "霞"}

	for i := 0; i < count; i++ {
		surname := surnames[rand.Intn(len(surnames))]
		firstName := firstNames[rand.Intn(len(firstNames))]

		user := model.User{
			ID:        GenerateUniqueID(),
			Username:  fmt.Sprintf("user%d", time.Now().UnixNano()+int64(i)),          // Ensure unique username
			Password:  "$2a$10$xVCVGjgEYdOPsTU7PJxB.OZnGQs6gjZzh6Q.8QNOZpBC9vE3NZhKW", // 默认密码: password
			Nickname:  surname + firstName,
			Email:     fmt.Sprintf("user%d_%d@example.com", time.Now().UnixNano(), i+1), // Ensure unique email
			Avatar:    fmt.Sprintf("https://i.pravatar.cc/150?u=%d", time.Now().UnixNano()+int64(i)),
			Role:      model.RoleUser, // 默认为普通用户
			CreatedAt: time.Now().Add(-time.Duration(rand.Intn(30*24)) * time.Hour),
			UpdatedAt: time.Now(),
		}

		if err := tx.Create(&user).Error; err != nil {
			return nil, errors.Wrap(err, "创建模拟用户失败")
		}

		users = append(users, user)
	}

	return users, nil
}
