"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayCircle, Users, Brain, Video, CheckCircle2, ChevronDown, Check } from "lucide-react";
import { VictoryWall } from "@/components/dashboard/victory-wall";
import { ChatBox } from "@/components/chat/chat-box";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoldenTicket } from "@/components/dashboard/golden-ticket";
import { MissionValidator } from "@/components/dashboard/mission-validator";
import { BuddyHistory } from "./buddy-history";
import { AICoachWidget } from "@/components/dashboard/ai-coach-widget";
import { cn } from "@/lib/utils";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";


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

const StepAccordion = ({ step, icon, colorClass }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isCompleted, setIsCompleted] = useState(step.status === 'validated' || step.status === 'submitted');
    const [proofContent, setProofContent] = useState(step.proof_content || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const supabase = createClientComponentClient();

    // Determine title based on category if not provided in step
    const getCategoryTitle = (cat: string) => {
        switch(cat) {
            case 'intellectual': return "Intellectuel & Admin";
            case 'creative': return "Créatif & Contenu";
            case 'social': return "Social & Live";
            case 'event': return "Événement (Live/Atelier)";
            default: return "Mission";
        }
    };

    const title = getCategoryTitle(step.category);
    const proofType = step.proof_type || 'none';

    const handleValidate = async () => {
        setIsSubmitting(true);
        try {
            // Update step status and proof
            const { error } = await supabase
                .from('mission_steps')
                .update({ 
                    status: 'validated',
                    proof_content: proofContent,
                    // If proof_type is 'none', we might not need content, but saving empty string is fine
                })
                .eq('id', step.id);

            if (error) throw error;

            setIsCompleted(true);
            setIsOpen(false);
        } catch (error) {
            console.error("Error validating step:", error);
            alert("Erreur lors de la validation. Réessayez.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`border rounded-xl bg-white shadow-sm transition-all duration-300 overflow-hidden ${isCompleted ? 'border-green-200 bg-green-50' : 'border-slate-200'}`}>
            <div 
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                        {isCompleted ? <Check className="h-5 w-5" /> : icon}
                    </div>
                    <div>
                        <h4 className={`font-black text-sm uppercase tracking-wider ${isCompleted ? 'text-green-800' : colorClass}`}>
                            {title}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {isCompleted ? "Mission accomplie" : (isOpen ? "Masquer les détails" : "Découvrir la mission")}
                        </p>
                    </div>
                </div>
                <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                </div>
            </div>

            {isOpen && (
                <div className="px-5 pb-5 pt-0 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
                    <div className="mt-4 prose prose-sm max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {step.content}
                    </div>
                    
                    {!isCompleted && (
                        <div className="mt-6 pt-4 border-t border-slate-100 space-y-4">
                            
                            {/* CHAMPS DE PREUVE */}
                            {proofType === 'text' && (
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Votre Réponse / Réflexion</label>
                                    <Input 
                                        placeholder="Écrivez votre réponse ici..." 
                                        className="bg-white"
                                        value={proofContent}
                                        onChange={(e) => setProofContent(e.target.value)}
                                    />
                                </div>
                            )}

                            {(proofType === 'link' || proofType === 'video_link') && (
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Lien de la preuve (Post, Vidéo...)</label>
                                    <Input 
                                        placeholder="https://..." 
                                        className="bg-white"
                                        value={proofContent}
                                        onChange={(e) => setProofContent(e.target.value)}
                                    />
                                </div>
                            )}

                            {proofType === 'image' && (
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Photo requise</label>
                                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center text-slate-400 text-sm cursor-pointer hover:bg-slate-100 hover:border-slate-400 transition-colors">
                                        Cliquez pour uploader (Simulation pour l'instant)
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <Button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleValidate();
                                    }}
                                    disabled={isSubmitting || (proofType !== 'none' && !proofContent && proofType !== 'image')}
                                    className={cn(
                                        "font-bold transition-all bg-slate-900 text-white hover:bg-slate-800"
                                    )}
                                >
                                    {isSubmitting ? "Validation..." : "Envoyer la preuve & Valider"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {isCompleted && (
                        <div className="mt-4 p-3 bg-green-50 text-green-800 text-xs font-bold rounded flex items-center gap-2">
                            <Check className="h-4 w-4" /> Étape validée le {new Date().toLocaleDateString()}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export function CockpitDashboard({ 
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
  // Mock binôme si pas de buddy (pour le dev)
  const currentBuddy = buddy || {
    first_name: "En attente...",
    trade: "Recherche en cours",
    department_code: "??"
  };

  // Calcul du display name pour ChatBox et autres
  const buddyDisplayName = currentBuddy.first_name ? `${currentBuddy.first_name} ${currentBuddy.last_name || ''}` : "Binôme";

  const progress = (dayIndex / 15) * 100;

  // Flatten steps because StepAccordion now handles single step logic
  // We filter to ensure we pass the right step to the right section
  // Assuming 1 step per category for simplicity in this new design, or map all of them
  const intellectualSteps = steps?.filter((s: any) => s.category === 'intellectual' || !s.category) || [];
  const creativeSteps = steps?.filter((s: any) => s.category === 'creative') || [];
  const socialSteps = steps?.filter((s: any) => s.category === 'social') || [];
  const eventSteps = steps?.filter((s: any) => s.category === 'event') || [];

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
            <Avatar className="h-10 w-10 border-2 border-white shadow-sm bg-indigo-600">
                {user.user_metadata?.avatar_url ? (
                    <AvatarImage src={user.user_metadata.avatar_url} />
                ) : null}
                <AvatarFallback className="bg-indigo-600 text-white font-bold">
                    {user.email?.[0].toUpperCase() || "J"}
                </AvatarFallback>
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
                
                {/* 0. LA RELIQUE (GOLDEN TICKET) */}
                <GoldenTicket dayIndex={dayIndex} totalDays={15} />

                {/* 1. Briefing Vidéo (Optionnel) */}
                <Card className="overflow-hidden border-2 border-slate-200 shadow-sm">
                    {mission?.video_url && (
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
                            {intellectualSteps.map((step: any) => (
                                <StepAccordion key={step.id} step={step} icon={<Brain className="h-4 w-4" />} colorClass="text-blue-600" />
                            ))}
                            {creativeSteps.map((step: any) => (
                                <StepAccordion key={step.id} step={step} icon={<Video className="h-4 w-4" />} colorClass="text-purple-600" />
                            ))}
                            {socialSteps.map((step: any) => (
                                <StepAccordion key={step.id} step={step} icon={<Users className="h-4 w-4" />} colorClass="text-orange-600" />
                            ))}
                            {eventSteps.map((step: any) => (
                                <StepAccordion key={step.id} step={step} icon={<CheckCircle2 className="h-4 w-4" />} colorClass="text-red-600" />
                            ))}
                        </div>

                    </CardContent>
                </Card>

                {/* 3. Mur des Victoires */}
                <div className="h-[500px]">
                    <VictoryWall cohortId={cohort?.id} currentUserId={user.id} />
                </div>

            </div>

            {/* COLONNE DROITE (Binôme) */}
            <div className="lg:col-span-1 space-y-6">
                
                {/* INFO TRIO */}
                {allBuddies && allBuddies.length > 1 && (
                    <Card className="bg-blue-50 border-blue-200 text-blue-900">
                        <CardContent className="p-4 text-sm">
                            <div className="font-bold flex items-center gap-2 mb-2">
                                <Users className="h-4 w-4" />
                                Trio du Jour !
                            </div>
                            <p className="mb-2">Vous avez {allBuddies.length} binômes aujourd'hui :</p>
                            <ul className="list-disc pl-5 space-y-1 mb-2">
                                {allBuddies.map((b: any) => (
                                    <li key={b.id}>
                                        <strong>{b.first_name} {b.last_name}</strong> <span className="text-xs opacity-70">({b.trade})</span>
                                    </li>
                                ))}
                            </ul>
                            <p className="text-xs text-blue-700 italic border-t border-blue-200 pt-2">
                                Le chat ci-dessous est connecté avec <strong>{currentBuddy.first_name}</strong>.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* VALIDATION MISSION BINÔME (Si requise) */}
                {buddyMission && buddyMission.validation_type === 'buddy' && buddyMission.status !== 'validated' && (
                    <MissionValidator 
                        missionId={buddyMission.id} 
                        validationType='buddy' 
                        status={buddyMission.status} 
                        isMyMission={false}
                        buddyName={currentBuddy.first_name}
                    />
                )}

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
                        partnerId={buddy?.id} 
                        currentUserId={user.id}
                        initialMessages={initialMessages}
                        partners={allBuddies}
                    />

                {/* Historique Binômes */}
                <BuddyHistory history={buddyHistory} currentUserId={user.id} />
                
                {/* COACH IA POPEY */}
                <AICoachWidget 
                    dayContext={{
                        day: `Jour ${dayIndex}`,
                        mission: mission?.title || "Repos",
                        programType: cohort?.program_type || "entrepreneur"
                    }} 
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
