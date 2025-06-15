
-- Check if RLS is enabled on games table and what policies exist
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'games';

-- Disable RLS on games table temporarily to allow game creation
-- or create proper policies
ALTER TABLE public.games DISABLE ROW LEVEL SECURITY;

-- Alternatively, if you want to keep RLS but allow insertions, 
-- you can create a policy that allows anyone to insert games
-- (uncomment the lines below if you prefer this approach):

-- ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Allow game creation" ON public.games
--   FOR INSERT 
--   WITH CHECK (true);
-- 
-- CREATE POLICY "Allow reading games" ON public.games
--   FOR SELECT 
--   USING (true);
-- 
-- CREATE POLICY "Allow updating games" ON public.games
--   FOR UPDATE 
--   USING (true);
