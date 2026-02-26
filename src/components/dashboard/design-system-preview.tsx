"use client";

import { motion } from "framer-motion";
import { User, Zap, Lock, Phone, Clock, Sparkles, Fingerprint, Search, Flame, Briefcase, Handshake, TrendingUp, Target, CheckCircle2, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

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
    <div className="relative w-full max-w-sm mx-auto h-[600px] rounded-[2.5rem] overflow-hidden shadow-2xl bg-[#020617] flex flex-col items-center text-center p-6 cursor-pointer group border border-white/10">
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

            {/* 1. IMPACT SCORE */}
            <div className="w-full space-y-3 mb-6">
                <div className="flex justify-between items-center px-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">IMPACT POTENTIEL</span>
                    <div className="flex gap-1.5">
                        {[1,2,3,4,5].map(i => (
                            <div key={i} className={`h-1.5 w-5 rounded-full ${i <= 4 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-800'}`} />
                        ))}
                    </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[#0f172a] rounded-xl p-3 flex flex-col items-center justify-center border border-white/5 shadow-lg">
                        <Flame className="w-5 h-5 text-orange-500 mb-1.5" />
                        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">BUSINESS</span>
                        <span className="text-xs font-black text-white">ÉLEVÉ</span>
                    </div>
                    <div className="bg-[#0f172a] rounded-xl p-3 flex flex-col items-center justify-center border border-white/5 shadow-lg">
                        <Users className="w-5 h-5 text-blue-500 mb-1.5" />
                        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">CE MOIS-CI</span>
                        <span className="text-xs font-black text-white">12 Collabs</span>
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
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-black text-white uppercase tracking-wider">CE QU'IL PEUT VOUS APPORTER</span>
            </div>
            <ul className="space-y-3">
                <li className="flex items-center gap-3 text-xs text-slate-300 font-medium">
                    <div className="bg-emerald-500/20 p-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    2 à 5 clients potentiels / mois
                </li>
                <li className="flex items-center gap-3 text-xs text-slate-300 font-medium">
                    <div className="bg-emerald-500/20 p-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    Partenariats locaux stratégiques
                </li>
                <li className="flex items-center gap-3 text-xs text-slate-300 font-medium">
                    <div className="bg-emerald-500/20 p-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    Recommandations croisées
                </li>
            </ul>
        </div>

        <Button className="w-full h-14 bg-white text-black font-black text-base rounded-2xl hover:scale-[1.02] transition-transform shadow-[0_0_30px_rgba(255,255,255,0.15)] animate-bounce-subtle border-2 border-white/50">
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
    <div className="relative w-full max-w-sm mx-auto h-[600px] rounded-[2.5rem] overflow-hidden shadow-2xl bg-[#020617] flex flex-col items-center text-center p-6 border border-white/10">
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
                            <div key={i} className={`h-1.5 w-5 rounded-full ${i <= 4 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-900'}`} />
                        ))}
                    </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[#0f172a] rounded-xl p-3 flex flex-col items-center justify-center border border-white/5 shadow-lg">
                        <Flame className="w-5 h-5 text-orange-500 mb-1.5" />
                        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">BUSINESS</span>
                        <span className="text-xs font-black text-white">ÉLEVÉ</span>
                    </div>
                    <div className="bg-[#0f172a] rounded-xl p-3 flex flex-col items-center justify-center border border-white/5 shadow-lg">
                        <Users className="w-5 h-5 text-blue-500 mb-1.5" />
                        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">CE MOIS-CI</span>
                        <span className="text-xs font-black text-white">12 Collabs</span>
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
import { MessageSquare, Gift, PhoneCall } from "lucide-react";

export function MatchCardPreview() {
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

        {/* 3. MICRO-MISSION (Added per user request) */}
        <div className="bg-indigo-500/20 border border-indigo-500/30 rounded-xl p-3 mb-6 backdrop-blur-sm cursor-pointer hover:bg-indigo-500/30 transition-colors">
            <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-indigo-400" />
                <span className="text-[10px] font-black text-indigo-300 uppercase tracking-wider">Mission du jour</span>
            </div>
            <p className="text-white text-xs font-medium italic truncate">
                Cliquez pour voir votre mission secrète 🕵️‍♂️
            </p>
        </div>

        {/* Action Buttons (Dock Style) */}
        <div className="flex justify-center items-center gap-4 pb-4">
            
            {/* 1. Message / Script */}
            <Button size="icon" className="h-14 w-14 rounded-full bg-slate-800/80 backdrop-blur-md border border-white/10 text-yellow-400 hover:bg-slate-700 hover:scale-110 transition-all shadow-lg">
                <MessageSquare className="h-6 w-6 fill-current" />
            </Button>

            {/* 2. CALL (Main Action) */}
            <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-blue-600 rounded-full blur opacity-40 group-hover:opacity-70 transition-opacity animate-pulse"></div>
                <Button size="icon" className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 text-white hover:scale-105 transition-all shadow-xl border-4 border-[#0f172a] relative z-10">
                    <PhoneCall className="h-8 w-8 fill-current" />
                </Button>
            </div>

            {/* 3. Gift */}
            <Button size="icon" className="h-14 w-14 rounded-full bg-slate-800/80 backdrop-blur-md border border-white/10 text-purple-400 hover:bg-slate-700 hover:scale-110 transition-all shadow-lg">
                <Gift className="h-6 w-6" />
            </Button>

            {/* 4. Rate */}
            <Button size="icon" className="h-14 w-14 rounded-full bg-slate-800/80 backdrop-blur-md border border-white/10 text-orange-400 hover:bg-slate-700 hover:scale-110 transition-all shadow-lg">
                <Star className="h-6 w-6 fill-current" />
            </Button>

        </div>
      </div>
    </div>
  );
}
