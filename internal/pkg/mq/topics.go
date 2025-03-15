package mq

// 消息主题
const (
	// TopicVision 图像识别主题
	TopicVision = "FRESHBOX_VISION"

	// TopicPricing 价格更新主题
	TopicPricing = "FRESHBOX_PRICING"

	// TopicInventory 库存管理主题
	TopicInventory = "FRESHBOX_INVENTORY"

	// TopicTask 任务管理主题
	TopicTask = "FRESHBOX_TASK"

	// TopicDonation 捐赠管理主题
	TopicDonation = "FRESHBOX_DONATION"
)

// 消息标签
const (
	// 图像识别标签
	TagVisionRecognize = "recognize"
	TagVisionMetadata  = "metadata"

	// 价格管理标签
	TagPriceUpdate = "price_update"
	TagPriceAlert  = "price_alert"

	// 库存管理标签
	TagInventoryChange = "inventory_change"
	TagInventoryLow    = "inventory_low"

	// 任务管理标签
	TagTaskCreate   = "task_create"
	TagTaskUpdate   = "task_update"
	TagTaskComplete = "task_complete"

	// 捐赠管理标签
	TagDonationCreate  = "donation_create"
	TagDonationConfirm = "donation_confirm"
)
