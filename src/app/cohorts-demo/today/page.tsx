"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ArrowRight, CheckCircle2, ExternalLink, Play, TimerReset } from "lucide-react"

type Mission = {
  id: string
  title: string
  objective: string
  duration: string
  actionLabel: string
}

const demoMissions: Mission[] = [
  {
    id: "m1",
    title: "Publie une vidéo (format simple)",
    objective: "1 vidéo postée aujourd’hui, même imparfaite.",
    duration: "15–25 min",
    actionLabel: "Ouvrir le brief",
  },
  {
    id: "m2",
    title: "Optimise ton hook (3 variantes)",
    objective: "Écris 3 hooks. Choisis le plus agressif.",
    duration: "10–15 min",
    actionLabel: "Voir exemples",
  },
  {
    id: "m3",
    title: "Distribue (10 commentaires ciblés)",
    objective: "10 commentaires utiles sur des comptes de ta niche.",
    duration: "10–20 min",
    actionLabel: "Démarrer",
  },
]

export default function CohortsDemoTodayPage() {
  const [index, setIndex] = useState(0)
  const [opened, setOpened] = useState<Record<string, boolean>>({})
  const [done, setDone] = useState<Record<string, boolean>>({})

  const current = demoMissions[index]

  const progressValue = useMemo(() => {
    const completed = demoMissions.filter((m) => done[m.id]).length
    return Math.round((completed / demoMissions.length) * 100)
  }, [done])

  const completedCount = useMemo(() => demoMissions.filter((m) => done[m.id]).length, [done])

  const handleOpen = () => {
    setOpened((prev) => ({ ...prev, [current.id]: true }))
    toast.message("Brief ouvert", { description: "Tu peux maintenant valider la mission." })
  }

  const handleValidate = () => {
    if (!opened[current.id]) {
      toast.error("Ouvre le brief avant de valider", {
        description: "Ça simule la règle ‘preuve d’action’ du sprint.",
      })
      return
    }
    setDone((prev) => ({ ...prev, [current.id]: true }))
    toast.success("Mission validée", { description: "Passe à la suivante." })
    setIndex((prev) => Math.min(prev + 1, demoMissions.length - 1))
  }

  const nextLocked = index >= demoMissions.length - 1

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <Badge variant="secondary">Écran 2 — Aujourd’hui</Badge>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">
            Missions du jour (Focus Mode)
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Les missions sont séquentielles: tu ouvres le brief, tu exécutes, tu valides, puis tu passes à la suivante.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/cohorts-demo/proof">
            Aller à l’écran 3 <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-lg">Progression du sprint</CardTitle>
            <div className="text-sm text-muted-foreground font-medium">
              {completedCount}/{demoMissions.length} validées
            </div>
          </div>
          <Progress value={progressValue} />
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 rounded-xl border p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  Mission {index + 1}
                </div>
                <div className="text-xl font-bold">{current.title}</div>
              </div>
              {done[current.id] ? (
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Validée
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <TimerReset className="h-4 w-4" />
                  {current.duration}
                </div>
              )}
            </div>

            <div className="rounded-lg bg-muted/30 border p-4">
              <div className="text-sm font-semibold mb-1">Objectif</div>
              <div className="text-sm text-muted-foreground">{current.objective}</div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={handleOpen} variant="outline" className="sm:flex-1">
                <ExternalLink className="mr-2 h-4 w-4" />
                {current.actionLabel}
              </Button>
              <Button onClick={handleValidate} className="sm:flex-1">
                <Play className="mr-2 h-4 w-4" />
                J’ai terminé
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              Démo: la validation est bloquée tant que le brief n’a pas été “ouvert”.
            </div>
          </div>

          <div className="rounded-xl border p-5 space-y-3">
            <div className="text-sm font-bold">À venir</div>
            <div className="space-y-2">
              {demoMissions.map((m, i) => (
                <div
                  key={m.id}
                  className={[
                    "rounded-lg border px-3 py-2 text-sm flex items-center justify-between",
                    i === index ? "border-primary/40 bg-primary/5" : "bg-background",
                  ].join(" ")}
                >
                  <div className="truncate pr-2">
                    <div className="font-medium truncate">{m.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{m.duration}</div>
                  </div>
                  <div className="text-xs font-semibold">
                    {done[m.id] ? "OK" : i < index ? "..." : i === index ? "NOW" : "LOCK"}
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              disabled={nextLocked}
              onClick={() => setIndex((prev) => Math.min(prev + 1, demoMissions.length - 1))}
              className="w-full"
            >
              Mission suivante
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

