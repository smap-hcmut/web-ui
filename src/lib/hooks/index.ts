/**
 * Hooks Index
 *
 * Export all custom hooks from a single entry point.
 */

export { useCurrentUser, useLogout, useLogin, authKeys } from './use-auth';
export {
  useCampaigns,
  useCampaign,
  useCreateCampaign,
  useUpdateCampaign,
  useArchiveCampaign,
  useToggleCampaignFavorite,
  campaignKeys,
} from './use-campaigns';
export { useCreateProject, projectKeys } from './use-projects';
export { useMetabaseCards, useMetabaseQuery, useMetabaseMetadata, useMetabaseDataset, metabaseKeys } from './use-metabase';
export type { MetabaseCard, MetabaseColumn, MetabaseQueryResult, MetabaseTableMeta, MetabaseFieldMeta, DatasetRequest } from './use-metabase';
