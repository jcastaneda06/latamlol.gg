import type { ParticipantDTO } from "@/types/match";

export interface ScoredParticipant extends ParticipantDTO {
  score: number;
  rank: number;
  tag: "MVP" | "DESTACADO" | null;
}

/**
 * Computes a performance score (0–100) for each participant.
 * Factors: gold, KDA, kill participation, damage to champs, vision, CS.
 */
function computeScore(p: ParticipantDTO, participants: ParticipantDTO[]): number {
  const gameDuration = Math.max(
    ...participants.map(x => x.timePlayed ?? 0),
    1
  ) / 60; // minutes
  const teamId = p.teamId;
  const teamParticipants = participants.filter(x => x.teamId === teamId);
  const teamKills = teamParticipants.reduce((s, x) => s + x.kills, 0) || 1;

  const kda = p.deaths === 0
    ? p.kills + p.assists
    : (p.kills + p.assists) / p.deaths;
  const killParticipation = ((p.kills + p.assists) / teamKills) * 100;
  const goldPerMin = gameDuration > 0 ? p.goldEarned / gameDuration : 0;
  const csPerMin = gameDuration > 0
    ? (p.totalMinionsKilled + p.neutralMinionsKilled) / gameDuration
    : 0;

  const maxGold = Math.max(...participants.map(x => x.goldEarned), 1);
  const maxDmg = Math.max(...participants.map(x => x.totalDamageDealtToChampions), 1);
  const maxVision = Math.max(...participants.map(x => x.visionScore), 1);
  const maxCs = Math.max(...participants.map(x => x.totalMinionsKilled + x.neutralMinionsKilled), 1);

  const goldScore = (p.goldEarned / maxGold) * 25;
  const kdaScore = Math.min(kda / 4, 1) * 20;
  const kpScore = Math.min(killParticipation / 100, 1) * 15;
  const dmgScore = (p.totalDamageDealtToChampions / maxDmg) * 25;
  const visionScore = (p.visionScore / maxVision) * 10;
  const csScore = ((p.totalMinionsKilled + p.neutralMinionsKilled) / maxCs) * 5;

  return goldScore + kdaScore + kpScore + dmgScore + visionScore + csScore;
}

/**
 * Scores all participants, ranks 1-10, assigns MVP (winning team #1) and DESTACADO (losing team #1).
 */
export function scoreAndRankParticipants(participants: ParticipantDTO[]): ScoredParticipant[] {
  const withScores = participants.map(p => ({
    ...p,
    score: computeScore(p, participants),
  }));

  const byTeam = {
    win: withScores.filter(p => p.win),
    lose: withScores.filter(p => !p.win),
  };

  const rankInTeam = (team: typeof withScores) =>
    [...team].sort((a, b) => b.score - a.score);

  const winRanked = rankInTeam(byTeam.win);
  const loseRanked = rankInTeam(byTeam.lose);

  const allRanked = [...winRanked, ...loseRanked].sort((a, b) => b.score - a.score);

  const result: ScoredParticipant[] = [];
  const rankMap = new Map<string, number>();
  allRanked.forEach((p, i) => {
    rankMap.set(p.puuid, i + 1);
  });

  participants.forEach(p => {
    const scored = withScores.find(x => x.puuid === p.puuid)!;
    const rank = rankMap.get(p.puuid) ?? 10;
    let tag: "MVP" | "DESTACADO" | null = null;
    if (p.win && winRanked[0]?.puuid === p.puuid) tag = "MVP";
    if (!p.win && loseRanked[0]?.puuid === p.puuid) tag = "DESTACADO";

    result.push({
      ...p,
      score: scored.score,
      rank,
      tag,
    });
  });

  return result.sort((a, b) => a.rank - b.rank);
}
