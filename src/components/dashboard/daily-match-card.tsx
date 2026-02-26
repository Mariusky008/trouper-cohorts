"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Clock, Star, MapPin, Phone, CheckCircle2, MessageSquare, ArrowRight, Calendar, User, Briefcase, Zap, Trophy, Handshake, Gift, PhoneCall, Info, Copy, Target, Search, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createOpportunity } from "@/lib/actions/network-opportunities";
import { saveMatchFeedback } from "@/lib/actions/network-feedback";
import { incrementUserPoints } from "@/lib/actions/gamification";
import { trackEvent } from "@/lib/actions/analytics";

import { OPPORTUNITY_TYPES } from "@/constants/opportunities";
import { OpportunityType } from "@/types/network";

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

export function DailyMatchCard({ matches, userStreak = 0, userId }: DailyMatchCardProps) {
  // Immersive Dating App Style Redesign
  // Date Formatting
  const now = new Date();
  const dayName = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(now);
  const dayNumber = new Intl.DateTimeFormat('fr-FR', { day: 'numeric' }).format(now);
  const monthYear = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(now);
  
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  // Logic: "Why this match" script
  // If user has specific superpower/need, use it. Otherwise generic.
  const hasGiveTake = matches[0]?.superpower && matches[0]?.current_need;
  
  const [callMade, setCallMade] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [revealed, setRevealed] = useState(false); // State for the "Loot Box" reveal

  const [isWhyVisible, setIsWhyVisible] = useState(false);

  // Opportunity Modal State
  const [isOpportunityOpen, setIsOpportunityOpen] = useState(false);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  
  // Use proper typing and default to null to force selection
  const [oppType, setOppType] = useState<string | undefined>(undefined);
  const [oppDetails, setOppDetails] = useState("");
  const [isSubmittingOpp, setIsSubmittingOpp] = useState(false);

  // Reset form when dialog opens/closes
  useEffect(() => {
      if (!isOpportunityOpen) {
          setOppType(undefined);
          setOppDetails("");
      }
  }, [isOpportunityOpen]);

  const handleRate = async (score: number, tag: string, partnerId: string) => {
      setIsRatingOpen(false);
      
      // Fun feedback based on score
      if (score === 5) confetti({ particleCount: 200, spread: 100, colors: ['#10b981', '#fbbf24'] }); // Green & Gold
      else if (score === 4) confetti({ particleCount: 50, spread: 50 });
      
      toast.success("Feedback enregistré ! 📝", {
          description: `Vous avez qualifié l'échange de "${tag}"`
      });
      
      // Save to DB
      await saveMatchFeedback(partnerId, score, tag);
  };

  const handleCreateOpportunity = async (partnerId: string, partnerName: string) => {
      if (!oppType) {
          toast.error("Veuillez sélectionner un type d'opportunité");
          return;
      }

      if (!oppDetails.trim()) {
          toast.error("Veuillez décrire l'opportunité");
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

  // Countdown Logic (Mocked based on slot)
  useEffect(() => {
     if (!matches || matches.length === 0) return;
     
     const calculateTimeLeft = () => {
         const matchTime = matches[0]?.time || "09h – 11h";
         const startHour = parseInt(matchTime.split('h')[0]);
         const now = new Date();
         const currentHour = now.getHours();
         
         if (currentHour < startHour) {
             const diff = startHour - currentHour;
             setTimeLeft(`Ouvre dans ${diff}h`);
         } else if (currentHour >= startHour && currentHour < startHour + 2) {
             setTimeLeft("C'est l'heure ! 🔥");
         } else {
             setTimeLeft("Créneau passé");
         }
     };
     
     calculateTimeLeft();
     const interval = setInterval(calculateTimeLeft, 60000);
     return () => clearInterval(interval);
  }, [matches]);

  const handleReveal = () => {
      setRevealed(true);

      if (userId) {
          const today = new Date().toISOString().split('T')[0];
          const key = `daily_scan_revealed_${userId}_${today}`;
          localStorage.setItem(key, 'true');
      }

      // Small confetti burst for reveal
      confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
      });
  };

  const [isPhoneOpen, setIsPhoneOpen] = useState(false);

  const triggerCallRewards = async () => {
      if (callMade) return;
      
      setCallMade(true);
      
      // 1. Confetti Explosion
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      // 2. Increment Points in Database
      try {
          await incrementUserPoints(20);
          toast.success("Points ajoutés ! 🏆");
      } catch (error) {
          console.error("Failed to add points", error);
          toast.error("Erreur lors de l'ajout des points");
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

  // Countdown Logic
  const [countdown, setCountdown] = useState("00:00:00");

  useEffect(() => {
    // Only run if NO matches (waiting state)
    if (matches && matches.length > 0) return;

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 1);
    targetDate.setHours(8, 0, 0, 0); // Tomorrow 08:00

    const interval = setInterval(() => {
        const now = new Date();
        const diff = targetDate.getTime() - now.getTime();

        if (diff <= 0) {
            setCountdown("00:00:00");
            // Optional: Reload page when timer hits zero
            return;
        }

        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        setCountdown(
            `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        );
    }, 1000);

    return () => clearInterval(interval);
  }, [matches]);

  if (!matches || matches.length === 0) {
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    if (isWeekend) {
      return (
        <div className="relative max-w-md mx-auto w-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-8 bg-[#0f172a]/80 backdrop-blur-xl rounded-[2.5rem] border-2 border-dashed border-blue-500/20 shadow-2xl relative overflow-hidden"
          >
            {/* Animated Background Elements */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 bg-blue-600/10 rounded-full blur-[80px] animate-pulse"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-64 w-64 bg-purple-600/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            
            <div className="relative z-10">
              <div className="h-28 w-28 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center mb-8 mx-auto border border-white/10 shadow-lg">
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 10, 0],
                    scale: [1, 1.1, 1, 1.1, 1]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <Coffee className="h-14 w-14 text-blue-400" />
                </motion.div>
              </div>

              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 mb-4 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em]">
                Mode Repos Activé ⚓️
              </Badge>
              
              <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4 leading-none">
                C'est le <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Week-End !</span>
              </h3>
              
              <p className="text-lg text-slate-400 font-medium leading-relaxed mb-8 max-w-xs mx-auto">
                Pas de match aujourd'hui. Profitez de ce repos bien mérité pour recharger les batteries. 🔋
              </p>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left space-y-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  </div>
                  <p className="text-sm font-bold text-slate-200 leading-tight">Missions de la semaine terminées</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                    <Zap className="h-6 w-6 text-blue-400" />
                  </div>
                  <p className="text-sm font-bold text-slate-200 leading-tight">Analyse IA en pause jusqu'à lundi</p>
                </div>
              </div>

              <p className="text-sm font-black text-slate-500 uppercase tracking-widest">
                Rendez-vous lundi à 08h00 🚀
              </p>
            </div>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="relative max-w-md mx-auto w-full">
         {/* MYSTERY OVERLAY FOR FIRST TIME USERS */}
         {!revealed && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                className="absolute inset-0 z-20 bg-[#0f172a] rounded-[2.5rem] border-2 border-dashed border-white/20 flex flex-col items-center justify-center p-8 text-center cursor-pointer hover:border-blue-500/50 transition-colors shadow-2xl overflow-hidden"
                onClick={handleReveal}
            >
                {/* Tech Background Effect (Simplified for compatibility) */}
                <div className="absolute inset-0 opacity-10 bg-[url('/grid-pattern.svg')] bg-center bg-repeat" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                
                <div className="h-24 w-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse relative z-10">
                    <Zap className="h-12 w-12 text-blue-400" />
                </div>
                <h3 className="text-3xl font-black text-white uppercase italic mb-2 relative z-10">Initialisation de l'IA</h3>
                <p className="text-slate-400 font-medium mb-8 max-w-xs leading-relaxed text-lg relative z-10">
                    Votre profil est prêt.
                    <br />
                    <span className="text-white font-bold">Lancez l'analyse pour trouver votre binôme idéal.</span>
                </p>
                
                <Button className="bg-white text-slate-900 hover:bg-slate-200 font-black px-8 py-6 rounded-xl text-lg shadow-lg shadow-white/10 w-full animate-bounce-subtle relative z-10">
                    LANCER L'ANALYSE 📡
                </Button>
            </motion.div>
        )}

      <motion.div 
         initial={{ opacity: 0 }}
         animate={{ opacity: revealed ? 1 : 0, filter: revealed ? "blur(0px)" : "blur(10px)" }}
         className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-8 bg-[#1e293b]/50 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl shadow-black/20 relative overflow-hidden"
      >
        {/* Background Decor */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Radar Scan Effect */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border-[2px] border-blue-400/30 rounded-full" 
            />
            <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] border-[2px] border-blue-400/20 rounded-full" 
            />
        </div>

        <div className="relative z-10 max-w-md mx-auto">
            <div className="flex flex-col items-center mb-8">
                <div className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Prochaine Opportunité</div>
                <div className="font-black text-6xl text-white tabular-nums tracking-tight drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse">
                    {countdown}
                </div>
            </div>
            
            <h3 className="text-2xl font-black text-white leading-tight mb-4">
                Analyse en cours... 📡
            </h3>
            
            <p className="text-lg text-slate-400 font-medium leading-relaxed mb-8">
                Pour garantir un match de qualité, notre algorithme compare votre profil avec <span className="text-white font-bold bg-white/10 px-1 rounded">+50 opportunités locales</span>.
            </p>

            <div className="bg-[#0f172a]/50 p-6 rounded-2xl border border-white/5 text-left mb-8">
                <div className="flex items-start gap-4 mb-4">
                    <div className="h-8 w-8 bg-white/10 rounded-full flex items-center justify-center border border-white/5 shrink-0 font-bold text-white shadow-sm">1</div>
                    <div>
                        <p className="font-bold text-white">Définissez vos disponibilités</p>
                        <p className="text-sm text-slate-400">Juste en dessous, dites-nous quand vous êtes libre demain.</p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="h-8 w-8 bg-white/10 rounded-full flex items-center justify-center border border-white/5 shrink-0 font-bold text-white shadow-sm">2</div>
                    <div>
                        <p className="font-bold text-white">Revenez demain</p>
                        <p className="text-sm text-slate-400">Votre match apparaîtra ici même à 08h00.</p>
                    </div>
                </div>
            </div>

            <div className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-400 px-4 py-2 rounded-xl text-xs font-bold border border-orange-500/20">
                <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse"></div>
                Astuce : Mettez une alarme pour ne pas oublier !
            </div>
        </div>
      </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {matches.map((match, index) => {
        // Double check expiration on client side
        const todayStr = now.toISOString().split('T')[0];
        // ... (expiration logic same as before if needed, but assuming server handles it mostly)

        const isCallOut = match.type === 'call_out';
        
        // Generate "Why this match" text
        const goalLabel = match.current_goals && match.current_goals.length > 0 
            ? GOAL_LABELS[match.current_goals[0]]?.toLowerCase() 
            : "développer son activité";
            
        let whyText = `"${match.name} cherche activement à ${goalLabel}. Vos profils sont complémentaires : vous allez pouvoir vous aider mutuellement."`;
        
        // Use Real Give & Take Data if available
        if (match.current_need && match.superpower) {
            whyText = `🎯 ${match.name} a besoin de : "${match.current_need}". \n🎁 En échange, il peut vous offrir : "${match.superpower}".`;
        }

        return (
        <div className="relative w-full max-w-sm mx-auto h-[75vh] md:h-[600px] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/50 border border-white/10 bg-[#0f172a] group transition-all hover:scale-[1.01] select-none">
            
            {/* LOOT BOX / MYSTERY CARD OVERLAY */}
            {!revealed && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                    className="absolute inset-0 z-50 bg-[#0f172a] flex flex-col items-center justify-center p-8 text-center cursor-pointer"
                    onClick={handleReveal}
                >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-20 bg-[url('/grid-pattern.svg')] bg-center" />
                    
                    <div className="h-24 w-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse relative z-10 border border-blue-500/20">
                        <Zap className="h-12 w-12 text-blue-400" />
                    </div>
                    <h3 className="text-3xl font-black text-white uppercase italic mb-2 relative z-10">Mission Secrète</h3>
                    <p className="text-slate-400 font-medium mb-8 max-w-xs leading-relaxed text-sm relative z-10">
                        Nouveau client ? Partage réseau ? Conseil précieux ?
                        <br />
                        <span className="text-white font-bold">Découvrez votre binôme du jour !</span>
                    </p>
                    <Button className="bg-white text-slate-900 hover:bg-slate-200 font-black px-8 py-6 rounded-full text-lg shadow-lg shadow-white/10 w-full animate-bounce-subtle relative z-10">
                        DÉCOUVRIR LE MATCH
                    </Button>
                </motion.div>
            )}

            {/* 1. BACKGROUND IMAGE (FULL COVER) */}
            <div className="absolute inset-0 z-0 bg-slate-800">
                {match.avatar ? (
                    <Image 
                        src={match.avatar} 
                        alt={match.name} 
                        fill 
                        className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                        priority
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-600">
                        <User className="h-32 w-32" />
                    </div>
                )}
                {/* Gradient Overlay for Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1c] via-[#0a0f1c]/40 to-transparent" />
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#0a0f1c]/80 to-transparent" />
            </div>

            {/* 2. TOP HEADER (Date & Status) */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-10 pointer-events-none">
                <div className="pointer-events-auto">
                    <h3 className="text-white font-black text-2xl drop-shadow-md shadow-black">{capitalize(dayName)} {dayNumber}</h3>
                    <p className="text-slate-300 text-xs font-bold uppercase tracking-wider drop-shadow-md">{match.time}</p>
                </div>
                <Badge className={cn(
                    "backdrop-blur-md border-white/20 text-white px-3 py-1.5 rounded-2xl flex flex-col items-center gap-0.5 shadow-lg font-bold uppercase text-[10px] tracking-wide pointer-events-auto text-center min-w-[140px]",
                    isCallOut ? "bg-emerald-600/90 hover:bg-emerald-600 shadow-emerald-500/20" : "bg-blue-600/90 hover:bg-blue-600 shadow-blue-500/20"
                )}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <div className={cn("h-2 w-2 rounded-full bg-white", isCallOut && "animate-pulse")} />
                        <span>{isCallOut ? "C'EST À VOUS D'APPELER" : "ATTENDEZ SON APPEL"}</span>
                    </div>
                    
                    <span className="opacity-80 text-[9px]">
                        {isCallOut 
                            ? `Entre ${match.time.split('h')[0]}h00 et ${match.time.split('h')[0]}h15`
                            : `Entre ${match.time.split('h')[0]}h00 et ${match.time.split('h')[0]}h15`
                        }
                    </span>
                </Badge>
            </div>

            {/* 3. MAIN INFO (BOTTOM OVERLAY) */}
            <div className="absolute bottom-28 left-6 right-6 z-10 text-left">
                <div className="flex items-end gap-3 mb-2">
                    <h2 className="text-4xl font-black text-white leading-none drop-shadow-xl shadow-black">
                        {match.name}
                    </h2>
                    <span className="text-2xl text-emerald-400 font-black mb-0.5 drop-shadow-md">{match.score.toFixed(1)}★</span>
                </div>
                
                <p className="text-lg text-slate-200 font-medium flex items-center gap-2 mb-4 drop-shadow-md line-clamp-1">
                    <Briefcase className="h-4 w-4 text-blue-400 fill-blue-400" /> {match.job}
                </p>
                
                {/* "I'm here for..." Card -> REPLACED WITH PROFILE BUTTON */}
                <div className="flex justify-start mt-2">
                    <Button 
                        asChild
                        variant="outline" 
                        className="bg-white/10 hover:bg-white/20 backdrop-blur-md border-white/20 text-white rounded-full px-5 h-10 text-xs font-bold uppercase tracking-wide transition-all hover:scale-105"
                        onClick={() => trackEvent('click_profile', { partnerId: match.partnerId })}
                    >
                        <Link href={`/mon-reseau-local/dashboard/profile/${match.partnerId}`} className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Voir son profil complet
                        </Link>
                    </Button>
                </div>
                
                {/* View Profile Link - REMOVED since we have the button above now */}
            </div>

            {/* 4. ACTION DOCK (FLOATING BOTTOM) */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-5 z-20 px-6">
                
                {/* SCRIPT (WHY) */}
                <Dialog open={isWhyVisible} onOpenChange={setIsWhyVisible}>
                    <DialogTrigger asChild>
                        <Button 
                            size="icon" 
                            className="h-14 w-14 rounded-full bg-slate-800/80 backdrop-blur-md border border-white/10 text-yellow-400 hover:bg-slate-700 hover:scale-110 transition-all shadow-lg"
                            onClick={() => trackEvent('click_why_open', { partnerId: match.partnerId })}
                        >
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

                {/* CALL (MAIN ACTION) */}
                <Dialog open={isPhoneOpen} onOpenChange={setIsPhoneOpen}>
                    <DialogTrigger asChild>
                        <Button 
                            size="icon" 
                            className={`h-20 w-20 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 text-white hover:scale-110 transition-all shadow-xl shadow-emerald-500/30 border-4 border-[#0f172a] relative group ${!callMade && 'animate-pulse'}`}
                            onClick={() => trackEvent('click_call_open', { partnerId: match.partnerId })}
                        >
                            {callMade ? (
                                <PhoneCall className="h-8 w-8 fill-current" />
                            ) : (
                                <Phone className="h-8 w-8 fill-current group-hover:rotate-12 transition-transform" />
                            )}
                        </Button>
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

                {/* GIFT / RATE (MENU) */}
                <div className="flex gap-3">
                    {/* GIFT */}
                    <Dialog open={isOpportunityOpen} onOpenChange={setIsOpportunityOpen}>
                        <DialogTrigger asChild>
                            <Button 
                                size="icon" 
                                className="h-14 w-14 rounded-full bg-slate-800/80 backdrop-blur-md border border-white/10 text-purple-400 hover:bg-slate-700 hover:scale-110 transition-all shadow-lg"
                                onClick={() => trackEvent('click_gift_open', { partnerId: match.partnerId })}
                            >
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
                                                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all hover:scale-105 text-center gap-2 group ${type.bg.replace('bg-', 'bg-opacity-10 bg-')} ${type.border.replace('border-', 'border-opacity-20 border-')}`}
                                                style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
                                            >
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center shadow-sm ${type.color} bg-white/10`}>
                                                    <type.icon className="h-5 w-5" />
                                                </div>
                                                <span className="font-bold text-white text-xs leading-tight">{type.label}</span>
                                                <span className="text-[10px] text-emerald-400 font-bold">+{type.points} pts</span>
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

                    {/* RATE */}
                    <Dialog open={isRatingOpen} onOpenChange={setIsRatingOpen}>
                        <DialogTrigger asChild>
                            <Button 
                                size="icon" 
                                className="h-14 w-14 rounded-full bg-slate-800/80 backdrop-blur-md border border-white/10 text-orange-400 hover:bg-slate-700 hover:scale-110 transition-all shadow-lg"
                                onClick={() => trackEvent('click_rate_open', { partnerId: match.partnerId })}
                            >
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
      })}
    </div>
  );
}
