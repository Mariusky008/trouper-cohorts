/**
 * ✂️ SA VRAIE VOIX, RESSERRÉE.
 *
 * « Le montage couperait automatiquement les "euh", les silences de plus d'une
 * demi-seconde et les débuts de phrase ratés. Chaque coupe serait cachée par un
 * petit coup de zoom ou par une de ses photos, comme sur les Reels… il faut que
 * la transcription donne l'instant exact de chaque mot. »
 *
 * CE FICHIER DÉCIDE OÙ COUPER, ET RIEN D'AUTRE. Il reçoit les mots de sa
 * réponse avec leur instant (le service de transcription les donne, voir
 * `/api/direct/transcrire`, option `mots`) et l'énergie du son ; il rend les
 * morceaux à retirer, en secondes depuis le début de la prise. Le montage
 * (`interview-montage.ts`) les retire du son, de la bouche de son fantôme,
 * des sous-titres et de la vidéo.
 *
 * TROIS COUPES, ET ON RESTE PRUDENT :
 *   · LES « EUH » (« heu », « hum », « mmh », « bah ») : retirés, avec ce qui
 *     les entoure jusqu'au mot d'avant et au mot d'après ;
 *   · LES SILENCES DE PLUS D'UNE DEMI-SECONDE entre deux mots : ramenés à un
 *     quart de seconde — un souffle reste, sinon la phrase devient mécanique ;
 *   · LES DÉBUTS DE PHRASE RATÉS : un mot, ou deux, ou trois, dits deux fois de
 *     suite (« le… le magret », « je fais, je fais mon ») — la première fois
 *     part. Sauf les doublons qui veulent dire quelque chose (« très très »,
 *     « non non », « vous vous »).
 * Jamais au milieu d'un mot gardé. Et si tout ça retirait plus de la moitié de
 * sa réponse, c'est que le son ou la transcription s'est trompé : on ne coupe
 * rien.
 *
 * FICHIER PARTAGÉ : aucune dépendance au DOM — vérifié par
 * `scripts/verifier-resserrer-interview.mjs`.
 */
import type { SousTitre } from "@/lib/direct/interview-fantome";

/** Un mot de sa réponse tel qu'il s'affiche (sa ponctuation avec), et quand il le dit. */
export type MotHorodate = { m: string; a: number; b: number };

/** Un morceau retiré de la prise, en secondes depuis son début. */
export type Coupe = { de: number; a: number; pourquoi: "silence" | "euh" | "reprise" };

/** Les hésitations — pas « ben », « bon » ni « alors » : ils peuvent porter le sens. */
const EUH = /^(?:e+u+h*m*|h?e+u+h*|euh+m+|h+u+m+|h+m+|m+h+m*|bah|beuh|hein)$/;
/** Les doublons qui veulent dire quelque chose. */
const DOUBLONS_VOULUS = new Set(["tres", "trop", "non", "oui", "si", "vous", "nous", "bon", "beaucoup", "vite", "encore", "bien"]);

/** « Magret, » → « magret » ; « L’assiette » → « l'assiette ». */
export function motNu(m: string): string {
  return m
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’`]/g, "'")
    .replace(/[^a-z0-9']+/g, "");
}

export const estUnEuh = (m: string) => EUH.test(motNu(m).replace(/'/g, ""));

/**
 * LE TEXTE ET SES INSTANTS, RÉUNIS. Le service rend le texte avec sa
 * ponctuation d'un côté, les mots sans ponctuation avec leur instant de
 * l'autre. On les marie dans l'ordre, mot à mot ; un signe seul (« ? », « : »)
 * se colle au mot d'avant par une espace fine, « « » au mot d'après. Un mot du
 * texte que les instants ne retrouvent pas prend le temps entre ses voisins.
 */
export function alignerMots(texte: string, mots: readonly MotHorodate[]): MotHorodate[] {
  const bruts = texte.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  // les signes seuls se collent à leur voisin
  const jetons: string[] = [];
  let ouvrant = "";
  for (const j of bruts) {
    if (/^[«“(]$/.test(j)) ouvrant += `${j}\u202F`;
    else if (/^[,.]+$/.test(j) && jetons.length) jetons[jetons.length - 1] += j;
    else if (/^[?!:;»”)…]+$/.test(j) && jetons.length) jetons[jetons.length - 1] += `\u202F${j}`;
    else {
      jetons.push(ouvrant + j);
      ouvrant = "";
    }
  }
  const out: (MotHorodate | null)[] = [];
  let i = 0;
  for (const j of jetons) {
    const nu = motNu(j);
    if (!nu) {
      out.push(null);
      continue;
    }
    // le mot suivant des instants, ou l'un des trois d'après (un mot que le texte a sauté)
    let trouve = -1;
    for (let k = i; k < Math.min(mots.length, i + 4); k++) {
      const n2 = motNu(mots[k].m);
      if (n2 === nu || (n2.length >= 3 && (nu.startsWith(n2) || n2.startsWith(nu)))) {
        trouve = k;
        break;
      }
    }
    if (trouve >= 0) {
      out.push({ m: j, a: mots[trouve].a, b: mots[trouve].b });
      i = trouve + 1;
    } else out.push({ m: j, a: NaN, b: NaN });
  }
  // les mots sans instant : entre leurs voisins
  const res: MotHorodate[] = [];
  for (let k = 0; k < out.length; k++) {
    const w = out[k];
    if (!w) continue;
    if (Number.isFinite(w.a)) {
      res.push(w);
      continue;
    }
    let avant = res.length ? res[res.length - 1].b : (mots[0]?.a ?? 0);
    let apres = avant + 0.3;
    for (let q = k + 1; q < out.length; q++) {
      const x = out[q];
      if (x && Number.isFinite(x.a)) {
        apres = x.a;
        break;
      }
    }
    if (apres < avant) apres = avant;
    avant = Math.min(avant, apres);
    res.push({ m: w.m, a: avant, b: apres });
  }
  return res;
}

/**
 * SES MOTS EN SOUS-TITRES : des morceaux qui tiennent sur deux lignes, coupés
 * en fin de phrase ou sur un silence, chacun avec ses mots et leurs instants
 * — le montage allume chaque mot quand il le dit (`motsDesSousTitres`).
 */
export function sousTitresDesMots(mots: readonly MotHorodate[], max = 46): SousTitre[] {
  const out: SousTitre[] = [];
  let cur: MotHorodate[] = [];
  const fermer = () => {
    if (!cur.length) return;
    out.push({ texte: cur.map((w) => w.m).join(" "), debut: cur[0].a, fin: cur[cur.length - 1].b, mots: cur });
    cur = [];
  };
  for (const w of mots) {
    const prev = cur[cur.length - 1];
    const longueur = cur.map((x) => x.m).join(" ").length + 1 + w.m.length;
    if (prev && (longueur > max || w.a - prev.b > 0.8)) fermer();
    cur.push(w);
    if (/[.!?…]$/.test(w.m) && cur.map((x) => x.m).join(" ").length > max * 0.45) fermer();
  }
  fermer();
  return out;
}

/** Le seuil de voix de CETTE prise : entre son bruit de fond et sa voix. `null` : trop de bruit pour s'y fier. */
function seuilDeVoix(rms: ArrayLike<number>, pas: number, debut: number, fin: number): number | null {
  const v: number[] = [];
  for (let i = Math.max(0, Math.floor(debut / pas)); i < Math.min(rms.length, Math.ceil(fin / pas)); i++) v.push(rms[i]);
  if (v.length < 10) return null;
  v.sort((x, y) => x - y);
  const bruit = v[Math.floor(v.length * 0.1)];
  const voix = v[Math.floor(v.length * 0.9)];
  if (voix < bruit * 2.5) return null;
  return bruit + 0.25 * (voix - bruit);
}

export type Resserrage = {
  coupes: Coupe[];
  /** Ses mots, sans les « euh » ni les débuts ratés : ce que montrent les sous-titres. */
  gardes: MotHorodate[];
};

export function resserrerLaReponse(o: {
  mots: readonly MotHorodate[];
  /** Le début et la fin de sa réponse dans la prise : on ne coupe jamais en dehors. */
  debut: number;
  fin: number;
  /** L'énergie du son par pas de `pas` secondes (voir `energie`) : elle raccourcit un mot étiré sur un silence. */
  rms?: ArrayLike<number> | null;
  pas?: number;
  /**
   * Il s'est filmé : chaque coupe fait sauter sa vidéo, et un morceau gardé de moins de 0,7 s ne
   * laisserait pas au lecteur le temps de s'y caler. Sa voix seule supporte des morceaux de 0,25 s.
   */
  filme: boolean;
}): Resserrage {
  const mots = o.mots.filter((w) => w.b > o.debut - 0.2 && w.a < o.fin + 0.2).map((w) => ({ ...w }));
  const retire: (Coupe["pourquoi"] | null)[] = mots.map((w) => (estUnEuh(w.m) ? "euh" : null));

  // LES DÉBUTS RATÉS : trois mots, puis deux, puis un, dits deux fois de suite — la première fois part
  const idx = () => mots.map((_, k) => k).filter((k) => !retire[k]);
  for (const n of [3, 2, 1]) {
    let l = idx();
    for (let p = 0; p + 2 * n <= l.length; p++) {
      const un = l.slice(p, p + n).map((k) => motNu(mots[k].m));
      const deux = l.slice(p + n, p + 2 * n).map((k) => motNu(mots[k].m));
      if (un.some((x) => !x) || un.join(" ") !== deux.join(" ")) continue;
      if (n === 1 && DOUBLONS_VOULUS.has(un[0])) continue;
      // un doublon séparé par un long silence est une nouvelle phrase, pas un raté
      if (mots[l[p + n]].a - mots[l[p + n - 1]].b > 1.2) continue;
      for (const k of l.slice(p, p + n)) retire[k] = "reprise";
      l = idx();
      p = Math.max(-1, p - 1);
    }
  }

  // UN MOT ÉTIRÉ SUR UN SILENCE (la transcription allonge parfois le dernier mot d'une phrase) : on le ramène à sa voix
  const pas = o.pas ?? 0.05;
  const seuil = o.rms ? seuilDeVoix(o.rms, pas, o.debut, o.fin) : null;
  if (o.rms && seuil != null) {
    const rms = o.rms;
    for (const w of mots) {
      const i0 = Math.max(0, Math.floor(w.a / pas));
      const i1 = Math.min(rms.length - 1, Math.ceil(w.b / pas));
      let va = -1;
      let vb = -1;
      for (let i = i0; i <= i1; i++) {
        if (rms[i] > seuil) {
          if (va < 0) va = i;
          vb = i;
        }
      }
      if (vb < 0) continue;
      const finVoix = (vb + 1) * pas;
      const debutVoix = va * pas;
      if (w.b - finVoix > 0.3) w.b = finVoix + 0.08;
      if (debutVoix - w.a > 0.3) w.a = debutVoix - 0.06;
    }
  }

  const gardesK = idx();
  const gardes = gardesK.map((k) => mots[k]);
  let coupes: Coupe[] = [];
  const pousser = (de: number, a: number, pourquoi: Coupe["pourquoi"]) => {
    const d = Math.max(o.debut, de);
    const f = Math.min(o.fin, a);
    if (f - d >= 0.12) coupes.push({ de: d, a: f, pourquoi });
  };
  const retiresEntre = (k0: number, k1: number) => {
    let pourquoi: Coupe["pourquoi"] | null = null;
    for (let k = k0 + 1; k < k1; k++) if (retire[k]) pourquoi = pourquoi === "reprise" ? pourquoi : retire[k];
    return pourquoi;
  };
  if (gardesK.length) {
    // CE QU'IL A RATÉ AVANT SON PREMIER VRAI MOT
    const avant = retiresEntre(-1, gardesK[0]);
    if (avant) pousser(mots[0].a - 0.05, mots[gardesK[0]].a - 0.1, avant);
    for (let q = 1; q < gardesK.length; q++) {
      const p = mots[gardesK[q - 1]];
      const n = mots[gardesK[q]];
      const pourquoi = retiresEntre(gardesK[q - 1], gardesK[q]);
      if (pourquoi) pousser(p.b + 0.09, n.a - 0.09, pourquoi);
      else if (n.a - p.b > 0.5) pousser(p.b + 0.12, n.a - 0.13, "silence");
    }
    // UN « EUH » APRÈS SON DERNIER MOT : la fin garde sept dixièmes de souffle
    const k1 = gardesK[gardesK.length - 1];
    const apres = retiresEntre(k1, mots.length);
    if (apres) pousser(mots[k1].b + 0.35, o.fin - 0.35, apres);
  }
  coupes.sort((x, y) => x.de - y.de);

  // PAS DE MORCEAU GARDÉ TROP COURT ENTRE DEUX COUPES : on renonce à la plus petite des deux
  const min = o.filme ? 0.7 : 0.25;
  for (let tour = 0; tour < 50; tour++) {
    let k = -1;
    for (let q = 1; q < coupes.length; q++) if (coupes[q].de - coupes[q - 1].a < min) k = q;
    if (k < 0) break;
    const a = coupes[k - 1];
    const b = coupes[k];
    coupes = coupes.filter((c) => c !== (a.a - a.de <= b.a - b.de ? a : b));
  }
  // ET RIEN DU TOUT SI ÇA RETIRAIT PLUS DE LA MOITIÉ DE SA RÉPONSE
  const retireTout = coupes.reduce((s, c) => s + c.a - c.de, 0);
  if (retireTout > 0.5 * Math.max(0.1, o.fin - o.debut)) coupes = [];
  return { coupes, gardes };
}

/** Ce qui a été retiré, pour l'écran d'essai : « 2 euh, 3 silences, 1 reprise · −2,4 s ». */
export function resumeDesCoupes(coupes: readonly Coupe[]): string {
  if (!coupes.length) return "rien à couper";
  const n = (p: Coupe["pourquoi"]) => coupes.filter((c) => c.pourquoi === p).length;
  const s = coupes.reduce((t, c) => t + c.a - c.de, 0);
  const parts = [
    n("euh") && `${n("euh")} euh`,
    n("silence") && `${n("silence")} silence${n("silence") > 1 ? "s" : ""}`,
    n("reprise") && `${n("reprise")} reprise${n("reprise") > 1 ? "s" : ""}`,
  ].filter(Boolean);
  return `${parts.join(", ")} · −${s.toFixed(1).replace(".", ",")} s`;
}
