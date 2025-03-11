# FreshBox - 临期食品盲盒社交化系统

FreshBox是一个创新的临期食品盲盒社交化系统，旨在通过技术手段减少食品浪费，同时创造社交价值。

## 核心功能

- 🎁 智能盲盒：基于计算机视觉的食品识别和动态定价
- 🤝 社交任务：用户互动和食谱挑战
- 💝 区块链捐赠：透明可信的剩余食品捐赠链
- 📱 移动友好：完整的移动端支持

## 技术栈

- 后端：Go 1.21+
- 框架：Gin + GORM
- 数据库：MySQL 8.0 + Redis 7.0
- 消息队列：Redis Stream
- AI模型：YOLOv5（Python）
- 区块链：Polygon Network

## 快速开始

### 环境要求

- Go 1.21+
- Docker & Docker Compose
- Make

### 安装步骤

1. 克隆仓库
```bash
git clone https://github.com/your-username/freshbox.git
cd freshbox
```

2. 安装依赖
```bash
go mod download
```

3. 配置环境
```bash
cp configs/config.example.yaml configs/config.yaml
# 编辑 config.yaml 配置文件
```

4. 启动服务
```bash
docker-compose -f deployments/docker/docker-compose.yml up -d
```

5. 访问服务
```
http://localhost:8080/v1/
```

## 项目结构

```
.
├── cmd/                # 主程序入口
├── configs/            # 配置文件
├── deployments/        # 部署相关文件
├── docs/              # 文档
├── internal/          # 内部包
│   ├── api/          # API接口
│   ├── core/         # 核心业务逻辑
│   ├── storage/      # 存储层
│   └── utils/        # 工具函数
├── pkg/              # 可重用的外部包
├── scripts/          # 脚本
└── test/             # 测试
```

## API文档

API文档使用Swagger生成，访问地址：
```
http://localhost:8080/swagger/index.html
```

## 监控指标

项目使用Prometheus + Grafana进行监控，默认端口：
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情
