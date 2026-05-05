import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';

import { NextRequest } from 'next/server';

const ANALYSIS_API_URL =
  process.env.ANALYSIS_API_INTERNAL_URL ||
  process.env.ANALYSIS_API_URL ||
  'http://analysis-api.smap.svc.cluster.local';

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

  const upstream = await requestAnalysis(url);
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
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
