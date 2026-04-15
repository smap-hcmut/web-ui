/**
 * Catch-all API Proxy
 *
 * Forwards requests from the Next.js frontend to smap-api.tantai.dev.
 * This avoids CORS issues and keeps the backend URL server-side only.
 *
 * Pattern:  /api/proxy/project/api/v1/campaigns
 *       →   https://smap-api.tantai.dev/project/api/v1/campaigns
 *
 * Cookie handling:
 * - Backend sets cookies with Domain=tantai.dev which browsers won't send
 *   to localhost. The proxy rewrites Set-Cookie headers so they belong to
 *   the frontend's own domain (no Domain attr → defaults to current host).
 * - The OAuth login endpoint returns a 302 redirect. The proxy follows it
 *   manually (redirect: 'manual') so we can intercept Set-Cookie before
 *   the browser leaves our origin.
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.API_BASE_URL || 'https://smap-api.tantai.dev';

// Headers that should NOT be forwarded
const HOP_BY_HOP = new Set([
  'host',
  'connection',
  'keep-alive',
  'transfer-encoding',
  'te',
  'trailer',
  'upgrade',
  'proxy-authorization',
  'proxy-authenticate',
]);

/**
 * Rewrite a Set-Cookie header so it works on the frontend's domain.
 * - Strip Domain=... (let browser default to current host)
 * - Strip Secure flag when running on localhost (http)
 * - Keep everything else (Path, HttpOnly, SameSite, Max-Age, etc.)
 */
function rewriteSetCookie(raw: string, requestHost: string): string {
  const isLocalhost = requestHost.startsWith('localhost') || requestHost.startsWith('127.0.0.1');

  let rewritten = raw
    // Remove Domain attribute entirely
    .replace(/;\s*Domain=[^;]*/gi, '')
    // Ensure Path=/ so the cookie is sent on all routes
    .replace(/;\s*Path=[^;]*/gi, '; Path=/');

  // Drop Secure flag on localhost (no HTTPS)
  if (isLocalhost) {
    rewritten = rewritten.replace(/;\s*Secure/gi, '');
  }

  // Ensure SameSite=Lax for safety
  if (!/SameSite/i.test(rewritten)) {
    rewritten += '; SameSite=Lax';
  }

  return rewritten;
}

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const targetPath = `/${path.join('/')}`;
  const search = request.nextUrl.search;
  const targetUrl = `${BACKEND_URL}${targetPath}${search}`;
  const requestHost = request.headers.get('host') || 'localhost';

  // Build forwarded headers
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  // Forward cookies
  const cookie = request.headers.get('cookie');
  if (cookie) {
    headers.set('cookie', cookie);
  }

  try {
    // Use redirect:'manual' to intercept 3xx responses and their Set-Cookie
    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.body,
      redirect: 'manual',
      // @ts-expect-error -- Node fetch supports duplex for streaming
      duplex: 'half',
    });

    // Build response headers
    const responseHeaders = new Headers();
    upstream.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (HOP_BY_HOP.has(lower)) return;

      if (lower === 'set-cookie') {
        // Rewrite each Set-Cookie so it works on the frontend domain
        responseHeaders.append(key, rewriteSetCookie(value, requestHost));
      } else if (lower === 'location' && upstream.status >= 300 && upstream.status < 400) {
        // Don't rewrite Location — let browser follow the redirect
        responseHeaders.set(key, value);
      } else {
        responseHeaders.append(key, value);
      }
    });

    return new NextResponse(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Proxy error';
    return NextResponse.json(
      { code: 'PROXY_ERROR', message },
      { status: 502 },
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
