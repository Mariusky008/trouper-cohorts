"use client";

import { useMemo, useState } from "react";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  weight: ["400", "600", "700", "900"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

const roleCases = [
  {
    id: "chasseur-luxe",
    role: "Chasseur Immobilier de Luxe",
    pair: "Architecte d'Intérieur",
    offer: "Audit Acquisition + Projection Travaux",
    result30: "2 audits vendus en 30 jours",
    result90: "6 opportunités qualifiées en 90 jours",
    averageDeal: 22000,
  },
  {
    id: "cgp",
    role: "Conseiller en Gestion de Patrimoine (CGP)",
    pair: "Avocat Fiscaliste",
    offer: "Pack Structuration Patrimoniale",
    result30: "3 rendez-vous patrimoniaux signés",
    result90: "2 nouveaux mandats haut de gamme",
    averageDeal: 30000,
  },
  {
    id: "architecte",
    role: "Architecte d'Intérieur",
    pair: "Cuisiniste Haut de Gamme",
    offer: "Concept Global Cuisine + Espace",
    result30: "1 premier projet bundle signé",
    result90: "4 chantiers en pipeline",
    averageDeal: 28000,
  },
  {
    id: "conciergerie",
    role: "Conciergerie Privée",
    pair: "Chef à Domicile",
    offer: "Forfait Intendance + Expérience Lifestyle",
    result30: "5 demandes récurrentes activées",
    result90: "3 clients premium annualisés",
    averageDeal: 16000,
  },
];

const faqItems = [
  {
    q: "Est-ce fait pour mon métier ?",
    a: "Oui si votre métier vend déjà une valeur claire et peut se connecter à un métier complémentaire.",
  },
  {
    q: "En combien de temps j'observe des signaux ?",
    a: "Le plan est conçu pour sortir des signaux business en 30 jours puis des résultats consolidés à 90 jours.",
  },
  {
    q: "Pourquoi un audit avant d'entrer ?",
    a: "L'audit sert à vérifier la compatibilité de votre offre, votre discipline d'exécution et la qualité du binôme.",
  },
  {
    q: "Qu'est-ce qui change après le Mois 1 ?",
    a: "Vous passez d'un binôme testé à un cercle complet de métiers complémentaires avec flux récurrent.",
  },
];

export default function PopeyBusinessTestPage() {
  const [selectedRoleId, setSelectedRoleId] = useState(roleCases[0].id);
  const selectedCase = useMemo(
    () => roleCases.find((item) => item.id === selectedRoleId) ?? roleCases[0],
    [selectedRoleId],
  );
  const commission = Math.round(selectedCase.averageDeal * 0.1);
  const targetGain = 6000;
  const referralsNeeded = Math.max(1, Math.ceil(targetGain / commission));

  return (
    <main className={`${poppins.variable} font-poppins bg-[#0B0B0D] text-[#F5F0E6] min-h-screen pb-24`}>
      <div className="hidden md:flex fixed top-4 right-4 z-50">
        <a href="#apply" className="rounded-full bg-[#C8A96B] text-[#0B0B0D] px-5 py-3 text-sm font-black uppercase tracking-wide border border-[#F5F0E6]/20">
          Postuler à l&apos;Audit
        </a>
      </div>

      <section className="border-b border-[#C8A96B]/30">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <p className="text-xs uppercase tracking-[0.2em] text-[#C8A96B] font-black">Popey Academy — Patrimoine / Business</p>
          <h1 className="mt-4 text-4xl md:text-6xl font-black leading-tight">
            Transformez 1 partenariat complémentaire
            <br />
            en revenus récurrents.
          </h1>
          <p className="mt-5 text-lg md:text-2xl text-[#F5F0E6]/85 font-semibold max-w-4xl">
            En 30 jours, vous construisez une offre duo, activez vos réseaux et obtenez vos premiers signaux business avec un partenaire sélectionné.
          </p>
          <div className="mt-8 grid md:grid-cols-3 gap-3">
            {[
              "1 binôme complémentaire sélectionné",
              "1 offre duo monétisable en 30 jours",
              "1 plan d'activation avec suivi concret",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-[#C8A96B]/40 bg-[#131316] p-4">
                <p className="text-sm font-bold">{item}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#apply" className="rounded-xl bg-[#C8A96B] text-[#0B0B0D] px-6 py-3 font-black uppercase tracking-wide">
              Postuler à l&apos;Audit de Synergie
            </a>
            <a href="#example" className="rounded-xl border border-[#C8A96B]/70 px-6 py-3 font-black uppercase tracking-wide">
              Voir un exemple réel
            </a>
          </div>
        </div>
      </section>

      <section className="border-b border-[#C8A96B]/30">
        <div className="max-w-6xl mx-auto px-4 py-14 grid lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-[#C8A96B]/40 bg-[#131316] p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[#C8A96B] font-black">Pour qui c&apos;est</p>
            <ul className="mt-4 space-y-2 text-sm font-semibold">
              <li>• Vous avez déjà une expertise vendable.</li>
              <li>• Vous pouvez activer un réseau existant.</li>
              <li>• Vous vendez des offres à forte valeur.</li>
              <li>• Vous voulez un système, pas des leads aléatoires.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-[#C8A96B]/40 bg-[#131316] p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[#C8A96B] font-black">Pour qui ce n&apos;est pas</p>
            <ul className="mt-4 space-y-2 text-sm font-semibold">
              <li>• Vous cherchez une solution magique sans exécution.</li>
              <li>• Vous n&apos;avez pas d&apos;offre claire à proposer.</li>
              <li>• Vous ne voulez ni contacter ni relancer.</li>
              <li>• Vous voulez observer sans passer à l&apos;action.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="border-b border-[#C8A96B]/30">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <p className="text-xs uppercase tracking-[0.2em] text-[#C8A96B] font-black">Preuves rapides</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-black">Des cas concrets, lisibles en 15 secondes.</h2>
          <div className="mt-7 grid md:grid-cols-3 gap-4">
            {[
              { duo: "Architecte + CGP", m30: "2 audits vendus en 12 jours", m90: "1 client premium signé" },
              { duo: "Consultant RH + Avocat", m30: "4 RDV qualifiés", m90: "2 missions long terme" },
              { duo: "Agence Meta + Photographe immo", m30: "3 offres packagées", m90: "pipeline 5 comptes actifs" },
            ].map((item) => (
              <div key={item.duo} className="rounded-2xl border border-[#C8A96B]/40 bg-[#131316] p-5">
                <p className="text-sm uppercase tracking-widest text-[#C8A96B] font-black">Cas type</p>
                <p className="mt-2 text-xl font-black">{item.duo}</p>
                <p className="mt-3 text-sm font-semibold">30 jours : {item.m30}</p>
                <p className="mt-1 text-sm font-semibold">90 jours : {item.m90}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[#C8A96B]/30">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <p className="text-xs uppercase tracking-[0.2em] text-[#C8A96B] font-black">Comment ça marche</p>
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            {[
              { step: "01", title: "Association ciblée", text: "On vous associe au métier complémentaire qui peut ouvrir du business réel." },
              { step: "02", title: "Offre duo", text: "Vous créez une offre vendable et claire avec un bénéfice client immédiat." },
              { step: "03", title: "Activation et suivi", text: "Vous lancez l'activation réseau et suivez les signaux business de manière traçable." },
            ].map((item) => (
              <div key={item.step} className="rounded-2xl border border-[#C8A96B]/40 bg-[#131316] p-5">
                <p className="text-[#C8A96B] font-black">{item.step}</p>
                <p className="mt-2 text-2xl font-black">{item.title}</p>
                <p className="mt-2 text-sm font-semibold text-[#F5F0E6]/85">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="example" className="border-b border-[#C8A96B]/30">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <p className="text-xs uppercase tracking-[0.2em] text-[#C8A96B] font-black">Exemple interactif</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-black">Voyez votre logique métier en un clic.</h2>
          <div className="mt-6 rounded-2xl border border-[#C8A96B]/40 bg-[#131316] p-6">
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="w-full rounded-xl bg-[#0B0B0D] border border-[#C8A96B]/60 px-4 py-3 font-bold"
            >
              {roleCases.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.role}
                </option>
              ))}
            </select>
            <div className="mt-5 grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[#C8A96B]/40 bg-[#0B0B0D] p-4">
                <p className="text-sm uppercase tracking-widest text-[#C8A96B] font-black">Binôme proposé</p>
                <p className="mt-2 text-xl font-black">{selectedCase.role} + {selectedCase.pair}</p>
                <p className="mt-2 text-sm font-semibold">Offre duo : {selectedCase.offer}</p>
              </div>
              <div className="rounded-xl border border-[#C8A96B]/40 bg-[#0B0B0D] p-4">
                <p className="text-sm uppercase tracking-widest text-[#C8A96B] font-black">Projection</p>
                <p className="mt-2 text-sm font-semibold">30 jours : {selectedCase.result30}</p>
                <p className="mt-1 text-sm font-semibold">90 jours : {selectedCase.result90}</p>
                <p className="mt-1 text-sm font-semibold">Commission moyenne (10%) : {commission.toLocaleString("fr-FR")}€</p>
                <p className="mt-1 text-sm font-semibold">Pour viser +{targetGain.toLocaleString("fr-FR")}€/mois : {referralsNeeded} recommandations qualifiées.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#C8A96B]/30">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <p className="text-xs uppercase tracking-[0.2em] text-[#C8A96B] font-black">Après votre candidature</p>
          <div className="mt-6 grid md:grid-cols-5 gap-3">
            {[
              "Formulaire 3 min",
              "Réponse sous 24/48h",
              "Audit si profil validé",
              "Proposition binôme + plan Mois 1",
              "Lancement sous 7 jours",
            ].map((item, index) => (
              <div key={item} className="rounded-xl border border-[#C8A96B]/40 bg-[#131316] p-4">
                <p className="text-[#C8A96B] text-xs font-black">Étape {index + 1}</p>
                <p className="mt-2 text-sm font-bold">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[#C8A96B]/30">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <p className="text-xs uppercase tracking-[0.2em] text-[#C8A96B] font-black">FAQ</p>
          <div className="mt-5 space-y-3">
            {faqItems.map((item) => (
              <details key={item.q} className="rounded-xl border border-[#C8A96B]/40 bg-[#131316] px-5 py-4">
                <summary className="cursor-pointer font-black">{item.q}</summary>
                <p className="mt-2 text-sm font-semibold text-[#F5F0E6]/85">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="apply" className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="rounded-3xl border border-[#C8A96B]/50 bg-[#131316] p-8 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-[#C8A96B] font-black">Candidature</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-black">Prêt à transformer votre réseau en revenus ?</h2>
            <p className="mt-4 text-sm md:text-base font-semibold text-[#F5F0E6]/85">
              Candidature courte, sélection stricte, plan clair. Si votre profil est compatible, vous repartez avec un binôme et un plan d&apos;action.
            </p>
            <a href="/contact" className="mt-6 inline-flex rounded-xl bg-[#C8A96B] text-[#0B0B0D] px-6 py-3 font-black uppercase tracking-wide">
              Voir si mon profil est compatible
            </a>
          </div>
        </div>
      </section>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[#C8A96B]/40 bg-[#0B0B0D]/95 backdrop-blur">
        <a href="#apply" className="block text-center py-3 font-black uppercase tracking-wide text-[#0B0B0D] bg-[#C8A96B]">
          Postuler à l&apos;Audit
        </a>
      </div>
    </main>
  );
}
