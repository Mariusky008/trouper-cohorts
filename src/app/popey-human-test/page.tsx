 "use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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


const ventures = [
  "1) Import / Export riz et sucre (Bangkok) — 1999/2000",
  "2) Lolypop SARL (Paris) — 2003/2006 : 500 distributeurs automatiques de friandises et boissons",
  "3) Jack's Express (Dax, Pau, Dax) — 2007/2011 : 3 restaurants de restauration rapide",
  "4) Au Petit Paris (Dubaï) — 2013/2014 : chaîne de boulangeries",
  "5) My-Sign (Dubaï) — 2014/2015 : application de reconnaissance de logos type QR code",
  "6) 1TAM (Dubaï) — 2015/2017 : réseau social vidéo gamifié",
  "7) Elyot (Bordeaux) — depuis septembre 2017 : socialisation instantanée et géolocalisée",
];


const heritageSphereClusters = [
  {
    title: "Cluster 1 — Transaction & Finance (Les portes d'entrée)",
    purpose: "Ceux qui savent en premier quand l'argent arrive.",
    roles: [
      { id: "chasseur-luxe", name: "Chasseur Immobilier de Luxe", binomes: ["Architecte d'Intérieur", "Cuisiniste Haut de Gamme", "Conciergerie Privée"], deal: 22000, dealType: "mission de chasse immobilière premium" },
      { id: "courtier-private", name: "Courtier en Prêt Immobilier Private Banking", binomes: ["Avocat Fiscaliste", "Maître d'Œuvre", "CGP"], deal: 18000, dealType: "montage de financement haut de gamme" },
      { id: "cgp", name: "Conseiller en Gestion de Patrimoine (CGP)", binomes: ["Avocat Fiscaliste", "Art Advisor", "Spécialiste Cave à Vin"], deal: 30000, dealType: "mandat d'allocation patrimoniale" },
      { id: "avocat-fiscaliste", name: "Avocat Fiscaliste", binomes: ["CGP", "Assureur Objets de Valeur", "Chasseur Immobilier de Luxe"], deal: 25000, dealType: "audit et structuration fiscale" },
      { id: "assureur-valeur", name: "Assureur Objets de Valeur", binomes: ["Galeriste / Art Advisor", "Antiquaire", "Conciergerie Privée"], deal: 15000, dealType: "contrat d'assurance objets de valeur" },
    ],
  },
  {
    title: "Cluster 2 — Métamorphose du Lieu (Le gros budget)",
    purpose: "Là où le client dépense 20% à 50% de la valeur du bien.",
    roles: [
      { id: "architecte-interieur", name: "Architecte d'Intérieur", binomes: ["Cuisiniste Haut de Gamme", "Maître d'Œuvre", "Concepteur Lumière"], deal: 28000, dealType: "mission de conception intérieure complète" },
      { id: "maitre-oeuvre", name: "Maître d'Œuvre / Contractant Général", binomes: ["Architecte d'Intérieur", "Expert Domotique & Sécurité", "Paysagiste Concepteur"], deal: 32000, dealType: "pilotage global de rénovation" },
      { id: "paysagiste", name: "Paysagiste Concepteur / Piscine de prestige", binomes: ["Maître d'Œuvre", "Concepteur Lumière", "Chef à Domicile"], deal: 17000, dealType: "projet extérieur et piscine prestige" },
      { id: "cuisiniste", name: "Cuisiniste Haut de Gamme", binomes: ["Architecte d'Intérieur", "Ébéniste / Menuisier d'Art", "Chef à Domicile"], deal: 24000, dealType: "cuisine sur mesure premium" },
      { id: "domotique", name: "Expert en Domotique & Sécurité", binomes: ["Maître d'Œuvre", "Concepteur Lumière", "Conciergerie Privée"], deal: 19000, dealType: "installation domotique et sécurité" },
    ],
  },
  {
    title: "Cluster 3 — Équipement & Esthétique (Le raffinement)",
    purpose: "Le sur-mesure, l'exclusif, la valeur perçue.",
    roles: [
      { id: "ebeniste", name: "Ébéniste / Menuisier d'Art", binomes: ["Architecte d'Intérieur", "Antiquaire", "Cuisiniste Haut de Gamme"], deal: 14000, dealType: "mobilier sur mesure en atelier d'art" },
      { id: "art-advisor", name: "Galeriste / Art Advisor", binomes: ["Assureur Objets de Valeur", "Antiquaire", "CGP"], deal: 26000, dealType: "accompagnement d'acquisition d'œuvres" },
      { id: "hifi-home-cinema", name: "Spécialiste Hi-Fi & Home Cinéma", binomes: ["Concepteur Lumière", "Domotique & Sécurité", "Conciergerie Privée"], deal: 12000, dealType: "installation home cinéma sur mesure" },
      { id: "lighting-designer", name: "Concepteur Lumière (Lighting Designer)", binomes: ["Architecte d'Intérieur", "Spécialiste Hi-Fi & Home Cinéma", "Paysagiste Concepteur"], deal: 11000, dealType: "design lumière intérieur/extérieur" },
      { id: "antiquaire", name: "Antiquaire / Expert Mobilier Design", binomes: ["Art Advisor", "Ébéniste", "Assureur Objets de Valeur"], deal: 21000, dealType: "sélection de mobilier design de collection" },
    ],
  },
  {
    title: "Cluster 4 — Intendance & Prestige (Le récurrent)",
    purpose: "Ceux qui gèrent le quotidien et multiplient les opportunités.",
    roles: [
      { id: "conciergerie", name: "Conciergerie Privée", binomes: ["Chef à Domicile", "Domotique & Sécurité", "Spécialiste Cave à Vin"], deal: 16000, dealType: "forfait annuel d'intendance premium" },
      { id: "chef-domicile", name: "Chef à Domicile", binomes: ["Conciergerie Privée", "Cuisiniste Haut de Gamme", "Spécialiste Cave à Vin"], deal: 9000, dealType: "pack réceptions privées à domicile" },
      { id: "demenageur-premium", name: "Déménageur Premium / Garde-meuble sécurisé", binomes: ["Home Organizer", "Conciergerie Privée", "Assureur Objets de Valeur"], deal: 8000, dealType: "déménagement sécurisé haut de gamme" },
      { id: "home-organizer", name: "Home Organizer", binomes: ["Conciergerie Privée", "Ébéniste / Menuisier d'Art", "Architecte d'Intérieur"], deal: 7000, dealType: "organisation complète d'espaces résidentiels" },
      { id: "sommelier", name: "Spécialiste Cave à Vin / Sommelier privé", binomes: ["Chef à Domicile", "CGP", "Conciergerie Privée"], deal: 13000, dealType: "création et gestion de cave privée" },
    ],
  },
];

export default function PopeyHumanTestPage() {
  const allHeritageRoles = useMemo(() => heritageSphereClusters.flatMap((cluster) => cluster.roles), []);
  const [selectedRoleId, setSelectedRoleId] = useState(allHeritageRoles[0]?.id ?? "");
  const [selectedStage, setSelectedStage] = useState<"m1" | "m2" | "m3">("m1");
  const [networkRevenue, setNetworkRevenue] = useState(() => {
    if (typeof window === "undefined") {
      return 500;
    }
    return Number(window.sessionStorage.getItem("popey_network_revenue") ?? 500);
  });
  const [targetRevenue, setTargetRevenue] = useState(() => {
    if (typeof window === "undefined") {
      return 5000;
    }
    return Number(window.sessionStorage.getItem("popey_target_revenue") ?? 5000);
  });
  const selectedRole = useMemo(
    () => allHeritageRoles.find((role) => role.id === selectedRoleId) ?? allHeritageRoles[0],
    [allHeritageRoles, selectedRoleId],
  );
  const rolePartners = useMemo(
    () => allHeritageRoles.filter((role) => role.id !== selectedRole?.id),
    [allHeritageRoles, selectedRole?.id],
  );
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const partnerProfiles = useMemo(
    () =>
      rolePartners.map((role, index) => ({
        ...role,
        firstName: [
          "Camille",
          "Nicolas",
          "Emma",
          "Romain",
          "Sarah",
          "Julien",
          "Nora",
          "Thomas",
          "Inès",
          "Léo",
          "Maya",
          "Arthur",
          "Chloé",
          "Maxime",
          "Lina",
          "Hugo",
          "Sonia",
          "Yanis",
          "Claire",
        ][index % 19],
      })),
    [rolePartners],
  );
  const selectedPartner = useMemo(
    () => partnerProfiles.find((role) => role.id === selectedPartnerId) ?? partnerProfiles[0],
    [partnerProfiles, selectedPartnerId],
  );
  const deltaRevenue = Math.max(targetRevenue - networkRevenue, 0);
  const deltaYearly = deltaRevenue * 12;
  const averageDeal = selectedRole?.deal ?? 12000;
  const commissionPerDeal = Math.round(averageDeal * 0.1);
  const dealsNeeded = Math.max(Math.ceil(deltaRevenue / averageDeal), 1);
  const referralsNeeded = Math.max(Math.ceil(deltaRevenue / commissionPerDeal), 1);
  const progressionRate = targetRevenue > 0 ? Math.min(Math.round((networkRevenue / targetRevenue) * 100), 100) : 0;
  const scenarioRates = [
    { label: "Conservateur", pct: 30 },
    { label: "Réaliste", pct: 55 },
    { label: "Ambitieux", pct: 80 },
  ];
  const macroNodes = useMemo(
    () =>
      allHeritageRoles.map((role, index) => {
        const angle = (index / allHeritageRoles.length) * Math.PI * 2 - Math.PI / 2;
        const radius = 38;
        return {
          ...role,
          x: 50 + Math.cos(angle) * radius,
          y: 50 + Math.sin(angle) * radius,
        };
      }),
    [allHeritageRoles],
  );
  const macroOrbitNodes = useMemo(() => {
    if (!macroNodes.length) return [];
    const slots = 8;
    const sampled = Array.from({ length: slots }, (_, slot) => macroNodes[Math.floor((slot * macroNodes.length) / slots)]);
    return sampled.filter((node, index) => sampled.findIndex((candidate) => candidate.id === node.id) === index);
  }, [macroNodes]);
  const [activeMacroIndex, setActiveMacroIndex] = useState(0);
  const activeMacroNode = macroOrbitNodes[activeMacroIndex % Math.max(macroOrbitNodes.length, 1)];
  const transferMode = activeMacroIndex % 2 === 0 ? "message" : "call";
  const transferLabel = transferMode === "message" ? "Message envoyé au client" : "Numéro transmis pour appel";
  const transferDetail = transferMode === "message" ? "Intro WhatsApp + contact qualifié" : "Appel de recommandation au nom du partenaire";
  const getRoleSymbol = (name: string) =>
    name
      .split(/[\s/&-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();

  useEffect(() => {
    window.sessionStorage.setItem("popey_network_revenue", String(networkRevenue));
    window.sessionStorage.setItem("popey_target_revenue", String(targetRevenue));
  }, [networkRevenue, targetRevenue]);

  useEffect(() => {
    if (!macroOrbitNodes.length) return;
    const timer = window.setInterval(() => {
      setActiveMacroIndex((prev) => (prev + 1) % macroOrbitNodes.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [macroOrbitNodes.length]);

  const faqItems = [
    {
      q: "Est-ce que Popey peut vraiment augmenter mon CA ?",
      a: "Oui. Popey structure vos synergies en actions hebdo, suivi et objectifs chiffrés.",
      proof: `Mois 1 visé pour ${selectedRole?.name} : 3 closings à 600€ = 1 800€ + pipeline 75 000€.`,
      action: "Audit de complémentarité + plan d'exécution S1 à S4.",
    },
    {
      q: "Je suis déjà expérimenté, est-ce utile pour moi ?",
      a: "Oui, car le sujet n'est pas votre compétence métier : c'est l'orchestration de votre écosystème.",
      proof: `Passage du solo (${selectedRole?.name}) au duo, puis du duo à la Sphère des 20.`,
      action: "Positionnement de votre rôle et de votre valeur dans le flux global.",
    },
    {
      q: "En combien de temps je vois des premiers résultats ?",
      a: "Les premiers signaux arrivent dès le Mois 1 : visibilité, réponses qualifiées et premiers closings.",
      proof: "S2 : 6k–14k vues, S3 : 4 à 12 réponses, S4 : premiers closings.",
      action: "Suivi hebdo pour corriger vite ce qui bloque.",
    },
    {
      q: "Et si je n'ai pas une grosse audience ?",
      a: "Ce n'est pas bloquant. Popey active d'abord les audiences chaudes des 2 partenaires, puis amplifie.",
      proof: "Le levier vient de la complémentarité + du script + du tracking.",
      action: "Plan contenu minimal + activation ciblée + relances guidées.",
    },
    {
      q: "Comment éviter les partenariats qui ne donnent rien ?",
      a: "Popey filtre les duos sur la complémentarité réelle, la réciprocité et la capacité d'exécution.",
      proof: "Chaque étape a un livrable concret, pas de promesse floue.",
      action: "Critères d'entrée + protocole de suivi commun.",
    },
    {
      q: "Pourquoi rester après le Mois 1 ?",
      a: "Parce que le Mois 1 valide le moteur, et la Sphère des 20 multiplie les opportunités.",
      proof: `Pour ${selectedRole?.name}, 1 entrée client peut déclencher 5 à 10 contrats satellites.`,
      action: `Passage à 490€/mois pour connecter ${selectedRole?.name} aux 19 autres métiers.`,
    },
  ];

  return (
    <main className={cn("min-h-screen bg-[#E2D9BC] text-[#2E130C] overflow-hidden", titanOne.variable, pacifico.variable, poppins.variable, "font-poppins")}>
      <section className="relative py-20 md:py-24 border-b-4 border-[#2E130C]">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(#2E130C 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="mt-8 text-4xl md:text-6xl lg:text-7xl font-titan leading-[1.05]">
              Popey vous aide à trouver les bons partenaires business pour gagner plus avec les mêmes clients.
            </h1>
            <p className="mt-6 text-base md:text-xl font-bold max-w-5xl mx-auto">
              Exemple : si vous êtes agent immobilier, on peut vous associer à un architecte d&apos;intérieur, un CGP, un courtier ou un cuisiniste etc... pour créer des recommandations, des offres communes et des commissions récurrentes autour du même client.
            </p>
            <div className="mt-8">
              <Link href="/programme-commando/postuler" className="inline-flex items-center justify-center rounded-xl border-2 border-[#2E130C] bg-[#B20B13] px-8 py-4 text-[#E2D9BC] font-titan shadow-[4px_4px_0px_0px_#2E130C] hover:bg-[#7A0000]">
                Postuler à l&apos;Audit de Synergie
              </Link>
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
                Chasseur immo de luxe, CGP, architecte d&apos;intérieur, cuisiniste haut de gamme : chacun est fort seul, mais la croissance plafonne sans orchestration commune.
              </p>
              <p className="mt-3 text-lg font-bold leading-relaxed">Popey Academy transforme ce potentiel en système d&apos;exécution :</p>
              <ul className="mt-2 space-y-1 text-lg font-bold leading-relaxed">
                <li>- métiers complémentaires de la même sphère,</li>
                <li>- offres liées autour d&apos;un client cible unique,</li>
                <li>- recommandations circulaires traçables,</li>
                <li>- commission claire à chaque apport d&apos;affaire,</li>
                <li>- revenu additionnel piloté mois après mois.</li>
              </ul>
            </div>
            <div className="rounded-3xl overflow-hidden border-4 border-[#2E130C] shadow-[8px_8px_0px_0px_#2E130C]">
              <img src="https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=1600&auto=format&fit=crop" alt="Équipe Popey en session stratégique" className="w-full h-[430px] object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 border-b-4 border-[#2E130C] bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Concrètement</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-titan">Concrètement, Popey c&apos;est quoi ?</h2>
            <p className="mt-4 text-lg font-bold max-w-5xl">
              Popey n&apos;est pas un simple réseau. C&apos;est un système de croissance par synergies business.
            </p>
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              <div className="rounded-2xl border-2 border-[#2E130C] bg-[#D2E8FF] p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">MOIS 1 — Votre premier partenaire rentable</p>
                <p className="mt-2 text-sm font-bold leading-relaxed">On vous associe à un professionnel complémentaire qui vend à la même clientèle que vous.</p>
                <p className="mt-2 text-sm font-bold leading-relaxed">Ensemble, on structure une première collaboration simple à monétiser :</p>
                <ul className="mt-2 space-y-1 text-sm font-bold leading-relaxed">
                  <li>• recommandations</li>
                  <li>• offre commune</li>
                  <li>• commission</li>
                  <li>• messages prêts à l&apos;emploi</li>
                </ul>
              </div>
              <div className="rounded-2xl border-2 border-[#2E130C] bg-[#E2D9BC] p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">MOIS 2 — On ajoute 2 à 3 nouveaux métiers utiles</p>
                <p className="mt-2 text-sm font-bold leading-relaxed">Une fois la première collaboration lancée, on vous aide à ouvrir 2 à 3 nouvelles portes autour du même client :</p>
                <ul className="mt-2 space-y-1 text-sm font-bold leading-relaxed">
                  <li>• un apporteur d&apos;affaires</li>
                  <li>• un partenaire de transformation</li>
                  <li>• un métier qui augmente le panier moyen</li>
                </ul>
              </div>
              <div className="rounded-2xl border-2 border-[#2E130C] bg-[#F8D7DA] p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">MOIS 3 — Votre cercle Popey commence à tourner</p>
                <p className="mt-2 text-sm font-bold leading-relaxed">
                  Vous accédez progressivement à 19 autres professionnels sélectionnés autour du même client cible (ex : CGP, architecte, courtier, fiscaliste, cuisiniste, conciergerie…)
                </p>
                <p className="mt-2 text-sm font-bold leading-relaxed">À partir de là, vous pouvez :</p>
                <ul className="mt-2 space-y-1 text-sm font-bold leading-relaxed">
                  <li>• recevoir des recommandations</li>
                  <li>• en envoyer</li>
                  <li>• toucher des commissions</li>
                  <li>• créer des offres croisées</li>
                  <li>• faire tourner votre réseau comme un moteur de croissance</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 border-b-4 border-[#2E130C]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto bg-white rounded-3xl border-4 border-[#2E130C] p-6 md:p-8 shadow-[8px_8px_0px_0px_#2E130C]">
            <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">L&apos;écosystème macro</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-titan">Les 20 métiers complémentaires autour du client cible.</h2>
            <p className="mt-3 text-lg font-bold max-w-4xl">
              Un seul représentant par métier. Zéro concurrence interne. Un flux de recommandations qui tourne en continu autour du même client. Imaginez maintenant avec 100 clients !
            </p>
            <div className="mt-6 rounded-2xl border-2 border-[#2E130C] bg-[#E2D9BC] p-4">
              <div className="relative aspect-square md:aspect-[16/10] w-full overflow-hidden rounded-xl border-2 border-[#2E130C] bg-white">
                <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
                  <defs>
                    <marker id="macroArrow" markerWidth="4" markerHeight="4" refX="3.4" refY="2" orient="auto">
                      <path d="M0,0 L4,2 L0,4 Z" fill="#2E130C" />
                    </marker>
                  </defs>
                  <circle cx="50" cy="50" r="22" fill="none" stroke="#2E130C" strokeOpacity="0.1" strokeWidth="0.3" />
                  <circle cx="50" cy="50" r="36" fill="none" stroke="#2E130C" strokeOpacity="0.18" strokeWidth="0.45" strokeDasharray="1.5 1.5" />
                  {macroOrbitNodes.map((node) => (
                    <line key={`l-${node.id}`} x1="50" y1="50" x2={node.x} y2={node.y} stroke="#2E130C" strokeOpacity={activeMacroNode?.id === node.id ? "0.9" : "0.2"} strokeWidth={activeMacroNode?.id === node.id ? "0.7" : "0.3"} />
                  ))}
                  {macroOrbitNodes.map((node, index) => {
                    const target = macroOrbitNodes[(index + 1) % macroOrbitNodes.length];
                    const highlighted = activeMacroNode?.id === node.id;
                    return (
                      <line
                        key={`cycle-${node.id}`}
                        x1={node.x}
                        y1={node.y}
                        x2={target?.x}
                        y2={target?.y}
                        stroke={highlighted ? "#B20B13" : "#2E130C"}
                        strokeOpacity={highlighted ? "0.75" : "0.26"}
                        strokeWidth={highlighted ? "0.52" : "0.26"}
                        markerEnd="url(#macroArrow)"
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0">
                  {macroOrbitNodes.map((node) => (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => setSelectedRoleId(node.id)}
                      className="absolute -translate-x-1/2 -translate-y-1/2 group"
                      style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    >
                      <div className={cn("h-12 w-12 md:h-14 md:w-14 rounded-full border-2 flex items-center justify-center text-[11px] md:text-xs font-black transition-all", activeMacroNode?.id === node.id ? "border-[#B20B13] bg-[#B20B13] text-[#E2D9BC] scale-110 shadow-[0_0_0_5px_rgba(178,11,19,0.22)]" : selectedRole?.id === node.id ? "border-[#2E130C] bg-[#2E130C] text-[#E2D9BC]" : "border-[#2E130C] bg-white text-[#2E130C] group-hover:bg-[#D2E8FF]")}>
                        {getRoleSymbol(node.name)}
                      </div>
                    </button>
                  ))}
                </div>
                {activeMacroNode && (
                  <div className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#2E130C] bg-[#B20B13] shadow-[0_0_0_4px_rgba(178,11,19,0.22)] transition-all duration-[1200ms]" style={{ left: `${activeMacroNode.x}%`, top: `${activeMacroNode.y}%` }} />
                )}
                <div className="absolute left-1/2 top-1/2 h-24 w-24 md:h-32 md:w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-[#2E130C] bg-[#2E130C] text-[#E2D9BC] flex items-center justify-center text-center px-3 animate-pulse">
                  <p className="font-titan text-lg md:text-2xl leading-tight">Client</p>
                </div>
                {activeMacroNode && (
                  <div
                    className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-[1200ms]"
                    style={{ left: `${(50 + activeMacroNode.x) / 2}%`, top: `${(50 + activeMacroNode.y) / 2}%` }}
                  >
                    <div className="rounded-xl border-2 border-[#2E130C] bg-[#E2D9BC] px-3 py-2 md:px-4 md:py-2.5 shadow-[4px_4px_0px_0px_#2E130C] min-w-[190px] md:min-w-[240px] text-center">
                      <p className="text-[10px] md:text-xs font-black text-[#B20B13] uppercase tracking-wide">{transferLabel}</p>
                      <p className="mt-0.5 text-[10px] md:text-[11px] font-bold">{transferDetail}</p>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-center">
                  <div className="rounded-full border-2 border-[#2E130C] bg-[#E2D9BC] px-4 py-2 text-[11px] font-black text-center">
                    Cible en cours : {activeMacroNode?.name}
                  </div>
                </div>
              </div>
              <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {macroNodes.map((node) => (
                  <div key={`sm-${node.id}`} className={cn("rounded-lg border px-2 py-1 text-[11px] font-black leading-tight flex items-center gap-2", activeMacroNode?.id === node.id ? "border-[#B20B13] bg-[#B20B13] text-[#E2D9BC]" : selectedRole?.id === node.id ? "border-[#2E130C] bg-[#2E130C] text-[#E2D9BC]" : "border-[#2E130C] bg-white")}>
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[9px]">{getRoleSymbol(node.name)}</span>
                    <span>{node.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 grid md:grid-cols-3 gap-3">
              <div className="rounded-xl border-2 border-[#2E130C] bg-[#D2E8FF] p-3">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Règle 1</p>
                <p className="mt-1 text-sm font-bold">1 seul représentant par métier pour éviter toute collision commerciale.</p>
              </div>
              <div className="rounded-xl border-2 border-[#2E130C] bg-[#E2D9BC] p-3">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Règle 2</p>
                <p className="mt-1 text-sm font-bold">Chaque métier nourrit le suivant avec un apport d&apos;affaire qualifié.</p>
              </div>
              <div className="rounded-xl border-2 border-[#2E130C] bg-[#F8D7DA] p-3">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Règle 3</p>
                <p className="mt-1 text-sm font-bold">Le client reste au centre, la valeur tourne en cercle et devient récurrente.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 border-b-4 border-[#2E130C] bg-[#D2E8FF]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Le problème</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-titan">Combien votre réseau vous rapporte vraiment chaque mois ?</h2>
            <div className="mt-6 grid lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border-2 border-[#2E130C] bg-white p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">1) CA réseau actuel / mois</p>
                <input
                  type="number"
                  min={0}
                  value={networkRevenue}
                  onChange={(e) => setNetworkRevenue(Number(e.target.value))}
                  className="mt-2 w-full rounded-xl border-2 border-[#2E130C] bg-[#E2D9BC] px-4 py-3 font-black"
                />
                <p className="mt-4 text-xs uppercase tracking-widest font-black text-[#B20B13]">2) CA additionnel visé / mois</p>
                <input
                  type="number"
                  min={0}
                  value={targetRevenue}
                  onChange={(e) => setTargetRevenue(Number(e.target.value))}
                  className="mt-2 w-full rounded-xl border-2 border-[#2E130C] bg-[#E2D9BC] px-4 py-3 font-black"
                />
                <p className="mt-4 text-sm font-bold">Delta mensuel à combler : {deltaRevenue.toLocaleString("fr-FR")}€</p>
                <p className="mt-1 text-sm font-bold">Delta annuel : {deltaYearly.toLocaleString("fr-FR")}€</p>
              </div>
              <div className="rounded-2xl border-2 border-[#2E130C] bg-[#2E130C] text-[#E2D9BC] p-5">
                <p className="text-xs uppercase tracking-widest font-black text-[#D2E8FF]">Projection personnalisée</p>
                <p className="mt-2 text-sm font-bold">Pour {selectedRole?.name}, vous pouvez viser :</p>
                <ul className="mt-3 space-y-1 text-sm font-bold text-[#E2D9BC]/90">
                  <li>• {dealsNeeded} deal(s) premium / mois à {averageDeal.toLocaleString("fr-FR")}€</li>
                  <li>• ou {referralsNeeded} recommandation(s) / mois à 10%</li>
                  <li>• progression actuelle : {progressionRate}% de votre objectif</li>
                </ul>
                <div className="mt-4 h-3 rounded-full bg-[#E2D9BC]/30 overflow-hidden">
                  <div className="h-full bg-[#B20B13]" style={{ width: `${progressionRate}%` }} />
                </div>
              </div>
            </div>
            <div className="mt-5 rounded-2xl border-2 border-[#2E130C] bg-white p-4 shadow-[6px_6px_0px_0px_#2E130C]">
              <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Lecture rapide</p>
              <p className="mt-1 text-sm font-bold">
                Votre objectif est clair : combler {deltaRevenue.toLocaleString("fr-FR")}€ / mois. La suite de la page vous montre, métier par métier, comment y arriver concrètement.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 border-b-4 border-[#2E130C]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Choisissez votre métier</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-titan">Selectionnez votre metier</h2>
            <p className="mt-3 font-bold text-[#2E130C]/90">
              Puis déroulez votre parcours personnalisé Mois 1, Mois 2 et Mois 3.
            </p>
            <div className="mt-4 rounded-2xl border-2 border-[#2E130C] bg-[#D2E8FF] p-4">
              <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Objectif dynamique</p>
              <p className="mt-1 font-bold">
                Vous voulez {targetRevenue.toLocaleString("fr-FR")}€ / mois de plus. Cette section montre comment {selectedRole?.name} peut combler ce delta.
              </p>
            </div>
            <div className="mt-6 rounded-2xl border-2 border-[#2E130C] bg-white p-5 shadow-[6px_6px_0px_0px_#2E130C]">
              <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Votre métier</p>
              <select
                value={selectedRole?.id}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="mt-3 w-full rounded-xl border-2 border-[#2E130C] bg-[#E2D9BC] px-4 py-3 font-black"
              >
                {allHeritageRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  { id: "m1", label: "Voir Mois 1" },
                  { id: "m2", label: "Voir Mois 2" },
                  { id: "m3", label: "Voir Mois 3" },
                ].map((step) => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setSelectedStage(step.id as "m1" | "m2" | "m3")}
                    className={cn(
                      "rounded-full border-2 border-[#2E130C] px-4 py-2 text-xs font-black uppercase tracking-wide",
                      selectedStage === step.id ? "bg-[#B20B13] text-[#E2D9BC]" : "bg-[#D2E8FF] text-[#2E130C]",
                    )}
                  >
                    {step.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border-2 border-[#2E130C] bg-[#2E130C] text-[#E2D9BC] p-5">
                <p className="text-xs uppercase tracking-widest font-black text-[#D2E8FF]">Parcours gamifié</p>
                <p className="mt-2 font-titan text-2xl">{selectedRole?.name}</p>
                {selectedStage === "m1" && (
                  <div className="mt-3 space-y-2 text-sm font-bold text-[#E2D9BC]/90">
                    <p>Mois 1 — Binôme idéal : {selectedRole?.binomes[0]}</p>
                    <p>Objectif simple : sortir une première offre vendable en 30 jours.</p>
                    <p>• Étape 1 : nous clarifions avec vous qui fait quoi dans le binôme et le résultat client promis.</p>
                    <p>• Étape 2 : nous construisons avec vous une offre d&apos;entrée facile à acheter (prix lisible, bénéfice clair), puis nous la mettons en place pour vous.</p>
                    <p>• Étape 3 : nous rédigeons vos textes prêts à copier-coller ou à réciter, nous vous fournissons les contenus réseaux sociaux et nous finançons la publicité locale pour toucher entre 6 000 et 10 000 personnes dans votre ville.</p>
                    <p>• Étape 4 : vous prenez des rendez-vous duo, puis vous closez vos premiers clients.</p>
                    <p>Résultat attendu : preuve que le système fonctionne, premier cash, et méthode réplicable.</p>
                  </div>
                )}
                {selectedStage === "m2" && (
                  <div className="mt-3 space-y-2 text-sm font-bold text-[#E2D9BC]/90">
                    <p>Mois 2 — Nouveau binôme : {selectedRole?.binomes[1]}</p>
                    <p>Objectif simple : doubler vos opportunités sans repartir de zéro.</p>
                    <p>• Vous gardez le même système Mois 1, mais vous l&apos;adaptez à ce 2e binôme.</p>
                    <p>• Vous lancez une nouvelle mini-offre conjointe avec une promesse ultra claire.</p>
                    <p>• Vous réactivez clients et prospects déjà intéressés avec une 2e porte d&apos;entrée.</p>
                    <p>• Vous cumulez 2 flux actifs : binôme 1 + binôme 2.</p>
                    <p>Résultat attendu : plus de rendez-vous qualifiés et montée en cadence.</p>
                  </div>
                )}
                {selectedStage === "m3" && (
                  <div className="mt-3 space-y-2 text-sm font-bold text-[#E2D9BC]/90">
                    <p>Mois 3 — Nouveau binôme : {selectedRole?.binomes[2]}</p>
                    <p>Objectif simple : transformer votre réseau en machine à recommandations.</p>
                    <p>• Vous activez le 3e binôme pour ouvrir un 3e point d&apos;entrée commercial.</p>
                    <p>• Vous branchez vos offres aux 19 partenaires pour créer un circuit d&apos;affaires continu.</p>
                    <p>• Chaque recommandation est traçable, avec commission claire pour chaque partie.</p>
                    <p>Résultat attendu : flux récurrent d&apos;opportunités et effet cumulatif mois après mois.</p>
                  </div>
                )}
                <div className="mt-4 rounded-xl border-2 border-[#E2D9BC]/40 bg-[#E2D9BC]/10 p-3">
                  <p className="text-xs uppercase tracking-widest font-black text-[#D2E8FF]">Scénarios de progression</p>
                  <div className="mt-2 grid sm:grid-cols-3 gap-2">
                    {scenarioRates.map((scenario) => (
                      <div key={scenario.label} className="rounded-lg border border-[#E2D9BC]/40 p-2">
                        <p className="text-xs font-black">{scenario.label}</p>
                        <p className="text-sm font-bold">{Math.round(deltaRevenue * (scenario.pct / 100)).toLocaleString("fr-FR")}€ / mois</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border-2 border-[#2E130C] bg-white p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Pompe à recommandation</p>
                {selectedStage !== "m3" ? (
                  <div className="mt-3 rounded-xl border-2 border-dashed border-[#2E130C] bg-[#E2D9BC] p-8 text-center">
                    <p className="font-titan text-2xl text-[#B20B13]">Votre pompe à reco arrive en Mois 3</p>
                    <p className="mt-2 text-sm font-bold">
                      Concentrez-vous d&apos;abord sur la preuve de concept (Mois 1) puis la duplication (Mois 2).
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="mt-2 text-sm font-bold">19 partenaires potentiels autour de {selectedRole?.name}.</p>
                    <div className="mt-3 grid sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                      {partnerProfiles.map((partner) => (
                        <button
                          key={partner.id}
                          type="button"
                          onClick={() => setSelectedPartnerId(partner.id)}
                          className={cn(
                            "rounded-xl border-2 border-[#2E130C] p-2 text-left",
                            selectedPartner?.id === partner.id ? "bg-[#B20B13] text-[#E2D9BC]" : "bg-[#E2D9BC]",
                          )}
                        >
                          <p className="text-xs font-black">{partner.firstName}</p>
                          <p className="text-[11px] font-bold">{partner.name}</p>
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 rounded-xl border-2 border-[#2E130C] bg-[#D2E8FF] p-3">
                      <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">{selectedPartner?.firstName} — {selectedPartner?.name}</p>
                      <p className="mt-2 text-sm font-bold">
                        Cas concret : vous recommandez à {selectedPartner?.firstName} un client pour une {selectedPartner?.dealType} à {selectedPartner?.deal.toLocaleString("fr-FR")}€.
                      </p>
                      <p className="mt-1 text-sm font-bold">
                        Votre commission d&apos;apport (10%) : {((selectedPartner?.deal ?? 0) * 0.1).toLocaleString("fr-FR")}€.
                      </p>
                      <p className="mt-1 text-sm font-bold">
                        En retour, si {selectedPartner?.firstName} vous recommande un client pour une {selectedRole?.dealType} à {selectedRole?.deal.toLocaleString("fr-FR")}€, sa commission est de {(selectedRole?.deal * 0.1).toLocaleString("fr-FR")}€.
                      </p>
                      <p className="mt-1 text-sm font-bold">
                        Pour atteindre votre delta ({deltaRevenue.toLocaleString("fr-FR")}€), il faut environ {referralsNeeded} recommandations de ce niveau.
                      </p>
                      <button className="mt-3 rounded-lg border-2 border-[#2E130C] bg-white px-3 py-1.5 text-xs font-black uppercase">
                        Lui apporter une affaire
                      </button>
                    </div>
                  </>
                )}
              </div>
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
              <div className="rounded-3xl border-4 border-[#2E130C] bg-white p-6 shadow-[8px_8px_0px_0px_#2E130C]">
                <p className="text-sm font-black uppercase tracking-widest text-[#B20B13]">Preuve rapide</p>
                <p className="mt-2 font-bold">De Bangkok à Dubaï puis Bordeaux : retail, restauration et apps. La solution Popey est née du terrain, pas d&apos;une théorie.</p>
                <div className="mt-4 space-y-2">
                  <details className="rounded-xl border-2 border-[#2E130C] bg-[#E2D9BC] px-4 py-3">
                    <summary className="cursor-pointer font-black">Voir les 7 entreprises</summary>
                    <ul className="mt-3 space-y-2 text-sm font-bold">{ventures.map((venture) => <li key={venture}>{venture}</li>)}</ul>
                  </details>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      <section id="sphere" className="py-16 border-b-4 border-[#2E130C]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto bg-white rounded-3xl border-4 border-[#2E130C] p-8 shadow-[8px_8px_0px_0px_#2E130C]">
            <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">SECTION 5 — SPHÈRE PATRIMOINE & ART DE VIVRE</p>
            <h2 className="mt-4 text-3xl md:text-5xl font-titan leading-tight">Votre rôle : {selectedRole?.name}</h2>
            <p className="mt-3 font-bold">
              Vous êtes connecté à 19 autres métiers. Chaque mise en relation peut générer une commission de 10% et alimenter la pompe à recommandation.
            </p>
            <div className="mt-6 grid md:grid-cols-2 gap-3">
              {heritageSphereClusters.map((cluster) => (
                <div key={cluster.title} className="rounded-2xl border-2 border-[#2E130C] bg-[#D2E8FF]/40 p-4">
                  <p className="text-sm font-black text-[#B20B13]">{cluster.title}</p>
                  <p className="mt-1 text-xs font-bold">{cluster.purpose}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border-2 border-[#2E130C] bg-[#2E130C] text-[#E2D9BC] p-4">
              <p className="text-xs uppercase tracking-widest font-black text-[#D2E8FF]">Exemple appliqué à votre métier</p>
              <p className="mt-1 font-titan text-xl">{selectedRole?.name} → {selectedRole?.binomes[0]} → {selectedRole?.binomes[1]} → {selectedRole?.binomes[2]}</p>
              <p className="mt-1 text-sm font-bold text-[#E2D9BC]/90">
                Recommandation sur une mission de {selectedRole?.deal.toLocaleString("fr-FR")}€ = {(selectedRole?.deal * 0.1).toLocaleString("fr-FR")}€ de commission.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 border-b-4 border-[#2E130C] bg-[#D2E8FF]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Questions fréquentes</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-titan">Objections et réponses</h2>
            <div className="mt-3 rounded-2xl border-2 border-[#2E130C] bg-[#2E130C] text-[#E2D9BC] p-4">
              <p className="text-xs uppercase tracking-widest font-black text-[#D2E8FF]">Lecture rapide</p>
              <p className="mt-1 font-bold text-sm text-[#E2D9BC]/90">6 objections réelles, 6 réponses opérationnelles, avec preuve et action immédiate.</p>
            </div>
            <div className="mt-8 grid md:grid-cols-2 gap-4">
              {faqItems.map((item) => (
                <details key={item.q} className="rounded-2xl border-2 border-[#2E130C] bg-white p-5 shadow-[6px_6px_0px_0px_#2E130C]">
                  <summary className="cursor-pointer font-black">{item.q}</summary>
                  <p className="mt-3 font-bold text-[#2E130C]/90">{item.a}</p>
                  <p className="mt-3 text-xs font-black uppercase tracking-wider text-[#B20B13]">Preuve</p>
                  <p className="mt-1 text-sm font-bold text-[#2E130C]/90">{item.proof}</p>
                  <p className="mt-3 text-xs font-black uppercase tracking-wider text-[#B20B13]">Action</p>
                  <p className="mt-1 text-sm font-bold text-[#2E130C]/90">{item.action}</p>
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
