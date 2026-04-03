-- Add local_nascimento column to store birth city/state separately
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS local_nascimento text;