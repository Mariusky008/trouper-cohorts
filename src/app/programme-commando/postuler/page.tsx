"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function CommandoApplyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    businessName: "",
    city: "",
    activity: "",
    objective: "",
    availability: "",
  });

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const response = await fetch("/api/commando/apply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });
    const result = await response.json();
    setLoading(false);
    if (result.error || !result.applicationId) {
      toast.error(result.error || "Impossible d'enregistrer votre candidature.");
      return;
    }
    router.push(`/programme-commando/paiement?applicationId=${result.applicationId}`);
  };

  return (
    <main className="min-h-screen bg-[#E2D9BC] py-14 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-[2rem] border-4 border-[#2E130C] p-6 md:p-10 shadow-[8px_8px_0px_0px_#2E130C]">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-black text-[#2E130C]">Postuler au Programme Commando</h1>
          <p className="text-[#2E130C]/70 mt-3 font-semibold">
            Renseignez vos infos. Vous accédez juste après à la page de paiement Stripe (149€/mois pendant 6 mois).
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="font-bold text-[#2E130C]">Nom complet</Label>
              <Input id="fullName" value={form.fullName} onChange={(event) => update("fullName", event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessName" className="font-bold text-[#2E130C]">Entreprise / activité</Label>
              <Input id="businessName" value={form.businessName} onChange={(event) => update("businessName", event.target.value)} required />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold text-[#2E130C]">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="font-bold text-[#2E130C]">Téléphone</Label>
              <Input id="phone" value={form.phone} onChange={(event) => update("phone", event.target.value)} required />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city" className="font-bold text-[#2E130C]">Ville</Label>
              <Input id="city" value={form.city} onChange={(event) => update("city", event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="availability" className="font-bold text-[#2E130C]">Disponibilité hebdo</Label>
              <Input id="availability" placeholder="Ex: 1 RDV / semaine" value={form.availability} onChange={(event) => update("availability", event.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity" className="font-bold text-[#2E130C]">Votre activité en une phrase</Label>
            <Textarea id="activity" className="min-h-20" value={form.activity} onChange={(event) => update("activity", event.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="objective" className="font-bold text-[#2E130C]">Objectif principal sur 6 mois</Label>
            <Textarea id="objective" className="min-h-24" value={form.objective} onChange={(event) => update("objective", event.target.value)} required />
          </div>

          <Button type="submit" disabled={loading} className="w-full h-12 bg-[#B20B13] hover:bg-[#7A0000] text-[#E2D9BC] font-black text-base border-2 border-[#2E130C]">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continuer vers le paiement"}
          </Button>
        </form>
      </div>
    </main>
  );
}
