"use client"

import { Activity, BarChart3, Eye, Heart, MessageCircle, Share2, TrendingUp, UserPlus, Zap } from "lucide-react"
import { motion, useInView, animate } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export function AlgorithmExplainer() {
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { amount: 0.2, once: false })

  return (
    <section ref={containerRef} className="py-24 md:py-32 bg-background border-y relative overflow-hidden">
      <div className="container mx-auto max-w-6xl px-4">
        
        {/* HEADER */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
           <h2 className="text-3xl font-black tracking-tight md:text-5xl mb-6">
             Comment fonctionne <br/>
             <span className="text-primary">l’algorithme TikTok</span> ?
           </h2>
           <p className="text-lg text-muted-foreground leading-relaxed">
             TikTok ne récompense pas le talent <em>au hasard</em>. <br/>
             Il fonctionne par <strong>tests successifs</strong>.
           </p>
        </div>

        {/* PHASES - 3 COLUMNS */}
        <div className="grid md:grid-cols-3 gap-8 mb-24 relative">
           {/* Connecting Line (Desktop) */}
           <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-muted via-primary to-muted z-0" />
           
           {/* Phase 1 */}
           <div className="relative z-10 bg-background p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-xl font-bold mb-4 border-4 border-background mx-auto">1</div>
              <h3 className="text-xl font-bold text-center mb-2">Le Test Initial</h3>
              <p className="text-sm text-center text-muted-foreground mb-4">Les premières minutes Tik Tok observe :</p>
              <div className="space-y-3 text-sm bg-muted/30 p-4 rounded-xl">
                 <p className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-primary" />
                    Le temps de visionnage
                 </p>
                 <p className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    Le nombre de likes, commentaires, favoris

                 </p>
                  <p className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    la vitesse à laquelle ces interactions arrivent
                 </p>
                 <p className="font-medium text-xs text-primary mt-2">
                    👉 Si l’engagement est rapide et concentré : Passe au niveau 2
                 </p>
              </div>
           </div>

           {/* Phase 2 */}
           <div className="relative z-10 bg-background p-6 rounded-2xl border-2 border-primary/20 shadow-lg scale-105">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                 ZONE TROUPERS
              </div>
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mb-4 border-4 border-background mx-auto">2</div>
              <h3 className="text-xl font-bold text-center mb-2">L’Amplification</h3>
              <p className="text-sm text-center text-muted-foreground mb-4">Si les signaux sont bons, TikTok élargit la diffusion</p>
              <div className="space-y-3 text-sm bg-primary/5 p-4 rounded-xl">
                 <p className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-primary" />
                    A des profils similaires
                 </p>
                 <p className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    Page "For You"
                 </p>
                 <p className="font-medium text-xs text-primary mt-2">
                  La vidéo est alors retestée en continu.
                 </p>
              </div>
           </div>

           {/* Phase 3 */}
           <div className="relative z-10 bg-background p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-xl font-bold mb-4 border-4 border-background mx-auto">3</div>
              <h3 className="text-xl font-bold text-center mb-2">La Propagation</h3>
              <p className="text-sm text-center text-muted-foreground mb-4">Viralité durable</p>
              <div className="space-y-3 text-sm bg-muted/30 p-4 rounded-xl">
                 <p className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                   Quand une vidéo :

                 </p>
                 <p className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-green-500" />
                    •⁠  ⁠est bien regardée <br/>
•⁠  ⁠génère de vrais commentaires <br/>
•⁠  ⁠apporte des abonnements <br/>

                 </p>
                 <p className="font-medium text-xs text-muted-foreground mt-2">
                    👉 TikTok la laisse tourner *plusieurs heures, parfois plusieurs jours.

                 </p>
              </div>
           </div>
        </div>

      </div>
    </section>
  )
}
