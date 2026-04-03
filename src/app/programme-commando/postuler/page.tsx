"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Poppins } from "next/font/google";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const validateForm = (form: {
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  city: string;
  activity: string;
  objective: string;
  availability: string;
}) => {
  if (form.fullName.trim().length < 3) return "Nom complet requis";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Email invalide";
  if (form.phone.trim().length < 8) return "Téléphone invalide";
  if (form.businessName.trim().length < 2) return "Nom d'activité requis";
  if (form.city.trim().length < 2) return "Ville requise";
  if (form.activity.trim().length < 2) return "Activité requise";
  if (form.objective.trim().length < 10) return "Objectif trop court";
  if (form.availability.trim().length < 1) return "Disponibilité requise";
  return "";
};

const poppins = Poppins({
  weight: ["400", "500", "600", "700", "900"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

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
    const validationError = validateForm(form);
    if (validationError) {
      toast.error(validationError);
      return;
    }
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
      const firstFieldError =
        result.fieldErrors &&
        Object.values(result.fieldErrors).find(
          (messages) => Array.isArray(messages) && messages.length > 0
        );
      const details = Array.isArray(firstFieldError) ? firstFieldError[0] : "";
      toast.error(details || result.error || "Impossible d'enregistrer votre candidature.");
      return;
    }
    if (result.canPayNow) {
      router.push(`/programme-commando/paiement?applicationId=${result.applicationId}`);
      return;
    }
    router.push(`/programme-commando/eligibilite?applicationId=${result.applicationId}&status=${result.qualificationStatus || "pending_review"}`);
  };

  return (
    <main className={`${poppins.variable} font-poppins min-h-screen bg-[#F7F7F7] text-[#0B0B0B]`}>
      <section className="border-b border-black/10 bg-black text-white">
        <div className="mx-auto max-w-5xl px-4 py-10 md:py-14">
          <Link href="/popey-human" className="inline-flex items-center rounded-full border border-white/30 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white/85 hover:bg-white hover:text-black transition">
            ← Retour
          </Link>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#B6FF2B]/40 bg-[#B6FF2B]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#B6FF2B]">
            Audit 15 min • Sur sélection
          </div>
          <h1 className="mt-4 text-4xl md:text-6xl font-black leading-[1.03]">
            Postuler au Programme Commando
          </h1>
          <p className="mt-4 text-base md:text-lg font-medium text-white/80 max-w-3xl">
            Renseignez vos infos pour l'étape de sélection. Si vous êtes déjà qualifié(e) après appel, le paiement se débloque immédiatement.
          </p>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-4xl">
            <div className="rounded-xl border border-white/20 bg-white/5 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.12em] font-black text-white/65">Format</p>
              <p className="mt-1 text-lg font-black">Accompagnement 6 mois</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/5 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.12em] font-black text-white/65">Objectif</p>
              <p className="mt-1 text-lg font-black">1ère synergie rentable</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/5 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.12em] font-black text-white/65">Accès</p>
              <p className="mt-1 text-lg font-black text-[#B6FF2B]">Paiement après validation</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-wide">
            <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1">1. Candidature</span>
            <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1">2. Appel de sélection</span>
            <span className="rounded-full border border-[#B6FF2B]/40 bg-[#B6FF2B]/15 px-3 py-1 text-[#B6FF2B]">3. Paiement si validé</span>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-14 px-4">
        <div className="max-w-3xl mx-auto rounded-2xl border border-black/15 bg-white p-6 md:p-8 shadow-[0_16px_35px_-24px_rgba(0,0,0,0.35)]">
          <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="font-bold text-black/80">Nom complet</Label>
              <Input id="fullName" className="h-12 border-black/20 bg-[#FAFAFA] focus-visible:ring-black" value={form.fullName} onChange={(event) => update("fullName", event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessName" className="font-bold text-black/80">Entreprise / activité</Label>
              <Input id="businessName" className="h-12 border-black/20 bg-[#FAFAFA] focus-visible:ring-black" value={form.businessName} onChange={(event) => update("businessName", event.target.value)} required />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold text-black/80">Email</Label>
              <Input id="email" type="email" className="h-12 border-black/20 bg-[#FAFAFA] focus-visible:ring-black" value={form.email} onChange={(event) => update("email", event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="font-bold text-black/80">Téléphone</Label>
              <Input id="phone" type="tel" minLength={8} className="h-12 border-black/20 bg-[#FAFAFA] focus-visible:ring-black" value={form.phone} onChange={(event) => update("phone", event.target.value)} required />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city" className="font-bold text-black/80">Ville</Label>
              <Input id="city" className="h-12 border-black/20 bg-[#FAFAFA] focus-visible:ring-black" value={form.city} onChange={(event) => update("city", event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="availability" className="font-bold text-black/80">Disponibilité hebdo</Label>
              <Input id="availability" className="h-12 border-black/20 bg-[#FAFAFA] focus-visible:ring-black" placeholder="Ex: 1 RDV / semaine" value={form.availability} onChange={(event) => update("availability", event.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity" className="font-bold text-black/80">Votre activité en une phrase</Label>
            <Textarea id="activity" className="min-h-20 border-black/20 bg-[#FAFAFA] focus-visible:ring-black" value={form.activity} onChange={(event) => update("activity", event.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="objective" className="font-bold text-black/80">Objectif principal sur 6 mois</Label>
            <Textarea id="objective" className="min-h-24 border-black/20 bg-[#FAFAFA] focus-visible:ring-black" minLength={10} value={form.objective} onChange={(event) => update("objective", event.target.value)} required />
          </div>

          <Button type="submit" disabled={loading} className="w-full h-12 md:h-14 bg-black hover:bg-black/90 text-white font-black text-base uppercase tracking-wide transition hover:translate-y-[-1px] hover:shadow-[0_8px_0_0_#B6FF2B]">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Envoyer ma candidature"}
          </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
