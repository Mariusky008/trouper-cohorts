import React from 'react';
import { ArrowRight, Wallet, ShieldCheck, Banknote, Rocket } from 'lucide-react';

export default function BusinessCardSideProject() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-8 gap-12 font-sans">
      
      {/* Container pour l'effet d'échelle et de centrage */}
      <div className="scale-100 flex flex-col gap-12">
        
        {/* RECTO */}
        <div className="w-[500px] h-[300px] bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-xl shadow-2xl relative overflow-hidden flex flex-col justify-between p-8">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

          {/* Logo / Brand */}
          <div className="flex items-center gap-2 z-10">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <span className="font-bold text-white text-xl">P</span>
            </div>
            <span className="font-semibold tracking-wider opacity-90">POPEY <span className="text-emerald-400">ACADEMY</span></span>
          </div>

          {/* Main Value Proposition */}
          <div className="z-10 space-y-2">
            <h1 className="text-4xl font-bold leading-tight">
              Lancez votre activité.<br/>
              <span className="text-emerald-400">Gardez votre salaire.</span>
            </h1>
            <p className="text-emerald-100/80 text-lg max-w-sm">
              La méthode sécurisée pour générer un revenu complémentaire sans démissionner.
            </p>
          </div>

          {/* Footer / URL */}
          <div className="z-10 flex items-center gap-2 text-sm font-medium text-emerald-300">
            <span>popey.academy/side-project</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* VERSO */}
        <div className="w-[500px] h-[300px] bg-white text-slate-900 rounded-xl shadow-2xl relative overflow-hidden flex p-8">
           {/* Left Column: Method */}
           <div className="flex-1 flex flex-col justify-center space-y-6 z-10">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Le Plan de Sécurité</h3>
                <h2 className="text-2xl font-bold text-slate-900">De l'idée au 1er euro</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-bold text-sm">L'Offre Rentable</span>
                    <span className="text-xs text-slate-500">Monétisez votre compétence actuelle.</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <Rocket className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-bold text-sm">Le Launchpad</span>
                    <span className="text-xs text-slate-500">Vendez avant de tout construire.</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-bold text-sm">La Sécurité</span>
                    <span className="text-xs text-slate-500">Développez sans risque financier.</span>
                  </div>
                </div>
              </div>
           </div>

           {/* Right Column: CTA & QR */}
           <div className="w-1/3 flex flex-col items-end justify-center pl-4 border-l border-slate-100 z-10">
              <div className="text-right space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Contact</p>
                  <p className="text-sm font-semibold text-slate-900">Jean-Philippe</p>
                  <p className="text-xs text-slate-500">Fondateur</p>
                </div>
                
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Téléphone</p>
                  <p className="text-sm font-semibold text-slate-900">07 68 223 33 47</p>
                </div>
              </div>
           </div>
        </div>

      </div>

      <div className="text-slate-400 text-sm">
        Format standard 85mm x 55mm • Thème Emerald (Sécurité & Croissance)
      </div>
    </div>
  );
}
