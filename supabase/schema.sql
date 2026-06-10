-- 合唱團照片投票系統資料表
-- 使用方式：Supabase Dashboard → SQL Editor → New query → 貼上全部內容 → Run
-- （重複執行是安全的，不會清掉既有資料）

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  member_id text not null,
  slot int not null check (slot between 1 and 3),
  storage_path text not null,
  created_at timestamptz not null default now(),
  unique (member_id, slot)
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  voter_member_id text not null,
  photo_id uuid not null references public.photos (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (voter_member_id, photo_id)
);

create table if not exists public.settings (
  id int primary key,
  uploads_open boolean not null default true,
  voting_open boolean not null default true
);

insert into public.settings (id, uploads_open, voting_open)
values (1, true, true)
on conflict (id) do nothing;

-- 鎖住所有直接存取：開 RLS 且不建立任何 policy。
-- 網站一律透過伺服器端的 service role key 操作（不受 RLS 限制）。
alter table public.photos enable row level security;
alter table public.votes enable row level security;
alter table public.settings enable row level security;
