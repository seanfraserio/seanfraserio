import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const runtime = (context.locals as any).runtime;
  const env = runtime?.env || {};

  // Only use Cloudflare Pages environment variables - no process.env fallbacks
  const clientId = env.OAUTH_GITHUB_CLIENT_ID || env.KEYSTATIC_GITHUB_CLIENT_ID;

  if (!clientId) {
    return new Response('OAuth not configured', { status: 500 });
  }

  const redirectUri = `${new URL(context.request.url).origin}/api/callback`;
  // Minimal scope for Decap CMS - only needs repo access for content management
  const scope = 'public_repo';

  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;

  return Response.redirect(authUrl, 302);
};
