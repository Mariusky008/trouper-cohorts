/**
 * 🧾 SA SEMAINE, DITE EN CLIENTS — les mêmes phrases dans son espace et dans le SMS du lundi.
 *
 * « Un commerçant ne paie pas des fonctions, il paie des clients. » Pas « 412
 * vues » : « 23 personnes ont essayé vos pièces, 6 vous ont demandé une mise de
 * côté, vous en avez confirmé 4. » Une ligne par geste qui a eu lieu ; rien
 * pour ce qui vaut zéro (un zéro ne motive personne, il inquiète).
 *
 * FICHIER PUR.
 */
import type { CleMetier } from "@/lib/direct/apercu-habitant";
import type { SemaineEnClients } from "@/lib/site-internet/compteurs-jour";

/** Ce qu'on essaie chez lui — au vous (son espace) ou au tu (son comptoir). */
const CE_QU_ON_ESSAIE: Partial<Record<CleMetier, [string, string]>> = {
  mode: ["vos pièces", "tes pièces"],
  coiffeur: ["une de vos coupes", "une de tes coupes"],
  ongles: ["une de vos poses", "une de tes poses"],
  lunetier: ["vos montures", "tes montures"],
  fleuriste: ["vos bouquets", "tes bouquets"],
  artisan: ["vos créations", "tes créations"],
};

export type LigneSemaine = { cle: string; emoji: string; texte: string; nombre: number; hausse?: number };

const pluriel = (n: number, un: string, plusieurs: string) => (n > 1 ? plusieurs : un);

export function lignesDeLaSemaine(s: SemaineEnClients, branche?: CleMetier | string, tu = false): LigneSemaine[] {
  const c = s.cette;
  const a = s.avant;
  const v = (vous: string, toi: string) => (tu ? toi : vous);
  const hausse = (q: keyof typeof c) => (c[q] > a[q] ? c[q] - a[q] : undefined);
  const out: LigneSemaine[] = [];
  const ajouter = (cle: keyof typeof c, emoji: string, texte: string) => {
    if (c[cle] > 0) out.push({ cle, emoji, texte, nombre: c[cle], ...(hausse(cle) ? { hausse: hausse(cle) } : {}) });
  };
  const essaye = CE_QU_ON_ESSAIE[(branche || "mode") as CleMetier] ?? CE_QU_ON_ESSAIE.mode!;
  ajouter("vues", "👀", `${c.vues} ${pluriel(c.vues, "personne a ouvert", "personnes ont ouvert")} ${v("votre", "ta")} page`);
  ajouter("essais", "🪞", `${c.essais} ${pluriel(c.essais, "essai", "essais")} de ${essaye[tu ? 1 : 0]}, sur la photo du client`);
  if (c.cotes > 0) {
    out.push({
      cle: "cotes",
      emoji: "🛍️",
      texte:
        `${c.cotes} ${pluriel(c.cotes, "demande", "demandes")} de mise de côté` +
        (c.confirmees > 0 ? ` — ${v("vous en avez", "tu en as")} confirmé ${c.confirmees}` : ""),
      nombre: c.cotes,
      ...(hausse("cotes") ? { hausse: hausse("cotes") } : {}),
    });
  }
  if (c.avis > 0 || c.amis > 0) {
    out.push({
      cle: "avis",
      emoji: "🤔",
      texte:
        (c.avis > 0 ? `${c.avis} ${pluriel(c.avis, "client a demandé « Ça me va ? » à ses amis", "clients ont demandé « Ça me va ? » à leurs amis")}` : "Des amis de clients sont venus") +
        (c.amis > 0 ? ` — ${c.amis} ${pluriel(c.amis, "ami est venu", "amis sont venus")} voir ${v("votre", "ta")} page` : ""),
      nombre: c.avis + c.amis,
      ...(hausse("amis") ? { hausse: hausse("amis") } : {}),
    });
  }
  ajouter("voisins", "🏘️", `${c.voisins} ${pluriel(c.voisins, "client envoyé", "clients envoyés")} par ${v("vos", "tes")} voisins`);
  return out;
}

/**
 * LE SMS DU LUNDI, COURT : chaque SMS coûte, et un SMS accentué tient en 70
 * signes. Les chiffres qui comptent en clients, puis le lien de son espace,
 * où les phrases complètes l'attendent.
 */
export function smsDeLaSemaine(nom: string, s: SemaineEnClients, branche: CleMetier | undefined, lien: string): string | null {
  void branche;
  const c = s.cette;
  const parts: string[] = [];
  if (c.essais) parts.push(`${c.essais} ${pluriel(c.essais, "essai", "essais")}`);
  if (c.cotes) parts.push(`${c.cotes} ${pluriel(c.cotes, "mise de côté demandée", "mises de côté demandées")}${c.confirmees ? ` (${c.confirmees} ${pluriel(c.confirmees, "confirmée", "confirmées")})` : ""}`);
  if (c.amis) parts.push(`${c.amis} ${pluriel(c.amis, "ami de client venu", "amis de clients venus")}`);
  else if (c.avis) parts.push(`${c.avis} « Ça me va ? » ${pluriel(c.avis, "envoyé", "envoyés")}`);
  if (c.voisins) parts.push(`${c.voisins} ${pluriel(c.voisins, "client envoyé", "clients envoyés")} par vos voisins`);
  if (!parts.length) return null;
  return `ClikMe, votre semaine (${nom}) : ${parts.join(", ")}. Détail : ${lien}`;
}
