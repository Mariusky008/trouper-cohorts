"use client";

import { useState, useRef } from "react";

type CommerceProps = {
  nom: string;
  secteur: string | null;
  ville: string | null;
  nbAvisDebut: number;
  nbAvisActuel: number;
  noteActuelle: number | null;
  lastRelanceAt: string | null;
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
  totalClients: number;
  relanceEnabled: boolean;
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

export function SaisieForm({ token, commerce, clientsAujourdhui, avisNegatifs, totalClients, relanceEnabled }: Props) {
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [loading, setLoading] = useState(false);
  const [successPrenom, setSuccessPrenom] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const prenomRef = useRef<HTMLInputElement>(null);
  const relanceRef = useRef<HTMLDivElement>(null);

  const [clients, setClients] = useState<ClientEntry[]>(clientsAujourdhui);
  const [nbAvisActuel] = useState(commerce.nbAvisActuel);
  const [negatifs, setNegatifs] = useState<AvisNegatif[]>(avisNegatifs);
  const [negatifOuvert, setNegatifOuvert] = useState(false);
  const [traitingId, setTraitingId] = useState<string | null>(null);
  const [pulse, setPulse] = useState(false);

  // Relance promo
  const [relanceOuvert, setRelanceOuvert] = useState(false);
  const [relanceRemise, setRelanceRemise] = useState("20");
  const [relanceService, setRelanceService] = useState("");
  const [relanceDateLimit, setRelanceDateLimit] = useState("");
  const [relanceLoading, setRelanceLoading] = useState(false);
  const [relanceResult, setRelanceResult] = useState<{ sent: number } | null>(null);
  const [relanceError, setRelanceError] = useState<string | null>(null);
  const [lastRelanceAt, setLastRelanceAt] = useState<string | null>(commerce.lastRelanceAt);

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

  const cooldownDays = lastRelanceAt
    ? Math.ceil(30 - (Date.now() - new Date(lastRelanceAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const inCooldown = cooldownDays > 0;
  const nextRelanceDate = lastRelanceAt
    ? new Date(new Date(lastRelanceAt).getTime() + 30 * 24 * 60 * 60 * 1000)
        .toLocaleDateString("fr-FR", { day: "numeric", month: "long" })
    : null;

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

  async function handleRelance(e: React.FormEvent) {
    e.preventDefault();
    if (!relanceService.trim() || !relanceDateLimit.trim()) return;
    setRelanceLoading(true);
    setRelanceError(null);
    setRelanceResult(null);
    try {
      const res = await fetch(`/api/saisie/${token}/relance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remise: relanceRemise, service: relanceService.trim(), dateLimit: relanceDateLimit.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRelanceError(data.error ?? "Erreur");
      } else {
        setRelanceResult({ sent: data.sent });
        setLastRelanceAt(new Date().toISOString());
        setRelanceService("");
        setRelanceDateLimit("");
        setRelanceOuvert(false);
      }
    } catch {
      setRelanceError("Erreur réseau.");
    } finally {
      setRelanceLoading(false);
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

  function openRelance() {
    setRelanceOuvert(true);
    setTimeout(() => relanceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  return (
    <main
      className="min-h-screen pb-16"
      style={{ background: "#F8FAFC", fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
    >
      {/* ── Header sticky ── */}
      <header className="bg-white border-b border-slate-200 px-4 py-3.5 sticky top-0 z-20 shadow-sm">
        <div className="mx-auto max-w-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-0.5">⭐ Partenaire Google</p>
            <h1 className="font-black text-slate-900 text-base leading-tight">{commerce.nom}</h1>
            {(commerce.secteur || commerce.ville) && (
              <p className="text-xs text-slate-400 mt-0.5">{[commerce.secteur, commerce.ville].filter(Boolean).join(" · ")}</p>
            )}
          </div>
          {(commerce.noteActuelle || nbAvisActuel > 0) && (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-2xl px-3 py-2 shrink-0">
              <span className="text-amber-400 text-sm">★</span>
              <div className="text-right">
                {commerce.noteActuelle && (
                  <p className="font-black text-slate-900 text-sm leading-none">{commerce.noteActuelle.toFixed(1)}</p>
                )}
                <p className="text-[10px] text-slate-400">{nbAvisActuel} avis</p>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-sm px-4 pt-5 space-y-4">

        {/* ── Flash succès ── */}
        {successPrenom && (
          <div className="rounded-2xl px-4 py-3.5 flex items-start gap-3 bg-emerald-50 border border-emerald-200">
            <span className="text-xl mt-0.5">🎉</span>
            <div>
              <p className="text-sm font-black text-emerald-700">{successPrenom} ajouté(e) !</p>
              <p className="text-xs text-emerald-600/80 mt-0.5">📱 Message WhatsApp programmé pour demain matin</p>
            </div>
          </div>
        )}

        {/* ── Erreur ── */}
        {error && (
          <div className="rounded-2xl px-4 py-3 bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* ── Hero : formulaire ── */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-[#111827]">Nouveau client</h2>
              <p className="text-xs text-slate-500 mt-0.5">Ajout en 5 secondes</p>
            </div>
            {/* Quota dots */}
            <div className="flex flex-col items-end gap-1">
              <div className="flex gap-0.5">
                {Array.from({ length: DAILY_LIMIT }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                    style={{ background: i < quotaUsed ? "#5B4CF7" : "#e2e8f0" }}
                  />
                ))}
              </div>
              <span className={`text-[10px] font-bold ${quotaReached ? "text-red-500" : quotaLeft <= 3 ? "text-amber-500" : "text-slate-400"}`}>
                {quotaReached ? "0 restant" : `${quotaLeft}/${DAILY_LIMIT}`}
              </span>
            </div>
          </div>

          {quotaReached ? (
            <div className="rounded-2xl px-4 py-5 text-center bg-red-50 border border-red-100">
              <p className="text-2xl mb-2">🔒</p>
              <p className="text-sm font-bold text-red-600">Limite journalière atteinte</p>
              <p className="text-xs text-slate-400 mt-1">10 clients maximum · Revenez demain</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Prénom</label>
                <input
                  ref={prenomRef}
                  type="text"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  placeholder="Marie"
                  autoComplete="off"
                  autoCapitalize="words"
                  className="w-full rounded-xl px-4 py-3.5 text-base text-[#111827] placeholder-slate-400 bg-white border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#5B4CF7]/25 focus:border-[#5B4CF7] transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Téléphone</label>
                <input
                  type="tel"
                  inputMode="tel"
                  value={formatPhoneDisplay(telephone)}
                  onChange={(e) => setTelephone(e.target.value)}
                  placeholder="06 12 34 56 78"
                  autoComplete="off"
                  className="w-full rounded-xl px-4 py-3.5 text-base text-[#111827] placeholder-slate-400 bg-white border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#5B4CF7]/25 focus:border-[#5B4CF7] transition-all"
                />
                {telephone.replace(/\D/g, "").length >= 10 && !phoneValid && (
                  <p className="text-xs text-red-500 mt-1.5">Numéro invalide (format 06 ou 07...)</p>
                )}
              </div>

              {/* CTA principal */}
              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full rounded-xl py-4 text-sm font-black text-white transition-all active:scale-95 disabled:opacity-40"
                style={{
                  background: "linear-gradient(135deg, #5B4CF7, #7C3AED)",
                  boxShadow: canSubmit ? "0 4px 14px rgba(91,76,247,0.35)" : "none",
                }}
              >
                {loading ? "Ajout en cours…" : "⭐ Demander un avis Google"}
              </button>

              {/* CTA secondaire — relance promo */}
              {relanceEnabled && !inCooldown && totalClients > 0 && (
                <button
                  type="button"
                  onClick={openRelance}
                  className="w-full rounded-xl py-3.5 text-sm font-bold transition-all active:scale-95"
                  style={{ background: "#fdf4ff", color: "#a21caf", border: "1px solid #f0abfc" }}
                >
                  🎁 Envoyer une offre promo
                </button>
              )}

              <div className="flex items-start gap-2 pt-1">
                <span className="text-sm mt-0.5">📱</span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Chaque client reçoit un WhatsApp le lendemain pour laisser un avis Google
                </p>
              </div>
            </form>
          )}
        </div>

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-3 gap-2.5">
          <div
            className={`bg-white rounded-2xl p-3.5 text-center border border-slate-200 shadow-sm transition-transform duration-300 ${pulse ? "scale-110" : "scale-100"}`}
          >
            <p className="text-3xl font-black text-[#5B4CF7]">{clients.length}</p>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-tight font-medium">Clients<br />aujourd&apos;hui</p>
          </div>
          <div className="bg-white rounded-2xl p-3.5 text-center border border-slate-200 shadow-sm">
            <p className="text-3xl font-black text-[#10B981]">{delta > 0 ? `+${delta}` : delta}</p>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-tight font-medium">Avis<br />obtenus</p>
          </div>
          <div className="bg-white rounded-2xl p-3.5 text-center border border-slate-200 shadow-sm">
            <p className="text-3xl font-black text-[#F59E0B]">
              {commerce.noteActuelle ? commerce.noteActuelle.toFixed(1) : "—"}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-tight font-medium">Note<br />Google</p>
          </div>
        </div>

        {/* ── Progression ── */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-[#111827]">🎯 Objectif {nextMilestone} avis</span>
            <span className="text-xs font-black text-[#5B4CF7]">{nbAvisActuel} / {nextMilestone}</span>
          </div>
          <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, #5B4CF7, #7C3AED)" }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {restants === 0
              ? "🎉 Objectif atteint ! Félicitations !"
              : `💡 Encore ${restants} avis pour atteindre l'objectif`}
          </p>
        </div>

        {/* ── Historique du jour ── */}
        {clients.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-black text-[#111827] uppercase tracking-widest">Aujourd&apos;hui</p>
              <span className="rounded-full px-2.5 py-0.5 text-xs font-bold text-[#5B4CF7] bg-indigo-50">
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
                    <span className="text-sm font-semibold text-[#111827]">{c.prenom}</span>
                  </div>
                  <span className="text-xs text-slate-400">{formatHour(c.createdAt)}</span>
                </li>
              ))}
            </ul>
            {clients.length > 8 && (
              <p className="mt-2.5 text-xs text-slate-400 text-center">+{clients.length - 8} autres</p>
            )}
          </div>
        )}

        {/* ── Relance promo ── */}
        {relanceEnabled && (
          <div
            ref={relanceRef}
            className="bg-white rounded-2xl overflow-hidden border shadow-sm"
            style={{ borderColor: inCooldown ? "#e2e8f0" : "#f0abfc" }}
          >
            <button
              onClick={() => !inCooldown && setRelanceOuvert((v) => !v)}
              className={`w-full flex items-center justify-between px-4 py-3.5 ${inCooldown ? "cursor-default" : "cursor-pointer"}`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">📢</span>
                <div className="text-left">
                  <p className={`text-sm font-bold ${inCooldown ? "text-slate-400" : "text-fuchsia-600"}`}>
                    Relancer mes clients
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {inCooldown
                      ? `Disponible le ${nextRelanceDate} (dans ${cooldownDays}j)`
                      : `${totalClients} client${totalClients > 1 ? "s" : ""} à contacter`}
                  </p>
                </div>
              </div>
              {!inCooldown && (
                <span className="text-slate-300 text-xs">{relanceOuvert ? "▲" : "▼"}</span>
              )}
            </button>

            {relanceResult && (
              <div className="mx-4 mb-3 rounded-xl px-3 py-2.5 flex items-center gap-2 bg-emerald-50 border border-emerald-200">
                <span>✅</span>
                <p className="text-xs font-bold text-emerald-700">
                  {relanceResult.sent} message{relanceResult.sent > 1 ? "s" : ""} en cours d&apos;envoi !
                </p>
              </div>
            )}

            {!inCooldown && relanceOuvert && (
              <div className="border-t border-slate-100 px-4 py-4">
                <form onSubmit={handleRelance} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Réduction proposée
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {["10", "15", "20", "25", "30", "50"].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setRelanceRemise(pct)}
                          className="rounded-xl px-3 py-1.5 text-sm font-bold transition-all border"
                          style={{
                            background: relanceRemise === pct ? "#fdf4ff" : "#f8fafc",
                            color: relanceRemise === pct ? "#a21caf" : "#94a3b8",
                            borderColor: relanceRemise === pct ? "#f0abfc" : "#e2e8f0",
                          }}
                        >
                          -{pct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Sur quel service ?
                    </label>
                    <input
                      type="text"
                      value={relanceService}
                      onChange={(e) => setRelanceService(e.target.value)}
                      placeholder="ex: coupe homme, massage, entretien..."
                      required
                      className="w-full rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-300 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/30 focus:border-fuchsia-400 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Valable jusqu&apos;au
                    </label>
                    <input
                      type="text"
                      value={relanceDateLimit}
                      onChange={(e) => setRelanceDateLimit(e.target.value)}
                      placeholder="ex: dimanche 25 mai"
                      required
                      className="w-full rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-300 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/30 focus:border-fuchsia-400 transition-all"
                    />
                  </div>

                  {relanceService && relanceDateLimit && (
                    <div className="rounded-xl px-3 py-2.5 text-xs text-slate-600 leading-relaxed bg-fuchsia-50 border border-fuchsia-100">
                      <p className="text-[10px] font-bold text-fuchsia-500 mb-1 uppercase tracking-wide">Aperçu du message</p>
                      Bonjour Prénom, c&apos;est {commerce.nom} ! En tant que client(e) et pour vous remercier de votre fidélité, nous vous offrons -{relanceRemise}% sur {relanceService} jusqu&apos;au {relanceDateLimit}. À bientôt !
                    </div>
                  )}

                  {relanceError && (
                    <p className="text-xs text-red-500">{relanceError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={relanceLoading || !relanceService.trim() || !relanceDateLimit.trim()}
                    className="w-full rounded-xl py-3.5 text-sm font-black text-white disabled:opacity-40 transition-all active:scale-95"
                    style={{ background: "linear-gradient(135deg, #a21caf, #7e22ce)" }}
                  >
                    {relanceLoading ? "Envoi en cours…" : `📢 Envoyer à ${totalClients} client${totalClients > 1 ? "s" : ""}`}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ── Avis négatifs ── toujours visible */}
        <div
          className="bg-white rounded-2xl overflow-hidden border shadow-sm"
          style={{ borderColor: negatifs.length > 0 ? "#fecdd3" : "#bbf7d0" }}
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
              <span className={`text-sm font-bold ${negatifs.length > 0 ? "text-rose-500" : "text-emerald-600"}`}>
                {negatifs.length === 0
                  ? "Aucun retour négatif"
                  : `Retour${negatifs.length > 1 ? "s" : ""} client à traiter`}
              </span>
            </div>
            {negatifs.length > 0 && (
              <span className="text-slate-300 text-xs">{negatifOuvert ? "▲" : "▼"}</span>
            )}
          </button>

          {negatifs.length > 0 && negatifOuvert && (
            <div className="border-t border-rose-100 divide-y divide-slate-50">
              {negatifs.map((n) => (
                <div key={n.id} className="px-4 py-4 space-y-2.5">
                  <p className="text-xs text-slate-400">
                    {n.clientPrenom ?? "Client"}{n.clientTelephone ? ` · ${n.clientTelephone}` : ""}
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed rounded-xl px-3 py-2.5 bg-slate-50 border border-slate-100">
                    &ldquo;{n.message}&rdquo;
                  </p>
                  <div className="flex gap-2">
                    {n.clientTelephone && (
                      <a
                        href={`tel:${n.clientTelephone}`}
                        className="flex-1 text-center text-xs font-bold text-slate-600 rounded-xl py-2.5 bg-slate-100 border border-slate-200"
                      >
                        📞 Rappeler {n.clientPrenom}
                      </a>
                    )}
                    <button
                      onClick={() => handleTraiter(n.id)}
                      disabled={traitingId === n.id}
                      className="flex-1 text-xs font-bold text-emerald-700 rounded-xl py-2.5 disabled:opacity-50 transition-opacity bg-emerald-50 border border-emerald-200"
                    >
                      {traitingId === n.id ? "…" : "✓ Traité"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-slate-300 pt-1 pb-4">Propulsé par Trouper · Avis Google</p>
      </div>
    </main>
  );
}
