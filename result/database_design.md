# 数据库设计分析报告

> 针对 Learnpathly 平台业务需求的数据库设计问题梳理与改进建议

---

## 一、当前表结构总览

```
users                    — 用户
categories               — 分类（支持树形层级）
resources                — 资源（视频/文章/文档，所有用户共享）
  videos                 — 视频扩展信息（1:1）
  docs                   — 文档扩展信息（1:1）
  articles               — 文章扩展信息（1:1）
user_resource            — 用户收藏的资源（多对多关联表）
learning_paths           — 学习路径
path_items               — 学习路径中的资源条目
user_learning_paths      — 用户收藏的学习路径（多对多）
progress                 — 学习进度（基于 path_item）
learning_path_comments   — 学习路径评论
subscriptions            — 订阅/付费计划
user_video               — 用户与视频的关联（旧表，疑似废弃）
watch_history            — 观看历史（旧表，疑似废弃）
video_category           — 视频分类关联（旧表，疑似废弃）
user_files               — 用户上传的文件
user_images              — 用户上传的图片
rbac: roles/permissions  — 角色权限
```

---

## 二、核心设计问题

### 🔴 问题 1：Resource 表被多用户共享，但允许任意用户修改

**现状**

`Resource` 表存储了 `title`、`summary`、`thumbnail`、`platform` 等字段，所有收藏了同一资源的用户共享同一条记录。但当前 `update_for_user` 接口直接修改 `Resource` 表：

```python
obj.title = payload.title      # 直接改共享数据！
obj.summary = payload.summary  # 所有收藏此资源的用户都受影响
```

**影响**

- 用户 A 修改了标题 → 用户 B、C、D 看到的标题也跟着变
- 平台规模越大，这个问题越严重
- 数据污染无法追溯

**正确方案**

在 `user_resource` 表增加覆盖字段，读取时优先用用户自定义值：

```python
# user_resource 表新增
custom_title     = Column(String(500), nullable=True)
custom_summary   = Column(Text, nullable=True)
custom_thumbnail = Column(String(1000), nullable=True)

# 读取逻辑
title     = ur.custom_title     or r.title
summary   = ur.custom_summary   or r.summary
thumbnail = ur.custom_thumbnail or r.thumbnail
```

---

### 🔴 问题 2：Resource 没有 creator/owner 字段

**现状**

`Resource` 表没有 `creator_id` 字段，无法知道谁创建了这条资源。

**影响**

- 无法区分"系统资源"和"用户创建的资源"
- 无法实现"只有创建者才能修改原始数据"的权限控制
- 删除逻辑混乱：现在删除资源是直接从 `user_resource` detach，但如果创建者删除，其他收藏者的数据会怎样？

**正确方案**

```python
# Resource 表新增
creator_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
```

权限逻辑：
- `creator_id == current_user.id` → 可修改 Resource 原始数据
- 其他用户 → 只能修改 user_resource 的覆盖字段

---

### 🟡 问题 3：user_resource 的 is_public 语义不清晰

**现状**

- `Resource.is_system_public` — 系统级公开（管理员控制）
- `UserResource.is_public` — 用户级公开

但 API 返回时把 `UserResource.is_public` 映射到 `is_system_public` 字段返回给前端，命名混乱。

**建议**

统一命名，前端和后端保持一致：

```python
# ResourceResponse 中明确区分
is_system_public: bool   # 管理员设置，资源是否进入公共资源库
is_user_public: bool     # 用户设置，是否在个人主页展示
```

---

### 🟡 问题 4：progress 表设计不完整

**现状**

```python
class Progress(Base):
    user_id       = ...
    path_item_id  = ...
    last_watched_time = ...
    progress_percentage = ...
```

**问题**

- 没有唯一约束 `(user_id, path_item_id)`，同一用户同一条目可能有多条进度记录
- `progress_percentage` 是 Integer，没有范围约束（应该 0-100）
- 没有 `completed_at` 字段，无法知道何时完成
- 与 `user_resource` 的 `completion_status` 字段功能重叠，两套进度系统并存

**建议**

```python
class Progress(Base):
    user_id             = ...
    path_item_id        = ...
    progress_percentage = Column(Integer, default=0)  # 0-100
    completed_at        = Column(DateTime, nullable=True)
    last_accessed_at    = Column(DateTime)

    __table_args__ = (
        UniqueConstraint('user_id', 'path_item_id'),
    )
```

---

### 🟡 问题 5：user_learning_paths 表设计有语法错误

**现状**

```python
class UserLearningPath(Base):
    Base.metadata,   # ← 这行是无效代码，语法错误
    user_id = ...
    learning_path_id = ...
```

这张表只有两个外键，缺少：
- `added_at` — 何时收藏
- `is_pinned` — 是否置顶
- `last_accessed_at` — 最近访问时间
- `progress_summary` — 整体进度缓存

---

### 🟡 问题 6：LearningPath 没有 creator/owner

**现状**

`LearningPath` 表没有 `creator_id`，只有通过 `user_learning_paths` 多对多关联用户，无法区分"创建者"和"收藏者"。

**影响**

- 无法实现"只有创建者才能编辑路径"的权限控制
- 无法在公共路径库展示"作者是谁"

**建议**

```python
creator_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
```

---

### 🟡 问题 7：LearningPathComment 冗余存储 username

**现状**

```python
class LearningPathComment(Base):
    user_id  = ...
    username = Column(String(64), nullable=False)  # ← 冗余！
```

`username` 已经在 `users` 表里，这里重复存储会导致用户改名后评论里的名字不同步。

**修复方案 ✅（已完成）**

- 删除 `username` 字段
- `LearningPathCommentResponse` schema 新增 `user` 对象字段（通过 eager load 返回用户信息）
- `create_comment` 和 `list_comments` curd 支持 eager load user
- 创建 Alembic migration `20260407_0001_category_user_scoped_unique.py`

---

### 🟠 问题 8：三张疑似废弃的旧表

**调查结果**

| 表名 | 状态 | 说明 |
|------|------|------|
| `user_video` | ⚠️ CURD存在，路由未注册 | curd 代码存在但 `include_router(video.router)` 未在 main.py 中注册，无法通过 API 访问 |
| `watch_history` | ⚠️ 同上 | 同样未注册，但 `UserResource` 已通过 `last_opened` / `open_count` 提供了替代功能 |
| `video_category` | ✅ 真正废弃 | curd/router 均无引用，可安全清理 |

**建议**

- `video_category`：模型和表可以直接删除
- `user_video` / `watch_history`：Alembic migration `20260122_0009_drop_legacy_video_tables.py` 已存在但可能未执行，建议确认是否已应用后再处理

---

### 🟠 问题 9：Category 的 code 字段唯一约束过严

**现状**

```python
code = Column(String(50), unique=True, index=True, nullable=False)
```

如果支持用户自定义分类（`owner_user_id` 不为空），不同用户可能想用相同的 code（如 "frontend"），全局唯一约束会冲突。

**修复方案 ✅（已完成）**

- Model：`name` 和 `code` 改为普通字段，移除全局 unique 约束，改用 `__table_args__` 联合唯一约束 `(name, owner_user_id)` + `(code, owner_user_id)`
- Router：`create_category` 改为按 owner 范围检查 — 系统分类中 code 全局唯一，用户分类中同一 owner 下 code 唯一
- Alembic migration：`20260407_0001_category_user_scoped_unique.py` 用 partial unique index 处理 `owner_user_id IS NULL` 的情况（PostgreSQL 下多行 NULL 不会冲突）

---

## 三、改进优先级汇总

| 优先级 | 问题 | 状态 |
|--------|------|------|
| 🔴 P0 | Resource 共享数据被任意用户修改 | ✅ 已修复 |
| 🔴 P0 | Resource 缺少 creator_id | ✅ 已修复 |
| 🟡 P1 | is_public 命名混乱 | ⏳ 待处理（已有 is_system_public 区分） |
| 🟡 P1 | Progress 缺唯一约束 | ✅ 已修复 |
| 🟡 P1 | LearningPath 缺少 creator_id | ✅ 已修复 |
| 🟡 P1 | LearningPath 自定义覆盖字段 | ✅ 已修复 |
| 🟡 P1 | UserLearningPath 语法错误 + 字段缺失 | ✅ 已修复 |
| 🟡 P2 | LearningPathComment 冗余 username | ✅ 已修复 |
| 🟠 P2 | 三张废弃旧表 | ✅ 已评估，待执行 migration |
| 🟠 P3 | Category code 唯一约束过严 | ✅ 已修复 |

---

## 四、已完成的修复详情

### ✅ P0：Resource 共享写保护

**核心逻辑（update_for_user）：**
- `creator_id == current_user.id` → 用户创建的资源，直接修改 `Resource` 表
- `creator_id != current_user.id`（或 NULL）→ 收藏的公共资源，写入 `UserResource.custom_*` 覆盖字段

**读取逻辑（list_my_resources / get_my_resource_detail）：**
```python
display_title = ur.custom_title or r.title       # custom_* 优先
display_summary = ur.custom_summary or r.summary   # 无则 fallback 原始值
```

### ✅ P1：LearningPath creator_id + 自定义覆盖

- 创建路径时自动设置 `creator_id = user_id`
- 收藏公共路径后，用户可写入 `UserLearningPath.custom_*` 覆盖字段
- `PATCH /learning-paths/me/{id}` 新增端点用于更新收藏路径

### ✅ P1：Progress 唯一约束

- PK 改为联合主键 `(user_id, path_item_id)`
- 新增 `updated_at`、`completed_at`
- `progress_percentage` 默认 0，完成时设置 `completed_at`

### ✅ P1：UserLearningPath 语法修复

- 删除无效 `Base.metadata,` 行
- 新增 `added_at`、`is_pinned`、`custom_title`、`custom_description`、`custom_cover_image_url`、`notes`

---

## 五、Alembic Migrations 汇总

| Migration | 内容 |
|-----------|------|
| `20260407_0001` | Category 按 owner 唯一（partial unique index） |
| `20260407_0002` | UserLearningPath 新增字段 + 语法修复 |
| `20260407_0003` | Resource/LearningPath creator_id、user_resource custom_*、Progress 联合主键、LearningPathComment drop username |

---

## 六、待处理（P0/P1 剩余）

| 项目 | 说明 |
|------|------|
| 执行 `alembic upgrade head` | 将所有 migration 应用到数据库 |
| `is_public` 命名整理 | `ResourceResponse` 中 `is_system_public` vs `UserResource.is_public` 的命名差异，前端已有映射，暂可维持 |
| 废弃表清理 | `user_video`、`watch_history`、`video_category` 三张旧表，确认 migration `20260122_0009` 是否已应用 |

```

### Step 3：更新读取逻辑

```python
# list_my_resources 返回时
title     = getattr(ur, "custom_title", None)     or r.title
summary   = getattr(ur, "custom_summary", None)   or r.summary
thumbnail = getattr(ur, "custom_thumbnail", None) or r.thumbnail
```

### Step 4：更新写入逻辑

```python
# update_for_user：不再修改 Resource 表
# 改为写入 user_resource 的 custom_* 字段
assoc.custom_title     = payload.title
assoc.custom_summary   = payload.summary
assoc.custom_thumbnail = payload.thumbnail
```
