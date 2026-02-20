"use client";

import { motion } from "framer-motion";
import { Clock, Star, MapPin, Phone, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NetworkMatch } from "@/types/network";
import { RateMatchDialog } from "./rate-match-dialog";

import Link from "next/link";

interface DailyMatchCardProps {
  match: any; // Using any for now to match the action return type
}

export function DailyMatchCard({ match }: DailyMatchCardProps) {
  if (!match) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center">
        <h2 className="text-xl font-black text-slate-900 mb-2">Pas encore de match pour aujourd'hui</h2>
        <p className="text-slate-500">Revenez un peu plus tard ou vérifiez vos disponibilités.</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
      
      <div className="p-6 md:p-8 grid md:grid-cols-[1fr_300px] gap-8">
        
        {/* Left: Person Info */}
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 uppercase tracking-widest text-[10px] font-bold px-3 py-1">
                Votre échange du jour
              </Badge>
              <div className="text-sm font-bold text-slate-400 flex items-center gap-1">
                <Clock className="h-4 w-4" /> {match.time}
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-slate-50 shadow-lg">
                  <AvatarImage src={match.avatar} className="object-cover" />
                  <AvatarFallback>{match.name[0]}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 bg-white px-2 py-1 rounded-full shadow border border-slate-100 flex items-center gap-1">
                  <Star className="h-3 w-3 text-orange-500 fill-orange-500" />
                  <span className="text-xs font-bold">{match.score}</span>
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-black text-slate-900 mb-1">{match.name}</h2>
                <p className="text-lg text-slate-600 font-medium mb-2">{match.job}</p>
                <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                  <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {match.city}</span>
                </div>
                <div className="flex gap-2">
                  {match.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 px-8 h-12">
              <Phone className="mr-2 h-5 w-5" /> 
              {match.type === 'call_out' ? `Appeler ${match.name.split(' ')[0]}` : `Attendre l'appel`}
            </Button>
            <Link href={`/mon-reseau-local/dashboard/profile/${match.partnerId}`}>
              <Button variant="outline" size="lg" className="border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl h-12 w-full md:w-auto">
                Voir le profil complet
              </Button>
            </Link>
          </div>
        </div>

        {/* Right: Action/Status */}
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col items-center justify-center text-center relative overflow-hidden">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
           
           <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-md mb-4 animate-bounce">
              <Phone className="h-8 w-8 text-green-500" />
           </div>
           <h3 className="font-black text-slate-900 text-lg mb-2">C'est à vous !</h3>
           <p className="text-slate-500 text-sm mb-6">
             C'est vous qui devez appeler {match.name.split(' ')[0]} à <span className="font-bold text-slate-900">{match.time}</span>.
             Préparez vos questions !
           </p>
           
           <div className="w-full bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase mb-2">Après l'appel</div>
              <RateMatchDialog matchId={match.id} partnerName={match.name} />
           </div>
        </div>

      </div>
    </motion.div>
  );
}
