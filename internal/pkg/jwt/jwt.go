package jwt

import (
	"fmt"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var (
	// 密钥应该通过配置注入
	secretKey = []byte("your-256-bit-secret")

	// TokenExpiry 令牌过期时间
	TokenExpiry = 24 * time.Hour
)

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
