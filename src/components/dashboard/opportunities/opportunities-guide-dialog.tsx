"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

export function OpportunitiesGuideDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5 gap-2">
          <Info className="h-4 w-4" />
          Comment ça marche ?
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1e293b] border-white/10 max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-white flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/20">
              <Info className="h-6 w-6" />
            </div>
            Comment ça marche ?
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-8 mt-4">
          <div className="flex flex-col gap-2 p-4 rounded-xl bg-white/5 border border-white/5">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
              Étape 1
            </span>
            <div className="font-bold text-white text-lg leading-tight mb-2">
              Après votre appel du jour...
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Si vous avez identifié une aide concrète pour votre partenaire
              (contact, conseil, mission...), c'est ici que ça se passe.
            </p>
          </div>

          <div className="flex flex-col gap-2 p-4 rounded-xl bg-white/5 border border-white/5 relative">
            <div className="hidden md:block absolute -left-4 top-1/2 -translate-y-1/2 h-12 w-px bg-white/10"></div>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
              Étape 2
            </span>
            <div className="font-bold text-white text-lg leading-tight mb-2">
              Envoyez l'opportunité
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Cliquez sur{" "}
              <span className="font-bold text-white">
                "Envoyer une opportunité"
              </span>
              . Si vous en avez plusieurs, répétez l'opération pour chaque
              action.
            </p>
          </div>

          <div className="flex flex-col gap-2 p-4 rounded-xl bg-white/5 border border-white/5 relative">
            <div className="hidden md:block absolute -left-4 top-1/2 -translate-y-1/2 h-12 w-px bg-white/10"></div>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
              Étape 3
            </span>
            <div className="font-bold text-white text-lg leading-tight mb-2">
              Équilibrez la balance
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Il recevra votre opportunité instantanément. S'il ne vous renvoie
              rien en retour, une{" "}
              <span className="font-bold text-red-400">dette</span> sera
              enregistrée sur son profil.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
