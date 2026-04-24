-- RPC to create a group conversation with multiple members
-- Uses auth.uid() inside security definer function (works reliably in RPC context)

create or replace function public.create_group_conversation(
  p_title text,
  p_member_ids uuid[]
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_my_id uuid;
  v_conv_id uuid;
  v_member_id uuid;
  v_unique_ids uuid[];
begin
  v_my_id := auth.uid();
  if v_my_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Deduplicate and remove nulls
  select array_agg(distinct x) into v_unique_ids
  from unnest(p_member_ids) as x
  where x is not null;

  -- Ensure current user is included
  if not (v_my_id = any(v_unique_ids)) then
    v_unique_ids := array_append(v_unique_ids, v_my_id);
  end if;

  -- Need at least 2 members (self + one other) for a group
  if array_length(v_unique_ids, 1) < 2 then
    raise exception 'Group must have at least one other member';
  end if;

  -- Create group conversation
  insert into public.conversations (type, title, created_by)
  values ('group', p_title, v_my_id)
  returning id into v_conv_id;

  -- Add all participants: creator as owner, others as member
  insert into public.conversation_participants (conversation_id, user_id, role)
  select v_conv_id, x, case when x = v_my_id then 'owner'::participant_role else 'member'::participant_role end
  from unnest(v_unique_ids) as x;

  return v_conv_id;
end;
$$;

grant execute on function public.create_group_conversation(text, uuid[]) to authenticated;
