import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';

import { NextRequest } from 'next/server';

const ANALYSIS_API_URL =
  process.env.ANALYSIS_API_INTERNAL_URL ||
  process.env.ANALYSIS_API_URL ||
  'http://analysis-api.smap.svc.cluster.local';

const TIMEOUT_CACHE_TTL_MS = 60_000;
const timeoutEndpointCache = new Map<string, number>();

function getCampaignIdFromSearch(search: string): string | null {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const campaignId = params.get('campaignId');
  if (!campaignId) return null;
  return campaignId.trim() || null;
}

function timeoutCacheKey(campaignId: string | null, path: string, search = ''): string | null {
  if (!campaignId) return null;
  return `${campaignId}:${path}:${search}`;
}

function isEndpointInTimeoutWindow(campaignId: string | null, path: string, search = ''): boolean {
  const key = timeoutCacheKey(campaignId, path, search);
  if (!key) return false;
  const until = timeoutEndpointCache.get(key);
  if (!until) return false;
  if (until <= Date.now()) {
    timeoutEndpointCache.delete(key);
    return false;
  }
  return true;
}

function markEndpointTimeout(campaignId: string | null, path: string, search = ''): void {
  const key = timeoutCacheKey(campaignId, path, search);
  if (!key) return;
  timeoutEndpointCache.set(key, Date.now() + TIMEOUT_CACHE_TTL_MS);
}

async function requestAnalysis(url: URL): Promise<{ body: string; contentType: string; contentDisposition?: string; status: number }> {
  return await new Promise((resolve, reject) => {
    const transport = url.protocol === 'https:' ? httpsRequest : httpRequest;
    const req = transport(
      url,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          resolve({
            body,
            contentType: String(res.headers['content-type'] || 'application/json'),
            contentDisposition: res.headers['content-disposition']
              ? String(res.headers['content-disposition'])
              : undefined,
            status: res.statusCode || 502,
          });
        });
      },
    );

    req.setTimeout(60_000, () => {
      req.destroy(new Error('analysis-api timeout'));
    });
    req.on('error', reject);
    req.end();
  });
}

export async function fetchAnalysis(request: NextRequest, path: string): Promise<Response> {
  const url = new URL(path, ANALYSIS_API_URL);
  url.search = request.nextUrl.search;

  const campaignId = getCampaignIdFromSearch(url.search);
  if (isEndpointInTimeoutWindow(campaignId, path, url.search)) {
    return new Response(JSON.stringify({ error: 'analytics query exceeded server time limit' }), {
      status: 504,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const upstream = await requestAnalysis(url);
  if (upstream.status === 504) {
    markEndpointTimeout(campaignId, path, url.search);
  }
  const headers = new Headers({
    'Content-Type': upstream.contentType,
  });
  if (upstream.contentDisposition) {
    headers.set('Content-Disposition', upstream.contentDisposition);
  }
  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}

export async function proxyAnalysis(request: NextRequest, path: string): Promise<Response> {
  try {
    const upstream = await fetchAnalysis(request, path);
    const headers = new Headers({
      'Content-Type': upstream.headers.get('content-type') || 'application/json',
    });
    const contentDisposition = upstream.headers.get('content-disposition');
    if (contentDisposition) {
      headers.set('Content-Disposition', contentDisposition);
    }
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'analysis-api unavailable';
    const status = message.toLowerCase().includes('timeout') ? 504 : 502;
    if (status === 504) {
      const campaignId = getCampaignIdFromSearch(request.nextUrl.search);
      markEndpointTimeout(campaignId, path, request.nextUrl.search);
    }
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
