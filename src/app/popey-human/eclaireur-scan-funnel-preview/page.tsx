"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type MomentSignal =
  | "new_baby"
  | "divorce"
  | "inheritance"
  | "new_job"
  | "moving"
  | "none";
type ProjectType = "immo" | "travaux" | "finance" | "sante" | "autre";

type Contact = {
  id: string;
  name: string;
  phone: string;
  city: string;
};

type PotentialLead = {
  contact: Contact;
  project: ProjectType;
  urgency: "chaud" | "30j" | "plus_tard";
  trust: 1 | 2 | 3 | 4 | 5;
};

const CONTACTS: Contact[] = [
  { id: "c1", name: "Julien M.", phone: "06 12 78 44 01", city: "Dax" },
  { id: "c2", name: "Sophie R.", phone: "06 90 11 43 29", city: "Dax" },
  { id: "c3", name: "Karim B.", phone: "06 31 77 09 11", city: "Saint-Paul-les-Dax" },
  { id: "c4", name: "Claire T.", phone: "06 40 80 42 51", city: "Dax" },
  { id: "c5", name: "Nicolas G.", phone: "06 58 12 09 62", city: "Narrosse" },
];

const SIGNALS: { id: MomentSignal; label: string; helper: string; suggestion: string }[] = [
  {
    id: "new_baby",
    label: "Vient d avoir un enfant",
    helper: "A entendu au comptoir / en appel",
    suggestion: "Suggestion: Courtier ou Agrandissement",
  },
  {
    id: "divorce",
    label: "Est en plein divorce",
    helper: "Besoin de clarifier une situation",
    suggestion: "Suggestion: Agent immo estimation",
  },
  {
    id: "inheritance",
    label: "Vient d heriter",
    helper: "Souvent besoin de tri rapide",
    suggestion: "Suggestion: Notaire ou patrimoine",
  },
  {
    id: "new_job",
    label: "Nouveau poste / mutation",
    helper: "Changement de rythme de vie",
    suggestion: "Suggestion: Immo, assurance, mobilite",
  },
  {
    id: "moving",
    label: "Demange bientot",
    helper: "Projet concret a court terme",
    suggestion: "Suggestion: Travaux, immo, financement",
  },
  {
    id: "none",
    label: "Aucun signal pour l instant",
    helper: "Tri rapide de la liste",
    suggestion: "Suggestion: garder pour plus tard",
  },
];

function projectLabel(project: ProjectType) {
  if (project === "immo") return "Immo";
  if (project === "travaux") return "Travaux";
  if (project === "finance") return "Finance";
  if (project === "sante") return "Sante";
  return "Autre";
}

export default function EclaireurScanFunnelPreviewPage() {
  const [phase, setPhase] = useState<"home" | "signals" | "swipe" | "reachout" | "confirm" | "done">("home");
  const [selectedSignal, setSelectedSignal] = useState<MomentSignal>("new_baby");
  const [index, setIndex] = useState(0);
  const [selectedProject, setSelectedProject] = useState<ProjectType>("immo");
  const [selectedUrgency, setSelectedUrgency] = useState<"chaud" | "30j" | "plus_tard">("30j");
  const [selectedTrust, setSelectedTrust] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [potentials, setPotentials] = useState<PotentialLead[]>([]);
  const [focusLeadId, setFocusLeadId] = useState<string>("");
  const [contactReply, setContactReply] = useState<"none" | "yes" | "no">("none");

  const sortedContacts = useMemo(() => {
    if (selectedSignal === "none") return CONTACTS;
    const priority = CONTACTS.filter((c) => c.city.includes("Dax"));
    const others = CONTACTS.filter((c) => !c.city.includes("Dax"));
    return [...priority, ...others];
  }, [selectedSignal]);

  const current = sortedContacts[index];
  const progress = Math.min(100, Math.round(((index + 1) / sortedContacts.length) * 100));
  const selectedSignalData = SIGNALS.find((signal) => signal.id === selectedSignal) ?? SIGNALS[0];
  const focusLead = potentials.find((lead) => lead.contact.id === focusLeadId) ?? potentials[0];
  const readyToSend = potentials.length > 0;

  const smsText = focusLead
    ? `Salut ${focusLead.contact.name.split(" ")[0]}, j ai pense a toi. Je travaille avec un expert de confiance a ${focusLead.contact.city} sur le sujet ${projectLabel(focusLead.project)}. Tu veux que je lui demande de te contacter ?`
    : "";

  function nextContact() {
    if (index >= sortedContacts.length - 1) {
      setPhase("reachout");
      return;
    }
    setIndex((value) => value + 1);
  }

  function keepForLater() {
    nextContact();
  }

  function markAsPotential() {
    if (!current) return;
    const alreadyExists = potentials.some((lead) => lead.contact.id === current.id);
    if (!alreadyExists) {
      setPotentials((prev) => [
        ...prev,
        {
          contact: current,
          project: selectedProject,
          urgency: selectedUrgency,
          trust: selectedTrust,
        },
      ]);
    }
    nextContact();
  }

  return (
    <main className="min-h-screen bg-[#06080A] text-white">
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#EAC886]/90">Eclaireur Scan V2 - Entonnoir Test</p>
            <h1 className="text-3xl sm:text-4xl font-black">Tri intelligent. Contacte. Valide.</h1>
            <p className="mt-1 text-sm text-white/75">Page de test pour comparer un flow ultra simple et actionnable.</p>
          </div>
          <Link href="/popey-human/eclaireur-scan-preview" className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-wide">
            Voir preview actuelle
          </Link>
        </header>

        {phase === "home" && (
          <section className="rounded-3xl border border-emerald-300/35 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(18,72,54,0.95)_0%,rgba(12,20,22,0.96)_52%,rgba(8,10,12,1)_100%)] p-6 sm:p-7">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-200/90">Objectif produit</p>
            <h2 className="mt-2 text-3xl font-black leading-tight">Transformer 800 contacts en 3 actions simples</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-3 text-sm">
              <p className="rounded-xl border border-white/15 bg-black/25 px-3 py-2">1. Detecter un moment de vie</p>
              <p className="rounded-xl border border-white/15 bg-black/25 px-3 py-2">2. Trier vite en potentiel</p>
              <p className="rounded-xl border border-white/15 bg-black/25 px-3 py-2">3. Envoyer une relance pre-remplie</p>
            </div>
            <button
              type="button"
              onClick={() => setPhase("signals")}
              className="mt-5 h-12 rounded-xl bg-gradient-to-r from-emerald-300 via-emerald-400 to-cyan-300 px-5 text-black text-sm font-black uppercase tracking-wide"
            >
              Demarrer le test funnel
            </button>
          </section>
        )}

        {phase === "signals" && (
          <section className="rounded-3xl border border-white/15 bg-[#12161A] p-5 sm:p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#EAC886]">Etape 1 - Filtre moments de vie</p>
            <h2 className="mt-1 text-2xl font-black">Quel signal faible as-tu entendu ?</h2>
            <div className="mt-4 space-y-2">
              {SIGNALS.map((signal) => (
                <button
                  key={signal.id}
                  type="button"
                  onClick={() => setSelectedSignal(signal.id)}
                  className={`w-full rounded-2xl border px-3 py-3 text-left ${
                    selectedSignal === signal.id ? "border-emerald-300/55 bg-emerald-500/12" : "border-white/15 bg-black/20"
                  }`}
                >
                  <p className="text-sm font-black">{signal.label}</p>
                  <p className="text-xs text-white/70">{signal.helper}</p>
                </button>
              ))}
            </div>
            <p className="mt-3 rounded-lg border border-[#EAC886]/35 bg-[#1D170E] px-3 py-2 text-xs text-[#EAC886]/90">{selectedSignalData.suggestion}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setPhase("home")} className="h-11 rounded-xl border border-white/20 bg-white/10 text-xs font-black uppercase tracking-wide">
                Retour
              </button>
              <button
                type="button"
                onClick={() => setPhase("swipe")}
                className="h-11 rounded-xl bg-gradient-to-r from-emerald-300 via-emerald-400 to-cyan-300 text-black text-xs font-black uppercase tracking-wide"
              >
                Continuer vers tri
              </button>
            </div>
          </section>
        )}

        {phase === "swipe" && (
          <section className="rounded-3xl border border-white/15 bg-[#12161A] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#EAC886]">Etape 2 - Tinder du lead</p>
              <p className="text-xs text-white/70">
                {Math.min(index + 1, sortedContacts.length)}/{sortedContacts.length}
              </p>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-300 to-cyan-300" style={{ width: `${progress}%` }} />
            </div>

            {current ? (
              <article className="mt-4 rounded-2xl border border-white/15 bg-black/25 p-4">
                <p className="text-xs text-white/60">Contact a evaluer</p>
                <p className="mt-1 text-2xl font-black">{current.name}</p>
                <p className="text-sm text-white/75">
                  {current.phone} - {current.city}
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {([
                    ["immo", "Immo"],
                    ["travaux", "Travaux"],
                    ["finance", "Finance"],
                    ["sante", "Sante"],
                    ["autre", "Autre"],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSelectedProject(value)}
                      className={`h-9 rounded-lg border text-xs font-black uppercase tracking-wide ${
                        selectedProject === value ? "border-emerald-300/55 bg-emerald-500/12" : "border-white/20 bg-white/5"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {([
                    ["chaud", "Urgent"],
                    ["30j", "Sous 30j"],
                    ["plus_tard", "Plus tard"],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSelectedUrgency(value)}
                      className={`h-9 rounded-lg border text-xs font-black uppercase tracking-wide ${
                        selectedUrgency === value ? "border-cyan-300/55 bg-cyan-500/12" : "border-white/20 bg-white/5"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="mt-3">
                  <p className="text-xs text-white/70">Confiance</p>
                  <div className="mt-1 grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setSelectedTrust(value as 1 | 2 | 3 | 4 | 5)}
                        className={`h-9 rounded-lg border text-xs font-black ${
                          selectedTrust === value ? "border-[#EAC886]/55 bg-[#EAC886]/15" : "border-white/20 bg-white/5"
                        }`}
                      >
                        {value}/5
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button type="button" onClick={keepForLater} className="h-11 rounded-xl border border-white/20 bg-white/10 text-xs font-black uppercase tracking-wide">
                    Swipe gauche - Plus tard
                  </button>
                  <button
                    type="button"
                    onClick={markAsPotential}
                    className="h-11 rounded-xl bg-gradient-to-r from-emerald-300 via-emerald-400 to-cyan-300 text-black text-xs font-black uppercase tracking-wide"
                  >
                    Swipe droite - Potentiel
                  </button>
                </div>
              </article>
            ) : (
              <p className="mt-4 text-sm text-white/75">Liste terminee.</p>
            )}
          </section>
        )}

        {phase === "reachout" && (
          <section className="rounded-3xl border border-white/15 bg-[#12161A] p-5 sm:p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#EAC886]">Etape 3 - Relance passive</p>
            <h2 className="mt-1 text-2xl font-black">Envoie un message pre-rempli</h2>
            {!readyToSend ? (
              <p className="mt-3 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white/75">
                Aucun potentiel detecte. Reviens au tri pour marquer au moins un contact.
              </p>
            ) : (
              <>
                <div className="mt-3 flex flex-wrap gap-2">
                  {potentials.map((lead) => (
                    <button
                      key={lead.contact.id}
                      type="button"
                      onClick={() => setFocusLeadId(lead.contact.id)}
                      className={`rounded-lg border px-3 py-2 text-xs font-black uppercase tracking-wide ${
                        (focusLead?.contact.id ?? "") === lead.contact.id ? "border-emerald-300/55 bg-emerald-500/12" : "border-white/20 bg-white/5"
                      }`}
                    >
                      {lead.contact.name}
                    </button>
                  ))}
                </div>
                <div className="mt-3 rounded-2xl border border-white/15 bg-black/25 p-4">
                  <p className="text-xs text-white/65">Message a envoyer</p>
                  <p className="mt-2 text-sm text-white/90">{smsText}</p>
                </div>
              </>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setPhase("swipe")} className="h-11 rounded-xl border border-white/20 bg-white/10 text-xs font-black uppercase tracking-wide">
                Retour tri
              </button>
              <button
                type="button"
                onClick={() => setPhase("confirm")}
                disabled={!readyToSend}
                className="h-11 rounded-xl bg-gradient-to-r from-emerald-300 via-emerald-400 to-cyan-300 text-black text-xs font-black uppercase tracking-wide disabled:opacity-40"
              >
                J ai contacte le lead
              </button>
            </div>
          </section>
        )}

        {phase === "confirm" && (
          <section className="rounded-3xl border border-[#EAC886]/35 bg-[#1A1510] p-5 sm:p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#EAC886]">Validation lead</p>
            <h2 className="mt-1 text-2xl font-black">Le contact a-t-il dit oui ?</h2>
            <p className="mt-2 text-sm text-white/80">Un lead n est valide que si le contact donne son accord.</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setContactReply("yes")}
                className={`h-11 rounded-xl border text-xs font-black uppercase tracking-wide ${contactReply === "yes" ? "border-emerald-300/55 bg-emerald-500/12" : "border-white/20 bg-white/5"}`}
              >
                Oui
              </button>
              <button
                type="button"
                onClick={() => setContactReply("no")}
                className={`h-11 rounded-xl border text-xs font-black uppercase tracking-wide ${contactReply === "no" ? "border-rose-300/55 bg-rose-500/12" : "border-white/20 bg-white/5"}`}
              >
                Non
              </button>
              <button
                type="button"
                onClick={() => setContactReply("none")}
                className={`h-11 rounded-xl border text-xs font-black uppercase tracking-wide ${contactReply === "none" ? "border-cyan-300/55 bg-cyan-500/12" : "border-white/20 bg-white/5"}`}
              >
                En attente
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-white/15 bg-black/25 p-3 text-sm">
              {contactReply === "yes" && <p>Lead qualifie: accord obtenu, pret pour attribution locale (1 partenaire dans la ville).</p>}
              {contactReply === "no" && <p>Lead non qualifie: garde en suivi, sans envoi au partenaire.</p>}
              {contactReply === "none" && <p>Lead en attente: relance douce dans 48h.</p>}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setPhase("reachout")} className="h-11 rounded-xl border border-white/20 bg-white/10 text-xs font-black uppercase tracking-wide">
                Retour relance
              </button>
              <button
                type="button"
                onClick={() => setPhase("done")}
                className="h-11 rounded-xl bg-gradient-to-r from-[#F1D9A3] via-[#EAC886] to-[#E5B86A] text-black text-xs font-black uppercase tracking-wide"
              >
                Finaliser
              </button>
            </div>
          </section>
        )}

        {phase === "done" && (
          <section className="rounded-3xl border border-emerald-300/35 bg-emerald-500/12 p-5 sm:p-6">
            <p className="inline-flex rounded-full border border-emerald-300/40 bg-emerald-500/15 px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-emerald-100">
              Funnel termine
            </p>
            <h2 className="mt-2 text-2xl font-black">Resultat concret de la session</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-3 text-sm">
              <p className="rounded-xl border border-white/15 bg-black/20 px-3 py-2">Contacts tries: {Math.min(index, sortedContacts.length)}/{sortedContacts.length}</p>
              <p className="rounded-xl border border-white/15 bg-black/20 px-3 py-2">Potentiels identifies: {potentials.length}</p>
              <p className="rounded-xl border border-white/15 bg-black/20 px-3 py-2">
                Leads valides: {contactReply === "yes" ? "1" : "0"}
              </p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPhase("signals");
                  setIndex(0);
                  setPotentials([]);
                  setFocusLeadId("");
                  setContactReply("none");
                }}
                className="h-11 rounded-xl bg-black text-white text-xs font-black uppercase tracking-wide"
              >
                Refaire un test
              </button>
              <Link href="/popey-human/eclaireur-scan-preview" className="h-11 rounded-xl border border-white/25 bg-white/10 text-xs font-black uppercase tracking-wide inline-flex items-center justify-center">
                Comparer avec l autre page
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
