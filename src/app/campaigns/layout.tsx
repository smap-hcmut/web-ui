/**
 * /campaigns layout — minimal pass-through.
 * The page immediately redirects to /smap;
 * this layout exists only to satisfy Next.js routing.
 */
export default function CampaignsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
