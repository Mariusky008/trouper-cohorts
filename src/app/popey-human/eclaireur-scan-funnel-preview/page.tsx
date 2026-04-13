"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Phase = "home" | "scan" | "directory" | "moments" | "needs" | "message" | "response" | "dispatch" | "done";
type ReplyStatus = "waiting" | "ok" | "no";

type Contact = {
  id: string;
  name: string;
  phone: string;
  city: string;
};

type MarketSegment = {
  id: string;
  label: string;
  percent: number;
  avgCommission: number;
};

type MomentOption = {
  id: string;
  label: string;
  helper: string;
};

const DIRECTORY: Contact[] = [
  { id: "c1", name: "Julien M.", phone: "06 12 78 44 01", city: "Dax" },
  { id: "c2", name: "Claire R.", phone: "06 90 11 43 29", city: "Dax" },
  { id: "c3", name: "Karim B.", phone: "06 31 77 09 11", city: "Saint-Paul-les-Dax" },
  { id: "c4", name: "Laura T.", phone: "06 40 80 42 51", city: "Dax" },
  { id: "c5", name: "Nicolas G.", phone: "06 58 12 09 62", city: "Narrosse" },
  { id: "c6", name: "Farah K.", phone: "06 22 63 17 98", city: "Dax" },
];

const SEGMENTS: MarketSegment[] = [
  { id: "immo", label: "Recherche maison", percent: 5, avgCommission: 275 },
  { id: "sante", label: "Perte de poids / sante", percent: 9, avgCommission: 120 },
  { id: "travaux", label: "Travaux / deco", percent: 12, avgCommission: 180 },
  { id: "finance", label: "Patrimoine / investissement", percent: 4, avgCommission: 320 },
];

const MOMENT_OPTIONS: MomentOption[] = [
  { id: "baby", label: "Vient d avoir un enfant", helper: "A entendu au comptoir / en appel" },
  { id: "deco", label: "Besoin de refaire sa deco", helper: "Projet maison en cours" },
  { id: "divorce", label: "Est en plein divorce", helper: "Souvent besoin de vendre / estimer" },
  { id: "partner", label: "Besoin de trouver un partenaire", helper: "Recherche un pro de confiance" },
  { id: "inheritance", label: "Vient d heriter", helper: "Besoin de structurer rapidement" },
  { id: "sell", label: "Besoin de vendre", helper: "Delai potentiel court" },
  { id: "buy", label: "Besoin d acheter", helper: "Projet concret a cadrer" },
  { id: "invest", label: "Investir", helper: "Cherche rendement / securite" },
  { id: "new_job", label: "Nouveau poste / mutation", helper: "Changement de rythme de vie" },
  { id: "moving", label: "Demange bientot", helper: "Projet concret a court terme" },
  { id: "other", label: "Autre", helper: "Preciser le contexte" },
];

const NEEDS_BY_MOMENT: Record<string, string[]> = {
  baby: ["Courtier", "Agrandissement", "Assurance familiale"],
  deco: ["Artisan travaux", "Decorateur", "Magasin amenagement"],
  divorce: ["Agent immo estimation", "Notaire", "Courtier"],
  partner: ["Courtier local", "Conseiller expert", "Partenaire business"],
  inheritance: ["Notaire", "Gestionnaire patrimoine", "Agent immo vente"],
  sell: ["Agent immo", "Notaire", "Diagnostiqueur"],
  buy: ["Courtier pret", "Agent immo", "Notaire"],
  invest: ["Gestionnaire patrimoine", "Conseil fiscal", "Agent immo"],
  new_job: ["Agent immo", "Courtier", "Coach mobilite"],
  moving: ["Artisan travaux", "Agent immo", "Assurance habitation"],
  other: ["Courtier", "Agent immo", "Conseiller local"],
};

export default function EclaireurScanFunnelPreviewPage() {
  const [phase, setPhase] = useState<Phase>("home");
  const [totalContacts] = useState(800);
  const [selectedContactId, setSelectedContactId] = useState(DIRECTORY[0].id);
  const [selectedMoment, setSelectedMoment] = useState<string>("baby");
  const [selectedNeed, setSelectedNeed] = useState<string>("");
  const [messageDraft, setMessageDraft] = useState("");
  const [reply, setReply] = useState<ReplyStatus>("waiting");
  const [selectedTrade, setSelectedTrade] = useState<string>("Courtier");

  const selectedContact = DIRECTORY.find((contact) => contact.id === selectedContactId) ?? DIRECTORY[0];
  const suggestedNeeds = NEEDS_BY_MOMENT[selectedMoment] ?? NEEDS_BY_MOMENT.other;
  const selectedMomentLabel = MOMENT_OPTIONS.find((moment) => moment.id === selectedMoment)?.label ?? "Autre";

  const segmentStats = useMemo(
    () =>
      SEGMENTS.map((segment) => {
        const leads = Math.round(totalContacts * (segment.percent / 100));
        const potential = leads * segment.avgCommission;
        return { ...segment, leads, potential };
      }),
    [totalContacts],
  );

  const totalPotential = segmentStats.reduce((sum, segment) => sum + segment.potential, 0);

  const defaultMessage = `Salut ${selectedContact.name.split(" ")[0]}, je pense a toi suite a ton contexte "${selectedMomentLabel}". J ai un pro de confiance sur ${selectedNeed || "ce sujet"} a ${selectedContact.city}. Tu veux que je lui demande de te contacter ?`;

  function goNextFromResponse() {
    if (reply === "ok") {
      setPhase("dispatch");
      return;
    }
    setPhase("done");
  }

  return (
    <main className="min-h-screen bg-[#06080A] text-white">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10 space-y-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#EAC886]/90">Eclaireur Scan V2 - Funnel Compare</p>
            <h1 className="text-3xl sm:text-4xl font-black">Scan. Detecte. Convertis.</h1>
            <p className="mt-1 text-sm text-white/75">Version orientee terrain: simple, motive, actionnable.</p>
          </div>
          <Link href="/popey-human/eclaireur-scan-preview" className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-wide">
            Preview actuelle
          </Link>
        </header>

        {phase === "home" && (
          <section className="rounded-3xl border border-emerald-300/35 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(18,72,54,0.95)_0%,rgba(12,20,22,0.96)_52%,rgba(8,10,12,1)_100%)] p-6 sm:p-7">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-200/90">Etape 1</p>
            <h2 className="mt-2 text-3xl font-black leading-tight">Scanner l annuaire pour motiver l eclaireur</h2>
            <p className="mt-2 text-base text-white/85">
              Tu as environ <span className="font-black text-emerald-200">{totalContacts} contacts</span>. On estime le potentiel par categories pour te donner un objectif clair.
            </p>
            <button
              type="button"
              onClick={() => setPhase("scan")}
              className="mt-5 h-12 rounded-xl bg-gradient-to-r from-emerald-300 via-emerald-400 to-cyan-300 px-5 text-black text-sm font-black uppercase tracking-wide"
            >
              Scanner mon annuaire
            </button>
          </section>
        )}

        {phase === "scan" && (
          <section className="rounded-3xl border border-white/15 bg-[#12161A] p-5 sm:p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#EAC886]">Etape 2 - Scan termine</p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black">Potentiel estime sur ton reseau</h2>
            <p className="mt-2 text-sm text-white/75">Estimation indicatrice pour prioriser (pas promesse de conversion).</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {segmentStats.map((segment) => (
                <article key={segment.id} className="rounded-2xl border border-white/15 bg-black/25 p-4">
                  <p className="text-xs text-white/65">{segment.percent}% de {totalContacts} contacts</p>
                  <p className="mt-1 text-lg font-black">{segment.label}</p>
                  <p className="text-sm text-emerald-200">
                    {segment.leads} contacts potentiels • {segment.potential.toLocaleString("fr-FR")} EUR
                  </p>
                </article>
              ))}
            </div>

            <p className="mt-4 rounded-xl border border-[#EAC886]/35 bg-[#1D170E] px-4 py-3 text-sm text-[#EAC886]">
              Potentiel global estime: <span className="font-black">{totalPotential.toLocaleString("fr-FR")} EUR</span>
            </p>

            <button
              type="button"
              onClick={() => setPhase("directory")}
              className="mt-4 h-12 w-full rounded-xl bg-gradient-to-r from-[#F1D9A3] via-[#EAC886] to-[#E5B86A] text-black text-sm font-black uppercase tracking-wide"
            >
              Demarrer (detecter les moments de vie)
            </button>
          </section>
        )}

        {phase === "directory" && (
          <section className="rounded-3xl border border-white/15 bg-[#12161A] p-5 sm:p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#EAC886]">Etape 3 - Annuaire</p>
            <h2 className="mt-1 text-2xl font-black">Choisis une personne</h2>
            <div className="mt-4 space-y-2">
              {DIRECTORY.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => setSelectedContactId(contact.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left ${
                    selectedContactId === contact.id ? "border-emerald-300/55 bg-emerald-500/12" : "border-white/15 bg-black/20"
                  }`}
                >
                  <p className="text-sm font-black">{contact.name}</p>
                  <p className="text-xs text-white/70">
                    {contact.phone} - {contact.city}
                  </p>
                </button>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setPhase("scan")} className="h-11 rounded-xl border border-white/20 bg-white/10 text-xs font-black uppercase tracking-wide">
                Retour
              </button>
              <button
                type="button"
                onClick={() => setPhase("moments")}
                className="h-11 rounded-xl bg-emerald-400 text-black text-xs font-black uppercase tracking-wide"
              >
                Continuer
              </button>
            </div>
          </section>
        )}

        {phase === "moments" && (
          <section className="rounded-3xl border border-white/15 bg-[#12161A] p-5 sm:p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#EAC886]">Etape 4 - Moments de vie</p>
            <h2 className="mt-1 text-2xl font-black">Quel signal correspond a {selectedContact.name} ?</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {MOMENT_OPTIONS.map((moment) => (
                <button
                  key={moment.id}
                  type="button"
                  onClick={() => setSelectedMoment(moment.id)}
                  className={`rounded-2xl border px-3 py-3 text-left ${
                    selectedMoment === moment.id ? "border-emerald-300/55 bg-emerald-500/12" : "border-white/15 bg-black/20"
                  }`}
                >
                  <p className="text-sm font-black">{moment.label}</p>
                  <p className="text-xs text-white/70">{moment.helper}</p>
                </button>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setPhase("directory")} className="h-11 rounded-xl border border-white/20 bg-white/10 text-xs font-black uppercase tracking-wide">
                Retour
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedNeed(suggestedNeeds[0]);
                  setPhase("needs");
                }}
                className="h-11 rounded-xl bg-emerald-400 text-black text-xs font-black uppercase tracking-wide"
              >
                Continuer
              </button>
            </div>
          </section>
        )}

        {phase === "needs" && (
          <section className="rounded-3xl border border-white/15 bg-[#12161A] p-5 sm:p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#EAC886]">Etape 5 - Besoin associe</p>
            <h2 className="mt-1 text-2xl font-black">Que pourrait-il/elle avoir besoin maintenant ?</h2>
            <p className="mt-2 text-sm text-white/75">Suggestions basees sur le moment choisi: {selectedMomentLabel}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {suggestedNeeds.map((need) => (
                <button
                  key={need}
                  type="button"
                  onClick={() => setSelectedNeed(need)}
                  className={`h-11 rounded-xl border text-xs font-black uppercase tracking-wide ${
                    selectedNeed === need ? "border-emerald-300/55 bg-emerald-500/12" : "border-white/20 bg-white/5"
                  }`}
                >
                  {need}
                </button>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setPhase("moments")} className="h-11 rounded-xl border border-white/20 bg-white/10 text-xs font-black uppercase tracking-wide">
                Retour
              </button>
              <button
                type="button"
                disabled={!selectedNeed}
                onClick={() => {
                  setMessageDraft(defaultMessage);
                  setPhase("message");
                }}
                className="h-11 rounded-xl bg-emerald-400 text-black text-xs font-black uppercase tracking-wide disabled:opacity-40"
              >
                Continuer
              </button>
            </div>
          </section>
        )}

        {phase === "message" && (
          <section className="rounded-3xl border border-white/15 bg-[#12161A] p-5 sm:p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#EAC886]">Etape 6 - Message pre-rempli</p>
            <h2 className="mt-1 text-2xl font-black">Envoyer la relance a {selectedContact.name}</h2>
            <textarea
              value={messageDraft}
              onChange={(event) => setMessageDraft(event.target.value)}
              className="mt-4 min-h-32 w-full rounded-2xl border border-white/20 bg-black/25 px-3 py-3 text-sm"
            />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setPhase("needs")} className="h-11 rounded-xl border border-white/20 bg-white/10 text-xs font-black uppercase tracking-wide">
                Retour
              </button>
              <button
                type="button"
                onClick={() => setPhase("response")}
                className="h-11 rounded-xl bg-gradient-to-r from-emerald-300 via-emerald-400 to-cyan-300 text-black text-xs font-black uppercase tracking-wide"
              >
                Message envoye
              </button>
            </div>
          </section>
        )}

        {phase === "response" && (
          <section className="rounded-3xl border border-[#EAC886]/35 bg-[#1A1510] p-5 sm:p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#EAC886]">Etape 7 - Suivi reponse</p>
            <h2 className="mt-1 text-2xl font-black">Statut de la reponse de {selectedContact.name}</h2>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setReply("waiting")}
                className={`h-11 rounded-xl border text-xs font-black uppercase tracking-wide ${reply === "waiting" ? "border-cyan-300/55 bg-cyan-500/12" : "border-white/20 bg-white/5"}`}
              >
                En attente
              </button>
              <button
                type="button"
                onClick={() => setReply("ok")}
                className={`h-11 rounded-xl border text-xs font-black uppercase tracking-wide ${reply === "ok" ? "border-emerald-300/55 bg-emerald-500/12" : "border-white/20 bg-white/5"}`}
              >
                A repondu OK
              </button>
              <button
                type="button"
                onClick={() => setReply("no")}
                className={`h-11 rounded-xl border text-xs font-black uppercase tracking-wide ${reply === "no" ? "border-rose-300/55 bg-rose-500/12" : "border-white/20 bg-white/5"}`}
              >
                A repondu Non
              </button>
            </div>
            <p className="mt-4 rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm text-white/80">
              {reply === "ok" && "Le contact est d accord: tu peux envoyer le lead au metier concerne."}
              {reply === "waiting" && "Aucun envoi lead pour l instant. Planifie une relance douce."}
              {reply === "no" && "Pas d envoi lead. Garde la relation active, sans forcer."}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setPhase("message")} className="h-11 rounded-xl border border-white/20 bg-white/10 text-xs font-black uppercase tracking-wide">
                Retour
              </button>
              <button
                type="button"
                onClick={goNextFromResponse}
                className="h-11 rounded-xl bg-gradient-to-r from-[#F1D9A3] via-[#EAC886] to-[#E5B86A] text-black text-xs font-black uppercase tracking-wide"
              >
                Continuer
              </button>
            </div>
          </section>
        )}

        {phase === "dispatch" && (
          <section className="rounded-3xl border border-emerald-300/35 bg-emerald-500/12 p-5 sm:p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-100">Envoi du lead</p>
            <h2 className="mt-1 text-2xl font-black">Choisir le metier concerne</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {(NEEDS_BY_MOMENT[selectedMoment] ?? NEEDS_BY_MOMENT.other).map((trade) => (
                <button
                  key={trade}
                  type="button"
                  onClick={() => setSelectedTrade(trade)}
                  className={`h-11 rounded-xl border text-xs font-black uppercase tracking-wide ${
                    selectedTrade === trade ? "border-emerald-200/60 bg-emerald-400/15" : "border-white/25 bg-black/20"
                  }`}
                >
                  {trade}
                </button>
              ))}
            </div>
            <p className="mt-4 text-sm text-emerald-100">
              Lead pret a envoyer a: <span className="font-black">{selectedTrade}</span> - zone {selectedContact.city}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setPhase("response")} className="h-11 rounded-xl border border-white/25 bg-white/10 text-xs font-black uppercase tracking-wide">
                Retour
              </button>
              <button
                type="button"
                onClick={() => setPhase("done")}
                className="h-11 rounded-xl bg-black text-white text-xs font-black uppercase tracking-wide"
              >
                Envoyer le lead
              </button>
            </div>
          </section>
        )}

        {phase === "done" && (
          <section className="rounded-3xl border border-white/15 bg-[#12161A] p-5 sm:p-6">
            <p className="inline-flex rounded-full border border-emerald-300/40 bg-emerald-500/15 px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-emerald-100">
              Session terminee
            </p>
            <h2 className="mt-2 text-2xl font-black">Resume actionnable</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-3 text-sm">
              <p className="rounded-xl border border-white/15 bg-black/20 px-3 py-2">Contact traite: {selectedContact.name}</p>
              <p className="rounded-xl border border-white/15 bg-black/20 px-3 py-2">Moment detecte: {selectedMomentLabel}</p>
              <p className="rounded-xl border border-white/15 bg-black/20 px-3 py-2">Statut: {reply === "ok" ? "Lead envoye" : "Suivi en cours"}</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPhase("directory");
                  setReply("waiting");
                  setSelectedNeed("");
                  setMessageDraft("");
                }}
                className="h-11 rounded-xl bg-black text-white text-xs font-black uppercase tracking-wide"
              >
                Traiter un autre contact
              </button>
              <Link href="/popey-human/eclaireur-scan-preview" className="h-11 rounded-xl border border-white/25 bg-white/10 text-xs font-black uppercase tracking-wide inline-flex items-center justify-center">
                Comparer avec ancienne page
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
