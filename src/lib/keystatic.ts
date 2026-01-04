import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

const BLOG_DIR = path.join(process.cwd(), 'content/blog');

export interface Post {
  slug: string;
  title: { name: string; slug: string };
  description: string;
  date: string;
  updated: string | null;
  category: string;
  tags: string[];
  image: string | null;
  imageAlt: string | null;
  featured: boolean;
  draft: boolean;
}

export interface PostWithContent extends Post {
  content: string;
}

export async function getAllPosts(): Promise<Post[]> {
  const entries = fs.readdirSync(BLOG_DIR, { withFileTypes: true });
  const posts: Post[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const indexPath = path.join(BLOG_DIR, entry.name, 'index.yaml');
      if (fs.existsSync(indexPath)) {
        const yamlContent = fs.readFileSync(indexPath, 'utf-8');
        const data = yaml.parse(yamlContent);
        posts.push({
          slug: entry.name,
          ...data,
        });
      }
    }
  }

  return posts;
}

export async function getPost(slug: string): Promise<PostWithContent | null> {
  const indexPath = path.join(BLOG_DIR, slug, 'index.yaml');
  const contentPath = path.join(BLOG_DIR, slug, 'content.md');

  if (!fs.existsSync(indexPath) || !fs.existsSync(contentPath)) {
    return null;
  }

  const yamlContent = fs.readFileSync(indexPath, 'utf-8');
  const data = yaml.parse(yamlContent);
  const content = fs.readFileSync(contentPath, 'utf-8');

  return {
    slug,
    ...data,
    content,
  };
}

export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getAllPosts();
  return posts
    .filter((post) => !post.draft)
    .sort((a, b) => new Date(b.date).valueOf() - new Date(a.date).valueOf());
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}
