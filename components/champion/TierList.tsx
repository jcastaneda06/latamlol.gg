"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn, tierListColor, formatPercent } from "@/lib/utils";
import { championIconUrl } from "@/lib/ddragon";
import { AdBanner } from "@/components/ads/AdBanner";
import type { TierListEntry, ChampionRole, ChampionTier } from "@/types/champion";

const ROLES: { value: ChampionRole | "all"; label: string }[] = [
  { value: "all", label: "Todos los roles" },
  { value: "top", label: "Top" },
  { value: "jungle", label: "Jungla" },
  { value: "mid", label: "Centro" },
  { value: "adc", label: "Tirador" },
  { value: "support", label: "Soporte" },
];

const ROLE_LABEL: Record<ChampionRole, string> = {
  top: "Top",
  jungle: "Jungla",
  mid: "Centro",
  adc: "Tirador",
  support: "Soporte",
};

const TIERS: { value: ChampionTier | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "S", label: "S" },
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "C", label: "C" },
  { value: "D", label: "D" },
];

interface TierListProps {
  entries: TierListEntry[];
}

export function TierList({ entries }: TierListProps) {
  const [roleFilter, setRoleFilter] = useState<ChampionRole | "all">("all");
  const [tierFilter, setTierFilter] = useState<ChampionTier | "all">("all");
  const [sortBy, setSortBy] = useState<"tier" | "pickrate">("tier");

  const filtered = useMemo(() => {
    let result = entries;

    if (roleFilter !== "all") result = result.filter(e => e.role === roleFilter);
    if (tierFilter !== "all") result = result.filter(e => e.tier === tierFilter);

    if (sortBy === "pickrate") return [...result].sort((a, b) => b.pickRate - a.pickRate);

    return result; // default: tier order (already sorted from server)
  }, [entries, roleFilter, tierFilter, sortBy]);

  // Group by tier for display
  const grouped = useMemo(() => {
    const groups: Record<string, TierListEntry[]> = {};
    for (const entry of filtered) {
      if (!groups[entry.tier]) groups[entry.tier] = [];
      groups[entry.tier].push(entry);
    }
    return groups;
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Role filter */}
        <div className="flex flex-wrap gap-1">
          {ROLES.map(r => (
            <button
              key={r.value}
              onClick={() => setRoleFilter(r.value as ChampionRole | "all")}
              className={cn(
                "rounded px-3 py-1.5 text-xs font-medium transition-colors border",
                roleFilter === r.value
                  ? "border-gold text-gold bg-surface-alt"
                  : "border-border-subtle text-muted-foreground hover:border-gold/50 hover:text-text-warm"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Tier filter */}
        <div className="flex gap-1">
          {TIERS.map(t => (
            <button
              key={t.value}
              onClick={() => setTierFilter(t.value as ChampionTier | "all")}
              className={cn(
                "rounded w-8 py-1 text-xs font-bold transition-colors border",
                tierFilter === t.value
                  ? "border-gold bg-surface-alt"
                  : "border-border-subtle text-muted-foreground hover:border-gold/50"
              )}
              style={tierFilter === t.value && t.value !== "all" ? { color: tierListColor(t.value) } : {}}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table header with sort */}
      <div className="overflow-x-auto rounded-lg border border-border-subtle bg-surface">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle text-xs text-muted-foreground">
              <th className="px-4 py-3 text-left">Tier</th>
              <th className="px-4 py-3 text-left">Campeón</th>
              <th
                className={cn("px-3 py-3 text-right cursor-pointer hover:text-text-warm", sortBy === "pickrate" && "text-gold")}
                onClick={() => setSortBy("pickrate")}
              >
                % Selección
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(grouped).map(([tier, tierEntries], tierIdx) => (
              <>
                {/* Tier header row */}
                <tr key={`tier-${tier}`} className="border-b border-border-subtle bg-surface-alt/50">
                  <td colSpan={3} className="px-4 py-1.5">
                    <span
                      className="text-xs font-black"
                      style={{ color: tierListColor(tier) }}
                    >
                      Tier {tier}
                    </span>
                  </td>
                </tr>

                {tierEntries.map(entry => (
                  <tr
                    key={`${entry.championId}-${entry.role}`}
                    className="border-b border-border-subtle last:border-0 hover:bg-surface-alt transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <span
                        className="inline-flex size-6 items-center justify-center rounded text-xs font-black"
                        style={{
                          color: tierListColor(tier),
                          backgroundColor: `${tierListColor(tier)}20`,
                        }}
                      >
                        {tier}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/campeones/${entry.championId}`}
                        className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
                      >
                        <Image
                          src={championIconUrl(entry.championId)}
                          alt={entry.championName}
                          width={32}
                          height={32}
                          className="rounded-full border border-border-subtle"
                          unoptimized
                        />
                        <span className="font-medium text-text-warm text-sm">{entry.championName}</span>
                        <span className="text-[11px] text-muted-foreground">{ROLE_LABEL[entry.role]}</span>
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-right text-sm text-muted-foreground">
                      {formatPercent(entry.pickRate)}
                    </td>
                  </tr>
                ))}

                {/* Ad between tiers (only after S and A) */}
                {(tier === "S" || tier === "A") && (
                  <tr key={`ad-${tier}`}>
                    <td colSpan={3} className="px-4 py-3">
                      <div className="flex justify-center">
                        <AdBanner
                          slot={process.env.NEXT_PUBLIC_AD_SLOT_LEADERBOARD ?? ""}
                          format="inline"
                          className="w-full max-w-2xl opacity-80"
                        />
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="rounded-lg border border-border-subtle bg-surface p-8 text-center">
          <p className="text-sm text-muted-foreground">Sin resultados para los filtros seleccionados.</p>
        </div>
      )}
    </div>
  );
}
