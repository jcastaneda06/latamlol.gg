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
    const [champsRes, ratesRes] = await Promise.all([
      fetch(`${MERAKI_BASE}/champions.json`, { next: { revalidate: 21600 } }),
      fetch(`${MERAKI_BASE}/championrates.json`, { next: { revalidate: 21600 } }),
    ]);

    if (!champsRes.ok || !ratesRes.ok) throw new Error("Meraki fetch failed");

    const champsData: Record<string, MerakiRawChampion> = await champsRes.json();
    const ratesData: MerakiRatesData = await ratesRes.json();

    const result: MerakiChampionStats[] = [];

    for (const champ of Object.values(champsData)) {
      const champRates = ratesData.data[String(champ.id)];
      if (!champRates) continue;

      for (const position of champ.positions) {
        const role = ROLE_MAP[position];
        if (!role) continue;
        const playRate = champRates[position]?.playRate ?? 0;
        if (playRate <= 0) continue;

        result.push({
          championId: champ.key,
          championName: champ.name,
          role,
          tier: "B" as ChampionTier, // assigned below via percentile
          winRate: 0,
          pickRate: parseFloat(playRate.toFixed(2)),
          banRate: 0,
          kda: 0,
          averageKills: 0,
          averageDeaths: 0,
          averageAssists: 0,
          games: 0,
        });
      }
    }

    // Assign tier based on play rate percentile within each role
    const allRoles: ChampionRole[] = ["top", "jungle", "mid", "adc", "support"];
    for (const role of allRoles) {
      const byRole = result
        .filter(e => e.role === role)
        .sort((a, b) => b.pickRate - a.pickRate);
      const n = byRole.length;
      byRole.forEach((entry, idx) => {
        const pct = idx / n;
        if (pct < 0.10) entry.tier = "S";
        else if (pct < 0.25) entry.tier = "A";
        else if (pct < 0.50) entry.tier = "B";
        else if (pct < 0.75) entry.tier = "C";
        else entry.tier = "D";
      });
    }

    // Sort: tier S→D, then by pickRate descending
    const tierOrder: Record<ChampionTier, number> = { S: 0, A: 1, B: 2, C: 3, D: 4 };
    return result.sort((a, b) => {
      const td = (tierOrder[a.tier] ?? 5) - (tierOrder[b.tier] ?? 5);
      if (td !== 0) return td;
      return b.pickRate - a.pickRate;
    });
  } catch {
    return [];
  }
}

// ── Champion Build ────────────────────────────────────────────────────────────
// Meraki Analytics does not expose per-champion build data (items/runes/matchups).
// This returns null until an alternative build data source is integrated.
export async function getMerakiChampionBuild(
  _championId: string,
  _role?: ChampionRole
): Promise<MerakiChampionBuild | null> {
  return null;
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

