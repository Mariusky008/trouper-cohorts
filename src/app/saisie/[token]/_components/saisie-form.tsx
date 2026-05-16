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
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatPhoneDisplay(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  return digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}

function isValidFrenchPhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  return /^0[67]\d{8}$/.test(digits) || /^0[1-9]\d{8}$/.test(digits);
}

function AnimatedCount({ value }: { value: number }) {
  return (
    <span className="tabular-nums transition-all duration-500">{value}</span>
  );
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

  const phoneValid = isValidFrenchPhone(telephone);
  const canSubmit = prenom.trim().length >= 2 && phoneValid && !loading;

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
      setPrenom("");
      setTelephone("");
      setLoading(false);

      setTimeout(() => {
        setSuccessPrenom(null);
        prenomRef.current?.focus();
      }, 2800);
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
      style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
      className="min-h-screen bg-[#1C1F22] px-4 py-8 pb-16"
    >
      <div className="mx-auto w-full max-w-sm space-y-5">

        {/* ── Hero ── */}
        <div className="rounded-2xl bg-gradient-to-br from-[#2A2D31] to-[#1C1F22] border border-[#3A3D42] p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold tracking-widest uppercase text-[#D4C89A] bg-[#D4C89A]/10 rounded-full px-3 py-1">
              ⭐ Partenaire Google Reviews
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white leading-tight">{commerce.nom}</h1>
          {(commerce.secteur || commerce.ville) && (
            <p className="text-sm text-[#6B7280] mt-1">
              {[commerce.secteur, commerce.ville].filter(Boolean).join(" · ")}
            </p>
          )}
          {commerce.noteActuelle && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-[#D4C89A]/10 rounded-xl px-3 py-1.5">
              <span className="text-[#D4C89A] text-sm font-bold">★ {commerce.noteActuelle.toFixed(1)}</span>
              <span className="text-[#6B7280] text-xs">sur Google</span>
            </div>
          )}
        </div>

        {/* ── Compteurs ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Clients\naujourd'hui", value: clients.length, color: "text-white" },
            { label: "Avis\nobtenus", value: delta, color: "text-[#25D366]" },
            { label: "Note\nactuelle", value: commerce.noteActuelle ? `★${commerce.noteActuelle.toFixed(1)}` : "—", color: "text-[#D4C89A]", raw: true },
          ].map(({ label, value, color, raw }) => (
            <div key={label} className="rounded-2xl bg-[#2A2D31] border border-[#3A3D42] p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>
                {raw ? value : <AnimatedCount value={value as number} />}
              </p>
              <p className="text-[10px] text-[#6B7280] mt-1 leading-tight whitespace-pre-line">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Barre de progression ── */}
        <div className="rounded-2xl bg-[#2A2D31] border border-[#3A3D42] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#9CA3AF]">Objectif {nextMilestone} avis</span>
            <span className="text-xs font-bold text-[#D4C89A]">{nbAvisActuel} / {nextMilestone}</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-[#3A3D42] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#D4C89A] to-[#f0e4b4] transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-[#6B7280]">
            {restants === 0
              ? "🎉 Objectif atteint !"
              : `Encore ${restants} client${restants > 1 ? "s" : ""} pour atteindre ${nextMilestone} avis`}
          </p>
        </div>

        {/* ── Flash succès / erreur ── */}
        {successPrenom && (
          <div className="rounded-2xl bg-[#25D366]/15 border border-[#25D366]/30 px-4 py-3 flex items-center gap-3 animate-in fade-in duration-300">
            <span className="text-xl">✅</span>
            <div>
              <p className="text-sm font-semibold text-[#25D366]">{successPrenom} ajouté(e) !</p>
              <p className="text-xs text-[#25D366]/70">Message WhatsApp demain matin</p>
            </div>
          </div>
        )}
        {error && (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* ── Formulaire ── */}
        <div className="rounded-2xl bg-[#2A2D31] border border-[#3A3D42] p-5">
          <p className="text-xs font-black uppercase tracking-widest text-[#9CA3AF] mb-4">
            Nouveau client
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-1.5">
                Prénom
              </label>
              <input
                ref={prenomRef}
                type="text"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Marie"
                autoComplete="off"
                autoCapitalize="words"
                className="w-full bg-[#1C1F22] border border-[#3A3D42] rounded-xl px-4 py-3.5 text-base text-white placeholder-[#4B5563] focus:outline-none focus:border-[#D4C89A] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-1.5">
                Téléphone
              </label>
              <input
                type="tel"
                inputMode="tel"
                value={formatPhoneDisplay(telephone)}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="06 12 34 56 78"
                autoComplete="off"
                className="w-full bg-[#1C1F22] border border-[#3A3D42] rounded-xl px-4 py-3.5 text-base text-white placeholder-[#4B5563] focus:outline-none focus:border-[#D4C89A] transition-colors"
              />
              {telephone.replace(/\D/g, "").length >= 10 && !phoneValid && (
                <p className="text-xs text-red-400 mt-1.5">Numéro invalide (format 06 ou 07...)</p>
              )}
            </div>
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-[#D4C89A] text-[#1C1F22] rounded-xl py-4 text-sm font-bold disabled:opacity-30 transition-all active:scale-95 mt-1"
            >
              {loading ? "Ajout en cours…" : "✓  Ajouter ce client"}
            </button>
          </form>
        </div>

        {/* ── Historique du jour ── */}
        {clients.length > 0 && (
          <div className="rounded-2xl bg-[#2A2D31] border border-[#3A3D42] p-4">
            <p className="text-xs font-black uppercase tracking-widest text-[#9CA3AF] mb-3">
              Aujourd'hui · {clients.length} client{clients.length > 1 ? "s" : ""}
            </p>
            <ul className="space-y-2">
              {clients.slice(0, 8).map((c) => (
                <li key={c.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#D4C89A]/20 flex items-center justify-center text-[10px] font-bold text-[#D4C89A]">
                      {c.prenom[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm text-white font-medium">{c.prenom}</span>
                  </div>
                  <span className="text-xs text-[#6B7280]">{formatHour(c.createdAt)}</span>
                </li>
              ))}
            </ul>
            {clients.length > 8 && (
              <p className="mt-2 text-xs text-[#6B7280] text-center">+{clients.length - 8} autres</p>
            )}
          </div>
        )}

        {/* ── Avis négatifs ── */}
        {negatifs.length > 0 && (
          <div className="rounded-2xl border border-red-500/30 bg-[#2A2D31] overflow-hidden">
            <button
              onClick={() => setNegatifOuvert((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {negatifs.length}
                </span>
                <span className="text-sm font-semibold text-red-400">
                  Retour{negatifs.length > 1 ? "s" : ""} client à traiter
                </span>
              </div>
              <span className="text-[#6B7280] text-xs">{negatifOuvert ? "▲" : "▼"}</span>
            </button>

            {negatifOuvert && (
              <div className="border-t border-red-500/20 divide-y divide-[#3A3D42]">
                {negatifs.map((n) => (
                  <div key={n.id} className="px-4 py-4 space-y-2">
                    <p className="text-xs text-[#6B7280]">
                      {n.clientPrenom ?? "Client"}{n.clientTelephone ? ` · ${n.clientTelephone}` : ""}
                    </p>
                    <p className="text-sm text-[#D1D5DB] leading-relaxed bg-[#1C1F22] rounded-xl px-3 py-2.5">
                      &ldquo;{n.message}&rdquo;
                    </p>
                    {n.clientTelephone && (
                      <a
                        href={`tel:${n.clientTelephone}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#3A3D42] rounded-lg px-3 py-2"
                      >
                        📞 Rappeler {n.clientPrenom}
                      </a>
                    )}
                    <button
                      onClick={() => handleTraiter(n.id)}
                      disabled={traitingId === n.id}
                      className="block w-full text-center text-xs font-semibold text-[#25D366] bg-[#25D366]/10 border border-[#25D366]/20 rounded-xl py-2.5 disabled:opacity-50 transition-opacity"
                    >
                      {traitingId === n.id ? "…" : "✓ J'ai rappelé ce client"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Footer ── */}
        <p className="text-center text-[10px] text-[#3A3D42] pt-2">
          Propulsé par Trouper · Avis Google
        </p>
      </div>
    </main>
  );
}
