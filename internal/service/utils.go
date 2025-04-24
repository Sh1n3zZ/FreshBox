package service

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

// GenerateUniqueID 使用UUID+时间戳生成唯一ID
func GenerateUniqueID() string {
	timestamp := time.Now().Format("20060102150405")
	uuidStr := uuid.New().String()
	// 只使用UUID的前8位以缩短ID长度
	return fmt.Sprintf("%s_%s", timestamp, uuidStr[:8])
}

// GenerateShortID 生成简短唯一ID
func GenerateShortID() string {
	// 只使用UUID的前12位
	uuidStr := uuid.New().String()
	return uuidStr[:12]
}

// FormatTime 格式化时间为标准格式
func FormatTime(t time.Time) string {
	if t.IsZero() {
		return ""
	}
	return t.Format("2006-01-02 15:04:05")
}

// ParseTime 解析时间字符串
func ParseTime(timeStr string) (time.Time, error) {
	return time.Parse("2006-01-02 15:04:05", timeStr)
}
