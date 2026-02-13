"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitRegistration } from "@/app/actions/register";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function PreRegistrationForm({ programType = "entrepreneur" }: { programType?: string }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
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
             const firstError = Object.values(res.error)[0];
             toast.error(Array.isArray(firstError) ? firstError[0] : "Erreur de validation");
        }
    } else {
      setSuccess(true);
      toast.success("Candidature envoyée !");
    }
  }

  if (success) {
    return (
        <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/50 text-center animate-in zoom-in-95 duration-500 max-w-md mx-auto my-10">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Check className="w-12 h-12 text-green-600" strokeWidth={3} />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Bienvenue à bord ! ⚓️</h2>
            <div className="space-y-4 text-slate-600 mb-8">
                <p className="text-lg">
                    Ta candidature a bien été reçue.
                </p>
                <p className="text-sm bg-blue-50 p-4 rounded-lg text-blue-800 border border-blue-100">
                    📧 Un email de confirmation vient de t'être envoyé. Vérifie ta boîte de réception (et tes spams) !
                </p>
            </div>
            <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
                Retour au site
            </Button>
        </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md mx-auto w-full bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-lg border border-white/20">
        <input type="hidden" name="programType" value={programType} />
        
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
            <Label htmlFor="trade" className="text-xs uppercase font-bold text-slate-500">
                {programType === 'job_seeker' ? 'Situation Actuelle' : 'Métier'}
            </Label>
            <Select name="trade" onValueChange={(val) => setIsOtherTrade(val === "autre")} required>
                <SelectTrigger className="bg-white/50">
                    <SelectValue placeholder={programType === 'job_seeker' ? "Quelle est votre situation ?" : "Sélectionnez votre métier"} />
                </SelectTrigger>
                <SelectContent>
                    {programType === 'job_seeker' ? (
                        <>
                            <SelectItem value="sans_emploi">Sans Emploi</SelectItem>
                            <SelectItem value="avec_emploi">En poste (Salarié)</SelectItem>
                            <SelectItem value="etudiant">Étudiant</SelectItem>
                            <SelectItem value="autre">Autre...</SelectItem>
                        </>
                    ) : (
                        <>
                            <SelectItem value="coach_sportif">Coach Sportif</SelectItem>
                            <SelectItem value="therapeute">Thérapeute / Bien-être</SelectItem>
                            <SelectItem value="consultant">Consultant / Freelance</SelectItem>
                            <SelectItem value="artiste">Artiste / Créatif</SelectItem>
                            <SelectItem value="autre">Autre...</SelectItem>
                        </>
                    )}
                </SelectContent>
            </Select>
        </div>

        {isOtherTrade && (
            <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="otherTrade" className="text-xs uppercase font-bold text-slate-500">Précisez</Label>
                <Input name="otherTrade" id="otherTrade" placeholder="Précisez votre situation..." className="bg-white/50" required />
            </div>
        )}

        <div className="space-y-1">
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

        {programType === 'job_seeker' && (
             <div className="space-y-1 pt-2">
                <Label htmlFor="trainingChoice" className="text-xs uppercase font-bold text-orange-600">Votre Choix de Formation</Label>
                <Select name="trainingChoice" required>
                    <SelectTrigger className="bg-orange-50/50 border-orange-200 text-orange-900 font-medium h-auto py-3">
                        <SelectValue placeholder="🚀 Quelle formule choisissez-vous ?" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="formation_1">
                            <div className="flex flex-col text-left">
                                <span className="font-bold">Formation 1 (3 Semaines)</span>
                                <span className="text-xs text-slate-500">Trouver sa voie • 199€</span>
                            </div>
                        </SelectItem>
                        <SelectItem value="formation_2">
                             <div className="flex flex-col text-left">
                                <span className="font-bold">Formation 2 (2 Semaines)</span>
                                <span className="text-xs text-slate-500">Trouver ses clients • 199€</span>
                            </div>
                        </SelectItem>
                        <SelectItem value="formation_1_2">
                             <div className="flex flex-col text-left">
                                <span className="font-bold">Pack Complet (5 Semaines)</span>
                                <span className="text-xs text-green-600 font-bold">Best Seller • 369€ (au lieu de 398€)</span>
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>
        )}

        <Button type="submit" size="lg" className="w-full mt-4 bg-blue-900 hover:bg-blue-800 text-white font-bold h-12 text-lg shadow-xl transition-all hover:scale-[1.02]" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "POSTULER MAINTENANT"}
        </Button>

        <p className="text-[10px] text-center text-slate-500 mt-2">
            En cliquant, vous acceptez de recevoir nos communications. Pas de spam, promis.
        </p>
    </form>
  );
}
