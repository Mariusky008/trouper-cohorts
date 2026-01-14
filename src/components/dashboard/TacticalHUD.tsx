import { Shield, Star, Trophy, Medal, Zap } from 'lucide-react'

interface TacticalHUDProps {
    progress: number
    rank: {
        name: string
        icon: any
        color: string
    }
}

export function TacticalHUD({ progress, rank }: TacticalHUDProps) {
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
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider">PROGRESSION</span>
                        <span className="text-xs font-black text-slate-900">{Math.round(progress)}%</span>
                    </div>
                    <div className="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-100">
                        <div 
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                            style={{ width: `${progress}%` }}
                        />
                        {/* Ticks for ranks */}
                        <div className="absolute top-0 left-[25%] h-full w-px bg-white/50" />
                        <div className="absolute top-0 left-[50%] h-full w-px bg-white/50" />
                        <div className="absolute top-0 left-[75%] h-full w-px bg-white/50" />
                    </div>
                </div>

                {/* STATUS (RIGHT) - Only show Credits or Status */}
                <div className="flex items-center">
                    <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${progress === 100 ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                         <div className={`h-2 w-2 rounded-full ${progress === 100 ? 'bg-green-500 animate-pulse' : 'bg-indigo-500 animate-pulse'}`} />
                         <span className={`text-xs font-bold ${progress === 100 ? 'text-green-700' : 'text-slate-600'}`}>
                            {progress === 100 ? 'TERMINÉ' : 'EN COURS'}
                         </span>
                    </div>
                </div>
            </div>
        </div>
    )
}