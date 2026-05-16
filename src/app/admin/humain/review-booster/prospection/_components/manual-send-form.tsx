"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ManualSendForm() {
  const [prenom, setPrenom] = useState("");
  const [entreprise, setEntreprise] = useState("");
  const [nbAvis, setNbAvis] = useState("");
  const [noteMoyenne, setNoteMoyenne] = useState("");
  const [telephone, setTelephone] = useState("");
  const [contentSid, setContentSid] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);
    try {
      const res = await fetch("/api/admin/humain/review-booster/prospection/manual-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prenom, entreprise, nbAvis, noteMoyenne, telephone, contentSid }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Erreur inconnue.");
      else {
        setSuccess(true);
        setPrenom("");
        setEntreprise("");
        setNbAvis("");
        setNoteMoyenne("");
        setTelephone("");
      }
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border-2 border-violet-200 bg-violet-50 p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center text-white text-sm shrink-0">✍️</div>
        <div>
          <h2 className="text-xs font-black uppercase tracking-widest text-violet-700">Envoi Manuel</h2>
          <p className="text-xs text-violet-500 mt-0.5">Vous avez trouvé un prospect vous-même ? Envoyez-lui directement.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Ligne 1 — Identité */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-violet-600">
              Prénom du patron <span className="normal-case font-normal text-violet-400">(optionnel)</span>
            </label>
            <Input
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              placeholder="Martin"
              className="bg-white border-violet-200 focus:border-violet-400 focus:ring-violet-200"
            />
            <p className="text-[10px] text-violet-400">→ variable {`{{1}}`} dans le message</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-violet-600">
              Nom de l&apos;entreprise <span className="text-rose-500">*</span>
            </label>
            <Input
              value={entreprise}
              onChange={(e) => setEntreprise(e.target.value)}
              placeholder="Salon Éclat"
              required
              className="bg-white border-violet-200 focus:border-violet-400 focus:ring-violet-200"
            />
            <p className="text-[10px] text-violet-400">→ variable {`{{2}}`} dans le message</p>
          </div>
        </div>

        {/* Ligne 2 — Stats Google */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-violet-600">
              Nb avis Google <span className="normal-case font-normal text-violet-400">(optionnel)</span>
            </label>
            <Input
              type="number"
              value={nbAvis}
              onChange={(e) => setNbAvis(e.target.value)}
              placeholder="47"
              min={0}
              className="bg-white border-violet-200 focus:border-violet-400 focus:ring-violet-200"
            />
            <p className="text-[10px] text-violet-400">→ variable {`{{3}}`} · ex : "47 avis"</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-violet-600">
              Note moyenne <span className="normal-case font-normal text-violet-400">(optionnel)</span>
            </label>
            <Input
              type="number"
              value={noteMoyenne}
              onChange={(e) => setNoteMoyenne(e.target.value)}
              placeholder="4.7"
              min={1}
              max={5}
              step={0.1}
              className="bg-white border-violet-200 focus:border-violet-400 focus:ring-violet-200"
            />
            <p className="text-[10px] text-violet-400">→ variable {`{{4}}`} · ex : "4.7★"</p>
          </div>
        </div>

        {/* Ligne 3 — Contact + Template */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-violet-600">
              Téléphone WhatsApp <span className="text-rose-500">*</span>
            </label>
            <Input
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              placeholder="+33612345678"
              required
              className="bg-white border-violet-200 focus:border-violet-400 focus:ring-violet-200 font-mono"
            />
            <p className="text-[10px] text-violet-400">Format E.164 : +336xxxxxxxx</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-violet-600">
              Content SID Twilio <span className="text-rose-500">*</span>
            </label>
            <Input
              value={contentSid}
              onChange={(e) => setContentSid(e.target.value)}
              placeholder="HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              required
              className="bg-white border-violet-200 focus:border-violet-400 focus:ring-violet-200 font-mono text-xs"
            />
          </div>
        </div>

        {/* Aperçu variables */}
        {(entreprise || nbAvis || noteMoyenne) && (
          <div className="bg-white border border-violet-100 rounded-xl p-3 space-y-1">
            <p className="text-[10px] font-semibold text-violet-500 uppercase tracking-wide">Aperçu du message</p>
            <p className="text-xs text-neutral-700 leading-relaxed">
              Bonjour{prenom ? ` ${prenom}` : ","} 👋 · {entreprise || "…"} · {nbAvis ? `${nbAvis} avis` : "peu d'avis"} · {noteMoyenne ? `${noteMoyenne}★` : "bonne★"}
            </p>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={loading || !entreprise || !telephone || !contentSid}
            className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-6 py-2 text-sm"
          >
            {loading ? "Envoi en cours…" : "💬 Envoyer le WhatsApp"}
          </Button>

          {success && (
            <p className="text-sm text-emerald-700 font-medium">✅ WhatsApp envoyé avec succès !</p>
          )}
          {error && (
            <p className="text-sm text-red-600 font-medium">{error}</p>
          )}
        </div>
      </form>
    </div>
  );
}
