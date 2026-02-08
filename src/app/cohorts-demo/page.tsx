import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, CalendarDays, CheckCircle2, Target, Timer, Trophy } from "lucide-react"

const highlights = [
  {
    title: "Un plan clair, chaque jour",
    description: "Tu avances avec une mission unique à exécuter, puis tu passes à la suivante.",
    icon: Target,
  },
  {
    title: "Preuves = discipline",
    description: "Tu soumets un lien ou une capture. Tu ne restes pas dans l’intention, tu agis.",
    icon: CheckCircle2,
  },
  {
    title: "Scoreboard motivation",
    description: "Tu vois ton rythme vs le groupe. Ça pousse à tenir le sprint.",
    icon: Trophy,
  },
  {
    title: "Cadence 14 jours",
    description: "Un format court, intense, facile à vendre et à livrer.",
    icon: Timer,
  },
]

export default function CohortsDemoSprintPage() {
  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <Badge variant="secondary">MVP Cohorts</Badge>
          <h1 className="text-3xl font-black tracking-tight md:text-4xl">
            Sprint Créateur 14 jours
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Un programme court où tu exécutes des missions quotidiennes, tu postes des preuves,
            et tu joues le classement. Le but: livrer des résultats visibles sans blabla.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/reservation">
              S’inscrire à la prochaine cohorte <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/cohorts-demo/today">Voir l’écran 2</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg">Ce que tu vois en arrivant</CardTitle>
            <p className="text-sm text-muted-foreground">
              Une vue sprint simple: dates, objectifs, règles, et bouton “Start”.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CalendarDays className="h-4 w-4 text-primary" />
                Dates
              </div>
              <div className="text-sm text-muted-foreground">
                Jour 1 → Jour 14 (format cohort). Départ commun, fin commune.
              </div>
            </div>
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Target className="h-4 w-4 text-primary" />
                Objectif
              </div>
              <div className="text-sm text-muted-foreground">
                14 posts, 14 optimisations, 14 itérations. Tu construis le volume.
              </div>
            </div>
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Timer className="h-4 w-4 text-primary" />
                Temps quotidien
              </div>
              <div className="text-sm text-muted-foreground">
                20–45 minutes: exécution + preuve.
              </div>
            </div>
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Trophy className="h-4 w-4 text-primary" />
                Score
              </div>
              <div className="text-sm text-muted-foreground">
                Points de régularité + bonus “preuve rapide” + streak.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg">Règles du sprint</CardTitle>
            <p className="text-sm text-muted-foreground">
              Un cadre simple, facile à comprendre.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
              <div>
                1 mission/jour, une par une.
              </div>
            </div>
            <div className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
              <div>
                1 preuve obligatoire (lien/capture).
              </div>
            </div>
            <div className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
              <div>
                Classement public dans la cohorte.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {highlights.map((h) => (
          <Card key={h.title} className="border-primary/10">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base flex items-center gap-2">
                <h.icon className="h-4 w-4 text-primary" />
                {h.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{h.description}</p>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}

