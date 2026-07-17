-- Monthly headcount snapshots.
-- The app keeps the CURRENT month's row continuously updated from live
-- employee data. When a new month begins, the previous month's last-saved
-- row is frozen and becomes the accurate historical record — avoiding
-- unreliable reconstruction from imported join/departure dates.
create table if not exists public.headcount_snapshots (
  month       text primary key,               -- 'YYYY-MM'
  total       integer not null default 0,
  on_site     integer not null default 0,
  off_site    integer not null default 0,
  on_leave    integer not null default 0,
  sections    jsonb   not null default '[]'::jsonb,  -- [{dept,count}]
  captured_at timestamptz not null default now()
);

alter table public.headcount_snapshots enable row level security;

drop policy if exists hcs_read on public.headcount_snapshots;
create policy hcs_read on public.headcount_snapshots
  for select using (auth.role() = 'authenticated');

drop policy if exists hcs_write on public.headcount_snapshots;
create policy hcs_write on public.headcount_snapshots
  for all using (auth_role() = any (array['Admin','HR']))
  with check (auth_role() = any (array['Admin','HR']));
