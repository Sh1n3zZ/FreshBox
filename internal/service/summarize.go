package service

import (
	"context"
	"encoding/json"
	"time"

	"github.com/pkg/errors"
	"github.com/sashabaranov/go-openai"
	"github.com/spf13/viper"
	"go.uber.org/zap"

	"FreshBox/internal/model"
)

// LLMSummaryService LLM总结服务
type LLMSummaryService struct {
	client          *openai.Client
	blindBoxService *BlindBoxService
	logger          *zap.Logger
	cacheExpiry     time.Duration
	summarizePrompt string
}

// LLMSummaryResponse LLM总结响应
type LLMSummaryResponse struct {
	Summary         string   `json:"summary"`
	Insights        []string `json:"insights"`
	Recommendations []string `json:"recommendations"`
	Status          string   `json:"status"`
}

// 缓存
var (
	summaryCache  *LLMSummaryResponse
	lastCacheTime time.Time
)

// NewLLMSummaryService 创建LLM总结服务
func NewLLMSummaryService(blindBoxService *BlindBoxService, logger *zap.Logger) (*LLMSummaryService, error) {
	apiKey := viper.GetString("vision.openai.api_key")
	endpoint := viper.GetString("vision.openai.endpoint")
	cacheExpiryMinutes := viper.GetInt("vision.openai.summary_cache_minutes")
	summarizePrompt := viper.GetString("vision.openai.dashboard_summary_prompt")

	if apiKey == "" {
		return nil, errors.New("OpenAI API密钥未配置")
	}

	clientConfig := openai.DefaultConfig(apiKey)
	if endpoint != "" {
		clientConfig.BaseURL = endpoint
	}

	client := openai.NewClientWithConfig(clientConfig)

	return &LLMSummaryService{
		client:          client,
		blindBoxService: blindBoxService,
		logger:          logger,
		cacheExpiry:     time.Duration(cacheExpiryMinutes) * time.Minute,
		summarizePrompt: summarizePrompt,
	}, nil
}

// GetDashboardSummary 获取仪表盘总结
func (s *LLMSummaryService) GetDashboardSummary(ctx context.Context) (*LLMSummaryResponse, error) {
	// 检查缓存是否有效
	if s.isCacheValid() {
		s.logger.Info("使用缓存的仪表盘总结")
		summaryCache.Status = "cached"
		return summaryCache, nil
	}

	// 获取仪表盘统计数据
	stats, err := s.blindBoxService.GetDashboardStats(ctx)
	if err != nil {
		return nil, errors.Wrap(err, "获取仪表盘统计数据失败")
	}

	// 获取近期活动
	var recentActivities []model.BlindBoxOpening
	if err := s.blindBoxService.GetRecentOpenings(ctx, &recentActivities); err != nil {
		return nil, errors.Wrap(err, "获取近期活动失败")
	}

	// 准备数据上下文
	contextData := map[string]interface{}{
		"stats":            stats,
		"recentActivities": recentActivities,
		"currentTime":      time.Now().Format("2006-01-02 15:04:05"),
	}

	// 将数据结构化为JSON字符串
	contextJSON, err := json.Marshal(contextData)
	if err != nil {
		return nil, errors.Wrap(err, "转换数据为JSON失败")
	}

	// 创建LLM总结
	summary, err := s.generateSummary(ctx, string(contextJSON))
	if err != nil {
		return nil, err
	}

	// 缓存结果
	summaryCache = summary
	lastCacheTime = time.Now()
	summary.Status = "fresh"

	return summary, nil
}

// isCacheValid 检查缓存是否有效
func (s *LLMSummaryService) isCacheValid() bool {
	if summaryCache == nil {
		return false
	}
	return time.Since(lastCacheTime) < s.cacheExpiry
}

// generateSummary 生成总结
func (s *LLMSummaryService) generateSummary(ctx context.Context, contextJSON string) (*LLMSummaryResponse, error) {
	// 设置超时
	timeoutDuration := time.Duration(viper.GetInt("vision.openai.timeout_sec")) * time.Second
	ctx, cancel := context.WithTimeout(ctx, timeoutDuration)
	defer cancel()

	// 使用OpenAI API生成总结
	req := openai.ChatCompletionRequest{
		Model: viper.GetString("vision.openai.ocr_summary_model"),
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleSystem,
				Content: s.summarizePrompt,
			},
			{
				Role:    openai.ChatMessageRoleUser,
				Content: contextJSON,
			},
		},
		MaxTokens: viper.GetInt("vision.openai.max_tokens"),
	}

	resp, err := s.client.CreateChatCompletion(ctx, req)
	if err != nil {
		return nil, errors.Wrap(err, "调用OpenAI API失败")
	}

	// 解析API响应
	if len(resp.Choices) == 0 {
		return nil, errors.New("OpenAI API响应为空")
	}

	content := resp.Choices[0].Message.Content
	var summary LLMSummaryResponse

	if err := json.Unmarshal([]byte(content), &summary); err != nil {
		// 如果解析JSON失败，尝试使用一个基本结构
		s.logger.Warn("解析LLM响应为JSON失败，使用基本结构", zap.Error(err))
		summary = LLMSummaryResponse{
			Summary:         content,
			Insights:        []string{},
			Recommendations: []string{},
			Status:          "fresh",
		}
	}

	return &summary, nil
}
