import { Hero } from "@/components/landing/Hero"
import { Problem } from "@/components/landing/Problem"
import { AlgorithmExplainer } from "@/components/landing/AlgorithmExplainer"
import { CaseStudy } from "@/components/landing/CaseStudy"
import { SafeGuarantee } from "@/components/landing/SafeGuarantee"
import { FAQ } from "@/components/landing/FAQ"
import { FinalCTA } from "@/components/landing/FinalCTA"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="fixed top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            Troupers
          </Link>
          <div className="flex gap-4">
            <Button size="sm" className="hidden sm:inline-flex" asChild>
              <Link href="/pre-inscription">Réserver ma place</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        <Hero />
        
        {/* SECTION 2 : LE PROBLÈME */}
        <Problem />

        {/* CTA INTERMÉDIAIRE */}
        <div className="bg-slate-50 pb-16 text-center">
           <Button size="lg" className="h-14 px-8 text-lg shadow-xl shadow-primary/20" asChild>
              <Link href="/pre-inscription">Tester gratuitement maintenant</Link>
           </Button>
        </div>

        {/* SECTION 3 : LA SOLUTION (ALGO + COMMENT ÇA MARCHE) */}
        <AlgorithmExplainer />
        
        {/* SECTION 4 : RÉSULTATS / PREUVE SOCIALE */}
        <CaseStudy />

        {/* SECTION 5 : SÉCURITÉ */}
        <SafeGuarantee />

        {/* SECTION 6 : FAQ */}
        <FAQ />
        
        {/* SECTION 7 : CTA FINAL */}
        <FinalCTA />
      </main>

      <footer className="border-t py-12 bg-slate-50">
        <div className="container px-4 text-center">
           <div className="max-w-2xl mx-auto space-y-6">
              <h4 className="font-bold text-lg">🧠 À retenir</h4>
              <p className="text-slate-600">
                 Les créateurs qui réussissent ne postent pas plus. <br/>
                 Ils <span className="font-bold text-slate-900">démarrent mieux</span> leurs vidéos.
              </p>
              <p className="text-sm text-muted-foreground">
                 © {new Date().getFullYear()} Troupers. Fait avec discipline.
                 <Link href="/signup" className="opacity-0 hover:opacity-10 ml-2 transition-opacity cursor-default" title="Access">π</Link>
              </p>
           </div>
        </div>
      </footer>
    </div>
  )
}
