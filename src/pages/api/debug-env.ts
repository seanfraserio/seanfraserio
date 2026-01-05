import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const runtime = (context.locals as any).runtime;
  const cf = (context.locals as any).cf;
  const env = runtime?.env || cf?.env || {};
  const locals = context.locals as any;

  const debug = {
    hasRuntime: !!runtime,
    hasCf: !!cf,
    hasEnv: !!env,
    envKeys: Object.keys(env),
    hasClientId: !!(env.KEYSTATIC_GITHUB_CLIENT_ID || locals.KEYSTATIC_GITHUB_CLIENT_ID || process.env.KEYSTATIC_GITHUB_CLIENT_ID),
    hasClientSecret: !!(env.KEYSTATIC_GITHUB_CLIENT_SECRET || locals.KEYSTATIC_GITHUB_CLIENT_SECRET || process.env.KEYSTATIC_GITHUB_CLIENT_SECRET),
    hasSecret: !!(env.KEYSTATIC_SECRET || locals.KEYSTATIC_SECRET || process.env.KEYSTATIC_SECRET),
    // Show first 4 chars of client ID if exists (safe to show)
    clientIdPreview: (env.KEYSTATIC_GITHUB_CLIENT_ID || locals.KEYSTATIC_GITHUB_CLIENT_ID || process.env.KEYSTATIC_GITHUB_CLIENT_ID || '').substring(0, 4) || 'NOT SET',
  };

  return new Response(JSON.stringify(debug, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
};
