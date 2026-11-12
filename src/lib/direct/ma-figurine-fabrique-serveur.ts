/**
 * 🛠️ SA FIGURINE, FABRIQUÉE PAR LE MOTEUR D'IMAGE, DÈS LE DÉPART — 4 novembre 2026 (« le plus simple et le mieux,
 * c'est qu'on ait la possibilité de créer sa figurine dès le départ »). Avant, ClikMe la faisait à la main, à 10
 * figurines gagnées ; à la main, ça ne tient pas pour tout le monde.
 *
 * DEUX PAS, comme ses expressions (`figurine-expressions-serveur.ts`), pour tenir dans le temps d'une requête :
 *   1. SA FIGURINE, bouche fermée : sa photo, ses traits décrits (`decrireTraits`), et la consigne des figurines des
 *      commerçants — le style « film d'animation 3D » qui a marché — avec SES vêtements (ou ceux de son univers : son
 *      métier, sa passion), de l'attitude, et un fond rose vif (`consigneFigurineClient`) ;
 *   2. LA MÊME, BOUCHE OUVERTE (pour qu'elle parle), remise exactement dans le même cadre.
 * La page rappelle tant que ce n'est pas fini. Un verrou (quatre minutes) empêche deux fabrications en même temps.
 *
 * CE QUE ÇA COÛTE, TENU : 3 fabrications par personne et par jour (« Refaire »), et `FIGURINE_CLIENTS_JOUR` (100)
 * nouvelles figurines par jour pour tout ClikMe. Deux images par figurine, et plus rien d'office ensuite (9 novembre
 * 2026 : sa joie n'est plus faite d'avance — `visagesVoulus`) : la première en qualité haute, la bouche ouverte en
 * « medium » (`qualiteSuite`). Sans `OPENAI_API_KEY`, rien ne se fabrique : ClikMe la fait à la
 * main depuis l'admin, comme avant.
 *
 * FICHIER SERVEUR. Le stockage est donné par l'appelant (`Depot`, le dossier de cette fabrication).
 */
import sharp from "sharp";
import { consigneFigurineClient } from "./figurine-pro";
import { decrireTraits } from "./figurine-pro-serveur";
import { consigneBoucheNeutre, editer, poserAuFormat, qualiteFigurine, reprendre, type Depot } from "./figurine-expressions-serveur";
import { signatureDe } from "./signature-serveur";

const s = (v: unknown) => (v == null ? "" : String(v)).trim();

export const moteurBranche = () => Boolean(s(process.env.OPENAI_API_KEY));
export const FABRICATIONS_PAR_JOUR = 3;
export const fabricationsParJourPourTous = () => Math.max(0, Math.floor(Number(process.env.FIGURINE_CLIENTS_JOUR) || 100));

export const NOM_NEUTRE = "fig-n.webp";
export const NOM_PARLE = "fig-p.webp";
/**
 * 🧾 LE SOCLE « UNIVERS » (lot 1, 12 novembre 2026) : à côté de ses deux images, SES TRAITS (avant, ils servaient une
 * fois puis étaient perdus) et la SIGNATURE de chaque image (le moteur, la consigne, les réglages, l'entrée) — c'est ce
 * que lit sa fiche « version 0 » (`fiches-serveur.ts`). Dans `entrees`, « photo » désigne son selfie.
 */
export const NOM_TRAITS = "traits.json";
export const NOM_SIGNATURE_NEUTRE = "fig-n.signature.json";
export const NOM_SIGNATURE_PARLE = "fig-p.signature.json";
const ecrireJsonDans = (depot: Depot, nom: string, x: unknown) => depot.ecrire(nom, Buffer.from(JSON.stringify(x)), "application/json");
const VERROU = "verrou.json";
const DUREE_VERROU = 4 * 60_000;

/** (`detail` : ce que le moteur a répondu, pour le relevé des fabrications ratées de l'admin) */
export type PasFabrique = { fini: boolean; enCours?: boolean; erreur?: string; detail?: string; nouvelle?: boolean };

/**
 * UN PAS DE FABRICATION : sa figurine si elle manque, puis sa bouche ouverte (dans la même requête s'il reste le
 * temps). `nouvelle` : on vient de commencer une figurine (l'appelant la compte pour le plafond du jour).
 */
export async function fabriquerUnPas(depot: Depot, photo: Buffer, avant: number, univers = ""): Promise<PasFabrique> {
  let noms = await depot.lister();
  if (noms.includes(NOM_NEUTRE) && noms.includes(NOM_PARLE)) return { fini: true };
  if (!moteurBranche()) return { fini: false, erreur: "Le moteur d'image n'est pas branché ici." };
  const lireVerrou = async () => {
    try {
      return JSON.parse((await depot.lire(VERROU))?.toString() || "{}") as { le?: number; qui?: string };
    } catch {
      return {};
    }
  };
  if (noms.includes(VERROU) && Date.now() - (Number((await lireVerrou()).le) || 0) < DUREE_VERROU) return { fini: false, enCours: true };
  // LE VERROU EST À NOUS ? (deux pages ouvertes ne paient pas deux fois : voir `fabriquerUnTour`)
  const qui = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  await depot.ecrire(VERROU, Buffer.from(JSON.stringify({ le: Date.now(), qui })), "application/json");
  await new Promise((ok) => setTimeout(ok, 400));
  if ((await lireVerrou()).qui !== qui) return { fini: false, enCours: true };
  let nouvelle = false;
  try {
    // 1. SA FIGURINE, bouche fermée
    if (!noms.includes(NOM_NEUTRE)) {
      nouvelle = true;
      let png: Buffer;
      try {
        png = await sharp(photo).rotate().resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true }).png().toBuffer();
      } catch {
        return { fini: false, erreur: "Ta photo ne s'ouvre pas. Essaie une autre photo." };
      }
      const traits = await decrireTraits(png);
      if (traits) await ecrireJsonDans(depot, NOM_TRAITS, traits);
      // EN FIDÉLITÉ HAUTE AU VISAGE (6 novembre 2026 : en basse, « c'est joli mais ça ne me ressemble plus du tout ») ;
      // c'est la consigne qui la rend dessin animé, et caricature SES traits (`consigneFigurineClient`) —
      // `FIGURINE_CLIENT_FIDELITE=low` pour revenir à la basse (le 5 novembre : « encore plus réaliste qu'avant »)
      // (la seule image en qualité haute : c'est ici que la ressemblance se joue — `qualiteFigurine`)
      const consigne = consigneFigurineClient(traits, univers);
      const fidelite = s(process.env.FIGURINE_CLIENT_FIDELITE) === "low" ? "low" : "high";
      const debut = Date.now();
      let moteur = "";
      let reglages: Record<string, string> = {};
      const r = await editer(png, consigne, avant, fidelite, { quality: qualiteFigurine() }, (m, rg) => {
        moteur = m;
        reglages = rg;
      });
      if (!Buffer.isBuffer(r)) return { fini: false, erreur: r.erreur, detail: r.detail, nouvelle };
      const webp = await sharp(r).resize({ width: 900, withoutEnlargement: true }).webp({ quality: 88 }).toBuffer();
      if (!(await depot.ecrire(NOM_NEUTRE, webp, "image/webp"))) return { fini: false, erreur: "Ta figurine n'a pas pu être rangée.", nouvelle };
      await ecrireJsonDans(depot, NOM_SIGNATURE_NEUTRE, signatureDe(webp, { moteur, consigne, reglages, fidelite, fond: "opaque", entrees: ["photo"], debut }));
      noms = [...noms, NOM_NEUTRE];
      // la bouche ouverte, tout de suite, s'il reste assez de temps (une image du moteur : une minute environ)
      if (avant - Date.now() < 120_000) return { fini: false, nouvelle };
    }
    // 2. SA BOUCHE OUVERTE, dans le même cadre
    const neutre = await depot.lire(NOM_NEUTRE);
    if (!neutre) return { fini: false, erreur: "Ta figurine est introuvable.", nouvelle };
    const { png, cadre } = await poserAuFormat(neutre);
    const debut = Date.now();
    let moteur = "";
    let reglages: Record<string, string> = {};
    const r = await editer(png, consigneBoucheNeutre(), avant, "high", {}, (m, rg) => {
      moteur = m;
      reglages = rg;
    });
    if (!Buffer.isBuffer(r)) return { fini: false, erreur: r.erreur, detail: `(la bouche ouverte) ${r.detail ?? ""}`.trim(), nouvelle };
    const parle = await reprendre(r, cadre);
    if (!(await depot.ecrire(NOM_PARLE, parle, "image/webp"))) return { fini: false, erreur: "Ta figurine n'a pas pu être rangée.", nouvelle };
    await ecrireJsonDans(depot, NOM_SIGNATURE_PARLE, signatureDe(parle, { moteur, consigne: consigneBoucheNeutre(), reglages, fond: "opaque", entrees: [NOM_NEUTRE], debut }));
    return { fini: true, nouvelle };
  } finally {
    if ((await lireVerrou()).qui === qui) await depot.effacer(VERROU);
  }
}
