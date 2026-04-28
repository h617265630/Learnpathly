# Learning Pool

## Route 信息

- Route: `/learningpool`
- Route 文件: `frontend/src/routes/learning-pool.tsx`
- 页面组件: `frontend/src/modules/learning-pool/pages/LearningPool.tsx`
- 本地 URL: `http://localhost:5175/learningpool`
- 线上 URL: `https://www.learnpathly.com/learningpool`

## 页面里的组件信息

- `PathTCard`
- `PathCard`
- `LearnPathCard`
- `SkeletonCard`
- 数据服务: `listPublicLearningPaths`, `listAiPathProjects`

## 页面里的文字信息

- LearningPool
- Discover learning paths
- Search paths...
- New path
- Trending now
- AI LearnPaths
- Discover your learning path
- Try AI Path Generator
- All / Linear / Structured / Pool

## 页面区域

- 页面标题和搜索区
- Trending now 横向普通路径卡片区
- AI LearnPaths 网格区
- Banner CTA 区
- 类型 tabs
- 普通学习路径网格
- 空状态 / 搜索结果提示

## 目前状态

- 普通卡片数据来自 `learning_paths`。
- AI LearnPath 卡片数据来自 `ai_path_projects`。
- AI 卡片支持 `Complete x/y` 标记。
- 线上普通卡片标题/描述已改为英文。

