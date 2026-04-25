# ER Diagram

```mermaid
erDiagram
    users {
        int id PK
        varchar username UK
        varchar email UK
        varchar hashed_password
        varchar display_name
        varchar avatar_url
        text bio
        timestamp created_at
        timestamp updated_at
        boolean is_active
        boolean is_superuser
    }

    categories {
        int id PK
        varchar name UK
        varchar code UK
        int parent_id FK
        int level
        text description
        boolean is_leaf
        timestamp created_at
        boolean is_system
        int owner_user_id FK
    }

    resources {
        int id PK
        resourcetype resource_type
        varchar platform
        varchar title
        text summary
        varchar source_url
        varchar thumbnail
        int difficulty
        json tags
        json raw_meta
        timestamp created_at
        int category_id FK
        boolean is_system_public
        int community_score
        int save_count
        int trending_score
    }

    learning_paths {
        int id PK
        varchar title
        text description
        boolean is_public
        boolean is_active
        int category_id FK
        varchar cover_image_url
        varchar type
    }

    path_items {
        int id PK
        int learning_path_id FK
        int resource_id FK
        int order_index
        varchar stage
        varchar purpose
        int estimated_time
        boolean is_optional
        int manual_weight
    }

    progress {
        int id PK
        int user_id FK
        int path_item_id FK
        timestamp last_watched_time
        int progress_percentage
    }

    learning_path_comments {
        int id PK
        int learning_path_id FK
        int user_id FK
        varchar username
        text content
        timestamp created_at
    }

    user_learning_paths {
        int user_id FK
        int learning_path_id FK
    }

    user_resource {
        int user_id FK
        int resource_id FK
        timestamp created_at
        boolean is_public
        int manual_weight
        int behavior_weight
        int effective_weight
        timestamp added_at
        timestamp last_opened
        int open_count
        boolean completion_status
    }

    user_follows {
        int follower_id FK
        int following_id FK
        timestamp created_at
    }

    videos {
        int resource_id PK FK
        int duration
        varchar channel
        varchar video_id
    }

    articles {
        int resource_id PK FK
        varchar publisher
        timestamp published_at
    }

    docs {
        int resource_id PK FK
        varchar doc_type
        varchar version
    }

    roles {
        int id PK
        varchar name UK
        varchar code UK
        text description
        boolean is_active
        boolean is_system
        int level
        timestamp created_at
        timestamp updated_at
    }

    permissions {
        int id PK
        varchar name UK
        varchar code UK
        text description
        varchar module
        varchar action
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    role_permissions {
        int role_id FK
        int permission_id FK
        timestamp granted_at
    }

    user_roles {
        int user_id FK
        int role_id FK
        timestamp assigned_at
    }

    subscriptions {
        int id PK
        int user_id FK
        varchar provider
        varchar provider_subscription_id
        varchar plan_code
        varchar status
        timestamp current_period_start
        timestamp current_period_end
        boolean cancel_at_period_end
        timestamp created_at
        timestamp updated_at
    }

    user_images {
        int id PK
        int user_id FK
        varchar title
        varchar image_url
        timestamp created_at
    }

    user_files {
        int id PK
        int user_id FK
        varchar title
        varchar file_type
        varchar original_filename
        varchar content_type
        int size_bytes
        varchar file_url
        timestamp created_at
        text content
    }

    webhook_events {
        int id PK
        varchar provider
        varchar event_id
        varchar event_type
        text payload_json
        text headers_json
        timestamp received_at
        boolean processed
        text error
    }

    products {
        int id PK
        varchar name UK
        text description
    }

    docs_legacy {
        int id PK
        varchar name UK
        text description
    }

    alembic_version {
        varchar version_num PK
    }

    %% Relationships
    users ||--o{ user_roles : "has"
    user_roles }o--|| roles : "assigned to"
    users ||--o{ user_learning_paths : "enrolled in"
    user_learning_paths }o--|| learning_paths : "enrollment"
    users ||--o{ user_resource : "saved"
    user_resource }o--|| resources : "resource"
    users ||--o{ user_follows : "follows"
    user_follows }o--|| users : "followed"
    users ||--o{ progress : "tracks"
    progress }o--|| path_items : "on"
    users ||--o{ learning_path_comments : "comments"
    learning_path_comments }o--|| learning_paths : "on"
    users ||--o{ subscriptions : "subscribes"
    users ||--o{ user_images : "uploads"
    users ||--o{ user_files : "uploads"

    categories ||--o{ categories : "parent"
    categories ||--o{ learning_paths : "contains"
    categories ||--o{ resources : "contains"
    categories ||--|| categories : "is parent of"

    learning_paths ||--o{ path_items : "contains"
    path_items }o--|| resources : "references"
    path_items }o--|| learning_paths : "belongs to"

    resources ||--|| videos : "extends"
    resources ||--|| articles : "extends"
    resources ||--|| docs : "extends"

    roles ||--o{ role_permissions : "grants"
    role_permissions }o--|| permissions : "permission"

    products ||--o{ subscriptions : "subscribed via"
```

---

## Entity Relationship Description

### Core Entities

```
┌─────────────────┐
│     users       │
├─────────────────┤
│ PK id           │
│    username     │
│    email        │
│    hashed_pwd   │
│    display_name │
│    avatar_url   │
│    bio          │
│    created_at   │
│    updated_at   │
│    is_active    │
│    is_superuser │
└─────────────────┘
         │
         ├──────────────┬─────────────────┬───────────────┐
         │              │                 │               │
         ▼              ▼                 ▼               ▼
    ┌─────────┐   ┌─────────────┐   ┌──────────────┐  ┌────────────┐
    │roles    │   │subscriptions│   │user_images   │  │user_files  │
    │(M:M)───────│user_roles   │   └──────────────┘  └────────────┘
    └─────────┘   └─────────────┘
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
    ┌─────────────────┐     ┌──────────────────┐
    │user_learning_paths│     │ user_resource    │
    └─────────────────┘     └──────────────────┘
              │                        │
              ▼                        ▼
    ┌─────────────────┐     ┌──────────────────┐
    │ learning_paths  │     │   resources      │
    └─────────────────┘     └──────────────────┘
              │                        │
              ▼                        │
    ┌─────────────────┐                 │
    │  path_items     │◄────────────────┘
    └─────────────────┘
              │
              ▼
    ┌─────────────────┐
    │   progress      │
    └─────────────────┘
```

### Resource Types (Table Per Kind Pattern)

```
                    ┌─────────────┐
                    │  resources  │
                    ├─────────────┤
                    │ id (PK,FK) │
                    │ resource_type│
                    │ title       │
                    │ source_url  │
                    │ ...        │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
   ┌──────────┐     ┌───────────┐     ┌──────────┐
   │  videos  │     │ articles  │     │   docs   │
   ├──────────┤     ├───────────┤     ├──────────┤
   │duration  │     │ publisher │     │ doc_type │
   │ channel  │     │published_ │     │ version  │
   │ video_id │     │   at      │     └──────────┘
   └──────────┘     └───────────┘
```

### Category Hierarchy (Self-Referential)

```
┌─────────────────┐
│   categories    │
├─────────────────┤
│ id              │
│ name            │
│ code            │
│ parent_id ──────┼──┐
│ level           │  │
│ is_leaf         │  │
└─────────────────┘  │
                    │ self-reference
                    └──────────────►┌─────────────────┐
                                   │   categories     │
                                   ├─────────────────┤
                                   │ id              │
                                   │ name            │
                                   │ code            │
                                   │ parent_id ──┐   │
                                   └─────────────┼───┘
                                                 │
                            (continues for sub-categories)
```

### RBAC Model

```
┌────────────┐         ┌─────────────────┐         ┌──────────────┐
│   roles   │─────────│ role_permissions │─────────│ permissions  │
├────────────┤         └─────────────────┘         ├──────────────┤
│ id        │         │ role_id         │         │ id           │
│ name      │         │ permission_id   │         │ name         │
│ code      │         │ granted_at      │         │ code         │
│ level     │         └─────────────────┘         │ module       │
│ is_system │                                       │ action       │
└────────────┘                                       └──────────────┘
       │
       │ M:M via user_roles
       ▼
┌────────────┐
│   users   │
└────────────┘
```

---

## Cardinalities

| Relationship | Type | Description |
|--------------|------|-------------|
| users → categories | 1:N | owner |
| categories → categories | 1:N | self-referential parent |
| categories → learning_paths | 1:N | contains |
| categories → resources | 1:N | contains |
| learning_paths → path_items | 1:N | contains |
| path_items → resources | N:1 | references |
| path_items → progress | 1:N | tracked by |
| users → progress | 1:N | tracks |
| users → user_learning_paths | 1:N | enrolled |
| user_learning_paths → learning_paths | N:1 | enrollment |
| users → user_resource | 1:N | saved |
| user_resource → resources | N:1 | resource |
| users → user_follows | 1:N | follows |
| user_follows → users | N:1 | followed |
| users → learning_path_comments | 1:N | comments |
| learning_path_comments → learning_paths | N:1 | on |
| resources → videos | 1:1 | extends |
| resources → articles | 1:1 | extends |
| resources → docs | 1:1 | extends |
| roles → role_permissions | 1:N | grants |
| role_permissions → permissions | N:1 | permission |
| users → user_roles | 1:N | has |
| user_roles → roles | N:1 | assigned |
| users → subscriptions | 1:N | subscribes |
| users → user_images | 1:N | uploads |
| users → user_files | 1:N | uploads |
