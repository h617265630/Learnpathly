ALTER TABLE public.ai_path_projects
ADD COLUMN IF NOT EXISTS cover_image_url varchar(2048);
