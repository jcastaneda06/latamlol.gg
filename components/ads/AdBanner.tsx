"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export type AdFormat = "leaderboard" | "rectangle" | "half-page" | "inline" | "auto";

interface AdBannerProps {
  slot: string;
  format?: AdFormat;
  className?: string;
}

const formatDimensions: Record<AdFormat, string> = {
  leaderboard: "h-[90px] w-full max-w-[728px]",
  rectangle:   "h-[250px] w-[300px]",
  "half-page": "h-[600px] w-[300px]",
  inline:      "h-[90px] w-full",
  auto:        "w-full",
};

export function AdBanner({ slot, format = "auto", className }: AdBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

  useEffect(() => {
    if (initialized.current || !publisherId) return;
    initialized.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense not loaded
    }
  }, [publisherId]);

  // Development / missing publisher ID → show placeholder
  if (!publisherId) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded border border-border-subtle bg-surface-alt",
          formatDimensions[format],
          className
        )}
      >
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground opacity-50">
          Publicidad
        </span>
      </div>
    );
  }

  return (
    <div ref={adRef} className={cn("overflow-hidden", className)}>
      <p className="mb-1 text-center text-[9px] uppercase tracking-widest text-muted-foreground opacity-40">
        Publicidad
      </p>
      <ins
        className={cn("adsbygoogle block", formatDimensions[format])}
        data-ad-client={publisherId}
        data-ad-slot={slot}
        data-ad-format={format === "auto" ? "auto" : undefined}
        data-full-width-responsive={format === "auto" || format === "inline" ? "true" : undefined}
      />
    </div>
  );
}
