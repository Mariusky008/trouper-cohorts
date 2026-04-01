"use client";

import Link from "next/link";
import { Pacifico, Poppins, Titan_One } from "next/font/google";
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

const faqItems = [
  {
    q: "Est-ce que Popey peut vraiment augmenter mon chiffre d’affaires ?",
    a: "Oui, si votre activité a déjà une vraie valeur et si votre client achète naturellement chez des métiers complémentaires après vous. Popey sert à structurer cette valeur déjà existante pour que vous en captiez une part plus importante.",
  },
  {
    q: "Et si je n’ai pas encore le bon partenaire ?",
    a: "C’est précisément le rôle de l’Audit de Synergie et du Mois 1. Nous identifions avec vous le partenaire le plus logique, le plus simple à activer et le plus rentable à tester en premier.",
  },
  {
    q: "Et si mon partenaire ne joue pas le jeu ?",
    a: "Popey structure les rôles, la promesse client, la logique d’échange, la réciprocité et l’activation concrète pour éviter les partenariats flous ou passifs.",
  },
  {
    q: "En combien de temps puis-je voir un premier résultat ?",
    a: "Le premier objectif est d’avoir une synergie activable en 30 jours. Les résultats dépendent ensuite de votre métier, de votre réactivité, de votre exécution et de la maturité de votre réseau.",
  },
  {
    q: "Est-ce que j’ai besoin d’une grosse audience ?",
    a: "Non. Vous avez surtout besoin d’un bon positionnement, d’un bon partenaire et d’un bon système d’activation.",
  },
  {
    q: "Pourquoi rester après le Mois 1 ?",
    a: "Le Mois 1 prouve que le mécanisme fonctionne. Le Mois 2 le duplique. Le Mois 3 ouvre la logique d’écosystème et de recommandations croisées.",
  },
];

export default function PopeyHumanTestV4Page() {
  return (
    <main className={cn("min-h-screen bg-[#E2D9BC] text-[#2E130C] pb-28", titanOne.variable, pacifico.variable, poppins.variable, "font-poppins")}>
      <section className="py-14 md:py-16 border-b-4 border-[#2E130C] bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <p className="inline-block text-xs uppercase tracking-widest font-black bg-[#D2E8FF] border-2 border-[#2E130C] rounded-full px-4 py-2">Landing V4 — Prête à Prod</p>
              <h1 className="mt-5 text-4xl md:text-6xl font-titan leading-[1.05]">
                Augmentez votre chiffre d’affaires avec les mêmes clients, grâce aux bons partenaires business.
              </h1>
              <p className="mt-4 text-base md:text-lg font-bold">
                Popey vous aide à créer, en 30 jours, une première offre commune rentable avec un professionnel complémentaire à votre métier. Puis nous vous aidons à dupliquer ce système pour générer recommandations, commissions et opportunités récurrentes.
              </p>
              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <Link href="/programme-commando/postuler" className="inline-flex items-center justify-center rounded-xl border-2 border-[#2E130C] bg-[#B20B13] px-7 py-3 text-[#E2D9BC] font-titan shadow-[4px_4px_0px_0px_#2E130C]">
                  Postuler à l&apos;Audit de Synergie
                </Link>
                <a href="#exemple-metier-v4" className="inline-flex items-center justify-center rounded-xl border-2 border-[#2E130C] bg-transparent px-6 py-3 text-[#2E130C] font-black">
                  Voir un exemple concret pour mon métier
                </a>
              </div>
              <p className="mt-3 text-xs font-black uppercase tracking-wide text-[#B20B13]">
                Audit 15 min • 1 partenaire prioritaire identifié • 1 offre commune possible • Sur sélection
              </p>
            </div>
            <div className="rounded-3xl border-4 border-[#2E130C] bg-[#2E130C] p-6 text-[#E2D9BC] shadow-[8px_8px_0px_0px_#2E130C]">
              <p className="text-xs uppercase tracking-widest font-black text-[#D2E8FF]">Visualisation du mécanisme</p>
              <div className="mt-5 rounded-2xl border-2 border-[#E2D9BC]/40 bg-[#E2D9BC]/5 p-4">
                <div className="relative h-[260px]">
                  <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
                    <defs>
                      <marker id="v4Arrow" markerWidth="5" markerHeight="5" refX="4.4" refY="2.5" orient="auto">
                        <path d="M0,0 L5,2.5 L0,5 Z" fill="#E2D9BC" />
                      </marker>
                    </defs>
                    <circle cx="50" cy="50" r="12" fill="none" stroke="#E2D9BC" strokeWidth="1.4" />
                    <circle cx="18" cy="24" r="10" fill="#E2D9BC1A" stroke="#E2D9BC" strokeWidth="1" />
                    <circle cx="82" cy="24" r="10" fill="#E2D9BC1A" stroke="#E2D9BC" strokeWidth="1" />
                    <circle cx="18" cy="76" r="10" fill="#E2D9BC1A" stroke="#E2D9BC" strokeWidth="1" />
                    <line x1="50" y1="50" x2="26" y2="30" stroke="#E2D9BC" strokeOpacity="0.85" strokeWidth="1.1" markerEnd="url(#v4Arrow)" />
                    <line x1="50" y1="50" x2="74" y2="30" stroke="#E2D9BC" strokeOpacity="0.85" strokeWidth="1.1" markerEnd="url(#v4Arrow)" />
                    <line x1="50" y1="50" x2="26" y2="70" stroke="#E2D9BC" strokeOpacity="0.85" strokeWidth="1.1" markerEnd="url(#v4Arrow)" />
                  </svg>
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#E2D9BC] bg-[#2E130C] px-4 py-1.5 text-sm font-titan">
                    Client
                  </div>
                  <div className="absolute left-[8%] top-[15%] rounded-full border border-[#E2D9BC] bg-[#E2D9BC]/10 px-3 py-1 text-[11px] font-black">
                    Architecte
                  </div>
                  <div className="absolute right-[8%] top-[15%] rounded-full border border-[#E2D9BC] bg-[#E2D9BC]/10 px-3 py-1 text-[11px] font-black">
                    Courtier / CGP
                  </div>
                  <div className="absolute left-[8%] bottom-[15%] rounded-full border border-[#E2D9BC] bg-[#E2D9BC]/10 px-3 py-1 text-[11px] font-black">
                    Cuisiniste
                  </div>
                  <div className="absolute right-[7%] bottom-[12%] rounded-lg border border-[#E2D9BC] bg-[#E2D9BC]/10 px-3 py-2 text-[11px] font-black text-right leading-tight">
                    Recommandations
                    <br />
                    Commissions
                    <br />
                    Offres communes
                  </div>
                </div>
              </div>
              <p className="mt-3 text-center text-sm font-black">1 client bien orienté = plusieurs opportunités business activables</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 border-b-4 border-[#2E130C]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Ce que Popey construit avec vous</p>
            <div className="mt-4 grid md:grid-cols-4 gap-3">
              <div className="rounded-xl border-2 border-[#2E130C] bg-[#D2E8FF] p-4">
                <p className="font-titan text-3xl">1 client</p>
                <p className="mt-1 text-sm font-bold">2 à 5 opportunités potentielles en structurant le parcours après vous.</p>
              </div>
              <div className="rounded-xl border-2 border-[#2E130C] bg-[#E2D9BC] p-4">
                <p className="font-titan text-3xl">Mois 1</p>
                <p className="mt-1 text-sm font-bold">1 première synergie rentable : 1 partenaire + 1 offre commune.</p>
              </div>
              <div className="rounded-xl border-2 border-[#2E130C] bg-[#F8D7DA] p-4">
                <p className="font-titan text-3xl">Mois 2</p>
                <p className="mt-1 text-sm font-bold">Duplication du système avec une 2e synergie et une nouvelle source de revenu.</p>
              </div>
              <div className="rounded-xl border-2 border-[#2E130C] bg-white p-4">
                <p className="font-titan text-3xl">Mois 3</p>
                <p className="mt-1 text-sm font-bold">Ouverture à 20 métiers : recommandations croisées et opportunités récurrentes.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 border-b-4 border-[#2E130C] bg-[#2E130C] text-[#E2D9BC]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-titan">Vos clients achètent déjà ailleurs après vous. Le problème, c’est que vous n’êtes pas dans la boucle.</h2>
            <p className="mt-4 text-base md:text-lg font-bold max-w-5xl">
              Un client qui vous fait confiance continue souvent son parcours chez d’autres professionnels complémentaires : courtier, architecte d’intérieur, CGP, cuisiniste, déménageur premium, conciergerie privée.
            </p>
            <p className="mt-4 text-base md:text-lg font-bold max-w-5xl">
              Si ces achats se font sans vous, vous laissez partir de la valeur, des recommandations, des commissions et des opportunités de fidélisation. Popey sert à remettre votre métier au centre de cette chaîne de valeur.
            </p>
            <div className="mt-5 rounded-xl border-2 border-[#E2D9BC] bg-[#E2D9BC]/10 p-4">
              <p className="font-black">Chaque client qui continue son parcours sans vous = une opportunité que vous laissez partir.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 border-b-4 border-[#2E130C] bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-titan">Concrètement, Popey fait quoi ?</h2>
            <p className="mt-3 text-lg font-bold">Nous ne vendons pas du networking. Nous construisons un système de croissance par synergies business.</p>
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              <div className="rounded-2xl border-2 border-[#2E130C] bg-[#D2E8FF] p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <p className="font-titan text-4xl">1</p>
                <h3 className="mt-2 text-xl font-titan">Identifier le partenaire le plus rentable</h3>
                <p className="mt-2 text-sm font-bold">Nous repérons le professionnel complémentaire le plus logique autour de votre client cible.</p>
                <p className="mt-2 text-xs font-black">Exemples : Agent immobilier → architecte d’intérieur • CGP → avocat fiscaliste • Chasseur immo → cuisiniste premium</p>
              </div>
              <div className="rounded-2xl border-2 border-[#2E130C] bg-[#E2D9BC] p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <p className="font-titan text-4xl">2</p>
                <h3 className="mt-2 text-xl font-titan">Construire une offre commune simple à vendre</h3>
                <p className="mt-2 text-sm font-bold">Nous clarifions qui fait quoi, ce que le client achète, la promesse, le prix et la logique de commission.</p>
                <p className="mt-2 text-xs font-black">Vous repartez avec une offre activable, pas une idée floue.</p>
              </div>
              <div className="rounded-2xl border-2 border-[#2E130C] bg-[#F8D7DA] p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <p className="font-titan text-4xl">3</p>
                <h3 className="mt-2 text-xl font-titan">Déclencher recommandations et commissions</h3>
                <p className="mt-2 text-sm font-bold">Nous vous aidons à activer messages, prises de contact, visibilité locale et rendez-vous duo.</p>
                <p className="mt-2 text-xs font-black">L’objectif : transformer une relation en opportunités concrètes.</p>
              </div>
            </div>
            <a href="#parcours-3-mois" className="mt-5 inline-flex rounded-lg border-2 border-[#2E130C] px-4 py-2 text-sm font-black bg-[#E2D9BC]">
              Voir comment ça se déroule sur 3 mois
            </a>
          </div>
        </div>
      </section>

      <section className="py-16 border-b-4 border-[#2E130C]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-titan">Avant Popey, votre réseau est passif. Après Popey, il devient une machine à opportunités.</h2>
            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <div className="rounded-2xl border-2 border-[#2E130C] bg-[#F8D7DA] p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Sans Popey</p>
                <ul className="mt-3 space-y-1 text-sm font-bold">
                  <li>• 1 client = 1 vente</li>
                  <li>• réseau informel</li>
                  <li>• partenaires mal choisis</li>
                  <li>• recommandations aléatoires</li>
                  <li>• commissions floues ou inexistantes</li>
                  <li>• dépendance à la prospection ou au hasard</li>
                </ul>
              </div>
              <div className="rounded-2xl border-2 border-[#2E130C] bg-[#D2E8FF] p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Avec Popey</p>
                <ul className="mt-3 space-y-1 text-sm font-bold">
                  <li>• 1 client = 2 à 5 opportunités potentielles</li>
                  <li>• 1 partenaire complémentaire activé intelligemment</li>
                  <li>• 1 offre commune simple à vendre</li>
                  <li>• recommandations traçables</li>
                  <li>• commissions structurées</li>
                  <li>• système duplicable Mois 1 → 2 → 3</li>
                </ul>
              </div>
            </div>
            <div className="mt-5 rounded-xl border-2 border-[#2E130C] bg-white p-4 text-center">
              <p className="font-titan text-2xl">1 client = 1 vente <span className="mx-2">VS</span> 1 client = 2 à 5 opportunités</p>
            </div>
            <div className="mt-5">
              <Link href="/programme-commando/postuler" className="inline-flex rounded-xl border-2 border-[#2E130C] bg-[#B20B13] px-7 py-3 text-[#E2D9BC] font-titan shadow-[4px_4px_0px_0px_#2E130C]">
                Postuler à l&apos;Audit de Synergie
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="parcours-3-mois" className="py-16 border-b-4 border-[#2E130C] bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-titan">
              On ne vous jette pas dans un réseau. On vous fait d’abord créer une synergie rentable, puis on la duplique, puis on ouvre l’écosystème.
            </h2>
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              <div className="rounded-2xl border-2 border-[#2E130C] bg-[#D2E8FF] p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Mois 1 — Votre première synergie rentable</p>
                <p className="mt-3 text-sm font-black">Objectif</p>
                <p className="text-sm font-bold">Lancer une première offre commune activable en 30 jours.</p>
                <p className="mt-3 text-sm font-black">Ce qu’on construit</p>
                <ul className="mt-1 space-y-1 text-sm font-bold">
                  <li>• partenaire prioritaire</li>
                  <li>• rôles et offre simple</li>
                  <li>• scripts + plan d’activation</li>
                </ul>
                <p className="mt-3 text-sm font-black">Résultat attendu</p>
                <p className="text-sm font-bold">Preuve de concept rentable et méthode réplicable.</p>
              </div>
              <div className="rounded-2xl border-2 border-[#2E130C] bg-[#E2D9BC] p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Mois 2 — Duplication et 2e source de revenu</p>
                <p className="mt-3 text-sm font-black">Objectif</p>
                <p className="text-sm font-bold">Reproduire le système avec un 2e métier complémentaire.</p>
                <p className="mt-3 text-sm font-black">Ce qu’on construit</p>
                <ul className="mt-1 space-y-1 text-sm font-bold">
                  <li>• choix du 2e partenaire</li>
                  <li>• 2e offre liée</li>
                  <li>• nouvelle boucle de recommandations</li>
                </ul>
                <p className="mt-3 text-sm font-black">Résultat attendu</p>
                <p className="text-sm font-bold">Plus de valeur par client et système qui commence à tourner.</p>
              </div>
              <div className="rounded-2xl border-2 border-[#2E130C] bg-[#F8D7DA] p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Mois 3 — Ouverture à la sphère de 20 métiers</p>
                <p className="mt-3 text-sm font-black">Objectif</p>
                <p className="text-sm font-bold">Entrer dans une logique d’écosystème de croissance.</p>
                <p className="mt-3 text-sm font-black">Ce qu’on construit</p>
                <ul className="mt-1 space-y-1 text-sm font-bold">
                  <li>• recommandations croisées</li>
                  <li>• commissions d’apport structurées</li>
                  <li>• activité transformée en point d’entrée stratégique</li>
                </ul>
                <p className="mt-3 text-sm font-black">Résultat attendu</p>
                <p className="text-sm font-bold">Dynamique de croissance plus récurrente autour du même client.</p>
              </div>
            </div>
            <div className="mt-6">
              <Link href="/programme-commando/postuler" className="inline-flex rounded-xl border-2 border-[#2E130C] bg-[#B20B13] px-8 py-4 text-[#E2D9BC] font-titan shadow-[4px_4px_0px_0px_#2E130C]">
                Postuler à l&apos;Audit de Synergie
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="exemple-metier-v4" className="py-16 border-b-4 border-[#2E130C]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-titan">Exemple concret : comment un chasseur immobilier de luxe peut gagner plus avec les mêmes clients</h2>
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              <div className="rounded-2xl border-2 border-[#2E130C] bg-[#D2E8FF] p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Mois 1</p>
                <p className="mt-2 text-sm font-bold">Partenaire prioritaire : Architecte d’intérieur</p>
                <p className="mt-2 text-sm font-bold">Offre : Projection achat + potentiel d’optimisation du bien.</p>
                <p className="mt-2 text-sm font-bold">Impact : plus de différenciation, plus de valeur perçue, première commission possible.</p>
              </div>
              <div className="rounded-2xl border-2 border-[#2E130C] bg-[#E2D9BC] p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Mois 2</p>
                <p className="mt-2 text-sm font-bold">2e partenaire : Courtier premium ou CGP</p>
                <p className="mt-2 text-sm font-bold">Offre : Accompagnement achat + stratégie financement / patrimoine.</p>
                <p className="mt-2 text-sm font-bold">Impact : 2e point d’entrée business et revenu additionnel indirect.</p>
              </div>
              <div className="rounded-2xl border-2 border-[#2E130C] bg-[#F8D7DA] p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Mois 3</p>
                <p className="mt-2 text-sm font-bold">Ouverture : cuisiniste premium, déménageur premium, conciergerie, domotique, chef à domicile, home organizer.</p>
                <p className="mt-2 text-sm font-bold">Impact : recommandations croisées, commissions et fidélisation.</p>
              </div>
            </div>
            <div className="mt-5 rounded-xl border-2 border-[#2E130C] bg-[#2E130C] text-[#E2D9BC] p-4">
              <p className="font-black">Le but n’est pas d’avoir plus de contacts. Le but est de transformer un seul client en mini écosystème rentable.</p>
            </div>
            <div className="mt-5">
              <Link href="/programme-commando/postuler" className="inline-flex rounded-xl border-2 border-[#2E130C] bg-[#B20B13] px-6 py-3 text-[#E2D9BC] font-black shadow-[4px_4px_0px_0px_#2E130C]">
                Voir si mon métier a le même potentiel
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 border-b-4 border-[#2E130C] bg-white">
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
            <p className="mt-5 font-black">Le vrai levier n’est pas d’avoir plus de volume. Le vrai levier, c’est de créer plus de valeur par client.</p>
          </div>
        </div>
      </section>

      <section className="py-16 border-b-4 border-[#2E130C]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-titan">Popey n’est pas fait pour tout le monde.</h2>
            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <div className="rounded-2xl border-2 border-[#2E130C] bg-[#D2E8FF] p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">C’est pour vous si…</p>
                <ul className="mt-3 space-y-1 text-sm font-bold">
                  <li>• vous vendez déjà une vraie offre</li>
                  <li>• vous avez une cible identifiable</li>
                  <li>• vous voulez augmenter la valeur de vos clients existants</li>
                  <li>• vous êtes prêt à jouer la réciprocité</li>
                  <li>• vous cherchez un système, pas juste du réseau</li>
                </ul>
              </div>
              <div className="rounded-2xl border-2 border-[#2E130C] bg-white p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Ce n’est pas pour vous si…</p>
                <ul className="mt-3 space-y-1 text-sm font-bold">
                  <li>• vous cherchez des leads magiques sans structurer votre activité</li>
                  <li>• vous n’avez pas encore d’offre sérieuse</li>
                  <li>• vous refusez de collaborer avec d’autres professionnels</li>
                  <li>• vous voulez juste rencontrer du monde sans exécution</li>
                </ul>
              </div>
            </div>
            <div className="mt-5 rounded-xl border-2 border-[#2E130C] bg-[#2E130C] text-[#E2D9BC] p-4">
              <p className="font-black">Si vous cherchez un groupe WhatsApp décoratif, ce n’est pas pour vous. Si vous voulez transformer votre portefeuille client en système de croissance, postulez.</p>
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
                <h3 className="text-xl font-titan">Agent immobilier + Architecte d’intérieur</h3>
                <p className="mt-2 text-sm font-bold">Offre de projection / aménagement pour accélérer la décision client et ouvrir des missions complémentaires.</p>
              </div>
              <div className="rounded-2xl border-2 border-[#2E130C] bg-white p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <h3 className="text-xl font-titan">CGP + Courtier + Avocat fiscaliste</h3>
                <p className="mt-2 text-sm font-bold">Chaîne de valeur autour du financement, de l’optimisation et de la structuration patrimoniale.</p>
              </div>
              <div className="rounded-2xl border-2 border-[#2E130C] bg-white p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <h3 className="text-xl font-titan">Architecte + Cuisiniste + Domotique</h3>
                <p className="mt-2 text-sm font-bold">Continuité logique du projet client avec plusieurs points d’entrée et sources de recommandation.</p>
              </div>
            </div>
            <p className="mt-5 text-sm font-bold">
              Ces exemples ne sont pas des promesses standardisées. Ils montrent comment un même client peut générer plusieurs opportunités quand les bons métiers sont orchestrés ensemble.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 border-b-4 border-[#2E130C]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-titan">Ce que vous obtenez concrètement dans les 30 premiers jours</h2>
            <div className="mt-6 rounded-3xl border-4 border-[#2E130C] bg-white p-6 shadow-[8px_8px_0px_0px_#2E130C]">
              <div className="grid md:grid-cols-2 gap-3 text-sm font-bold">
                <p>• 1 partenaire complémentaire prioritaire identifié</p>
                <p>• 1 offre commune simple à vendre</p>
                <p>• 1 logique de recommandation claire</p>
                <p>• 1 cadre de commission ou d’apport d’affaires</p>
                <p>• vos messages et scripts prêts à utiliser</p>
                <p>• 1 plan d’activation terrain</p>
              </div>
              <div className="mt-5 rounded-xl border-2 border-[#2E130C] bg-[#2E130C] text-[#E2D9BC] p-4">
                <p className="font-black">Vous ne repartez pas avec de la théorie. Vous repartez avec une synergie business activable.</p>
              </div>
            </div>
            <div className="mt-6">
              <Link href="/programme-commando/postuler" className="inline-flex rounded-xl border-2 border-[#2E130C] bg-[#B20B13] px-8 py-4 text-[#E2D9BC] font-titan shadow-[4px_4px_0px_0px_#2E130C]">
                Postuler à l&apos;Audit de Synergie
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 border-b-4 border-[#2E130C] bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-4 items-start">
            <div className="lg:col-span-2 rounded-2xl border-2 border-[#2E130C] bg-[#E2D9BC] p-5 shadow-[6px_6px_0px_0px_#2E130C]">
              <h2 className="text-3xl md:text-4xl font-titan">Pourquoi Popey existe</h2>
              <p className="mt-3 text-sm md:text-base font-bold">
                Des professionnels compétents vendent souvent seuls, alors que leurs clients achètent déjà chez des métiers complémentaires autour d’eux. Popey a été créé pour transformer ce parcours client dispersé en système de recommandations, offres communes, commissions structurées et synergies activables.
              </p>
              <p className="mt-3 text-sm md:text-base font-black">Ici, on ne vend pas du networking flou. On construit des synergies business rentables.</p>
            </div>
            <div className="rounded-2xl border-2 border-[#2E130C] bg-[#2E130C] text-[#E2D9BC] p-5">
              <p className="text-xs uppercase tracking-widest font-black text-[#D2E8FF]">Repères</p>
              <ul className="mt-3 space-y-2 text-sm font-bold">
                <li>• 7 entreprises pilotées</li>
                <li>• approche terrain</li>
                <li>• conçu pour métiers à forte valeur</li>
                <li>• sélection sur profil</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 border-b-4 border-[#2E130C]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-titan">Questions fréquentes</h2>
            <div className="mt-5 space-y-2">
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

      <section className="py-16 border-b-4 border-[#2E130C] bg-[#D2E8FF]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto rounded-3xl border-4 border-[#2E130C] bg-white p-6 shadow-[8px_8px_0px_0px_#2E130C]">
            <h2 className="text-3xl md:text-5xl font-titan">Nous ne retenons pas tous les profils.</h2>
            <p className="mt-3 text-sm md:text-base font-bold">
              Popey fonctionne mieux avec des professionnels qui ont déjà une expertise reconnue, vendent une offre claire, comprennent la réciprocité et peuvent activer une vraie complémentarité métier.
            </p>
            <p className="mt-3 text-sm md:text-base font-bold">
              L’Audit de Synergie sert à vérifier si votre métier est compatible, quel partenaire activer en premier, et si une synergie rentable peut être construite rapidement.
            </p>
            <p className="mt-3 font-black">Si votre profil est validé, vous repartez avec une direction claire. Si ce n’est pas le bon moment, on vous le dira.</p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#2E130C] text-[#E2D9BC]">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-6xl font-titan">Vérifiez si votre métier peut générer plus avec les mêmes clients.</h2>
            <p className="mt-5 text-base md:text-lg font-bold">
              En 15 minutes, nous identifions avec vous le partenaire complémentaire le plus logique à activer, la première synergie la plus simple à lancer, et si votre activité est compatible avec la méthode Popey.
            </p>
            <div className="mt-8">
              <Link href="/programme-commando/postuler" className="inline-flex rounded-xl border-2 border-[#E2D9BC] bg-[#B20B13] px-8 py-4 text-[#E2D9BC] font-titan shadow-[4px_4px_0px_0px_#E2D9BC]">
                Postuler à l&apos;Audit de Synergie
              </Link>
            </div>
            <p className="mt-4 text-xs uppercase tracking-widest font-black text-[#D2E8FF]">Audit court • Sur sélection • Sans engagement</p>
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
