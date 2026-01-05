import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPublishedPosts } from '@/lib/content';

export const prerender = true;

export async function GET(context: APIContext) {
  const posts = await getPublishedPosts();

  return rss({
    title: 'CloudHacks',
    description: 'Insights on cloud security, cloud computing, and DevOps best practices.',
    site: context.site!,
    items: posts.map((post) => ({
      title: post.title,
      pubDate: new Date(post.date),
      description: post.description,
      link: `/blog/${post.slug}/`,
      categories: [post.category, ...post.tags],
    })),
    customData: `<language>en-us</language>`,
  });
}
