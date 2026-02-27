"use client";

import { useState } from "react";
import { Bell, Shield, Calendar, Clock, PauseCircle, PlayCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { updateNetworkSettings } from "@/lib/actions/network-settings";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PushManager } from "@/components/dashboard/notifications/push-manager";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { Download } from "lucide-react";

const DAYS = [
  { id: 'mon', label: 'Lun' },
  { id: 'tue', label: 'Mar' },
  { id: 'wed', label: 'Mer' },
  { id: 'thu', label: 'Jeu' },
  { id: 'fri', label: 'Ven' },
  { id: 'sat', label: 'Sam' },
  { id: 'sun', label: 'Dim' },
];

const SLOTS = [
  { id: '09-11', label: '09h - 11h' },
  { id: '12-14', label: '12h - 14h' },
  { id: '14-16', label: '14h - 16h' },
  { id: '17-19', label: '17h - 19h' },
];

export function SettingsForm({ initialSettings }: { initialSettings: any }) {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(initialSettings?.notifications ?? true);
  const [visibility, setVisibility] = useState(initialSettings?.visibility ?? "public");
  
  // Frequency & Availability
  const [frequency, setFrequency] = useState(initialSettings?.frequency_per_week ?? 5);
  const [selectedDays, setSelectedDays] = useState<string[]>(initialSettings?.preferred_days || ['mon', 'tue', 'wed', 'thu', 'fri']);
  const [selectedSlots, setSelectedSlots] = useState<string[]>(initialSettings?.preferred_slots || ['09-11', '14-16']);
  const [status, setStatus] = useState(initialSettings?.status || 'active');

  const [loading, setLoading] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  
  // Password State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const supabase = createClient();

  const handlePasswordUpdate = async () => {
    if (!newPassword || !confirmPassword) return;
    
    if (newPassword !== confirmPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Erreur", description: "Le mot de passe doit faire au moins 6 caractères.", variant: "destructive" });
      return;
    }

    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Succès", description: "Mot de passe mis à jour ! Vous pourrez désormais vous connecter avec votre email et ce mot de passe." });
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev: string[]) => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const toggleSlot = (slot: string) => {
    setSelectedSlots((prev: string[]) => 
      prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
    );
  };

  const toggleStatus = () => {
    setStatus((prev: string) => prev === 'active' ? 'pause' : 'active');
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateNetworkSettings({
        notifications,
        visibility,
        frequency_per_week: frequency,
        preferred_days: selectedDays,
        preferred_slots: selectedSlots,
        status
      });
      toast({ title: "Paramètres enregistrés !" });
    } catch (e) {
      toast({ title: "Erreur", description: "Impossible d'enregistrer les paramètres.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl animate-in fade-in duration-500">
      
      {/* 0. APPLICATION (New Section) */}
      <div className="bg-[#1e293b]/50 backdrop-blur-md p-6 rounded-[2rem] border border-white/5 shadow-sm space-y-4">
        <h3 className="font-bold text-lg text-white flex items-center gap-2">
           <Download className="h-5 w-5 text-indigo-400" /> Application
        </h3>
        <div className="bg-[#0a0f1c]/50 p-5 rounded-2xl border border-white/5 flex items-center justify-between gap-4">
            <div>
                <p className="font-bold text-white text-sm">Installer sur l'appareil</p>
                <p className="text-xs text-slate-400 mt-1">
                    Ajoutez l'application à votre écran d'accueil pour un accès rapide.
                </p>
            </div>
            {/* We can re-use the PWA logic but simpler */}
            <PWAInstallPrompt forceShow={showInstallPrompt} onDismiss={() => setShowInstallPrompt(false)} />
            <Button 
                variant="outline" 
                onClick={() => setShowInstallPrompt(true)}
                className="bg-indigo-600/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-600/20"
            >
                Installer
            </Button>
        </div>
      </div>

      {/* 1. FREQUENCY & RHYTHM (New Section) */}
      <div className="bg-[#1e293b]/50 backdrop-blur-md p-6 rounded-[2rem] border border-white/5 shadow-sm space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-400" /> Rythme & Disponibilités
          </h3>
          <Button 
            variant={status === 'active' ? "outline" : "default"}
            size="sm"
            onClick={toggleStatus}
            className={cn(
              "font-bold transition-colors border rounded-xl h-9",
              status === 'active' 
                ? "text-slate-400 border-white/10 bg-white/5 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20" 
                : "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
            )}
          >
            {status === 'active' ? (
              <><PauseCircle className="mr-2 h-4 w-4" /> Mettre en pause</>
            ) : (
              <><PlayCircle className="mr-2 h-4 w-4" /> Reprendre l'activité</>
            )}
          </Button>
        </div>

        {/* Frequency Slider */}
        <div className="space-y-4 bg-[#0a0f1c]/50 p-5 rounded-2xl border border-white/5">
           <div className="flex justify-between items-end mb-2">
             <Label className="text-base font-bold text-slate-300">Fréquence Hebdomadaire</Label>
             <span className="text-lg font-black text-blue-400 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20 shadow-sm">
               {frequency} matchs / sem
             </span>
           </div>
           <Slider 
             value={[frequency]} 
             min={1} 
             max={7} 
             step={1} 
             onValueChange={(vals) => setFrequency(vals[0])}
             className="py-2"
           />
           <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider px-1">
              <span>Mode Léger (1j)</span>
              <span>Mode Intensif (7j)</span>
           </div>
        </div>

        {/* Days Selection */}
        <div className="space-y-3">
          <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Jours de disponibilité</Label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map(day => (
              <button
                key={day.id}
                onClick={() => toggleDay(day.id)}
                className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all border",
                  selectedDays.includes(day.id) 
                    ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/40" 
                    : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white"
                )}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        {/* Slots Selection */}
        <div className="space-y-3">
          <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Créneaux horaires préférés</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SLOTS.map(slot => (
              <div 
                key={slot.id}
                onClick={() => toggleSlot(slot.id)}
                className={cn(
                  "p-3 rounded-xl border cursor-pointer font-bold text-center text-sm transition-all",
                  selectedSlots.includes(slot.id)
                    ? "border-blue-500/50 bg-blue-500/10 text-blue-300 shadow-sm"
                    : "border-white/5 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                )}
              >
                {slot.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. NOTIFICATIONS */}
      <div className="bg-[#1e293b]/50 backdrop-blur-md p-6 rounded-[2rem] border border-white/5 shadow-sm">
         <h3 className="font-bold text-lg text-white mb-6 flex items-center gap-2">
           <Bell className="h-5 w-5 text-orange-400" /> Notifications
         </h3>
         <div className="flex flex-col gap-4 bg-[#0a0f1c]/50 p-4 rounded-2xl border border-white/5">
           <div className="flex items-center justify-between">
             <div className="space-y-0.5">
               <Label htmlFor="notifications" className="text-base font-bold text-slate-200">Activer les notifications</Label>
               <p className="text-sm text-slate-500">Recevez des alertes pour les matchs et opportunités.</p>
             </div>
             <Checkbox 
               id="notifications" 
               checked={notifications} 
               onCheckedChange={(checked) => setNotifications(checked === true)}
               className="h-6 w-6 border-white/20 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
             />
           </div>
           
           <div className="pt-4 border-t border-white/5">
              <p className="text-xs text-slate-400 mb-3 uppercase tracking-wider font-bold">Notifications Push (Mobile & Desktop)</p>
              <PushManager />
           </div>
         </div>
      </div>

      {/* VISIBILITY */}
      <div className="bg-[#1e293b]/50 backdrop-blur-md p-6 rounded-[2rem] border border-white/5 shadow-sm">
         <h3 className="font-bold text-lg text-white mb-6 flex items-center gap-2">
           <Shield className="h-5 w-5 text-emerald-400" /> Confidentialité du Profil
         </h3>
         
         <div className="flex flex-col gap-3">
           {[
             { value: 'public', label: 'Public (Visible par tous)' },
             { value: 'network_only', label: 'Réseau uniquement (Membres connectés)' },
             { value: 'private', label: 'Privé (Invisible)' }
           ].map((option) => (
             <button
               key={option.value}
               onClick={() => setVisibility(option.value)}
               className={cn(
                 "flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                 visibility === option.value 
                   ? "border-blue-500/50 bg-blue-500/10" 
                   : "border-white/5 bg-[#0a0f1c]/30 hover:bg-[#0a0f1c]/50 hover:border-white/10"
               )}
             >
               <span className={cn("font-medium", visibility === option.value ? "text-blue-300 font-bold" : "text-slate-400")}>
                 {option.label}
               </span>
               <div className={cn(
                 "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                 visibility === option.value ? "border-blue-500 bg-blue-500" : "border-slate-600 bg-transparent"
               )}>
                 {visibility === option.value && <div className="h-2 w-2 rounded-full bg-white" />}
               </div>
             </button>
           ))}
         </div>
      </div>

      {/* SECURITY / PASSWORD */}
      <div className="bg-[#1e293b]/50 backdrop-blur-md p-6 rounded-[2rem] border border-white/5 shadow-sm">
         <h3 className="font-bold text-lg text-white mb-6 flex items-center gap-2">
           <Lock className="h-5 w-5 text-rose-400" /> Sécurité & Mot de passe
         </h3>
         
         <div className="space-y-4 bg-[#0a0f1c]/50 p-6 rounded-2xl border border-white/5">
            <p className="text-sm text-slate-400 mb-4">
              Définissez un mot de passe pour vous connecter plus facilement sans attendre le lien magique.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nouveau mot de passe</Label>
                <Input 
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-slate-900 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmer</Label>
                <Input 
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-slate-900 border-white/10"
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button 
                onClick={handlePasswordUpdate} 
                disabled={passwordLoading || !newPassword || !confirmPassword}
                variant="outline"
                className="border-white/10 hover:bg-white/5 text-white"
              >
                {passwordLoading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
              </Button>
            </div>
         </div>
      </div>

      <div className="flex justify-end pt-4">
         <Button 
           onClick={handleSave} 
           disabled={loading}
           className="bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-blue-900/20 border border-white/10"
         >
           {loading ? "Enregistrement..." : "Enregistrer les modifications"}
         </Button>
      </div>
    </div>
  );
}
