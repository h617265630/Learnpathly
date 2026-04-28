# Account Layout

## Route 信息

- Route: `/account`
- 子路由:
  - `/account/user-info`
  - `/account/my-resources`
  - `/account/my-paths`
  - `/account/plan`
  - `/account/change-password`
- Route 文件: `frontend/src/routes/user.tsx`
- 页面组件: `frontend/src/modules/user/pages/Account.tsx`
- 本地 URL: `http://localhost:5175/account`
- 线上 URL: `https://www.learnpathly.com/account`

## 页面里的组件信息

- Account layout
- 侧边导航
- Outlet 子页面

## 页面里的文字信息

- Account
- My Resources
- My Learning Paths
- User Info
- Plan
- Change Password

## 页面区域

- Account 侧边栏
- 子页面内容区

## 目前状态

- `/account` 默认跳转 `/account/user-info`。
- 部分子路由会跳转到全局页面，如 `/my-resources` / `/my-paths`。

