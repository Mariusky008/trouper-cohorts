"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayCircle, Users, Brain, Video, CheckCircle2, Trophy, Flame, ExternalLink, Send, Lock, ChevronDown, ChevronUp, Check, Anchor, Ship, Clock, AlertTriangle, Sparkles, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// --- THEME CONSTANTS ---
const THEME = {
    bg: "bg-[#0a0f1c]", // Deep dark blue/black
    cardBg: "bg-[#111827]", // Slightly lighter dark
    textMain: "text-slate-200",
    textMuted: "text-slate-400",
    accent: "text-orange-500",
    border: "border-slate-800",
};

// --- MOCK COMPONENTS (Dark Mode Adapted) ---

const MockVictoryWall = () => (
    <Card className={`h-full border border-slate-800 shadow-xl ${THEME.cardBg} flex flex-col`}>
        <CardHeader className="border-b border-slate-800 bg-[#0d1220] pb-6 shrink-0">
            <div className="flex flex-col gap-4">
                <CardTitle className={`flex items-center gap-3 text-2xl font-black uppercase italic ${THEME.textMain}`}>
                    <Trophy className="h-8 w-8 text-yellow-500" />
                    Journal de Bord
                </CardTitle>
                <div className="bg-yellow-900/10 border border-yellow-500/20 rounded-xl p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-yellow-600 uppercase tracking-widest mb-1">Objectif du jour</p>
                        <p className="text-3xl font-black text-yellow-500">24 🔥 <span className="text-lg text-yellow-700">/ post</span></p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                        <Flame className="h-6 w-6 text-yellow-500 fill-yellow-500 animate-pulse" />
                    </div>
                </div>
            </div>
        </CardHeader>
        
        <div className={`p-6 border-b border-slate-800 ${THEME.cardBg} shrink-0 space-y-4`}>
            <Input 
                placeholder="Titre de ta victoire (ex: Mon premier client !)" 
                className="bg-[#0a0f1c] font-bold border-slate-700 text-slate-200 placeholder:text-slate-600 h-12 text-lg"
            />
            <div className="flex gap-2">
                <Input 
                    placeholder="Lien (URL)..." 
                    className="bg-[#0a0f1c] border-slate-700 text-slate-200 placeholder:text-slate-600 h-10"
                />
                <Button className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-8 h-10 uppercase tracking-wider">
                    Poster
                </Button>
            </div>
        </div>

        <ScrollArea className="flex-1 h-[400px]">
            <div className="p-6 space-y-6">
                {[
                    { id: 1, user: "Sophie M.", time: "Il y a 2h", content: "J'ai enfin publié mon offre sur LinkedIn ! Déjà 3 demandes de RDV.", likes: 12, liked: true },
                    { id: 2, user: "Thomas R.", time: "Il y a 4h", content: "Premier client signé à 2000€. Merci pour le feedback sur mon pitch !", likes: 24, liked: false },
                    { id: 3, user: "Alexandre B.", time: "Il y a 5h", content: "Site web mis en ligne. C'est pas parfait mais c'est fait. Action > Réflexion.", likes: 8, liked: false },
                ].map(post => (
                    <div key={post.id} className="flex gap-4 p-4 rounded-xl border border-slate-800 bg-[#0a0f1c] shadow-lg hover:border-slate-700 transition-colors">
                        <Avatar className="h-12 w-12 border-2 border-slate-700">
                            <AvatarFallback className="bg-slate-800 text-slate-400 font-bold">{post.user[0]}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 space-y-2">
                            <div className="flex justify-between items-start">
                                <h4 className={`font-bold text-base ${THEME.textMain}`}>{post.user}</h4>
                                <span className={`text-xs font-medium ${THEME.textMuted}`}>{post.time}</span>
                            </div>
                            
                            <p className={`text-base leading-relaxed ${THEME.textMuted}`}>{post.content}</p>
                        </div>

                        <div className="flex flex-col items-center justify-center gap-1 pl-4 border-l border-slate-800 min-w-[60px]">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className={`h-10 w-10 rounded-full ${post.liked ? 'text-orange-500 bg-orange-900/20' : 'text-slate-600 hover:bg-slate-800 hover:text-slate-400'}`}
                            >
                                <Flame className={`h-6 w-6 ${post.liked ? 'fill-current' : ''}`} />
                            </Button>
                            <span className={`text-sm font-black ${post.liked ? 'text-orange-500' : 'text-slate-500'}`}>{post.likes}</span>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    </Card>
);

const FloatingBuddyChat = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className={`fixed bottom-0 right-8 z-50 transition-all duration-500 ease-in-out ${isExpanded ? 'w-[400px] h-[600px]' : 'w-[300px] h-14'}`}>
            <Card className={`border border-slate-700 shadow-2xl bg-[#0d1220] flex flex-col h-full overflow-hidden ${isExpanded ? 'rounded-t-xl' : 'rounded-t-lg'}`}>
                {/* Header Toggle */}
                <div 
                    className="p-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between cursor-pointer hover:bg-slate-700/80 transition-colors"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Avatar className="h-8 w-8 border border-green-500/50">
                                <AvatarFallback className="bg-slate-900 text-white font-bold text-xs">MD</AvatarFallback>
                            </Avatar>
                            <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-slate-800"></div>
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-sm">Marc D.</h3>
                            <p className="text-[10px] text-green-400 font-bold uppercase tracking-wider">Copilote • En ligne</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isExpanded && <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>}
                        {isExpanded ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronUp className="h-5 w-5 text-slate-400" />}
                    </div>
                </div>

                {/* Content (Only when expanded) */}
                {isExpanded && (
                    <>
                        <ScrollArea className="flex-1 p-4 bg-[#0a0f1c]">
                            <div className="space-y-4">
                                <div className="flex justify-center">
                                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest bg-slate-900 px-3 py-1 rounded-full border border-slate-800">Aujourd'hui</span>
                                </div>
                                
                                <div className="flex gap-3">
                                    <Avatar className="h-8 w-8 mt-1 border border-slate-700">
                                        <AvatarFallback className="bg-slate-800 text-xs text-slate-400">MD</AvatarFallback>
                                    </Avatar>
                                    <div className="bg-slate-800 border border-slate-700 p-3 rounded-2xl rounded-tl-none text-sm text-slate-300 max-w-[85%]">
                                        <p>Salut ! Tu as vu la mission du jour ? "L'Audit de l'Inertie", ça pique un peu 😅</p>
                                    </div>
                                </div>

                                <div className="flex gap-3 flex-row-reverse">
                                    <div className="bg-blue-600 p-3 rounded-2xl rounded-tr-none text-sm text-white max-w-[85%] shadow-lg shadow-blue-900/20">
                                        <p>Grave. Je suis en train de l'écrire là. Et toi t'en es où ?</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Avatar className="h-8 w-8 mt-1 border border-slate-700">
                                        <AvatarFallback className="bg-slate-800 text-xs text-slate-400">MD</AvatarFallback>
                                    </Avatar>
                                    <div className="bg-slate-800 border border-slate-700 p-3 rounded-2xl rounded-tl-none text-sm text-slate-300 max-w-[85%]">
                                        <p>Je viens de finir ma "Phrase de Combat". Je te l'envoie pour avoir ton avis ?</p>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>

                        <div className="p-3 bg-[#0d1220] border-t border-slate-800 shrink-0">
                            <div className="relative">
                                <Input 
                                    placeholder="Écrire un message..." 
                                    className="bg-[#0a0f1c] border-slate-700 text-slate-200 pr-10 rounded-full text-sm h-10"
                                />
                                <Button size="icon" className="absolute right-1 top-1 h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white">
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
};

const MockAICoach = () => (
    <Card className={`border border-slate-800 shadow-2xl bg-slate-900 overflow-hidden flex flex-col h-full`}>
        <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-inner">
                    <Brain className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h3 className="font-black text-white text-base uppercase italic tracking-wider">Coach Popey AI</h3>
                    <p className="text-xs text-orange-100 font-medium opacity-90">Ton stratège personnel • J9</p>
                </div>
            </div>
        </div>
        
        <div className="p-4 bg-slate-950 flex-1 flex flex-col space-y-4 overflow-y-auto">
             <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-orange-900/50 border border-orange-500/30 flex items-center justify-center shrink-0">
                    <Brain className="h-4 w-4 text-orange-400" />
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl rounded-tl-none text-sm text-slate-300 shadow-sm">
                    <p className="font-bold text-orange-400 mb-1 text-xs uppercase">Coach Popey</p>
                    <p className="leading-relaxed">Salut ! Prêt pour la Chasse ?<br/>
                    Aujourd'hui, l'objectif est simple : <strong>Ramener du gibier (clients/leads).</strong><br/>
                    Si tu as besoin d'aide pour ton script d'appel ou ton message de prospection, colle-le ici. Je vais le rendre redoutable.</p>
                </div>
            </div>
            
            {/* Simulation d'un échange précédent pour montrer l'exemple */}
             <div className="flex gap-3 flex-row-reverse opacity-60">
                <div className="h-8 w-8 rounded-full bg-blue-900/50 border border-blue-500/30 flex items-center justify-center shrink-0">
                    <div className="h-4 w-4 bg-blue-400 rounded-full"></div>
                </div>
                <div className="bg-blue-900/20 border border-blue-800 p-3 rounded-2xl rounded-tr-none text-sm text-slate-400">
                    <p>Je ne sais pas comment relancer ce prospect qui m'a ghosté...</p>
                </div>
            </div>
        </div>

        <div className="p-4 bg-slate-900 border-t border-slate-800">
             <div className="relative">
                <Input 
                    placeholder="Pose ta question ou colle ton texte..." 
                    className="bg-slate-950 border-slate-800 text-slate-200 pr-12 h-12"
                />
                <Button size="icon" className="absolute right-1 top-1 h-10 w-10 bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-900/20">
                    <Send className="h-5 w-5" />
                </Button>
            </div>
            <p className="text-[10px] text-slate-600 text-center mt-2 flex items-center justify-center gap-1">
                <Sparkles className="h-3 w-3" /> IA entraînée sur la méthode Popey
            </p>
        </div>
    </Card>
);

const StoryBlock = ({ title, subtitle, icon: Icon, children, colorClass, proofType, isCompleted, onValidate }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const [proofInput, setProofInput] = useState("");

    // Validation logic for demo
    const isPhotoRequired = proofType === 'image';
    const isTextOrLinkRequired = proofType === 'text' || proofType === 'link';

    const canSubmit = isCompleted || (
        (!isPhotoRequired && !isTextOrLinkRequired) || 
        (isTextOrLinkRequired && proofInput.length > 5) || 
        (isPhotoRequired && proofInput === "uploaded")
    );

    return (
        <div className={`relative group overflow-hidden rounded-xl border transition-all duration-300 ${isOpen ? 'border-slate-600 bg-slate-900 ring-1 ring-slate-700' : 'border-slate-800 bg-[#111827] hover:border-slate-700'}`}>
            
            {/* Content Header (Always Visible) */}
            <div 
                className="relative z-10 p-6 cursor-pointer flex items-center justify-between min-h-[100px]"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-6">
                    <div className={`h-14 w-14 rounded-full flex items-center justify-center shrink-0 border ${isCompleted ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-slate-800 border-slate-700 text-slate-400 group-hover:text-white group-hover:border-slate-600'}`}>
                        {isCompleted ? <Check className="h-7 w-7" /> : <Icon className="h-7 w-7" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1.5">
                            <Badge variant="outline" className={`bg-transparent border-slate-700 text-[10px] tracking-widest uppercase text-slate-400 ${colorClass}`}>
                                {subtitle}
                            </Badge>
                            {isCompleted && <Badge className="bg-green-500/10 text-green-500 border border-green-500/20 text-[10px] px-2 py-0.5">Validé</Badge>}
                        </div>
                        <h3 className={`text-xl font-bold uppercase tracking-tight transition-colors ${isCompleted ? 'text-slate-500 line-through decoration-slate-700' : 'text-white'}`}>
                            {title}
                        </h3>
                    </div>
                </div>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-slate-800 rotate-180' : 'bg-transparent hover:bg-slate-800'}`}>
                    <ChevronDown className={`h-6 w-6 text-slate-400`} />
                </div>
            </div>

            {/* Expanded Content */}
            {isOpen && (
                <div className="px-6 pb-8 pt-2 border-t border-slate-800/50 animate-in slide-in-from-top-2">
                    <div className="pl-[80px]"> {/* Indent to align with text above */}
                        <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed mb-8">
                            {children}
                        </div>

                        {!isCompleted && (
                            <div className="bg-slate-950 border border-slate-800 rounded-lg p-6">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <AlertTriangle className="h-3 w-3" /> Preuve Requise
                                </h4>
                                
                                {isPhotoRequired && (
                                    <div 
                                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${proofInput === "uploaded" ? "border-green-500/50 bg-green-500/10 text-green-400" : "border-slate-700 hover:border-slate-600 hover:bg-slate-900 text-slate-400"}`}
                                        onClick={() => setProofInput("uploaded")}
                                    >
                                        {proofInput === "uploaded" ? (
                                            <div className="flex flex-col items-center gap-2">
                                                <CheckCircle2 className="h-8 w-8" />
                                                <span>Photo chargée avec succès</span>
                                            </div>
                                        ) : (
                                            "Clique ici pour déposer ta photo témoin"
                                        )}
                                    </div>
                                )}

                                {isTextOrLinkRequired && (
                                    <Input 
                                        placeholder="Écris ta réponse ou colle ton lien ici..." 
                                        className="bg-black border-slate-800 text-white h-12 focus-visible:ring-slate-600"
                                        onChange={(e) => setProofInput(e.target.value)}
                                        value={proofInput}
                                    />
                                )}

                                <div className="flex justify-end mt-6">
                                    <Button 
                                        size="lg"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onValidate();
                                            setIsOpen(false);
                                        }}
                                        disabled={!canSubmit}
                                        className={cn(
                                            "font-bold uppercase tracking-widest transition-all",
                                            "bg-white text-black hover:bg-slate-200"
                                        )}
                                    >
                                        Valider l'étape
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const MockGoldenTicket = () => (
    <Card className="relative overflow-hidden border border-yellow-500/30 bg-[#111827] shadow-xl group hover:border-yellow-500/50 transition-all duration-300">
        <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
            <Trophy className="h-32 w-32 text-yellow-500 rotate-12" />
        </div>
        
        <div className="p-6 flex flex-col md:flex-row items-center gap-6 relative z-10">
            {/* Left: Progress Circle */}
            <div className="relative shrink-0 flex flex-col items-center">
                <div className="h-20 w-20 rounded-full bg-[#0d1220] border-4 border-yellow-500/20 flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-full border-4 border-yellow-500 border-t-transparent animate-spin-slow" style={{ animationDuration: '3s' }}></div>
                    <span className="text-xl font-black text-yellow-500">60%</span>
                </div>
            </div>

            {/* Middle: Content */}
            <div className="flex-1 text-center md:text-left space-y-2">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                    <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 uppercase tracking-widest text-[10px]">Relique Scellée</Badge>
                </div>
                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                    POPEY CARD
                </h3>
                <p className="text-sm text-slate-400 font-medium">
                    Encore <span className="text-white font-bold text-yellow-400">6 jours</span> pour briser la pierre et débloquer ta récompense.
                </p>
            </div>

            {/* Right: Action (Locked) */}
            <div className="hidden md:block">
                 <div className="bg-[#0d1220] px-4 py-2 rounded-lg border border-slate-800 flex items-center gap-3 opacity-70">
                    <Lock className="h-5 w-5 text-slate-500" />
                    <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Verrouillé</span>
                 </div>
            </div>
        </div>
    </Card>
);

// --- MAIN PREVIEW PAGE ---

export default function CockpitPreviewPage() {
    const dayIndex = 9; // Changed to match user request (J9)
    const progress = (dayIndex / 14) * 100;
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);

    const toggleStep = (id: number) => {
        if (completedSteps.includes(id)) {
            setCompletedSteps(completedSteps.filter(s => s !== id));
        } else {
            setCompletedSteps([...completedSteps, id]);
        }
    };

    return (
        <div className={`min-h-screen ${THEME.bg} text-slate-200 font-sans selection:bg-orange-500/30`}>
            
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
                            { label: "Aujourd'hui", active: true },
                            { label: "Programme", active: false },
                            { label: "Équipage", active: false },
                            { label: "Classement", active: false },
                            { label: "Profil", active: false },
                        ].map((item) => (
                            <Button
                                key={item.label}
                                variant="ghost"
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
                            <AvatarFallback className="bg-slate-900 text-[10px] text-white font-bold">JP</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-bold text-slate-300 pr-1">Jean-Philippe</span>
                    </div>

                    <Button 
                        variant="ghost" 
                        size="sm" 
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
                        Équipage Cohorte 40 • En direct
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Votre Progression</span>
                    <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" style={{ width: `60%` }}></div>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-4 py-8 max-w-7xl">
                
                {/* En-tête de Mission - CENTRÉE ET MASSIVE */}
                <div className="mb-16 flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-slate-800/50 rounded-full border border-slate-700">
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-slate-300 text-xs font-bold uppercase tracking-widest">Mardi 17 Février • Jour 9 / 14</span>
                    </div>
                    
                    <h1 className="text-6xl md:text-8xl font-black text-white uppercase italic tracking-tighter mb-4 drop-shadow-[0_0_30px_rgba(249,115,22,0.3)]">
                        J9 : <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">La Chasse</span>
                    </h1>
                    
                    <p className="text-2xl text-slate-400 max-w-3xl leading-relaxed italic font-light mb-8">
                        "Aujourd'hui, on ne prépare plus. On sort. On chasse. On ramène."
                    </p>

                    {/* Popey Card (Intégrée) */}
                    <div className="inline-flex items-center gap-6 bg-[#111827] border border-yellow-500/30 rounded-full px-6 py-3 shadow-[0_0_20px_rgba(234,179,8,0.1)] hover:border-yellow-500/60 transition-colors cursor-pointer group">
                        <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-yellow-900/20 border-2 border-yellow-500 flex items-center justify-center">
                                <Trophy className="h-5 w-5 text-yellow-500" />
                            </div>
                            <div className="absolute -top-1 -right-1 h-4 w-4 bg-yellow-500 rounded-full flex items-center justify-center text-[10px] font-black text-black border border-[#111827]">
                                60%
                            </div>
                        </div>
                        <div className="text-left">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-black text-white uppercase italic tracking-tighter group-hover:text-yellow-400 transition-colors">POPEY CARD</h3>
                                <Lock className="h-3 w-3 text-slate-500" />
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                                Encore <span className="text-white font-bold">6 jours</span> pour briser la pierre
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
                                <div className="absolute inset-0 bg-black">
                                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497910091122-9f8a7746eb33?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-80 group-hover:opacity-60 transition-opacity duration-500"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-orange-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                            <PlayCircle className="relative h-24 w-24 text-white opacity-90 group-hover:scale-110 transition-transform duration-300 drop-shadow-2xl" />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/80 to-transparent">
                                        <Badge className="bg-orange-600 text-white border-0 mb-3 px-3 py-1 text-xs font-bold uppercase tracking-wider">Briefing J9</Badge>
                                        <h3 className="text-3xl font-black text-white uppercase italic tracking-tight mb-1">L'Art de la Relance</h3>
                                        <p className="text-slate-300 text-sm font-medium">Durée : 04:30 • Par Jean-Philippe</p>
                                    </div>
                                </div>
                            </div>
                         </div>

                        {/* Coach AI - Largeur 5 - À Côté de la Vidéo */}
                         <div className="lg:col-span-5 h-[400px]">
                            <MockAICoach />
                         </div>
                    </section>


                    {/* BLOC 2 : LES MISSIONS (L'ACTION) */}
                    <section className="max-w-4xl mx-auto w-full space-y-8">
                         <div className="flex items-center gap-4 mb-4">
                            <div className="h-px bg-slate-800 flex-1"></div>
                            <h2 className="text-xl font-black text-slate-500 uppercase tracking-[0.3em]">Plan de Bataille</h2>
                            <div className="h-px bg-slate-800 flex-1"></div>
                         </div>
                         
                         {/* 1. L'AUDIT DE L'INERTIE */}
                        <StoryBlock 
                            title="L'Audit de l'Inertie" 
                            subtitle="Intellectuel" 
                            icon={Clock} 
                            colorClass="text-blue-400"
                            proofType="text"
                            isCompleted={completedSteps.includes(1)}
                            onValidate={() => toggleStep(1)}
                        >
                            <p className="text-lg font-bold text-white mb-4">Le Temps Perdu.</p>
                            <p>Depuis combien de mois (ou d'années) est-ce que je me dis "il faut que je change quelque chose" sans le faire ?</p>
                            <p className="mt-4 italic text-slate-400 border-l-4 border-orange-500 pl-4 py-2 bg-white/5">
                                Matériel requis : Une feuille, un stylo. 5 minutes pour répondre.
                            </p>
                            <ul className="mt-6 space-y-3">
                                <li className="flex gap-3"><span className="text-orange-500 font-bold">1.</span> Regarde la vidéo de bienvenue.</li>
                                <li className="flex gap-3"><span className="text-orange-500 font-bold">2.</span> Contacte ton binôme : "Je monte à bord."</li>
                                <li className="flex gap-3"><span className="text-orange-500 font-bold">3.</span> Écris ta réponse à la question ci-dessus.</li>
                            </ul>
                        </StoryBlock>

                        {/* 2. LE SABOTAGE */}
                        <StoryBlock 
                            title="Le Sabotage" 
                            subtitle="Social" 
                            icon={AlertTriangle} 
                            colorClass="text-red-400"
                            proofType="text"
                            isCompleted={completedSteps.includes(2)}
                            onValidate={() => toggleStep(2)}
                        >
                            <p className="text-lg font-bold text-white mb-4">Quelle est la phrase d'excuse que je me sers le plus souvent pour ne pas agir aujourd'hui ?</p>
                            <p>"Je n'ai pas le temps" ? "Je ne suis pas prêt" ? "C'est trop risqué" ?</p>
                            <div className="mt-6 bg-white/5 p-6 rounded-lg border border-white/10">
                                <h5 className="font-bold text-white mb-2">Ton Ennemi Public N°1</h5>
                                <p className="text-sm">Identifie ce qui te rend fou dans ton marché. C'est contre ça que tu vas te battre.</p>
                                <p className="text-sm mt-2">Poste ta "Phrase de Combat" sur le groupe.</p>
                            </div>
                        </StoryBlock>

                        {/* 3. LA REALITE MATHEMATIQUE */}
                        <StoryBlock 
                            title="La Réalité Mathématique" 
                            subtitle="Créatif" 
                            icon={Ship} 
                            colorClass="text-orange-400"
                            proofType="image"
                            isCompleted={completedSteps.includes(3)}
                            onValidate={() => toggleStep(3)}
                        >
                            <p className="text-lg font-bold text-white mb-4">Si je ne change rien, à quoi ressemblera mon compte en banque dans 12 mois ?</p>
                            <p className="text-red-400 font-black text-2xl uppercase tracking-widest mb-6">EMPTY ?</p>
                            
                            <p>Il est temps de poser ton QG. Ton poste de pilotage.</p>
                            <ul className="mt-4 space-y-2 text-sm">
                                <li>📍 Choisis ton lieu (Bureau, Cuisine, Café).</li>
                                <li>📸 Prends UNE photo brute. Pas de mise en scène.</li>
                                <li>🚀 Poste-la pour valider ton entrée dans l'aventure.</li>
                            </ul>
                        </StoryBlock>
                    </section>
                </div>

                {/* Buddy Chat - Floating Fixed Bottom Right */}
                <FloatingBuddyChat />

                {/* Victory Wall - Full Width Bottom Section */}
                <div className="hidden lg:block mt-16 max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                            <Trophy className="h-8 w-8 text-yellow-500" />
                            Journal de Bord • <span className="text-orange-500">Victoires de l'Équipage</span>
                        </h3>
                        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-900/10 border border-yellow-500/20 rounded-full">
                            <Flame className="h-5 w-5 text-yellow-500 animate-pulse" />
                            <span className="text-yellow-500 font-black text-lg">24 🔥 / post</span>
                        </div>
                    </div>

                    {/* Zone de Saisie Rapide */}
                    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 mb-10 shadow-xl">
                        <div className="flex gap-4">
                            <Avatar className="h-12 w-12 border-2 border-slate-700">
                                <AvatarFallback className="bg-slate-800 text-white font-bold">JP</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-4">
                                <Input 
                                    placeholder="Quelle victoire as-tu décrochée aujourd'hui ?" 
                                    className="bg-slate-900 border-slate-700 text-lg font-medium text-white h-14 px-6 rounded-xl focus-visible:ring-orange-500"
                                />
                                <div className="flex justify-end">
                                    <Button size="lg" className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-8 rounded-xl shadow-lg shadow-orange-900/20">
                                        Poster ma Victoire 🚀
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                         {[
                            { id: 1, user: "Sophie M.", time: "Il y a 2h", content: "J'ai enfin publié mon offre sur LinkedIn ! Déjà 3 demandes de RDV.", likes: 12, liked: true },
                            { id: 2, user: "Thomas R.", time: "Il y a 4h", content: "Premier client signé à 2000€. Merci pour le feedback sur mon pitch !", likes: 24, liked: false },
                            { id: 3, user: "Alexandre B.", time: "Il y a 5h", content: "Site web mis en ligne. C'est pas parfait mais c'est fait. Action > Réflexion.", likes: 8, liked: false },
                            { id: 4, user: "Julie D.", time: "Il y a 6h", content: "J'ai osé appeler mon ancien patron pour lui vendre ma presta. Il a dit OUI !", likes: 42, liked: true },
                            { id: 5, user: "Karim L.", time: "Il y a 8h", content: "Vidéo tournée en une prise. Je ne me reconnais pas, l'énergie est folle.", likes: 15, liked: false },
                            { id: 6, user: "Marie P.", time: "Il y a 10h", content: "J'ai viré mon client toxique. Libération totale.", likes: 33, liked: true },
                        ].map(post => (
                            <div key={post.id} className="flex gap-4 p-5 rounded-xl border border-slate-800 bg-[#111827] shadow-lg hover:border-slate-600 transition-all hover:-translate-y-1">
                                <Avatar className="h-12 w-12 border-2 border-slate-700 shrink-0">
                                    <AvatarFallback className="bg-slate-800 text-slate-400 font-bold">{post.user[0]}</AvatarFallback>
                                </Avatar>
                                
                                <div className="flex-1 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <h4 className={`font-bold text-base ${THEME.textMain}`}>{post.user}</h4>
                                        <span className={`text-xs font-medium ${THEME.textMuted}`}>{post.time}</span>
                                    </div>
                                    
                                    <p className={`text-sm leading-relaxed ${THEME.textMuted}`}>{post.content}</p>

                                    <div className="pt-2 flex items-center justify-end">
                                         <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className={`h-8 px-2 rounded-full gap-2 ${post.liked ? 'text-orange-500 bg-orange-900/10' : 'text-slate-600 hover:bg-slate-800 hover:text-slate-400'}`}
                                        >
                                            <Flame className={`h-4 w-4 ${post.liked ? 'fill-current' : ''}`} />
                                            <span className="font-black text-xs">{post.likes}</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
