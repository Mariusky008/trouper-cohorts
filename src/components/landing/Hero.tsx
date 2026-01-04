"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, CheckCircle } from "lucide-react"
import { useState, useEffect } from "react"

export function Hero() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    // Animation initiale rapide (0 -> 137)
    const end = 137
    const duration = 2000 // 2s
    const startTime = performance.now()

    const animateCount = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing easeOutExpo for smooth finish
      const ease = 1 - Math.pow(2, -10 * progress)
      
      setCount(Math.floor(end * ease))

      if (progress < 1) {
        requestAnimationFrame(animateCount)
      } else {
        // Petit effet live : +1 inscription après quelques secondes
        setTimeout(() => {
           setCount(prev => prev + 1)
        }, 3500)
      }
    }
    
    requestAnimationFrame(animateCount)
  }, [])

  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden border-b bg-background px-4 py-24 text-center md:py-32">
      
      <div className="container relative z-10 mx-auto max-w-4xl space-y-8">
         <br/> <br/> <br/>
        
        {/* FOMO BADGE */}
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-sm font-bold text-orange-500 backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-1000">
           <span className="relative flex h-2 w-2">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
           </span>
           <span className="tabular-nums">Ouverture Cohorte 1 : {count} / 200 places réservées</span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
          Arrête de poster <span className="text-primary">dans le vide</span>.
        </h1>
       
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
         L'algorithme ignore le talent, il ne respecte que le signal. <br className="hidden md:block" />
         Troupers génère ce signal. Collectivement. Humainement.
        </p>
        
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button size="lg" className="h-14 px-8 text-lg shadow-xl shadow-primary/20" asChild>
            <Link href="/pre-inscription">
              Réserver ma place gratuite
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground font-medium">
          Accès gratuit au lancement pour les inscrits.
        </p>
      </div>

      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background opacity-50" />
    </section>
  )
}
