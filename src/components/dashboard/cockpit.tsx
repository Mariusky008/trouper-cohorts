"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayCircle, Users, Brain, Video, CheckCircle2 } from "lucide-react";
import { VictoryWall } from "@/components/dashboard/victory-wall";
import { ChatBox } from "@/components/chat/chat-box";
import { Button } from "@/components/ui/button";

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

  // Groupement des étapes par pilier (Trépied)
  const intellectualSteps = steps?.filter((s: any) => s.category === 'intellectual' || !s.category) || [];
  const creativeSteps = steps?.filter((s: any) => s.category === 'creative') || [];
  const socialSteps = steps?.filter((s: any) => s.category === 'social') || [];

  const renderStepGroup = (title: string, icon: any, groupSteps: any[], colorClass: string) => (
    <div className={`border rounded-xl p-5 bg-white shadow-sm ${groupSteps.length === 0 ? 'opacity-60' : ''}`}>
        <h4 className={`font-bold flex items-center gap-2 mb-4 text-xs uppercase tracking-widest ${colorClass}`}>
            {icon} {title}
        </h4>
        {groupSteps.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Aucune tâche assignée.</p>
        ) : (
            <div className="space-y-3">
                {groupSteps.map((step: any) => (
                    <div key={step.id} className="flex items-start gap-3 group">
                        <Checkbox id={`step-${step.id}`} className="mt-1 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600" />
                        <label
                            htmlFor={`step-${step.id}`}
                            className="text-sm font-medium leading-snug peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700 cursor-pointer group-hover:text-slate-900 transition-colors"
                        >
                            {step.content}
                        </label>
                    </div>
                ))}
            </div>
        )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <header className="bg-white border-b h-16 flex items-center justify-between px-6 sticky top-0 z-30">
        <div className="flex items-center gap-4">
            <div className="font-black text-xl italic uppercase text-slate-900">
                Popey <span className="text-orange-500">Cockpit</span>
            </div>
            {cohort?.title && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                    <span className="text-xs">⚓️</span>
                    <span className="text-xs font-bold uppercase tracking-wider">Équipage {cohort.title}</span>
                </div>
            )}
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
                    <CardContent className="p-6 bg-slate-50">
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-slate-900">
                            🎯 Vos 3 Missions du Jour
                        </h3>
                        
                        {mission?.description && (
                            <div className="mb-6 text-sm text-slate-600 bg-white p-4 rounded-lg border border-slate-100 italic">
                                "{mission.description}"
                            </div>
                        )}

                        <div className="grid gap-4 md:grid-cols-1">
                            {renderStepGroup("Intellectuel & Admin", <Brain className="h-4 w-4" />, intellectualSteps, "text-blue-600")}
                            {renderStepGroup("Créatif & Contenu", <Video className="h-4 w-4" />, creativeSteps, "text-purple-600")}
                            {renderStepGroup("Social & Live", <Users className="h-4 w-4" />, socialSteps, "text-orange-600")}
                        </div>

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
