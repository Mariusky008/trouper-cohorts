// 🎁 QUEL CADEAU POUR CE MÉTIER — le pont entre l'activité écrite sur la fiche
// et les mots de `cadeau-offert.ts`. Une profession réglementée (santé, droit)
// n'en a pas, quelle que soit sa branche : la déontologie l'interdit.
import { brancheDuMetier } from "@/lib/site-internet/carte-depuis-fiche";
import { resolveMetier } from "@/lib/site-internet/metier-profiles";
import { profilCadeau, type ProfilCadeau } from "@/lib/site-internet/cadeau-offert";

export function cadeauDuMetier(activite: string): { branche: string; profil: ProfilCadeau } | null {
  if ((resolveMetier(activite).entry?.deontologie ?? "none") !== "none") return null;
  const branche = brancheDuMetier(activite);
  const profil = profilCadeau(branche);
  return profil ? { branche, profil } : null;
}
