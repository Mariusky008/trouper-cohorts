"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Calendar, Clock, UploadCloud, CheckCircle2, Info } from "lucide-react"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function WaveNotification({ userId }: { userId: string }) {
    // 1. ALL Hooks must be at the top level
    const [nextWave, setNextWave] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    
    // State for video submission
    const [videoLink, setVideoLink] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    // Current time reference
    const [now, setNow] = useState(new Date())

    useEffect(() => {
        // Update timer every minute to keep UI fresh
        const timer = setInterval(() => setNow(new Date()), 60000)
        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        const fetchWave = async () => {
            if (!userId) return
            const supabase = createClient()
            
            const today = new Date().toISOString().split('T')[0]
            
            // Fetch next upcoming wave
            const { data } = await supabase
                .from('daily_waves')
                .select('*')
                .eq('creator_id', userId)
                .gte('scheduled_date', today)
                .order('scheduled_date', { ascending: true })
                .limit(1)
                .single()
            
            if (data) setNextWave(data)
            setLoading(false)
        }
        
        fetchWave()
    }, [userId])

    // Effect to pre-fill if video already submitted
    useEffect(() => {
        const checkExistingVideo = async () => {
             if (!userId) return
             const supabase = createClient()
             const { data } = await supabase.from('profiles').select('current_video_url, updated_at').eq('id', userId).single()
             if (data?.current_video_url && data.current_video_url.includes('tiktok')) {
                 // Check if video is fresh (less than 24h)
                 // Use created_at or updated_at logic safely
                 const videoDate = data.updated_at ? new Date(data.updated_at) : new Date()
                 if (new Date().getTime() - videoDate.getTime() < 24 * 60 * 60 * 1000) {
                     setVideoLink(data.current_video_url)
                     setIsSubmitted(true)
                 }
             }
        }
        checkExistingVideo()
    }, [userId])

    // 2. Conditional Return AFTER hooks
    if (loading || !nextWave) return null

    // Calculate dates & Window Logic
    let waveDate = new Date()
    let publishDeadline = new Date()
    let windowOpenTime = new Date()
    let isWindowOpen = false
    let windowStatusMessage = ""
    let waveEnd = new Date()
    
    try {
        if (nextWave && nextWave.scheduled_date && nextWave.start_time) {
            waveDate = new Date(nextWave.scheduled_date + 'T' + nextWave.start_time)
            waveEnd = new Date(nextWave.scheduled_date + 'T' + nextWave.end_time)
            publishDeadline = new Date(waveDate.getTime() - 45 * 60000) // 45 min before start
            
            // Window logic: Opens 2h before start
            windowOpenTime = new Date(waveDate.getTime() - 2 * 60 * 60 * 1000)
            
            if (now < windowOpenTime) {
                 isWindowOpen = false
                 windowStatusMessage = `Ouverture du canal à ${windowOpenTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
            } else if (now > waveEnd) {
                 isWindowOpen = true 
                 windowStatusMessage = "⚠️ Retard Critique : Publie immédiatement !"
            } else {
                 isWindowOpen = true
                 windowStatusMessage = "🟢 CANAL OUVERT : Publie maintenant."
            }
        }
    } catch (e) {
        console.error("Date parsing error", e)
    }

    const isToday = nextWave ? new Date().toDateString() === new Date(nextWave.scheduled_date).toDateString() : false

    // Safety check for display
    const formatTime = (date: Date) => {
        try {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        } catch (e) {
            return "--:--"
        }
    }

    // Handle Submission
    const handleSubmitVideo = async () => {
        if (!videoLink.includes("tiktok.com")) {
            toast.error("Lien invalide", { description: "Le lien doit provenir de TikTok." })
            return
        }
        
        setSubmitting(true)
        const supabase = createClient()
        
        // 1. Update Profile
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ 
                current_video_url: videoLink,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)

        if (profileError) {
            toast.error("Erreur", { description: "Impossible d'enregistrer le lien." })
            setSubmitting(false)
            return
        }
        
        // 2. Success UI
        setIsSubmitted(true)
        toast.success("Cible Verrouillée !", { 
            description: "Ta vidéo est prête pour la vague.",
            icon: <CheckCircle2 className="h-5 w-5 text-green-500" />
        })
        setSubmitting(false)
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl overflow-hidden border border-amber-200 bg-amber-50 shadow-md"
        >
            <div className="bg-amber-100/50 p-4 border-b border-amber-200 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-500 text-white flex items-center justify-center animate-pulse">
                    <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="font-black text-amber-900 text-lg uppercase tracking-tight flex items-center gap-2">
                        Vague imminente détectée
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Info className="h-4 w-4 text-amber-600 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs bg-slate-900 text-slate-100 border-slate-800">
                                    <p>Tu as été sélectionné par l'algorithme. Pendant 2 heures, toute l'escouade va converger vers ta vidéo pour maximiser ton impact sur TikTok.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </h3>
                    <p className="text-amber-700 text-xs font-bold">
                        ORDRE DE MISSION PRIORITAIRE
                    </p>
                </div>
            </div>
            
            <div className="p-4 md:p-6 grid md:grid-cols-2 gap-6">
                {/* LEFT: INFO */}
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-amber-600 mt-1" />
                        <div>
                            <p className="text-xs text-amber-600 uppercase font-bold">Date de passage</p>
                            <p className="text-xl font-black text-slate-900">
                                {isToday ? "AUJOURD'HUI" : new Date(nextWave.scheduled_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-amber-600 mt-1" />
                        <div>
                            <p className="text-xs text-amber-600 uppercase font-bold">Fenêtre de Tir (Vague)</p>
                            <p className="text-xl font-black text-slate-900">
                                {nextWave.start_time.slice(0, 5)} - {nextWave.end_time.slice(0, 5)}
                            </p>
                            <p className="text-xs text-slate-500 italic mt-1">
                                50 Troupers mobilisés.
                            </p>
                        </div>
                    </div>

                    <div className="mt-3 bg-red-50 border border-red-100 p-2 rounded text-[10px] text-red-700 leading-tight">
                         <strong>⚠️ Important :</strong> Ta vidéo doit être postée dans le créneau indiqué. Tout manquement entraîne une pénalité de file d'attente (7-10 jours).
                    </div>
                </div>

                {/* RIGHT: ACTION MODULE */}
                <div className={`bg-white rounded-lg border-2 p-4 relative overflow-hidden transition-all duration-500 ${isSubmitted ? 'border-green-500 ring-4 ring-green-100' : isWindowOpen ? 'border-indigo-200' : 'border-slate-200 bg-slate-50'}`}>
                    
                    {isSubmitted ? (
                        <div className="flex flex-col h-full justify-center items-center text-center space-y-3 py-4">
                            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                            </div>
                            <h4 className="text-xl font-black text-green-700">PRÊT AU COMBAT</h4>
                            <p className="text-sm text-green-600 font-medium">
                                Ta vidéo a été enregistrée.<br/>Elle sera distribuée à {nextWave.start_time.slice(0, 5)}.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full justify-between">
                            <div>
                                <div className={`absolute top-0 right-0 text-[10px] font-bold px-2 py-1 rounded-bl-lg ${isWindowOpen ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-500'}`}>
                                    {isWindowOpen ? "ACTION REQUISE" : "EN ATTENTE"}
                                </div>
                                <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
                                    <UploadCloud className={`h-5 w-5 ${isWindowOpen ? 'text-indigo-600' : 'text-slate-400'}`} />
                                    Publication Vidéo
                                </h4>
                                
                                <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                                    {windowStatusMessage}
                                </p>
                                
                                <input 
                                    type="text" 
                                    placeholder={isWindowOpen ? "https://www.tiktok.com/@user/video/..." : "Lien accessible uniquement à l'heure H"}
                                    disabled={!isWindowOpen}
                                    className={`w-full border-2 rounded-lg p-2 text-sm outline-none transition-all ${isWindowOpen ? 'border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white' : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                                    value={videoLink}
                                    onChange={(e) => setVideoLink(e.target.value)}
                                />
                                
                                {isWindowOpen && (
                                    <p className="text-[10px] text-slate-400 mt-2">
                                        * Colle ici le lien de ta vidéo TikTok dès qu'elle est publiée.
                                    </p>
                                )}
                            </div>
                            
                            <Button 
                                onClick={handleSubmitVideo}
                                disabled={submitting || !videoLink || !isWindowOpen}
                                className={`w-full mt-4 font-bold shadow-lg transition-all ${isWindowOpen ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-slate-300 text-slate-500 shadow-none cursor-not-allowed'}`}
                            >
                                {submitting ? "Validation..." : "CONFIRMER LA PUBLICATION"}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}

// Helper to simulate a wave for demo purposes (Kept for compatibility imports)
export function WaveNotificationDemo() {
    return null
}
