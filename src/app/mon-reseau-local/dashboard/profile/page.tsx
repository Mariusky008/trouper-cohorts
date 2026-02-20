"use client";

import { motion } from "framer-motion";
import { 
  User, MapPin, Briefcase, Link as LinkIcon, 
  ShieldCheck, TrendingUp, Award, Star 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

const USER = {
  name: "Jean Dupont",
  job: "Consultant SEO & Marketing",
  city: "Paris, France",
  bio: "J'aide les entreprises à doubler leur visibilité organique en 90 jours. Passionné par l'entrepreneuriat et les nouvelles rencontres.",
  avatar: "https://github.com/shadcn.png",
  score: 4.6,
  stats: {
    opportunities: 42,
    reciprocity: "92%",
    seniority: "6 mois"
  },
  badges: ["Membre Fiable", "Super Connecteur"]
};

export default function ProfilePage() {
  return (
    <div className="space-y-8 pb-24">
      
      {/* HERO HEADER */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-600 to-purple-600 opacity-90" />
        
        <div className="relative mt-16 flex flex-col md:flex-row items-end gap-6">
          <Avatar className="h-32 w-32 border-4 border-white shadow-xl rounded-2xl">
            <AvatarImage src={USER.avatar} />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 mb-2">
            <h1 className="text-3xl font-black text-slate-900 mb-1">{USER.name}</h1>
            <p className="text-lg text-slate-500 font-medium flex items-center gap-2">
              <Briefcase className="h-4 w-4" /> {USER.job}
            </p>
          </div>
          
          <div className="flex gap-3 mb-2">
             <Button variant="outline" className="rounded-xl font-bold h-10 border-slate-200 hover:bg-slate-50">
               Modifier
             </Button>
             <Button className="rounded-xl font-bold h-10 bg-slate-900 text-white hover:bg-slate-800">
               Partager mon profil
             </Button>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-[2fr_1fr] gap-8">
           <div className="space-y-6">
             <div>
               <h3 className="font-bold text-slate-900 text-lg mb-2">À propos</h3>
               <p className="text-slate-600 leading-relaxed">{USER.bio}</p>
             </div>
             
             <div className="flex flex-wrap gap-2">
               <Badge variant="secondary" className="bg-slate-100 text-slate-600 px-3 py-1 text-sm font-medium">SEO</Badge>
               <Badge variant="secondary" className="bg-slate-100 text-slate-600 px-3 py-1 text-sm font-medium">Marketing</Badge>
               <Badge variant="secondary" className="bg-slate-100 text-slate-600 px-3 py-1 text-sm font-medium">Growth Hacking</Badge>
               <Badge variant="secondary" className="bg-slate-100 text-slate-600 px-3 py-1 text-sm font-medium">Startups</Badge>
             </div>
           </div>

           <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-orange-500" /> Score de Confiance
                  </span>
                  <span className="font-black text-2xl text-slate-900">{USER.score}/5</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
              
              <div className="space-y-3 pt-4 border-t border-slate-200">
                 <div className="flex items-center justify-between text-sm">
                   <span className="text-slate-500 font-medium">Opportunités générées</span>
                   <span className="font-bold text-slate-900">{USER.stats.opportunities}</span>
                 </div>
                 <div className="flex items-center justify-between text-sm">
                   <span className="text-slate-500 font-medium">Taux de réciprocité</span>
                   <span className="font-bold text-green-600">{USER.stats.reciprocity}</span>
                 </div>
                 <div className="flex items-center justify-between text-sm">
                   <span className="text-slate-500 font-medium">Membre depuis</span>
                   <span className="font-bold text-slate-900">{USER.stats.seniority}</span>
                 </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {USER.badges.map(badge => (
                  <Badge key={badge} className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200">
                    <Award className="h-3 w-3 mr-1" /> {badge}
                  </Badge>
                ))}
              </div>
           </div>
        </div>
      </div>
      
    </div>
  );
}
