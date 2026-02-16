"use client";

import { Anchor, ArrowRight, CheckCircle2, QrCode } from "lucide-react";

export default function BusinessCardPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-8 gap-12 font-sans">
      
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-black text-slate-900 uppercase italic">Concept Carte de Visite</h1>
        <p className="text-slate-500">Format Standard 85mm x 55mm</p>
      </div>

      {/* RECTO */}
      <div className="group relative w-[500px] h-[300px] bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-800 flex flex-col items-center justify-center text-center p-8">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500 via-slate-900 to-slate-900"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col items-center gap-6">
            <div className="flex items-center gap-3 mb-2">
                <Anchor className="text-orange-500 h-8 w-8" />
                <span className="text-white font-black text-2xl uppercase tracking-widest italic">Popey <span className="text-orange-500">Academy</span></span>
            </div>
            
            <div className="space-y-2">
                <p className="text-slate-300 font-medium tracking-wide text-sm uppercase">L'École de l'Action Collective</p>
                <h2 className="text-white font-black text-3xl uppercase italic leading-tight">
                    "Activez la puissance<br/>de 24 entrepreneurs."
                </h2>
            </div>

            <div className="mt-4 flex gap-3 text-[10px] font-bold tracking-widest uppercase text-slate-400">
                <span className="px-2 py-1 border border-slate-700 rounded">24 Entrepreneurs</span>
                <span className="px-2 py-1 border border-slate-700 rounded">15 Jours</span>
                <span className="px-2 py-1 border border-slate-700 rounded">Effet Multiplicateur</span>
            </div>
        </div>
        
        <div className="absolute bottom-4 text-[10px] text-slate-600 font-mono">RECTO</div>
      </div>

      {/* VERSO */}
      <div className="relative w-[500px] h-[300px] bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200 p-8 flex flex-col justify-between">
         {/* Background Subtle Texture */}
         <div className="absolute top-0 right-0 p-4 opacity-5">
            <Anchor className="h-32 w-32 text-slate-900" />
         </div>

         <div className="space-y-6 relative z-10 flex-1 flex flex-col justify-center">
            <div>
                <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-3">Votre Mission</p>
                <p className="text-slate-800 font-medium text-sm leading-relaxed">
                    Embarquez pendant 15 jours dans le navire Popey avec 23 autres entrepreneurs pour utiliser leur réseau.<br/><br/>
                    <span className="font-bold">Une seule mission : un maximum de nouveaux clients !</span>
                </p>
            </div>
         </div>

         <div className="flex items-end justify-between relative z-10 pt-4 border-t border-slate-100">
            <div>
                <p className="font-black text-slate-900 uppercase text-lg italic">Jean-Philippe Roth</p>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Capitaine & Fondateur</p>
                <div className="text-sm font-bold text-slate-900">popey.academy</div>
                <div className="text-sm text-slate-500">+33 7 68 23 33 47</div>
            </div>
         </div>

         <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-slate-300 font-mono">VERSO</div>
      </div>

    </div>
  );
}
