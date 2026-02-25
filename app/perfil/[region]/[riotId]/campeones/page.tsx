import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAccountByRiotId, getMatchIds, getMatch } from "@/lib/riot";
import { getCachedMatch, setCachedMatch } from "@/lib/supabase";
import { ChampionStatsTable } from "@/components/profile/ChampionStatsTable";
import type { ProcessedMatch, ParticipantDTO } from "@/types/match";

interface Props {
  params: Promise<{ region: string; riotId: string }>;
}

function parseRiotId(encoded: string) {
  const decoded = decodeURIComponent(encoded);
  const [name, tag] = decoded.split("#");
  return { gameName: name ?? decoded, tagLine: tag ?? "" };
}

function processParticipant(p: ParticipantDTO, matchId: string, gameDuration: number, queueId: number): ProcessedMatch {
  return {
    matchId,
    champion: p.championName,
    championId: p.championId,
    kills: p.kills,
    deaths: p.deaths,
    assists: p.assists,
    kda: p.deaths === 0 ? p.kills + p.assists : (p.kills + p.assists) / p.deaths,
    cs: p.totalMinionsKilled + p.neutralMinionsKilled,
    csPerMin: gameDuration > 0 ? (p.totalMinionsKilled + p.neutralMinionsKilled) / (gameDuration / 60) : 0,
    visionScore: p.visionScore,
    goldEarned: p.goldEarned,
    totalDamageToChampions: p.totalDamageDealtToChampions,
    items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5],
    trinket: p.item6,
    summoner1Id: p.summoner1Id,
    summoner2Id: p.summoner2Id,
    win: p.win,
    gameMode: "",
    queueId,
    gameDuration,
    gameCreation: 0,
    teamPosition: p.teamPosition || p.individualPosition,
    champLevel: p.champLevel,
    primaryRune: p.perks?.styles?.[0]?.selections?.[0]?.perk ?? 0,
    perks: p.perks,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { riotId, region } = await params;
  const { gameName } = parseRiotId(riotId);
  return {
    title: `${gameName} — Estadísticas por Campeón`,
  };
}

export default async function ChampionStatsPage({ params }: Props) {
  const { region, riotId } = await params;
  const { gameName, tagLine } = parseRiotId(riotId);

  if (!tagLine) notFound();

  let account;
  try {
    account = await getAccountByRiotId(gameName, tagLine, region);
  } catch {
    notFound();
  }

  // Fetch last 50 matches for aggregated stats
  const matchIds = await getMatchIds(account.puuid, region, { count: 50 }).catch(() => []);

  const matchResults = await Promise.allSettled(
    matchIds.map(async (matchId) => {
      const cached = await getCachedMatch(matchId);
      if (cached) return cached;
      const match = await getMatch(matchId, region);
      setCachedMatch(matchId, region, match).catch(() => {});
      return match;
    })
  );

  const processed: ProcessedMatch[] = [];
  for (const result of matchResults) {
    if (result.status !== "fulfilled") continue;
    const match = result.value;
    const p = match.info.participants.find(p => p.puuid === account.puuid);
    if (!p) continue;
    const pm = processParticipant(p, match.metadata.matchId, match.info.gameDuration, match.info.queueId);
    pm.gameCreation = match.info.gameCreation;
    processed.push(pm);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 lg:px-6">
      <div className="mb-6">
        <a
          href={`/perfil/${region}/${riotId}`}
          className="text-sm text-[#A0AEC0] hover:text-[#C89B3C] transition-colors"
        >
          ← Volver al perfil
        </a>
        <h1 className="mt-2 text-xl font-bold text-[#F0E6D3]">
          Estadísticas por Campeón
        </h1>
        <p className="text-sm text-muted-foreground">Últimas {processed.length} partidas</p>
      </div>

      <ChampionStatsTable matches={processed} />
    </div>
  );
}
