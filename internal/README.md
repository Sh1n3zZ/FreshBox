# Internal 包说明

## 目录结构

- `api/` - API接口实现
  - `rest/` - REST API处理器和中间件
  - `ws/` - WebSocket处理
  
- `core/` - 核心业务逻辑
  - `pricing/` - 价格计算引擎
  - `social/` - 社交系统逻辑
  
- `pkg/` - 内部通用功能
  - `jwt/` - JWT认证
  - `validator/` - 数据验证
  
- `service/` - 业务服务实现
  - `user.go` - 用户服务
  - `blindbox.go` - 盲盒服务
  - `product.go` - 商品服务

## 开发规范

1. 包的依赖关系：
   - api 依赖 service
   - service 依赖 core
   - core 可以使用 pkg
   - pkg 不依赖其他内部包

2. 错误处理：
   - 使用 pkg/errors 包装错误
   - 在服务层统一处理业务错误
