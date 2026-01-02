import { Hero } from "@/components/landing/Hero"
import { HowItWorks } from "@/components/landing/HowItWorks"
import { BoostWindowFeature } from "@/components/landing/BoostWindowFeature"
import { AlgorithmExplainer } from "@/components/landing/AlgorithmExplainer"
import { Problem } from "@/components/landing/Problem"
import { Truth } from "@/components/landing/Truth"
import { Solution } from "@/components/landing/Solution"
import { AntiFeatures } from "@/components/landing/AntiFeatures"
import { MarketPosition } from "@/components/landing/MarketPosition"
import { FreeTrial } from "@/components/landing/FreeTrial"
import { Pricing } from "@/components/landing/Pricing"
import { TargetAudience } from "@/components/landing/TargetAudience"
import { Transparency } from "@/components/landing/Transparency"
import { FinalCTA } from "@/components/landing/FinalCTA"
import { Footer } from "@/components/layout/Footer"
import Link from "next/link"
import { Shield } from "lucide-react"
import { GlitchLogo } from "@/components/ui/glitch-logo"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <nav className="absolute top-0 w-full z-50 p-6 flex justify-between items-center container mx-auto">
        <div className="flex items-center gap-2">
           <GlitchLogo 
             width={0} 
             height={0} 
             sizes="100vw"
             imageClassName="h-32 w-auto rounded-lg"
             className="rounded-lg"
           />
        </div>
        <div className="flex gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Se connecter</Link>
          </Button>
          <Button size="sm" className="hidden sm:inline-flex" asChild>
            <Link href="/signup">S'inscrire</Link>
          </Button>
        </div>
      </nav>
      <Hero />
      <HowItWorks />
      <BoostWindowFeature />
      <AlgorithmExplainer />
      <Problem />
      <Truth />
      <Solution />
      <AntiFeatures />
      <MarketPosition />
      <FreeTrial />
      <Pricing />
      <TargetAudience />
      <FinalCTA />
      <Transparency />
      <Footer />
    </main>
  )
}
