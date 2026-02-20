"use client";

import { useState } from "react";
import { Bell, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { updateNetworkSettings } from "@/lib/actions/network-settings";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function SettingsForm({ initialSettings }: { initialSettings: any }) {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(initialSettings?.notifications ?? true);
  const [visibility, setVisibility] = useState(initialSettings?.visibility ?? "public");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateNetworkSettings({
        notifications,
        visibility
      });
      toast({ title: "Paramètres enregistrés !" });
    } catch (e) {
      toast({ title: "Erreur", description: "Impossible d'enregistrer les paramètres.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* NOTIFICATIONS */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
         <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
           <Bell className="h-5 w-5 text-slate-500" /> Notifications
         </h3>
         <div className="flex items-center justify-between">
           <div className="space-y-0.5">
             <Label htmlFor="notifications" className="text-base font-medium">Activer les notifications</Label>
             <p className="text-sm text-slate-500">Recevez des alertes pour les matchs et opportunités.</p>
           </div>
           <Checkbox 
             id="notifications" 
             checked={notifications} 
             onCheckedChange={(checked) => setNotifications(checked === true)}
             className="h-6 w-6"
           />
         </div>
      </div>

      {/* VISIBILITY */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
         <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
           <Shield className="h-5 w-5 text-slate-500" /> Confidentialité du Profil
         </h3>
         
         <div className="flex flex-col gap-2">
           {[
             { value: 'public', label: 'Public (Visible par tous)' },
             { value: 'network_only', label: 'Réseau uniquement (Membres connectés)' },
             { value: 'private', label: 'Privé (Invisible)' }
           ].map((option) => (
             <button
               key={option.value}
               onClick={() => setVisibility(option.value)}
               className={cn(
                 "flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left",
                 visibility === option.value 
                   ? "border-blue-600 bg-blue-50/50" 
                   : "border-slate-100 bg-white hover:border-slate-200"
               )}
             >
               <span className={cn("font-medium", visibility === option.value ? "text-blue-900 font-bold" : "text-slate-600")}>
                 {option.label}
               </span>
               <div className={cn(
                 "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                 visibility === option.value ? "border-blue-600 bg-blue-600" : "border-slate-300"
               )}>
                 {visibility === option.value && <div className="h-2 w-2 rounded-full bg-white" />}
               </div>
             </button>
           ))}
         </div>
      </div>

      <div className="flex justify-end">
         <Button 
           onClick={handleSave} 
           disabled={loading}
           className="bg-slate-900 text-white font-bold h-12 px-8 rounded-xl hover:bg-slate-800"
         >
           {loading ? "Enregistrement..." : "Enregistrer les modifications"}
         </Button>
      </div>
    </div>
  );
}
