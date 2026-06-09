import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Metagent Finance — Autonomous Treasury",
  description: "A2A Algorithmic Treasury Syndicate. ERC-7715 permissions, ERC-7710 redelegation, 1Shot gas abstraction.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Sora:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-background overflow-x-hidden min-h-screen antialiased">
        {/* Ambient background */}
        <div
          className="fixed inset-0 z-0 pointer-events-none opacity-20"
          style={{
            background: `radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,240,255,0.18), rgba(16,19,26,0) 60%),
                         radial-gradient(ellipse 50% 50% at 90% 10%, rgba(49,49,192,0.16), rgba(16,19,26,0) 55%)`,
          }}
        />
        <div className="fixed inset-0 z-0 pointer-events-none scanline opacity-[0.04]" />
        <div className="relative z-10"><Providers>{children}</Providers></div>
      </body>
    </html>
  );
}
