import Link from "next/link";
import { SearchBar } from "@/components/search/SearchBar";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-7xl font-black text-gold/30">404</p>
      <h1 className="mt-4 text-2xl font-bold text-text-warm">
        Página no encontrada
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        La ruta que buscas no existe o fue movida.
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
