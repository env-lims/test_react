-- Run this script in the Supabase SQL Editor.
-- It keeps the table private and exposes only narrowly scoped auth functions.

create extension if not exists pgcrypto;

alter table public."user" enable row level security;

drop policy if exists "allow public signup" on public."user";
drop policy if exists "allow public login lookup" on public."user";
revoke all on table public."user" from anon, authenticated;

create or replace function public.login_user(
  login_email text,
  login_password text
)
returns table (
  id text,
  "이메일" text,
  "이름" text,
  "권한" text,
  "상태" text
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    u.id::text,
    u."이메일",
    u."이름",
    u."권한",
    u."상태"
  from public."user" as u
  where u."이메일" = login_email
    and u."암호" = crypt(login_password, u."암호")
    and lower(u."상태") in ('활성', '사용', 'active', 'enabled');
$$;

revoke all on function public.login_user(text, text) from public;
grant execute on function public.login_user(text, text) to anon, authenticated;

drop function if exists public.register_user(text, text, text, text, text, text);

create or replace function public.register_user(
  new_email text,
  new_password text,
  new_name text,
  new_org1 text,
  new_org2 text,
  new_phone text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public."user" (
    "이메일", "암호", "이름", "소속1", "소속2", "전화번호", "권한", "상태"
  ) values (
    new_email,
    crypt(new_password, gen_salt('bf')),
    new_name,
    new_org1,
    new_org2,
    new_phone,
    'user',
    '활성'
  );
end;
$$;

revoke all on function public.register_user(text, text, text, text, text, text) from public;
grant execute on function public.register_user(text, text, text, text, text, text) to anon, authenticated;