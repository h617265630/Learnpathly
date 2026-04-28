# Resource Document

## Route 信息

- Routes:
  - `/my-resources/document/:id`
  - `/resources/document/:id`
- Route 文件: `frontend/src/routes/resource.tsx`
- 页面组件: `frontend/src/modules/my-resource/pages/ResourceDocument.tsx`
- 本地 URL: `http://localhost:5175/resources/document/111`
- 线上 URL: `https://www.learnpathly.com/resources/document/111`

## 页面里的组件信息

- ResourceDocument 页面组件
- Document Preview iframe
- Reader Mode fallback
- thumbnail fallback
- Meta card

## 页面里的文字信息

- Document
- Preview or read the document and track progress.
- Document Resource
- Document Preview
- Open in new tab
- Mark as complete
- Summary
- Reader Mode
- In-site reading unavailable
- Add to path

## 页面区域

- 页面标题
- 资源标题和 meta 标签
- 可预览文档 iframe 区域
- 不可预览文档的缩略图区域
- Summary
- Reader Mode fallback
- 右侧 Meta 和操作按钮

## 目前状态

- `/resources/document/111` 的 GitHub OpenGraph 图片已改为白底 `p-2`、`object-contain`，避免图片裁切。
- PDF/Office 文档仍走 iframe viewer。
- 外链类 document 走缩略图和 Reader Mode。

