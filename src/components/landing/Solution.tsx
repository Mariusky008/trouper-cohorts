import { Shield, Users, Target, Zap } from "lucide-react"

const features = [
  {
    icon: Users,
    title: "Groupe Fermé",
    description: "Rejoins une escouade de 10 à 30 créateurs du même niveau. Pas de tourisme."
  },
  {
    icon: Target,
    title: "Actions Guidées",
    description: "Chaque jour, une liste précise d'actions à effectuer. Pas de place pour le doute."
  },
  {
    icon: Zap,
    title: "Effort Réciproque",
    description: "Tu donnes de la force, tu en reçois. Le système vérifie tout."
  }
]

export function Solution() {
  return (
    <section className="bg-background py-24 md:py-32">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-primary tracking-wider uppercase">La Solution</span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
            Le Programme Troupers
          </h2>
          <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
            Un système d’entraide structuré entre créateurs motivés.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature, i) => (
            <div key={i} className="flex flex-col items-center text-center p-6 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 flex justify-center gap-8 text-sm font-medium text-muted-foreground uppercase tracking-widest">
          <span className="flex items-center gap-2"><Shield className="h-4 w-4" /> Cadré</span>
          <span className="flex items-center gap-2"><Target className="h-4 w-4" /> Mesuré</span>
          <span className="flex items-center gap-2"><Users className="h-4 w-4" /> Discipliné</span>
        </div>
      </div>
    </section>
  )
}
