import Image from "next/image";
import { cn, formatKDA, calcKDA, kdaColor, formatDuration, formatCS, getQueueShort, timeAgo, isRankedQueue } from "@/lib/utils";
import { MatchDetailsTable } from "@/components/profile/MatchDetailsTable";
import { championIconUrl, spellIconUrlById } from "@/lib/ddragon";
import { ItemIcon, FormattedDescription, type ItemTooltipInfo } from "@/components/ui/item-icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ProcessedMatch } from "@/types/match";

export interface SpellTooltipInfo {
  name: string;
  description?: string;
  cooldown?: string;
}

function SpellTooltipContent({
  info,
  fallback,
}: {
  info?: SpellTooltipInfo;
  fallback: string;
}) {
  if (!info) return <>{fallback}</>;
  return (
    <div className="max-w-[280px] space-y-1.5">
      <p className="font-semibold text-[13px]">{info.name}</p>
      {info.cooldown && (
        <p className="text-xs text-teal font-medium">
          ⏱ Enfriamiento: {info.cooldown}s
        </p>
      )}
      {info.description && (
        <p className="text-xs text-text-muted leading-relaxed">
          <FormattedDescription text={info.description} />
        </p>
      )}
    </div>
  );
}

interface MatchCardProps {
  match: ProcessedMatch;
  region: string;
  puuid?: string;
  itemInfo?: Record<string, ItemTooltipInfo>;
  spellInfo?: Record<number, SpellTooltipInfo>;
}

export function MatchCard({ match, region, puuid, itemInfo, spellInfo }: MatchCardProps) {
  const kda = calcKDA(match.kills, match.deaths, match.assists);
  const kdaRatio = parseFloat(kda.toFixed(2));
  const isRemake = match.gameDuration < 210; // < 3.5 min

  return (
    <div
      className={cn(
        "rounded-lg border border-border-subtle bg-surface overflow-hidden transition-colors hover:bg-surface-alt",
        match.win ? "match-win" : "match-loss"
      )}
    >
      <div className="flex items-center gap-3 p-3">
      {/* Result */}
      <div className="w-10 shrink-0 text-center">
        <p
          className={cn(
            "text-xs font-bold",
            isRemake ? "text-muted-foreground" : match.win ? "text-win" : "text-loss"
          )}
        >
          {isRemake ? "Remake" : match.win ? "Victoria" : "Derrota"}
        </p>
        <p className="text-[10px] text-muted-foreground">{getQueueShort(match.queueId)}</p>
      </div>

      {/* LP gain/loss (only when we have snapshot-derived data) */}
      {isRankedQueue(match.queueId) && !isRemake && match.lpDelta !== undefined && (
        <div
          className={cn(
            "flex shrink-0 items-center gap-0.5 text-sm font-semibold tabular-nums",
            match.win ? "text-win" : "text-loss"
          )}
          title="PL calculado a partir de tu historial de clasificación"
        >
          <span aria-hidden>{match.win ? "▲" : "▼"}</span>
          <span>{match.lpDelta >= 0 ? `+${match.lpDelta}` : `${match.lpDelta}`}</span>
          <span className="text-[10px] font-normal text-muted-foreground">LP</span>
        </div>
      )}

      {/* Champion */}
      <div className="relative shrink-0">
        <Image
          src={championIconUrl(match.champion)}
          alt={match.champion}
          width={44}
          height={44}
          className="rounded-full border border-border-subtle"
          unoptimized
        />
        <span className="absolute -bottom-1 -right-1 rounded-full bg-surface-alt border border-border-subtle px-1 text-[9px] font-bold">
          {match.champLevel}
        </span>
      </div>

      {/* Summoner spells + primary rune */}
      <div className="flex shrink-0 flex-col gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-default inline-block">
              <Image
                src={spellIconUrlById(match.summoner1Id)}
                alt=""
                width={18}
                height={18}
                className="rounded"
                unoptimized
              />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[260px]">
            <SpellTooltipContent info={spellInfo?.[match.summoner1Id]} fallback="Summoner spell" />
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-default inline-block">
              <Image
                src={spellIconUrlById(match.summoner2Id)}
                alt=""
                width={18}
                height={18}
                className="rounded"
                unoptimized
              />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[260px]">
            <SpellTooltipContent info={spellInfo?.[match.summoner2Id]} fallback="Summoner spell" />
          </TooltipContent>
        </Tooltip>
      </div>

      {/* KDA */}
      <div className="w-20 shrink-0 text-center">
        <p className="text-sm font-bold text-text-warm">
          {formatKDA(match.kills, match.deaths, match.assists)}
        </p>
        <p className={cn("text-xs font-medium", kdaColor(kdaRatio))}>
          {kdaRatio.toFixed(2)} KDA
        </p>
      </div>

      {/* CS + Vision */}
      <div className="hidden w-16 shrink-0 text-center sm:block">
        <p className="text-xs text-text-warm">{match.cs} CS</p>
        <p className="text-[11px] text-muted-foreground">
          {(match.cs / (match.gameDuration / 60)).toFixed(1)}/min
        </p>
        <p className="text-[11px] text-muted-foreground">👁 {match.visionScore}</p>
      </div>

      {/* Items */}
      <div className="hidden flex-wrap gap-0.5 sm:flex" style={{ maxWidth: "136px" }}>
        {match.items.map((itemId, i) => (
          <ItemIcon
            key={i}
            itemId={itemId}
            size={22}
            tooltipInfo={itemInfo?.[String(itemId)]}
          />
        ))}
        {/* Trinket */}
        {match.trinket > 0 && (
          <ItemIcon
            itemId={match.trinket}
            size={22}
            trinket
            tooltipInfo={itemInfo?.[String(match.trinket)]}
          />
        )}
      </div>

      {/* Duration + time ago */}
      <div className="ml-auto shrink-0 text-right">
        <p className="text-xs text-text-warm">{formatDuration(match.gameDuration)}</p>
        <p className="text-[11px] text-muted-foreground">{timeAgo(match.gameCreation)}</p>
      </div>
      </div>

      <MatchDetailsTable matchId={match.matchId} region={region} puuid={puuid} />
    </div>
  );
}
