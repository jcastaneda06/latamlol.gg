"use client";

import { useMemo } from "react";
import Image from "next/image";
import { cn, calcKDA, winRateColor, calcWinRate } from "@/lib/utils";
import { championIconUrl } from "@/lib/ddragon";
import type { ProcessedMatch } from "@/types/match";

interface ChampionStat {
  championId: number;
  champion: string;
  games: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
  totalCS: number;
  totalDuration: number;
}

interface ChampionStatsTableProps {
  matches: ProcessedMatch[];
}

export function ChampionStatsTable({ matches }: ChampionStatsTableProps) {
  const stats = useMemo(() => {
    const map = new Map<string, ChampionStat>();

    for (const m of matches) {
      const key = m.champion;
      const existing = map.get(key) ?? {
        championId: m.championId,
        champion: m.champion,
        games: 0,
        wins: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        totalCS: 0,
        totalDuration: 0,
      };

      map.set(key, {
        ...existing,
        games: existing.games + 1,
        wins: existing.wins + (m.win ? 1 : 0),
        kills: existing.kills + m.kills,
        deaths: existing.deaths + m.deaths,
        assists: existing.assists + m.assists,
        totalCS: existing.totalCS + m.cs,
        totalDuration: existing.totalDuration + m.gameDuration,
      });
    }

    return Array.from(map.values())
      .sort((a, b) => b.games - a.games)
      .slice(0, 15);
  }, [matches]);

  if (stats.length === 0) {
    return (
      <div className="rounded-lg border border-border-subtle bg-surface p-6 text-center">
        <p className="text-sm text-muted-foreground">No hay datos suficientes.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border-subtle bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-subtle text-xs text-muted-foreground">
            <th className="px-4 py-3 text-left">Campeón</th>
            <th className="px-3 py-3 text-center">Partidas</th>
            <th className="px-3 py-3 text-center">% Victoria</th>
            <th className="px-3 py-3 text-center">KDA</th>
            <th className="px-3 py-3 text-center hidden sm:table-cell">CS/min</th>
          </tr>
        </thead>
        <tbody>
          {stats.map(stat => {
            const wr = calcWinRate(stat.wins, stat.games - stat.wins);
            const kda = calcKDA(
              stat.kills / stat.games,
              stat.deaths / stat.games,
              stat.assists / stat.games
            );
            const csPerMin =
              stat.totalDuration > 0
                ? (stat.totalCS / (stat.totalDuration / 60)).toFixed(1)
                : "0.0";

            return (
              <tr
                key={stat.champion}
                className="border-b border-border-subtle last:border-0 hover:bg-surface-alt transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Image
                      src={championIconUrl(stat.champion)}
                      alt={stat.champion}
                      width={32}
                      height={32}
                      className="rounded-full border border-border-subtle"
                      unoptimized
                    />
                    <span className="font-medium text-text-warm">{stat.champion}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-center text-muted-foreground">{stat.games}</td>
                <td className={cn("px-3 py-3 text-center font-semibold", winRateColor(wr))}>
                  {wr}%
                </td>
                <td className="px-3 py-3 text-center text-text-warm">
                  {kda.toFixed(2)}
                  <span className="ml-1 text-[11px] text-muted-foreground">
                    ({(stat.kills / stat.games).toFixed(1)}/
                    {(stat.deaths / stat.games).toFixed(1)}/
                    {(stat.assists / stat.games).toFixed(1)})
                  </span>
                </td>
                <td className="hidden px-3 py-3 text-center text-muted-foreground sm:table-cell">
                  {csPerMin}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
