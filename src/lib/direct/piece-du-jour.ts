// 🌟 LA PIÈCE DU JOUR D'UN COMMERCE — celle qu'il vient de publier à son comptoir.
//
// « Quand un restaurateur met son menu du jour, il apparaît sur l'app et sur
// sa page. Mais sur la page d'un coiffeur, d'un magasin de vêtements, d'une
// onglerie… la pièce du jour apparaît-elle sur l'essayage quand le commerçant
// la met en vedette, comme on la verrait sur l'application ? »
//
// ELLE Y ÉTAIT, MAIS PERDUE DANS LA GRILLE : la première case, de la taille
// des autres, sans rien qui dise « aujourd'hui ». Ce fichier la retrouve dans
// son catalogue, pour que l'onglet Expérience la montre en vedette.
//
// CE QUI LA RECONNAÎT : une entrée de son catalogue AVEC SA DATE DE
// PUBLICATION (`publieLe`) et sa photo — c'est-à-dire une annonce de son
// comptoir (`pieces-comptoir.ts`), jamais une photo de sa vitrine, qui n'a pas
// de date et reste. La plus récente, si elle n'est pas finie.
//
// FICHIER PARTAGÉ : aucune dépendance au serveur.
import type { ArticleCatalogue } from "@/lib/direct/apercu-habitant";

export type PieceDuJour = {
  article: ArticleCatalogue & { photo: string };
  /** « Aujourd’hui » si elle a été publiée aujourd'hui, « En ce moment » sinon — on ne dit pas « du jour » d'une pièce d'hier. */
  quand: "Aujourd’hui" | "En ce moment";
  /** « jusqu’à 18 h », « jusqu’à ce soir », « jusqu’au samedi 17 octobre » — absent sans fin connue. */
  jusqua?: string;
};

/** Le jour et l'heure à Paris — la même règle que le bandeau de sa page (`offreDuSite`). */
function aParis(t: Date): { jour: string; h: number; m: number } {
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(t);
  const n = (k: string) => Number(p.find((x) => x.type === k)?.value ?? 0);
  return { jour: t.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" }), h: n("hour"), m: n("minute") };
}

/** « jusqu’à 18 h » — écrit comme le bandeau « En ce moment » de sa page. */
export function jusquaDe(fin: string | undefined, maintenant = new Date()): string | undefined {
  const f = fin ? new Date(fin) : null;
  if (!f || !Number.isFinite(f.getTime())) return undefined;
  const a = aParis(f);
  const ici = aParis(maintenant);
  if (a.jour !== ici.jour) {
    return `jusqu’au ${f.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long" })}`;
  }
  // 23 h 59 : c'est « la pièce du jour », pas une heure à surveiller.
  if (a.h * 60 + a.m >= 23 * 60 + 30) return "jusqu’à ce soir";
  return `jusqu’à ${a.h} h${a.m ? ` ${String(a.m).padStart(2, "0")}` : ""}`;
}

export function pieceDuJour(catalogue: ArticleCatalogue[] | undefined, maintenant = new Date()): PieceDuJour | null {
  const t = maintenant.getTime();
  const annonces = (catalogue ?? [])
    .filter((a): a is ArticleCatalogue & { photo: string; publieLe: string } =>
      Boolean(a.photo && a.publieLe && Number.isFinite(Date.parse(a.publieLe))),
    )
    .filter((a) => !a.fin || !Number.isFinite(Date.parse(a.fin)) || Date.parse(a.fin) > t)
    .sort((a, b) => Date.parse(b.publieLe) - Date.parse(a.publieLe));
  const a = annonces[0];
  if (!a) return null;
  return {
    article: a,
    quand: aParis(new Date(a.publieLe)).jour === aParis(maintenant).jour ? "Aujourd’hui" : "En ce moment",
    jusqua: jusquaDe(a.fin, maintenant),
  };
}
