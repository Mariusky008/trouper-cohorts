"use client";

import { ChatBox } from "@/components/chat/chat-box";
import { VictoryWall } from "@/components/dashboard/victory-wall";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { PlayCircle, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CockpitProps {
    user: any;
    cohort: any;
    mission: any;
    dayIndex: number;
    buddy: any;
    steps: any[];
}

export function CockpitDashboard({ user, cohort, mission, dayIndex, buddy, steps }: CockpitProps) {
  // Mock binôme si pas de buddy (pour le dev)
  const currentBuddy = buddy || {
    first_name: "En attente...",
    trade: "Recherche en cours",
    department_code: "??"
  };

  // Calcul du display name pour ChatBox et autres
  const buddyDisplayName = currentBuddy.first_name ? `${currentBuddy.first_name} ${currentBuddy.last_name || ''}` : "Binôme";

  const progress = (dayIndex / 14) * 100;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <header className="bg-white border-b h-16 flex items-center justify-between px-6 sticky top-0 z-30">
        <div className="font-black text-xl italic uppercase text-slate-900">
            Popey <span className="text-orange-500">Cockpit</span>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Votre progression</p>
                <div className="w-32 h-2 bg-slate-100 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
            <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback>{user.email[0].toUpperCase()}</AvatarFallback>
            </Avatar>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* En-tête de Mission */}
        <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-orange-500 text-white hover:bg-orange-600 uppercase tracking-widest">Jour {dayIndex} / 14</Badge>
                <span className="text-slate-400 font-medium text-sm">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase italic">
                {mission?.title || "Repos"}
            </h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
            
            {/* COLONNE GAUCHE (Mission + Victoires) */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* 1. Briefing Vidéo */}
                <Card className="overflow-hidden border-2 border-slate-200 shadow-sm">
                    {mission?.video_url ? (
                        <div className="aspect-video bg-black flex items-center justify-center relative">
                            {mission.video_url.includes('youtube') || mission.video_url.includes('vimeo') ? (
                                <iframe 
                                    src={mission.video_url.replace('watch?v=', 'embed/')} 
                                    className="w-full h-full" 
                                    allowFullScreen 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                />
                            ) : (
                                <video controls className="w-full h-full" src={mission.video_url} />
                            )}
                        </div>
                    ) : (
                        <div className="aspect-video bg-slate-900 flex items-center justify-center relative group cursor-pointer">
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all"></div>
                            <PlayCircle className="h-20 w-20 text-white opacity-80 group-hover:scale-110 transition-transform duration-300" />
                            <span className="absolute bottom-4 left-4 text-white font-bold text-lg">Briefing du Jour (En attente)</span>
                        </div>
                    )}
                    <CardContent className="p-6 bg-white">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-700 h-6 w-6 rounded-full flex items-center justify-center text-xs">!</span>
                            Votre Mission
                        </h3>
                        
                        {mission?.description && !steps?.length && (
                             // Si pas d'étapes structurées, on affiche la description découpée (Legacy)
                            <div className="space-y-4">
                                {mission.description.split('\n').filter((l: string) => l.trim().length > 0).map((line: string, i: number) => (
                                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                        <Checkbox id={`task${i}`} className="mt-1" />
                                        <label htmlFor={`task${i}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer w-full">
                                            <span className="block text-slate-900 font-medium leading-relaxed">{line}</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}

                        {mission?.description && steps?.length > 0 && (
                            <div className="mb-6 text-sm text-slate-600 whitespace-pre-wrap">
                                {mission.description}
                            </div>
                        )}

                        {steps && steps.length > 0 && (
                            <div className="space-y-4">
                                {steps.map((step: any, i: number) => (
                                    <div key={step.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100 shadow-sm">
                                        <Checkbox id={`step-${step.id}`} className="mt-1" />
                                        <label htmlFor={`step-${step.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer w-full">
                                            <span className="block text-slate-900 font-bold mb-1">Étape {i + 1}</span>
                                            <span className="block text-slate-600 leading-relaxed whitespace-pre-wrap">
                                                {step.content}
                                            </span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!mission?.description && (!steps || steps.length === 0) && (
                            <p className="text-slate-500 italic">Pas de description pour cette mission.</p>
                        )}

                    </CardContent>
                </Card>

                {/* 3. Mur des Victoires */}
                <VictoryWall />

            </div>

            {/* COLONNE DROITE (Binôme) */}
            <div className="lg:col-span-1 space-y-6">
                
                {/* Info Binôme */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <h3 className="text-sm font-bold uppercase text-slate-400 mb-4 tracking-wider flex items-center gap-2">
                        <Users className="h-4 w-4" /> Mon Binôme
                    </h3>
                    
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg border-2 border-white shadow-sm">
                            {currentBuddy.first_name ? currentBuddy.first_name[0] : "?"}
                        </div>
                        <div>
                            <p className="font-bold text-slate-900">
                                {currentBuddy.first_name} {currentBuddy.last_name}
                            </p>
                            <p className="text-sm text-slate-500">
                                {currentBuddy.trade} ({currentBuddy.department_code})
                            </p>
                            {currentBuddy.social_network && (
                                <p className="text-xs text-blue-500 mt-1 capitalize">
                                    Sur {currentBuddy.social_network}
                                </p>
                            )}
                        </div>
                    </div>

                    {!buddy && (
                        <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-500 italic text-center">
                            Votre binôme vous sera assigné très bientôt.
                        </div>
                    )}

                    {buddy && (
                        <div className="mt-6 flex gap-2">
                             <Button className="w-full bg-slate-900 text-white hover:bg-slate-800" size="sm">
                                Contacter
                             </Button>
                        </div>
                    )}
                </div>

                {/* Chat */}
                <ChatBox 
                    partnerName={buddyDisplayName} 
                    partnerId={currentBuddy.id} 
                    currentUserId={user.id}
                    initialMessages={[]} 
                />

                {/* Aide / Support */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-slate-500 uppercase tracking-widest">Besoin d'aide ?</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-600 mb-4">Les coachs sont disponibles sur le Slack général.</p>
                        <Button variant="outline" size="sm" className="w-full">Contacter le support</Button>
                    </CardContent>
                </Card>

            </div>
        </div>
      </main>
    </div>
  );
}
