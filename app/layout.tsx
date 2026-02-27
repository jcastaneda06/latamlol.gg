import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "@/components/Providers";
import { AdBanner } from "@/components/ads/AdBanner";
import { getCurrentPatch } from "@/lib/ddragon";
import { absoluteUrl, getSiteUrl } from "@/lib/seo";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Estadísticas de League of Legends LATAM",
    template: "%s | latamlol.gg",
  },
  description:
    "Estadísticas de League of Legends para jugadores de LATAM (LA1/LA2). Perfiles, historial de partidas, tier lists, construcciones y parches en español.",
  keywords: ["League of Legends", "LATAM", "estadísticas", "LoL", "LA1", "LA2", "builds", "tier list", "latamlol"],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "Estadísticas de League of Legends LATAM",
    description: "Perfiles, historial de partidas, tier list, builds y parches de LoL para LATAM.",
    url: absoluteUrl("/"),
    siteName: "latamlol.gg",
    locale: "es_MX",
    type: "website",
    images: [
      {
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: "latamlol.gg - Estadísticas de League of Legends LATAM",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "latamlol.gg",
    description: "Estadísticas de League of Legends para Latinoamérica.",
    images: [absoluteUrl("/twitter-image")],
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
        <Script
          id="website-structured-data"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "latamlol.gg",
              url: absoluteUrl("/"),
              inLanguage: "es-MX",
              potentialAction: {
                "@type": "SearchAction",
                target: `${absoluteUrl("/")}?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
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
