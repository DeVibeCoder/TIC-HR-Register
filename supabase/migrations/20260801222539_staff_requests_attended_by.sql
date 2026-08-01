-- Add "attended by" (who handled the request) to staff requests.
alter table public.staff_requests add column if not exists attended_by text default '';
