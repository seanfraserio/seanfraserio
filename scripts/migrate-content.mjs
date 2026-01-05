import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

const BLOG_DIR = path.join(process.cwd(), 'content/blog');

async function migrate() {
  const entries = fs.readdirSync(BLOG_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const indexPath = path.join(BLOG_DIR, entry.name, 'index.yaml');
    const contentPath = path.join(BLOG_DIR, entry.name, 'content.md');

    if (!fs.existsSync(indexPath) || !fs.existsSync(contentPath)) {
      console.log(`Skipping ${entry.name} - missing files`);
      continue;
    }

    // Read existing files
    const yamlContent = fs.readFileSync(indexPath, 'utf-8');
    const data = yaml.parse(yamlContent);
    const markdownContent = fs.readFileSync(contentPath, 'utf-8');

    // Convert title structure to flat fields
    const frontmatter = {
      title: data.title?.name || data.title || entry.name,
      slug: data.title?.slug || entry.name,
      description: data.description || '',
      date: data.date || new Date().toISOString().split('T')[0],
      updated: data.updated || null,
      category: data.category || 'Cloud Computing',
      tags: data.tags || [],
      image: data.image || null,
      imageAlt: data.imageAlt || null,
      featured: data.featured || false,
      draft: data.draft || false,
    };

    // Remove null values
    Object.keys(frontmatter).forEach(key => {
      if (frontmatter[key] === null) delete frontmatter[key];
    });

    // Create new markdown file with frontmatter
    const newContent = `---
${yaml.stringify(frontmatter).trim()}
---

${markdownContent}`;

    const newFilePath = path.join(BLOG_DIR, `${entry.name}.md`);
    fs.writeFileSync(newFilePath, newContent);

    // Remove old directory
    fs.rmSync(path.join(BLOG_DIR, entry.name), { recursive: true });

    console.log(`Migrated: ${entry.name}`);
  }

  console.log('Migration complete!');
}

migrate().catch(console.error);
