export type MarketplaceSphereKey = "evenements-locaux" | "sante" | "habitat" | "digital" | "mariage" | "finance";

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

type MarketplaceValueCounterInput = {
  monthsActive: number;
  recosCount: number;
  offersBoughtCount: number;
  sphereKey?: string | null;
};

export const MARKETPLACE_VALUE_COUNTER = {
  perMonthEur: 75,
  perRecoEur: 40,
  perAcceptedBuyOfferEur: 180,
  consistencyBonusEur: 250,
  starterFloorWhenActiveEur: 500,
} as const;

export const MARKETPLACE_SPHERE_VALUE_MULTIPLIER: Record<string, number> = {
  "evenements-locaux": 1.2,
  habitat: 1.35,
  sante: 1.15,
  mariage: 1.1,
  digital: 1.0,
  finance: 1.25,
};

const SPHERES: Record<MarketplaceSphereKey, string> = {
  "evenements-locaux": "Evenements locaux",
  sante: "Sante",
  habitat: "Habitat",
  digital: "Digital",
  mariage: "Mariage",
  finance: "Finance",
};

const CITY_OPTIONS = [
  "Bayonne-Anglet-Biarritz",
  "Bordeaux",
  "Grand Dax",
  "Pau",
] as const;

const METIERS: Record<MarketplaceSphereKey, string[]> = {
  "evenements-locaux": [
    "Organisateur evenementiel local",
    "Coordinateur evenementiel",
    "Animateur local",
    "Maitre de ceremonie",
    "Sonorisateur evenement",
    "Eclairagiste evenementiel",
    "DJ evenement local",
    "Groupe live local",
    "Traiteur evenement local",
    "Food truck evenementiel",
    "Photographe evenement",
    "Videaste evenement",
    "Location chapiteau",
    "Location mobilier evenementiel",
    "Decorateur evenementiel",
    "Fleuriste evenement",
    "Hotesse d accueil evenement",
    "Securite evenementielle",
    "Regisseur evenementiel",
    "Imprimeur signaletique evenement",
    "Community manager evenement",
    "Speaker conferencier",
    "Coach prise de parole",
    "Magicien close-up evenement",
    "Artiste performer local",
    "Location jeux gonflables",
    "Agence billetterie locale",
    "Coach team building",
    "Organisateur marche local",
    "Organisateur salon local",
  ],
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

export function generateMarketplacePlaces(): MarketplacePlace[] {
  const places: MarketplacePlace[] = [];
  CITY_OPTIONS.forEach((city) => {
    (Object.keys(SPHERES) as MarketplaceSphereKey[]).forEach((sphereKey) => {
      METIERS[sphereKey].forEach((metier) => {
        const status: MarketplacePlace["status"] = "dispo";
        const monthsActive = 0;
        const recosPerYear = 0;
        const partnersCount = 0;
        const conversionRate = 0;
        const monthlyCaEur = 0;
        const listPriceEur = null;

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
          reciprocityScore: 0,
          partnersCount,
          valueGrowthPct: 0,
        });
      });
    });
  });
  return places;
}

export function computeMarketplacePlaceValue(input: MarketplaceValueCounterInput): number {
  const months = Math.max(0, Math.floor(Number(input.monthsActive || 0)));
  const recos = Math.max(0, Math.floor(Number(input.recosCount || 0)));
  const offersBought = Math.max(0, Math.floor(Number(input.offersBoughtCount || 0)));
  const sphereKey = String(input.sphereKey || "").trim().toLowerCase();
  const sphereMultiplier = MARKETPLACE_SPHERE_VALUE_MULTIPLIER[sphereKey] || 1;
  const hasAnyActivity = months > 0 || recos > 0 || offersBought > 0;
  if (!hasAnyActivity) return 0;

  const baseValue =
    months * MARKETPLACE_VALUE_COUNTER.perMonthEur +
    recos * MARKETPLACE_VALUE_COUNTER.perRecoEur +
    offersBought * MARKETPLACE_VALUE_COUNTER.perAcceptedBuyOfferEur;
  const consistencyBonus =
    months >= 3 && recos >= 3 ? MARKETPLACE_VALUE_COUNTER.consistencyBonusEur : 0;
  const rawValue = (baseValue + consistencyBonus) * sphereMultiplier;

  return Math.max(
    MARKETPLACE_VALUE_COUNTER.starterFloorWhenActiveEur,
    Math.round(rawValue),
  );
}

export function monthsSince(isoDate: string | null | undefined): number {
  const raw = String(isoDate || "").trim();
  if (!raw) return 0;
  const parsed = Date.parse(raw);
  if (!Number.isFinite(parsed)) return 0;
  const elapsedMs = Date.now() - parsed;
  if (elapsedMs <= 0) return 0;
  return Math.floor(elapsedMs / (1000 * 60 * 60 * 24 * 30));
}

export function getMarketplaceCities(): string[] {
  return [...CITY_OPTIONS];
}
