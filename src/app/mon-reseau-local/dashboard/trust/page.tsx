import { motion } from "framer-motion";
import { 
  ShieldCheck, AlertTriangle, Clock, CheckCircle2, 
  ArrowRight, HeartHandshake, Info 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { getTrustScore, getDebts } from "@/lib/actions/network-trust";

export const dynamic = 'force-dynamic';

export default async function TrustPage() {
  let scoreData = null;
  let debts: any[] = [];
  
  try {
    scoreData = await getTrustScore();
    debts = await getDebts();
  } catch (e) {
    console.error(e);
  }

  const score = scoreData?.score || 5.0;
  const percentage = (score / 5) * 100;

  return (
    <div className="space-y-8 pb-24">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Confiance & Réciprocité</h1>
        <p className="text-slate-500 font-medium">Votre réputation est votre actif le plus précieux.</p>
      </div>

      {/* SCORE HERO */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center gap-8 md:gap-16">
        {/* Score Circle */}
        <div className="relative h-40 w-40 flex items-center justify-center">
          <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 100 100">
             <circle className="text-slate-100 stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent"></circle>
             <circle 
               className="text-blue-600 stroke-current transition-all duration-1000" 
               strokeWidth="8" 
               strokeLinecap="round" 
               cx="50" cy="50" r="40" 
               fill="transparent" 
               strokeDasharray="251.2" 
               strokeDashoffset={251.2 - (251.2 * percentage) / 100}
             ></circle>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
             <span className="text-4xl font-black text-slate-900">{score}</span>
             <span className="text-xs font-bold text-slate-400 uppercase">sur 5.0</span>
          </div>
        </div>

        {/* Text & Stats */}
        <div className="flex-1 text-center md:text-left">
           <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 uppercase tracking-widest text-[10px] font-bold px-3 py-1 mb-4">
             Fiabilité {score > 4 ? "Élevée" : "Moyenne"}
           </Badge>
           <h2 className="text-2xl font-black text-slate-900 mb-2">
             {score > 4 ? "Vous êtes un partenaire de confiance." : "Continuez vos efforts."}
           </h2>
           <p className="text-slate-500 mb-6 max-w-lg">
             Votre score est calculé sur la qualité de vos échanges et votre rapidité à rendre les opportunités reçues.
           </p>
           
           <div className="grid grid-cols-2 gap-4">
             <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
               <div className="text-2xl font-black text-slate-900">{scoreData?.opportunities_given || 0}</div>
               <div className="text-xs text-slate-500 font-bold">Opportunités Données</div>
             </div>
             <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
               <div className="text-2xl font-black text-slate-900">{scoreData?.opportunities_received || 0}</div>
               <div className="text-xs text-slate-500 font-bold">Opportunités Reçues</div>
             </div>
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* 1. DEBTS I OWE */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <h3 className="font-black text-xl text-slate-900">Vos Dettes (À Rendre)</h3>
          </div>
          
          {debts.map((debt: any) => (
            <div 
              key={debt.id}
              className={cn(
                "bg-white rounded-2xl p-5 border shadow-sm flex items-center justify-between gap-4",
                debt.urgent ? "border-red-200 shadow-red-100" : "border-slate-200"
              )}
            >
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                  <AvatarImage src={debt.avatar} />
                  <AvatarFallback>{debt.partner[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-bold text-slate-900">{debt.partner}</div>
                  <div className="text-xs text-slate-500">{debt.reason}</div>
                </div>
              </div>

              <div className="text-right">
                <div className={cn(
                  "font-black text-lg",
                  debt.urgent ? "text-red-500" : "text-orange-500"
                )}>
                  {debt.daysLeft}j
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Restants</div>
              </div>

              <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800 font-bold rounded-lg h-9">
                Rendre
              </Button>
            </div>
          ))}
          
          {debts.length === 0 && (
             <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-8 text-center text-slate-400">
               <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-slate-300" />
               <p>Aucune dette en cours. Bravo !</p>
             </div>
          )}
        </div>

        {/* 2. DEBTS OWED TO ME */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <HeartHandshake className="h-5 w-5 text-blue-500" />
            <h3 className="font-black text-xl text-slate-900">Ce qu'on vous doit</h3>
          </div>

          <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-8 text-center text-slate-400">
             <Info className="h-8 w-8 mx-auto mb-2 text-slate-300" />
             <p>Fonctionnalité à venir : Suivi des retours.</p>
          </div>
        </div>

      </div>

      {/* RULES EXPLANATION */}
      <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 flex items-start gap-4">
         <Info className="h-6 w-6 text-blue-600 shrink-0 mt-1" />
         <div>
           <h4 className="font-bold text-blue-900 mb-1">Comment fonctionne le système ?</h4>
           <p className="text-blue-700/80 text-sm leading-relaxed">
             Lorsque vous recevez une opportunité validée, une "dette de réciprocité" est créée. 
             Vous avez <strong>30 jours</strong> pour aider cette personne en retour (ou aider quelqu'un d'autre si impossible).
             Si vous ne le faites pas, votre score de confiance diminue. Si vous le faites rapidement, il augmente !
           </p>
         </div>
      </div>

    </div>
  );
}
