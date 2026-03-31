import Link from "next/link";
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

const sections = [
  {
    id: "miroir",
    title: "SECTION 2 — LE MIROIR DE L'ÉCHEC",
    heading: "Vous êtes compétent. Alors pourquoi votre réseau ne vous rapporte presque rien ?",
    paragraphs: [
      "Combien de cafés réseau ont fini en promesses polies et en zéro client réel ?",
      "Combien de “on s'envoie des clients” se transforment en silence radio ?",
      "Combien de fois avez-vous hésité à demander une commission, de peur de passer pour opportuniste ?",
      "Ce n'est pas votre talent qui bloque. C'est l'absence de structure.",
      "Un indépendant en solo vend son expertise. Deux experts bien orchestrés vendent une décision évidente.",
      "Seul, votre prospect doute ; en duo, il se sent protégé et passe à l'action.",
    ],
    bullets: [
      "Solo : une promesse perçue comme risquée.",
      "Duo structuré : une solution perçue comme complète.",
      "Solo : vous cherchez des leads froids.",
      "Duo : vous activez des audiences déjà confiantes.",
    ],
    image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "gap",
    title: "SECTION 3 — L'ÉQUATION DU GAP",
    heading: "Le manque à gagner n'est pas abstrait. Il est chiffrable.",
    paragraphs: [
      "Situation idéale : 5 000€ / mois de CA additionnel via votre réseau.",
      "Réalité actuelle : 500€ / mois irréguliers, souvent non pilotés.",
      "Écart : 4 500€ / mois.",
      "Sur 12 mois : 54 000€ laissés sur la table.",
      "Le prix d'une Porsche qui reste au garage, payé avec vos opportunités perdues.",
      "Popey ne crée pas un besoin artificiel : Popey récupère une partie de l'argent qui vous échappe déjà.",
    ],
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "method",
    title: "SECTION 4 — MOIS 1 : L'ACCÉLÉRATEUR DE SYNERGIE (149€)",
    heading: "Un plan d'exécution hebdomadaire, inspiré d'un binôme réel Archi + Cuisiniste.",
    paragraphs: [
      "Objectif : transformer deux expertises isolées en une offre duo monétisable, visible et vendue en 4 semaines.",
      "Ce plan ne repose pas sur de la motivation. Il repose sur des livrables, des scripts et des chiffres.",
    ],
    bullets: [
      "Semaine 1 — Ingénierie Synergy-Offer : audit de complémentarité, design du Pack Signature, pricing no-brainer (ex: 497€) et One-Page Solution.",
      "Semaine 2 — Arsenal marketing : collab post + stories coulisses + script de tagging, puis turbo boost Popey (Meta Ads géolocalisées 50 à 97€).",
      "Semaine 3 — Activation chirurgicale : Sprint des 20 contacts, appels de qualification duo, lead magnet PDF et suivi dans le Synergy Tracker.",
      "Semaine 4 — Arbitrage et scale : closing des packs, preuve du ROI, protocole de split des revenus, puis passage à 490€/mois dans la Sphère des 20.",
      "Logique finale : le pack d'appel ne vend pas seulement une prestation. Il ouvre la porte aux chantiers à forte valeur derrière.",
    ],
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "sphere",
    title: "SECTION 5 — 2 SPHÈRES EXEMPLES (CLIQUABLES)",
    heading: "Mois 2+ : choisissez une sphère et voyez immédiatement le mécanisme.",
    paragraphs: [
      "Chaque sphère regroupe 20 métiers complémentaires, organisée en 4 clusters.",
      "Le principe est simple : une entrée client déclenche une chaîne de contrats dans tout l'écosystème.",
    ],
    bullets: [
      "Cluster 1 — Transaction & Finance : chasseur immo de luxe, courtier private banking, CGP, avocat fiscaliste, assureur objets de valeur.",
      "Cluster 2 — Métamorphose du lieu : architecte d'intérieur, maître d'œuvre, paysagiste/piscine, cuisiniste haut de gamme, expert domotique/sécurité.",
      "Cluster 3 — Équipement & Esthétique : ébéniste, galeriste/art advisor, spécialiste hi-fi/home cinéma, lighting designer, antiquaire design.",
      "Cluster 4 — Intendance & Prestige : conciergerie privée, chef à domicile, déménageur premium, home organizer, sommelier/cave à vin.",
      "Effet de levier : une seule mise en relation qualifiée peut rembourser jusqu'à 1 an d'abonnement à 490€.",
      "Gap business : hors Popey, ~15 000€ de valeur perdue par client ; sur 10 clients/an, ~150 000€ de manque à gagner.",
    ],
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1600&auto=format&fit=crop",
  },
];

const ventures = [
  "1) Import / Export riz et sucre (Bangkok) — 1999/2000",
  "2) Lolypop SARL (Paris) — 2003/2006 : 500 distributeurs automatiques de friandises et boissons",
  "3) Jack's Express (Dax, Pau, Dax) — 2007/2011 : 3 restaurants de restauration rapide",
  "4) Au Petit Paris (Dubaï) — 2013/2014 : chaîne de boulangeries",
  "5) My-Sign (Dubaï) — 2014/2015 : application de reconnaissance de logos type QR code",
  "6) 1TAM (Dubaï) — 2015/2017 : réseau social vidéo gamifié",
  "7) Elyot (Bordeaux) — depuis septembre 2017 : socialisation instantanée et géolocalisée",
];

const founderMilestones = [
  "2004 : création à Paris d'une société de distributeurs automatiques (CA annuel 650 000€), revendue en 2006.",
  "2007 : création de 3 restaurants à Dax et 1 à Pau ; management de 30 à 40 salariés ; revente après 4 ans.",
  "2013 : lancement de la chaîne de boulangeries Au Petit Paris à Dubaï ; concept revendu en 1 an.",
  "2014-2017 : lancement de My-Sign puis pivot vers 1TAM ; levées de fonds successives (300K€ puis 700K€ cumulés).",
  "Fin 2017 : maintien de 20% des parts et passage en rôle de conseiller stratégique depuis la France.",
];

const productLearnings = [
  "Compétences nécessaires pour développer une application de type Mikky.",
  "Cadence produit réaliste : 5 mois de développement + 1 mois de débuggage et ajustements.",
  "Seuil de traction initial à viser : 1 000 utilisateurs en 2 à 3 mois.",
  "Lecture des taux de rebond comme signaux d&apos;alerte prioritaires.",
  "Nécessité d'améliorer, pivoter et retester en continu avec des communautés bêta-testeurs.",
];

const founderProofs = [
  { label: "Sociétés dirigées", value: "7" },
  { label: "CA annuel (Lolypop)", value: "650K€" },
  { label: "Restaurants pilotés", value: "4" },
  { label: "Levées de fonds", value: "700K€+" },
];

const methodTimeline = [
  {
    step: "S1",
    title: "Ingénierie Synergy-Offer",
    color: "bg-[#D2E8FF]",
    metrics: "1 pack signature | 1 one-page",
    detail: "Audit de complémentarité, design de l'offre et prix d'appel no-brainer.",
  },
  {
    step: "S2",
    title: "Arsenal + Turbo Boost",
    color: "bg-[#E2D9BC]",
    metrics: "6k à 14k vues",
    detail: "Posts coordonnés, stories, puis campagne Meta géolocalisée opérée par Popey.",
  },
  {
    step: "S3",
    title: "Activation Chirurgicale",
    color: "bg-[#F8D7DA]",
    metrics: "40 contacts | 4 à 12 réponses",
    detail: "Sprint des 20, appels duo, lead magnet et suivi dans le Synergy Tracker.",
  },
  {
    step: "S4",
    title: "Arbitrage + Scale",
    color: "bg-[#CDEAC0]",
    metrics: "2 à 5 closings",
    detail: "Closing, preuve ROI, split des revenus et entrée dans la Sphère à 490€/mois.",
  },
];

const sphereClusters = [
  {
    title: "Cluster 1 — Transaction & Finance",
    roles: "Entrée d'argent, financement, structuration",
  },
  {
    title: "Cluster 2 — Métamorphose du lieu",
    roles: "Vision, travaux, cuisine, domotique",
  },
  {
    title: "Cluster 3 — Équipement & Esthétique",
    roles: "Sur-mesure, art, ambiance, design",
  },
  {
    title: "Cluster 4 — Intendance & Prestige",
    roles: "Service récurrent, réception, gestion haut de gamme",
  },
];

const wellnessClusters = [
  {
    title: "Cluster 1 — Corps (Noyau dur)",
    roles: "Coach sportif, Nutritionniste, Ostéopathe, Drainage/Massage sportif, Sommeil/Bio-hacking",
  },
  {
    title: "Cluster 2 — Mindset & Mental",
    roles: "Coach de vie, Hypnothérapeute, Psychologue du travail, Yoga/Pilates",
  },
  {
    title: "Cluster 3 — Image & Apparence",
    roles: "Coach en image, Esthétique high-tech, Coiffeur visagiste, Photographe, Dentiste esthétique",
  },
  {
    title: "Cluster 4 — Lifestyle & Business",
    roles: "Expert-comptable, CGP, Agent immobilier, Chef à domicile, Conciergerie, Coach charisme",
  },
];

export default function PopeyHumanTestPage() {
  const miroirSection = sections.find((section) => section.id === "miroir");
  const gapSection = sections.find((section) => section.id === "gap");
  const methodSection = sections.find((section) => section.id === "method");
  const sphereSection = sections.find((section) => section.id === "sphere");

  const promiseBlocks = [
    "Monter un binôme métier complémentaire avec une offre commune monétisable.",
    "Activer vos audiences existantes avec un plan d'exécution simple et traçable.",
    "Transformer le réseau dormant en RDV qualifiés, closings et revenus concrets.",
    "Passer du test Mois 1 à la Sphère des 20 pour scaler votre CA.",
  ];

  const faqItems = [
    {
      q: "Est-ce que Popey peut vraiment augmenter mon CA ?",
      a: "Oui, parce que le système est structuré, traçable et orienté résultats. Vous ne dépendez plus d'actions isolées, vous activez un flux organisé.",
    },
    {
      q: "Je suis déjà expérimenté, c'est utile pour moi ?",
      a: "Oui. Le but n'est pas d'apprendre la théorie, mais d'optimiser votre posture, vos synergies et votre capacité à convertir des opportunités en revenus.",
    },
    {
      q: "En combien de temps je vois des premiers résultats ?",
      a: "Le Mois 1 sert de preuve de concept : visibilité, prises de contact qualifiées, premiers closings et pipeline à forte valeur.",
    },
  ];

  return (
    <main className={cn("min-h-screen bg-[#E2D9BC] text-[#2E130C] overflow-hidden", titanOne.variable, pacifico.variable, poppins.variable, "font-poppins")}>
      <section className="relative py-20 md:py-24 border-b-4 border-[#2E130C]">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(#2E130C 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto text-center">
            <p className="inline-block text-xs uppercase tracking-widest font-black bg-[#D2E8FF] border-2 border-[#2E130C] rounded-full px-4 py-2">
              Popey Academy — Système de synergies monétisables
            </p>
            <h1 className="mt-8 text-4xl md:text-6xl lg:text-7xl font-titan leading-[1.05]">
              Cessez de quémander des clients.
              <br />
              <span className="text-[#B20B13]">Commencez à orchestrer des actifs.</span>
            </h1>
            <p className="mt-6 text-lg md:text-2xl font-bold max-w-4xl mx-auto">
              Comment transformer un simple partenariat en machine à 40 000€ de CA additionnel par an grâce à Popey Academy.
            </p>
          </div>
          <div className="mt-10 max-w-5xl mx-auto">
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: "Mois 1", value: "149€", desc: "Preuve de concept guidée." },
                { label: "Mois 2+", value: "490€", desc: "Sphère des 20 en scale." },
                { label: "Objectif", value: "CA +", desc: "Réseau structuré et traçable." },
              ].map((card) => (
                <div key={card.label} className="bg-white rounded-3xl border-4 border-[#2E130C] p-5 shadow-[8px_8px_0px_0px_#2E130C]">
                  <p className="text-[11px] uppercase tracking-widest font-black text-[#B20B13]">{card.label}</p>
                  <p className="text-3xl font-titan mt-2">{card.value}</p>
                  <p className="font-bold mt-2 text-sm text-[#2E130C]/80">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 border-b-4 border-[#2E130C] bg-[#D2E8FF]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Le problème</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-titan">Vous avez la compétence, mais votre réseau ne convertit pas assez.</h2>
            <div className="mt-8 grid md:grid-cols-2 gap-4">
              {(miroirSection?.paragraphs ?? []).slice(0, 4).map((item) => (
                <div key={item} className="rounded-2xl border-2 border-[#2E130C] bg-white p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                  <p className="font-bold leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
            {gapSection && (
              <div className="mt-5 rounded-2xl border-2 border-[#2E130C] bg-[#2E130C] text-[#E2D9BC] p-4">
                <p className="text-xs uppercase tracking-widest font-black text-[#D2E8FF]">{gapSection.title}</p>
                <p className="mt-2 font-titan text-2xl">54 000€ laissés sur la table / an</p>
                <p className="mt-1 text-sm font-bold text-[#E2D9BC]/90">Le manque à gagner est concret quand le réseau reste informel.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-16 border-b-4 border-[#2E130C]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">La promesse</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-titan">Un système concret pour transformer votre réseau en chiffre d&apos;affaires.</h2>
            <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {promiseBlocks.map((item, idx) => (
                <div key={item} className="rounded-2xl border-2 border-[#2E130C] bg-white p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                  <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">{`0${idx + 1}`}</p>
                  <p className="mt-2 font-bold leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="vision" className="py-16 bg-[#D2E8FF] border-b-4 border-[#2E130C]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
            <div className="bg-white rounded-3xl border-4 border-[#2E130C] p-8 shadow-[8px_8px_0px_0px_#2E130C]">
              <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">SECTION 1 — LA VISION</p>
              <h2 className="mt-4 text-3xl md:text-5xl font-titan">Le problème n&apos;est pas le manque de talent.</h2>
              <p className="mt-4 text-lg font-bold leading-relaxed">
                Les coachs, nutritionnistes, agents immo et experts terrain saturent parce qu&apos;ils vendent leur temps à l&apos;unité et chassent des leads froids.
              </p>
              <p className="mt-3 text-lg font-bold leading-relaxed">Popey Academy transforme ce chaos en système d&apos;exécution :</p>
              <ul className="mt-2 space-y-1 text-lg font-bold leading-relaxed">
                <li>- deux métiers complémentaires,</li>
                <li>- une offre commune,</li>
                <li>- des audiences activées,</li>
                <li>- un tunnel court,</li>
                <li>- un revenu traçable.</li>
              </ul>
            </div>
            <div className="rounded-3xl overflow-hidden border-4 border-[#2E130C] shadow-[8px_8px_0px_0px_#2E130C]">
              <img src="https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=1600&auto=format&fit=crop" alt="Équipe Popey en session stratégique" className="w-full h-[430px] object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section id="fondateur" className="py-16 border-b-4 border-[#2E130C] bg-[#D2E8FF]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl border-4 border-[#2E130C] p-6 shadow-[8px_8px_0px_0px_#2E130C] h-fit">
              <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Qu&apos;est derrière Popey Academy</p>
              <h2 className="text-3xl font-titan mt-3">Fondateur Jean-Philippe Roth</h2>
              <div className="mt-5 rounded-2xl overflow-hidden border-4 border-[#2E130C]">
                <img src="/jeanphilipperoth.jpg" alt="Jean-Philippe Roth — Popey Academy" className="w-full h-[320px] object-cover" />
              </div>
              <p className="mt-5 font-bold leading-relaxed">7 entreprises pilotées. Même constat à chaque fois : sans système réseau, le CA plafonne.</p>
            </div>
            <div className="lg:col-span-2 space-y-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {founderProofs.map((proof) => (
                  <div key={proof.label} className="rounded-2xl border-2 border-[#2E130C] bg-[#D2E8FF] p-4 text-center hover:scale-[1.02] transition-transform">
                    <p className="text-3xl font-titan text-[#B20B13]">{proof.value}</p>
                    <p className="text-[11px] uppercase tracking-widest font-black mt-1">{proof.label}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-3xl border-4 border-[#2E130C] bg-white p-6 shadow-[8px_8px_0px_0px_#2E130C]">
                <p className="text-sm font-black uppercase tracking-widest text-[#B20B13]">Preuve rapide</p>
                <p className="mt-2 font-bold">De Bangkok à Dubaï puis Bordeaux : retail, restauration et apps. La solution Popey est née du terrain, pas d&apos;une théorie.</p>
                <div className="mt-4 space-y-2">
                  <details className="rounded-xl border-2 border-[#2E130C] bg-[#E2D9BC] px-4 py-3">
                    <summary className="cursor-pointer font-black">Voir les 7 entreprises</summary>
                    <ul className="mt-3 space-y-2 text-sm font-bold">{ventures.map((venture) => <li key={venture}>{venture}</li>)}</ul>
                  </details>
                  <details className="rounded-xl border-2 border-[#2E130C] bg-[#E2D9BC] px-4 py-3">
                    <summary className="cursor-pointer font-black">Voir les repères clés</summary>
                    <ul className="mt-3 space-y-2 text-sm font-bold">{founderMilestones.map((milestone) => <li key={milestone}>{milestone}</li>)}</ul>
                  </details>
                  <details className="rounded-xl border-2 border-[#2E130C] bg-[#E2D9BC] px-4 py-3">
                    <summary className="cursor-pointer font-black">Voir les apprentissages produit</summary>
                    <ul className="mt-3 space-y-2 text-sm font-bold">{productLearnings.map((learning) => <li key={learning}>{learning}</li>)}</ul>
                  </details>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 border-b-4 border-[#2E130C]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Le process</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-titan">Une méthode structurée pour exécuter, pas improviser.</h2>
            <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { num: "01", label: "Posture", text: "Vous passez de l'aléatoire au pilotage de vos synergies." },
                { num: "02", label: "Compréhension", text: "Vous savez où se crée la valeur dans le duo et dans la sphère." },
                { num: "03", label: "Structure", text: "Vous transformez l'offre en tunnel clair avec scripts et actifs." },
                { num: "04", label: "Mise en pratique", text: "Activation terrain, prises de contact, qualification, suivi." },
                { num: "05", label: "Feedback", text: "Mesure des actions, ajustements rapides, décisions orientées ROI." },
                { num: "06", label: "Durabilité", text: "Répétition du modèle et passage au scale avec la Sphère des 20." },
              ].map((step) => (
                <div key={step.num} className="rounded-2xl border-2 border-[#2E130C] bg-white p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                  <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">{step.num}</p>
                  <p className="mt-2 font-titan text-2xl">{step.label}</p>
                  <p className="mt-2 font-bold text-sm leading-relaxed">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {methodSection && (
        <section id="method" className="py-16 border-b-4 border-[#2E130C] bg-[#D2E8FF]">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto bg-white rounded-3xl border-4 border-[#2E130C] p-8 shadow-[8px_8px_0px_0px_#2E130C]">
              <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">{methodSection.title}</p>
              <h2 className="mt-4 text-3xl md:text-5xl font-titan leading-tight">{methodSection.heading}</h2>
              <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {methodTimeline.map((item) => (
                  <div key={item.step} className={cn("rounded-2xl border-2 border-[#2E130C] p-4", item.color)}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-black uppercase tracking-widest text-[#B20B13]">{item.step}</span>
                      <span className="text-[11px] font-black bg-white border border-[#2E130C] rounded-full px-2 py-1">{item.metrics}</span>
                    </div>
                    <p className="mt-2 font-titan text-xl leading-tight">{item.title}</p>
                    <p className="mt-2 text-sm font-bold text-[#2E130C]/90">{item.detail}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border-2 border-[#2E130C] bg-[#2E130C] text-[#E2D9BC] p-4">
                <p className="text-xs uppercase tracking-widest font-black text-[#D2E8FF]">Fin du Mois 1 — Projection de gains</p>
                <p className="mt-2 font-titan text-xl">3 clients closés = 1 800€ immédiats</p>
                <p className="mt-1 font-bold text-sm text-[#E2D9BC]/90">+ potentiel de 3 clients à 25 000€ chacun = 75 000€ de pipeline.</p>
                <p className="mt-1 font-bold text-sm text-[#E2D9BC]/90">Le Mois 1 n&apos;est pas une dépense : c&apos;est une preuve de ROI et un levier de CA futur.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {sphereSection && (
        <section id="sphere" className="py-16 border-b-4 border-[#2E130C]">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto bg-white rounded-3xl border-4 border-[#2E130C] p-8 shadow-[8px_8px_0px_0px_#2E130C]">
              <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">{sphereSection.title}</p>
              <h2 className="mt-4 text-3xl md:text-5xl font-titan leading-tight">{sphereSection.heading}</h2>
              <div className="mt-6 space-y-4">
                <details open className="rounded-2xl border-2 border-[#2E130C] bg-[#E2D9BC] p-4">
                  <summary className="cursor-pointer font-black text-[#B20B13]">Exemple 1 — Sphère Patrimoine & Art de vivre</summary>
                  <div className="mt-4 grid sm:grid-cols-2 gap-3">
                    {sphereClusters.map((cluster) => (
                      <div key={cluster.title} className="rounded-2xl border-2 border-[#2E130C] bg-[#D2E8FF]/40 p-4">
                        <p className="text-sm font-black text-[#B20B13]">{cluster.title}</p>
                        <p className="mt-2 text-sm font-bold leading-relaxed">{cluster.roles}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-2xl border-2 border-[#2E130C] bg-[#2E130C] text-[#E2D9BC] p-4">
                    <p className="text-xs uppercase tracking-widest font-black text-[#D2E8FF]">Flux</p>
                    <p className="mt-1 font-titan text-xl">Vente immo → 5 à 10 contrats satellites</p>
                  </div>
                </details>
                <details className="rounded-2xl border-2 border-[#2E130C] bg-[#D2E8FF] p-4">
                  <summary className="cursor-pointer font-black text-[#B20B13]">Exemple 2 — Sphère Bien-être & Santé</summary>
                  <div className="mt-4 grid sm:grid-cols-2 gap-3">
                    {wellnessClusters.map((cluster) => (
                      <div key={cluster.title} className="rounded-2xl border-2 border-[#2E130C] bg-white p-4">
                        <p className="text-sm font-black text-[#B20B13]">{cluster.title}</p>
                        <p className="mt-2 text-sm font-bold leading-relaxed">{cluster.roles}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-2xl border-2 border-[#2E130C] bg-[#2E130C] text-[#E2D9BC] p-4">
                    <p className="text-xs uppercase tracking-widest font-black text-[#D2E8FF]">Flux circulaire</p>
                    <p className="mt-1 font-titan text-xl">Comptable stress → Coach sportif → Styliste → Photographe → retour réseau</p>
                  </div>
                  <ul className="mt-3 space-y-1 text-sm font-bold">
                    <li>• Marges élevées : prestations 500€ à 5 000€.</li>
                    <li>• Commissions réelles : 10% crée un vrai levier.</li>
                    <li>• Barrière à l&apos;entrée : 20 métiers inter-dépendants.</li>
                  </ul>
                </details>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="py-16 border-b-4 border-[#2E130C] bg-[#D2E8FF]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Questions fréquentes</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-titan">Objections et réponses</h2>
            <div className="mt-8 space-y-3">
              {faqItems.map((item) => (
                <details key={item.q} className="rounded-2xl border-2 border-[#2E130C] bg-white p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                  <summary className="cursor-pointer font-black">{item.q}</summary>
                  <p className="mt-3 font-bold text-[#2E130C]/90">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="cta" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto bg-[#2E130C] text-[#E2D9BC] rounded-[2.5rem] border-4 border-[#B20B13] p-8 md:p-12 shadow-[10px_10px_0px_0px_#7A0000] text-center">
            <p className="text-xs uppercase tracking-widest font-black text-[#D2E8FF]">Audit d&apos;entrée</p>
            <h2 className="mt-4 text-3xl md:text-5xl font-titan leading-tight">
              Vous voulez un réseau qui paie vos factures, pas un groupe WhatsApp décoratif ?
            </h2>
            <p className="mt-6 text-lg font-bold leading-relaxed max-w-3xl mx-auto text-[#E2D9BC]/90">
              Candidater à l&apos;Audit de Synergie. On évalue votre expertise, votre audience, votre potentiel de complémentarité et votre discipline de réciprocité.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/programme-commando/postuler" className="inline-flex items-center justify-center rounded-xl border-2 border-[#2E130C] bg-[#B20B13] px-8 py-4 text-[#E2D9BC] font-titan shadow-[4px_4px_0px_0px_#2E130C] hover:bg-[#7A0000]">
                Candidater à l&apos;Audit de Synergie
              </Link>
              <Link href="/" className="inline-flex items-center justify-center rounded-xl border-2 border-[#E2D9BC] px-8 py-4 text-[#E2D9BC] font-bold hover:bg-[#E2D9BC]/10">
                Retour à l&apos;accueil actuelle
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
