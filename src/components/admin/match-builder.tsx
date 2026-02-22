"use client";

import { useState } from "react";
import { UserPlus, Calendar as CalendarIcon, Clock, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createManualMatch } from "@/lib/actions/network-admin";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface UserOption {
  value: string;
  label: string;
}

interface MatchBuilderProps {
  users: UserOption[];
}

export function MatchBuilder({ users }: MatchBuilderProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [user1, setUser1] = useState<string>("");
  const [user2, setUser2] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>("09h – 11h");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user1 || !user2) {
      toast({ title: "Erreur", description: "Sélectionnez deux utilisateurs.", variant: "destructive" });
      return;
    }

    if (user1 === user2) {
      toast({ title: "Erreur", description: "Impossible de matcher la même personne.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("user1_id", user1);
    formData.append("user2_id", user2);
    formData.append("date", date);
    formData.append("time", time);

    const result = await createManualMatch(formData);

    if (result.error) {
        toast({ title: "Erreur", description: result.error, variant: "destructive" });
    } else {
        toast({ 
            title: "Match Créé !", 
            description: "Les utilisateurs le verront instantanément sur leur tableau de bord." 
        });
        // Reset (optional)
        setUser2("");
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
         <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-blue-600" /> Créateur de Duo Express
         </h3>
         <div className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border border-slate-100">
            Mode Admin
         </div>
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase">Partenaire A</Label>
                <Select value={user1} onValueChange={setUser1}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Membres</SelectLabel>
                            {users.map(u => (
                                <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-col justify-end pb-2 items-center md:items-start">
               <div className="hidden md:block bg-slate-100 p-2 rounded-full text-slate-400">
                  <ArrowRight className="h-4 w-4" />
               </div>
            </div>

            <div className="space-y-2 md:-mt-10 md:col-start-2">
                <Label className="text-xs font-bold text-slate-500 uppercase">Partenaire B</Label>
                <Select value={user2} onValueChange={setUser2}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Membres</SelectLabel>
                            {users.map(u => (
                                <SelectItem key={u.value} value={u.value} disabled={u.value === user1}>
                                    {u.label}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
         </div>

         <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50">
             <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" /> Date
                </Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-9" />
             </div>
             <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Heure
                </Label>
                <Select value={time} onValueChange={setTime}>
                    <SelectTrigger className="w-full h-9">
                        <SelectValue placeholder="Heure" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="09h – 11h">09h – 11h</SelectItem>
                        <SelectItem value="12h – 14h">12h – 14h</SelectItem>
                        <SelectItem value="14h – 16h">14h – 16h</SelectItem>
                        <SelectItem value="17h – 19h">17h – 19h</SelectItem>
                    </SelectContent>
                </Select>
             </div>
         </div>

         <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 font-bold">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Générer le Match
         </Button>
      </form>
    </div>
  );
}
