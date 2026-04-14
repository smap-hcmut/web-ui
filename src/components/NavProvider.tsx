'use client';

import { createContext, useContext, useState } from 'react';

export type TabId = 'MAP' | 'Insights' | 'Stalker' | 'Reports';

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

  return (
    <NavContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </NavContext.Provider>
  );
}
