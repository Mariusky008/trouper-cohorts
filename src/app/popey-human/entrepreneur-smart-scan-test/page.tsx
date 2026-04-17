"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";

type DailyCategory = "passer" | "eclaireur" | "package" | "exclients" | "qualifier";

type DailyContact = {
  id: string;
  name: string;
  city: string;
  companyHint: string;
  capsule: string;
  communityKnownBy: number;
  dominantTags: string[];
  externalNews: string;
};

const CONTACTS: DailyContact[] = [
  {
    id: "d1",
    name: "Nicolas B.",
    city: "Dax",
    companyHint: "NLB Habitat",
    capsule: "Ajoute il y a 3 ans",
    communityKnownBy: 3,
    dominantTags: ["🤝 Connecteur", "🏆 Decideur"],
    externalNews: "Actif sur des sujets immo cette semaine",
  },
  {
    id: "d2",
    name: "Claire R.",
    city: "Saint-Paul-les-Dax",
    companyHint: "Claire Conseil",
    capsule: "Ajoute le jour de la finale 2018",
    communityKnownBy: 2,
    dominantTags: ["💼 Investisseur", "🧠 Visionnaire"],
    externalNews: "Sa societe a ouvert un recrutement",
  },
  {
    id: "d3",
    name: "Julien M.",
    city: "Dax",
    companyHint: "JM Services",
    capsule: "Ajoute il y a exactement 5 ans",
    communityKnownBy: 4,
    dominantTags: ["🔌 Connecteur", "🎾 Padel"],
    externalNews: "Mentionne un projet de refinancement",
  },
  {
    id: "d4",
    name: "Sophie T.",
    city: "Narrosse",
    companyHint: "Studio T",
    capsule: "Ajoute pendant un projet client majeur",
    communityKnownBy: 1,
    dominantTags: ["🍷 Gastronomie", "✨ Ambitieuse"],
    externalNews: "A commente des posts courtage ce matin",
  },
  {
    id: "d5",
    name: "Karim A.",
    city: "Dax",
    companyHint: "KA Invest",
    capsule: "Ajoute il y a 2 ans",
    communityKnownBy: 3,
    dominantTags: ["💼 Investisseur", "🏡 Immo"],
    externalNews: "Partage des sujets fiscalite locale",
  },
  {
    id: "d6",
    name: "Lina P.",
    city: "Dax",
    companyHint: "LP Design",
    capsule: "Ajoute en 2021",
    communityKnownBy: 2,
    dominantTags: ["🎨 Creative", "🤝 Relais"],
    externalNews: "Booste son activite sur LinkedIn",
  },
  {
    id: "d7",
    name: "Maxime D.",
    city: "Saint-Vincent-de-Paul",
    companyHint: "MD Auto",
    capsule: "Ajoute il y a 4 ans",
    communityKnownBy: 2,
    dominantTags: ["🚗 Auto", "⚡ Reactif"],
    externalNews: "Cherche un partenaire financement",
  },
  {
    id: "d8",
    name: "Julie C.",
    city: "Dax",
    companyHint: "JC Patrimoine",
    capsule: "Ajoute lors d un dossier notarial",
    communityKnownBy: 3,
    dominantTags: ["📈 Finance", "🏆 Decideur"],
    externalNews: "Interagit sur les taux immobiliers",
  },
  {
    id: "d9",
    name: "Tom V.",
    city: "Soustons",
    companyHint: "TV Habitat",
    capsule: "Ajoute il y a 6 ans",
    communityKnownBy: 1,
    dominantTags: ["🏡 Habitat", "🔌 Connecteur"],
    externalNews: "Actif sur des contenus renovation",
  },
  {
    id: "d10",
    name: "Maya F.",
    city: "Dax",
    companyHint: "MF Legal",
    capsule: "Ajoute en 2020",
    communityKnownBy: 2,
    dominantTags: ["⚖️ Juridique", "💡 Visionnaire"],
    externalNews: "A commente des sujets transmission",
  },
];

const VOTE_TAGS = ["🎾 Padel", "🍷 Gastronomie", "💼 Investisseur", "🔌 Connecteur"] as const;

const ACTIONS: Array<{ id: DailyCategory; label: string; chip: string }> = [
  { id: "passer", label: "Passer", chip: "Archive 30j" },
  { id: "eclaireur", label: "Eclaireur", chip: "Enroler apporteur" },
  { id: "package", label: "Package Croise", chip: "Reco croisee" },
  { id: "exclients", label: "Ex-Clients (News)", chip: "Update marche" },
  { id: "qualifier", label: "Qualifier", chip: "Tag sans message" },
];

function buildTemplate(action: DailyCategory, contact: DailyContact) {
  if (action === "eclaireur") {
    return `Salut ${contact.name.split(" ")[0]}, je monte une mini-agence avec un courtier et un notaire de confiance. On cherche des eclaireurs pour nous remonter des infos terrain contre partage. Ca te parle ?`;
  }
  if (action === "package") {
    return `Bonjour ${contact.name.split(" ")[0]}, je travaille en synergie avec un expert en pret immobilier. Vu le marche actuel, il peut te faire gagner sur ton credit. Je te le presente ?`;
  }
  if (action === "exclients") {
    return `Hello ${contact.name.split(" ")[0]}, update secteur: les prix dans ton quartier ont bouge recemment. Si tu veux une actualisation rapide de ton estimation, je te l envoie.`;
  }
  if (action === "qualifier") {
    return "Pas d envoi. Qualification communautaire uniquement.";
  }
  return "Passe pour ce cycle de 30 jours.";
}

export default function EntrepreneurSmartScanTestPage() {
  const [index, setIndex] = useState(0);
  const [selectedAction, setSelectedAction] = useState<DailyCategory | null>(null);
  const [selectedVotes, setSelectedVotes] = useState<string[]>([]);
  const [sentCount, setSentCount] = useState(4);
  const [responseRate] = useState(38);
  const [showReward, setShowReward] = useState(false);

  const current = CONTACTS[index] ?? CONTACTS[CONTACTS.length - 1];
  const done = Math.min(index, CONTACTS.length);
  const template = useMemo(
    () => (selectedAction ? buildTemplate(selectedAction, current) : "Choisis une action pour voir le template pre-rempli."),
    [selectedAction, current],
  );

  function completeCard(action: DailyCategory) {
    setSelectedAction(action);
    if (action === "eclaireur" || action === "package" || action === "exclients") {
      setSentCount((v) => v + 1);
    }
    setShowReward(true);
    setTimeout(() => setShowReward(false), 900);
    setTimeout(() => {
      setIndex((v) => Math.min(CONTACTS.length, v + 1));
      setSelectedAction(null);
      setSelectedVotes([]);
    }, 200);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,#0C1230_0%,#090D1F_45%,#05070F_100%)] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Smart Scan & Daily Action</p>
              <h1 className="mt-1 text-2xl font-black sm:text-3xl">Mini-Agence • Daily 10</h1>
            </div>
            <div className="rounded-2xl border border-white/15 bg-black/25 px-3 py-2 text-right">
              <p className="text-xs text-white/70">Progression</p>
              <p className="text-sm font-black">{done}/10 effectues</p>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-indigo-400 to-orange-300" style={{ width: `${(done / 10) * 100}%` }} />
          </div>
          <p className="mt-2 text-xs text-white/70">Dashboard mini-agence: {sentCount} messages envoyes aujourd hui • taux de reponse {responseRate}%</p>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Daily Card</p>
              <span className="rounded-full border border-white/15 bg-black/25 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white/80">Privacy First</span>
            </div>

            <motion.article
              key={current.id}
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="mt-3 rounded-[28px] bg-white/10 p-4 shadow-[0_28px_60px_-35px_rgba(0,0,0,0.7)] backdrop-blur-2xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-2xl font-black">{current.name}</p>
                  <p className="text-sm text-white/70">{current.companyHint} • {current.city}</p>
                </div>
                <div className="rounded-full bg-cyan-300/20 px-2 py-1 text-[10px] font-black uppercase tracking-[0.11em] text-cyan-100">
                  Hash SHA-256 actif
                </div>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded-2xl bg-[#1B244B]/80 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-indigo-200">Capsule Temporelle</p>
                  <p className="mt-1 text-xs">{current.capsule}</p>
                </div>
                <div className="rounded-2xl bg-[#341E52]/80 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-fuchsia-200">Signal Communaute</p>
                  <p className="mt-1 text-xs">Connu par {current.communityKnownBy} membres</p>
                  <p className="mt-1 text-xs text-white/75">{current.dominantTags.join(" • ")}</p>
                </div>
                <div className="rounded-2xl bg-[#3A2B12]/80 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-amber-200">Actu Temps Reel</p>
                  <p className="mt-1 text-xs">{current.externalNews}</p>
                </div>
              </div>

              <div className="mt-3 rounded-2xl bg-white/10 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-white/70">Contribution express</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {VOTE_TAGS.map((tag) => {
                    const active = selectedVotes.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() =>
                          setSelectedVotes((prev) => (prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]))
                        }
                        className={`rounded-full px-3 py-2 text-xs font-black transition ${
                          active ? "bg-cyan-300 text-[#1A223D]" : "bg-white/80 text-[#1B1F34]"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.article>

            <div className="mt-3 grid gap-2 sm:grid-cols-5">
              {ACTIONS.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => completeCard(action.id)}
                  className={`h-12 rounded-xl border text-[11px] font-black uppercase tracking-wide ${
                    action.id === "passer"
                      ? "border-white/20 bg-black/25 text-white/75"
                      : "border-cyan-300/30 bg-cyan-500/10 text-cyan-100"
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-white/70">Less is more: traite 10 contacts en moins de 3 minutes pendant le cafe.</p>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#EAC886]">Template Assistant</p>
            <h2 className="mt-1 text-xl font-black">Message pre-rempli</h2>
            <textarea value={template} readOnly className="mt-3 min-h-44 w-full rounded-2xl border border-white/15 bg-black/25 px-3 py-3 text-sm" />

            <div className="mt-3 rounded-2xl bg-black/25 p-3">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-white/70">Privacy by Design</p>
              <ul className="mt-2 space-y-1 text-xs text-white/75">
                <li>• Hashing local SHA-256 avant matching</li>
                <li>• Aucune donnee contact envoyee sans action explicite</li>
                <li>• Scan metadonnees client-side pour rapidite</li>
              </ul>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl bg-indigo-500/15 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-indigo-100">Workflow Tech</p>
                <p className="mt-1 text-xs text-white/80">Permission contacts → Moteur Daily 10 → Swipe/actions → Push relance.</p>
              </div>
              <div className="rounded-2xl bg-fuchsia-500/15 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-fuchsia-100">Mini-Agence</p>
                <p className="mt-1 text-xs text-white/80">Messages collectifs, taux de reponse, et volume d actions partages.</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {showReward && (
        <div className="pointer-events-none fixed inset-x-0 top-16 z-40 flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-black text-[#132415] shadow-[0_20px_40px_-20px_rgba(16,185,129,0.8)]"
          >
            🎉 Action enregistree pour la mini-agence
          </motion.div>
        </div>
      )}
    </main>
  );
}
