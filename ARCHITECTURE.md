# CloudHacks Blog Architecture

## Overview

CloudHacks is a static blog built with **Astro** and deployed on **Cloudflare Pages**. It features a teal-accented minimal design, full-text search, dark mode support, and a Git-based CMS.

**Live Site:** https://seanfraser.io

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Astro 4.x (Hybrid SSR/SSG) |
| Styling | Tailwind CSS 3.x |
| UI Components | Astro + React |
| Deployment | Cloudflare Pages |
| CMS | Decap CMS (Git-based) |
| Search | Pagefind |
| Comments | Giscus (GitHub Discussions) |
| Analytics | Cloudflare Web Analytics |

---

## Directory Structure

```
cloudhacks/
├── content/
│   └── blog/                 # Markdown blog posts
│       └── *.md              # Posts with YAML frontmatter
├── public/
│   ├── admin/                # Decap CMS admin interface
│   │   ├── index.html
│   │   └── config.yml
│   ├── images/               # Static images
│   ├── _headers              # Cloudflare security headers
│   ├── _redirects            # URL redirects
│   └── favicon.svg
├── src/
│   ├── components/           # Astro & React components
│   ├── layouts/              # Page layouts
│   ├── lib/                  # Utilities & content helpers
│   ├── pages/                # Routes & API endpoints
│   │   ├── api/              # Server-side API routes
│   │   ├── blog/             # Blog pages
│   │   └── tools/            # Interactive tools
│   └── styles/               # Global CSS
├── astro.config.mjs          # Astro configuration
├── tailwind.config.mjs       # Tailwind configuration
└── package.json
```

---

## Key Components

### Layouts

| File | Purpose |
|------|---------|
| `src/layouts/BaseLayout.astro` | Main HTML wrapper with meta tags, fonts, header/footer |

### Components

| Component | Purpose |
|-----------|---------|
| `Header.astro` | Navigation bar with search, dark mode toggle, mobile menu |
| `Footer.astro` | Site footer with links |
| `BlogCard.astro` | Blog post preview card (supports `compact` prop) |
| `FeaturedSidebar.astro` | Sticky sidebar showing featured posts |
| `Search.astro` | Pagefind search modal (⌘K trigger) |
| `TableOfContents.astro` | Auto-generated TOC from headings |
| `Comments.astro` | Giscus GitHub discussions integration |
| `CodeCopyButton.astro` | Copy button for code blocks |

### React Components

| Component | Purpose |
|-----------|---------|
| `PricingCalculator.tsx` | Cloud pricing calculator |
| `AIPricingCalculator.tsx` | AI/ML pricing calculator |

---

## Content Management

### Blog Posts

Posts are stored as Markdown files in `content/blog/` with YAML frontmatter:

```yaml
---
title: Post Title
slug: post-slug
description: Short description for SEO
date: 2024-01-15
updated: 2024-01-20          # Optional
category: Cloud Security     # Cloud Security | Cloud Computing | DevOps | Tutorials
tags: [tag1, tag2]           # Optional
image: /images/blog/image.jpg # Optional featured image
imageAlt: Alt text           # Optional
featured: false              # Show in featured sidebar
draft: false                 # Hide from listings
---

Markdown content here...
```

### Content Library (`src/lib/content.ts`)

| Function | Purpose |
|----------|---------|
| `getAllPosts()` | Get all posts (including drafts) |
| `getPublishedPosts()` | Get published posts, sorted by date |
| `getPost(slug)` | Get single post with content |
| `formatDate(date)` | Format date for display |
| `getReadingTime(text)` | Calculate reading time |

### Decap CMS

Admin interface at `/admin/` for content editing via GitHub OAuth.

**Configuration:** `public/admin/config.yml`
- Backend: GitHub
- Repository: `seanfraserio/seanfraserio`
- Branch: `main`
- Auth: Custom OAuth endpoints (`/api/auth`, `/api/callback`)

---

## Pages & Routes

### Static Pages (Prerendered)

| Route | File | Description |
|-------|------|-------------|
| `/` | `pages/index.astro` | Homepage with featured & recent posts |
| `/blog` | `pages/blog/index.astro` | Blog listing with sidebar |
| `/blog/[slug]` | `pages/blog/[slug].astro` | Individual blog posts |
| `/about` | `pages/about.astro` | About page |
| `/tools` | `pages/tools/index.astro` | Tools listing |
| `/tools/pricing-calculator` | `pages/tools/pricing-calculator.astro` | Cloud pricing tool |
| `/tools/ai-pricing-calculator` | `pages/tools/ai-pricing-calculator.astro` | AI pricing tool |
| `/rss.xml` | `pages/rss.xml.ts` | RSS feed |

### API Routes (Server-rendered)

| Route | File | Description |
|-------|------|-------------|
| `/api/auth` | `pages/api/auth.ts` | GitHub OAuth initiation |
| `/api/callback` | `pages/api/callback.ts` | OAuth callback handler |

---

## Configuration

### Astro (`astro.config.mjs`)

```javascript
{
  site: 'https://seanfraser.io',
  output: 'hybrid',                    // SSG + SSR for API routes
  adapter: cloudflare({
    imageService: 'passthrough',
    platformProxy: { enabled: true }
  }),
  integrations: [tailwind, mdx, markdoc, sitemap, react]
}
```

### Tailwind (`tailwind.config.mjs`)

**Color Palette:**
- Primary: Blue (#3b82f6)
- Accent: Teal (#14b8a6) - used for badges, links, hover states
- Dark mode: `class` strategy

**Typography:** Inter (sans), JetBrains Mono (code)

---

## Security Headers (`public/_headers`)

| Header | Value |
|--------|-------|
| Content-Security-Policy | Restrictive CSP with `wasm-unsafe-eval` for Pagefind |
| Strict-Transport-Security | `max-age=31536000; includeSubDomains; preload` |
| X-Frame-Options | `DENY` |
| X-Content-Type-Options | `nosniff` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Permissions-Policy | Blocks camera, microphone, geolocation, etc. |

**Special paths:**
- `/admin/*` - Relaxed CSP for Decap CMS
- `/api/*` - Relaxed COOP for OAuth popups
- `/pagefind/*` - 1-hour cache
- `/_astro/*`, `/assets/*`, `/images/*` - Immutable cache (1 year)

---

## Search (Pagefind)

**Build:** Runs via `postbuild` script after Astro build
**Index:** `dist/pagefind/` directory
**UI:** Custom modal triggered by ⌘K / Ctrl+K

Configuration in `src/components/Search.astro`:
- Indexes all `<body>` elements
- Supports dark mode theming
- Lazy-loads on first search open

---

## Dark Mode

- **Strategy:** CSS class on `<html>` element
- **Persistence:** localStorage (`theme` key)
- **Detection:** Respects `prefers-color-scheme`
- **Toggle:** Button in header

Anti-flash script in `<head>` applies dark class before paint.

---

## Build & Deploy

### Commands

```bash
npm run dev       # Start dev server
npm run build     # Build + generate Pagefind index
npm run preview   # Preview production build
```

### Deploy Pipeline

1. Push to `main` branch on GitHub
2. Cloudflare Pages auto-builds
3. Pagefind generates search index (postbuild)
4. Deploy to Cloudflare edge network

### Environment Variables (Cloudflare)

| Variable | Purpose |
|----------|---------|
| `OAUTH_GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `OAUTH_GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |

---

## External Services

| Service | Purpose | Configuration |
|---------|---------|---------------|
| Cloudflare Pages | Hosting & CDN | Auto-deploy from GitHub |
| Cloudflare Web Analytics | Privacy-focused analytics | Token in BaseLayout |
| GitHub | Content repository | OAuth for CMS |
| Giscus | Comments | GitHub Discussions integration |
| Google Fonts | Typography | Inter, JetBrains Mono |

---

## Performance Features

- **Static Generation:** All blog pages pre-rendered at build time
- **Hybrid Rendering:** API routes server-rendered on Cloudflare Workers
- **Image Optimization:** Cloudflare image service passthrough
- **Asset Caching:** Immutable cache headers for static assets
- **Search:** Client-side Pagefind with WASM for fast search
- **Font Loading:** Preconnect to Google Fonts

---

## File Counts

| Type | Count |
|------|-------|
| Blog Posts | 35 |
| Astro Components | 10 |
| React Components | 2 |
| API Routes | 2 |
| Pages | 7 |
