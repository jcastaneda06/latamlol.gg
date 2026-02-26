import { calcLPDelta } from "@/lib/utils";
import type { Tier, Division } from "@/types/riot";
import type { RankSnapshot } from "@/lib/supabase";

const QUEUE_TO_QUEUE_TYPE: Record<number, string> = {
  420: "RANKED_SOLO_5x5",
  440: "RANKED_FLEX_SR",
};

export interface MatchForLP {
  matchId: string;
  queueId: number;
  win: boolean;
  gameEndTimestamp: number;
}

/**
 * Compute LP delta for each ranked match using snapshots.
 * Snapshot "before" = most recent with fetched_at < gameEnd
 * Snapshot "after" = earliest with fetched_at > gameEnd
 * When exactly 1 match between snapshots: exact delta.
 * When multiple: distribute total delta proportionally (equal per win/loss).
 * Returns Map<matchId, lpDelta>.
 */
export function computeLPDeltas(
  matches: MatchForLP[],
  snapshots: RankSnapshot[],
  currentRankByQueue: Record<string, { tier: string; rank: string; leaguePoints: number; wins: number; losses: number }>
): Map<string, number> {
  const result = new Map<string, number>();
  const rankedMatches = matches.filter(m => QUEUE_TO_QUEUE_TYPE[m.queueId]);
  if (rankedMatches.length === 0) return result;

  for (const match of rankedMatches) {
    const qt = QUEUE_TO_QUEUE_TYPE[match.queueId];
    if (!qt) continue;

    const snapForQueue = snapshots.filter(s => s.queue_type === qt);
    const matchEndMs = match.gameEndTimestamp;
    if (typeof matchEndMs !== "number" || matchEndMs <= 0) continue;

    const before = snapForQueue
      .filter(s => new Date(s.fetched_at).getTime() < matchEndMs)
      .pop();
    const after = snapForQueue
      .filter(s => new Date(s.fetched_at).getTime() > matchEndMs)
      .shift();

    if (!before && !after) {
      continue;
    }

    if (before && after) {
      const totalDelta = calcLPDelta(
        before.tier as Tier,
        (before.rank || "I") as Division,
        before.league_points,
        after.tier as Tier,
        (after.rank || "I") as Division,
        after.league_points
      );

      const matchesBetween = rankedMatches.filter(m => {
        if (QUEUE_TO_QUEUE_TYPE[m.queueId] !== qt) return false;
        const t = m.gameEndTimestamp;
        return t > new Date(before.fetched_at).getTime() && t < new Date(after.fetched_at).getTime();
      });

      if (matchesBetween.length === 1) {
        result.set(match.matchId, totalDelta);
      } else if (matchesBetween.length > 1) {
        const wins = matchesBetween.filter(m => m.win).length;
        const losses = matchesBetween.length - wins;
        if (wins === 0 && losses > 0) {
          const perLoss = Math.round(totalDelta / losses);
          matchesBetween.forEach(m => {
            if (!m.win) result.set(m.matchId, perLoss);
          });
        } else if (losses === 0 && wins > 0) {
          const perWin = Math.round(totalDelta / wins);
          matchesBetween.forEach(m => {
            if (m.win) result.set(m.matchId, perWin);
          });
        } else if (wins > 0 && losses > 0) {
          const avgMag = Math.abs(totalDelta) / (wins + losses);
          const winVal = totalDelta >= 0 ? Math.round(avgMag) : -Math.round(avgMag);
          const lossVal = totalDelta >= 0 ? -Math.round(avgMag) : Math.round(avgMag);
          matchesBetween.forEach(m => {
            result.set(m.matchId, m.win ? winVal : lossVal);
          });
        }
      }
    } else if (before && !after) {
      const current = currentRankByQueue[qt];
      if (!current) continue;
      const matchesAfterBefore = rankedMatches.filter(m => {
        if (QUEUE_TO_QUEUE_TYPE[m.queueId] !== qt) return false;
        return m.gameEndTimestamp > new Date(before.fetched_at).getTime();
      });
      if (matchesAfterBefore.length === 1) {
        const delta = calcLPDelta(
          before.tier as Tier,
          (before.rank || "I") as Division,
          before.league_points,
          current.tier as Tier,
          (current.rank || "I") as Division,
          current.leaguePoints
        );
        result.set(match.matchId, delta);
      } else if (matchesAfterBefore.length > 1) {
        const totalDelta = calcLPDelta(
          before.tier as Tier,
          (before.rank || "I") as Division,
          before.league_points,
          current.tier as Tier,
          (current.rank || "I") as Division,
          current.leaguePoints
        );
        const wins = matchesAfterBefore.filter(m => m.win).length;
        const losses = matchesAfterBefore.length - wins;
        if (wins === 0 && losses > 0) {
          const perLoss = Math.round(totalDelta / losses);
          matchesAfterBefore.forEach(m => {
            if (!m.win) result.set(m.matchId, perLoss);
          });
        } else if (losses === 0 && wins > 0) {
          const perWin = Math.round(totalDelta / wins);
          matchesAfterBefore.forEach(m => {
            if (m.win) result.set(m.matchId, perWin);
          });
        } else if (wins > 0 && losses > 0) {
          const avgMag = Math.abs(totalDelta) / (wins + losses);
          const winVal = totalDelta >= 0 ? Math.round(avgMag) : -Math.round(avgMag);
          const lossVal = totalDelta >= 0 ? -Math.round(avgMag) : Math.round(avgMag);
          matchesAfterBefore.forEach(m => {
            result.set(m.matchId, m.win ? winVal : lossVal);
          });
        }
      }
    }
  }

  return result;
}

export { QUEUE_TO_QUEUE_TYPE };
