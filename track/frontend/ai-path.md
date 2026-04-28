# AI Path

## Route 信息

- Route: `/ai-path`
- Route 文件: `frontend/src/routes/misc.tsx`, `frontend/src/routes/home.tsx`
- 页面组件: `frontend/src/modules/ai-path/pages/AIPath.tsx`
- 本地 URL: `http://localhost:5175/ai-path`
- 线上 URL: `https://www.learnpathly.com/ai-path`

## 页面里的组件信息

- AIPath 页面组件
- Generate 表单
- 偏好设置控件
- `generateAiPath`

## 页面里的文字信息

- Generate
- 学习目标输入
- level / learning depth / content type / practical ratio 相关文字
- 生成中提示与错误提示

## 页面区域

- 页面标题和说明
- 学习目标输入区
- 偏好配置区
- Generate 按钮
- 生成状态与错误提示

## 目前状态

- Generate 调用 `/ai-path/generate-outline`。
- 结果会保存到 PostgreSQL `ai_path_*` 表，并临时写入 `sessionStorage` 作为 fallback。
- 后续重点是减少缓存误导，强化真实 AI 生成反馈。

