import Image from "next/image";
import { Shield } from "lucide-react";
import { profileIconUrl, tierIconUrl } from "@/lib/ddragon";
import { tierToSpanish, tierColor } from "@/lib/utils";
import type { SummonerDTO, LeagueEntryDTO } from "@/types/riot";

interface ProfileHeaderProps {
  account: { gameName: string; tagLine: string };
  summoner: SummonerDTO;
  ranked: LeagueEntryDTO[];
  region: string;
}

export function ProfileHeader({ account, summoner, ranked, region }: ProfileHeaderProps) {
  const soloEntry = ranked.find(e => e.queueType === "RANKED_SOLO_5x5");
  const hasTier = !!soloEntry?.tier;

  return (
    <div className="relative overflow-hidden rounded-xl border border-border-subtle bg-surface">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#C89B3C10] to-transparent" />

      <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6">
        {/* Profile icon */}
        <div className="relative shrink-0">
          <div className="relative size-20 overflow-hidden rounded-full border-2 border-gold sm:size-24">
            <Image
              src={profileIconUrl(summoner.profileIconId)}
              alt={`Ícono de ${account.gameName}`}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          {/* Level badge */}
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-surface-alt border border-border-subtle px-2 py-0.5 text-xs font-bold text-text-warm">
            {summoner.summonerLevel}
          </span>
        </div>

        {/* Name + rank */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-text-warm">
              {account.gameName}
            </h1>
            <span className="text-lg text-muted-foreground">#{account.tagLine}</span>
            <span className="rounded bg-surface-alt px-2 py-0.5 text-xs font-medium text-muted-foreground border border-border-subtle">
              {region.toUpperCase()}
            </span>
          </div>

          {hasTier && soloEntry ? (
            <div className="mt-2 flex items-center gap-2">
              <div className="relative size-10 shrink-0 overflow-hidden">
                <Image
                  src={tierIconUrl(soloEntry.tier)}
                  alt={soloEntry.tier}
                  fill
                  className="object-cover scale-110"
                  unoptimized
                />
              </div>
              <span
                className="font-semibold text-sm"
                style={{ color: tierColor(soloEntry.tier) }}
              >
                {tierToSpanish(soloEntry.tier)} {soloEntry.rank}
              </span>
              <span className="text-sm text-muted-foreground">
                {soloEntry.leaguePoints} PL
              </span>
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-2 text-muted-foreground">
              <Shield className="size-4 opacity-50" />
              <span className="text-sm">Sin clasificar</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
