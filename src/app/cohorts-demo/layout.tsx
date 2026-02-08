import Link from "next/link"
import { Button } from "@/components/ui/button"

const navItems = [
  { href: "/cohorts-demo", label: "1. Sprint" },
  { href: "/cohorts-demo/today", label: "2. Aujourd’hui" },
  { href: "/cohorts-demo/proof", label: "3. Preuves" },
  { href: "/cohorts-demo/leaderboard", label: "4. Classement" },
  { href: "/cohorts-demo/admin", label: "5. Coach" },
]

export default function CohortsDemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b">
        <div className="container mx-auto max-w-5xl px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="text-lg font-bold tracking-tight">
              Troupers
            </Link>
            <div className="text-xs text-muted-foreground font-medium">
              Démo Cohorts
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Button key={item.href} variant="outline" size="sm" asChild>
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
      <main className="container mx-auto max-w-5xl px-4 py-10">{children}</main>
    </div>
  )
}

