"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Rocket, Target, CheckCircle, Shield, TrendingUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function WelcomePopup() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("troupers_welcome_seen_v1")
    if (!hasSeenWelcome) {
      setIsOpen(true)
    }
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    localStorage.setItem("troupers_welcome_seen_v1", "true")
  }

  const steps = [
    {
      icon: Rocket,
      title: "1️⃣ Lance ta journée",
      desc: "Colle l’URL de ta vidéo ou post du jour. C’est sur ce contenu que la troupe va agir.",
      color: "text-blue-500"
    },
    {
      icon: Target,
      title: "2️⃣ Rejoins ton escouade",
      desc: "Abonne-toi à tous les créateurs de ton groupe. Ils s’abonneront à toi en retour.",
      color: "text-purple-500"
    },
    {
      icon: CheckCircle,
      title: "3️⃣ Exécute tes missions",
      desc: "Likes, commentaires, partages. Avance jusqu’à 100% de complétion. Discipline pure.",
      color: "text-green-500"
    },
    {
      icon: Shield,
      title: "4️⃣ Le groupe agit pour toi",
      desc: "Ce que tu donnes, tu le reçois. Vérifie ton bilan chaque jour.",
      color: "text-orange-500"
    },
    {
      icon: TrendingUp,
      title: "5️⃣ La traction s’installe",
      desc: "Jour après jour, ton engagement augmente et ton compte commence à décoller.",
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
