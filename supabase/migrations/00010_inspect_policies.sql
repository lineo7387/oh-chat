-- Temporary migration to inspect actual RLS policies on conversations table
-- We'll create a function that returns policy info for debugging

create or replace function public.debug_conversation_policies()
returns table (
  policyname text,
  permissive text,
  roles text[],
  cmd text,
  qual text,
  with_check text
)
language sql
stable
security definer
as $$
  select
    pol.polname::text as policyname,
    pol.polpermissive::text as permissive,
    array(select r.rolname::text from pg_roles r where r.oid = any(pol.polroles)) as roles,
    case pol.polcmd
      when 'r' then 'SELECT'
      when 'a' then 'INSERT'
      when 'w' then 'UPDATE'
      when 'd' then 'DELETE'
      when '*' then 'ALL'
    end::text as cmd,
    pg_get_expr(pol.polqual, pol.polrelid)::text as qual,
    pg_get_expr(pol.polwithcheck, pol.polrelid)::text as with_check
  from pg_policy pol
  join pg_class cls on cls.oid = pol.polrelid
  join pg_namespace ns on ns.oid = cls.relnamespace
  where ns.nspname = 'public' and cls.relname = 'conversations';
$$;
