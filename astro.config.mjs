import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';

export default defineConfig({
  site: 'https://seanfraser.io',
  output: 'hybrid',
  adapter: cloudflare({
    imageService: 'passthrough',
  }),
  integrations: [
    tailwind(),
    mdx(),
    markdoc(),
    sitemap(),
    react(),
    keystatic(),
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
