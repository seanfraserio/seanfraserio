#!/usr/bin/env node
/**
 * Convert flat markdown files to Keystatic directory format
 *
 * Before: src/content/blog/my-post.md (frontmatter + content)
 * After:  src/content/blog/my-post/index.yaml + content.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogDir = path.join(__dirname, '../src/content/blog');

// Get all .md files in the blog directory
const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.md'));

console.log(`Found ${files.length} markdown files to convert\n`);

for (const file of files) {
  const filePath = path.join(blogDir, file);
  const slug = file.replace('.md', '');
  const content = fs.readFileSync(filePath, 'utf-8');

  // Parse frontmatter and content
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!frontmatterMatch) {
    console.log(`⚠️  Skipping ${file}: No frontmatter found`);
    continue;
  }

  const [, frontmatterStr, markdownContent] = frontmatterMatch;

  try {
    const frontmatter = yaml.parse(frontmatterStr);

    // Transform title to Keystatic slug format
    const keystatic = {
      title: {
        name: frontmatter.title,
        slug: slug
      },
      description: frontmatter.description || '',
      date: frontmatter.date ? formatDate(frontmatter.date) : null,
      updated: frontmatter.updated ? formatDate(frontmatter.updated) : null,
      category: frontmatter.category || 'Cloud Computing',
      tags: frontmatter.tags || [],
      image: frontmatter.image || null,
      imageAlt: frontmatter.imageAlt || null,
      featured: frontmatter.featured || false,
      draft: frontmatter.draft || false,
    };

    // Create directory
    const postDir = path.join(blogDir, slug);
    if (!fs.existsSync(postDir)) {
      fs.mkdirSync(postDir, { recursive: true });
    }

    // Write index.yaml
    const yamlContent = yaml.stringify(keystatic);
    fs.writeFileSync(path.join(postDir, 'index.yaml'), yamlContent);

    // Write content.md
    fs.writeFileSync(path.join(postDir, 'content.md'), markdownContent.trim());

    // Remove original file
    fs.unlinkSync(filePath);

    console.log(`✅ Converted: ${file} → ${slug}/`);
  } catch (err) {
    console.error(`❌ Error converting ${file}:`, err.message);
  }
}

function formatDate(date) {
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  if (typeof date === 'string') {
    return date.split('T')[0];
  }
  return null;
}

console.log('\n✨ Conversion complete!');
