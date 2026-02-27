import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getChallengerLeaderboard, getGrandmasterLeaderboard, getMasterLeaderboard } from "@/lib/riot";
import { profileIconUrl, tierIconUrl } from "@/lib/ddragon";
import { tierColor, calcWinRate, winRateColor } from "@/lib/utils";
import { AdBanner } from "@/components/ads/AdBanner";
import type { LeagueItemDTO } from "@/types/riot";
import { absoluteUrl } from "@/lib/seo";

interface Props {
  params: Promise<{ region: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { region } = await params;
  const label = region === "la1" ? "LA Norte" : region === "la2" ? "LA Sur" : region.toUpperCase();
  return {
    title: `Clasificación ${label}`,
    description: `Top jugadores de League of Legends en ${label}. Desafiante, Gran Maestro y Maestro.`,
    alternates: {
      canonical: `/clasificacion/${region}`,
    },
    openGraph: {
      title: `Clasificación ${label}`,
      description: `Ranking de jugadores de LoL en ${label}.`,
      url: absoluteUrl(`/clasificacion/${region}`),
    },
  };
}

export const revalidate = 600; // 10 min

type RankedEntry = LeagueItemDTO & { tier: string };

export default async function ClasificacionPage({ params }: Props) {
  const { region } = await params;

  const [challenger, grandmaster, master] = await Promise.allSettled([
    getChallengerLeaderboard(region),
    getGrandmasterLeaderboard(region),
    getMasterLeaderboard(region),
  ]);

  const toEntries = (result: PromiseSettledResult<unknown>, tier: string): RankedEntry[] => {
    if (result.status !== "fulfilled") return [];
    const list = result.value as { entries?: LeagueItemDTO[] };
    return (list.entries ?? []).map(e => ({ ...e, tier }));
  };

  const combined: RankedEntry[] = [
    ...toEntries(challenger, "CHALLENGER"),
    ...toEntries(grandmaster, "GRANDMASTER"),
    ...toEntries(master, "MASTER"),
  ].sort((a, b) => {
    const tierOrder: Record<string, number> = { CHALLENGER: 0, GRANDMASTER: 1, MASTER: 2 };
    const td = (tierOrder[a.tier] ?? 3) - (tierOrder[b.tier] ?? 3);
    if (td !== 0) return td;
    return b.leaguePoints - a.leaguePoints;
  }).slice(0, 200);

  const regionLabel = region === "la1" ? "Latinoamérica Norte (LA1)" : region === "la2" ? "Latinoamérica Sur (LA2)" : region.toUpperCase();
  const otherRegion = region === "la1" ? "la2" : "la1";
  const otherLabel = region === "la1" ? "LA Sur" : "LA Norte";

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 lg:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#F0E6D3]">Clasificación</h1>
          <p className="text-sm text-muted-foreground">{regionLabel}</p>
        </div>
        <Link
          href={`/clasificacion/${otherRegion}`}
          className="rounded-lg border border-[#1E2D40] bg-surface px-4 py-2 text-sm font-medium text-[#F0E6D3] transition-colors hover:border-[#C89B3C]/30 hover:bg-surface-alt"
        >
          Ver {otherLabel} →
        </Link>
      </div>

      {/* Top leaderboard ad */}
      <div className="mb-4 flex justify-center">
        <AdBanner
          slot={process.env.NEXT_PUBLIC_AD_SLOT_LEADERBOARD ?? ""}
          format="leaderboard"
          className="hidden sm:block opacity-80"
        />
      </div>

      {combined.length === 0 ? (
        <div className="rounded-xl border border-[#1E2D40] bg-surface p-8 text-center">
          <p className="text-[#A0AEC0]">No hay datos de clasificación disponibles.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#1E2D40] bg-surface">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1E2D40] text-xs text-[#A0AEC0]">
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Invocador</th>
                <th className="px-4 py-3 text-center">Tier</th>
                <th className="px-3 py-3 text-right">PL</th>
                <th className="hidden px-3 py-3 text-right sm:table-cell">% Victoria</th>
                <th className="hidden px-3 py-3 text-right sm:table-cell">Partidas</th>
              </tr>
            </thead>
            <tbody>
              {combined.map((entry, idx) => {
                const wr = calcWinRate(entry.wins, entry.losses);
                const total = entry.wins + entry.losses;

                return (
                  <>
                    <tr
                      key={entry.summonerId}
                      className="border-b border-[#1E2D40] last:border-0 hover:bg-surface-alt transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-bold text-[#A0AEC0]">
                        {idx + 1 <= 3 ? (
                          <span className={idx === 0 ? "text-[#C89B3C]" : idx === 1 ? "text-[#A0AEC0]" : "text-[#AD5E2E]"}>
                            #{idx + 1}
                          </span>
                        ) : idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/perfil/${region}/${encodeURIComponent(`${entry.summonerName}#${region.toUpperCase()}`)}`}
                          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                        >
                          <span className="text-sm font-medium text-[#F0E6D3]">{entry.summonerName}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className="text-xs font-bold"
                          style={{ color: tierColor(entry.tier as Parameters<typeof tierColor>[0]) }}
                        >
                          {entry.tier === "CHALLENGER" ? "Des." : entry.tier === "GRANDMASTER" ? "G.Mae." : "Maes."}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right text-sm font-semibold text-[#C89B3C]">
                        {entry.leaguePoints.toLocaleString("es-MX")}
                      </td>
                      <td className={`hidden px-3 py-3 text-right text-sm font-semibold sm:table-cell ${winRateColor(wr)}`}>
                        {wr}%
                      </td>
                      <td className="hidden px-3 py-3 text-right text-sm text-[#A0AEC0] sm:table-cell">
                        {total.toLocaleString("es-MX")}
                      </td>
                    </tr>

                    {/* Ad every 50 entries */}
                    {(idx + 1) % 50 === 0 && idx + 1 < combined.length && (
                      <tr key={`ad-${idx}`}>
                        <td colSpan={6} className="px-4 py-3">
                          <div className="flex justify-center">
                            <AdBanner
                              slot={process.env.NEXT_PUBLIC_AD_SLOT_LEADERBOARD ?? ""}
                              format="inline"
                              className="w-full opacity-70"
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
