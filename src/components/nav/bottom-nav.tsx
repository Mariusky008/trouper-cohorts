"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, Trophy, User, Users, Map } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  const links = [
    {
      href: "/app/today",
      label: "Mission",
      icon: CalendarCheck,
    },
    {
      href: "/app/program",
      label: "Programme",
      icon: Map,
    },
    {
      href: "/app/crew",
      label: "Équipage",
      icon: Users,
    },
    {
      href: "/app/leaderboard",
      label: "Top",
      icon: Trophy,
    },
    {
      href: "/app/settings",
      label: "Profil",
      icon: User,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-background/80 backdrop-blur-lg md:hidden z-50 pb-safe">
      <div className="flex justify-around items-center h-16">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                isActive
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-primary/70"
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px]">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
