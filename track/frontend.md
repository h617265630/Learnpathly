# 前端追踪

最后更新：2026-04-28

## 当前状态
- 开发端口：5175（Vite）
- 主色调：`sky-500`（淡蓝色），辅助色：`amber-500`（琥珀色）
- 关键页面：`/ai-path`、`/ai-path-detail`、`/resources`、`/home`、`/learningpool`、`/my-paths`

---

## 常用组件

### 卡片组件

| 组件名 | 路径 | 用途 | 特点 |
|--------|------|------|------|
| `PathCard` | `src/components/PathCard.tsx` | 学习路径卡片 | Editorial 风格，GitHub 图片 `p-2` padding |
| `PopularPathCard` | `src/components/PopularPathCard.tsx` | 热门路径卡片 | 同 PathCard，用于首页推荐 |
| `PathTCard` | `src/components/PathTCard.tsx` | 横向滚动卡片 | 用于 LearningPool Trending 区域 |
| `ResourceCard` | `src/components/ResourceCard.tsx` | 资源卡片 | 三种尺寸：sm/md/lg，图片 `h-32`/`h-40`，简介 4 行 |
| `CardHero` | `src/components/CardHero.tsx` | 大尺寸资源卡片 | 用于 ResourceLibrary 编辑式布局 |
| `LearnPathCard` | `src/components/LearnPathCard.tsx` | AI 生成的路径卡片 | 用于首页和 LearningPool 展示 AI 项目 |

### UI 组件

| 组件名 | 路径 | 用途 |
|--------|------|------|
| `Button` | `src/components/ui/Button.tsx` | 通用按钮 |
| `Badge` | `src/components/ui/Badge.tsx` | 标签徽章 |
| `NavBar` | `src/components/layout/NavBar.tsx` | 顶部导航栏 |
| `ResourceDetailModal` | `src/components/ui/ResourceDetailModal.tsx` | 资源详情弹窗 |

---

## 页面信息

### 首页 `/home`
- **文件**：`src/modules/home/pages/Home.tsx`
- **布局**：Hero（左右分栏）+ Pull Quote + Featured Paths + How to Use + Path Demo + The Pool + Newsletter CTA
- **卡片**：使用 `PopularPathCard` 和 `PathCard`
- **颜色**：主色 `sky-500`，分类标签 `amber-600`

### AI Path 生成 `/ai-path`
- **文件**：`src/modules/ai-path/pages/AIPath.tsx`
- **功能**：输入学习目标 → 选择参数 → 生成大纲
- **参数**：level（难度）、depth（深度）、content_type（内容类型）

### AI Path 详情 `/ai-path-detail`
- **文件**：`src/modules/ai-path/pages/AIPathDetail.tsx`
- **布局**：单列全宽，无侧边栏
- **功能**：
  - 展示学习路径大纲
  - 点击子节点展开详情（调用 `/ai-path/subnode-detail` API）
  - Markdown 渲染 + 语法高亮
- **状态管理**：`expandedSubNodes`、`subNodeDetails`、`loadingSubNodes`

### 学习路径池 `/learningpool`
- **文件**：`src/modules/learning-pool/pages/LearningPool.tsx`
- **布局**：Header + Trending（横向滚动）+ Banner + Type Tabs + Path Grid
- **卡片**：`PathTCard`（Trending）、`PathCard`（Grid）
- **筛选**：按类型（Linear/Structured/Pool）+ 搜索

### 资源库 `/resources`
- **文件**：`src/modules/resource/pages/ResourceLibrary.tsx`
- **布局**：Header + Filter Bar + Type Pills + Editorial Grid
- **卡片**：`ResourceCard`（标准）、`CardHero`（大尺寸，每 7 个一个）
- **筛选**：分类 + 类型（Video/Article/Document）+ 搜索
- **颜色**：标题装饰线和 "Library." 使用 `sky-500`

### 我的路径 `/my-paths`
- **文件**：`src/modules/my-path/pages/MyLearningPath.tsx`
- **布局**：Header + Tabs（Published/Forked/Saved/Drafts）+ Path Grid
- **卡片**：`PathCard`，每行 4 个
- **颜色**：装饰线 `amber-500`，标题 "Paths." 使用 `sky-500`

---

## 最近改动

### 2026-04-28
- 主色调从 `amber-500` 改为 `sky-500`
- ResourceLibrary 标题区域颜色改为蓝色
- AIPathDetail 移除右侧侧边栏（At a glance、Outline、Reading strategy）
- 改为单列全宽布局

### 2026-04-27
- AIPathDetail 改为全屏宽度展示
- `generate-outline` 超时提高到 300s
- ResourceCard 图片高度增加（md: h-32, lg: h-40）
- ResourceCard 简介区域固定 4 行，超出显示省略号

---

## 已知问题
- （待补）UI 细节打磨 / 间距 / 卡片图片 / 响应式适配

## 待办（下一步）
- （待补）LearnPath/Topic 卡片：图片策略 + 兜底 + padding 统一
- （待补）真实用户案例展示区（带图片/资源）
- （待补）前端路由层面的 Admin 访问保护

## 常用命令
- `cd frontend && npm run dev` — 启动开发服务器
- `cd frontend && npm run build` — 构建生产版本
- `cd frontend && npx tsc --noEmit` — TypeScript 类型检查
