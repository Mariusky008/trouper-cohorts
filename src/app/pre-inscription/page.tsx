import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, XCircle, Users, Bell, Play, ShieldCheck, ArrowRight, Lock, Flame } from "lucide-react"

export default function PreInscriptionPage() {
  const currentCount = 137
  const targetCount = 200
  const progressPercentage = (currentCount / targetCount) * 100

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar minimaliste */}
      <nav className="flex items-center justify-between p-6 border-b">
        <Link href="/" className="text-xl font-bold tracking-tighter">
          Troupers
        </Link>
      </nav>

      <main className="container mx-auto max-w-4xl px-4 py-12 md:py-24 space-y-24">
        
        {/* HERO SECTION */}
        <section className="text-center space-y-8">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">
            Ouverture prochaine
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Les missions ouvriront à <span className="text-primary">200 créateurs</span>.
          </h1>
          <div className="mx-auto max-w-2xl my-6">
             <p className="text-lg font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 py-3 px-6 rounded-xl inline-block shadow-sm">
                🔥 Suite au succès phénoménal de la première escouade, nous ouvrons officiellement le recrutement pour la <span className="underline decoration-wavy decoration-indigo-400">2ème Vague</span>.
             </p>
          </div>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
            Ce programme repose sur la collaboration et la rotation entre groupes. 
            Pour garantir un système équitable, efficace et discipliné, 
            le lancement se fera uniquement lorsque 200 créateurs seront inscrits.
          </p>
        </section>

        {/* CTA HAUT DE PAGE */}
        <div className="flex flex-col items-center -mt-8 mb-12 space-y-4">
          <Button 
            size="lg" 
            className="h-16 px-12 text-xl w-full max-w-md shadow-2xl shadow-primary/30 animate-in fade-in zoom-in duration-500 delay-300 rounded-full font-black tracking-wide hover:scale-105 transition-transform" 
            asChild
          >
            <Link href="/reservation">
              JE RÉSERVE MA PLACE
              <ArrowRight className="ml-2 h-6 w-6" />
            </Link>
          </Button>
          
          <div className="flex flex-col items-center gap-2">
             <p className="text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100 animate-in fade-in slide-in-from-top-2 duration-700 delay-400">
               🎁 7 jours d'essai 100% gratuit
             </p>
             <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-700 delay-500">
               <Lock className="w-3 h-3 text-slate-400" />
               Pas de spam. Tu recevras juste l'alerte de lancement.
             </p>
             
             <div className="bg-orange-50 text-orange-600 text-xs font-bold px-4 py-1.5 rounded-full inline-flex items-center gap-2 border border-orange-100 animate-pulse mt-1">
                <Flame className="w-3 h-3 fill-orange-500" /> 
                12 créateurs ont rejoint aujourd'hui
             </div>
          </div>
        </div>

        {/* COMPTEUR */}
        <section className="mx-auto max-w-xl">
          <Card className="border-2 border-primary/20 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg animate-pulse">
               REMPLISSAGE EN COURS
            </div>
            <CardContent className="pt-8 space-y-6 text-center">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Créateurs pré-inscrits à ce jour
                </h3>
                <div className="mt-2 text-5xl font-black tracking-tight text-foreground">
                  {currentCount} <span className="text-muted-foreground text-3xl">/ {targetCount}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="h-4 w-full overflow-hidden rounded-full bg-secondary relative">
                  <div 
                    className="h-full bg-primary transition-all duration-1000 ease-out relative" 
                    style={{ width: `${progressPercentage}%` }}
                  >
                     <div className="absolute top-0 right-0 bottom-0 w-full bg-gradient-to-l from-white/20 to-transparent animate-shimmer" />
                  </div>
                </div>
                <div className="flex justify-between text-xs font-medium">
                   <span className="text-primary">{progressPercentage}% atteint</span>
                   <span className="text-red-500 animate-pulse">Plus que {targetCount - currentCount} places</span>
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" />
                Ouverture automatique des missions dès que le seuil est atteint.
              </div>
            </CardContent>
          </Card>
        </section>

        {/* PREUVE SOCIALE */}
        <section className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
           <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
              {[
                 { name: "Thomas", stat: "3k abonnés", quote: "J'en ai marre de poster pour 200 vues. J'ai hâte que ça ouvre." },
                 { name: "Sarah", stat: "12k abonnés", quote: "Le concept de l'escouade est exactement ce qui manquait." },
                 { name: "Kevin", stat: "800 abonnés", quote: "Enfin un système sans bots. Je suis chaud." }
              ].map((t, i) => (
                 <div key={i} className="bg-muted/30 border p-4 rounded-xl text-sm max-w-xs flex-1 min-w-[250px]">
                    <div className="flex items-center gap-2 mb-2">
                       <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                          {t.name[0]}
                       </div>
                       <span className="font-bold text-foreground">{t.name}</span>
                       <span className="text-xs text-muted-foreground">• {t.stat}</span>
                    </div>
                    <p className="text-muted-foreground italic">"{t.quote}"</p>
                 </div>
              ))}
           </div>
           <p className="text-xs text-muted-foreground mt-4">Rejoignent la cohorte 2...</p>
        </section>

        {/* POURQUOI 200 */}
        <section className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Pourquoi ne pas lancer plus tôt ?</h2>
            <p className="text-lg text-muted-foreground">
              Parce que ce système ne fonctionne pas à moitié.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Des groupes suffisamment grands</h4>
                  <p className="text-muted-foreground text-sm">Pour assurer une dynamique constante.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Des rotations sans répétition</h4>
                  <p className="text-muted-foreground text-sm">Tu ne tombes pas toujours sur les mêmes personnes.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Une vraie traction algorithmique</h4>
                  <p className="text-muted-foreground text-sm">L'impact collectif est maximisé.</p>
                </div>
              </div>
            </div>
            <div className="rounded-l border-l-4 border-destructive bg-destructive/10 p-4">
              <p className="text-sm font-medium text-destructive-foreground">
                👉 En dessous de ce seuil, le programme perd sa valeur.
              </p>
            </div>
          </div>
          <div className="bg-muted rounded-xl p-8 flex items-center justify-center min-h-[300px]">
             {/* Placeholder for visual or just abstract pattern */}
             <Users className="w-32 h-32 text-muted-foreground/20" />
          </div>
        </section>

        {/* COMMENT CA SE PASSERA */}
        <section className="text-center space-y-12">
          <h2 className="text-3xl font-bold tracking-tight">Comment ça se passera à l’ouverture</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Bell className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Étape 1</h3>
              <p className="text-muted-foreground">Email + notification à tous les pré-inscrits</p>
            </div>
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Étape 2</h3>
              <p className="text-muted-foreground">Onboarding collectif (même jour pour tous)</p>
            </div>
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Play className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Étape 3</h3>
              <p className="text-muted-foreground">
                Lancement du Jour 1 des missions. <br/>
                Tout le monde commence ensemble.
              </p>
            </div>
          </div>
        </section>

        {/* CE QUE TU OBTIENS */}
        <section className="bg-muted/30 rounded-2xl p-8 md:p-12 border">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight">Ce que tu obtiens en te pré-inscrivant</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
             {[
               "Accès prioritaire au programme",
               "Accès au dashboard dès l’ouverture",
               "Essai gratuit 7 jours",
               "Notification immédiate au lancement"
             ].map((item, i) => (
               <div key={i} className="flex items-center gap-3 bg-background p-4 rounded-lg border">
                 <CheckCircle className="w-5 h-5 text-primary" />
                 <span className="font-medium">{item}</span>
               </div>
             ))}
          </div>
          <div className="mt-8 text-center">
            <p className="text-muted-foreground font-medium">
              Aucun paiement maintenant. Aucun engagement tant que les missions ne sont pas ouvertes.
            </p>
          </div>
        </section>

        {/* POUR QUI / POUR QUI PAS */}
        <section className="grid md:grid-cols-2 gap-8">
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="pt-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle className="w-6 h-6" /> C’est pour toi si :
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Tu es créateur sérieux</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Tu veux des résultats réels</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Tu es prêt à travailler chaque jour</span>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="border-red-500/20 bg-red-500/5">
            <CardContent className="pt-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-red-700 dark:text-red-400">
                <XCircle className="w-6 h-6" /> Ce n’est pas pour toi si :
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span>Tu veux des abonnés sans effort</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span>Tu cherches un bouton magique</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <span>Tu refuses les règles collectives</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* TRANSPARENCE */}
        <section className="text-center space-y-6 max-w-2xl mx-auto">
          <div className="flex justify-center mb-4">
            <ShieldCheck className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight uppercase text-muted-foreground">Transparence</h2>
          <p className="text-lg">
            Nous ne garantissons aucun nombre d’abonnés.
          </p>
          <div className="bg-card border p-6 rounded-lg shadow-sm">
            <p className="font-medium mb-2">Nous garantissons :</p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <span className="bg-secondary px-3 py-1 rounded-full">Un cadre clair</span>
              <span className="bg-secondary px-3 py-1 rounded-full">Un système structuré</span>
              <span className="bg-secondary px-3 py-1 rounded-full">Une communauté active</span>
            </div>
            <p className="mt-4 font-semibold text-primary">Les résultats dépendent de ton implication.</p>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="text-center py-12 space-y-6">
          <Button 
            size="lg" 
            className="h-16 px-12 text-xl w-full max-w-md shadow-2xl shadow-primary/30 rounded-full font-black tracking-wide hover:scale-105 transition-transform" 
            asChild
          >
            <Link href="/reservation">
              JE RÉSERVE MA PLACE
              <ArrowRight className="ml-2 h-6 w-6" />
            </Link>
          </Button>
          <div className="space-y-2">
             <p className="text-sm font-bold text-green-600">
               🎁 7 jours d'essai 100% gratuit
             </p>
             <p className="text-sm font-medium text-foreground">
               Aucun paiement requis aujourd'hui.
             </p>
             <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
               <Lock className="w-3 h-3" /> Pas de spam. Tu recevras juste l'alerte de lancement.
             </p>
          </div>
        </section>

      </main>
    </div>
  )
}
