export interface AccountDTO {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface SummonerDTO {
  id: string;
  accountId: string;
  puuid: string;
  name: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

export type Tier =
  | "IRON"
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "PLATINUM"
  | "EMERALD"
  | "DIAMOND"
  | "MASTER"
  | "GRANDMASTER"
  | "CHALLENGER";

export type Division = "I" | "II" | "III" | "IV";

export interface LeagueEntryDTO {
  leagueId: string;
  summonerId: string;
  summonerName: string;
  puuid?: string;
  queueType: string;
  tier: Tier;
  rank: Division;
  leaguePoints: number;
  wins: number;
  losses: number;
  hotStreak: boolean;
  veteran: boolean;
  freshBlood: boolean;
  inactive: boolean;
  miniSeries?: {
    losses: number;
    progress: string;
    target: number;
    wins: number;
  };
}

export interface LeagueListDTO {
  leagueId: string;
  entries: LeagueItemDTO[];
  tier: string;
  name: string;
  queue: string;
}

export interface LeagueItemDTO {
  freshBlood: boolean;
  wins: number;
  summonerName: string;
  miniSeries?: {
    losses: number;
    progress: string;
    target: number;
    wins: number;
  };
  inactive: boolean;
  veteran: boolean;
  hotStreak: boolean;
  rank: string;
  leaguePoints: number;
  losses: number;
  summonerId: string;
  puuid?: string;
}

export interface ChampionMasteryDTO {
  puuid: string;
  championPointsUntilNextLevel: number;
  chestGranted: boolean;
  championId: number;
  lastPlayTime: number;
  championLevel: number;
  summonerId: string;
  championPoints: number;
  championPointsSinceLastLevel: number;
  tokensEarned: number;
}

export interface CurrentGameInfoDTO {
  gameId: number;
  gameType: string;
  gameStartTime: number;
  mapId: number;
  gameLength: number;
  platformId: string;
  gameMode: string;
  gameQueueConfigId: number;
  participants: CurrentGameParticipantDTO[];
  bannedChampions: BannedChampionDTO[];
}

export interface CurrentGameParticipantDTO {
  teamId: number;
  spell1Id: number;
  spell2Id: number;
  championId: number;
  profileIconId: number;
  summonerName: string;
  bot: boolean;
  summonerId: string;
  puuid: string;
  perks?: {
    perkIds: number[];
    perkStyle: number;
    perkSubStyle: number;
  };
}

export interface BannedChampionDTO {
  pickTurn: number;
  championId: number;
  teamId: number;
}

export type Region = "la1" | "la2" | "na1" | "euw1" | "kr" | "br1";

export const REGION_LABELS: Record<Region, string> = {
  la1: "Latinoamérica Norte (LA1)",
  la2: "Latinoamérica Sur (LA2)",
  na1: "Norte América (NA)",
  euw1: "Europa Oeste (EUW)",
  kr: "Corea (KR)",
  br1: "Brasil (BR)",
};

export const REGION_TO_CLUSTER: Record<string, string> = {
  la1: "americas",
  la2: "americas",
  na1: "americas",
  br1: "americas",
  euw1: "europe",
  eune1: "europe",
  kr: "asia",
  jp1: "asia",
  oc1: "sea",
};
