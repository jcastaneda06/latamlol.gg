import { Sword, TrendingUp, Users, Shield } from "lucide-react";
import { SearchBar } from "@/components/search/SearchBar";
import { getCurrentPatch } from "@/lib/ddragon";
import { AdBanner } from "@/components/ads/AdBanner";

export default async function HomePage() {
  const patch = await getCurrentPatch().catch(() => "15.x");

  return (
    <div className="flex flex-col">
      {/* Hero section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#C89B3C08] via-transparent to-[#0BC4B908]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent opacity-30" />

        <div className="relative mx-auto max-w-3xl px-4 py-16 text-center lg:py-24">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#C89B3C]/30 bg-surface/50 px-3 py-1 text-xs text-[#C89B3C]">
            <span className="size-1.5 rounded-full bg-win animate-pulse" />
            Parche actual: {patch}
          </div>

          <h1 className="mb-4 text-4xl font-black tracking-tight text-[#F0E6D3] sm:text-5xl lg:text-6xl">
            Estadísticas{" "}
            <span className="text-gradient-gold">latamlol.gg</span>
          </h1>

          <p className="mb-8 text-lg text-muted-foreground">
            Perfil de invocadores, historial de partidas, tier lists y construcciones
            para jugadores de Latinoamérica (LA1 y LA2).
          </p>

          <SearchBar className="mx-auto max-w-2xl" />

          <p className="mt-3 text-xs text-muted-foreground">
            Escribe el Nombre#TAG del invocador y selecciona tu región
          </p>
        </div>
      </section>

      {/* Feature cards */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Users className="size-5" style={{ color: "#C89B3C" }} />}
            title="Perfiles de Invocadores"
            description="Historial de partidas, KDA, CS/min, estadísticas por campeón y más."
            href="/perfil/la1"
          />
          <FeatureCard
            icon={<TrendingUp className="size-5" style={{ color: "#0BC4B9" }} />}
            title="Tier List de Campeones"
            description="Los mejores campeones del meta actual clasificados por rol y tier."
            href="/campeones"
          />
          <FeatureCard
            icon={<Shield className="size-5" style={{ color: "#C89B3C" }} />}
            title="Clasificación LATAM"
            description="Los mejores jugadores de LA1 y LA2 en el escalafón Desafiante."
            href="/clasificacion/la1"
          />
        </div>
      </section>

      {/* Mid-page ad — non-intrusive, between sections */}
      <div className="flex justify-center py-4 border-y border-[#1E2D40] bg-[#111827]/50">
        <AdBanner
          slot={process.env.NEXT_PUBLIC_AD_SLOT_LEADERBOARD ?? ""}
          format="leaderboard"
          className="hidden sm:block opacity-80"
        />
        <AdBanner
          slot={process.env.NEXT_PUBLIC_AD_SLOT_INLINE ?? ""}
          format="inline"
          className="sm:hidden w-full px-4 opacity-80"
        />
      </div>

      {/* Quick region links */}
      <section className="mx-auto w-full max-w-6xl px-4 py-10">
        <h2 className="mb-4 text-lg font-bold text-[#F0E6D3]">Clasificación por región</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { region: "la1", label: "LA Norte (LA1)", emoji: "🌎" },
            { region: "la2", label: "LA Sur (LA2)", emoji: "🌎" },
          ].map(r => (
            <a
              key={r.region}
              href={`/clasificacion/${r.region}`}
              className="flex items-center gap-2 rounded-lg border border-[#1E2D40] bg-surface px-4 py-3 text-sm font-medium text-[#F0E6D3] transition-colors hover:border-[#C89B3C]/40 hover:bg-surface-alt"
            >
              <span>{r.emoji}</span>
              <span>{r.label}</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="group rounded-xl border border-[#1E2D40] bg-surface p-5 transition-all hover:border-[#C89B3C]/30 hover:bg-surface-alt"
    >
      <div className="mb-3 inline-flex size-9 items-center justify-center rounded-lg bg-surface-alt border border-[#1E2D40] group-hover:border-[#C89B3C]/20">
        {icon}
      </div>
      <h3 className="mb-1 font-semibold text-[#F0E6D3]">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </a>
  );
}
