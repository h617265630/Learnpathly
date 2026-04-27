# 数据库追踪

最后更新：2026-04-27

## 当前状态
- 主数据库：PostgreSQL（通过 `DATABASE_URL` 连接）

## AI Path 表（草稿工作区 / 可运营草稿）
- `ai_path_projects`
- `ai_path_sections`（外键 -> projects）
- `ai_path_subnodes`（外键 -> sections）
- `ai_path_subnode_details`（外键 -> subnodes）

旧版缓存（建议逐步下线，但目前仍兼容）：
- `ai_path_subnode_detail_cache`（按 title 组合 key 缓存）

## 待确认问题
- 发布模型：AI 草稿（`ai_path_*`）如何变成正式可展示内容（`learning_paths/path_items`），是否需要版本/审核/回滚。

## 待办（下一步）
- （待补）为管理端/批量查询补齐必要索引。
- （待补）定义发布相关表结构、关系、状态机。
- （待补）补齐 migrations / supabase 同步流程说明。
