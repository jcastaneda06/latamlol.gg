export interface DDragonChampionSummary {
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: {
    attack: number;
    defense: number;
    magic: number;
    difficulty: number;
  };
  image: {
    full: string;
    sprite: string;
    group: string;
    x: number;
    y: number;
    w: number;
    h: number;
  };
  tags: string[];
  partype: string;
  stats: Record<string, number>;
}

export interface DDragonChampionData {
  id: string;
  key: string;
  name: string;
  title: string;
  lore: string;
  blurb: string;
  tags: string[];
  partype: string;
  info: {
    attack: number;
    defense: number;
    magic: number;
    difficulty: number;
  };
  image: {
    full: string;
    sprite: string;
    group: string;
  };
  skins: Array<{
    id: string;
    num: number;
    name: string;
    chromas: boolean;
  }>;
  spells: Array<{
    id: string;
    name: string;
    description: string;
    tooltip: string;
    image: { full: string };
    costBurn: string;
    cooldownBurn: string;
    rangeBurn: string;
  }>;
  passive: {
    name: string;
    description: string;
    image: { full: string };
  };
  stats: Record<string, number>;
}

export type ChampionRole = "top" | "jungle" | "mid" | "adc" | "support";
export type ChampionTier = "S" | "A" | "B" | "C" | "D";

export interface MerakiChampionStats {
  championId: string;
  championName: string;
  role: ChampionRole;
  tier: ChampionTier;
  winRate: number;
  pickRate: number;
  banRate: number;
  kda: number;
  averageKills: number;
  averageDeaths: number;
  averageAssists: number;
  games: number;
}

export interface MerakiItemBuild {
  starters: number[];
  core: number[];
  boots: number;
  situational: number[];
}

export interface MerakiRunePage {
  primaryStyle: number;
  primaryRune: number;
  secondaryRunes: number[];
  secondaryStyle: number;
  shards: number[];
}

export interface MerakiChampionBuild {
  championId: string;
  championName: string;
  role: ChampionRole;
  winRate: number;
  pickRate: number;
  games: number;
  items: MerakiItemBuild;
  runes: MerakiRunePage;
  summonerSpells: [number, number];
  skillOrder: string[];
  matchups: {
    best: Array<{ championId: string; winRate: number }>;
    worst: Array<{ championId: string; winRate: number }>;
  };
}

export interface DDragonItem {
  name: string;
  description: string;
  image: { full: string };
  gold: { total: number; sell: number };
  tags: string[];
}

export interface DDragonRune {
  id: number;
  key: string;
  icon: string;
  name: string;
  shortDesc: string;
  longDesc: string;
}

export interface DDragonRuneStyle {
  id: number;
  key: string;
  icon: string;
  name: string;
  slots: Array<{
    runes: DDragonRune[];
  }>;
}

export interface TierListEntry extends MerakiChampionStats {
  championData?: DDragonChampionSummary;
}
