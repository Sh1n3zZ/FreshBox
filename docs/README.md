# FreshBox 项目文档

## 文档结构

- `api/` - API接口文档
- `architecture/` - 系统架构文档
- `deployment/` - 部署指南
- `development/` - 开发指南

## API文档生成

使用 swag 生成API文档：
```bash
swag init -g internal/api/rest/router.go
```

## 架构说明

FreshBox采用清晰的分层架构：

1. 表现层 (API Layer)
   - REST API
   - WebSocket

2. 业务层 (Service Layer)
   - 用户服务
   - 盲盒服务
   - 订单服务
   - 社交服务

3. 数据层 (Data Layer)
   - MySQL/SQLite
   - Redis
   - 区块链存储
