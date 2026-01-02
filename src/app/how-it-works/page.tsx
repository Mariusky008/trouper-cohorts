import { Footer } from "@/components/layout/Footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle, Users, Zap, Shield, Trophy, Target, ArrowRight } from "lucide-react"

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Simple Header */}
      <nav className="p-6 border-b flex justify-between items-center container mx-auto">
        <Link href="/" className="font-black text-xl tracking-tighter flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          <span>TROUPERS</span>
        </Link>
        <div className="flex gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Connexion</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/signup">S'inscrire</Link>
          </Button>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
           <div className="container mx-auto px-4 text-center max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
                 Le Manuel du Soldat
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                 Troupers n'est pas un bot. C'est un système discipliné d'entraide humaine.
                 Voici comment nous hackons l'algorithme ensemble.
              </p>
           </div>
        </section>

        {/* Steps */}
        <section className="py-16 container mx-auto px-4 max-w-5xl space-y-24">
           
           {/* Step 1 */}
           <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="flex-1 space-y-4">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                    <Users className="h-4 w-4" /> Étape 1 : L'Enrôlement
                 </div>
                 <h2 className="text-3xl font-bold">Rejoignez une Escouade</h2>
                 <p className="text-lg text-muted-foreground">
                    Dès votre inscription, vous êtes assigné à une <strong>Escouade Alpha</strong> de 50 créateurs motivés.
                    Ce n'est pas un groupe Facebook bordélique. C'est votre unité tactique.
                 </p>
                 <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                       <CheckCircle className="h-5 w-5 text-green-500" />
                       <span>Vous vous abonnez aux 49 autres membres.</span>
                    </li>
                    <li className="flex items-center gap-2">
                       <CheckCircle className="h-5 w-5 text-green-500" />
                       <span>Ils s'abonnent à vous en retour.</span>
                    </li>
                 </ul>
              </div>
              <div className="flex-1 bg-slate-100 rounded-2xl p-8 aspect-video flex items-center justify-center">
                 <div className="text-6xl">🤝</div>
              </div>
           </div>

           {/* Step 2 */}
           <div className="flex flex-col md:flex-row-reverse gap-12 items-center">
              <div className="flex-1 space-y-4">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-bold text-sm">
                    <Target className="h-4 w-4" /> Étape 2 : La Mission Quotidienne
                 </div>
                 <h2 className="text-3xl font-bold">Action Massive & Coordonnée</h2>
                 <p className="text-lg text-muted-foreground">
                    Chaque matin, le QG génère vos ordres de mission. Vous devez interagir avec une partie de votre escouade.
                 </p>
                 <div className="bg-slate-50 p-4 rounded-lg border text-sm space-y-2">
                    <p><strong>Rotation Intelligente :</strong></p>
                    <p>33% de Likes ❤️ / 33% de Commentaires 💬 / 33% de Favoris ⭐</p>
                    <p className="text-muted-foreground italic">Cela garantit des signaux variés à l'algorithme TikTok.</p>
                 </div>
              </div>
              <div className="flex-1 bg-slate-100 rounded-2xl p-8 aspect-video flex items-center justify-center">
                 <div className="text-6xl">📱</div>
              </div>
           </div>

           {/* Step 3 */}
           <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="flex-1 space-y-4">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 font-bold text-sm">
                    <Shield className="h-4 w-4" /> Étape 3 : Le Protocole Mercenaire
                 </div>
                 <h2 className="text-3xl font-bold">Tolérance Zéro pour les Déserteurs</h2>
                 <p className="text-lg text-muted-foreground">
                    Si vous ne remplissez pas votre mission avant minuit, vous devenez une cible.
                 </p>
                 <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-red-600 font-medium">
                       <Shield className="h-5 w-5" />
                       <span>Votre mission est offerte en "Prime" aux autres.</span>
                    </li>
                    <li className="flex items-center gap-2 text-red-600 font-medium">
                       <Shield className="h-5 w-5" />
                       <span>Un mercenaire fait le travail à votre place.</span>
                    </li>
                    <li className="flex items-center gap-2 text-red-600 font-medium">
                       <Shield className="h-5 w-5" />
                       <span>Il VOLE vos crédits et votre XP.</span>
                    </li>
                 </ul>
              </div>
              <div className="flex-1 bg-slate-100 rounded-2xl p-8 aspect-video flex items-center justify-center">
                 <div className="text-6xl">💀</div>
              </div>
           </div>

           {/* Step 4 */}
           <div className="flex flex-col md:flex-row-reverse gap-12 items-center">
              <div className="flex-1 space-y-4">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 font-bold text-sm">
                    <Zap className="h-4 w-4" /> Étape 4 : Le Boost
                 </div>
                 <h2 className="text-3xl font-bold">La Récompense Ultime</h2>
                 <p className="text-lg text-muted-foreground">
                    En cumulant des crédits, vous débloquez des "Boost Windows".
                    Pendant 15 minutes, votre vidéo est la CIBLE PRIORITAIRE de toute la plateforme.
                 </p>
                 <p className="font-bold text-yellow-600">
                    Résultat : 50 à 100 interactions en 15 minutes. L'algorithme explose.
                 </p>
              </div>
              <div className="flex-1 bg-slate-100 rounded-2xl p-8 aspect-video flex items-center justify-center">
                 <div className="text-6xl">🚀</div>
              </div>
           </div>

        </section>

        {/* CTA */}
        <section className="py-24 bg-primary text-primary-foreground text-center">
           <div className="container mx-auto px-4">
              <h2 className="text-3xl font-black mb-6">PRÊT À ENTRER DANS LA DANSE ?</h2>
              <Button size="lg" variant="secondary" className="text-lg font-bold h-14 px-8" asChild>
                 <Link href="/signup">
                    REJOINDRE L'ESCOUADE MAINTENANT <ArrowRight className="ml-2" />
                 </Link>
              </Button>
           </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
