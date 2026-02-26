"use client";

import { Fragment, useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn, tierListColor, formatPercent, tierColor, winRateColor } from "@/lib/utils";
import { championIconUrl, tierIconUrl } from "@/lib/ddragon";
import { AdBanner } from "@/components/ads/AdBanner";
import type { TierListEntry, ChampionRole, ChampionTier } from "@/types/champion";
import type { Tier } from "@/types/riot";

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

const RANK_FILTERS: { value: "all" | Tier; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "IRON", label: "Hierro" },
  { value: "BRONZE", label: "Bronce" },
  { value: "SILVER", label: "Plata" },
  { value: "GOLD", label: "Oro" },
  { value: "PLATINUM", label: "Platino" },
  { value: "EMERALD", label: "Esmeralda" },
  { value: "DIAMOND", label: "Diamante" },
  { value: "MASTER", label: "Maestro" },
  { value: "GRANDMASTER", label: "Gran Maestro" },
  { value: "CHALLENGER", label: "Retador" },
];

interface TierListProps {
  entries: TierListEntry[];
}

export function TierList({ entries: initialEntries }: TierListProps) {
  const [entries, setEntries] = useState<TierListEntry[]>(initialEntries);
  const [roleFilter, setRoleFilter] = useState<ChampionRole | "all">("all");
  const [tierFilter, setTierFilter] = useState<ChampionTier | "all">("all");
  const [rankFilter, setRankFilter] = useState<"all" | Tier>("all");
  const [sortBy, setSortBy] = useState<"tier" | "pickrate" | "winrate">("tier");
  const [isLoadingRank, setIsLoadingRank] = useState(false);
  const [rankDropdownOpen, setRankDropdownOpen] = useState(false);
  const [isRefreshingWinrates, setIsRefreshingWinrates] = useState(false);
  const rankDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rankDropdownRef.current && !rankDropdownRef.current.contains(e.target as Node)) {
        setRankDropdownOpen(false);
      }
    }
    if (rankDropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [rankDropdownOpen]);

  useEffect(() => {
    if (rankFilter === "all") setEntries(initialEntries);
  }, [initialEntries, rankFilter]);

  useEffect(() => {
    if (rankFilter === "all") {
      setEntries(initialEntries);
      return;
    }
    setIsLoadingRank(true);
    fetch(`/api/campeones/tierlist?rank=${rankFilter.toLowerCase()}`)
      .then((res) => res.ok ? res.json() : [])
      .then((data: TierListEntry[]) => setEntries(data ?? []))
      .catch(() => setEntries(initialEntries))
      .finally(() => setIsLoadingRank(false));
  }, [rankFilter, initialEntries]);

  const filtered = useMemo(() => {
    let result = entries;

    if (roleFilter !== "all") result = result.filter(e => e.role === roleFilter);
    if (tierFilter !== "all") result = result.filter(e => e.tier === tierFilter);

    if (sortBy === "pickrate") return [...result].sort((a, b) => b.pickRate - a.pickRate);
    if (sortBy === "winrate") return [...result].sort((a, b) => (b.winRate || 0) - (a.winRate || 0));

    return result;
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

  const colSpan = 4;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Rank dropdown (first) */}
        <div className="relative" ref={rankDropdownRef}>
          <button
            onClick={() => setRankDropdownOpen(o => !o)}
            disabled={isLoadingRank}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
              rankDropdownOpen
                ? "border-gold bg-surface-alt text-gold"
                : "border-border-subtle text-muted-foreground hover:border-gold/50 hover:text-text-warm disabled:opacity-50"
            )}
            style={!rankDropdownOpen && rankFilter !== "all" ? { color: tierColor(rankFilter) } : {}}
          >
            {rankFilter !== "all" && (
              <span className="flex size-10 shrink-0 overflow-hidden rounded-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={tierIconUrl(rankFilter)}
                  alt=""
                  className="size-full object-cover"
                />
              </span>
            )}
            <span>{RANK_FILTERS.find(r => r.value === rankFilter)?.label ?? "Rango"}</span>
            <ChevronDown className={cn("size-3.5 opacity-70 transition-transform", rankDropdownOpen && "rotate-180")} />
          </button>
          {rankDropdownOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 min-w-[140px] rounded-md border border-border-subtle bg-surface py-0.5 shadow-lg">
              {RANK_FILTERS.map(r => (
                <button
                  key={r.value}
                  onClick={() => {
                    setRankFilter(r.value);
                    setRankDropdownOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 px-2 py-1 text-left text-xs transition-colors hover:bg-surface-alt",
                    rankFilter === r.value ? "bg-surface-alt font-medium" : "text-muted-foreground"
                  )}
                  style={rankFilter === r.value && r.value !== "all" ? { color: tierColor(r.value as Tier) } : {}}
                >
                  {r.value !== "all" ? (
                    <span className="flex size-10 shrink-0 overflow-hidden rounded-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={tierIconUrl(r.value)}
                        alt=""
                        className="size-full object-cover"
                      />
                    </span>
                  ) : (
                    <span className="w-10 shrink-0" />
                  )}
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>

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

        {/* Refresh winrates (when no data) */}
        {!entries.some(e => (e.winRate ?? 0) > 0) && (
          <button
            onClick={async () => {
              setIsRefreshingWinrates(true);
              try {
                const res = await fetch("/api/campeones/winrates/refresh", { method: "POST" });
                const json = await res.json().catch(() => ({}));
                if (res.ok && json.ok) {
                  window.location.reload();
                }
              } finally {
                setIsRefreshingWinrates(false);
              }
            }}
            disabled={isRefreshingWinrates}
            className="rounded px-3 py-1.5 text-xs font-medium border border-gold/50 text-gold hover:bg-gold/10 disabled:opacity-50"
          >
            {isRefreshingWinrates ? "Cargando..." : "Cargar % victoria"}
          </button>
        )}

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
                className={cn("px-3 py-3 text-right cursor-pointer hover:text-text-warm whitespace-nowrap", sortBy === "winrate" && "text-gold")}
                onClick={() => setSortBy("winrate")}
              >
                % Victoria
              </th>
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
              <Fragment key={`group-${tier}`}>
                {/* Tier header row */}
                <tr className="border-b border-border-subtle bg-surface-alt/50">
                  <td colSpan={colSpan} className="px-4 py-1.5">
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
                    <td className={cn("px-3 py-2.5 text-right text-sm font-medium tabular-nums", (entry.winRate ?? 0) > 0 ? winRateColor(entry.winRate!) : "text-muted-foreground")}>
                      {(entry.winRate ?? 0) > 0 ? formatPercent(entry.winRate!) : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right text-sm text-muted-foreground">
                      {formatPercent(entry.pickRate)}
                    </td>
                  </tr>
                ))}

                {/* Ad between tiers (only after S and A) */}
                {(tier === "S" || tier === "A") && (
                  <tr key={`ad-${tier}`}>
                    <td colSpan={colSpan} className="px-4 py-3">
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
              </Fragment>
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
