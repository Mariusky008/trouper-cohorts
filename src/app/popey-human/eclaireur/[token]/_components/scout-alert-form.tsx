"use client";

import { useMemo, useState } from "react";

type Props = {
  inviteToken: string;
  sponsorName: string;
  submitAction: (formData: FormData) => void | Promise<void>;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function ScoutAlertForm({ inviteToken, sponsorName, submitAction }: Props) {
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [projectType, setProjectType] = useState("");
  const [estimatedDealValue, setEstimatedDealValue] = useState("");
  const [comment, setComment] = useState("");

  const progress = useMemo(() => {
    let score = 0;
    if (contactName.trim()) score += 1;
    if (contactPhone.trim()) score += 1;
    if (projectType.trim()) score += 1;
    if (estimatedDealValue.trim()) score += 1;
    if (comment.trim()) score += 1;
    return clamp(Math.round((score / 5) * 100), 0, 100);
  }, [comment, contactName, contactPhone, estimatedDealValue, projectType]);

  const completedContact = Boolean(contactName.trim() && contactPhone.trim());
  const completedProject = Boolean(projectType.trim());
  const completedContext = Boolean(comment.trim() || estimatedDealValue.trim());
  const completedAll = progress >= 80;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-emerald-300/30 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(16,46,38,0.9)_0%,rgba(11,18,20,0.96)_52%,rgba(7,10,12,1)_100%)] p-4 sm:p-5 shadow-[0_24px_55px_-30px_rgba(16,185,129,0.7)]">
      <div className="pointer-events-none absolute -right-14 -top-16 h-44 w-44 rounded-full bg-emerald-400/25 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -left-12 -bottom-14 h-36 w-36 rounded-full bg-cyan-400/20 blur-3xl animate-pulse" />
      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/35 bg-emerald-400/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-emerald-100">
          ⚡ Lancer une alerte
        </div>
        <h2 className="mt-3 text-xl sm:text-2xl font-black leading-tight">Envoyez un contact en 20 secondes</h2>
        <p className="mt-2 text-sm text-white/80">
          Votre alerte part directement chez <span className="font-black text-emerald-200">{sponsorName}</span> pour qualification et dispatch.
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-white/15 bg-black/25 p-3">
        <div className="flex items-center justify-between gap-2 text-[11px] font-black uppercase tracking-[0.1em]">
          <span className="text-white/70">Progression de l&apos;alerte</span>
          <span className="text-emerald-200">{progress}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-emerald-400 to-cyan-300 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] font-black uppercase tracking-[0.09em]">
          <span className={`rounded-md border px-2 py-1 text-center ${completedContact ? "border-emerald-300/45 bg-emerald-500/20 text-emerald-100" : "border-white/20 bg-white/5 text-white/70"}`}>
            Contact
          </span>
          <span className={`rounded-md border px-2 py-1 text-center ${completedProject ? "border-emerald-300/45 bg-emerald-500/20 text-emerald-100" : "border-white/20 bg-white/5 text-white/70"}`}>
            Projet
          </span>
          <span className={`rounded-md border px-2 py-1 text-center ${completedContext ? "border-emerald-300/45 bg-emerald-500/20 text-emerald-100" : "border-white/20 bg-white/5 text-white/70"}`}>
            Contexte
          </span>
        </div>
      </div>

      <form
        action={submitAction}
        className="relative mt-4 space-y-3"
        onSubmit={() => {
          if (typeof window !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate(18);
          }
        }}
      >
        <input type="hidden" name="invite_token" value={inviteToken} />

        <div>
          <label className="mb-1 block text-[11px] font-black uppercase tracking-[0.12em] text-white/70">Nom du contact</label>
          <input
            name="contact_name"
            required
            value={contactName}
            onChange={(event) => setContactName(event.target.value)}
            placeholder="Ex: Sophie Martin"
            className="h-12 w-full rounded-xl border border-white/20 bg-black/35 px-3 text-sm outline-none transition focus:border-emerald-300/55 focus:ring-2 focus:ring-emerald-300/25"
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-black uppercase tracking-[0.12em] text-white/70">Téléphone du contact</label>
          <input
            name="contact_phone"
            required
            value={contactPhone}
            onChange={(event) => setContactPhone(event.target.value)}
            placeholder="Ex: 06 12 34 56 78"
            className="h-12 w-full rounded-xl border border-white/20 bg-black/35 px-3 text-sm outline-none transition focus:border-emerald-300/55 focus:ring-2 focus:ring-emerald-300/25"
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-black uppercase tracking-[0.12em] text-white/70">Type de projet</label>
          <input
            name="project_type"
            value={projectType}
            onChange={(event) => setProjectType(event.target.value)}
            placeholder="Immo, auto, santé..."
            className="h-12 w-full rounded-xl border border-white/20 bg-black/35 px-3 text-sm outline-none transition focus:border-emerald-300/55 focus:ring-2 focus:ring-emerald-300/25"
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-black uppercase tracking-[0.12em] text-white/70">Valeur estimée (optionnel)</label>
          <input
            name="estimated_deal_value"
            type="number"
            step="0.01"
            min="1"
            value={estimatedDealValue}
            onChange={(event) => setEstimatedDealValue(event.target.value)}
            placeholder="Ex: 2500"
            className="h-12 w-full rounded-xl border border-white/20 bg-black/35 px-3 text-sm outline-none transition focus:border-emerald-300/55 focus:ring-2 focus:ring-emerald-300/25"
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-black uppercase tracking-[0.12em] text-white/70">Commentaire libre</label>
          <textarea
            name="comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Contexte, urgence, dispo..."
            className="min-h-28 w-full rounded-xl border border-white/20 bg-black/35 px-3 py-2 text-sm outline-none transition focus:border-emerald-300/55 focus:ring-2 focus:ring-emerald-300/25"
          />
        </div>

        <button className="group relative h-12 w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-300 via-emerald-400 to-cyan-300 text-black text-sm font-black uppercase tracking-wide shadow-[0_12px_30px_-14px_rgba(16,185,129,0.9)] transition hover:scale-[1.01]">
          <span className="absolute inset-0 bg-white/20 opacity-0 transition group-hover:opacity-100" />
          <span className={`relative inline-flex items-center gap-2 ${completedAll ? "animate-pulse" : ""}`}>
            {completedAll ? "🚀 Lancer mon alerte" : "Lancer mon alerte"}
          </span>
        </button>
      </form>
    </section>
  );
}
