import Link from "next/link";
import { SearchBar } from "@/components/search/SearchBar";

export default function SummonerNotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex size-20 items-center justify-center rounded-full border border-border-subtle bg-surface">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="size-10 text-muted-foreground"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
          />
          <line x1="4" y1="4" x2="20" y2="20" strokeLinecap="round" />
        </svg>
      </div>

      <h1 className="mt-6 text-2xl font-bold text-text-warm">
        Invocador no encontrado
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        No pudimos encontrar este perfil. Verifica que el nombre de invocador y
        el tag sean correctos (ej. <span className="text-gold">Nombre#TAG</span>).
      </p>

      <div className="mt-8 w-full">
        <SearchBar />
      </div>

      <Link
        href="/"
        className="mt-6 rounded-md border border-gold/40 px-5 py-2 text-sm font-medium text-gold transition-colors hover:bg-gold/10"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
