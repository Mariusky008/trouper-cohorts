import { Target, Users, Zap, Award, Repeat, ArrowRight } from "lucide-react"

export function HowItWorks() {
  return (
    <section className="py-24 md:py-32 border-b bg-muted/10">
      <div className="container mx-auto max-w-6xl px-4">
        
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <Repeat className="h-4 w-4" />
            <span>La Routine Troupers</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl mb-6">
            Un échange de puissance simple et équitable.
          </h2>
          <p className="text-lg text-muted-foreground">
            Le principe est mathématique : tu donnes de la force à 30 créateurs, et 30 créateurs te rendent cette force instantanément sur TA vidéo.
          </p>
        </div>

        <div className="grid gap-12 md:grid-cols-3 relative">
          
          {/* STEP 1 */}
          <div className="flex flex-col relative group">
            <div className="mb-6 flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-black shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
                1
              </div>
              <div className="h-0.5 flex-1 bg-gradient-to-r from-primary/50 to-transparent" />
            </div>
            
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Ta Mission Quotidienne
            </h3>
            
            <div className="rounded-xl border bg-background p-6 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-muted-foreground mb-4">
                Chaque matin, tu reçois ta feuille de route.
              </p>
              <ul className="space-y-3 text-sm font-medium">
                <li className="flex items-start gap-3">
                   <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">30</div>
                   <span>Interactions à distribuer sur les contenus de ton escouade.</span>
                </li>
                <li className="flex items-start gap-3">
                   <div className="h-5 w-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">⏱</div>
                   <span>Prend moins de 15 minutes.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* STEP 2 */}
          <div className="flex flex-col relative group">
            <div className="mb-6 flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-background border-2 border-primary text-primary flex items-center justify-center text-2xl font-black shadow-lg group-hover:scale-110 transition-transform duration-300">
                2
              </div>
              <div className="h-0.5 flex-1 bg-gradient-to-r from-primary/50 to-transparent" />
            </div>
            
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Ton Appel au Soutien
            </h3>
            
            <div className="rounded-xl border bg-background p-6 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-muted-foreground mb-4">
                Une fois tes missions validées, tu débloques ton droit de réponse.
              </p>
              <ul className="space-y-3 text-sm font-medium">
                <li className="flex items-start gap-3">
                   <ArrowRight className="h-5 w-5 text-primary shrink-0" />
                   <span>Tu soumets <strong>LA vidéo</strong> que tu veux faire exploser aujourd'hui.</span>
                </li>
                <li className="flex items-start gap-3">
                   <ArrowRight className="h-5 w-5 text-primary shrink-0" />
                   <span>Elle est automatiquement ajoutée à la feuille de route des autres.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* STEP 3 */}
          <div className="flex flex-col relative group">
            <div className="mb-6 flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-black shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
                3
              </div>
            </div>
            
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Zap className="h-6 w-6 text-yellow-500" />
              L'Effet Troupers
            </h3>
            
            <div className="rounded-xl border bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/20 p-6 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-muted-foreground mb-4">
                La magie opère. Ton contenu reçoit un afflux concentré.
              </p>
              <ul className="space-y-3 text-sm font-medium">
                <li className="flex items-start gap-3">
                   <div className="h-5 w-5 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center shrink-0 mt-0.5">🚀</div>
                   <span>30 interactions réelles et qualifiées en quelques heures.</span>
                </li>
                <li className="flex items-start gap-3">
                   <Award className="h-5 w-5 text-yellow-600 shrink-0" />
                   <span>Signal fort envoyé à l'algorithme : "Ce contenu intéresse les gens".</span>
                </li>
              </ul>
            </div>
          </div>

        </div>

        <div className="mt-16 p-6 rounded-2xl bg-secondary/50 border border-secondary text-center max-w-3xl mx-auto">
           <p className="text-lg font-medium">
             🔄 C'est un cercle vertueux : <br/>
             <span className="text-muted-foreground text-base">Plus tu es discipliné dans tes missions, plus ton "Score de Fiabilité" augmente, et plus ton contenu est priorisé par le groupe.</span>
           </p>
        </div>

      </div>
    </section>
  )
}
