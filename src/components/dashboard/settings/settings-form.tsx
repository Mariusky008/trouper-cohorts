"use client";

import { useState } from "react";
import { Bell, Shield, Calendar, Clock, PauseCircle, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { updateNetworkSettings } from "@/lib/actions/network-settings";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
    <div className="space-y-8 max-w-3xl">
      
      {/* 1. FREQUENCY & RHYTHM (New Section) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <Clock className="h-5 w-5 text-slate-500" /> Rythme & Disponibilités
          </h3>
          <Button 
            variant={status === 'active' ? "outline" : "default"}
            size="sm"
            onClick={toggleStatus}
            className={cn(
              "font-bold transition-colors",
              status === 'active' 
                ? "text-slate-500 border-slate-200 hover:text-red-600 hover:bg-red-50 hover:border-red-200" 
                : "bg-green-600 hover:bg-green-700 text-white"
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
        <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
           <div className="flex justify-between items-end mb-2">
             <Label className="text-base font-bold text-slate-700">Fréquence Hebdomadaire</Label>
             <span className="text-xl font-black text-blue-600 bg-white px-3 py-1 rounded-lg border border-blue-100 shadow-sm">
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
           <div className="flex justify-between text-xs text-slate-400 font-medium px-1">
              <span>Mode Léger (1j)</span>
              <span>Mode Intensif (7j)</span>
           </div>
        </div>

        {/* Days Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-bold text-slate-600 uppercase tracking-wide">Jours de disponibilité</Label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map(day => (
              <button
                key={day.id}
                onClick={() => toggleDay(day.id)}
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm transition-all border-2",
                  selectedDays.includes(day.id) 
                    ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200" 
                    : "bg-white text-slate-400 border-slate-100 hover:border-slate-300"
                )}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        {/* Slots Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-bold text-slate-600 uppercase tracking-wide">Créneaux horaires préférés</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SLOTS.map(slot => (
              <div 
                key={slot.id}
                onClick={() => toggleSlot(slot.id)}
                className={cn(
                  "p-3 rounded-xl border-2 cursor-pointer font-bold text-center text-sm transition-all",
                  selectedSlots.includes(slot.id)
                    ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                    : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
                )}
              >
                {slot.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. NOTIFICATIONS */}
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
