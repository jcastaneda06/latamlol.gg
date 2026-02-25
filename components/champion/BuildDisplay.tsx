import { ItemIcon } from "@/components/ui/item-icon";
import type { MerakiItemBuild } from "@/types/champion";

interface BuildDisplayProps {
  items: MerakiItemBuild;
  patch?: string;
}

export function BuildDisplay({ items }: BuildDisplayProps) {
  return (
    <div className="space-y-4">
      {/* Starters */}
      {items.starters.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Objetos iniciales
          </p>
          <div className="flex flex-wrap gap-2">
            {items.starters.map((id, i) => (
              <ItemIcon key={i} itemId={id} size={36} />
            ))}
          </div>
        </div>
      )}

      {/* Core Build */}
      {items.core.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Objetos principales
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {items.core.map((id, i) => (
              <span key={i} className="flex items-center gap-2">
                <ItemIcon itemId={id} size={40} />
                {i < items.core.length - 1 && (
                  <span className="text-border-subtle">→</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Boots */}
      {items.boots > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Botas
          </p>
          <ItemIcon itemId={items.boots} size={36} />
        </div>
      )}

      {/* Situational */}
      {items.situational.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Objetos situacionales
          </p>
          <div className="flex flex-wrap gap-2">
            {items.situational.map((id, i) => (
              <ItemIcon key={i} itemId={id} size={36} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
