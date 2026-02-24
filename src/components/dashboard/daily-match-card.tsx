"use client";

import { motion } from "framer-motion";
import { Clock, Star, MapPin, Phone, CheckCircle2, MessageSquare, ArrowRight, Calendar, User, Briefcase, Zap, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

import { incrementUserPoints } from "@/lib/actions/gamification";

interface DailyMatchCardProps {
  matches: any[];
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

export function DailyMatchCard({ matches }: DailyMatchCardProps) {
  // Date Formatting
  const now = new Date();
  const dayName = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(now);
  const dayNumber = new Intl.DateTimeFormat('fr-FR', { day: 'numeric' }).format(now);
  const monthYear = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(now);
  
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const [callMade, setCallMade] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [revealed, setRevealed] = useState(false); // State for the "Loot Box" reveal

  const [isWhyVisible, setIsWhyVisible] = useState(false);

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
      // Small confetti burst for reveal
      confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
      });
  };

  const handleCallClick = async () => {
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
                <h3 className="text-3xl font-black text-white uppercase italic mb-2 relative z-10">Lancement du Protocole</h3>
                <p className="text-slate-400 font-medium mb-8 max-w-xs leading-relaxed text-lg relative z-10">
                    Votre profil est prêt.
                    <br />
                    <span className="text-white font-bold">Cliquez pour lancer la recherche de votre premier partenaire.</span>
                </p>
                
                <Button className="bg-white text-slate-900 hover:bg-slate-200 font-black px-8 py-6 rounded-xl text-lg shadow-lg shadow-white/10 w-full animate-bounce-subtle relative z-10">
                    LANCER L'ALGORITHME 🚀
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
        <div className="absolute inset-0 pointer-events-none opacity-20">
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-blue-500/30 rounded-full" 
            />
            <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] border border-blue-500/20 rounded-full" 
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
                Recherche lancée ! 🚀
            </h3>
            
            <p className="text-lg text-slate-400 font-medium leading-relaxed mb-8">
                L'algorithme analyse actuellement votre profil pour vous trouver <span className="text-white font-bold bg-white/10 px-1 rounded">la meilleure opportunité</span> locale.
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
            
        const whyText = `"${match.name.split(' ')[0]} cherche activement à ${goalLabel}. Vos profils sont complémentaires : vous allez pouvoir vous aider mutuellement."`;

        return (
        <div className="relative max-w-md mx-auto w-full">
            {/* LOOT BOX / MYSTERY CARD OVERLAY */}
            {!revealed && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                    className="absolute inset-0 z-20 bg-[#0f172a] rounded-[2rem] border-2 border-dashed border-white/20 flex flex-col items-center justify-center p-8 text-center cursor-pointer hover:border-blue-500/50 transition-colors shadow-2xl"
                    onClick={handleReveal}
                >
                    <div className="h-20 w-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                        <Zap className="h-10 w-10 text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase italic mb-2">Mission Secrète</h3>
                    <p className="text-slate-400 font-medium mb-8 max-w-xs leading-relaxed">
                        Nouveau client ? Partage réseau ? Conseil précieux ?
                        <br />
                        <span className="text-white font-bold">Découvrez ce que vous allez vous apporter mutuellement !</span>
                    </p>
                    <div className="flex gap-3 mb-8">
                        <Badge variant="outline" className="border-white/10 text-slate-400 bg-white/5 px-3 py-1">
                            Secteur : {match.job.split(' ')[0]}...
                        </Badge>
                        <Badge variant="outline" className="border-red-500/20 text-red-400 bg-red-500/10 px-3 py-1 animate-pulse">
                            Priorité : Haute
                        </Badge>
                    </div>
                    <Button className="bg-white text-slate-900 hover:bg-slate-200 font-black px-8 py-6 rounded-xl text-lg shadow-lg shadow-white/10 w-full animate-bounce-subtle">
                        DÉCOUVRIR LE MATCH
                    </Button>
                </motion.div>
            )}

        <motion.div 
          key={match.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: revealed ? 1 : 0, y: 0, filter: revealed ? "blur(0px)" : "blur(20px)" }}
          transition={{ duration: 0.5 }}
          className="bg-[#1e293b]/80 backdrop-blur-xl rounded-[2rem] p-6 md:p-8 shadow-2xl shadow-black/40 border border-white/10 relative overflow-visible group hover:scale-[1.01] transition-transform duration-300"
        >
          {/* DATE HEADER (Now Inside) */}
          <div className="flex justify-between items-end mb-6 pb-4 border-b border-white/5">
             <div>
               <div className="text-3xl font-black text-white leading-none mb-1">
                 {capitalize(dayName)} {dayNumber}
               </div>
               <div className="text-slate-400 font-bold text-base capitalize">{monthYear}</div>
             </div>
             
             {/* TIMER & STREAK BADGES */}
             <div className="flex items-center gap-2">
                 <div className="hidden md:flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-full">
                    <Zap className="h-3 w-3 text-blue-400 fill-blue-400" />
                    <span className="text-blue-200 text-[10px] font-bold">3 jours</span>
                 </div>
                 <div className="bg-white/5 text-blue-400 p-2 rounded-xl border border-white/5 flex flex-col items-center justify-center min-w-[70px]">
                   <span className="text-[9px] font-bold text-slate-500 uppercase">Appel dans</span>
                   <span className="font-black text-white text-xs">{timeLeft || "--:--"}</span>
                 </div>
             </div>
           </div>

             {/* ORANGE BADGE */}
             <div className="absolute -top-3 right-6 bg-orange-500 text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-orange-900/50 z-10 animate-pulse">
               Opportunité Chaude
             </div>

             {/* PROFILE INFO */}
             <div className="flex flex-col items-center text-center mb-8 transform scale-100">
               <div className="relative mb-4">
                 <Avatar className="h-36 w-36 border-4 border-[#1e293b] shadow-xl">
                    <AvatarImage src={match.avatar} className="object-cover" />
                    <AvatarFallback className="text-3xl font-black bg-slate-800 text-slate-500">{match.name[0]}</AvatarFallback>
                 </Avatar>
                 <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#0f172a] text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1 shadow-md">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Vérifié fiable
                 </div>
               </div>
               
               <h3 className="text-3xl md:text-4xl font-black text-white mb-1.5 mt-3">{match.name}</h3>
               <div className="flex items-center justify-center gap-2 text-sm md:text-base font-bold text-slate-400 uppercase tracking-wide mb-2">
                  {match.job} • {match.city}
               </div>
               <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={cn("h-4 w-4", i <= Math.round(match.score) ? "text-yellow-400 fill-yellow-400" : "text-slate-700")} />
                  ))}
               </div>
             </div>

             {/* WHY THIS MATCH BOX (TOGGLEABLE) */}
             <div className="mb-6 relative flex justify-center">
                {!isWhyVisible ? (
                    <Button 
                        onClick={() => setIsWhyVisible(true)}
                        size="sm"
                        className="bg-[#0f172a] hover:bg-[#1e293b] text-slate-400 hover:text-white border border-white/10 text-[10px] font-bold uppercase tracking-widest rounded-full px-4 h-8 shadow-sm transition-all"
                    >
                        Pourquoi ce match ?
                    </Button>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="bg-[#0f172a]/50 rounded-xl p-4 border border-white/5 relative w-full"
                    >
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#1e293b] px-2 py-0.5 rounded-full border border-white/10 text-[9px] font-bold text-slate-400 uppercase tracking-widest shadow-sm cursor-pointer" onClick={() => setIsWhyVisible(false)}>
                            Pourquoi ce match ?
                        </div>
                        <p className="text-xs text-slate-300 font-medium leading-relaxed text-center italic mt-1.5">
                        {whyText}
                        </p>
                    </motion.div>
                )}
             </div>

             {/* CALL BUTTON / ACTION AREA */}
             {isCallOut ? (
                <div className="space-y-4 mb-6">
                    {!callMade ? (
                        <Button 
                            onClick={handleCallClick}
                            className="w-full font-black h-16 rounded-2xl shadow-lg shadow-blue-600/30 text-lg transition-all border border-white/10 bg-blue-600 hover:bg-blue-500 text-white animate-shimmer bg-[linear-gradient(110deg,#2563eb,45%,#3b82f6,55%,#2563eb)] bg-[length:200%_100%]"
                        >
                            <div className="flex flex-col items-center leading-none gap-1">
                                <span className="flex items-center gap-2">
                                    <Trophy className="h-5 w-5 text-yellow-300" /> CLIQUE POUR TON DÉFI
                                </span>
                                <span className="text-[10px] text-blue-200 font-bold uppercase tracking-widest">(+20 PTS DE CONFIANCE)</span>
                            </div>
                        </Button>
                    ) : (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center animate-in fade-in zoom-in duration-300">
                            <div className="h-12 w-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/30">
                                <Phone className="h-6 w-6 text-white animate-bounce" />
                            </div>
                            <h4 className="text-xl font-black text-white mb-1">C'est parti !</h4>
                            <p className="text-slate-300 text-sm mb-4">Appelez {match.name.split(' ')[0]} sur le créneau prévu : <span className="text-white font-bold">{match.time}</span></p>
                            
                            <a href={`tel:${match.phone}`} className="block bg-[#0f172a] hover:bg-slate-900 text-emerald-400 font-black text-2xl py-4 rounded-xl border border-white/10 transition-colors mb-4 tracking-wider">
                                {match.phone}
                            </a>

                            <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                +20 pts ajoutés à votre score
                            </div>
                        </div>
                    )}
                </div>
             ) : (
                <div className="space-y-2 mb-4">
                    <div className="w-full h-12 bg-[#0f172a]/50 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center gap-0.5 text-slate-400 font-bold">
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-sm">En attente de son appel</span>
                        </div>
                        <span className="text-[10px] font-medium text-slate-500">Prévu entre {match.time}</span>
                    </div>
                    {/* Secondary Action: Call Anyway Button */}
                    <div className="text-center">
                        <Button variant="link" className="text-[10px] text-slate-500 hover:text-white h-auto p-0" asChild>
                            <a href={`tel:${match.phone}`}>
                                En cas d'oubli : Appeler {match.name.split(' ')[0]} ({match.phone})
                            </a>
                        </Button>
                    </div>
                </div>
             )}

             {/* STATS FOOTER (DYNAMIC) */}
             <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0f172a]/50 rounded-lg p-2.5 border border-white/5 shadow-sm text-center">
                   <div className="text-[9px] text-slate-500 font-bold uppercase mb-0.5">Objectif Principal</div>
                   <div className="font-black text-white text-xs leading-tight line-clamp-1">
                      {goalLabel ? capitalize(goalLabel) : "Développement"}
                   </div>
                </div>
                <div className="bg-[#0f172a]/50 rounded-lg p-2.5 border border-white/5 shadow-sm text-center">
                   <div className="text-[9px] text-slate-500 font-bold uppercase mb-0.5">Score de Confiance</div>
                   <div className="font-black text-emerald-400 text-base">{match.score.toFixed(1)}/5</div>
                </div>
             </div>

             {/* SEE PROFILE LINK (IMPROVED) */}
             <div className="mt-4">
                <Button variant="secondary" className="w-full h-9 rounded-lg font-bold text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all" asChild>
                    <Link href={`/mon-reseau-local/dashboard/profile/${match.partnerId}`}>
                        Voir le profil complet
                    </Link>
                </Button>
             </div>

        </motion.div>
        </div>
        );
      })}
    </div>
  );
}
