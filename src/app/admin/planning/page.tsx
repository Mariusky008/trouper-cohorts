"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Calendar, Clock, Video, AlertTriangle, CheckCircle, ExternalLink, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Link from "next/link"

export default function AdminPlanningPage() {
    const [waves, setWaves] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchPlanning = async () => {
            // Use internal API to bypass RLS issues on profiles table
            try {
                const res = await fetch('/api/admin/get-planning')
                
                if (!res.ok) {
                    const text = await res.text()
                    throw new Error(`API Error ${res.status}: ${text}`)
                }

                const json = await res.json()
                
                if (json.success) {
                    setWaves(json.data)
                } else {
                    console.error("API Logic Error:", json.error)
                    toast.error(`Erreur Logic: ${json.error}`)
                }
            } catch (e: any) {
                console.error("Fetch Error:", e)
                toast.error(`Erreur Chargement: ${e.message}`)
            } finally {
                setLoading(false)
            }
        }
        
        fetchPlanning()
    }, [])

    const handleSimulatePlanning = async () => {
        setLoading(true)
        console.log("Launching simulation...")
        try {
             // Call the scheduling API manually
             const res = await fetch('/api/cron/schedule-waves')
             console.log("Response status:", res.status)
             
             if (!res.ok) {
                 const text = await res.text()
                 console.error("API Error:", text)
                 toast.error(`Erreur API: ${res.status}`)
                 return
             }

             const json = await res.json()
             console.log("API Result:", json)

             if (json.success) {
                 toast.success("Planning généré avec succès !")
                 window.location.reload()
             } else {
                 toast.error(`Erreur: ${json.message || 'Inconnue'}`)
             }
        } catch (e: any) {
            console.error("Fetch error:", e)
            toast.error(`Erreur Client: ${e.message}`)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="p-8 text-center">Chargement du QG Admin...</div>

    return (
        <div className="max-w-6xl mx-auto p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Shield className="h-8 w-8 text-indigo-600" />
                        Planning Stratégique (J+7)
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Supervision des vagues et contrôle des vidéos soumises.
                    </p>
                </div>
                <div className="flex gap-3">
                     <Link href="/dashboard">
                        <Button variant="outline">Retour Dashboard</Button>
                     </Link>
                     <Button onClick={handleSimulatePlanning} className="bg-indigo-600 hover:bg-indigo-700">
                        🔄 Forcer la Planification (Cron)
                     </Button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 font-medium text-slate-500 grid grid-cols-12 gap-4 text-sm">
                    <div className="col-span-2">Date & Heure</div>
                    <div className="col-span-2">Membre (Trouper)</div>
                    <div className="col-span-2">Type de Vague</div>
                    <div className="col-span-4">Contrôle Vidéo (Lien soumis)</div>
                    <div className="col-span-2 text-right">Statut</div>
                </div>

                <div className="divide-y divide-slate-100">
                    {waves.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 italic">
                            Aucune vague planifiée pour le moment. Lancez la planification !
                        </div>
                    ) : (
                        waves.map((wave) => {
                            const waveDate = new Date(wave.created_at)
                            const videoUpdateDate = new Date(wave.profiles?.updated_at || 0)
                            // Is video updated AFTER the wave was created? (Means user reacted to notification)
                            // Or roughly recent (last 24h)
                            const isVideoFresh = videoUpdateDate > waveDate || (new Date().getTime() - videoUpdateDate.getTime() < 24 * 60 * 60 * 1000)
                            
                            const hasVideo = !!wave.profiles?.current_video_url && wave.profiles.current_video_url.includes('tiktok')

                            return (
                                <div key={wave.id} className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-slate-50 transition-colors">
                                    {/* DATE */}
                                    <div className="col-span-2 space-y-1">
                                        <div className="flex items-center gap-2 text-slate-900 font-bold">
                                            <Calendar className="h-4 w-4 text-slate-400" />
                                            {new Date(wave.scheduled_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Clock className="h-3 w-3" />
                                            {wave.start_time.slice(0,5)} - {wave.end_time.slice(0,5)}
                                        </div>
                                    </div>

                                    {/* MEMBER */}
                                    <div className="col-span-2">
                                        <p className="font-bold text-slate-800">{wave.profiles?.username || "Inconnu"}</p>
                                        <p className="text-xs text-slate-400 truncate">{wave.creator_id.slice(0,8)}...</p>
                                    </div>

                                    {/* TYPE */}
                                    <div className="col-span-2">
                                        {wave.wave_type === 'core' ? (
                                            <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-200">
                                                🔥 Core (Signal Fort)
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-slate-500 border-slate-300">
                                                👻 Noise (Signal Faible)
                                            </Badge>
                                        )}
                                    </div>

                                    {/* VIDEO CHECK */}
                                    <div className="col-span-4">
                                        {hasVideo ? (
                                            <div className="space-y-1">
                                                <a 
                                                    href={wave.profiles.current_video_url} 
                                                    target="_blank"
                                                    className="text-sm text-blue-600 hover:underline flex items-center gap-1 truncate max-w-[200px]"
                                                >
                                                    <Video className="h-3 w-3" />
                                                    {wave.profiles.current_video_url}
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                                {isVideoFresh ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-medium">
                                                        <CheckCircle className="h-3 w-3" />
                                                        Lien à jour (Prêt)
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
                                                        <AlertTriangle className="h-3 w-3" />
                                                        Lien ancien (Attention)
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-red-500 font-bold flex items-center gap-2">
                                                <AlertTriangle className="h-4 w-4" />
                                                Pas de vidéo !
                                            </span>
                                        )}
                                    </div>

                                    {/* STATUS */}
                                    <div className="col-span-2 text-right">
                                        <div className={`text-xs font-bold uppercase ${
                                            wave.status === 'completed' ? 'text-green-500' : 
                                            wave.status === 'active' ? 'text-blue-500 animate-pulse' : 
                                            'text-slate-400'
                                        }`}>
                                            {wave.status === 'pending' ? 'En attente' : wave.status}
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}
