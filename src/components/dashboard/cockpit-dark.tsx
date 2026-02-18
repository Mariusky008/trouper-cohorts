"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayCircle, Anchor, LogOut, Lock, Trophy, Brain, Video, Users, CheckCircle2, Ship, Clock, AlertTriangle } from "lucide-react";
import { AICoachWidget } from "@/components/dashboard/ai-coach-widget";
import { VictoryWallGrid } from "@/components/dashboard/victory-wall-grid";
import { FloatingChat } from "@/components/chat/floating-chat";
import { StoryBlock } from "@/components/dashboard/story-block";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface CockpitProps {
    user: any;
    cohort: any;
    mission: any;
    dayIndex: number;
    buddy: any;
    allBuddies?: any[];
    steps: any[];
    initialMessages?: any[];
    buddyMission?: any;
    buddyHistory?: any[];
}

export function CockpitDark({ 
    user, 
    cohort, 
    mission, 
    dayIndex, 
    buddy, 
    allBuddies = [], 
    steps, 
    initialMessages = [], 
    buddyMission, 
    buddyHistory = [] 
}: CockpitProps) {
    const supabase = createClient();
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    // Calculate progress (approximate based on dayIndex)
    const progress = Math.min((dayIndex / 15) * 100, 100);

    // Mock binôme si pas de buddy (pour le dev/demo)
    const currentBuddy = buddy || {
        first_name: "En attente...",
        trade: "Recherche en cours",
        department_code: "??"
    };

    const buddyDisplayName = currentBuddy.first_name ? `${currentBuddy.first_name} ${currentBuddy.last_name || ''}` : "Binôme";

    // Filter steps by category
    const intellectualSteps = steps?.filter((s: any) => s.category === 'intellectual' || !s.category) || [];
    const creativeSteps = steps?.filter((s: any) => s.category === 'creative') || [];
    const socialSteps = steps?.filter((s: any) => s.category === 'social') || [];
    const eventSteps = steps?.filter((s: any) => s.category === 'event') || [];

    // All steps in order for "Plan de Bataille"
    // We can just map all steps or categorize them if we want specific icons/colors
    const allSteps = [
        ...intellectualSteps.map(s => ({ ...s, icon: Clock, colorClass: "text-blue-400", subtitle: "Intellectuel" })),
        ...socialSteps.map(s => ({ ...s, icon: AlertTriangle, colorClass: "text-red-400", subtitle: "Social" })),
        ...creativeSteps.map(s => ({ ...s, icon: Ship, colorClass: "text-orange-400", subtitle: "Créatif" })),
        ...eventSteps.map(s => ({ ...s, icon: CheckCircle2, colorClass: "text-green-400", subtitle: "Événement" }))
    ].sort((a, b) => a.position - b.position);

    // Popey Card Logic (Golden Ticket)
    const isUnlocked = dayIndex >= 15;
    const remainingDays = Math.max(0, 15 - dayIndex);

    return (
        <div className="min-h-screen bg-[#0a0f1c] text-slate-200 font-sans selection:bg-orange-500/30">
            
            {/* Top Navigation Bar */}
            <header className="border-b border-slate-800 h-16 flex items-center justify-between px-6 sticky top-0 z-50 bg-[#0a0f1c]/90 backdrop-blur-md">
                
                {/* Logo Area */}
                <div className="flex items-center gap-8">
                    <div className="font-black text-xl italic uppercase text-white tracking-tighter flex items-center gap-1 cursor-pointer">
                        <Anchor className="h-5 w-5 text-orange-500 mr-2" />
                        Popey
                    </div>
                    
                    {/* Main Menu - Desktop */}
                    <nav className="hidden md:flex items-center gap-1">
                        {[
                            { label: "Aujourd'hui", active: true, href: "/app/today" },
                            { label: "Programme", active: false, href: "/app/program" },
                            { label: "Équipage", active: false, href: "/app/crew" },
                            { label: "Classement", active: false, href: "/ranking" },
                            { label: "Profil", active: false, href: "/app/settings" },
                        ].map((item) => (
                            <Button
                                key={item.label}
                                variant="ghost"
                                onClick={() => router.push(item.href)}
                                className={`h-9 px-4 text-sm font-bold uppercase tracking-wider transition-all ${
                                    item.active 
                                    ? "bg-slate-800 text-white" 
                                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                                }`}
                            >
                                {item.label}
                            </Button>
                        ))}
                    </nav>
                </div>

                {/* Right Area - User & Logout */}
                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 bg-slate-800/50 rounded-full border border-slate-700/50">
                        <Avatar className="h-6 w-6 border border-slate-600">
                             {user.user_metadata?.avatar_url ? (
                                <AvatarImage src={user.user_metadata.avatar_url} />
                            ) : null}
                            <AvatarFallback className="bg-slate-900 text-[10px] text-white font-bold">
                                {user.email?.[0].toUpperCase() || "M"}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-bold text-slate-300 pr-1">
                             {user.user_metadata?.full_name || user.email?.split('@')[0]}
                        </span>
                    </div>

                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleLogout}
                        className="text-slate-500 hover:text-red-400 hover:bg-red-900/10 gap-2 px-2"
                    >
                        <LogOut className="h-4 w-4" />
                        <span className="hidden sm:inline text-xs font-bold uppercase">Se déconnecter</span>
                    </Button>
                </div>
            </header>

            {/* Sub-Header (Cockpit Info) */}
            <div className="border-b border-slate-800 bg-[#0d1220] py-2 px-6 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {cohort?.title || "Cohorte"} • En direct
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Votre Progression</span>
                    <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-4 py-8 max-w-7xl">
                 {/* En-tête de Mission - CENTRÉE ET MASSIVE */}
                <div className="mb-16 flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-slate-800/50 rounded-full border border-slate-700">
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-slate-300 text-xs font-bold uppercase tracking-widest">
                            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} • Jour {dayIndex} / 15
                        </span>
                    </div>
                    
                    <h1 className="text-6xl md:text-8xl font-black text-white uppercase italic tracking-tighter mb-4 drop-shadow-[0_0_30px_rgba(249,115,22,0.3)]">
                        J{dayIndex} : <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">{mission?.title || "Repos"}</span>
                    </h1>
                    
                    {mission?.description && (
                        <p className="text-2xl text-slate-400 max-w-3xl leading-relaxed italic font-light mb-8">
                            "{mission.description}"
                        </p>
                    )}

                    {/* Popey Card (Intégrée) */}
                    <div className="inline-flex items-center gap-6 bg-[#111827] border border-yellow-500/30 rounded-full px-6 py-3 shadow-[0_0_20px_rgba(234,179,8,0.1)] hover:border-yellow-500/60 transition-colors cursor-pointer group">
                        <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-yellow-900/20 border-2 border-yellow-500 flex items-center justify-center">
                                <Trophy className="h-5 w-5 text-yellow-500" />
                            </div>
                            <div className="absolute -top-1 -right-1 h-4 w-4 bg-yellow-500 rounded-full flex items-center justify-center text-[10px] font-black text-black border border-[#111827]">
                                {Math.round(progress)}%
                            </div>
                        </div>
                        <div className="text-left">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-black text-white uppercase italic tracking-tighter group-hover:text-yellow-400 transition-colors">POPEY CARD</h3>
                                <Lock className="h-3 w-3 text-slate-500" />
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                                Encore <span className="text-white font-bold">{remainingDays} jours</span> pour briser la pierre
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-12">

                    {/* BLOC 1 : BRIEFING & COACH (L'APPEL À L'ACTION) */}
                    <section className="grid lg:grid-cols-12 gap-8">
                         {/* Vidéo de Briefing - Largeur 7 */}
                         <div className="lg:col-span-7">
                            <div className="relative group cursor-pointer overflow-hidden rounded-xl border border-slate-700 shadow-2xl h-full min-h-[400px]">
                                {mission?.video_url ? (
                                    <div className="absolute inset-0 bg-black flex items-center justify-center">
                                        {mission.video_url.includes('youtube') || mission.video_url.includes('vimeo') ? (
                                            <iframe 
                                                src={mission.video_url.replace('watch?v=', 'embed/')} 
                                                className="w-full h-full" 
                                                allowFullScreen 
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            />
                                        ) : (
                                            <video controls className="w-full h-full object-cover" src={mission.video_url} />
                                        )}
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 bg-black flex items-center justify-center">
                                        <div className="text-center p-8">
                                            <PlayCircle className="h-20 w-20 text-slate-700 mx-auto mb-4" />
                                            <p className="text-slate-500 font-bold uppercase">Pas de briefing vidéo aujourd'hui</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                         </div>

                         {/* Coach AI - Largeur 5 - À Côté de la Vidéo */}
                         <div className="lg:col-span-5 h-[400px]">
                            <AICoachWidget 
                                dayContext={{
                                    day: `Jour ${dayIndex}`,
                                    mission: mission?.title || "Repos",
                                    programType: cohort?.program_type || "entrepreneur"
                                }} 
                            />
                         </div>
                    </section>


                    {/* BLOC 2 : LES MISSIONS (L'ACTION) */}
                    <section className="max-w-4xl mx-auto w-full space-y-8">
                         <div className="flex items-center gap-4 mb-4">
                            <div className="h-px bg-slate-800 flex-1"></div>
                            <h2 className="text-xl font-black text-slate-500 uppercase tracking-[0.3em]">Plan de Bataille</h2>
                            <div className="h-px bg-slate-800 flex-1"></div>
                         </div>
                         
                         {allSteps.length > 0 ? (
                            allSteps.map((step) => (
                                <StoryBlock 
                                    key={step.id}
                                    step={step}
                                    icon={step.icon}
                                    subtitle={step.subtitle}
                                    colorClass={step.colorClass}
                                />
                            ))
                         ) : (
                             <div className="text-center py-12 text-slate-500 italic">
                                 Aucune mission définie pour aujourd'hui. Profitez-en pour rattraper votre retard !
                             </div>
                         )}
                    </section>
                </div>

                {/* Floating Chat */}
                <FloatingChat 
                    partnerName={buddyDisplayName} 
                    partnerId={currentBuddy.id} 
                    currentUserId={user.id}
                    initialMessages={initialMessages}
                    partners={allBuddies}
                />

                {/* Victory Wall - Full Width Bottom Section */}
                <VictoryWallGrid cohortId={cohort?.id} currentUserId={user.id} />
            </main>
        </div>
    );
}
