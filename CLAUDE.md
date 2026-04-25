# Project Memory — LearnSmart / AIFetchPathly

## 约定
每次修复 Bug 或确定架构决策后，更新对应模块的 CLAUDE.md

## 项目结构

```
/Users/burn/Code/path/
├── frontend/          # React + Vite (localhost:5173)
├── backend/           # FastAPI
├── ai_path/           # LangGraph AI 流水线（独立 Python 包）
├── flutterapp/        # Flutter 移动端
└── supabase/          # 数据库迁移
```

## 技术栈

- **前端**: React + Vite + TailwindCSS + React Router，端口 `5173`
- **后端**: FastAPI + SQLAlchemy + Alembic
- **AI 流水线**: LangGraph (`ai_path/`)，支持 OpenAI / MiniMax LLM，Tavily / Serper 搜索
- **数据库**: PostgreSQL（通过 Supabase）

## AI 流水线（ai_path/）

### 流水线阶段
```
generate_queries → search_web → fetch_pages → summarize_resources → organize → report
```

### 关键文件
| 文件 | 说明 |
|------|------|
| `ai_path/models/schemas.py` | PipelineState TypedDict，所有阶段共享的数据结构 |
| `ai_path/pipeline/queries.py` | 阶段1：用 LLM 生成多样搜索词 |
| `ai_path/pipeline/search.py` | 阶段2：并发搜索，URL 去重 |
| `ai_path/pipeline/fetch.py` | 阶段3：抓取页面内容 |
| `ai_path/pipeline/summarize.py` | 阶段4：LLM 摘要每个资源 |
| `ai_path/tools/search.py` | Tavily / Serper 搜索工具封装 |
| `ai_path/ai_resource/github.py` | GitHub API 搜索 |

### 环境变量（ai_path/.env）
- `TAVILY_API_KEY` 或 `SERPER_API_KEY`
- `SEARCH_PROVIDER=tavily` 或 `serper`
- `LLM_PROVIDER=openai`（默认）或 `minimax`
- `OPENAI_API_KEY`

### resource_count → 查询数量映射
- `compact` → 4 queries → ~5 resources
- `standard` → 6 queries → ~10 resources
- `rich` → 8 queries → ~15 resources

## 后端 API

### AI Path 相关端点
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/ai-path/generate` | 生成完整学习路径 |
| POST | `/ai-path/search-resources` | 搜索资源（Web + GitHub 并发） |
| GET | `/ai-path/cached-results/{topic}` | 读取缓存结果 |

### search-resources 响应结构
```json
{
  "data": [...],           // Tavily web 结果
  "github_results": [...], // GitHub API 结果
  "topic": "string"
}
```

### 缓存机制
- 表：`resource_summary_cache`，按 `(url, topic)` 唯一键缓存摘要结果
- 避免对同一 URL 重复调用 LLM 摘要
- CURD：`backend/app/curd/resource_summary_cache_curd.py`

## 前端关键文件

### ai-resource 页面
- **页面组件**: `frontend/src/modules/ai-path/pages/AIRsource.tsx`
- **路由**: `/ai-resource`
- **API 服务**: `frontend/src/services/aiPath.ts`

### 核心功能
- 搜索：调用 `POST /ai-path/search-resources`
- Shuffle：传入 `exclude_urls`（当前已展示的所有 URL），让后端返回新结果
- 近期搜索：存 localStorage，key = `learnsmart_recent_searches_v1`，最多 8 条
- 点击近期搜索：调用 `GET /ai-path/cached-results/{topic}`，不消耗 API

### AiResourceItem 类型
```ts
{
  url, title, description,
  key_points: string[],
  difficulty: "beginner" | "intermediate" | "advanced",
  resource_type: "video" | "article" | "course" | "docs" | "repo" | "other",
  learning_stage: string,
  estimated_minutes: number,
  image?: string | null
}
```

## 已知 Bug & 修复记录

### [2026-04-14] Tavily 搜索结果重复问题
**症状**: 搜索结果每次都相同，Shuffle 按钮无效

**根因**: `exclude_urls` 未传入 `PipelineState`，Tavily 搜索阶段不知道要排除哪些 URL；缓存层也会命中被排除的 URL 返回旧结果

**修复**:
1. `ai_path/models/schemas.py` — `PipelineState` 新增 `exclude_urls: List[str]` 字段
2. `ai_path/pipeline/search.py` — `search_web` 从 state 读取 `exclude_urls`，搜索时预先排除
3. `backend/app/api/ai_path/service.py` — `initial` state 加入 `exclude_urls`；缓存层跳过被排除 URL

### [2026-04-14] ai-resource 页面搜索架构重构
**变更**: GitHub API 和 Tavily 完全拆分，独立并行调用

**架构**:
- `github_results`（上方区域）← GitHub API 搜 6 条（`search_github()`，按 stars 排序的仓库）
- `data`（下方区域）← Tavily 搜 6 条（`search_tavily_resources()`，教程/文章/视频）
- 两者 `asyncio.gather` 并行，互不阻塞

**关键文件**:
- `ai_path/ai_resource/github.py` — `search_github()` 纯 GitHub API；`search_tavily_resources()` 纯 Tavily
- `backend/app/api/ai_path/router.py` — `_run_tavily_search` + `_run_github_api_search` 并行；`_transform_tavily_resource` 转换 Tavily 结果

### [2026-04-14] 资源卡片图片修复
**症状**: Tavily 结果无图片；GitHub API 结果显示 owner 头像（太丑）

**根因**:
1. 旧 Tavily 代码用 favicon（16px）作缩略图，视觉上不可见
2. Microlink `embed=screenshot.url` 返回 JSON 而非图片 URL，`<img>` 无法渲染
3. GitHub API 结果用 `avatar_url`（owner 头像）

**修复** — `ai_path/ai_resource/github.py` 新增 `_get_thumbnail_for_url(url)`：

| 优先级 | 匹配条件 | 图片来源 |
|-------|---------|---------|
| 1 | YouTube URL | `img.youtube.com/vi/{id}/hqdefault.jpg` |
| 2 | `github.com` | `opengraph.githubassets.com/1/{owner}/{repo}` |
| 3 | 50+ 已知学习平台 | 预置静态 og:image URL（直链，0 延迟） |
| 4 | 其他未知域名 | `thum.io/get/width/640/crop/400/{url}`（真图片） |

GitHub API 结果 thumbnail 同步改为 `opengraph.githubassets.com/1/{full_name}`（Social Preview）

**已预置平台**: freecodecamp、w3schools、medium、dev.to、MDN、react.dev、vuejs、nextjs、tailwindcss、typescript、python、rust、go、kotlin、aws、gcp、azure、docker、kubernetes、pytorch、tensorflow、huggingface、coursera、udemy、leetcode 等 50+

## UI 规范

- 主色：`amber-500`（`#f59e0b`）
- 背景：`stone-50`
- 卡片：`bg-white border border-stone-200 shadow-sm`
- 字体风格：`font-black tracking-tight`（标题），`text-stone-500`（正文）
- Shuffle 按钮：无 hover 样式，只有 `active:scale-95` 点击反馈
