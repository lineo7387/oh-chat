-- Debug: verify is_conversation_owner_or_admin behavior for a given conversation
-- Also returns raw values so we can inspect any mismatch

create or replace function public.debug_check_owner(p_conversation_id uuid)
returns jsonb
language plpgsql
stable
security definer
as $$
declare
  v_auth_uid uuid;
  v_conv_created_by uuid;
  v_is_owner boolean;
  v_has_part boolean;
begin
  v_auth_uid := auth.uid();

  select c.created_by into v_conv_created_by
  from public.conversations c
  where c.id = p_conversation_id;

  v_is_owner := exists (
    select 1 from public.conversations c
    where c.id = p_conversation_id and c.created_by = v_auth_uid
  );

  v_has_part := exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id
      and cp.user_id = v_auth_uid
      and cp.role in ('owner', 'admin')
  );

  return jsonb_build_object(
    'auth_uid', v_auth_uid,
    'conversation_id', p_conversation_id,
    'conv_created_by', v_conv_created_by,
    'is_owner_check', v_is_owner,
    'has_participant_check', v_has_part,
    'function_result', v_is_owner or v_has_part,
    'is_conversation_owner_or_admin', public.is_conversation_owner_or_admin(p_conversation_id)
  );
end;
$$;
