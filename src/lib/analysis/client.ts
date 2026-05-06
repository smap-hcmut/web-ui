import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';

import { NextRequest } from 'next/server';

const ANALYSIS_API_URL =
  process.env.ANALYSIS_API_INTERNAL_URL ||
  process.env.ANALYSIS_API_URL ||
  'http://analysis-api.smap.svc.cluster.local';

const TIMEOUT_CACHE_TTL_MS = 60_000;
const timeoutCampaignCache = new Map<string, number>();

function getCampaignIdFromSearch(search: string): string | null {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const campaignId = params.get('campaignId');
  if (!campaignId) return null;
  return campaignId.trim() || null;
}

function isCampaignInTimeoutWindow(campaignId: string | null): boolean {
  if (!campaignId) return false;
  const until = timeoutCampaignCache.get(campaignId);
  if (!until) return false;
  if (until <= Date.now()) {
    timeoutCampaignCache.delete(campaignId);
    return false;
  }
  return true;
}

function markCampaignTimeout(campaignId: string | null): void {
  if (!campaignId) return;
  timeoutCampaignCache.set(campaignId, Date.now() + TIMEOUT_CACHE_TTL_MS);
}

async function requestAnalysis(url: URL): Promise<{ body: string; contentType: string; status: number }> {
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
  if (isCampaignInTimeoutWindow(campaignId)) {
    return new Response(JSON.stringify({ error: 'analytics query exceeded server time limit' }), {
      status: 504,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const upstream = await requestAnalysis(url);
  if (upstream.status === 504) {
    markCampaignTimeout(campaignId);
  }
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.contentType,
    },
  });
}

export async function proxyAnalysis(request: NextRequest, path: string): Promise<Response> {
  try {
    const upstream = await fetchAnalysis(request, path);
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'analysis-api unavailable';
    const status = message.toLowerCase().includes('timeout') ? 504 : 502;
    if (status === 504) {
      const campaignId = getCampaignIdFromSearch(request.nextUrl.search);
      markCampaignTimeout(campaignId);
    }
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
