import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const plans = [
  {
    name: "Starter",
    price: "50",
    features: ["Groupe de 30 créateurs", "Objectifs basiques", "Support communautaire"],
    recommended: false
  },
  {
    name: "Pro",
    price: "100",
    features: ["Groupe de 15 créateurs", "Objectifs avancés", "Analyses de performance", "Accès prioritaire"],
    recommended: true
  },
  {
    name: "Elite",
    price: "200",
    features: ["Groupe de 5 créateurs", "Coaching personnalisé", "Stratégie sur mesure", "Ligne directe fondateurs"],
    recommended: false
  }
]

export function Pricing() {
  return (
    <section className="py-24 md:py-32">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Investis en toi-même
          </h2>
          <p className="mt-4 text-muted-foreground">
            Résultats proportionnels à l’effort fourni et au niveau du groupe.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <div 
              key={plan.name} 
              className={`relative flex flex-col rounded-xl border p-8 shadow-sm transition-all hover:shadow-md ${plan.recommended ? 'border-primary ring-1 ring-primary' : 'bg-card'}`}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  Recommandé
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="mt-2 flex items-baseline">
                  <span className="text-4xl font-extrabold">{plan.price}€</span>
                  <span className="ml-2 text-muted-foreground">/mois</span>
                </div>
              </div>

              <ul className="mb-8 flex-1 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button className="w-full" variant={plan.recommended ? "default" : "outline"} asChild>
                <Link href="/signup">Choisir {plan.name}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
