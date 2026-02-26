"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { championIconUrl } from "@/lib/ddragon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatKDA, formatDuration } from "@/lib/utils";
import { scoreAndRankParticipants, type ScoredParticipant } from "@/lib/matchScore";
import { cn } from "@/lib/utils";
import type { MatchDTO } from "@/types/match";

interface MatchDetailsTableProps {
  matchId: string;
  region: string;
  puuid?: string;
}

async function fetchMatch(matchId: string, region: string): Promise<MatchDTO> {
  const res = await fetch(`/api/riot/match/${matchId}?region=${region}`);
  if (!res.ok) throw new Error("Error al cargar detalles");
  return res.json();
}

export function MatchDetailsTable({ matchId, region, puuid }: MatchDetailsTableProps) {
  const [expanded, setExpanded] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["match", matchId, region],
    queryFn: () => fetchMatch(matchId, region),
    enabled: expanded,
    staleTime: 5 * 60 * 1000,
  });

  const { data: masteries } = useQuery({
    queryKey: ["match-masteries", matchId, region],
    queryFn: () =>
      fetch(`/api/riot/match/${matchId}/masteries?region=${region}`).then(r => {
        if (!r.ok) throw new Error("Failed");
        return r.json() as Promise<Record<string, { championLevel: number; championPoints: number }>>;
      }),
    enabled: expanded && !!data,
    staleTime: 5 * 60 * 1000,
  });

  const participants: ScoredParticipant[] = data
    ? scoreAndRankParticipants(data.info.participants)
    : [];
  const gameDuration = data?.info?.gameDuration ?? 0;
  const durationMin = gameDuration / 60;

  return (
    <div className="border-t border-border-subtle">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-center gap-2 py-2 text-xs text-muted-foreground transition-colors hover:bg-surface-alt hover:text-text-warm"
      >
        {expanded ? "Ocultar detalles" : "Ver detalles de la partida"}
        <ChevronDown
          className={cn("size-4 transition-transform", expanded && "rotate-180")}
        />
      </button>

      {expanded && (
        <div className="border-t border-border-subtle bg-surface-alt/50 px-3 pb-3 pt-2">
          {isLoading && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Cargando detalles...
            </div>
          )}
          {error && (
            <div className="py-4 text-center text-sm text-loss">
              No se pudieron cargar los detalles
            </div>
          )}
          {data && participants.length > 0 && (() => {
            const team100 = participants.filter(p => p.teamId === 100);
            const team200 = participants.filter(p => p.teamId === 200);

            const team100Meta = data.info.teams.find(t => t.teamId === 100);
            const team200Meta = data.info.teams.find(t => t.teamId === 200);

            const getObjectiveKills = (
              team: MatchDTO["info"]["teams"][number] | undefined,
              objectiveKey: string
            ) => team?.objectives?.[objectiveKey]?.kills ?? 0;

            const baseObjectiveItems = [
              { key: "tower", icon: "T", label: "Torres" },
              { key: "inhibitor", icon: "I", label: "Inhibidores" },
              { key: "dragon", icon: "D", label: "Dragones" },
              { key: "baron", icon: "B", label: "Barones" },
            ];
            const extraObjectiveItems = [
              { key: "riftHerald", icon: "H", label: "Heraldos" },
              { key: "horde", icon: "V", label: "Voidgrubs" },
              { key: "atakhan", icon: "A", label: "Atakhan" },
            ].filter(
              item =>
                getObjectiveKills(team100Meta, item.key) > 0 ||
                getObjectiveKills(team200Meta, item.key) > 0
            );
            const objectiveItems = [...baseObjectiveItems, ...extraObjectiveItems];

            const team100Gold = team100.reduce((sum, p) => sum + p.goldEarned, 0);
            const team200Gold = team200.reduce((sum, p) => sum + p.goldEarned, 0);
            const team100Damage = team100.reduce((sum, p) => sum + p.totalDamageDealtToChampions, 0);
            const team200Damage = team200.reduce((sum, p) => sum + p.totalDamageDealtToChampions, 0);
            const ObjectiveIcons = ({
              teamMeta,
              teamGold,
              teamDamage,
            }: {
              teamMeta: MatchDTO["info"]["teams"][number] | undefined;
              teamGold: number;
              teamDamage: number;
            }) => (
              <div className="flex flex-wrap items-center justify-end gap-1">
                {objectiveItems.map(item => (
                  <span
                    key={item.key}
                    className="inline-flex items-center gap-1.5 rounded bg-surface px-2 py-1 text-xs text-text-warm"
                    title={item.label}
                  >
                    <span className="inline-flex size-5 items-center justify-center rounded-full border border-border-subtle text-[10px] font-bold text-muted-foreground">
                      {item.icon}
                    </span>
                    {getObjectiveKills(teamMeta, item.key)}
                  </span>
                ))}
                <span
                  className="inline-flex items-center gap-1.5 rounded bg-surface px-2 py-1 text-xs text-text-warm"
                  title="Oro total"
                >
                  <span className="inline-flex size-5 items-center justify-center rounded-full border border-border-subtle text-[10px] font-bold text-muted-foreground">
                    G
                  </span>
                  {teamGold.toLocaleString("es-MX")}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 rounded bg-surface px-2 py-1 text-xs text-text-warm"
                  title="Daño total"
                >
                  <span className="inline-flex size-5 items-center justify-center rounded-full border border-border-subtle text-[10px] font-bold text-muted-foreground">
                    DMG
                  </span>
                  {teamDamage.toLocaleString("es-MX")}
                </span>
              </div>
            );

            const TeamTable = ({
              team,
              sideLabel,
              teamMeta,
              teamGold,
              teamDamage,
            }: {
              team: ScoredParticipant[];
              sideLabel: string;
              teamMeta: MatchDTO["info"]["teams"][number] | undefined;
              teamGold: number;
              teamDamage: number;
            }) => (
              <div className="min-w-0 overflow-x-auto rounded-lg border border-border-subtle">
                <div className={cn(
                  "flex items-center justify-between gap-2 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider border-b",
                  team[0]?.win ? "bg-win/10 text-win border-win/30" : "bg-loss/10 text-loss border-loss/30"
                )}>
                  <span>{sideLabel} — {team[0]?.win ? "Victoria" : "Derrota"}</span>
                  <ObjectiveIcons teamMeta={teamMeta} teamGold={teamGold} teamDamage={teamDamage} />
                </div>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border-subtle bg-surface/50">
                      <th className="px-2 py-1.5 font-semibold text-muted-foreground">#</th>
                      <th className="px-2 py-1.5 font-semibold text-muted-foreground">Invocador</th>
                      <th className="px-2 py-1.5 text-center font-semibold text-muted-foreground">KDA</th>
                      <th className="hidden px-2 py-1.5 text-right font-semibold text-muted-foreground sm:table-cell">CS</th>
                      <th className="hidden px-2 py-1.5 text-right font-semibold text-muted-foreground sm:table-cell">Oro</th>
                      <th className="hidden px-2 py-1.5 text-right font-semibold text-muted-foreground sm:table-cell">DMG</th>
                      <th className="hidden px-2 py-1.5 text-right font-semibold text-muted-foreground sm:table-cell">KP%</th>
                      <th className="px-2 py-1.5 text-right font-semibold text-muted-foreground">V</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.map(p => {
                      const teamKills = team.reduce((s, x) => s + x.kills, 0) || 1;
                      const kp = Math.round(((p.kills + p.assists) / teamKills) * 100);
                      const isCurrentUser = puuid && p.puuid === puuid;

                      return (
                        <tr
                          key={p.puuid}
                          className={cn(
                            "border-b border-border-subtle last:border-0 transition-colors",
                            p.win ? "bg-win/5" : "bg-loss/5",
                            isCurrentUser && "ring-1 ring-inset ring-gold/50"
                          )}
                        >
                          <td className="px-2 py-1.5 font-medium">
                            {p.tag ? (
                              <span
                                className={cn(
                                  "text-[10px] font-bold",
                                  p.tag === "MVP" && "text-gold",
                                  p.tag === "DESTACADO" && "text-teal"
                                )}
                              >
                                {p.tag === "DESTACADO" ? "DES" : p.tag}
                              </span>
                            ) : (
                              p.rank
                            )}
                          </td>
                          <td className="px-2 py-1.5">
                            <div className="flex items-center gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-default inline-flex shrink-0">
                                    <Image
                                      src={championIconUrl(p.championName)}
                                      alt={p.championName}
                                      width={20}
                                      height={20}
                                      className="rounded"
                                      unoptimized
                                    />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[200px]">
                                  <div className="space-y-1">
                                    <p className="font-semibold">{p.championName}</p>
                                    {masteries?.[p.puuid] && masteries[p.puuid].championLevel > 0 ? (
                                      <p className="text-xs text-gold">
                                        Maestría {masteries[p.puuid].championLevel} ·{" "}
                                        {masteries[p.puuid].championPoints.toLocaleString("es-MX")} pts
                                      </p>
                                    ) : (
                                      <p className="text-xs text-muted-foreground">
                                        Sin maestría
                                      </p>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                              <span
                                className={cn(
                                  "truncate max-w-[80px] sm:max-w-[100px]",
                                  isCurrentUser && "font-semibold text-gold"
                                )}
                              >
                                {p.riotIdGameName || p.summonerName}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 py-1.5 text-center font-medium">
                            {formatKDA(p.kills, p.deaths, p.assists)}
                          </td>
                          <td className="hidden px-2 py-1.5 text-right sm:table-cell">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>{p.totalMinionsKilled + p.neutralMinionsKilled}</span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[220px] text-xs">
                                <div className="space-y-1">
                                  <p>
                                    <span className="font-semibold text-text-warm">CS/min:</span>{" "}
                                    {durationMin > 0
                                      ? ((p.totalMinionsKilled + p.neutralMinionsKilled) / durationMin).toFixed(1)
                                      : "0.0"}
                                  </p>
                                  <p className="text-muted-foreground">
                                    CS = súbditos y monstruos neutrales eliminados.
                                  </p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </td>
                          <td className="hidden px-2 py-1.5 text-right sm:table-cell text-gold">
                            {p.goldEarned.toLocaleString("es-MX")}
                          </td>
                          <td className="hidden px-2 py-1.5 text-right sm:table-cell">
                            {p.totalDamageDealtToChampions.toLocaleString("es-MX")}
                          </td>
                          <td className="hidden px-2 py-1.5 text-right sm:table-cell">
                            {kp}%
                          </td>
                          <td className="px-2 py-1.5 text-right">{p.visionScore}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );

            return (
              <div className="space-y-3">
                <div className="flex flex-col gap-3">
                  <TeamTable
                    team={team100}
                    sideLabel="Equipo Azul"
                    teamMeta={team100Meta}
                    teamGold={team100Gold}
                    teamDamage={team100Damage}
                  />
                  <TeamTable
                    team={team200}
                    sideLabel="Equipo Rojo"
                    teamMeta={team200Meta}
                    teamGold={team200Gold}
                    teamDamage={team200Damage}
                  />
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Duración: {formatDuration(gameDuration)}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
