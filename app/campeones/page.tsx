import type { Metadata } from "next";
import { getMerakiTierList } from "@/lib/meraki";
import { getAllChampions, getCurrentPatch } from "@/lib/ddragon";
import { getOrFetchWinrates, type WinrateAggregate } from "@/lib/champion-winrate";
import { TierList } from "@/components/champion/TierList";
import { AdBanner } from "@/components/ads/AdBanner";
import type { TierListEntry } from "@/types/champion";

const MERAKI_TO_RIOT_ALIAS: Record<string, string> = {
  MonkeyKing: "Wukong",
};

export const metadata: Metadata = {
  title: "Tier List de Campeones — latamlol.gg",
  description: "Lista completa de campeones de League of Legends clasificados por tier y rol para el meta actual.",
};

export const revalidate = 21600; // 6 hours

function computeWinRate(wins: number, losses: number): number {
  const total = wins + losses;
  return total > 0 ? Math.round((wins / total) * 1000) / 10 : 0;
}

export default async function CampeonesPage() {
  const winratePromise = Promise.race([
    getOrFetchWinrates("la1"),
    new Promise<Record<string, never>>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 6000)
    ),
  ]).catch(() => ({}));

  const [merakiData, ddData, patch, winrates] = await Promise.allSettled([
    getMerakiTierList(),
    getAllChampions(),
    getCurrentPatch(),
    winratePromise,
  ]);

  const tierEntries = merakiData.status === "fulfilled" ? merakiData.value : [];
  const ddChampions = ddData.status === "fulfilled" ? ddData.value : {};
  const patchVersion = patch.status === "fulfilled" ? patch.value : "15.x";
  const wrMap: WinrateAggregate =
    winrates.status === "fulfilled" && winrates.value && typeof winrates.value === "object"
      ? (winrates.value as WinrateAggregate)
      : {};

  // Merge DDragon + winrate data into tier entries
  const enriched: TierListEntry[] = tierEntries.map(entry => {
    const lookupKey = MERAKI_TO_RIOT_ALIAS[entry.championId] ?? entry.championId;
    const wrEntry = wrMap[lookupKey]?.[entry.role];
    const wins = wrEntry?.wins ?? 0;
    const losses = wrEntry?.losses ?? 0;
    const hasRealData = wins + losses > 0;
    return {
      ...entry,
      winRate: hasRealData ? computeWinRate(wins, losses) : entry.winRate,
      games: hasRealData ? wins + losses : entry.games,
      championData: ddChampions[entry.championId],
    };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Main content */}
        <div className="min-w-0 flex-1">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#F0E6D3]">Tier List de Campeones</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Parche {patchVersion} · Tier basado en popularidad por rol · {enriched.length} campeones
            </p>
          </div>

          <TierList entries={enriched} />
        </div>

        {/* Sidebar Ad */}
        <aside className="hidden w-[300px] shrink-0 space-y-4 lg:block">
          <AdBanner
            slot={process.env.NEXT_PUBLIC_AD_SLOT_RECTANGLE ?? ""}
            format="rectangle"
            className="mx-auto"
          />
          <AdBanner
            slot={process.env.NEXT_PUBLIC_AD_SLOT_RECTANGLE ?? ""}
            format="half-page"
            className="mx-auto"
          />
        </aside>
      </div>
    </div>
  );
}
