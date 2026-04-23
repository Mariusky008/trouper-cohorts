"use client";

import { useMemo, useState } from "react";

const flowCards = [
  { icon: "🟢", title: "SCAN", line: "On analyse ton telephone", tone: "from-emerald-300/35 to-emerald-300/10" },
  {
    icon: "🟡",
    title: "ACTIVER",
    line: "Message pret a envoyer (service ou apporteur d affaire)",
    tone: "from-amber-300/35 to-amber-300/10",
  },
  { icon: "🔵", title: "OPPORTUNITES", line: "Tes contacts t envoient des opportunites (car ils y gagnent)", tone: "from-cyan-300/35 to-cyan-300/10" },
  { icon: "🟣", title: "CASH", line: "Tu suis et encaisses", tone: "from-fuchsia-300/35 to-fuchsia-300/10" },
] as const;

const metierMap: Array<{ keys: string[]; targets: string[] }> = [
  { keys: ["immo", "immobilier", "agent"], targets: ["Secretaires", "Courtiers", "Conciergeries"] },
  { keys: ["dev", "developpeur", "freelance", "web"], targets: ["Agences web", "Responsables acquisition", "Commerciaux B2B"] },
  { keys: ["coach", "formation"], targets: ["RH", "Managers", "Directeurs de centre"] },
  { keys: ["courtier", "banque", "finance"], targets: ["Agents immo", "Notaires", "Gestionnaires patrimoine"] },
];

function getTargets(metier: string) {
  const normalized = metier.toLowerCase().trim();
  if (!normalized) return [];
  const hit = metierMap.find((entry) => entry.keys.some((key) => normalized.includes(key)));
  if (hit) return hit.targets;
  return ["Secretaires", "Prescripteurs locaux", "Apporteurs de confiance"];
}

export default function AccueilTestPage() {
  const [metier, setMetier] = useState("");
  const [activatedContacts, setActivatedContacts] = useState(25);
  const [heroVideoError, setHeroVideoError] = useState(false);

  const targets = useMemo(() => getTargets(metier), [metier]);
  const activeConnectors = Math.round(activatedContacts * 0.32);
  const monthlyOpportunities = Math.max(4, Math.round(activeConnectors * 0.55));
  const monthlyRevenue = monthlyOpportunities * 800;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#172554_0%,#0f172a_48%,#090b16_100%)] text-white">
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 pb-24 pt-10 sm:px-6 lg:px-8">
        <section className="grid items-center gap-6 rounded-3xl border border-white/15 bg-white/5 p-6 shadow-[0_24px_80px_-36px_rgba(16,185,129,0.6)] lg:grid-cols-[1.05fr_0.95fr] sm:p-8">
          <div>
            <p className="inline-flex rounded-full border border-emerald-300/35 bg-emerald-300/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-100">
              Popey - Landing test v4
            </p>
            <h1 className="mt-4 text-4xl font-black leading-[0.95] sm:text-6xl">
              Ton telephone contient deja tes prochains clients.
            </h1>
            <p className="mt-3 text-lg font-semibold text-cyan-100">
              On te montre qui contacter, quoi leur dire, et pourquoi ils vont t envoyer des clients.
            </p>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/85">
              Des personnes autour de toi entendent parler de clients tous les jours. Aujourd hui, tu ne touches rien.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href="/popey-human/smart-scan"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-emerald-300/35 bg-emerald-300/20 px-6 text-sm font-black uppercase tracking-[0.08em] text-emerald-100 transition hover:bg-emerald-300/30"
              >
                Voir qui peut m apporter des clients
              </a>
              <a
                href="#hero-demo"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-6 text-sm font-black uppercase tracking-[0.08em] text-white/90 transition hover:bg-white/15"
              >
                Voir la demo (30 sec)
              </a>
            </div>
          </div>

          <div id="hero-demo" className="rounded-3xl border border-cyan-300/35 bg-[#0A1434]/80 p-4 shadow-[0_30px_90px_-45px_rgba(34,211,238,0.8)]">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">Demo video 30 sec</p>
            {!heroVideoError ? (
              <video
                className="mt-3 h-[360px] w-full rounded-2xl border border-white/10 bg-black/45 object-cover"
                autoPlay
                muted
                loop
                playsInline
                controls
                onError={() => setHeroVideoError(true)}
                poster="/logo.png"
              >
                <source src="/media/popey-hero-demo.mp4" type="video/mp4" />
              </video>
            ) : (
              <div className="mt-3 space-y-2 rounded-2xl border border-white/10 bg-black/35 p-3 font-mono text-[11px]">
                <p className="animate-pulse text-cyan-100">Scan en cours...</p>
                <p className="rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-2 py-1 text-emerald-100">✔ 542 contacts detectes</p>
                <p className="rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-2 py-1 text-emerald-100">✔ 138 dans ta ville</p>
                <p className="rounded-xl border border-amber-300/25 bg-amber-300/10 px-2 py-1 text-amber-100">✔ 17 contacts utiles identifies</p>
                <div className="rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-2 py-2">
                  <p className="font-black text-cyan-100">Nicolas B.</p>
                  <p className="text-white/80">Peut t envoyer des clients immo</p>
                  <p className="mt-1 inline-flex rounded-full border border-cyan-200/40 bg-cyan-200/15 px-2 py-0.5 text-[10px] font-black">[Activer]</p>
                  <p className="mt-1 text-white/85">Message pret a envoyer</p>
                </div>
                <div className="rounded-xl border border-fuchsia-300/25 bg-fuchsia-300/10 px-2 py-2">
                  <p className="text-fuchsia-100">[2h plus tard] 🔔 Nicolas t a envoye un contact</p>
                  <p className="text-white/85">→ RDV pris</p>
                  <p className="text-white/85">→ Commission en cours</p>
                </div>
              </div>
            )}
            <p className="mt-2 text-[10px] text-white/65">
              Video source: <span className="font-black text-cyan-100">/public/media/popey-hero-demo.mp4</span>
            </p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-3xl border border-rose-300/25 bg-rose-300/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-rose-100">Avant</p>
            <p className="mt-2 text-sm text-white/90">500 contacts. 0 opportunite.</p>
          </article>
          <article className="rounded-3xl border border-emerald-300/25 bg-emerald-300/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-100">Apres Popey</p>
            <p className="mt-2 text-sm text-white/90">
              500 contacts → {activatedContacts} actives → {activeConnectors} reguliers → {monthlyOpportunities} opportunites / mois
            </p>
            <input
              type="range"
              min={10}
              max={50}
              value={activatedContacts}
              onChange={(event) => setActivatedContacts(Number(event.target.value))}
              className="mt-3 w-full accent-emerald-300"
            />
          </article>
        </section>

        <section className="rounded-3xl border border-white/15 bg-white/5 p-6">
          <h2 className="text-2xl font-black sm:text-4xl">Ton reseau devient une equipe commerciale.</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/88 sm:text-base">
            <li>1. On identifie les bonnes personnes (service + apporteur d affaire).</li>
            <li>2. On te dit quoi leur envoyer.</li>
            <li>3. Tu recois des opportunites.</li>
          </ul>
          <p className="mt-4 text-lg font-black text-cyan-100">Tu ne prospectes plus. Tu actives.</p>
        </section>

        <section>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Comment ca marche</p>
          <div className="mt-3 grid gap-4 lg:grid-cols-4 sm:grid-cols-2">
            {flowCards.map((step) => (
              <article
                key={step.title}
                className={`rounded-2xl border border-white/15 bg-gradient-to-br ${step.tone} p-4 transition hover:-translate-y-1 hover:shadow-[0_14px_34px_-20px_rgba(34,211,238,0.7)]`}
              >
                <p className="text-xl">{step.icon}</p>
                <h3 className="mt-1 text-lg font-black">{step.title}</h3>
                <p className="mt-1 text-sm text-white/90">{step.line}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-fuchsia-300/30 bg-fuchsia-300/10 p-6">
          <h2 className="text-2xl font-black sm:text-4xl">Pourquoi quelqu un t enverrait un client ?</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-3">
              <div className="rounded-2xl border border-amber-300/35 bg-amber-300/10 p-4">
                <p className="text-sm font-black text-amber-100">💸 1. Ils gagnent de l argent</p>
                <p className="mt-1 text-sm text-white/90">Ils touchent une commission a chaque opportunite. Exemple: tu me recommandes, tu touches 10%.</p>
              </div>
              <div className="rounded-2xl border border-cyan-300/35 bg-cyan-300/10 p-4">
                <p className="text-sm font-black text-cyan-100">🤝 2. C est simple (aucun effort)</p>
                <p className="mt-1 text-sm text-white/90">Pas de prospection, pas de vente, pas de suivi. Juste: j ai pense a toi.</p>
              </div>
              <div className="rounded-2xl border border-emerald-300/35 bg-emerald-300/10 p-4">
                <p className="text-sm font-black text-emerald-100">📲 3. Tout est automatise</p>
                <p className="mt-1 text-sm text-white/90">Suivi en temps reel, statut clair, commission versee automatiquement. Ils n ont rien a reclamer.</p>
              </div>
              <p className="text-lg font-black text-fuchsia-100">Ils ne t aident pas. Ils y gagnent.</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-black/25 p-4 shadow-[0_20px_50px_-30px_rgba(34,211,238,0.8)]">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-cyan-100">Ecran eclaireur (mockup)</p>
              <div className="mt-3 space-y-2 rounded-xl border border-white/15 bg-[#09152F] p-3 text-sm">
                <p className="font-black text-white">Opportunite envoyee: Nicolas</p>
                <p className="text-cyan-100">Statut: RDV pris</p>
                <p className="text-cyan-100">Statut: Offre envoyee</p>
                <p className="text-emerald-100">Statut: Deal signe</p>
                <p className="rounded-lg border border-amber-300/35 bg-amber-300/10 px-2 py-1 font-black text-amber-100">
                  💰 Commission: +800 EUR en attente
                </p>
              </div>
            </div>
          </div>
          <div className="mt-5 rounded-2xl border border-white/15 bg-black/25 p-4">
            <p className="text-lg font-black text-white">De leur cote, ca prend 10 secondes.</p>
            <p className="mt-2 text-sm text-white/90">Ils pensent a quelqu un → ils ouvrent Popey → ils envoient le contact. Termine.</p>
          </div>
          <div className="mt-3 rounded-2xl border border-rose-300/35 bg-rose-300/10 p-4">
            <p className="text-sm font-black text-rose-100">Ils n ont rien a gerer.</p>
            <p className="mt-1 text-sm text-white/90">Pas de relance, pas de negociation, pas de gestion client. Tout est gere cote pro.</p>
          </div>
        </section>

        <section className="rounded-3xl border border-amber-300/30 bg-amber-300/10 p-6">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-amber-100">Preuves visuelles</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/15 bg-black/25 p-4 shadow-[0_18px_40px_-24px_rgba(34,211,238,0.9)]">
              <p className="text-[11px] font-black text-cyan-100">📱 Nicolas t a envoye un contact qu il te recommande</p>
              <p className="mt-2 text-xs text-white/75">Notification directe dans l app</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-black/25 p-4 shadow-[0_18px_40px_-24px_rgba(16,185,129,0.9)]">
              <p className="text-[11px] font-black text-emerald-100">📱 RDV pris / Deal en cours</p>
              <p className="mt-2 text-xs text-white/75">Pipeline visible en temps reel</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-black/25 p-4 shadow-[0_18px_40px_-24px_rgba(251,191,36,0.9)]">
              <p className="text-[11px] font-black text-amber-100">📱 +800 EUR commission validee a Nicolas</p>
              <p className="mt-2 text-xs text-white/75">Gain trace et partage clair</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-emerald-300/25 bg-emerald-300/10 p-6">
          <h2 className="text-2xl font-black sm:text-4xl">Concretement, ca peut donner ca :</h2>
          <p className="mt-3 text-sm text-white/90">
            Tu actives <span className="font-black">{activatedContacts} contacts</span> → {activeConnectors} deviennent actifs → 1 opportunite / semaine
            = {monthlyOpportunities} / mois, sans prospection.
          </p>
          <p className="mt-2 text-sm text-white/90">
            Si 1 client = 800 EUR → <span className="font-black text-emerald-100">{monthlyRevenue.toLocaleString("fr-FR")} EUR / mois</span>.
          </p>
        </section>

        <section className="rounded-3xl border border-cyan-300/25 bg-cyan-300/10 p-6">
          <h2 className="text-2xl font-black sm:text-4xl">Quel est ton metier ?</h2>
          <p className="mt-2 text-sm text-white/88">On te montre qui activer en priorite.</p>
          <input
            value={metier}
            onChange={(event) => setMetier(event.target.value)}
            placeholder="Ex: agent immo, coach, freelance..."
            className="mt-3 h-11 w-full rounded-xl border border-white/15 bg-black/25 px-3 text-sm"
          />
          <p className="mt-3 text-sm text-cyan-100">On te connecterait avec :</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {targets.length > 0 ? (
              targets.map((target) => (
                <div key={target} className="rounded-xl border border-cyan-300/30 bg-cyan-300/15 px-3 py-2 text-sm font-black text-cyan-100">
                  {target}
                </div>
              ))
            ) : (
              <p className="text-sm text-white/75">Ecris ton metier pour voir les partenaires utiles.</p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-white/15 bg-white/5 p-6">
          <h2 className="text-2xl font-black sm:text-4xl">Pas de spam. Pas de forcing.</h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-white/90 sm:text-base">
            <li>Tu choisis qui tu contactes.</li>
            <li>Aucun message sans validation.</li>
            <li>Tu peux arreter a tout moment.</li>
            <li>Tu gardes le controle total.</li>
          </ul>
        </section>

        <section className="rounded-3xl border border-fuchsia-300/25 bg-fuchsia-300/10 p-6">
          <h2 className="text-2xl font-black sm:text-4xl">Et si toi aussi tu renvoyais des opportunites ?</h2>
          <p className="mt-3 text-sm leading-7 text-white/90 sm:text-base">
            Quand quelqu un t envoie un client, tu comprends vite qu il y a des opportunites partout.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-white/88">
            <li>Recommander des contacts</li>
            <li>Creer des opportunites</li>
            <li>Etre recompense</li>
          </ul>
          <p className="mt-4 text-lg font-black text-fuchsia-100">Tu passes de receveur a connecteur.</p>
        </section>

        <section className="rounded-3xl border border-emerald-300/30 bg-emerald-300/15 p-6 text-center sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-100">CTA final</p>
          <h2 className="mt-2 text-3xl font-black sm:text-5xl">Tes prochains clients sont deja dans ton telephone.</h2>
          <a
            href="/popey-human/smart-scan"
            className="mx-auto mt-6 inline-flex h-12 items-center justify-center rounded-xl border border-emerald-300/40 bg-emerald-300/25 px-7 text-sm font-black uppercase tracking-[0.08em] text-emerald-50 transition hover:bg-emerald-300/35"
          >
            Voir mes opportunites cachees
          </a>
          <p className="mt-3 text-xs text-emerald-100/90">Ca prend 30 secondes. Aucun engagement.</p>
        </section>
      </div>
    </main>
  );
}
