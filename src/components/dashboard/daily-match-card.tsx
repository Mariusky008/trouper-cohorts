"use client";

import { motion } from "framer-motion";
import { Clock, Star, Phone, MessageSquare, User, Zap, Trophy, Handshake, Gift, PhoneCall, Copy, Target, Search, Fingerprint, Briefcase, CheckCircle2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createOpportunity } from "@/lib/actions/network-opportunities";
import { saveMatchFeedback } from "@/lib/actions/network-feedback";
import { incrementUserPoints } from "@/lib/actions/gamification";
import { trackEvent } from "@/lib/actions/analytics";

import { OPPORTUNITY_TYPES } from "@/constants/opportunities";

interface DailyMatchCardProps {
  matches: any[];
  userStreak?: number;
  userId?: string;
}

const GOAL_LABELS: Record<string, string> = {
    clients: "Trouver des clients",
    partners: "Partenariats",
    social_media: "Réseaux sociaux",
    local_network: "Réseau local",
    mentorship: "Mentorat",
    recruitment: "Recrutement",
    investors: "Investisseurs",
    suppliers: "Fournisseurs",
    visibility: "Visibilité",
    training: "Formation"
};

// --- 1. WAITING CARD COMPONENT ---
function WaitingCard({ countdown }: { countdown: string }) {
  return (
    <div className="relative w-full max-w-sm mx-auto h-[600px] rounded-[2.5rem] overflow-hidden shadow-2xl bg-[#0a0f1c] flex flex-col items-center justify-center text-center p-6 border border-white/10 group">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-[#0a0f1c] to-[#0a0f1c] animate-pulse-slow"></div>
      
      {/* Pulsing Radar Effect */}
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

        {/* Social Proof */}
        <div className="flex justify-center gap-4 text-[10px] font-bold text-slate-400 bg-white/5 py-2 px-4 rounded-full border border-white/5">
            <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>127 collaborations créées ce mois-ci</span>
            </div>
            <div className="flex items-center gap-1.5">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <span>4.8/5 satisfaction</span>
            </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 w-full">
           <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-slate-400">Prochain match dans</span>
              <span className="text-indigo-400 font-bold font-mono">{countdown}</span>
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

// --- 2. MYSTERY CARD COMPONENT ---
function MysteryCard({ onReveal, match }: { onReveal: () => void, match: any }) {
  // Generate stable "fake" stats based on partner ID to keep it consistent for the same user
  const seed = match.partnerId ? match.partnerId.split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0) : 0;
  
  const potential = ["ÉLEVÉ", "TRÈS ÉLEVÉ", "EXPLOSIF"][seed % 3];
  const sectors = (seed % 4) + 2; // 2 to 5
  const opportunities = (seed % 3) + 3; // 3 to 5
  const compatibility = 85 + (seed % 14); // 85% to 98%
  
  // Dynamic benefits based on job/superpower if available, or generic
  const getBenefits = () => {
      const benefits = [
          "Partenariats locaux stratégiques",
          "Recommandations croisées",
          "Accès à un nouveau réseau",
          "Partage d'expérience",
          "Opportunités de co-création",
          "Mentorat mutuel"
      ];
      
      // Add specific ones based on job
      const job = (match.job || "").toLowerCase();
      if (job.includes("commercial") || job.includes("vente")) benefits.unshift("2 à 5 clients potentiels / mois");
      if (job.includes("marketing") || job.includes("com")) benefits.unshift("Stratégies de visibilité");
      if (job.includes("tech") || job.includes("dev")) benefits.unshift("Expertise technique");
      if (job.includes("immo")) benefits.unshift("Opportunités d'investissement");
      
      // Shuffle deterministically
      const shuffled = benefits.sort((a, b) => {
          const valA = a.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
          const valB = b.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
          return (valA % 10) - (valB % 10);
      });
      
      return shuffled.slice(0, 3);
  };

  const benefits = getBenefits();

  return (
    <div 
        onClick={onReveal}
        className="relative w-full max-w-sm mx-auto h-[600px] rounded-[2.5rem] overflow-hidden shadow-2xl bg-black flex flex-col items-center justify-center text-center p-6 cursor-pointer group border border-white/10"
    >
      {/* Animated Gradient Border */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-blue-600 to-purple-600 opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
      <div className="absolute inset-[2px] bg-[#050505] rounded-[2.4rem] z-0"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center h-full justify-between py-8">
        
        {/* Header Badge */}
        <div className="flex items-center gap-3 mb-2 w-full justify-center">
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1 animate-pulse">
                MATCH DÉTECTÉ ⚡️
            </Badge>
            <div className="bg-white/5 px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
                <Users className="w-3 h-3 text-blue-400" />
                <span className="text-[10px] font-bold text-slate-300">Compatibilité réseau : <span className="text-white">{compatibility}%</span></span>
            </div>
        </div>

        {/* Identity Lock (Smaller) */}
        <div className="relative mb-2">
            <motion.div 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-20 h-20 rounded-full border-2 border-white/10 flex items-center justify-center bg-white/5 backdrop-blur-sm relative z-10"
            >
                <Fingerprint className="w-10 h-10 text-white/50" />
                <div className="absolute inset-0 rounded-full border-t-2 border-emerald-500 animate-spin-slow"></div>
            </motion.div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-emerald-500/20 blur-[40px] rounded-full pointer-events-none"></div>
        </div>

        {/* 1. IMPACT SCORE */}
        <div className="w-full space-y-3 mb-4">
            <div className="flex justify-between items-center px-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Impact Potentiel</span>
                <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => (
                        <div key={i} className={`h-1.5 w-4 rounded-full ${i <= 4 ? 'bg-emerald-500' : 'bg-slate-800'}`} />
                    ))}
                </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/5 rounded-xl p-2 flex flex-col items-center justify-center border border-white/5">
                    <Zap className="w-5 h-5 text-orange-500 mb-1" />
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Business</span>
                    <span className="text-xs font-black text-white">{potential}</span>
                </div>
                <div className="bg-white/5 rounded-xl p-2 flex flex-col items-center justify-center border border-white/5">
                    <Briefcase className="w-5 h-5 text-blue-500 mb-1" />
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Secteurs</span>
                    <span className="text-xs font-black text-white">{sectors}</span>
                </div>
                <div className="bg-white/5 rounded-xl p-2 flex flex-col items-center justify-center border border-white/5">
                    <Handshake className="w-5 h-5 text-purple-500 mb-1" />
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Opportunités</span>
                    <span className="text-xs font-black text-white">{opportunities}</span>
                </div>
            </div>
        </div>

        {/* 2. CONCRETE BENEFITS */}
        <div className="w-full bg-slate-900/50 rounded-2xl p-4 text-left border border-white/5 mb-auto">
            <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase">Ce qu'il peut vous apporter</span>
            </div>
            <ul className="space-y-2.5">
                {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs text-slate-300 font-medium">
                        <div className="mt-0.5 shrink-0 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {benefit}
                    </li>
                ))}
            </ul>
        </div>

        <Button className="w-full h-12 bg-white text-black font-black text-base rounded-xl hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)] animate-bounce-subtle mt-4">
            DÉCOUVRIR QUI C'EST 🔓
        </Button>
      </div>
    </div>
  );
}

export function DailyMatchCard({ matches, userStreak = 0, userId }: DailyMatchCardProps) {
  // State
  const [revealed, setRevealed] = useState(false);
  const [callMade, setCallMade] = useState(false);
  
  // Dialog States
  const [isWhyVisible, setIsWhyVisible] = useState(false);
  const [isPhoneOpen, setIsPhoneOpen] = useState(false);
  const [isOpportunityOpen, setIsOpportunityOpen] = useState(false);
  const [isRatingOpen, setIsRatingOpen] = useState(false);

  // Opportunity Logic
  const [oppType, setOppType] = useState<string | undefined>(undefined);
  const [oppDetails, setOppDetails] = useState("");
  const [isSubmittingOpp, setIsSubmittingOpp] = useState(false);

  // Dynamic micro-missions based on seed
  const getMicroMission = () => {
      const currentMatch = matches?.[0];
      if (!currentMatch) return "";

      const seed = currentMatch.partnerId ? currentMatch.partnerId.split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0) : 0;
      const missions = [
          "Identifiez 2 synergies possibles",
          "Trouvez 1 contact en commun",
          "Détectez 1 opportunité de business immédiate",
          "Proposez 1 introduction pertinente",
          "Échangez sur 1 défi commun",
          "Partagez 1 ressource utile"
      ];
      return missions[seed % missions.length];
  };

  const microMission = getMicroMission();

  // Check LocalStorage for Reveal Status
  useEffect(() => {
      if (!userId) return;
      const today = new Date().toISOString().split('T')[0];
      const key = `daily_scan_revealed_${userId}_${today}`;
      
      const isRevealed = localStorage.getItem(key) === 'true';
      if (isRevealed) {
          setRevealed(true);
      }
  }, [userId]);

  const handleReveal = () => {
      setRevealed(true);
      if (userId) {
          const today = new Date().toISOString().split('T')[0];
          const key = `daily_scan_revealed_${userId}_${today}`;
          localStorage.setItem(key, 'true');
      }
      confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
      });
  };

  // Countdown Logic for Waiting State
  const [waitingCountdown, setWaitingCountdown] = useState("00:00:00");
  useEffect(() => {
    if (matches && matches.length > 0) return;

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 1);
    targetDate.setHours(8, 0, 0, 0); // Tomorrow 08:00

    const interval = setInterval(() => {
        const now = new Date();
        const diff = targetDate.getTime() - now.getTime();
        if (diff <= 0) {
            setWaitingCountdown("00:00:00");
            return;
        }
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setWaitingCountdown(
            `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        );
    }, 1000);
    return () => clearInterval(interval);
  }, [matches]);

  // Match Timer Logic (Ephemeral Opportunity)
  const [matchCountdown, setMatchCountdown] = useState("02:00:00");
  useEffect(() => {
     if (!matches || matches.length === 0) return;
     
     const calculateMatchTimer = () => {
         const matchTime = matches[0]?.time || "09h – 11h";
         // Extract start hour (e.g., 9)
         const startHour = parseInt(matchTime.split('h')[0]);
         const now = new Date();
         const target = new Date();
         target.setHours(startHour + 2, 0, 0, 0); // End of slot

         // If slot is tomorrow (very early morning check), add day? 
         // Assuming match is for today.
         
         const diff = target.getTime() - now.getTime();
         
         if (diff <= 0) {
             setMatchCountdown("Terminé");
         } else {
             const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
             const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
             const s = Math.floor((diff % (1000 * 60)) / 1000);
             setMatchCountdown(
                `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
             );
         }
     };
     
     calculateMatchTimer();
     const interval = setInterval(calculateMatchTimer, 1000);
     return () => clearInterval(interval);
  }, [matches]);

  // Actions Handlers
  const handleRate = async (score: number, tag: string, partnerId: string) => {
      setIsRatingOpen(false);
      if (score >= 4) confetti({ particleCount: 100, spread: 70, colors: ['#10b981', '#fbbf24'] });
      toast.success("Feedback enregistré ! 📝", { description: `Vous avez qualifié l'échange de "${tag}"` });
      await saveMatchFeedback(partnerId, score, tag);
  };

  const handleCreateOpportunity = async (partnerId: string, partnerName: string) => {
      if (!oppType || !oppDetails.trim()) {
          toast.error("Veuillez compléter tous les champs");
          return;
      }
      setIsSubmittingOpp(true);
      try {
          const selectedTypeObj = OPPORTUNITY_TYPES.find(t => t.id === oppType);
          const points = selectedTypeObj?.points || 10;
          const result = await createOpportunity({
              receiverId: partnerId,
              type: oppType,
              points: points,
              details: oppDetails
          });
          if (result.success) {
              toast.success(`Opportunité envoyée à ${partnerName} ! 🎁`);
              setOppDetails("");
              setIsOpportunityOpen(false);
              confetti({ particleCount: 150, spread: 60, origin: { y: 0.7 } });
          } else {
              toast.error(result.error || "Erreur lors de l'envoi");
          }
      } catch (e) {
          toast.error("Erreur inattendue");
      } finally {
          setIsSubmittingOpp(false);
      }
  };

  const triggerCallRewards = async () => {
      if (callMade) return;
      setCallMade(true);
      // Confetti logic
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      try {
          await incrementUserPoints(20);
          toast.success("Points ajoutés ! 🏆");
      } catch (error) {
          console.error("Failed to add points", error);
      }
  };

  const handleCopyPhone = (phone: string) => {
      navigator.clipboard.writeText(phone);
      toast.success("Numéro copié ! 📋");
      triggerCallRewards();
      setIsPhoneOpen(false);
  };

  const handleCallAction = () => {
      triggerCallRewards();
      setIsPhoneOpen(false);
  };

  // RENDER LOGIC
  if (!matches || matches.length === 0) {
      return <WaitingCard countdown={waitingCountdown} />;
  }

  const match = matches[0];
  const isCallOut = match.type === 'call_out';

  if (!revealed) {
      return <MysteryCard onReveal={handleReveal} match={match} />;
  }

  // MATCH CARD (REVEALED)
  return (
    <div className="relative w-full max-w-sm mx-auto h-[600px] rounded-[2.5rem] overflow-hidden shadow-2xl bg-[#0f172a] border border-slate-800">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        {match.avatar ? (
            <Image 
                src={match.avatar} 
                alt={match.name} 
                fill 
                className="object-cover opacity-60 transition-transform duration-700 hover:scale-105"
            />
        ) : (
            <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                <User className="h-32 w-32 text-slate-600" />
            </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/60 to-transparent"></div>
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
                {isCallOut 
                    ? `C'est à vous d'appeler`
                    : `${match.name} vous appelle`
                }
            </div>
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-lg border border-white/10">
                 <Clock className="w-3 h-3 text-red-200" />
                 <span className="font-mono font-bold text-sm text-white">{match.time}</span>
            </div>
            <div className="text-[10px] font-bold text-red-200/80 mt-1">
                Fin du créneau dans <span className="font-mono text-xs text-white">{matchCountdown}</span>
            </div>
        </motion.div>
      </div>

      {/* Main Content - Bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6 pt-24 bg-gradient-to-t from-[#0f172a] via-[#0f172a] to-transparent">
        
        {/* Match Score */}
        <div className="flex items-end gap-3 mb-3">
            <h2 className="text-4xl font-black text-white tracking-tighter">{match.name}</h2>
            <Button 
                asChild
                variant="outline" 
                className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30 hover:text-emerald-300 px-3 py-1 rounded-lg text-xs font-black mb-1.5 flex items-center gap-1 h-auto transition-colors"
                onClick={() => trackEvent('click_profile', { partnerId: match.partnerId })}
            >
                <Link href={`/mon-reseau-local/dashboard/profile/${match.partnerId}`}>
                    <User className="w-3 h-3" /> Voir profil
                </Link>
            </Button>
        </div>

        <p className="text-slate-300 text-sm font-medium mb-6 line-clamp-3 leading-snug">
            "Ce {match.job || 'partenaire'} peut vous ouvrir des opportunités auxquelles vous n’aviez pas accès hier. À vous de créer une collaboration."
        </p>

        {/* 3. MICRO-MISSION (Added per user request) */}
        <div className="bg-indigo-500/20 border border-indigo-500/30 rounded-xl p-3 mb-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-indigo-400" />
                <span className="text-[10px] font-black text-indigo-300 uppercase tracking-wider">Mission du jour</span>
            </div>
            <p className="text-indigo-100 text-xs font-medium italic">
                "{microMission} avec {match.name} lors de l'appel."
            </p>
            <p className="text-[9px] text-indigo-300/60 mt-1 font-medium">
                (Cliquez sur <Gift className="w-3 h-3 inline align-text-bottom mx-0.5" /> pour choisir vos collabs)
            </p>
        </div>

        {/* Action Buttons (Dock Style) */}
        <div className="flex justify-center items-center gap-4 pb-4">
            
            {/* 1. Message / Script (Why) */}
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
                        
                        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                            {/* 1. Objectif du moment */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                    <Target className="h-4 w-4" /> Objectif du moment
                                </h4>
                                <p className="text-lg font-bold text-white leading-tight">
                                    {match.current_goals && match.current_goals.length > 0 
                                        ? GOAL_LABELS[match.current_goals[0]] 
                                        : "Développer son activité"}
                                </p>
                            </div>

                            {/* 2. Grand Défi */}
                            {match.big_goal && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                        <Trophy className="h-4 w-4" /> Son Grand Défi
                                    </h4>
                                    <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5 text-sm text-slate-200 italic">
                                        "{match.big_goal}"
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-4 pt-2">
                                {/* 3. Ce qu'il offre */}
                                <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 space-y-2">
                                    <h4 className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-2">
                                        <Gift className="h-4 w-4" /> Ce qu'il peut offrir
                                    </h4>
                                    <p className="text-sm font-medium text-emerald-100">
                                        {match.superpower || "Son expérience et son réseau"}
                                    </p>
                                </div>

                                {/* 4. Ce qu'il cherche */}
                                <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20 space-y-2">
                                    <h4 className="text-xs font-bold text-blue-400 uppercase flex items-center gap-2">
                                        <Search className="h-4 w-4" /> Ce qu'il recherche
                                    </h4>
                                    <p className="text-sm font-medium text-blue-100">
                                        {match.current_need || "Des opportunités de croissance"}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-900 border-t border-white/5">
                            <Button 
                                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold" 
                                onClick={() => {
                                    setIsWhyVisible(false);
                                    trackEvent('click_why_close_ack', { partnerId: match.partnerId });
                                }}
                            >
                                {isCallOut ? "Compris, je l'appelle ! 📞" : "Compris, j'attends son appel ! ⏳"}
                            </Button>
                        </div>
                    </DialogContent>
            </Dialog>

            {/* 2. CALL (Main Action) */}
            <Dialog open={isPhoneOpen} onOpenChange={setIsPhoneOpen}>
                <DialogTrigger asChild>
                    <div className="relative group cursor-pointer" onClick={() => trackEvent('click_call_open', { partnerId: match.partnerId })}>
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-blue-600 rounded-full blur opacity-40 group-hover:opacity-70 transition-opacity animate-pulse"></div>
                        <Button size="icon" className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 text-white hover:scale-105 transition-all shadow-xl border-4 border-[#0f172a] relative z-10">
                            <PhoneCall className="h-8 w-8 fill-current" />
                        </Button>
                    </div>
                </DialogTrigger>
                <DialogContent className="bg-[#0f172a] border-white/10 text-white sm:max-w-md rounded-2xl w-[90vw]">
                        <DialogHeader>
                            <DialogTitle className="flex flex-col items-center gap-4 text-2xl font-black justify-center pt-4">
                                <div className="h-20 w-20 rounded-full bg-emerald-500/20 flex items-center justify-center animate-pulse">
                                    <Phone className="h-10 w-10 text-emerald-400" />
                                </div>
                                <span>C'est parti ! 🚀</span>
                            </DialogTitle>
                            <DialogDescription className="text-center text-slate-400 text-base">
                                {isCallOut ? (
                                    <>
                                        Voici le numéro de <span className="text-white font-bold">{match.name}</span>.
                                        <br/>Appelez-le maintenant pour votre échange de 15 min.
                                    </>
                                ) : (
                                    <>
                                        Vous attendez l'appel de <span className="text-white font-bold">{match.name}</span>.
                                        <br/>Si à {match.time.split('h')[0]}h10 vous n'avez pas de nouvelles, appelez-le !
                                    </>
                                )}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex flex-col items-center gap-6 py-6">
                            <div className="text-3xl sm:text-4xl font-black tracking-widest text-white bg-slate-900 px-6 py-4 rounded-xl border border-white/10 shadow-inner select-all">
                                {match.phone || "Non renseigné"}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 w-full">
                                <Button 
                                    onClick={() => {
                                        handleCopyPhone(match.phone);
                                        trackEvent('click_copy_phone', { partnerId: match.partnerId });
                                    }}
                                    variant="outline"
                                    className="h-14 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white text-lg font-bold gap-2"
                                >
                                    <Copy className="h-5 w-5" />
                                    Copier
                                </Button>
                                
                                <Button 
                                    asChild
                                    className="h-14 bg-emerald-500 hover:bg-emerald-400 text-white text-lg font-bold gap-2 shadow-lg shadow-emerald-500/20"
                                    onClick={() => {
                                        handleCallAction();
                                        trackEvent('click_call_action', { partnerId: match.partnerId });
                                    }}
                                >
                                    <a href={`tel:${match.phone}`}>
                                        <PhoneCall className="h-5 w-5" />
                                        Appeler
                                    </a>
                                </Button>
                            </div>
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
                <DialogContent className="bg-[#0f172a] border-white/10 text-white sm:max-w-md w-[95vw] rounded-2xl overflow-hidden">
                            {!oppType ? (
                                <>
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2 text-xl font-black">
                                            <Gift className="h-6 w-6 text-purple-400" />
                                            Offrir une Opportunité
                                        </DialogTitle>
                                        <DialogDescription className="text-slate-400">
                                            Quelle valeur souhaitez-vous apporter à {match.name} ?
                                        </DialogDescription>
                                    </DialogHeader>
                                    
                                    <div className="grid grid-cols-2 gap-3 py-4 max-h-[60vh] overflow-y-auto">
                                        {OPPORTUNITY_TYPES.map((type) => (
                                            <button
                                                key={type.id}
                                                onClick={() => setOppType(type.id)}
                                                className={`flex flex-col items-center justify-start p-3 rounded-xl border transition-all hover:scale-105 text-center gap-2 group ${type.bg.replace('bg-', 'bg-opacity-10 bg-')} ${type.border.replace('border-', 'border-opacity-20 border-')}`}
                                                style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
                                            >
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center shadow-sm ${type.color} bg-white/10 shrink-0`}>
                                                    <type.icon className="h-5 w-5" />
                                                </div>
                                                <div className="flex flex-col gap-1 w-full">
                                                    <span className="font-bold text-white text-xs leading-tight">{type.label}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium leading-tight px-1 line-clamp-3 opacity-80">{type.description}</span>
                                                    <span className="text-[10px] text-emerald-400 font-bold mt-1">+{type.points} pts</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <DialogHeader>
                                        <div className="flex items-center justify-between">
                                            <Button variant="ghost" size="sm" onClick={() => setOppType(undefined)} className="text-slate-400 -ml-2">
                                                ← Retour
                                            </Button>
                                            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                                                {OPPORTUNITY_TYPES.find(t => t.id === oppType)?.label}
                                            </Badge>
                                        </div>
                                        <DialogTitle className="text-lg font-bold mt-2">
                                            Détails du cadeau 🎁
                                        </DialogTitle>
                                        <DialogDescription className="text-slate-400">
                                            Donnez un maximum d'infos pour que {match.name} puisse saisir cette opportunité.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase text-slate-500">Votre message (Privé)</Label>
                                            <Textarea 
                                                value={oppDetails}
                                                onChange={(e) => setOppDetails(e.target.value)}
                                                placeholder="Ex: J'ai un contact pour toi, appelle Mr Martin au 06... Il attend ton appel de ma part." 
                                                className="bg-slate-900 border-white/10 text-white min-h-[150px] resize-none rounded-xl focus:ring-purple-500/50"
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    <DialogFooter>
                                        <Button 
                                            onClick={() => {
                                                handleCreateOpportunity(match.partnerId, match.name);
                                                trackEvent('click_gift_submit', { partnerId: match.partnerId, type: oppType });
                                            }} 
                                            disabled={isSubmittingOpp || !oppDetails.trim()}
                                            className="w-full bg-purple-600 hover:bg-purple-500 font-bold h-12 rounded-xl shadow-lg shadow-purple-500/20"
                                        >
                                            {isSubmittingOpp ? "Envoi..." : "Envoyer l'opportunité 🚀"}
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
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
                                            <Handshake className="h-6 w-6 text-blue-400" />
                                            Comment s'est passé l'échange ?
                                        </DialogTitle>
                                        <DialogDescription className="text-center text-slate-400 text-xs">
                                            Votre avis nous aide à vous proposer de meilleurs matchs demain.
                                        </DialogDescription>
                                    </DialogHeader>
                                    
                                    <div className="grid grid-cols-3 gap-3 py-6">
                                        <Button 
                                            onClick={() => handleRate(5, "Top 🔥", match.partnerId)} 
                                            className="flex flex-col items-center justify-center h-28 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 hover:text-emerald-300 transition-all hover:scale-105 group rounded-xl"
                                        >
                                            <span className="text-4xl mb-2 group-hover:animate-bounce filter drop-shadow-lg">🔥</span>
                                            <span className="font-black text-lg">TOP !</span>
                                            <span className="text-[9px] uppercase font-bold opacity-70">Super Fit</span>
                                        </Button>
                                        
                                        <Button 
                                            onClick={() => handleRate(4, "Sympa 👍", match.partnerId)} 
                                            className="flex flex-col items-center justify-center h-28 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 hover:border-blue-500 text-blue-400 hover:text-blue-300 transition-all hover:scale-105 group rounded-xl"
                                        >
                                            <span className="text-4xl mb-2 group-hover:animate-pulse filter drop-shadow-lg">👍</span>
                                            <span className="font-black text-lg">SYMPA</span>
                                            <span className="text-[10px] uppercase font-bold opacity-70">Bon Contact</span>
                                        </Button>
                                        
                                        <Button 
                                            onClick={() => handleRate(2, "Moyen 😕", match.partnerId)} 
                                            className="flex flex-col items-center justify-center h-28 bg-slate-500/10 hover:bg-slate-500/20 border border-slate-500/30 hover:border-slate-500 text-slate-400 hover:text-slate-300 transition-all hover:scale-105 group rounded-xl"
                                        >
                                            <span className="text-4xl mb-2 group-hover:rotate-12 filter drop-shadow-lg">😕</span>
                                            <span className="font-black text-lg">BOF</span>
                                            <span className="text-[10px] uppercase font-bold opacity-70">Pas de Fit</span>
                                        </Button>
                                    </div>
                                    
                                    <div className="text-center">
                                        <Button variant="ghost" onClick={() => setIsRatingOpen(false)} className="text-slate-500 hover:text-white text-xs">
                                            Annuler / Je n'ai pas encore appelé
                                        </Button>
                                    </div>
                                </DialogContent>
            </Dialog>

        </div>
      </div>
    </div>
  );
}
