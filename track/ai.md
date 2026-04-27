# AI 功能追踪

最后更新：2026-04-27

## Provider / Key
- 搜索 Provider：Tavily（`SEARCH_PROVIDER=tavily`）
- LLM Provider：默认 MiniMax（`LLM_PROVIDER=minimax`）

## 工作流步骤（ai_path）
- Step 1：生成 outline + subnodes（web search + LLM）
- Step 2：章节扩展/教程（当前 UI 不强依赖，可选）
- Step 2.5：subnode 详情（LLM；懒加载；写入 DB）
- Step 3：章节资源（search + fetch + LLM summarization）
- Step 4：最终总结 + GitHub 项目推荐

## 语言策略
- 目标输出：英文（title/sections/subnodes/details/summary）。

## 批量生成
- 脚本：`backend/scripts/batch_generate_ai_paths.py`
- 每个主题输出到 `result/*`（同时写入 DB）

## 待办（下一步）
- （待补）Step3/Step4 提示词统一英文（目前部分提示词是中文）。
- （待补）把“language”作为一等参数贯穿：API -> DB -> prompt -> UI。
- （待补）额度/超时/失败在 UI 与日志里可见（不要默默 fallback）。
