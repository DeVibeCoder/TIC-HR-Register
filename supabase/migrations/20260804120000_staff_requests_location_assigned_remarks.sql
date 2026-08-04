-- Add location, assigned_to and remarks columns to staff requests.
alter table public.staff_requests add column if not exists location text default '';
alter table public.staff_requests add column if not exists assigned_to text default '';
alter table public.staff_requests add column if not exists remarks text default '';
