"use client";

import { Anchor, ArrowRight, CheckCircle2 } from "lucide-react";

export default function BusinessCardEmploiPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-8 gap-12 font-sans">
      
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-black text-slate-900 uppercase italic">Concept Carte de Visite - Reconversion</h1>
        <p className="text-slate-500">Format Standard 85mm x 55mm</p>
      </div>

      {/* RECTO */}
      <div className="group relative w-[500px] h-[300px] bg-slate-50 rounded-xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col items-center justify-center text-center p-8">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-200 via-white to-white"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col items-center gap-6">
            <div className="flex items-center gap-3 mb-2">
                <Anchor className="text-purple-600 h-8 w-8" />
                <span className="text-slate-900 font-black text-2xl uppercase tracking-widest italic">Popey <span className="text-purple-600">Academy</span></span>
            </div>
            
            <div className="space-y-4">
                <p className="text-slate-500 font-bold tracking-wide text-xs uppercase">L'École de la Reconversion Active</p>
                <h2 className="text-slate-900 font-black text-3xl uppercase italic leading-tight">
                    "Arrêtez de chercher<br/>votre voie.<br/>
                    <span className="text-purple-600">Construisez-la."</span>
                </h2>
            </div>

            <div className="mt-4 flex gap-3 text-[10px] font-bold tracking-widest uppercase text-slate-500">
                <span className="px-2 py-1 border border-slate-300 rounded bg-white">5 Semaines</span>
                <span className="px-2 py-1 border border-slate-300 rounded bg-white">1 Vocation</span>
                <span className="px-2 py-1 border border-slate-300 rounded bg-white">1 Nouvel Avenir</span>
            </div>
        </div>
        
        <div className="absolute bottom-4 text-[10px] text-slate-400 font-mono">RECTO</div>
      </div>

      {/* VERSO */}
      <div className="relative w-[500px] h-[300px] bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-800 p-8 flex flex-col justify-between text-white">
         {/* Background Subtle Texture */}
         <div className="absolute top-0 right-0 p-4 opacity-5">
            <Anchor className="h-32 w-32 text-white" />
         </div>

         <div className="space-y-6 relative z-10 flex-1 flex flex-col justify-center">
            <div>
                <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3">Votre Plan de Vol</p>
                <p className="text-slate-200 font-medium text-sm leading-relaxed">
                    5 semaines pour transformer vos doutes en certitudes.<br/><br/>
                    Ne cherchez plus votre voie tout seul.<br/>
                    <span className="text-white font-bold">Construisez-la avec une armée de 24 alliés.</span>
                </p>
            </div>
         </div>

         <div className="flex items-end justify-between relative z-10 pt-4 border-t border-slate-800">
            <div>
                <p className="font-black text-white uppercase text-lg italic">Jean-Philippe Roth</p>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">Fondateur & Mentor</p>
                <div className="text-sm font-bold text-white">popey.academy/emploi</div>
                <div className="text-sm text-slate-400">+33 7 68 23 33 47</div>
            </div>
         </div>

         <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-slate-600 font-mono">VERSO</div>
      </div>

    </div>
  );
}
