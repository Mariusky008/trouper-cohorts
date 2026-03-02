"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { User, Zap, Lock, Phone, Clock, Sparkles, Fingerprint, Search, Flame, Briefcase, Handshake, TrendingUp, Target, CheckCircle2, Users, Star, MessageSquare, Gift, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { OPPORTUNITY_TYPES } from "@/constants/opportunities";

const MISSION_TYPES = [
    { id: 'portier', label: 'Portier', icon: Lock, desc: "Ouvre-moi une porte spécifique", color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { id: 'amplificateur', label: 'Amplificateur', icon: TrendingUp, desc: "Boostons notre visibilité mutuelle", color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    { id: 'prescripteur', label: 'Prescripteur', icon: Handshake, desc: "Devenons apporteurs d'affaires", color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { id: 'recommandeur', label: 'Recommandeur', icon: Star, desc: "Échangeons un avis ou une reco", color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    { id: 'infiltre', label: 'Infiltré', icon: Fingerprint, desc: "Parraine-moi dans ton club/réseau", color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' }
];

// --- 1. WAITING CARD (Post-registration / Next Day) ---
// Goal: "Wahoo", colorful, anticipation for tomorrow.
export function WaitingCardPreview() {
  return (
    <div className="relative w-full max-w-sm mx-auto h-[600px] rounded-[2.5rem] overflow-hidden shadow-2xl bg-[#0a0f1c] flex flex-col items-center justify-center text-center p-6 border border-white/10 group">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-[#0a0f1c] to-[#0a0f1c] animate-pulse-slow"></div>
      
      {/* Pulsing Radar Effect (The User's Inspiration) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.5, scale: 0.5 }}
            animate={{ opacity: 0, scale: 1.5 }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              delay: i * 0.8,
              ease: "easeOut"
            }}
            className="absolute border border-indigo-500/30 rounded-full w-64 h-64 shadow-[0_0_30px_rgba(99,102,241,0.2)]"
          />
        ))}
        {/* Central Glowing Orb */}
        <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 blur-xl opacity-50 animate-pulse"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 space-y-8">
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="mx-auto w-24 h-24 rounded-full bg-black/50 border-2 border-indigo-500/50 flex items-center justify-center backdrop-blur-md shadow-[0_0_40px_rgba(99,102,241,0.4)]"
        >
           <Search className="w-10 h-10 text-indigo-400" />
        </motion.div>

        <div>
          <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 mb-2">
            Analyse en cours...
          </h3>
          <p className="text-slate-400 font-medium leading-relaxed max-w-[250px] mx-auto">
            Notre IA scanne le réseau pour trouver <span className="text-white font-bold">LA personne</span> qui va booster votre business demain.
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 w-full">
           <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-slate-400">Prochain match dans</span>
              <span className="text-indigo-400 font-bold font-mono">14:23:05</span>
           </div>
           <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" 
                initial={{ width: "0%" }}
                animate={{ width: "65%" }}
                transition={{ duration: 1.5, ease: "circOut" }}
              />
           </div>
        </div>
      </div>
    </div>
  );
}

// --- 2. MYSTERY CARD (Before Reveal) ---
// Goal: "Trigger for business", "Wahoo", catchy text.
export function MysteryCardPreview() {
  return (
    <div className="relative w-full max-w-sm mx-auto min-h-[600px] h-auto rounded-[2.5rem] overflow-hidden shadow-2xl bg-[#020617] flex flex-col items-center text-center p-6 cursor-pointer group border border-white/10 pb-8">
      {/* Animated Gradient Border */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 via-blue-600/20 to-purple-600/30 opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
      <div className="absolute inset-[1px] bg-[#020617] rounded-[2.4rem] z-0"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full h-full pt-6 pb-4 justify-between">
        
        <div className="flex flex-col items-center w-full">
            {/* Header Badge */}
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1 animate-pulse mb-8 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                MATCH DÉTECTÉ ⚡️
            </Badge>

            {/* Identity Lock (Smaller) */}
            <div className="relative mb-8">
                <motion.div 
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-24 h-24 rounded-full border border-white/10 flex items-center justify-center bg-white/5 backdrop-blur-sm relative z-10 shadow-[0_0_30px_rgba(16,185,129,0.1)]"
                >
                    <Fingerprint className="w-12 h-12 text-white/70" />
                    <div className="absolute inset-0 rounded-full border-t-2 border-emerald-500 animate-spin"></div>
                </motion.div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-emerald-500/20 blur-[50px] rounded-full pointer-events-none"></div>
            </div>

            {/* 1. KEY INFO SIMPLIFIED */}
            <div className="w-full space-y-4 mb-6">
                <div className="text-center">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">PROFIL</p>
                    <p className="text-xl font-black text-white">Dirigeant B2B <span className="text-slate-500 mx-2">•</span> Bordeaux</p>
                </div>
                
                <div className="flex flex-col items-center justify-center gap-2 bg-[#0f172a] rounded-xl p-4 border border-white/5 shadow-lg max-w-[80%] mx-auto">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">POTENTIEL SYNERGIE</span>
                    <div className="flex gap-1">
                        {[1,2,3,4,5].map(i => (
                            <Star key={i} className="w-5 h-5 text-orange-400 fill-orange-400" />
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* 2. CONCRETE BENEFITS */}
        <div className="w-full bg-slate-900/40 rounded-2xl p-5 text-left border border-white/5 mb-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-black text-white uppercase tracking-wider">CE QU'IL PEUT VOUS APPORTER</span>
            </div>
            <ul className="space-y-3">
                <li className="flex items-center gap-3 text-xs text-slate-300 font-medium">
                    <div className="bg-emerald-500/20 p-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    Introduction stratégique (Décideurs)
                </li>
                <li className="flex items-center gap-3 text-xs text-slate-300 font-medium">
                    <div className="bg-emerald-500/20 p-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    Boost de visibilité LinkedIn
                </li>
                <li className="flex items-center gap-3 text-xs text-slate-300 font-medium">
                    <div className="bg-emerald-500/20 p-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    Partenariats locaux
                </li>
            </ul>
        </div>

        <Button className="w-full h-14 bg-white text-black font-black text-base rounded-2xl hover:scale-[1.02] transition-transform shadow-[0_0_30px_rgba(255,255,255,0.15)] animate-bounce-subtle border-2 border-white/50 flex items-center justify-center">
            DÉCOUVRIR QUI C'EST 🔓
        </Button>
      </div>
    </div>
  );
}

// --- 2b. MYSTERY CARD (LOCKED) ---
// Goal: Vibrant locked state, not dead/gray.
export function MysteryCardLockedPreview() {
  return (
    <div className="relative w-full max-w-sm mx-auto min-h-[600px] h-auto rounded-[2.5rem] overflow-hidden shadow-2xl bg-[#020617] flex flex-col items-center text-center p-6 border border-white/10 pb-8">
      {/* Animated Gradient Border (Still visible but subtler) */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 via-blue-600/20 to-purple-600/30 opacity-50 transition-opacity duration-500"></div>
      <div className="absolute inset-[1px] bg-[#020617] rounded-[2.4rem] z-0"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full h-full pt-6 pb-4 justify-between">
        
        <div className="flex flex-col items-center w-full">
            {/* Header Badge */}
            <Badge className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 px-3 py-1 mb-8 flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <Clock className="w-3 h-3" /> DISPONIBLE DEMAIN 06H
            </Badge>

            {/* Identity Lock (Smaller) */}
            <div className="relative mb-8">
                <motion.div 
                    className="w-24 h-24 rounded-full border border-white/10 flex items-center justify-center bg-white/5 backdrop-blur-sm relative z-10 shadow-[0_0_30px_rgba(16,185,129,0.1)]"
                >
                    <Lock className="w-10 h-10 text-white/50" />
                </motion.div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none"></div>
            </div>

            {/* 1. IMPACT SCORE */}
            <div className="w-full space-y-3 mb-6">
                <div className="flex justify-between items-center px-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">IMPACT POTENTIEL</span>
                    <div className="flex gap-1.5">
                        {[1,2,3,4,5].map(i => (
                            <div key={i} className={`h-1.5 w-5 rounded-full ${i <= 4 ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]' : 'bg-slate-900'}`} />
                        ))}
                    </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[#0f172a] rounded-xl p-3 flex flex-col items-center justify-center border border-white/5 shadow-lg">
                        <Flame className="w-5 h-5 text-orange-500 mb-1.5" />
                        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">POTENTIEL</span>
                        <span className="text-xs font-black text-white">SYNERGIES</span>
                    </div>
                    <div className="bg-[#0f172a] rounded-xl p-3 flex flex-col items-center justify-center border border-white/5 shadow-lg">
                        <Users className="w-5 h-5 text-blue-500 mb-1.5" />
                        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">TOTAL COLLABS</span>
                        <span className="text-xs font-black text-white">DÉBUTANT</span>
                    </div>
                    <div className="bg-[#0f172a] rounded-xl p-3 flex flex-col items-center justify-center border border-white/5 shadow-lg">
                        <Handshake className="w-5 h-5 text-purple-500 mb-1.5" />
                        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider text-center leading-tight">TAUX DE<br/>COMPATIBILITÉ</span>
                        <span className="text-xs font-black text-white">77%</span>
                    </div>
                </div>
            </div>
        </div>

        {/* 2. CONCRETE BENEFITS */}
        <div className="w-full bg-slate-900/40 rounded-2xl p-5 text-left border border-white/5 mb-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span className="text-[10px] font-black text-white uppercase tracking-wider">CE QU'IL PEUT VOUS APPORTER</span>
            </div>
            <ul className="space-y-3">
                <li className="flex items-center gap-3 text-xs text-slate-300 font-medium">
                    <div className="bg-indigo-500/20 p-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    2 à 5 clients potentiels / mois
                </li>
                <li className="flex items-center gap-3 text-xs text-slate-300 font-medium">
                    <div className="bg-indigo-500/20 p-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    Partenariats locaux stratégiques
                </li>
                <li className="flex items-center gap-3 text-xs text-slate-300 font-medium">
                    <div className="bg-indigo-500/20 p-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    Recommandations croisées
                </li>
            </ul>
        </div>

        <Button disabled className="w-full h-14 bg-slate-800/50 text-slate-400 cursor-not-allowed border border-white/5 font-black text-base rounded-2xl transition-all shadow-none">
            <span className="flex items-center gap-2"><Lock className="w-4 h-4" /> DÉVERROUILLAGE DEMAIN</span>
        </Button>
      </div>
    </div>
  );
}

// --- 3. MATCH CARD (The Match) ---
// Goal: FOMO, "I can't wait", "Don't miss this".

export function MatchCardPreview() {
  const [isMissionOpen, setIsMissionOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<string | null>(null);
  const [isWhyVisible, setIsWhyVisible] = useState(false);
  const [isPhoneOpen, setIsPhoneOpen] = useState(false);
  const [isOpportunityOpen, setIsOpportunityOpen] = useState(false);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  
  // Mock suggestion for preview
  const suggestedMissionId = 'amplificateur';
  const suggestedMission = MISSION_TYPES.find(m => m.id === suggestedMissionId);

  return (
    <div className="relative w-full max-w-sm mx-auto h-[600px] rounded-[2.5rem] overflow-hidden shadow-2xl bg-[#0f172a] border border-slate-800">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
            src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80" 
            alt="Match" 
            className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/80 to-transparent"></div>
      </div>

      {/* FOMO Badge - Top */}
      <div className="absolute top-6 left-6 right-6 z-20">
        <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-red-500/20 backdrop-blur-md text-white px-5 py-3 rounded-2xl flex flex-col items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.2)] text-center gap-1 border border-red-500/30"
        >
            <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider text-red-100 mb-1">
                <Phone className="w-4 h-4 animate-bounce" />
                Jean-Paul vous appelle
            </div>
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-lg border border-white/10">
                 <Clock className="w-3 h-3 text-red-200" />
                 <span className="font-mono font-bold text-sm text-white">09h - 11h</span>
            </div>
            <div className="text-[10px] font-bold text-red-200/80 mt-1">
                Fin du créneau dans <span className="font-mono text-xs text-white">01:59:00</span>
            </div>
        </motion.div>
      </div>

      {/* Main Content - Bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6 pt-24 bg-gradient-to-t from-[#0f172a] via-[#0f172a] to-transparent">
        
        {/* Match Score */}
        <div className="flex items-end gap-3 mb-2">
            <h2 className="text-5xl font-black text-white tracking-tighter">Jean-Paul</h2>
            <Button variant="outline" className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30 hover:text-emerald-300 px-3 py-1 rounded-lg text-xs font-black mb-1.5 flex items-center gap-1 h-auto transition-colors">
                <User className="w-3 h-3" /> Voir profil
            </Button>
        </div>

        <p className="text-slate-300 text-sm font-medium mb-4 line-clamp-2 leading-snug opacity-90">
            "Ce directeur commercial peut vous ouvrir des opportunités auxquelles vous n’aviez pas accès hier."
        </p>

        {/* 3. MISSION SELECTOR (NEW) */}
        <div className="bg-indigo-500/20 border border-indigo-500/30 rounded-xl p-3 mb-6 backdrop-blur-sm cursor-pointer hover:bg-indigo-500/30 transition-colors" onClick={() => setIsMissionOpen(true)}>
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-400" />
                    <span className="text-[10px] font-black text-indigo-300 uppercase tracking-wider">Objectif de l'appel</span>
                </div>
                {selectedMission && <Badge className="text-[9px] h-4 bg-indigo-500 text-white">Choisi</Badge>}
            </div>
            <p className="text-white text-xs font-medium italic truncate">
                {selectedMission 
                    ? MISSION_TYPES.find(m => m.id === selectedMission)?.desc 
                    : suggestedMission 
                        ? `Suggestion : ${suggestedMission.label} (Cliquez pour valider)`
                        : "Cliquez pour définir votre objectif 🎯"}
            </p>
        </div>

        {/* Action Buttons (Dock Style) */}
        <div className="flex justify-center items-center gap-4 pb-4">
            
            {/* 0. Mission Dialog */}
            <Dialog open={isMissionOpen} onOpenChange={setIsMissionOpen}>
                <DialogContent className="bg-[#0f172a] border-white/10 text-white sm:max-w-md rounded-2xl w-[90vw] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-black text-indigo-400">
                            <Target className="h-6 w-6" />
                            Menu de la Carte 🍽️
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Ne partez pas sans objectif. Choisissez le thème de votre échange.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-3 py-4">
                        {MISSION_TYPES.map((mission) => {
                            const isSuggested = mission.id === suggestedMissionId;
                            const isSelected = mission.id === selectedMission;
                            const Icon = mission.icon;
                            
                            return (
                                <button
                                    key={mission.id}
                                    onClick={() => {
                                        setSelectedMission(mission.id);
                                        setIsMissionOpen(false);
                                        toast.success(`Objectif "${mission.label}" sélectionné !`);
                                    }}
                                    className={cn(
                                        "flex items-center gap-4 p-4 rounded-xl border transition-all text-left relative overflow-hidden group",
                                        isSelected 
                                            ? "bg-indigo-600/20 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]" 
                                            : "bg-slate-900/50 border-white/5 hover:bg-slate-800",
                                        isSuggested && !isSelected && "border-indigo-500/50"
                                    )}
                                >
                                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", mission.bg)}>
                                        <Icon className={cn("h-5 w-5", mission.color)} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className={cn("font-bold text-sm", isSelected ? "text-indigo-300" : "text-white")}>
                                                {mission.label}
                                            </span>
                                            {isSuggested && (
                                                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[9px] px-1.5 h-4">
                                                    Recommandé
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-400 font-medium leading-tight mt-0.5">
                                            "{mission.desc}"
                                        </p>
                                    </div>
                                    {isSelected && <div className="absolute right-4"><CheckCircle2 className="w-5 h-5 text-indigo-400" /></div>}
                                </button>
                            );
                        })}
                    </div>

                    <div className="bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20 mb-2">
                         <p className="text-xs text-indigo-200 text-center font-medium">
                             <span className="font-bold">Astuce :</span> En choisissant un thème, vous évitez le "blabla" inutile et garantissez un résultat concret.
                         </p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 1. Message / Script */}
            <Dialog open={isWhyVisible} onOpenChange={setIsWhyVisible}>
                <DialogTrigger asChild>
                    <Button size="icon" className="h-14 w-14 rounded-full bg-slate-800/80 backdrop-blur-md border border-white/10 text-yellow-400 hover:bg-slate-700 hover:scale-110 transition-all shadow-lg">
                        <MessageSquare className="h-6 w-6 fill-current" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#0f172a] border-white/10 text-white sm:max-w-md rounded-2xl w-[90vw] p-0 overflow-hidden">
                    <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-6">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl font-black">
                                <Zap className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                                Pourquoi ce match ?
                            </DialogTitle>
                            <DialogDescription className="text-slate-300">
                                Voici pourquoi l'algorithme vous a réunis aujourd'hui.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <h4 className="text-sm font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                                <Target className="h-4 w-4 text-blue-400" /> Synergie Détectée
                            </h4>
                            <p className="text-slate-200 leading-relaxed text-sm">
                                "L'algorithme a détecté une complémentarité rare : votre expertise en <span className="text-white font-bold">stratégie commerciale</span> est exactement ce dont Jean-Paul a besoin pour structurer sa croissance. En retour, son réseau influent dans la Tech peut vous ouvrir les portes des grands comptes que vous ciblez."
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-sm font-bold text-slate-400 uppercase flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-emerald-400" /> Potentiel Immédiat
                            </h4>
                            <ul className="space-y-2">
                                <li className="flex items-center gap-3 text-sm text-slate-300">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <span>Opportunité de co-création (Podcast/Live)</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm text-slate-300">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <span>Partage de réseau local (Bordeaux)</span>
                                </li>
                            </ul>
                        </div>

                        <Button className="w-full bg-slate-800 hover:bg-slate-700 font-bold h-12 rounded-xl" onClick={() => setIsWhyVisible(false)}>
                            Compris, je l'appelle ! 📞
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 2. CALL (Main Action) */}
            <Dialog open={isPhoneOpen} onOpenChange={setIsPhoneOpen}>
                <DialogTrigger asChild>
                    <div className="relative group cursor-pointer">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-blue-600 rounded-full blur opacity-40 group-hover:opacity-70 transition-opacity animate-pulse"></div>
                        <Button size="icon" className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 text-white hover:scale-105 transition-all shadow-xl border-4 border-[#0f172a] relative z-10">
                            <PhoneCall className="h-8 w-8 fill-current" />
                        </Button>
                    </div>
                </DialogTrigger>
                <DialogContent className="bg-[#0f172a] border-white/10 text-white sm:max-w-md rounded-2xl">
                    <div className="flex flex-col items-center gap-6 py-8">
                        <div className="h-20 w-20 rounded-full bg-emerald-500/20 flex items-center justify-center animate-pulse">
                            <Phone className="h-10 w-10 text-emerald-400" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-2xl font-black">C'est parti ! 🚀</h3>
                            <p className="text-slate-400">Appelez Jean-Paul maintenant.</p>
                        </div>
                        <div className="text-3xl font-black tracking-widest text-white bg-slate-900 px-6 py-4 rounded-xl border border-white/10 shadow-inner select-all">
                            06 12 34 56 78
                        </div>
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold h-12 rounded-xl" onClick={() => setIsPhoneOpen(false)}>Fermer</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 3. Gift */}
            <Dialog open={isOpportunityOpen} onOpenChange={setIsOpportunityOpen}>
                <DialogTrigger asChild>
                    <Button size="icon" className="h-14 w-14 rounded-full bg-slate-800/80 backdrop-blur-md border border-white/10 text-purple-400 hover:bg-slate-700 hover:scale-110 transition-all shadow-lg">
                        <Gift className="h-6 w-6" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#0f172a] border-white/10 text-white sm:max-w-md rounded-2xl w-[95vw] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-black">
                            <Gift className="h-6 w-6 text-purple-400" />
                            Offrir une Opportunité
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Quelle valeur souhaitez-vous apporter à Jean-Paul ?
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-2 gap-3 py-4">
                        {OPPORTUNITY_TYPES.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => {
                                    setIsOpportunityOpen(false);
                                    toast.success(`Opportunité "${type.label}" envoyée ! 🎁`);
                                    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                                }}
                                className={cn(
                                    "flex flex-col items-center justify-start p-3 rounded-xl border transition-all hover:scale-105 text-center gap-2 group min-h-[120px]",
                                    type.bg.replace('bg-', 'bg-opacity-10 bg-'),
                                    type.border.replace('border-', 'border-opacity-20 border-')
                                )}
                                style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                            >
                                <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shadow-sm shrink-0 bg-white/5", type.color)}>
                                    <type.icon className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col gap-1 w-full">
                                    <span className="font-bold text-white text-xs leading-tight">{type.cardLabel || type.label}</span>
                                    <span className="text-[10px] text-slate-400 font-medium leading-tight px-1 line-clamp-2 opacity-70">
                                        {type.cardDescription || type.description}
                                    </span>
                                    <span className="text-[10px] text-emerald-400 font-bold mt-auto pt-1">+{type.points} pts</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* 4. Rate */}
            <Dialog open={isRatingOpen} onOpenChange={setIsRatingOpen}>
                <DialogTrigger asChild>
                    <Button size="icon" className="h-14 w-14 rounded-full bg-slate-800/80 backdrop-blur-md border border-white/10 text-orange-400 hover:bg-slate-700 hover:scale-110 transition-all shadow-lg">
                        <Star className="h-6 w-6 fill-current" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#0f172a] border-white/10 text-white sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-black justify-center">
                            Comment s'est passé l'échange ?
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-3 gap-3 py-6">
                        <Button onClick={() => { setIsRatingOpen(false); toast.success("Feedback enregistré ! 🔥"); }} className="h-24 flex flex-col bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <span className="text-3xl mb-2">🔥</span> TOP
                        </Button>
                        <Button onClick={() => { setIsRatingOpen(false); toast.success("Feedback enregistré ! 👍"); }} className="h-24 flex flex-col bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            <span className="text-3xl mb-2">👍</span> SYMPA
                        </Button>
                        <Button onClick={() => { setIsRatingOpen(false); toast.success("Feedback enregistré ! 😕"); }} className="h-24 flex flex-col bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 border border-slate-500/30">
                            <span className="text-3xl mb-2">😕</span> BOF
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
      </div>
    </div>
  );
}

// --- 6. MISSION VALIDATION (Post-Call Flow) ---
// Goal: Seamless transition from Call to Validation with identical design.

export function MissionValidationPreview() {
  const [step, setStep] = useState<'initial' | 'called' | 'validated'>('initial');
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [isPhoneOpen, setIsPhoneOpen] = useState(false);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [isOpportunityOpen, setIsOpportunityOpen] = useState(false);
  const [isMissionOpen, setIsMissionOpen] = useState(false);
  const [rating, setRating] = useState<'fire' | 'good' | 'meh' | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<string | null>(null);
  const [opportunityDetails, setOpportunityDetails] = useState("");
  const [interlocutorGoal, setInterlocutorGoal] = useState<string | null>("Trouver un associé technique"); // Simulating user has a goal
  // const [interlocutorGoal, setInterlocutorGoal] = useState<string | null>(null); // Simulating user has NO goal
  const [selectedMission, setSelectedMission] = useState<string | null>(null);
  const [popupView, setPopupView] = useState<'step1_status' | 'step2_rating' | 'step3_gift'>('step1_status');
  const [callHappened, setCallHappened] = useState<boolean | null>(null);
  const [isWhyVisible, setIsWhyVisible] = useState(false);

  // Simulation of the call action
  const handleCall = () => {
    window.location.href = "tel:0612345678";
    setStep('called');
  };

  const handleValidate = () => {
    setStep('validated');
    setIsValidationOpen(false);
    confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
    toast.success("Mission validée ! +50 pts 🚀");
  };

  return (
    <div className="relative w-full max-w-sm mx-auto h-[600px] rounded-[2.5rem] overflow-hidden shadow-2xl bg-[#0f172a] border border-slate-800">
      {/* Background Image (Identical to Match Card) */}
      <div className="absolute inset-0 z-0">
        <img 
            src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80" 
            alt="Match" 
            className={`w-full h-full object-cover transition-all duration-700 ${step === 'validated' ? 'grayscale opacity-20 blur-sm' : 'opacity-60'}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/80 to-transparent"></div>
      </div>

      {/* FOMO Badge - Top (Identical to Match Card) */}
      {step !== 'validated' && (
          <div className="absolute top-6 left-6 right-6 z-20">
            <div className="bg-red-500/20 backdrop-blur-md text-white px-5 py-3 rounded-2xl flex flex-col items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.2)] text-center gap-1 border border-red-500/30">
                <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider text-red-100 mb-1">
                    <Phone className="w-4 h-4 animate-bounce" />
                    Jean-Paul vous appelle
                </div>
                <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-lg border border-white/10">
                     <Clock className="w-3 h-3 text-red-200" />
                     <span className="font-mono font-bold text-sm text-white">09h - 11h</span>
                </div>
            </div>
          </div>
      )}

      {/* Main Content - Bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6 pt-24 bg-gradient-to-t from-[#0f172a] via-[#0f172a] to-transparent flex flex-col justify-end h-full">
        
        {step === 'validated' ? (
             // --- STATE 3: VALIDATED ---
             <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-6 text-center border border-white/10 mb-auto mt-auto"
            >
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-2xl font-black text-white mb-1">MISSION ACCOMPLIE</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">PROCHAIN MATCH DANS</p>
                <div className="text-5xl font-mono font-black text-white tracking-widest bg-black/30 rounded-xl py-4 border border-white/10">
                    14:23:05
                </div>
            </motion.div>
        ) : (
            <>
                {/* Match Score & Info (Identical to Match Card) */}
                <div className="flex items-end gap-3 mb-2">
                    <h2 className="text-5xl font-black text-white tracking-tighter">Jean-Paul</h2>
                    <Button variant="outline" className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30 hover:text-emerald-300 px-3 py-1 rounded-lg text-xs font-black mb-1.5 flex items-center gap-1 h-auto transition-colors">
                        <User className="w-3 h-3" /> Voir profil
                    </Button>
                </div>

                <p className="text-slate-300 text-sm font-medium mb-4 line-clamp-2 leading-snug opacity-90">
                    "Ce directeur commercial peut vous ouvrir des opportunités auxquelles vous n’aviez pas accès hier."
                </p>

                {/* Mission Selector (My Goal + His Goal) */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {/* 1. My Goal */}
                    <div className="bg-indigo-500/20 border border-indigo-500/30 rounded-xl p-3 backdrop-blur-sm cursor-pointer hover:bg-indigo-500/30 transition-colors" onClick={() => setIsMissionOpen(true)}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <Target className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-[9px] font-black text-indigo-300 uppercase tracking-wider">Mon Objectif</span>
                        </div>
                        <p className="text-white text-[11px] font-medium leading-tight line-clamp-2">
                            {selectedMission 
                                ? MISSION_TYPES.find(m => m.id === selectedMission)?.label 
                                : "Définir mon objectif 🎯"}
                        </p>
                    </div>

                    {/* 2. His Goal */}
                    <div className={cn(
                        "rounded-xl p-3 backdrop-blur-sm border",
                        interlocutorGoal 
                            ? "bg-purple-500/20 border-purple-500/30" 
                            : "bg-orange-500/10 border-orange-500/20 border-dashed"
                    )}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <Users className={cn("w-3.5 h-3.5", interlocutorGoal ? "text-purple-400" : "text-orange-400")} />
                            <span className={cn("text-[9px] font-black uppercase tracking-wider", interlocutorGoal ? "text-purple-300" : "text-orange-300")}>
                                Son Objectif
                            </span>
                        </div>
                        <p className={cn("text-[11px] font-medium leading-tight line-clamp-2", interlocutorGoal ? "text-white" : "text-orange-200/70 italic")}>
                            {interlocutorGoal || "N'a pas encore défini son objectif..."}
                        </p>
                    </div>
                </div>

                {/* Action Buttons (Dock Style) */}
                <div className="flex justify-center items-center gap-4 pb-4">
                    
                    {/* Secondary Actions (Why, Gift, Rate) - ONLY VISIBLE IN INITIAL STEP */}
                    {step === 'initial' && (
                        <div className="flex gap-2">
                            <Dialog open={isWhyVisible} onOpenChange={setIsWhyVisible}>
                                <DialogTrigger asChild>
                                    <Button size="icon" className="h-14 w-14 rounded-full bg-slate-800/80 backdrop-blur-md border border-white/10 text-yellow-400 hover:scale-110 transition-transform">
                                        <MessageSquare className="h-6 w-6 fill-current" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-[#0f172a] border-white/10 text-white sm:max-w-md rounded-2xl w-[90vw] p-0 overflow-hidden">
                                    <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-6">
                                        <DialogHeader>
                                            <DialogTitle className="flex items-center gap-2 text-xl font-black">
                                                <Zap className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                                                Pourquoi ce match ?
                                            </DialogTitle>
                                            <DialogDescription className="text-slate-300">
                                                Voici pourquoi l'algorithme vous a réunis aujourd'hui.
                                            </DialogDescription>
                                        </DialogHeader>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                            <h4 className="text-sm font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                                                <Target className="h-4 w-4 text-blue-400" /> Synergie Détectée
                                            </h4>
                                            <p className="text-slate-200 leading-relaxed text-sm">
                                                "L'algorithme a détecté une complémentarité rare : votre expertise en <span className="text-white font-bold">stratégie commerciale</span> est exactement ce dont Jean-Paul a besoin pour structurer sa croissance. En retour, son réseau influent dans la Tech peut vous ouvrir les portes des grands comptes que vous ciblez."
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            <h4 className="text-sm font-bold text-slate-400 uppercase flex items-center gap-2">
                                                <TrendingUp className="h-4 w-4 text-emerald-400" /> Potentiel Immédiat
                                            </h4>
                                            <ul className="space-y-2">
                                                <li className="flex items-center gap-3 text-sm text-slate-300">
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                    <span>Opportunité de co-création (Podcast/Live)</span>
                                                </li>
                                                <li className="flex items-center gap-3 text-sm text-slate-300">
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                    <span>Partage de réseau local (Bordeaux)</span>
                                                </li>
                                            </ul>
                                        </div>

                                        <Button className="w-full bg-slate-800 hover:bg-slate-700 font-bold h-12 rounded-xl" onClick={() => setIsWhyVisible(false)}>
                                            Compris, je l'appelle ! 📞
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}

                    {/* MAIN BUTTON - TRANSFORMS */}
                    {step === 'initial' ? (
                        <div className="relative group cursor-pointer" onClick={handleCall}>
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-blue-600 rounded-full blur opacity-40 group-hover:opacity-70 transition-opacity animate-pulse"></div>
                            <Button size="icon" className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 text-white hover:scale-105 transition-all shadow-xl border-4 border-[#0f172a] relative z-10">
                                <PhoneCall className="h-8 w-8 fill-current" />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <Dialog open={isValidationOpen} onOpenChange={(open) => {
                                setIsValidationOpen(open);
                                if (!open) {
                                    setPopupView('step1_status'); // Reset view on close
                                    setCallHappened(null);
                                    setRating(null);
                                    setSelectedOpportunity(null);
                                    setOpportunityDetails("");
                                }
                            }}>
                                <DialogTrigger asChild>
                                    <div className="relative group cursor-pointer w-full">
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-2xl blur opacity-40 group-hover:opacity-70 transition-opacity animate-pulse"></div>
                                        <Button className="h-20 px-8 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:scale-105 transition-all shadow-xl border-4 border-[#0f172a] relative z-10 flex flex-col items-center justify-center gap-1">
                                            <CheckCircle2 className="h-6 w-6" />
                                            <span className="text-xs font-black uppercase tracking-wider">Terminer la mission</span>
                                        </Button>
                                    </div>
                                </DialogTrigger>
                                <DialogContent className="bg-[#0f172a] border-white/10 text-white sm:max-w-md rounded-2xl w-[95vw] min-h-[400px] flex flex-col justify-center transition-all duration-300">
                                    
                                    {/* PROGRESS INDICATOR */}
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
                                        <motion.div 
                                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                            initial={{ width: "0%" }}
                                            animate={{ 
                                                width: popupView === 'step1_status' ? "33%" : popupView === 'step2_rating' ? "66%" : "100%" 
                                            }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    </div>

                                    {/* HEADER */}
                                    <DialogHeader className="mb-6 mt-4">
                                        <DialogTitle className="text-center text-3xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                            {popupView === 'step1_status' ? "Bilan de la mission" : popupView === 'step2_rating' ? "Notez l'échange" : "Offrir une opportunité"}
                                        </DialogTitle>
                                    </DialogHeader>
                                    
                                    {/* VIEW 1: STATUS CALL */}
                                    {popupView === 'step1_status' && (
                                        <div className="flex flex-col gap-6 p-2">
                                            
                                            {/* Question */}
                                            <div className="bg-white/5 p-6 rounded-2xl border border-white/5 text-center space-y-6">
                                                <Label className="text-slate-400 uppercase text-xs font-bold tracking-wider block">L'appel a-t-il eu lieu ?</Label>
                                                
                                                <div className="grid grid-cols-2 gap-4">
                                                    <Button 
                                                        onClick={() => {
                                                            setCallHappened(true);
                                                            setPopupView('step2_rating'); // AUTO NEXT
                                                        }} 
                                                        variant="outline"
                                                        className="h-24 flex flex-col gap-2 font-bold border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:scale-105 transition-all"
                                                    >
                                                        <PhoneCall className="w-8 h-8" />
                                                        <span className="text-lg">OUI ✅</span>
                                                    </Button>
                                                    <Button 
                                                        onClick={() => setCallHappened(false)} 
                                                        variant="outline"
                                                        className={cn(
                                                            "h-24 flex flex-col gap-2 font-bold border-red-500/30 transition-all",
                                                            callHappened === false ? "bg-red-500 text-white hover:bg-red-600" : "bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:scale-105"
                                                        )}
                                                    >
                                                        <Phone className="w-8 h-8 rotate-135" />
                                                        <span className="text-lg">NON ❌</span>
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* If NO -> Validate Absence Directly */}
                                            {callHappened === false && (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                                    <Button onClick={handleValidate} className="w-full h-14 text-lg font-black bg-white text-black hover:bg-slate-200 rounded-xl shadow-lg">
                                                        VALIDER L'ABSENCE
                                                    </Button>
                                                </motion.div>
                                            )}
                                        </div>
                                    )}

                                    {/* VIEW 2: RATE (Auto Next) */}
                                    {popupView === 'step2_rating' && (
                                        <div className="space-y-6 p-4">
                                            <div className="flex justify-between gap-3">
                                                <button 
                                                    onClick={() => { setRating('fire'); setPopupView('step3_gift'); }}
                                                    className="flex-1 aspect-square rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20 hover:scale-105 group"
                                                >
                                                    <span className="text-4xl group-hover:scale-125 transition-transform">🔥</span>
                                                    <span className="text-xs uppercase font-black text-orange-300">Top</span>
                                                </button>
                                                <button 
                                                    onClick={() => { setRating('good'); setPopupView('step3_gift'); }}
                                                    className="flex-1 aspect-square rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 hover:scale-105 group"
                                                >
                                                    <span className="text-4xl group-hover:scale-125 transition-transform">👍</span>
                                                    <span className="text-xs uppercase font-black text-blue-300">Bien</span>
                                                </button>
                                                <button 
                                                    onClick={() => { setRating('meh'); setPopupView('step3_gift'); }}
                                                    className="flex-1 aspect-square rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all bg-slate-500/10 border-slate-500/30 hover:bg-slate-500/20 hover:scale-105 group"
                                                >
                                                    <span className="text-4xl group-hover:scale-125 transition-transform">😐</span>
                                                    <span className="text-xs uppercase font-black text-slate-300">Bof</span>
                                                </button>
                                            </div>
                                            <Button variant="ghost" onClick={() => setPopupView('step1_status')} className="w-full text-slate-500">Retour</Button>
                                        </div>
                                    )}

                                    {/* VIEW 3: GIFT & MESSAGE */}
                                    {popupView === 'step3_gift' && (
                                        <div className="space-y-4 p-2">
                                            {/* Gift Selector */}
                                            {!selectedOpportunity ? (
                                                <div className="grid grid-cols-2 gap-2 max-h-[40vh] overflow-y-auto pr-1">
                                                    {OPPORTUNITY_TYPES.map(type => (
                                                        <button
                                                            key={type.id}
                                                            onClick={() => setSelectedOpportunity(type.id)}
                                                            className="px-3 py-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-2 transition-all text-center bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-purple-500/50 hover:text-purple-300 hover:scale-[1.02]"
                                                        >
                                                            <div className={cn("p-2 rounded-full bg-white/5", type.color)}>
                                                                <type.icon className="w-4 h-4" />
                                                            </div>
                                                            {type.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <motion.div 
                                                        initial={{ scale: 0.9, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        className="flex items-center justify-between bg-purple-500/10 p-3 rounded-xl border border-purple-500/30"
                                                    >
                                                        <span className="text-sm font-bold text-purple-300 flex items-center gap-2">
                                                            <Gift className="w-4 h-4" /> {OPPORTUNITY_TYPES.find(t => t.id === selectedOpportunity)?.label}
                                                        </span>
                                                        <button onClick={() => setSelectedOpportunity(null)} className="text-xs text-slate-400 underline hover:text-white">Changer</button>
                                                    </motion.div>
                                                    
                                                    <div className="space-y-2">
                                                        <Label className="text-xs text-slate-400 uppercase font-bold ml-1">Message (Optionnel)</Label>
                                                        <textarea 
                                                            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-white min-h-[80px] focus:ring-1 focus:ring-purple-500 outline-none resize-none placeholder:text-slate-600"
                                                            placeholder="Ex: Je te mets en relation avec..."
                                                            value={opportunityDetails}
                                                            onChange={(e) => setOpportunityDetails(e.target.value)}
                                                        />
                                                    </div>

                                                    <Button onClick={handleValidate} className="w-full h-14 text-lg font-black bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-900/20 transform transition-all hover:scale-[1.02]">
                                                        VALIDER & ENVOYER 🚀
                                                    </Button>
                                                </div>
                                            )}
                                            
                                            {!selectedOpportunity && (
                                                 <Button variant="ghost" onClick={() => setPopupView('step2_rating')} className="w-full text-slate-500">Retour</Button>
                                            )}
                                        </div>
                                    )}

                                </DialogContent>
                            </Dialog>
                            
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 h-auto py-1"
                                onClick={() => {
                                    setIsPhoneOpen(true);
                                }}
                            >
                                <Phone className="w-3 h-3" />
                                Revoir le numéro
                            </Button>
                        </div>
                    )}

                    {/* Secondary Action: Rate - ONLY VISIBLE IN INITIAL STEP */}
                    {step === 'initial' && (
                        <div className="flex gap-2">
                            {/* <Button size="icon" className="h-14 w-14 rounded-full bg-slate-800/80 backdrop-blur-md border border-white/10 text-orange-400 hover:scale-110 transition-transform">
                                <Star className="h-6 w-6 fill-current" />
                            </Button> */}
                        </div>
                    )}

                </div>
            </>
        )}

        <Dialog open={isPhoneOpen} onOpenChange={setIsPhoneOpen}>
            <DialogContent className="bg-[#0f172a] border-white/10 text-white sm:max-w-md rounded-2xl">
                <div className="flex flex-col items-center gap-6 py-8">
                    <div className="h-20 w-20 rounded-full bg-emerald-500/20 flex items-center justify-center animate-pulse">
                        <Phone className="h-10 w-10 text-emerald-400" />
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className="text-2xl font-black">C'est parti ! 🚀</h3>
                        <p className="text-slate-400">Appelez Jean-Paul maintenant.</p>
                    </div>
                    <div className="text-3xl font-black tracking-widest text-white bg-slate-900 px-6 py-4 rounded-xl border border-white/10 shadow-inner select-all">
                        06 12 34 56 78
                    </div>
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold h-12 rounded-xl" onClick={() => setIsPhoneOpen(false)}>Fermer</Button>
                </div>
            </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// --- 4. FOUNDER CARD (Joker / VIP) ---
import { Crown, Star as StarIcon } from "lucide-react";

export function PremiumLockedCardPreview() {
  return (
    <div className="relative w-full max-w-sm mx-auto min-h-[600px] h-auto rounded-[2.5rem] overflow-hidden shadow-2xl bg-[#020617] flex flex-col items-center text-center p-6 border border-white/10 pb-8 group">
      
      {/* Background Image with HEAVY Blur */}
      <div className="absolute inset-0 z-0">
        <img 
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80" 
            alt="Match Flouté" 
            className="w-full h-full object-cover opacity-40 blur-[20px] scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/80 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full h-full justify-between">
        
        <div className="flex flex-col items-center w-full">
            {/* Header Badge */}
            <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 px-3 py-1 mb-8 flex items-center gap-2 shadow-[0_0_15px_rgba(234,179,8,0.2)] animate-pulse">
                <Sparkles className="w-3 h-3" /> MATCH PREMIUM DÉTECTÉ
            </Badge>

            {/* Blurred Identity */}
            <div className="relative mb-6">
                <div className="w-28 h-28 rounded-full border-4 border-white/5 flex items-center justify-center bg-white/5 backdrop-blur-md relative z-10 overflow-hidden shadow-2xl">
                    <img 
                        src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80" 
                        className="w-full h-full object-cover blur-[15px] opacity-80"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Lock className="w-10 h-10 text-white drop-shadow-md" />
                    </div>
                </div>
            </div>

            {/* Teasing Info */}
            <div className="w-full space-y-4 mb-6 text-center">
                <h3 className="text-2xl font-black text-white leading-tight">
                    <span className="blur-[6px]">Sarah Martin</span>
                </h3>
                <div className="flex justify-center gap-2">
                    <Badge variant="secondary" className="bg-slate-800 text-slate-300 border-slate-700">Architecte</Badge>
                </div>
                
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 backdrop-blur-sm mt-4">
                    <p className="text-slate-300 text-sm font-medium leading-relaxed">
                        "Je cherche à étendre mon réseau, j'ai déjà un bon réseau moi-même donc je peux aider aussi et échanger des bons plans..."
                    </p>
                </div>
            </div>
        </div>

        {/* CTA Section */}
        <div className="w-full space-y-3">
            
            <Button className="w-full h-14 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-black font-black text-base rounded-2xl shadow-[0_0_30px_rgba(234,179,8,0.3)] border-2 border-white/20 transition-all hover:scale-[1.02]">
                DÉBLOQUER CE MATCH 🔓
            </Button>
            
        </div>

      </div>
    </div>
  );
}

// --- 5. FOUNDER CARD (Joker / VIP) ---
export function FounderCardPreview({ type = "onboarding", onConfirm }: { type?: "onboarding" | "rescue", onConfirm?: () => void }) {
  const isRescue = type === "rescue";
  
  const title = isRescue ? "Opportunité Premium 💎" : "Session Stratégique";
  const subtitle = isRescue ? "OFFERTE (VALEUR 150€)" : "OFFERTE";
  const pitch = isRescue 
    ? "L'algorithme n'a pas trouvé de match parfait pour toi aujourd'hui. Pas question de perdre une journée ! Je t'appelle pour t'aider personnellement."
    : "On ne se connaît pas encore très bien. Aujourd'hui, je prends le relais de l'algorithme. Je t'appelle dans la journée pour faire le point sur tes attentes et t'aider avec mon propre réseau.";

  return (
    <div className="relative w-full max-w-sm mx-auto min-h-[600px] h-auto rounded-[2.5rem] overflow-hidden shadow-2xl bg-[#0f0f12] border border-amber-500/20 flex flex-col items-center justify-between text-center p-6 pb-8 group">
      
      {/* Premium Background with Sparkles */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-900/10 via-[#0a0a0c] to-[#0a0a0c] z-0"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 z-0"></div>
      
      {/* Moving Particles / Fireflies */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-amber-400 rounded-full blur-[1px]"
          initial={{ 
            x: Math.random() * 300, 
            y: Math.random() * 600, 
            opacity: 0 
          }}
          animate={{ 
            y: [null, Math.random() * -100],
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0]
          }}
          transition={{ 
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Animated Glow */}
      <motion.div 
        animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute top-0 left-0 right-0 h-40 bg-amber-500/30 blur-[80px] rounded-full z-0"
      />

      {/* Content */}
      <div className="relative z-10 w-full flex flex-col items-center h-full">
        
        {/* VIP Badge */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="relative mb-8"
        >
          <div className="absolute inset-0 bg-amber-500 blur-md opacity-40 animate-pulse"></div>
          <Badge className="relative bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-500 text-black border-none px-4 py-1.5 flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.4)] font-black uppercase tracking-widest bg-[length:200%_100%] animate-shimmer">
              <Crown className="w-4 h-4 fill-black animate-bounce-subtle" /> {isRescue ? "JOKER SAUVETAGE" : "JOKER FONDATEUR"}
          </Badge>
        </motion.div>

        {/* Founder Avatar with Rotating Rings */}
        <div className="relative mb-6">
            {/* Outer Ring - Slow Rotation */}
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-4 rounded-full border border-amber-500/20 border-dashed"
            />
            {/* Middle Ring - Reverse Rotation */}
            <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-2 rounded-full border border-orange-500/30 border-dotted"
            />
            
            {/* Glow behind avatar */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-300 to-orange-600 rounded-full blur-md opacity-60 animate-pulse-slow"></div>
            
            <div className="w-32 h-32 rounded-full p-[3px] bg-gradient-to-r from-amber-300 via-yellow-300 to-orange-600 shadow-2xl relative z-10">
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-[#0f0f12]">
                    <img 
                        src="/jeanphilipperoth.jpg" 
                        alt="Jean-Philippe" 
                        className="w-full h-full object-cover transform transition-transform hover:scale-110 duration-700"
                    />
                </div>
            </div>
            
            {/* Status Indicator with Ping */}
            <div className="absolute bottom-1 right-1 w-8 h-8 bg-[#0f0f12] rounded-full flex items-center justify-center z-20">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping"></span>
                <div className="relative w-5 h-5 bg-green-500 rounded-full border-2 border-[#0f0f12]"></div>
            </div>
        </div>

        {/* Name & Role */}
        <div className="mb-8">
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 mb-1">Jean-Philippe</h2>
            <p className="text-amber-400 font-bold uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-2">
                <StarIcon className="w-3 h-3 fill-current" /> Fondateur Popey <StarIcon className="w-3 h-3 fill-current" />
            </p>
        </div>

        {/* The Pitch with Glassmorphism */}
        <motion.div 
            whileHover={{ y: -2 }}
            className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-left relative overflow-hidden mb-6 shadow-xl group-hover:shadow-amber-900/20 transition-all"
        >
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-300 to-orange-600 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
            <QuoteIcon className="absolute top-4 right-4 w-8 h-8 text-white/10 rotate-180" />
            
            <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                {title} <span className="text-amber-400">{subtitle}</span>
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed font-medium">
                "{pitch}"
            </p>
        </motion.div>

        {/* Action Button - Pulsing */}
        <div className="w-full relative group">
            <Dialog onOpenChange={(open) => {
                if (open) {
                    onConfirm?.();
                }
            }}>
                <DialogTrigger asChild>
                    <div className="w-full relative group cursor-pointer">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 to-orange-600 rounded-2xl blur opacity-30 group-hover:opacity-75 transition duration-200 animate-pulse"></div>
                        <Button className="relative w-full h-14 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black font-black text-base rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.3)] border-2 border-white/20 transition-all transform group-hover:scale-[1.01]">
                            Clique si tu es OK 👍
                        </Button>
                    </div>
                </DialogTrigger>
                <DialogContent className="bg-[#0f0f12] border-amber-500/20 text-white sm:max-w-md rounded-3xl p-0 overflow-hidden">
                    <div className="relative h-32 bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center overflow-hidden">
                         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                         <div className="z-10 text-center">
                             <div className="mx-auto w-16 h-16 rounded-full border-4 border-[#0f0f12] overflow-hidden shadow-xl mb-2">
                                 <img src="/jeanphilipperoth.jpg" alt="JP" className="w-full h-full object-cover" />
                             </div>
                         </div>
                    </div>
                    
                    <div className="p-8 text-center space-y-6">
                        <div>
                            <h3 className="text-2xl font-black text-white mb-2">C'est noté ! 📞</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Jean-Philippe a été notifié.
                            </p>
                        </div>

                        <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5 text-left space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                    <Phone className="h-5 w-5 text-green-400" />
                                </div>
                                <div className="text-sm">
                                    <p className="text-white font-bold">Appel entrant</p>
                                    <p className="text-slate-500 text-xs">Probablement d'un 06 ou WhatsApp</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                                    <MessageSquare className="h-5 w-5 text-blue-400" />
                                </div>
                                <div className="text-sm">
                                    <p className="text-white font-bold">Si indisponible</p>
                                    <p className="text-slate-500 text-xs">Je te laisserai un vocal WhatsApp</p>
                                </div>
                            </div>
                        </div>

                        <Button 
                            onClick={() => {
                                confetti({ particleCount: 150, spread: 70, origin: { y: 0.7 }, colors: ['#f59e0b', '#ef4444', '#ffffff'] });
                            }}
                            className="w-full h-14 bg-white text-black font-black text-lg rounded-2xl hover:scale-[1.02] transition-transform shadow-xl"
                        >
                            Compris, à tout de suite ! 🚀
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
        
        <p className="mt-4 text-[10px] text-slate-500 uppercase tracking-wider font-medium flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> Créneau réservé automatiquement
        </p>

      </div>
    </div>
  );
}

function QuoteIcon(props: any) {
    return (
        <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        >
        <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
        <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
        </svg>
    )
}