"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
    Activity, ArrowUpRight, CheckCircle2, Heart, MessageSquare, Plus, 
    Star, Target, Trophy, Users, Zap, Clock, Shield, Search, Timer, Hourglass, 
    Gauge, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function ServicesTab() {
    const [reservedServices, setReservedServices] = useState<number[]>([]);
    const [isCreatingService, setIsCreatingService] = useState(false);
    const [difficulty, setDifficulty] = useState(30);
    
    // Calcul des points basé sur la difficulté
    const calculatedPoints = Math.max(10, Math.round(difficulty * 1.5));

    const getDifficultyLabel = (val: number) => {
        if (val <= 20) return { label: "Facile", color: "text-green-400", bg: "bg-green-500", border: "border-green-500/30" };
        if (val <= 40) return { label: "Moyen", color: "text-blue-400", bg: "bg-blue-500", border: "border-blue-500/30" };
        if (val <= 60) return { label: "Sérieux", color: "text-yellow-400", bg: "bg-yellow-500", border: "border-yellow-500/30" };
        if (val <= 80) return { label: "Difficile", color: "text-orange-400", bg: "bg-orange-500", border: "border-orange-500/30" };
        return { label: "Héroïque", color: "text-red-400", bg: "bg-red-500", border: "border-red-500/30" };
    };

    const toggleReservation = (id: number) => {
        if (reservedServices.includes(id)) {
            setReservedServices(reservedServices.filter(s => s !== id));
        } else {
            setReservedServices([...reservedServices, id]);
        }
    };

    return (
        <div className="space-y-12 max-w-5xl mx-auto pb-20">
            {/* HERO SECTION GAMIFIÉE */}
            <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-[#0a0f1c] p-8 md:p-12 text-center group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full group-hover:bg-blue-600/30 transition-all duration-1000"></div>
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-600/20 blur-[100px] rounded-full group-hover:bg-purple-600/30 transition-all duration-1000"></div>
                
                <div className="relative z-10 space-y-6">
                    <Badge variant="outline" className="border-yellow-500/30 bg-yellow-500/10 text-yellow-400 px-4 py-1 text-xs font-bold uppercase tracking-widest mb-4 animate-pulse">
                        <Zap className="h-3 w-3 mr-2" /> Zone d'Action Immédiate
                    </Badge>
                    
                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none">
                        Chasse aux <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Points</span>
                    </h2>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto font-medium">
                        Récupère des missions, gagne des points et débloque le statut <span className="text-white font-bold">Légende</span>. 
                        Plus tu aides, plus tu montes.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Button 
                            onClick={() => setIsCreatingService(true)}
                            size="lg" 
                            className="h-14 px-8 rounded-full bg-white text-black hover:bg-slate-200 font-black text-lg shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_50px_rgba(255,255,255,0.3)] transition-all hover:scale-105"
                        >
                            <Plus className="h-5 w-5 mr-2" /> Demander de l'Aide
                        </Button>
                        <div className="flex items-center gap-2 text-slate-500 font-medium text-sm px-4">
                            ou
                        </div>
                        <Button 
                            variant="outline" 
                            size="lg" 
                            className="h-14 px-8 rounded-full border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-500 font-bold text-lg transition-all"
                        >
                            Voir mes missions en cours
                        </Button>
                    </div>
                </div>
            </div>

            {/* FILTRES ÉPURÉS */}
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-2 no-scrollbar">
                {["Toutes les missions", "Rapides (<1h)", "Experts", "Urgent 🔥"].map((filter, i) => (
                    <button 
                        key={i}
                        className={`px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                            i === 0 
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                            : "bg-[#0a0f1c] text-slate-400 border border-slate-800 hover:border-slate-600 hover:text-white"
                        }`}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            {/* GRID DES MISSIONS (DESIGN CARTE DE JEU) */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    { id: 1, title: "Bras pour Déménagement", user: "Thomas D.", avatar: "TD", time: "Samedi 14h", duration: "3h", points: 150, difficulty: 65, type: "Physique", urgent: true },
                    { id: 2, title: "Code Review React", user: "Sarah M.", avatar: "SM", time: "Demain soir", duration: "1h", points: 80, difficulty: 40, type: "Tech", urgent: false },
                    { id: 3, title: "Conseil Juridique", user: "Karim B.", avatar: "KB", time: "Flexible", duration: "30min", points: 50, difficulty: 25, type: "Intellect", urgent: false },
                    { id: 4, title: "Prêt Caméra Sony", user: "Emma R.", avatar: "ER", time: "Mardi", duration: "N/A", points: 30, difficulty: 10, type: "Matériel", urgent: false },
                    { id: 5, title: "Feedback Design", user: "Lucas P.", avatar: "LP", time: "Ce soir", duration: "20min", points: 40, difficulty: 20, type: "Créatif", urgent: true },
                    { id: 6, title: "Intro Investisseur", user: "Julie A.", avatar: "JA", time: "Semaine pro", duration: "1h", points: 200, difficulty: 85, type: "Réseau", urgent: false },
                ].map((mission, i) => {
                    const isReserved = reservedServices.includes(mission.id);
                    const diffInfo = getDifficultyLabel(mission.difficulty);
                    
                    return (
                        <motion.div 
                            key={mission.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="group relative"
                        >
                            <div className={`
                                absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl transform transition-transform duration-300 
                                ${isReserved ? 'scale-[1.02] ring-2 ring-green-500 shadow-[0_0_30px_rgba(34,197,94,0.2)]' : 'group-hover:scale-[1.02] group-hover:shadow-2xl group-hover:shadow-blue-900/20'}
                            `}></div>
                            
                            <div className="relative h-full bg-[#0a0f1c] border border-slate-800 rounded-3xl p-6 flex flex-col justify-between overflow-hidden">
                                {/* Badge Type */}
                                <div className="absolute top-4 right-4">
                                    <Badge variant="secondary" className="bg-slate-900 text-slate-400 border-slate-800 font-bold text-[10px] uppercase tracking-wider">
                                        {mission.type}
                                    </Badge>
                                </div>

                                {/* Header */}
                                <div className="mb-6">
                                    {mission.urgent && (
                                        <div className="inline-flex items-center gap-1 text-red-500 font-black text-[10px] uppercase tracking-widest mb-3 animate-pulse">
                                            <Shield className="h-3 w-3" /> Urgent
                                        </div>
                                    )}
                                    <h3 className="text-xl font-bold text-white leading-tight mb-2 group-hover:text-blue-400 transition-colors">
                                        {mission.title}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6 border border-slate-700">
                                            <AvatarFallback className="bg-slate-800 text-[10px] text-slate-300 font-bold">{mission.avatar}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm text-slate-500 font-medium">par {mission.user}</span>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800/50">
                                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Gain</div>
                                        <div className="text-2xl font-black text-yellow-400 flex items-center gap-1">
                                            {mission.points} <span className="text-[10px] text-yellow-500/50">PTS</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800/50">
                                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Durée</div>
                                        <div className="text-lg font-bold text-white">{mission.duration}</div>
                                    </div>
                                </div>

                                {/* Footer / Action */}
                                <div className="mt-auto space-y-3">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <span>Difficulté</span>
                                        <span className={diffInfo.color}>{diffInfo.label}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${diffInfo.bg}`} 
                                            style={{ width: `${mission.difficulty}%` }}
                                        ></div>
                                    </div>

                                    <Button 
                                        className={`w-full h-12 rounded-xl font-bold text-sm transition-all mt-4 ${
                                            isReserved 
                                            ? 'bg-green-500 hover:bg-green-600 text-black' 
                                            : 'bg-white text-black hover:bg-blue-500 hover:text-white'
                                        }`}
                                        onClick={() => toggleReservation(mission.id)}
                                    >
                                        {isReserved ? (
                                            <span className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4" /> Mission Acceptée
                                            </span>
                                        ) : (
                                            "Accepter le défi"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* CLASSEMENT RAPIDE EN BAS DE PAGE */}
            <div className="mt-12 pt-12 border-t border-slate-800">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold text-white">Top Contributeurs de la Semaine</h3>
                    <Button variant="link" className="text-blue-400">Voir le classement complet</Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { name: "Sarah M.", points: 1250, rank: 1, avatar: "SM" },
                        { name: "Karim B.", points: 980, rank: 2, avatar: "KB" },
                        { name: "Julie L.", points: 850, rank: 3, avatar: "JL" },
                    ].map((user, i) => (
                        <div key={i} className="flex items-center gap-4 bg-[#0a0f1c] border border-slate-800 p-4 rounded-2xl">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 text-white font-black text-sm border border-slate-700">
                                {user.rank}
                            </div>
                            <Avatar className="h-10 w-10 border border-slate-700">
                                <AvatarFallback className="bg-blue-600 text-white font-bold">{user.avatar}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-bold text-white">{user.name}</div>
                                <div className="text-xs text-yellow-400 font-bold">{user.points} PTS</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* MODALE DE CRÉATION DE SERVICE (Inchangé mais intégré) */}
            <Dialog open={isCreatingService} onOpenChange={setIsCreatingService}>
                <DialogContent className="bg-[#0a0f1c] border-slate-800 text-white max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Zap className="h-5 w-5 text-yellow-400" /> Créer une demande de service
                        </DialogTitle>
                    </DialogHeader>
                    {/* ... (Contenu du formulaire identique à avant) ... */}
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label className="text-slate-400">Titre de la demande</Label>
                            <Input placeholder="Ex: Aide pour déménagement, Relecture..." className="bg-slate-900 border-slate-700 text-white" />
                        </div>
                        <div className="space-y-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                            <div className="flex justify-between items-center">
                                <Label className="text-slate-200 font-bold flex items-center gap-2">
                                    <Gauge className="h-4 w-4 text-blue-400" /> Difficulté & Points
                                </Label>
                                <span className={`font-black text-sm ${getDifficultyLabel(difficulty).color}`}>
                                    {getDifficultyLabel(difficulty).label} ({difficulty}/100)
                                </span>
                            </div>
                            <Slider 
                                value={[difficulty]} 
                                onValueChange={(vals) => setDifficulty(vals[0])} 
                                max={100} 
                                step={5}
                                className="py-4"
                            />
                            <div className="bg-slate-800 p-3 rounded-lg flex justify-between items-center border border-slate-700">
                                <span className="text-xs text-slate-400 max-w-[70%]">
                                    Indiquez la difficulté pour que l'exécutant sache combien de points il gagnera.
                                </span>
                                <div className="text-right">
                                    <span className="block text-2xl font-black text-yellow-400">{calculatedPoints}</span>
                                    <span className="text-[10px] uppercase font-bold text-slate-500">Points à gagner</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-400">Description détaillée</Label>
                            <Textarea placeholder="Détails, contraintes, horaires..." className="bg-slate-900 border-slate-700 text-white min-h-[100px]" />
                        </div>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 font-bold" onClick={() => setIsCreatingService(false)}>
                            Publier la demande (+{calculatedPoints} pts offerts)
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}