package pricing

import "math"

// TimeBasedStrategy 基于时间的折扣策略
type TimeBasedStrategy struct {
	maxDiscountRate float64 // 最大折扣率
	thresholdHours  float64 // 开始折扣的时间阈值（小时）
}

// NewTimeBasedStrategy 创建基于时间的折扣策略
func NewTimeBasedStrategy(maxDiscountRate float64, thresholdHours float64) *TimeBasedStrategy {
	return &TimeBasedStrategy{
		maxDiscountRate: maxDiscountRate,
		thresholdHours:  thresholdHours,
	}
}

// CalculateDiscount 计算折扣系数
// 使用指数衰减函数：discount = 1 - maxDiscount * (1 - e^(-remainingHours/threshold))
func (s *TimeBasedStrategy) CalculateDiscount(remainingHours float64) float64 {
	if remainingHours >= s.thresholdHours {
		return 1.0 // 未到折扣时间，原价
	}

	// 计算折扣系数
	discount := 1.0 - s.maxDiscountRate*(1.0-math.Exp(-remainingHours/s.thresholdHours))

	// 确保折扣在合理范围内
	if discount < (1.0 - s.maxDiscountRate) {
		discount = 1.0 - s.maxDiscountRate
	}
	if discount > 1.0 {
		discount = 1.0
	}

	return discount
}

// StepBasedStrategy 基于阶梯的折扣策略
type StepBasedStrategy struct {
	steps []DiscountStep
}

// DiscountStep 折扣阶梯
type DiscountStep struct {
	HourThreshold float64 // 小时数阈值
	DiscountRate  float64 // 折扣率
}

// NewStepBasedStrategy 创建基于阶梯的折扣策略
func NewStepBasedStrategy(steps []DiscountStep) *StepBasedStrategy {
	return &StepBasedStrategy{
		steps: steps,
	}
}

// CalculateDiscount 计算折扣系数
func (s *StepBasedStrategy) CalculateDiscount(remainingHours float64) float64 {
	for _, step := range s.steps {
		if remainingHours <= step.HourThreshold {
			return 1.0 - step.DiscountRate
		}
	}
	return 1.0 // 未达到任何折扣阈值，返回原价
}
