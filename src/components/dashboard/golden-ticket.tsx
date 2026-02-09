"use client";

import { Card } from "@/components/ui/card";
import { Lock, Sparkles, Trophy, Copy, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface GoldenTicketProps {
    dayIndex: number; // 1 à 14 (ou plus)
    totalDays?: number;
    userName?: string;
}

export function GoldenTicket({ dayIndex, totalDays = 14, userName }: GoldenTicketProps) {
    const [copied, setCopied] = useState(false);
    
    // Calcul de la progression (max 100%)
    // Si dayIndex > 14, on est à 100%
    const progress = Math.min((dayIndex / totalDays) * 100, 100);
    const isUnlocked = dayIndex >= totalDays;
    
    // Code secret généré (simple)
    const secretCode = `POPEY-ALUMNI-${new Date().getFullYear()}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(secretCode);
        setCopied(true);
        toast.success("Code secret copié ! Envoie-le au Capitaine.");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group w-full">
            {/* Effet de lueur d'arrière-plan (Halo) */}
            <div 
                className={cn(
                    "absolute -inset-0.5 rounded-2xl blur opacity-75 transition-all duration-1000",
                    isUnlocked 
                        ? "bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-600 opacity-90 animate-pulse" 
                        : "bg-slate-800 opacity-50"
                )}
            ></div>

            <Card className={cn(
                "relative overflow-hidden border-0 min-h-[200px] flex flex-col items-center justify-center text-center p-6 transition-all duration-700 transform w-full",
                isUnlocked 
                    ? "bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 text-white shadow-2xl scale-[1.01]" 
                    : "bg-slate-900 text-slate-400 shadow-inner"
            )}>
                
                {/* Texture / Effet de fond pour le mode "Pierre" */}
                {!isUnlocked && (
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-700 to-slate-900"></div>
                )}
                
                {/* Effet Shimmer (Brillance qui passe) pour la version Gold */}
                {isUnlocked && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_3s_infinite]"></div>
                )}

                {/* Contenu */}
                <div className="relative z-10 w-full flex flex-col items-center">
                    
                    {/* Header */}
                    <div className="flex items-center justify-center gap-2 mb-3">
                        {isUnlocked ? (
                            <Sparkles className="h-6 w-6 text-yellow-100 animate-pulse" />
                        ) : (
                            <Lock className="h-5 w-5 text-slate-600" />
                        )}
                        <h3 className={cn(
                            "font-black uppercase tracking-[0.2em] text-xs",
                            isUnlocked ? "text-yellow-50" : "text-slate-600"
                        )}>
                            {isUnlocked ? "Accès Alumni Débloqué" : "Relique Scellée"}
                        </h3>
                    </div>

                    {/* Titre Principal */}
                    <div className="mb-8 relative">
                         {/* Ombre portée du texte pour lisibilité */}
                        <h2 className={cn(
                            "text-4xl font-black uppercase italic leading-none transition-all duration-500",
                            isUnlocked 
                                ? "text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]" 
                                : "text-transparent bg-clip-text bg-gradient-to-b from-slate-700 to-slate-800"
                        )}>
                            {isUnlocked ? "GOLD MEMBER" : "POPEY CARD"}
                        </h2>
                    </div>

                    {/* État : Verrouillé (Barre de progression) */}
                    {!isUnlocked && (
                        <div className="w-full max-w-[220px] mx-auto space-y-3">
                            <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                                <span>Progression</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            {/* Barre de progression avec effet "lave" */}
                            <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-[2px] shadow-inner">
                                <div 
                                    className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                                    style={{ width: `${progress}%` }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-yellow-500 to-yellow-300 animate-pulse"></div>
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-600 mt-2 font-medium">
                                Encore {Math.max(0, totalDays - dayIndex)} jours pour briser la pierre.
                            </p>
                        </div>
                    )}

                    {/* État : DÉBLOQUÉ (Code Secret) */}
                    {isUnlocked && (
                        <div className="space-y-4 animate-in zoom-in duration-500 w-full max-w-[280px]">
                            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/30 shadow-lg">
                                <p className="text-[10px] text-yellow-100 font-bold uppercase mb-2 tracking-wider opacity-80">Ton Code Secret</p>
                                <div className="flex items-center justify-between bg-black/40 rounded-lg px-3 py-2 border border-white/10 group-hover:border-white/30 transition-colors">
                                    <code className="font-mono text-lg font-bold tracking-wider text-white select-all">
                                        {secretCode}
                                    </code>
                                    <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-8 w-8 text-yellow-200 hover:text-white hover:bg-white/10"
                                        onClick={handleCopy}
                                    >
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                            <p className="text-xs text-yellow-50 italic opacity-90 font-medium">
                                "Tu l'as mérité. Transmets ce code au Capitaine."
                            </p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
