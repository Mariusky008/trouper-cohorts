"use client";

import { motion } from "framer-motion";
import { Clock, Star, Phone, MessageSquare, User, Zap, Trophy, Handshake, Gift, PhoneCall, Copy, Target, Search, Fingerprint, Briefcase, CheckCircle2, Users, Lock, Flame, TrendingUp, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createOpportunity } from "@/lib/actions/opportunity-creation";
import { notifyFounderCall } from "@/lib/actions/founder-call";
import { saveMatchFeedback } from "@/lib/actions/network-feedback";
import { incrementUserPoints } from "@/lib/actions/gamification";
import { trackEvent } from "@/lib/actions/analytics";
import { updateMatchMission } from "@/lib/actions/match-mission";
// import { FounderCardPreview } from "@/components/dashboard/design-system-preview";

// --- FOUNDER CARD PREVIEW COMPONENT (INLINED TO AVOID CIRCULAR DEPENDENCY) ---
function FounderCardPreview({ type = "onboarding", onConfirm }: { type?: "onboarding" | "rescue", onConfirm: () => void }) {
    const isRescue = type === "rescue";
    const [confirmed, setConfirmed] = useState(false);

    const handleAction = () => {
        setConfirmed(true);
        onConfirm();
    };

    if (confirmed) {
        return (
            <div className="relative w-full max-w-sm mx-auto h-[600px] rounded-[2.5rem] overflow-hidden shadow-2xl bg-[#0f172a] flex flex-col items-center justify-center text-center p-6 border border-emerald-500/30">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-[#0f172a] to-[#0f172a]"></div>
                <motion.div 
                    initial={{ scale: 0 }} animate={{ scale: 1 }} 
                    className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                >
                    <CheckCircle2 className="w-12 h-12 text-white" />
                </motion.div>
                <h3 className="text-3xl font-black text-white mb-2">Message Envoyé !</h3>
                <p className="text-slate-400 max-w-[250px]">
                    Jean-Philippe a reçu votre demande. <br/>Il vous contactera très vite.
                </p>
            </div>
        );
    }

    return (
        <div className="relative w-full max-w-sm mx-auto min-h-[600px] h-auto rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] bg-gradient-to-b from-[#1e293b] to-[#0f172a] border border-white/10 flex flex-col items-center p-0 group">
            
            {/* Background Image/Effect */}
            <div className="absolute inset-0 opacity-40">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0f172a]/80 to-[#0f172a] z-10"></div>
                <Image 
                    src="/jeanphilipperoth.jpg" 
                    alt="Jean-Philippe Founder" 
                    fill 
                    className="object-cover object-top"
                />
            </div>

            {/* Content Container */}
            <div className="relative z-20 flex flex-col h-full w-full justify-between p-6 pt-48 bg-gradient-to-b from-transparent via-[#0f172a]/90 to-[#0f172a]">
                
                {/* Header Badge */}
                <div className="flex justify-center -mt-12 mb-4">
                    <Badge className={cn(
                        "px-4 py-1.5 text-xs font-bold uppercase tracking-widest shadow-lg border backdrop-blur-md",
                        isRescue 
                            ? "bg-red-500/20 text-red-200 border-red-500/30" 
                            : "bg-indigo-500/20 text-indigo-200 border-indigo-500/30"
                    )}>
                        {isRescue ? "🆘 JOKER DE SECOURS" : "👋 BIENVENUE AU CLUB"}
                    </Badge>
                </div>

                {/* Title & Message */}
                <div className="text-center space-y-4 mb-8">
                    <h2 className="text-3xl font-black text-white leading-none">
                        Jean-Philippe <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 text-xl">Fondateur Popey</span>
                    </h2>
                    
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 text-left relative">
                        <div className="absolute -top-3 -left-2 text-4xl opacity-20">❝</div>
                        <p className="text-slate-200 text-sm font-medium leading-relaxed italic relative z-10">
                            {isRescue 
                                ? "Je vois que l'algo n'a pas trouvé de match parfait pour toi aujourd'hui. Pas de panique, je prends le relais ! Discutons 15 min de ton business."
                                : "Ravi de te compter parmi nous ! Pour bien démarrer, je te propose un échange direct de 15 min pour t'aider à tirer le meilleur du réseau."
                            }
                        </p>
                    </div>
                </div>

                {/* Action Button */}
                <Button 
                    onClick={handleAction}
                    className={cn(
                        "w-full h-14 font-black text-lg rounded-2xl shadow-xl transition-all hover:scale-[1.02] relative overflow-hidden group/btn",
                        isRescue 
                            ? "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white shadow-red-900/20"
                            : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-indigo-900/20"
                    )}
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                    <PhoneCall className="w-5 h-5 mr-2 relative z-10" /> 
                    <span className="relative z-10">ACCEPTER L'APPEL</span>
                </Button>

                <p className="text-[10px] text-slate-500 text-center mt-3 font-medium uppercase tracking-wide">
                    Disponible aujourd'hui • 09h - 18h
                </p>
            </div>
        </div>
    );
}

import { OPPORTUNITY_TYPES } from "@/constants/opportunities";

interface DailyMatchCardProps {
  matches: any[];
  userStreak?: number;
  userId?: string;
  currentUserProfile?: any;
}

const MISSION_TYPES = [
    { 
        id: 'portier', 
        label: 'Le Portier — "Ouvre-moi une porte"', 
        icon: Lock, 
        desc: "Je cible une entreprise ou un décideur précis. Tu regardes ton LinkedIn/Répertoire et me fais une intro directe (Mail ou WhatsApp).", 
        color: 'text-blue-400', 
        bg: 'bg-blue-500/10', 
        border: 'border-blue-500/20' 
    },
    { 
        id: 'amplificateur', 
        label: 'L\'Amplificateur — "Propulse ma visibilité"', 
        icon: TrendingUp, 
        desc: "Je viens de publier un post ou une offre. Soutien mutuel immédiat (Commentaire, partage ou tag de prospects).", 
        color: 'text-purple-400', 
        bg: 'bg-purple-500/10', 
        border: 'border-purple-500/20' 
    },
    { 
        id: 'prescripteur', 
        label: 'Le Prescripteur — "Apporte-moi un deal"', 
        icon: Handshake, 
        desc: "Je cherche un client chaud. On définit mon client idéal et tu identifies un prospect dans ton entourage.", 
        color: 'text-emerald-400', 
        bg: 'bg-emerald-500/10', 
        border: 'border-emerald-500/20' 
    },
    { 
        id: 'recommandeur', 
        label: 'Le Recommandeur — "Bétonne ma crédibilité"', 
        icon: Star, 
        desc: "Je manque de preuve sociale. Échange croisé d'un avis Google ou d'une recommandation LinkedIn détaillée.", 
        color: 'text-yellow-400', 
        bg: 'bg-yellow-500/10', 
        border: 'border-yellow-500/20' 
    },
    { 
        id: 'infiltre', 
        label: 'L\'Infiltré — "Intègre-moi dans ton cercle"', 
        icon: Fingerprint, 
        desc: "Je veux entrer dans des réseaux fermés (BNI, Clubs). Tu m'invites comme 'Guest' ou me parraines.", 
        color: 'text-red-400', 
        bg: 'bg-red-500/10', 
        border: 'border-red-500/20' 
    },
    { 
        id: 'joker', 
        label: 'Le Joker — "L\'Opportuniste"', 
        icon: Zap, 
        desc: "Tu as une idée précise hors cases. Tu proposes un échange de valeur unique (partenariat, troc, conseil expert).", 
        color: 'text-pink-400', 
        bg: 'bg-pink-500/10', 
        border: 'border-pink-500/20' 
    }
];

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
function MysteryCard({ onReveal, match, locked = false, children }: { onReveal: () => void, match: any, locked?: boolean, children?: React.ReactNode }) {
  // Generate stable "fake" stats based on partner ID to keep it consistent for the same user
  const seed = match.partnerId ? match.partnerId.split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0) : 0;
  
  const potential = ["ÉLEVÉ", "TRÈS ÉLEVÉ", "EXPLOSIF"][seed % 3];
  // Use real count if available, otherwise fallback to seed (for preview/legacy)
  const collabs = match.collabsCount !== undefined ? match.collabsCount : (12 + (seed % 20));
  const compatibility = 77 + (seed % 20); // 77 to 96
  
  // Dynamic benefits based on job/superpower if available, or generic
    const getBenefits = () => {
        // If we have a REAL superpower, use it as the first benefit
        if (match.superpower && match.superpower.length > 5) {
             return [
                 match.superpower,
                 "Partage d'expérience terrain",
                 "Réseau local qualifié"
             ];
        }

        const benefits = [
            "Introduction stratégique (Décideurs)",
            "Boost de visibilité LinkedIn",
            "Partenariats locaux",
            "Partage d'expérience",
            "Opportunités de co-création",
            "Mentorat mutuel"
        ];
        
        // Add specific ones based on job
        const job = (match.job || "").toLowerCase();
        if (job.includes("commercial") || job.includes("vente")) benefits.unshift("Introduction stratégique (Décideurs)");
        if (job.includes("marketing") || job.includes("com")) benefits.unshift("Boost de visibilité LinkedIn");
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
    
    // Logic for "Collabs" label
    const collabsCount = match.collabsCount !== undefined ? match.collabsCount : (12 + (seed % 20));
    const collabsLabel = collabsCount < 10 ? "DÉBUTANT" : `${collabsCount}`;

    return (
      <div 
          onClick={locked ? undefined : onReveal}
          className={cn(
              "relative w-full max-w-sm mx-auto min-h-[600px] h-auto rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center text-center p-6 border transition-all pb-8",
              // Use a lighter gradient to pop against the dark background
              "bg-gradient-to-b from-[#1e293b] to-[#0f172a] border-white/20",
              !locked && "cursor-pointer group hover:scale-[1.01] hover:border-white/30"
          )}
      >
      {/* Animated Gradient Border - Show for BOTH states to keep it vibrant */}
      <div className={cn(
          "absolute inset-0 bg-gradient-to-br from-emerald-500/30 via-blue-600/20 to-purple-600/30 transition-opacity duration-500",
          locked ? "opacity-50" : "opacity-40 group-hover:opacity-60"
      )}></div>
      
      <div className="absolute inset-[1px] bg-[#020617] rounded-[2.4rem] z-0"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center h-full justify-between py-8 w-full">
        
        <div className="flex flex-col items-center w-full">
            {/* Header Badge */}
            {locked ? (
                <Badge className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 px-3 py-1 mb-8 flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                    <Clock className="w-3 h-3" /> DISPONIBLE DEMAIN 06H
                </Badge>
            ) : (
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1 animate-pulse mb-8 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    MATCH DÉTECTÉ ⚡️
                </Badge>
            )}

            {/* Identity Lock (Smaller) */}
            <div className="relative mb-8">
                <motion.div 
                    animate={locked ? { 
                        scale: [1, 1.1, 1],
                        opacity: [0.7, 1, 0.7],
                        borderColor: ["rgba(255,255,255,0.1)", "rgba(99,102,241,0.6)", "rgba(255,255,255,0.1)"],
                        boxShadow: ["0 0 0px rgba(99,102,241,0)", "0 0 40px rgba(99,102,241,0.4)", "0 0 0px rgba(99,102,241,0)"]
                    } : { scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className={cn(
                        "w-24 h-24 rounded-full border flex items-center justify-center backdrop-blur-sm relative z-10 shadow-lg",
                        // Always vibrant borders and backgrounds
                        "border-white/10 bg-white/5 shadow-[0_0_30px_rgba(16,185,129,0.1)]"
                    )}
                >
                    {locked ? <Lock className="w-10 h-10 text-indigo-300" /> : <Fingerprint className="w-12 h-12 text-white/70" />}
                    {!locked && <div className="absolute inset-0 rounded-full border-t-2 border-emerald-500 animate-spin"></div>}
                </motion.div>
                {/* Glow for both, maybe slightly different color for locked */}
                <div className={cn(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 blur-[50px] rounded-full pointer-events-none",
                    locked ? "bg-indigo-500/10" : "bg-emerald-500/20"
                )}></div>
            </div>

            {/* 1. KEY INFO SIMPLIFIED */}
            <div className="w-full space-y-4 mb-6">
                 <div className="text-center">
                     <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">PROFIL</p>
                     <p className="text-xl font-black text-white">{match.name ? match.name.split(' ')[0] : "Membre"} <span className="text-slate-500 mx-2">•</span> {match.job || "Dirigeant"} <span className="text-slate-500 mx-2">•</span> {match.city || "Gironde"}</p>
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
                <Target className={cn("w-4 h-4", locked ? "text-indigo-400" : "text-emerald-400")} />
                <span className="text-[10px] font-black text-white uppercase tracking-wider">CE QU'IL PEUT VOUS APPORTER</span>
            </div>
            <ul className="space-y-3">
                {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-3 text-xs font-medium text-slate-300">
                        <div className={cn("p-1 rounded-full", locked ? "bg-indigo-500/20" : "bg-emerald-500/20")}>
                            <CheckCircle2 className={cn("w-3.5 h-3.5", locked ? "text-indigo-400" : "text-emerald-400")} />
                        </div>
                        {benefit}
                    </li>
                ))}
            </ul>
        </div>
        
        {/* OPTIONAL CHILDREN (e.g. Add to Calendar) */}
        {children && (
            <div className="w-full mb-3 z-20 relative">
                {children}
            </div>
        )}

        <Button 
            disabled={locked}
            className={cn(
                "w-full h-14 font-black text-base rounded-2xl transition-all shadow-none",
                locked 
                    ? "bg-slate-800/50 text-slate-400 cursor-not-allowed border border-white/5" 
                    : "bg-white text-black hover:scale-[1.02] shadow-[0_0_30px_rgba(255,255,255,0.15)] animate-bounce-subtle border-2 border-white/50"
            )}
        >
            {locked ? (
                <motion.span 
                    animate={{ opacity: [0.4, 1, 0.4], scale: [0.98, 1.02, 0.98] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="flex items-center gap-2"
                >
                    <Lock className="w-4 h-4" /> DÉVERROUILLAGE DEMAIN
                </motion.span>
            ) : "DÉCOUVRIR QUI C'EST 🔓"}
        </Button>
      </div>
    </div>
  );
}

export function DailyMatchCard({ matches, userStreak = 0, userId, currentUserProfile }: DailyMatchCardProps) {
  // State
  const [revealed, setRevealed] = useState(false);
  const [step, setStep] = useState<'initial' | 'called' | 'validated'>('initial');
  const [popupView, setPopupView] = useState<'step1_status' | 'step2_rating' | 'step3_gift'>('step1_status');
  const [callHappened, setCallHappened] = useState<boolean | null>(null);
  const [callMade, setCallMade] = useState(false);
  const [rating, setRating] = useState<'fire' | 'good' | 'meh' | null>(null);

  // Dialog States
  const [isWhyVisible, setIsWhyVisible] = useState(false);
  const [isPhoneOpen, setIsPhoneOpen] = useState(false);
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [isMissionOpen, setIsMissionOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<string | null>(matches[0]?.my_mission || null);

  // Sync state if props change (e.g. after revalidate)
  useEffect(() => {
      if (matches[0]?.my_mission) {
          setSelectedMission(matches[0].my_mission);
      }
  }, [matches]);

  // Opportunity Logic
  const [oppType, setOppType] = useState<string | undefined>(undefined);
  const [oppDetails, setOppDetails] = useState("");
  const [isSubmittingOpp, setIsSubmittingOpp] = useState(false);

  // Dynamic micro-missions based on seed
  const getSmartMissionSuggestion = () => {
      const currentMatch = matches?.[0];
      if (!currentMatch || !currentUserProfile) return null;

      // Logic: Compare profiles to suggest best mission
      // 1. Amplificateur: If partner has high social followers (>1000) or user needs visibility
      const partnerFollowers = parseInt(currentMatch.give_profile?.social_network?.followers?.split('-')[0] || "0");
      if (partnerFollowers >= 1000) return 'amplificateur';

      // 2. Portier: If user needs specific target and partner has relevant sector
      // (Simplified: just check if partner is 'Connecteur' or has many collabs)
      if (currentMatch.superpower?.toLowerCase().includes('réseau') || currentMatch.collabsCount > 20) return 'portier';

      // 3. Recommandeur: If user needs credibility (check if 'recommender' field is filled in user profile? No, check partner's need)
      // Actually, we suggest what WE can do for THEM or what THEY can do for US.
      // Let's suggest based on MUTUAL benefit.
      
      return 'prescripteur'; // Default fallback
  };

  const suggestedMissionId = getSmartMissionSuggestion();
  const suggestedMission = MISSION_TYPES.find(m => m.id === suggestedMissionId);

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
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 1);
    targetDate.setHours(8, 0, 0, 0); // Tomorrow 08:00

    const calculateCountdown = () => {
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
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, []); // Remove dependency on matches to ensure it runs even if match exists

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
  const handleValidate = async () => {
    const currentMatch = matches[0];
    if (!currentMatch) return;

    // 1. Save Rating if exists
    if (rating && currentMatch.partnerId) {
        let score = 3;
        let tag = "bof";
        if (rating === 'fire') { score = 5; tag = "top"; }
        if (rating === 'good') { score = 4; tag = "bien"; }
        
        await saveMatchFeedback(currentMatch.partnerId, score, tag, currentMatch.id);
    }

    // 2. Save Opportunity if exists
    if (oppType && currentMatch.partnerId) {
        await handleCreateOpportunity(currentMatch.partnerId, currentMatch.name);
        // Ensure we mark as met even if no rating was given
        if (!rating) {
             await saveMatchFeedback(currentMatch.partnerId, 0, "gift_only", currentMatch.id);
        }
    }
    
    // 3. Fallback: If neither rating nor opportunity, but call happened, we must close the match
    if (!rating && !oppType && currentMatch.partnerId) {
         // Default close with no specific rating (or neutral)
         await saveMatchFeedback(currentMatch.partnerId, 3, "completed", currentMatch.id);
    }

    // 3. Finalize
    setStep('validated');
    setIsValidationOpen(false);
    confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
    
    if (callHappened !== false) {
        toast.success("Mission validée ! 🚀");
    } else {
        toast.success("Absence validée");
    }
  };

  const handleRate = async (score: number, tag: string, partnerId: string) => {
      if (score >= 4) confetti({ particleCount: 100, spread: 70, colors: ['#10b981', '#fbbf24'] });
      toast.success("Feedback enregistré ! 📝", { description: `Vous avez qualifié l'échange de "${tag}"` });
      // Pass match.id if available (we need to find it from matches array since we only have partnerId here)
      const matchId = matches.find(m => m.partnerId === partnerId)?.id;
      await saveMatchFeedback(partnerId, score, tag, matchId);
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

      // Points logic removed for strict economy
      // toast.success("Points ajoutés ! 🏆");
  };

  const handleCopyPhone = (phone: string) => {
      navigator.clipboard.writeText(phone);
      toast.success("Numéro copié ! 📋");
      triggerCallRewards();
      setStep('called');
      setIsPhoneOpen(false);
  };

  const handleCallAction = () => {
      triggerCallRewards();
      setStep('called');
      setIsPhoneOpen(false);
  };

  // RENDER LOGIC
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const now = new Date(); // Définir 'now' ici, au début de la logique de rendu

  // Check if today is weekend
  const isWeekend = now.getDay() === 6 || now.getDay() === 0; // 6 = Saturday, 0 = Sunday

  // If no matches, we show the Mystery Card in LOCKED state (Teaser) instead of the old WaitingCard.
  // This ensures consistency: "There is always a next match coming".
  if (!matches || matches.length === 0) {
      if (isWeekend) {
          return (
            <div className="relative w-full max-w-sm mx-auto min-h-[600px] h-auto rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_-12px_rgba(234,179,8,0.3)] bg-gradient-to-b from-[#422006] to-[#0f172a] border border-yellow-500/30 flex flex-col items-center justify-center text-center p-6 pb-8 group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-0"></div>
                
                {/* Gold Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/20 blur-[100px] rounded-full z-0"></div>

                <div className="relative z-10 space-y-8 flex flex-col items-center">
                    
                    {/* Popey Themed Icon: Anchor */}
                    <div className="relative">
                        <motion.div 
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="relative z-10"
                        >
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.5)] border-4 border-yellow-200">
                                <span className="text-6xl drop-shadow-md">⚓️</span>
                            </div>
                        </motion.div>
                        
                        {/* Ripple Effect behind Anchor */}
                        <motion.div 
                            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="absolute inset-0 bg-yellow-500/30 rounded-full blur-xl -z-10"
                        />
                    </div>

                    <div>
                        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500 mb-3 uppercase tracking-tight">
                            Mode Popey Activé !
                        </h2>
                        <p className="text-yellow-100/80 font-medium text-lg max-w-[280px] mx-auto leading-relaxed">
                            C'est le week-end ! <br/>
                            Le navire reste au port.
                        </p>
                    </div>

                    <div className="bg-yellow-950/40 border border-yellow-500/20 rounded-2xl p-6 w-full max-w-[300px]">
                        <p className="text-yellow-200/90 text-sm font-medium italic">
                            "Même les marins les plus aguerris ont besoin de repos. Reviens lundi pour de nouvelles aventures !" 🌊
                        </p>
                    </div>

                    <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 px-4 py-1.5 uppercase tracking-widest font-bold animate-pulse">
                        Rendez-vous Lundi 08h
                    </Badge>
                </div>
            </div>
          );
      }

      return <MysteryCard 
          onReveal={() => {}} 
          match={{
            id: 'teaser-future',
            partnerId: 'teaser-next',
            name: 'Prochain Match',
            job: 'Membre du Club',
            city: 'Gironde', // Default or random
            collabsCount: 15,
            score: 5.0,
            tags: ['Entrepreneur']
          }} 
          locked={true} 
      />;
  }

  // Prevent hydration mismatch for time-dependent rendering
  if (!mounted) {
      return <div className="w-full max-w-sm mx-auto h-[600px] rounded-[2.5rem] bg-[#0f172a] animate-pulse border border-white/5" />;
  }

  const match = matches[0];
  const isCallOut = match.type === 'call_out';

  // Check for slot mismatch (loose matching)
  const mySlots = match.mySlots || [];
  const partnerSlots = match.partnerSlots || [];
  const commonSlots = mySlots.filter((s: string) => partnerSlots.includes(s));
  // Mismatch only if both have slots but no intersection
  const hasMismatch = mySlots.length > 0 && partnerSlots.length > 0 && commonSlots.length === 0;

  // Check if match is in the future (Tomorrow or later)
  // const now = new Date(); // Removed duplicate declaration
  const today = new Date().toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' }); // YYYY-MM-DD
  const isFuture = match.date > today;
  
  // If it's a future match, show Mystery Card in LOCKED state (Teaser) + Add to Calendar
  if (isFuture) {
      // 1. Sur la carte "Preview Bloquée" (celle du lendemain) : C'est là que l'engagement se prend.
      // "Je sais que j'ai un match demain à 9h, je le bloque tout de suite dans mon agenda pour être sûr d'être dispo."
      return (
          <MysteryCard onReveal={() => {}} match={match} locked={true}>
               <Button 
                    className="w-full h-12 bg-white text-indigo-900 border border-indigo-100 rounded-xl font-black text-sm mb-3 flex items-center justify-center gap-2 transition-all hover:bg-indigo-50 hover:scale-[1.02] shadow-lg shadow-indigo-900/20 animate-pulse-slow group/cal"
                    onClick={(e) => {
                        e.stopPropagation();
                        // Generate Google Calendar Link
                        const title = `Call Réseau avec ${match.name.split(' ')[0]} ⚡️`;
                        const details = "Rappel Popey : Échange de 15 min pour booster votre réseau. Objectif : Faire connaissance et explorer les synergies.";
                        const location = "Par téléphone";
                        // Date logic: assume tomorrow 9am if no specific time, or use match.time if available (e.g. "09h - 09h15")
                        const startTime = new Date();
                        startTime.setDate(startTime.getDate() + 1);
                        startTime.setHours(9, 0, 0, 0);
                        const endTime = new Date(startTime);
                        endTime.setMinutes(endTime.getMinutes() + 15);
                        
                        const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}&dates=${startTime.toISOString().replace(/-|:|\.\d\d\d/g, "")}/${endTime.toISOString().replace(/-|:|\.\d\d\d/g, "")}`;
                        
                        window.open(googleUrl, '_blank');
                        toast.success("Agenda ouvert ! 📅", { description: "N'oubliez pas d'enregistrer le créneau." });
                    }}
               >
                   <Clock className="w-4 h-4 text-indigo-600 transition-colors" /> 
                   <span>BLOQUER MON CRÉNEAU (15 min)</span>
               </Button>
          </MysteryCard>
      );
  }

  // --- SPECIAL FOUNDER MATCH (POPEY) ---
  // If match.partnerId is 'popey-founder' or specific ID, show Founder Card
  const isFounderMatch = match.partnerId === 'popey-founder' || match.name?.toLowerCase().includes("jean-philippe");
  const isRescue = match.tags?.includes('rescue');

  if (isFounderMatch) {
      // Import FounderCardPreview dynamically or use it if available in scope. 
      // Since it's in design-system-preview, we should ideally move it to a shared component.
      // For now, let's assume we copy the FounderCardPreview logic here or import it.
      // But wait, FounderCardPreview is exported from design-system-preview.tsx.
      // Let's import it at the top of the file first.
      
      const handleFounderCall = async () => {
          const type = isRescue ? "rescue" : "onboarding";
          try {
              const result = await notifyFounderCall(type);
              if (result.success) {
                  toast.success("Demande envoyée ! 📞", { description: "Jean-Philippe a été notifié." });
              } else {
                  toast.error("Erreur lors de l'envoi", { description: result.error });
              }
          } catch (e) {
              toast.error("Erreur de connexion");
          }
      };

      return <FounderCardPreview type={isRescue ? "rescue" : "onboarding"} onConfirm={handleFounderCall} />;
  }

  // Determine the next match to tease
  // If we have more than 1 match in the array, the second one is the future match.
  // Otherwise, we create a generic placeholder.
  const nextMatch = matches.length > 1 ? matches[1] : {
      id: 'teaser-future',
      partnerId: 'teaser-next',
      name: 'Prochain Match',
      job: 'Membre du Club',
      city: 'Gironde', // Default or random
      collabsCount: 15,
      score: 5.0,
      tags: ['Entrepreneur']
  };

  if (!revealed) {
      return <MysteryCard onReveal={handleReveal} match={match} />;
  }

  // IF VALIDATED -> SHOW NEXT MATCH LOCKED (TEASER)
  if (step === 'validated') {
      return <MysteryCard onReveal={() => {}} match={nextMatch} locked={true} />;
  }

  // MATCH CARD (REVEALED)
  return (
    <div className="relative w-full max-w-sm mx-auto min-h-[600px] h-auto rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_-12px_rgba(79,70,229,0.15)] bg-gradient-to-b from-[#1e1b4b] to-[#0f172a] border border-indigo-500/30 flex flex-col items-center justify-between text-center p-6 pb-8 group">
      
      {/* Premium Background with Sparkles */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/10 via-[#0a0a0c] to-[#0a0a0c] z-0"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 z-0"></div>
      
      {/* Moving Particles / Fireflies */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-indigo-400 rounded-full blur-[1px]"
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
        className="absolute top-0 left-0 right-0 h-40 bg-indigo-500/30 blur-[80px] rounded-full z-0"
      />

      {/* Content */}
      <div className="relative z-10 w-full flex flex-col items-center h-full pt-4">
        
        {/* FOMO Badge (Top) */}
        <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-4 bg-red-500/10 backdrop-blur-md text-white px-4 py-2 rounded-2xl flex flex-col items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.2)] text-center gap-1 border border-red-500/20 w-full max-w-[90%]"
        >
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-red-200">
                <Phone className="w-3 h-3 animate-bounce" />
                {isCallOut ? `C'est à vous d'appeler` : `${match.name.split(' ')[0]} vous appelle`}
            </div>

            {hasMismatch ? (
                 <div className="flex flex-col items-center mt-1 animate-pulse">
                     <div className="flex items-center gap-2">
                         <Clock className="w-3 h-3 text-orange-300" />
                         <span className="font-mono font-bold text-xs text-orange-200">Créneaux différents ⚠️</span>
                     </div>
                     <span className="text-[10px] text-orange-200/80 font-medium mt-0.5 leading-tight">
                        Lui : {partnerSlots[0]?.replace('h – ', 'h-')?.split(' ')[0]} • Vous : {mySlots[0]?.replace('h – ', 'h-')?.split(' ')[0]}
                     </span>
                     <span className="text-[9px] text-white/60 mt-0.5">Appelez quand vous pouvez !</span>
                 </div>
            ) : (
                <div className="flex items-center gap-2">
                     <Clock className="w-3 h-3 text-red-200" />
                     <span className="font-mono font-bold text-xs text-white">{match.time}</span>
                </div>
            )}
        </motion.div>

        {/* Avatar with Rotating Rings */}
        <div className="relative mb-4">
            {/* Outer Ring - Slow Rotation */}
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-4 rounded-full border border-indigo-500/20 border-dashed"
            />
            {/* Middle Ring - Reverse Rotation */}
            <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-2 rounded-full border border-blue-500/30 border-dotted"
            />
            
            {/* Glow behind avatar */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-300 to-blue-600 rounded-full blur-md opacity-60 animate-pulse-slow"></div>
            
            <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-r from-indigo-300 via-blue-300 to-purple-600 shadow-2xl relative z-10">
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-[#0f0f12] relative bg-slate-800">
                    {match.avatar ? (
                        <Image 
                            src={match.avatar} 
                            alt={match.name} 
                            fill 
                            className="object-cover transform transition-transform hover:scale-110 duration-700"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <User className="h-10 w-10 text-slate-500" />
                        </div>
                    )}
                </div>
            </div>
            
            {/* Status Indicator */}
            <div className="absolute bottom-1 right-1 w-5 h-5 bg-[#0f0f12] rounded-full flex items-center justify-center z-20">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping"></span>
                <div className="relative w-3 h-3 bg-green-500 rounded-full border-2 border-[#0f0f12]"></div>
            </div>
        </div>

        {/* Name & View Profile */}
        <div className="mb-4 flex flex-col items-center gap-2">
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-indigo-200 leading-none">
                {match.name.split(' ')[0]}
            </h2>
            <Button 
                asChild
                variant="outline" 
                className="h-7 text-[10px] px-3 bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 hover:text-indigo-200 rounded-full uppercase font-bold tracking-wider transition-all hover:scale-105"
                onClick={() => trackEvent('click_profile', { partnerId: match.partnerId })}
            >
                <Link href={`/mon-reseau-local/dashboard/profile/${match.partnerId}`}>
                    <User className="w-3 h-3 mr-1.5" /> Voir profil
                </Link>
            </Button>
        </div>

        {/* Quote */}
        <div className="mb-6 px-2 w-full">
            <p className="text-slate-300 text-sm font-medium italic leading-relaxed">
                "Ce {match.job || 'partenaire'} peut vous ouvrir des opportunités auxquelles vous n’aviez pas accès hier."
            </p>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-2 gap-3 w-full mb-auto">
            {/* My Goal */}
            <div 
                onClick={() => setIsMissionOpen(true)}
                className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 cursor-pointer hover:bg-indigo-500/20 transition-all text-left group/box hover:border-indigo-500/40"
            >
                <div className="flex items-center gap-1.5 mb-2">
                    <Target className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[9px] font-black text-indigo-300 uppercase tracking-wider">Mon Objectif</span>
                </div>
                <p className={cn("text-[11px] font-bold leading-tight line-clamp-2 group-hover/box:text-white transition-colors", selectedMission ? "text-white" : "text-indigo-200/70")}>
                    {selectedMission 
                        ? MISSION_TYPES.find(m => m.id === selectedMission)?.label 
                        : "Définir mon objectif 🎯"}
                </p>
            </div>

            {/* His Goal */}
            <div className={cn(
                "rounded-xl p-3 text-left border",
                match.partner_mission 
                    ? "bg-purple-500/10 border-purple-500/20" 
                    : "bg-orange-500/10 border-orange-500/20 border-dashed"
            )}>
                <div className="flex items-center gap-1.5 mb-2">
                    <Users className={cn("w-3.5 h-3.5", match.partner_mission ? "text-purple-400" : "text-orange-400")} />
                    <span className={cn("text-[9px] font-black uppercase tracking-wider", match.partner_mission ? "text-purple-300" : "text-orange-300")}>Son Objectif</span>
                </div>
                <p className={cn("text-[11px] font-bold leading-tight line-clamp-2", match.partner_mission ? "text-white" : "text-orange-200/70 italic")}>
                    {match.partner_mission 
                        ? (MISSION_TYPES.find(m => m.id === match.partner_mission)?.label || match.partner_mission)
                        : "N'a pas encore défini son objectif..."}
                </p>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full mt-6">
             
             {/* STEP INITIAL: SHOW ACTION BUTTONS */}
             {step === 'initial' && (
                 <>
                    <Button 
                        onClick={() => {
                            setIsWhyVisible(true);
                            trackEvent('click_why_open', { partnerId: match.partnerId });
                        }}
                        variant="ghost" 
                        className="w-full h-12 border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white rounded-xl font-bold transition-all hover:scale-[1.02]"
                    >
                        <Zap className="w-4 h-4 mr-2 text-yellow-400" /> Pourquoi ce match ?
                    </Button>

                    <Button 
                        onClick={() => {
                            setIsPhoneOpen(true);
                            trackEvent('click_call_open', { partnerId: match.partnerId });
                        }}
                        className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-lg rounded-xl shadow-lg shadow-emerald-900/20 tracking-wide transition-all hover:scale-[1.02] relative overflow-hidden group/btn"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                        <PhoneCall className="w-5 h-5 mr-2 relative z-10" /> <span className="relative z-10">APPELER</span>
                    </Button>
                 </>
             )}

             {/* STEP CALLED: SHOW VALIDATION BUTTON */}
             {step === 'called' && (
                <Dialog open={isValidationOpen} onOpenChange={(open) => {
                        setIsValidationOpen(open);
                        if (!open) {
                            setPopupView('step1_status'); // Reset view on close
                            setCallHappened(null);
                            setRating(null);
                            setOppType(undefined);
                            setOppDetails("");
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button className="w-full h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:scale-[1.02] transition-all shadow-xl border-2 border-indigo-400/50 relative z-10 flex flex-col items-center justify-center gap-1">
                                <CheckCircle2 className="h-6 w-6" />
                                <span className="text-xs font-black uppercase tracking-wider">Terminer la mission</span>
                            </Button>
                        </DialogTrigger>
                        {/* VALIDATION WIZARD CONTENT (Re-inserted here) */}
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
                                    <div className="bg-white/5 p-6 rounded-2xl border border-white/5 text-center space-y-6">
                                        <Label className="text-slate-400 uppercase text-xs font-bold tracking-wider block">L'appel a-t-il eu lieu ?</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Button 
                                                onClick={() => {
                                                    setCallHappened(true);
                                                    setPopupView('step2_rating');
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
                                    {callHappened === false && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                            <Button onClick={handleValidate} className="w-full h-14 text-lg font-black bg-white text-black hover:bg-slate-200 rounded-xl shadow-lg">
                                                VALIDER L'ABSENCE
                                            </Button>
                                        </motion.div>
                                    )}
                                </div>
                            )}

                            {/* VIEW 2: RATE */}
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
                                    {!oppType ? (
                                        <div className="grid grid-cols-1 gap-2 max-h-[50vh] overflow-y-auto pr-1">
                                            {OPPORTUNITY_TYPES.map((type) => {
                                                const Icon = type.icon;
                                                return (
                                                    <button
                                                        key={type.id}
                                                        onClick={() => setOppType(type.id)}
                                                        className="group relative flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-purple-500/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all text-left"
                                                    >
                                                        <div className={cn("shrink-0 h-10 w-10 rounded-full flex items-center justify-center bg-black/20", type.color)}>
                                                            <Icon className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                                                                {type.label}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 font-medium leading-tight">
                                                                {type.cardLabel || type.description}
                                                            </div>
                                                        </div>
                                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <ChevronRight className="w-4 h-4 text-purple-400" />
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <motion.div 
                                                initial={{ scale: 0.9, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="flex items-center justify-between bg-purple-500/10 p-3 rounded-xl border border-purple-500/30"
                                            >
                                                <span className="text-sm font-bold text-purple-300 flex items-center gap-2">
                                                    <Gift className="w-4 h-4" /> {OPPORTUNITY_TYPES.find(t => t.id === oppType)?.label}
                                                </span>
                                                <button onClick={() => setOppType(undefined)} className="text-xs text-slate-400 underline hover:text-white">Changer</button>
                                            </motion.div>
                                            
                                            <div className="space-y-2">
                                                <Label className="text-xs text-slate-400 uppercase font-bold ml-1">Message (Optionnel)</Label>
                                                <Textarea 
                                                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-white min-h-[80px] focus:ring-1 focus:ring-purple-500 outline-none resize-none placeholder:text-slate-600"
                                                    placeholder="Ex: Je te mets en relation avec..."
                                                    value={oppDetails}
                                                    onChange={(e) => setOppDetails(e.target.value)}
                                                />
                                            </div>

                                            <Button onClick={handleValidate} className="w-full h-14 text-lg font-black bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-900/20 transform transition-all hover:scale-[1.02]">
                                                VALIDER & ENVOYER 🚀
                                            </Button>
                                        </div>
                                    )}
                                    {!oppType && (
                                            <Button variant="ghost" onClick={() => setPopupView('step2_rating')} className="w-full text-slate-500">Retour</Button>
                                    )}
                                </div>
                            )}
                        </DialogContent>
                </Dialog>
             )}

        </div>
        
        {/* HIDDEN DIALOGS (To ensure content is available) */}
        {/* Mission Dialog */}
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
                                onClick={async () => {
                                    const newMission = mission.id;
                                    setSelectedMission(newMission);
                                    setIsMissionOpen(false);
                                    toast.success(`Objectif "${mission.label}" sélectionné !`);
                                    try {
                                        await updateMatchMission(match.id, newMission);
                                    } catch (e) {
                                        toast.error("Erreur lors de la sauvegarde");
                                    }
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
            </DialogContent>
        </Dialog>

        {/* Why Dialog Content (Reused) */}
        <Dialog open={isWhyVisible} onOpenChange={setIsWhyVisible}>
            <DialogContent className="bg-[#0f172a] border-white/10 text-white sm:max-w-md rounded-2xl w-[90vw] p-0 overflow-hidden">
                <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-6">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-black">
                            <Zap className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                            Pourquoi ce match ?
                        </DialogTitle>
                    </DialogHeader>
                </div>
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
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
                        <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 space-y-2">
                            <h4 className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-2">
                                <Gift className="h-4 w-4" /> Ce qu'il peut offrir
                            </h4>
                            <p className="text-sm font-medium text-emerald-100">
                                {match.superpower || "Son expérience et son réseau"}
                            </p>
                        </div>
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

        {/* Phone Dialog Content (Reused) */}
        <Dialog open={isPhoneOpen} onOpenChange={(open) => {
            setIsPhoneOpen(open);
            if (!open) {
                setStep('called');
            }
        }}>
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

      </div>
    </div>
  );
}
