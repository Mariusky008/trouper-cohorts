"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ArrowRight, CheckCircle2, Link2, UploadCloud } from "lucide-react"

const proofTypes = [
  { id: "url", label: "Lien (TikTok / Drive / Notion)" },
  { id: "screenshot", label: "Capture (upload)" },
]

export default function CohortsDemoProofPage() {
  const [proofType, setProofType] = useState<(typeof proofTypes)[number]["id"]>("url")
  const [url, setUrl] = useState("")
  const [fileName, setFileName] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    if (proofType === "url") return url.trim().length > 8
    return Boolean(fileName)
  }, [proofType, url, fileName])

  const handleSubmit = () => {
    if (!canSubmit) {
      toast.error("Ajoute une preuve", { description: "Lien ou capture, au choix." })
      return
    }
    toast.success("Preuve enregistrée", { description: "Points +1 (démo)." })
    setUrl("")
    setFileName(null)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <Badge variant="secondary">Écran 3 — Preuves</Badge>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">
            Soumettre une preuve
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Le sprint n’est pas basé sur des “promesses”. Une mission validée = une preuve.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/cohorts-demo/leaderboard">
            Aller à l’écran 4 <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <Card className="max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg">Preuve du jour</CardTitle>
          <p className="text-sm text-muted-foreground">
            Exemple: lien de post, capture d’écran d’analytics, validation d’un script, etc.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2">
            <Label>Type de preuve</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              {proofTypes.map((t) => (
                <Button
                  key={t.id}
                  type="button"
                  variant={proofType === t.id ? "default" : "outline"}
                  onClick={() => setProofType(t.id)}
                  className="sm:flex-1"
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>

          {proofType === "url" ? (
            <div className="grid gap-2">
              <Label htmlFor="proofUrl">Lien</Label>
              <div className="flex gap-2">
                <Input
                  id="proofUrl"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://tiktok.com/@.../video/..."
                />
                <Button type="button" variant="outline" onClick={() => toast.message("Copie", { description: "Colle ton lien ici." })}>
                  <Link2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Dans le MVP, on stocke juste le lien. En prod: preuves + validation coach.
              </div>
            </div>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="proofFile">Capture</Label>
              <Input
                id="proofFile"
                type="file"
                accept="image/*"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
              />
              <div className="text-xs text-muted-foreground">
                Fichier sélectionné: {fileName ?? "aucun"}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={handleSubmit} disabled={!canSubmit} className="sm:flex-1">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Envoyer la preuve
            </Button>
            <Button
              type="button"
              variant="outline"
              className="sm:flex-1"
              onClick={() => toast.message("Upload (démo)", { description: "Dans la V1: stockage Supabase + validation coach." })}
            >
              <UploadCloud className="mr-2 h-4 w-4" />
              Stockage automatique
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

