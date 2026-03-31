"use client";

import { useMemo, useState } from "react";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  weight: ["400", "600", "700", "900"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

const caseTypes = [
  {
    id: "chasseur",
    primary: "Chasseur Immobilier de Luxe",
    partner: "CGP / Gestionnaire de Patrimoine",
    offer: "Accompagnement acquisition + optimisation patrimoniale",
    month1: "Premiers RDV + premières recommandations + premiers closings",
    month2: ["Architecte d’intérieur", "Conciergerie premium", "Courtier", "Avocat fiscaliste"],
    month3: "Point central de confiance dans une sphère premium",
  },
  {
    id: "architecte",
    primary: "Architecte d’Intérieur",
    partner: "Cuisiniste Haut de Gamme",
    offer: "Pack conception globale + cuisine sur mesure",
    month1: "1 offre duo claire + premiers rendez-vous conjoints",
    month2: ["Maître d’œuvre", "Concepteur lumière", "Art advisor", "Conciergerie privée"],
    month3: "Moteur de recommandations croisées sur projets premium",
  },
  {
    id: "avocat",
    primary: "Avocat Fiscaliste",
    partner: "Conseiller en Gestion de Patrimoine",
    offer: "Structuration fiscale + stratégie d’allocation",
    month1: "Offre premium conjointe et premiers dossiers qualifiés",
    month2: ["Chasseur immo de luxe", "Courtier private", "Notaire", "Assureur objets de valeur"],
    month3: "Écosystème d’apports d’affaires récurrents",
  },
];

const faqItems = [
  {
    q: "Est-ce que Popey est juste un réseau ?",
    a: "Non. Popey structure une synergie business: partenaire ciblé, offre duo, activation, puis sphère progressive.",
  },
  {
    q: "Pourquoi commencer avec un seul partenaire ?",
    a: "Parce qu’un binôme clair convertit mieux qu’un grand réseau flou. On valide d’abord une synergie concrète.",
  },
  {
    q: "Que se passe-t-il après le Mois 1 ?",
    a: "Si la synergie est viable, vous débloquez progressivement la sphère avec plus d’opportunités et des commissions possibles.",
  },
  {
    q: "Faut-il déjà une grosse audience ?",
    a: "Non. Il faut surtout une offre claire, une vraie valeur métier et une volonté d’activer ses relations.",
  },
  {
    q: "Est-ce pour tous les métiers ?",
    a: "Surtout pour les métiers qui peuvent créer des synergies réelles: conseil, services premium, immobilier, patrimoine, juridique, marketing, business local.",
  },
];

export default function PopeyBusinessV3Page() {
  const [selectedCaseId, setSelectedCaseId] = useState(caseTypes[0].id);
  const selectedCase = useMemo(
    () => caseTypes.find((item) => item.id === selectedCaseId) ?? caseTypes[0],
    [selectedCaseId],
  );

  return (
    <main className={`${poppins.variable} font-poppins bg-[#0A0A0C] text-[#F7F2E8] min-h-screen pb-24`}>
      <div className="hidden md:flex fixed top-4 right-4 z-50">
        <a href="#apply" className="rounded-full bg-[#C7A469] text-[#0A0A0C] px-5 py-3 text-sm font-black uppercase tracking-wide">
          Postuler à l&apos;Audit
        </a>
      </div>

      <section className="border-b border-[#C7A469]/35">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <p className="text-xs uppercase tracking-[0.22em] font-black text-[#C7A469]">Le Système Popey : 1 Binôme → 1 Sphère → 1 Moteur de Croissance</p>
          <h1 className="mt-4 text-4xl md:text-6xl font-black leading-tight">
            Popey vous associe au bon partenaire…
            <br />
            puis vous ouvre un cercle de 20 métiers.
          </h1>
          <p className="mt-5 text-lg md:text-2xl font-semibold text-[#F7F2E8]/85 max-w-5xl">
            En 30 jours, vous lancez une première synergie rentable avec 1 partenaire complémentaire. Puis vous accédez progressivement à une sphère de 19 autres partenaires pour générer recommandations, offres croisées, introductions stratégiques et commissions récurrentes.
          </p>
          <div className="mt-8 grid md:grid-cols-3 gap-3">
            {[
              "Mois 1 : 1 binôme ciblé + 1 offre duo + 1 plan d’activation",
              "Mois 2 : ouverture progressive à la sphère + premières commissions",
              "Mois 3 : recommandations croisées + effet réseau structuré",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-[#C7A469]/40 bg-[#121216] p-4">
                <p className="text-sm font-bold">{item}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#apply" className="rounded-xl bg-[#C7A469] text-[#0A0A0C] px-6 py-3 font-black uppercase tracking-wide">
              Postuler à l&apos;Audit de Synergie
            </a>
            <a href="#example" className="rounded-xl border border-[#C7A469]/70 px-6 py-3 font-black uppercase tracking-wide">
              Voir un exemple concret
            </a>
          </div>
        </div>
      </section>

      <section className="border-b border-[#C7A469]/35">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <h2 className="text-3xl md:text-5xl font-black">Concrètement, Popey c’est quoi ?</h2>
          <p className="mt-4 text-lg font-semibold text-[#F7F2E8]/85">Popey n’est pas un simple réseau. C’est un système de croissance par synergies business.</p>
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            {[
              {
                title: "1) Association ciblée",
                text: "Nous vous associons à un métier complémentaire capable d’ouvrir des portes, d’enrichir votre offre et de créer des opportunités.",
              },
              {
                title: "2) Offre commune rentable",
                text: "Nous structurons une offre duo claire, vendable et compréhensible, alignée sur un besoin premium.",
              },
              {
                title: "3) Ouverture de sphère",
                text: "Une fois la synergie validée, vous accédez progressivement à 19 autres partenaires pour recommandations, apports et commissions traçables.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-[#C7A469]/40 bg-[#121216] p-5">
                <p className="text-[#C7A469] text-xs uppercase tracking-[0.2em] font-black">{item.title}</p>
                <p className="mt-2 text-sm font-semibold text-[#F7F2E8]/85">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[#C7A469]/35">
        <div className="max-w-6xl mx-auto px-4 py-14 grid lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-[#C7A469]/40 bg-[#121216] p-6">
            <p className="text-[#C7A469] text-xs uppercase tracking-[0.2em] font-black">Popey est fait pour vous si</p>
            <ul className="mt-4 space-y-2 text-sm font-semibold">
              <li>• Vous avez une expertise vendable.</li>
              <li>• Vous proposez déjà un service clair.</li>
              <li>• Vous voulez arrêter la prospection solitaire.</li>
              <li>• Vous êtes prêt à activer vos relations sérieusement.</li>
              <li>• Vous voulez des synergies rentables, pas juste discuter.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-[#C7A469]/40 bg-[#121216] p-6">
            <p className="text-[#C7A469] text-xs uppercase tracking-[0.2em] font-black">Ce n’est pas pour vous si</p>
            <ul className="mt-4 space-y-2 text-sm font-semibold">
              <li>• Vous cherchez des leads magiques sans effort.</li>
              <li>• Vous n’avez aucune offre à proposer.</li>
              <li>• Vous refusez de contacter, relancer ou collaborer.</li>
              <li>• Vous voulez observer sans participer.</li>
              <li>• Vous cherchez un networking passif type groupe WhatsApp.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="border-b border-[#C7A469]/35">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <h2 className="text-3xl md:text-5xl font-black">Le système Popey en 3 mois</h2>
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            {[
              {
                month: "Mois 1 — Le test de synergie",
                points: [
                  "Audit de compatibilité + partenaire ciblé",
                  "Offre duo monétisable + scripts d’activation",
                  "Premiers RDV, recommandations et signaux de conversion",
                ],
              },
              {
                month: "Mois 2 — Ouverture de la sphère",
                points: [
                  "Accès progressif à d’autres métiers compatibles",
                  "Nouvelles synergies et premières commissions",
                  "Multiplication des points d’entrée commerciaux",
                ],
              },
              {
                month: "Mois 3 — Le cercle de croissance",
                points: [
                  "Activation de plusieurs relais business",
                  "Recommandations plus régulières + effet cumulatif",
                  "Pipeline plus stable et positionnement plus premium",
                ],
              },
            ].map((item) => (
              <div key={item.month} className="rounded-2xl border border-[#C7A469]/40 bg-[#121216] p-5">
                <p className="text-sm uppercase tracking-widest text-[#C7A469] font-black">{item.month}</p>
                <ul className="mt-3 space-y-2 text-sm font-semibold text-[#F7F2E8]/85">
                  {item.points.map((point) => (
                    <li key={point}>• {point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-[#C7A469]/40 bg-[#121216] p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[#C7A469] font-black">Timeline visuelle</p>
            <div className="mt-4 grid md:grid-cols-3 gap-3">
              {[
                { d: "30 jours", txt: "Validation du binôme et de l’offre duo" },
                { d: "60 jours", txt: "Ouverture progressive à la sphère" },
                { d: "90 jours", txt: "Moteur de recommandations plus durable" },
              ].map((item) => (
                <div key={item.d} className="rounded-xl border border-[#C7A469]/30 bg-[#0A0A0C] p-4">
                  <p className="text-[#C7A469] font-black">{item.d}</p>
                  <p className="mt-1 text-sm font-semibold">{item.txt}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#C7A469]/35">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <h2 className="text-3xl md:text-5xl font-black">Visualisation de la sphère</h2>
          <p className="mt-3 text-sm font-semibold text-[#F7F2E8]/85">Centre = vous • 1er cercle = binôme • 2e cercle = 19 partenaires complémentaires</p>
          <div className="mt-6 rounded-2xl border border-[#C7A469]/40 bg-[#121216] p-4">
            <div className="relative aspect-square md:aspect-[16/9] rounded-xl border border-[#C7A469]/30 bg-[#0A0A0C] overflow-hidden">
              <div className="absolute inset-[18%] rounded-full border border-[#C7A469]/30" />
              <div className="absolute inset-[8%] rounded-full border border-dashed border-[#C7A469]/20" />
              <div className="absolute left-1/2 top-1/2 h-20 w-20 md:h-28 md:w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#C7A469] text-[#0A0A0C] flex items-center justify-center text-center px-2 font-black text-sm md:text-base">
                Vous
              </div>
              <div className="absolute left-1/2 top-[28%] h-16 w-16 md:h-20 md:w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F7F2E8] text-[#0A0A0C] flex items-center justify-center text-center px-2 font-black text-xs">
                Binôme
              </div>
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: "45s" }}>
                {Array.from({ length: 19 }).map((_, i) => {
                  const angle = (i / 19) * Math.PI * 2;
                  const x = 50 + Math.cos(angle) * 39;
                  const y = 50 + Math.sin(angle) * 39;
                  return (
                    <div key={i} className="absolute h-3.5 w-3.5 rounded-full bg-[#C7A469] -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }} />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="example" className="border-b border-[#C7A469]/35">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <h2 className="text-3xl md:text-5xl font-black">Exemple de synergie possible</h2>
          <p className="mt-3 text-sm font-semibold text-[#F7F2E8]/85">Cas-type de sphère (simulation pédagogique, pas preuve client nominative).</p>
          <div className="mt-6 rounded-2xl border border-[#C7A469]/40 bg-[#121216] p-6">
            <select value={selectedCaseId} onChange={(e) => setSelectedCaseId(e.target.value)} className="w-full rounded-xl bg-[#0A0A0C] border border-[#C7A469]/60 px-4 py-3 font-bold">
              {caseTypes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.primary}
                </option>
              ))}
            </select>
            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[#C7A469]/40 bg-[#0A0A0C] p-4">
                <p className="text-xs uppercase tracking-widest text-[#C7A469] font-black">Mois 1</p>
                <p className="mt-1 text-sm font-semibold">Partenaire initial : {selectedCase.partner}</p>
                <p className="mt-1 text-sm font-semibold">Offre duo : {selectedCase.offer}</p>
                <p className="mt-1 text-sm font-semibold">{selectedCase.month1}</p>
              </div>
              <div className="rounded-xl border border-[#C7A469]/40 bg-[#0A0A0C] p-4">
                <p className="text-xs uppercase tracking-widest text-[#C7A469] font-black">Mois 2 & 3</p>
                <p className="mt-1 text-sm font-semibold">Ouverture progressive :</p>
                <p className="text-sm font-semibold text-[#F7F2E8]/85">{selectedCase.month2.join(" • ")}</p>
                <p className="mt-2 text-sm font-semibold">{selectedCase.month3}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#C7A469]/35">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <h2 className="text-3xl md:text-5xl font-black">Ce que vous obtenez exactement</h2>
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            {[
              {
                title: "Phase 1 — Audit & lancement",
                items: ["Audit d’activité", "Sélection du premier partenaire", "Construction offre duo", "Scripts d’activation", "Plan de lancement"],
              },
              {
                title: "Phase 2 — Extension de sphère",
                items: ["Ouverture à de nouveaux métiers", "Synergies sélectionnées", "Apports croisés", "Premières commissions possibles"],
              },
              {
                title: "Phase 3 — Cercle de croissance",
                items: ["Recommandations plus régulières", "Visibilité mutuelle renforcée", "Partenariats plus variés", "Système plus résilient"],
              },
            ].map((phase) => (
              <div key={phase.title} className="rounded-2xl border border-[#C7A469]/40 bg-[#121216] p-5">
                <p className="text-sm uppercase tracking-widest text-[#C7A469] font-black">{phase.title}</p>
                <ul className="mt-3 space-y-1 text-sm font-semibold text-[#F7F2E8]/85">
                  {phase.items.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[#C7A469]/35">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <h2 className="text-3xl md:text-5xl font-black">Pourquoi Popey fonctionne mieux qu’un networking classique</h2>
          <div className="mt-6 grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-[#C7A469]/30 bg-[#121216] p-5">
              <p className="text-sm uppercase tracking-widest text-[#C7A469] font-black">Networking classique</p>
              <ul className="mt-3 space-y-1 text-sm font-semibold text-[#F7F2E8]/85">
                <li>• Trop aléatoire</li>
                <li>• Trop superficiel</li>
                <li>• Peu traçable</li>
                <li>• Souvent chronophage</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-[#C7A469]/30 bg-[#121216] p-5">
              <p className="text-sm uppercase tracking-widest text-[#C7A469] font-black">Système Popey</p>
              <ul className="mt-3 space-y-1 text-sm font-semibold text-[#F7F2E8]/85">
                <li>• Partenaire choisi et complémentaire</li>
                <li>• Offre commune structurée</li>
                <li>• Activation guidée</li>
                <li>• Sphère progressive + commissions concrètes</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#C7A469]/35">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <h2 className="text-3xl md:text-5xl font-black">Résultats / preuves</h2>
          <div className="mt-6 grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-[#C7A469]/40 bg-[#121216] p-5">
              <p className="text-sm uppercase tracking-widest text-[#C7A469] font-black">Exemples de synergies possibles</p>
              <p className="mt-2 text-sm font-semibold text-[#F7F2E8]/85">Architecte + CGP • Consultant RH + Avocat • Agence Meta + Photographe immobilier</p>
            </div>
            <div className="rounded-2xl border border-[#C7A469]/40 bg-[#121216] p-5">
              <p className="text-sm uppercase tracking-widest text-[#C7A469] font-black">Résultats réels à intégrer</p>
              <p className="mt-2 text-sm font-semibold text-[#F7F2E8]/85">Ajoutez ici 3 cartes datées : duo métier, offre créée, résultat à 30 jours, résultat à 90 jours, témoignage court.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#C7A469]/35">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <h2 className="text-3xl md:text-5xl font-black">Ce qui se passe après votre candidature</h2>
          <div className="mt-6 grid md:grid-cols-5 gap-3">
            {[
              "Formulaire rapide (2-3 min)",
              "Analyse de compatibilité",
              "Accès Mois 1 si profil validé",
              "Ouverture sphère si la synergie prend",
              "Entrée dans une logique de croissance durable",
            ].map((item, idx) => (
              <div key={item} className="rounded-xl border border-[#C7A469]/40 bg-[#121216] p-4">
                <p className="text-[#C7A469] text-xs font-black">Étape {idx + 1}</p>
                <p className="mt-2 text-sm font-semibold">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[#C7A469]/35">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <h2 className="text-3xl md:text-5xl font-black">FAQ</h2>
          <div className="mt-5 space-y-3">
            {faqItems.map((item) => (
              <details key={item.q} className="rounded-xl border border-[#C7A469]/40 bg-[#121216] px-5 py-4">
                <summary className="cursor-pointer font-black">{item.q}</summary>
                <p className="mt-2 text-sm font-semibold text-[#F7F2E8]/85">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="apply" className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="rounded-3xl border border-[#C7A469]/50 bg-[#121216] p-8 text-center">
            <h2 className="text-3xl md:text-5xl font-black">
              Ne restez plus seul avec votre expertise.
              <br />
              Commencez par 1 synergie. Puis ouvrez votre sphère.
            </h2>
            <p className="mt-4 text-sm md:text-base font-semibold text-[#F7F2E8]/85">
              Mois 1 : 1 partenaire ciblé • Mois 2 : ouverture à la sphère • Mois 3 : recommandations croisées + commissions + effet réseau.
            </p>
            <a href="/contact" className="mt-6 inline-flex rounded-xl bg-[#C7A469] text-[#0A0A0C] px-6 py-3 font-black uppercase tracking-wide">
              Postuler à l&apos;Audit de Synergie
            </a>
            <p className="mt-3 text-xs font-bold text-[#F7F2E8]/75">Formulaire rapide • Réponse sous 24 à 48h • Profils sélectionnés uniquement</p>
          </div>
        </div>
      </section>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[#C7A469]/40 bg-[#0A0A0C]/95 backdrop-blur">
        <a href="#apply" className="block text-center py-3 font-black uppercase tracking-wide text-[#0A0A0C] bg-[#C7A469]">
          Postuler à l&apos;Audit
        </a>
      </div>
    </main>
  );
}
