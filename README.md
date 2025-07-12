# FreshBox 临期食品盲盒社交化系统 
``FreshBox--A Blindbox and socialization system for expired food``



<div align="center">

![FreshBox Logo](front/public/FreshBoxLogo.svg)

[![Go Version](https://img.shields.io/badge/Go-1.21%2B-00ADD8.svg?style=flat&logo=go)](https://go.dev/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB.svg?style=flat&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF.svg?style=flat&logo=vite)](https://vitejs.dev/)
[![Redis](https://img.shields.io/badge/Redis-7.0-DC382D.svg?style=flat&logo=redis)](https://redis.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1.svg?style=flat&logo=mysql)](https://www.mysql.com/)
[![Python](https://img.shields.io/badge/Python-3.10-3776AB.svg?style=flat&logo=python)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

> 🎁 FreshBox 是一个创新的临期食品盲盒社交化系统，旨在通过技术手段减少食品浪费，同时创造社交价值。

## ✨ 特性

- � **智能盲盒系统**
  - 基于计算机视觉的食品识别
  - 智能动态定价算法
  - 个性化推荐系统

- 🤝 **社交互动**
  - 用户任务系统
  - 食谱挑战
  - 社区互动

- 💝 **公益捐赠**
  - 区块链透明捐赠
  - 捐赠溯源
  - 积分奖励

- 📱 **全平台支持**
  - 响应式网页设计
  - Flutter移动应用
  - 微信小程序

## 🚀 快速开始

### 环境要求

| 依赖项 | 最低版本 | 说明 |
|--------|---------|------|
| Go | 1.24+ | 必需 |
| GCC | - | SQLite支持所需 |
| Docker | 24.0+ | 推荐 |
| Redis | 7.0+ | 必需 |
| MySQL | 8.0+ | 可选，默认SQLite |
| Node.js | 16+ | 前端开发必需 |
| Python | 3.10+ | OCR服务必需 |

### 📥 安装

#### Linux / macOS

```bash
# 克隆仓库
git clone https://github.com/Sh1n3zZ/FreshBox.git
cd FreshBox

# 安装后端依赖
go mod download

# 安装前端依赖
cd front
npm install

# 安装OCR服务依赖
cd ../ocr
pip install -r requirements.txt
```

#### Windows

1. GCC安装
   ```powershell
   # 使用Scoop (推荐)
   scoop install gcc

   # 或使用MSYS2
   scoop install msys2
   msys2 -c "pacman -S mingw-w64-x86_64-gcc"
   ```

2. 环境配置
   ```powershell
   # 启用CGO
   $env:CGO_ENABLED=1

   # 克隆并安装
   git clone https://github.com/Sh1n3zZ/FreshBox.git
   cd FreshBox
   go mod download
   ```

### ⚙️ 配置

创建 `configs/config.yaml`:

```yaml
server:
  port: 8080
  mode: development  # development | production

database:
  type: sqlite      # sqlite | mysql
  mysql:
    host: localhost
    port: 3306
    username: root
    password: your_password
    database: freshbox

redis:
  host: localhost
  port: 6379
  password: ""
  db: 0

jwt:
  secret: your_secret_key
  expire_hours: 24

ocr:
  server:
    host: localhost
    port: 50051
```

## 📖 项目结构

```
FreshBox/
├── cmd/                # 主程序入口
├── configs/            # 配置文件
├── deployments/        # 部署配置
│   └── docker/        # Docker相关文件
├── docs/              # 文档
├── front/             # 前端 (React + Vite)
│   ├── src/
│   │   ├── components/# UI组件
│   │   ├── pages/     # 页面
│   │   └── lib/       # 工具库
│   └── public/        # 静态资源
├── internal/          # 后端内部包
│   ├── api/          # API层
│   ├── core/         # 核心业务逻辑
│   ├── pkg/          # 通用工具
│   └── service/      # 服务层
├── mobile/           # Flutter移动应用
├── ocr/              # OCR服务 (Python)
└── uploads/          # 上传文件目录
```

## 💻 开发

### 启动开发环境

1. 启动基础服务
```bash
docker compose -f deployments/docker/docker-compose.dev.yml up -d
```

2. 后端服务
```bash
# 开发模式
go run cmd/main.go

# 或使用 air 热重载
air
```

3. 前端开发服务器
```bash
cd front
npm run dev
```

4. OCR服务
```bash
cd ocr
python main.py
```

### 构建部署

```bash
# 前端构建
cd front && npm run build

# 后端构建
go build -o bin/freshbox cmd/main.go

# Docker构建
docker compose -f deployments/docker/docker-compose.yml build
```

## 🧪 测试

```bash
# 运行所有测试
go test -v ./...

# 运行单元测试
go test -v -short ./...

# 运行集成测试
go test -v -tags=integration ./...

# 生成测试覆盖报告
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

## 🔍 故障排除

### CGO 相关问题

#### 症状
```
exec: "gcc": executable file not found in %PATH%
```

#### 解决方案
1. 检查GCC安装
   ```powershell
   gcc --version
   ```
2. 环境变量设置
   ```powershell
   $env:CGO_ENABLED=1
   ```

### 数据库连接问题

#### 症状
```
Error 1045 (28000): Access denied for user 'root'@'localhost'
```

#### 解决方案
1. 检查MySQL服务状态
   ```bash
   net start mysql   # Windows
   systemctl status mysql   # Linux
   ```
2. 验证配置
   ```bash
   mysql -u root -p
   ```

## 🤝 贡献

1. Fork 仓库
2. 创建特性分支
   ```bash
   git checkout -b feature/awesome-feature
   ```
3. 提交更改
   ```bash
   git commit -m '✨ Add awesome feature'
   ```
4. 推送到分支
   ```bash
   git push origin feature/awesome-feature
   ```
5. 提交 Pull Request

### 提交规范

- ✨ feat: 新功能
- 🐛 fix: 修复
- 📝 docs: 文档更新
- 💄 style: 代码格式
- ♻️ refactor: 重构
- ⚡️ perf: 性能优化
- ✅ test: 测试
- 🔧 chore: 构建过程或辅助工具

## 📄 许可证

[MIT](LICENSE) © 2024-现在 [Sh1n3zZ](https://github.com/Sh1n3zZ)

## 🌟 技术栈

### 后端
- Go 1.21+
- Gin + GORM
- Redis Stream
- MySQL 8.0

### 前端
- React 18
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui

### AI & 区块链
- YOLOv5
- gRPC
- Polygon Network

### DevOps
- Docker
- GitHub Actions
- Prometheus
- Grafana
