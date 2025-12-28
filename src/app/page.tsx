import { Hero } from "@/components/landing/Hero"
import { Problem } from "@/components/landing/Problem"
import { Truth } from "@/components/landing/Truth"
import { Solution } from "@/components/landing/Solution"
import { HowItWorks } from "@/components/landing/HowItWorks"
import { AntiFeatures } from "@/components/landing/AntiFeatures"
import { FreeTrial } from "@/components/landing/FreeTrial"
import { Pricing } from "@/components/landing/Pricing"
import { TargetAudience } from "@/components/landing/TargetAudience"
import { Transparency } from "@/components/landing/Transparency"
import { FinalCTA } from "@/components/landing/FinalCTA"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <Hero />
      <Problem />
      <Truth />
      <Solution />
      <HowItWorks />
      <AntiFeatures />
      <FreeTrial />
      <Pricing />
      <TargetAudience />
      <FinalCTA />
      <Transparency />
      <footer className="py-8 text-center text-sm text-muted-foreground border-t">
        <div className="container mx-auto px-4">
          <p>© {new Date().getFullYear()} Troupers. Tous droits réservés.</p>
        </div>
      </footer>
    </main>
  )
}
