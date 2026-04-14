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
