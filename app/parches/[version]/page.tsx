import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { scrapePatchDetail } from "@/lib/scraper";
import { getCachedPatchNotes, setCachedPatchNotes } from "@/lib/supabase";
import { AdBanner } from "@/components/ads/AdBanner";
import { absoluteUrl } from "@/lib/seo";

interface Props {
  params: Promise<{ version: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { version } = await params;
  const title = `Parche ${version} - Notas de Actualizacion`;
  const description = `Notas completas del parche ${version} de League of Legends en espanol.`;
  return {
    title,
    description,
    alternates: {
      canonical: `/parches/${version}`,
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/parches/${version}`),
    },
  };
}

export const revalidate = 604800; // 7 days

export default async function PatchDetailPage({ params }: Props) {
  const { version } = await params;

  // Check Supabase cache
  const cached = await getCachedPatchNotes(version);

  let patchData;
  if (cached) {
    patchData = cached as {
      title: string;
      url: string;
      content_html: string;
      published_at: string;
      highlights: Array<{ name: string; type: string; changes: string[] }>;
    };
  } else {
    // Construct URL and scrape
    const [major, minor] = version.split(".");
    const url = `https://www.leagueoflegends.com/es-mx/news/game-updates/patch-${major}-${minor}-notes/`;
    const detail = await scrapePatchDetail(url, version);

    if (detail) {
      await setCachedPatchNotes({
        version,
        title: detail.title,
        url: detail.url,
        content_html: detail.contentHtml,
        highlights: detail.highlights,
        published_at: detail.publishedAt,
      }).catch(() => {});
      patchData = {
        title: detail.title,
        url: detail.url,
        content_html: detail.contentHtml,
        published_at: detail.publishedAt ?? "",
        highlights: detail.highlights,
      };
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 lg:px-6">
      <Link
        href="/parches"
        className="flex items-center gap-1.5 text-sm text-[#A0AEC0] hover:text-[#C89B3C] transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Todos los parches
      </Link>

      <div className="mt-4 mb-6">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#C89B3C]">
          Parche {version}
        </span>
        <h1 className="mt-1 text-2xl font-bold text-[#F0E6D3]">
          {patchData?.title ?? `Notas del Parche ${version}`}
        </h1>
        {patchData?.published_at && (
          <p className="mt-1 text-sm text-[#A0AEC0]">
            {new Date(patchData.published_at).toLocaleDateString("es-MX", {
              day: "numeric", month: "long", year: "numeric",
            })}
          </p>
        )}
      </div>

      {/* Top ad */}
      <div className="mb-6 flex justify-center">
        <AdBanner
          slot={process.env.NEXT_PUBLIC_AD_SLOT_LEADERBOARD ?? ""}
          format="leaderboard"
          className="hidden sm:block opacity-80"
        />
      </div>

      {/* Champion changes highlights */}
      {patchData?.highlights && Array.isArray(patchData.highlights) && patchData.highlights.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-base font-semibold text-[#F0E6D3]">Cambios Destacados</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(patchData.highlights as Array<{ name: string; type: string; changes: string[] }>).slice(0, 12).map((change, i) => (
              <div
                key={i}
                className="rounded-lg border border-[#1E2D40] bg-surface p-3"
              >
                <div className="mb-2 flex items-center gap-2">
                  {change.type === "buffed" && <TrendingUp className="size-4 text-win" />}
                  {change.type === "nerfed" && <TrendingDown className="size-4 text-loss" />}
                  {change.type === "adjusted" && <Minus className="size-4 text-[#A0AEC0]" />}
                  <span className="font-semibold text-[#F0E6D3] text-sm">{change.name}</span>
                  <span className={`ml-auto text-[11px] font-medium uppercase ${
                    change.type === "buffed" ? "text-win" :
                    change.type === "nerfed" ? "text-loss" :
                    "text-[#A0AEC0]"
                  }`}>
                    {change.type === "buffed" ? "Mejorado" : change.type === "nerfed" ? "Debilitado" : "Ajustado"}
                  </span>
                </div>
                <ul className="space-y-1">
                  {change.changes.slice(0, 3).map((c, j) => (
                    <li key={j} className="text-xs text-[#A0AEC0] line-clamp-2">{c}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full content */}
      {patchData?.content_html ? (
        <div>
          <h2 className="mb-4 text-base font-semibold text-[#F0E6D3]">Notas Completas</h2>
          <div
            className="prose prose-sm prose-invert max-w-none text-[#A0AEC0] [&_h2]:text-[#F0E6D3] [&_h3]:text-[#C89B3C] [&_strong]:text-[#F0E6D3]"
            dangerouslySetInnerHTML={{ __html: patchData.content_html }}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-[#1E2D40] bg-surface p-6 text-center">
          <p className="text-[#A0AEC0] text-sm">
            Para ver las notas completas, visita la{" "}
            <a
              href={`https://www.leagueoflegends.com/es-mx/news/game-updates/patch-${version.replace(".", "-")}-notes/`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C89B3C] hover:underline"
            >
              página oficial de Riot Games
            </a>
            .
          </p>
        </div>
      )}
    </div>
  );
}
