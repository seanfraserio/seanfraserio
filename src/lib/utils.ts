export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function getReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

export function getCategories(posts: { data: { category: string } }[]): string[] {
  const categories = new Set(posts.map((post) => post.data.category));
  return Array.from(categories).sort();
}

export function filterPostsByCategory(
  posts: { data: { category: string } }[],
  category: string
) {
  return posts.filter((post) => post.data.category === category);
}
