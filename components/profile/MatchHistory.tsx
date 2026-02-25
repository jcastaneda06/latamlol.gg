"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MatchCard } from "@/components/profile/MatchCard";
import { Skeleton } from "@/components/ui/skeleton";
import { AdBanner } from "@/components/ads/AdBanner";
import type { ProcessedMatch } from "@/types/match";

interface MatchHistoryProps {
  puuid: string;
  region: string;
  queueFilter?: number;
}

async function fetchMatches(
  puuid: string,
  region: string,
  start: number,
  queue?: number
): Promise<ProcessedMatch[]> {
  const params = new URLSearchParams({
    puuid,
    region,
    start: String(start),
    count: "10",
  });
  if (queue) params.set("queue", String(queue));

  const res = await fetch(`/api/riot/matches?${params}`);
  if (!res.ok) throw new Error("Error al cargar partidas");
  return res.json();
}

async function fetchStaticData(): Promise<{
  items: Record<string, string>;
  spells: Record<number, string>;
}> {
  const res = await fetch("/api/ddragon/static");
  if (!res.ok) throw new Error("Error al cargar datos estáticos");
  return res.json();
}

export function MatchHistory({ puuid, region, queueFilter }: MatchHistoryProps) {
  const [page, setPage] = useState(0);
  const [allMatches, setAllMatches] = useState<ProcessedMatch[]>([]);

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["matches", puuid, region, page, queueFilter],
    queryFn: () => fetchMatches(puuid, region, page * 10, queueFilter),
    staleTime: 5 * 60 * 1000,
  });

  const { data: staticData } = useQuery({
    queryKey: ["ddragon-static"],
    queryFn: fetchStaticData,
    staleTime: 24 * 60 * 60 * 1000, // 24h - static data rarely changes
  });

  useEffect(() => {
    if (data && data.length > 0) {
      if (page === 0) {
        setAllMatches(data);
      } else {
        setAllMatches(prev => {
          const ids = new Set(prev.map(m => m.matchId));
          return [...prev, ...data.filter(m => !ids.has(m.matchId))];
        });
      }
    }
  }, [data, page]);

  // Reset when filter changes
  useEffect(() => {
    setPage(0);
    setAllMatches([]);
  }, [queueFilter]);

  if (isLoading && page === 0) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] w-full rounded-lg bg-surface" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-border-subtle bg-surface p-6 text-center">
        <p className="text-sm text-loss">Error al cargar el historial de partidas.</p>
      </div>
    );
  }

  if (allMatches.length === 0) {
    return (
      <div className="rounded-lg border border-border-subtle bg-surface p-6 text-center">
        <p className="text-sm text-muted-foreground">No se encontraron partidas.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {allMatches.map((match, idx) => (
        <React.Fragment key={match.matchId}>
          <MatchCard
            match={match}
            region={region}
            puuid={puuid}
            itemInfo={staticData?.items}
            spellInfo={staticData?.spells}
          />
          {/* Non-intrusive inline ad after every 10th match */}
          {(idx + 1) % 10 === 0 && idx + 1 < allMatches.length && (
            <div className="my-2 flex justify-center">
              <AdBanner
                slot={process.env.NEXT_PUBLIC_AD_SLOT_INLINE ?? ""}
                format="inline"
                className="w-full max-w-2xl"
              />
            </div>
          )}
        </React.Fragment>
      ))}

      {/* Load More */}
      {(data?.length ?? 0) >= 10 && (
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={isFetching}
          className="mt-2 w-full rounded-lg border border-border-subtle bg-surface py-2.5 text-sm text-muted-foreground transition-colors hover:bg-surface-alt hover:text-text-warm disabled:opacity-50"
        >
          {isFetching ? "Cargando..." : "Cargar más partidas"}
        </button>
      )}
    </div>
  );
}
