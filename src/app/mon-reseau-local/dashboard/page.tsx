"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Calendar, Clock, MapPin, MessageCircle, Phone, 
  Star, ThumbsUp, TrendingUp, Users, CheckCircle2, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// --- MOCK DATA ---
const DAILY_MATCH = {
  id: "user-123",
  name: "Julien Martin",
  job: "Architecte d'intérieur",
  city: "Bordeaux",
  score: 4.8,
  time: "14:00",
  type: "call_out", // or 'call_in'
  avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=2000&auto=format&fit=crop",
  tags: ["Design", "Rénovation", "Luxe"]
};

const STATS = [
  { label: "Score de Confiance", value: "4.6/5", icon: Star, color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100" },
  { label: "Opportunités Reçues", value: "12", icon: TrendingUp, color: "text-green-500", bg: "bg-green-50", border: "border-green-100" },
  { label: "Opportunités Rendues", value: "10", icon: ThumbsUp, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100" },
  { label: "Dettes en cours", value: "2", icon: Clock, color: "text-red-500", bg: "bg-red-50", border: "border-red-100" },
];

export default function DashboardHome() {
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [isAvailabilitySaved, setIsAvailabilitySaved] = useState(false);

  const toggleSlot = (slot: string) => {
    if (selectedSlots.includes(slot)) {
      setSelectedSlots(selectedSlots.filter(s => s !== slot));
    } else {
      setSelectedSlots([...selectedSlots, slot]);
    }
  };

  const handleSaveAvailability = () => {
    setIsAvailabilitySaved(true);
    // TODO: Save to backend
  };

  return (
    <div className="space-y-8 pb-24">
      
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Bonjour, Jean 👋</h1>
          <p className="text-slate-500 font-medium">Prêt pour votre opportunité du jour ?</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-bold text-slate-700">Réseau actif : 342 membres en ligne</span>
        </div>
      </div>

      {/* 2. DAILY MATCH CARD (HERO) */}
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
                  <Clock className="h-4 w-4" /> {DAILY_MATCH.time}
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-slate-50 shadow-lg">
                    <AvatarImage src={DAILY_MATCH.avatar} className="object-cover" />
                    <AvatarFallback>JM</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2 bg-white px-2 py-1 rounded-full shadow border border-slate-100 flex items-center gap-1">
                    <Star className="h-3 w-3 text-orange-500 fill-orange-500" />
                    <span className="text-xs font-bold">{DAILY_MATCH.score}</span>
                  </div>
                </div>
                
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-1">{DAILY_MATCH.name}</h2>
                  <p className="text-lg text-slate-600 font-medium mb-2">{DAILY_MATCH.job}</p>
                  <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {DAILY_MATCH.city}</span>
                  </div>
                  <div className="flex gap-2">
                    {DAILY_MATCH.tags.map(tag => (
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
                {DAILY_MATCH.type === 'call_out' ? `Appeler ${DAILY_MATCH.name.split(' ')[0]}` : `Attendre l'appel`}
              </Button>
              <Button variant="outline" size="lg" className="border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl h-12">
                Voir le profil complet
              </Button>
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
               C'est vous qui devez appeler Julien à <span className="font-bold text-slate-900">14h00</span>.
               Préparez vos questions !
             </p>
             
             <div className="w-full bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">Après l'appel</div>
                <Button variant="ghost" className="w-full text-slate-600 hover:text-blue-600 hover:bg-blue-50 font-bold text-sm h-8">
                  Noter l'échange
                </Button>
             </div>
          </div>

        </div>
      </motion.div>

      {/* 3. AVAILABILITY SELECTOR */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid md:grid-cols-2 gap-8"
      >
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-black text-xl text-slate-900">Demain</h3>
              <p className="text-slate-500 text-sm">Choisissez vos créneaux pour le matching.</p>
            </div>
            <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
              <Calendar className="h-5 w-5" />
            </div>
          </div>

          {!isAvailabilitySaved ? (
            <div className="space-y-4">
              {["09h – 11h", "12h – 14h", "17h – 19h"].map((slot) => {
                const isSelected = selectedSlots.includes(slot);
                return (
                  <div 
                    key={slot}
                    onClick={() => toggleSlot(slot)}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                      isSelected 
                        ? "border-blue-600 bg-blue-50/50" 
                        : "border-slate-100 bg-white hover:border-blue-200"
                    )}
                  >
                    <span className={cn("font-bold text-lg", isSelected ? "text-blue-900" : "text-slate-600")}>
                      {slot}
                    </span>
                    <div className={cn(
                      "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors",
                      isSelected ? "bg-blue-600 border-blue-600" : "border-slate-300 bg-white"
                    )}>
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-white" />}
                    </div>
                  </div>
                );
              })}
              <Button 
                onClick={handleSaveAvailability}
                disabled={selectedSlots.length === 0}
                className="w-full mt-4 h-12 text-lg font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
              >
                Valider mes disponibilités
              </Button>
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-300">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h4 className="font-black text-xl text-slate-900 mb-2">C'est noté !</h4>
                <p className="text-slate-500">Nous cherchons le meilleur partenaire pour demain.</p>
                <Button variant="link" onClick={() => setIsAvailabilitySaved(false)} className="mt-4 text-blue-600 font-bold">
                  Modifier
                </Button>
             </div>
          )}
        </div>

        {/* 4. TRUST SUMMARY */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col">
           <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-black text-xl text-slate-900">Votre Impact</h3>
              <p className="text-slate-500 text-sm">Résumé de votre activité.</p>
            </div>
            <div className="h-10 w-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 flex-1">
            {STATS.map((stat, i) => (
              <div key={i} className={cn("p-4 rounded-2xl border flex flex-col justify-center", stat.bg, stat.border)}>
                <stat.icon className={cn("h-6 w-6 mb-3", stat.color)} />
                <div className="text-2xl font-black text-slate-900">{stat.value}</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm mb-2">
               <span className="font-bold text-slate-700">Progression vers le niveau "Connecteur"</span>
               <span className="font-bold text-blue-600">85%</span>
            </div>
            <Progress value={85} className="h-2" />
          </div>
        </div>
      </motion.div>

    </div>
  );
}
