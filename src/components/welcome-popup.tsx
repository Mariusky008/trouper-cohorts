"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Rocket, Target, CheckCircle, Shield, TrendingUp, Clock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function WelcomePopup({ userId }: { userId?: string }) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Clear localStorage for debugging if needed
    // localStorage.removeItem("troupers_welcome_seen_v1")
    
    // Use user-specific key to avoid cross-user state on same device
    const key = userId ? `troupers_welcome_seen_${userId}` : "troupers_welcome_seen_v1"
    const hasSeenWelcome = localStorage.getItem(key)
    
    // Force popup on first load if key is missing
    if (!hasSeenWelcome) {
      setIsOpen(true)
    }
  }, [userId])

  const handleClose = () => {
    setIsOpen(false)
    const key = userId ? `troupers_welcome_seen_${userId}` : "troupers_welcome_seen_v1"
    localStorage.setItem(key, "true")
  }

  const steps = [
    {
      icon: Target,
      title: "1️⃣ Le Rendez-vous Tactique",
      desc: "Chaque jour, l'escouade se regroupe pour prendre d'assaut 8 à 12 vidéos cibles. Tu recevras des ordres précis pour chaque mission (Like, Com, Fav).",
      color: "text-blue-500"
    },
    {
      icon: Rocket,
      title: "2️⃣ Ton Tour : Protocole de Tir",
      desc: "Quand tu vois 'Vague Imminente Détectée', c'est ton moment. La viralité se joue dans la première heure.",
      color: "text-purple-500"
    },
    {
      icon: Clock,
      title: "3️⃣ Timing Critique (Règle d'Or)",
      desc: "1. Publie ta vidéo sur TikTok 30 à 60 min AVANT l'ouverture du canal.\n2. À l'heure H, colle ton lien ici pour que l'escouade attaque immédiatement.",
      color: "text-orange-500"
    },
    {
      icon: Shield,
      title: "4️⃣ Discipline de Fer",
      desc: "Pas de missions = Pas de vague. Si tu rates l'appel ou si tu triches, l'escouade t'ignorera à ton tour.",
      color: "text-red-500"
    }
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-background rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 pb-4 border-b flex items-start justify-between bg-muted/30">
              <div>
                <h2 className="text-2xl font-bold">Bienvenue Soldat 🫡</h2>
                <p className="text-muted-foreground text-sm mt-1">Voici ta feuille de route pour réussir.</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2 text-muted-foreground hover:text-foreground" onClick={handleClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className={`mt-1 h-10 w-10 shrink-0 rounded-full bg-muted flex items-center justify-center ${step.color} bg-opacity-10`}>
                    <step.icon className={`h-5 w-5 ${step.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-1">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-6 pt-4 border-t bg-muted/30">
              <Button className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90" onClick={handleClose}>
                Compris, à l'attaque ! 🚀
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
