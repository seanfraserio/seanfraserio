#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const MEDIUM_EXPORT_DIR = '/Users/sfraser/Downloads/sf-medium-export/posts';
const BLOG_DIR = path.join(process.cwd(), 'src/content/blog');
const IMAGES_DIR = path.join(process.cwd(), 'public/images/blog');

// Ensure directories exist
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Simple HTML to text extraction
function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

// Convert HTML to Markdown
function htmlToMarkdown(html) {
  let md = html;

  // Remove script and style tags
  md = md.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  md = md.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Handle headings
  md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n');
  md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n');
  md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n');
  md = md.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n#### $1\n');

  // Handle paragraphs
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n');

  // Handle bold and italic
  md = md.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*');

  // Handle links
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');

  // Handle images - extract src
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, '\n![]($1)\n');

  // Handle lists
  md = md.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n');
  md = md.replace(/<ul[^>]*>/gi, '\n');
  md = md.replace(/<\/ul>/gi, '\n');
  md = md.replace(/<ol[^>]*>/gi, '\n');
  md = md.replace(/<\/ol>/gi, '\n');

  // Handle blockquotes
  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '\n> $1\n');

  // Handle code
  md = md.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`');
  md = md.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, '\n```\n$1\n```\n');

  // Handle line breaks
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<hr\s*\/?>/gi, '\n---\n');

  // Remove remaining HTML tags
  md = md.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  md = md.replace(/&nbsp;/g, ' ');
  md = md.replace(/&amp;/g, '&');
  md = md.replace(/&lt;/g, '<');
  md = md.replace(/&gt;/g, '>');
  md = md.replace(/&quot;/g, '"');
  md = md.replace(/&#39;/g, "'");
  md = md.replace(/&mdash;/g, '—');
  md = md.replace(/&ndash;/g, '–');
  md = md.replace(/&hellip;/g, '...');

  // Clean up multiple newlines
  md = md.replace(/\n{3,}/g, '\n\n');

  return md.trim();
}

// Download image and return local path
function downloadImage(url, slug, index) {
  return new Promise((resolve) => {
    if (!url || !url.startsWith('http')) {
      resolve(null);
      return;
    }

    const ext = url.includes('.png') ? '.png' : url.includes('.gif') ? '.gif' : '.jpg';
    const filename = `${slug}-${index}${ext}`;
    const localPath = path.join(IMAGES_DIR, filename);
    const publicPath = `/images/blog/${filename}`;

    // Skip if already downloaded
    if (fs.existsSync(localPath)) {
      resolve(publicPath);
      return;
    }

    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.get(url, { timeout: 10000 }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirect - handle relative URLs
        let redirectUrl = response.headers.location;
        if (redirectUrl.startsWith('/')) {
          const urlObj = new URL(url);
          redirectUrl = `${urlObj.protocol}//${urlObj.host}${redirectUrl}`;
        }
        const redirectProtocol = redirectUrl.startsWith('https') ? https : http;
        redirectProtocol.get(redirectUrl, { timeout: 10000 }, (res) => {
          const file = fs.createWriteStream(localPath);
          res.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve(publicPath);
          });
          file.on('error', () => resolve(null));
        }).on('error', () => resolve(null));
      } else if (response.statusCode === 200) {
        const file = fs.createWriteStream(localPath);
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(publicPath);
        });
        file.on('error', () => resolve(null));
      } else {
        resolve(null);
      }
    });

    request.on('error', () => resolve(null));
    request.on('timeout', () => {
      request.destroy();
      resolve(null);
    });
  });
}

// Create slug from title
function createSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
}

// Extract category from content
function extractCategory(content) {
  const categories = {
    'cloud security': 'Cloud Security',
    'cdr': 'Cloud Security',
    'cspm': 'Cloud Security',
    'casb': 'Cloud Security',
    'ztna': 'Network Security',
    'sase': 'Network Security',
    'sd-wan': 'Network Security',
    'api security': 'Application Security',
    'siem': 'Security Operations',
    'soar': 'Security Operations',
    'edr': 'Endpoint Security',
    'xdr': 'Endpoint Security',
    'threat': 'Threat Intelligence',
    'log management': 'Security Operations',
    'monitoring': 'Observability',
    'observability': 'Observability',
    'devops': 'DevOps',
    'cdn': 'DevOps',
    'iac': 'DevOps',
    'serverless': 'Cloud Architecture',
    'microservices': 'Cloud Architecture',
    'faas': 'Cloud Architecture',
    'machine learning': 'AI/ML',
    'federated learning': 'AI/ML',
    'iot': 'IoT',
    'edge computing': 'Edge Computing',
    'dns': 'Network Security',
    'passwordless': 'Identity Security',
    'insider threat': 'Security Operations',
    'vulnerability': 'Security Operations',
    'soft skills': 'Career',
    'solutions architect': 'Career',
    'sales': 'Career',
    'kitchen': 'Lifestyle',
    'travel': 'Lifestyle',
    'tripod': 'Lifestyle'
  };

  const lowerContent = content.toLowerCase();
  for (const [keyword, category] of Object.entries(categories)) {
    if (lowerContent.includes(keyword)) {
      return category;
    }
  }
  return 'Cloud Security';
}

// Parse a single Medium HTML file
async function parseHtmlFile(filePath) {
  const html = fs.readFileSync(filePath, 'utf-8');

  // Extract title
  const titleMatch = html.match(/<h1[^>]*class="p-name"[^>]*>([\s\S]*?)<\/h1>/i);
  const title = titleMatch ? stripHtml(titleMatch[1]) : '';

  // Skip comments/responses (short posts)
  if (title.startsWith('Very') || title.startsWith('Thank') || title.startsWith('Great') || title.startsWith('This is a')) {
    return null;
  }

  // Extract description
  const subtitleMatch = html.match(/<section[^>]*data-field="subtitle"[^>]*>([\s\S]*?)<\/section>/i);
  const description = subtitleMatch ? stripHtml(subtitleMatch[1]) : '';

  // Extract date
  const dateMatch = html.match(/datetime="([^"]+)"/);
  const date = dateMatch ? dateMatch[1].split('T')[0] : new Date().toISOString().split('T')[0];

  // Extract body content
  const bodyMatch = html.match(/<section[^>]*data-field="body"[^>]*class="e-content"[^>]*>([\s\S]*?)<\/section>\s*<footer/i);
  if (!bodyMatch) return null;

  let bodyHtml = bodyMatch[1];

  // Remove the duplicate title h3 at the start
  bodyHtml = bodyHtml.replace(/<h3[^>]*class="[^"]*graf--title[^"]*"[^>]*>[\s\S]*?<\/h3>/i, '');

  // Extract all image URLs first
  const slug = createSlug(title);
  const imageMatches = [...bodyHtml.matchAll(/src="(https:\/\/cdn-images[^"]+)"/gi)];
  let featuredImage = null;

  // Download images and replace URLs
  for (let i = 0; i < imageMatches.length; i++) {
    const originalUrl = imageMatches[i][1];
    console.log(`  Downloading image ${i + 1}/${imageMatches.length}...`);
    const localPath = await downloadImage(originalUrl, slug, i);
    if (localPath) {
      bodyHtml = bodyHtml.replace(originalUrl, localPath);
      if (i === 0) {
        featuredImage = localPath;
      }
    }
  }

  // Convert HTML to Markdown
  const markdown = htmlToMarkdown(bodyHtml);

  // Extract category
  const category = extractCategory(title + ' ' + description + ' ' + markdown);

  return {
    title,
    slug,
    description,
    date,
    category,
    featuredImage,
    content: markdown
  };
}

// Clear existing blog posts
function clearBlogDir() {
  if (fs.existsSync(BLOG_DIR)) {
    const entries = fs.readdirSync(BLOG_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        fs.rmSync(path.join(BLOG_DIR, entry.name), { recursive: true });
      }
    }
  }
}

// Main function
async function main() {
  console.log('Converting Medium export to blog format...\n');

  // Clear existing posts
  console.log('Clearing existing blog posts...\n');
  clearBlogDir();

  const files = fs.readdirSync(MEDIUM_EXPORT_DIR)
    .filter(f => f.endsWith('.html'))
    .sort();

  let converted = 0;
  let skipped = 0;

  for (const file of files) {
    const filePath = path.join(MEDIUM_EXPORT_DIR, file);
    console.log(`Processing: ${file}`);

    try {
      const post = await parseHtmlFile(filePath);

      if (!post) {
        console.log('  → Skipped (comment/response)\n');
        skipped++;
        continue;
      }

      // Create blog post directory
      const postDir = path.join(BLOG_DIR, post.slug);
      if (!fs.existsSync(postDir)) {
        fs.mkdirSync(postDir, { recursive: true });
      }

      // Escape title and description for YAML
      const escapedTitle = post.title.replace(/"/g, '\\"');
      const escapedDesc = post.description.replace(/"/g, '\\"');

      // Create index.yaml
      const yamlContent = `title:
  name: "${escapedTitle}"
  slug: ${post.slug}
description: "${escapedDesc}"
date: ${post.date}
updated: null
category: ${post.category}
tags: []
image: ${post.featuredImage || 'null'}
imageAlt: null
featured: false
draft: false
`;

      fs.writeFileSync(path.join(postDir, 'index.yaml'), yamlContent);
      fs.writeFileSync(path.join(postDir, 'content.md'), post.content);

      console.log(`  → Created: ${post.slug}\n`);
      converted++;
    } catch (error) {
      console.error(`  → Error: ${error.message}\n`);
    }
  }

  console.log(`\nDone! Converted ${converted} posts, skipped ${skipped} comments.`);
}

main().catch(console.error);
