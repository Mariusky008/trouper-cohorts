"use client";

import { motion } from "framer-motion";
import { Clock, Star, MapPin, Phone, CheckCircle2, MessageSquare, ArrowRight, Calendar, User, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { cn } from "@/lib/utils";

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

  if (!matches || matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-8 bg-[#1e293b]/50 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl shadow-black/20 relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-md mx-auto">
            <div className="h-24 w-24 bg-white/5 rounded-3xl flex items-center justify-center mb-6 mx-auto transform rotate-3 shadow-lg shadow-black/20 border border-white/10">
               <Clock className="h-10 w-10 text-blue-400 animate-pulse" />
            </div>
            
            <h3 className="text-3xl font-black text-white leading-tight mb-4">
                Votre premier match arrive demain ! 🚀
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
            
        const whyText = `"${match.name.split(' ')[0]} cherche activement à ${goalLabel} et votre profil correspond parfaitement pour l'aider."`;

        return (
        <motion.div 
          key={match.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="max-w-2xl mx-auto w-full bg-[#1e293b]/80 backdrop-blur-xl rounded-[2rem] p-8 md:p-10 shadow-2xl shadow-black/40 border border-white/10 relative overflow-visible group hover:scale-[1.01] transition-transform duration-300"
        >
          {/* DATE HEADER (Now Inside) */}
          <div className="flex justify-between items-end mb-8 pb-6 border-b border-white/5">
             <div>
               <div className="text-4xl font-black text-white leading-none mb-1">
                 {capitalize(dayName)} {dayNumber}
               </div>
               <div className="text-slate-400 font-bold text-lg capitalize">{monthYear}</div>
             </div>
             {/* Decorative Calendar Icon */}
             <div className="bg-white/5 text-blue-400 p-3 rounded-2xl border border-white/5">
               <Calendar className="h-6 w-6" />
             </div>
           </div>

             {/* ORANGE BADGE */}
             <div className="absolute -top-4 right-8 bg-orange-500 text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-orange-900/50 z-10">
               Opportunité Chaude
             </div>

             {/* PROFILE INFO */}
             <div className="flex flex-col items-center text-center mb-10 transform scale-110">
               <div className="relative mb-5">
                 <Avatar className="h-32 w-32 border-4 border-[#1e293b] shadow-xl">
                    <AvatarImage src={match.avatar} className="object-cover" />
                    <AvatarFallback className="text-4xl font-black bg-slate-800 text-slate-500">{match.name[0]}</AvatarFallback>
                 </Avatar>
                 <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#0f172a] text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1 shadow-md">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Vérifié fiable
                 </div>
               </div>
               
               <h3 className="text-3xl font-black text-white mb-2 mt-2">{match.name}</h3>
               <div className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-2">
                  {match.job} • {match.city}
               </div>
               <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={cn("h-4 w-4", i <= Math.round(match.score) ? "text-yellow-400 fill-yellow-400" : "text-slate-700")} />
                  ))}
               </div>
             </div>

             {/* WHY THIS MATCH BOX */}
             <div className="bg-[#0f172a]/50 rounded-2xl p-5 border border-white/5 mb-8 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1e293b] px-3 py-1 rounded-full border border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-widest shadow-sm">
                    Pourquoi ce match ?
                </div>
                <p className="text-sm text-slate-300 font-medium leading-relaxed text-center italic mt-2">
                  {whyText}
                </p>
             </div>

             {/* CALL BUTTON */}
             {isCallOut ? (
                <div className="space-y-3 mb-6">
                    <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-14 rounded-2xl shadow-lg shadow-blue-900/50 text-base animate-shimmer bg-[linear-gradient(110deg,#2563eb,45%,#3b82f6,55%,#2563eb)] bg-[length:200%_100%] transition-colors border border-white/10" asChild>
                       <a href={`tel:${match.phone}`}>
                         <Phone className="mr-2 h-5 w-5" /> Appeler {match.name.split(' ')[0]} ({match.phone})
                       </a>
                    </Button>
                    <div className="text-center text-xs font-bold text-blue-400/80 uppercase tracking-wide">
                        C'est à vous d'appeler entre {match.time}
                    </div>
                </div>
             ) : (
                <div className="w-full h-14 bg-[#0f172a]/50 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-0.5 text-slate-400 font-bold mb-6">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span>En attente de son appel</span>
                    </div>
                    <span className="text-xs font-medium text-slate-500">Prévu entre {match.time}</span>
                </div>
             )}

             {/* STATS FOOTER (DYNAMIC) */}
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0f172a]/50 rounded-xl p-3 border border-white/5 shadow-sm text-center">
                   <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Objectif Principal</div>
                   <div className="font-black text-white text-sm leading-tight line-clamp-2">
                      {goalLabel ? capitalize(goalLabel) : "Développement"}
                   </div>
                </div>
                <div className="bg-[#0f172a]/50 rounded-xl p-3 border border-white/5 shadow-sm text-center">
                   <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Score de Confiance</div>
                   <div className="font-black text-emerald-400 text-lg">{match.score.toFixed(1)}/5</div>
                </div>
             </div>

             {/* SEE PROFILE LINK (IMPROVED) */}
             <div className="mt-6">
                <Button variant="secondary" className="w-full h-10 rounded-xl font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all" asChild>
                    <Link href={`/mon-reseau-local/dashboard/profile/${match.partnerId}`}>
                        Voir le profil complet
                    </Link>
                </Button>
             </div>

        </motion.div>
        );
      })}
    </div>
  );
}
