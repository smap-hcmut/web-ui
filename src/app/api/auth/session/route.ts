/**
 * Token → Cookie Exchange
 *
 * Receives a JWT token (from OAuth callback URL query param) and sets it
 * as an HttpOnly cookie on the frontend domain. This bridges the gap when
 * the OAuth callback goes directly to the backend (setting cookie on
 * tantai.dev) and then redirects to the frontend with the token in the URL.
 *
 * POST /api/auth/session  { token: string }
 * → Sets smap_auth_token cookie, returns 200
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.API_BASE_URL || 'https://smap-api.tantai.dev';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 },
      );
    }

    // Validate the token with the backend before setting it as a cookie.
    // Call /me to confirm the token is valid.
    const meRes = await fetch(
      `${BACKEND_URL}/identity/api/v1/authentication/me`,
      {
        headers: { Cookie: `smap_auth_token=${token}` },
      },
    );

    if (!meRes.ok) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 },
      );
    }

    const userData = await meRes.json();

    // Set the auth cookie on the frontend domain
    const requestHost = request.headers.get('host') || 'localhost';
    const isLocalhost =
      requestHost.startsWith('localhost') ||
      requestHost.startsWith('127.0.0.1');

    const response = NextResponse.json({
      success: true,
      data: userData.data ?? userData,
    });

    response.cookies.set('smap_auth_token', token, {
      httpOnly: true,
      secure: !isLocalhost,
      sameSite: 'lax',
      path: '/',
      domain: isLocalhost ? undefined : '.tantai.dev',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Session exchange failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
