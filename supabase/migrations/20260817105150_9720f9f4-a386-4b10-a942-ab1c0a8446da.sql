alter table public.jobs add column if not exists apply_requested boolean not null default false;
alter table public.jobs add column if not exists apply_requested_at timestamptz;