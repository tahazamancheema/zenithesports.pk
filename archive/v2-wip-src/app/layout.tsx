import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import { siteConfig } from "@/config/site";
import { MotionProvider } from "@/components/providers/motion-provider";
import { ToastProvider } from "@/components/ui/toast";
import { Shell } from "@/components/layout/shell";
import { AuthModal } from "@/components/auth/auth-modal";
import { Suspense } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
  },
};

import { JsonLd, generateOrganizationSchema } from "@/components/seo/json-ld";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontVariables} antialiased film-grain`} suppressHydrationWarning>
      <body className="bg-[var(--color-bg-900)] text-[var(--color-text-primary)] min-h-screen">
        <JsonLd data={generateOrganizationSchema()} />
        <MotionProvider>
          <Shell>{children}</Shell>
          <Suspense fallback={null}>
            <AuthModal />
          </Suspense>
          <ToastProvider />
        </MotionProvider>
      </body>
    </html>
  );
}
