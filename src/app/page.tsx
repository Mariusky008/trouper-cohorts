import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, CheckCircle2 } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto max-w-5xl px-4 py-5 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Trouper
          </Link>
          <Badge variant="secondary">Cohorts</Badge>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-4 py-12 space-y-12">
        <section className="grid gap-8 md:grid-cols-2 md:items-center">
          <div className="space-y-4">
            <Badge>Sprint Local</Badge>
            <h1 className="text-4xl font-black tracking-tight md:text-5xl">
              24 pros. 24 départements. 14 jours pour rayonner localement.
            </h1>
            <p className="text-muted-foreground text-lg">
              Collabs orchestrées, lives, ateliers, retours humains. L’objectif: attirer des clients dans ta localité.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/secret-cohorts">
                  Voir le concept <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Accès privé: la page concept peut être protégée par une clé.
            </div>
          </div>

          <Card className="border-primary/15">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Ce que tu achètes</CardTitle>
              <CardDescription>La valeur est dans l’orchestration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                "Collabs planifiées (duo/trio) + débats",
                "Ateliers 45 min (jour 7 + jour 14) sur TikTok/Instagram",
                "Feedback humain sur les éléments qui font signer",
                "Système DM mot-clé → RDV",
              ].map((t) => (
                <div key={t} className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                  <div>{t}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
