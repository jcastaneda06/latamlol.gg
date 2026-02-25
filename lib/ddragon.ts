import type { DDragonChampionData, DDragonChampionSummary, DDragonItem, DDragonRuneStyle } from "@/types/champion";

const DDRAGON_BASE = "https://ddragon.leagueoflegends.com";
// Pin Community Dragon version—ranked emblems path differs across versions; 15.x has ranked-emblem/
const CDRAGON_BASE = "https://raw.communitydragon.org/15.9";

// Kept as a string so URL helpers always produce a valid DDragon URL even before
// getCurrentPatch() is called (e.g. client-side components on first render).
// DDragon stores all patch data permanently, so an older fallback is fine as a
// temporary stand-in until the real version is fetched.
let cachedPatchVersion = "15.1.1";

// ── Patch Version ─────────────────────────────────────────────────────────────
export async function getCurrentPatch(): Promise<string> {
  try {
    const res = await fetch(`${DDRAGON_BASE}/api/versions.json`, {
      next: { revalidate: 3600 },
    });
    const versions: string[] = await res.json();
    cachedPatchVersion = versions[0];
    return versions[0];
  } catch {
    return cachedPatchVersion;
  }
}

// ── Champion Data ─────────────────────────────────────────────────────────────
export async function getAllChampions(
  patch?: string
): Promise<Record<string, DDragonChampionSummary>> {
  const version = patch ?? (await getCurrentPatch());
  const res = await fetch(
    `${DDRAGON_BASE}/cdn/${version}/data/es_MX/champion.json`,
    { next: { revalidate: 86400 } }
  );
  const json = await res.json();
  return json.data as Record<string, DDragonChampionSummary>;
}

export async function getChampionById(championId: string, patch?: string): Promise<DDragonChampionData | null> {
  const version = patch ?? (await getCurrentPatch());
  try {
    const res = await fetch(
      `${DDRAGON_BASE}/cdn/${version}/data/es_MX/champion/${championId}.json`,
      { next: { revalidate: 86400 } }
    );
    const json = await res.json();
    return json.data[championId] as DDragonChampionData;
  } catch {
    return null;
  }
}

// Convert champion numeric ID to champion key name
let championIdMap: Record<number, string> | null = null;

export async function getChampionNameById(id: number, patch?: string): Promise<string> {
  if (!championIdMap) {
    const all = await getAllChampions(patch);
    championIdMap = {};
    for (const champ of Object.values(all)) {
      championIdMap[parseInt(champ.key)] = champ.id;
    }
  }
  return championIdMap[id] ?? "Unknown";
}

// ── Items ─────────────────────────────────────────────────────────────────────
export async function getAllItems(patch?: string): Promise<Record<string, DDragonItem>> {
  const version = patch ?? (await getCurrentPatch());
  const res = await fetch(
    `${DDRAGON_BASE}/cdn/${version}/data/es_MX/item.json`,
    { next: { revalidate: 86400 } }
  );
  const json = await res.json();
  return json.data as Record<string, DDragonItem>;
}

// ── Runes ─────────────────────────────────────────────────────────────────────
export async function getAllRunes(patch?: string): Promise<DDragonRuneStyle[]> {
  const version = patch ?? (await getCurrentPatch());
  const res = await fetch(
    `${DDRAGON_BASE}/cdn/${version}/data/es_MX/runesReforged.json`,
    { next: { revalidate: 86400 } }
  );
  return res.json();
}

// ── Summoner Spells ───────────────────────────────────────────────────────────
export async function getAllSummonerSpells(patch?: string): Promise<Record<string, { id: string; name: string; image: { full: string } }>> {
  const version = patch ?? (await getCurrentPatch());
  const res = await fetch(
    `${DDRAGON_BASE}/cdn/${version}/data/es_MX/summoner.json`,
    { next: { revalidate: 86400 } }
  );
  const json = await res.json();
  return json.data;
}

// ── Asset URL Helpers ─────────────────────────────────────────────────────────
export function championIconUrl(championId: string, patch?: string): string {
  // Splash tiles don't require a version — DDragon serves them as static assets
  return `${DDRAGON_BASE}/cdn/img/champion/tiles/${championId}_0.jpg`;
}

export function championSplashUrl(championId: string, skinNum = 0): string {
  return `${DDRAGON_BASE}/cdn/img/champion/splash/${championId}_${skinNum}.jpg`;
}

export function championLoadingUrl(championId: string, skinNum = 0): string {
  return `${DDRAGON_BASE}/cdn/img/champion/loading/${championId}_${skinNum}.jpg`;
}

export function itemIconUrl(itemId: number, patch?: string): string {
  if (!itemId) return "";
  const v = patch ?? cachedPatchVersion;
  return `${DDRAGON_BASE}/cdn/${v}/img/item/${itemId}.png`;
}

export function profileIconUrl(iconId: number, patch?: string): string {
  const v = patch ?? cachedPatchVersion;
  return `${DDRAGON_BASE}/cdn/${v}/img/profileicon/${iconId}.png`;
}

export function summonerSpellIconUrl(spellId: string, patch?: string): string {
  const v = patch ?? cachedPatchVersion;
  return `${DDRAGON_BASE}/cdn/${v}/img/spell/${spellId}.png`;
}

export function spellIconUrlById(spellKey: number, patch?: string): string {
  // Spell IDs: 4=Flash, 14=Ignite, 11=Smite, 12=Teleport, etc.
  const spellMap: Record<number, string> = {
    1: "SummonerBoost",
    3: "SummonerExhaust",
    4: "SummonerFlash",
    6: "SummonerHaste",
    7: "SummonerHeal",
    11: "SummonerSmite",
    12: "SummonerTeleport",
    13: "SummonerMana",
    14: "SummonerDot",
    21: "SummonerBarrier",
    32: "SummonerSnowball",
  };
  const name = spellMap[spellKey] ?? "SummonerFlash";
  return summonerSpellIconUrl(name, patch);
}

export function runeIconUrl(iconPath: string, patch?: string): string {
  if (iconPath.startsWith("http")) return iconPath;
  const v = patch ?? cachedPatchVersion;
  return `${DDRAGON_BASE}/cdn/${v}/img/${iconPath}`;
}

export function tierIconUrl(tier: string): string {
  return `${CDRAGON_BASE}/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem/emblem-${tier.toLowerCase()}.png`;
}

// ── Patch note thumbnail ──────────────────────────────────────────────────────
export function patchThumbnailUrl(version: string): string {
  const [major, minor] = version.split(".");
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Lux_0.jpg`;
  // Riot doesn't have a reliable pattern for patch thumbnails via DDragon
  void major; void minor;
}
