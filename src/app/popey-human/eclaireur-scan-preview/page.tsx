"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type ScanSource = "guided" | "import" | "paste";
type NeedType = "immo" | "travaux" | "assurance" | "sante" | "auto" | "autre";
type Urgency = "immediate" | "month" | "later";

type Opportunity = {
  id: string;
  contactName: string;
  contactPhone: string;
  targetTrade: string;
  score: number;
  estimatedCommission: number;
  reason: string;
};

export default function EclaireurScanPreviewPage() {
  const [phase, setPhase] = useState<"home" | "source" | "quiz" | "results" | "assignment" | "convert" | "reward">("home");
  const [source, setSource] = useState<ScanSource>("guided");
  const [quizStep, setQuizStep] = useState(1);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [needType, setNeedType] = useState<NeedType | "">("");
  const [trustLevel, setTrustLevel] = useState(3);
  const [urgency, setUrgency] = useState<Urgency | "">("");
  const [showTopOnly, setShowTopOnly] = useState(true);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState("");
  const [leadNote, setLeadNote] = useState("");

  const opportunities = useMemo<Opportunity[]>(() => {
    const baseName = contactName.trim() || "Contact prioritaire";
    const basePhone = contactPhone.trim() || "06 00 00 00 00";
    const needBonus = needType === "immo" || needType === "travaux" ? 9 : 4;
    const urgencyBonus = urgency === "immediate" ? 8 : urgency === "month" ? 4 : 1;
    const scoreA = Math.min(93, 58 + trustLevel * 4 + needBonus + urgencyBonus);
    const scoreB = Math.min(90, scoreA - 7);
    const scoreC = Math.max(52, scoreA - 14);
    const gainFactor = urgency === "immediate" ? 1.2 : urgency === "month" ? 1.0 : 0.8;

    return [
      {
        id: "op-1",
        contactName: baseName,
        contactPhone: basePhone,
        targetTrade: needType === "auto" ? "Assureur auto" : needType === "sante" ? "Courtier mutuelle" : "Courtier",
        score: scoreA,
        estimatedCommission: Math.round((120 + trustLevel * 12) * gainFactor),
        reason: "Timing chaud + besoin explicite + forte confiance",
      },
      {
        id: "op-2",
        contactName: "Sophie M.",
        contactPhone: "06 31 12 67 10",
        targetTrade: needType === "travaux" ? "Maitre d'oeuvre" : "Agent immo",
        score: scoreB,
        estimatedCommission: Math.round((95 + trustLevel * 8) * gainFactor),
        reason: "Projet en cours + decision rapide probable",
      },
      {
        id: "op-3",
        contactName: "SCI Horizon",
        contactPhone: "05 58 90 11 22",
        targetTrade: "Notaire",
        score: scoreC,
        estimatedCommission: Math.round((70 + trustLevel * 6) * gainFactor),
        reason: "Opportunite moyen terme avec bon potentiel",
      },
      {
        id: "op-4",
        contactName: "Paul D.",
        contactPhone: "06 44 55 87 21",
        targetTrade: "Diagnostiqueur",
        score: Math.max(45, scoreC - 9),
        estimatedCommission: Math.round((55 + trustLevel * 5) * gainFactor),
        reason: "Signal faible mais exploitable",
      },
    ];
  }, [contactName, contactPhone, needType, trustLevel, urgency]);

  const visibleOpportunities = showTopOnly ? opportunities.slice(0, 3) : opportunities;
  const selectedOpportunity =
    opportunities.find((opportunity) => opportunity.id === selectedOpportunityId) || opportunities[0];

  const missionProgress = phase === "reward" ? 1 : 0;

  return (
    <main className="min-h-screen bg-[#06080A] text-white">
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#EAC886]/90">Eclaireur Scan V2 - Preview</p>
            <h1 className="text-3xl sm:text-4xl font-black">Trouve. Convertis. Encaisse.</h1>
            <p className="mt-1 text-sm text-white/75">Prototype de flow motivation lead-first.</p>
          </div>
          <Link href="/popey-human/eclaireur-preview" className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-wide hover:bg-white/15 transition">
            Ancienne preview
          </Link>
        </div>

        <section className="rounded-2xl border border-[#EAC886]/35 bg-gradient-to-br from-[#2A1E10] to-[#16110A] p-4 shadow-[0_20px_50px_-30px_rgba(234,200,134,0.6)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#EAC886]">Mission du jour</p>
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/80">Streak: 4 jours</p>
          </div>
          <p className="mt-1 text-sm text-[#EAC886]/90">Envoie 1 lead avant 18h pour debloquer le badge Sprinter.</p>
          <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#EAC886] to-emerald-300" style={{ width: `${missionProgress * 100}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-white/70">Progression: {missionProgress}/1</p>
        </section>

        {phase === "home" && (
          <section className="rounded-[28px] border border-emerald-300/35 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(18,72,54,0.95)_0%,rgba(12,20,22,0.96)_52%,rgba(8,10,12,1)_100%)] p-6 sm:p-7 shadow-[0_26px_60px_-30px_rgba(16,185,129,0.8)]">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-200/90">Nouveau mode scan</p>
            <h2 className="mt-2 text-3xl font-black leading-tight">Tu as deja des leads dans ton reseau</h2>
            <p className="mt-2 text-base text-white/85">On les detecte en 2 minutes avec score de potentiel et gain estime.</p>
            <p className="mt-3 rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-sm text-white/85">
              Cette semaine a Dax: <span className="font-black text-emerald-200">27 leads detectes</span> • <span className="font-black text-cyan-200">9 signes</span>
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPhase("source")}
                className="h-12 rounded-xl bg-gradient-to-r from-emerald-300 via-emerald-400 to-cyan-300 text-black text-sm font-black uppercase tracking-wide shadow-[0_14px_30px_-18px_rgba(34,197,94,0.9)] hover:brightness-105 transition"
              >
                Lancer le scan (2 min)
              </button>
              <button
                type="button"
                onClick={() => {
                  setPhase("assignment");
                  setSelectedOpportunityId("op-1");
                }}
                className="h-12 rounded-xl border border-white/25 bg-white/10 text-sm font-black uppercase tracking-wide hover:bg-white/15 transition"
              >
                Envoyer un lead manuel
              </button>
            </div>
            <p className="mt-2 text-[11px] text-white/60">Rien n est envoye sans ta validation.</p>
          </section>
        )}

        {phase === "source" && (
          <section className="rounded-3xl border border-white/15 bg-[#12161A] p-5 sm:p-6">
            <h2 className="text-xl font-black">Choisis comment scanner</h2>
            <p className="mt-1 text-sm text-white/75">Tu gardes le controle. Les contacts ne sont jamais partages automatiquement.</p>
            <div className="mt-3 space-y-2">
              {([
                ["guided", "Scan guide manuel (Recommande)", "Le plus rapide pour convertir aujourd hui."],
                ["import", "Importer des contacts (CSV/vCard)", "Ideal pour scanner en volume."],
                ["paste", "Coller une liste de contacts", "Copie-colle noms + telephones."],
              ] as const).map(([value, label, description]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSource(value)}
                  className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                    source === value ? "border-emerald-300/55 bg-emerald-500/12 shadow-[0_10px_25px_-18px_rgba(16,185,129,0.9)]" : "border-white/15 bg-black/20 hover:bg-black/30"
                  }`}
                >
                  <p className="text-sm font-black tracking-wide">{label}</p>
                  <p className="mt-1 text-xs text-white/70">{description}</p>
                </button>
              ))}
            </div>
            <p className="mt-3 rounded-lg border border-[#EAC886]/35 bg-[#1D170E] px-3 py-2 text-xs text-[#EAC886]/90">
              Note preview: avec seulement nom + telephone, le score est preliminaire et sert a prioriser.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setPhase("home")} className="h-11 rounded-xl border border-white/20 bg-white/10 text-xs font-black uppercase tracking-wide">
                Retour
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuizStep(1);
                  setPhase("quiz");
                }}
                className="h-11 rounded-xl bg-gradient-to-r from-emerald-300 via-emerald-400 to-cyan-300 text-black text-xs font-black uppercase tracking-wide shadow-[0_14px_30px_-18px_rgba(34,197,94,0.9)] hover:brightness-105 transition"
              >
                Continuer
              </button>
            </div>
          </section>
        )}

        {phase === "quiz" && (
          <section className="rounded-2xl border border-white/15 bg-[#12161A] p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/70">Etape {quizStep}/4</p>
            <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-300 to-cyan-300 transition-all" style={{ width: `${(quizStep / 4) * 100}%` }} />
            </div>

            {quizStep === 1 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-black">Qui peux-tu recommander aujourd hui ?</p>
                <input
                  value={contactName}
                  onChange={(event) => setContactName(event.target.value)}
                  placeholder="Nom du contact"
                  className="h-12 w-full rounded-xl border border-white/20 bg-black/25 px-3 text-sm"
                />
                <input
                  value={contactPhone}
                  onChange={(event) => setContactPhone(event.target.value)}
                  placeholder="Telephone"
                  className="h-12 w-full rounded-xl border border-white/20 bg-black/25 px-3 text-sm"
                />
              </div>
            )}

            {quizStep === 2 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-black">Quel besoin probable ?</p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    ["immo", "Immo"],
                    ["travaux", "Travaux"],
                    ["assurance", "Assurance"],
                    ["sante", "Sante"],
                    ["auto", "Auto"],
                    ["autre", "Autre"],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setNeedType(value)}
                      className={`h-10 rounded-lg border text-xs font-black uppercase tracking-wide ${
                        needType === value ? "border-emerald-300/55 bg-emerald-500/12" : "border-white/20 bg-white/5"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {quizStep === 3 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-black">Confiance avec ce contact</p>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTrustLevel(value)}
                      className={`h-10 rounded-lg border text-sm font-black ${
                        trustLevel === value ? "border-emerald-300/55 bg-emerald-500/12" : "border-white/20 bg-white/5"
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {quizStep === 4 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-black">Urgence estimee</p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    ["immediate", "Immediat"],
                    ["month", "Sous 30j"],
                    ["later", "Plus tard"],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setUrgency(value)}
                      className={`h-10 rounded-lg border text-xs font-black uppercase tracking-wide ${
                        urgency === value ? "border-emerald-300/55 bg-emerald-500/12" : "border-white/20 bg-white/5"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => (quizStep === 1 ? setPhase("source") : setQuizStep((step) => step - 1))}
                className="h-11 rounded-xl border border-white/20 bg-white/10 text-xs font-black uppercase tracking-wide"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={() => {
                  if (quizStep < 4) {
                    setQuizStep((step) => step + 1);
                    return;
                  }
                  setPhase("results");
                }}
                className="h-11 rounded-xl bg-emerald-400 text-black text-xs font-black uppercase tracking-wide"
              >
                {quizStep < 4 ? "Suivant" : "Analyser mon reseau"}
              </button>
            </div>
          </section>
        )}

        {phase === "results" && (
          <section className="rounded-2xl border border-white/15 bg-[#12161A] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-black">12 opportunites detectees</h2>
                <p className="text-sm text-white/75">Commence par les plus convertibles.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowTopOnly((current) => !current)}
                className="h-9 rounded-lg border border-white/20 bg-white/10 px-3 text-xs font-black uppercase tracking-wide"
              >
                {showTopOnly ? "Top 3" : "Tout voir"}
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {visibleOpportunities.map((opportunity) => (
                <article key={opportunity.id} className="rounded-xl border border-white/15 bg-black/20 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-lg font-black">{opportunity.contactName}</p>
                    <span className="rounded-full border border-emerald-300/40 bg-emerald-500/15 px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-emerald-200">
                      Score {opportunity.score}%
                    </span>
                  </div>
                  <p className="text-sm text-white/80">Metier recommande: {opportunity.targetTrade}</p>
                  <p className="text-sm text-emerald-200 font-black">Gain estime: {opportunity.estimatedCommission} EUR</p>
                  <p className="text-xs text-white/65">Pourquoi: {opportunity.reason}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOpportunityId(opportunity.id);
                        setPhase("assignment");
                      }}
                      className="h-10 rounded-lg bg-emerald-400 text-black text-xs font-black uppercase tracking-wide"
                    >
                      Convertir en lead
                    </button>
                    <button type="button" className="h-10 rounded-lg border border-white/20 bg-white/10 text-xs font-black uppercase tracking-wide">
                      Ignorer
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedOpportunityId(visibleOpportunities[0]?.id || "op-1");
                setPhase("assignment");
              }}
              className="mt-3 h-11 w-full rounded-xl border border-[#EAC886]/45 bg-[#EAC886]/18 text-xs font-black uppercase tracking-wide text-[#EAC886]"
            >
              Convertir les 3 meilleurs
            </button>
          </section>
        )}

        {phase === "assignment" && (
          <section className="rounded-3xl border border-[#EAC886]/35 bg-gradient-to-br from-[#241B12] via-[#1A1510] to-[#15100A] p-5 sm:p-6 shadow-[0_24px_55px_-30px_rgba(234,200,134,0.55)]">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#EAC886]">Attribution locale</p>
            <h2 className="mt-2 text-2xl font-black">Comment ce lead est attribue</h2>
            <p className="mt-3 text-sm text-white/85">
              Dans cette ville, nous avons actuellement 50 metiers enregistres dont les services sont plebiscites.
            </p>
            <p className="mt-2 text-sm text-white/80">
              Pour chaque lead, nous selectionnons un seul metier/entreprise partenaire, le plus pertinent selon le besoin.
            </p>

            <div className="mt-4 rounded-2xl border border-white/15 bg-black/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/65">Entreprise recommandee</p>
              <p className="mt-1 text-lg font-black">{selectedOpportunity.targetTrade} Horizon Dax</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <p className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/75">Zone: Dax + 25 km</p>
                <p className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/75">Rappel moyen: 2h</p>
                <p className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/75">Satisfaction: 4.8/5</p>
              </div>
              <p className="mt-3 text-xs text-emerald-200">Pourquoi ce choix: adequation besoin + disponibilite immediate.</p>
            </div>

            <p className="mt-3 rounded-lg border border-emerald-300/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
              Tu peux consulter les details avant envoi. Rien n est envoye sans ta validation.
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setPhase("results")} className="h-11 rounded-xl border border-white/20 bg-white/10 text-xs font-black uppercase tracking-wide">
                Retour
              </button>
              <button
                type="button"
                onClick={() => setPhase("convert")}
                className="h-11 rounded-xl bg-gradient-to-r from-[#F1D9A3] via-[#EAC886] to-[#E5B86A] text-black text-xs font-black uppercase tracking-wide shadow-[0_18px_35px_-20px_rgba(234,200,134,0.9)] hover:brightness-105 transition"
              >
                Continuer
              </button>
            </div>
          </section>
        )}

        {phase === "convert" && (
          <section className="rounded-2xl border border-white/15 bg-[#12161A] p-4">
            <h2 className="text-xl font-black">Valider et envoyer</h2>
            <p className="text-sm text-white/75">Les infos sont pre-remplies depuis le scan.</p>
            <div className="mt-3 space-y-2">
              <input value={selectedOpportunity.contactName} readOnly className="h-12 w-full rounded-xl border border-white/20 bg-black/25 px-3 text-sm" />
              <input value={selectedOpportunity.contactPhone} readOnly className="h-12 w-full rounded-xl border border-white/20 bg-black/25 px-3 text-sm" />
              <input value={selectedOpportunity.targetTrade} readOnly className="h-12 w-full rounded-xl border border-white/20 bg-black/25 px-3 text-sm" />
              <textarea
                value={leadNote}
                onChange={(event) => setLeadNote(event.target.value)}
                placeholder="Commentaire utile (optionnel)"
                className="min-h-24 w-full rounded-xl border border-white/20 bg-black/25 px-3 py-2 text-sm"
              />
            </div>
            <p className="mt-2 rounded-lg border border-emerald-300/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              Commission estimee: {selectedOpportunity.estimatedCommission} EUR si signe.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setPhase("results")} className="h-11 rounded-xl border border-white/20 bg-white/10 text-xs font-black uppercase tracking-wide">
                Retour
              </button>
              <button
                type="button"
                onClick={() => setPhase("reward")}
                className="h-11 rounded-xl bg-gradient-to-r from-emerald-300 via-emerald-400 to-cyan-300 text-black text-xs font-black uppercase tracking-wide"
              >
                Envoyer l alerte
              </button>
            </div>
          </section>
        )}

        {phase === "reward" && (
          <section className="rounded-2xl border border-emerald-300/35 bg-emerald-500/12 p-4">
            <p className="inline-flex rounded-full border border-emerald-300/40 bg-emerald-500/15 px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-emerald-100">
              +1 lead envoye
            </p>
            <h2 className="mt-2 text-2xl font-black">Bien joue, tu avances</h2>
            <div className="mt-2 space-y-1 text-sm">
              <p>Mission du jour: <span className="font-black text-emerald-100">1/1</span></p>
              <p>Potentiel debloque: <span className="font-black text-emerald-100">+{selectedOpportunity.estimatedCommission} EUR</span></p>
              <p>Streak: <span className="font-black text-emerald-100">5 jours</span></p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPhase("quiz");
                  setQuizStep(1);
                }}
                className="h-11 rounded-xl bg-black text-white text-xs font-black uppercase tracking-wide"
              >
                Scanner un autre contact
              </button>
              <button type="button" onClick={() => setPhase("results")} className="h-11 rounded-xl border border-white/25 bg-white/10 text-xs font-black uppercase tracking-wide">
                Voir mes opportunites
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
