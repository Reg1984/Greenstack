-- 007_native_memory.sql created verdant_memory_files with no RLS/policy at all,
-- but RLS is on in production with no permissive policy, so every write from the
-- app's anon-key client is silently blocked. Confirmed live 2026-09-22: the
-- memory tool's file-create call failed with "new row violates row-level
-- security policy for table verdant_memory_files".

ALTER TABLE public.verdant_memory_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access" ON public.verdant_memory_files;
CREATE POLICY "Public access" ON public.verdant_memory_files FOR ALL USING (true);
