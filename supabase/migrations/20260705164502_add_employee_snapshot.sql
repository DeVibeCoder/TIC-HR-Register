-- Store a full employee snapshot on completed terminations so an accidental
-- termination can be reverted (employee restored) without data loss.
alter table public.completed_terminations
  add column if not exists employee_snapshot jsonb;
