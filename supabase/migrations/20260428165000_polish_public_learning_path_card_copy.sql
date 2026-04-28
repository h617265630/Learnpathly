-- Polish remaining public learning path card copy that is already English
-- but still reads like placeholder/test content.

UPDATE learning_paths
SET
  title = 'UI Skills Resource Path',
  description = 'A collection of useful UI design and frontend development skills.'
WHERE id IN (26, 27)
  AND title = 'ui skills';

UPDATE learning_paths
SET
  title = 'Test Learning Path',
  description = 'A simple test learning path for checking the learning path flow.'
WHERE id = 37
  AND title = 'test path';

UPDATE learning_paths
SET
  title = 'Test Learning Path 4',
  description = 'A simple test learning path for validating card rendering and navigation.'
WHERE id = 41
  AND title = 'test 4';

