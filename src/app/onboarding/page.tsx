"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Youtube, Instagram, Video, Target, Users, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { TikTokIcon } from "@/components/icons/tiktok-icon"

const steps = [
  {
    id: "platform",
    title: "Quelle est ta plateforme principale ?",
    description: "Celle où tu veux concentrer tes efforts."
  },
  {
    id: "objective",
    title: "Quel est ton objectif principal ?",
    description: "Ce que tu veux accomplir dans les 30 prochains jours."
  }
]

const platforms = [
  { id: "youtube", name: "YouTube", icon: Youtube, color: "text-red-600" },
  { id: "tiktok", name: "TikTok", icon: TikTokIcon, color: "text-black dark:text-white" },
  { id: "instagram", name: "Instagram", icon: Instagram, color: "text-pink-600" },
]

const objectives = [
  { id: "visibility", name: "Visibilité", icon: TrendingUp, desc: "Augmenter mes vues et ma portée" },
  { id: "community", name: "Communauté", icon: Users, desc: "Créer un lien fort avec mon audience" },
  { id: "consistency", name: "Régularité", icon: Target, desc: "Tenir un rythme de publication strict" },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState({ platform: "", objective: "" })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleNext = async (key: string, value: string) => {
    const newData = { ...data, [key]: value }
    setData(newData)

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Finish
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          throw new Error("Utilisateur non connecté")
        }

        // 1. Update Profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            main_platform: newData.platform,
            objective: newData.objective
          })
          .eq('id', user.id)

        if (profileError) throw profileError

        // 2. Assign to "Escouade Alpha"
        // Get Squad ID
        const { data: squads, error: squadError } = await supabase
          .from('squads')
          .select('id')
          .eq('name', 'Escouade Alpha')
          .single()

        if (squadError) {
             // If squad doesn't exist, create it (fallback)
             console.error("Squad error", squadError)
        }

        if (squads) {
           const { error: memberError } = await supabase
             .from('squad_members')
             .insert({
               squad_id: squads.id,
               user_id: user.id
             })
             // Ignore duplicate key error if user already joined
             .select()
             
           if (memberError && memberError.code !== '23505') {
              throw memberError
           }
        }

        toast.success("Profil configuré !", {
          description: "Bienvenue dans ton escouade."
        })
        router.push("/dashboard")

      } catch (error: any) {
        toast.error("Erreur", {
          description: error.message || "Une erreur est survenue."
        })
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="space-y-2 text-center">
          <div className="mb-8 flex justify-center gap-2">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "h-2 w-16 rounded-full transition-colors",
                  i <= currentStep ? "bg-primary" : "bg-primary/20"
                )} 
              />
            ))}
          </div>
          <h1 className="text-3xl font-bold">{steps[currentStep].title}</h1>
          <p className="text-muted-foreground">{steps[currentStep].description}</p>
        </div>

        <div className="min-h-[300px]">
          {loading ? (
             <div className="flex items-center justify-center h-full">
               <p className="text-lg animate-pulse">Configuration de ton QG...</p>
             </div>
          ) : (
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <motion.div 
                key="platform"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid gap-4 sm:grid-cols-3"
              >
                {platforms.map((p) => {
                  const Icon = p.icon
                  return (
                  <button
                    key={p.id}
                    onClick={() => handleNext("platform", p.id)}
                    className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-background p-8 shadow-sm transition-all hover:border-primary hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <Icon className={cn("h-12 w-12", p.color)} />
                    <span className="font-semibold">{p.name}</span>
                  </button>
                  )
                })}
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div 
                key="objective"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid gap-4"
              >
                {objectives.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => handleNext("objective", o.id)}
                    className="flex items-center gap-6 rounded-xl border bg-background p-6 shadow-sm transition-all hover:border-primary hover:shadow-md text-left focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <o.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{o.name}</h3>
                      <p className="text-sm text-muted-foreground">{o.desc}</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  )
}
