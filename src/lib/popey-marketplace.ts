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
    "Medecin generaliste",
    "Osteopathe",
    "Kinesitherapeute",
    "Orthophoniste",
    "Orthoptiste",
    "Psychologue",
    "Psychiatre",
    "Sage-femme",
    "Infirmier liberal",
    "Pharmacien",
    "Dentiste",
    "Orthodontiste",
    "Podologue",
    "Dieteticien",
    "Nutritionniste",
    "Sophrologue",
    "Naturopathe",
    "Coach sportif",
    "Audioprothesiste",
    "Opticien",
    "Dermatologue",
    "Pediatre",
    "Gynecologue",
    "Cardiologue",
    "Rhumatologue",
    "Ergotherapeute",
    "Psychomotricien",
    "Chiropracteur",
    "Acupuncteur",
    "Masseur-kine du sport",
  ],
  habitat: [
    "Agent immobilier",
    "Courtier credit",
    "Notaire",
    "Diagnostiqueur",
    "Architecte",
    "Maitre d oeuvre",
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
    "Expert batiment",
    "Geometre",
    "Syndic de copropriete",
    "Gestionnaire locatif",
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
    "Expert-comptable",
    "Commissaire aux comptes",
    "Avocat fiscaliste",
    "Avocat affaires",
    "CGP",
    "Courtier assurance",
    "Courtier pro",
    "Conseiller bancaire",
    "Gestionnaire patrimoine",
    "Notaire finance",
    "Consultant subventions",
    "Expert financement",
    "DF externalise",
    "Tresorier externalise",
    "Fiscaliste international",
    "Analyste credit",
    "Assureur entreprise",
    "Courtier immobilier",
    "Conseiller retraite",
    "Conseiller prevoyance",
    "Mediateur financier",
    "Juriste droit social",
    "Juriste droit des societes",
    "Expert recouvrement",
    "Auditeur financier",
    "Risk manager",
    "Consultant M&A",
    "Expert paie",
    "Expert conformite",
    "Expert RGPD",
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
