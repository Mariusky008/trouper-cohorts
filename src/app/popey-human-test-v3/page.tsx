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

const métierScenarios = [
  {
    id: "chasseur-immo",
    name: "Chasseur immobilier de luxe",
    month1: [
      "Partenaire activé : Architecte d’intérieur",
      "Offre commune : Visite + projection d’aménagement premium",
      "Ce que ça change : plus de valeur perçue et première synergie concrète",
    ],
    month2: [
      "Ajout d’un 2e partenaire : CGP ou courtier",
      "Nouvelle opportunité : financement / optimisation patrimoniale",
      "Ce que ça change : 2e source de revenu potentiel et recommandations en chaîne",
    ],
    month3: [
      "Ouverture de la sphère : cuisiniste, domotique, conciergerie, déménageur premium, chef à domicile…",
      "Ce que ça change : le client devient un centre de gravité business multi-opportunités",
    ],
  },
  {
    id: "architecte",
    name: "Architecte d’intérieur",
    month1: [
      "Partenaire activé : Chasseur immobilier",
      "Offre commune : Diagnostic projet + projection aménagement",
      "Ce que ça change : projet déclenché plus tôt et conversion accélérée",
    ],
    month2: [
      "Ajout d’un 2e partenaire : Cuisiniste premium",
      "Nouvelle opportunité : continuité naturelle du projet client",
      "Ce que ça change : panier moyen augmenté",
    ],
    month3: [
      "Ouverture : maitre d’œuvre, domotique, lumière, ébéniste, conciergerie",
      "Ce que ça change : plusieurs entrées de recommandations autour d’un même projet",
    ],
  },
  {
    id: "cgp",
    name: "Conseiller en Gestion de Patrimoine",
    month1: [
      "Partenaire activé : Courtier private",
      "Offre commune : stratégie patrimoniale + montage financement",
      "Ce que ça change : premier binôme rentable et actionnable",
    ],
    month2: [
      "Ajout d’un 2e partenaire : Avocat fiscaliste",
      "Nouvelle opportunité : structuration patrimoniale complète",
      "Ce que ça change : recommandations plus régulières et valeur client renforcée",
    ],
    month3: [
      "Ouverture : assureur objets de valeur, art advisor, conciergerie, cave à vin",
      "Ce que ça change : écosystème élargi et opportunités croisées récurrentes",
    ],
  },
];

const faqItems = [
  {
    q: "En combien de temps puis-je activer une première synergie ?",
    a: "Objectif : repartir avec une première offre commune prête à être activée en 30 jours, puis la dupliquer au Mois 2.",
  },
  {
    q: "Dois-je changer mon métier ou mon offre principale ?",
    a: "Non. Popey ne remplace pas votre activité. Popey augmente la valeur de vos clients actuels grâce à des partenaires complémentaires.",
  },
  {
    q: "Comment fonctionnent les commissions ?",
    a: "Elles dépendent des métiers, des offres et des accords entre partenaires. L’objectif est de rendre les apports d’affaires plus clairs, traçables et réguliers.",
  },
  {
    q: "Et si je n’ai pas une grosse audience ?",
    a: "Ce n’est pas le critère principal. Le plus important est d’avoir une offre sérieuse, une cible identifiable et une vraie capacité à activer des synergies.",
  },
  {
    q: "Qui peut rejoindre ?",
    a: "Les profils retenus sont généralement des professionnels déjà positionnés sur une clientèle à valeur, capables d’activer des partenariats réels et de jouer la réciprocité.",
  },
];

export default function PopeyHumanTestV3Page() {
  const [selectedMetierId, setSelectedMetierId] = useState(métierScenarios[0].id);
  const selectedMetier = useMemo(
    () => métierScenarios.find((scenario) => scenario.id === selectedMetierId) ?? métierScenarios[0],
    [selectedMetierId],
  );

  return (
    <main className={cn("min-h-screen bg-[#E2D9BC] text-[#2E130C] pb-28", titanOne.variable, pacifico.variable, poppins.variable, "font-poppins")}>
      <section className="relative py-20 md:py-24 border-b-4 border-[#2E130C]">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(#2E130C 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <p className="inline-block text-xs uppercase tracking-widest font-black bg-[#D2E8FF] border-2 border-[#2E130C] rounded-full px-4 py-2">Landing V3 — Conversion</p>
            <h1 className="mt-6 text-4xl md:text-6xl lg:text-7xl font-titan leading-[1.05] max-w-5xl">
              Vos clients achètent déjà ailleurs après vous. Popey vous aide à capter cette valeur avec les bons partenaires business.
            </h1>
            <p className="mt-6 text-base md:text-xl font-bold max-w-5xl">
              Nous vous aidons à identifier le partenaire complémentaire le plus rentable pour votre activité, à créer une offre commune en 30 jours, puis à structurer des recommandations et des commissions autour des mêmes clients.
            </p>
            <div className="mt-6 rounded-2xl border-2 border-[#2E130C] bg-white p-5 max-w-5xl shadow-[6px_6px_0px_0px_#2E130C]">
              <p className="text-sm md:text-base font-black">Exemple : si vous êtes agent immobilier, nous pouvons vous associer à un architecte d’intérieur, un courtier, un CGP ou un cuisiniste pour créer :</p>
              <ul className="mt-3 space-y-1 text-sm md:text-base font-bold">
                <li>• des recommandations croisées</li>
                <li>• des offres communes</li>
                <li>• des commissions récurrentes autour du même client</li>
              </ul>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Link href="/programme-commando/postuler" className="inline-flex items-center justify-center rounded-xl border-2 border-[#2E130C] bg-[#B20B13] px-8 py-4 text-[#E2D9BC] font-titan shadow-[4px_4px_0px_0px_#2E130C] hover:bg-[#7A0000]">
                Postuler à l&apos;Audit de Synergie
              </Link>
              <a href="#exemple-metier" className="inline-flex items-center justify-center rounded-xl border-2 border-[#2E130C] bg-[#D2E8FF] px-6 py-3 text-[#2E130C] font-black shadow-[4px_4px_0px_0px_#2E130C]">
                Voir un exemple concret
              </a>
            </div>
            <p className="mt-3 text-xs md:text-sm font-black uppercase tracking-wide text-[#B20B13]">
              Audit de 15 min pour vérifier : votre métier, votre meilleur partenaire, votre 1ère offre commune et votre potentiel de revenu additionnel.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white border-b-4 border-[#2E130C]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-titan">Comment ça marche, concrètement ?</h2>
            <p className="mt-3 text-lg font-bold max-w-4xl">
              Popey ne vous apporte pas juste des contacts. Nous construisons un système simple pour monétiser davantage les mêmes clients.
            </p>
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              <div className="rounded-2xl border-2 border-[#2E130C] bg-[#D2E8FF] p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">1</p>
                <h3 className="mt-2 text-xl font-titan">On vous associe au bon métier complémentaire</h3>
                <p className="mt-2 text-sm font-bold">Nous identifions un professionnel qui vend déjà à vos mêmes clients, sans être votre concurrent direct.</p>
              </div>
              <div className="rounded-2xl border-2 border-[#2E130C] bg-[#E2D9BC] p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">2</p>
                <h3 className="mt-2 text-xl font-titan">On construit une offre commune simple à vendre</h3>
                <p className="mt-2 text-sm font-bold">Nous structurons une offre claire, utile et rentable pour les deux parties, facile à expliquer et facile à activer.</p>
              </div>
              <div className="rounded-2xl border-2 border-[#2E130C] bg-[#F8D7DA] p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">3</p>
                <h3 className="mt-2 text-xl font-titan">On active recommandations + commissions</h3>
                <p className="mt-2 text-sm font-bold">Chaque client peut générer plusieurs opportunités business au lieu d’une seule : ventes additionnelles, apports d’affaires, commissions.</p>
              </div>
            </div>
            <div className="mt-5 rounded-xl border-2 border-[#2E130C] bg-[#2E130C] text-[#E2D9BC] p-4">
              <p className="font-black">Le but n’est pas de “faire du réseau”. Le but est de transformer votre réseau en revenu additionnel structuré.</p>
            </div>
            <div className="mt-5">
              <Link href="/programme-commando/postuler" className="inline-flex items-center justify-center rounded-xl border-2 border-[#2E130C] bg-[#B20B13] px-6 py-3 text-[#E2D9BC] font-black shadow-[4px_4px_0px_0px_#2E130C] hover:bg-[#7A0000]">
                Je veux voir si mon métier est éligible
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 border-b-4 border-[#2E130C]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-titan">Avant Popey / Après Popey</h2>
            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <div className="rounded-2xl border-2 border-[#2E130C] bg-white p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Avant Popey</p>
                <ul className="mt-3 space-y-1 text-sm font-bold">
                  <li>• Vous signez un client… puis la relation s’arrête.</li>
                  <li>• Votre réseau existe, mais il est peu activé.</li>
                  <li>• Les recommandations sont aléatoires.</li>
                  <li>• Les commissions sont floues ou inexistantes.</li>
                  <li>• Chaque client vaut une seule vente.</li>
                </ul>
              </div>
              <div className="rounded-2xl border-2 border-[#2E130C] bg-[#D2E8FF] p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Après Popey</p>
                <ul className="mt-3 space-y-1 text-sm font-bold">
                  <li>• Chaque client peut devenir 2 à 5 opportunités business.</li>
                  <li>• Vous avez un binôme clair, puis une chaîne de partenaires complémentaires.</li>
                  <li>• Vos recommandations deviennent traçables.</li>
                  <li>• Vos commissions deviennent structurées.</li>
                  <li>• Votre réseau peut enfin rapporter chaque mois.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white border-b-4 border-[#2E130C]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-titan">Le système Popey se construit en 3 étapes</h2>
            <p className="mt-3 text-lg font-bold max-w-5xl">
              On ne vous jette pas dans un “réseau”. On vous fait d’abord créer une première synergie rentable, puis on la duplique, puis on ouvre l’écosystème.
            </p>
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              <div className="rounded-2xl border-2 border-[#2E130C] bg-[#D2E8FF] p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Mois 1</p>
                <p className="mt-2 text-sm font-bold">Objectif : créer une première synergie rentable en 30 jours.</p>
                <ul className="mt-3 space-y-1 text-sm font-bold">
                  <li>• 1 partenaire + 1 offre + 1 preuve de concept</li>
                  <li>• binôme idéal, rôles clairs, valeur client définie</li>
                  <li>• scripts, messages, contenus, argumentaires</li>
                  <li>• premiers rendez-vous et premières opportunités</li>
                </ul>
                <p className="mt-3 text-xs font-black uppercase tracking-wide text-[#B20B13]">Résultat : méthode réplicable activée</p>
              </div>
              <div className="rounded-2xl border-2 border-[#2E130C] bg-[#E2D9BC] p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Mois 2</p>
                <p className="mt-2 text-sm font-bold">Objectif : transformer une bonne idée en début de système.</p>
                <ul className="mt-3 space-y-1 text-sm font-bold">
                  <li>• 2e partenaire + duplication + 2e source de revenus</li>
                  <li>• 1er binôme conservé, 2e métier complémentaire ajouté</li>
                  <li>• 2e offre ou 2e angle de recommandation</li>
                  <li>• premières chaînes de valeur structurées</li>
                </ul>
                <p className="mt-3 text-xs font-black uppercase tracking-wide text-[#B20B13]">Résultat : mini-machine en construction</p>
              </div>
              <div className="rounded-2xl border-2 border-[#2E130C] bg-[#F8D7DA] p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Mois 3</p>
                <p className="mt-2 text-sm font-bold">Objectif : passer du binôme à un écosystème de croissance.</p>
                <ul className="mt-3 space-y-1 text-sm font-bold">
                  <li>• accès à la sphère des 20 métiers complémentaires</li>
                  <li>• 1 seul représentant par métier</li>
                  <li>• recommandations plus fluides et mieux orientées</li>
                  <li>• opportunités de commissions élargies</li>
                </ul>
                <p className="mt-3 text-xs font-black uppercase tracking-wide text-[#B20B13]">Résultat : réseau transformé en actif commercial</p>
              </div>
            </div>
            <div className="mt-6">
              <Link href="/programme-commando/postuler" className="inline-flex items-center justify-center rounded-xl border-2 border-[#2E130C] bg-[#B20B13] px-8 py-4 text-[#E2D9BC] font-titan shadow-[4px_4px_0px_0px_#2E130C] hover:bg-[#7A0000]">
                Postuler à l&apos;Audit de Synergie
              </Link>
              <p className="mt-2 text-xs font-black uppercase tracking-wide text-[#B20B13]">
                En 15 minutes, on vous dit si votre activité a un vrai potentiel de synergie rentable.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="exemple-metier" className="py-16 border-b-4 border-[#2E130C]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-titan">À quoi ça peut ressembler pour votre métier ?</h2>
            <p className="mt-3 text-lg font-bold">Voici un exemple simple pour visualiser la progression.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {métierScenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => setSelectedMetierId(scenario.id)}
                  className={cn(
                    "rounded-full border-2 border-[#2E130C] px-4 py-2 text-xs font-black uppercase tracking-wide",
                    selectedMetier.id === scenario.id ? "bg-[#B20B13] text-[#E2D9BC]" : "bg-white text-[#2E130C]",
                  )}
                >
                  {scenario.name}
                </button>
              ))}
            </div>
            <div className="mt-6 rounded-3xl border-4 border-[#2E130C] bg-white p-6 shadow-[8px_8px_0px_0px_#2E130C]">
              <h3 className="text-2xl md:text-3xl font-titan">{selectedMetier.name}</h3>
              <div className="mt-4 grid md:grid-cols-3 gap-3">
                <div className="rounded-xl border-2 border-[#2E130C] bg-[#D2E8FF] p-4">
                  <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Mois 1</p>
                  <ul className="mt-2 space-y-1 text-sm font-bold">{selectedMetier.month1.map((item) => <li key={item}>• {item}</li>)}</ul>
                </div>
                <div className="rounded-xl border-2 border-[#2E130C] bg-[#E2D9BC] p-4">
                  <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Mois 2</p>
                  <ul className="mt-2 space-y-1 text-sm font-bold">{selectedMetier.month2.map((item) => <li key={item}>• {item}</li>)}</ul>
                </div>
                <div className="rounded-xl border-2 border-[#2E130C] bg-[#F8D7DA] p-4">
                  <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Mois 3</p>
                  <ul className="mt-2 space-y-1 text-sm font-bold">{selectedMetier.month3.map((item) => <li key={item}>• {item}</li>)}</ul>
                </div>
              </div>
              <div className="mt-4 rounded-xl border-2 border-[#2E130C] bg-[#2E130C] text-[#E2D9BC] p-4">
                <p className="font-black">Un client bien orchestré peut valoir bien plus qu’une seule vente. C’est toute la logique Popey.</p>
              </div>
            </div>
            <div className="mt-6">
              <Link href="/programme-commando/postuler" className="inline-flex items-center justify-center rounded-xl border-2 border-[#2E130C] bg-[#B20B13] px-6 py-3 text-[#E2D9BC] font-black shadow-[4px_4px_0px_0px_#2E130C] hover:bg-[#7A0000]">
                Voir si mon métier a le même potentiel
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white border-b-4 border-[#2E130C]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-titan">Le système en 1 phrase</h2>
            <p className="mt-4 text-2xl md:text-5xl font-titan">1 client → 3 partenaires → 3 à 5 opportunités business</p>
            <p className="mt-4 text-sm md:text-base font-bold max-w-4xl">
              Au lieu de laisser votre client continuer son parcours ailleurs sans vous, Popey vous aide à structurer ce parcours avec les bons partenaires.
            </p>
            <div className="mt-6 grid md:grid-cols-3 gap-3">
              <div className="rounded-xl border-2 border-[#2E130C] bg-[#D2E8FF] p-4">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Entrée</p>
                <p className="mt-1 text-sm font-bold">Un client entre via votre activité principale.</p>
              </div>
              <div className="rounded-xl border-2 border-[#2E130C] bg-[#E2D9BC] p-4">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Circulation</p>
                <p className="mt-1 text-sm font-bold">Ce même client peut être orienté vers 2 à 3 métiers complémentaires.</p>
              </div>
              <div className="rounded-xl border-2 border-[#2E130C] bg-[#F8D7DA] p-4">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Monétisation</p>
                <p className="mt-1 text-sm font-bold">Chaque passage peut créer une vente, une recommandation ou une commission.</p>
              </div>
            </div>
            <p className="mt-5 text-sm md:text-base font-black">
              Le vrai levier n’est pas d’avoir plus de volume. Le vrai levier, c’est de créer plus de valeur par client.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 border-b-4 border-[#2E130C]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-titan">Ce programme est fait pour vous si…</h2>
            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <div className="rounded-2xl border-2 border-[#2E130C] bg-[#D2E8FF] p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">C’est pour vous si :</p>
                <ul className="mt-3 space-y-1 text-sm font-bold">
                  <li>• vous vendez déjà un service à forte valeur</li>
                  <li>• vous avez une cible client identifiable</li>
                  <li>• vous voulez augmenter votre CA sans changer de marché</li>
                  <li>• vous êtes prêt à activer de vrais partenariats</li>
                  <li>• vous cherchez un système rentable, pas juste du networking</li>
                </ul>
              </div>
              <div className="rounded-2xl border-2 border-[#2E130C] bg-white p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Ce n’est pas pour vous si :</p>
                <ul className="mt-3 space-y-1 text-sm font-bold">
                  <li>• vous cherchez juste à “faire des rencontres”</li>
                  <li>• vous n’avez pas encore d’offre ou de positionnement clair</li>
                  <li>• vous n’êtes pas prêt à jouer la réciprocité</li>
                  <li>• vous voulez des résultats sans activer quoi que ce soit</li>
                  <li>• vous cherchez un simple groupe WhatsApp décoratif</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#D2E8FF] border-b-4 border-[#2E130C]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-titan">Exemples de synergies qui peuvent être activées</h2>
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              <div className="rounded-2xl border-2 border-[#2E130C] bg-white p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <h3 className="text-lg font-titan">Agent immobilier + Architecte d’intérieur</h3>
                <p className="mt-2 text-sm font-bold">Créer une offre de projection / aménagement pour accélérer la décision client et ouvrir des missions complémentaires.</p>
              </div>
              <div className="rounded-2xl border-2 border-[#2E130C] bg-white p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <h3 className="text-lg font-titan">CGP + Courtier + Avocat fiscaliste</h3>
                <p className="mt-2 text-sm font-bold">Transformer une relation patrimoniale en chaîne de valeur autour du financement, de l’optimisation et de la structuration.</p>
              </div>
              <div className="rounded-2xl border-2 border-[#2E130C] bg-white p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <h3 className="text-lg font-titan">Architecte + Cuisiniste + Domotique</h3>
                <p className="mt-2 text-sm font-bold">Créer une continuité logique autour du projet client, avec plusieurs points d’entrée et plusieurs sources de recommandation.</p>
              </div>
            </div>
            <div className="mt-5 rounded-xl border-2 border-[#2E130C] bg-[#E2D9BC] p-4">
              <p className="text-sm font-bold">
                Ces exemples ne sont pas des promesses standardisées. Ils montrent comment un même client peut générer plusieurs opportunités quand les bons métiers sont orchestrés ensemble.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 border-b-4 border-[#2E130C]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-titan">Ce que vous obtenez concrètement dans les 30 premiers jours</h2>
            <div className="mt-6 rounded-3xl border-4 border-[#2E130C] bg-white p-6 shadow-[8px_8px_0px_0px_#2E130C]">
              <ul className="space-y-2 text-sm md:text-base font-bold">
                <li>• le meilleur partenaire complémentaire à activer en priorité</li>
                <li>• une offre commune simple à vendre</li>
                <li>• un angle clair pour parler de cette offre</li>
                <li>• des scripts / messages / argumentaires pour l’activer</li>
                <li>• une méthode réplicable pour la dupliquer au Mois 2</li>
              </ul>
              <div className="mt-5 rounded-xl border-2 border-[#2E130C] bg-[#2E130C] text-[#E2D9BC] p-4">
                <p className="font-black">
                  Le but du Mois 1 n’est pas de vous noyer dans un réseau. Le but est de vous faire sortir avec une première synergie rentable et activable.
                </p>
              </div>
            </div>
            <div className="mt-6">
              <Link href="/programme-commando/postuler" className="inline-flex items-center justify-center rounded-xl border-2 border-[#2E130C] bg-[#B20B13] px-8 py-4 text-[#E2D9BC] font-titan shadow-[4px_4px_0px_0px_#2E130C] hover:bg-[#7A0000]">
                Postuler à l&apos;Audit de Synergie
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white border-b-4 border-[#2E130C]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-titan">Questions fréquentes</h2>
            <div className="mt-5 space-y-2">
              {faqItems.map((item) => (
                <details key={item.q} className="rounded-xl border-2 border-[#2E130C] bg-[#E2D9BC] px-4 py-3">
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
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-6xl font-titan leading-tight">
              Si votre réseau ne vous rapporte pas déjà chaque mois, ce n’est pas encore un système.
            </h2>
            <p className="mt-5 text-base md:text-lg font-bold">
              L’Audit de Synergie n’est pas un appel de découverte classique. C’est un diagnostic rapide pour identifier le partenaire le plus rentable à activer en premier, l’offre commune la plus simple à lancer, et votre potentiel réel de revenu additionnel.
            </p>
            <div className="mt-5 rounded-2xl border-2 border-[#E2D9BC] bg-[#E2D9BC]/10 p-5">
              <p className="text-xs uppercase tracking-widest font-black text-[#D2E8FF]">Pendant l’audit, on vérifie :</p>
              <ul className="mt-3 space-y-1 text-sm font-bold">
                <li>• si votre métier est compatible</li>
                <li>• quel binôme a le plus de potentiel</li>
                <li>• quelle offre commune lancer en premier</li>
                <li>• si vous êtes prêt pour le Mois 1</li>
                <li>• et si votre profil a du sens pour ouvrir ensuite la sphère complète</li>
              </ul>
            </div>
            <div className="mt-8">
              <Link href="/programme-commando/postuler" className="inline-flex items-center justify-center rounded-xl border-2 border-[#E2D9BC] bg-[#B20B13] px-8 py-4 text-[#E2D9BC] font-titan shadow-[4px_4px_0px_0px_#E2D9BC] hover:bg-[#7A0000]">
                Postuler à l&apos;Audit de Synergie
              </Link>
            </div>
            <p className="mt-4 text-xs uppercase tracking-widest font-black text-[#D2E8FF]">
              Sélection sur dossier — réservé aux profils capables d’activer de vraies synergies business.
            </p>
          </div>
        </div>
      </section>

      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-6 md:w-[360px]">
        <Link href="/programme-commando/postuler" className="flex items-center justify-center rounded-xl border-2 border-[#2E130C] bg-[#B20B13] px-4 py-3 text-[#E2D9BC] font-black shadow-[4px_4px_0px_0px_#2E130C]">
          Postuler à l&apos;Audit de Synergie
        </Link>
      </div>
    </main>
  );
}
