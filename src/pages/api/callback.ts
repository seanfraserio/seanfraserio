import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const runtime = (context.locals as any).runtime;
  const env = runtime?.env || {};

  const clientId = env.OAUTH_GITHUB_CLIENT_ID || process.env.OAUTH_GITHUB_CLIENT_ID;
  const clientSecret = env.OAUTH_GITHUB_CLIENT_SECRET || process.env.OAUTH_GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new Response('OAuth not configured', { status: 500 });
  }

  const url = new URL(context.request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('No code provided', { status: 400 });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return new Response(`OAuth error: ${tokenData.error_description || tokenData.error}`, { status: 400 });
    }

    const token = tokenData.access_token;

    // Return HTML that sends the token back to the CMS
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Authorization Complete</title>
</head>
<body>
  <script>
    (function() {
      function receiveMessage(e) {
        console.log("receiveMessage %o", e);
        window.opener.postMessage(
          'authorization:github:success:${JSON.stringify({ token, provider: 'github' })}',
          e.origin
        );
        window.close();
      }
      window.addEventListener("message", receiveMessage, false);
      window.opener.postMessage("authorizing:github", "*");
    })();
  </script>
</body>
</html>`;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('OAuth error:', error);
    return new Response('OAuth failed', { status: 500 });
  }
};
