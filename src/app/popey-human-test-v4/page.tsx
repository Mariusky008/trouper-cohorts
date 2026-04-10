"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Poppins } from "next/font/google";
import { cn } from "@/lib/utils";

const poppins = Poppins({
  weight: ["400", "500", "600", "700", "900"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

const faqItems = [
  {
    q: "En combien de temps puis-je activer une première synergie ?",
    a: "Objectif : créer une première synergie activable en 30 jours, puis la dupliquer au Mois 2.",
  },
  {
    q: "Que se passe-t-il concrètement en 30 jours ?",
    a: "Vous activez un partenaire complémentaire, une offre DUO créée avec vous et promue sur vos réseaux ainsi que ceux de Popey, une logique de recommandation claire et un cadre de commission traçable.",
  },
  {
    q: "Comment fonctionnent les commissions ?",
    a: "Avec des règles cadrées entre partenaires : logique d’apport, traçabilité et activation terrain.",
  },
  {
    q: "Et si je n’ai pas une grosse audience ?",
    a: "Ce n’est pas un prérequis. Popey privilégie la complémentarité métier, la clarté de l’offre et la capacité d’exécution terrain.",
  },
  {
    q: "Et si je n’ai jamais travaillé avec un partenaire ?",
    a: "C’est justement le rôle de Popey : cadrer la collaboration, clarifier les rôles et structurer une première offre DUO simple à lancer.",
  },
  {
    q: "Est-ce que Popey me trouve le bon partenaire ou je dois le chercher moi-même ?",
    a: "Popey identifie et active le partenaire complémentaire avec vous. Vous ne partez pas d’une recherche à froid.",
  },
  {
    q: "Est-ce que l’offre DUO est créée avec moi ou je dois tout construire ?",
    a: "L’offre DUO est co-construite avec vous, puis packagée pour être comprise et vendue facilement.",
  },
  {
    q: "Est-ce que je dois passer des heures en réunions ?",
    a: "Non. Le système est conçu pour des points courts, des actions ciblées et une exécution efficace sans alourdir votre agenda.",
  },
];

type MetierSimulatorItem = {
  id: string;
  metier: string;
  ca_mensuel: number;
  comm_mensuelle: number;
  inbound: string[];
  outbound: string[];
  narratif: string;
  indice_nom?: string;
  label_force?: string;
  description_force?: string;
};

const metierSimulatorData: MetierSimulatorItem[] = [
  {
    id: "agent-immo",
    metier: "Agent Immobilier",
    ca_mensuel: 18000,
    comm_mensuelle: 2200,
    inbound: ["Notaire", "Diagnostiqueur", "Courtier"],
    outbound: ["Maître d'Œuvre", "Cuisiniste", "Déménageur"],
    narratif: "Chaque estimation que vous faites est une mine d'or. En signalant un compromis, vous déclenchez le travail de 5 collègues. Résultat : vous encaissez des commissions sur des services que vous recommandiez gratuitement auparavant.",
    indice_nom: "Score de Pertinence Marché",
    label_force: "Moteur de la Sphère",
    description_force: "Vous êtes la source. Votre puissance réside dans votre capacité à générer des commissions en cascade.",
  },
  {
    id: "pisciniste",
    metier: "Pisciniste",
    ca_mensuel: 35000,
    comm_mensuelle: 1400,
    inbound: ["Paysagiste", "Maître d'Œuvre", "Courtier"],
    outbound: ["Électricien", "Plombier", "Paysagiste"],
    narratif: "Votre panier moyen est élevé, mais vos clients attendent souvent des mois. Le Radar Popey vous apporte des projets déjà financés et prêts à creuser, tout en vous rémunérant sur l'aménagement extérieur global.",
  },
  {
    id: "paysagiste",
    metier: "Paysagiste",
    ca_mensuel: 12000,
    comm_mensuelle: 1000,
    inbound: ["Constructeur", "Pisciniste", "Agent Immo"],
    outbound: ["Clôture/Portail", "Store", "Élagueur"],
    narratif: "Sur 10 jardins, 3 clients veulent une pergola ou un spa. En ouvrant vos oreilles au Radar, vous financez votre abonnement Popey uniquement via vos commissions, sans lever une pelle de plus.",
  },
  {
    id: "cuisiniste",
    metier: "Cuisiniste",
    ca_mensuel: 24000,
    comm_mensuelle: 650,
    inbound: ["Agent Immo", "Architecte", "Maître d'Œuvre"],
    outbound: ["Électricien", "Plombier", "Carreleur"],
    narratif: "Le moment du choix de la cuisine est le pivot de toute rénovation. En captant les clients dès le compromis de vente via l'Agent Immo, vous verrouillez votre vente avant même que le client ne fasse les magasins.",
  },
  {
    id: "electricien",
    metier: "Électricien",
    ca_mensuel: 8000,
    comm_mensuelle: 450,
    inbound: ["Cuisiniste", "Maître d'Œuvre", "Pisciniste"],
    outbound: ["Domotique", "Solaire", "Alarme"],
    narratif: "Mise aux normes, bornes de recharge... vous êtes partout. Le Radar Popey transforme vos interventions techniques en opportunités de business pour la sécurité et l'énergie, payées en commissions directes.",
  },
  {
    id: "notaire",
    metier: "Notaire",
    ca_mensuel: 12000,
    comm_mensuelle: 1700,
    inbound: ["Agent Immo", "Expert-Comptable"],
    outbound: ["Diagnostiqueur", "Déménageur", "Courtier"],
    narratif: "En tant que premier maillon de la chaîne, vous voyez les successions et les ventes avant tout le monde. Popey transforme votre rôle de conseil en un moteur de revenus passifs via le ruissellement vers les services.",
  },
  {
    id: "courtier",
    metier: "Courtier en Prêt",
    ca_mensuel: 8000,
    comm_mensuelle: 750,
    inbound: ["Agent Immo", "Notaire", "Maître d'Œuvre"],
    outbound: ["Assureur", "Gestionnaire Patrimoine", "Agent Immo"],
    narratif: "Vous connaissez le budget exact des clients. Le Radar Popey vous permet d'orienter ce budget vers les bons pros du cercle, sécurisant ainsi le dossier de prêt et vos commissions d'apporteur.",
  },
  {
    id: "maitre-oeuvre",
    metier: "Maître d'Œuvre",
    ca_mensuel: 15000,
    comm_mensuelle: 3000,
    inbound: ["Agent Immo", "Architecte", "Courtier"],
    outbound: ["Tous les Artisans du Cercle"],
    narratif: "Vous êtes le chef d'orchestre. Le Radar Popey vous donne accès à des terrains hors-marché et centralise toutes vos commissions d'apporteurs auprès des artisans en un seul virement mensuel.",
  },
  {
    id: "charpentier",
    metier: "Charpentier / Couvreur",
    ca_mensuel: 25000,
    comm_mensuelle: 600,
    inbound: ["Maître d'Œuvre", "Diagnostiqueur"],
    outbound: ["Façadier", "Électricien (Solaire)"],
    narratif: "Une toiture à refaire cache souvent un besoin d'isolation ou de panneaux solaires. Le Radar Popey valorise votre expertise technique en vous connectant aux énergies renouvelables.",
  },
  {
    id: "menuisier",
    metier: "Menuisier",
    ca_mensuel: 12000,
    comm_mensuelle: 450,
    inbound: ["Maître d'Œuvre", "Architecte", "Façadier"],
    outbound: ["Store/Portail", "Domotique", "Peintre"],
    narratif: "Fenêtres et portes sont des signes de rénovation globale. En signalant ces chantiers, vous activez le pôle domotique et sécurité pour un bonus de revenus mensuels.",
  },
  {
    id: "facadier",
    metier: "Façadier / Peintre Ext.",
    ca_mensuel: 15000,
    comm_mensuelle: 350,
    inbound: ["Menuisier", "Maître d'Œuvre", "Diagnostiqueur"],
    outbound: ["Store/Pergola", "Paysagiste"],
    narratif: "Le ravalement est souvent la dernière étape avant la vente ou juste après l'achat. Vous êtes le lien parfait vers l'aménagement extérieur et les protections solaires.",
  },
  {
    id: "plombier",
    metier: "Plombier / Chauffagiste",
    ca_mensuel: 10000,
    comm_mensuelle: 550,
    inbound: ["Maître d'Œuvre", "Cuisiniste", "Pisciniste"],
    outbound: ["Électricien", "Carreleur"],
    narratif: "Salles de bains et chaufferies sont des déclencheurs de travaux. Le Radar Popey vous permet de monétiser votre présence chez le client en recommandant le carreleur ou l'électricien du cercle.",
  },
  {
    id: "solaire",
    metier: "Spécialiste Solaire",
    ca_mensuel: 20000,
    comm_mensuelle: 750,
    inbound: ["Charpentier", "Électricien", "Courtier"],
    outbound: ["Domotique", "Couvreur"],
    narratif: "Le solaire est un investissement financier. Popey vous apporte des clients déjà sensibilisés par l'électricien ou le couvreur, augmentant votre taux de conversion de 40%.",
  },
  {
    id: "cheministe",
    metier: "Cheministe / Poêlier",
    ca_mensuel: 10000,
    comm_mensuelle: 300,
    inbound: ["Maître d'Œuvre", "Chauffagiste"],
    outbound: ["Ramoneur", "Peintre"],
    narratif: "Chaque nouveau poêle est une rénovation de salon. Le Radar Popey vous connecte aux peintres et décorateurs pour transformer un simple conduit en un projet déco rémunéré.",
  },
  {
    id: "carreleur",
    metier: "Carreleur",
    ca_mensuel: 9000,
    comm_mensuelle: 350,
    inbound: ["Plombier", "Cuisiniste", "Architecte"],
    outbound: ["Peintre", "Nettoyage"],
    narratif: "Vous intervenez souvent en fin de gros œuvre. Le Radar Popey vous assure un flux constant via les cuisinistes et plombiers de la ville.",
  },
  {
    id: "decorateur",
    metier: "Décorateur / Home Stager",
    ca_mensuel: 4500,
    comm_mensuelle: 800,
    inbound: ["Architecte", "Agent Immo", "Photographe"],
    outbound: ["Magasin de meubles", "Peintre"],
    narratif: "Votre conseil est précieux. Le Radar Popey rémunère votre œil d'expert : chaque recommandation de mobilier ou de travaux devient une commission nette.",
  },
  {
    id: "portail",
    metier: "Portail / Store / Pergola",
    ca_mensuel: 9000,
    comm_mensuelle: 300,
    inbound: ["Paysagiste", "Façadier", "Menuisier"],
    outbound: ["Domotique", "Alarme", "Électricien"],
    narratif: "Vous terminez l'esthétique de la maison. Popey vous apporte les chantiers de construction qui arrivent à terme, là où le besoin de fermeture est immédiat.",
  },
  {
    id: "assureur",
    metier: "Assureur",
    ca_mensuel: 3000,
    comm_mensuelle: 600,
    inbound: ["Courtier", "Agent Immo", "Expert-Comptable"],
    outbound: ["Gestionnaire Patrimoine", "Alarme"],
    narratif: "Le prêt immo déclenche l'assurance. Le Radar Popey vous place en pole position dès la signature du compromis pour récupérer les contrats MRH et prévoyance.",
  },
  {
    id: "diagnostiqueur",
    metier: "Diagnostiqueur",
    ca_mensuel: 2400,
    comm_mensuelle: 1400,
    inbound: ["Agent Immo", "Notaire"],
    outbound: ["Maître d'Œuvre", "Charpentier", "Désamianteur"],
    narratif: "Vous êtes le premier à entrer dans la maison. Votre rapport de diagnostic dicte les futurs travaux. Popey transforme vos préconisations techniques en commissions sur les travaux réalisés.",
  },
  {
    id: "demenageur",
    metier: "Déménageur",
    ca_mensuel: 6000,
    comm_mensuelle: 300,
    inbound: ["Agent Immo", "Notaire"],
    outbound: ["Garde-Meubles", "Nettoyage", "Conciergerie"],
    narratif: "Le déménagement est le point de bascule. Vous savez qui part, qui arrive et qui a trop de meubles. Popey monétise ces infos logistiques stratégiques.",
    indice_nom: "Indice de Vitesse de ROI",
    label_force: "Accélérateur de Transition",
    description_force: "Votre métier est le point de passage obligé. Vous ne recevez peut-être que 4 alertes, mais ce sont 4 signatures garanties.",
  },
  {
    id: "architecte-int",
    metier: "Architecte d’intérieur",
    ca_mensuel: 8000,
    comm_mensuelle: 2200,
    inbound: ["Agent Immo", "Maître d'Œuvre"],
    outbound: ["Décorateur", "Cuisiniste", "Carreleur"],
    narratif: "Vous transformez les volumes. Le Radar Popey vous apporte des acquéreurs de plateaux bruts et vous rémunère sur tous les corps d'état que vous faites intervenir.",
  },
  {
    id: "photographe",
    metier: "Photographe Immobilier",
    ca_mensuel: 1800,
    comm_mensuelle: 350,
    inbound: ["Agent Immo", "Conciergerie"],
    outbound: ["Décorateur", "Home Stager"],
    narratif: "Vous sublimez les biens. Votre présence sur site vous permet de détecter les besoins de Home Staging avant la mise en vente, générant des commissions bonus.",
  },
  {
    id: "expert-comptable",
    metier: "Expert-Comptable",
    ca_mensuel: 4000,
    comm_mensuelle: 500,
    inbound: ["Notaire", "Courtier"],
    outbound: ["Gestionnaire Patrimoine", "Assureur"],
    narratif: "Création de SCI, investissements LMNP... vous conseillez les investisseurs. Popey vous permet d'offrir une solution clé en main à vos clients pour leur patrimoine.",
  },
  {
    id: "gest-patrimoine",
    metier: "Gestionnaire Patrimoine",
    ca_mensuel: 15000,
    comm_mensuelle: 1000,
    inbound: ["Expert-Comptable", "Assureur", "Notaire"],
    outbound: ["Agent Immo (Achat)", "Courtier"],
    narratif: "La vente d'un bien génère du cash à réinvestir. Popey vous alerte dès qu'un capital se libère dans le cercle pour proposer vos solutions de placement.",
  },
  {
    id: "conciergerie",
    metier: "Conciergerie Airbnb",
    ca_mensuel: 2000,
    comm_mensuelle: 700,
    inbound: ["Agent Immo", "Photographe"],
    outbound: ["Nettoyage", "Blanchisserie", "Plombier"],
    narratif: "Les investisseurs cherchent de la rentabilité. Popey vous amène les propriétaires de résidences secondaires et vous aide à gérer vos besoins en maintenance via le cercle.",
  },
  {
    id: "event-planner",
    metier: "Event Planner",
    ca_mensuel: 10000,
    comm_mensuelle: 1000,
    inbound: ["Conciergerie", "Paysagiste"],
    outbound: ["Traiteur", "Photographe", "Sono"],
    narratif: "Les grandes propriétés se louent pour des événements. Popey vous connecte aux propriétaires de parcs et domaines pour organiser des réceptions d'exception.",
  },
  {
    id: "domotique",
    metier: "Domotique / Alarme",
    ca_mensuel: 12000,
    comm_mensuelle: 450,
    inbound: ["Électricien", "Portail", "Assureur"],
    outbound: ["Serrurier", "Électricien"],
    narratif: "La sécurité est la priorité post-achat. Le Radar Popey vous envoie chez le client au moment précis où il installe ses meubles et ses valeurs.",
  },
  {
    id: "nettoyage",
    metier: "Société de Nettoyage",
    ca_mensuel: 2500,
    comm_mensuelle: 200,
    inbound: ["Carreleur", "Maître d'Œuvre", "Déménageur"],
    outbound: ["Conciergerie", "Diagnostiqueur"],
    narratif: "Fin de chantier ou déménagement : votre intervention est le point final. Popey vous apporte des contrats récurrents via les pros du bâtiment du cercle.",
  },
  {
    id: "elagueur",
    metier: "Élagueur",
    ca_mensuel: 3000,
    comm_mensuelle: 350,
    inbound: ["Paysagiste", "Assureur", "Notaire"],
    outbound: ["Paysagiste", "Charpentier"],
    narratif: "Un arbre dangereux est souvent détecté lors d'une vente ou d'une tempête (Assurance). Popey vous place directement sur ces urgences payantes.",
  },
  {
    id: "garde-meubles",
    metier: "Garde-Meubles / Stockage",
    ca_mensuel: 1500,
    comm_mensuelle: 250,
    inbound: ["Déménageur", "Notaire", "Agent Immo"],
    outbound: ["Déménageur", "Nettoyage"],
    narratif: "Entre deux maisons, le stockage est obligatoire. Popey vous apporte les clients en transition immobilière pour remplir vos box à 100%.",
  },
];

export default function PopeyHumanTestV4Page() {
  const [tick, setTick] = useState(0);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showMetierModal, setShowMetierModal] = useState(false);
  const [selectedMetierId, setSelectedMetierId] = useState("");
  const [animatedCa, setAnimatedCa] = useState(0);
  const [animatedComm, setAnimatedComm] = useState(0);
  const [problemSceneStarted, setProblemSceneStarted] = useState(false);
  const [activationTimelineStarted, setActivationTimelineStarted] = useState(false);
  const problemSectionRef = useRef<HTMLElement | null>(null);
  const problemTriggerRef = useRef<HTMLDivElement | null>(null);
  const problemAnimationRef = useRef<HTMLDivElement | null>(null);
  const activationSectionRef = useRef<HTMLElement | null>(null);
  const month = (tick % 6) + 1;
  const duoRevenue = month * 600;
  const incomingRevenue = Math.max(month - 1, 0) * 400;
  const commissionRevenue = Math.max(month - 2, 0) * 500;
  const totalRevenue = duoRevenue + incomingRevenue + commissionRevenue;
  const selectedMetier = useMemo(
    () => metierSimulatorData.find((item) => item.id === selectedMetierId) ?? null,
    [selectedMetierId]
  );

  const maxCa = useMemo(() => Math.max(...metierSimulatorData.map((item) => item.ca_mensuel)), []);
  const maxComm = useMemo(() => Math.max(...metierSimulatorData.map((item) => item.comm_mensuelle)), []);
  const maxConnections = useMemo(
    () =>
      Math.max(
        ...metierSimulatorData.map((item) =>
          item.inbound.length +
          item.outbound.length +
          (item.outbound.some((entry) => entry.includes("Tous les Artisans")) ? 8 : 0)
        )
      ),
    []
  );
  const isPilierProfile = useMemo(() => {
    if (!selectedMetier) return false;
    const connectionCount =
      selectedMetier.inbound.length +
      selectedMetier.outbound.length +
      (selectedMetier.outbound.some((entry) => entry.includes("Tous les Artisans")) ? 8 : 0);
    return connectionCount >= 6;
  }, [selectedMetier]);
  const strategicIndex = useMemo(() => {
    if (!selectedMetier) return 0;
    const connectionCount =
      selectedMetier.inbound.length +
      selectedMetier.outbound.length +
      (selectedMetier.outbound.some((entry) => entry.includes("Tous les Artisans")) ? 8 : 0);
    if (isPilierProfile) {
      const volumeScore =
        (selectedMetier.ca_mensuel / maxCa) * 0.45 +
        (selectedMetier.comm_mensuelle / maxComm) * 0.25 +
        (connectionCount / maxConnections) * 0.3;
      return Math.round(volumeScore * 100);
    }
    const conversionEase =
      (selectedMetier.comm_mensuelle / maxComm) * 0.55 +
      Math.min(1, selectedMetier.ca_mensuel / Math.max(8000, maxCa * 0.45)) * 0.2 +
      (1 - Math.min(connectionCount / maxConnections, 1)) * 0.25;
    return Math.round(conversionEase * 100);
  }, [selectedMetier, isPilierProfile, maxCa, maxComm, maxConnections]);
  const indiceNom = useMemo(() => {
    if (!selectedMetier) return "";
    if (selectedMetier.indice_nom) return selectedMetier.indice_nom;
    return isPilierProfile ? "Score de Pertinence Marché" : "Indice de Vitesse de ROI";
  }, [selectedMetier, isPilierProfile]);
  const labelForce = useMemo(() => {
    if (!selectedMetier) return "";
    if (selectedMetier.label_force) return selectedMetier.label_force;
    return isPilierProfile ? "Profil Pilier / Flux Massif" : "Profil Finisseur / Haute Précision";
  }, [selectedMetier, isPilierProfile]);
  const descriptionForce = useMemo(() => {
    if (!selectedMetier) return "";
    if (selectedMetier.description_force) return selectedMetier.description_force;
    if (isPilierProfile) {
      return "Vous êtes au cœur du réacteur local : vous brassez du volume et déclenchez des commissions en cascade.";
    }
    return "Vous intervenez à des moments clés : peu de signaux, mais des dossiers chauds et rapides à convertir.";
  }, [selectedMetier, isPilierProfile]);
  const niveauForce = useMemo(() => {
    if (!selectedMetier) return "";
    if (strategicIndex >= 80) return "Très élevé";
    return "Élevé";
  }, [selectedMetier, strategicIndex]);

  const phaseMessage = useMemo(() => {
    if (month === 1) return "M1: le pack duo démarre et crée le premier CA.";
    if (month === 2) return "M2: les recommandations entrantes s’ajoutent.";
    return "M3 à M6: les 3 flux tournent ensemble et se cumulent.";
  }, [month]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick((prev) => (prev + 1) % 1200);
    }, 1800);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const hasModalOpen = showCityModal || showMetierModal;
    if (!hasModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowCityModal(false);
        setShowMetierModal(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showCityModal, showMetierModal]);

  useEffect(() => {
    if (!showMetierModal) return;
    if (!selectedMetier) {
      setAnimatedCa(0);
      setAnimatedComm(0);
      return;
    }

    let frameId = 0;
    let startTs = 0;
    const duration = 850;
    const targetCa = selectedMetier.ca_mensuel;
    const targetComm = selectedMetier.comm_mensuelle;

    const animate = (ts: number) => {
      if (!startTs) startTs = ts;
      const progress = Math.min((ts - startTs) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedCa(Math.round(targetCa * eased));
      setAnimatedComm(Math.round(targetComm * eased));
      if (progress < 1) {
        frameId = window.requestAnimationFrame(animate);
      }
    };

    setAnimatedCa(0);
    setAnimatedComm(0);
    frameId = window.requestAnimationFrame(animate);

    return () => window.cancelAnimationFrame(frameId);
  }, [selectedMetier, showMetierModal]);

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const node = isMobile ? problemAnimationRef.current : problemSectionRef.current;
    if (!node || problemSceneStarted) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const mobileShouldStart =
          isMobile &&
          entry.isIntersecting &&
          entry.intersectionRatio >= 0.35 &&
          window.scrollY > 180;
        const desktopShouldStart =
          !isMobile &&
          entry.isIntersecting &&
          entry.intersectionRatio >= 0.45 &&
          window.scrollY > 120;

        if (mobileShouldStart || desktopShouldStart) {
          setProblemSceneStarted(true);
          observer.disconnect();
        }
      },
      { threshold: isMobile ? [0, 0.2, 0.35, 0.6] : [0, 0.45, 0.7] }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [problemSceneStarted]);

  useEffect(() => {
    const node = activationSectionRef.current;
    if (!node || activationTimelineStarted) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.35 && window.scrollY > 180) {
          setActivationTimelineStarted(true);
          observer.disconnect();
        }
      },
      { threshold: [0, 0.35, 0.6] }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [activationTimelineStarted]);

  return (
    <main className={cn("min-h-screen bg-[#F7F7F7] text-[#0B0B0B]", poppins.variable, "font-poppins")}>
      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20 lg:min-h-[76vh] flex items-center">
          <div className="w-full">
            <h1 className="mt-2 text-5xl md:text-7xl font-black leading-[1.02] max-w-5xl">
              Ne cherchez plus vos clients, allez là où ils sont déjà.
              <br />
              <span className="inline-flex items-center gap-3">
                <span className="text-[#B6FF2B]">➜</span>
                Chez ceux qui vendent juste avant ou juste après vous.
              </span>
            </h1>
            <p className="mt-6 text-lg md:text-2xl font-medium leading-relaxed text-black/75 max-w-4xl">
              Vos clients achètent déjà ailleurs. Popey vous aide à récupérer cette valeur en vous associant chaque mois à un partenaire stratégique et complémentaire pour générer :
            </p>
            <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-4xl text-sm md:text-base font-black text-black/80">
              <li className="rounded-lg border border-black/10 bg-white px-4 py-2">- de nouveaux clients</li>
              <li className="rounded-lg border border-black/10 bg-white px-4 py-2">- des recommandations</li>
              <li className="rounded-lg border border-black/10 bg-white px-4 py-2">- des commissions</li>
              <li className="rounded-lg border border-black/10 bg-white px-4 py-2">- + de chiffre d&apos;affaires</li>
            </ul>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-4xl">
              <div className="rounded-xl border border-black/10 bg-white px-5 py-4">
                <p className="text-[10px] uppercase tracking-[0.12em] font-black text-black/60">Professionnels complémentaires intégrés</p>
                <p className="mt-1 text-2xl font-black">120+</p>
              </div>
              <div className="rounded-xl border border-black/10 bg-white px-5 py-4">
                <p className="text-[10px] uppercase tracking-[0.12em] font-black text-black/60">Synergies déjà activées</p>
                <p className="mt-1 text-2xl font-black">340+</p>
              </div>
              <div className="rounded-xl border border-black/10 bg-white px-5 py-4">
                <p className="text-[10px] uppercase tracking-[0.12em] font-black text-black/60">1 objectif</p>
                <p className="mt-1 text-sm md:text-base font-black leading-snug">Plus de CA avec le partage clients</p>
              </div>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                href="/popey-human/login"
                className="inline-flex items-center justify-center rounded-md border border-black bg-black px-6 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-white hover:text-black"
              >
                Connexion
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSelectedMetierId("");
                  setShowMetierModal(true);
                }}
                className="inline-flex items-center justify-center rounded-md border border-black px-6 py-3 text-sm font-black uppercase tracking-wide transition hover:bg-black hover:text-white"
              >
                Voir si mon métier est dans la liste
              </button>
              <button
                type="button"
                onClick={() => setShowCityModal(true)}
                className="inline-flex items-center justify-center rounded-md border border-black px-6 py-3 text-sm font-black uppercase tracking-wide transition hover:bg-black hover:text-white"
              >
                Voir si ma ville est disponible
              </button>
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-black/70">Audit 15 min • Sur sélection</p>
            <div className="mt-8 max-w-4xl rounded-2xl border border-black/10 bg-[#EEF4DF] p-4 md:p-5">
              <div className="hero-flow relative overflow-hidden rounded-xl border border-black/10 bg-white p-3 md:h-[260px] md:p-0">
                <div className="hero-steps flex flex-wrap items-center justify-center gap-2 md:absolute md:inset-x-0 md:top-4">
                  <p className="hero-step hero-step-1 rounded-full border border-black/15 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-wide">1. Matching</p>
                  <p className="hero-step hero-step-2 rounded-full border border-black/15 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-wide">2. Offre DUO</p>
                  <p className="hero-step hero-step-3 rounded-full border border-[#2F7A00]/25 bg-[#E9F9D9] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-[#2F7A00]">3. Nouveaux clients</p>
                </div>

                <div className="hero-cards mt-4 hidden md:flex items-center justify-between gap-2 md:contents">
                  <div className="hero-card hero-card-left relative w-[44%] rounded-xl border border-black/15 bg-white px-2.5 py-2 md:absolute md:left-[7%] md:top-[35%] md:w-[140px] md:p-3">
                    <p className="text-center text-xs md:text-base font-black uppercase tracking-[0.08em] md:tracking-[0.12em]">Vous</p>
                  </div>
                  <div className="hero-card hero-card-right relative w-[44%] rounded-xl border border-black/15 bg-white px-2.5 py-2 md:absolute md:right-[7%] md:top-[35%] md:w-[140px] md:p-3">
                    <p className="text-center text-xs md:text-base font-black uppercase tracking-[0.08em] md:tracking-[0.12em]">Partenaire clé</p>
                  </div>
                </div>

                <div className="hero-track relative mt-6 h-20 md:absolute md:inset-x-0 md:top-0 md:bottom-0 md:mt-0 md:h-auto">
                  <p className="absolute left-[8%] top-0 rounded-full border border-black/20 bg-[#F8FAF2] px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-black/85 md:hidden">Vous</p>
                  <p className="absolute right-[8%] top-0 rounded-full border border-[#2F7A00]/30 bg-[#E9F9D9] px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#2F7A00] md:hidden">Partenaire clé</p>
                  <div className="hero-rail absolute left-[8%] right-[8%] top-[68%] h-[3px] -translate-y-1/2 md:left-[20%] md:right-[20%] md:top-[58%]">
                    <div className="hero-line hero-line-main relative h-full w-full rounded-full bg-black/15" />
                    <div className="hero-token hero-token-main absolute -top-[3px] left-0 h-2.5 w-2.5 rounded-full bg-[#2F7A00]" />
                  </div>
                  <div className="hero-hub absolute left-1/2 top-[68%] z-20 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-black bg-[#B6FF2B] flex items-center justify-center text-[9px] font-black uppercase tracking-wide md:top-[58%] md:h-14 md:w-14 md:text-[10px]">Popey</div>
                </div>

                <div className="hero-status-wrap mt-4 hidden md:flex justify-center md:absolute md:inset-x-0 md:bottom-4 md:mt-0">
                  <div className="hero-status rounded-full border border-black/15 bg-white px-4 py-1.5">
                    <p className="text-center text-[10px] md:text-[11px] font-black uppercase tracking-[0.08em] md:tracking-[0.16em] text-black/70">Synergie en cours d’activation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section ref={problemSectionRef} className="border-b border-black/10 bg-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-16">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] font-black text-[#B6FF2B]">Le problème à résoudre</p>
              <h2 className="mt-3 text-[46px] md:text-6xl font-black max-w-5xl leading-[1.08]">
                Vos clients achètent déjà ailleurs avant et après vous. Le problème, c’est que vous n’êtes pas dans la boucle.
              </h2>
              <p className="mt-6 text-[20px] md:text-xl font-medium leading-[1.45] text-white/85 max-w-5xl">
                Un client qui vous fait confiance continue souvent son parcours chez d’autres professionnels complémentaires : courtier, architecte d’intérieur, CGP, cuisiniste, déménageur, conciergerie privée.
              </p>
              <p className="mt-5 text-[20px] md:text-xl font-medium leading-[1.45] text-white/85 max-w-5xl">
                Si ces achats se font sans vous, vous laissez partir de la valeur, des recommandations, des commissions et des opportunités de fidélisation. Et les métiers hors de votre boucle ne vous recommandent pas non plus.
              </p>
              <div ref={problemTriggerRef} className="mt-6 rounded-xl border border-[#B6FF2B] bg-[#B6FF2B]/10 px-5 py-4 max-w-5xl">
                <p className="text-xl md:text-2xl font-black">Popey sert à remettre votre métier au centre de cette chaîne de valeur.</p>
              </div>
            </div>

            <div ref={problemAnimationRef} className="relative p-1 md:p-2 overflow-visible mt-8 lg:mt-12">
              <div className="absolute -top-8 -left-8 h-28 w-28 rounded-full bg-[#B6FF2B]/20 blur-2xl" />
              <div className="mt-8 relative h-[300px] md:h-[330px] overflow-visible">
                <div className="absolute left-0 right-0 bottom-9 h-[2px] bg-white/25" />

                <div className="walk-man absolute left-2 bottom-9 z-20 h-[102px] w-14" style={{ animationPlayState: problemSceneStarted ? "running" : "paused" }}>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 h-8 w-8 rounded-full border-[3px] border-white" />
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 h-14 w-[4px] bg-white rounded-full" />
                  <div className="absolute top-[48px] left-1/2 -translate-x-1/2 w-10 h-[4px] bg-white rounded-full" />
                  <div className="walk-leg-left absolute top-[66px] left-1/2 h-11 w-[4px] bg-white rounded-full origin-top" style={{ animationPlayState: problemSceneStarted ? "running" : "paused" }} />
                  <div className="walk-leg-right absolute top-[66px] left-1/2 h-11 w-[4px] bg-white rounded-full origin-top" style={{ animationPlayState: problemSceneStarted ? "running" : "paused" }} />
                </div>

                <div className="absolute right-3 bottom-9 h-[290px] w-[206px] rounded-t-[36px] border-[4px] border-white/85 bg-white/5">
                  <div className="door-light absolute -inset-5 rounded-full bg-[#B6FF2B]/25 blur-2xl" style={{ animationPlayState: problemSceneStarted ? "running" : "paused" }} />
                  <div className="door-open absolute inset-y-[8px] left-[8px] right-[8px] rounded-t-[26px] border border-white/35 bg-white shadow-[0_0_30px_rgba(255,255,255,0.45)] origin-left" style={{ animationPlayState: problemSceneStarted ? "running" : "paused" }}>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-black/35" />
                    <div className="px-3 pt-4 pb-3">
                      <div className="grid grid-cols-1 gap-2 text-[11px] leading-none font-bold tracking-[0.03em] text-black/75">
                        <p className="rounded-md border border-black/10 bg-[#F3F4F6] px-2.5 py-1.5">• Courtier</p>
                        <p className="rounded-md border border-black/10 bg-[#F3F4F6] px-2.5 py-1.5">• Architecte</p>
                        <p className="rounded-md border border-black/10 bg-[#F3F4F6] px-2.5 py-1.5">• CGP</p>
                        <p className="rounded-md border border-black/10 bg-[#F3F4F6] px-2.5 py-1.5">• Cuisiniste</p>
                        <p className="rounded-md border border-black/10 bg-[#F3F4F6] px-2.5 py-1.5">• Déménageur</p>
                        <p className="rounded-md border border-black/10 bg-[#F3F4F6] px-2.5 py-1.5">• Conciergerie</p>
                        <p className="added-role inline-flex items-center gap-2 rounded-md border border-[#2F7A00]/35 bg-[#E9F9D9] px-2.5 py-1.5 font-black text-[#2F7A00]" style={{ animationPlayState: problemSceneStarted ? "running" : "paused" }}><span className="added-check inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#2F7A00] text-[10px] text-white">✓</span>+ Agent immo</p>
                      </div>
                    </div>
                  </div>
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[13px] font-black uppercase tracking-[0.2em] text-[#B6FF2B]">Popey</span>
                </div>

                <div className="final-result absolute right-[6px] -bottom-4 md:bottom-1 text-[13px] md:text-[11px] font-black uppercase tracking-[0.14em] text-[#B6FF2B]" style={{ animationPlayState: problemSceneStarted ? "running" : "paused" }}>
                  Agent immo intégré à la sphère
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-14">
          <h2 className="text-4xl md:text-5xl font-black leading-tight max-w-5xl">
            Avant Popey, votre réseau est passif. Après Popey, il devient une machine à opportunités.
          </h2>
          <div className="mt-6 grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-black/15 bg-[#F7F7F7] p-5">
              <p className="text-sm uppercase tracking-[0.2em] font-black text-black/60">Sans Popey</p>
              <ul className="mt-3 space-y-2 text-[18px] md:text-base font-semibold leading-[1.45] text-black/80">
                <li>• 1 client = 1 vente… puis il part dépenser ailleurs</li>
                <li>• vos partenaires ne pensent pas à vous au bon moment</li>
                <li>• vos recommandations sont floues et non suivies</li>
                <li>• vous laissez filer des commissions invisibles</li>
                <li>• votre croissance dépend encore de la prospection</li>
              </ul>
            </div>
            <div className="rounded-xl border border-black bg-black text-white p-5">
              <p className="text-sm uppercase tracking-[0.2em] font-black text-[#B6FF2B]">Avec Popey</p>
              <ul className="mt-3 space-y-2 text-[18px] md:text-base font-semibold leading-[1.45]">
                <li>• 1 client peut déclencher plusieurs ventes complémentaires</li>
                <li>• vous activez un partenaire qui vous renvoie aussi des clients</li>
                <li>• vous vendez une offre DUO plus simple à comprendre</li>
                <li>• vos recommandations sont structurées et traçables</li>
                <li>• vous construisez une machine duplicable, pas un simple réseau</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-14">
          <div className="rounded-2xl bg-[#0B0B0B] p-6 text-white">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] font-black text-[#B6FF2B]">Simulation revenus 6 mois</p>
              <p className="text-sm font-bold border border-white/30 rounded-full px-3 py-1">M{month}/6</p>
            </div>
            <div className="mt-3 grid grid-cols-6 gap-1">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className={cn("h-1 rounded-full", index < month ? "bg-[#B6FF2B]" : "bg-white/20")} />
              ))}
            </div>
            <div className="mt-4 space-y-2">
              <div className="rounded-lg border border-white/20 bg-white/5 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm uppercase tracking-wide font-black">Pack duo</p>
                  <p className="text-2xl font-black">{duoRevenue.toLocaleString("fr-FR")}€</p>
                </div>
              </div>
              <div className="rounded-lg border border-white/20 bg-white/5 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm uppercase tracking-wide font-black">Reco entrantes</p>
                  <p className="text-2xl font-black">{incomingRevenue.toLocaleString("fr-FR")}€</p>
                </div>
              </div>
              <div className="rounded-lg border border-white/20 bg-white/5 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm uppercase tracking-wide font-black">Reco sortantes (10%)</p>
                  <p className="text-2xl font-black">{commissionRevenue.toLocaleString("fr-FR")}€</p>
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-[#B6FF2B] text-black p-3">
              <p className="text-xs uppercase tracking-wide font-black">CA cumulé simulé à M{month}</p>
              <p className="text-4xl font-black">{totalRevenue.toLocaleString("fr-FR")}€</p>
            </div>
            <p className="mt-3 text-sm font-black uppercase tracking-wide text-white/90">{phaseMessage}</p>
          </div>
        </div>
      </section>

      <section ref={activationSectionRef} className="border-b border-black/10 bg-[#F5F5F5]">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-14">
          <p className="text-sm uppercase tracking-[0.2em] font-black text-black/55">Plan d’activation</p>
          <h2 className="text-4xl md:text-5xl font-black">Ce que vous obtenez en 30 jours</h2>
          <div className={cn("timeline-wrap mt-6 rounded-2xl border border-black/10 bg-white p-5 md:p-6", activationTimelineStarted && "timeline-live")}>
            <div className="relative">
              <div className="timeline-line absolute left-3 top-2 bottom-2 w-[2px] bg-gradient-to-b from-[#B6FF2B] via-black/25 to-[#B6FF2B]" />
              <div className="space-y-5">
                <article className="timeline-step timeline-step-1 relative pl-10">
                  <span className="timeline-dot absolute left-0 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#B6FF2B] bg-black text-[10px] font-black text-[#B6FF2B]">1</span>
                  <p className="text-xs uppercase tracking-[0.12em] font-black text-black/55">J+3</p>
                  <p className="mt-1 text-lg font-black">1 partenaire complémentaire</p>
                  <p className="mt-1 text-base md:text-lg text-black/70 font-medium">Partenaire validé selon votre offre et votre zone.</p>
                </article>
                <article className="timeline-step timeline-step-2 relative pl-10">
                  <span className="timeline-dot absolute left-0 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#B6FF2B] bg-black text-[10px] font-black text-[#B6FF2B]">2</span>
                  <p className="text-xs uppercase tracking-[0.12em] font-black text-black/55">J+15</p>
                  <p className="mt-1 text-lg font-black">1 offre DUO lancée</p>
                  <p className="mt-1 text-base md:text-lg text-black/70 font-medium">Offre créée puis promue sur vos réseaux et ceux de Popey.</p>
                </article>
                <article className="timeline-step timeline-step-3 relative pl-10">
                  <span className="timeline-dot absolute left-0 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#B6FF2B] bg-black text-[10px] font-black text-[#B6FF2B]">3</span>
                  <p className="text-xs uppercase tracking-[0.12em] font-black text-black/55">J+30</p>
                  <p className="mt-1 text-lg font-black">Reco + commissions cadrées</p>
                  <p className="mt-1 text-base md:text-lg text-black/70 font-medium">Logique de recommandation claire et commission traçable.</p>
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-14">
          <p className="text-xs uppercase tracking-[0.2em] font-black text-black/55">Exécution légère</p>
          <h2 className="text-3xl md:text-5xl font-black max-w-4xl">Un système rentable sans alourdir votre agenda</h2>
          <p className="mt-4 text-base md:text-lg font-medium text-black/80 max-w-5xl">
            Nous ne prenons que quelques minutes de votre temps pour vous donner une marche à suivre claire, des conseils ciblés et des actions prioritaires qui augmentent votre chiffre d’affaires sans alourdir votre agenda.
          </p>
          <div className="mt-6 grid md:grid-cols-3 gap-3 text-sm font-semibold">
            <div className="rounded-lg border border-black/10 bg-[#F7F7F7] px-4 py-3">Des points courts et structurés, orientés décision et exécution</div>
            <div className="rounded-lg border border-black/10 bg-[#F7F7F7] px-4 py-3">Un plan d’action simple à appliquer dans votre planning existant</div>
            <div className="rounded-lg border border-black/10 bg-[#F7F7F7] px-4 py-3">Une montée en valeur de vos clients actuels sans changer votre métier</div>
          </div>
          <div className="mt-5 rounded-xl border border-[#B6FF2B] bg-[#B6FF2B]/15 px-4 py-3 max-w-4xl">
            <p className="text-sm md:text-base font-black">Exemple simple : 1 offre DUO à 1 500€ + 2 recommandations commissionnées à 250€ = 2 000€ additionnels sur 30 jours. Ceci est sans compter l’essentiel : les nouveaux clients que vous attirez pour un chiffre d’affaires additionnel.</p>
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-[#F5F5F5]">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-14">
          <p className="text-xs uppercase tracking-[0.2em] font-black text-black/55">Sélection de profils</p>
          <h2 className="text-5xl md:text-6xl font-black leading-tight">Pour qui / Pas pour qui</h2>
          <div className="mt-6 grid md:grid-cols-2 gap-4">
            <article className="rounded-xl border border-[#2F7A00]/25 bg-white p-5">
              <p className="text-xs uppercase tracking-[0.16em] font-black text-[#2F7A00]">Pour qui</p>
              <ul className="mt-3 space-y-2.5 text-[26px] md:text-2xl leading-[1.35] font-semibold text-black/80">
                <li>✓ Vous avez une offre claire et vendable</li>
                <li>✓ Vous voulez activer des synergies rapidement</li>
                <li>✓ Vous êtes prêt à exécuter un plan simple</li>
              </ul>
            </article>
            <article className="rounded-xl border border-black/15 bg-white p-5">
              <p className="text-xs uppercase tracking-[0.16em] font-black text-black/65">Pas pour qui</p>
              <ul className="mt-3 space-y-2.5 text-[26px] md:text-2xl leading-[1.35] font-semibold text-black/75">
                <li>✕ Vous cherchez un système sans action terrain</li>
                <li>✕ Vous refusez la logique de réciprocité partenaire</li>
                <li>✕ Vous n’avez pas encore de base d’offre solide</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-14">
          <p className="text-xs uppercase tracking-[0.2em] font-black text-black/55">FAQ rapide</p>
          <h2 className="text-5xl md:text-6xl font-black leading-tight">Questions fréquentes</h2>
          <div className="mt-7 space-y-3">
            {faqItems.map((item) => (
              <details key={item.q} className="rounded-xl border border-black/15 bg-white px-5 py-4">
                <summary className="cursor-pointer font-black text-[26px] md:text-[30px] leading-[1.25]">{item.q}</summary>
                <p className="mt-3 text-[22px] md:text-2xl leading-[1.45] font-medium text-black/75">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-[#F5F5F5]">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-5xl md:text-6xl font-black leading-tight max-w-5xl">Nous ne retenons pas tous les profils.</h2>
          <p className="mt-5 text-[21px] md:text-2xl leading-[1.45] font-medium text-black/80 max-w-5xl">
            Popey fonctionne mieux avec des professionnels qui ont déjà une expertise, vendent une offre claire, comprennent la réciprocité et peuvent activer une vraie complémentarité métier.
          </p>
          <p className="mt-5 text-[21px] md:text-2xl leading-[1.45] font-medium text-black/80 max-w-5xl">
            L’Audit de Synergie sert à vérifier si votre métier est compatible, quel partenaire activer en premier, et si une synergie rentable peut être construite rapidement.
          </p>
          <div className="mt-5 rounded-xl border border-black bg-white px-4 py-3 max-w-5xl">
            <p className="text-[22px] md:text-2xl leading-[1.35] font-black">Si votre profil est validé, vous repartez avec une direction claire. Si ce n’est pas le bon moment, on vous le dira.</p>
          </div>
        </div>
      </section>

      <section className="bg-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-3xl md:text-6xl font-black max-w-4xl">Vérifiez si votre métier peut générer plus avec les mêmes clients.</h2>
          <p className="mt-4 text-base md:text-lg font-medium text-white/85 max-w-4xl">
            En 15 minutes, on valide votre partenaire prioritaire, votre première synergie activable et votre potentiel réel.
          </p>
          <div className="mt-7">
            <button
              type="button"
              onClick={() => {
                setSelectedMetierId("");
                setShowMetierModal(true);
              }}
              className="inline-flex items-center justify-center rounded-md bg-[#B6FF2B] text-black px-7 py-3 text-sm font-black uppercase tracking-wide transition hover:translate-y-[-1px]"
            >
              Voir si mon métier est dans la liste
            </button>
          </div>
          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-white/70">Audit court • Sur sélection • Sans engagement</p>
        </div>
      </section>

      <div className="fixed bottom-3 left-3 right-3 z-50 md:left-auto md:right-6 md:w-[380px]">
        <button
          type="button"
          onClick={() => {
            setSelectedMetierId("");
            setShowMetierModal(true);
          }}
          className="flex w-full items-center justify-center rounded-md bg-[#B6FF2B] text-black px-4 py-4 md:py-3 text-base md:text-sm font-black uppercase tracking-wide shadow-[0_12px_30px_-12px_rgba(182,255,43,0.9)] transition hover:scale-[1.01]"
        >
          Voir si mon métier est dans la liste
        </button>
      </div>

      {showCityModal && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowCityModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-black/55">Disponibilité ville</p>
                <h3 className="mt-1 text-2xl font-black">Villes actuellement ouvertes</h3>
              </div>
              <button
                onClick={() => setShowCityModal(false)}
                className="rounded-md border border-black/15 px-2 py-1 text-xs font-black uppercase tracking-wide"
              >
                Fermer
              </button>
            </div>
            <div className="mt-4 rounded-xl border border-[#2F7A00]/20 bg-[#E9F9D9] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.12em] font-black text-[#2F7A00]">Ville disponible</p>
              <p className="mt-1 text-xl font-black text-[#1E4F00]">Le grand Dax</p>
            </div>
          </div>
        </div>
      )}

      {showMetierModal && (
        <div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
          onClick={() => setShowMetierModal(false)}
        >
          <div
            className="w-full max-w-4xl h-[92dvh] sm:h-auto sm:max-h-[92vh] rounded-t-2xl sm:rounded-2xl border border-black/10 bg-[#0F1110] text-white flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 border-b border-white/10 bg-[#111513] px-4 py-3 sm:px-5 sm:py-4 rounded-t-2xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#B6FF2B]/80">Simulateur de rentabilité</p>
                  <h3 className="mt-1 text-xl sm:text-2xl font-black">Choisissez votre métier (30 disponibles)</h3>
                </div>
                <button
                  onClick={() => setShowMetierModal(false)}
                  className="rounded-md border border-white/20 px-3 py-1 text-xs font-black uppercase tracking-wide text-white/90"
                >
                  Fermer
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <label htmlFor="metier-select" className="text-xs font-black uppercase tracking-[0.14em] text-white/75">
                  Métier
                </label>
                <select
                  id="metier-select"
                  value={selectedMetierId}
                  onChange={(e) => setSelectedMetierId(e.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-white/20 bg-[#1A1E1C] px-3 text-sm font-bold text-white"
                >
                  <option value="">Métier</option>
                  {metierSimulatorData.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.metier}
                    </option>
                  ))}
                </select>
              </div>

              {selectedMetier ? (
                <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-[#B6FF2B]/30 bg-[#1A2513] p-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#B6FF2B]/85">{indiceNom}</p>
                  <p className="mt-1 text-2xl font-black text-[#B6FF2B]">{niveauForce}</p>
                  <div className="mt-2 h-2 rounded-full bg-white/15 overflow-hidden">
                    <div className="h-full bg-[#B6FF2B] transition-all duration-500" style={{ width: `${Math.max(55, strategicIndex)}%` }} />
                  </div>
                  <p className="mt-1 text-xs font-bold text-[#B6FF2B]/85">{isPilierProfile ? "Logique volume" : "Logique conversion rapide"}</p>
                </div>

                <div className="rounded-xl border border-[#E7BE65]/35 bg-[#2A2111] p-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#E7BE65]/85">CA Additionnel Potentiel</p>
                  <p className="mt-1 text-2xl font-black text-[#E7BE65]">{animatedCa.toLocaleString("fr-FR")}€</p>
                  <p className="text-xs text-white/70">Mensuel estimé</p>
                </div>

                <div className="rounded-xl border border-[#E7BE65]/35 bg-[#2A2111] p-3 sm:col-span-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#E7BE65]/85">Commissions Nettes</p>
                  <p className="mt-1 text-2xl font-black text-[#E7BE65]">{animatedComm.toLocaleString("fr-FR")}€</p>
                  <p className="text-xs text-white/70">Mensuel estimé</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/70">Radar Inbound</p>
                  <p className="text-sm font-bold text-[#B6FF2B]">Qui vous envoie du business ?</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedMetier.inbound.map((entry) => (
                      <span key={entry} className="rounded-full border border-white/20 bg-black/30 px-2.5 py-1 text-xs font-bold">
                        ↓ {entry}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/70">Radar Outbound</p>
                  <p className="text-sm font-bold text-[#B6FF2B]">Sur qui faites-vous ruisseler ?</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedMetier.outbound.map((entry) => (
                      <span key={entry} className="rounded-full border border-white/20 bg-black/30 px-2.5 py-1 text-xs font-bold">
                        ↑ {entry}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/70">Label de Force</p>
                <p className="mt-1 text-base font-black text-[#B6FF2B]">{labelForce}</p>
                <p className="mt-1 text-sm font-medium leading-relaxed text-white/85">{descriptionForce}</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/70">Narratif Popey</p>
                <p className="mt-1 text-sm font-medium leading-relaxed text-white/85">{selectedMetier.narratif}</p>
              </div>
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-4 text-center">
                  <p className="text-sm font-bold text-white/85">Choisissez votre métier pour afficher votre simulation complète.</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 border-t border-white/10 bg-[#111513] p-3">
              {selectedMetier ? (
                <Link
                  href="/programme-commando/postuler"
                  className="blink-cta flex h-11 w-full items-center justify-center rounded-xl bg-[#B6FF2B] text-black text-sm font-black uppercase tracking-wide"
                >
                  Ma place est-elle encore libre à Dax ?
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex h-11 w-full items-center justify-center rounded-xl border border-white/20 bg-white/5 text-sm font-black uppercase tracking-wide text-white/55"
                >
                  Sélectionnez un métier
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <style jsx global>{`
        @keyframes walkToPopey {
          0% { transform: translateX(0) translateY(0); opacity: 1; }
          20% { transform: translateX(56px) translateY(-2px); opacity: 1; }
          40% { transform: translateX(116px) translateY(0); opacity: 1; }
          60% { transform: translateX(188px) translateY(-2px); opacity: 1; }
          76% { transform: translateX(248px) translateY(0); opacity: 1; }
          84% { transform: translateX(278px) translateY(0); opacity: 1; }
          92% { transform: translateX(294px) translateY(0); opacity: 0; }
          100% { transform: translateX(294px) translateY(0); opacity: 0; }
        }
        @keyframes doorOpenLoop {
          0%, 54% { transform: rotateY(0deg); }
          68%, 82% { transform: rotateY(-82deg); }
          93%, 100% { transform: rotateY(0deg); }
        }
        @keyframes legSwingLeft {
          0%, 100% { transform: translateX(-4px) rotate(24deg); }
          50% { transform: translateX(-4px) rotate(-24deg); }
        }
        @keyframes legSwingRight {
          0%, 100% { transform: translateX(4px) rotate(-24deg); }
          50% { transform: translateX(4px) rotate(24deg); }
        }
        @keyframes enterGlow {
          0%, 70% { opacity: 0.15; transform: scale(0.85); }
          82%, 100% { opacity: 0.55; transform: scale(1.05); }
        }
        @keyframes revealAddedRole {
          0%, 86% { opacity: 0; transform: translateY(4px); }
          94%, 100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes popCheck {
          0%, 90% { transform: scale(0.5); opacity: 0; }
          95% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes revealFinalResult {
          0%, 90% { opacity: 0; transform: translateY(5px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes timelineGrow {
          0% { transform: scaleY(0); opacity: 0.25; }
          100% { transform: scaleY(1); opacity: 1; }
        }
        @keyframes timelineStepIn {
          0% { opacity: 0; transform: translateY(16px); filter: blur(2px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes timelineDotPop {
          0% { transform: scale(0.65); box-shadow: 0 0 0 0 rgba(182,255,43,0.6); }
          70% { transform: scale(1.08); box-shadow: 0 0 0 8px rgba(182,255,43,0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(182,255,43,0); }
        }
        @keyframes heroCardLeftIn {
          0%, 10% { opacity: 0; transform: translateX(-16px); }
          18%, 100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes heroHubReveal {
          0%, 24% { opacity: 0; transform: translate(-50%, -50%) scale(0.85); }
          34%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes heroHubBeat {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.05); }
        }
        @keyframes heroCardRightIn {
          0%, 46% { opacity: 0; transform: translateX(16px); }
          56%, 100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes heroLineGrow {
          0%, 26% { transform: scaleX(0); opacity: 0.2; }
          38%, 100% { transform: scaleX(1); opacity: 1; }
        }
        @keyframes heroTokenFlow {
          0%, 36% { transform: translateX(0); opacity: 0; }
          42% { opacity: 1; }
          72% { transform: translateX(calc(100% - 10px)); opacity: 1; }
          82%, 100% { transform: translateX(calc(100% - 10px)); opacity: 0; }
        }
        @keyframes heroStepReveal1 {
          0%, 10%, 100% { opacity: 0.45; }
          18%, 34% { opacity: 1; }
        }
        @keyframes heroStepReveal2 {
          0%, 26%, 100% { opacity: 0.45; }
          36%, 56% { opacity: 1; }
        }
        @keyframes heroStepReveal3 {
          0%, 50%, 100% { opacity: 0.45; }
          60%, 86% { opacity: 1; }
        }
        @keyframes heroStatusReveal {
          0%, 74% { opacity: 0; transform: translateY(4px); }
          86%, 100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroHubTravelMobile {
          0% { transform: translate(-50%, -50%) translateX(calc(-1 * clamp(66px, 17vw, 90px))); }
          50% { transform: translate(-50%, -50%) translateX(clamp(66px, 17vw, 90px)); }
          100% { transform: translate(-50%, -50%) translateX(calc(-1 * clamp(66px, 17vw, 90px))); }
        }
        @keyframes heroHubRoll {
          0% { transform: translate(-50%, -50%) translateX(calc(-1 * var(--hub-travel))) rotate(-560deg); }
          100% { transform: translate(-50%, -50%) translateX(var(--hub-travel)) rotate(560deg); }
        }
        @keyframes ctaGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(182,255,43,0.25); transform: translateY(0); }
          50% { box-shadow: 0 0 0 8px rgba(182,255,43,0); transform: translateY(-1px); }
        }
        .walk-man {
          animation: walkToPopey 6.8s ease-in-out 1 forwards;
        }
        .walk-leg-left {
          animation: legSwingLeft 0.45s ease-in-out 15 forwards;
        }
        .walk-leg-right {
          animation: legSwingRight 0.45s ease-in-out 15 forwards;
        }
        .door-open {
          animation: doorOpenLoop 6.8s ease-in-out 1 forwards;
        }
        .door-light {
          animation: enterGlow 6.8s ease-in-out 1 forwards;
        }
        .added-role {
          animation: revealAddedRole 6.8s ease-in-out 1 forwards;
        }
        .added-check {
          animation: popCheck 6.8s ease-in-out 1 forwards;
        }
        .final-result {
          animation: revealFinalResult 6.8s ease-in-out 1 forwards;
        }
        .timeline-line {
          transform-origin: top;
          animation: timelineGrow 1.1s cubic-bezier(0.2, 0.8, 0.2, 1) 1 both;
          animation-play-state: paused;
        }
        .timeline-step {
          animation: timelineStepIn 0.75s cubic-bezier(0.2, 0.8, 0.2, 1) 1 both;
          animation-play-state: paused;
        }
        .timeline-step-1 {
          animation-delay: 0.18s;
        }
        .timeline-step-2 {
          animation-delay: 0.42s;
        }
        .timeline-step-3 {
          animation-delay: 0.66s;
        }
        .timeline-dot {
          animation: timelineDotPop 0.55s ease-out 1 both;
          animation-play-state: paused;
        }
        .timeline-step-1 .timeline-dot {
          animation-delay: 0.24s;
        }
        .timeline-step-2 .timeline-dot {
          animation-delay: 0.48s;
        }
        .timeline-step-3 .timeline-dot {
          animation-delay: 0.72s;
        }
        .timeline-live .timeline-line,
        .timeline-live .timeline-step,
        .timeline-live .timeline-dot {
          animation-play-state: running;
        }
        .hero-card-left {
          animation: none;
        }
        .hero-card-right {
          animation: none;
        }
        .hero-hub {
          --hub-travel: clamp(86px, 14vw, 168px);
          animation: heroHubRoll 4.8s linear infinite alternate;
        }
        .hero-line-main {
          transform-origin: left;
          animation: none;
        }
        .hero-token-main {
          display: none;
        }
        .hero-step-1 {
          animation: none;
        }
        .hero-step-2 {
          animation: none;
        }
        .hero-step-3 {
          animation: none;
        }
        .hero-status {
          animation: none;
        }
        .blink-cta {
          animation: ctaGlow 1.8s ease-in-out infinite;
        }
        @media (max-width: 767px) {
          .hero-hub {
            --hub-travel: clamp(50px, 17vw, 70px);
            animation-duration: 4.1s;
          }
        }
      `}</style>
    </main>
  );
}
