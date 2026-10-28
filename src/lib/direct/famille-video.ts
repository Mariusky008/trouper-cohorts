/**
 * 🎬 LE DÉBUT ET LA FIN CLIKME DE CHAQUE VIDÉO — « Rejoins ma famille », puis « la famille d'hier ».
 *
 * C'est « Le parcours ClikMe » mis dans les vraies vidéos du comptoir (le film photo, l'interview,
 * l'épisode) : toutes, sans rien à choisir.
 *
 *   · L'OUVERTURE (`OUVERTURE_FAMILLE` secondes) : son fantôme qui salue, et la carte rose — « Rejoins
 *     ma famille de fantômes ! Tu m'aides à me faire connaître, je te gâte ! » — puis « Rejoins la
 *     famille à la fin de la vidéo ↓ ». Elle fait partie de la vidéo, elle n'est pas posée dessus.
 *   · LA FIN (`FIN_FAMILLE` secondes), après la carte postale : « La famille d'hier · 23 fantômes ·
 *     Record : 29 » ; ses fantômes (chacun avec la couleur de son palier) ; deux qui s'avancent avec
 *     leur petit mot, leur prénom et leur numéro — seulement ceux qui l'ont accepté ; puis les trois
 *     cages, « Libère ton fantôme », « Lien dans ma bio » et son lien. La famille encore vide : son
 *     fantôme à lui invite à être le tout premier.
 *
 * Les données viennent de la route du comptoir (« video », `familleDeLaVideo`) ; une démonstration a
 * sa famille inventée (`familleVideoDemo`). Pas d'émoji dessiné ici : un téléphone sans la police des
 * émojis afficherait des carrés — les petits mots des gens, eux, gardent les leurs.
 *
 * FICHIER NAVIGATEUR : il dessine sur la toile du montage.
 */
import { CAGES, libellesCages } from "./cages";
import { familleVideoDemo, type FamilleVideo, type Grade } from "./famille";
import {
  HAUTEUR as H,
  LARGEUR as W,
  CREME,
  NUIT,
  ROSE,
  borne,
  largeurTexte,
  lueur,
  mix,
  rebond,
  rectArrondi,
  sonClic,
  sonTampon,
  sonTic,
  sortie,
  texte,
  type Polices,
  type SortieSon,
} from "./interview-signature";
import { lookDe } from "./look";

/** La durée de l'ouverture, et celle de la fin (en secondes). */
export const OUVERTURE_FAMILLE = 3.4;
export const FIN_FAMILLE = 8.4;
/** La fin : la famille d'hier, puis les cages. */
const SCENE_CAGES = 4.4;

const COULEUR_GRADE: Record<Grade, string> = { bronze: "#D49B60", argent: "#DDE2EA", or: "#F2C762" };
/** Le bord de sa pièce, plus sombre. */
const BORD_GRADE: Record<Grade, string> = { bronze: "#874F1E", argent: "#7C8592", or: "#946410" };
const COULEUR_CAGE = ["#FF2E9A", "#F5A23A", "#3DE2A6"];

export type ImagesFamille = {
  hote: HTMLImageElement | null;
  fantomes: (HTMLImageElement | null)[];
  /** Les trois cages dorées, avec la couleur de leur geste. */
  cages: (HTMLImageElement | null)[];
  /** Le fantôme qu'on voit dans les cages. */
  enCage: HTMLImageElement | null;
};

function image(src: string): Promise<HTMLImageElement | null> {
  return new Promise((ok) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = () => ok(null);
    i.src = src;
  });
}

/** La cage dorée des tours, en SVG (la même que sur la page de la famille). */
function svgCage(couleur: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 220" width="300" height="440"><defs>
<linearGradient id="o" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF3C4"/><stop offset=".28" stop-color="#F2C46B"/><stop offset=".62" stop-color="#A9742A"/><stop offset=".82" stop-color="#FFE3A0"/><stop offset="1" stop-color="#7E5219"/></linearGradient>
<linearGradient id="b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7A4E1A"/><stop offset=".45" stop-color="#FFE9AE"/><stop offset=".7" stop-color="#C8933F"/><stop offset="1" stop-color="#6E4516"/></linearGradient>
<clipPath id="d"><path d="M10 200V96C10 42 42 14 75 14S140 42 140 96V200Z"/></clipPath></defs>
<path d="M10 200V96C10 42 42 14 75 14S140 42 140 96V200Z" fill="rgba(255,235,210,.05)"/>
<g clip-path="url(#d)" fill="url(#b)"><rect x="30" width="5" height="210"/><rect x="52" width="5" height="210"/><rect x="93" width="5" height="210"/><rect x="115" width="5" height="210"/></g>
<rect x="8" y="92" width="134" height="7" rx="3" fill="url(#o)"/><path d="M10 200V96C10 42 42 14 75 14S140 42 140 96V200" fill="none" stroke="url(#o)" stroke-width="7"/>
<circle cx="75" cy="7" r="7" fill="none" stroke="url(#o)" stroke-width="4"/><g fill="${couleur}"><ellipse cx="65" cy="20" rx="11" ry="6"/><ellipse cx="85" cy="20" rx="11" ry="6"/><circle cx="75" cy="20" r="5"/></g>
<path d="M52 200V146C52 130 62 120 75 120S98 130 98 146V200" fill="rgba(30,15,20,.15)" stroke="url(#o)" stroke-width="5"/>
<rect x="2" y="196" width="146" height="22" rx="9" fill="url(#o)"/><rect x="6" y="210" width="138" height="6" rx="3" fill="${couleur}"/></svg>`;
}

/** Ses images, chargées une fois avant le montage (une image qui manque ne bloque rien). */
export async function chargerFamilleVideo(d: FamilleVideo): Promise<ImagesFamille> {
  const deboutDe = (look: string) => {
    const l = lookDe(look);
    return l.debout ?? l.image;
  };
  const [hote, fantomes, cages, enCage] = await Promise.all([
    image(d.hote),
    Promise.all(d.fantomes.map((f) => image(deboutDe(f.look)))),
    Promise.all(COULEUR_CAGE.map((c) => image(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgCage(c))}`))),
    image(deboutDe(d.fantomes[0]?.look ?? "")),
  ]);
  return { hote, fantomes, cages, enCage };
}

/**
 * LA FAMILLE DE SA VIDÉO, PRÊTE À DESSINER : la sienne (la route du comptoir, avec son jeton), ou une
 * famille inventée pour la démonstration. `null` si elle ne vient pas : la vidéo se tourne sans elle.
 */
export async function familleDeLaVideoPour(
  c: { reel?: { slug: string; token: string }; nom: string; branche: string },
  hote: string,
  signal?: AbortSignal,
): Promise<{ d: FamilleVideo; im: ImagesFamille } | null> {
  let d: FamilleVideo | null = null;
  if (!c.reel) d = familleVideoDemo({ nom: c.nom, branche: c.branche, hote });
  else {
    try {
      const r = await fetch("/api/site-internet/pro/famille", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: c.reel.slug, token: c.reel.token, action: "video" }),
        signal,
      });
      const j = (await r.json().catch(() => null)) as (FamilleVideo & { ok?: boolean }) | null;
      if (r.ok && j?.ok) d = { ...j, hote: j.hote || hote };
    } catch {
      d = null;
    }
  }
  if (!d) return null;
  return { d, im: await chargerFamilleVideo(d) };
}

/** Les mots d'un texte, en lignes qui tiennent dans `largeur` (`max` lignes, la dernière coupée d'un « … »). */
function lignesDe(g: CanvasRenderingContext2D, t: string, police: string, largeur: number, max = 2): string[] {
  // Les espaces insécables restent : un « » » ou un « ! » ne part jamais seul à la ligne.
  const mots = t.replace(/[ \t\r\n]+/g, " ").trim().split(" ");
  const lignes: string[] = [];
  let l = "";
  for (const m of mots) {
    const essai = l ? `${l} ${m}` : m;
    if (largeurTexte(g, essai, police) <= largeur || !l) l = essai;
    else {
      lignes.push(l);
      l = m;
    }
  }
  if (l) lignes.push(l);
  if (lignes.length > max) {
    const garde = lignes.slice(0, max);
    garde[max - 1] = `${garde[max - 1].replace(/[.,;:!?]?$/, "")}…`;
    return garde;
  }
  return lignes;
}

function fondDe(g: CanvasRenderingContext2D, fond: HTMLCanvasElement | null, sombre = 0.62) {
  if (fond) g.drawImage(fond, 0, 0);
  else {
    g.fillStyle = NUIT;
    g.fillRect(0, 0, W, H);
  }
  g.fillStyle = `rgba(20,12,9,${sombre})`;
  g.fillRect(0, 0, W, H);
}

function noir(g: CanvasRenderingContext2D, a: number) {
  if (a <= 0) return;
  g.fillStyle = `rgba(0,0,0,${borne(a)})`;
  g.fillRect(0, 0, W, H);
}

/** Une image posée par ses pieds (`bas`), centrée sur `cx`, de hauteur `h`. */
function enPied(g: CanvasRenderingContext2D, img: HTMLImageElement | null, cx: number, bas: number, h: number, angle = 0) {
  if (!img) return;
  const w = (img.naturalWidth * h) / Math.max(1, img.naturalHeight);
  g.save();
  g.translate(cx, bas);
  g.rotate(angle);
  g.drawImage(img, -w / 2, -h, w, h);
  g.restore();
}

/* ═══ L'OUVERTURE ═══════════════════════════════════════════════════════════ */

/** `u` : le temps depuis le début de l'ouverture. */
export function dessinerOuvertureFamille(g: CanvasRenderingContext2D, P: Polices, d: FamilleVideo, im: ImagesFamille, u: number, fond: HTMLCanvasElement | null) {
  fondDe(g, fond);
  lueur(g, 360, 430, 560, "rgba(255,46,154,.32)");
  // SON FANTÔME, QUI SALUE : il monte du bas
  const monte = sortie((u - 0.05) / 0.55);
  enPied(g, im.hote, 360, mix(H + 380, 1250, monte), 560, 0.04 * Math.sin(u * 3.2));
  // LA CARTE ROSE
  const c = rebond((u - 0.2) / 0.5);
  if (c > 0) {
    g.save();
    g.translate(360, 400);
    g.scale(mix(0.82, 1, c), mix(0.82, 1, c));
    g.rotate(-0.025);
    g.globalAlpha = borne(c * 1.6);
    g.fillStyle = "rgba(0,0,0,.35)";
    rectArrondi(g, -300 + 10, -230 + 14, 600, 460, 40);
    g.fill();
    g.fillStyle = ROSE;
    rectArrondi(g, -300, -230, 600, 460, 40);
    g.fill();
    texte(g, "Rejoins ma famille", 0, -110, `66px ${P.affiche}`, "#FFFFFF", { align: "center", ombre: 4 });
    texte(g, "de fantômes !", 0, -32, `66px ${P.affiche}`, "#FFFFFF", { align: "center", ombre: 4 });
    texte(g, "Tu m’aides à me faire connaître,", 0, 66, `700 34px ${P.texte}`, "#FFFFFF", { align: "center" });
    texte(g, "je te gâte !", 0, 116, `800 38px ${P.texte}`, CREME, { align: "center" });
    g.restore();
  }
  // « REJOINS LA FAMILLE À LA FIN DE LA VIDÉO ↓ »
  const b = sortie((u - 1.15) / 0.4);
  if (b > 0) {
    g.save();
    g.globalAlpha = b;
    const y = mix(700, 690, b);
    g.fillStyle = "rgba(20,12,9,.82)";
    rectArrondi(g, 90, y - 46, 540, 70, 35);
    g.fill();
    texte(g, "Rejoins la famille à la fin de la vidéo ↓", 360, y + 2, `700 27px ${P.texte}`, CREME, { align: "center" });
    g.restore();
  }
  noir(g, (u - (OUVERTURE_FAMILLE - 0.3)) / 0.3);
}

/** Ses sons : un clic quand la carte tombe, un tampon sous « à la fin de la vidéo ». `t0` : le début de l'ouverture. */
export function sonsOuvertureFamille(S: SortieSon, t0: number) {
  sonClic(S, t0 + 0.22);
  sonTic(S, t0 + 0.55);
  sonTampon(S, t0 + 1.2);
}

/* ═══ LA FIN : LA FAMILLE D'HIER, PUIS LES CAGES ═════════════════════════════ */

/** Les places de la foule, du premier rang au dernier (x, pieds, taille). */
const PLACES: [number, number, number][] = [
  [360, 1150, 1],
  [200, 1135, 0.94],
  [520, 1135, 0.94],
  [120, 985, 0.78],
  [290, 975, 0.78],
  [440, 975, 0.78],
  [600, 985, 0.78],
  [95, 845, 0.62],
  [225, 835, 0.62],
  [360, 830, 0.62],
  [495, 835, 0.62],
  [625, 845, 0.62],
];
/** Ceux qui s'avancent : quand, et combien de temps. */
const AVANCEE = { debut: 1.0, duree: 1.55, ecart: 1.65 };

export function dessinerFinFamille(g: CanvasRenderingContext2D, P: Polices, d: FamilleVideo, im: ImagesFamille, u: number, fond: HTMLCanvasElement | null) {
  fondDe(g, fond, 0.68);
  lueur(g, 360, 980, 620, "rgba(255,46,154,.24)");
  if (u < SCENE_CAGES) {
    if (d.membres === 0 || !d.fantomes.length) famillePremiere(g, P, d, im, u);
    else familleDHier(g, P, d, im, u);
  }
  if (u >= SCENE_CAGES - 0.35) {
    const a = borne((u - (SCENE_CAGES - 0.35)) / 0.35);
    if (a < 1) {
      g.save();
      g.globalAlpha = a;
    }
    lesCages(g, P, d, im, u - SCENE_CAGES);
    if (a < 1) g.restore();
  }
  noir(g, 1 - u / 0.35);
  noir(g, (u - (FIN_FAMILLE - 0.4)) / 0.4);
}

/** La famille encore vide : son fantôme à lui invite à être le tout premier. */
function famillePremiere(g: CanvasRenderingContext2D, P: Polices, d: FamilleVideo, im: ImagesFamille, u: number) {
  enPied(g, im.hote, 360, 1210, 640, 0.04 * Math.sin(u * 3));
  const b = rebond((u - 0.45) / 0.5);
  if (b <= 0) return;
  g.save();
  g.translate(360, 330);
  g.scale(b, b);
  g.fillStyle = CREME;
  rectArrondi(g, -280, -120, 560, 240, 36);
  g.fill();
  g.beginPath();
  g.moveTo(-30, 118);
  g.lineTo(30, 118);
  g.lineTo(0, 168);
  g.closePath();
  g.fill();
  texte(g, "Sois mon tout premier", 0, -18, `italic 700 46px ${P.serif}`, "#2C0912", { align: "center" });
  texte(g, "fantôme !", 0, 48, `italic 700 46px ${P.serif}`, "#2C0912", { align: "center" });
  g.restore();
}

/** La famille d'hier : le nombre, le record, la foule, et deux qui s'avancent avec leur petit mot. */
function familleDHier(g: CanvasRenderingContext2D, P: Polices, d: FamilleVideo, im: ImagesFamille, u: number) {
  // L'EN-TÊTE
  const e = sortie((u - 0.15) / 0.45);
  g.save();
  g.globalAlpha = e;
  const n = d.quand === "hier" ? d.hier : d.fantomes.length;
  texte(g, d.quand === "hier" ? "LA FAMILLE D’HIER" : "LA FAMILLE DE LA SEMAINE", 360, 150, `800 26px ${P.texte}`, ROSE, { align: "center", ls: 4 });
  texte(g, `${n} ${n > 1 ? "fantômes" : "fantôme"}`, 360, 250, `88px ${P.affiche}`, CREME, { align: "center", ombre: 5 });
  const record = d.recordBattuHier ? "Record battu !" : d.record ? `Record : ${d.record}` : "";
  if (record) texte(g, record, 360, 312, `800 34px ${P.texte}`, d.recordBattuHier ? ROSE : "#F2C46B", { align: "center" });
  g.restore();

  // CEUX QUI S'AVANCENT : ceux qui ont un petit mot (et l'ont accepté), deux au plus
  const avancent = d.fantomes.map((f, k) => ({ f, k })).filter((x) => x.f.mot).slice(0, 2);
  const actif = avancent.findIndex((_, j) => {
    const v = u - (AVANCEE.debut + j * AVANCEE.ecart);
    return v >= 0 && v < AVANCEE.duree;
  });
  const enAvant = actif >= 0 ? avancent[actif] : null;
  const v = enAvant ? (u - (AVANCEE.debut + actif * AVANCEE.ecart)) / AVANCEE.duree : 0;
  // elle sort, reste, puis rentre
  const pas = enAvant ? (v < 0.25 ? sortie(v / 0.25) : v > 0.82 ? 1 - sortie((v - 0.82) / 0.18) : 1) : 0;

  // LA FOULE, du dernier rang au premier (le premier passe devant)
  const ordre = d.fantomes.map((_, k) => k).filter((k) => k < PLACES.length).reverse();
  for (const k of ordre) {
    if (enAvant && enAvant.k === k) continue;
    dessinerUn(g, im.fantomes[k], d.fantomes[k].grade, PLACES[k], u, k, 1);
  }
  if (enAvant && enAvant.k < PLACES.length) {
    const [x, bas, s] = PLACES[enAvant.k];
    const place: [number, number, number] = [mix(x, 360, pas), mix(bas, 1240, pas), mix(s, 1.55, pas)];
    dessinerUn(g, im.fantomes[enAvant.k], enAvant.f.grade, place, u, enAvant.k, 1);
    // SA BULLE : son petit mot, son prénom et son numéro
    const bv = borne((pas - 0.6) / 0.4);
    if (bv > 0) bulleDuMot(g, P, enAvant.f, bv);
  }
}

function dessinerUn(g: CanvasRenderingContext2D, img: HTMLImageElement | null, grade: Grade, [x, bas, s]: [number, number, number], u: number, k: number, alpha: number) {
  const entre = rebond((u - 0.3 - k * 0.05) / 0.45);
  if (entre <= 0 || !img) return;
  const h = 250 * s * entre;
  const flotte = Math.sin(u * 2.2 + k * 1.3) * 5 * s;
  g.save();
  g.globalAlpha = alpha;
  // SA PIÈCE, SOUS SES PIEDS : le métal de son palier (dessinée d'abord, il se tient dessus)
  const rx = 0.3 * h,
    ry = rx * 0.36,
    cy = bas + flotte - ry * 0.25;
  g.beginPath();
  g.ellipse(x, cy + ry * 0.32, rx, ry, 0, 0, Math.PI * 2);
  g.fillStyle = BORD_GRADE[grade];
  g.fill();
  const reflet = g.createRadialGradient(x - rx * 0.25, cy - ry * 0.35, 1, x, cy, rx);
  reflet.addColorStop(0, "rgba(255,255,255,.85)");
  reflet.addColorStop(0.3, COULEUR_GRADE[grade]);
  reflet.addColorStop(1, BORD_GRADE[grade]);
  g.beginPath();
  g.ellipse(x, cy, rx, ry, 0, 0, Math.PI * 2);
  g.fillStyle = reflet;
  g.fill();
  enPied(g, img, x, bas + flotte, h, 0.03 * Math.sin(u * 1.7 + k));
  g.restore();
}

function bulleDuMot(g: CanvasRenderingContext2D, P: Polices, f: { mot?: string; prenom?: string; numero?: number; grade: Grade }, a: number) {
  const policeMot = `italic 700 38px ${P.serif}`;
  const mot = `« ${f.mot ?? ""} »`.replace(/ ([!?;:»])/g, "\u00a0$1").replace(/« /g, "«\u00a0");
  const lignes = lignesDe(g, mot, policeMot, 540, 2);
  const qui = [f.prenom, f.numero ? `fantôme n°${f.numero}` : ""].filter(Boolean).join(" · ");
  const h = 40 + lignes.length * 50 + (qui ? 44 : 0);
  const y = 620 - h;
  g.save();
  g.globalAlpha = a;
  g.translate(0, (1 - a) * 18);
  g.fillStyle = CREME;
  rectArrondi(g, 70, y, 580, h, 30);
  g.fill();
  g.beginPath();
  g.moveTo(340, y + h - 2);
  g.lineTo(380, y + h - 2);
  g.lineTo(360, y + h + 34);
  g.closePath();
  g.fill();
  lignes.forEach((l, i) => texte(g, l, 360, y + 66 + i * 50, policeMot, "#2C0912", { align: "center" }));
  if (qui) {
    const yq = y + 66 + lignes.length * 50;
    g.beginPath();
    const wq = largeurTexte(g, qui, `700 26px ${P.texte}`);
    g.arc(360 - wq / 2 - 20, yq - 9, 10, 0, Math.PI * 2);
    g.fillStyle = COULEUR_GRADE[f.grade];
    g.fill();
    texte(g, qui, 360 + 6, yq, `700 26px ${P.texte}`, "#7A5560", { align: "center" });
  }
  g.restore();
}

/** Les trois cages, « Libère ton fantôme », et le chemin : le lien dans sa bio. `v` : depuis le début de la scène. */
function lesCages(g: CanvasRenderingContext2D, P: Polices, d: FamilleVideo, im: ImagesFamille, v: number) {
  const t = sortie(v / 0.4);
  texte(g, "Libère ton fantôme", 360, mix(250, 236, t), `66px ${P.affiche}`, CREME, { align: "center", ombre: 5 });
  texte(g, "Rejoins la famille", 360, 312, `italic 700 44px ${P.serif}`, ROSE, { align: "center" });
  const libelles = libellesCages(d.branche);
  CAGES.forEach((c, k) => {
    const x = 125 + k * 235;
    const e = rebond((v - 0.15 - k * 0.12) / 0.45);
    if (e <= 0) return;
    g.save();
    g.translate(x, 700);
    g.scale(e, e);
    // le fantôme dedans, puis les barreaux par-dessus ; celui du milieu se soulève un peu
    const leve = k === 1 ? 10 * Math.sin(v * 3) - 6 : 0;
    enPied(g, im.enCage, 0, 110 + leve, 140);
    const cage = im.cages[k];
    if (cage) g.drawImage(cage, -95, -170, 190, 279);
    g.restore();
    const [l1, l2] = libelles[c].split("\n");
    texte(g, l1, x, 840, `700 26px ${P.texte}`, CREME, { align: "center" });
    if (l2) texte(g, l2, x, 872, `700 26px ${P.texte}`, CREME, { align: "center" });
  });
  // LE CHEMIN : le lien dans sa bio
  const b = rebond((v - 0.9) / 0.45);
  if (b > 0) {
    g.save();
    g.translate(360, 990);
    g.scale(b, b);
    g.fillStyle = ROSE;
    rectArrondi(g, -270, -52, 540, 104, 52);
    g.fill();
    texte(g, "Lien dans ma bio", 0, 16, `800 44px ${P.texte}`, "#FFFFFF", { align: "center" });
    g.restore();
  }
  const l = sortie((v - 1.3) / 0.4);
  if (l > 0) {
    g.save();
    g.globalAlpha = l;
    texte(g, d.lien, 360, 1100, `600 28px ${P.texte}`, "rgba(255,244,230,.85)", { align: "center" });
    if (d.record) texte(g, `On bat le record aujourd’hui ? (${d.record})`, 360, 1160, `700 28px ${P.texte}`, "#F2C46B", { align: "center" });
    g.restore();
  }
}

/** Ses sons : un clic à l'entrée, un tic à chaque pas en avant, un tampon sur les cages. `t0` : le début de la fin. */
export function sonsFinFamille(S: SortieSon, t0: number, d: FamilleVideo) {
  sonClic(S, t0 + 0.05);
  const avancent = d.fantomes.filter((f) => f.mot).slice(0, 2).length;
  for (let j = 0; j < avancent; j++) sonTic(S, t0 + AVANCEE.debut + j * AVANCEE.ecart);
  sonClic(S, t0 + SCENE_CAGES);
  sonTampon(S, t0 + SCENE_CAGES + 0.95);
}
