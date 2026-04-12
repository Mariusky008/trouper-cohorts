"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

type MemberShellProps = {
  children: React.ReactNode;
};

export function PopeyHumanMemberShell({ children }: MemberShellProps) {
  const pathname = usePathname();
  const navItems = useMemo(
    () => [
      { href: "/popey-human/app/clients", label: "Clients", active: pathname.startsWith("/popey-human/app/clients") },
      { href: "/popey-human/app/signal", label: "Signal", active: pathname.startsWith("/popey-human/app/signal") },
      { href: "/popey-human/app/eclaireurs", label: "Éclaireurs", active: pathname.startsWith("/popey-human/app/eclaireurs") },
      { href: "/popey-human/app/cash", label: "Cash", active: pathname.startsWith("/popey-human/app/cash") },
    ],
    [pathname]
  );

  return (
    <div className="min-h-screen bg-[#0A0B0C] text-white pb-24 md:pb-8">
      <div className="mx-auto max-w-5xl px-4 pt-[calc(env(safe-area-inset-top)+14px)] pb-5 md:px-6 md:pt-8 md:pb-8">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-300/85">
              Popey Human
            </p>
            <h1 className="mt-1 text-3xl md:text-4xl font-black leading-tight">Popey Radar</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/popey-human/app/annuaire"
              className="h-10 rounded-xl px-3 inline-flex items-center text-xs font-black uppercase tracking-wide border border-white/20 bg-white/10 text-white/90"
            >
              Annuaire
            </Link>
            <Link
              href="/popey-human/app/profile"
              className="h-10 rounded-xl px-3 inline-flex items-center text-xs font-black uppercase tracking-wide border border-white/20 bg-white/10 text-white/90"
            >
              Profil
            </Link>
          </div>
        </header>

        <div className="mt-5">{children}</div>
      </div>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 px-4 pt-2 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur border-t border-white/10 bg-[#0B0D0E]/95"
      >
        <div className="mx-auto max-w-5xl grid grid-cols-4 gap-2 items-end">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`h-12 rounded-xl text-xs font-black uppercase tracking-wide inline-flex items-center justify-center ${
                item.active
                  ? item.label === "Signal"
                    ? "bg-emerald-400 text-black shadow-[0_10px_25px_-12px_rgba(52,211,153,0.9)]"
                    : "bg-white text-black"
                  : item.label === "Signal"
                  ? "border border-emerald-300/40 text-emerald-200"
                  : "border border-white/20 text-white/75"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
