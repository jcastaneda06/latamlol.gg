import { createClient } from "@supabase/supabase-js";
import type { MatchDTO } from "@/types/match";
import type { LeagueEntryDTO, SummonerDTO } from "@/types/riot";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

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
    await supabase.from("match_cache").upsert({
      match_id: matchId,
      region,
      data,
      cached_at: new Date().toISOString(),
    });
  } catch {
    // Cache write failure is non-fatal
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
    await supabase.from("tier_list_cache").upsert({
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
