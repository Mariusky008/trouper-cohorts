// Mission Briefing Component V3.6
"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bot, User, Shield, ChevronRight, Play, AlertTriangle, Eye, Heart, MessageCircle, Share2, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface MissionBriefingProps {
    type: string
    scenario: string
    delayMinutes: number
    targetUsername: string | null
    trafficSource: string
    onBriefingComplete: () => void
}

export function MissionBriefing({ 
    type, 
    scenario, 
    delayMinutes, 
    targetUsername, 
    trafficSource,
    onBriefingComplete 
}: MissionBriefingProps) {
    const [step, setStep] = useState(0)
    const [displayedText, setDisplayedText] = useState("")
    const [isTyping, setIsTyping] = useState(false)

    const getMissionOrders = () => {
        if (scenario === 'watch_only') {
            return "Mission d'infiltration pure.\n\n1. Regarde la vidéo à 80% (ne skippe pas).\n2. NE LIKE PAS.\n3. Quitte la vidéo naturellement.\n\nObjectif : Crédibiliser ton compte comme utilisateur passif."
        }
        
        let actionText = ""
        switch(type) {
            case 'comment': actionText = "Lâche un Like et un Commentaire pertinent."; break;
            case 'favorite': actionText = "Like la vidéo et ajoute-la aux Favoris."; break;
            case 'share': actionText = "Like et utilise le bouton Partager (Copier le lien suffit)."; break;
            default: actionText = "Lâche un simple Like.";
        }

        return `Engagement actif requis.\n\n1. Regarde au moins 50% de la vidéo.\n2. ${actionText}\n3. Scrolle vers la vidéo suivante avant de revenir ici.\n\nExécution immédiate demandée.`
    }

    // Définition des étapes du dialogue
    const steps = [
        {
            title: "CIBLE IDENTIFIÉE",
            icon: <User className="h-6 w-6 text-indigo-400" />,
            text: `Soldat ! Ta cible prioritaire est @${targetUsername || "Inconnu"}.`,
            highlight: `@${targetUsername}`,
            mood: "neutral"
        },
        {
            title: "PROTOCOLE D'APPROCHE",
            icon: <Shield className="h-6 w-6 text-emerald-400" />,
            text: trafficSource === 'search' 
                ? "Approche furtive requise.\n\n1. Ouvre la recherche TikTok.\n2. Tape le pseudo.\n3. Trouve la vidéo manuellement.\n\nInterdiction de cliquer sur un lien direct." 
                : trafficSource === 'profile'
                ? "Infiltration par le profil.\n\n1. Ouvre son profil.\n2. Regarde 1 ou 2 autres vidéos rapidement.\n3. Clique sur la vidéo cible."
                : "Accès direct autorisé via le lien sécurisé.\n\nTu peux y aller directement.",
            mood: "secret"
        },
        {
            title: "PLAN D'ACTION",
            icon: <Star className="h-6 w-6 text-amber-400" />,
            text: getMissionOrders(),
            mood: "action"
        },
        {
            title: "CONFIRMATION",
            icon: <AlertTriangle className="h-6 w-6 text-red-400" />,
            text: `Attends environ ${delayMinutes} min avant d'agir pour simuler un comportement humain.\n\nSi tu es prêt, lance la mission.`,
            mood: "warning"
        }
    ]

    const currentStep = steps[step]

    // Typewriter effect
    useEffect(() => {
        setIsTyping(true)
        setDisplayedText("")
        let charIndex = 0
        const fullText = currentStep.text
        
        const timer = setInterval(() => {
            charIndex++
            setDisplayedText(fullText.slice(0, charIndex))
            
            if (charIndex >= fullText.length) {
                setIsTyping(false)
                clearInterval(timer)
            }
        }, 20)

        return () => clearInterval(timer)
    }, [step])

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1)
        } else {
            onBriefingComplete()
        }
    }

    const skipTyping = () => {
        setDisplayedText(currentStep.text)
        setIsTyping(false)
    }

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* AVATAR SECTION */}
            <div className="flex flex-col items-center mb-6 relative z-10">
                <div className={`relative h-24 w-24 rounded-full border-4 flex items-center justify-center bg-slate-900 transition-colors duration-500 shadow-2xl ${
                    currentStep.mood === 'action' ? 'border-amber-500 shadow-amber-500/20' :
                    currentStep.mood === 'warning' ? 'border-red-500 shadow-red-500/20' :
                    currentStep.mood === 'secret' ? 'border-emerald-500 shadow-emerald-500/20' :
                    'border-indigo-500 shadow-indigo-500/20'
                }`}>
                    {/* Placeholder Avatar - Can be replaced by an Image */}
                    <Bot className={`h-12 w-12 transition-all duration-300 ${
                        currentStep.mood === 'action' ? 'text-amber-400 scale-110' :
                        currentStep.mood === 'warning' ? 'text-red-400 animate-pulse' :
                        'text-indigo-400'
                    }`} />
                    
                    {/* Online Status */}
                    <div className="absolute bottom-1 right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
                </div>
                
                <div className="mt-2 bg-slate-800 text-white px-3 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase border border-slate-700">
                    QG Troupers
                </div>
            </div>

            {/* DIALOG BOX */}
            <div 
                className="relative bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] transition-all"
                onClick={isTyping ? skipTyping : undefined}
            >
                {/* Speech Bubble Arrow */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border-t-2 border-l-2 border-slate-900 rotate-45"></div>

                {/* Header */}
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                    {currentStep.icon}
                    <h3 className="font-black text-sm uppercase tracking-wider text-slate-800">
                        {currentStep.title}
                    </h3>
                    <div className="ml-auto text-xs font-bold text-slate-400">
                        {step + 1} / {steps.length}
                    </div>
                </div>

                {/* Text Area */}
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 min-h-[140px] max-h-[240px] overflow-y-auto text-lg font-medium text-slate-700 leading-relaxed cursor-pointer scrollbar-thin scrollbar-thumb-slate-200 shadow-inner whitespace-pre-wrap">
                    {displayedText}
                    {isTyping && <span className="animate-pulse ml-1 text-indigo-500">|</span>}
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-end">
                    <Button 
                        onClick={handleNext} 
                        disabled={isTyping}
                        className={`font-bold transition-all ${
                            isTyping ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
                        } ${
                            step === steps.length - 1 
                            ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200' 
                            : 'bg-slate-900 text-white'
                        }`}
                    >
                        {step === steps.length - 1 ? (
                            <>
                                À VOS ORDRES <Play className="ml-2 h-4 w-4 fill-current" />
                            </>
                        ) : (
                            <>
                                SUIVANT <ChevronRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>
                
                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 rounded-b-xl overflow-hidden">
                    <motion.div 
                        className="h-full bg-indigo-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>
            
            <p className="text-center text-[10px] text-slate-400 mt-4 uppercase tracking-widest animate-pulse">
                Transmission Sécurisée v3.5
            </p>
        </div>
    )
}
