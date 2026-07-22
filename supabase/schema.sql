-- ============================================================
-- Paperskeep — Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- or via the Supabase CLI: `supabase db push`.
-- ============================================================

create table if not exists public.subscribers (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  name        text,
  message     text,
  created_at  timestamptz not null default now()
);

-- Row Level Security ------------------------------------------------
-- Enable RLS, then allow anonymous inserts (public newsletter sign-up)
-- while keeping the subscriber list private (no public SELECT).
alter table public.subscribers enable row level security;

-- Allow anyone (anon/public key) to subscribe.
drop policy if exists "Anyone can subscribe" on public.subscribers;
create policy "Anyone can subscribe"
  on public.subscribers
  for insert
  to anon, authenticated
  with check (true);

-- Signed-in admins can read + delete the subscriber list (the anon/public
-- key still cannot read it — no anon SELECT policy exists).
drop policy if exists "Admins can read subscribers" on public.subscribers;
create policy "Admins can read subscribers"
  on public.subscribers
  for select
  to authenticated
  using (true);

drop policy if exists "Admins can delete subscribers" on public.subscribers;
create policy "Admins can delete subscribers"
  on public.subscribers
  for delete
  to authenticated
  using (true);


-- ============================================================
-- Contact messages — submissions from the /contact form.
-- Separate from subscribers (no unique email), so a person can send
-- multiple messages and subscribers who write in aren't dropped.
-- ============================================================
create table if not exists public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  email       text not null,
  message     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists contact_messages_created_idx
  on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;

-- Anyone can send a message; only signed-in admins can read/delete them.
drop policy if exists "Anyone can send a message" on public.contact_messages;
create policy "Anyone can send a message"
  on public.contact_messages
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Admins can read messages" on public.contact_messages;
create policy "Admins can read messages"
  on public.contact_messages
  for select
  to authenticated
  using (true);

drop policy if exists "Admins can delete messages" on public.contact_messages;
create policy "Admins can delete messages"
  on public.contact_messages
  for delete
  to authenticated
  using (true);


-- ============================================================
-- Posts — the blog content, managed from the /admin panel.
-- ============================================================
create table if not exists public.posts (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  excerpt      text not null default '',
  category     text not null default 'Technology',
  content      text not null default '',      -- raw Markdown/MDX body
  cover_image  text not null default '',
  tags         text[] not null default '{}',
  author       text,
  featured     boolean not null default false,
  published    boolean not null default true,
  date         date not null default current_date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists posts_published_date_idx
  on public.posts (published, date desc);

-- Keep updated_at fresh on every update.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- Row Level Security ------------------------------------------------
alter table public.posts enable row level security;

-- Anyone (anon key) can read PUBLISHED posts only.
drop policy if exists "Public can read published posts" on public.posts;
create policy "Public can read published posts"
  on public.posts
  for select
  to anon
  using (published = true);

-- Signed-in admins can read everything (including drafts).
drop policy if exists "Admins can read all posts" on public.posts;
create policy "Admins can read all posts"
  on public.posts
  for select
  to authenticated
  using (true);

-- Only signed-in admins can create/update/delete.
drop policy if exists "Admins can insert posts" on public.posts;
create policy "Admins can insert posts"
  on public.posts
  for insert
  to authenticated
  with check (true);

drop policy if exists "Admins can update posts" on public.posts;
create policy "Admins can update posts"
  on public.posts
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Admins can delete posts" on public.posts;
create policy "Admins can delete posts"
  on public.posts
  for delete
  to authenticated
  using (true);


-- ============================================================
-- Analytics — ONE counter row per page (not one row per view).
-- Each visit increments the counter. A post's row is auto-removed
-- when the post is deleted (post_id FK, ON DELETE CASCADE).
-- ============================================================

-- Drop the old per-view event log + its aggregate functions if present.
drop function if exists public.stats_overview();
drop function if exists public.views_daily(int);
drop function if exists public.top_posts(int);
drop table if exists public.page_views;

create table if not exists public.page_stats (
  path        text primary key,                                   -- e.g. /articles/my-post
  post_id     uuid references public.posts(id) on delete cascade, -- null for non-post pages
  views       bigint not null default 0,
  updated_at  timestamptz not null default now()
);

create index if not exists page_stats_post_idx on public.page_stats (post_id);
create index if not exists page_stats_views_idx on public.page_stats (views desc);

alter table public.page_stats enable row level security;

-- Only signed-in admins can read the counts.
drop policy if exists "Admins can read page stats" on public.page_stats;
create policy "Admins can read page stats"
  on public.page_stats
  for select
  to authenticated
  using (true);

-- Public views are recorded ONLY through this function (no direct table
-- write is granted to anon), so a visitor can increment a counter by one but
-- can never set an arbitrary value. SECURITY DEFINER bypasses RLS to write.
create or replace function public.increment_page_view(
  p_path text,
  p_slug text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post_id uuid;
begin
  if p_path is null or length(p_path) = 0 then
    return;
  end if;

  -- Link post pages to their post so the row cascades on delete.
  if p_slug is not null then
    select id into v_post_id from public.posts where slug = p_slug;
  end if;

  insert into public.page_stats (path, post_id, views, updated_at)
  values (left(p_path, 300), v_post_id, 1, now())
  on conflict (path) do update
    set views = public.page_stats.views + 1,
        post_id = coalesce(excluded.post_id, public.page_stats.post_id),
        updated_at = now();
end;
$$;

grant execute on function public.increment_page_view(text, text) to anon, authenticated;
