import type { APIRoute } from 'astro';
import { makeHandler } from '@keystatic/astro/api';
import keystaticConfig from '../../../../keystatic.config';

export const prerender = false;

const handler = makeHandler({ config: keystaticConfig });

export const ALL: APIRoute = async (context) => {
  // For Cloudflare, ensure environment variables are available
  return handler(context);
};
