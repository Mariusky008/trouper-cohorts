import { Check, X } from "lucide-react"

export function TargetAudience() {
  return (
    <section className="bg-muted/30 py-24 md:py-32">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="grid gap-12 md:grid-cols-2">
          {/* Pour qui */}
          <div className="space-y-8">
            <h3 className="text-2xl font-bold flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              Pour toi si...
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-600 mt-1" />
                <span>Tu es un créateur sérieux prêt à travailler dur.</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-600 mt-1" />
                <span>Tu comprends que la régularité est la clé.</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-600 mt-1" />
                <span>Tu es prêt à aider les autres pour être aidé en retour.</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-600 mt-1" />
                <span>Tu cherches une discipline de fer.</span>
              </li>
            </ul>
          </div>

          {/* Pas pour qui */}
          <div className="space-y-8">
            <h3 className="text-2xl font-bold flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <X className="h-6 w-6 text-destructive" />
              </div>
              Pas pour toi si...
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <X className="h-5 w-5 text-destructive mt-1" />
                <span>Tu cherches un "bouton magique" ou un hack.</span>
              </li>
              <li className="flex items-start gap-3">
                <X className="h-5 w-5 text-destructive mt-1" />
                <span>Tu veux des résultats sans rien faire.</span>
              </li>
              <li className="flex items-start gap-3">
                <X className="h-5 w-5 text-destructive mt-1" />
                <span>Tu n'es pas prêt à jouer le jeu du collectif.</span>
              </li>
              <li className="flex items-start gap-3">
                <X className="h-5 w-5 text-destructive mt-1" />
                <span>Tu penses que l'argent achète le succès.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
