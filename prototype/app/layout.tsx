import type { Metadata } from "next";
import "./globals.css";
import { MockDataProvider } from "@/lib/mock/MockDataProvider";
import { RoleProvider } from "@/lib/mock/RoleProvider";
import { PrototypeBanner } from "@/components/layout/PrototypeBanner";

export const metadata: Metadata = {
  title: "EduClaw — Phase 1 Prototype",
  description:
    "Higher-ed AI Agent Design Framework — UI/UX prototype with mock data, no backend.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <MockDataProvider>
          <RoleProvider>
            <PrototypeBanner />
            <div id="main">{children}</div>
          </RoleProvider>
        </MockDataProvider>
      </body>
    </html>
  );
}
