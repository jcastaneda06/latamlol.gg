import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { getAccountByRiotId } from "@/lib/riot";
import { getSummonerByPuuid, getRankedByPuuid } from "@/lib/riot";
import { indexSummonerFromProfile, insertRankSnapshot } from "@/lib/supabase";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { RankedCard } from "@/components/profile/RankedCard";
import { MatchHistory } from "@/components/profile/MatchHistory";
import { Skeleton } from "@/components/ui/skeleton";
import { AdBanner } from "@/components/ads/AdBanner";

interface Props {
  params: Promise<{ region: string; riotId: string }>;
}

function parseRiotId(encoded: string): { gameName: string; tagLine: string } {
  const decoded = decodeURIComponent(encoded);
  const [name, tag] = decoded.split("#");
  return { gameName: name ?? decoded, tagLine: tag ?? "" };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { riotId, region } = await params;
  const { gameName } = parseRiotId(riotId);
  return {
    title: `${gameName} — Perfil ${region.toUpperCase()}`,
    description: `Estadísticas de ${gameName} en ${region.toUpperCase()} — historial de partidas, clasificación y más.`,
  };
}

export default async function ProfilePage({ params }: Props) {
  const { region, riotId } = await params;
  const { gameName, tagLine } = parseRiotId(riotId);

  // If no tag, redirect to a search result
  if (!tagLine) {
    notFound();
  }

  let account, summoner, ranked;

  try {
    account = await getAccountByRiotId(gameName, tagLine, region);
    [summoner, ranked] = await Promise.all([
      getSummonerByPuuid(account.puuid, region),
      getRankedByPuuid(account.puuid, region),
    ]);
    const riotIdFull = `${account.gameName}#${account.tagLine}`;
    indexSummonerFromProfile(
      account.puuid,
      region,
      riotIdFull,
      summoner.profileIconId
    ).catch(() => {});
    for (const e of ranked) {
      if (e.queueType === "RANKED_SOLO_5x5" || e.queueType === "RANKED_FLEX_SR") {
        insertRankSnapshot(account.puuid, region, {
          queueType: e.queueType,
          tier: e.tier,
          rank: e.rank ?? "I",
          leaguePoints: e.leaguePoints,
          wins: e.wins,
          losses: e.losses,
        }).catch(() => {});
      }
    }
  } catch {
    notFound();
  }

  const soloEntry = ranked.find(e => e.queueType === "RANKED_SOLO_5x5");
  const flexEntry = ranked.find(e => e.queueType === "RANKED_FLEX_SR");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Main content */}
        <div className="min-w-0 flex-1 space-y-6">
          <ProfileHeader
            account={account}
            summoner={summoner}
            ranked={ranked}
            region={region}
          />

          {/* Ranked Cards */}
          <div className="grid gap-3 sm:grid-cols-2">
            <RankedCard entry={soloEntry} queueLabel="Solo/Dúo Clasificatoria" />
            <RankedCard entry={flexEntry} queueLabel="Flexible Clasificatoria" />
          </div>

          {/* Match History */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#F0E6D3]">Historial de Partidas</h2>
              <a
                href={`/perfil/${region}/${riotId}/campeones`}
                className="text-xs text-[#A0AEC0] hover:text-[#C89B3C] transition-colors"
              >
                Ver estadísticas por campeón →
              </a>
            </div>
            <Suspense
              fallback={
                <div className="flex flex-col gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-[72px] w-full rounded-lg bg-surface" />
                  ))}
                </div>
              }
            >
              <MatchHistory puuid={account.puuid} region={region} />
            </Suspense>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-full shrink-0 space-y-4 lg:w-[300px]">
          {/* Live game link */}
          <a
            href={`/perfil/${region}/${riotId}/en-vivo`}
            className="flex items-center gap-2 rounded-lg border border-[#1E2D40] bg-surface p-3.5 text-sm font-medium text-[#F0E6D3] transition-colors hover:border-[#C89B3C]/30 hover:bg-surface-alt"
          >
            <span className="size-2 rounded-full bg-win animate-pulse" />
            Ver partida en vivo
          </a>

          {/* Sidebar Ad — non-intrusive rectangle */}
          <AdBanner
            slot={process.env.NEXT_PUBLIC_AD_SLOT_RECTANGLE ?? ""}
            format="rectangle"
            className="mx-auto"
          />

          {/* Second sidebar ad (half page) for desktop */}
          <AdBanner
            slot={process.env.NEXT_PUBLIC_AD_SLOT_RECTANGLE ?? ""}
            format="half-page"
            className="mx-auto hidden xl:block"
          />
        </aside>
      </div>
    </div>
  );
}
