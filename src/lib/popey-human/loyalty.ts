// Popey v3 — helpers partagés de la mécanique de fidélité (niveaux, statuts, paliers, codes).

// Normalise un numéro FR (ou international simple) en E.164. Retourne null si invalide.
export function toE164(raw: string): string | null {
  let s = String(raw || "").trim().replace(/[\s.\-()]/g, "");
  if (s.startsWith("00")) s = "+" + s.slice(2);
  if (/^0[1-9]\d{8}$/.test(s)) return "+33" + s.slice(1);
  if (/^33[1-9]\d{8}$/.test(s)) return "+" + s;
  if (/^\+33[1-9]\d{8}$/.test(s)) return s;
  if (/^\+[1-9]\d{7,14}$/.test(s)) return s;
  return null;
}

// Statut lisible dérivé du niveau (= nb de visites validées).
export function statusForLevel(level: number): string {
  const n = Math.max(0, Math.floor(level || 0));
  if (n <= 0) return "Nouvelle rencontre";
  if (n === 1) return "Premier rendez-vous";
  if (n <= 3) return "Régulier·e";
  return "Habitué·e";
}

export type LoyaltyTier = { idx: number; threshold_visits: number; reward_text: string };

// Paliers par défaut (éditables par le commerçant). Cf. cahier des charges §4.
export const DEFAULT_TIERS: LoyaltyTier[] = [
  { idx: 1, threshold_visits: 1, reward_text: "Bienvenue + ta carte Popey démarrée" },
  { idx: 2, threshold_visits: 2, reward_text: "−10 % sur l'addition" },
  { idx: 3, threshold_visits: 3, reward_text: "Café offert ☕" },
  { idx: 4, threshold_visits: 5, reward_text: "Une viennoiserie offerte" },
  { idx: 5, threshold_visits: 10, reward_text: "Habitué·e : baguette offerte chaque semaine" },
];

// Prochaine récompense à débloquer pour un niveau donné (ou null si tout est atteint).
export function nextReward(level: number, tiers: LoyaltyTier[]): { idx: number; threshold: number; reward: string } | null {
  const sorted = [...tiers].sort((a, b) => a.threshold_visits - b.threshold_visits);
  const n = Math.max(0, Math.floor(level || 0));
  for (const t of sorted) {
    if (t.threshold_visits > n) return { idx: t.idx, threshold: t.threshold_visits, reward: t.reward_text };
  }
  return null;
}

// Code de visite à 4 chiffres (montré par le client, saisi par le pro).
export function generateVisitCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}
