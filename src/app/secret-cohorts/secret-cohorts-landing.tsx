"use client"

import Link from "next/link"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, CalendarDays, CheckCircle2, Gauge, Layers, MapPin, MessageSquareText, Mic2, Shield, Trophy, Users, Video, Zap } from "lucide-react"

const formSchema = z.object({
  firstName: z.string().min(2, "Le prénom est requis"),
  lastName: z.string().min(2, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  channelUrl: z.string().url("URL de chaîne invalide"),
})

const screens = [
  {
    title: "1) Sprint",
    description: "Vue d’ensemble: dates, règles, objectif, bouton Start.",
    href: "/cohorts-demo",
    icon: Layers,
  },
  {
    title: "2) Aujourd’hui (Focus Mode)",
    description: "Missions séquentielles, validation guidée, progression claire.",
    href: "/cohorts-demo/today",
    icon: Zap,
  },
  {
    title: "3) Preuves",
    description: "Lien ou capture: chaque mission validée a une preuve.",
    href: "/cohorts-demo/proof",
    icon: Shield,
  },
  {
    title: "4) Classement",
    description: "Scoreboard simple: régularité, streak, bonus.",
    href: "/cohorts-demo/leaderboard",
    icon: Trophy,
  },
  {
    title: "5) Coach",
    description: "Pilotage: template, participants, relances.",
    href: "/cohorts-demo/admin",
    icon: Gauge,
  },
]

export default function SecretCohortsLanding() {
  const supabase = createClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { firstName: "", lastName: "", email: "", phone: "", channelUrl: "" },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      const { error } = await supabase.from("pre_registrations").insert({
        first_name: values.firstName,
        last_name: values.lastName,
        email: values.email,
        phone: values.phone,
        channel_url: values.channelUrl,
      })
      if (error) throw error
      setIsSuccess(true)
      toast.success("Inscription enregistrée", { description: "Tu es sur la liste de la prochaine cohorte." })
    } catch (e) {
      toast.error("Erreur", { description: "Impossible d’enregistrer l’inscription. Réessaie." })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b">
        <div className="container mx-auto max-w-5xl px-4 py-5 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Troupers
          </Link>
          <Badge variant="secondary">Landing privée</Badge>
        </div>
      </nav>

      <main className="container mx-auto max-w-5xl px-4 py-12 space-y-14">
        <section className="grid gap-8 md:grid-cols-2 md:items-center">
          <div className="space-y-4">
            <Badge>Sprint Local</Badge>
            <h1 className="text-4xl font-black tracking-tight md:text-5xl">
              24 pros. 24 départements. 14 jours pour rayonner localement.
            </h1>
            <p className="text-muted-foreground text-lg">
              Exemple: 24 coachs sportifs (1 par département). Mais le format marche aussi pour 24 nutritionnistes, 24
              profs de yoga, 24 kinés, 24 coiffeurs, 24 agents immo, etc. L’objectif est simple: être vu partout dans ton
              département, avec des missions quotidiennes à forte valeur.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button size="lg" asChild>
                <a href="#inscription">
                  Réserver ma place <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/cohorts-demo">Voir la démo (5 écrans)</Link>
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Format cohorte: tu exécutes, tu postes une preuve, tu progresses. Pas de flou.
            </div>
          </div>

          <Card className="border-primary/15">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Ce que tu rejoins</CardTitle>
              <CardDescription>Un sprint structuré pour gagner en visibilité locale</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                "L’idée: s’unir par groupe de 24 pour rayonner chacun dans sa localité",
                "Quand: 14 jours",
                "But: gagner de nouveaux clients et devenir visible",
                "Chaque jour: missions très spécifiques + preuve",
                "Cohorte par métier (ex: coachs) + invités complémentaires (nutrition/ostéo/vente) en live",
              ].map((t) => (
                <div key={t} className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                  <div>{t}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Pourquoi 24 départements</CardTitle>
              <CardDescription>Tu es en groupe, mais tu protèges ton marché local.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <MapPin className="h-4 w-4 text-primary" />
                  1 place par département
                </div>
                <div className="text-sm text-muted-foreground">
                  Les gens s’entraident vraiment parce qu’ils ne se volent pas les mêmes clients.
                </div>
              </div>
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Users className="h-4 w-4 text-primary" />
                  Entraide structurée
                </div>
                <div className="text-sm text-muted-foreground">
                  Feedback sur hooks, scripts, CTA, offres. On corrige et on poste.
                </div>
              </div>
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Video className="h-4 w-4 text-primary" />
                  Collabs et clips
                </div>
                <div className="text-sm text-muted-foreground">
                  Les lives duo/trio créent du contenu long + 10 clips rapides à réutiliser.
                </div>
              </div>
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Mic2 className="h-4 w-4 text-primary" />
                  Autorité locale
                </div>
                <div className="text-sm text-muted-foreground">
                  Plus tu prends la parole, plus tu deviens la référence dans ton département.
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Ce que tu obtiens</CardTitle>
              <CardDescription>À la fin des 14 jours</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                "14 posts (minimum) publiés",
                "Des scripts réutilisables (hooks + CTA)",
                "Des lives collabs (si tu passes en duo/trio)",
                "Une routine quotidienne qui tient",
              ].map((t) => (
                <div key={t} className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                  <div>{t}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-black tracking-tight">Ce que tu obtiens pour 199€</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg">La valeur n’est pas dans une checklist</CardTitle>
                <CardDescription>
                  Tu payes pour des collabs orchestrées, des passages en live, des ateliers, et du feedback humain.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                  "24 places / 24 départements: cohorte par métier (ex: 24 coachs) avec 1 place par département",
                  "3 lives collab minimum (duo/trio) planifiés pour toi (thèmes + structure + horaires)",
                  "2 ateliers 45 min (Jour 7 + Jour 14) sur TikTok/Instagram pour attirer des prospects",
                  "1 débat trio (format reach) + plan clips pour transformer le live en contenu",
                  "2 retours humains (audit bio/offre + audit DM/CTA) pour corriger ce qui bloque les clients",
                  "Système DM mot-clé: capture de leads + relance post-live → RDV",
                  "Invités complémentaires selon les cohortes (nutrition, ostéo, vente, tournage) pour mixer les audiences",
                ].map((t) => (
                  <div key={t} className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                    <div>{t}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg">En 1 phrase</CardTitle>
                <CardDescription>Ce que tu dois répéter dans tes annonces</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-lg border bg-muted/20 p-4 text-muted-foreground">
                  Tu ne payes pas pour “poster plus”. Tu payes pour des collabs orchestrées, des lives, des ateliers et
                  des retours humains qui te mettent devant de nouvelles audiences et te font convertir.
                </div>
                <div className="text-xs text-muted-foreground">
                  La cohorte est par métier (ex: coachs). Les invités servent à ajouter une couche “multi-thématiques”
                  sans casser la cohérence.
                </div>
                <Button asChild className="w-full">
                  <a href="#inscription">Réserver ma place</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-black tracking-tight">Comment ça se passe</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">Jours 1–4</CardTitle>
                <CardDescription>Fondations + engouement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div>Tu poses les bases: offre claire, bio propre, angle local.</div>
                <div>Tu crées l’engouement autour de ta profession (série de posts + annonces).</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">À partir du Jour 5</CardTitle>
                <CardDescription>Rotation live duo/trio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div>Chaque jour, 2–3 pros passent en live ensemble (collab planifiée).</div>
                <div>Le reste observe, commente utilement, puis fait la même chose le lendemain.</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">Intervenants (parfois)</CardTitle>
                <CardDescription>Experts invités</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div>Selon la cohorte, un invité intervient en live (thème précis).</div>
                <div>But: mélanger les communautés et créer des pics d’audience.</div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-black tracking-tight">Ateliers “conférence” (45 min)</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  2 fois pendant les 14 jours
                </CardTitle>
                <CardDescription>Ex: Jour 7 + Jour 14</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <div>Tu prépares un atelier gratuit avec exercices (adapté à ton métier).</div>
                <div>Coach: séance guidée. Nutrition: conseils + plan simple. Graphiste: exercice live.</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-base flex items-center gap-2">
                  <Video className="h-4 w-4 text-primary" />
                  Directement sur TikTok / Instagram
                </CardTitle>
                <CardDescription>Zéro friction pour l’audience</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <div>Tu fais l’atelier en live sur ta plateforme.</div>
                <div>La cohorte annonce et pousse l’événement pour créer un pic d’attention.</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquareText className="h-4 w-4 text-primary" />
                  Capture de leads via DM
                </CardTitle>
                <CardDescription>Le but: des clients, pas seulement des vues</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <div>CTA simple: “DM ATELIER” → tu envoies le rappel + le plan.</div>
                <div>Après le live: follow-up DM + proposition de RDV / offre.</div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-black tracking-tight">Le storytelling (très important)</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg">Ce que les gens doivent comprendre</CardTitle>
                <CardDescription>Ça doit se voir dans tes vidéos, tes lives et tes posts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="rounded-lg border p-4">
                  <div className="font-semibold text-foreground mb-1">Annonce</div>
                  <div>
                    “Je participe à un défi de 14 jours pour me faire connaître dans mon département.”
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="font-semibold text-foreground mb-1">Difficulté</div>
                  <div>
                    “C’est dur: une mission par jour, des collabs, des lives, et des preuves. Je relève le défi.”
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg">Pourquoi ça convertit</CardTitle>
                <CardDescription>Les gens suivent une histoire, pas une “stratégie”.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                  "Tu deviens reconnaissable parce que tu apparais chaque jour",
                  "Les collabs te font passer devant de nouvelles audiences",
                  "Les annonces rendent le défi “public”, donc tu tiens jusqu’au bout",
                  "Les preuves montrent que tu exécutes vraiment",
                ].map((t) => (
                  <div key={t} className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                    <div>{t}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-black tracking-tight">Les 5 écrans du MVP</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {screens.map((s) => (
              <Card key={s.href} className="hover:border-primary/30 transition-colors">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    <s.icon className="h-4 w-4 text-primary" />
                    {s.title}
                  </CardTitle>
                  <CardDescription>{s.description}</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button variant="outline" asChild className="w-full">
                    <Link href={s.href}>Ouvrir l’écran</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-black tracking-tight">Garantie (conditionnelle)</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-primary/20">
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg">1 client, ou on continue</CardTitle>
                <CardDescription>
                  Si tu exécutes à 100% et que tu postes tes preuves, tu ne peux pas “perdre”.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-lg border bg-muted/20 p-4">
                  <div className="font-semibold mb-1">Notre engagement</div>
                  <div className="text-muted-foreground">
                    Si tu complètes le sprint (missions + preuves), alors soit tu signes au moins 1 client pendant ou
                    juste après le sprint, soit tu es invité gratuitement dans la cohorte suivante jusqu’à ce que tu en
                    signes 1.
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Objectif réel: des demandes qualifiées (DM / RDV), pas juste des vues.
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg">Conditions (simples)</CardTitle>
                <CardDescription>La garantie est basée sur des actions prouvables.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                  "Avoir une offre claire (résultat + prix + modalités) et des créneaux disponibles",
                  "Publier le minimum demandé (posts + rotation live si tu es programmé)",
                  "Envoyer les messages de prospection (DM) selon le script fourni",
                  "Poster une preuve chaque jour (lien/capture) dans le dashboard",
                ].map((t) => (
                  <div key={t} className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                    <div>{t}</div>
                  </div>
                ))}
                <div className="text-xs text-muted-foreground">
                  Si tu n’as pas d’offre ou pas de dispo, on commence par fixer ça dans les Jours 1–2.
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="inscription" className="space-y-6">
          <h2 className="text-2xl font-black tracking-tight">S’inscrire à la prochaine cohorte</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="md:order-2">
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg">Réservation</CardTitle>
                <CardDescription>Tu reçois les infos de départ + ton département est pré-réservé.</CardDescription>
              </CardHeader>
              <CardContent>
                {isSuccess ? (
                  <div className="rounded-xl border bg-muted/20 p-6 space-y-2">
                    <div className="text-lg font-bold">C’est enregistré.</div>
                    <div className="text-sm text-muted-foreground">
                      Tu peux maintenant voir la démo. On te recontacte pour valider le département et la date de départ.
                    </div>
                    <div className="pt-2">
                      <Button asChild>
                        <Link href="/cohorts-demo">Voir la démo</Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Prénom</Label>
                        <Input id="firstName" {...form.register("firstName")} placeholder="Jean" />
                        {form.formState.errors.firstName && (
                          <p className="text-xs text-destructive">{form.formState.errors.firstName.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Nom</Label>
                        <Input id="lastName" {...form.register("lastName")} placeholder="Dupont" />
                        {form.formState.errors.lastName && (
                          <p className="text-xs text-destructive">{form.formState.errors.lastName.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" {...form.register("email")} placeholder="jean@email.com" />
                      {form.formState.errors.email && (
                        <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input id="phone" type="tel" {...form.register("phone")} placeholder="06 12 34 56 78" />
                      {form.formState.errors.phone && (
                        <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="channelUrl">Compte / chaîne (URL)</Label>
                      <Input id="channelUrl" {...form.register("channelUrl")} placeholder="https://tiktok.com/@tonprofil" />
                      {form.formState.errors.channelUrl && (
                        <p className="text-xs text-destructive">{form.formState.errors.channelUrl.message}</p>
                      )}
                    </div>
                    <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                      {isSubmitting ? "Envoi..." : "Réserver ma place"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            <Card className="md:order-1">
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg">Pourquoi ce format marche</CardTitle>
                <CardDescription>Ce n’est pas un classement. C’est une machine à exécuter.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="rounded-lg border p-4">
                  <div className="font-semibold mb-1">Missions très spécifiques</div>
                  <div className="text-muted-foreground">
                    Live duo/trio, vidéo sur un thème précis, script DM, CTA local. Chaque jour est actionnable.
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="font-semibold mb-1">Preuves</div>
                  <div className="text-muted-foreground">
                    La preuve transforme l’intention en résultat. Lien ou capture.
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="font-semibold mb-1">Collabs et intervenants</div>
                  <div className="text-muted-foreground">
                    Les lives collabs boostent l’autorité. Et certaines cohortes ont des invités en live.
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <Button variant="outline" asChild className="w-full sm:w-auto">
                  <Link href="/reservation">Ouvrir la page complète</Link>
                </Button>
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/cohorts-demo">Voir la démo</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>
      </main>
    </div>
  )
}
