import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';

export default defineConfig({
  site: 'https://seanfraser.io',
  output: 'hybrid',
  adapter: cloudflare({
    imageService: 'passthrough',
    platformProxy: {
      enabled: true,
    },
  }),
  integrations: [
    tailwind(),
    mdx(),
    markdoc(),
    sitemap(),
    react(),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },
  vite: {
    ssr: {
      external: ['node:fs', 'node:path', 'fs', 'path', 'yaml'],
    },
    resolve: {
      alias: {
        fs: 'node:fs',
        path: 'node:path',
      },
    },
  },
});
