# 后端追踪

最后更新：2026-04-27

## 当前状态
- API 地址：`http://127.0.0.1:8000`
- 启动方式：`uvicorn app.main:app`
- AI Path 关键接口：
  - `POST /ai-path/generate-outline`：生成 outline + subnodes，并写入数据库
  - `GET /ai-path/projects/{id}`：从数据库读取并返回完整结构
  - `POST /ai-path/subnode-detail`：Step 2.5 子知识点详情，写入数据库

## 重要行为说明
- `POST /ai-path/generate-outline` 可能耗时较长（受 Tavily / LLM 额度与响应影响）。
- subnode detail 默认是“懒加载”：用户点开才生成；批量脚本可预生成。

## 已知问题 / 风险
- 外部依赖（Tavily / LLM）会遇到超时或额度耗尽。
- 输出语言需要统一（英文）：title/sections/subnodes/details/summary。

## 待办（下一步）
- （待补）Step3/Step4 提示词统一英文（目前部分提示词是中文）。
- （待补）外部调用统一 timeout + retry 策略，并在响应中可观测。
- （待补）为管理端相关接口增加鉴权/RBAC。

## 常用命令
- 启动：`cd backend && uvicorn app.main:app --host 127.0.0.1 --port 8000`
- 健康检查：`curl http://127.0.0.1:8000/health`
