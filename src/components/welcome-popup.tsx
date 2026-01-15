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
      title: "1️⃣ Gagne ton Tour (La Jauge)",
      desc: "Pour que l'escouade propulse TA vidéo, tu dois le mériter. 1 Mission accomplie = 1 Point de Charge. Remplis ta jauge à 60/60.",
      color: "text-blue-500"
    },
    {
      icon: Rocket,
      title: "2️⃣ La Récompense (Vague)",
      desc: "Dès que tu as tes 60 points, tu es programmé automatiquement. Les 70 soldats de l'escouade convergeront vers TA vidéo.",
      color: "text-purple-500"
    },
    {
      icon: Clock,
      title: "3️⃣ Timing Critique (Règle d'Or)",
      desc: "Le jour J : 1. Publie sur TikTok 30 à 60 min AVANT l'heure H. 2. Colle ton lien ici pour recevoir l'assaut.",
      color: "text-orange-500"
    },
    {
      icon: Shield,
      title: "4️⃣ Discipline de Fer",
      desc: "Pas de missions = Pas de points = Pas de vague. C'est donnant-donnant. Seuls les actifs sont récompensés.",
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
