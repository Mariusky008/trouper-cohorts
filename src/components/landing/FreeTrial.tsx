import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"

export function FreeTrial() {
  return (
    <section className="py-24 md:py-32 bg-primary text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] animate-shine" />
      
      <div className="container relative z-10 mx-auto max-w-4xl px-4 text-center">
        <div className="inline-flex items-center rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-3 py-1 text-sm mb-8 backdrop-blur-sm">
          <Sparkles className="mr-2 h-4 w-4" />
          Essai gratuit 7 jours
        </div>
        
        <h2 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl">
          Teste la puissance du groupe.
        </h2>
        
        <p className="mx-auto mb-10 max-w-2xl text-xl text-primary-foreground/80">
          Intègre une petite escouade test. Fournis un effort léger. Accède au dashboard complet.
          Vois tes premiers résultats dès cette semaine.
        </p>
        
        <Button size="lg" variant="secondary" className="h-14 px-8 text-lg w-full sm:w-auto" asChild>
          <Link href="/signup">
            Rejoindre le programme gratuit
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
        
        <p className="mt-6 text-sm text-primary-foreground/60">
          Aucun engagement. Arrête quand tu veux.
        </p>
      </div>
    </section>
  )
}
