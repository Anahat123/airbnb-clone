import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import { Suspense } from "react";
import "leaflet/dist/leaflet.css";
import "./globals.css";

import { MobileNav } from "@/components/layout/MobileNav";
import { Providers } from "@/components/providers/Providers";
import { themeScript } from "@/components/providers/ThemeProvider";

// Airbnb Cereal is proprietary; Figtree is a free geometric sans with very similar proportions.
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree", weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: { default: "Airbnb Clone | Holiday rentals, cabins, beach houses & more", template: "%s - Airbnb Clone" },
  description: "A full-stack Airbnb clone: search stays, book dates, host your own place.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={figtree.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh">
        <Providers>
          {children}
          <Suspense>
            <MobileNav />
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
