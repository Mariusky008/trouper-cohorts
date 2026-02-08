"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { ArrowRight, Calendar, CheckCircle2, Send, Settings2 } from "lucide-react"

type Participant = {
  name: string
  email: string
  status: "active" | "late" | "dropped"
  points: number
}

const demoParticipants: Participant[] = [
  { name: "Nina", email: "nina@email.com", status: "active", points: 42 },
  { name: "Yanis", email: "yanis@email.com", status: "active", points: 39 },
  { name: "Mehdi", email: "mehdi@email.com", status: "late", points: 21 },
  { name: "Sarah", email: "sarah@email.com", status: "dropped", points: 6 },
]

export default function CohortsDemoAdminPage() {
  const [cohortName, setCohortName] = useState("Sprint Créateur — Cohorte A")
  const [startDate, setStartDate] = useState("2026-02-16")
  const [endDate, setEndDate] = useState("2026-03-01")
  const [dailyTemplate, setDailyTemplate] = useState(
    [
      "1) Publie (même imparfait) — 1 vidéo",
      "2) Optimise le hook — 3 variantes",
      "3) Distribue — 10 commentaires utiles",
      "4) Preuve — lien/capture obligatoire",
    ].join("\n")
  )

  const stats = useMemo(() => {
    const active = demoParticipants.filter((p) => p.status === "active").length
    const late = demoParticipants.filter((p) => p.status === "late").length
    const dropped = demoParticipants.filter((p) => p.status === "dropped").length
    return { active, late, dropped }
  }, [])

  const handleSave = () => {
    toast.success("Cohorte mise à jour", { description: "Démo: sauvegarde locale." })
  }

  const handleBroadcast = () => {
    toast.message("Message envoyé", { description: "Démo: notifications email/Discord en V1." })
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <Badge variant="secondary">Écran 5 — Coach</Badge>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">
            Pilotage de cohorte
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Ici tu gères le sprint: dates, template de missions, participants, relances.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/secret-cohorts">
            Voir la landing secrète <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Actifs
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-black">{stats.active}</CardContent>
        </Card>
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> En retard
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-black">{stats.late}</CardContent>
        </Card>
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" /> Abandons
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-black">{stats.dropped}</CardContent>
        </Card>
      </div>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings">Cohorte</TabsTrigger>
          <TabsTrigger value="missions">Missions</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <Card className="max-w-3xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Réglages</CardTitle>
              <p className="text-sm text-muted-foreground">
                Nom + dates. Dans la V1: génération du “Jour X”.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="cohortName">Nom</Label>
                <Input id="cohortName" value={cohortName} onChange={(e) => setCohortName(e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Début</Label>
                  <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate">Fin</Label>
                  <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <Button variant="outline" onClick={handleBroadcast}>
                <Send className="mr-2 h-4 w-4" />
                Message de démarrage
              </Button>
              <Button onClick={handleSave}>Sauvegarder</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="missions">
          <Card className="max-w-3xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Template quotidien</CardTitle>
              <p className="text-sm text-muted-foreground">
                Dans la V1: tu crées 1 template par jour + variantes.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={dailyTemplate}
                onChange={(e) => setDailyTemplate(e.target.value)}
                className="min-h-[220px]"
              />
              <div className="text-xs text-muted-foreground">
                Astuce: plus c’est simple, plus la cohorte scale.
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSave}>Publier le template</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="participants">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Participants</CardTitle>
              <p className="text-sm text-muted-foreground">
                Dans la V1: statut + relances + export.
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {demoParticipants.map((p) => (
                    <TableRow key={p.email}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground">{p.email}</TableCell>
                      <TableCell className="font-semibold">{p.status}</TableCell>
                      <TableCell className="font-semibold">{p.points}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

