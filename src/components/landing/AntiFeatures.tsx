import { X, Check } from "lucide-react"

export function AntiFeatures() {
  return (
    <section className="py-24 md:py-32">
      <div className="container mx-auto max-w-4xl px-4">
        <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
          Ce que ce n'est <span className="text-destructive">PAS</span>
        </h2>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-xl border bg-destructive/5 p-8">
            <h3 className="mb-6 text-xl font-bold text-destructive flex items-center gap-2">
              <X className="h-6 w-6" /> Le Bullshit
            </h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <X className="h-5 w-5 text-destructive/60" />
                <span>Des bots ou de l'automatisation risquée</span>
              </li>
              <li className="flex items-center gap-3">
                <X className="h-5 w-5 text-destructive/60" />
                <span>De l'achat de faux abonnés</span>
              </li>
              <li className="flex items-center gap-3">
                <X className="h-5 w-5 text-destructive/60" />
                <span>Des promesses de "10k abonnés en 24h"</span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border bg-green-500/5 p-8">
            <h3 className="mb-6 text-xl font-bold text-green-600 flex items-center gap-2">
              <Check className="h-6 w-6" /> La Réalité
            </h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-600/60" />
                <span>De vrais humains motivés</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-600/60" />
                <span>Un travail réel et régulier</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-600/60" />
                <span>De la discipline pure</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
