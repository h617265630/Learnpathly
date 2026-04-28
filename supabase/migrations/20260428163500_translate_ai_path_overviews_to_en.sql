-- Translate AI LearnPath card overviews to English.
-- These texts are shown in the AI LearnPaths cards on /learningpool and /home.

UPDATE ai_path_projects
SET outline_overview = 'Learn Notion AI for knowledge management, from workspace basics to AI-assisted capture, organization, retrieval, and practical team workflows.'
WHERE topic = 'Notion AI for Knowledge Management'
  AND outline_overview ~ '[一-龥]';

UPDATE ai_path_projects
SET outline_overview = 'Build an Obsidian workflow with AI plugins, moving from vault setup to intelligent note generation, retrieval, and advanced PKM automation.'
WHERE topic = 'Obsidian + AI Plugins Workflow'
  AND outline_overview ~ '[一-龥]';

UPDATE ai_path_projects
SET outline_overview = 'Learn how to use Obsidian as a second brain, from core PKM concepts to practical vault organization, linking, and reusable knowledge workflows.'
WHERE topic = 'Building a Second Brain with Obsidian'
  AND outline_overview ~ '[一-龥]';

UPDATE ai_path_projects
SET outline_overview = 'Explore the VS Code AI plugin ecosystem, including plugin selection, AI code completion, code review, workflow automation, and team best practices.'
WHERE topic = 'VS Code AI Plugin Ecosystem'
  AND outline_overview ~ '[一-龥]';

UPDATE ai_path_projects
SET outline_overview = 'Master Codex CLI as an AI coding agent, from setup and terminal workflows to practical AI-assisted development on real projects.'
WHERE topic = 'Codex CLI / AI Coding Agent'
  AND outline_overview ~ '[一-龥]';

UPDATE ai_path_projects
SET outline_overview = 'Learn Aider as an AI coding collaboration tool, from environment setup to repository-aware edits, review loops, and team workflow integration.'
WHERE topic = 'Aider: Collaborative Coding Workflow'
  AND outline_overview ~ '[一-龥]';

UPDATE ai_path_projects
SET outline_overview = 'Learn Windsurf AI IDE from core concepts to hands-on AI-assisted coding workflows that improve productivity in real development projects.'
WHERE topic = 'Using Windsurf AI IDE'
  AND outline_overview ~ '[一-龥]';

UPDATE ai_path_projects
SET outline_overview = 'Learn GitHub Copilot from setup to practical prompting, code generation, refactoring, testing, and team workflow integration.'
WHERE topic = 'GitHub Copilot for Productive Development'
  AND outline_overview ~ '[一-龥]';

UPDATE ai_path_projects
SET outline_overview = 'Learn terminal-based AI agents such as OpenClaw and OpenCode, including core features, usage patterns, engineering integration, and practical workflows.'
WHERE topic = 'Terminal AI Agents: OpenClaw / OpenCode'
  AND outline_overview ~ '[一-龥]';

UPDATE ai_path_projects
SET outline_overview = 'Learn Claude Code in hands-on command-line workflows, covering AI-assisted coding tasks, workflow optimization, and practical project development.'
WHERE topic = 'Hands-on Claude Code'
  AND outline_overview ~ '[一-龥]';

UPDATE ai_path_projects
SET outline_overview = 'Master Cursor AI as an intelligent coding assistant, from basic usage to advanced workflows for applying AI effectively in real projects.'
WHERE topic = 'Cursor AI Coding Workflow'
  AND outline_overview ~ '[一-龥]';

UPDATE ai_path_projects
SET outline_overview = 'Learn data analysis with Python, Pandas, visualization libraries, and real-world projects that turn raw data into practical insights.'
WHERE topic = 'I want to learn data analysis with focus on Python, Pandas, visualization, and real-world projects'
  AND outline_overview ~ '[一-龥]';

UPDATE ai_path_projects
SET outline_overview = 'Learn AI agent development from scratch, including core agent concepts, LLM APIs, tool calling, and building a working app that can call tools.'
WHERE topic = 'I want to learn AI Agent development from scratch and build an app that can call tools'
  AND outline_overview ~ '[一-龥]';

UPDATE ai_path_projects
SET outline_overview = 'Learn OpenClaw from setup to practical usage, including core concepts, basic operations, and building simple automated workflows.'
WHERE topic = 'i want to learn openclaw'
  AND outline_overview ~ '[一-龥]';

UPDATE ai_path_projects
SET outline_overview = 'Learn Python list comprehensions from basic syntax to practical patterns, advanced usage, and clean code examples.'
WHERE topic = 'Learning Python List Comprehensions'
  AND outline_overview ~ '[一-龥]';

UPDATE ai_path_projects
SET outline_overview = 'Build a focused learning path for Python list comprehensions, covering syntax, common patterns, best practices, and practical exercises.'
WHERE topic = 'Python List Comprehensions Learning Path'
  AND outline_overview ~ '[一-龥]';

