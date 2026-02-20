"use client";

import { Bell, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  return (
    <div className="space-y-8 pb-24 max-w-2xl">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Paramètres</h1>
        <p className="text-slate-500 font-medium">Gérez vos préférences.</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
             <Bell className="h-5 w-5 text-slate-500" /> Notifications
           </h3>
           <div className="space-y-4">
             <div className="flex items-center justify-between">
               <Label htmlFor="notif-match" className="text-slate-700 font-medium">Nouveau match du jour</Label>
               <Checkbox id="notif-match" defaultChecked />
             </div>
             <div className="flex items-center justify-between">
               <Label htmlFor="notif-opp" className="text-slate-700 font-medium">Nouvelle opportunité reçue</Label>
               <Checkbox id="notif-opp" defaultChecked />
             </div>
             <div className="flex items-center justify-between">
               <Label htmlFor="notif-debt" className="text-slate-700 font-medium">Rappel de dettes (Urgence)</Label>
               <Checkbox id="notif-debt" defaultChecked />
             </div>
           </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
             <Shield className="h-5 w-5 text-slate-500" /> Confidentialité
           </h3>
           <div className="space-y-4">
             <div className="flex items-center justify-between">
               <Label htmlFor="public-profile" className="text-slate-700 font-medium">Profil visible publiquement</Label>
               <Checkbox id="public-profile" defaultChecked />
             </div>
             <div className="flex items-center justify-between">
               <Label htmlFor="show-score" className="text-slate-700 font-medium">Afficher mon Score de Confiance</Label>
               <Checkbox id="show-score" defaultChecked />
             </div>
           </div>
        </div>

        <div className="flex justify-end">
           <Button className="bg-slate-900 text-white font-bold h-12 px-8 rounded-xl">
             Enregistrer les modifications
           </Button>
        </div>
      </div>
    </div>
  );
}
