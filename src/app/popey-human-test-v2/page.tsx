"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Titan_One, Pacifico, Poppins } from "next/font/google";
import { cn } from "@/lib/utils";

const titanOne = Titan_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-titan",
});

const pacifico = Pacifico({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pacifico",
});

const poppins = Poppins({
  weight: ["400", "600", "700", "900"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

const métierExamples = [
  {
    id: "chasseur",
    name: "Chasseur immo de luxe",
    mois1: ["Binôme : Architecte d’intérieur", "Offre : Visite + projection d’aménagement premium"],
    mois2: ["Ajout : CGP ou Courtier", "Le client devient aussi une opportunité de financement / optimisation patrimoniale"],
    mois3: ["Ouverture : Cuisiniste, Domotique, Conciergerie, Chef à domicile, Déménageur premium"],
  },
  {
    id: "architecte",
    name: "Architecte d’intérieur",
    mois1: ["Binôme : Chasseur immo de luxe", "Offre : Audit express + scénario d’aménagement"],
    mois2: ["Ajout : Cuisiniste haut de gamme", "Le projet augmente le panier moyen sur la rénovation"],
    mois3: ["Ouverture : Maître d’œuvre, Domotique, Lumière, Ébéniste, Conciergerie"],
  },
  {
    id: "cgp",
    name: "CGP",
    mois1: ["Binôme : Courtier private", "Offre : Financement + structure patrimoniale"],
    mois2: ["Ajout : Avocat fiscaliste", "Le client sécurise la partie fiscale et patrimoniale"],
    mois3: ["Ouverture : Assureur objets de valeur, Art advisor, Cave à vin, Conciergerie"],
  },
];

const ecosystemRoles = [
  "Chasseur Immobilier de Luxe",
  "Courtier en Prêt Immobilier Private Banking",
  "Conseiller en Gestion de Patrimoine (CGP)",
  "Avocat Fiscaliste",
  "Assureur Objets de Valeur",
  "Architecte d’Intérieur",
  "Maître d’Œuvre / Contractant Général",
  "Paysagiste Concepteur / Piscine de prestige",
  "Cuisiniste Haut de Gamme",
  "Expert en Domotique & Sécurité",
  "Ébéniste / Menuisier d’Art",
  "Galeriste / Art Advisor",
  "Spécialiste Hi-Fi & Home Cinéma",
  "Concepteur Lumière",
  "Antiquaire / Expert Mobilier Design",
  "Conciergerie Privée",
  "Chef à Domicile",
  "Déménageur Premium / Garde-meuble sécurisé",
  "Home Organizer",
  "Spécialiste Cave à Vin / Sommelier privé",
];

const faqItems = [
  { q: "En combien de temps je peux lancer une première synergie ?", a: "Objectif : une offre commune activée en 30 jours." },
  { q: "Dois-je changer de métier ou de cible client ?", a: "Non. Vous gardez votre métier et votre cible, on ajoute des partenaires complémentaires." },
  { q: "Comment sont gérées les commissions ?", a: "Avec des règles claires, traçables et validées entre partenaires." },
  { q: "Que se passe-t-il si un partenariat ne performe pas ?", a: "On ajuste rapidement le duo, l’offre et le script pour relancer la traction." },
  { q: "Tout le monde peut-il rejoindre Popey ?", a: "Non. L’entrée se fait sur dossier, selon la capacité à activer de vraies synergies." },
];

export default function PopeyHumanTestV2Page() {
  const [selectedMetierId, setSelectedMetierId] = useState(métierExamples[0].id);
  const [showFullEcosystem, setShowFullEcosystem] = useState(false);
  const selectedMetier = useMemo(
    () => métierExamples.find((item) => item.id === selectedMetierId) ?? métierExamples[0],
    [selectedMetierId],
  );

  return (
    <main className={cn("min-h-screen bg-[#E2D9BC] text-[#2E130C] overflow-hidden", titanOne.variable, pacifico.variable, poppins.variable, "font-poppins")}>
      <section className="relative py-20 md:py-24 border-b-4 border-[#2E130C]">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(#2E130C 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto text-center">
            <p className="inline-block text-xs uppercase tracking-widest font-black bg-[#D2E8FF] border-2 border-[#2E130C] rounded-full px-4 py-2">Landing V2 — Conversion</p>
            <h1 className="mt-8 text-4xl md:text-6xl lg:text-7xl font-titan leading-[1.05]">
              Gagnez plus avec les mêmes clients grâce à des partenaires business complémentaires.
            </h1>
            <p className="mt-6 text-base md:text-xl font-bold max-w-5xl mx-auto">
              Popey vous aide à identifier le bon partenaire, créer une offre commune en 30 jours, puis activer un système de recommandations et de commissions autour du même client.
            </p>
            <div className="mt-6 rounded-2xl border-2 border-[#2E130C] bg-white p-5 text-left max-w-5xl mx-auto shadow-[6px_6px_0px_0px_#2E130C]">
              <p className="text-sm md:text-base font-black">Exemple : vous êtes agent immobilier → nous pouvons vous associer à un architecte d’intérieur, un courtier, un CGP ou un cuisiniste pour créer :</p>
              <ul className="mt-3 space-y-1 text-sm md:text-base font-bold">
                <li>• des recommandations croisées</li>
                <li>• des offres communes</li>
                <li>• des commissions récurrentes</li>
              </ul>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/programme-commando/postuler" className="inline-flex items-center justify-center rounded-xl border-2 border-[#2E130C] bg-[#B20B13] px-8 py-4 text-[#E2D9BC] font-titan shadow-[4px_4px_0px_0px_#2E130C] hover:bg-[#7A0000]">
                Postuler à l&apos;Audit de Synergie
              </Link>
              <a href="#exemple-concret" className="inline-flex items-center justify-center rounded-xl border-2 border-[#2E130C] bg-[#D2E8FF] px-6 py-3 text-[#2E130C] font-black shadow-[4px_4px_0px_0px_#2E130C]">
                Voir un exemple concret
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white border-b-4 border-[#2E130C]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Comment ça marche en 10 secondes</p>
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              <div className="rounded-2xl border-2 border-[#2E130C] bg-[#D2E8FF] p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">1</p>
                <h3 className="mt-2 text-xl font-titan">On vous associe à un métier complémentaire</h3>
                <p className="mt-2 text-sm font-bold">Un professionnel qui vend déjà à vos mêmes clients.</p>
              </div>
              <div className="rounded-2xl border-2 border-[#2E130C] bg-[#E2D9BC] p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">2</p>
                <h3 className="mt-2 text-xl font-titan">On construit une offre commune simple à vendre</h3>
                <p className="mt-2 text-sm font-bold">Une offre claire, utile, facile à expliquer et rentable pour les deux.</p>
              </div>
              <div className="rounded-2xl border-2 border-[#2E130C] bg-[#F8D7DA] p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">3</p>
                <h3 className="mt-2 text-xl font-titan">On active recommandations + commissions</h3>
                <p className="mt-2 text-sm font-bold">Chaque client peut générer plusieurs opportunités business au lieu d&apos;une seule.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 border-b-4 border-[#2E130C]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Timeline d’exécution</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-titan">Mois 1 / Mois 2 / Mois 3</h2>
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              <div className="rounded-2xl border-2 border-[#2E130C] bg-[#D2E8FF] p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Mois 1</p>
                <p className="mt-2 text-sm font-bold">1 partenaire + 1 offre + 1 preuve de concept</p>
                <ul className="mt-3 space-y-1 text-sm font-bold">
                  <li>• choix du binôme idéal</li>
                  <li>• offre commune</li>
                  <li>• scripts / contenus / activation</li>
                  <li>• premiers rendez-vous / premières ventes</li>
                </ul>
              </div>
              <div className="rounded-2xl border-2 border-[#2E130C] bg-[#E2D9BC] p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Mois 2</p>
                <p className="mt-2 text-sm font-bold">2e partenaire + duplication + 2e source de revenus</p>
                <ul className="mt-3 space-y-1 text-sm font-bold">
                  <li>• ajout d’un second métier complémentaire</li>
                  <li>• duplication de la mécanique</li>
                  <li>• recommandations en chaîne</li>
                  <li>• commissions qui se structurent</li>
                </ul>
              </div>
              <div className="rounded-2xl border-2 border-[#2E130C] bg-[#F8D7DA] p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Mois 3</p>
                <p className="mt-2 text-sm font-bold">Accès à la sphère de 20 métiers complémentaires</p>
                <ul className="mt-3 space-y-1 text-sm font-bold">
                  <li>• 1 seul représentant par métier</li>
                  <li>• ouverture à 19 partenaires</li>
                  <li>• circulation des recommandations</li>
                  <li>• réseau qui devient une machine</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Link href="/programme-commando/postuler" className="inline-flex items-center justify-center rounded-xl border-2 border-[#2E130C] bg-[#B20B13] px-8 py-4 text-[#E2D9BC] font-titan shadow-[4px_4px_0px_0px_#2E130C] hover:bg-[#7A0000]">
                Postuler à l&apos;Audit de Synergie
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="exemple-concret" className="py-16 bg-[#D2E8FF] border-b-4 border-[#2E130C]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Exemple concret par métier</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {métierExamples.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedMetierId(item.id)}
                  className={cn(
                    "rounded-full border-2 border-[#2E130C] px-4 py-2 text-xs font-black uppercase tracking-wide",
                    selectedMetier.id === item.id ? "bg-[#B20B13] text-[#E2D9BC]" : "bg-white text-[#2E130C]",
                  )}
                >
                  {item.name}
                </button>
              ))}
            </div>
            <div className="mt-6 rounded-3xl border-4 border-[#2E130C] bg-white p-6 shadow-[8px_8px_0px_0px_#2E130C]">
              <h3 className="text-2xl md:text-3xl font-titan">{selectedMetier.name}</h3>
              <div className="mt-4 grid md:grid-cols-3 gap-3">
                <div className="rounded-xl border-2 border-[#2E130C] bg-[#D2E8FF] p-4">
                  <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Mois 1</p>
                  <ul className="mt-2 space-y-1 text-sm font-bold">{selectedMetier.mois1.map((line) => <li key={line}>• {line}</li>)}</ul>
                </div>
                <div className="rounded-xl border-2 border-[#2E130C] bg-[#E2D9BC] p-4">
                  <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Mois 2</p>
                  <ul className="mt-2 space-y-1 text-sm font-bold">{selectedMetier.mois2.map((line) => <li key={line}>• {line}</li>)}</ul>
                </div>
                <div className="rounded-xl border-2 border-[#2E130C] bg-[#F8D7DA] p-4">
                  <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Mois 3</p>
                  <ul className="mt-2 space-y-1 text-sm font-bold">{selectedMetier.mois3.map((line) => <li key={line}>• {line}</li>)}</ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 border-b-4 border-[#2E130C]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto bg-white rounded-3xl border-4 border-[#2E130C] p-6 md:p-8 shadow-[8px_8px_0px_0px_#2E130C]">
            <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Schéma simplifié</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-titan">1 client → 3 partenaires → 3 à 5 opportunités</h2>
            <div className="mt-6 grid md:grid-cols-3 gap-3">
              <div className="rounded-xl border-2 border-[#2E130C] bg-[#2E130C] text-[#E2D9BC] p-4 text-center">
                <p className="text-xs uppercase tracking-widest font-black text-[#D2E8FF]">Client</p>
                <p className="mt-2 font-titan text-2xl">1</p>
              </div>
              <div className="rounded-xl border-2 border-[#2E130C] bg-[#D2E8FF] p-4 text-center">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Partenaires activés</p>
                <p className="mt-2 font-titan text-2xl">3</p>
              </div>
              <div className="rounded-xl border-2 border-[#2E130C] bg-[#F8D7DA] p-4 text-center">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Opportunités business</p>
                <p className="mt-2 font-titan text-2xl">3 à 5</p>
              </div>
            </div>
            <div className="mt-5">
              <button
                type="button"
                onClick={() => setShowFullEcosystem((prev) => !prev)}
                className="rounded-xl border-2 border-[#2E130C] bg-[#E2D9BC] px-4 py-2 text-sm font-black shadow-[4px_4px_0px_0px_#2E130C]"
              >
                {showFullEcosystem ? "Masquer l’écosystème complet" : "Voir l’écosystème complet des 20 métiers"}
              </button>
              {showFullEcosystem && (
                <div className="mt-4 rounded-2xl border-2 border-[#2E130C] bg-[#D2E8FF] p-4 grid md:grid-cols-2 gap-2">
                  {ecosystemRoles.map((role) => (
                    <p key={role} className="text-sm font-bold">• {role}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#D2E8FF] border-b-4 border-[#2E130C]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border-2 border-[#2E130C] bg-white p-5 shadow-[6px_6px_0px_0px_#2E130C]">
              <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Preuve / crédibilité</p>
              <ul className="mt-3 space-y-2 text-sm font-bold">
                <li>• Cas 1 : Agent immobilier + Architecte → offre conjointe en 30 jours.</li>
                <li>• Cas 2 : CGP + Courtier + Fiscaliste → recommandations croisées structurées.</li>
                <li>• Cas 3 : Architecte + Cuisiniste + Domotique → augmentation du panier moyen.</li>
              </ul>
            </div>
            <div className="rounded-2xl border-2 border-[#2E130C] bg-[#2E130C] text-[#E2D9BC] p-5">
              <p className="text-xs uppercase tracking-widest font-black text-[#D2E8FF]">Ce que vous repartez avec en 30 jours</p>
              <ul className="mt-3 space-y-2 text-sm font-bold text-[#E2D9BC]/90">
                <li>• 1 binôme complémentaire validé</li>
                <li>• 1 offre commune prête à vendre</li>
                <li>• 1 script d’introduction + messages prêts à l’emploi</li>
                <li>• 1 cadre de commissions clair</li>
                <li>• 1 plan d’activation concret</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 border-b-4 border-[#2E130C]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">FAQ</p>
            <div className="mt-4 space-y-2">
              {faqItems.map((item) => (
                <details key={item.q} className="rounded-xl border-2 border-[#2E130C] bg-white px-4 py-3">
                  <summary className="cursor-pointer font-black">{item.q}</summary>
                  <p className="mt-2 text-sm font-bold">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#2E130C] text-[#E2D9BC] border-b-4 border-[#2E130C]">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-3xl md:text-6xl font-titan leading-tight">Si votre réseau ne vous rapporte pas déjà chaque mois, ce n’est pas un système.</h2>
            <p className="mt-4 text-base md:text-lg font-bold">
              L’Audit de Synergie permet de vérifier si votre métier est éligible, quel partenaire vous ferait gagner le plus vite, quelle offre commune lancer, et comment ouvrir ensuite l’accès à la sphère complète.
            </p>
            <div className="mt-8">
              <Link href="/programme-commando/postuler" className="inline-flex items-center justify-center rounded-xl border-2 border-[#E2D9BC] bg-[#B20B13] px-8 py-4 text-[#E2D9BC] font-titan shadow-[4px_4px_0px_0px_#E2D9BC] hover:bg-[#7A0000]">
                Postuler à l&apos;Audit de Synergie
              </Link>
            </div>
            <p className="mt-4 text-xs uppercase tracking-widest font-black text-[#D2E8FF]">
              Sélection sur dossier — réservé aux profils capables d’activer de vraies synergies.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
