"use client";

import { useState, useRef } from "react";

type CommerceProps = {
  nom: string;
  secteur: string | null;
  ville: string | null;
  nbAvisDebut: number;
  nbAvisActuel: number;
  noteActuelle: number | null;
};

type ClientEntry = { id: string; prenom: string; createdAt: string };
type AvisNegatif = {
  id: string;
  message: string;
  createdAt: string;
  clientPrenom: string | null;
  clientTelephone: string | null;
};

type Props = {
  token: string;
  commerce: CommerceProps;
  clientsAujourdhui: ClientEntry[];
  avisNegatifs: AvisNegatif[];
};

const MILESTONES = [10, 25, 50, 100, 200, 500, 1000];

function getNextMilestone(current: number) {
  return MILESTONES.find((m) => m > current) ?? current + 100;
}

function formatHour(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatPhoneDisplay(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  return digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}

function isValidFrenchPhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  return /^0[67]\d{8}$/.test(digits) || /^0[1-9]\d{8}$/.test(digits);
}

const AVATAR_COLORS = [
  "bg-violet-500", "bg-fuchsia-500", "bg-rose-500",
  "bg-orange-500", "bg-amber-500", "bg-emerald-500", "bg-cyan-500",
];

function avatarColor(prenom: string) {
  const idx = prenom.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export function SaisieForm({ token, commerce, clientsAujourdhui, avisNegatifs }: Props) {
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [loading, setLoading] = useState(false);
  const [successPrenom, setSuccessPrenom] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const prenomRef = useRef<HTMLInputElement>(null);

  const [clients, setClients] = useState<ClientEntry[]>(clientsAujourdhui);
  const [nbAvisActuel, setNbAvisActuel] = useState(commerce.nbAvisActuel);
  const [negatifs, setNegatifs] = useState<AvisNegatif[]>(avisNegatifs);
  const [negatifOuvert, setNegatifOuvert] = useState(false);
  const [traitingId, setTraitingId] = useState<string | null>(null);
  const [pulse, setPulse] = useState(false);

  const DAILY_LIMIT = 10;
  const quotaUsed = clients.length;
  const quotaLeft = Math.max(0, DAILY_LIMIT - quotaUsed);
  const quotaReached = quotaLeft === 0;

  const phoneValid = isValidFrenchPhone(telephone);
  const canSubmit = prenom.trim().length >= 2 && phoneValid && !loading && !quotaReached;

  const delta = Math.max(0, nbAvisActuel - commerce.nbAvisDebut);
  const nextMilestone = getNextMilestone(nbAvisActuel);
  const progressPct = Math.min(100, Math.round((nbAvisActuel / nextMilestone) * 100));
  const restants = nextMilestone - nbAvisActuel;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/saisie/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prenom: prenom.trim(), telephone }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Une erreur s'est produite.");
        setLoading(false);
        return;
      }

      const added: ClientEntry = {
        id: crypto.randomUUID(),
        prenom: data.prenom,
        createdAt: new Date().toISOString(),
      };
      setClients((prev) => [added, ...prev]);
      setSuccessPrenom(data.prenom);
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
      setPrenom("");
      setTelephone("");
      setLoading(false);

      setTimeout(() => {
        setSuccessPrenom(null);
        prenomRef.current?.focus();
      }, 3000);
    } catch {
      setError("Erreur réseau, réessayez.");
      setLoading(false);
    }
  }

  async function handleTraiter(id: string) {
    setTraitingId(id);
    try {
      await fetch(`/api/saisie/${token}/negatif`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNegatifs((prev) => prev.filter((n) => n.id !== id));
    } finally {
      setTraitingId(null);
    }
  }

  return (
    <main
      style={{
        fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
        background: "linear-gradient(160deg, #0f0c29 0%, #1a1040 40%, #0d1b2a 100%)",
      }}
      className="min-h-screen px-4 py-7 pb-16"
    >
      <div className="mx-auto w-full max-w-sm space-y-4">

        {/* ── Hero ── */}
        <div
          className="rounded-3xl p-5 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #6d28d9 0%, #4f46e5 50%, #2563eb 100%)" }}
        >
          {/* Cercles décoratifs */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />

          <div className="relative">
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur rounded-full px-3 py-1 mb-3">
              <span className="text-xs">⭐</span>
              <span className="text-[10px] font-bold tracking-widest uppercase text-white">Partenaire Google</span>
            </div>
            <h1 className="text-xl font-black text-white leading-tight">{commerce.nom}</h1>
            {(commerce.secteur || commerce.ville) && (
              <p className="text-sm text-white/60 mt-0.5">
                {[commerce.secteur, commerce.ville].filter(Boolean).join(" · ")}
              </p>
            )}
            {commerce.noteActuelle && (
              <div className="mt-3 inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-2xl px-3 py-2">
                <span className="text-yellow-300 text-base">★</span>
                <span className="text-white font-bold">{commerce.noteActuelle.toFixed(1)}</span>
                <span className="text-white/50 text-xs">sur Google</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Compteurs ── */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className={`rounded-2xl p-4 text-center transition-transform duration-300 ${pulse ? "scale-110" : "scale-100"}`}
            style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}>
            <p className="text-3xl font-black text-white">{clients.length}</p>
            <p className="text-[10px] text-violet-200 mt-0.5 leading-tight">Clients<br />aujourd'hui</p>
          </div>
          <div className="rounded-2xl p-4 text-center" style={{ background: "linear-gradient(135deg, #059669, #047857)" }}>
            <p className="text-3xl font-black text-white">{delta > 0 ? `+${delta}` : delta}</p>
            <p className="text-[10px] text-emerald-200 mt-0.5 leading-tight">Avis<br />obtenus</p>
          </div>
          <div className="rounded-2xl p-4 text-center" style={{ background: "linear-gradient(135deg, #d97706, #b45309)" }}>
            <p className="text-3xl font-black text-white">
              {commerce.noteActuelle ? `${commerce.noteActuelle.toFixed(1)}` : nbAvisActuel > 0 ? nbAvisActuel : "—"}
            </p>
            <p className="text-[10px] text-amber-200 mt-0.5 leading-tight">
              {commerce.noteActuelle ? "Note\nGoogle" : "Avis\nGoogle"}
            </p>
          </div>
        </div>

        {/* ── Progression ── */}
        <div className="rounded-2xl p-4 border border-white/10" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white/80">🎯 Objectif {nextMilestone} avis</span>
            <span className="text-xs font-black text-violet-300">{nbAvisActuel} / {nextMilestone}</span>
          </div>
          <div className="h-3 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progressPct}%`,
                background: "linear-gradient(90deg, #7c3aed, #2563eb, #06b6d4)",
              }}
            />
          </div>
          <p className="mt-2 text-xs text-white/50">
            {restants === 0
              ? "🎉 Objectif atteint ! Félicitations !"
              : `💡 Encore ${restants} client${restants > 1 ? "s" : ""} pour atteindre l'objectif ${nextMilestone}`}
          </p>
        </div>

        {/* ── Flash succès ── */}
        {successPrenom && (
          <div className="rounded-2xl px-4 py-3.5 flex items-start gap-3"
            style={{ background: "linear-gradient(135deg, rgba(5,150,105,0.3), rgba(4,120,87,0.2))", border: "1px solid rgba(16,185,129,0.4)" }}>
            <span className="text-2xl mt-0.5">🎉</span>
            <div>
              <p className="text-sm font-black text-emerald-300">{successPrenom} ajouté(e) !</p>
              <p className="text-xs text-emerald-400/70 mt-0.5">📱 Un WhatsApp partira demain matin pour demander un avis Google</p>
            </div>
          </div>
        )}

        {/* ── Erreur ── */}
        {error && (
          <div className="rounded-2xl px-4 py-3 border border-red-500/30 bg-red-500/10">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* ── Formulaire ── */}
        <div className="rounded-3xl p-5 border border-white/10" style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(10px)" }}>
          {/* Quota bar */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-black uppercase tracking-widest text-white/50">✦ Nouveau client</p>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {Array.from({ length: DAILY_LIMIT }).map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full transition-all duration-300"
                    style={{ background: i < quotaUsed ? "#7c3aed" : "rgba(255,255,255,0.12)" }}
                  />
                ))}
              </div>
              <span className={`text-xs font-bold ${quotaReached ? "text-rose-400" : quotaLeft <= 3 ? "text-amber-400" : "text-violet-300"}`}>
                {quotaReached ? "0 restant" : `${quotaLeft} / ${DAILY_LIMIT}`}
              </span>
            </div>
          </div>

          {quotaReached ? (
            <div className="rounded-2xl px-4 py-5 text-center" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
              <p className="text-2xl mb-2">🔒</p>
              <p className="text-sm font-bold text-rose-300">Limite journalière atteinte</p>
              <p className="text-xs text-white/40 mt-1">10 clients maximum par jour · Revenez demain</p>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Prénom</label>
              <input
                ref={prenomRef}
                type="text"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Marie"
                autoComplete="off"
                autoCapitalize="words"
                className="w-full rounded-xl px-4 py-3.5 text-base text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Téléphone</label>
              <input
                type="tel"
                inputMode="tel"
                value={formatPhoneDisplay(telephone)}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="06 12 34 56 78"
                autoComplete="off"
                className="w-full rounded-xl px-4 py-3.5 text-base text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
              />
              {telephone.replace(/\D/g, "").length >= 10 && !phoneValid && (
                <p className="text-xs text-red-400 mt-1.5">Numéro invalide (format 06 ou 07...)</p>
              )}
            </div>
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-xl py-4 text-sm font-black text-white transition-all active:scale-95 disabled:opacity-30 mt-1"
              style={{
                background: canSubmit
                  ? "linear-gradient(135deg, #7c3aed, #4f46e5)"
                  : "rgba(255,255,255,0.1)",
              }}
            >
              {loading ? "Ajout en cours…" : "✓  Ajouter ce client"}
            </button>
          </form>
          )}

          {/* Incentive permanent — toujours visible */}
          <div className="mt-4 rounded-xl px-3 py-2.5 flex items-center gap-2"
            style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.2)" }}>
            <span className="text-base">📱</span>
            <p className="text-xs text-violet-300 leading-snug">
              Chaque client ajouté reçoit un WhatsApp le lendemain pour laisser un avis Google
            </p>
          </div>
        </div>

        {/* ── Historique du jour ── */}
        {clients.length > 0 && (
          <div className="rounded-2xl p-4 border border-white/10" style={{ background: "rgba(255,255,255,0.05)" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-black uppercase tracking-widest text-white/50">Aujourd'hui</p>
              <span className="rounded-full px-2.5 py-0.5 text-xs font-bold text-violet-300"
                style={{ background: "rgba(124,58,237,0.25)" }}>
                {clients.length} client{clients.length > 1 ? "s" : ""}
              </span>
            </div>
            <ul className="space-y-2.5">
              {clients.slice(0, 8).map((c) => (
                <li key={c.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white ${avatarColor(c.prenom)}`}>
                      {c.prenom[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-white">{c.prenom}</span>
                  </div>
                  <span className="text-xs text-white/30">{formatHour(c.createdAt)}</span>
                </li>
              ))}
            </ul>
            {clients.length > 8 && (
              <p className="mt-2.5 text-xs text-white/30 text-center">+{clients.length - 8} autres</p>
            )}
          </div>
        )}

        {/* ── Avis négatifs ── toujours visible */}
        <div
          className="rounded-2xl overflow-hidden border"
          style={{
            background: "rgba(255,255,255,0.05)",
            borderColor: negatifs.length > 0 ? "rgba(244,63,94,0.4)" : "rgba(16,185,129,0.3)",
          }}
        >
          <button
            onClick={() => negatifs.length > 0 && setNegatifOuvert((v) => !v)}
            className={`w-full flex items-center justify-between px-4 py-3.5 ${negatifs.length > 0 ? "cursor-pointer" : "cursor-default"}`}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-black text-white"
                style={{ background: negatifs.length > 0 ? "#f43f5e" : "#10b981" }}
              >
                {negatifs.length}
              </span>
              <span className={`text-sm font-bold ${negatifs.length > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                {negatifs.length === 0
                  ? "Aucun retour négatif"
                  : `Retour${negatifs.length > 1 ? "s" : ""} client à traiter`}
              </span>
            </div>
            {negatifs.length > 0 && (
              <span className="text-white/30 text-xs">{negatifOuvert ? "▲" : "▼"}</span>
            )}
          </button>

          {negatifs.length > 0 && negatifOuvert && (
            <div className="border-t border-rose-500/20 divide-y divide-white/5">
              {negatifs.map((n) => (
                <div key={n.id} className="px-4 py-4 space-y-2.5">
                  <p className="text-xs text-white/40">
                    {n.clientPrenom ?? "Client"}{n.clientTelephone ? ` · ${n.clientTelephone}` : ""}
                  </p>
                  <p className="text-sm text-white/80 leading-relaxed rounded-xl px-3 py-2.5"
                    style={{ background: "rgba(255,255,255,0.06)" }}>
                    &ldquo;{n.message}&rdquo;
                  </p>
                  <div className="flex gap-2">
                    {n.clientTelephone && (
                      <a
                        href={`tel:${n.clientTelephone}`}
                        className="flex-1 text-center text-xs font-bold text-white rounded-xl py-2.5"
                        style={{ background: "rgba(255,255,255,0.1)" }}
                      >
                        📞 Rappeler {n.clientPrenom}
                      </a>
                    )}
                    <button
                      onClick={() => handleTraiter(n.id)}
                      disabled={traitingId === n.id}
                      className="flex-1 text-xs font-bold text-emerald-300 rounded-xl py-2.5 disabled:opacity-50 transition-opacity"
                      style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.25)" }}
                    >
                      {traitingId === n.id ? "…" : "✓ Traité"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-white/15 pt-1">Propulsé par Trouper · Avis Google</p>
      </div>
    </main>
  );
}
