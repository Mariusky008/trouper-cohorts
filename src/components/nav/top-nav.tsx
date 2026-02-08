"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function TopNav({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();

  const links = [
    { href: "/app/today", label: "Aujourd’hui" },
    { href: "/app/program", label: "Programme" },
    { href: "/app/proof", label: "Preuves" },
    { href: "/app/leaderboard", label: "Classement" },
    { href: "/app/settings", label: "Profil" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md hidden md:block">
      <div className="container mx-auto max-w-5xl px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/app/today" className="font-bold text-xl tracking-tight flex items-center gap-2">
            <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-sm font-black uppercase">Popey</span>
          </Link>
          <nav className="flex items-center gap-6">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    isActive ? "text-primary border-b-2 border-primary py-5" : "text-muted-foreground"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div>{children}</div>
      </div>
    </header>
  );
}
