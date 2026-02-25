import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, ChevronRight } from "lucide-react";
import { scrapePatchList } from "@/lib/scraper";
import { getCachedPatchNotes, setCachedPatchNotes } from "@/lib/supabase";
import { AdBanner } from "@/components/ads/AdBanner";

export const metadata: Metadata = {
  title: "Notas de Parche — latamlol.gg",
  description: "Notas de todos los parches de League of Legends en español.",
};

export const revalidate = 86400; // 24 hours

export default async function ParchesPage() {
  const patches = await scrapePatchList();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 lg:px-6">
      <h1 className="mb-6 text-2xl font-bold text-[#F0E6D3]">Notas de Parche</h1>

      <div className="space-y-3">
        {patches.map((patch, idx) => (
          <>
            <Link
              key={patch.version}
              href={`/parches/${patch.version}`}
              className="flex items-center justify-between rounded-xl border border-[#1E2D40] bg-surface p-4 transition-all hover:border-[#C89B3C]/30 hover:bg-surface-alt group"
            >
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-lg bg-surface-alt border border-[#1E2D40] group-hover:border-[#C89B3C]/20">
                  <span className="text-sm font-bold text-[#C89B3C]">{patch.version}</span>
                </div>
                <div>
                  <p className="font-semibold text-[#F0E6D3]">{patch.title}</p>
                  {patch.publishedAt && (
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[#A0AEC0]">
                      <Calendar className="size-3" />
                      <span>
                        {new Date(patch.publishedAt).toLocaleDateString("es-MX", {
                          day: "numeric", month: "long", year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <ChevronRight className="size-4 text-[#A0AEC0] group-hover:text-[#C89B3C] transition-colors" />
            </Link>

            {/* Ad after every 5 patches */}
            {(idx + 1) % 5 === 0 && idx + 1 < patches.length && (
              <div key={`ad-${idx}`} className="flex justify-center py-2">
                <AdBanner
                  slot={process.env.NEXT_PUBLIC_AD_SLOT_INLINE ?? ""}
                  format="inline"
                  className="w-full max-w-2xl opacity-80"
                />
              </div>
            )}
          </>
        ))}
      </div>

      {patches.length === 0 && (
        <div className="rounded-xl border border-[#1E2D40] bg-surface p-8 text-center">
          <p className="text-[#A0AEC0]">No se encontraron notas de parche.</p>
        </div>
      )}
    </div>
  );
}
