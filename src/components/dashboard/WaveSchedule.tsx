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
                // Group by Date + StartTime
                const groupedMap = new Map<string, WaveSlot>()

                waves.forEach(wave => {
                    const key = `${wave.scheduled_date}-${wave.start_time}`
                    if (groupedMap.has(key)) {
                        const slot = groupedMap.get(key)!
                        slot.missionCount += 1
                    } else {
                        groupedMap.set(key, {
                            date: wave.scheduled_date,
                            startTime: wave.start_time,
                            endTime: wave.end_time,
                            missionCount: 1
                        })
                    }
                })

                setSlots(Array.from(groupedMap.values()))
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
            <div className="bg-indigo-50/50 p-3 border-b border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-xs font-black text-indigo-900 uppercase tracking-wider">Ordres de Présence</h3>
                </div>
                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                    3 Jours
                </span>
            </div>
            
            <div className="divide-y divide-slate-100">
                {slots.map((slot, idx) => {
                    const dateObj = parseISO(slot.date)
                    let dateLabel = format(dateObj, 'EEEE d MMM', { locale: fr })
                    if (isToday(dateObj)) dateLabel = "AUJOURD'HUI"
                    else if (isTomorrow(dateObj)) dateLabel = "DEMAIN"
                    else dateLabel = dateLabel.toUpperCase()

                    return (
                        <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div>
                                <p className={`text-[10px] font-bold uppercase mb-0.5 ${dateLabel === "AUJOURD'HUI" ? "text-green-600" : "text-slate-400"}`}>
                                    {dateLabel}
                                </p>
                                <div className="flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 text-slate-600" />
                                    <span className="text-sm font-black text-slate-800">
                                        {slot.startTime.slice(0, 5)}
                                    </span>
                                    <span className="text-xs text-slate-400 font-medium">
                                        - {slot.endTime.slice(0, 5)}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-end">
                                <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                                    <Users className="h-3 w-3 text-slate-500" />
                                    <span className="text-xs font-bold text-slate-700">{slot.missionCount}</span>
                                </div>
                                <span className="text-[9px] text-slate-400 font-medium mt-0.5">Missions</span>
                            </div>
                        </div>
                    )
                })}
            </div>
            
            <div className="bg-slate-50 p-2 text-center border-t border-slate-100">
                <p className="text-[10px] text-slate-500">
                    Présence obligatoire sur ces créneaux.
                </p>
            </div>
        </div>
    )
}
