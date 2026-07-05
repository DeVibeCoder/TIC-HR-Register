-- Allow the 'Executive' role on public.profiles.
-- Creating an Executive user failed because a CHECK constraint on
-- profiles.role predates the Executive role, so the auth trigger that
-- inserts the profile row was rejected (surfacing as a non-2xx from the
-- manage-user Edge Function).
--
-- This drops any existing CHECK constraint that references `role` and
-- recreates it including every current app role. Idempotent.

do $$
declare
  c record;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_class      rel on rel.oid = con.conrelid
    join pg_namespace  nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'profiles'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%role%'
  loop
    execute format('alter table public.profiles drop constraint %I', c.conname);
  end loop;

  alter table public.profiles
    add constraint profiles_role_check
    check (role in ('Admin', 'HR', 'Viewer', 'HOD', 'Executive'));
end $$;
