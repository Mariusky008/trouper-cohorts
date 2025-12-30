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
import Link from "next/link"
import { Shield } from "lucide-react"
import Image from "next/image"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <nav className="absolute top-0 w-full z-50 p-6 flex justify-between items-center container mx-auto">
        <div className="flex items-center gap-2">
           <Image 
             src="/logo.png" 
             alt="Troupers Logo" 
             width={0} 
             height={0} 
             sizes="100vw"
             className="rounded-lg h-10 w-auto" 
           />
        </div>
      </nav>
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
        <div className="container mx-auto px-4 flex flex-col items-center gap-4">
          <p>© {new Date().getFullYear()} Troupers. Tous droits réservés.</p>
          <div className="flex gap-4 text-xs">
            <Link href="/legal" className="hover:underline">Mentions Légales & CGU</Link>
            <Link href="/legal" className="hover:underline">Confidentialité</Link>
          </div>
          <Link 
            href="/admin" 
            className="flex items-center gap-2 text-xs opacity-50 hover:opacity-100 transition-opacity"
          >
            <Shield className="h-3 w-3" />
            Accès Admin
          </Link>
        </div>
      </footer>
    </main>
  )
}
