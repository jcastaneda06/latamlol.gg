import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { QUEUE_MAP, QUEUE_SHORT } from "@/types/match";
import type { Tier, Division } from "@/types/riot";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── KDA ──────────────────────────────────────────────────────────────────────
export function calcKDA(kills: number, deaths: number, assists: number): number {
  if (deaths === 0) return kills + assists;
  return (kills + assists) / deaths;
}

export function formatKDA(kills: number, deaths: number, assists: number): string {
  return `${kills}/${deaths}/${assists}`;
}

export function kdaColor(ratio: number): string {
  if (ratio >= 4) return "text-yellow-400";
  if (ratio >= 3) return "text-teal";
  if (ratio >= 2) return "text-green-400";
  return "text-text-muted";
}

// ── CS ───────────────────────────────────────────────────────────────────────
export function formatCS(cs: number, durationSeconds: number): string {
  const perMin = durationSeconds > 0 ? (cs / (durationSeconds / 60)).toFixed(1) : "0.0";
  return `${cs} CS (${perMin}/min)`;
}

// ── Game Duration ─────────────────────────────────────────────────────────────
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ── Time Ago (Spanish) ────────────────────────────────────────────────────────
export function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "hace un momento";
  if (minutes < 60) return `hace ${minutes} min`;
  if (hours < 24) return `hace ${hours}h`;
  if (days < 7) return `hace ${days}d`;
  return new Date(timestamp).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
}

// ── Queue Names ───────────────────────────────────────────────────────────────
export function getQueueName(queueId: number): string {
  return QUEUE_MAP[queueId] ?? "Otro modo";
}

export function getQueueShort(queueId: number): string {
  return QUEUE_SHORT[queueId] ?? "Otro";
}

export function isRankedQueue(queueId: number): boolean {
  return queueId === 420 || queueId === 440;
}

// ── Rank / LP ─────────────────────────────────────────────────────────────────
const TIER_ORDER: Record<Tier, number> = {
  IRON: 0,
  BRONZE: 1,
  SILVER: 2,
  GOLD: 3,
  PLATINUM: 4,
  EMERALD: 5,
  DIAMOND: 6,
  MASTER: 7,
  GRANDMASTER: 8,
  CHALLENGER: 9,
};

const DIVISION_ORDER: Record<Division, number> = {
  IV: 0,
  III: 1,
  II: 2,
  I: 3,
};

export function rankToLP(tier: Tier, rank: Division, lp: number): number {
  return TIER_ORDER[tier] * 400 + DIVISION_ORDER[rank] * 100 + lp;
}

export function calcLPDelta(
  beforeTier: Tier,
  beforeRank: Division,
  beforeLP: number,
  afterTier: Tier,
  afterRank: Division,
  afterLP: number
): number {
  return (
    rankToLP(afterTier, afterRank, afterLP) - rankToLP(beforeTier, beforeRank, beforeLP)
  );
}

export function tierToSpanish(tier: Tier): string {
  const map: Record<Tier, string> = {
    IRON: "Hierro",
    BRONZE: "Bronce",
    SILVER: "Plata",
    GOLD: "Oro",
    PLATINUM: "Platino",
    EMERALD: "Esmeralda",
    DIAMOND: "Diamante",
    MASTER: "Maestro",
    GRANDMASTER: "Gran Maestro",
    CHALLENGER: "Desafiante",
  };
  return map[tier] ?? tier;
}

export function tierColor(tier: Tier): string {
  const map: Record<Tier, string> = {
    IRON: "#8B8B8B",
    BRONZE: "#AD5E2E",
    SILVER: "#A0B4C0",
    GOLD: "#C89B3C",
    PLATINUM: "#4AADA2",
    EMERALD: "#2AAB74",
    DIAMOND: "#576BCE",
    MASTER: "#9D48E0",
    GRANDMASTER: "#E84057",
    CHALLENGER: "#F4C874",
  };
  return map[tier] ?? "#A0AEC0";
}

// ── Win Rate ──────────────────────────────────────────────────────────────────
export function calcWinRate(wins: number, losses: number): number {
  const total = wins + losses;
  if (total === 0) return 0;
  return Math.round((wins / total) * 100);
}

export function winRateColor(wr: number): string {
  if (wr >= 60) return "text-win";
  if (wr >= 50) return "text-yellow-400";
  return "text-loss";
}

// ── Numbers ───────────────────────────────────────────────────────────────────
export function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function formatPercent(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

// ── Tier List ─────────────────────────────────────────────────────────────────
export const TIER_LIST_ORDER = ["S", "A", "B", "C", "D"] as const;

export function tierListColor(tier: string): string {
  const map: Record<string, string> = {
    S: "#C89B3C",
    A: "#4CAF7D",
    B: "#0BC4B9",
    C: "#A0AEC0",
    D: "#E84057",
  };
  return map[tier] ?? "#A0AEC0";
}

// ── DDragon URLs ──────────────────────────────────────────────────────────────
export function ddragonVersion(patch: string): string {
  // Convert "14.24.1" → "14.24.1" (already correct for DDragon)
  return patch;
}

// ── Region Routing ────────────────────────────────────────────────────────────
export function regionToCluster(region: string): string {
  const map: Record<string, string> = {
    la1: "americas",
    la2: "americas",
    na1: "americas",
    br1: "americas",
    euw1: "europe",
    eune1: "europe",
    tr1: "europe",
    ru: "europe",
    kr: "asia",
    jp1: "asia",
    oc1: "sea",
  };
  return map[region.toLowerCase()] ?? "americas";
}

export function regionLabel(region: string): string {
  const map: Record<string, string> = {
    la1: "LA Norte",
    la2: "LA Sur",
    na1: "NA",
    br1: "BR",
    euw1: "EUW",
    eune1: "EUNE",
    kr: "KR",
    jp1: "JP",
    oc1: "OCE",
  };
  return map[region.toLowerCase()] ?? region.toUpperCase();
}

// ── Damage type analysis ──────────────────────────────────────────────────────
export type DamageType = "AP" | "AD" | "MIXED";

export function analyzeDamageType(champions: string[]): DamageType {
  // AP champions (rough heuristic)
  const apChampions = new Set([
    "Lux", "Annie", "Syndra", "Orianna", "Viktor", "Vex", "Akali", "Zoe",
    "Xerath", "Vel'Koz", "Brand", "Zyra", "Morgana", "Lissandra", "Twisted Fate",
    "Cassiopeia", "Malzahar", "Ahri", "Leblanc", "Katarina", "Diana",
    "Ekko", "Fizz", "Sylas", "Vladimir", "Rumble", "Swain", "Karthus",
    "Neeko", "Seraphine", "Taliyah", "Aurelion Sol", "Hwei", "Smolder",
    "Elise", "Fiddlesticks", "Maokai", "Amumu", "Cho'Gath", "Galio",
    "Gragas", "Nunu & Willump", "Jarvan IV", "Kennen", "Mordekaiser",
    "Sion", "Soraka", "Janna", "Karma", "Nami", "Sona", "Zilean",
    "Bard", "Thresh", "Blitzcrank", "Leona", "Nautilus",
  ]);

  const apCount = champions.filter(c => apChampions.has(c)).length;
  const adCount = champions.length - apCount;

  if (apCount >= Math.ceil(champions.length * 0.6)) return "AP";
  if (adCount >= Math.ceil(champions.length * 0.6)) return "AD";
  return "MIXED";
}
