"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Calendar, Clock, UploadCloud, CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function WaveNotification({ userId }: { userId: string }) {
    const [nextWave, setNextWave] = useState<any>(null)
    const [loading, setLoading] = useState(true)

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

    if (loading || !nextWave) return null

    // Calculate dates
    const waveDate = new Date(nextWave.scheduled_date + 'T' + nextWave.start_time)
    const now = new Date()
    const timeDiff = waveDate.getTime() - now.getTime()
    const hoursDiff = Math.ceil(timeDiff / (1000 * 3600))
    const isToday = new Date().toDateString() === new Date(nextWave.scheduled_date).toDateString()

    // Publish Deadline (45 min before wave)
    const publishDeadline = new Date(waveDate.getTime() - 45 * 60000)
    
    // Notification Logic: Show if wave is within 72h
    // Already filtered by query .gte('scheduled_date', today) and .limit(1)
    
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
                    <h3 className="font-black text-amber-900 text-lg uppercase tracking-tight">
                        Vague imminente détectée
                    </h3>
                    <p className="text-amber-700 text-xs font-bold">
                        ORDRE DE MISSION PRIORITAIRE
                    </p>
                </div>
            </div>
            
            <div className="p-4 md:p-6 grid md:grid-cols-2 gap-6">
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
                                50 Troupers sont mobilisés sur ce créneau.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border-2 border-amber-100 p-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                        ACTION REQUISE
                    </div>
                    
                    <div className="flex flex-col h-full justify-between">
                        <div>
                            <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
                                <UploadCloud className="h-5 w-5 text-indigo-600" />
                                Publication Vidéo
                            </h4>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Tu dois publier ta vidéo <strong>impérativement</strong> avant :
                            </p>
                            <p className="text-2xl font-black text-indigo-600 mt-1">
                                {publishDeadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-xs text-red-500 font-bold mt-2">
                                (30 à 45 min avant la vague)
                            </p>
                        </div>
                        
                        <Button className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 font-bold">
                            J'AI COMPRIS LES ORDRES
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

// Helper to simulate a wave for demo purposes
export function WaveNotificationDemo() {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const fakeWave = {
        scheduled_date: tomorrow.toISOString(),
        start_time: "18:30:00",
        end_time: "20:30:00"
    }

    const publishDeadline = new Date()
    publishDeadline.setHours(17, 45) // 18:30 - 45min

    return (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl overflow-hidden border border-amber-200 bg-amber-50 shadow-md relative"
        >
             <div className="absolute top-2 right-2 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded opacity-50 hover:opacity-100 cursor-help" title="Ceci est une simulation visible uniquement par vous">
                MODE DÉMO
            </div>

            <div className="bg-amber-100/50 p-4 border-b border-amber-200 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-500 text-white flex items-center justify-center animate-pulse">
                    <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="font-black text-amber-900 text-lg uppercase tracking-tight">
                        Vague imminente détectée
                    </h3>
                    <p className="text-amber-700 text-xs font-bold">
                        ORDRE DE MISSION PRIORITAIRE
                    </p>
                </div>
            </div>
            
            <div className="p-4 md:p-6 grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-amber-600 mt-1" />
                        <div>
                            <p className="text-xs text-amber-600 uppercase font-bold">Date de passage</p>
                            <p className="text-xl font-black text-slate-900">
                                Demain ({tomorrow.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })})
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-amber-600 mt-1" />
                        <div>
                            <p className="text-xs text-amber-600 uppercase font-bold">Fenêtre de Tir (Vague)</p>
                            <p className="text-xl font-black text-slate-900">
                                18:30 - 20:30
                            </p>
                            <p className="text-xs text-slate-500 italic mt-1">
                                50 Troupers sont mobilisés sur ce créneau.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border-2 border-amber-100 p-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                        ACTION REQUISE
                    </div>
                    
                    <div className="flex flex-col h-full justify-between">
                        <div>
                            <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
                                <UploadCloud className="h-5 w-5 text-indigo-600" />
                                Publication Vidéo
                            </h4>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Tu dois publier ta vidéo <strong>impérativement</strong> avant :
                            </p>
                            <p className="text-2xl font-black text-indigo-600 mt-1">
                                17:45
                            </p>
                            <p className="text-xs text-red-500 font-bold mt-2">
                                (30 à 45 min avant la vague)
                            </p>
                        </div>
                        
                        <Button className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 font-bold">
                            J'AI COMPRIS LES ORDRES
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
