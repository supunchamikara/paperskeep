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

After seeding, sign in at **`/admin/login`**:

| | |
| --- | --- |
| **Email** | `admin@paperskeep.blog` |
| **Password** | `Paperskeep!Admin2026` |

Override the defaults by setting `ADMIN_EMAIL` / `ADMIN_PASSWORD` before seeding.
To add more admins later, create them in the Supabase Dashboard
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

## Notes

- All images use `next/image`. Remote hosts are allow-listed in `next.config.mjs`
  (Unsplash + Amazon by default) — add your own hosts there.
- Replace the sample Unsplash cover images and the `og-default.png` with your own assets.
- Every post is statically generated at build time via `generateStaticParams`.
