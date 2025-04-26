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

- Go 1.24+
- GCC编译器（用于SQLite支持）
- Docker & Docker Compose
- Redis 7.0+
- MySQL 8.0+（可选，默认使用SQLite）
- Node.js 16+ (用于前端开发)

### Windows环境配置

1. GCC编译器安装（必需）
   ```bash
   # 方式1：使用MSYS2
   - 下载安装 MSYS2: https://www.msys2.org/
   - 运行: pacman -S mingw-w64-x86_64-gcc
   - 添加环境变量: C:\msys64\mingw64\bin

   # 方式2：使用TDM-GCC
   - 下载安装 TDM-GCC: https://jmeubank.github.io/tdm-gcc/
   ```

2. 启用CGO
   ```bash
   set CGO_ENABLED=1
   ```

### 配置说明

1. 数据库配置
   ```yaml
   mysql:
     host: localhost
     port: 3306
     username: root
     password: your_password
     database: freshbox
   ```

2. Redis配置
   ```yaml
   redis:
     host: localhost
     port: 6379
     password: ""
     db: 0
   ```

3. JWT配置
   ```yaml
   jwt:
     secret: your_secret_key
     expire_hours: 24
   ```

## 开发指南

### 目录结构说明
```
.
├── cmd/                # 主程序入口
├── configs/            # 配置文件
│   ├── config.yaml    # 主配置文件
│   └── config.example.yaml
├── deployments/        # 部署相关文件
│   └── docker/        # Docker部署配置
├── docs/              # 文档
│   └── api/          # API文档
├── front/             # 前端代码
├── internal/          # 内部包
│   ├── api/          # API接口定义和处理
│   ├── core/         # 核心业务逻辑
│   ├── pkg/          # 内部通用功能
│   └── service/      # 业务服务层
├── scripts/           # 维护脚本
└── test/              # 测试文件
```

### 开发流程

1. 启动开发环境
   ```bash
   # 启动Redis和MySQL（如果需要）
   docker-compose -f deployments/docker/docker-compose.dev.yml up -d

   # 启动后端服务
   set CGO_ENABLED=1  # Windows环境
   go run .

   # 启动前端开发服务
   cd front
   npm install
   npm run dev
   ```

2. 构建部署
   ```bash
   # 构建前端
   cd front
   npm run build

   # 构建后端
   go build -o freshbox
   ```

## 测试

```bash
# 运行单元测试
go test ./...

# 运行集成测试
go test -tags=integration ./...
```

## 常见问题

### 1. CGO相关错误
如果遇到 "gcc not found" 错误，请确保：
- 已正确安装GCC
- 环境变量PATH中包含GCC
- 设置了 CGO_ENABLED=1

### 2. 数据库连接
默认使用SQLite数据库，如需使用MySQL：
- 确保MySQL服务已启动
- 正确配置 config.yaml 中的MySQL连接信息

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情
