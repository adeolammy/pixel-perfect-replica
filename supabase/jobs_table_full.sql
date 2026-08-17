-- Glasgow Job Application Dashboard — full `jobs` table
-- Run this in your own Supabase project: SQL Editor -> New query -> paste -> Run.

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  source text,
  title text not null,
  company text,
  location text,
  url text unique,
  description text,
  salary text,
  closing_date date,
  collected_at timestamptz default now(),
  match_score int default 0,
  matched_requirements text[],
  missing_requirements text[],
  recommended boolean default false,
  tailored_cv_markdown text,
  cover_letter_text text,
  applied boolean default false,
  applied_at timestamptz,
  -- addendum columns
  apply_requested boolean not null default false,
  apply_requested_at timestamptz
);

-- Data API access (PostgREST needs explicit grants)
grant select, update on public.jobs to anon;
grant select, insert, update, delete on public.jobs to authenticated;
grant all on public.jobs to service_role;

alter table public.jobs enable row level security;

-- Single-user dashboard, no auth: open read + status updates.
drop policy if exists "Anyone can read jobs" on public.jobs;
create policy "Anyone can read jobs" on public.jobs for select using (true);

drop policy if exists "Anyone can update jobs" on public.jobs;
create policy "Anyone can update jobs" on public.jobs for update using (true) with check (true);

create index if not exists jobs_match_score_idx on public.jobs (match_score desc);
create index if not exists jobs_apply_requested_idx on public.jobs (apply_requested, applied);
