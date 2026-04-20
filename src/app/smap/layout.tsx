'use client';

import { Suspense } from "react";
import { TopNav } from "@/components/TopNav";
import { LiveTicker } from "@/components/LiveTicker";
import { CampaignAssistant } from "@/components/CampaignAssistant";
import { NotificationToasts } from "@/components/NotificationToasts";
import { NotificationBanner } from "@/components/NotificationBanner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { NavProvider } from "@/components/NavProvider";
import { ScopeProvider, useScope } from "@/components/ScopeProvider";
import { AssistantProvider, useAssistant } from "@/components/AssistantProvider";
import { useRecentActivity } from "@/lib/hooks";
import type { ActivityItem } from "@/lib/types";

const DOCK_WIDTH = 'clamp(420px, 33vw, 600px)';

function SmapLayoutInner({ children }: { children: React.ReactNode }) {
  const { activeCampaignId } = useScope();
  const { open: assistantOpen, mode: assistantMode } = useAssistant();
  const pushContent = assistantOpen && assistantMode === 'docked';
  const pushOffset = pushContent ? DOCK_WIDTH : undefined;
  const { data } = useRecentActivity({ campaignId: activeCampaignId ?? undefined, limit: 20 });

  // Map PostItem[] → ActivityItem[] for LiveTicker
  const activities: ActivityItem[] = (data?.posts ?? []).map((p) => ({
    id: p.id,
    platform: p.platform as ActivityItem["platform"],
    author: p.author,
    content: p.content,
    time: p.time,
    sentiment: p.sentiment,
    engagement: p.engagement,
  }));

  return (
    <div
      className="min-h-screen bg-grid relative transition-[padding] duration-300 ease-out"
      style={{
        paddingRight: pushOffset,
        ['--assistant-push' as string]: pushOffset ?? '0px',
      } as React.CSSProperties}
    >
      {/* Ambient gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="orb w-[700px] h-[700px] -top-[250px] -right-[150px]"
          style={{
            background:
              "radial-gradient(circle, rgba(254,44,85,0.05) 0%, transparent 65%)",
          }}
        />
        <div
          className="orb w-[600px] h-[600px] -bottom-[250px] -left-[150px]"
          style={{
            background:
              "radial-gradient(circle, rgba(24,119,242,0.04) 0%, transparent 65%)",
          }}
        />
        <div
          className="orb w-[400px] h-[400px] top-[40%] left-[50%] -translate-x-1/2"
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,0.01) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Critical banner */}
      <NotificationBanner rightOffset={pushOffset} />

      {/* Navigation */}
      <TopNav />

      {/* Main content */}
      <main className="relative z-10 pb-16">{children}</main>

      {/* Campaign AI Assistant */}
      <CampaignAssistant />

      {/* Toast notifications */}
      <NotificationToasts
        rightOffset={pushContent ? `calc(${DOCK_WIDTH} + 1.5rem)` : undefined}
      />

      {/* Live ticker */}
      <LiveTicker activities={activities} rightOffset={pushOffset} />
    </div>
  );
}

export default function SmapLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <NavProvider>
        <Suspense fallback={null}>
        <ScopeProvider>
          <AssistantProvider>
            <SmapLayoutInner>{children}</SmapLayoutInner>
          </AssistantProvider>
        </ScopeProvider>
        </Suspense>
      </NavProvider>
    </ThemeProvider>
  );
}
