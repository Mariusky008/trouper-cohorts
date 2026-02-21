"use client";

import { motion } from "framer-motion";
import { Clock, Star, MapPin, Phone, CheckCircle2, MessageSquare, ArrowRight, UserPlus, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RateMatchDialog } from "./rate-match-dialog";

import Link from "next/link";

interface DailyMatchCardProps {
  match: any; // Using any for now to match the action return type
}

export function DailyMatchCard({ match }: DailyMatchCardProps) {
  if (!match) {
    return (
      <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-sm text-center relative overflow-hidden h-full flex flex-col items-center justify-center min-h-[400px]">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-slate-200 to-slate-100" />
        <div className="bg-slate-50 h-20 w-20 rounded-full flex items-center justify-center mb-6">
           <Coffee className="h-10 w-10 text-slate-400" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Pause café ?</h2>
        <p className="text-slate-500 max-w-sm mx-auto mb-6 text-lg">
          Pas de match pour le moment. Profitez-en pour affiner votre profil ou inviter un collègue.
        </p>
        <div className="flex gap-3">
             <Button variant="outline" className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50" asChild>
                <Link href="/mon-reseau-local/dashboard/profile">Mettre à jour mon profil</Link>
             </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-slate-100 overflow-hidden group"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
      
      {/* BACKGROUND DECORATION */}
      <div className="absolute -right-20 -top-20 h-64 w-64 bg-blue-50 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="p-6 md:p-8 relative z-10">
        
        {/* HEADER BADGE */}
        <div className="flex items-center justify-between mb-8">
            <Badge className="bg-blue-600 text-white border-none px-3 py-1.5 text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-200">
                Match du jour
            </Badge>
            <div className="flex items-center gap-2 text-slate-500 font-bold bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                <Clock className="h-4 w-4 text-blue-500" />
                <span>{match.time}</span>
            </div>
        </div>

        {/* PROFILE SECTION */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="relative shrink-0">
                <div className="absolute -inset-1 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl opacity-75 blur-sm" />
                <Avatar className="h-28 w-28 rounded-2xl border-4 border-white relative z-10">
                  <AvatarImage src={match.avatar} className="object-cover" />
                  <AvatarFallback className="text-2xl font-black bg-slate-100 text-slate-300">{match.name[0]}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-3 -right-3 z-20 bg-white px-2 py-1 rounded-lg shadow-md border border-slate-100 flex items-center gap-1">
                  <Star className="h-3 w-3 text-orange-500 fill-orange-500" />
                  <span className="text-xs font-bold text-slate-900">{match.score}</span>
                </div>
            </div>

            <div className="flex-1 space-y-2">
                <div>
                    <h3 className="text-3xl font-black text-slate-900 leading-tight">{match.name}</h3>
                    <p className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-slate-600 to-slate-400">
                        {match.job}
                    </p>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                    <MapPin className="h-4 w-4 text-slate-400" /> {match.city}
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {match.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100 transition-colors">
                      {tag}
                    </Badge>
                  ))}
                </div>
            </div>
        </div>

        {/* ACTION AREA */}
        <div className="mt-8 pt-8 border-t border-slate-100 grid md:grid-cols-2 gap-4">
            {match.type === 'call_out' ? (
                <Button size="lg" className="h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 w-full text-base transition-all hover:scale-[1.02]" asChild>
                    <a href={`tel:${match.phone}`}>
                    <Phone className="mr-2 h-5 w-5" /> 
                    Appeler ({match.phone || "N/A"})
                    </a>
                </Button>
            ) : (
                <div className="h-14 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center gap-3 text-slate-500 font-bold w-full">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    En attente de l'appel...
                </div>
            )}

            <Button variant="outline" size="lg" className="h-14 border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-2xl w-full text-base" asChild>
                <Link href={`/mon-reseau-local/dashboard/profile/${match.partnerId}`}>
                    Voir profil complet <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </div>

        {/* FOOTER INSTRUCTION */}
        <div className="mt-6 bg-slate-50 rounded-xl p-4 flex items-start gap-3">
             <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <MessageSquare className="h-4 w-4" />
             </div>
             <div className="text-sm">
                <span className="font-bold text-slate-900 block mb-1">Sujet suggéré</span>
                <p className="text-slate-600 leading-relaxed">
                    "Quels sont tes principaux défis actuels dans ton activité de <span className="font-medium text-slate-900">{match.job}</span> ?"
                </p>
             </div>
        </div>

      </div>
    </motion.div>
  );
}
