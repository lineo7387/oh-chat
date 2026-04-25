-- Add email column to profiles table for display purposes
alter table public.profiles
  add column email text;

-- Backfill existing profiles with email from auth.users
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id;

-- Update trigger to sync email on new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;
