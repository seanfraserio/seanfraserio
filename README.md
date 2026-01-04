# CloudHacks Blog

A modern blog built with Astro and deployed to Cloudflare Pages.

## Tech Stack

- **Framework**: [Astro](https://astro.build)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **Hosting**: [Cloudflare Pages](https://pages.cloudflare.com)
- **Interactive Components**: React

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
/
├── public/              # Static assets
├── src/
│   ├── components/      # UI components
│   ├── content/         # Blog posts (Markdown/MDX)
│   ├── layouts/         # Page layouts
│   ├── lib/             # Utility functions
│   ├── pages/           # Route pages
│   └── styles/          # Global styles
├── astro.config.mjs     # Astro configuration
├── tailwind.config.mjs  # Tailwind configuration
└── wrangler.toml        # Cloudflare configuration
```

## Adding Blog Posts

Create a new `.md` or `.mdx` file in `src/content/blog/`:

```markdown
---
title: "Your Post Title"
description: "A brief description"
date: 2024-01-15
category: "Cloud Security"
tags: ["tag1", "tag2"]
featured: false
draft: false
---

Your content here...
```

## Deployment

### Cloudflare Pages Setup

1. Connect your GitHub repository to Cloudflare Pages
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add custom domain in Cloudflare dashboard

### Environment Variables

Set these in Cloudflare Pages dashboard:
- `NODE_VERSION`: `20`

## License

MIT
