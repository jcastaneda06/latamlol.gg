import type { MerakiChampionStats, MerakiChampionBuild, ChampionRole, ChampionTier } from "@/types/champion";

const MERAKI_BASE = "https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US";

// ── Raw Meraki Types ──────────────────────────────────────────────────────────
interface MerakiRawChampion {
  id: number;
  key: string;
  name: string;
  positions: string[]; // e.g. ["TOP"], ["MIDDLE", "BOTTOM"]
}

interface MerakiRatesData {
  patch: string;
  data: Record<string, Record<string, { playRate: number }>>;
}

// champions.json roles: TOP | JUNGLE | MIDDLE | BOTTOM | UTILITY
const ROLE_MAP: Record<string, ChampionRole> = {
  TOP: "top",
  JUNGLE: "jungle",
  MIDDLE: "mid",
  BOTTOM: "adc",
  UTILITY: "support",
};

// ── Tier List ─────────────────────────────────────────────────────────────────
export async function getMerakiTierList(): Promise<MerakiChampionStats[]> {
  try {
    const res = await fetch(`${MERAKI_BASE}/champions.json`, {
      next: { revalidate: 21600 }, // 6 hours
    });

    if (!res.ok) throw new Error(`Meraki fetch failed: ${res.status}`);
    const data: Record<string, MerakiRawChampion> = await res.json();

    const result: MerakiChampionStats[] = [];

    for (const [, champ] of Object.entries(data)) {
      const roles = champ.stats?.roles ?? {};

      for (const [roleKey, roleStats] of Object.entries(roles)) {
        const role = ROLE_MAP[roleKey];
        if (!role) continue;
        if (roleStats.games < 100) continue; // Skip insignificant sample sizes

        const winRate = roleStats.games > 0 ? (roleStats.wins / roleStats.games) * 100 : 0;
        const kda = roleStats.deaths > 0
          ? (roleStats.kills + roleStats.assists) / roleStats.deaths
          : roleStats.kills + roleStats.assists;

        result.push({
          championId: champ.id,
          championName: champ.name,
          role,
          tier: normalizeTier(roleStats.tier),
          winRate: parseFloat(winRate.toFixed(2)),
          pickRate: parseFloat((roleStats.playRate * 100).toFixed(2)),
          banRate: parseFloat((roleStats.banRate * 100).toFixed(2)),
          kda: parseFloat(kda.toFixed(2)),
          averageKills: parseFloat(roleStats.kills.toFixed(1)),
          averageDeaths: parseFloat(roleStats.deaths.toFixed(1)),
          averageAssists: parseFloat(roleStats.assists.toFixed(1)),
          games: roleStats.games,
        });
      }
    }

    // Sort: tier S→D, then by win rate descending
    return result.sort((a, b) => {
      const tierOrder: Record<ChampionTier, number> = { S: 0, A: 1, B: 2, C: 3, D: 4 };
      const tierDiff = (tierOrder[a.tier] ?? 5) - (tierOrder[b.tier] ?? 5);
      if (tierDiff !== 0) return tierDiff;
      return b.winRate - a.winRate;
    });
  } catch {
    return [];
  }
}

// ── Champion Build ────────────────────────────────────────────────────────────
export async function getMerakiChampionBuild(
  championId: string,
  role?: ChampionRole
): Promise<MerakiChampionBuild | null> {
  try {
    const res = await fetch(
      `${MERAKI_BASE}/champions/${championId}.json`,
      { next: { revalidate: 21600 } }
    );
    if (!res.ok) return null;

    const champ: MerakiRawChampion = await res.json();
    const roles = champ.stats?.roles ?? {};

    // Find the best role to show (requested role or highest play rate)
    let targetRoleKey: string | null = null;
    if (role) {
      const reversed = Object.entries(ROLE_MAP).find(([, v]) => v === role)?.[0];
      if (reversed && roles[reversed]) targetRoleKey = reversed;
    }
    if (!targetRoleKey) {
      targetRoleKey = Object.entries(roles).sort(([, a], [, b]) => b.games - a.games)[0]?.[0] ?? null;
    }
    if (!targetRoleKey) return null;

    const roleStats = roles[targetRoleKey];
    const winRate = roleStats.games > 0 ? (roleStats.wins / roleStats.games) * 100 : 0;

    // Extract items
    const starters = roleStats.items?.starters?.ids ?? [];
    const coreItems = roleStats.items?.coreBuilds?.[0]?.ids ?? [];
    const boots = coreItems.find(id => isBoots(id)) ?? 0;
    const core = coreItems.filter(id => !isBoots(id)).slice(0, 3);
    const situational = roleStats.items?.coreBuilds?.[1]?.ids?.filter(id => !core.includes(id)).slice(0, 3) ?? [];

    // Extract runes
    const runePerks = roleStats.runes?.generalPerks?.rows ?? [];
    const primaryRune = runePerks[0]?.[0] ?? 0;
    const secondaryRunes = [
      runePerks[1]?.[0],
      runePerks[2]?.[0],
      runePerks[3]?.[0],
    ].filter(Boolean) as number[];

    // Extract summoner spells
    const topSummoners = roleStats.summoners?.[0];
    const spells: [number, number] = [topSummoners?.spell1 ?? 4, topSummoners?.spell2 ?? 14];

    return {
      championId: champ.id,
      championName: champ.name,
      role: ROLE_MAP[targetRoleKey] ?? "mid",
      winRate: parseFloat(winRate.toFixed(2)),
      pickRate: parseFloat((roleStats.playRate * 100).toFixed(2)),
      games: roleStats.games,
      items: { starters, core, boots, situational },
      runes: {
        primaryStyle: roleStats.runes?.overallStyle ?? 0,
        primaryRune,
        secondaryRunes,
        secondaryStyle: roleStats.runes?.subStyle ?? 0,
        shards: [],
      },
      summonerSpells: spells,
      skillOrder: ["Q", "W", "E", "R"], // Default — Meraki doesn't always provide this
      matchups: {
        best: (roleStats.best ?? []).slice(0, 5).map(m => ({
          championId: m.championId,
          winRate: m.games > 0 ? (m.wins / m.games) * 100 : 50,
        })),
        worst: (roleStats.worst ?? []).slice(0, 5).map(m => ({
          championId: m.championId,
          winRate: m.games > 0 ? (m.wins / m.games) * 100 : 50,
        })),
      },
    };
  } catch {
    return null;
  }
}

// ── Counter-build suggestion ──────────────────────────────────────────────────
export async function getSuggestedBuild(
  playerChampionId: string,
  enemyChampions: string[],
  playerRole?: ChampionRole
): Promise<{ build: MerakiChampionBuild | null; reason: string }> {
  const build = await getMerakiChampionBuild(playerChampionId, playerRole);
  if (!build) return { build: null, reason: "" };

  const { analyzeDamageType } = await import("@/lib/utils");
  const damageType = analyzeDamageType(enemyChampions);

  let reason = "Construcción óptima para la composición enemiga";
  if (damageType === "AP") reason = "El equipo enemigo es mayoría mago — prioriza resistencia mágica";
  else if (damageType === "AD") reason = "El equipo enemigo es mayoría físico — prioriza armadura";

  return { build, reason };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function normalizeTier(rawTier: string): ChampionTier {
  if (!rawTier) return "C";
  const t = rawTier.toUpperCase().charAt(0) as ChampionTier;
  if (["S", "A", "B", "C", "D"].includes(t)) return t;
  return "C";
}

const BOOTS_IDS = new Set([
  1001, 3006, 3009, 3020, 3047, 3111, 3117, 3158,
]);

function isBoots(itemId: number): boolean {
  return BOOTS_IDS.has(itemId);
}
