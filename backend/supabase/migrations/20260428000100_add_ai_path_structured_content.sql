ALTER TABLE public.ai_path_subnode_details
ADD COLUMN IF NOT EXISTS structured_content json;
