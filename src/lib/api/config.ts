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
    // Public route prefix is /scraper. Runtime service/repo remains the
    // legacy-compatible scapper-srv until a coordinated migration exists.
    scraper: '/scraper',
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
      campaignPause: (id: string) => `/project/api/v1/campaigns/${id}/pause`,
      campaignResume: (id: string) => `/project/api/v1/campaigns/${id}/resume`,
      campaignProjects: (id: string) => `/project/api/v1/campaigns/${id}/projects`,
      domains: '/project/api/v1/domains',
      projects: '/project/api/v1/projects',
      project: (id: string) => `/project/api/v1/projects/${id}`,
      projectActivate: (id: string) => `/project/api/v1/projects/${id}/activate`,
      projectPause: (id: string) => `/project/api/v1/projects/${id}/pause`,
      projectResume: (id: string) => `/project/api/v1/projects/${id}/resume`,
      projectArchive: (id: string) => `/project/api/v1/projects/${id}/archive`,
      projectUnarchive: (id: string) => `/project/api/v1/projects/${id}/unarchive`,
      projectActivationReadiness: (id: string) => `/project/api/v1/projects/${id}/activation-readiness`,
      projectCrisisConfig: (id: string) => `/project/api/v1/projects/${id}/crisis-config`,
      projectOntologyRules: (id: string) => `/project/api/v1/projects/${id}/ontology-rules`,
      projectOntologyRulesTest: (id: string) => `/project/api/v1/projects/${id}/ontology-rules/test`,
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
      datasourceActivate: (id: string) => `/ingest/api/v1/datasources/${id}/activate`,
      datasourcePause: (id: string) => `/ingest/api/v1/datasources/${id}/pause`,
      datasourceResume: (id: string) => `/ingest/api/v1/datasources/${id}/resume`,
      datasourceTargets: (id: string) => `/ingest/api/v1/datasources/${id}/targets`,
      datasourceTargetKeywords: (id: string) => `/ingest/api/v1/datasources/${id}/targets/keywords`,
      datasourceTargetProfiles: (id: string) => `/ingest/api/v1/datasources/${id}/targets/profiles`,
      datasourceActivateTarget: (id: string, targetId: string) => `/ingest/api/v1/datasources/${id}/targets/${targetId}/activate`,
      datasourceDeactivateTarget: (id: string, targetId: string) => `/ingest/api/v1/datasources/${id}/targets/${targetId}/deactivate`,
      datasourceTarget: (id: string, targetId: string) => `/ingest/api/v1/datasources/${id}/targets/${targetId}`,
      datasourceTriggerDryrun: (id: string) => `/ingest/api/v1/datasources/${id}/dryrun`,
      datasourceDryrunLatest: (id: string) => `/ingest/api/v1/datasources/${id}/dryrun/latest`,
    },
    knowledge: {
      chat: '/knowledge/api/v1/knowledge/chat',
      suggestions: (campaignId: string) => `/knowledge/api/v1/knowledge/campaigns/${campaignId}/suggestions`,
      conversations: (campaignId: string) => `/knowledge/api/v1/knowledge/campaigns/${campaignId}/conversations`,
      conversation: (conversationId: string) => `/knowledge/api/v1/knowledge/conversations/${conversationId}`,
      reports: '/knowledge/api/v1/knowledge/reports',
      report: (id: string) => `/knowledge/api/v1/knowledge/reports/${id}`,
      insights: '/knowledge/api/v1/insights',
    },
    notification: {
      ws: '/notification/ws',
    },
    scraper: {
      tasks: '/scraper/api/v1/tasks',
      task: (id: string) => `/scraper/api/v1/tasks/${id}`,
    },
    // Reports are owned by knowledge-srv because report artifacts depend on
    // campaign RAG/search context and MinIO/Postgres storage.
    reports: {
      list: '/knowledge/api/v1/knowledge/reports',
      generate: '/knowledge/api/v1/knowledge/reports/generate',
      report: (id: string) => `/knowledge/api/v1/knowledge/reports/${id}`,
      process: (id: string) => `/knowledge/api/v1/knowledge/reports/${id}/process`,
      posts: (id: string) => `/knowledge/api/v1/knowledge/reports/${id}/posts`,
      content: (id: string) => `/knowledge/api/v1/knowledge/reports/${id}/content`,
      download: (id: string) => `/knowledge/api/v1/knowledge/reports/${id}/download`,
      cancel: (id: string) => `/knowledge/api/v1/knowledge/reports/${id}/cancel`,
      retry: (id: string) => `/knowledge/api/v1/knowledge/reports/${id}/retry`,
      postComments: (postId: string) => `/knowledge/api/v1/knowledge/reports/posts/${postId}/comments`,
    },
  },
} as const;

// Helper to build full URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
