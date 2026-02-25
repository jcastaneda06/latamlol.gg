"use client";

import Image from "next/image";
import { Shield, Swords, Clock } from "lucide-react";
import { cn, formatDuration, tierToSpanish, tierColor } from "@/lib/utils";
import { championIconUrl, spellIconUrlById, tierIconUrl } from "@/lib/ddragon";
import { BuildDisplay } from "@/components/champion/BuildDisplay";
import type { CurrentGameInfoDTO } from "@/types/riot";
import type { MerakiChampionBuild } from "@/types/champion";

interface PlayerRank {
  tier?: string;
  rank?: string;
  lp?: number;
}

interface LiveGameViewProps {
  game: CurrentGameInfoDTO;
  playerPuuid: string;
  suggestedBuild: MerakiChampionBuild | null;
  buildReason: string;
  playerRanks?: Record<string, PlayerRank>;
  championNames?: Record<number, string>;
  gameDurationNow?: number;
}

export function LiveGameView({
  game,
  playerPuuid,
  suggestedBuild,
  buildReason,
  playerRanks = {},
  championNames = {},
  gameDurationNow = 0,
}: LiveGameViewProps) {
  const blueTeam = game.participants.filter(p => p.teamId === 100);
  const redTeam = game.participants.filter(p => p.teamId === 200);
  const bans = game.bannedChampions ?? [];
  const blueBans = bans.filter(b => b.teamId === 100);
  const redBans = bans.filter(b => b.teamId === 200);

  return (
    <div className="space-y-6">
      {/* Game info header */}
      <div className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface p-4">
        <div className="flex items-center gap-2">
          <div className="size-2.5 rounded-full bg-win animate-pulse" />
          <span className="text-sm font-semibold text-win">Partida en vivo</span>
        </div>
        {gameDurationNow > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="size-4" />
            <span>{formatDuration(gameDurationNow)}</span>
          </div>
        )}
      </div>

      {/* Suggested Build */}
      {suggestedBuild && (
        <div className="rounded-lg border border-gold/30 bg-surface p-4 shine-border">
          <div className="mb-3 flex items-center gap-2">
            <Swords className="size-4 text-gold" />
            <h3 className="font-semibold text-gold text-sm">Construcción Sugerida</h3>
            <span className="rounded bg-surface-alt px-2 py-0.5 text-[11px] text-muted-foreground">
              {buildReason}
            </span>
          </div>
          <BuildDisplay items={suggestedBuild.items} />
        </div>
      )}

      {/* Teams */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Blue Team */}
        <TeamPanel
          title="Equipo Azul"
          participants={blueTeam}
          bans={blueBans}
          playerPuuid={playerPuuid}
          playerRanks={playerRanks}
          championNames={championNames}
          color="blue"
        />

        {/* Red Team */}
        <TeamPanel
          title="Equipo Rojo"
          participants={redTeam}
          bans={redBans}
          playerPuuid={playerPuuid}
          playerRanks={playerRanks}
          championNames={championNames}
          color="red"
        />
      </div>
    </div>
  );
}

function TeamPanel({
  title,
  participants,
  bans,
  playerPuuid,
  playerRanks,
  championNames,
  color,
}: {
  title: string;
  participants: CurrentGameInfoDTO["participants"];
  bans: CurrentGameInfoDTO["bannedChampions"];
  playerPuuid: string;
  playerRanks: Record<string, PlayerRank>;
  championNames: Record<number, string>;
  color: "blue" | "red";
}) {
  return (
    <div className={cn(
      "rounded-lg border bg-surface overflow-hidden",
      color === "blue" ? "border-blue-500/20" : "border-red-500/20"
    )}>
      {/* Header */}
      <div className={cn(
        "px-4 py-2.5 border-b border-border-subtle flex items-center gap-2",
        color === "blue" ? "bg-blue-500/5" : "bg-red-500/5"
      )}>
        <Shield className={cn("size-4", color === "blue" ? "text-blue-400" : "text-red-400")} />
        <span className="text-sm font-semibold text-text-warm">{title}</span>
      </div>

      {/* Players */}
      <div className="divide-y divide-border-subtle">
        {participants.map(p => {
          const champName = championNames[p.championId] ?? String(p.championId);
          const isSearchedPlayer = p.puuid === playerPuuid;
          const rank = playerRanks[p.summonerId];

          return (
            <div
              key={p.summonerId}
              className={cn(
                "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-alt",
                isSearchedPlayer && "bg-gold/5 border-l-2 border-l-gold"
              )}
            >
              {/* Champion */}
              <Image
                src={championIconUrl(champName)}
                alt={champName}
                width={36}
                height={36}
                className="rounded-full border border-border-subtle shrink-0"
                unoptimized
              />

              {/* Spells */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <Image src={spellIconUrlById(p.spell1Id)} alt="" width={16} height={16} className="rounded" unoptimized />
                <Image src={spellIconUrlById(p.spell2Id)} alt="" width={16} height={16} className="rounded" unoptimized />
              </div>

              {/* Name + rank */}
              <div className="min-w-0 flex-1">
                <p className={cn(
                  "truncate text-sm font-medium",
                  isSearchedPlayer ? "text-gold" : "text-text-warm"
                )}>
                  {p.summonerName}
                </p>
                {rank?.tier ? (
                  <p className="text-[11px]" style={{ color: tierColor(rank.tier as Parameters<typeof tierColor>[0]) }}>
                    {tierToSpanish(rank.tier as Parameters<typeof tierToSpanish>[0])} {rank.rank} · {rank.lp} PL
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">Sin clasificar</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bans */}
      {bans.length > 0 && (
        <div className="border-t border-border-subtle px-4 py-2.5">
          <p className="mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">Bans</p>
          <div className="flex gap-1 flex-wrap">
            {bans.map((ban, i) => {
              const champName = championNames[ban.championId];
              if (!champName || ban.championId === -1) {
                return <div key={i} className="size-7 rounded border border-border-subtle bg-surface-alt" />;
              }
              return (
                <div key={i} className="relative">
                  <Image
                    src={championIconUrl(champName)}
                    alt={champName}
                    width={28}
                    height={28}
                    className="rounded border border-red-500/30 opacity-60 grayscale"
                    unoptimized
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="size-[2px] bg-red-500 rotate-45 scale-[8]" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
