# AI Path Detail

## Route 信息

- Route: `/ai-path-detail`
- Query: `?project_id=:id`
- Route 文件: `frontend/src/routes/misc.tsx`, `frontend/src/routes/home.tsx`
- 页面组件: `frontend/src/modules/ai-path/pages/AIPathDetail.tsx`
- 本地 URL: `http://localhost:5175/ai-path-detail?project_id=38`
- 线上 URL: `https://www.learnpathly.com/ai-path-detail?project_id=38`

## 页面里的组件信息

- AIPathDetail 页面组件
- `ResourceCard`
- Markdown renderer / code highlight / copy button
- Lesson outline sidebar
- `getAiPathProject`, `getLatestAiPathProject`, `getSubNodeDetail`

## 页面里的文字信息

- Course Outline
- Lesson goal
- Concept flow
- Explanation
- Runnable examples
- Practice task
- Reading checklist
- Lesson resources

## 页面区域

- 顶部学习路径标题区域
- 左侧章节/知识点目录
- 中间当前 subnode detail 阅读区
- 代码块高亮与复制按钮
- 实践任务与阅读 checklist
- 已保存资源展示区

## 目前状态

- 已去除 `Generation Info` 区域。
- 已去除 `Suggested resource searches / not saved to database` fallback 区域。
- 只展示数据库里真实保存/关联的资源。
- 支持读取已保存 subnode detail，缺失时可调用 detail API。

