"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitRegistration } from "@/app/actions/register";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function PreRegistrationForm() {
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<{id: string, label: string}[]>([]);
  const [isOtherTrade, setIsOtherTrade] = useState(false);

  useEffect(() => {
      const supabase = createClient();
      supabase.from("public_sessions").select("id, label").then(({ data }) => {
          if (data) setSessions(data);
      });
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const res = await submitRegistration(formData);

    setLoading(false);

    if (res.error) {
        if (typeof res.error === 'string') {
             toast.error(res.error);
        } else {
             // Affiche la première erreur Zod
             const firstError = Object.values(res.error)[0];
             toast.error(Array.isArray(firstError) ? firstError[0] : "Erreur de validation");
        }
    } else {
      toast.success("Candidature envoyée ! Vérifiez vos emails.");
      (event.target as HTMLFormElement).reset();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md mx-auto w-full bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-lg border border-white/20">
        
        <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
                <Label htmlFor="firstName" className="text-xs uppercase font-bold text-slate-500">Prénom</Label>
                <Input name="firstName" id="firstName" placeholder="Jean" required className="bg-white/50" />
            </div>
            <div className="space-y-1">
                <Label htmlFor="lastName" className="text-xs uppercase font-bold text-slate-500">Nom</Label>
                <Input name="lastName" id="lastName" placeholder="Dupont" required className="bg-white/50" />
            </div>
        </div>

        <div className="space-y-1">
            <Label htmlFor="email" className="text-xs uppercase font-bold text-slate-500">Email</Label>
            <Input name="email" id="email" type="email" placeholder="jean@exemple.com" required className="bg-white/50" />
        </div>

        <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
                <Label htmlFor="phone" className="text-xs uppercase font-bold text-slate-500">Téléphone</Label>
                <Input name="phone" id="phone" type="tel" placeholder="06 12 34 56 78" required className="bg-white/50" />
            </div>
            <div className="space-y-1">
                <Label htmlFor="instagram" className="text-xs uppercase font-bold text-slate-500">Instagram (Optionnel)</Label>
                <Input name="instagram" id="instagram" placeholder="@pseudo" className="bg-white/50" />
            </div>
        </div>

        <div className="space-y-1">
            <Label htmlFor="trade" className="text-xs uppercase font-bold text-slate-500">Métier</Label>
            <Select name="trade" onValueChange={(val) => setIsOtherTrade(val === "autre")} required>
                <SelectTrigger className="bg-white/50">
                    <SelectValue placeholder="Sélectionnez votre métier" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="coach_sportif">Coach Sportif</SelectItem>
                    <SelectItem value="therapeute">Thérapeute / Bien-être</SelectItem>
                    <SelectItem value="consultant">Consultant / Freelance</SelectItem>
                    <SelectItem value="artiste">Artiste / Créatif</SelectItem>
                    <SelectItem value="autre">Autre...</SelectItem>
                </SelectContent>
            </Select>
        </div>

        {isOtherTrade && (
            <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="otherTrade" className="text-xs uppercase font-bold text-slate-500">Précisez votre métier</Label>
                <Input name="otherTrade" id="otherTrade" placeholder="Ex: Boulanger, Architecte..." className="bg-white/50" required />
            </div>
        )}

        <div className="space-y-1 pt-2">
            <Label htmlFor="sessionDate" className="text-xs uppercase font-bold text-blue-600">Session Souhaitée</Label>
            <Select name="sessionDate" required>
                <SelectTrigger className="bg-blue-50/50 border-blue-200 text-blue-900 font-medium h-12">
                    <SelectValue placeholder="📅 Choisir une date de départ" />
                </SelectTrigger>
                <SelectContent>
                    {sessions.map(s => (
                        <SelectItem key={s.id} value={s.label}>{s.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

        <Button type="submit" size="lg" className="w-full mt-4 bg-blue-900 hover:bg-blue-800 text-white font-bold h-12 text-lg shadow-xl transition-all hover:scale-[1.02]" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "POSTULER MAINTENANT"}
        </Button>

        <p className="text-[10px] text-center text-slate-500 mt-2">
            En cliquant, vous acceptez de recevoir nos communications. Pas de spam, promis.
        </p>
    </form>
  );
}
