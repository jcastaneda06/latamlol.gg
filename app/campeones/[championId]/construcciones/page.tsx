import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getChampionById, getAllRunes, championIconUrl, getCurrentPatch } from "@/lib/ddragon";
import { getMerakiChampionBuild } from "@/lib/meraki";
import { BuildDisplay } from "@/components/champion/BuildDisplay";
import { RuneDisplay } from "@/components/champion/RuneDisplay";
import { AdBanner } from "@/components/ads/AdBanner";
import type { ChampionRole } from "@/types/champion";

const ROLES: { value: ChampionRole; label: string }[] = [
  { value: "top", label: "Cima" },
  { value: "jungle", label: "Jungla" },
  { value: "mid", label: "Centro" },
  { value: "adc", label: "Tirador" },
  { value: "support", label: "Soporte" },
];

interface Props {
  params: Promise<{ championId: string }>;
  searchParams: Promise<{ role?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { championId } = await params;
  return { title: `${championId} — Construcciones` };
}

export const revalidate = 21600;

export default async function ChampionBuildsPage({ params, searchParams }: Props) {
  const { championId } = await params;
  const { role } = await searchParams;
  const selectedRole = role as ChampionRole | undefined;

  const [champData, buildData, runeStyles, patch] = await Promise.allSettled([
    getChampionById(championId),
    getMerakiChampionBuild(championId, selectedRole),
    getAllRunes(),
    getCurrentPatch(),
  ]);

  const champ = champData.status === "fulfilled" ? champData.value : null;
  if (!champ) notFound();

  const build = buildData.status === "fulfilled" ? buildData.value : null;
  const runes = runeStyles.status === "fulfilled" ? runeStyles.value : [];
  const patchVersion = patch.status === "fulfilled" ? patch.value : "15.x";

  const spellAbbr: Record<number, string> = {
    4: "Flash", 14: "Ignite", 11: "Smite", 12: "Teleporte",
    21: "Barrera", 3: "Agotamiento", 7: "Curar", 6: "Fantasmal",
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 lg:px-6">
      <div className="mb-4 flex items-center gap-3">
        <Image
          src={championIconUrl(championId, patchVersion)}
          alt={champ.name}
          width={48}
          height={48}
          className="rounded-full border border-[#1E2D40]"
          unoptimized
        />
        <div>
          <div className="flex items-center gap-2">
            <Link href={`/campeones/${championId}`} className="text-sm text-[#A0AEC0] hover:text-[#C89B3C]">
              ← {champ.name}
            </Link>
          </div>
          <h1 className="text-xl font-bold text-[#F0E6D3]">Construcciones · {champ.name}</h1>
        </div>
      </div>

      {/* Role tabs */}
      <div className="mb-6 flex gap-1 border-b border-[#1E2D40]">
        <Link
          href={`/campeones/${championId}/construcciones`}
          className={`px-4 pb-2 text-sm font-medium transition-colors ${!selectedRole ? "border-b-2 border-[#C89B3C] text-[#C89B3C]" : "text-[#A0AEC0] hover:text-[#F0E6D3]"}`}
        >
          Principal
        </Link>
        {ROLES.map(r => (
          <Link
            key={r.value}
            href={`/campeones/${championId}/construcciones?role=${r.value}`}
            className={`px-4 pb-2 text-sm font-medium transition-colors ${selectedRole === r.value ? "border-b-2 border-[#C89B3C] text-[#C89B3C]" : "text-[#A0AEC0] hover:text-[#F0E6D3]"}`}
          >
            {r.label}
          </Link>
        ))}
      </div>

      {!build ? (
        <div className="rounded-xl border border-[#1E2D40] bg-surface p-8 text-center">
          <p className="text-[#A0AEC0]">No hay datos de construcción disponibles para este rol.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            {/* Overview stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-[#1E2D40] bg-surface p-4 text-center">
                <p className="text-xs text-[#A0AEC0]">Rol</p>
                <p className="mt-1 font-bold text-[#F0E6D3] capitalize">{build.role}</p>
              </div>
              <div className="rounded-lg border border-[#1E2D40] bg-surface p-4 text-center">
                <p className="text-xs text-[#A0AEC0]">% Victoria</p>
                <p className={`mt-1 font-bold ${build.winRate >= 50 ? "text-win" : "text-loss"}`}>
                  {build.winRate.toFixed(1)}%
                </p>
              </div>
              <div className="rounded-lg border border-[#1E2D40] bg-surface p-4 text-center">
                <p className="text-xs text-[#A0AEC0]">Muestra</p>
                <p className="mt-1 font-bold text-[#F0E6D3]">{build.games.toLocaleString("es-MX")}</p>
              </div>
            </div>

            {/* Summoner Spells */}
            <div className="rounded-xl border border-[#1E2D40] bg-surface p-5">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#A0AEC0]">
                Hechizos de Invocador
              </h2>
              <div className="flex gap-2 text-sm text-[#F0E6D3]">
                <span className="rounded border border-[#1E2D40] bg-surface-alt px-3 py-1">
                  {spellAbbr[build.summonerSpells[0]] ?? build.summonerSpells[0]}
                </span>
                <span className="rounded border border-[#1E2D40] bg-surface-alt px-3 py-1">
                  {spellAbbr[build.summonerSpells[1]] ?? build.summonerSpells[1]}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="rounded-xl border border-[#1E2D40] bg-surface p-5">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#A0AEC0]">Objetos</h2>
              <BuildDisplay items={build.items} patch={patchVersion} />
            </div>

            {/* Runes */}
            <div className="rounded-xl border border-[#1E2D40] bg-surface p-5">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#A0AEC0]">Runas</h2>
              <RuneDisplay runes={build.runes} runeStyles={runes} />
            </div>

            {/* Skill order */}
            <div className="rounded-xl border border-[#1E2D40] bg-surface p-5">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#A0AEC0]">
                Orden de Habilidades
              </h2>
              <div className="flex gap-2">
                {build.skillOrder.map((skill, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className="rounded bg-[#C89B3C] px-2 py-0.5 text-xs font-bold text-[#0A0E1A]">{skill}</span>
                    {i < build.skillOrder.length - 1 && (
                      <span className="text-[10px] text-[#A0AEC0]">→</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Ad */}
          <aside className="hidden space-y-4 lg:block">
            <AdBanner
              slot={process.env.NEXT_PUBLIC_AD_SLOT_RECTANGLE ?? ""}
              format="rectangle"
              className="mx-auto"
            />
          </aside>
        </div>
      )}
    </div>
  );
}
