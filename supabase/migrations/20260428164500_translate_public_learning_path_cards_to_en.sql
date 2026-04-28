-- Translate public learning path card content to English.
-- These records feed the normal learning path cards on /learningpool and /home.

UPDATE learning_paths
SET
  title = 'GitHub Trending Learning Path',
  description = 'A simple learning path for exploring trending GitHub projects and turning them into study notes and practical experiments.'
WHERE id = 25
   OR title = 'github 潮流学习嘻嘻嘻休息';

UPDATE learning_paths
SET
  title = 'OpenClaw Resources',
  description = 'A resource path for learning how to use OpenClaw, including setup notes, usage patterns, and practical workflow references.'
WHERE id IN (28, 36)
   OR title = 'openclaw相关';

UPDATE learning_paths
SET
  title = 'Claude Code Resources',
  description = 'A resource path for learning Claude Code workflows, command-line usage, and AI-assisted development practices.'
WHERE id = 29
   OR title = 'claude code 使用';

UPDATE learning_paths
SET
  title = 'Useful UI Skill Collection',
  description = 'A curated collection of UI design and frontend development skills for making interfaces cleaner, more polished, and easier to use.'
WHERE id IN (34, 51)
   OR title = '好用的 UI Skill 整理';

UPDATE learning_paths
SET
  title = 'Useful UI Skill Collection (Fork)',
  description = 'A forked collection of UI design and frontend development skills for improving interface quality and visual polish.'
WHERE id = 42
   OR title = '好用的 UI Skill 整理 (Fork)';

UPDATE learning_paths
SET
  title = 'Test Learning Path',
  description = 'A simple test learning path.'
WHERE id = 40
   OR title = '测试';

UPDATE learning_paths
SET description = 'A collection of useful UI skills.'
WHERE id = 55
  AND description = 'A collection of usefull ui skills.';

