import type { APIRoute } from 'astro';
import { makeHandler } from '@keystatic/astro/api';
import keystaticConfig from '../../../../keystatic.config';

export const prerender = false;

export const ALL: APIRoute = async (context) => {
  // Get environment variables from Cloudflare runtime
  const runtime = (context.locals as any).runtime;
  const env = runtime?.env || {};

  // Set process.env for Keystatic to read
  if (env.KEYSTATIC_GITHUB_CLIENT_ID) {
    process.env.KEYSTATIC_GITHUB_CLIENT_ID = env.KEYSTATIC_GITHUB_CLIENT_ID;
  }
  if (env.KEYSTATIC_GITHUB_CLIENT_SECRET) {
    process.env.KEYSTATIC_GITHUB_CLIENT_SECRET = env.KEYSTATIC_GITHUB_CLIENT_SECRET;
  }
  if (env.KEYSTATIC_SECRET) {
    process.env.KEYSTATIC_SECRET = env.KEYSTATIC_SECRET;
  }

  const handler = makeHandler({ config: keystaticConfig });
  return handler(context);
};
