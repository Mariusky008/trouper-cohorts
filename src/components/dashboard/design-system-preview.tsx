"use client";

import { motion } from "framer-motion";
import { User, Zap, Lock, Phone, Clock, Sparkles, Fingerprint, Search } from "lucide-react";
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
    <div className="relative w-full max-w-sm mx-auto h-[600px] rounded-[2.5rem] overflow-hidden shadow-2xl bg-black flex flex-col items-center justify-center text-center p-8 cursor-pointer group">
      {/* Animated Gradient Border */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-blue-600 to-purple-600 opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
      <div className="absolute inset-[2px] bg-[#050505] rounded-[2.4rem] z-0"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center h-full justify-between py-10">
        
        <div className="space-y-2">
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1 animate-pulse">
                MATCH DÉTECTÉ ⚡️
            </Badge>
        </div>

        <div className="relative">
            {/* Fingerprint / Identity Lock */}
            <motion.div 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-32 h-32 rounded-full border-4 border-white/10 flex items-center justify-center bg-white/5 backdrop-blur-sm relative"
            >
                <Fingerprint className="w-16 h-16 text-white/50" />
                <div className="absolute inset-0 rounded-full border-t-4 border-emerald-500 animate-spin-slow"></div>
            </motion.div>
            {/* Glowing background behind icon */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/20 blur-[60px] rounded-full pointer-events-none"></div>
        </div>

        <div className="space-y-4 max-w-[280px]">
            <h2 className="text-3xl font-black text-white leading-none">
                Ce profil est un <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">déclencheur</span>.
            </h2>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">
                Il possède une compétence ou un réseau qui manque cruellement à votre activité aujourd'hui.
            </p>
        </div>

        <Button className="w-full h-14 bg-white text-black font-black text-lg rounded-xl hover:scale-[1.02] transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)] animate-bounce-subtle">
            DÉCOUVRIR QUI C'EST 🔓
        </Button>
      </div>
    </div>
  );
}

// --- 3. MATCH CARD (The Match) ---
// Goal: FOMO, "I can't wait", "Don't miss this".
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
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/60 to-transparent"></div>
      </div>

      {/* FOMO Badge - Top */}
      <div className="absolute top-6 left-6 right-6 z-20">
        <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-red-500 text-white px-4 py-2 rounded-xl flex items-center justify-between shadow-lg shadow-red-900/50"
        >
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                <Clock className="w-4 h-4 animate-pulse" />
                Opportunité Éphémère
            </div>
            <span className="font-mono font-bold text-xs">14:59</span>
        </motion.div>
      </div>

      {/* Main Content - Bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6 pt-24 bg-gradient-to-t from-[#0f172a] via-[#0f172a] to-transparent">
        
        {/* Match Score */}
        <div className="flex items-end gap-3 mb-3">
            <h2 className="text-5xl font-black text-white tracking-tighter">Jean-Paul</h2>
            <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 px-2 py-1 rounded-lg text-xl font-black mb-1.5 flex items-center gap-1">
                98% <Sparkles className="w-4 h-4" />
            </div>
        </div>

        <p className="text-slate-300 text-lg font-medium mb-6 line-clamp-2">
            "Directeur Commercial qui cherche exactement votre type de services."
        </p>

        {/* The "Hook" / FOMO Text */}
        <div className="bg-white/5 border-l-4 border-yellow-500 pl-4 py-2 mb-8">
            <p className="text-yellow-200 text-sm italic font-medium">
                "Jean-Paul a réservé ce créneau spécialement pour vous. Ne le faites pas attendre, c'est rare."
            </p>
        </div>

        {/* Action Button */}
        <div className="grid grid-cols-[1fr_auto] gap-3">
            <Button className="h-16 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black text-lg shadow-lg shadow-blue-900/30 flex flex-col items-center justify-center gap-0.5 group">
                <span className="flex items-center gap-2">
                    APPELER MAINTENANT <Phone className="w-5 h-5 fill-current group-hover:rotate-12 transition-transform" />
                </span>
                <span className="text-[10px] opacity-80 font-medium tracking-wide uppercase">Ça peut tout changer</span>
            </Button>
            
            <Button variant="outline" className="h-16 w-16 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white">
                <Lock className="w-6 h-6" />
            </Button>
        </div>
      </div>
    </div>
  );
}
