# 前端追踪

最后更新：2026-04-27

## 当前状态
- 开发端口：5175（Vite）
- 关键页面：`/ai-path`、`/ai-path-detail`、`/resources`、`/home`、`/learning-pool`、`/admin/*`

## 最近改动 / 记录
- AI Path Detail：改为全屏宽度展示（去掉 `max-w-*` 限宽容器）。
- 生成大纲接口超时：前端将 `generate-outline` 超时提高到 300s。

## 已知问题
- （待补）UI 细节打磨 / 间距 / 卡片图片 / 响应式适配

## 待办（下一步）
- （待补）LearnPath/Topic 卡片：图片策略 + 兜底 + padding 统一
- （待补）真实用户案例展示区（带图片/资源）
- （待补）前端路由层面的 Admin 访问保护

## 常用命令
- `cd frontend && npm run dev`
- `cd frontend && npm run build`
