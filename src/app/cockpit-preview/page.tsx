"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayCircle, Users, Brain, Video, CheckCircle2, Trophy, Flame, ExternalLink, Send, Lock, ChevronDown, ChevronUp, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// --- MOCK COMPONENTS ---

const MockVictoryWall = () => (
    <Card className="h-full border-2 border-slate-100 shadow-sm bg-white flex flex-col">
        <CardHeader className="border-b bg-slate-50/50 pb-4 shrink-0">
            <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl font-black uppercase italic text-slate-800">
                    <Trophy className="h-6 w-6 text-yellow-500" />
                    Mur des Victoires
                </CardTitle>
                <span className="text-xs font-bold bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                    Objectif : 24 🔥 / post
                </span>
            </div>
        </CardHeader>
        
        <div className="p-4 border-b bg-white shrink-0 space-y-3">
            <Input 
                placeholder="Titre de ta victoire (ex: Mon premier client !)" 
                className="bg-slate-50 font-bold border-slate-200"
            />
            <div className="flex gap-2">
                <Input 
                    placeholder="Lien (URL)..." 
                    className="bg-slate-50 border-slate-200"
                />
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6">
                    Poster
                </Button>
            </div>
            <p className="text-xs text-slate-400 mt-1 ml-1 flex items-center gap-1">
                <Flame className="h-3 w-3 text-orange-400" /> Likez les posts des autres pour recevoir la pareille !
            </p>
        </div>

        <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
                {[
                    { id: 1, user: "Sophie M.", time: "Il y a 2h", content: "J'ai enfin publié mon offre sur LinkedIn ! Déjà 3 demandes de RDV.", likes: 12, liked: true },
                    { id: 2, user: "Thomas R.", time: "Il y a 4h", content: "Premier client signé à 2000€. Merci pour le feedback sur mon pitch !", likes: 24, liked: false },
                    { id: 3, user: "Julie L.", time: "Il y a 5h", content: "Vidéo de présentation tournée. C'était dur mais c'est fait.", likes: 8, liked: false },
                ].map(post => (
                    <div key={post.id} className="flex gap-3 p-3 rounded-lg border border-slate-100 bg-white shadow-sm">
                        <Avatar className="h-10 w-10 border border-slate-200">
                            <AvatarFallback>{post.user[0]}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-sm text-slate-800">{post.user}</h4>
                                <span className="text-xs text-slate-400">{post.time}</span>
                            </div>
                            
                            <p className="text-sm text-slate-600">{post.content}</p>
                            
                            <div className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 mt-1">
                                <ExternalLink className="h-3 w-3" /> Voir le post
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center gap-1 pl-2 border-l border-slate-100">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className={`h-8 w-8 rounded-full ${post.liked ? 'text-orange-500 bg-orange-50' : 'text-slate-300'}`}
                            >
                                <Flame className={`h-5 w-5 ${post.liked ? 'fill-current' : ''}`} />
                            </Button>
                            <span className="text-xs font-bold text-slate-600">{post.likes}</span>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    </Card>
);

const MockChatBox = () => (
    <div className="flex flex-col h-[500px] border rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-slate-50 flex flex-col gap-3">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                        <AvatarFallback className="bg-orange-100 text-orange-600 font-bold">M</AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                </div>
                <div>
                    <div className="font-bold text-slate-900 text-sm">Marc D.</div>
                    <div className="text-xs text-slate-500">En ligne</div>
                </div>
            </div>
        </div>

        <ScrollArea className="flex-1 p-4 bg-slate-50/50">
            <div className="space-y-4">
                <div className="flex flex-col items-start">
                    <div className="max-w-[80%] rounded-2xl px-4 py-2 text-sm bg-white border text-slate-800 rounded-bl-none shadow-sm">
                        Salut ! Prêt pour le J1 ? T'as vu la mission vidéo ? 😅
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 ml-1">09:01</span>
                </div>
                <div className="flex flex-col items-end">
                    <div className="max-w-[80%] rounded-2xl px-4 py-2 text-sm bg-indigo-600 text-white rounded-br-none shadow-sm">
                        Carrément ! Je viens de la tourner. Je la poste dans 5 min. Et toi ?
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 mr-1">09:05</span>
                </div>
                 <div className="flex flex-col items-start">
                    <div className="max-w-[80%] rounded-2xl px-4 py-2 text-sm bg-white border text-slate-800 rounded-bl-none shadow-sm">
                        Je galère un peu à trouver le bon angle pour "l'ennemi public", mais ça vient.
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 ml-1">09:06</span>
                </div>
            </div>
        </ScrollArea>

        <div className="p-3 bg-white border-t">
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <Input 
                    placeholder="Écrivez votre message..." 
                    className="flex-1 bg-slate-50 border-0 focus-visible:ring-1 focus-visible:ring-indigo-200"
                />
                <Button size="icon" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full h-10 w-10 shrink-0">
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </div>
    </div>
);

const MockGoldenTicket = ({ dayIndex }: { dayIndex: number }) => (
    <Card className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white border-0 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        <CardContent className="p-6 relative z-10 flex items-center justify-between">
            <div>
                <h3 className="font-black text-xl italic uppercase mb-1 flex items-center gap-2">
                    <Trophy className="h-6 w-6 text-yellow-200 animate-pulse" />
                    La Relique
                </h3>
                <p className="text-white/90 text-sm font-medium">
                    Jour {dayIndex}/15 validé ? Pas encore.
                </p>
            </div>
            <div className="text-right">
                <div className="text-3xl font-black">0/3</div>
                <div className="text-[10px] uppercase font-bold tracking-widest opacity-80">Missions</div>
            </div>
        </CardContent>
    </Card>
);

const MockMissionValidator = () => (
    <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-white border-2 border-green-200 flex items-center justify-center text-green-600">
                <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
                <h3 className="font-bold text-green-800">Valider ma journée</h3>
                <p className="text-sm text-green-600">J'ai terminé mes 3 missions.</p>
            </div>
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold">
                Je valide (J1 terminé)
            </Button>
        </CardContent>
    </Card>
);

const MockAICoach = () => (
    <Card className="border-purple-200 bg-purple-50">
        <CardHeader className="pb-2">
             <CardTitle className="text-sm text-purple-700 uppercase tracking-widest flex items-center gap-2">
                <Brain className="h-4 w-4" /> Coach IA
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="bg-white p-3 rounded-lg border border-purple-100 text-sm text-slate-600 mb-3 shadow-sm">
                "Salut ! Pour le J1, concentre-toi sur l'authenticité dans ta vidéo. Ne cherche pas à être parfait, cherche à être vrai. Les gens achètent ta conviction, pas ton montage."
            </div>
            <Button variant="outline" size="sm" className="w-full border-purple-200 text-purple-700 hover:bg-purple-100">
                Poser une question
            </Button>
        </CardContent>
    </Card>
);

// --- MAIN PREVIEW PAGE ---

export default function CockpitPreviewPage() {
    const dayIndex = 1;
    const progress = (dayIndex / 15) * 100;

    const intellectualSteps = [
        { id: 1, content: "🎯 Objectif 1 — S’engager\n\n- Regarde la vidéo de bienvenue (jusqu’au bout).\n\n- Contact (dans le chat) ton binôme et présentez-vous (qui vous êtes, ce que vous faites et votre objectif principale) et envoyez-vous la video que vous aurez faite (de l'objectif 3) dans le but de savoir ce qu'il en pense).\n\n- Prends 30 secondes pour intégrer les règles fondamentales :\n\n=> Action : ici, on fait avant de réfléchir trop longtemps.\n\nBienveillance : zéro jugement, zéro cynisme.\n\nTransparence : on dit les choses telles qu’elles sont, pas telles qu’on aimerait qu’elles soient.\n\n👉 Tu ne consommes pas ce programme.\n👉 Tu t’y engages activement, jour après jour.", category: 'intellectual' }
    ];
    const creativeSteps = [
        { id: 2, content: "🧭 Objectif 2 — Poser ton QG (Très précis)\n\nPourquoi ?\nParce que ce programme se vit dans le réel, pas dans la tête.\nTon QG est ton point d’ancrage pour les 15 prochains jours.\n\nCe que tu dois faire exactement :\n\nChoisis ton lieu de travail principal\n- Bureau\n- Table de cuisine\n- Coin du salon\n- Café\n\n👉 Peu importe le niveau. Ce qui compte, c’est que ce soit là où tu vas vraiment bosser.\n\nPrends UNE photo simple - Avec ton téléphone - Sans mise en scène - À hauteur d’yeux ou légèrement au-dessus\n\nMontre :\n- ton espace\n- ton ordi / carnet / téléphone\n- l’ambiance réelle (rangée ou en bazar, c’est OK)\n\n❌ Pas de photo Pinterest\n❌ Pas de retouche\n✅ Authentique uniquement\n\nPoste la photo dans le groupe Popey (canal “Cohorte / QG”)\n\nAjoute exactement cette trame de texte (à compléter) :\n\nMon QG pour les 15 prochains jours :\n📍 Lieu : [bureau / maison / café / autre]\n🧠 État d’esprit aujourd’hui : [mot ou phrase honnête]\n🎯 Ce que j’attends de ces 14 jours : [1 phrase max]\n\n📌 Exemple (important pour lever la peur) :\n\n“Mon QG pour les 15 prochains jours :\n📍 Table de cuisine\n🧠 Un peu stressé mais motivé\n🎯 Retrouver de la clarté et oser vendre”\n\n👉 Cette étape valide ton entrée officielle dans l’aventure.", category: 'creative' }
    ];
    const socialSteps = [
        { id: 3, content: "Exercice : Ton \"Ennemi\" Public N°1.\n\nPour te démarquer, tu dois savoir contre quoi tu te bats.\nUn bon positionnement n'est pas \"je fais du marketing\". C'est \"je déteste le marketing jargonnesque\".\n\n1. Trouve ta cible (La Bête Noire) : Pense à ce qui te rend fou dans ton secteur. Qu'est-ce que tes concurrents font tout le temps et qui dessert les clients ?\n- Est-ce qu'ils sont lents ?\n- Est-ce qu'ils utilisent des mots compliqués ?\n- Est-ce qu'ils vendent du rêve sans résultat ?\n- Est-ce qu'ils sont froids et distants ?\n\n2. Trouve ton arme (L'Antidote) : Quelle est l'exacte opposée que TU apportes ?\n- Lent -> Rapide\n- Compliqué -> Simple\n- Flou -> Garantie\n- Froid -> Humain\n\n3. L'Action Immédiate : Poste sur le groupe ta \"Phrase de Combat\" en complétant simplement ce modèle : \"Le problème de mon marché, c'est [Leur Défaut Majeur]. Moi, je suis l'antidote car je propose [Ta Solution Radicale].\"\n\nC'est tout. Choisis ton camp maintenant.", category: 'social' }
    ];
    const eventSteps = [
        { id: 4, content: "🎥 J1\n\nFormat : vidéo 1 min 30 max ou si tu préfères tu peux aussi faire live de 3-5 min avec ton binôme\n\nObjectif :\n1 : créer votre première présence authentique en ligne et commencer à vous mettre en avant sans filtre\n2 : Présentez-vous : qui vous êtes, votre métier, votre objectif principal pour les 14 jours\n3 : Partagez votre état d’esprit actuel et votre engagement pour le programme.\n\nPourquoi ?\nParce qu’on ne crée pas de dynamique collective avec des du silence.\n\nOk rentrons dans le vif du sujet : Ce que tu dois faire exactement :\n\nEnregistre une vidéo brute (smartphone, face caméra)\nDurée maximale : 1 minute 30\n\nÀ poster sur :\n1 : Ton réseau social principal (instagram/FB/TikTok..)\nImportant : Poste cette première vidéo aussi sur ton compte linkedin.com en mettant dans ton descriptif un #Popey.Academy\n=> si tu n'as pas de compte linkedin tu peux en créer un en quelques minutes et informer ton binôme de s'abonner à ton compte comme premier abonné).\nNB : N'oubli pas que ton assistant IA est là pour t'aider si tu as un probleme quelconque et ton binome est aussi là pour t'aider.\n\nTrame OBLIGATOIRE (dans cet ordre) :\nQui tu es\nPrénom\nVille (optionnel)\nContexte pro actuel\n\nCe que tu fais\nTon métier / activité\nMême si ce n’est “pas encore clair”\n\nTon objectif n°1 sur les 15 jours\nUn seul\nMesurable ou concret\n\nExemple :\n“Trouver mes 2 premiers clients”\n“Clarifier mon offre”\n“Oser prospecter sans blocage”\n\n🎯 Règles non négociables :\nPas de montage\nPas de script lu\nPas de perfection\nJuste toi, tel que tu es aujourd’hui\n\nC'est parti et si tu as du mal à commencer appelle ton binôme !", category: 'event' }
    ];

    const StepAccordion = ({ title, icon, groupSteps, colorClass }: any) => {
        const [isOpen, setIsOpen] = useState(false);
        const [isCompleted, setIsCompleted] = useState(false);
        const [proofInput, setProofInput] = useState("");

        if (groupSteps.length === 0) return null;

        const step = groupSteps[0]; // Assuming 1 main step per block as per new content

        // Determine if proof is required based on title/content keywords for this demo
        const isPhotoRequired = title.includes("Créatif");
        const isTextOrLinkRequired = title.includes("Social") || title.includes("Événement") || title.includes("Intellectuel");

        // Validation logic for demo
        const canSubmit = isCompleted || (
            (!isPhotoRequired && !isTextOrLinkRequired) || // No proof needed
            (isTextOrLinkRequired && proofInput.length > 5) || // Text/Link needs content
            (isPhotoRequired && proofInput === "uploaded") // Photo needs simulated upload
        );

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
                        <div className="mt-6 pt-4 border-t border-slate-100 space-y-4">
                            {/* PREUVE (SIMULATION) */}
                            {title.includes("Créatif") && (
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Preuve requise : Photo</label>
                                    <div 
                                        className={`border-2 border-dashed rounded-lg p-4 text-center text-sm cursor-pointer transition-colors ${proofInput === "uploaded" ? "border-green-500 bg-green-50 text-green-700" : "border-slate-300 text-slate-400 hover:bg-slate-100 hover:border-slate-400"}`}
                                        onClick={() => setProofInput("uploaded")}
                                    >
                                        {proofInput === "uploaded" ? "✅ Photo sélectionnée (IMG_2024.jpg)" : "Cliquez pour uploader votre photo"}
                                    </div>
                                </div>
                            )}
                            {title.includes("Social") && (
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Preuve requise : Lien ou Texte</label>
                                    <Input 
                                        placeholder="Collez votre phrase de combat ici..." 
                                        className="bg-white" 
                                        onChange={(e) => setProofInput(e.target.value)}
                                        value={proofInput}
                                    />
                                </div>
                            )}
                             {title.includes("Événement") && (
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Preuve requise : Lien Vidéo</label>
                                    <Input 
                                        placeholder="https://linkedin.com/posts/..." 
                                        className="bg-white" 
                                        onChange={(e) => setProofInput(e.target.value)}
                                        value={proofInput}
                                    />
                                </div>
                            )}

                            <div className="flex justify-end">
                                <Button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsCompleted(!isCompleted);
                                        setIsOpen(false); 
                                    }}
                                    disabled={!canSubmit}
                                    className={cn(
                                        "font-bold transition-all",
                                        isCompleted 
                                            ? "bg-white text-green-600 border border-green-200 hover:bg-green-50 hidden" 
                                            : "bg-slate-900 text-white hover:bg-slate-800"
                                    )}
                                >
                                    Envoyer la preuve & Valider
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderStepGroup = (title: string, icon: any, groupSteps: any[], colorClass: string) => (
        <StepAccordion title={title} icon={icon} groupSteps={groupSteps} colorClass={colorClass} />
    );

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Banner Preview Mode */}
            <div className="bg-yellow-400 text-yellow-900 text-center py-2 text-xs font-bold uppercase tracking-widest sticky top-0 z-50">
                🚧 Mode Prévisualisation (Données Fictives) 🚧
            </div>

            {/* Top Bar */}
            <header className="bg-white border-b h-16 flex items-center justify-between px-6 sticky top-8 z-40">
                <div className="flex items-center gap-4">
                    <div className="font-black text-xl italic uppercase text-slate-900">
                        Popey <span className="text-orange-500">Cockpit</span>
                    </div>
                    <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                        <span className="text-xs">⚓️</span>
                        <span className="text-xs font-bold uppercase tracking-wider">Équipage Alpha</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Votre progression</p>
                        <div className="w-32 h-2 bg-slate-100 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm bg-indigo-600">
                        <AvatarFallback className="bg-indigo-600 text-white font-bold">U</AvatarFallback>
                    </Avatar>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-7xl">
                
                {/* En-tête de Mission */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Badge className="bg-orange-500 text-white hover:bg-orange-600 uppercase tracking-widest">Jour 1 / 15</Badge>
                        <span className="text-slate-400 font-medium text-sm">Mardi 18 Février</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase italic">
                        J1 : LE GRAND SAUT
                    </h1>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    
                    {/* COLONNE GAUCHE (Mission + Victoires) */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* 0. LA RELIQUE (GOLDEN TICKET) */}
                        <MockGoldenTicket dayIndex={1} />

                        {/* 1. Briefing Vidéo */}
                        <Card className="overflow-hidden border-2 border-slate-200 shadow-sm">
                            <div className="aspect-video bg-slate-900 flex items-center justify-center relative group cursor-pointer">
                                <PlayCircle className="h-20 w-20 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute bottom-4 left-4 text-white font-bold text-sm bg-black/50 px-3 py-1 rounded-full">
                                    Vidéo de Briefing (2:30)
                                </div>
                            </div>
                            <CardContent className="p-6 bg-slate-50">
                                <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-slate-900">
                                    🎯 Vos 3 Missions du Jour
                                </h3>
                                
                                <div className="mb-6 text-sm text-slate-600 bg-white p-4 rounded-lg border border-slate-100 italic">
                                    "Bienvenue dans l'aventure. On pose les bases. Aujourd'hui, on ne réfléchit pas, on agit."
                                </div>

                                <div className="grid gap-4 md:grid-cols-1">
                                    {renderStepGroup("Intellectuel & Admin", <Brain className="h-4 w-4" />, intellectualSteps, "text-blue-600")}
                                    {renderStepGroup("Créatif & Contenu", <Video className="h-4 w-4" />, creativeSteps, "text-purple-600")}
                                    {renderStepGroup("Social & Live", <Users className="h-4 w-4" />, socialSteps, "text-orange-600")}
                                    {renderStepGroup("Événement (Live/Atelier)", <CheckCircle2 className="h-4 w-4" />, eventSteps, "text-red-600")}
                                </div>

                                {/* VALIDATION DE MA MISSION */}
                                <div className="mt-8">
                                    <MockMissionValidator />
                                </div>

                            </CardContent>
                        </Card>

                        {/* 3. Mur des Victoires */}
                        <div className="h-[500px]">
                            <MockVictoryWall />
                        </div>

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
                                    M
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">
                                        Marc Dupont
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        Freelance Marketing (75)
                                    </p>
                                    <p className="text-xs text-blue-500 mt-1 capitalize">
                                        Sur LinkedIn
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-2">
                                    <Button className="w-full bg-slate-900 text-white hover:bg-slate-800" size="sm">
                                    Contacter
                                    </Button>
                            </div>
                        </div>

                        {/* Chat */}
                        <MockChatBox />
                        
                        {/* COACH IA POPEY */}
                        <MockAICoach />

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

                        {/* Historique rapide (Mock) */}
                        <Card className="opacity-50">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Lock className="h-3 w-3" /> Historique
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-slate-400 italic">Disponible à partir de J2</p>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </main>
        </div>
    );
}
