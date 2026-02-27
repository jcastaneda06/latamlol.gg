import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getChampionById, getCurrentPatch, championSplashUrl, getAllRunes } from "@/lib/ddragon";
import { getMerakiChampionBuild } from "@/lib/meraki";
import { BuildDisplay } from "@/components/champion/BuildDisplay";
import { RuneDisplay } from "@/components/champion/RuneDisplay";
import { AdBanner } from "@/components/ads/AdBanner";
import { formatPercent } from "@/lib/utils";
import { absoluteUrl } from "@/lib/seo";

interface Props {
  params: Promise<{ championId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { championId } = await params;
  const title = `${championId} - Estadisticas y Construccion`;
  const description = `Tier, construcciones, runas y estadisticas de ${championId} en el meta actual de League of Legends.`;
  return {
    title,
    description,
    alternates: {
      canonical: `/campeones/${championId}`,
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/campeones/${championId}`),
    },
  };
}

export const revalidate = 21600;

export default async function ChampionDetailPage({ params }: Props) {
  const { championId } = await params;
  const [patch, champData, build, runeStyles] = await Promise.allSettled([
    getCurrentPatch(),
    getChampionById(championId),
    getMerakiChampionBuild(championId),
    getAllRunes(),
  ]);

  const champ = champData.status === "fulfilled" ? champData.value : null;
  if (!champ) notFound();

  const champBuild = build.status === "fulfilled" ? build.value : null;
  const runes = runeStyles.status === "fulfilled" ? runeStyles.value : [];
  const patchVersion = patch.status === "fulfilled" ? patch.value : "15.x";
  const splashUrl = championSplashUrl(championId, 0);

  const stats = champ.stats;
  const statLabels: Record<string, string> = {
    hp: "Vida", hpperlevel: "Vida/Nv", mp: "Maná", mpperlevel: "Maná/Nv",
    movespeed: "Velocidad", armor: "Armadura", armorperlevel: "Armadura/Nv",
    spellblock: "Res. Mágica", spellblockperlevel: "RMag/Nv",
    attackrange: "Rango de Ataque", hpregen: "Regen. Vida", hpregenperlevel: "RegenVida/Nv",
    mpregen: "Regen. Maná", attackdamage: "Daño de Ataque", attackdamageperlevel: "DA/Nv",
    attackspeedperlevel: "Vel. Ataque/Nv", attackspeed: "Velocidad de Ataque",
    crit: "Probabilidad Crítica",
  };

  return (
    <div>
      {/* Splash art header */}
      <div className="relative h-64 overflow-hidden sm:h-80">
        <Image
          src={splashUrl}
          alt={champ.name}
          fill
          className="object-cover object-top"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A0E1A]/60 to-[#0A0E1A]" />
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C89B3C]">
            {champ.tags.join(" · ")}
          </p>
          <h1 className="text-3xl font-black text-[#F0E6D3] sm:text-4xl">{champ.name}</h1>
          <p className="text-[#A0AEC0]">{champ.title}</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <div className="flex gap-6">
          {/* Main content */}
          <div className="min-w-0 flex-1 space-y-6">
            {/* Tab links */}
            <div className="flex gap-1 border-b border-[#1E2D40]">
              <span className="border-b-2 border-[#C89B3C] px-4 pb-2 text-sm font-semibold text-[#C89B3C]">
                Vista General
              </span>
              <Link
                href={`/campeones/${championId}/construcciones`}
                className="px-4 pb-2 text-sm text-[#A0AEC0] hover:text-[#F0E6D3] transition-colors"
              >
                Construcciones
              </Link>
            </div>

            {/* Meraki stats overview */}
            {champBuild && (
              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard label="% Victoria" value={formatPercent(champBuild.winRate)} positive={champBuild.winRate >= 50} />
                <StatCard label="% Selección" value={formatPercent(champBuild.pickRate)} />
                <StatCard label="Partidas (muestra)" value={champBuild.games.toLocaleString("es-MX")} />
              </div>
            )}

            {/* Recommended Build */}
            {champBuild && (
              <div className="rounded-xl border border-[#1E2D40] bg-surface p-5">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#A0AEC0]">
                  Construcción Recomendada
                </h2>
                <BuildDisplay items={champBuild.items} patch={patchVersion} />
              </div>
            )}

            {/* Runes */}
            {champBuild?.runes && (
              <div className="rounded-xl border border-[#1E2D40] bg-surface p-5">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#A0AEC0]">Runas</h2>
                <RuneDisplay runes={champBuild.runes} runeStyles={runes} />
              </div>
            )}

            {/* Base Stats */}
            <div className="rounded-xl border border-[#1E2D40] bg-surface p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#A0AEC0]">
                Estadísticas Base
              </h2>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
                {Object.entries(stats)
                  .filter(([key]) => statLabels[key])
                  .map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between border-b border-[#1E2D40]/50 py-1.5">
                      <span className="text-xs text-[#A0AEC0]">{statLabels[key]}</span>
                      <span className="text-xs font-semibold text-[#F0E6D3]">{val}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Matchups */}
            {champBuild?.matchups && (
              <div className="grid gap-4 sm:grid-cols-2">
                <MatchupList title="Mejores enfrentamientos" matchups={champBuild.matchups.best} type="best" />
                <MatchupList title="Peores enfrentamientos" matchups={champBuild.matchups.worst} type="worst" />
              </div>
            )}

            {/* Lore */}
            <div className="rounded-xl border border-[#1E2D40] bg-surface p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#A0AEC0]">Historia</h2>
              <p className="text-sm leading-relaxed text-[#A0AEC0]">{champ.blurb}</p>
            </div>
          </div>

          {/* Sidebar Ad */}
          <aside className="hidden w-[300px] shrink-0 space-y-4 lg:block">
            <AdBanner
              slot={process.env.NEXT_PUBLIC_AD_SLOT_RECTANGLE ?? ""}
              format="rectangle"
              className="mx-auto"
            />
            <AdBanner
              slot={process.env.NEXT_PUBLIC_AD_SLOT_RECTANGLE ?? ""}
              format="half-page"
              className="mx-auto"
            />
          </aside>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="rounded-lg border border-[#1E2D40] bg-surface p-4 text-center">
      <p className="text-xs text-[#A0AEC0]">{label}</p>
      <p className={`mt-1 text-xl font-bold ${positive === true ? "text-win" : positive === false ? "text-loss" : "text-[#F0E6D3]"}`}>
        {value}
      </p>
    </div>
  );
}

function MatchupList({
  title,
  matchups,
  type,
}: {
  title: string;
  matchups: Array<{ championId: string; winRate: number }>;
  type: "best" | "worst";
}) {
  return (
    <div className="rounded-xl border border-[#1E2D40] bg-surface p-5">
      <h2 className="mb-3 text-sm font-semibold text-[#A0AEC0]">{title}</h2>
      <div className="space-y-2">
        {matchups.map(m => (
          <Link
            key={m.championId}
            href={`/campeones/${m.championId}`}
            className="flex items-center justify-between hover:bg-surface-alt rounded px-2 py-1 transition-colors"
          >
            <span className="text-sm text-[#F0E6D3]">{m.championId}</span>
            <span className={`text-sm font-semibold ${type === "best" ? "text-win" : "text-loss"}`}>
              {formatPercent(m.winRate)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
