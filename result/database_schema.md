# Database Schema Documentation

Generated from: `backend/tmp/supabase_migration/schema.sql`

## Tables Overview

| Table | Description | Type |
|-------|-------------|------|
| `users` | User accounts | Core |
| `categories` | Resource/path categories | Core |
| `resources` | Learning resources | Core |
| `learning_paths` | Learning path definitions | Core |
| `path_items` | Items within learning paths | Core |
| `progress` | User progress on path items | Core |
| `learning_path_comments` | Comments on learning paths | Social |
| `user_learning_paths` | User-path enrollment (M:M) | Social |
| `user_resource` | User saved resources (M:M) | Social |
| `user_follows` | User follow relationships (M:M) | Social |
| `videos` | Video resource metadata | Resource |
| `articles` | Article resource metadata | Resource |
| `docs` | Document resource metadata | Resource |
| `roles` | User roles (RBAC) | Auth |
| `permissions` | System permissions | Auth |
| `role_permissions` | Role-permission mapping (M:M) | Auth |
| `user_roles` | User-role mapping (M:M) | Auth |
| `subscriptions` | User subscriptions | Billing |
| `user_images` | User uploaded images | Media |
| `user_files` | User uploaded files | Media |
| `webhook_events` | External webhook events | System |
| `products` | Product catalog (legacy) | Legacy |
| `docs_legacy` | Legacy docs (legacy) | Legacy |
| `alembic_version` | Migration tracking | System |

---

## Core Tables

### users
```sql
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(50) NOT NULL UNIQUE,
    email           VARCHAR(120) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    display_name    VARCHAR(100),
    avatar_url      VARCHAR(500),
    bio             TEXT,
    created_at      TIMESTAMP,
    updated_at      TIMESTAMP,
    is_active       BOOLEAN,
    is_superuser    BOOLEAN
);
```

### categories
```sql
CREATE TABLE categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    code        VARCHAR(50) NOT NULL UNIQUE,
    parent_id   INTEGER REFERENCES categories(id),
    level       INTEGER,
    description TEXT,
    is_leaf     BOOLEAN,
    created_at  TIMESTAMP,
    is_system   BOOLEAN DEFAULT true,
    owner_user_id INTEGER REFERENCES users(id)
);
```

### resources
```sql
CREATE TABLE resources (
    id               SERIAL PRIMARY KEY,
    resource_type    resourcetype NOT NULL,  -- ENUM: VIDEO, CLIP, link, document, article, video, clip
    platform         VARCHAR(50),
    title            VARCHAR(200) NOT NULL,
    summary          TEXT,
    source_url       VARCHAR(2048) NOT NULL,
    thumbnail        VARCHAR(1000),
    difficulty       INTEGER,
    tags             JSON,
    raw_meta         JSON,
    created_at       TIMESTAMP DEFAULT now(),
    category_id      INTEGER NOT NULL REFERENCES categories(id),
    is_system_public BOOLEAN DEFAULT false,
    community_score  INTEGER DEFAULT 0,
    save_count       INTEGER DEFAULT 0,
    trending_score   INTEGER DEFAULT 0
);
```

### learning_paths
```sql
CREATE TABLE learning_paths (
    id            SERIAL PRIMARY KEY,
    title         VARCHAR(200) NOT NULL,
    description   TEXT,
    is_public     BOOLEAN,
    is_active     BOOLEAN,
    category_id   INTEGER NOT NULL REFERENCES categories(id),
    cover_image_url VARCHAR(2048),
    type          VARCHAR(50)
);
```

### path_items
```sql
CREATE TABLE path_items (
    id              SERIAL PRIMARY KEY,
    learning_path_id INTEGER NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
    resource_id     INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    order_index     INTEGER NOT NULL,
    stage           VARCHAR(100),
    purpose         VARCHAR(255),
    estimated_time  INTEGER,
    is_optional     BOOLEAN DEFAULT false,
    manual_weight   INTEGER  -- Added for card UI weight support
);
-- UNIQUE(learning_path_id, order_index)
-- UNIQUE(learning_path_id, resource_id)
```

### progress
```sql
CREATE TABLE progress (
    id                  SERIAL PRIMARY KEY,
    user_id             INTEGER REFERENCES users(id),
    path_item_id        INTEGER REFERENCES path_items(id) ON DELETE CASCADE,
    last_watched_time   TIMESTAMP,
    progress_percentage INTEGER
);
```

---

## Social Features

### learning_path_comments
```sql
CREATE TABLE learning_path_comments (
    id              SERIAL PRIMARY KEY,
    learning_path_id INTEGER NOT NULL REFERENCES learning_paths(id),
    user_id         INTEGER NOT NULL REFERENCES users(id),
    username        VARCHAR(64) NOT NULL,
    content         TEXT NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### user_learning_paths
```sql
CREATE TABLE user_learning_paths (
    user_id         INTEGER NOT NULL REFERENCES users(id),
    learning_path_id INTEGER NOT NULL REFERENCES learning_paths(id),
    PRIMARY KEY (user_id, learning_path_id)
);
```

### user_resource
```sql
CREATE TABLE user_resource (
    user_id           INTEGER NOT NULL REFERENCES users(id),
    resource_id       INTEGER NOT NULL REFERENCES resources(id),
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_public         BOOLEAN,
    manual_weight     INTEGER,
    behavior_weight   INTEGER,
    effective_weight  INTEGER,
    added_at          TIMESTAMP,
    last_opened       TIMESTAMP,
    open_count        INTEGER DEFAULT 0,
    completion_status BOOLEAN DEFAULT false,
    PRIMARY KEY (user_id, resource_id)
);
```

### user_follows
```sql
CREATE TABLE user_follows (
    follower_id   INTEGER NOT NULL REFERENCES users(id),
    following_id  INTEGER NOT NULL REFERENCES users(id),
    created_at    TIMESTAMP,
    PRIMARY KEY (follower_id, following_id)
);
```

---

## Resource Extensions

### videos
```sql
CREATE TABLE videos (
    resource_id  INTEGER PRIMARY KEY REFERENCES resources(id) ON DELETE CASCADE,
    duration     INTEGER,
    channel      VARCHAR(255),
    video_id     VARCHAR(100)
);
```

### articles
```sql
CREATE TABLE articles (
    resource_id   INTEGER PRIMARY KEY REFERENCES resources(id) ON DELETE CASCADE,
    publisher     VARCHAR(255),
    published_at TIMESTAMP
);
```

### docs
```sql
CREATE TABLE docs (
    resource_id  INTEGER PRIMARY KEY REFERENCES resources(id) ON DELETE CASCADE,
    doc_type     VARCHAR(50),
    version      VARCHAR(50)
);
```

---

## RBAC / Auth

### roles
```sql
CREATE TABLE roles (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,
    code        VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_active   BOOLEAN,
    is_system   BOOLEAN,
    level       INTEGER,
    created_at  TIMESTAMP,
    updated_at  TIMESTAMP
);
```

### permissions
```sql
CREATE TABLE permissions (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    code        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    module      VARCHAR(50) NOT NULL,
    action      VARCHAR(50) NOT NULL,
    is_active   BOOLEAN,
    created_at  TIMESTAMP,
    updated_at  TIMESTAMP
);
```

### role_permissions
```sql
CREATE TABLE role_permissions (
    role_id       INTEGER NOT NULL REFERENCES roles(id),
    permission_id INTEGER NOT NULL REFERENCES permissions(id),
    granted_at    TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);
```

### user_roles
```sql
CREATE TABLE user_roles (
    user_id     INTEGER NOT NULL REFERENCES users(id),
    role_id     INTEGER NOT NULL REFERENCES roles(id),
    assigned_at TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);
```

---

## Billing

### subscriptions
```sql
CREATE TABLE subscriptions (
    id                       SERIAL PRIMARY KEY,
    user_id                   INTEGER NOT NULL REFERENCES users(id),
    provider                 VARCHAR(50) NOT NULL,
    provider_subscription_id VARCHAR(128),
    plan_code                VARCHAR(50) NOT NULL,
    status                   VARCHAR(32) NOT NULL,
    current_period_start     TIMESTAMP,
    current_period_end       TIMESTAMP,
    cancel_at_period_end     BOOLEAN NOT NULL,
    created_at               TIMESTAMP,
    updated_at               TIMESTAMP
);
-- UNIQUE(user_id, provider)
```

---

## Media

### user_images
```sql
CREATE TABLE user_images (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    title      VARCHAR(200),
    image_url  VARCHAR(2048) NOT NULL,
    created_at TIMESTAMP
);
```

### user_files
```sql
CREATE TABLE user_files (
    id                 SERIAL PRIMARY KEY,
    user_id            INTEGER NOT NULL REFERENCES users(id),
    title              VARCHAR(200),
    file_type          VARCHAR(20) NOT NULL,
    original_filename  VARCHAR(512),
    content_type       VARCHAR(200),
    size_bytes         INTEGER,
    file_url           VARCHAR(2048) NOT NULL,
    created_at         TIMESTAMP,
    content            TEXT
);
```

---

## System

### webhook_events
```sql
CREATE TABLE webhook_events (
    id            SERIAL PRIMARY KEY,
    provider      VARCHAR(50) NOT NULL,
    event_id      VARCHAR(128),
    event_type    VARCHAR(128),
    payload_json  TEXT NOT NULL,
    headers_json  TEXT NOT NULL,
    received_at   TIMESTAMP NOT NULL,
    processed     BOOLEAN NOT NULL,
    error         TEXT
);
```

### alembic_version
```sql
CREATE TABLE alembic_version (
    version_num VARCHAR(128) PRIMARY KEY
);
```

---

## Enums

### resourcetype
```sql
CREATE TYPE resourcetype AS ENUM (
    'VIDEO', 'CLIP', 'link', 'document', 'article', 'video', 'clip'
);
```

### liketype
```sql
CREATE TYPE liketype AS ENUM (
    'LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY'
);
```

---

## Key Indexes

| Index | Table | Columns |
|-------|-------|---------|
| ix_users_username | users | username |
| ix_users_email | users | email |
| ix_categories_name | categories | name |
| ix_categories_code | categories | code |
| ix_resources_category_id | resources | category_id |
| ix_resources_platform | resources | platform |
| ix_resources_resource_type | resources | resource_type |
| ix_learning_paths_category_id | learning_paths | category_id |
| ix_path_items_learning_path_id | path_items | learning_path_id |
| ix_path_items_resource_id | path_items | resource_id |
| ix_roles_name | roles | name |
| ix_roles_code | roles | code |
| ix_permissions_name | permissions | name |
| ix_permissions_code | permissions | code |
| ix_learning_path_comments_learning_path_id | learning_path_comments | learning_path_id |
| ix_learning_path_comments_user_id | learning_path_comments | user_id |
