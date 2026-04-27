# 部署追踪

最后更新：2026-04-27

## 环境
- 本地
  - 前端：`http://localhost:5175`
  - 后端：`http://127.0.0.1:8000`

## 密钥 / 配置
- 不要提交 `.env`（确保 `.gitignore` 覆盖）。
- 记录生产环境每个密钥的配置位置（宿主机环境变量 / Secret Manager / CI）。

## CI/CD
- （待补）构建在哪跑（GitHub Actions / Vercel / Railway / 其它）
- （待补）发布触发方式（branch/tag/manual）

## 待办（下一步）
- （待补）补齐生产环境 URL 与宿主平台信息。
- （待补）写一个 deploy checklist（迁移、冒烟测试、回滚）。
- （待补）加入健康检查与告警。
