import Link from "next/link";
import { Sword } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border-subtle bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <Sword className="size-4 text-gold" />
            <span className="text-sm font-semibold text-gold">latamlol.gg</span>
          </div>

          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link href="/privacidad" className="hover:text-text-warm transition-colors">
              Privacidad
            </Link>
            <Link href="/terminos" className="hover:text-text-warm transition-colors">
              Términos
            </Link>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground opacity-60">
          latamlol.gg no está afiliado con Riot Games. League of Legends y todos los
          materiales relacionados son propiedad de Riot Games, Inc.
        </p>
      </div>
    </footer>
  );
}
