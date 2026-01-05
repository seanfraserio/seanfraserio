import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

const BLOG_DIR = path.join(process.cwd(), 'content/blog');

export interface Post {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated?: string;
  category: string;
  tags: string[];
  image?: string;
  imageAlt?: string;
  featured: boolean;
  draft: boolean;
}

export interface PostWithContent extends Post {
  content: string;
}

function parseFrontmatter(fileContent: string): { data: Record<string, any>; content: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = fileContent.match(frontmatterRegex);

  if (!match) {
    return { data: {}, content: fileContent };
  }

  const data = yaml.parse(match[1]);
  const content = match[2].trim();

  return { data, content };
}

export async function getAllPosts(): Promise<Post[]> {
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'));
  const posts: Post[] = [];

  for (const file of files) {
    const filePath = path.join(BLOG_DIR, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data } = parseFrontmatter(fileContent);
    const slug = file.replace('.md', '');

    posts.push({
      slug,
      title: data.title || slug,
      description: data.description || '',
      date: data.date || new Date().toISOString().split('T')[0],
      updated: data.updated,
      category: data.category || 'Cloud Computing',
      tags: data.tags || [],
      image: data.image,
      imageAlt: data.imageAlt,
      featured: data.featured || false,
      draft: data.draft || false,
    });
  }

  return posts;
}

export async function getPost(slug: string): Promise<PostWithContent | null> {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = parseFrontmatter(fileContent);

  return {
    slug,
    title: data.title || slug,
    description: data.description || '',
    date: data.date || new Date().toISOString().split('T')[0],
    updated: data.updated,
    category: data.category || 'Cloud Computing',
    tags: data.tags || [],
    image: data.image,
    imageAlt: data.imageAlt,
    featured: data.featured || false,
    draft: data.draft || false,
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
