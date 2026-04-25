# Learnpathly Frontend

> React + TypeScript 前端应用

## 技术栈

- **React 18** — UI 框架
- **TypeScript** — 类型安全
- **Vite** — 构建工具
- **React Router v6** — 路由管理
- **Axios** — HTTP 客户端

## 快速开始

### 安装依赖
```bash
npm install
```

### 开发环境
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览生产版本
```bash
npm run preview
```

## 环境变量

复制 `.env.example` 为 `.env` 并配置：

```bash
cp .env.example .env
```

配置项：
- `VITE_API_BASE_URL` — 后端 API 地址（可选，默认 `https://api.learnpathly.com`）

## 目录结构

```
frontend/
├── public/              # 静态资源
├── src/
│   ├── components/      # 通用组件
│   │   ├── layout/     # 布局组件 (NavBar, Footer, AppLayout)
│   │   └── ui/         # UI 基础组件 (Button, Card, Input, Badge)
│   ├── modules/        # 功能模块
│   │   ├── home/       # 首页
│   │   ├── ai-path/    # AI 路径生成
│   │   ├── learning-pool/  # 学习资源池
│   │   ├── notification/   # 通知
│   │   ├── creator/        # 内容创作
│   │   ├── deck/           # 卡片组
│   │   └── ...
│   ├── routes/         # 路由配置
│   │   ├── index.ts   # 路由导出
│   │   ├── home.tsx   # 首页路由
│   │   ├── learning-pool.tsx  # 学习资源池路由
│   │   ├── learning-path.tsx   # 学习路径路由
│   │   ├── resource.tsx        # 资源路由
│   │   ├── user.tsx           # 用户路由 (登录/注册)
│   │   ├── admin.tsx          # 管理后台路由
│   │   └── common.tsx         # 公共组件
│   ├── services/       # API 服务层
│   │   ├── auth.ts     # 认证 API
│   │   ├── learningPath.ts  # 学习路径 API
│   │   ├── resource.ts     # 资源 API
│   │   ├── aiPath.ts       # AI 路径 API
│   │   ├── category.ts     # 分类 API
│   │   ├── progress.ts     # 进度 API
│   │   └── ...
│   ├── hooks/          # 自定义 Hooks
│   ├── stores/         # 状态管理
│   ├── types/          # TypeScript 类型定义
│   ├── utils/          # 工具函数
│   ├── lib/            # 库配置
│   ├── App.tsx         # 根组件
│   ├── main.tsx        # 入口文件
│   └── index.css       # 全局样式
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 页面路由

| 路径 | 页面 | 描述 |
|------|------|------|
| `/home` | 首页 | 平台首页，展示学习资源 |
| `/ai-path` | AI 路径生成 | 输入学习目标，生成 AI 学习路径 |
| `/ai-path-detail` | AI 路径详情 | 查看生成的 AI 学习路径 |
| `/learning-pool` | 学习资源池 | 浏览和搜索所有资源 |
| `/learning-path` | 学习路径 | 浏览学习路径 |
| `/notification` | 通知 | 用户通知列表 |
| `/creator` | 内容创作 | 创建者页面 |
| `/deck` | 卡片组 | 学习卡片管理 |
| `/login` | 登录 | 用户登录 |
| `/register` | 注册 | 用户注册 |
| `/account/*` | 账户 | 用户账户设置 |
| `/admin/*` | 管理后台 | 管理员功能 |

## API 服务

### 认证
```typescript
import { authService } from '@/services/auth';
authService.login(email, password);
authService.register(email, password, username);
authService.logout();
```

### 学习路径
```typescript
import { learningPathService } from '@/services/learningPath';
learningPathService.list();
learningPathService.getById(id);
learningPathService.create(data);
```

### 资源
```typescript
import { resourceService } from '@/services/resource';
resourceService.list();
resourceService.search(query, platform);
resourceService.createFromUrl(url);
```

### AI 路径
```typescript
import { aiPathService } from '@/services/aiPath';
aiPathService.generatePath(params);
```

## 开发指南

### 添加新页面
1. 在 `modules/` 下创建页面组件
2. 在 `routes/` 下添加路由配置
3. 导出到 `routes/index.ts`

### 添加 API 服务
1. 在 `services/` 下创建服务文件
2. 使用 axios 封装 API 调用
3. 导出服务供组件使用

### 组件规范
- 使用 CSS 文件组织样式
- 组件放在 `modules/` 或 `components/`
- 复用组件提取到 `components/ui/`

## License

MIT
