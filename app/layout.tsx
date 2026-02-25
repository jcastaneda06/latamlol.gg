import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "@/components/Providers";
import { AdBanner } from "@/components/ads/AdBanner";
import { getCurrentPatch } from "@/lib/ddragon";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "latamlol.gg — Estadísticas de League of Legends LATAM",
    template: "%s | latamlol.gg",
  },
  description:
    "Estadísticas de League of Legends para jugadores de LATAM (LA1/LA2). Perfiles, historial de partidas, tier lists, construcciones y parches en español.",
  keywords: ["League of Legends", "LATAM", "estadísticas", "LoL", "LA1", "LA2", "builds", "tier list", "latamlol"],
  openGraph: {
    title: "latamlol.gg",
    description: "Estadísticas de League of Legends para Latinoamérica",
    locale: "es_MX",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Warms the server-side patch version cache so all URL helpers use the real version
  await getCurrentPatch().catch(() => {});
  const pubId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

  return (
    <html lang="es" className="dark">
      <head>
        {/* Google AdSense */}
        {pubId && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pubId}`}
            crossOrigin="anonymous"
            strategy="lazyOnload"
          />
        )}
      </head>
      <body className={`${inter.variable} antialiased min-h-screen flex flex-col`}>
        <Providers>
          <Navbar />

          {/* Top leaderboard ad — below navbar, non-sticky, non-blocking */}
          <div className="flex justify-center border-b border-border-subtle bg-navy py-2">
            <AdBanner
              slot={process.env.NEXT_PUBLIC_AD_SLOT_LEADERBOARD ?? ""}
              format="leaderboard"
              className="hidden sm:block"
            />
            <AdBanner
              slot={process.env.NEXT_PUBLIC_AD_SLOT_INLINE ?? ""}
              format="inline"
              className="sm:hidden w-full px-4"
            />
          </div>

          <main className="flex-1">
            {children}
          </main>

          <Footer />
        </Providers>
      </body>
    </html>
  );
}
