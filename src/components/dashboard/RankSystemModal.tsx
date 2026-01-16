"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { RANKS, getNextRank, getRank } from "@/lib/ranks"
import { Lock, CheckCircle, ArrowUpCircle, Crown } from "lucide-react"
import { cn } from "@/lib/utils"

interface RankSystemModalProps {
    currentPoints: number
    children: React.ReactNode
}

export function RankSystemModal({ currentPoints, children }: RankSystemModalProps) {
    const currentRank = getRank(currentPoints)
    const nextRank = getNextRank(currentRank.level)
    
    // Progress to next rank
    const pointsInLevel = currentPoints - currentRank.minPoints
    const progressPercent = nextRank ? (pointsInLevel / 60) * 100 : 100

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-0 overflow-hidden bg-slate-50">
                <div className="p-6 bg-slate-900 text-white shrink-0">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Crown className="h-6 w-6 text-yellow-500" />
                            SYSTÈME DE GRADES
                        </DialogTitle>
                    </DialogHeader>
                    
                    {/* CURRENT STATUS CARD */}
                    <div className="mt-6 bg-slate-800 rounded-xl p-4 border border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase">Grade Actuel</p>
                                <h3 className={`text-2xl font-black ${currentRank.color}`}>{currentRank.name}</h3>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold">{currentPoints} <span className="text-sm text-slate-500">XP</span></p>
                            </div>
                        </div>
                        
                        {nextRank ? (
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-medium text-slate-400">
                                    <span>Progression</span>
                                    <span>{pointsInLevel} / 60 pts</span>
                                </div>
                                <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-500 ${currentRank.color.replace('text-', 'bg-')}`} 
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                                <p className="text-xs text-indigo-400 mt-2 flex items-center gap-1">
                                    <ArrowUpCircle className="h-3 w-3" />
                                    Prochain grade : {nextRank.name} ({nextRank.benefit})
                                </p>
                            </div>
                        ) : (
                            <div className="text-center py-2 text-yellow-500 font-bold text-sm border-t border-slate-700 mt-2 pt-3">
                                🌟 NIVEAU MAX ATTEINT - LÉGENDE
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="space-y-4">
                        {RANKS.map((rank) => {
                            const isUnlocked = currentRank.level >= rank.level
                            const isNext = nextRank?.level === rank.level
                            const Icon = rank.icon

                            return (
                                <div 
                                    key={rank.level} 
                                    className={cn(
                                        "relative flex items-center gap-4 p-4 rounded-xl border transition-all",
                                        isUnlocked ? "bg-white border-slate-200 shadow-sm" : "bg-slate-100 border-slate-200 opacity-60 grayscale",
                                        isNext && "ring-2 ring-indigo-500 ring-offset-2 opacity-100 grayscale-0 bg-indigo-50 border-indigo-200"
                                    )}
                                >
                                    <div className={cn(
                                        "h-12 w-12 rounded-lg flex items-center justify-center shrink-0 font-bold text-lg border",
                                        isUnlocked ? "bg-slate-50" : "bg-slate-200",
                                        rank.color
                                    )}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className={cn("font-black text-sm uppercase", rank.color)}>
                                                G{rank.level} - {rank.name}
                                            </h4>
                                            {isUnlocked && <CheckCircle className="h-4 w-4 text-green-500" />}
                                            {!isUnlocked && <Lock className="h-3 w-3 text-slate-400" />}
                                        </div>
                                        <p className="text-xs font-bold text-slate-700">{rank.benefit}</p>
                                        <p className="text-[10px] text-slate-400 font-mono mt-1">{rank.minPoints} XP requis</p>
                                    </div>

                                    {isNext && (
                                        <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-bounce">
                                            OBJECTIF
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}