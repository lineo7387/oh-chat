-- Debug function: return auth.uid() as seen by the database
create or replace function public.debug_auth_uid()
returns uuid
language sql
stable
as $$
  select auth.uid();
$$;
