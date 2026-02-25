export interface MatchDTO {
  metadata: {
    matchId: string;
    participants: string[];
  };
  info: MatchInfoDTO;
}

export interface MatchInfoDTO {
  gameCreation: number;
  gameDuration: number;
  gameEndTimestamp: number;
  gameId: number;
  gameMode: string;
  gameName: string;
  gameStartTimestamp: number;
  gameType: string;
  gameVersion: string;
  mapId: number;
  participants: ParticipantDTO[];
  platformId: string;
  queueId: number;
  teams: TeamDTO[];
  tournamentCode?: string;
}

export interface ParticipantDTO {
  allInPings: number;
  assistMePings: number;
  assists: number;
  baronKills: number;
  bountyLevel: number;
  champExperience: number;
  champLevel: number;
  championId: number;
  championName: string;
  championTransform: number;
  consumablesPurchased: number;
  damageDealtToBuildings: number;
  damageDealtToObjectives: number;
  damageDealtToTurrets: number;
  damageSelfMitigated: number;
  deaths: number;
  detectorWardsPlaced: number;
  doubleKills: number;
  dragonKills: number;
  eligibleForProgression: boolean;
  firstBloodAssist: boolean;
  firstBloodKill: boolean;
  firstTowerAssist: boolean;
  firstTowerKill: boolean;
  gameEndedInEarlySurrender: boolean;
  gameEndedInSurrender: boolean;
  goldEarned: number;
  goldSpent: number;
  individualPosition: string;
  inhibitorKills: number;
  inhibitorTakedowns: number;
  inhibitorsLost: number;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  itemsPurchased: number;
  killingSprees: number;
  kills: number;
  lane: string;
  largestCriticalStrike: number;
  largestKillingSpree: number;
  largestMultiKill: number;
  longestTimeSpentLiving: number;
  magicDamageDealt: number;
  magicDamageDealtToChampions: number;
  magicDamageTaken: number;
  neutralMinionsKilled: number;
  nexusKills: number;
  nexusLost: number;
  nexusTakedowns: number;
  objectivesStolen: number;
  objectivesStolenAssists: number;
  participantId: number;
  pentaKills: number;
  perks: {
    statPerks: { defense: number; flex: number; offense: number };
    styles: Array<{
      description: string;
      selections: Array<{ perk: number; var1: number; var2: number; var3: number }>;
      style: number;
    }>;
  };
  physicalDamageDealt: number;
  physicalDamageDealtToChampions: number;
  physicalDamageTaken: number;
  profileIcon: number;
  puuid: string;
  quadraKills: number;
  riotIdGameName: string;
  riotIdTagline: string;
  role: string;
  sightWardsBoughtInGame: number;
  spell1Casts: number;
  spell2Casts: number;
  spell3Casts: number;
  spell4Casts: number;
  summoner1Casts: number;
  summoner1Id: number;
  summoner2Casts: number;
  summoner2Id: number;
  summonerId: string;
  summonerLevel: number;
  summonerName: string;
  teamEarlySurrendered: boolean;
  teamId: number;
  teamPosition: string;
  timeCCingOthers: number;
  timePlayed: number;
  totalAllyJungleMinionsKilled: number;
  totalDamageDealt: number;
  totalDamageDealtToChampions: number;
  totalDamageShieldedOnTeammates: number;
  totalDamageTaken: number;
  totalEnemyJungleMinionsKilled: number;
  totalHeal: number;
  totalHealsOnTeammates: number;
  totalMinionsKilled: number;
  totalTimeCCDealt: number;
  totalTimeSpentDead: number;
  totalUnitsHealed: number;
  tripleKills: number;
  trueDamageDealt: number;
  trueDamageDealtToChampions: number;
  trueDamageTaken: number;
  turretKills: number;
  turretTakedowns: number;
  turretsLost: number;
  unrealKills: number;
  visionScore: number;
  visionWardsBoughtInGame: number;
  wardsKilled: number;
  wardsPlaced: number;
  win: boolean;
}

export interface TeamDTO {
  bans: Array<{ championId: number; pickTurn: number }>;
  objectives: Record<string, { first: boolean; kills: number }>;
  teamId: number;
  win: boolean;
}

export const QUEUE_MAP: Record<number, string> = {
  420: "Solo/Dúo",
  440: "Flexible",
  450: "ARAM",
  400: "Normal Borrador",
  430: "Normal Ciega",
  490: "Quickness",
  700: "Enfrentamientos de clubes",
  720: "ARAM Clasificatoria",
  900: "URF",
  1900: "URF",
  1020: "Un por uno",
  1300: "Nexus Blitz",
  1700: "Arena",
  1400: "Definitiva de Esencia",
};

export const QUEUE_SHORT: Record<number, string> = {
  420: "Solo",
  440: "Flex",
  450: "ARAM",
  400: "Normal",
  430: "Normal",
  490: "Normal",
  700: "Clubes",
  720: "ARAM",
  900: "URF",
  1900: "URF",
  1020: "1v1",
  1300: "NB",
  1700: "Arena",
  1400: "Esencia",
};

export interface ProcessedMatch {
  matchId: string;
  champion: string;
  championId: number;
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  cs: number;
  csPerMin: number;
  visionScore: number;
  goldEarned: number;
  totalDamageToChampions: number;
  items: number[];
  trinket: number;
  summoner1Id: number;
  summoner2Id: number;
  win: boolean;
  gameMode: string;
  queueId: number;
  gameDuration: number;
  gameCreation: number;
  teamPosition: string;
  champLevel: number;
  primaryRune: number;
  perks: ParticipantDTO["perks"];
}
