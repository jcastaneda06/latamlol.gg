"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
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

export function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("la1");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { recents, clear } = useRecentProfiles();

  const showDropdown = focused && (query.length === 0 || query.length >= 1);

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
    const encoded = encodeURIComponent(`${name}#${tag}`);
    router.push(`/perfil/${region}/${encoded}`);
    setFocused(false);
  }, [query, region, router]);

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

      {/* Dropdown */}
      {showDropdown && recents.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-border-subtle bg-surface shadow-2xl">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle">
            <span className="text-xs text-muted-foreground">Perfiles recientes</span>
            <button
              onClick={clear}
              className="text-xs text-muted-foreground hover:text-text-warm"
            >
              Limpiar
            </button>
          </div>
          {recents.map(profile => (
            <button
              key={`${profile.region}-${profile.riotId}`}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-alt transition-colors"
              onClick={() => {
                router.push(`/perfil/${profile.region}/${encodeURIComponent(profile.riotId)}`);
                setFocused(false);
              }}
            >
              <Clock className="size-3.5 shrink-0 text-muted-foreground" />
              <Image
                src={profileIconUrl(profile.iconId)}
                alt=""
                width={28}
                height={28}
                className="rounded-full border border-border-subtle"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-warm">{profile.riotId}</p>
                <p className="text-xs text-muted-foreground">{profile.region.toUpperCase()} · Nv. {profile.level}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
