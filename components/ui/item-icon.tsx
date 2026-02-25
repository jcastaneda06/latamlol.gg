"use client";

import Image from "next/image";
import { useState } from "react";
import { itemIconUrl } from "@/lib/ddragon";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** Highlights numbers in tooltip text: red for damage context, gold for other values. Export for reuse. */
export function FormattedDescription({ text }: { text: string }) {
  const parts = text.split(/(\d+)/);
  const elements = parts.map((part, i) => {
    if (/^\d+$/.test(part)) {
      const textAfter = parts.slice(i + 1).join("");
      const isDamage = /\bde\s*daño\b|daño\s*(verdadero|mágico|físico)?\b/i.test(textAfter);
      return (
        <span key={i} className={isDamage ? "text-loss font-medium" : "text-gold font-medium"}>
          {part}
        </span>
      );
    }
    return part;
  });
  return <>{elements}</>;
}

export interface ItemTooltipInfo {
  name: string;
  description?: string;
  gold?: number;
}

interface ItemIconProps {
  itemId: number;
  size?: number;
  label?: string;
  patch?: string;
  className?: string;
  /** Trinket style: slightly muted */
  trinket?: boolean;
  /** Item info for hover tooltip (name, description, gold) */
  tooltipInfo?: ItemTooltipInfo | null;
  /** @deprecated Use tooltipInfo instead */
  name?: string;
}

/**
 * Renders an item icon from Data Dragon.
 * Shows a placeholder when the image fails to load (e.g. removed items, CDN 404).
 */
export function ItemIcon({
  itemId,
  size = 36,
  label,
  patch,
  className,
  trinket = false,
  tooltipInfo,
  name,
}: ItemIconProps) {
  const [hasError, setHasError] = useState(false);
  const info = tooltipInfo ?? (name ? { name } : null);
  const hasTooltip = itemId > 0 && (info?.name ?? true);

  if (!itemId || itemId <= 0) {
    return (
      <div
        className={cn(
          "rounded border border-border-subtle bg-surface-alt shrink-0",
          className
        )}
        style={{ width: size, height: size }}
      />
    );
  }

  const tooltipContent = hasTooltip ? (
    <div className="max-w-[260px] space-y-1.5">
      <p className="font-semibold text-[13px]">{info?.name ?? `Item ${itemId}`}</p>
      {info?.gold !== undefined && info.gold > 0 && (
        <p className="text-xs text-gold font-medium">
          💰 {info.gold} de oro
        </p>
      )}
      {info?.description && (
        <p className="text-xs text-text-muted whitespace-pre-wrap leading-relaxed">
          <FormattedDescription text={info.description} />
        </p>
      )}
    </div>
  ) : (
    `Item ${itemId}`
  );

  if (hasError) {
    const placeholder = (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded border border-border-subtle bg-surface-alt text-[10px] text-muted-foreground cursor-default",
          trinket && "opacity-80",
          className
        )}
        style={{ width: size, height: size }}
      >
        ?
      </div>
    );
    return hasTooltip ? (
      <Tooltip>
        <TooltipTrigger asChild>{placeholder}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-[240px]">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    ) : (
      placeholder
    );
  }

  const icon = (
    <div className="flex flex-col items-center gap-1">
      <Image
        src={itemIconUrl(itemId, patch)}
        alt={String(itemId)}
        width={size}
        height={size}
        className={cn(
          "rounded border border-border-subtle shrink-0 transition-colors cursor-default",
          !trinket && "hover:border-gold",
          trinket && "opacity-80",
          className
        )}
        unoptimized
        onError={() => setHasError(true)}
      />
      {label && <span className="text-[10px] text-muted-foreground">{label}</span>}
    </div>
  );

  return hasTooltip ? (
    <Tooltip>
      <TooltipTrigger asChild>{icon}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-[240px]">
        {tooltipContent}
      </TooltipContent>
    </Tooltip>
  ) : (
    icon
  );
}
