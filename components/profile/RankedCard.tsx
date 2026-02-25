import Image from "next/image";
import { tierIconUrl } from "@/lib/ddragon";
import { tierToSpanish, tierColor, calcWinRate, winRateColor } from "@/lib/utils";
import type { LeagueEntryDTO } from "@/types/riot";

interface RankedCardProps {
  entry: LeagueEntryDTO | undefined;
  queueLabel: string;
}

export function RankedCard({ entry, queueLabel }: RankedCardProps) {
  if (!entry) {
    return (
      <div className="rounded-lg border border-border-subtle bg-surface p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {queueLabel}
        </p>
        <p className="text-sm text-muted-foreground">Sin clasificar</p>
      </div>
    );
  }

  const wr = calcWinRate(entry.wins, entry.losses);
  const total = entry.wins + entry.losses;

  return (
    <div className="rounded-lg border border-border-subtle bg-surface p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {queueLabel}
      </p>

      <div className="flex items-center gap-3">
        <div className="relative size-14 shrink-0 overflow-hidden">
          <Image
            src={tierIconUrl(entry.tier)}
            alt={entry.tier}
            fill
            className="object-cover scale-110"
            unoptimized
          />
        </div>

        <div>
          <p
            className="font-bold text-base"
            style={{ color: tierColor(entry.tier) }}
          >
            {tierToSpanish(entry.tier)}{" "}
            {!["MASTER", "GRANDMASTER", "CHALLENGER"].includes(entry.tier) && entry.rank}
          </p>
          <p className="text-sm text-text-warm font-medium">{entry.leaguePoints} PL</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{total} partidas</span>
        <span className={winRateColor(wr)}>{wr}% victoria</span>
      </div>

      {/* Win/Loss bar */}
      <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-surface-alt">
        <div
          className="bg-win rounded-full"
          style={{ width: `${wr}%` }}
        />
        <div className="flex-1 bg-loss rounded-r-full" />
      </div>

      <div className="mt-1 flex justify-between text-[11px]">
        <span className="text-win">{entry.wins}V</span>
        <span className="text-loss">{entry.losses}D</span>
      </div>

      {entry.hotStreak && (
        <div className="mt-2 text-[11px] font-medium text-gold">
          🔥 Racha ganadora
        </div>
      )}
    </div>
  );
}
