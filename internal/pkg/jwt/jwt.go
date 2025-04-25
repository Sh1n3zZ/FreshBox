package jwt

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/spf13/viper"
	"go.uber.org/zap"
)

var (
	// secretKey 秘钥，从配置文件中读取，如果为空则自动生成
	secretKey []byte
	// TokenExpiry 令牌过期时间
	TokenExpiry = 24 * time.Hour
	// logger 日志记录器
	logger *zap.Logger
)

// SetLogger 设置日志记录器
func SetLogger(l *zap.Logger) {
	logger = l
}

// InitJWTSecret 初始化JWT秘钥
func InitJWTSecret() error {
	if logger == nil {
		return fmt.Errorf("日志记录器未初始化")
	}

	secretStr := viper.GetString("jwt.secret")
	logger.Info("初始化JWT秘钥",
		zap.String("config_secret", secretStr),
		zap.Bool("is_empty", secretStr == ""),
		zap.Bool("is_default", secretStr == " your-secret-key"))

	if secretStr == "" || secretStr == "your-secret-key" {
		key, err := generateRandomKey(32)
		if err != nil {
			logger.Error("生成随机秘钥失败", zap.Error(err))
			return fmt.Errorf("生成JWT秘钥失败: %v", err)
		}
		secretKey = key
		viper.Set("jwt.secret", hex.EncodeToString(key))
		logger.Info("已生成新的随机秘钥", zap.String("new_secret", hex.EncodeToString(key)))

		// 保存配置到文件
		if err := viper.WriteConfig(); err != nil {
			logger.Error("保存配置到文件失败", zap.Error(err))
			return fmt.Errorf("保存JWT秘钥到配置文件失败: %v", err)
		}
		logger.Info("已保存新的JWT秘钥到配置文件")
	} else {
		secretKey = []byte(secretStr)
		logger.Info("使用配置中的秘钥")
	}

	expireHours := viper.GetInt("jwt.expire_hours")
	if expireHours > 0 {
		TokenExpiry = time.Duration(expireHours) * time.Hour
		logger.Info("设置令牌过期时间",
			zap.Int("hours", expireHours),
			zap.Duration("duration", TokenExpiry))
	} else {
		logger.Info("使用默认令牌过期时间",
			zap.Duration("default_duration", TokenExpiry))
	}

	return nil
}

// 生成随机秘钥
func generateRandomKey(length int) ([]byte, error) {
	key := make([]byte, length)
	_, err := rand.Read(key)
	if err != nil {
		return nil, err
	}
	return key, nil
}

// Claims 自定义JWT声明
type Claims struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Type     string `json:"type"`
	jwt.RegisteredClaims
}

const (
	// TokenTypeAccess 访问令牌类型
	TokenTypeAccess = "access"
	// TokenTypeRefresh 刷新令牌类型
	TokenTypeRefresh = "refresh"
)

// GenerateTokenPair 生成访问令牌和刷新令牌对
func GenerateTokenPair(userID, username string) (string, string, error) {
	// 生成访问令牌
	accessToken, err := generateToken(userID, username, TokenTypeAccess, 1*time.Hour)
	if err != nil {
		return "", "", fmt.Errorf("生成访问令牌失败: %v", err)
	}

	// 生成刷新令牌
	refreshToken, err := generateToken(userID, username, TokenTypeRefresh, 7*24*time.Hour)
	if err != nil {
		return "", "", fmt.Errorf("生成刷新令牌失败: %v", err)
	}

	return accessToken, refreshToken, nil
}

// generateToken 生成JWT令牌
func generateToken(userID, username, tokenType string, expiration time.Duration) (string, error) {
	claims := Claims{
		UserID:   userID,
		Username: username,
		Type:     tokenType,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(secretKey)
}

// ValidateToken 验证访问令牌
func ValidateToken(tokenString string) (*Claims, error) {
	return validateTokenWithType(tokenString, TokenTypeAccess)
}

// ValidateRefreshToken 验证刷新令牌
func ValidateRefreshToken(tokenString string) (*Claims, error) {
	return validateTokenWithType(tokenString, TokenTypeRefresh)
}

// validateTokenWithType 验证指定类型的令牌
func validateTokenWithType(tokenString string, expectedType string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("无效的签名方法: %v", token.Header["alg"])
		}
		return secretKey, nil
	})

	if err != nil {
		return nil, fmt.Errorf("解析令牌失败: %v", err)
	}

	if !token.Valid {
		return nil, fmt.Errorf("无效的令牌")
	}

	if claims.Type != expectedType {
		return nil, fmt.Errorf("无效的令牌类型")
	}

	return claims, nil
}

// ExtractBearerToken 从Authorization头提取Bearer令牌
func ExtractBearerToken(authHeader string) (string, error) {
	if authHeader == "" {
		return "", fmt.Errorf("未提供Authorization头")
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return "", fmt.Errorf("无效的Authorization头格式")
	}

	return parts[1], nil
}
