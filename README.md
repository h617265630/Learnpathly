# Learnpathly

> AI-Powered Learning Path Platform — 个性化学习路径平台

一个帮助用户发现学习资源、构建学习路径、获得 AI 生成的学习计划的平台。

---

## 项目架构

```
path/
├── frontend/           # React + TypeScript 前端 (Vite)
├── backend/             # FastAPI 后端 (Python)
├── ai_path/            # AI 路径生成服务 (LangGraph + LLM)
├── vue-frontend/       # Vue 3 旧版前端 (待迁移)
├── flutterapp/         # Flutter 移动端 (规划中)
└── database_schema.md  # 数据库设计文档
```

---

## 核心功能

### 1. 资源管理
- **资源搜索** — 搜索 GitHub 仓库、YouTube 视频
- **资源收藏** — 用户收藏并管理自己的学习资源
- **资源分类** — 按类别组织资源（树形层级结构）
- **阅读模式** — 提取网页内容，提供干净的阅读体验

### 2. 学习路径
- **路径构建** — 创建和管理学习路径
- **路径收藏** — 收藏他人的学习路径
- **学习进度** — 追踪每个节点的学习进度
- **路径评论** — 对学习路径进行评论交流

### 3. AI 路径生成
- **自然语言输入** — 描述想学习的主题
- **智能规划** — AI 自动生成学习阶段和资源推荐
- **可配置参数** — 学习深度、内容类型、资源数量、理论与实践比例
- **付费层级** — Free / Basic / Pro / Ultra 四级订阅

### 4. 用户系统
- **用户认证** — 注册、登录、JWT 认证
- **RBAC 权限** — 基于角色的权限控制
- **用户订阅** — Stripe 订阅管理
- **用户文件/图片** — 头像、文件上传

### 5. 管理功能
- **资源管理** — 管理员审核和管理资源
- **路径管理** — 管理员管理学习路径
- **用户管理** — 查看和管理用户
- **数据分析** — 平台数据统计

---

## 技术栈

### Frontend
- **React 18** + TypeScript
- **Vite** — 快速构建工具
- **React Router** — 路由管理
- **Axios** — HTTP 请求
- **CSS** — 样式

### Backend
- **FastAPI** — Python Web 框架
- **SQLAlchemy** — ORM
- **PostgreSQL** — 数据库 (Supabase)
- **JWT** — 身份认证
- **Pydantic** — 数据验证

### AI Path
- **LangGraph** — AI 流程编排
- **OpenAI / MiniMax** — LLM 供应商
- **Tavily / Serper** — 搜索引擎
- **Streamlit** — AI 路径独立界面

---

## 快速开始

### 前置要求
- Node.js 18+
- Python 3.10+
- PostgreSQL 数据库

### 1. 克隆项目
```bash
git clone https://github.com/yourusername/learnpathly.git
cd learnpathly
```

### 2. 配置环境变量

**Frontend**
```bash
cd frontend
cp .env.example .env
# 编辑 .env 填入 VITE_API_BASE_URL
```

**Backend**
```bash
cd backend
cp .env.example .env
# 编辑 .env 填入数据库连接和 API 密钥
```

**AI Path (可选)**
```bash
cd ai_path
cp .env.example .env
# 编辑 .env 填入 OPENAI_API_KEY 和搜索 API 密钥
```

### 3. 启动服务

**Backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

**AI Path (可选)**
```bash
cd ai_path
pip install -r requirements.txt
streamlit run app.py
```

---

## API 文档

启动后端后访问：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## 数据库

数据库 Schema 文档: [database_schema.md](database_schema.md)
ER 图: [ER_diagram.md](ER_diagram.md)

---

## 目录结构

### Frontend (`frontend/`)
```
frontend/
├── src/
│   ├── components/     # 通用组件
│   ├── modules/        # 功能模块
│   │   ├── home/       # 首页
│   │   ├── ai-path/    # AI 路径生成
│   │   └── ...
│   ├── routes/         # 路由配置
│   ├── services/       # API 服务
│   └── stores/         # 状态管理
└── public/             # 静态资源
```

### Backend (`backend/`)
```
backend/
├── app/
│   ├── api/            # API 路由
│   ├── core/           # 核心配置
│   ├── curd/           # CRUD 操作
│   ├── models/         # 数据库模型
│   ├── routers/        # FastAPI 路由
│   └── schemas/        # Pydantic 模型
└── supabase/          # Supabase 配置
```

### AI Path (`ai_path/`)
```
ai_path/
├── ai_resource/        # 资源搜索 (GitHub/YouTube)
├── models/             # 数据模型
├── pipeline/           # LangGraph 流程
├── tools/              # AI 工具
└── utils/             # 工具函数
```

---

## 部署

### Backend (Railway)
1. 连接 GitHub 仓库
2. 配置环境变量
3. 自动部署

### Frontend (Vercel)
1. 导入 GitHub 仓库
2. 配置环境变量 `VITE_API_BASE_URL`
3. 自动部署

---

## License

MIT License
