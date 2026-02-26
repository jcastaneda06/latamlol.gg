import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { MatchDTO } from "@/types/match";
import type { LeagueEntryDTO, SummonerDTO } from "@/types/riot";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

function getAdminClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

// ── Match Cache ───────────────────────────────────────────────────────────────
const MATCH_TTL_DAYS = 7;

export async function getCachedMatch(matchId: string): Promise<MatchDTO | null> {
  if (!supabaseUrl || !supabaseKey) return null;
  try {
    const { data, error } = await supabase
      .from("match_cache")
      .select("data, cached_at")
      .eq("match_id", matchId)
      .single();

    if (error || !data) return null;

    const age = Date.now() - new Date(data.cached_at).getTime();
    if (age > MATCH_TTL_DAYS * 86400 * 1000) return null;

    return data.data as MatchDTO;
  } catch {
    return null;
  }
}

export async function setCachedMatch(matchId: string, region: string, data: MatchDTO): Promise<void> {
  if (!supabaseUrl || !supabaseKey) return;
  try {
    const client = getAdminClient() ?? supabase;
    await client.from("match_cache").upsert({
      match_id: matchId,
      region,
      data,
      cached_at: new Date().toISOString(),
    });
    indexMatchParticipants(region, data).catch(() => {});
  } catch {
    // Cache write failure is non-fatal
  }
}

// Index match participants for summoner prefix search
async function indexMatchParticipants(region: string, match: MatchDTO): Promise<void> {
  const client = getAdminClient() ?? supabase;
  if (!match.info?.participants?.length) return;
  const platform = (match.info.platformId ?? region).toLowerCase().replace(/^na$/, "na1").replace(/^la$/, "la1");
  const rows = match.info.participants
    .filter(p => p.riotIdGameName && p.riotIdTagline)
    .map(p => ({
      puuid: p.puuid,
      region: platform,
      riot_id: `${p.riotIdGameName}#${p.riotIdTagline}`,
      profile_icon_id: p.profileIcon ?? 0,
      last_seen: new Date().toISOString(),
    }));
  if (rows.length === 0) return;
  try {
    await client.from("summoner_search").upsert(rows, { onConflict: "puuid,region" });
  } catch {
    // Non-fatal
  }
}

export type SummonerSearchResult = {
  riot_id: string;
  region: string;
  profile_icon_id: number;
};

export async function indexSummonerFromProfile(
  puuid: string,
  region: string,
  riotId: string,
  profileIconId: number
): Promise<void> {
  const client = getAdminClient() ?? supabase;
  if (!supabaseUrl) return;
  try {
    const platform = region.toLowerCase().replace(/^na$/, "na1").replace(/^la$/, "la1");
    await client.from("summoner_search").upsert(
      {
        puuid,
        region: platform,
        riot_id: riotId,
        profile_icon_id: profileIconId,
        last_seen: new Date().toISOString(),
      },
      { onConflict: "puuid,region" }
    );
  } catch {
    // Non-fatal
  }
}

function normalizeRegion(region: string): string {
  const r = (region || "la1").toLowerCase();
  if (r === "na") return "na1";
  if (r === "la") return "la1";
  return r;
}

export async function searchSummoners(
  region: string,
  prefix: string,
  limit = 15
): Promise<SummonerSearchResult[]> {
  if (!supabaseUrl || !supabaseKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[searchSummoners] SUPABASE_URL or SUPABASE_ANON_KEY not set");
    }
    return [];
  }
  const q = prefix.trim();
  if (!q.length) return [];
  const platform = normalizeRegion(region);
  try {
    const { data, error } = await supabase
      .from("summoner_search")
      .select("riot_id, region, profile_icon_id")
      .eq("region", platform)
      .ilike("riot_id", `${q}%`)
      .order("riot_id")
      .limit(limit);
    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[searchSummoners] Supabase error:", error.message, error.details);
      }
      return [];
    }
    return (data ?? []) as SummonerSearchResult[];
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[searchSummoners] Exception:", err);
    }
    return [];
  }
}

// ── Summoner Cache ────────────────────────────────────────────────────────────
const SUMMONER_TTL_MIN = 10;

export async function getCachedSummoner(
  puuid: string
): Promise<{ summoner: SummonerDTO; ranked: LeagueEntryDTO[] } | null> {
  if (!supabaseUrl || !supabaseKey) return null;
  try {
    const { data, error } = await supabase
      .from("summoner_cache")
      .select("summoner_data, ranked_data, cached_at")
      .eq("puuid", puuid)
      .single();

    if (error || !data) return null;

    const age = Date.now() - new Date(data.cached_at).getTime();
    if (age > SUMMONER_TTL_MIN * 60 * 1000) return null;

    return {
      summoner: data.summoner_data as SummonerDTO,
      ranked: (data.ranked_data as LeagueEntryDTO[]) ?? [],
    };
  } catch {
    return null;
  }
}

export async function setCachedSummoner(
  puuid: string,
  region: string,
  summoner: SummonerDTO,
  ranked: LeagueEntryDTO[]
): Promise<void> {
  if (!supabaseUrl || !supabaseKey) return;
  try {
    await supabase.from("summoner_cache").upsert({
      puuid,
      region,
      summoner_data: summoner,
      ranked_data: ranked,
      cached_at: new Date().toISOString(),
    });
  } catch {
    // Non-fatal
  }
}

// ── Champion Data Cache ───────────────────────────────────────────────────────
const CHAMPION_TTL_HOURS = 24;

export async function getCachedChampionData(
  championId: string,
  patchVersion: string
): Promise<{ ddragon: unknown; meraki: unknown } | null> {
  if (!supabaseUrl || !supabaseKey) return null;
  try {
    const { data, error } = await supabase
      .from("champion_data_cache")
      .select("ddragon_data, meraki_data, cached_at")
      .eq("champion_id", championId)
      .eq("patch_version", patchVersion)
      .single();

    if (error || !data) return null;

    const age = Date.now() - new Date(data.cached_at).getTime();
    if (age > CHAMPION_TTL_HOURS * 3600 * 1000) return null;

    return { ddragon: data.ddragon_data, meraki: data.meraki_data };
  } catch {
    return null;
  }
}

export async function setCachedChampionData(
  championId: string,
  patchVersion: string,
  ddragonData: unknown,
  merakiData: unknown
): Promise<void> {
  if (!supabaseUrl || !supabaseKey) return;
  try {
    await supabase.from("champion_data_cache").upsert({
      champion_id: championId,
      patch_version: patchVersion,
      ddragon_data: ddragonData,
      meraki_data: merakiData,
      cached_at: new Date().toISOString(),
    });
  } catch {
    // Non-fatal
  }
}

// ── Tier List Cache ───────────────────────────────────────────────────────────
const TIER_LIST_TTL_HOURS = 6;

export async function getCachedTierList(
  patchVersion: string,
  queueType: string
): Promise<unknown | null> {
  if (!supabaseUrl || !supabaseKey) return null;
  try {
    const { data, error } = await supabase
      .from("tier_list_cache")
      .select("data, cached_at")
      .eq("patch_version", patchVersion)
      .eq("queue_type", queueType)
      .single();

    if (error || !data) return null;

    const age = Date.now() - new Date(data.cached_at).getTime();
    if (age > TIER_LIST_TTL_HOURS * 3600 * 1000) return null;

    return data.data;
  } catch {
    return null;
  }
}

export async function setCachedTierList(
  patchVersion: string,
  queueType: string,
  tierData: unknown
): Promise<void> {
  if (!supabaseUrl || !supabaseKey) return;
  try {
    const client = getAdminClient() ?? supabase;
    await client.from("tier_list_cache").upsert({
      patch_version: patchVersion,
      queue_type: queueType,
      data: tierData,
      cached_at: new Date().toISOString(),
    });
  } catch {
    // Non-fatal
  }
}

// ── Patch Notes Cache ─────────────────────────────────────────────────────────
export async function getCachedPatchNotes(version: string): Promise<unknown | null> {
  if (!supabaseUrl || !supabaseKey) return null;
  try {
    const { data, error } = await supabase
      .from("patch_notes")
      .select("*")
      .eq("version", version)
      .single();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

export async function setCachedPatchNotes(patchData: {
  version: string;
  title: string;
  url: string;
  content_html: string;
  highlights: unknown;
  published_at: string | null;
}): Promise<void> {
  if (!supabaseUrl || !supabaseKey) return;
  try {
    await supabase.from("patch_notes").upsert({
      ...patchData,
      scraped_at: new Date().toISOString(),
    });
  } catch {
    // Non-fatal
  }
}

export async function listPatchNotes(): Promise<unknown[]> {
  if (!supabaseUrl || !supabaseKey) return [];
  try {
    const { data } = await supabase
      .from("patch_notes")
      .select("version, title, url, published_at, highlights")
      .order("published_at", { ascending: false })
      .limit(20);
    return data ?? [];
  } catch {
    return [];
  }
}

// ── Rank Snapshots (for LP delta calculation) ───────────────────────────────────

export type RankSnapshot = {
  queue_type: string;
  tier: string;
  rank: string;
  league_points: number;
  wins: number;
  losses: number;
  fetched_at: string;
};

export async function insertRankSnapshot(
  puuid: string,
  region: string,
  entry: { queueType: string; tier: string; rank: string; leaguePoints: number; wins: number; losses: number }
): Promise<void> {
  const client = getAdminClient() ?? supabase;
  if (!supabaseUrl) return;
  const platform = normalizeRegion(region);
  try {
    await client.from("rank_snapshots").insert({
      puuid,
      region: platform,
      queue_type: entry.queueType,
      tier: entry.tier,
      rank: entry.rank || "I",
      league_points: entry.leaguePoints,
      wins: entry.wins,
      losses: entry.losses,
    });
  } catch {
    /* non-fatal */
  }
}

export async function getRankSnapshots(
  puuid: string,
  region: string
): Promise<RankSnapshot[]> {
  if (!supabaseUrl || !supabaseKey) return [];
  const platform = normalizeRegion(region);
  try {
    const { data, error } = await supabase
      .from("rank_snapshots")
      .select("queue_type, tier, rank, league_points, wins, losses, fetched_at")
      .eq("puuid", puuid)
      .eq("region", platform)
      .order("fetched_at", { ascending: true });
    if (error) return [];
    return (data ?? []) as RankSnapshot[];
  } catch {
    return [];
  }
}
