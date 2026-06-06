'use client';

import { createContext, useContext, useState, useMemo } from 'react';

export type TabId = 'MAP' | 'Projects' | 'Insights' | 'Stalker' | 'Reports';

interface NavContextValue {
  activeTab: TabId;
  setActiveTab: (t: TabId) => void;
}

const NavContext = createContext<NavContextValue>({
  activeTab: 'MAP',
  setActiveTab: () => {},
});

export function useNav() {
  return useContext(NavContext);
}

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabId>('MAP');

  const value = useMemo(() => ({ activeTab, setActiveTab }), [activeTab]);

  return (
    <NavContext.Provider value={value}>
      {children}
    </NavContext.Provider>
  );
}
