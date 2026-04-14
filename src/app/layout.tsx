import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SMAP — Social Media Analysis Platform",
  description:
    "Real-time social media analysis across TikTok, Facebook, and YouTube",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning data-theme="midnight">
      <body>{children}</body>
    </html>
  );
}
