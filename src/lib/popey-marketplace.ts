export type MarketplaceSphereKey = "sante" | "habitat" | "digital" | "mariage" | "finance";

export type MarketplacePlace = {
  city: string;
  citySlug: string;
  sphereKey: MarketplaceSphereKey;
  sphereLabel: string;
  metier: string;
  metierSlug: string;
  status: "dispo" | "sale";
  listPriceEur: number | null;
  monthlyCaEur: number;
  recosPerYear: number;
  conversionRate: number;
  monthsActive: number;
  reciprocityScore: number;
  partnersCount: number;
  valueGrowthPct: number;
};

const SPHERES: Record<MarketplaceSphereKey, string> = {
  sante: "Sante",
  habitat: "Habitat",
  digital: "Digital",
  mariage: "Mariage",
  finance: "Finance",
};

const CITY_OPTIONS = [
  "Dax (40)",
  "Bayonne (64)",
  "Mont-de-Marsan (40)",
  "Pau (64)",
  "Bordeaux (33)",
  "Hossegor (40)",
  "Saint-Paul-les-Dax (40)",
  "Hagetmau (40)",
] as const;

const METIERS: Record<MarketplaceSphereKey, string[]> = {
  sante: [
    "Coach bien-etre",
    "Coach sportif",
    "Naturopathe",
    "Sophrologue",
    "Praticien en hypnose",
    "Reflexologue",
    "Praticien en relaxation",
    "Professeur de yoga",
    "Professeur de pilates",
    "Praticien shiatsu bien-etre",
    "Masseur bien-etre",
    "Spa manager",
    "Coach respiration",
    "Professeur de meditation",
    "Educateur sportif",
    "Preparateur mental",
    "Coach sommeil",
    "Coach nutrition bien-etre",
    "Praticien EFT",
    "Praticien sonotherapie",
    "Praticien aromatherapie",
    "Praticien ayurveda bien-etre",
    "Coach mobilite",
    "Coach postural",
    "Coach anti-stress",
    "Coach burn-out prevention",
    "Praticien drainage bien-etre",
    "Praticien massage assis",
    "Praticien relaxation aquatique",
    "Coach remise en forme",
  ],
  habitat: [
    "Maitre d oeuvre",
    "Promoteur immobilier",
    "Promoteur",
    "Constructeur maison",
    "Plombier",
    "Electricien",
    "Menuisier",
    "Serrurier",
    "Peintre",
    "Carreleur",
    "Macon",
    "Couvreur",
    "Charpentier",
    "Chauffagiste",
    "Climaticien",
    "Paysagiste",
    "Jardinier",
    "Pisciniste",
    "Cuisiniste",
    "Agenceur interieur",
    "Decorateur",
    "Home stager",
    "Expert renovation energetique",
    "Installateur panneaux solaires",
    "Installateur borne de recharge",
    "Facadier",
    "Terrassier",
    "Etancheur",
    "Solier",
    "Plaquiste",
    "Domoticien",
  ],
  digital: [
    "Developpeur web",
    "Developpeur mobile",
    "Designer UI",
    "Designer UX",
    "Motion designer",
    "Monteur video",
    "Photographe pro",
    "Community manager",
    "Traffic manager",
    "Consultant SEO",
    "Consultant SEA",
    "Copywriter",
    "Ghostwriter",
    "Closer",
    "Setter",
    "Media buyer",
    "Expert IA",
    "Automatisation no-code",
    "Integrateur Webflow",
    "Expert CRM",
    "Growth marketer",
    "Data analyst",
    "Consultant cybersecurite",
    "Hebergeur web",
    "Infographiste",
    "Brand designer",
    "Formateur digital",
    "Coach LinkedIn",
    "Podcasteur",
    "Attache de presse digital",
  ],
  mariage: [
    "Photographe mariage",
    "Videaste mariage",
    "Wedding planner",
    "Officiant ceremonie",
    "Traiteur mariage",
    "Patissier wedding cake",
    "Fleuriste mariage",
    "DJ mariage",
    "Groupe live",
    "Animateur soiree",
    "Loueur salle",
    "Decorateur evenementiel",
    "Location mobilier",
    "Createur robe",
    "Costumier mariage",
    "Coiffeur mariage",
    "Maquilleuse mariage",
    "Bijoutier alliances",
    "Papeterie mariage",
    "Location voiture",
    "Chauffeur prive",
    "Baby-sitter evenement",
    "Magicien close-up",
    "Feux d artifices",
    "Voyage de noces",
    "Coach danse mariage",
    "Photobooth",
    "Sonorisateur",
    "Eclairagiste",
    "Coordinateur jour J",
  ],
  finance: [
    "Consultant gestion d entreprise",
    "Consultant pilotage financier",
    "DAF externalise",
    "Controleur de gestion externalise",
    "Consultant tresorerie",
    "Consultant pricing",
    "Consultant business plan",
    "Consultant organisation",
    "Consultant achats",
    "Consultant process",
    "Consultant subventions",
    "Consultant financement entreprise",
    "Consultant performance commerciale",
    "Consultant strategie PME",
    "Consultant growth B2B",
    "Consultant transformation digitale",
    "Consultant data business",
    "Consultant CRM",
    "Consultant onboarding clients",
    "Consultant fidelisation",
    "Consultant excellence operationnelle",
    "Consultant gestion de projet",
    "Consultant qualite",
    "Consultant recouvrement amiable",
    "Consultant gestion des risques",
    "Consultant conformite operationnelle",
    "Consultant RGPD",
    "Consultant RSE",
    "Consultant formation management",
    "Consultant franchise",
  ],
};

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function hashCode(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h << 5) - h + value.charCodeAt(i);
  }
  return Math.abs(h);
}

export function generateMarketplacePlaces(): MarketplacePlace[] {
  const places: MarketplacePlace[] = [];
  CITY_OPTIONS.forEach((city) => {
    (Object.keys(SPHERES) as MarketplaceSphereKey[]).forEach((sphereKey) => {
      METIERS[sphereKey].forEach((metier) => {
        const key = `${city}|${sphereKey}|${metier}`;
        const h = hashCode(key);
        const status = h % 100 < 42 ? "sale" : "dispo";
        const monthsActive = 6 + (h % 31);
        const recosPerYear = 20 + (h % 220);
        const partnersCount = 12 + (h % 75);
        const conversionRate = 18 + (h % 36);
        const monthlyCaEur = status === "sale" ? 900 + (h % 8600) : 0;
        const listPriceEur =
          status === "sale" ? 1300 + Math.round(monthlyCaEur * 0.72 + monthsActive * 38 + recosPerYear * 6) : null;

        places.push({
          city,
          citySlug: slugify(city),
          sphereKey,
          sphereLabel: SPHERES[sphereKey],
          metier,
          metierSlug: slugify(metier),
          status,
          listPriceEur,
          monthlyCaEur,
          recosPerYear,
          conversionRate,
          monthsActive,
          reciprocityScore: 2 + (h % 4),
          partnersCount,
          valueGrowthPct: 12 + (h % 220),
        });
      });
    });
  });
  return places;
}

export function getMarketplaceCities(): string[] {
  return [...CITY_OPTIONS];
}
