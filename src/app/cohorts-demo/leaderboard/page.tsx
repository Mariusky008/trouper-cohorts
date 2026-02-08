import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowRight, Crown, Flame, Shield } from "lucide-react"

const demoRows = [
  { rank: 1, name: "Nina", points: 42, streak: 9, status: "En feu" },
  { rank: 2, name: "Yanis", points: 39, streak: 8, status: "Stable" },
  { rank: 3, name: "Léo", points: 35, streak: 7, status: "Stable" },
  { rank: 4, name: "Camille", points: 31, streak: 6, status: "Focus" },
  { rank: 5, name: "Inès", points: 28, streak: 5, status: "Focus" },
  { rank: 6, name: "Mehdi", points: 21, streak: 4, status: "À relancer" },
]

function statusIcon(status: string) {
  if (status === "En feu") return <Flame className="h-4 w-4 text-orange-500" />
  if (status === "Stable") return <Shield className="h-4 w-4 text-primary" />
  return <Crown className="h-4 w-4 text-muted-foreground" />
}

export default function CohortsDemoLeaderboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <Badge variant="secondary">Écran 4 — Classement</Badge>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">
            Scoreboard de cohorte
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            La mécanique “classement” rend le sprint addictif et limite l’abandon.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/cohorts-demo/admin">
            Aller à l’écran 5 <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg">Top de la semaine</CardTitle>
          <p className="text-sm text-muted-foreground">
            Points = missions validées + preuves + streak.
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>Démo — données fictives.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Membre</TableHead>
                <TableHead>Streak</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoRows.map((r) => (
                <TableRow key={r.rank}>
                  <TableCell className="font-semibold">#{r.rank}</TableCell>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.streak}j</TableCell>
                  <TableCell className="font-semibold">{r.points}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    {statusIcon(r.status)}
                    <span>{r.status}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild>
          <Link href="/reservation">S’inscrire à la cohorte</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/cohorts-demo/today">Retour à l’écran 2</Link>
        </Button>
      </div>
    </div>
  )
}

