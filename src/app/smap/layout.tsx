'use client';

import { TopNav } from "@/components/TopNav";
import { LiveTicker } from "@/components/LiveTicker";
import { CampaignAssistant } from "@/components/CampaignAssistant";
import { ThemeProvider } from "@/components/ThemeProvider";
import { NavProvider } from "@/components/NavProvider";
import { ScopeProvider } from "@/components/ScopeProvider";
import { recentActivity } from "@/lib/mock-data";

export default function SmapLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <NavProvider>
        <ScopeProvider>
          <div className="min-h-screen bg-grid relative">
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

            {/* Navigation */}
            <TopNav />

            {/* Main content */}
            <main className="relative z-10 pb-16">{children}</main>

            {/* Campaign AI Assistant */}
            <CampaignAssistant />

            {/* Live ticker */}
            <LiveTicker activities={recentActivity} />
          </div>
        </ScopeProvider>
      </NavProvider>
    </ThemeProvider>
  );
}
