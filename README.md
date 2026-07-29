# Paperskeep

A modern, minimalist blog platform — clean typography, a trustworthy corporate-yet-contemporary aesthetic, dark mode with no flash, and an MDX content pipeline with reusable Amazon-affiliate product cards.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and **MDX**.

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Set up the database (one-time) — see "Admin panel & database" below
#    a. Run supabase/schema.sql in the Supabase SQL Editor
#    b. Add SUPABASE_SERVICE_ROLE_KEY to .env.local
#    c. npm run db:seed        # creates the admin user + imports posts

# 3. Run the dev server
npm run dev

# 4. Open the app
open http://localhost:3000          # public site
open http://localhost:3000/admin    # admin panel
```

Other scripts:

```bash
npm run build   # production build (statically renders all posts)
npm run start   # serve the production build
npm run lint    # eslint
```

> **Node 18.17+** is required (Next.js 14).

---

## What's inside

| Feature | Where |
| --- | --- |
| Home (featured hero, filter row, grid, sticky sidebar) | `app/page.tsx` |
| All articles + client-side category/tag filtering | `app/articles/page.tsx` |
| Article page (long-form MDX, pull-quotes, share, related) | `app/articles/[slug]/page.tsx` |
| About / Contact / Privacy | `app/about`, `app/contact`, `app/privacy` |
| Newsletter API (stub) | `app/api/subscribe/route.ts` |
| SEO: per-post `generateMetadata`, OG + Twitter cards, JSON-LD | `app/layout.tsx`, `app/articles/[slug]/page.tsx` |
| Sitemap / robots / RSS | `app/sitemap.ts`, `app/robots.ts`, `app/rss.xml/route.ts` |
| Dark mode (class strategy, persisted, no flash) | `components/ThemeProvider.tsx`, `components/ThemeToggle.tsx` |
| Amazon Associate product card | `components/mdx/ProductCard.tsx` |

---

## Project structure

```
paperskeep/
├── app/
│   ├── layout.tsx              # Root layout: fonts, ThemeProvider, Header/Footer, metadata
│   ├── page.tsx                # Home
│   ├── globals.css             # Design tokens (CSS vars) + prose styles
│   ├── not-found.tsx           # 404
│   ├── articles/
│   │   ├── page.tsx            # All articles + filtering
│   │   └── [slug]/page.tsx     # Single post (generateStaticParams + generateMetadata)
│   ├── about/page.tsx
│   ├── contact/page.tsx
│   ├── privacy/page.tsx
│   ├── api/subscribe/route.ts  # Newsletter/contact endpoint (stub)
│   ├── sitemap.ts
│   ├── robots.ts
│   └── rss.xml/route.ts
├── components/
│   ├── Header.tsx              # Sticky nav, search, theme toggle, hamburger (mobile)
│   ├── Footer.tsx
│   ├── ThemeProvider.tsx / ThemeToggle.tsx
│   ├── FeaturedHero.tsx        # 2-column featured card
│   ├── FilterableGrid.tsx      # Client-side category/tag filter + post grid
│   ├── PostCard.tsx            # Grid card with hover-lift
│   ├── Sidebar.tsx             # Author bio + tag cloud + newsletter widget
│   ├── NewsletterForm.tsx      # Posts to /api/subscribe (widget + banner variants)
│   ├── ContactForm.tsx
│   ├── ShareButtons.tsx
│   ├── SocialIcons.tsx / CategoryPill.tsx / Logo.tsx
│   └── mdx/
│       ├── MDXContent.tsx      # Renders MDX via next-mdx-remote (RSC)
│       ├── mdx-components.tsx  # Component map (ProductCard, img, a)
│       └── ProductCard.tsx     # Amazon Associate affiliate card
├── content/
│   └── posts/*.mdx             # 7 sample posts (one with ProductCards)
├── lib/
│   ├── posts.ts                # MDX read/parse, reading-time, related posts, tags
│   └── site.ts                 # Central site + author config
├── tailwind.config.ts
├── next.config.mjs
└── package.json
```

---

## Design tokens

Colors are CSS variables in `app/globals.css` (mapped into Tailwind in `tailwind.config.ts`), so theme switching animates smoothly.

| Token | Light | Dark |
| --- | --- | --- |
| `bg` | `#F9FAFB` | `#0F172A` |
| `surface` | `#FFFFFF` | `#1E293B` |
| `text` | `#333333` | `#E5EAF1` |
| `muted` | `#64748B` | `#93A2B7` |
| `navy` (brand) | `#1E293B` | `#0B1220` |
| `accent` (teal) | `#2C8C87` | `#38B2A6` |
| `border` | `#E7EAEE` | `#2B3A4D` |

- **Fonts** — Montserrat (headings/UI) + Lora (serif body), loaded via `next/font`.
- **Radius** — cards `14px`, hero/blocks `16–18px`, pills `999px`.
- **Shadows** — layered soft shadow via the `--shadow` token / `.shadow-token`.

---

## Writing a post

Create `content/posts/my-post.mdx` with frontmatter:

```mdx
---
title: "Your Title"
excerpt: "One or two sentences shown on cards and as the standout intro."
category: "Technology"        # Technology | Business | Lifestyle | Culture
date: "2026-07-20"            # ISO date
coverImage: "https://images.unsplash.com/…"
tags: ["Edge", "Performance"]
featured: false               # set true on exactly one post for the hero
author: "Elena Marsh"        # optional; defaults to the site author
---

Your MDX body. Use `##` for section headings and `>` for accent pull-quotes.
```

Reading time is computed automatically from the body (`reading-time`).

### Adding an affiliate product card

Drop `<ProductCard />` anywhere in a post body — as many as you like:

```mdx
<ProductCard
  title="Keychron Q1 Pro Mechanical Keyboard"
  image="https://…/product.jpg"
  rating={4.8}
  reviews={2417}
  price="$229"
  salePrice="$199"           // optional — strikes through `price`
  description="Why you'd recommend it."
  url="https://www.amazon.com/dp/XXXX?tag=your-associate-id"
/>
```

The card renders the "Editor's Pick" header, the required Amazon Associate
disclosure, a star rating, price (with optional strike-through), and an
Amazon-yellow CTA rendered as `<a rel="nofollow sponsored" target="_blank">`.

---

## Wiring up the newsletter

`app/api/subscribe/route.ts` validates the email and returns success. Replace
the marked block with your email provider (Buttondown, ConvertKit, Mailchimp,
Resend Audiences, etc.). The form components already handle loading / success /
error states.

---

## Configuration

Set the canonical site URL (used by SEO metadata, sitemap, and RSS) via an env var:

```bash
# .env.local
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

Site-wide details (name, author, nav, socials) live in `lib/site.ts`.

---

## Deploying to Vercel

1. **Push to GitHub** — create an empty repo, then:
   ```bash
   git remote add origin https://github.com/<you>/paperskeep.git
   git push -u origin main
   ```
2. **Import on Vercel** — New Project → pick the repo. Next.js is auto-detected
   (no config needed).
3. **Add environment variables** (Project → Settings → Environment Variables) —
   see [`.env.example`](.env.example). Runtime needs:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
   `STRIPE_SECRET_KEY`, and `NEXT_PUBLIC_SITE_URL=https://paperskeep.com`.
   `SUPABASE_SERVICE_ROLE_KEY` / `ADMIN_*` are **local-only** (the seed script)
   and are not required on Vercel.
4. **Custom domain** — Project → Settings → Domains → add `paperskeep.com`.
   In GoDaddy DNS set `A @ → 76.76.21.21` and `CNAME www → cname.vercel-dns.com`
   (Vercel shows the exact records and verifies automatically).

> The Vercel **Hobby** tier is free for personal, non-commercial use — fine while
> Stripe is in **test mode**. Switch to live Stripe keys + a paid tier before
> taking real payments.

---

## Admin panel & database

Posts are stored in **Supabase** (Postgres) and managed from a protected admin
panel at **`/admin`**. The public site reads published posts from the database;
the admin panel is where you create, edit, publish, and delete them.

> Why a database and not the `.mdx` files directly? A runtime admin panel needs
> to write content on every request, and most hosts (Vercel, etc.) have a
> read-only filesystem in production. The `content/posts/*.mdx` files are kept
> as the initial seed content and imported into the DB by `npm run db:seed`.

### One-time setup

1. **Create the tables.** Open the Supabase Dashboard → **SQL Editor** and run
   [`supabase/schema.sql`](supabase/schema.sql). This creates the `posts` and
   `subscribers` tables with Row Level Security:
   - Public (anon key) can **read published posts** only.
   - Signed-in admins can read drafts and **create / edit / delete**.

2. **Add the service-role key** to `.env.local` (server-only, never commit it):
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # Dashboard → Settings → API
   ```

3. **Seed the admin user + posts:**
   ```bash
   npm run db:seed
   ```
   This creates the admin login and imports the 7 sample posts.

### Admin login

After seeding, sign in at **`/admin/login`** with the credentials you set via
`ADMIN_EMAIL` / `ADMIN_PASSWORD` before running the seed. To add more admins
later, create them in the Supabase Dashboard
(**Authentication → Users → Add user**, with "Auto Confirm").

### What the admin panel does

- **Dashboard** (`/admin`) — table of all posts (published + drafts) with
  inline **publish/unpublish**, **edit**, **view**, and **delete**.
- **New / Edit** — full editor for every field: title, auto-slug, category,
  excerpt, cover image, author, date, tags, the Markdown/MDX body, plus
  **Featured** and **Published** toggles.
- Writing `<ProductCard … />` in the body renders the affiliate card, exactly
  like the file-based posts.
- Saving revalidates the affected public pages (`/`, `/articles`, the post,
  sitemap, and RSS) so changes appear right away.

### How auth works

- `utils/supabase/{server,client,middleware}.ts` — the standard `@supabase/ssr`
  clients (server, browser, middleware).
- `middleware.ts` refreshes the session on every request **and** guards
  `/admin/*` — unauthenticated visitors are redirected to `/admin/login`.
- Admin writes go through **Server Actions** in `app/admin/actions.ts` using the
  authenticated server client, so RLS enforces that only signed-in users mutate.

---

## EV Map (`/ev-map`)

A full-viewport Leaflet map of Sri Lanka's EV charging stations, backed by the
`public.ev_stations` table. Tiles come from OpenStreetMap — **no API key, paid
or otherwise**. Clicking a marker slides in a detail pane, flies the map to the
station, and lists the five nearest other stations along the bottom.

| File | Role |
| --- | --- |
| `supabase/ev_stations.sql` | Standalone, idempotent migration (also in `schema.sql`) |
| `scripts/seed-ev-stations.mjs` | CSV → Supabase importer, upserts on `station_id` |
| `app/ev-map/page.tsx` | Server route; fetches active stations, sets page height |
| `components/ev/EvMapClient.tsx` | `dynamic(..., { ssr: false })` boundary — Leaflet is client-only |
| `components/ev/EvMap.tsx` | Map, clustered markers, selection state, fly-to |
| `components/ev/StationDetail.tsx` | Sliding pane (left rail on desktop, bottom sheet on mobile) |
| `components/ev/NearestStrip.tsx` | Scrollable nearest-station cards |
| `lib/ev.ts` | Types + `haversineKm` / `nearestStations` (pure, testable) |

### One-time setup

1. Run `supabase/ev_stations.sql` in the Supabase SQL Editor (or re-run the whole
   `supabase/schema.sql` — every statement is `if not exists` / `drop … if exists`,
   including the `alter table … add column if not exists geo_precision` needed by
   databases created before that column was introduced).
2. Import the data: `npm run db:seed:ev`

If `geo_precision` is missing the seed still imports everything else and prints
the exact `alter table` to run — re-run the seed afterwards to record it.

### Re-importing when a new phase adds rows

The importer **upserts on `station_id`**, so it is safe to run as often as you
like: existing stations are refreshed in place and new `SL-####` rows are
appended. Nothing is ever deleted.

```bash
# 1. Drop the new rows into the CSV (same headers), then:
npm run db:seed:ev

# Check the parse without touching the database:
node scripts/seed-ev-stations.mjs --dry-run

# Import a different file (e.g. a phase-2 export):
node --env-file=.env.local scripts/seed-ev-stations.mjs data/phase-2.csv
```

Rows with a blank `latitude`/`longitude` **do** import — they just can't be
drawn yet. The script prints them at the end so they can be queued for
geocoding. (178 rows load; 169 have coordinates, 9 do not.) Coverage spans all
21 districts that appear in the data, across all 9 provinces.

### Data sources & coordinate precision

| Source | Rows | Licence |
| --- | --- | --- |
| `johnkeellscgauto.com/charger-network` (JKCG BYD Network) | 128 | operator-published |
| OpenStreetMap `amenity=charging_station`, island-wide | 49 | ODbL |
| chargeNET (from the original CSV) | 1 | operator-published |

11 operator networks are represented. Operator spellings are normalised
(`Green Frontiers Network` / `Green Frontier` -> `Green Frontiers`,
`Electricity board` -> `Ceylon Electricity Board`), and OSM's misspelled
`ChergeNET` is corrected to `chargeNET`.

Coordinates are not uniformly trustworthy, so every row carries a
**`geo_precision`** flag:

- **`exact`** — from the operator, or a mapped OSM POI. Safe to navigate to.
- **`approximate`** — geocoded (Nominatim) to the street or area only, so the
  pin can be a few hundred metres off. These render as **hollow pins** and the
  detail pane shows an "Approximate location" warning.

Never backfill `approximate` rows by silently promoting them to `exact` — a
charging map that sends someone to the wrong forecourt is worse than one that
admits it doesn't know. Upgrade a row only when the operator publishes real
coordinates or the site is mapped in OSM.

Two-wheeler-only points (Ather Grid, 3 kW Type 7) are deliberately excluded, as
listing them beside CCS2 car chargers would mislead.

Geocoding rejects anchors that land on a district boundary centroid, a mountain
peak, or an unrelated house — all of which are "in the right district" and
useless as a charger pin. A coarse anchor is still used to decide *which*
branch of a chain a row means, just never as the pin itself. Rows that survive
none of that keep blank coordinates rather than getting a plausible guess.

**Known limitation:** chargeNET, the largest network in Sri Lanka (600+
chargers by their own claim), publishes no machine-readable station list — the
locator is app-gated and OpenChargeMap now requires a paid API key. Until one
of those opens up, that network is represented only by the handful of sites
volunteers have mapped in OSM, and the dataset should not be read as complete.

### SEO

The map is `ssr: false`, so a crawler would otherwise see an empty `<div>`.
`components/ev/StationDirectory.tsx` server-renders every station below the map,
grouped by district with real headings and directions links — genuine indexable
content, not hidden keyword text. On top of that the route ships an `ItemList`
of `schema.org/EVChargingStation` (each with its own `GeoCoordinates`) plus a
`BreadcrumbList`, an `sr-only` `<h1>`, a canonical URL, OG/Twitter tags, a
generated share image (`app/ev-map/opengraph-image.tsx`, station count baked
in), a `sitemap.xml` entry and an `llms.txt` line.

Note the page weighs ~500 kB because the full dataset appears three times: the
map props, the directory markup and the JSON-LD. If it grows much past this,
trim the JSON-LD to the top N stations before trimming the directory — the
directory is what users and crawlers actually read.

### Statistics

`/admin/stats` has an **EV map dataset** section (`lib/ev-stats.ts`) showing
total vs mappable stations, how many pins are approximate, how many still lack
coordinates, and the breakdown by district and operator. It reads through the
public client, so it reflects exactly what the map sees. When `geo_precision`
is missing from the table the panel says so rather than reporting every pin as
exact.

### Scaling past a few thousand stations

The page deliberately fetches every active station once and does the
nearest-neighbour search in the browser — cheaper than per-pan round trips at
this size. Two `TODO(scale)` comments mark where that flips:

- `app/ev-map/page.tsx` — swap the fetch-all for a bounds-filtered query, driven
  by the map's `moveend` (the hook site is `FlyToSelected` in `EvMap.tsx`), using
  the `ev_stations_geo_idx` index on `(latitude, longitude)`.
- `lib/ev.ts` — move `nearestStations` to a Supabase RPC over PostGIS/`earthdistance`
  (`ST_DWithin`, or `<->` KNN ordering) instead of the client-side haversine scan.

---

## Notes

- All images use `next/image`. Remote hosts are allow-listed in `next.config.mjs`
  (Unsplash + Amazon by default) — add your own hosts there.
- Replace the sample Unsplash cover images and the `og-default.png` with your own assets.
- Every post is statically generated at build time via `generateStaticParams`.
