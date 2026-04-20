/**
 * Knowledge API (Campaign Assistant)
 *
 * Functions for interacting with the knowledge-srv chat and suggestions endpoints.
 * Chat:        POST /knowledge/api/v1/knowledge/chat
 * Suggestions: GET  /knowledge/api/v1/knowledge/campaigns/{id}/suggestions
 */

import { apiClient } from './client';
import { API_CONFIG } from './config';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatRequest {
  campaign_id: string;
  message: string;
  conversation_id?: string;
  filters?: Record<string, unknown>;
}

export interface Citation {
  source: string;
  content: string;
  url?: string;
  relevance_score?: number;
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
  conversation_id: string;
  suggestions: string[];
  search_metadata?: Record<string, unknown>;
}

export interface SuggestionItem {
  query: string;
  category: string;
  description: string;
}

interface SuggestionsResponse {
  suggestions: SuggestionItem[];
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const knowledgeApi = {
  /** Send a chat message and get an AI-generated answer */
  chat: async (req: ChatRequest): Promise<ChatResponse> => {
    return apiClient.post<ChatResponse>(API_CONFIG.ENDPOINTS.knowledge.chat, req);
  },

  /** Get smart query suggestions for a campaign */
  suggestions: async (campaignId: string): Promise<SuggestionItem[]> => {
    const resp = await apiClient.get<SuggestionsResponse | SuggestionItem[]>(
      API_CONFIG.ENDPOINTS.knowledge.suggestions(campaignId),
    );
    if (Array.isArray(resp)) return resp;
    return resp.suggestions ?? [];
  },
};
