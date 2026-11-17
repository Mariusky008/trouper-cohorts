/**
 * 🛋️ LE MOTEUR DE LA SCÈNE DU SALON DU DUO (`docs/univers/salon-du-duo.md`, section 6 ; le contrat :
 * `src/lib/direct/salon.ts`). Repris de la maquette validée par le propriétaire (« Salon du duo », sa physique et ses
 * effets, tels quels : ils sont réglés), en module sans React :
 *
 *   const scene = creerScene(conteneur, { plaque, largeur, hauteur, figurines, surAncres });
 *   scene.figurine("moi").rire(1.5);  scene.fx.eclatCoeurs(scene.milieu());  scene.viser("duo");
 *   await scene.geste("bisou", "moi");  // une mise en scène enregistrée (lot S3)
 *   scene.detruire();
 *
 * - UNE SEULE BOUCLE `requestAnimationFrame` pour tout : les ressorts des têtes et des corps, les particules et les
 *   acteurs (une toile), ce que les autres lots y accrochent (`surImage`). Jamais un `setState` de React par image : le
 *   moteur bouge ses calques par `transform` seulement (section 7.3).
 * - La caméra : une transition CSS de 1,5 s ; les ancres des bulles sont données à l'écran à chaque changement de vue
 *   ou de taille (les bulles sont du HTML hors de la caméra : jamais coupées).
 * - La page cachée : la boucle et les sons s'arrêtent. Le mode léger se met en route tout seul si les images sont trop
 *   lentes (moins de particules). `prefers-reduced-motion` : les mises en scène se réduisent à leur fin.
 * - Les sons : un seul `AudioContext`, créé au premier toucher (iPhone) — des bruits et de courtes musiques, jamais une
 *   voix.
 *
 * MODULE DU NAVIGATEUR (il touche au DOM) : à n'importer que dans un composant client.
 */
import { miseEnSceneDe, type Acteur, type AncresBulles, type CalqueFigurine, type CalqueImage, type CommandesFigurine, type EffetsScene, type OptionsScene, type Particule, type Point, type Qui, type Repere, type Scene, type Sens, type SonsScene, type Vue } from "@/lib/direct/salon";
import type { Zone } from "@/lib/direct/pieces-duo";

const EMOJI = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
const hasard = (a: number, b: number) => a + Math.random() * (b - a);
/** Les courbes de la maquette. */
export const ease = {
  io: (u: number) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2),
  in: (u: number) => u * u * u,
  out: (u: number) => 1 - Math.pow(1 - u, 3),
  back: (u: number) => {
    const c = 1.9;
    return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2);
  },
};
/** Une courbe de Bézier quadratique (le trajet d'un bisou qui vole). */
export const bez = (a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }, u: number) => ({
  x: (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * b.x + u * u * c.x,
  y: (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * b.y + u * u * c.y,
});
const ROSES: [string, string] = ["#ff9cc8", "#ff2f6f"];
const ROUGES: [string, string] = ["#ff6b8a", "#e0103a"];
const JINGLES: Record<string, number[]> = {
  joie: [523, 659, 784, 1047],
  rire: [784, 659, 784, 988, 1175],
  euphorie: [523, 659, 784, 1047, 1319],
  amour: [440, 554, 659, 880],
  grimace: [392, 370, 392, 523],
  tristesse: [440, 392, 349, 330],
  colere: [196, 233, 196, 175],
};

/** La tête sur son ressort (l'état de la maquette, `TETES`). */
type EtatTete = {
  el: HTMLElement;
  vers: Sens;
  ph: number;
  prochain: number;
  a: number;
  va: number;
  y: number;
  vy: number;
  s: number;
  vs: number;
  ca: number;
  cs: number;
  cy: number;
  parle: number;
  rit: number;
  cp: number;
  cr: number;
  sg: number;
  dort: boolean;
  zz: number;
  minA?: ReturnType<typeof setTimeout>;
  minS?: ReturnType<typeof setTimeout>;
};
/** Le corps qui respire (l'état de la maquette, `FIGS`). */
type EtatCorps = {
  el: HTMLElement;
  vers: Sens;
  ph: number;
  l: number;
  vl: number;
  cl: number;
  dx: number;
  vdx: number;
  cdx: number;
  dy: number;
  vdy: number;
  danse: number;
  coup: boolean;
  minL?: ReturnType<typeof setTimeout>;
  minX?: ReturnType<typeof setTimeout>;
};
type PartVivante = Required<Pick<Particule, "t" | "vx" | "vy" | "ax" | "ay" | "rot" | "vr" | "al" | "fr">> & Particule & { ph: number };

const STYLE = `
.sc{position:absolute;inset:0;overflow:hidden;contain:strict;-webkit-tap-highlight-color:transparent}
.sc-secoueur,.sc-camera{position:absolute;inset:0}
.sc-camera{transform-origin:0 0;will-change:transform}
.sc-stage{position:absolute;--sw:400px}
.sc-stage>*{position:absolute}
.sc-plaque{inset:0;width:100%;height:100%;display:block;user-select:none;-webkit-user-drag:none;pointer-events:none}
.sc-fig{pointer-events:none;will-change:transform}
.sc-ombre{aspect-ratio:5/1;transform:translate(-50%,-62%);border-radius:50%;background:radial-gradient(closest-side,rgba(20,8,16,.5),rgba(20,8,16,.22) 60%,rgba(20,8,16,0));pointer-events:none}
.sc-stage[data-moment="soir"] .sc-fig{filter:sepia(.16) saturate(1.12) brightness(.97)}
.sc-stage[data-moment="nuit"] .sc-fig{filter:brightness(.74) saturate(.82) hue-rotate(-8deg)}
.sc-calque{position:absolute;overflow:hidden}
.sc-calque>img{position:absolute;display:block;max-width:none;user-select:none;-webkit-user-drag:none}
.sc-tete{position:absolute;pointer-events:none;will-change:transform}
.sc-fx{inset:0;width:100%;height:100%;pointer-events:none}
.sc-fxdom{inset:0;pointer-events:none}
.sc-lettrage{position:absolute;--o:calc(var(--sw)*.0055);font:400 calc(var(--sw)*.072)/1 "Bangers","Impact","Arial Black",sans-serif;letter-spacing:.03em;color:#fff;white-space:nowrap;text-shadow:var(--o) 0 #3a0b2a,calc(-1*var(--o)) 0 #3a0b2a,0 var(--o) #3a0b2a,0 calc(-1*var(--o)) #3a0b2a,var(--o) var(--o) #3a0b2a,calc(-1*var(--o)) calc(-1*var(--o)) #3a0b2a,var(--o) calc(-1*var(--o)) #3a0b2a,calc(-1*var(--o)) var(--o) #3a0b2a,0 calc(var(--o)*2.6) 0 rgba(58,11,42,.85)}
.sc-lettrage.rose{color:#ff6fb1}
.sc-lettrage.jaune{color:#ffd23f}
.sc-lettrage.bleu{color:#7fe3ff}
.sc-marque{position:absolute;font-family:${EMOJI};font-size:calc(var(--sw)*.05);line-height:1;pointer-events:none}
.sc-rougeur{position:absolute;width:calc(var(--sw)*.06);height:calc(var(--sw)*.035);transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(ellipse,rgba(255,70,120,.75),rgba(255,90,140,0) 70%);pointer-events:none;opacity:0}
`;
function installerStyle() {
  if (typeof document === "undefined" || document.getElementById("sc-style")) return;
  const s = document.createElement("style");
  s.id = "sc-style";
  s.textContent = STYLE;
  document.head.append(s);
}
const pc = (x: number) => `${(x * 100).toFixed(4)}%`;
const elt = <K extends keyof HTMLElementTagNameMap>(tag: K, classe: string) => {
  const e = document.createElement(tag);
  e.className = classe;
  return e;
};
/** Une image de calque, découpée si besoin, posée dans `parent` (dont la boîte est `boiteParent`, sur la pièce). */
function poserCalque(parent: HTMLElement, c: CalqueImage, boiteParent: Zone): HTMLElement {
  const [px, py, pw, ph] = boiteParent;
  const [x, y, w, h] = c.boite;
  const box = elt("div", "sc-calque");
  Object.assign(box.style, { left: pc((x - px) / pw), top: pc((y - py) / ph), width: pc(w / pw), height: pc(h / ph) });
  const img = elt("img", "");
  img.alt = "";
  img.decoding = "async";
  img.src = c.fichier;
  // (une découpe : l'image entière, agrandie, décalée pour ne montrer que sa partie)
  const [dx, dy, dw, dh] = c.decoupe ?? [0, 0, 1, 1];
  Object.assign(img.style, { width: pc(1 / dw), height: pc(1 / dh), left: pc(-dx / dw), top: pc(-dy / dh) });
  box.append(img);
  parent.append(box);
  return box;
}
const union = (a: Zone, b: Zone): Zone => {
  const x = Math.min(a[0], b[0]);
  const y = Math.min(a[1], b[1]);
  return [x, y, Math.max(a[0] + a[2], b[0] + b[2]) - x, Math.max(a[1] + a[3], b[1] + b[3]) - y];
};

export function creerScene(conteneur: HTMLElement, o: OptionsScene): Scene {
  installerStyle();
  const reduit = o.reduit ?? (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const IW = o.largeur;
  const IH = o.hauteur;
  const cadrage = o.cadrageVertical ?? 0.3;

  // ─── le DOM : la scène, le secoueur, la caméra, la pièce (« stage ») et ses calques ───
  const racine = elt("div", "sc");
  if (reduit) racine.dataset.reduit = "1";
  const secoueur = elt("div", "sc-secoueur");
  const camera = elt("div", "sc-camera");
  const stage = elt("div", "sc-stage");
  // (lot S2 : les figurines prennent la teinte du moment — plus chaude le soir, plus sombre la nuit)
  if (o.moment) stage.dataset.moment = o.moment;
  const plaque = elt("img", "sc-plaque");
  plaque.alt = "";
  plaque.decoding = "async";
  plaque.src = o.plaque;
  stage.append(plaque);

  // ─── les minuteries de la scène (annulées avec elle) ───
  let vivante = true;
  const minuteries = new Set<ReturnType<typeof setTimeout>>();
  const plus = (ms: number, fn: () => void) => {
    const t = setTimeout(() => {
      minuteries.delete(t);
      if (vivante) fn();
    }, reduit ? Math.min(ms, 400) : ms);
    minuteries.add(t);
    return t;
  };
  const attendre = (ms: number) => new Promise<void>((ok) => plus(ms, ok));

  // ─── la mise en place : la pièce en « cover » ───
  const L = { sw: 0, sh: 0, left: 0, top: 0, cw: 0, ch: 0 };
  const U = () => L.sw / 100;

  // ─── les figurines en calques ───
  const TETES: Partial<Record<Qui, EtatTete>> = {};
  const FIGS: Partial<Record<Qui, EtatCorps>> = {};
  const CALQUES: Partial<Record<Qui, { c: CalqueFigurine; sens: Sens }>> = {};
  for (const q of ["moi", "autre"] as const) {
    const f = o.figurines[q];
    if (!f) continue;
    CALQUES[q] = { c: f.calque, sens: f.sens };
    const corps = f.calque.corps.boite;
    // (lot S2 : une ombre au sol, sous le fauteuil — elle reste au sol quand la figurine bouge)
    const ombre = elt("div", "sc-ombre");
    ombre.dataset.ombre = q;
    Object.assign(ombre.style, { left: pc(corps[0] + corps[2] / 2), top: pc(corps[1] + corps[3]), width: pc(corps[2] * 0.82) });
    stage.append(ombre);
    const tete = f.calque.tete.boite;
    const u = union(corps, tete);
    const fig = elt("div", "sc-fig");
    fig.dataset.figurine = q;
    Object.assign(fig.style, { left: pc(u[0]), top: pc(u[1]), width: pc(u[2]), height: pc(u[3]) });
    // (le corps se penche autour de son assise : vers le bas de sa boîte, comme la maquette)
    fig.style.transformOrigin = `${pc((corps[0] + corps[2] / 2 - u[0]) / u[2])} ${pc((corps[1] + corps[3] * 0.74 - u[1]) / u[3])}`;
    poserCalque(fig, f.calque.corps, u);
    const t = elt("div", "sc-tete");
    t.dataset.tete = q;
    Object.assign(t.style, { left: pc((tete[0] - u[0]) / u[2]), top: pc((tete[1] - u[1]) / u[3]), width: pc(tete[2] / u[2]), height: pc(tete[3] / u[3]) });
    const [pvx, pvy] = f.calque.tete.pivot;
    t.style.transformOrigin = `${pc((pvx - tete[0]) / tete[2])} ${pc((pvy - tete[1]) / tete[3])}`;
    poserCalque(t, { ...f.calque.tete, boite: tete }, tete);
    fig.append(t);
    stage.append(fig);
    TETES[q] = { el: t, vers: f.sens, ph: q === "moi" ? 0.3 : 2.1, prochain: q === "moi" ? 4 : 6.5, a: 0, va: 0, y: 0, vy: 0, s: 1, vs: 0, ca: 0, cs: 1, cy: 0, parle: 0, rit: 0, cp: 0, cr: 0, sg: 1, dort: false, zz: 0 };
    FIGS[q] = { el: fig, vers: f.sens, ph: q === "moi" ? 0.7 : 2.6, l: 0, vl: 0, cl: 0, dx: 0, vdx: 0, cdx: 0, dy: 0, vdy: 0, danse: 0, coup: false };
  }

  const fxc = elt("canvas", "sc-fx");
  const fctx = fxc.getContext("2d");
  const fxdom = elt("div", "sc-fxdom");
  stage.append(fxc, fxdom);
  camera.append(stage);
  secoueur.append(camera);
  racine.append(secoueur);
  conteneur.append(racine);

  // ─── les repères (fractions de l'image), tirés des calques ───
  function repere(q: Qui, r: Repere): Point {
    const f = CALQUES[q];
    if (!f) return { x: q === "moi" ? 0.3 : 0.7, y: 0.5 };
    const [tx, ty, tw, th] = f.c.tete.boite;
    const [cx, cy, cw, ch] = f.c.corps.boite;
    const s = f.sens;
    if (r === "tete") return { x: tx + tw / 2, y: ty + th / 2 };
    if (r === "haut") return { x: tx + tw / 2, y: ty + th * 0.05 };
    if (r === "bouche") return f.c.bouche ? { x: f.c.bouche[0], y: f.c.bouche[1] } : { x: tx + tw * (0.5 + 0.12 * s), y: ty + th * 0.78 };
    if (r === "joue") return f.c.joues ? { x: f.c.joues[0][0], y: f.c.joues[0][1] } : { x: tx + tw * (0.5 + 0.22 * s), y: ty + th * 0.68 };
    if (r === "cote") return { x: tx + tw * (0.5 + 0.75 * s), y: ty + th * 0.3 };
    return { x: cx + cw * (0.5 + 0.25 * s), y: cy + ch * 0.6 };
  }
  const milieu = (): Point => {
    const a = repere("moi", "tete");
    const b = repere("autre", "tete");
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  };
  const px = (p: Point) => ({ x: p.x * L.sw, y: p.y * L.sh });

  // ─── la caméra ───
  let vue: Vue = "piece";
  let cam = { s: 1, tx: 0, ty: 0 };
  function cibleDe(v: Vue): { x: number; y: number; s: number } | null {
    if (v === "piece") return null;
    if (v === "duo") {
      const zs = (["moi", "autre"] as const).map((q) => CALQUES[q] && union(CALQUES[q]!.c.corps.boite, CALQUES[q]!.c.tete.boite)).filter((z): z is Zone => Boolean(z));
      if (!zs.length) return null;
      const z = zs.reduce(union);
      const m = milieu();
      return { x: z[0] + z[2] / 2, y: Math.min(m.y + 0.05, z[1] + z[3] / 2), s: 1.05 };
    }
    if (Array.isArray(v)) {
      const [x, y, w, h] = v;
      const s = Math.min(3, Math.max(1, Math.min(L.cw / (w * L.sw), L.ch / (h * L.sh)) / 1.1));
      return { x: x + w / 2, y: y + h / 2, s };
    }
    return { x: v.x, y: v.y, s: v.echelle };
  }
  function appliquerVue(anime: boolean) {
    // (pas encore de taille : la mise en place appliquera la vue)
    if (!L.sw) return;
    camera.style.transition = anime && !reduit ? "transform 1.5s cubic-bezier(.22,.8,.2,1)" : "none";
    const c = cibleDe(vue);
    if (!c) {
      cam = { s: 1, tx: 0, ty: 0 };
      camera.style.transform = "none";
    } else {
      const s = c.s;
      const cx = L.left + c.x * L.sw;
      const cy = L.top + c.y * L.sh;
      const tx = Math.min(-L.left * s, Math.max(L.cw - (L.left + L.sw) * s, L.cw / 2 - cx * s));
      const ty = Math.min(-L.top * s, Math.max(L.ch - (L.top + L.sh) * s, L.ch / 2 - cy * s));
      cam = { s, tx, ty };
      camera.style.transform = `translate(${tx.toFixed(2)}px,${ty.toFixed(2)}px) scale(${s})`;
    }
    donnerAncres();
  }
  /** Les ancres des bulles : au-dessus de chaque tête, là où la caméra la montre (pixels du conteneur). */
  function donnerAncres() {
    if (!o.surAncres) return;
    const ancre = (q: Qui) => {
      const p = repere(q, "haut");
      return { x: cam.tx + (L.left + p.x * L.sw) * cam.s, y: cam.ty + (L.top + p.y * L.sh) * cam.s };
    };
    const a: AncresBulles = { moi: ancre("moi"), autre: ancre("autre") };
    o.surAncres(a);
  }

  let fdpr = 1;
  function mettreEnPlace() {
    const cw = racine.clientWidth;
    const ch = racine.clientHeight;
    if (!cw || !ch) return;
    const k = Math.max(cw / IW, ch / IH);
    const sw = IW * k;
    const sh = IH * k;
    Object.assign(L, { sw, sh, cw, ch, left: (cw - sw) / 2, top: (ch - sh) * cadrage });
    Object.assign(stage.style, { width: `${sw}px`, height: `${sh}px`, left: `${L.left}px`, top: `${L.top}px` });
    stage.style.setProperty("--sw", `${sw}px`);
    // (la toile des effets : au plus deux fois la densité de l'écran, et au plus 4 millions de points sur un grand écran)
    fdpr = Math.min(2, window.devicePixelRatio || 1, Math.sqrt(4e6 / (sw * sh)));
    fxc.width = Math.round(sw * fdpr);
    fxc.height = Math.round(sh * fdpr);
    appliquerVue(false);
  }
  const observateur = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => mettreEnPlace()) : null;
  observateur?.observe(racine);

  // ─── les ressorts des têtes et des corps (la physique de la maquette, telle quelle) ───
  function sursaut(q: Qui, f = 1) {
    const T = TETES[q];
    if (!T) return;
    T.vy -= U() * 14 * f;
    T.vs += 0.3 * f;
    T.va += (Math.random() < 0.5 ? -1 : 1) * 22 * f;
  }
  function pencher(q: Qui, deg: number, ms: number) {
    const T = TETES[q];
    if (!T) return;
    T.ca = deg * T.vers;
    clearTimeout(T.minA);
    T.minA = setTimeout(() => (T.ca = 0), reduit ? 0 : ms);
  }
  function gonfler(q: Qui, s: number, ms: number) {
    const T = TETES[q];
    if (!T) return;
    T.cs = s;
    clearTimeout(T.minS);
    T.minS = setTimeout(() => (T.cs = 1), ms);
  }
  function majTetes(dt: number, t: number) {
    for (const q of ["moi", "autre"] as const) {
      const T = TETES[q];
      if (!T) continue;
      if (T.parle > 0) {
        T.parle -= dt;
        T.cp += dt;
        if (T.cp > 0.17) {
          T.cp = 0;
          T.vy -= U() * 4.2;
          T.va += (Math.random() - 0.5) * 16;
        }
      }
      if (T.rit > 0) {
        T.rit -= dt;
        T.cr += dt;
        if (T.cr > 0.085) {
          T.cr = 0;
          T.sg = -T.sg;
          T.va += T.sg * 46;
          T.vy -= U() * 3;
          if (Math.random() < 0.35) fx.traitsDeRire(q);
        }
      }
      let repos = 0;
      if (!reduit) {
        repos = T.dort ? -T.vers * 9 + 1.2 * Math.sin(t * 0.6 + T.ph) : 1.3 * Math.sin(t * 0.85 + T.ph) + 0.45 * Math.sin(t * 2.3 + T.ph * 1.7);
        T.prochain -= dt;
        if (T.prochain < 0) {
          T.prochain = 5 + Math.random() * 5;
          if (T.dort) {
            T.va += -T.vers * 12;
            fx.zZz(q);
          } else if (T.ca === 0 && !FIGS[q]?.danse) pencher(q, 4 + Math.random() * 3, 1400 + Math.random() * 900);
        }
        if (T.dort) {
          T.zz += dt;
          if (T.zz > 1.5) {
            T.zz = 0;
            fx.zZz(q);
          }
        }
        if ((FIGS[q]?.danse ?? 0) > 0) repos += 8 * Math.sin(t * 6.8 + (q === "autre" ? 0 : Math.PI) + 1.3);
      }
      T.va += (90 * (T.ca + repos - T.a) - 6.5 * T.va) * dt;
      T.a = Math.max(-18, Math.min(18, T.a + T.va * dt));
      T.vy += (150 * (T.cy - T.y) - 11 * T.vy) * dt;
      T.y += T.vy * dt;
      T.vs += (220 * (T.cs - T.s) - 15 * T.vs) * dt;
      T.s += T.vs * dt;
      T.el.style.transform = `translate3d(0,${T.y.toFixed(2)}px,0) rotate(${T.a.toFixed(2)}deg) scale(${T.s.toFixed(4)})`;
    }
  }
  function majFigs(dt: number, t: number) {
    for (const q of ["moi", "autre"] as const) {
      const F = FIGS[q];
      const T = TETES[q];
      if (!F || !T) continue;
      let cible = F.cl;
      const souffle = (T.dort ? 0.011 : 0.006) * Math.sin(t * (T.dort ? 1.05 : 1.6) + F.ph);
      if (F.danse > 0) {
        F.danse -= dt;
        const b = Math.sin(t * 6.8 + (q === "autre" ? Math.PI : 0));
        cible = 5 * b;
        if (Math.abs(b) > 0.97 && !F.coup) {
          F.coup = true;
          F.vdy -= U() * 9;
          T.va += (q === "autre" ? -1 : 1) * b * 30;
        } else if (Math.abs(b) < 0.5) F.coup = false;
      }
      F.vl += (60 * (cible - F.l) - 9 * F.vl) * dt;
      F.l += F.vl * dt;
      F.vdx += (70 * (F.cdx - F.dx) - 12 * F.vdx) * dt;
      F.dx += F.vdx * dt;
      F.vdy += (150 * (0 - F.dy) - 11 * F.vdy) * dt;
      F.dy += F.vdy * dt;
      F.el.style.transform = `translate3d(${F.dx.toFixed(2)}px,${F.dy.toFixed(2)}px,0) rotate(${F.l.toFixed(2)}deg) scale(1,${(1 + souffle).toFixed(4)})`;
    }
  }
  const sansCalques: CommandesFigurine = {
    sens: 1,
    pencher() {},
    gonfler() {},
    sursaut() {},
    secouer() {},
    parler() {},
    rire() {},
    pencherCorps() {},
    rapprocher() {},
    bondir() {},
    danser() {},
    endormir() {},
    reveiller() {},
    dort: false,
  };
  const commandes = {} as Record<Qui, CommandesFigurine>;
  for (const q of ["moi", "autre"] as const) {
    const T = TETES[q];
    const F = FIGS[q];
    if (!T || !F) {
      commandes[q] = sansCalques;
      continue;
    }
    commandes[q] = {
      sens: T.vers,
      pencher: (deg, ms) => pencher(q, deg, ms),
      gonfler: (s, ms) => gonfler(q, s, ms),
      sursaut: (f) => sursaut(q, f),
      secouer: (f = 1) => (T.va += T.vers * 55 * f),
      parler: (sec = 1.1) => (T.parle = Math.max(T.parle, sec)),
      rire: (sec = 1.5) => (T.rit = sec),
      pencherCorps: (deg, ms) => {
        F.cl = deg * F.vers;
        clearTimeout(F.minL);
        F.minL = setTimeout(() => (F.cl = 0), reduit ? 0 : ms);
      },
      rapprocher: (fraction, ms) => {
        F.cdx = fraction * L.sw * F.vers;
        clearTimeout(F.minX);
        F.minX = setTimeout(() => (F.cdx = 0), reduit ? 0 : ms);
      },
      bondir: (f = 1) => {
        F.vdy -= U() * 15 * f;
        sursaut(q, 0.5 * f);
      },
      danser: (sec) => (F.danse = reduit ? 0 : sec),
      endormir: () => {
        T.dort = true;
        T.cy = U() * 1.1;
      },
      reveiller: () => {
        T.dort = false;
        T.cy = 0;
        sursaut(q, 1.3);
      },
      get dort() {
        return T.dort;
      },
    };
  }

  // ─── le moteur des effets : particules et acteurs sur une toile ───
  const parts: PartVivante[] = [];
  const acteurs: { o: Acteur; t: number; ok: (p: { x: number; y: number }) => void }[] = [];
  const EMO = new Map<string, HTMLCanvasElement>();
  const emo = (e: string) => {
    let c = EMO.get(e);
    if (!c) {
      c = document.createElement("canvas");
      c.width = c.height = 128;
      const x = c.getContext("2d");
      if (x) {
        x.font = `100px ${EMOJI}`;
        x.textAlign = "center";
        x.textBaseline = "middle";
        x.fillText(e, 64, 70);
      }
      EMO.set(e, c);
    }
    return c;
  };
  let leger = false;
  let impair = false;
  function part(p: Particule) {
    if (reduit && p.k !== "flash") return;
    // (le mode léger : une particule sur deux)
    if (leger && p.k !== "flash" && (impair = !impair)) return;
    parts.push(Object.assign({ t: 0, vx: 0, vy: 0, ax: 0, ay: 0, rot: 0, vr: 0, al: 1, fr: 1, ph: Math.random() * 6 }, p) as PartVivante);
  }
  function acteur(a: Acteur): Promise<{ x: number; y: number }> {
    return new Promise((ok) => {
      if (reduit) a = { ...a, duree: Math.min(a.duree, 0.25) };
      acteurs.push({ o: a, t: 0, ok });
    });
  }
  function coeur(c: CanvasRenderingContext2D, s: number, col: [string, string]) {
    c.translate(0, -s * 0.1);
    c.beginPath();
    c.moveTo(0, s * 0.38);
    c.bezierCurveTo(-s * 0.06, s * 0.3, -s * 0.5, s * 0.05, -s * 0.5, -s * 0.17);
    c.bezierCurveTo(-s * 0.5, -s * 0.44, -s * 0.16, -s * 0.54, 0, -s * 0.28);
    c.bezierCurveTo(s * 0.16, -s * 0.54, s * 0.5, -s * 0.44, s * 0.5, -s * 0.17);
    c.bezierCurveTo(s * 0.5, s * 0.05, s * 0.06, s * 0.3, 0, s * 0.38);
    c.closePath();
    const g = c.createLinearGradient(0, -s * 0.5, 0, s * 0.4);
    g.addColorStop(0, col[0]);
    g.addColorStop(1, col[1]);
    c.fillStyle = g;
    c.fill();
    c.fillStyle = "rgba(255,255,255,.6)";
    c.beginPath();
    c.ellipse(-s * 0.24, -s * 0.24, s * 0.11, s * 0.06, -0.7, 0, 7);
    c.fill();
  }
  function etoile(c: CanvasRenderingContext2D, s: number, col: string) {
    c.fillStyle = col;
    c.beginPath();
    for (let i = 0; i < 8; i++) {
      const R = i % 2 ? s * 0.12 : s * 0.5;
      const a = (i * Math.PI) / 4;
      c.lineTo(Math.cos(a) * R, Math.sin(a) * R);
    }
    c.closePath();
    c.fill();
  }
  const couleur = (c: Particule["c"], defaut: string) => (typeof c === "string" ? c : defaut);
  function dessinerPart(c: CanvasRenderingContext2D, p: PartVivante) {
    const k = p.t / p.vie;
    const al = p.fondu ? p.fondu(k) : k < 0.12 ? k / 0.12 : 1 - (k - 0.12) / 0.88;
    const s = p.s ?? U() * 3;
    c.globalAlpha = Math.max(0, Math.min(1, al * p.al));
    c.save();
    c.translate(p.x, p.y);
    c.rotate(p.rot);
    if (p.k === "coeur") coeur(c, s * (0.55 + 0.45 * Math.min(1, k * 5)), Array.isArray(p.c) ? p.c : ROSES);
    else if (p.k === "etoile") etoile(c, s * (0.65 + 0.35 * Math.sin(p.t * 16 + p.ph)), couleur(p.c, "#ffd76a"));
    else if (p.k === "trait") {
      const v = Math.hypot(p.vx, p.vy) || 1;
      const l = s * (1 - k * 0.6);
      c.rotate(-p.rot);
      c.strokeStyle = couleur(p.c, "#fff");
      c.lineWidth = p.l ?? 1;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo((-p.vx / v) * l, (-p.vy / v) * l);
      c.stroke();
    } else if (p.k === "rond") {
      c.fillStyle = couleur(p.c, "#fff");
      c.beginPath();
      c.arc(0, 0, s * (1 - k * 0.5), 0, 7);
      c.fill();
    } else if (p.k === "anneau") {
      c.strokeStyle = couleur(p.c, "#fff");
      c.lineWidth = (p.l ?? 1) * (1 - k);
      c.beginPath();
      c.arc(0, 0, s * (0.25 + k), 0, 7);
      c.stroke();
    } else if (p.k === "flash") {
      const R = s * (0.4 + k * 0.9);
      const g = c.createRadialGradient(0, 0, 0, 0, 0, R);
      g.addColorStop(0, "rgba(255,255,240,1)");
      g.addColorStop(0.35, "rgba(255,240,200,.65)");
      g.addColorStop(1, "rgba(255,220,160,0)");
      c.fillStyle = g;
      c.beginPath();
      c.arc(0, 0, R, 0, 7);
      c.fill();
    } else if (p.k === "arc") {
      c.strokeStyle = couleur(p.c, "#fff");
      c.lineWidth = (p.l ?? 1) * (1 - k);
      c.lineCap = "round";
      c.beginPath();
      c.arc(0, 0, s, p.a0 ?? 0, p.a1 ?? Math.PI);
      c.stroke();
    } else if (p.k === "emoji" && p.e) {
      const m = Math.min(1, k * 6);
      const t = s * (p.pop ? m * (1 + 0.25 * Math.sin(m * Math.PI)) : 1);
      c.drawImage(emo(p.e), -t / 2, -t / 2, t, t);
    } else if (p.k === "texte" && p.e) {
      c.font = `${s}px "Bangers","Impact","Arial Black",sans-serif`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.lineJoin = "round";
      c.lineWidth = s * 0.16;
      c.strokeStyle = p.bord || "rgba(40,20,60,.85)";
      c.strokeText(p.e, 0, 0);
      c.fillStyle = couleur(p.c, "#fff");
      c.fillText(p.e, 0, 0);
    }
    c.restore();
  }
  let toileVide = true;
  function majFx(dt: number) {
    if (!fctx) return;
    // (rien à dessiner, et la toile déjà vide : rien à effacer)
    if (!parts.length && !acteurs.length) {
      if (!toileVide) {
        fctx.setTransform(1, 0, 0, 1, 0, 0);
        fctx.clearRect(0, 0, fxc.width, fxc.height);
        toileVide = true;
      }
      return;
    }
    toileVide = false;
    fctx.setTransform(fdpr, 0, 0, fdpr, 0, 0);
    fctx.clearRect(0, 0, L.sw, L.sh);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.t += dt;
      if (p.t >= p.vie) {
        parts.splice(i, 1);
        continue;
      }
      p.vx += p.ax * dt;
      p.vy += p.ay * dt;
      if (p.fr !== 1) {
        const f = Math.pow(p.fr, dt * 60);
        p.vx *= f;
        p.vy *= f;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      if (p.t >= 0) dessinerPart(fctx, p);
    }
    for (let i = acteurs.length - 1; i >= 0; i--) {
      const a = acteurs[i];
      const ao = a.o;
      a.t += dt;
      const u = Math.min(1, a.t / ao.duree);
      const q = ao.pos(u, a.t);
      ao.trainee?.(q, dt, u);
      if (ao.e) {
        const s = ao.taille ? ao.taille(u, a.t) : U() * 7;
        const r = ao.rot ? ao.rot(u, a.t) : 0;
        fctx.globalAlpha = ao.alpha ? Math.max(0, ao.alpha(u)) : 1;
        fctx.save();
        fctx.translate(q.x, q.y);
        fctx.rotate(r);
        fctx.drawImage(emo(ao.e), -s / 2, ao.pivotBas ? -s * 0.92 : -s / 2, s, s);
        fctx.restore();
      }
      if (u >= 1) {
        acteurs.splice(i, 1);
        a.ok(q);
      }
    }
    fctx.globalAlpha = 1;
  }
  const gerbe = (n: number, f: (i: number, a: number) => Particule) => {
    for (let i = 0; i < n; i++) part(f(i, (Math.PI * 2 * i) / n + hasard(-0.3, 0.3)));
  };
  /** Une joue sur la tête (en fractions de la boîte de la tête) : celle du côté de l'autre, ou l'autre joue. */
  function joueSurTete(q: Qui, cote: "vers" | "autre"): { x: number; y: number } {
    const f = CALQUES[q];
    if (!f) return { x: 0.5, y: 0.68 };
    const [tx, ty, tw, th] = f.c.tete.boite;
    const j = f.c.joues?.[cote === "vers" ? 0 : 1];
    if (j) return { x: (j[0] - tx) / tw, y: (j[1] - ty) / th };
    return { x: 0.5 + (cote === "vers" ? 0.22 : -0.16) * f.sens, y: 0.68 };
  }
  const fx: EffetsScene = {
    part,
    acteur,
    px,
    u: U,
    eclatCoeurs(p, n = 14) {
      const c = px(p);
      gerbe(n, (i, a) => ({ k: "coeur", x: c.x, y: c.y, vx: Math.cos(a) * hasard(60, 150), vy: Math.sin(a) * hasard(60, 150) - 60, ay: -40, fr: 0.95, s: U() * hasard(2.4, 4.6), c: i % 3 ? ROSES : ROUGES, vie: hasard(0.9, 1.4), vr: hasard(-2, 2), rot: hasard(-0.4, 0.4) }));
    },
    etincelles(p, n = 8, e = {}) {
      const c = px(p);
      gerbe(n, (i, a) => ({ k: "etoile", x: c.x, y: c.y, vx: Math.cos(a) * hasard(40, 120) * (e.f || 1), vy: Math.sin(a) * hasard(40, 120) * (e.f || 1), fr: 0.93, s: U() * hasard(1.6, 3) * (e.t || 1), c: i % 2 ? "#fff6c8" : "#ffd76a", vie: hasard(0.5, 0.9) }));
    },
    anneau(p, c = "rgba(255,150,200,.95)", taille = 9) {
      const q = px(p);
      part({ k: "anneau", x: q.x, y: q.y, s: U() * taille, l: U() * 0.7, c, vie: 0.6, fondu: (k) => 1 - k });
    },
    jaillir(e, p, n = 3, j = {}) {
      const c = px(p);
      for (let i = 0; i < n; i++)
        part({ k: "emoji", e, pop: true, x: c.x + hasard(-U() * 3, U() * 3), y: c.y, vx: hasard(-25, 25), vy: -hasard(60, 110), fr: 0.98, s: U() * (j.taille || 4.5), vie: hasard(1.1, 1.6), t: -i * 0.18, fondu: (k) => (k < 0 ? 0 : k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3) });
    },
    traitsDeRire(q) {
      const c = px(repere(q, "tete"));
      for (const cote of [-1, 1]) {
        const a = (cote < 0 ? Math.PI : 0) + hasard(-0.5, 0.5);
        part({ k: "trait", x: c.x + Math.cos(a) * U() * 9, y: c.y + Math.sin(a) * U() * 8 - U() * 2, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, s: U() * 2.2, l: U() * 0.45, c: "rgba(255,255,255,.9)", vie: 0.25 });
      }
    },
    zZz(q) {
      const vers = TETES[q]?.vers ?? 1;
      const h = repere(q, "haut");
      const c = px({ x: h.x - vers * 0.04, y: h.y + 0.01 });
      ["z", "z", "Z"].forEach((z, i) =>
        part({ k: "texte", e: z, x: c.x + i * U() * 1.2 * -vers, y: c.y - i * U() * 1.5, vx: -vers * hasard(8, 16), vy: -hasard(14, 22), s: U() * (2.2 + i * 0.9), c: "#e8e4ff", vie: 2.2, t: -i * 0.35, fondu: (k) => (k < 0 ? 0 : k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8) }),
      );
    },
    texteQuiMonte(texte, p, t = {}) {
      const c = px(p);
      part({ k: "texte", e: texte, x: c.x, y: c.y, vx: hasard(-10, 10), vy: -(t.v || 26), s: U() * (t.taille || 3), c: t.c || "#fff", vie: t.vie || 1.4, fondu: (k) => (k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85) });
    },
    lettrage(texte, p, l = {}) {
      const e = elt("div", `sc-lettrage ${l.couleur || ""}`);
      e.textContent = texte;
      e.style.left = pc(p.x);
      e.style.top = pc(p.y);
      if (l.taille) e.style.fontSize = `calc(var(--sw) * ${l.taille})`;
      fxdom.append(e);
      const r = l.rot || 0;
      e.animate(
        [
          { transform: `translate(-50%,-50%) scale(.2) rotate(${r - 20}deg)`, opacity: 0 },
          { transform: `translate(-50%,-50%) scale(1.25) rotate(${r + 4}deg)`, opacity: 1, offset: 0.16 },
          { transform: `translate(-50%,-50%) scale(1) rotate(${r}deg)`, opacity: 1, offset: 0.3 },
          { transform: `translate(-50%,-62%) scale(1) rotate(${r}deg)`, opacity: 1, offset: 0.82 },
          { transform: `translate(-50%,-95%) scale(.9) rotate(${r}deg)`, opacity: 0 },
        ],
        { duration: reduit ? 400 : l.duree || 1500, easing: "ease-out", fill: "forwards" },
      ).finished.then(
        () => e.remove(),
        () => e.remove(),
      );
    },
    secousse(f = 1) {
      if (reduit) return;
      const k: Keyframe[] = [];
      for (let i = 0; i < 8; i++) k.push({ transform: `translate(${hasard(-7, 7) * f * (1 - i / 8)}px,${hasard(-5, 5) * f * (1 - i / 8)}px)` });
      k.push({ transform: "none" });
      secoueur.animate(k, { duration: 340, easing: "linear" });
    },
    flash(p, taille = 30) {
      const c = px(p);
      part({ k: "flash", x: c.x, y: c.y, s: U() * taille, vie: 0.45, fondu: (k) => 1 - k });
    },
    rougir(q, ms = 3200) {
      const T = TETES[q];
      if (!T) return;
      for (const cote of ["vers", "autre"] as const) {
        const j = joueSurTete(q, cote);
        const b = elt("span", "sc-rougeur");
        b.style.left = pc(j.x);
        b.style.top = pc(j.y);
        T.el.append(b);
        b.animate([{ opacity: 0 }, { opacity: 0.8, offset: 0.15 }, { opacity: 0.65, offset: 0.7 }, { opacity: 0 }], { duration: ms, fill: "forwards" }).finished.then(
          () => b.remove(),
          () => b.remove(),
        );
      }
    },
    marqueBisou(q) {
      const T = TETES[q];
      if (!T) return;
      const j = joueSurTete(q, "vers");
      const m = elt("span", "sc-marque");
      m.textContent = "💋";
      m.style.left = pc(j.x);
      m.style.top = pc(j.y);
      T.el.append(m);
      m.animate(
        [
          { transform: "translate(-50%,-50%) scale(1.9) rotate(-28deg)", opacity: 0 },
          { transform: "translate(-50%,-50%) scale(.8) rotate(-18deg)", opacity: 0.95, offset: 0.08 },
          { transform: "translate(-50%,-50%) scale(.8) rotate(-18deg)", opacity: 0.85, offset: 0.8 },
          { transform: "translate(-50%,-50%) scale(.8) rotate(-18deg)", opacity: 0 },
        ],
        { duration: 4500, fill: "forwards" },
      ).finished.then(
        () => m.remove(),
        () => m.remove(),
      );
      fx.rougir(q);
    },
  };

  // ─── les sons : un seul AudioContext, créé au premier toucher (n'importe où dans la page : les boutons du salon sont
  // hors de la scène) ───
  let ac: AudioContext | null = null;
  function audio(): AudioContext | null {
    try {
      if (!ac) {
        const C = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (C) ac = new C();
      }
      if (ac && ac.state === "suspended" && !document.hidden) void ac.resume();
    } catch {
      ac = null;
    }
    return ac;
  }
  const premierToucher = () => audio();
  document.addEventListener("pointerdown", premierToucher, { once: true, capture: true });
  const sons: SonsScene = {
    bruit(ms, vol, freq, q = 0.9) {
      const a = audio();
      if (!a) return;
      const n = Math.max(1, Math.floor((a.sampleRate * ms) / 1000));
      const b = a.createBuffer(1, n, a.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 1.5);
      const s = a.createBufferSource();
      const f = a.createBiquadFilter();
      const g = a.createGain();
      s.buffer = b;
      f.type = "bandpass";
      f.frequency.value = freq;
      f.Q.value = q;
      g.gain.value = vol;
      s.connect(f);
      f.connect(g);
      g.connect(a.destination);
      s.start();
    },
    note(freq, t0, dur, vol = 0.045, type = "triangle") {
      const a = audio();
      if (!a) return;
      const os = a.createOscillator();
      const g = a.createGain();
      const t = a.currentTime + t0;
      os.type = type;
      os.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      os.connect(g);
      g.connect(a.destination);
      os.start(t);
      os.stop(t + dur + 0.05);
    },
    kssht: () => sons.bruit(150, 0.08, 2600),
    bipFin: () => {
      sons.note(1320, 0, 0.07, 0.035, "square");
      sons.note(990, 0.08, 0.09, 0.03, "square");
    },
    clac: () => sons.bruit(55, 0.22, 3800, 0.6),
    jingle: (h) => (JINGLES[h] ?? JINGLES.joie).forEach((f, i) => sons.note(f, i * 0.13, 0.28)),
  };

  // ─── la boucle, unique ; la page cachée ; le mode léger ───
  const abonnes = new Set<(dt: number, t: number) => void>();
  let raf = 0;
  let avant = 0;
  let horloge = 0;
  let fenetre = { debut: 0, somme: 0, n: 0 };
  function boucle(now: number) {
    if (!vivante) return;
    const dtms = Math.min(64, avant ? now - avant : 16);
    avant = now;
    const dt = Math.min(0.033, dtms / 1000);
    horloge += dt;
    majTetes(dt, horloge);
    majFigs(dt, horloge);
    majFx(Math.min(0.05, dtms / 1000));
    for (const f of abonnes) f(dt, horloge);
    // (le mode léger : la moyenne des images au-dessus de 20 ms pendant 2 s — pas pendant la première seconde et demie,
    // où les images de la pièce se décodent)
    if (!leger && horloge > 1.5) {
      if (!fenetre.debut) fenetre = { debut: now, somme: 0, n: 0 };
      fenetre.somme += dtms;
      fenetre.n += 1;
      if (now - fenetre.debut > 2000) {
        if (fenetre.somme / fenetre.n > 20) {
          leger = true;
          racine.dataset.leger = "1";
          o.surLeger?.();
        }
        fenetre = { debut: now, somme: 0, n: 0 };
      }
    }
    raf = requestAnimationFrame(boucle);
  }
  function demarrer() {
    if (!vivante || raf) return;
    avant = 0;
    fenetre = { debut: 0, somme: 0, n: 0 };
    raf = requestAnimationFrame(boucle);
  }
  function arreter() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }
  const surVisibilite = () => {
    if (document.hidden) {
      arreter();
      void ac?.suspend().catch(() => undefined);
    } else {
      demarrer();
      void ac?.resume().catch(() => undefined);
    }
  };
  document.addEventListener("visibilitychange", surVisibilite);

  // ─── les mises en scène, l'une après l'autre ───
  let file: Promise<void> = Promise.resolve();
  let enCours = 0;

  const scene: Scene = {
    viser(v, anime = true) {
      vue = v;
      appliquerVue(anime);
    },
    figurine: (q) => commandes[q],
    parle(q, n) {
      if (n > 0.14) commandes[q].parler(0.18);
      if (n > 0.6) commandes[q].gonfler(1.02, 160);
    },
    fx,
    sons,
    repere,
    milieu,
    geste(cle, de) {
      const jouer = miseEnSceneDe(cle);
      if (!jouer || !vivante) return Promise.resolve();
      enCours += 1;
      const fin = file.then(() => (vivante ? jouer(scene, de) : undefined)).catch(() => undefined);
      file = fin.finally(() => (enCours -= 1));
      return file;
    },
    attendre,
    surImage(fn) {
      abonnes.add(fn);
      return () => abonnes.delete(fn);
    },
    get occupee() {
      return enCours > 0;
    },
    reduit,
    get leger() {
      return leger;
    },
    detruire() {
      vivante = false;
      arreter();
      for (const t of minuteries) clearTimeout(t);
      minuteries.clear();
      for (const q of ["moi", "autre"] as const) {
        clearTimeout(TETES[q]?.minA);
        clearTimeout(TETES[q]?.minS);
        clearTimeout(FIGS[q]?.minL);
        clearTimeout(FIGS[q]?.minX);
      }
      abonnes.clear();
      parts.length = 0;
      acteurs.length = 0;
      observateur?.disconnect();
      document.removeEventListener("visibilitychange", surVisibilite);
      document.removeEventListener("pointerdown", premierToucher, { capture: true });
      void ac?.close().catch(() => undefined);
      ac = null;
      racine.remove();
    },
  };

  mettreEnPlace();
  if (!document.hidden) demarrer();
  return scene;
}
