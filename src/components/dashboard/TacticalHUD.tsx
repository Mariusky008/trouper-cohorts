import { Shield, Star, Trophy, Medal, Zap, Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TacticalHUDProps {
    progress: number
    rank: {
        name: string
        icon: any
        color: string
    }
    points?: number
}

export function TacticalHUD({ progress, rank, points }: TacticalHUDProps) {
    // Gamification V4: Use Wave Points if available (Target 60)
    const waveProgress = points !== undefined ? (Math.min(points, 60) / 60) * 100 : progress
    const waveLabel = points !== undefined ? `${points}/60` : `${Math.round(progress)}%`
    const isReady = points !== undefined && points >= 60

    return (
        <div className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 w-full shadow-sm transition-all duration-300">
            <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                
                {/* RANK BADGE */}
                <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shadow-sm border bg-slate-50 ${rank.color.includes('text-yellow') ? 'border-yellow-200 text-yellow-600' : rank.color.includes('text-purple') ? 'border-purple-200 text-purple-600' : 'border-slate-200 text-slate-600'}`}>
                        <rank.icon className={`h-6 w-6`} />
                    </div>
                    <div className="hidden sm:block leading-tight">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Grade du jour</p>
                        <h3 className={`text-sm font-black ${rank.color.includes('text-yellow') ? 'text-yellow-600' : rank.color.includes('text-purple') ? 'text-purple-600' : 'text-slate-700'}`}>{rank.name}</h3>
                    </div>
                </div>

                {/* PROGRESS BAR (CENTER) */}
                <div className="flex-1 max-w-md mx-2">
                    <div className="flex justify-between items-end mb-1 px-1">
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-slate-400 tracking-wider">
                                {points !== undefined ? 'CHARGE VAGUE' : 'PROGRESSION'}
                            </span>
                            {points !== undefined && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-3 w-3 text-slate-400 hover:text-indigo-500 cursor-help" />
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
                <div className="flex items-center">
                    <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${isReady ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                         <div className={`h-2 w-2 rounded-full ${isReady ? 'bg-green-500 animate-pulse' : 'bg-indigo-500 animate-pulse'}`} />
                         <span className={`text-xs font-bold ${isReady ? 'text-green-700' : 'text-slate-600'}`}>
                            {isReady ? 'CHARGE 100%' : 'EN CHARGE'}
                         </span>
                    </div>
                </div>
            </div>
        </div>
    )
}