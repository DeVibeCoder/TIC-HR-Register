-- Enable Supabase Realtime for the activities tables so every authenticated
-- session receives live INSERT/UPDATE/DELETE events (cross-session sync).
-- Idempotent: only adds a table to the publication if not already a member.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'staff_requests'
  ) then
    alter publication supabase_realtime add table public.staff_requests;
  end if;
end $$;
