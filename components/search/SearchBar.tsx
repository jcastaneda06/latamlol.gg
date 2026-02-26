"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, Clock, X } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { profileIconUrl } from "@/lib/ddragon";

const REGIONS = [
  { value: "la1", label: "LA Norte" },
  { value: "la2", label: "LA Sur" },
  { value: "na1", label: "NA" },
  { value: "euw1", label: "EUW" },
  { value: "kr", label: "KR" },
  { value: "br1", label: "BR" },
];

interface RecentProfile {
  riotId: string;
  region: string;
  iconId: number;
  level: number;
}

function useRecentProfiles() {
  const [recents, setRecents] = useState<RecentProfile[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("lol-recent-profiles");
      if (raw) setRecents(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const add = useCallback((profile: RecentProfile) => {
    setRecents(prev => {
      const next = [profile, ...prev.filter(p => p.riotId !== profile.riotId || p.region !== profile.region)].slice(0, 5);
      localStorage.setItem("lol-recent-profiles", JSON.stringify(next));
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem("lol-recent-profiles");
    setRecents([]);
  }, []);

  return { recents, add, clear };
}

function filterRecentsByQuery(recents: RecentProfile[], query: string): RecentProfile[] {
  const q = query.trim().toLowerCase();
  if (!q) return recents;
  return recents.filter(p => p.riotId.toLowerCase().includes(q));
}

function regionToLabel(region: string): string {
  return REGIONS.find(r => r.value === region)?.label ?? region.toUpperCase();
}

interface ApiSearchResult {
  riot_id: string;
  region: string;
  profile_icon_id: number;
}

export function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [region, setRegion] = useState("la1");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { recents, clear } = useRecentProfiles();

  // Debounce query for API search (prefix match on summoner names)
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed.length) {
      setDebouncedQuery("");
      return;
    }
    const t = setTimeout(() => setDebouncedQuery(trimmed), 100);
    return () => clearTimeout(t);
  }, [query]);

  const { data: apiResults, isLoading: searchLoading, isError: searchError } = useQuery({
    queryKey: ["summoner-search", debouncedQuery.toLowerCase(), region],
    queryFn: async () => {
      const r = await fetch(
        `/api/search/summoners?q=${encodeURIComponent(debouncedQuery)}&region=${region}`,
        { cache: "no-store" }
      );
      if (!r.ok) throw new Error(`Search failed: ${r.status}`);
      const json = await r.json();
      return Array.isArray(json) ? json : [];
    },
    enabled: debouncedQuery.length >= 1 && focused,
    staleTime: 60_000,
  });
  const safeApiResults = Array.isArray(apiResults) ? apiResults : [];

  const suggestions = useMemo(
    () => filterRecentsByQuery(recents, query),
    [recents, query]
  );

  const searchTarget = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return null;
    let name = trimmed;
    let tag = region.toUpperCase();
    if (trimmed.includes("#")) {
      const [n, t] = trimmed.split("#");
      name = n.trim();
      tag = t.trim() || region.toUpperCase();
    }
    if (!name) return null;
    return `${name}#${tag}`;
  }, [query, region]);

  const hasApiResults = safeApiResults.length > 0;
  const showDropdown =
    focused &&
    (recents.length > 0 ||
      hasApiResults ||
      (searchTarget && searchTarget.length > 2) ||
      (debouncedQuery.length >= 1 && (searchLoading || searchError)));

  const handleSearch = useCallback(() => {
    const trimmed = query.trim();
    if (!trimmed) return;

    // Accept "Name#Tag" or "Name" (default tag = region)
    let name = trimmed;
    let tag = region.toUpperCase();

    if (trimmed.includes("#")) {
      const [n, t] = trimmed.split("#");
      name = n.trim();
      tag = t.trim();
    }

    if (!name) return;
    const riotIdFull = `${name}#${tag}`;
    const encoded = encodeURIComponent(riotIdFull);

    setFocused(false);
    fetch("/api/search/index", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameName: name, tagLine: tag, region }),
    }).catch(() => {});

    router.push(`/perfil/${region}/${encoded}`);
  }, [query, region, router]);

  const navigateToProfile = useCallback(
    (riotId: string, targetRegion: string) => {
      setFocused(false);
      const [gameName, tagLine] = riotId.split("#");
      if (gameName && tagLine) {
        fetch("/api/search/index", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gameName: gameName.trim(),
            tagLine: tagLine.trim(),
            region: targetRegion,
          }),
        }).catch(() => {});
      }
      router.push(`/perfil/${targetRegion}/${encodeURIComponent(riotId)}`);
    },
    [router]
  );

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className={cn(
        "flex overflow-hidden rounded-lg border transition-colors",
        focused ? "border-gold" : "border-border-subtle"
      )}>
        {/* Region selector */}
        <select
          value={region}
          onChange={e => setRegion(e.target.value)}
          className="bg-surface-alt px-3 py-2.5 text-sm font-medium text-text-warm border-r border-border-subtle outline-none cursor-pointer"
        >
          {REGIONS.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>

        {/* Search input */}
        <div className="relative flex flex-1 items-center bg-surface">
          <Search className="ml-3 size-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Invocador#TAG..."
            className="flex-1 bg-transparent px-3 py-2.5 text-sm text-text-warm placeholder:text-muted-foreground outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="mr-1 p-1 text-muted-foreground hover:text-text-warm"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Search button */}
        <button
          onClick={handleSearch}
          className="gradient-gold px-5 py-2.5 text-sm font-semibold text-[#0A0E1A] transition-opacity hover:opacity-90"
        >
          Buscar
        </button>
      </div>

      {/* Predictive suggestions dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 z-[9999] mt-1 rounded-lg border border-border-subtle bg-surface shadow-2xl overflow-hidden max-h-[320px] overflow-y-auto">
          {/* Loading state */}
          {debouncedQuery.length >= 1 && searchLoading && (
            <div className="px-3 py-4 text-center text-xs text-muted-foreground">
              Buscando invocadores...
            </div>
          )}

          {/* Error state */}
          {debouncedQuery.length >= 1 && searchError && !searchLoading && (
            <div className="px-3 py-4 text-center text-xs text-loss">
              Error al buscar. Verifica la conexión.
            </div>
          )}

          {/* API results - summoners that start with query */}
          {hasApiResults && !searchLoading && (
            <>
              <div className="px-3 py-2 bg-surface-alt/50 border-b border-border-subtle">
                <span className="text-xs text-muted-foreground">
                  Empiezan con &quot;{debouncedQuery}&quot;
                </span>
              </div>
              {safeApiResults.map((r, i) => (
                <button
                  key={`${r.region}-${r.riot_id}-${i}`}
                  type="button"
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-alt transition-colors"
                  onClick={() => navigateToProfile(r.riot_id, r.region)}
                >
                  <Image
                    src={profileIconUrl(r.profile_icon_id)}
                    alt=""
                    width={28}
                    height={28}
                    className="rounded-full border border-border-subtle shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-warm">{r.riot_id}</p>
                    <p className="text-xs text-muted-foreground">{regionToLabel(r.region)}</p>
                  </div>
                </button>
              ))}
            </>
          )}

          {/* Search suggestion - when user has typed something valid (show if no API results or as quick action) */}
          {searchTarget && searchTarget.length > 2 && (
            <button
              type="button"
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-alt transition-colors border-b border-border-subtle"
              onClick={() => navigateToProfile(searchTarget, region)}
            >
              <Search className="size-4 shrink-0 text-gold" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-warm">
                  Buscar <span className="text-gold">{searchTarget}</span>
                </p>
                <p className="text-xs text-muted-foreground">{regionToLabel(region)}</p>
              </div>
            </button>
          )}

          {/* Recent profiles - filtered by query when typing */}
          {suggestions.length > 0 && (
            <>
              <div className="flex items-center justify-between px-3 py-2 bg-surface-alt/50">
                <span className="text-xs text-muted-foreground">
                  {query.trim() ? "De perfiles recientes" : "Perfiles recientes"}
                </span>
                <button
                  type="button"
                  onClick={clear}
                  className="text-xs text-muted-foreground hover:text-text-warm"
                >
                  Limpiar
                </button>
              </div>
              {suggestions.map(profile => (
                <button
                  key={`${profile.region}-${profile.riotId}`}
                  type="button"
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-alt transition-colors"
                  onClick={() => navigateToProfile(profile.riotId, profile.region)}
                >
                  {query.trim() ? (
                    <Image
                      src={profileIconUrl(profile.iconId)}
                      alt=""
                      width={28}
                      height={28}
                      className="rounded-full border border-border-subtle shrink-0"
                    />
                  ) : (
                    <Clock className="size-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-warm">{profile.riotId}</p>
                    <p className="text-xs text-muted-foreground">
                      {profile.region.toUpperCase()} · Nv. {profile.level}
                    </p>
                  </div>
                </button>
              ))}
            </>
          )}

          {/* Empty API results */}
          {debouncedQuery.length >= 1 && !searchLoading && !hasApiResults && !searchTarget && suggestions.length === 0 && (
            <div className="px-3 py-4 text-center text-xs text-muted-foreground space-y-1">
              <p>No se encontraron invocadores.</p>
              <p>
                Escribe tu Riot ID completo (ej: Nombre#TAG) y busca para aparecer en futuras búsquedas.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
