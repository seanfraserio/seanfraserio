import type { APIRoute } from 'astro';
import { makeHandler } from '@keystatic/astro/api';
import keystaticConfig from '../../../../keystatic.config';

export const prerender = false;

export const ALL: APIRoute = async (context) => {
  // Get environment variables from Cloudflare runtime (try multiple paths)
  const runtime = (context.locals as any).runtime;
  const cf = (context.locals as any).cf;
  const env = runtime?.env || cf?.env || (context as any).env || {};

  // Also check if vars are directly on locals (newer Astro + Cloudflare)
  const locals = context.locals as any;

  const clientId = env.KEYSTATIC_GITHUB_CLIENT_ID || locals.KEYSTATIC_GITHUB_CLIENT_ID || process.env.KEYSTATIC_GITHUB_CLIENT_ID;
  const clientSecret = env.KEYSTATIC_GITHUB_CLIENT_SECRET || locals.KEYSTATIC_GITHUB_CLIENT_SECRET || process.env.KEYSTATIC_GITHUB_CLIENT_SECRET;
  const secret = env.KEYSTATIC_SECRET || locals.KEYSTATIC_SECRET || process.env.KEYSTATIC_SECRET;

  // Set process.env for Keystatic to read
  if (clientId) process.env.KEYSTATIC_GITHUB_CLIENT_ID = clientId;
  if (clientSecret) process.env.KEYSTATIC_GITHUB_CLIENT_SECRET = clientSecret;
  if (secret) process.env.KEYSTATIC_SECRET = secret;

  const handler = makeHandler({ config: keystaticConfig });
  return handler(context);
};
