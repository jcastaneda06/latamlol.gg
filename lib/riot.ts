import "server-only";
import { RiotAPI, PlatformId, RiotAPITypes } from "@fightmegg/riot-api";
import type { AccountDTO, SummonerDTO, LeagueEntryDTO, ChampionMasteryDTO, CurrentGameInfoDTO } from "@/types/riot";
import type { MatchDTO } from "@/types/match";
import { regionToCluster } from "@/lib/utils";

// Client
function createRiotClient(): RiotAPI {
  const key = process.env.RIOT_API_KEY;
  if (!key) throw new Error("RIOT_API_KEY is not configured");
  return new RiotAPI(key);
}

// Account (Riot ID)
export async function getAccountByRiotId(
  gameName: string,
  tagLine: string,
  region: string
): Promise<AccountDTO> {
  const rAPI = createRiotClient();
  const cluster = regionToCluster(region) as Exclude<RiotAPITypes.Cluster, PlatformId.SEA>;
  return rAPI.account.getByRiotId({ region: cluster, gameName, tagLine }) as unknown as Promise<AccountDTO>;
}

export async function getAccountByPuuid(puuid: string, region: string): Promise<AccountDTO> {
  const rAPI = createRiotClient();
  const cluster = regionToCluster(region) as Exclude<RiotAPITypes.Cluster, PlatformId.SEA>;
  return rAPI.account.getByPUUID({ region: cluster, puuid }) as unknown as Promise<AccountDTO>;
}

// Summoner
export async function getSummonerByPuuid(puuid: string, region: string): Promise<SummonerDTO> {
  const rAPI = createRiotClient();
  return rAPI.summoner.getByPUUID({
    region: region as RiotAPITypes.LoLRegion,
    puuid,
  }) as unknown as Promise<SummonerDTO>;
}

export async function getSummonerById(summonerId: string, region: string): Promise<SummonerDTO> {
  const rAPI = createRiotClient();
  return rAPI.summoner.getBySummonerId({
    region: region as RiotAPITypes.LoLRegion,
    summonerId,
  }) as unknown as Promise<SummonerDTO>;
}

// Ranked
export async function getRankedByPuuid(puuid: string, region: string): Promise<LeagueEntryDTO[]> {
  const rAPI = createRiotClient();
  return rAPI.league.getEntriesByPUUID({
    region: region as RiotAPITypes.LoLRegion,
    puuid,
  }) as unknown as Promise<LeagueEntryDTO[]>;
}

// Match History
export async function getMatchIds(
  puuid: string,
  region: string,
  options: {
    start?: number;
    count?: number;
    queue?: number;
  } = {}
): Promise<string[]> {
  const rAPI = createRiotClient();
  const cluster = regionToCluster(region) as Exclude<RiotAPITypes.Cluster, PlatformId.ESPORTS>;
  return rAPI.matchV5.getIdsByPuuid({
    cluster,
    puuid,
    params: {
      start: options.start ?? 0,
      count: options.count ?? 20,
      queue: options.queue,
    },
  });
}

export async function getMatch(matchId: string, region: string): Promise<MatchDTO> {
  const rAPI = createRiotClient();
  const cluster = regionToCluster(region) as Exclude<RiotAPITypes.Cluster, PlatformId.ESPORTS>;
  return rAPI.matchV5.getMatchById({ cluster, matchId }) as unknown as Promise<MatchDTO>;
}

// Live Game
export async function getLiveGame(
  summonerId: string,
  region: string
): Promise<CurrentGameInfoDTO | null> {
  try {
    const rAPI = createRiotClient();
    return await (rAPI.spectator.getBySummonerId({
      region: region as RiotAPITypes.LoLRegion,
      summonerId,
    }) as unknown as Promise<CurrentGameInfoDTO>);
  } catch (err: unknown) {
    const e = err as { status?: number; statusCode?: number };
    if (e?.status === 404 || e?.statusCode === 404) return null;
    throw err;
  }
}

// Champion Mastery
export async function getMasteryByPuuid(
  puuid: string,
  region: string,
  count = 20
): Promise<ChampionMasteryDTO[]> {
  const rAPI = createRiotClient();
  const data = await (rAPI.championMastery.getTopChampions({
    region: region as RiotAPITypes.LoLRegion,
    summonerId: puuid,
    params: { count },
  }) as unknown as Promise<ChampionMasteryDTO[]>);
  return data;
}

export async function getChampionMastery(
  puuid: string,
  championId: number,
  region: string
): Promise<ChampionMasteryDTO | null> {
  const key = process.env.RIOT_API_KEY;
  if (!key) return null;

  try {
    const platform = (region || "la1").toLowerCase();
    const url = `https://${platform}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/by-champion/${championId}`;
    const res = await fetch(url, {
      headers: { "X-Riot-Token": key },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as ChampionMasteryDTO;
  } catch {
    return null;
  }
}

// Leaderboard
export async function getChallengerLeaderboard(region: string, queue = "RANKED_SOLO_5x5") {
  const rAPI = createRiotClient();
  return rAPI.league.getChallengerByQueue({
    region: region as RiotAPITypes.LoLRegion,
    queue: queue as RiotAPITypes.QUEUE,
  });
}

export async function getGrandmasterLeaderboard(region: string, queue = "RANKED_SOLO_5x5") {
  const rAPI = createRiotClient();
  return rAPI.league.getGrandmasterByQueue({
    region: region as RiotAPITypes.LoLRegion,
    queue: queue as RiotAPITypes.QUEUE,
  });
}

export async function getMasterLeaderboard(region: string, queue = "RANKED_SOLO_5x5") {
  const rAPI = createRiotClient();
  return rAPI.league.getMasterByQueue({
    region: region as RiotAPITypes.LoLRegion,
    queue: queue as RiotAPITypes.QUEUE,
  });
}
