"use client";

import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";

interface LockedOfferCardProps {
  title: string;
  price: string;
  original: string;
}

export function LockedOfferCard({ title, price, original }: LockedOfferCardProps) {
  return (
    <div className="relative group bg-white rounded-3xl border border-slate-200 p-6 overflow-hidden hover:shadow-xl transition-all">
      {/* Semi-Transparent Overlay with Lock */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-6 bg-slate-900/5 backdrop-blur-[2px] transition-all group-hover:bg-slate-900/0 group-hover:backdrop-blur-[1px]">
        
        <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/50 transform group-hover:scale-105 transition-transform duration-300 w-full max-w-[240px]">
          <div className="h-14 w-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-lg shadow-amber-500/30">
            <Lock className="h-7 w-7 text-white" />
          </div>
          <h4 className="font-black text-slate-900 text-lg mb-1">Opportunité Exclusive</h4>
          <p className="text-xs text-slate-600 font-medium leading-relaxed mx-auto mb-4">
            Se débloque au prochain match.
          </p>
          
          <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xl font-bold w-full text-xs h-9 border-slate-200 hover:bg-slate-50 text-slate-700">
                    Comment débloquer ?
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <span className="bg-amber-100 p-2 rounded-lg text-amber-600"><Lock className="h-5 w-5" /></span>
                    La clé, c'est la rencontre.
                </DialogTitle>
                <DialogDescription className="pt-4 text-base leading-relaxed">
                    Les offres exclusives sont réservées aux membres connectés entre eux.
                    <br/><br/>
                    <strong>Chaque matin à 08h00</strong>, vous recevez un nouveau match. C'est peut-être cette personne !
                    <br/><br/>
                    Revenez demain pour découvrir votre nouvelle opportunité.
                </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end">
                    <DialogClose asChild>
                        <Button type="button" className="rounded-xl font-bold">
                            J'ai compris, je reviens demain ! 🚀
                        </Button>
                    </DialogClose>
                </div>
            </DialogContent>
          </Dialog>

        </div>

      </div>

      {/* Content (Visible but slightly obscured) */}
      <div className="opacity-60 pointer-events-none select-none filter grayscale-[0.5]">
        <div className="absolute top-4 right-4 bg-slate-900 text-white font-black text-xs px-3 py-1.5 rounded-full shadow-lg rotate-3 opacity-50">
          -50%
        </div>

        <div className="flex items-center gap-4 mb-6 opacity-50">
          <div className="h-14 w-14 rounded-full bg-slate-100 border-2 border-slate-50" />
          <div>
            <div className="h-4 w-24 bg-slate-200 rounded mb-2" />
            <div className="h-3 w-16 bg-slate-100 rounded" />
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <h4 className="font-black text-xl text-slate-600 leading-tight">{title}</h4>
          <div className="space-y-2 opacity-50">
            <div className="h-3 w-full bg-slate-100 rounded" />
            <div className="h-3 w-5/6 bg-slate-100 rounded" />
          </div>
        </div>

        <div className="flex items-end justify-between pt-6 border-t border-slate-100">
          <div>
            <p className="text-xs text-slate-400 font-medium line-through mb-1">{original}</p>
            <p className="text-2xl font-black text-slate-400 blur-[3px]">{price}</p>
          </div>
        </div>
      </div>
    </div>
  );
}