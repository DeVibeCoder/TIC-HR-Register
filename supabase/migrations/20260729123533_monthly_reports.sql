-- Published monthly HR reports. Admin generates & publishes; everyone else
-- can view a published (finalized) report for a given month.
create table if not exists public.monthly_reports (
  month        text primary key,          -- 'YYYY-MM'
  html         text not null,
  status       text not null default 'final',
  generated_by text,
  generated_at timestamptz not null default now()
);

alter table public.monthly_reports enable row level security;

drop policy if exists mr_read on public.monthly_reports;
create policy mr_read on public.monthly_reports
  for select using (auth.role() = 'authenticated');

drop policy if exists mr_write on public.monthly_reports;
create policy mr_write on public.monthly_reports
  for all using (auth_role() = 'Admin') with check (auth_role() = 'Admin');
