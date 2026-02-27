import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAccountByRiotId, getSummonerByPuuid, getLiveGame, getRankedByPuuid } from "@/lib/riot";
import { getChampionNameById } from "@/lib/ddragon";
import { getSuggestedBuild } from "@/lib/meraki";
import { LiveGameView } from "@/components/live/LiveGameView";
import { absoluteUrl } from "@/lib/seo";

interface Props {
  params: Promise<{ region: string; riotId: string }>;
}

function parseRiotId(encoded: string) {
  const decoded = decodeURIComponent(encoded);
  const [name, tag] = decoded.split("#");
  return { gameName: name ?? decoded, tagLine: tag ?? "" };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { riotId, region } = await params;
  const { gameName } = parseRiotId(riotId);
  const canonical = `/perfil/${region}/${riotId}/en-vivo`;
  const title = `${gameName} - Partida en Vivo`;
  const description = `Partida en vivo de ${gameName}: composiciones, rangos y recomendaciones en tiempo real.`;
  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(canonical),
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function LiveGamePage({ params }: Props) {
  const { region, riotId } = await params;
  const { gameName, tagLine } = parseRiotId(riotId);

  if (!tagLine) notFound();

  let account, summoner;
  try {
    account = await getAccountByRiotId(gameName, tagLine, region);
    summoner = await getSummonerByPuuid(account.puuid, region);
  } catch {
    notFound();
  }

  const game = await getLiveGame(summoner.id, region);

  if (!game) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center">
        <a
          href={`/perfil/${region}/${riotId}`}
          className="text-sm text-[#A0AEC0] hover:text-[#C89B3C] transition-colors"
        >
          ← Volver al perfil
        </a>
        <div className="mt-8 rounded-xl border border-[#1E2D40] bg-surface p-12">
          <p className="text-lg font-semibold text-[#F0E6D3]">{gameName} no está en partida</p>
          <p className="mt-2 text-sm text-muted-foreground">
            El invocador no tiene ninguna partida activa en este momento.
          </p>
        </div>
      </div>
    );
  }

  // Resolve champion names for all participants
  const championNames: Record<number, string> = {};
  await Promise.allSettled(
    game.participants.map(async p => {
      const name = await getChampionNameById(p.championId);
      championNames[p.championId] = name;
    })
  );

  // Find the searched player's champion
  const playerParticipant = game.participants.find(p => p.puuid === account.puuid);
  const playerChampionId = playerParticipant?.championId;
  const playerChampionName = playerChampionId ? (championNames[playerChampionId] ?? "") : "";

  // Get enemy team champions
  const playerTeamId = playerParticipant?.teamId;
  const enemyParticipants = game.participants.filter(p => p.teamId !== playerTeamId);
  const enemyChampionNames = enemyParticipants.map(p => championNames[p.championId] ?? "");

  // Get suggested build
  const { build: suggestedBuild, reason: buildReason } = playerChampionName
    ? await getSuggestedBuild(playerChampionName, enemyChampionNames)
    : { build: null, reason: "" };

  // Get ranks for all players
  const playerRanks: Record<string, { tier?: string; rank?: string; lp?: number }> = {};
  await Promise.allSettled(
    game.participants.map(async p => {
      try {
        const ranked = await getRankedByPuuid(p.puuid, region);
        const solo = ranked.find(e => e.queueType === "RANKED_SOLO_5x5");
        if (solo) {
          playerRanks[p.summonerId] = { tier: solo.tier, rank: solo.rank, lp: solo.leaguePoints };
        }
      } catch {
        // Rank not available
      }
    })
  );

  const gameDurationNow = Math.floor((Date.now() - game.gameStartTime) / 1000);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 lg:px-6">
      <div className="mb-4">
        <a
          href={`/perfil/${region}/${riotId}`}
          className="text-sm text-[#A0AEC0] hover:text-[#C89B3C] transition-colors"
        >
          ← Volver al perfil
        </a>
        <h1 className="mt-2 text-xl font-bold text-[#F0E6D3]">Partida en Vivo</h1>
      </div>

      <LiveGameView
        game={game}
        playerPuuid={account.puuid}
        suggestedBuild={suggestedBuild}
        buildReason={buildReason}
        playerRanks={playerRanks}
        championNames={championNames}
        gameDurationNow={gameDurationNow}
      />
    </div>
  );
}
