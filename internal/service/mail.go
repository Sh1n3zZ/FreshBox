package service

import (
	"context"
	"crypto/rand"
	"fmt"
	"math/big"
	"net/smtp"
	"time"

	"github.com/pkg/errors"
	"gorm.io/gorm"
)

// VerificationCode 验证码结构体
type VerificationCode struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	Email     string    `json:"email" gorm:"index"`
	Code      string    `json:"code"`
	Used      bool      `json:"used" gorm:"default:false"`
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}

// SMTPConfig SMTP配置
type SMTPConfig struct {
	Host                      string
	Port                      int
	Username                  string
	Password                  string
	FromEmail                 string
	FromName                  string
	VerificationSubject       string
	VerificationExpireMinutes int
}

// MailService 邮件服务
type MailService struct {
	db         *gorm.DB
	smtpConfig SMTPConfig
}

// NewMailService 创建邮件服务
func NewMailService(db *gorm.DB, smtpConfig SMTPConfig) *MailService {
	return &MailService{
		db:         db,
		smtpConfig: smtpConfig,
	}
}

// SendVerificationCode 发送验证码邮件
func (s *MailService) SendVerificationCode(ctx context.Context, email string) (string, error) {
	// 生成6位随机验证码
	code, err := s.generateVerificationCode()
	if err != nil {
		return "", errors.Wrap(err, "生成验证码失败")
	}

	// 构建邮件内容
	subject := s.smtpConfig.VerificationSubject
	body := fmt.Sprintf(`
		<html>
		<body>
		<h1>FreshBox 验证码</h1>
		<p>您的验证码是：<strong>%s</strong></p>
		<p>此验证码有效期为 %d 分钟，请及时完成注册。</p>
		<p>如果您没有注册 FreshBox 账号，请忽略此邮件。</p>
		</body>
		</html>
	`, code, s.smtpConfig.VerificationExpireMinutes)

	// 发送邮件
	if err := s.sendEmail(email, subject, body); err != nil {
		return "", errors.Wrap(err, "发送邮件失败")
	}

	// 保存验证码到数据库
	expireMinutes := time.Duration(s.smtpConfig.VerificationExpireMinutes) * time.Minute
	verificationCode := &VerificationCode{
		ID:        GenerateUniqueID(),
		Email:     email,
		Code:      code,
		Used:      false,
		ExpiresAt: time.Now().Add(expireMinutes),
		CreatedAt: time.Now(),
	}

	if err := s.db.Create(verificationCode).Error; err != nil {
		return "", errors.Wrap(err, "保存验证码失败")
	}

	return code, nil
}

// VerifyCode 验证验证码
func (s *MailService) VerifyCode(ctx context.Context, email, code string) (bool, error) {
	var verificationCode VerificationCode
	err := s.db.Where("email = ? AND code = ? AND used = ? AND expires_at > ?",
		email, code, false, time.Now()).First(&verificationCode).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return false, errors.New("验证码不存在或已过期")
		}
		return false, errors.Wrap(err, "查询验证码失败")
	}

	// 更新验证码为已使用
	if err := s.db.Model(&verificationCode).Updates(map[string]interface{}{
		"used": true,
	}).Error; err != nil {
		return false, errors.Wrap(err, "更新验证码状态失败")
	}

	return true, nil
}

// generateVerificationCode 生成6位随机验证码
func (s *MailService) generateVerificationCode() (string, error) {
	code := ""
	for i := 0; i < 6; i++ {
		n, err := rand.Int(rand.Reader, big.NewInt(10))
		if err != nil {
			return "", err
		}
		code += n.String()
	}
	return code, nil
}

// sendEmail 发送邮件
func (s *MailService) sendEmail(to, subject, body string) error {
	addr := fmt.Sprintf("%s:%d", s.smtpConfig.Host, s.smtpConfig.Port)
	from := s.smtpConfig.FromEmail

	// 设置邮件头
	headers := make(map[string]string)
	headers["From"] = fmt.Sprintf("%s <%s>", s.smtpConfig.FromName, from)
	headers["To"] = to
	headers["Subject"] = subject
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = "text/html; charset=UTF-8"

	// 构建邮件内容
	message := ""
	for k, v := range headers {
		message += fmt.Sprintf("%s: %s\r\n", k, v)
	}
	message += "\r\n" + body

	// 认证信息
	auth := smtp.PlainAuth("", s.smtpConfig.Username, s.smtpConfig.Password, s.smtpConfig.Host)

	// 发送邮件
	if err := smtp.SendMail(addr, auth, from, []string{to}, []byte(message)); err != nil {
		return errors.Wrap(err, "发送邮件失败")
	}

	return nil
}

// GetVerificationCodeByEmail 根据邮箱获取最新的未使用的验证码
func (s *MailService) GetVerificationCodeByEmail(ctx context.Context, email string) (*VerificationCode, error) {
	var verificationCode VerificationCode
	err := s.db.Where("email = ? AND used = ? AND expires_at > ?",
		email, false, time.Now()).Order("created_at desc").First(&verificationCode).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.New("验证码不存在或已过期")
		}
		return nil, errors.Wrap(err, "查询验证码失败")
	}

	return &verificationCode, nil
}

// DeleteExpiredCodes 删除过期的验证码
func (s *MailService) DeleteExpiredCodes(ctx context.Context) error {
	return s.db.Where("expires_at < ?", time.Now()).Delete(&VerificationCode{}).Error
}
