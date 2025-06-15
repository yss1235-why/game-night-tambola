
-- Disable RLS temporarily for hosts table to allow game creation
ALTER TABLE public.hosts DISABLE ROW LEVEL SECURITY;

-- Alternatively, if you want to keep RLS but allow insertions, 
-- you can create policies that allow anyone to insert hosts and games
-- (uncomment the lines below if you prefer this approach):

-- ALTER TABLE public.hosts ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Allow host creation" ON public.hosts
--   FOR INSERT 
--   WITH CHECK (true);
-- 
-- CREATE POLICY "Allow reading hosts" ON public.hosts
--   FOR SELECT 
--   USING (true);
-- 
-- CREATE POLICY "Allow updating hosts" ON public.hosts
--   FOR UPDATE 
--   USING (true);

-- Enable basic policies for games table as well
CREATE POLICY "Allow game creation" ON public.games
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow reading games" ON public.games
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow updating games" ON public.games
  FOR UPDATE 
  USING (true);
