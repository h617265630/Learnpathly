-- gen_path: 分步骤生成学习路径的数据库表

-- ─────────────────────────────────────────────────────────────
-- gen_path_projects: 项目主表
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gen_path_projects (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
    topic         VARCHAR(500) NOT NULL,
    level         VARCHAR(50)  DEFAULT 'intermediate',
    learning_depth VARCHAR(50)  DEFAULT 'standard',
    content_type  VARCHAR(50)  DEFAULT 'mixed',
    practical_ratio VARCHAR(50) DEFAULT 'balanced',
    outline_json  JSONB        DEFAULT '{"sections":[]}'::jsonb,
    final_summary TEXT,
    github_projects_json JSONB DEFAULT '[]'::jsonb,
    status        VARCHAR(20)  DEFAULT 'step1',  -- step1 | step2 | step3 | step4 | done
    created_at    TIMESTAMPTZ  DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE gen_path_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own projects"
    ON gen_path_projects FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_gen_path_projects_user_id ON gen_path_projects(user_id);
CREATE INDEX idx_gen_path_projects_status  ON gen_path_projects(status);
CREATE INDEX idx_gen_path_projects_topic   ON gen_path_projects USING gin(to_tsvector('simple', topic));


-- ─────────────────────────────────────────────────────────────
-- gen_path_sections: 各章节表
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gen_path_sections (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID        NOT NULL REFERENCES gen_path_projects(id) ON DELETE CASCADE,
    title               VARCHAR(500) NOT NULL,
    description         TEXT,
    learning_goals_json  JSONB       DEFAULT '[]'::jsonb,
    tutorial_md         TEXT,        -- Step 2 生成的详细教程
    search_queries_json JSONB       DEFAULT '[]'::jsonb,  -- 该章节用于 Step 2 的搜索查询
    order_index         INT         DEFAULT 0,
    created_at          TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE gen_path_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own sections"
    ON gen_path_sections FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM gen_path_projects
            WHERE id = gen_path_sections.project_id
              AND user_id = auth.uid()
        )
    );

CREATE INDEX idx_gen_path_sections_project_id ON gen_path_sections(project_id);
CREATE INDEX idx_gen_path_sections_order     ON gen_path_sections(project_id, order_index);


-- ─────────────────────────────────────────────────────────────
-- gen_path_section_resources: 各章节关联的资源
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gen_path_section_resources (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id    UUID        NOT NULL REFERENCES gen_path_sections(id) ON DELETE CASCADE,
    resource_json JSONB       NOT NULL,
    added_by      VARCHAR(20) DEFAULT 'ai',  -- 'ai' | 'user'
    created_at    TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE gen_path_section_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own section resources"
    ON gen_path_section_resources FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM gen_path_sections s
            JOIN gen_path_projects p ON s.project_id = p.id
            WHERE s.id = gen_path_section_resources.section_id
              AND p.user_id = auth.uid()
        )
    );

CREATE INDEX idx_gen_path_section_resources_section_id ON gen_path_section_resources(section_id);
