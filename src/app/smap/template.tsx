import type { ReactNode } from "react";

import { NotificationSocket } from "@/components/NotificationSocket";

export default function SmapTemplate({ children }: { children: ReactNode }) {
  return (
    <>
      <NotificationSocket />
      {children}
    </>
  );
}
