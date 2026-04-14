import { redirect } from 'next/navigation';

/**
 * /campaigns is no longer a standalone page.
 * Campaigns are navigated via the CampaignSwitcher in TopNav.
 */
export default function CampaignsPage() {
  redirect('/smap');
}
