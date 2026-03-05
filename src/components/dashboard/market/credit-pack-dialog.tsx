"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ShoppingCart, CheckCircle2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const CREDIT_PACKS = [
  { id: 'starter', credits: 50, price: 29, label: 'Starter', popular: false },
  { id: 'pro', credits: 150, price: 69, label: 'Pro', popular: true },
  { id: 'business', credits: 500, price: 199, label: 'Business', popular: false },
];

export function CreditPackDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPack, setSelectedPack] = useState<string | null>('pro');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2 border-white/10 bg-white/5 hover:bg-white/10 text-xs">
            Recharger
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1e293b] border-white/10 text-white sm:max-w-3xl">
        <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-3">
                <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                    <Zap className="h-5 w-5" />
                </div>
                Recharger vos crédits
            </DialogTitle>
            <DialogDescription className="text-slate-400">
                Achetez des crédits pour débloquer plus d'opportunités sur le marché.
            </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-4 py-6">
            {CREDIT_PACKS.map((pack) => (
                <div 
                    key={pack.id}
                    onClick={() => setSelectedPack(pack.id)}
                    className={cn(
                        "relative p-6 rounded-2xl border-2 cursor-pointer transition-all hover:scale-105",
                        selectedPack === pack.id 
                            ? "bg-emerald-500/10 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)]" 
                            : "bg-[#0f172a] border-white/5 hover:border-white/20"
                    )}
                >
                    {pack.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            Populaire
                        </div>
                    )}
                    
                    <div className="text-center space-y-4">
                        <div className="text-sm font-bold text-slate-400 uppercase">{pack.label}</div>
                        <div className="text-4xl font-black text-white">{pack.credits} <span className="text-base font-medium text-slate-500">pts</span></div>
                        <div className="text-xl font-bold text-emerald-400">{pack.price}€</div>
                        
                        <ul className="text-xs text-slate-400 space-y-2 text-left bg-black/20 p-3 rounded-lg">
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Accès immédiat
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Facture pro
                            </li>
                        </ul>

                        <Button 
                            className={cn(
                                "w-full font-bold",
                                selectedPack === pack.id ? "bg-emerald-600 hover:bg-emerald-500" : "bg-white/10 hover:bg-white/20"
                            )}
                        >
                            Choisir
                        </Button>
                    </div>
                </div>
            ))}
        </div>
        
        <div className="bg-slate-900/50 p-4 rounded-xl text-center text-xs text-slate-500">
            Paiement sécurisé via Stripe. Les crédits n'expirent jamais.
        </div>
      </DialogContent>
    </Dialog>
  );
}
