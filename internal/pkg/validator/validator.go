package validator

import (
	"regexp"

	"github.com/go-playground/validator/v10"
)

var (
	validate *validator.Validate

	// 正则表达式
	usernameRegex = regexp.MustCompile("^[a-zA-Z0-9_-]{4,16}$")
	passwordRegex = regexp.MustCompile("^[a-zA-Z0-9!@#$%^&*]{8,32}$")
	phoneRegex    = regexp.MustCompile("^1[3-9]\\d{9}$")
	emailRegex    = regexp.MustCompile("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")
)

func init() {
	validate = validator.New()

	// 注册自定义验证器
	_ = validate.RegisterValidation("username", validateUsername)
	_ = validate.RegisterValidation("password", validatePassword)
	_ = validate.RegisterValidation("phone", validatePhone)
	_ = validate.RegisterValidation("email", validateEmail)
}

// RegisterRequest 注册请求参数
type RegisterRequest struct {
	Username string `json:"username" validate:"required,username"`
	Password string `json:"password" validate:"required,password"`
	Email    string `json:"email" validate:"required,email"`
	Phone    string `json:"phone" validate:"required,phone"`
}

// LoginRequest 登录请求参数
type LoginRequest struct {
	Username string `json:"username" validate:"required,username"`
	Password string `json:"password" validate:"required,password"`
}

// UpdateProfileRequest 更新用户信息请求参数
type UpdateProfileRequest struct {
	Email string `json:"email" validate:"required,email"`
	Phone string `json:"phone" validate:"required,phone"`
}

// CreateBoxRequest 创建盲盒请求参数
type CreateBoxRequest struct {
	Name        string  `json:"name" validate:"required,min=2,max=50"`
	Price       float64 `json:"price" validate:"required,gt=0"`
	Description string  `json:"description" validate:"required,min=10,max=500"`
}

// Validate 验证请求参数
func Validate(i interface{}) error {
	return validate.Struct(i)
}

// 自定义验证函数
func validateUsername(fl validator.FieldLevel) bool {
	return usernameRegex.MatchString(fl.Field().String())
}

func validatePassword(fl validator.FieldLevel) bool {
	return passwordRegex.MatchString(fl.Field().String())
}

func validatePhone(fl validator.FieldLevel) bool {
	return phoneRegex.MatchString(fl.Field().String())
}

func validateEmail(fl validator.FieldLevel) bool {
	return emailRegex.MatchString(fl.Field().String())
}
