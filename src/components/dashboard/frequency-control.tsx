"use client";

import { useState } from "react";
import { 
  Settings, PauseCircle, PlayCircle, Sun, Calendar, Clock, BarChart3 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { updateNetworkSettings } from "@/lib/actions/network-settings";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface FrequencyControlProps {
  settings: any;
  potentialCount: number;
}

const DAYS = [
  { id: 'mon', label: 'L' },
  { id: 'tue', label: 'M' },
  { id: 'wed', label: 'M' },
  { id: 'thu', label: 'J' },
  { id: 'fri', label: 'V' },
  { id: 'sat', label: 'S' },
  { id: 'sun', label: 'D' },
];

const SLOTS = [
  { id: '09-11', label: '09h-11h' },
  { id: '12-14', label: '12h-14h' },
  { id: '14-16', label: '14h-16h' },
  { id: '17-19', label: '17h-19h' },
];

export function FrequencyControl({ settings, potentialCount }: FrequencyControlProps) {
  const { toast } = useToast();
  const [frequency, setFrequency] = useState(settings?.frequency_per_week || 5);
  const [status, setStatus] = useState(settings?.status || 'active');
  const [loading, setLoading] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Advanced settings state
  const [selectedDays, setSelectedDays] = useState<string[]>(settings?.preferred_days || ['mon', 'tue', 'wed', 'thu', 'fri']);
  const [selectedSlots, setSelectedSlots] = useState<string[]>(settings?.preferred_slots || ['09-11', '14-16']);

  const handleUpdate = async (updates: any) => {
    setLoading(true);
    try {
      await updateNetworkSettings(updates);
      toast({ title: "Préférences mises à jour !" });
      if (updates.status) setStatus(updates.status);
      if (updates.frequency_per_week) setFrequency(updates.frequency_per_week);
    } catch (e) {
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const togglePause = () => {
    const newStatus = status === 'active' ? 'pause' : 'active';
    handleUpdate({ status: newStatus });
  };

  const toggleDay = (day: string) => {
    const newDays = selectedDays.includes(day) 
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day];
    setSelectedDays(newDays);
  };

  const toggleSlot = (slot: string) => {
    const newSlots = selectedSlots.includes(slot) 
      ? selectedSlots.filter(s => s !== slot)
      : [...selectedSlots, slot];
    setSelectedSlots(newSlots);
  };

  const saveAdvanced = async () => {
    await handleUpdate({
      preferred_days: selectedDays,
      preferred_slots: selectedSlots
    });
    setIsDetailsOpen(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col h-full"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-black text-xl text-slate-900 flex items-center gap-2">
            Votre Rythme
          </h3>
          <p className="text-slate-500 text-sm">Gérez votre pression.</p>
        </div>
        
        <div className="flex items-center gap-2">
           <div className="bg-purple-50 px-3 py-1 rounded-full border border-purple-100 flex items-center gap-2">
             <BarChart3 className="h-4 w-4 text-purple-600" />
             <span className="font-black text-purple-700 text-sm">{potentialCount} opp.</span>
           </div>
        </div>
      </div>

      <div className="space-y-8 flex-1 flex flex-col justify-center">
        {/* FREQUENCY SLIDER */}
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <label className="text-sm font-bold text-slate-700">Fréquence Hebdomadaire</label>
            <span className="text-3xl font-black text-blue-600">{frequency} <span className="text-sm text-slate-400 font-medium">jours/sem</span></span>
          </div>
          <div className="px-2">
            <Slider 
                value={[frequency]} 
                min={1} 
                max={7} 
                step={1} 
                onValueChange={(vals) => setFrequency(vals[0])}
                onValueCommit={(vals) => handleUpdate({ frequency_per_week: vals[0] })}
                className="py-4 cursor-pointer"
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 font-bold uppercase tracking-wider px-1">
             <span>Cool (1j)</span>
             <span>Intense (7j)</span>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex gap-3 pt-4">
          <Button 
            variant={status === 'active' ? "outline" : "default"}
            className={cn(
              "flex-1 h-14 rounded-2xl font-bold border-2 transition-all text-base",
              status === 'active' 
                ? "border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 text-slate-700" 
                : "bg-green-600 hover:bg-green-700 border-green-600 text-white shadow-lg shadow-green-200"
            )}
            onClick={togglePause}
            disabled={loading}
          >
            {status === 'active' ? (
              <><PauseCircle className="mr-2 h-5 w-5" /> Mettre en pause</>
            ) : (
              <><PlayCircle className="mr-2 h-5 w-5" /> Reprendre</>
            )}
          </Button>

          <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" className="h-14 w-14 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200">
                <Settings className="h-6 w-6 text-slate-600" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Vos Préférences</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                 
                 {/* DAYS */}
                 <div className="space-y-3">
                   <Label className="text-base font-bold">Jours préférés</Label>
                   <div className="flex gap-2 justify-between">
                     {DAYS.map(day => (
                       <button
                         key={day.id}
                         onClick={() => toggleDay(day.id)}
                         className={cn(
                           "h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors",
                           selectedDays.includes(day.id) 
                             ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                             : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                         )}
                       >
                         {day.label}
                       </button>
                     ))}
                   </div>
                 </div>

                 {/* SLOTS */}
                 <div className="space-y-3">
                   <Label className="text-base font-bold">Créneaux horaires</Label>
                   <div className="grid grid-cols-2 gap-3">
                     {SLOTS.map(slot => (
                       <div 
                         key={slot.id}
                         onClick={() => toggleSlot(slot.id)}
                         className={cn(
                           "p-3 rounded-xl border-2 cursor-pointer font-bold text-center transition-all",
                           selectedSlots.includes(slot.id)
                             ? "border-blue-600 bg-blue-50 text-blue-700"
                             : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
                         )}
                       >
                         {slot.label}
                       </div>
                     ))}
                   </div>
                 </div>

                 <Button onClick={saveAdvanced} className="w-full h-12 rounded-xl font-bold bg-slate-900 text-white">
                   Enregistrer
                 </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {status === 'pause' && (
           <div className="bg-orange-50 text-orange-800 p-4 rounded-2xl text-sm font-medium flex items-start gap-3 border border-orange-100">
             <Sun className="h-5 w-5 shrink-0 mt-0.5" /> 
             <span>Mode Vacances activé. Profitez de votre temps libre !</span>
           </div>
        )}
      </div>
    </motion.div>
  );
}
