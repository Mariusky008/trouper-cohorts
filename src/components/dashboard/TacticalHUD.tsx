import { Shield, Star, Trophy, Medal, Zap, Info, HelpCircle, CalendarDays } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { WaveSchedule } from "@/components/dashboard/WaveSchedule"
import { RankSystemModal } from "@/components/dashboard/RankSystemModal"
import { getRank } from "@/lib/ranks"

interface TacticalHUDProps {
    progress: number
    rank: {
        name: string
        icon: any
        color: string
    }
    points?: number
    userId?: string
    squadId?: string | null
    missionCount?: string
    careerPoints?: number
}

export function TacticalHUD({ progress, rank, points, userId, squadId, missionCount, careerPoints = 0 }: TacticalHUDProps) {
    // Gamification V4: Use Wave Points if available (Target 60)
    const waveProgress = points !== undefined ? (Math.min(points, 60) / 60) * 100 : progress
    const waveLabel = points !== undefined ? `${points}/60` : `${Math.round(progress)}%`
    const isReady = points !== undefined && points >= 60

    // Career Rank (Long Term)
    const careerRank = getRank(careerPoints)
    const RankIcon = careerRank.icon

    return (
        <div className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 w-full shadow-sm transition-all duration-300">
            <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                
                {/* RANK BADGE (CLICKABLE FOR MODAL) */}
                <RankSystemModal currentPoints={careerPoints}>
                    <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity select-none group">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shadow-sm border bg-slate-50 group-hover:scale-105 transition-transform ${careerRank.color.includes('text-yellow') ? 'border-yellow-200 bg-yellow-50' : careerRank.color.includes('text-purple') ? 'border-purple-200 bg-purple-50' : 'border-slate-200'}`}>
                            <RankIcon className={`h-6 w-6 ${careerRank.color}`} />
                        </div>
                        <div className="hidden sm:block leading-tight">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-indigo-500">Grade Actuel</p>
                            <h3 className={`text-sm font-black ${careerRank.color}`}>G{careerRank.level} - {careerRank.name}</h3>
                        </div>
                    </div>
                </RankSystemModal>

                {/* PROGRESS BAR (CENTER) */}
                <div className="flex-1 max-w-md mx-2">
                    <div className="flex justify-between items-end mb-1 px-1">
                        <div className="flex items-center gap-3">
                            {/* Mission Count Badge (New V4) */}
                            {missionCount && (
                                <div className="hidden sm:block px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-black border border-slate-200">
                                    MISSION {missionCount}
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 tracking-wider">
                                    {points !== undefined ? 'CHARGE VAGUE' : 'PROGRESSION'}
                                </span>
                                {points !== undefined && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="cursor-help flex items-center justify-center bg-indigo-100 hover:bg-indigo-200 rounded-full h-5 w-5 transition-colors animate-pulse">
                                                    <HelpCircle className="h-3 w-3 text-indigo-600" />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-xs p-3 bg-slate-900 text-white border-slate-800">
                                                <p className="font-bold mb-1 text-indigo-400">⚡️ Comment obtenir ma vague ?</p>
                                                <ul className="text-xs space-y-1 list-disc pl-3">
                                                    <li>Gagne <strong>60 points</strong> pour débloquer ton tour.</li>
                                                    <li>1 Mission accomplie = 1 Point.</li>
                                                    <li>Une fois chargé à 100%, tu passes prioritaire pour le lendemain.</li>
                                                </ul>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>
                        </div>
                        <span className={`text-xs font-black ${isReady ? 'text-green-600 animate-pulse' : 'text-slate-900'}`}>
                            {isReady ? 'PRÊT AU DÉPLOIEMENT' : waveLabel}
                        </span>
                    </div>
                    <div className="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-100">
                        <div 
                            className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(168,85,247,0.4)] ${isReady ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'}`}
                            style={{ width: `${waveProgress}%` }}
                        />
                        {/* Ticks for ranks */}
                        <div className="absolute top-0 left-[25%] h-full w-px bg-white/50" />
                        <div className="absolute top-0 left-[50%] h-full w-px bg-white/50" />
                        <div className="absolute top-0 left-[75%] h-full w-px bg-white/50" />
                    </div>
                </div>

                {/* STATUS (RIGHT) */}
                <div className="flex items-center gap-2">
                    {/* Planning Button */}
                    {userId && squadId && (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9 px-2 sm:px-3 border-slate-200 bg-white hover:bg-slate-50 text-slate-600 gap-2 shadow-sm">
                                    <CalendarDays className="h-4 w-4 text-indigo-600" />
                                    <span className="hidden sm:inline font-bold text-xs text-slate-700">PLANNING</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Ordres de Présence</DialogTitle>
                                </DialogHeader>
                                <div className="mt-2">
                                    <WaveSchedule squadId={squadId} userId={userId} />
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}

                    <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${isReady ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                         <div className={`h-2 w-2 rounded-full ${isReady ? 'bg-green-500 animate-pulse' : 'bg-indigo-500 animate-pulse'}`} />
                         <span className={`text-xs font-bold ${isReady ? 'text-green-700' : 'text-slate-600'}`}>
                            {isReady ? '100%' : 'EN COURS'}
                         </span>
                    </div>
                </div>
            </div>
        </div>
    )
}