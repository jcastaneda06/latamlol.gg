"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/campeones", label: "Campeones" },
  { href: "/clasificacion/la1", label: "Clasificación" },
  { href: "/parches", label: "Parches" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border-subtle glassmorphism">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 lg:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg tracking-wide"
          onClick={() => setMobileOpen(false)}
        >
          <svg viewBox="0 0 32 32" className="size-6" aria-hidden>
              <defs>
                <linearGradient id="nav-g" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#C89B3C" />
                  <stop offset="100%" stopColor="#F0E6A2" />
                </linearGradient>
              </defs>
              <polygon points="16,2 28,9 28,23 16,30 4,23 4,9" fill="#0A0E1A" stroke="url(#nav-g)" strokeWidth="2" />
              <rect x="14.5" y="7" width="3" height="15" fill="url(#nav-g)" rx="1" />
              <polygon points="16,5 18,9 16,7.5 14,9" fill="url(#nav-g)" />
              <rect x="10" y="19" width="12" height="2.5" fill="#0AC8B9" rx="1" />
              <circle cx="16" cy="24" r="2.5" fill="#0A0E1A" stroke="url(#nav-g)" strokeWidth="1.5" />
            </svg>
          <span className="text-gradient-gold hidden sm:block">latamlol.gg</span>
          <span className="text-gradient-gold sm:hidden">LATAM</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded px-3 py-1.5 text-sm font-medium transition-colors",
                pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))
                  ? "bg-surface text-gold border border-border-subtle"
                  : "text-text-muted hover:text-text-warm hover:bg-surface"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile toggle */}
        <button
          className="rounded p-1.5 text-text-muted hover:text-text-warm md:hidden"
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Menú"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-border-subtle bg-surface md:hidden">
          <div className="flex flex-col gap-1 px-4 py-3">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded px-3 py-2 text-sm font-medium transition-colors",
                  pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))
                    ? "bg-surface-alt text-gold"
                    : "text-text-muted hover:text-text-warm"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
