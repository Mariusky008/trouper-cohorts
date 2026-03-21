export type PointsTier = {
  key: "explorateur" | "initiateur" | "createur" | "ambassadeur";
  label: string;
  minPoints: number;
  maxPoints: number | null;
  rights: string[];
  accentClass: string;
};

export const POINTS_TIERS: PointsTier[] = [
  {
    key: "explorateur",
    label: "Explorateur",
    minPoints: 0,
    maxPoints: 199,
    rights: ["Accès au réseau local"],
    accentClass: "text-stone-700 bg-stone-100 border-stone-200",
  },
  {
    key: "initiateur",
    label: "Initiateur",
    minPoints: 200,
    maxPoints: 499,
    rights: ["Invitation mensuelle commune", "Visibilité prioritaire sur votre profil"],
    accentClass: "text-blue-700 bg-blue-50 border-blue-200",
  },
  {
    key: "createur",
    label: "Créateur",
    minPoints: 500,
    maxPoints: 999,
    rights: ["Invitation mensuelle commune", "Accès atelier réseau privé"],
    accentClass: "text-fuchsia-700 bg-fuchsia-50 border-fuchsia-200",
  },
  {
    key: "ambassadeur",
    label: "Ambassadeur",
    minPoints: 1000,
    maxPoints: null,
    rights: ["Table mensuelle commune", "Cercle ambassadeurs local"],
    accentClass: "text-amber-700 bg-amber-50 border-amber-200",
  },
];

export function getPointsTier(points: number) {
  const safePoints = Math.max(0, points || 0);
  const tier =
    POINTS_TIERS.find((item) => safePoints >= item.minPoints && (item.maxPoints === null || safePoints <= item.maxPoints)) ||
    POINTS_TIERS[0];
  const nextTier = POINTS_TIERS.find((item) => item.minPoints > safePoints) || null;
  return { tier, nextTier };
}

export function getMissionPointsByChannel(actionChannel: string) {
  if (actionChannel === "whatsapp") return 40;
  if (actionChannel === "social_link") return 10;
  return 30;
}

export function getResponseSpeedBonus(completedAt?: string | null, confirmedAt?: string | null) {
  if (!completedAt || !confirmedAt) return 0;
  const diffMs = new Date(confirmedAt).getTime() - new Date(completedAt).getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return 0;
  const diffHours = diffMs / 3600000;
  if (diffHours <= 24) return 20;
  if (diffHours <= 48) return 10;
  if (diffHours <= 72) return 5;
  return 0;
}
