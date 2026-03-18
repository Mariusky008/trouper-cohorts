"use client";

import { motion } from "framer-motion";
import { Clock, Star, Phone, MessageSquare, User, Zap, Trophy, Handshake, Gift, PhoneCall, Copy, Target, Search, Fingerprint, Briefcase, CheckCircle2, Users, Lock, Flame, TrendingUp, ChevronRight, ExternalLink } from "lucide-react";
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

import { createClient } from "@/lib/supabase/client";

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
            <div className="relative w-full max-w-sm mx-auto h-[600px] rounded-[2.5rem] overflow-hidden shadow-2xl bg-white flex flex-col items-center justify-center text-center p-6 border border-[#2E130C]/10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-50 via-white to-white"></div>
                <motion.div 
                    initial={{ scale: 0 }} animate={{ scale: 1 }} 
                    className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-xl"
                >
                    <CheckCircle2 className="w-12 h-12 text-white" />
                </motion.div>
                <h3 className="text-3xl font-black text-[#2E130C] mb-2">Message Envoyé !</h3>
                <p className="text-[#2E130C]/70 max-w-[250px]">
                    Jean-Philippe a reçu votre demande. <br/>Il vous contactera très vite.
                </p>
            </div>
        );
    }

    return (
        <div className="relative w-full max-w-sm mx-auto min-h-[600px] h-auto rounded-[2.5rem] overflow-hidden shadow-2xl bg-white border border-[#2E130C]/10 flex flex-col items-center p-0 group">
            
            {/* Background Image/Effect */}
            <div className="absolute inset-0 opacity-100">
                <Image 
                    src="/jeanphilipperoth.jpg" 
                    alt="Jean-Philippe Founder" 
                    fill 
                    className="object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#2E130C]/50 to-[#2E130C]/90 z-10"></div>
            </div>

            {/* Content Container */}
            <div className="relative z-20 flex flex-col h-full w-full justify-between p-6 pt-48">
                
                {/* Header Badge */}
                <div className="flex justify-center -mt-12 mb-4">
                    <Badge className={cn(
                        "px-4 py-1.5 text-xs font-bold uppercase tracking-widest shadow-lg border backdrop-blur-md",
                        isRescue 
                            ? "bg-red-500 text-white border-red-600" 
                            : "bg-indigo-500 text-white border-indigo-600"
                    )}>
                        {isRescue ? "🆘 JOKER DE SECOURS" : "👋 BIENVENUE AU CLUB"}
                    </Badge>
                </div>

                {/* Title & Message */}
                <div className="text-center space-y-4 mb-8">
                    <h2 className="text-3xl font-black text-white leading-none drop-shadow-md">
                        Jean-Philippe <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 text-xl">Fondateur Popey</span>
                    </h2>
                    
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-left relative shadow-lg">
                        <div className="absolute -top-3 -left-2 text-4xl text-white opacity-40">❝</div>
                        <p className="text-white text-sm font-medium leading-relaxed italic relative z-10 drop-shadow-sm">
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
                            ? "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white"
                            : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white"
                    )}
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                    <PhoneCall className="w-5 h-5 mr-2 relative z-10" /> 
                    <span className="relative z-10">ACCEPTER L'APPEL</span>
                </Button>

                <p className="text-[10px] text-white/70 text-center mt-3 font-medium uppercase tracking-wide">
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
        label: 'Le Portier', 
        icon: Lock, 
        desc: "Je cible une entreprise ou un décideur précis. Tu regardes ton LinkedIn/Répertoire et me fais une intro directe.", 
        color: 'text-blue-600', 
        bg: 'bg-blue-50', 
        border: 'border-blue-200' 
    },
    { 
        id: 'amplificateur', 
        label: 'L\'Amplificateur', 
        icon: TrendingUp, 
        desc: "Je viens de publier un post ou une offre. Soutien mutuel immédiat (Commentaire, partage).", 
        color: 'text-purple-600', 
        bg: 'bg-purple-50', 
        border: 'border-purple-200' 
    },
    { 
        id: 'prescripteur', 
        label: 'Le Prescripteur', 
        icon: Handshake, 
        desc: "Je cherche un client chaud. On définit mon client idéal et tu identifies un prospect dans ton entourage.", 
        color: 'text-emerald-600', 
        bg: 'bg-emerald-50', 
        border: 'border-emerald-200' 
    },
    { 
        id: 'recommandeur', 
        label: 'Le Recommandeur', 
        icon: Star, 
        desc: "Je manque de preuve sociale. Échange croisé d'un avis Google ou d'une recommandation LinkedIn.", 
        color: 'text-yellow-600', 
        bg: 'bg-yellow-50', 
        border: 'border-yellow-200' 
    },
    { 
        id: 'infiltre', 
        label: 'L\'Infiltré', 
        icon: Fingerprint, 
        desc: "Je veux entrer dans des réseaux fermés (BNI, Clubs). Tu m'invites comme 'Guest' ou me parraines.", 
        color: 'text-red-600', 
        bg: 'bg-red-50', 
        border: 'border-red-200' 
    },
    { 
        id: 'joker', 
        label: 'Le Joker', 
        icon: Zap, 
        desc: "Tu as une idée précise hors cases. Tu proposes un échange de valeur unique.", 
        color: 'text-pink-600', 
        bg: 'bg-pink-50', 
        border: 'border-pink-200' 
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

const REPUTATION_BADGES = [
    { id: 'connector', label: 'Le Connecteur', icon: '🤝', desc: "M'a ouvert son réseau" },
    { id: 'expert', label: 'L\'Expert', icon: '🧠', desc: "M'a appris quelque chose" },
    { id: 'energizer', label: 'L\'Énergiseur', icon: '⚡', desc: "Super motivant" },
    { id: 'listener', label: 'L\'Écouteur', icon: '👂', desc: "Très bonne écoute" }
];

// --- 2. MYSTERY CARD COMPONENT ---
function MysteryCard({ onReveal, match, locked = false, children }: { onReveal: () => void, match: any, locked?: boolean, children?: React.ReactNode }) {
  // Generate stable "fake" stats based on partner ID to keep it consistent for the same user
  const seed = match.partnerId ? match.partnerId.split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0) : 0;
  
    return (
      <div 
          onClick={locked ? undefined : onReveal}
          className={cn(
              "relative w-full max-w-sm mx-auto min-h-[600px] h-auto rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col items-center justify-center text-center p-6 border transition-all pb-8",
              "bg-white border-[#2E130C]/10",
              !locked && "cursor-pointer group hover:scale-[1.01] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]"
          )}
      >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] z-0"></div>
      
      {/* Animated Gradient Border - Subtle now */}
      <div className={cn(
          "absolute inset-0 bg-gradient-to-br from-emerald-100/50 via-blue-100/30 to-purple-100/50 transition-opacity duration-500 pointer-events-none",
          locked ? "opacity-50" : "opacity-0 group-hover:opacity-100"
      )}></div>
      

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center h-full justify-between py-8 w-full">
        
        <div className="flex flex-col items-center w-full">
            {/* Header Badge */}
            {locked ? (
                <Badge className="bg-slate-100 text-slate-500 border-slate-200 px-3 py-1 mb-8 flex items-center gap-2 shadow-sm">
                    <Clock className="w-3 h-3" /> DISPONIBLE DEMAIN 06H
                </Badge>
            ) : (
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 px-3 py-1 animate-pulse mb-8 shadow-sm">
                    MATCH DÉTECTÉ ⚡️
                </Badge>
            )}

            {/* Identity Lock (Smaller) */}
            <div className="relative mb-8">
                <motion.div 
                    animate={locked ? { 
                        scale: [1, 1.05, 1],
                        borderColor: ["rgba(0,0,0,0.05)", "rgba(0,0,0,0.1)", "rgba(0,0,0,0.05)"],
                    } : { scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className={cn(
                        "w-24 h-24 rounded-full border flex items-center justify-center backdrop-blur-sm relative z-10 shadow-lg",
                        "border-[#2E130C]/5 bg-white shadow-xl"
                    )}
                >
                    {locked ? <Lock className="w-10 h-10 text-slate-300" /> : <Fingerprint className="w-12 h-12 text-[#2E130C]/20" />}
                    {!locked && <div className="absolute inset-0 rounded-full border-t-2 border-emerald-500 animate-spin"></div>}
                </motion.div>
                {/* Glow */}
                <div className={cn(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 blur-[50px] rounded-full pointer-events-none",
                    locked ? "bg-slate-200/50" : "bg-emerald-200/50"
                )}></div>
            </div>

            {/* 1. KEY INFO SIMPLIFIED */}
            <div className="w-full space-y-4 mb-6">
                 <div className="text-center">
                     <p className="text-sm font-bold text-[#2E130C]/40 uppercase tracking-widest mb-1">PROFIL</p>
                     <p className="text-xl font-black text-[#2E130C]">{match.name ? match.name.split(' ')[0] : "Membre"} <span className="text-slate-300 mx-2">•</span> {match.job || "Dirigeant"} <span className="text-slate-300 mx-2">•</span> {match.city || "France"}</p>
                 </div>
                 
                 <div className="flex flex-col items-center justify-center gap-2 bg-[#F3F0E7] rounded-xl p-4 border border-[#2E130C]/5 shadow-sm max-w-[80%] mx-auto">
                     <span className="text-[10px] font-black text-[#2E130C]/50 uppercase tracking-widest">POTENTIEL BUSINESS</span>
                     <div className="flex gap-1">
                         {[1,2,3,4,5].map(i => (
                             <Star key={i} className="w-5 h-5 text-orange-400 fill-orange-400" />
                         ))}
                     </div>
                 </div>
            </div>
        </div>

        {/* 2. CONCRETE BENEFITS (NEW DESIGN: Il recherche / Il aide) */}
        <div className="w-full space-y-3 mb-6">
            
            {/* IL RECHERCHE */}
            <div className="bg-white rounded-2xl p-4 border border-[#2E130C]/10 shadow-sm relative overflow-hidden group/search hover:border-blue-200 transition-colors">
                <div className="absolute top-0 right-0 p-2 opacity-5 group-hover/search:opacity-10 transition-opacity">
                    <Search className="w-12 h-12 text-blue-600" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                     <div className="p-1.5 rounded-lg bg-blue-50">
                        <Search className="w-3.5 h-3.5 text-blue-600" />
                     </div>
                     <span className="text-[10px] font-black text-blue-600/70 uppercase tracking-wider">
                         {match.name ? `Ce que ${match.name.split(' ')[0]} recherche` : "Ce qu'il recherche"}
                     </span>
                </div>
                <ul className="space-y-2 relative z-10 pl-1">
                    {/* Dynamic needs based on profile data or fallback */}
                    {(match.current_need ? [match.current_need] : ["Nouveaux clients", "Partenaires locaux"]).map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-xs font-medium text-[#2E130C]/80">
                            <span className="text-blue-500 font-bold text-lg leading-none">•</span>
                            <span className="leading-tight pt-0.5">{item}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* IL PEUT AIDER */}
            <div className="bg-white rounded-2xl p-4 border border-[#2E130C]/10 shadow-sm relative overflow-hidden group/help hover:border-emerald-200 transition-colors">
                <div className="absolute top-0 right-0 p-2 opacity-5 group-hover/help:opacity-10 transition-opacity">
                    <Gift className="w-12 h-12 text-emerald-600" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                     <div className="p-1.5 rounded-lg bg-emerald-50">
                        <Gift className="w-3.5 h-3.5 text-emerald-600" />
                     </div>
                     <span className="text-[10px] font-black text-emerald-600/70 uppercase tracking-wider">
                         Ce qu'il peut vous offrir
                     </span>
                </div>
                <ul className="space-y-2 relative z-10 pl-1">
                     {/* Dynamic superpowers based on profile data or fallback */}
                    {(match.superpower ? [match.superpower] : ["Son expertise métier", "Son réseau local"]).map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-xs font-medium text-[#2E130C]/80">
                            <span className="text-emerald-500 font-bold text-lg leading-none">•</span>
                            <span className="leading-tight pt-0.5">{item}</span>
                        </li>
                    ))}
                </ul>
            </div>

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
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200" 
                    : "bg-[#2E130C] text-white hover:bg-[#2E130C]/90 hover:scale-[1.02] shadow-xl shadow-[#2E130C]/10 animate-bounce-subtle"
            )}
        >
            {locked ? (
                <motion.span 
                    animate={{ opacity: [0.6, 1, 0.6] }}
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

const WeekendCard = () => (
    <div className="relative w-full max-w-sm mx-auto min-h-[600px] h-auto rounded-[2.5rem] overflow-hidden shadow-2xl bg-white border border-yellow-200 flex flex-col items-center justify-center text-center p-6 pb-8 group">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] z-0"></div>
        
        {/* Gold Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-100/50 blur-[80px] rounded-full z-0"></div>

        <div className="relative z-10 space-y-8 flex flex-col items-center">
            
            {/* Popey Themed Icon: Anchor */}
            <div className="relative">
                <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="relative z-10"
                >
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-100 to-yellow-300 flex items-center justify-center shadow-lg border-4 border-white">
                        <span className="text-6xl drop-shadow-sm">⚓️</span>
                    </div>
                </motion.div>
            </div>

            <div>
                <h2 className="text-3xl font-black text-[#2E130C] mb-3 uppercase tracking-tight">
                    Mode Popey Activé !
                </h2>
                <p className="text-[#2E130C]/70 font-medium text-lg max-w-[280px] mx-auto leading-relaxed">
                    C'est le week-end ! <br/>
                    Le navire reste au port.
                </p>
            </div>

            <div className="bg-[#F3F0E7] border border-[#2E130C]/5 rounded-2xl p-6 w-full max-w-[300px]">
                <p className="text-[#2E130C]/80 text-sm font-medium italic">
                    "Même les marins les plus aguerris ont besoin de repos. Reviens lundi pour de nouvelles aventures !" 🌊
                </p>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-[280px]">
                <Button 
                    asChild
                    className="w-full h-12 bg-white hover:bg-slate-50 text-[#2E130C] border border-[#2E130C]/10 rounded-xl font-bold transition-all shadow-sm"
                >
                    <Link href="/mon-reseau-local/dashboard/profile">
                        <User className="w-4 h-4 mr-2" />
                        Mettre à jour mon profil
                    </Link>
                </Button>
            </div>

            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 px-4 py-1.5 uppercase tracking-widest font-bold animate-pulse">
                Rendez-vous Lundi 08h
            </Badge>
        </div>
    </div>
);

export function DailyMatchCard({ matches, userStreak = 0, userId, currentUserProfile }: DailyMatchCardProps) {
  // State
  const [mounted, setMounted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [step, setStep] = useState<'initial' | 'called' | 'validated'>(() => {
    // Force sync step with matches prop on mount
    if (matches && matches.length > 0) {
        const current = matches[0];
        if (current.hasFeedback === true || current.status === 'met') {
            return 'validated';
        }
    }
    return 'initial';
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update step if matches change (e.g. after refresh)
  useEffect(() => {
    if (matches && matches.length > 0) {
        const current = matches[0];
        if (current.hasFeedback === true || current.status === 'met') {
            setStep('validated');
        } else if (step === 'validated') {
            // Only reset if we were validated but the new match isn't
            setStep('initial');
        }
    }
  }, [matches]);

  // Use props directly, no derived state for matches to avoid hydration mismatch
  const currentMatch = matches && matches.length > 0 ? matches[0] : null;

  // Realtime Subscription for Sync across devices
  useEffect(() => {
    if (!currentMatch) return;

    const supabase = createClient();
    
    const channel = supabase.channel(`match_${currentMatch.id}`)
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'network_matches', filter: `id=eq.${currentMatch.id}` },
            (payload) => {
                const updatedMatch = payload.new as any;
                if (updatedMatch.status === 'met' || updatedMatch.has_feedback) {
                    setStep('validated');
                }
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, [currentMatch]);

  // Realtime Subscription for Sync across devices
  useEffect(() => {
      if (!userId) return;
      
      const supabase = createClient();
      const channel = supabase.channel('match_feedback_changes')
          .on(
              'postgres_changes',
              {
                  event: 'INSERT',
                  schema: 'public',
                  table: 'match_feedback',
                  filter: `giver_id=eq.${userId}`
              },
              (payload) => {
                  // Check if this feedback is for the current match
                  const currentPartnerId = matches[0]?.partnerId;
                  // payload.new is typed as any usually, so we cast or assume
                  const newRecord = payload.new as any;
                  
                  if (newRecord.receiver_id === currentPartnerId) {
                      setStep('validated');
                      toast.success("Mission validée sur un autre appareil ! 🔄");
                  }
              }
          )
          .subscribe();

      return () => {
          supabase.removeChannel(channel);
      };
  }, [userId, matches]);

  const [popupView, setPopupView] = useState<'step1_status' | 'step2_rating' | 'step3_gift'>('step1_status');
  const [callHappened, setCallHappened] = useState<boolean | null>(null);
  const [callMade, setCallMade] = useState(false);
  const [rating, setRating] = useState<'fire' | 'good' | 'meh' | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);

  // Dialog States
  const [isWhyVisible, setIsWhyVisible] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false); // Replaced isPhoneOpen
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [isMyProfileOpen, setIsMyProfileOpen] = useState(false);
  const [isPartnerProfileOpen, setIsPartnerProfileOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<string | null>(matches[0]?.my_mission || null);

  // Sync state if props change (e.g. after revalidate)
  useEffect(() => {
      if (matches && matches.length > 0) {
          setSelectedMission(matches[0].my_mission || null);
      }
  }, [matches]);

  // Opportunity Logic
  const [oppType, setOppType] = useState<string | undefined>(undefined);
  const [oppDetails, setOppDetails] = useState("");
  const [isSubmittingOpp, setIsSubmittingOpp] = useState(false);

  const getSmartMissionSuggestion = () => {
      const currentMatch = matches?.[0];
      if (!currentMatch || !currentUserProfile) return null;
      
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

  // WhatsApp Formatter Helper
  const formatPhoneForWhatsApp = (phone: string) => {
      if (!phone) return "";
      let cleaned = phone.replace(/\D/g, '');
      if (cleaned.startsWith('0')) {
          cleaned = '33' + cleaned.substring(1);
      } else if (!cleaned.startsWith('33') && cleaned.length === 9) {
          cleaned = '33' + cleaned;
      }
      return cleaned;
  };

  // WhatsApp Action
  const handleWhatsAppRedirect = () => {
      const matchName = matches[0]?.name?.split(' ')[0] || "partenaire";
      const matchJob = matches[0]?.job || "dirigeant";
      // We try first_name first, then display_name, then fallback to splitting the name, then finally "Jean-Philippe" as fallback if profile is empty
      const myName = currentUserProfile?.first_name || currentUserProfile?.display_name?.split(' ')[0] || currentUserProfile?.name?.split(' ')[0] || "Jean-Philippe";
      
      let whatsappMessage = `Salut ${matchName}, c'est ${myName} ! On a matché aujourd'hui sur Popey.Academy. J'ai vu que tu étais ${matchJob}, ça m'intéresse ! Dispo pour un appel rapide ou un vocal aujourd'hui ou demain ?`;
      
      if (currentUserProfile?.featured_link) {
          whatsappMessage += `\n\nPs : si tu veux en savoir un peu plus sur moi voici mon lien : ${currentUserProfile.featured_link}`;
      }
      
      const formattedPhone = formatPhoneForWhatsApp(matches[0]?.phone);
      
      if (formattedPhone) {
          window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
      } else {
          toast.error("Numéro de téléphone invalide pour WhatsApp.");
      }
      
      setIsWhatsAppOpen(false);
      setStep('called'); // Transition to validation state
      trackEvent('click_whatsapp_action', { partnerId: matches[0]?.partnerId });
  };

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
        
        // Append badge to tag if selected (e.g. "top:connector")
        if (selectedBadge) {
            tag = `${tag}:${selectedBadge}`;
        }
        
        const result = await saveMatchFeedback(currentMatch.partnerId, score, tag, currentMatch.id);
        if (result?.error) {
            toast.error("Erreur validation: " + result.error);
            return; // Stop here if save failed
        }
    }

    // 2. Save Opportunity if exists
    if (oppType && currentMatch.partnerId) {
        await handleCreateOpportunity(currentMatch.partnerId, currentMatch.name);
        // Ensure we mark as met even if no rating was given
        if (!rating) {
             const result = await saveMatchFeedback(currentMatch.partnerId, 0, "gift_only", currentMatch.id);
             if (result?.error) {
                toast.error("Erreur validation: " + result.error);
                return;
             }
        }
    }
    
    // 3. Fallback: If neither rating nor opportunity, but call happened, we must close the match
    if (!rating && !oppType && currentMatch.partnerId) {
         // Default close with no specific rating (or neutral)
         const result = await saveMatchFeedback(currentMatch.partnerId, 3, "completed", currentMatch.id);
         if (result?.error) {
            toast.error("Erreur validation: " + result.error);
            return;
         }
    }

    // 3. Finalize
    // FORCE UI UPDATE IMMEDIATELY
    setStep('validated');
    setIsValidationOpen(false);
    confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
    
    // Optimistic Update: Update local state to prevent flicker on refresh
    // We modify the current matches array in memory if possible, or rely on revalidation
    if (matches && matches.length > 0) {
        matches[0].status = 'met';
        matches[0].hasFeedback = true;
    }
    
    if (callHappened !== false) {
        toast.success("Mission validée ! 🚀");
    } else {
        toast.success("Absence validée");
    }
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
  };

  const handleCopyPhone = (phone: string) => {
      navigator.clipboard.writeText(phone);
      toast.success("Numéro copié ! 📋");
      triggerCallRewards();
      setStep('called');
      setIsWhatsAppOpen(false);
  };

  const handleCallAction = () => {
      triggerCallRewards();
      setStep('called');
      setIsWhatsAppOpen(false);
  };

  // RENDER LOGIC
  const now = new Date();
  const isWeekend = now.getDay() === 6 || now.getDay() === 0;

  // Calculate if tomorrow is weekend (for Friday evening / "Job Done" state)
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrowWeekend = tomorrow.getDay() === 6 || tomorrow.getDay() === 0;

  // Weekend State - Clean & Warm
  if (!currentMatch) {
      if (isWeekend || isTomorrowWeekend) {
          return <WeekendCard />;
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

  // Prevent hydration mismatch
  if (!mounted) {
      return <div className="w-full max-w-sm mx-auto h-[600px] rounded-[2.5rem] bg-white border border-[#2E130C]/10 animate-pulse" />;
  }

  const match = currentMatch;
  const isCallOut = match.type === 'call_out';

  const mySlots = match.mySlots || [];
  const partnerSlots = match.partnerSlots || [];
  const commonSlots = mySlots.filter((s: string) => partnerSlots.includes(s));
  const hasMismatch = mySlots.length > 0 && partnerSlots.length > 0 && commonSlots.length === 0;

  const today = new Date().toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' });
  const isFuture = match.date > today;
  
  // Future Match (Teaser)
  if (isFuture) {
      return (
          <MysteryCard onReveal={() => {}} match={match} locked={true}>
               <Button 
                    className="w-full h-12 bg-white text-indigo-900 border border-indigo-100 rounded-xl font-black text-sm mb-3 flex items-center justify-center gap-2 transition-all hover:bg-indigo-50 hover:scale-[1.02] shadow-lg shadow-indigo-900/5 animate-pulse-slow group/cal"
                    onClick={(e) => {
                        e.stopPropagation();
                        // Generate Google Calendar Link
                        const title = `Call Réseau avec ${match.name.split(' ')[0]} ⚡️`;
                        const details = "Rappel Popey : Échange de 15 min pour booster votre réseau. Objectif : Faire connaissance et explorer les synergies.";
                        const location = "Par téléphone";
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

  // Founder Match
  const isFounderMatch = match.partnerId === 'popey-founder' || match.name?.toLowerCase().includes("jean-philippe");
  const isRescue = match.tags?.includes('rescue');

  const nextMatch = matches.length > 1 ? matches[1] : {
      id: 'teaser-future',
      partnerId: 'teaser-next',
      name: 'Un membre',
      job: 'Entrepreneur',
      city: 'Local', // Default or random
      collabsCount: 1,
      score: 5.0,
      tags: ['Entrepreneur']
  };

  if (!revealed) {
      return <MysteryCard onReveal={handleReveal} match={match} />;
  }

  // Validated State
  if (step === 'validated') {
      // Check if tomorrow is weekend
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrowWeekend = tomorrow.getDay() === 6 || tomorrow.getDay() === 0;

      if (isTomorrowWeekend) {
          return <WeekendCard />;
      }

      return <MysteryCard onReveal={() => {}} match={nextMatch} locked={true} />;
  }

  if (isFounderMatch) {
      const handleFounderCall = async () => {
          const type = isRescue ? "rescue" : "onboarding";
          try {
              const result = await notifyFounderCall(type);
              if (result.success) {
                  toast.success("Demande envoyée ! 📞", { description: "Jean-Philippe a été notifié." });
                  setStep('validated'); // Force validation state to trigger Weekend Card
              } else {
                  toast.error("Erreur lors de l'envoi", { description: result.error });
              }
          } catch (e) {
              toast.error("Erreur de connexion");
          }
      };

      return <FounderCardPreview type={isRescue ? "rescue" : "onboarding"} onConfirm={handleFounderCall} />;
  }

  // MATCH CARD (REVEALED) - Clean Light Design
  return (
    <div className="relative w-full max-w-sm mx-auto min-h-[600px] h-auto rounded-[2.5rem] overflow-hidden shadow-2xl bg-white border border-[#2E130C]/10 flex flex-col items-center justify-between text-center p-6 pb-8 group">
      
      {/* Subtle Background */}
      <div className="absolute inset-0 bg-[#F3F0E7] opacity-30 z-0"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] z-0"></div>
      
      {/* Content */}
      <div className="relative z-10 w-full flex flex-col items-center h-full pt-4">
        
        {/* FOMO Badge (Top) */}
        <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-4 bg-[#25D366]/10 text-[#25D366] px-4 py-2 rounded-2xl flex flex-col items-center justify-center shadow-sm text-center gap-1 border border-[#25D366]/20 w-full max-w-[90%]"
        >
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-[#1DA851]">
                <MessageSquare className="w-3 h-3 animate-pulse fill-current" />
                C'est à vous d'envoyer le message
            </div>
            <div className="flex items-center gap-2">
                 <span className="font-medium text-[10px] text-[#2E130C]/60 uppercase tracking-wider">Objectif : briser la glace aujourd'hui</span>
            </div>
        </motion.div>

        {/* Avatar with Rotating Rings */}
        <div className="relative mb-4">
            {/* Outer Ring - Slow Rotation */}
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-4 rounded-full border border-slate-200 border-dashed"
            />
            {/* Middle Ring - Reverse Rotation */}
            <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-2 rounded-full border border-blue-200 border-dotted"
            />
            
            <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-r from-slate-200 via-blue-200 to-purple-200 shadow-xl relative z-10">
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-white relative bg-slate-100">
                    {match.avatar ? (
                        <Image 
                            src={match.avatar} 
                            alt={match.name} 
                            fill 
                            className="object-cover transform transition-transform hover:scale-110 duration-700"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <User className="h-10 w-10 text-slate-400" />
                        </div>
                    )}
                </div>
            </div>
            
            {/* Status Indicator */}
            <div className="absolute bottom-1 right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center z-20 shadow-sm">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping"></span>
                <div className="relative w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
        </div>

        {/* Name & View Profile */}
        <div className="mb-4 flex flex-col items-center gap-2">
            <h2 className="text-3xl font-black text-[#2E130C] leading-none">
                {match.name.split(' ')[0]}
            </h2>
            <Button 
                asChild
                variant="outline" 
                className="h-7 text-[10px] px-3 bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-full uppercase font-bold tracking-wider transition-all hover:scale-105"
                onClick={() => trackEvent('click_profile', { partnerId: match.partnerId })}
            >
                <Link href={`/mon-reseau-local/dashboard/profile/${match.partnerId}`}>
                    <User className="w-3 h-3 mr-1.5" /> Voir profil
                </Link>
            </Button>
        </div>

        {/* Quote (Replaced with specific details) */}
        <div className="mb-6 px-2 w-full text-center">
            <p className="text-[#2E130C]/70 text-sm font-medium italic leading-relaxed">
                Ce {match.job || 'partenaire'} peut vous ouvrir des opportunités inédites.
            </p>
        </div>

            {/* Goals Grid (Direct Needs & Offers) */}
        <div className="grid grid-cols-2 gap-3 w-full mb-auto">
            {/* My Goal (Ce que je recherche) */}
            <Dialog open={isMyProfileOpen} onOpenChange={setIsMyProfileOpen}>
                <DialogTrigger asChild>
                    <div 
                        className="bg-indigo-50 border-indigo-100 rounded-xl p-3 text-left border relative cursor-pointer hover:bg-indigo-100 transition-colors group/mygoal"
                    >
                        <div className="absolute top-2 right-2 opacity-0 group-hover/mygoal:opacity-100 transition-opacity">
                            <Search className="w-3 h-3 text-indigo-400" />
                        </div>
                        <div className="flex items-center gap-1.5 mb-2">
                            <Target className="w-3.5 h-3.5 text-indigo-500" />
                            <span className="text-[9px] font-black text-indigo-700 uppercase tracking-wider">Ce que je cherche</span>
                        </div>
                        <p className="text-[11px] font-bold leading-tight line-clamp-3 text-[#2E130C]">
                            {currentUserProfile?.current_goals && currentUserProfile.current_goals.length > 0
                                ? GOAL_LABELS[currentUserProfile.current_goals[0]] || currentUserProfile.current_goals[0]
                                : "Développer mon activité"}
                        </p>
                        <div className="mt-2 text-[9px] text-indigo-500 font-bold underline decoration-indigo-200">Voir mon profil détaillé</div>
                    </div>
                </DialogTrigger>
                <DialogContent className="bg-white border-[#2E130C]/10 text-[#2E130C] sm:max-w-md rounded-2xl w-[90vw] max-h-[85vh] overflow-y-auto" aria-describedby="my-profile-desc">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-black text-indigo-600">
                            <Target className="h-6 w-6" /> Mon Profil Réseau
                        </DialogTitle>
                        <DialogDescription id="my-profile-desc" className="text-sm text-[#2E130C]/60">
                            Voici comment les autres membres voient vos besoins et ce que vous pouvez offrir.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 space-y-2">
                            <h4 className="text-xs font-bold text-indigo-600 uppercase flex items-center gap-2">
                                <Target className="h-4 w-4" /> Mes Besoins (Ce que je cherche)
                            </h4>
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-[#2E130C]/80">
                                    <span className="font-bold">Objectif principal :</span> {currentUserProfile?.current_goals && currentUserProfile.current_goals.length > 0 ? GOAL_LABELS[currentUserProfile.current_goals[0]] || currentUserProfile.current_goals[0] : "Non défini"}
                                </p>
                                {currentUserProfile?.receive_profile?.comm_goal && (
                                    <p className="text-sm font-medium text-[#2E130C]/80">
                                        <span className="font-bold">Message :</span> {currentUserProfile.receive_profile.comm_goal}
                                    </p>
                                )}
                                {currentUserProfile?.receive_profile?.target_companies && currentUserProfile.receive_profile.target_companies.length > 0 && (
                                    <p className="text-sm font-medium text-[#2E130C]/80">
                                        <span className="font-bold">Cibles :</span> {currentUserProfile.receive_profile.target_companies.join(', ')}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 space-y-2">
                            <h4 className="text-xs font-bold text-emerald-600 uppercase flex items-center gap-2">
                                <Gift className="h-4 w-4" /> Mes Offres (Ce que je donne)
                            </h4>
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-[#2E130C]/80">
                                    <span className="font-bold">Superpouvoir :</span> {currentUserProfile?.superpower || "Mon expertise"}
                                </p>
                                {currentUserProfile?.give_profile?.influence_sectors && currentUserProfile.give_profile.influence_sectors.length > 0 && (
                                    <p className="text-sm font-medium text-[#2E130C]/80">
                                        <span className="font-bold">Secteurs :</span> {currentUserProfile.give_profile.influence_sectors.join(', ')}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* His Goal (Ce qu'il recherche) */}
            <Dialog open={isPartnerProfileOpen} onOpenChange={setIsPartnerProfileOpen}>
                <DialogTrigger asChild>
                    <div 
                        className="bg-purple-50 border-purple-100 rounded-xl p-3 text-left border relative cursor-pointer hover:bg-purple-100 transition-colors group/hisgoal"
                    >
                        <div className="absolute top-2 right-2 opacity-0 group-hover/hisgoal:opacity-100 transition-opacity">
                            <Search className="w-3 h-3 text-purple-400" />
                        </div>
                        <div className="flex items-center gap-1.5 mb-2">
                            <Search className="w-3.5 h-3.5 text-purple-500" />
                            <span className="text-[9px] font-black uppercase tracking-wider text-purple-700">Ce qu'il cherche</span>
                        </div>
                        <p className="text-[11px] font-bold leading-tight line-clamp-3 text-[#2E130C]">
                            {match.current_need || (match.current_goals && match.current_goals.length > 0 ? GOAL_LABELS[match.current_goals[0]] : "Développer son réseau")}
                        </p>
                        <div className="mt-2 text-[9px] text-purple-500 font-bold underline decoration-purple-200">Voir son profil détaillé</div>
                    </div>
                </DialogTrigger>
                <DialogContent className="bg-white border-[#2E130C]/10 text-[#2E130C] sm:max-w-md rounded-2xl w-[90vw] max-h-[85vh] overflow-y-auto" aria-describedby="partner-profile-desc">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-black text-purple-600">
                            <Search className="h-6 w-6" /> Profil de {match.name.split(' ')[0]}
                        </DialogTitle>
                        <DialogDescription id="partner-profile-desc" className="text-sm text-[#2E130C]/60">
                            Détail de ce que votre partenaire recherche et ce qu'il peut vous apporter.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 space-y-2">
                            <h4 className="text-xs font-bold text-purple-600 uppercase flex items-center gap-2">
                                <Search className="h-4 w-4" /> Ses Besoins
                            </h4>
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-[#2E130C]/80">
                                    <span className="font-bold">Objectif principal :</span> {match.current_need || (match.current_goals && match.current_goals.length > 0 ? GOAL_LABELS[match.current_goals[0]] : "Non défini")}
                                </p>
                                {match.receive_profile?.comm_goal && (
                                    <p className="text-sm font-medium text-[#2E130C]/80">
                                        <span className="font-bold">Message :</span> {match.receive_profile.comm_goal}
                                    </p>
                                )}
                                {match.receive_profile?.target_companies && match.receive_profile.target_companies.length > 0 && (
                                    <p className="text-sm font-medium text-[#2E130C]/80">
                                        <span className="font-bold">Cibles :</span> {match.receive_profile.target_companies.join(', ')}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 space-y-2">
                            <h4 className="text-xs font-bold text-emerald-600 uppercase flex items-center gap-2">
                                <Gift className="h-4 w-4" /> Ses Offres
                            </h4>
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-[#2E130C]/80">
                                    <span className="font-bold">Superpouvoir :</span> {match.superpower || "Son expertise"}
                                </p>
                                {match.give_profile?.influence_sectors && match.give_profile.influence_sectors.length > 0 && (
                                    <p className="text-sm font-medium text-[#2E130C]/80">
                                        <span className="font-bold">Secteurs :</span> {match.give_profile.influence_sectors.join(', ')}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full mt-6">
             
             {/* STEP INITIAL: SHOW ACTION BUTTONS */}
             {step === 'initial' && (
                 <>
                    {/* MAIN WHATSAPP BUTTON */}
                    <Dialog open={isWhatsAppOpen} onOpenChange={setIsWhatsAppOpen}>
                        <DialogTrigger asChild>
                            <Button 
                                onClick={() => {
                                    setIsWhatsAppOpen(true);
                                    trackEvent('click_whatsapp_open', { partnerId: match.partnerId });
                                }}
                                className="w-full h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-base rounded-xl shadow-lg shadow-[#25D366]/20 tracking-wide transition-all hover:scale-[1.02] relative overflow-hidden group/btn"
                            >
                                <MessageSquare className="w-5 h-5 mr-2 relative z-10 fill-current" />
                                <span className="relative z-10">CONTACTER VIA WHATSAPP</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white border-[#2E130C]/10 text-[#2E130C] sm:max-w-md rounded-2xl w-[90vw]" aria-describedby="whatsapp-desc">
                            <DialogHeader>
                                <DialogTitle className="flex flex-col items-center gap-4 text-2xl font-black justify-center pt-4">
                                    <div className="h-20 w-20 rounded-full bg-[#25D366]/10 flex items-center justify-center animate-pulse">
                                        <MessageSquare className="h-10 w-10 text-[#25D366] fill-current" />
                                    </div>
                                    <span>L'Entremetteur</span>
                                </DialogTitle>
                                <DialogDescription id="whatsapp-desc" className="text-center text-[#2E130C]/60 text-base">
                                    Brisons la glace. Voici un message prêt à être envoyé à <span className="text-[#2E130C] font-bold">{match.name.split(' ')[0]}</span> sur WhatsApp pour initier le contact sans friction.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-6">
                                {/* Message Preview Box */}
                                <div className="bg-[#F3F0E7] rounded-xl p-4 border border-[#2E130C]/10 relative shadow-inner">
                                    <div className="absolute -top-3 left-4 bg-[#25D366] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider shadow-sm">
                                        Message généré
                                    </div>
                                    <p className="text-[#2E130C] text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                        {`Salut ${match.name.split(' ')[0]}, c'est ${currentUserProfile?.first_name || currentUserProfile?.display_name?.split(' ')[0] || currentUserProfile?.name?.split(' ')[0] || "Jean-Philippe"} ! On a matché aujourd'hui sur Popey.Academy. J'ai vu que tu étais ${match.job || "dirigeant"}, ça m'intéresse ! Dispo pour un appel rapide ou un vocal aujourd'hui ou demain ?`}
                                        {currentUserProfile?.featured_link && (
                                            <span className="block mt-4">
                                                Ps : si tu veux en savoir un peu plus sur moi voici mon lien : {currentUserProfile.featured_link}
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-xs text-[#2E130C]/50 mt-3 italic">
                                        (Vous pourrez le modifier dans WhatsApp avant de l'envoyer)
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <Button 
                                        onClick={handleWhatsAppRedirect}
                                        className="w-full h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-lg rounded-xl shadow-lg hover:scale-[1.02] transition-transform"
                                    >
                                        <MessageSquare className="w-5 h-5 mr-2 fill-current" />
                                        OUVRIR WHATSAPP
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        onClick={() => setIsWhatsAppOpen(false)}
                                        className="w-full text-[#2E130C]/60 hover:text-[#2E130C]"
                                    >
                                        Annuler
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                 </>
             )}
             {step === 'called' && (
                <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl border border-emerald-200 text-sm font-medium text-center">
                        ✅ Vous avez été redirigé vers WhatsApp. 
                        <br/>
                        <span className="text-xs opacity-80">Revenez ici une fois l'échange terminé pour valider.</span>
                    </div>

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
                            <Button className="w-full h-20 rounded-2xl bg-[#B20B13] text-white hover:bg-[#8B090F] hover:scale-[1.02] transition-all shadow-xl relative z-10 flex flex-col items-center justify-center gap-1">
                                <CheckCircle2 className="h-6 w-6" />
                                <span className="text-xs font-black uppercase tracking-wider">Terminer la mission</span>
                            </Button>
                        </DialogTrigger>
                        {/* VALIDATION WIZARD CONTENT (Re-inserted here) */}
                        <DialogContent className="bg-white border-[#2E130C]/10 text-[#2E130C] sm:max-w-md rounded-2xl w-[95vw] min-h-[400px] flex flex-col justify-center transition-all duration-300" aria-describedby="validation-desc">
                            {/* PROGRESS INDICATOR */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-[#2E130C]/5">
                                <motion.div 
                                    className="h-full bg-emerald-500"
                                    initial={{ width: "0%" }}
                                    animate={{ 
                                        width: popupView === 'step1_status' ? "33%" : popupView === 'step2_rating' ? "66%" : "100%" 
                                    }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>

                            {/* HEADER */}
                            <DialogHeader className="mb-6 mt-4">
                                <DialogTitle className="text-center text-3xl font-black text-[#2E130C]">
                                    {popupView === 'step1_status' ? "Bilan de la mission" : popupView === 'step2_rating' ? "Notez l'échange" : "Offrir une opportunité"}
                                </DialogTitle>
                                <DialogDescription id="validation-desc" className="sr-only">
                                    Validation de la mission du jour
                                </DialogDescription>
                            </DialogHeader>
                            
                            {/* VIEW 1: STATUS CALL */}
                            {popupView === 'step1_status' && (
                                <div className="flex flex-col gap-6 p-2">
                                    <div className="bg-[#F3F0E7] p-6 rounded-2xl border border-[#2E130C]/5 text-center space-y-6">
                                        <Label className="text-[#2E130C]/60 uppercase text-xs font-bold tracking-wider block">L'appel a-t-il eu lieu ?</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Button 
                                                onClick={() => {
                                                    setCallHappened(true);
                                                    setPopupView('step2_rating');
                                                }} 
                                                variant="outline"
                                                className="h-24 flex flex-col gap-2 font-bold border-emerald-500/30 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:scale-105 transition-all"
                                            >
                                                <PhoneCall className="w-8 h-8" />
                                                <span className="text-lg">OUI ✅</span>
                                            </Button>
                                            <Button 
                                                onClick={() => setCallHappened(false)} 
                                                variant="outline"
                                                className={cn(
                                                    "h-24 flex flex-col gap-2 font-bold border-red-500/30 transition-all",
                                                    callHappened === false ? "bg-red-500 text-white hover:bg-red-600" : "bg-red-50 text-red-500 hover:bg-red-100 hover:scale-105"
                                                )}
                                            >
                                                <Phone className="w-8 h-8 rotate-135" />
                                                <span className="text-lg">NON ❌</span>
                                            </Button>
                                        </div>
                                    </div>
                                    {callHappened === false && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                            <Button onClick={handleValidate} className="w-full h-14 text-lg font-black bg-[#2E130C] text-white hover:bg-[#2E130C]/90 rounded-xl shadow-lg">
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
                                            onClick={() => setRating('fire')}
                                            className={cn(
                                                "flex-1 aspect-square rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all group relative overflow-hidden",
                                                rating === 'fire' 
                                                    ? "bg-orange-50 border-orange-500 ring-2 ring-orange-200 scale-105" 
                                                    : "bg-white border-[#2E130C]/10 hover:bg-orange-50 hover:scale-105"
                                            )}
                                        >
                                            <span className="text-4xl group-hover:scale-125 transition-transform">🔥</span>
                                            <span className="text-xs uppercase font-black text-orange-500">Top</span>
                                        </button>
                                        <button 
                                            onClick={() => setRating('good')}
                                            className={cn(
                                                "flex-1 aspect-square rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all group relative overflow-hidden",
                                                rating === 'good' 
                                                    ? "bg-blue-50 border-blue-500 ring-2 ring-blue-200 scale-105" 
                                                    : "bg-white border-[#2E130C]/10 hover:bg-blue-50 hover:scale-105"
                                            )}
                                        >
                                            <span className="text-4xl group-hover:scale-125 transition-transform">👍</span>
                                            <span className="text-xs uppercase font-black text-blue-500">Bien</span>
                                        </button>
                                        <button 
                                            onClick={() => { setRating('meh'); setSelectedBadge(null); setPopupView('step3_gift'); }}
                                            className="flex-1 aspect-square rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all bg-white border-[#2E130C]/10 hover:bg-slate-50 hover:scale-105 group"
                                        >
                                            <span className="text-4xl group-hover:scale-125 transition-transform">😐</span>
                                            <span className="text-xs uppercase font-black text-slate-400">Bof</span>
                                        </button>
                                    </div>

                                    {/* BADGE SELECTION (Only if Good or Fire) */}
                                    {(rating === 'fire' || rating === 'good') && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="space-y-3 pt-2 border-t border-[#2E130C]/5"
                                        >
                                            <Label className="text-xs uppercase font-bold text-[#2E130C]/60 text-center block">
                                                Pourquoi ? (Optionnel)
                                            </Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {REPUTATION_BADGES.map((badge) => (
                                                    <button
                                                        key={badge.id}
                                                        onClick={() => setSelectedBadge(badge.id)}
                                                        className={cn(
                                                            "flex items-center gap-2 p-2 rounded-lg border text-left transition-all",
                                                            selectedBadge === badge.id 
                                                                ? "bg-[#2E130C] border-[#2E130C] text-white" 
                                                                : "bg-white border-[#2E130C]/10 text-[#2E130C]/80 hover:bg-slate-50"
                                                        )}
                                                    >
                                                        <span className="text-lg">{badge.icon}</span>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-bold uppercase">{badge.label}</span>
                                                            <span className="text-[9px] opacity-70 leading-none">{badge.desc}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                            <Button 
                                                onClick={() => setPopupView('step3_gift')} 
                                                className="w-full bg-[#2E130C] text-white hover:bg-[#2E130C]/90 font-bold mt-2"
                                            >
                                                Continuer <ChevronRight className="w-4 h-4 ml-1" />
                                            </Button>
                                        </motion.div>
                                    )}

                                    {!rating && (
                                        <Button variant="ghost" onClick={() => setPopupView('step1_status')} className="w-full text-slate-500">Retour</Button>
                                    )}
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
                                                        className="group relative flex items-center gap-3 p-3 rounded-xl border border-[#2E130C]/10 bg-white hover:bg-slate-50 hover:border-purple-300 hover:shadow-sm transition-all text-left"
                                                    >
                                                        <div className={cn("shrink-0 h-10 w-10 rounded-full flex items-center justify-center bg-slate-100", type.color)}>
                                                            <Icon className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="text-sm font-bold text-[#2E130C] group-hover:text-purple-700 transition-colors">
                                                                {type.label}
                                                            </div>
                                                            <div className="text-[10px] text-[#2E130C]/60 font-medium leading-tight">
                                                                {type.cardLabel || type.description}
                                                            </div>
                                                        </div>
                                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <ChevronRight className="w-4 h-4 text-purple-500" />
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
                                                className="flex items-center justify-between bg-purple-50 p-3 rounded-xl border border-purple-200"
                                            >
                                                <span className="text-sm font-bold text-purple-700 flex items-center gap-2">
                                                    <Gift className="w-4 h-4" /> {OPPORTUNITY_TYPES.find(t => t.id === oppType)?.label}
                                                </span>
                                                <button onClick={() => setOppType(undefined)} className="text-xs text-purple-600 underline hover:text-purple-800">Changer</button>
                                            </motion.div>
                                            
                                            <div className="space-y-2">
                                                <Label className="text-xs text-[#2E130C]/60 uppercase font-bold ml-1">Message (Optionnel)</Label>
                                                <Textarea 
                                                    className="w-full bg-slate-50 border border-[#2E130C]/10 rounded-xl p-3 text-sm text-[#2E130C] min-h-[80px] focus:ring-1 focus:ring-purple-500 outline-none resize-none placeholder:text-slate-400"
                                                    placeholder="Ex: Je te mets en relation avec..."
                                                    value={oppDetails}
                                                    onChange={(e) => setOppDetails(e.target.value)}
                                                />
                                            </div>

                                            <Button onClick={handleValidate} className="w-full h-14 text-lg font-black bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-900/10 transform transition-all hover:scale-[1.02]">
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
                </div>
             )}

        </div>
        
        {/* HIDDEN DIALOGS (To ensure content is available) */}
      </div>
    </div>
  );
}