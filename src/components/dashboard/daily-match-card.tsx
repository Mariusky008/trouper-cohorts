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
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
        <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-2">
           <Calendar className="h-8 w-8 text-slate-400" />
        </div>
        <div>
            <h3 className="text-xl font-bold text-slate-900">Pas de match pour le moment</h3>
            <p className="text-slate-500 max-w-xs mx-auto mt-2">
            Revenez demain ou mettez à jour vos disponibilités pour recevoir de nouvelles opportunités.
            </p>
        </div>
        <Button variant="outline" asChild>
            <Link href="/mon-reseau-local/dashboard/profile">Mettre à jour mon profil</Link>
        </Button>
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
          className="max-w-2xl mx-auto w-full bg-white rounded-[2rem] p-8 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-visible group hover:scale-[1.01] transition-transform duration-300"
        >
          {/* DATE HEADER (Now Inside) */}
          <div className="flex justify-between items-end mb-8 pb-6 border-b border-slate-50">
             <div>
               <div className="text-4xl font-black text-slate-900 leading-none mb-1">
                 {capitalize(dayName)} {dayNumber}
               </div>
               <div className="text-slate-500 font-bold text-lg capitalize">{monthYear}</div>
             </div>
             {/* Decorative Calendar Icon */}
             <div className="bg-blue-50 text-blue-500 p-3 rounded-2xl">
               <Calendar className="h-6 w-6" />
             </div>
           </div>

             {/* ORANGE BADGE */}
             <div className="absolute -top-4 right-8 bg-orange-500 text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-orange-200 z-10">
               Opportunité Chaude
             </div>

             {/* PROFILE INFO */}
             <div className="flex flex-col items-center text-center mb-10 transform scale-110">
               <div className="relative mb-5">
                 <Avatar className="h-32 w-32 border-4 border-slate-50 shadow-xl">
                    <AvatarImage src={match.avatar} className="object-cover" />
                    <AvatarFallback className="text-4xl font-black bg-slate-100 text-slate-300">{match.name[0]}</AvatarFallback>
                 </Avatar>
                 <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-green-50 text-green-700 border border-green-100 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1 shadow-md">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Vérifié fiable
                 </div>
               </div>
               
               <h3 className="text-3xl font-black text-slate-900 mb-2 mt-2">{match.name}</h3>
               <div className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">
                  {match.job} • {match.city}
               </div>
               <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={cn("h-4 w-4", i <= Math.round(match.score) ? "text-yellow-400 fill-yellow-400" : "text-slate-200")} />
                  ))}
               </div>
             </div>

             {/* WHY THIS MATCH BOX */}
             <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 mb-8 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-full border border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest shadow-sm">
                    Pourquoi ce match ?
                </div>
                <p className="text-sm text-slate-600 font-medium leading-relaxed text-center italic mt-2">
                  {whyText}
                </p>
             </div>

             {/* CALL BUTTON */}
             {isCallOut ? (
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-14 rounded-2xl shadow-lg shadow-blue-200 text-base mb-6 animate-shimmer bg-[linear-gradient(110deg,#2563eb,45%,#3b82f6,55%,#2563eb)] bg-[length:200%_100%] transition-colors" asChild>
                   <a href={`tel:${match.phone}`}>
                     <Phone className="mr-2 h-5 w-5" /> Appeler entre {match.time}
                   </a>
                </Button>
             ) : (
                <div className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center justify-center gap-2 text-slate-500 font-bold mb-6">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    En attente de son appel ({match.time})
                </div>
             )}

             {/* STATS FOOTER (DYNAMIC) */}
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm text-center">
                   <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Objectif Principal</div>
                   <div className="font-black text-slate-900 text-sm leading-tight line-clamp-2">
                      {goalLabel ? capitalize(goalLabel) : "Développement"}
                   </div>
                </div>
                <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm text-center">
                   <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Score de Confiance</div>
                   <div className="font-black text-green-600 text-lg">{match.score.toFixed(1)}/5</div>
                </div>
             </div>

             {/* SEE PROFILE LINK (IMPROVED) */}
             <div className="mt-6">
                <Button variant="secondary" className="w-full h-10 rounded-xl font-bold text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-100 transition-all" asChild>
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
