# Home

## Route 信息

- Route: `/home`
- Route 文件: `frontend/src/routes/home.tsx`
- 页面组件: `frontend/src/modules/home/pages/Home.tsx`
- 本地 URL: `http://localhost:5175/home`
- 线上 URL: `https://www.learnpathly.com/home`

## 页面里的组件信息

- `PathCard`
- `PopularPathCard`
- `LearnPathCard`
- `SectionLabel`
- 数据服务: `listPublicLearningPaths`, `listAiPathProjects`

## 页面里的文字信息

- `Learning Platform`
- `Curated Resources. Structured.`
- `Explore Paths`
- `Search Resources`
- `Featured Path`
- `Explore trending topics with AI-generated outlines, knowledge points, and reference resources.`
- `Transform scattered resources into structured expertise.`
- `Resource Path`
- `View all resource paths`
- `AI`
- `AI LearnPaths`
- `View all`

## 页面区域

- Hero 左侧品牌文案与 CTA
- Hero 右侧视频背景 Featured Path
- Pull Quote 区域
- Resource Path 区域，展示普通 learning path 卡片
- AI LearnPaths 区域，展示 AI 生成学习路径卡片
- 下方 Resource Pool / path 卡片区域

## 目前状态

- 首页已接入普通学习路径和 AI 学习路径数据。
- `AI LearnPaths` 右侧链接显示 `View all`，跳转 `/learningpool`。
- `Resource Path` 标题大小已调整为和 `AI LearnPaths` 一致。
- AI 卡片支持完整状态标记 `Complete x/y`。

