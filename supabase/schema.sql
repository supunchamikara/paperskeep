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

-- NOTE: no SELECT policy is defined, so the subscriber list is NOT
-- readable with the publishable/anon key. Read it from the Dashboard
-- or with the service-role key in a trusted server context.


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
-- Analytics — one row per page view. Powers the /admin/stats page.
-- ============================================================
create table if not exists public.page_views (
  id          uuid primary key default gen_random_uuid(),
  path        text not null,
  slug        text,               -- set for article views (/articles/[slug])
  visitor_id  text,               -- client-generated id (approx unique visitors)
  referrer    text,
  created_at  timestamptz not null default now()
);

create index if not exists page_views_created_idx on public.page_views (created_at);
create index if not exists page_views_slug_idx on public.page_views (slug);
create index if not exists page_views_visitor_idx on public.page_views (visitor_id);

alter table public.page_views enable row level security;

-- Anyone can record a view (public site is un-authenticated)…
drop policy if exists "Anyone can record a view" on public.page_views;
create policy "Anyone can record a view"
  on public.page_views
  for insert
  to anon, authenticated
  with check (true);

-- …but only signed-in admins can read the raw rows / run the stats.
drop policy if exists "Admins can read views" on public.page_views;
create policy "Admins can read views"
  on public.page_views
  for select
  to authenticated
  using (true);

-- ---- Aggregate functions (SECURITY INVOKER: RLS still applies) ----

-- Headline totals for the stat tiles.
create or replace function public.stats_overview()
returns table (
  total_views     bigint,
  unique_visitors bigint,
  post_views      bigint,
  views_today     bigint,
  views_7d        bigint,
  views_30d       bigint
) language sql stable as $$
  select
    count(*)::bigint,
    count(distinct visitor_id)::bigint,
    count(*) filter (where slug is not null)::bigint,
    count(*) filter (where created_at >= date_trunc('day', now()))::bigint,
    count(*) filter (where created_at >= now() - interval '7 days')::bigint,
    count(*) filter (where created_at >= now() - interval '30 days')::bigint
  from public.page_views;
$$;

-- Daily view counts for the last p_days (gap-filled so empty days show 0).
create or replace function public.views_daily(p_days int default 14)
returns table (day date, views bigint)
language sql stable as $$
  select d::date as day, count(pv.id)::bigint as views
  from generate_series(
    (current_date - (p_days - 1))::timestamptz,
    current_date::timestamptz,
    interval '1 day'
  ) as d
  left join public.page_views pv
    on pv.created_at >= d and pv.created_at < d + interval '1 day'
  group by d
  order by d;
$$;

-- Most-viewed posts, joined to their titles.
create or replace function public.top_posts(p_limit int default 8)
returns table (slug text, title text, views bigint)
language sql stable as $$
  select pv.slug, p.title, count(*)::bigint as views
  from public.page_views pv
  left join public.posts p on p.slug = pv.slug
  where pv.slug is not null
  group by pv.slug, p.title
  order by views desc
  limit p_limit;
$$;
