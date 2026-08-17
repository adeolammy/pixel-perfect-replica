CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text,
  title text NOT NULL,
  company text,
  location text,
  url text UNIQUE,
  description text,
  salary text,
  closing_date date,
  collected_at timestamptz DEFAULT now(),
  match_score int DEFAULT 0,
  matched_requirements text[],
  missing_requirements text[],
  recommended boolean DEFAULT false,
  tailored_cv_markdown text,
  cover_letter_text text,
  applied boolean DEFAULT false,
  applied_at timestamptz
);

GRANT SELECT, UPDATE ON public.jobs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read jobs" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Anyone can update jobs" ON public.jobs FOR UPDATE USING (true) WITH CHECK (true);

CREATE INDEX jobs_match_score_idx ON public.jobs (match_score DESC);