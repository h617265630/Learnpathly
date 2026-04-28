# Learning Path Detail

## Route 信息

- Routes:
  - `/learningpath/:id`
  - `/learningpath/:id/detail`
- Route 文件: `frontend/src/routes/learning-path.tsx`
- 页面组件: `frontend/src/modules/learning-path/pages/LearningPathDetail.tsx`
- 本地 URL: `http://localhost:5175/learningpath/40`
- 线上 URL: `https://www.learnpathly.com/learningpath/40`

## 页面里的组件信息

- LearningPathDetail 页面组件
- ResourceCard
- AI outline / topic outline 展示逻辑
- Resource Path Content Preview

## 页面里的文字信息

- Learning Path
- Topic Outline
- Resource Path Content Preview
- Recommended resources
- Test Summaries 已改为 `Resource Path Content Preview`

## 页面区域

- Banner 图片区域
- 路径标题/标签
- Topic outline 区域
- 相关资源展示区
- Resource Path Content Preview 总结区
- Meta 信息和操作按钮区域

## 目前状态

- Banner 图片已修正为边框内展示，`p-1` 内距。
- 可展示主题大纲、subnodes 和相关资源。
- `/learningpath/:id` 用于网站公开路径展示。

