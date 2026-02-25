import Image from "next/image";
import { runeIconUrl } from "@/lib/ddragon";
import type { MerakiRunePage, DDragonRuneStyle } from "@/types/champion";
import { cn } from "@/lib/utils";

interface RuneDisplayProps {
  runes: MerakiRunePage;
  runeStyles?: DDragonRuneStyle[];
  compact?: boolean;
}

function RuneIcon({
  runeId,
  styles,
  size = 28,
  className,
}: {
  runeId: number;
  styles?: DDragonRuneStyle[];
  size?: number;
  className?: string;
}) {
  // Find the rune icon from styles data
  let iconPath = "";

  if (styles) {
    for (const style of styles) {
      for (const slot of style.slots) {
        const rune = slot.runes.find(r => r.id === runeId);
        if (rune) {
          iconPath = rune.icon;
          break;
        }
      }
      if (iconPath) break;

      // Also check style itself
      if (style.id === runeId) {
        iconPath = style.icon;
        break;
      }
    }
  }

  if (!iconPath || !runeId) {
    return (
      <div
        className={cn("rounded-full bg-surface-alt border border-border-subtle", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <Image
      src={runeIconUrl(iconPath)}
      alt={String(runeId)}
      width={size}
      height={size}
      className={cn("rounded-full", className)}
      unoptimized
    />
  );
}

export function RuneDisplay({ runes, runeStyles, compact = false }: RuneDisplayProps) {
  const size = compact ? 24 : 32;

  return (
    <div className={cn("flex gap-4", compact ? "items-center" : "flex-col sm:flex-row")}>
      {/* Primary rune tree */}
      <div className="flex flex-col items-center gap-2">
        {!compact && (
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Principal
          </p>
        )}
        <div className={cn("flex items-center", compact ? "gap-1" : "flex-col gap-2")}>
          <RuneIcon
            runeId={runes.primaryRune}
            styles={runeStyles}
            size={compact ? 30 : 40}
            className={compact ? "" : "ring-1 ring-gold/30"}
          />
          {!compact && runes.secondaryRunes.slice(0, 3).map((id, i) => (
            <RuneIcon key={i} runeId={id} styles={runeStyles} size={size} />
          ))}
        </div>
      </div>

      {!compact && (
        <>
          {/* Secondary rune tree */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Secundario
            </p>
            <div className="flex flex-col gap-2">
              {runes.secondaryRunes.slice(3).map((id, i) => (
                <RuneIcon key={i} runeId={id} styles={runeStyles} size={size} />
              ))}
            </div>
          </div>

          {/* Stat shards */}
          {runes.shards.length > 0 && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Fragmentos
              </p>
              <div className="flex flex-col gap-2">
                {runes.shards.map((id, i) => (
                  <RuneIcon key={i} runeId={id} styles={runeStyles} size={20} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
