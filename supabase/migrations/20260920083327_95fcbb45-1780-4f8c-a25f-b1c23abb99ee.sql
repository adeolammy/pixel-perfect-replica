GRANT INSERT, DELETE ON public.jobs TO anon;
DROP POLICY IF EXISTS "Anyone can insert jobs" ON public.jobs;
CREATE POLICY "Anyone can insert jobs" ON public.jobs FOR INSERT WITH CHECK (true);
CREATE UNIQUE INDEX IF NOT EXISTS jobs_url_key ON public.jobs (url);