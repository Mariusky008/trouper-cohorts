"use client"

import { Zap, Clock, TrendingUp, Check, Users, Activity, Heart, MessageCircle, Share2, Music2, Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { useInView, animate } from "framer-motion"

export function BoostWindowFeature() {
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { amount: 0.3, once: false })
  
  const [likes, setLikes] = useState(12)
  const [comments, setComments] = useState(2)
  const [shares, setShares] = useState(2)
  const [bookmarks, setBookmarks] = useState(1)
  const [isBoosting, setIsBoosting] = useState(false)

  useEffect(() => {
    if (!isInView) {
      // Reset when out of view
      setLikes(12)
      setComments(2)
      setShares(2)
      setBookmarks(1)
      setIsBoosting(false)
      return
    }

    // When in view, wait 2s then start boost
    const timer = setTimeout(() => {
      setIsBoosting(true)
      
      // Animate numbers over 10 seconds
      const controls = animate(0, 1, {
        duration: 10,
        ease: "easeOut",
        onUpdate: (value) => {
          setLikes(Math.floor(12 + (449 - 12) * value))
          setComments(Math.floor(2 + (56 - 2) * value))
          setShares(Math.floor(2 + (76 - 2) * value))
          setBookmarks(Math.floor(1 + (89 - 1) * value))
        }
      })

      return () => controls.stop()
    }, 2000)

    return () => clearTimeout(timer)
  }, [isInView])

  return (
    <section ref={containerRef} className="py-24 md:py-32 bg-slate-950 text-white relative overflow-hidden">
      {/* Background Pulse Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500/10 via-transparent to-transparent opacity-50 animate-pulse" />
      
      <div className="container mx-auto max-w-6xl px-4 relative z-10">
        
        {/* 1 & 2: Titre & Sous-titre */}
        <div className="text-center mb-8 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-yellow-500/20 px-4 py-1.5 text-sm font-bold text-yellow-400 border border-yellow-500/30 mb-4">
            <Zap className="h-4 w-4 fill-yellow-400" />
            FEATURE EXCLUSIVE
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight uppercase">
            Boost Window™
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
              Le moment où tout s’accélère.
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium">
            Un créneau collectif où toute ton escouade interagit au même moment sur une seule vidéo.
          </p>
        </div>

        {/* 3: Visuel Central (Phone UI) */}
        <div className="mb-20 flex justify-center relative h-[600px] items-center">
          
          {/* External Signal - Outside Phone */}
          <div className={`absolute top-0 z-20 flex flex-col items-center transition-all duration-700 ${isBoosting ? 'opacity-100 translate-y-0 scale-110' : 'opacity-0 -translate-y-10 scale-90'}`}>
             <div className="bg-yellow-500 text-slate-950 font-black text-lg px-6 py-2 uppercase rounded-full border-4 border-slate-900 shadow-[0_0_50px_rgba(234,179,8,0.8)] flex items-center gap-2 animate-bounce">
               ⚡️ Boost Window Active ⚡️
             </div>
             {/* Energy Beam */}
             <div className="w-2 h-20 bg-gradient-to-b from-yellow-500 to-transparent shadow-[0_0_20px_rgba(234,179,8,1)]" />
          </div>

          {/* The Phone */}
          <div className={`relative w-[300px] h-[580px] bg-black rounded-[3rem] border-8 border-slate-900 shadow-2xl overflow-hidden mt-8 ring-1 ring-white/10 group transition-all duration-500 ${isBoosting ? 'shadow-[0_0_60px_rgba(234,179,8,0.3)] scale-105' : ''}`}>
             
             {/* Dynamic Notch */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-50" />

             {/* Screen */}
             <div className="absolute inset-0 bg-gray-900 flex flex-col">
                
                {/* Video simulation */}
                <div className="flex-1 relative overflow-hidden">
                   
                   {/* Realistic Video Placeholder */}
                   <div className="absolute inset-0 bg-slate-800">
                      <Image 
                        src="https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=1000&auto=format&fit=crop" 
                        alt="TikTok Video Content"
                        fill
                        className="object-cover opacity-60"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
                   </div>
                   
                   {/* TikTok UI Overlay */}
                   <div className="absolute inset-0 p-4 pt-12 flex flex-col justify-between z-10">
                      
                      {/* Top Bar */}
                      <div className="flex justify-center gap-4 text-sm font-bold text-white/50">
                        <span>Suivis</span>
                        <span className="text-white border-b-2 border-white pb-1">Pour toi</span>
                      </div>

                      {/* Right Side Actions */}
                      <div className="absolute right-2 bottom-20 flex flex-col gap-6 items-center">
                         
                         {/* Profile */}
                         <div className="relative">
                            <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-slate-700">
                               <Image 
                                 src="/logo-v2.png" 
                                 alt="User" 
                                 width={48} 
                                 height={48} 
                               />
                            </div>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-500 rounded-full p-0.5">
                               <div className="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white">+</div>
                            </div>
                         </div>

                         {/* Likes */}
                         <div className="flex flex-col items-center gap-1">
                            <div className={`transition-all duration-300 ${isBoosting ? 'scale-125 text-red-500' : 'text-white'}`}>
                               <Heart className={`w-8 h-8 fill-current ${isBoosting ? 'animate-pulse' : ''}`} />
                            </div>
                            <span className="text-white font-bold text-xs shadow-black drop-shadow-md">
                              {likes.toLocaleString()}
                            </span>
                         </div>

                         {/* Comments */}
                         <div className="flex flex-col items-center gap-1">
                            <div className="text-white">
                               <MessageCircle className="w-8 h-8 fill-white" />
                            </div>
                            <span className="text-white font-bold text-xs shadow-black drop-shadow-md">
                              {comments.toLocaleString()}
                            </span>
                         </div>

                         {/* Bookmarks (Favoris) */}
                         <div className="flex flex-col items-center gap-1">
                            <div className="text-white">
                               <Bookmark className="w-8 h-8 fill-white" />
                            </div>
                            <span className="text-white font-bold text-xs shadow-black drop-shadow-md">
                              {bookmarks.toLocaleString()}
                            </span>
                         </div>

                         {/* Shares */}
                         <div className="flex flex-col items-center gap-1">
                            <div className="text-white">
                               <Share2 className="w-8 h-8 fill-white" />
                            </div>
                            <span className="text-white font-bold text-xs shadow-black drop-shadow-md">
                              {shares.toLocaleString()}
                            </span>
                         </div>
                      </div>

                      {/* Bottom Info */}
                      <div className="mt-auto pr-16 pb-4 space-y-2">
                         <div className="font-bold text-white shadow-black drop-shadow-md">@troupers_official</div>
                         <div className="text-sm text-white/90 leading-tight shadow-black drop-shadow-md">
                            POV: Quand tu actives ta première Boost Window 🚀 <span className="text-yellow-400 font-bold">#growth #troupers</span>
                         </div>
                         <div className="flex items-center gap-2 text-white text-xs mt-2 animate-pulse">
                            <Music2 className="w-3 h-3" />
                            <span>Son original - Troupers</span>
                         </div>
                      </div>

                   </div>

                   {/* Incoming Engagement Animation (Only during Boost) */}
                   {isBoosting && (
                      <div className="absolute inset-0 pointer-events-none z-20">
                         <div className="absolute inset-0 bg-yellow-500/10 mix-blend-overlay animate-pulse" />
                      </div>
                   )}
                </div>
             </div>
          </div>
        </div>

        {/* 4: Explication Simple (Grid) */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
             <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center mb-4">
               <Clock className="h-6 w-6 text-slate-400" />
             </div>
             <h3 className="text-lg font-bold text-white mb-2">Le Problème</h3>
             <p className="text-slate-400 text-sm">
               Quand l’engagement arrive lentement et au compte-gouttes, l’algorithme n’y prête aucune attention. C'est le silence radio.
             </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-yellow-500/30 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
             <div className="h-12 w-12 rounded-full bg-yellow-900/30 flex items-center justify-center mb-4">
               <Zap className="h-6 w-6 text-yellow-500" />
             </div>
             <h3 className="text-lg font-bold text-white mb-2">Le Déclencheur</h3>
             <p className="text-slate-300 text-sm">
               Pendant une Boost Window, les interactions de ton escouade arrivent <span className="text-yellow-400 font-bold">toutes en même temps</span>.
             </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
             <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center mb-4">
               <TrendingUp className="h-6 w-6 text-slate-400" />
             </div>
             <h3 className="text-lg font-bold text-white mb-2">L'Effet</h3>
             <p className="text-slate-400 text-sm">
               Cette vélocité soudaine crée un signal de viralité artificiel que les plateformes détectent et amplifient immédiatement.
             </p>
          </div>
        </div>

        {/* 5 & 6: Scénario & Règles */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
           
           {/* Scenario Card */}
           <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-8 shadow-2xl relative">
              <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
                 <div className="h-3 w-3 rounded-full bg-red-500" />
                 <div className="h-3 w-3 rounded-full bg-yellow-500" />
                 <div className="h-3 w-3 rounded-full bg-green-500" />
                 <span className="ml-auto text-xs font-mono text-slate-500">SESSION LIVE</span>
              </div>
              
              <div className="space-y-6">
                 <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded bg-yellow-500/20 flex items-center justify-center shrink-0">
                       <Clock className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div>
                       <p className="font-bold text-white">18:00 - Lancement</p>
                       <p className="text-sm text-slate-400">La fenêtre s'ouvre. Ton lien est partagé à l'escouade.</p>
                    </div>
                 </div>
                 
                 <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded bg-blue-500/20 flex items-center justify-center shrink-0">
                       <Users className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                       <p className="font-bold text-white">18:15 - Pic d'activité</p>
                       <p className="text-sm text-slate-400">Tous les membres likent et commentent en simultané.</p>
                    </div>
                 </div>

                 <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <p className="text-xs uppercase font-bold text-slate-500 mb-2">Résultat en 30 min</p>
                    <div className="grid grid-cols-3 gap-4 text-center">
                       <div>
                          <p className="text-2xl font-black text-white">+180</p>
                          <p className="text-[10px] text-slate-400">LIKES</p>
                       </div>
                       <div>
                          <p className="text-2xl font-black text-white">+70</p>
                          <p className="text-[10px] text-slate-400">COMS</p>
                       </div>
                       <div>
                          <p className="text-2xl font-black text-white">+20</p>
                          <p className="text-[10px] text-slate-400">SHARES</p>
                       </div>
                    </div>
                 </div>
                 <p className="text-[10px] text-slate-600 text-center italic">*exemple illustratif, résultats variables selon la taille du groupe</p>
              </div>
           </div>

           {/* Rules & Callout */}
           <div className="space-y-8">
              <div className="space-y-4">
                 <h3 className="text-2xl font-bold text-white">Cadré. Éthique. Puissant.</h3>
                 <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-slate-300">
                       <Check className="h-5 w-5 text-green-500" />
                       Interactions humaines réelles
                    </li>
                    <li className="flex items-center gap-3 text-slate-300">
                       <Check className="h-5 w-5 text-green-500" />
                       Pas de bots, pas de scripts
                    </li>
                    <li className="flex items-center gap-3 text-slate-300">
                       <Check className="h-5 w-5 text-green-500" />
                       Pas d'engagement forcé (qualité avant tout)
                    </li>
                    <li className="flex items-center gap-3 text-slate-300">
                       <Activity className="h-5 w-5 text-yellow-500" />
                       Fréquence limitée pour éviter les abus
                    </li>
                 </ul>
              </div>

              <div className="p-6 border-l-4 border-yellow-500 bg-yellow-500/5">
                 <p className="text-lg font-medium text-yellow-100">
                   "L’algorithme ne mesure pas seulement combien de réactions tu as. <br/>
                   <span className="text-yellow-400 font-bold">Il mesure à quelle vitesse elles arrivent.</span>"
                 </p>
              </div>
           </div>

        </div>

        {/* 8: CTA */}
        <div className="text-center">
           <Button 
             size="lg" 
             className="bg-white text-slate-950 hover:bg-slate-200 font-bold px-8 h-12 rounded-full"
             asChild
           >
             <Link href="/signup">
               👉 Tester gratuitement la Boost Window
             </Link>
           </Button>
           <p className="mt-3 text-xs text-slate-500">7 jours d'essai gratuit • Sans carte bancaire</p>
        </div>

      </div>
    </section>
  )
}
