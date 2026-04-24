-- Cleanup: remove debug functions and unused RPCs left over from troubleshooting

-- Debug functions (00008, 00009, 00010)
drop function if exists public.debug_auth_uid();
drop function if exists public.debug_check_owner(uuid);
drop function if exists public.debug_conversation_policies();

-- Old RPC superseded by 00019/00020 (two-parameter version)
drop function if exists public.create_direct_conversation(uuid, uuid);

-- Unused RPC: frontend does direct INSERT into friends, never calls this
drop function if exists public.send_friend_request(uuid, uuid);
