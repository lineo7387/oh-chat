-- Drop and recreate check_conversation_creator to ensure language change takes effect
-- CREATE OR REPLACE does not allow changing function language

-- 1. Drop the policy first (it depends on the function)
drop policy if exists "Authenticated users can create conversations" on public.conversations;

-- 2. Now drop the function
drop function if exists public.check_conversation_creator(uuid);

-- 3. Recreate with plpgsql
create function public.check_conversation_creator(p_created_by uuid)
returns boolean
language plpgsql
stable
security definer
as $$
begin
  return p_created_by = public.get_auth_uid();
end;
$$;

-- 4. Recreate the policy
create policy "Authenticated users can create conversations"
  on public.conversations for insert to authenticated
  with check (public.check_conversation_creator(created_by));
