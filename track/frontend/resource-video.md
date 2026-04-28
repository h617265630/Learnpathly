# Resource Video

## Route 信息

- Routes:
  - `/my-resources/video/:id`
  - `/resources/video/:id`
- Route 文件: `frontend/src/routes/resource.tsx`
- 页面组件: `frontend/src/modules/my-resource/pages/ResourceVideo.tsx`
- 本地 URL: `http://localhost:5175/resources/video/111`
- 线上 URL: `https://www.learnpathly.com/resources/video/111`

## 页面里的组件信息

- ResourceVideo 页面组件
- 视频播放器/外链播放区域
- 进度追踪按钮

## 页面里的文字信息

- Video Resource
- Learning Progress
- Mark as complete
- Open Original

## 页面区域

- 视频展示区
- 资源标题和 meta
- Summary
- Progress
- 操作按钮

## 目前状态

- 同一个组件支持公开资源和我的资源路径。
- 进度追踪依赖 `path_item_id` query。

