'use client';

import { ThemeProvider } from '@/components/ThemeProvider';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}
