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
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#10193D_0%,#0C122B_45%,#090B16_100%)] text-white pb-24 md:pb-8">
      <div className="mx-auto max-w-6xl px-4 pt-[calc(env(safe-area-inset-top)+14px)] pb-5 md:px-6 md:pt-8 md:pb-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">S18 SCAN</p>
              <h1 className="mt-1 text-2xl md:text-4xl font-black leading-tight">Popey Human • Radar Quotidien</h1>
              <p className="mt-0.5 text-[11px] text-white/70">Mode escouade: une action claire, un impact direct.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/popey-human/app/annuaire"
                className="h-10 rounded-xl px-3 inline-flex items-center text-xs font-black uppercase tracking-wide border border-white/20 bg-black/25 text-white/90"
              >
                Annuaire
              </Link>
              <Link
                href="/popey-human/app/profile"
                className="h-10 rounded-xl px-3 inline-flex items-center text-xs font-black uppercase tracking-wide border border-white/20 bg-black/25 text-white/90"
              >
                Profil
              </Link>
            </div>
          </header>
        </div>

        <div className="mt-5">{children}</div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 px-4 pt-2 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur border-t border-white/10 bg-[#0B0D0E]/95">
        <div className="mx-auto max-w-6xl grid grid-cols-4 gap-2 items-end">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`h-12 rounded-xl text-xs font-black uppercase tracking-wide inline-flex items-center justify-center transition ${
                item.active
                  ? item.label === "Signal"
                    ? "bg-gradient-to-r from-emerald-400 to-cyan-300 text-[#11252C] shadow-[0_14px_28px_-16px_rgba(52,211,153,0.95)]"
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
