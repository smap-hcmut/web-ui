/**
 * Drizzle Schema Definitions
 *
 * Maps the SMAP PostgreSQL tables used for analytics queries.
 * Schemas: analysis, project
 */

import {
  pgSchema,
  uuid,
  varchar,
  text,
  real,
  integer,
  boolean,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';

// ─── Schema namespaces ───────────────────────────────────────────────────────

const analysisSchema = pgSchema('analysis');
const projectSchema = pgSchema('project');

// ─── UAP Metadata JSONB type ────────────────────────────────────────────────

export interface UAPEngagement {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
}

export interface UAPMetadata {
  author?: string;
  author_display_name?: string;
  author_username?: string;
  author_followers?: number;
  author_is_verified?: boolean;
  engagement?: UAPEngagement;
  url?: string;
  hashtags?: string[];
}

// ─── analysis.post_insight ──────────────────────────────────────────────────

export const postInsight = analysisSchema.table('post_insight', {
  id: uuid('id').primaryKey(),
  projectId: varchar('project_id', { length: 255 }).notNull(),
  sourceId: varchar('source_id', { length: 255 }),
  content: text('content'),
  contentCreatedAt: timestamp('content_created_at', { withTimezone: true }),
  ingestedAt: timestamp('ingested_at', { withTimezone: true }),
  platform: varchar('platform', { length: 50 }),
  uapMetadata: jsonb('uap_metadata').$type<UAPMetadata>(),
  overallSentiment: varchar('overall_sentiment', { length: 20 }),
  overallSentimentScore: real('overall_sentiment_score'),
  sentimentConfidence: real('sentiment_confidence'),
  sentimentExplanation: text('sentiment_explanation'),
  aspects: jsonb('aspects'),
  keywords: text('keywords').array(),
  riskLevel: varchar('risk_level', { length: 20 }),
  riskScore: real('risk_score'),
  riskFactors: jsonb('risk_factors'),
  requiresAttention: boolean('requires_attention'),
  alertTriggered: boolean('alert_triggered'),
  engagementScore: real('engagement_score'),
  viralityScore: real('virality_score'),
  influenceScore: real('influence_score'),
  reachEstimate: integer('reach_estimate'),
  contentQualityScore: real('content_quality_score'),
  isSpam: boolean('is_spam'),
  isBot: boolean('is_bot'),
  language: varchar('language', { length: 10 }),
  languageConfidence: real('language_confidence'),
  toxicityScore: real('toxicity_score'),
  isToxic: boolean('is_toxic'),
  primaryIntent: varchar('primary_intent', { length: 50 }),
  intentConfidence: real('intent_confidence'),
  impactScore: real('impact_score'),
  processingTimeMs: integer('processing_time_ms'),
  modelVersion: varchar('model_version', { length: 50 }),
  processingStatus: varchar('processing_status', { length: 50 }),
  analyzedAt: timestamp('analyzed_at', { withTimezone: true }),
  indexedAt: timestamp('indexed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});

// ─── project.campaigns ──────────────────────────────────────────────────────

export const campaigns = projectSchema.table('campaigns', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 20 }),
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// ─── project.projects ───────────────────────────────────────────────────────

export const projects = projectSchema.table('projects', {
  id: uuid('id').primaryKey(),
  campaignId: uuid('campaign_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  brand: varchar('brand', { length: 100 }),
  entityType: varchar('entity_type', { length: 50 }),
  entityName: varchar('entity_name', { length: 200 }).notNull(),
  domainTypeCode: varchar('domain_type_code', { length: 50 }),
  status: varchar('status', { length: 20 }),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// ─── project.projects_crisis_config ─────────────────────────────────────────

export const crisisConfig = projectSchema.table('projects_crisis_config', {
  projectId: uuid('project_id').primaryKey(),
  status: varchar('status', { length: 20 }),
  keywordsRules: jsonb('keywords_rules'),
  volumeRules: jsonb('volume_rules'),
  sentimentRules: jsonb('sentiment_rules'),
  influencerRules: jsonb('influencer_rules'),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});
