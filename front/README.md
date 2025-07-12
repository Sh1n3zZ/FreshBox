# FreshBox Frontend

<div align="center">

![FreshBox Logo](public/FreshBoxLogo.svg)

[![React](https://img.shields.io/badge/React-18.x-61DAFB.svg?style=flat&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF.svg?style=flat&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

</div>

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 📦 项目结构

```
src/
├── assets/         # 静态资源
├── components/     # 可重用组件
│   ├── ui/        # UI组件库
│   └── shared/    # 共享组件
├── contexts/       # React Context
├── hooks/         # 自定义Hooks
├── lib/           # 工具函数和API
├── pages/         # 页面组件
├── providers/     # 全局Provider
└── routes/        # 路由配置
```

## 🔧 技术栈

- **框架**: React 18 with TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **组件库**: shadcn/ui
- **状态管理**: React Context + Hooks
- **路由**: React Router 6
- **HTTP客户端**: Axios
- **国际化**: react-i18next
- **动画**: Framer Motion

## 📱 功能特性

### 🎁 盲盒系统
- 盲盒列表和详情展示
- 动态价格显示
- 购买和开盒动画
- 历史记录查看

### 👥 用户系统
- 注册和登录
- 个人中心
- 订单管理
- 收货地址管理

### 🎯 任务系统
- 任务列表
- 任务详情
- 提交和验证
- 积分奖励

### 👨‍💼 管理后台
- 数据统计
- 用户管理
- 订单管理
- 系统设置

## 🔨 开发规范

1. **组件开发**
   - 使用TypeScript
   - 使用函数组件和Hooks
   - 遵循SOLID原则

2. **样式指南**
   - 使用Tailwind CSS
   - 遵循移动优先原则
   - 使用主题变量

3. **状态管理**
   - 局部状态使用useState
   - 共享状态使用Context
   - 复杂状态考虑Redux

### 性能优化

1. **代码分割**
   - 路由级别的代码分割
   - 大型组件的动态导入
   - 第三方库的按需加载

2. **性能优化**
   - 使用React.memo()
   - 优化useCallback和useMemo
   - 图片懒加载

## 🧪 测试

```bash
# 运行单元测试
npm test

# 运行E2E测试
npm run test:e2e

# 查看测试覆盖率
npm run test:coverage
```

## 🤝 贡献

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交Pull Request
