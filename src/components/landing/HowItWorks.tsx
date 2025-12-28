import { Flag, Calendar, Swords, MessageSquare } from "lucide-react"

const steps = [
  {
    icon: Flag,
    title: "1. Choix de l’objectif",
    description: "Youtube, TikTok, Instagram ? Définis ton terrain de bataille."
  },
  {
    icon: Calendar,
    title: "2. Plan personnalisé",
    description: "Reçois tes missions quotidiennes adaptées à ton niveau."
  },
  {
    icon: Swords,
    title: "3. Exécution",
    description: "Publie ton contenu et interagis avec ta troupe. Pas d'excuses."
  },
  {
    icon: MessageSquare,
    title: "4. Retour du groupe",
    description: "Reçois engagement et feedback constructif en retour."
  }
]

export function HowItWorks() {
  return (
    <section className="py-24 md:py-32 border-t bg-muted/20">
      <div className="container mx-auto max-w-5xl px-4">
        <h2 className="mb-16 text-center text-3xl font-bold tracking-tight md:text-4xl">
          Comment ça marche
        </h2>

        <div className="grid gap-8 md:grid-cols-4 relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-border -z-10" />
          
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center bg-background md:bg-transparent p-6 md:p-0 rounded-lg border md:border-0 shadow-sm md:shadow-none relative">
              <div className="h-24 w-24 rounded-full bg-background border-2 border-primary flex items-center justify-center mb-6 shadow-sm z-10">
                <step.icon className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
