/**
 * API Configuration
 *
 * Centralized configuration for all API endpoints.
 * 
 * Browser: calls go through Next.js proxy (/api/proxy/*) → smap-api.tantai.dev
 * Server: calls go directly to smap-api.tantai.dev (or API_BASE_URL env)
 */

// API Base URL
// Client-side: calls go through the Next.js proxy at /api/proxy/*
// Server-side (API routes, SSR): calls go directly to the backend
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Browser → Next.js proxy (same origin, no CORS)
    return '/api/proxy';
  }
  // Server-side → direct backend
  return process.env.API_BASE_URL || 'https://smap-api.tantai.dev';
};

export const API_CONFIG = {
  // Base URL for all API calls (browser-accessible)
  BASE_URL: getApiBaseUrl(),

  // Service paths (appended to BASE_URL)
  // These match the Traefik ingress routing
  SERVICES: {
    identity: '/identity',
    project: '/project',
    ingest: '/ingest',
    knowledge: '/knowledge',
    notification: '/notification',
    scraper: '/scraper',
    reports: '/reports',
  },

  // Metabase (separate domain/IP)
  METABASE: {
    URL: process.env.NEXT_PUBLIC_METABASE_URL || 'https://smap-metabase.tantai.dev',
    SECRET: process.env.METABASE_SECRET_KEY || 'c6a62ff7eea13cfa4801c1bf2397d82ccc6f5c3c4e6f38fedd1aabc49ce81752',
  },

  // Full endpoint paths by service
  // Format: {service_path}/api/v1/{endpoint}
  // Note: Traefik strips the service prefix (e.g., /identity), 
  //       so services receive /api/v1/...
  ENDPOINTS: {
    identity: {
      login: '/identity/api/v1/authentication/login',
      callback: '/identity/api/v1/authentication/callback',
      logout: '/identity/api/v1/authentication/logout',
      me: '/identity/api/v1/authentication/me',
    },
    project: {
      campaigns: '/project/api/v1/campaigns',
      campaign: (id: string) => `/project/api/v1/campaigns/${id}`,
      campaignFavorite: (id: string) => `/project/api/v1/campaigns/${id}/favorite`,
      campaignFavorites: '/project/api/v1/campaigns/favorites',
      campaignProjects: (id: string) => `/project/api/v1/campaigns/${id}/projects`,
      projects: '/project/api/v1/projects',
      project: (id: string) => `/project/api/v1/projects/${id}`,
      projectActivate: (id: string) => `/project/api/v1/projects/${id}/activate`,
      projectPause: (id: string) => `/project/api/v1/projects/${id}/pause`,
      projectArchive: (id: string) => `/project/api/v1/projects/${id}/archive`,
      projectActivationReadiness: (id: string) => `/project/api/v1/projects/${id}/activation-readiness`,
      workspaces: '/project/api/v1/workspaces',
      workspace: (id: string) => `/project/api/v1/workspaces/${id}`,
    },
    ingest: {
      jobs: '/ingest/api/v1/jobs',
      job: (id: string) => `/ingest/api/v1/jobs/${id}`,
      dryrun: '/ingest/api/v1/dryrun',
      crawl: '/ingest/api/v1/crawl',
      posts: '/ingest/api/v1/posts',
      post: (id: string) => `/ingest/api/v1/posts/${id}`,
      datasources: '/ingest/api/v1/datasources',
      datasource: (id: string) => `/ingest/api/v1/datasources/${id}`,
      datasourceTargets: (id: string) => `/ingest/api/v1/datasources/${id}/targets`,
      datasourceTargetKeywords: (id: string) => `/ingest/api/v1/datasources/${id}/targets/keywords`,
      datasourceActivateTarget: (id: string, targetId: string) => `/ingest/api/v1/datasources/${id}/targets/${targetId}/activate`,
      datasourceTriggerDryrun: (id: string) => `/ingest/api/v1/datasources/${id}/dryrun`,
      datasourceDryrunLatest: (id: string) => `/ingest/api/v1/datasources/${id}/dryrun/latest`,
    },
    knowledge: {
      chat: '/knowledge/api/v1/knowledge/chat',
      suggestions: (campaignId: string) => `/knowledge/api/v1/knowledge/campaigns/${campaignId}/suggestions`,
      conversations: (campaignId: string) => `/knowledge/api/v1/knowledge/campaigns/${campaignId}/conversations`,
      conversation: (conversationId: string) => `/knowledge/api/v1/knowledge/conversations/${conversationId}`,
      reports: '/knowledge/api/v1/reports',
      report: (id: string) => `/knowledge/api/v1/reports/${id}`,
      insights: '/knowledge/api/v1/insights',
    },
    notification: {
      ws: '/notification/ws',
    },
    scraper: {
      tasks: '/scraper/api/v1/tasks',
      task: (id: string) => `/scraper/api/v1/tasks/${id}`,
    },
    // NOTE: reports-srv is not implemented yet. FE calls these paths; they are
    // served by local Next.js mock handlers under src/app/api/proxy/reports/...
    // When backend lands, delete those mock routes and the catch-all proxy
    // forwards identically-shaped requests.
    reports: {
      list: '/reports/api/v1',
      competitor: '/reports/api/v1/competitor',
      report: (id: string) => `/reports/api/v1/${id}`,
      process: (id: string) => `/reports/api/v1/${id}/process`,
      posts: (id: string) => `/reports/api/v1/${id}/posts`,
      cancel: (id: string) => `/reports/api/v1/${id}/cancel`,
      retry: (id: string) => `/reports/api/v1/${id}/retry`,
      postComments: (postId: string) => `/reports/api/v1/posts/${postId}/comments`,
    },
  },
} as const;

// Helper to build full URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

export type ServiceName = keyof typeof API_CONFIG.SERVICES;
