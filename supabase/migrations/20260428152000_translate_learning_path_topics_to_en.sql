-- Translate AI learning path topics/titles to English.
-- This migration updates:
-- 1) ai_path_projects.topic (source topic used in /ai-path pages)
-- 2) learning_paths.title for paths published from ai_path_projects

-- AI Productivity & Knowledge Workflow Tools Topics (from pathtopic.md)
UPDATE ai_path_projects SET topic = 'Cursor AI Coding Workflow'
WHERE topic = 'Cursor AI 编程工作流';

UPDATE ai_path_projects SET topic = 'Hands-on Claude Code'
WHERE topic = 'Claude Code 实战';

UPDATE ai_path_projects SET topic = 'Terminal AI Agents: OpenClaw / OpenCode'
WHERE topic = 'OpenClaw / OpenCode 类终端 AI Agent 工具';

UPDATE ai_path_projects SET topic = 'GitHub Copilot for Productive Development'
WHERE topic = 'GitHub Copilot 高效开发';

UPDATE ai_path_projects SET topic = 'Using Windsurf AI IDE'
WHERE topic = 'Windsurf AI IDE 使用';

UPDATE ai_path_projects SET topic = 'Aider: Collaborative Coding Workflow'
WHERE topic = 'Aider 代码协作工作流';

UPDATE ai_path_projects SET topic = 'Codex CLI / AI Coding Agent'
WHERE topic = 'Codex CLI / AI Coding Agent';

UPDATE ai_path_projects SET topic = 'VS Code AI Plugin Ecosystem'
WHERE topic = 'VS Code AI 插件生态';

UPDATE ai_path_projects SET topic = 'Building a Second Brain with Obsidian'
WHERE topic = 'Obsidian 第二大脑搭建';

UPDATE ai_path_projects SET topic = 'Obsidian + AI Plugins Workflow'
WHERE topic = 'Obsidian + AI 插件工作流';

UPDATE ai_path_projects SET topic = 'Notion AI for Knowledge Management'
WHERE topic = 'Notion AI 知识管理';

UPDATE ai_path_projects SET topic = 'NotebookLM for Learning and Research'
WHERE topic = 'NotebookLM 学习与研究工作流';

UPDATE ai_path_projects SET topic = 'Logseq: Bidirectional Notes and PKM'
WHERE topic = 'Logseq 双链笔记系统';

UPDATE ai_path_projects SET topic = 'Tana Knowledge Graph Workflow'
WHERE topic = 'Tana 知识图谱工作流';

UPDATE ai_path_projects SET topic = 'Readwise Reader for Information Capture'
WHERE topic = 'Readwise Reader 信息收集';

UPDATE ai_path_projects SET topic = 'Zotero + AI for Reference Management'
WHERE topic = 'Zotero + AI 文献管理';

UPDATE ai_path_projects SET topic = 'Perplexity AI for Search and Research'
WHERE topic = 'Perplexity AI 搜索研究';

UPDATE ai_path_projects SET topic = 'Deep Research Workflows with ChatGPT'
WHERE topic = 'ChatGPT 深度研究工作流';

UPDATE ai_path_projects SET topic = 'Claude Project Knowledge Base Workflow'
WHERE topic = 'Claude 项目知识库工作流';

UPDATE ai_path_projects SET topic = 'Raycast AI Productivity Workflow'
WHERE topic = 'Raycast AI 效率工作流';

UPDATE ai_path_projects SET topic = 'Arc Browser + AI for Information Management'
WHERE topic = 'Arc Browser + AI 信息管理';

UPDATE ai_path_projects SET topic = 'Warp Terminal AI Workflow'
WHERE topic = 'Warp Terminal AI 终端工作流';

UPDATE ai_path_projects SET topic = 'Linear + AI for Project Management'
WHERE topic = 'Linear + AI 项目管理';

UPDATE ai_path_projects SET topic = 'Make / Zapier AI Automation'
WHERE topic = 'Make / Zapier AI 自动化';

UPDATE ai_path_projects SET topic = 'n8n AI Workflow Automation'
WHERE topic = 'n8n AI 工作流自动化';

UPDATE ai_path_projects SET topic = 'MCP Tools: Integration and Usage'
WHERE topic = 'MCP 工具接入与使用';

UPDATE ai_path_projects SET topic = 'Personal Knowledge Management (PKM)'
WHERE topic = 'Personal Knowledge Management PKM';

-- Already English; keep as-is, but normalize any accidental Chinese duplicates.
UPDATE ai_path_projects SET topic = 'Building a Second Brain'
WHERE topic = 'Building a Second Brain';

UPDATE ai_path_projects SET topic = 'AI-Assisted Writing and Content Production'
WHERE topic = 'AI 辅助写作与内容生产';

UPDATE ai_path_projects SET topic = 'Building an AI-Powered Learning System'
WHERE topic = 'AI 辅助学习系统搭建';

-- Sync published learning paths to updated topics when they were published from ai_path_projects.
UPDATE learning_paths lp
SET title = p.topic
FROM ai_path_projects p
WHERE p.published_learning_path_id = lp.id
  AND p.topic IS NOT NULL
  AND lp.title IS DISTINCT FROM p.topic;

-- For any learning_paths created directly with the old (Chinese) titles (no linkage),
-- update them as well (safe because the WHERE matches exact strings).
UPDATE learning_paths SET title = 'Cursor AI Coding Workflow' WHERE title = 'Cursor AI 编程工作流';
UPDATE learning_paths SET title = 'Hands-on Claude Code' WHERE title = 'Claude Code 实战';
UPDATE learning_paths SET title = 'Terminal AI Agents: OpenClaw / OpenCode' WHERE title = 'OpenClaw / OpenCode 类终端 AI Agent 工具';
UPDATE learning_paths SET title = 'GitHub Copilot for Productive Development' WHERE title = 'GitHub Copilot 高效开发';
UPDATE learning_paths SET title = 'Using Windsurf AI IDE' WHERE title = 'Windsurf AI IDE 使用';
UPDATE learning_paths SET title = 'Aider: Collaborative Coding Workflow' WHERE title = 'Aider 代码协作工作流';
UPDATE learning_paths SET title = 'VS Code AI Plugin Ecosystem' WHERE title = 'VS Code AI 插件生态';
UPDATE learning_paths SET title = 'Building a Second Brain with Obsidian' WHERE title = 'Obsidian 第二大脑搭建';
UPDATE learning_paths SET title = 'Obsidian + AI Plugins Workflow' WHERE title = 'Obsidian + AI 插件工作流';
UPDATE learning_paths SET title = 'Notion AI for Knowledge Management' WHERE title = 'Notion AI 知识管理';
UPDATE learning_paths SET title = 'NotebookLM for Learning and Research' WHERE title = 'NotebookLM 学习与研究工作流';
UPDATE learning_paths SET title = 'Logseq: Bidirectional Notes and PKM' WHERE title = 'Logseq 双链笔记系统';
UPDATE learning_paths SET title = 'Tana Knowledge Graph Workflow' WHERE title = 'Tana 知识图谱工作流';
UPDATE learning_paths SET title = 'Readwise Reader for Information Capture' WHERE title = 'Readwise Reader 信息收集';
UPDATE learning_paths SET title = 'Zotero + AI for Reference Management' WHERE title = 'Zotero + AI 文献管理';
UPDATE learning_paths SET title = 'Perplexity AI for Search and Research' WHERE title = 'Perplexity AI 搜索研究';
UPDATE learning_paths SET title = 'Deep Research Workflows with ChatGPT' WHERE title = 'ChatGPT 深度研究工作流';
UPDATE learning_paths SET title = 'Claude Project Knowledge Base Workflow' WHERE title = 'Claude 项目知识库工作流';
UPDATE learning_paths SET title = 'Raycast AI Productivity Workflow' WHERE title = 'Raycast AI 效率工作流';
UPDATE learning_paths SET title = 'Arc Browser + AI for Information Management' WHERE title = 'Arc Browser + AI 信息管理';
UPDATE learning_paths SET title = 'Warp Terminal AI Workflow' WHERE title = 'Warp Terminal AI 终端工作流';
UPDATE learning_paths SET title = 'Linear + AI for Project Management' WHERE title = 'Linear + AI 项目管理';
UPDATE learning_paths SET title = 'Make / Zapier AI Automation' WHERE title = 'Make / Zapier AI 自动化';
UPDATE learning_paths SET title = 'n8n AI Workflow Automation' WHERE title = 'n8n AI 工作流自动化';
UPDATE learning_paths SET title = 'MCP Tools: Integration and Usage' WHERE title = 'MCP 工具接入与使用';
UPDATE learning_paths SET title = 'AI-Assisted Writing and Content Production' WHERE title = 'AI 辅助写作与内容生产';
UPDATE learning_paths SET title = 'Building an AI-Powered Learning System' WHERE title = 'AI 辅助学习系统搭建';

