"use client"

import { useEffect, useState } from "react"
import { Calendar, Clock, MapPin, Users, ShieldAlert, ChevronRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { format, isToday, isTomorrow, parseISO } from "date-fns"
import { fr } from "date-fns/locale"

interface WaveSlot {
    date: string
    startTime: string
    endTime: string
    missionCount: number
}

export function WaveSchedule({ squadId }: { squadId: string | null }) {
    const [slots, setSlots] = useState<WaveSlot[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchSchedule = async () => {
            if (!squadId) return
            
            const supabase = createClient()
            const today = new Date().toISOString().split('T')[0]
            
            // Calculate date limit (Today + 3 days)
            const limitDate = new Date()
            limitDate.setDate(limitDate.getDate() + 3)
            const limitStr = limitDate.toISOString().split('T')[0]

            // Fetch all waves for the squad in range
            const { data: waves } = await supabase
                .from('daily_waves')
                .select('scheduled_date, start_time, end_time')
                .eq('squad_id', squadId)
                .gte('scheduled_date', today)
                .lte('scheduled_date', limitStr)
                .order('scheduled_date', { ascending: true })
                .order('start_time', { ascending: true })

            if (waves) {
                // Group by Date ONLY
                const groupedMap = new Map<string, WaveSlot>()

                waves.forEach((wave: any) => {
                    const dateKey = wave.scheduled_date
                    
                    if (groupedMap.has(dateKey)) {
                        const slot = groupedMap.get(dateKey)!
                        slot.missionCount += 1
                        if (wave.start_time < slot.startTime) slot.startTime = wave.start_time
                        if (wave.end_time > slot.endTime) slot.endTime = wave.end_time
                    } else {
                        groupedMap.set(dateKey, {
                            date: wave.scheduled_date,
                            startTime: wave.start_time,
                            endTime: wave.end_time,
                            missionCount: 1
                        })
                    }
                })

                // Convert map to array
                let finalSlots = Array.from(groupedMap.values())

                // Check if Today is present
                const todayStr = new Date().toISOString().split('T')[0]
                const hasToday = finalSlots.some(s => s.date === todayStr)

                if (!hasToday) {
                    // Add "Rest Day" slot for Today
                    finalSlots.unshift({
                        date: todayStr,
                        startTime: "",
                        endTime: "",
                        missionCount: 0
                    })
                }

                setSlots(finalSlots)
            }
            setLoading(false)
        }

        fetchSchedule()
    }, [squadId])

    if (loading) return <div className="animate-pulse h-24 bg-slate-100 rounded-xl mb-6"></div>

    if (slots.length === 0) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-4 mb-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    <h3 className="text-sm font-bold text-slate-700 uppercase">Planning Opérationnel</h3>
                </div>
                <p className="text-xs text-slate-500 italic">Aucune vague planifiée pour le moment. Repos, soldat.</p>
            </div>
        )
    }

    return (
        <div className="rounded-xl border border-indigo-100 bg-white shadow-sm overflow-hidden mb-6">
            <div className="bg-indigo-900 p-3 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-indigo-300" />
                    <h3 className="text-xs font-black uppercase tracking-wider">Planning des missions à venir</h3>
                </div>
            </div>
            
            <div className="p-3 space-y-3">
                {slots.map((slot, idx) => {
                    const dateObj = parseISO(slot.date)
                    let dateLabel = format(dateObj, 'EEEE d MMM', { locale: fr })
                    let isNext = false
                    
                    if (isToday(dateObj)) {
                        dateLabel = "AUJOURD'HUI"
                        isNext = true
                    } else if (isTomorrow(dateObj)) {
                        dateLabel = "DEMAIN"
                        if (idx === 0) isNext = true // First slot is tomorrow if no today
                    } else {
                        dateLabel = dateLabel.toUpperCase()
                    }

                    // Intensity Color
                    let intensityColor = "bg-blue-100 text-blue-700 border-blue-200"
                    if (slot.missionCount > 8) intensityColor = "bg-amber-100 text-amber-700 border-amber-200"
                    if (slot.missionCount > 12) intensityColor = "bg-red-100 text-red-700 border-red-200"

                    if (isNext) {
                        return (
                            <div key={idx} className={`rounded-lg border p-3 relative overflow-hidden ${slot.missionCount === 0 ? 'bg-slate-50 border-slate-100' : 'bg-indigo-50 border-indigo-100'}`}>
                                <div className={`absolute top-0 right-0 px-2 py-1 text-[9px] font-bold rounded-bl-lg ${slot.missionCount === 0 ? 'bg-slate-200 text-slate-600' : 'bg-indigo-200 text-indigo-800'}`}>
                                    {slot.missionCount === 0 ? "STANDARD" : "PRIORITAIRE"}
                                </div>
                                <p className={`text-xs font-black mb-2 ${slot.missionCount === 0 ? 'text-slate-900' : 'text-indigo-900'}`}>{dateLabel}</p>
                                
                                {slot.missionCount === 0 ? (
                                    <div className="flex items-center gap-2 text-slate-700">
                                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                                            <span className="text-lg">📋</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase text-slate-500">Opérations Courantes</p>
                                            <p className="text-xs font-bold">~10 Missions Standards</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-[10px] text-indigo-500 font-bold uppercase mb-1">Créneau d'Intervention</p>
                                            <div className="flex items-center gap-1.5 text-indigo-900">
                                                <Clock className="h-4 w-4" />
                                                <span className="text-lg font-black tracking-tight">
                                                    {slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`px-2 py-1 rounded-md border ${intensityColor} flex flex-col items-center min-w-[50px]`}>
                                            <span className="text-sm font-black">{slot.missionCount}</span>
                                            <span className="text-[8px] font-bold uppercase">Missions</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    }

                    return (
                        <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs">
                                    {format(dateObj, 'dd')}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-700 capitalize">{dateLabel.toLowerCase()}</p>
                                    <p className="text-[10px] text-slate-400 font-mono">
                                        {slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-bold text-slate-600">{slot.missionCount}</span>
                                <span className="text-[9px] text-slate-400">miss.</span>
                            </div>
                        </div>
                    )
                })}
            </div>
            
            <div className="bg-slate-50 p-2 text-center border-t border-slate-100">
                <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Présence obligatoire au rapport
                </p>
            </div>
        </div>
    )
}
