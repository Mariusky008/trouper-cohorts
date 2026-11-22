/**
 * 📻 LE TALKIE-WALKIE DANS LA SCÈNE (`docs/univers/salon-du-duo.md`, section 4.6 ; le lot S4) — la maquette v6, telle
 * quelle, posée sur le moteur :
 *
 * - **dans la main** : le talkie se pose dans le calque de la tête (il la suit : le ressort, le penché), près de la
 *   bouche ; sa lumière est verte quand on parle (`emet`), orange quand on écoute (`ecoute`) ; des ondes partent vers
 *   l'autre ;
 * - **sur la table** : un vocal qui attend d'être écouté — le talkie couché, sa lumière rouge qui clignote, une pastille
 *   🎙️ ; un toucher (le sien : l'écouter ; le mien : « il attend ») ;
 * - **la lecture** : la figurine de celui qui a parlé reprend son talkie et le dit — la tête suit ses niveaux (pas de
 *   décodage du son), les barres de la bulle se colorent au fil de la lecture, l'autre figurine penche la tête ;
 * - **en direct** : pendant que l'autre parle dans son talkie (le pouls le dit), sa figurine parle au rythme d'une voix,
 *   la mienne tient le sien à l'oreille.
 *
 * Un seul lecteur de son pour tout le salon, débloqué au premier toucher (sur iPhone, un son ne part sans toucher que
 * d'un lecteur déjà débloqué) : le vocal qui arrive en direct joue tout de suite.
 *
 * MODULE DU NAVIGATEUR (il touche au DOM) : à n'importer que dans un composant client.
 */
import type { Point, Qui, Scene } from "@/lib/direct/salon";
import type { Zone } from "@/lib/direct/pieces-duo";
import type { MessageFil } from "@/lib/direct/talkie";
import { VOCAL, niveauA, niveauFaux, niveauxDuVocal } from "@/lib/direct/vocal";

export const SVG_TALKIE =
  '<svg viewBox="0 0 40 92" aria-hidden="true"><rect x="26" y="0" width="5" height="30" rx="2.5" fill="#20222b"/><rect x="3" y="22" width="34" height="68" rx="9" fill="#323847"/><rect x="5" y="24" width="12" height="64" rx="6" fill="#fff" opacity=".1"/><rect x="9" y="30" width="22" height="13" rx="3" fill="#a8e6c9"/><g stroke="#1b1e26" stroke-width="2.4" stroke-linecap="round"><path d="M10 54h20M10 60h20M10 66h20M10 72h20"/></g><circle class="led" cx="30" cy="82" r="3.4"/><rect x="0" y="40" width="4" height="14" rx="2" fill="#20222b"/></svg>';

/** Le style du talkie (posé une fois dans la page du salon). */
export const STYLES_TALKIE = `
.sc-talkie{position:absolute;width:calc(var(--sw)*.052);transform:translate(-50%,-50%) rotate(var(--r,-14deg));pointer-events:none;filter:drop-shadow(0 2px 2px rgba(20,8,4,.55));z-index:3}
.sc-talkie svg{display:block;width:100%;height:auto}
.sc-talkie .led,.sc-talkie-table .led{fill:#5a1c22}
.sc-talkie.emet .led{fill:#5dff8a;animation:sc-clignote .26s steps(2) infinite}
.sc-talkie.ecoute .led{fill:#ffb347;animation:sc-clignote .5s steps(2) infinite}
.sc .sc-talkie-table{position:absolute;width:calc(var(--sw)*.056);padding:calc(var(--sw)*.012);margin:0;border:0;background:none;transform:translate(-50%,-100%);pointer-events:auto;cursor:pointer;filter:drop-shadow(0 3px 2px rgba(30,10,5,.55));animation:sc-tremble 2.4s ease-in-out infinite;-webkit-tap-highlight-color:transparent}
.sc-talkie-table svg{position:relative;display:block;width:100%;height:auto;transform:translateY(30%) rotate(-72deg)}
.sc-talkie-table::before{content:"";position:absolute;left:50%;top:50%;width:300%;height:90%;transform:translate(-50%,-10%);border-radius:50%;background:radial-gradient(closest-side,rgba(255,70,105,.85),rgba(255,70,105,0));animation:sc-halo 1.4s ease-in-out infinite;pointer-events:none}
.sc-talkie-table .led{fill:#ff3b3b;animation:sc-clignote .7s steps(2) infinite}
.sc-talkie-table .sc-pastille{position:absolute;left:62%;top:6%;font-size:calc(var(--sw)*.024);line-height:1;padding:.18em;border-radius:50%;background:#ff3b5c;box-shadow:0 0 0 .12em #fff;animation:sc-pastille 1.4s ease-in-out infinite}
@keyframes sc-clignote{50%{opacity:.2}}
@keyframes sc-halo{50%{opacity:.35}}
@keyframes sc-tremble{0%,82%,100%{translate:0 0}86%{translate:-1px 0}90%{translate:1px 0}94%{translate:-1px 0}}
@keyframes sc-pastille{50%{scale:1.18}}
@media (prefers-reduced-motion:reduce){.sc-talkie-table,.sc-talkie-table::before,.sc-talkie-table .sc-pastille{animation:none}}
`;

// ─── le lecteur de son, unique, débloqué au premier toucher ───
let lecteurUnique: HTMLAudioElement | null = null;
let debloque = false;
function lecteur(): HTMLAudioElement {
  if (!lecteurUnique) {
    lecteurUnique = new Audio();
    lecteurUnique.preload = "auto";
    lecteurUnique.setAttribute("playsinline", "");
  }
  return lecteurUnique;
}
/** Un son muet d'un dixième de seconde (WAV), pour débloquer le lecteur au premier toucher. */
function silence(): string {
  const n = 800;
  const b = new ArrayBuffer(44 + n * 2);
  const v = new DataView(b);
  const ecrire = (o: number, t: string) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  ecrire(0, "RIFF");
  v.setUint32(4, 36 + n * 2, true);
  ecrire(8, "WAVEfmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true);
  v.setUint32(28, 16000, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  ecrire(36, "data");
  v.setUint32(40, n * 2, true);
  return URL.createObjectURL(new Blob([b], { type: "audio/wav" }));
}
/** Au premier toucher dans le salon : le lecteur est débloqué (un vocal qui arrive en direct pourra jouer seul). */
export function debloquerSon(): void {
  if (debloque || enLecture) return;
  debloque = true;
  try {
    const a = lecteur();
    a.muted = true;
    a.src = silence();
    void a.play().then(
      () => {
        a.pause();
        a.muted = false;
      },
      () => {
        a.muted = false;
        debloque = false;
      },
    );
  } catch {
    debloque = false;
  }
}

// ─── le talkie dans la main (il suit la tête) ───
const teteDe = (racine: HTMLElement, q: Qui) => racine.querySelector<HTMLElement>(`.sc-tete[data-tete="${q}"]`);
const stageDe = (racine: HTMLElement) => racine.querySelector<HTMLElement>(".sc-stage");

/** La figurine prend son talkie (près de sa bouche, dans le calque de sa tête), lumière verte ou orange. */
export function prendreTalkie(s: Scene, racine: HTMLElement, q: Qui, etat: "emet" | "ecoute" | null): HTMLElement | null {
  const tete = teteDe(racine, q);
  if (!tete) return null;
  let t = tete.querySelector<HTMLElement>(":scope>.sc-talkie");
  if (t) {
    t.getAnimations().forEach((a) => a.cancel());
    t.classList.remove("part");
  } else {
    t = document.createElement("span");
    t.className = "sc-talkie";
    t.dataset.talkie = q;
    t.innerHTML = SVG_TALKIE;
    // (près de la bouche, un peu en avant, vers l'autre ; la tête de « moi » regarde vers la droite)
    const fig = tete.parentElement;
    const b = s.fx.px(s.repere(q, "bouche"));
    const hx = (fig?.offsetLeft ?? 0) + tete.offsetLeft;
    const hy = (fig?.offsetTop ?? 0) + tete.offsetTop;
    const w = tete.offsetWidth || 1;
    const h = tete.offsetHeight || 1;
    const sens = q === "moi" ? 1 : -1;
    t.style.left = `${((b.x - hx) / w) * 100 + sens * 22}%`;
    t.style.top = `${((b.y - hy) / h) * 100 + 4}%`;
    t.style.setProperty("--r", `${sens * -18}deg`);
    tete.append(t);
    if (!s.reduit) t.animate([{ opacity: 0, translate: "0 45%", scale: "0.5" }, { opacity: 1, translate: "0 0", scale: "1" }], { duration: 320, easing: "cubic-bezier(.3,1.4,.5,1)" });
  }
  t.classList.toggle("emet", etat === "emet");
  t.classList.toggle("ecoute", etat === "ecoute");
  return t;
}
/** La figurine range son talkie. */
export function rangerTalkie(s: Scene, racine: HTMLElement, q: Qui, ms = 260): void {
  const t = teteDe(racine, q)?.querySelector<HTMLElement>(":scope>.sc-talkie");
  if (!t || t.classList.contains("part")) return;
  t.classList.add("part");
  t.classList.remove("emet", "ecoute");
  // (repris entre-temps — `prendreTalkie` annule l'animation : il reste dans la main)
  const fin = () => {
    if (t.classList.contains("part")) t.remove();
  };
  if (s.reduit) return fin();
  t.animate([{ opacity: 1 }, { opacity: 0, translate: "0 45%", scale: "0.6" }], { duration: ms, fill: "forwards" }).finished.then(fin, fin);
}
/** Une onde part du talkie (ou de la bouche) vers l'autre. */
export function onde(s: Scene, racine: HTMLElement, de: Qui): void {
  if (s.leger && Math.random() < 0.5) return;
  const t = teteDe(racine, de)?.querySelector<HTMLElement>(":scope>.sc-talkie");
  const st = stageDe(racine);
  let c = s.fx.px(s.repere(de, "bouche"));
  if (t && st) {
    const r = t.getBoundingClientRect();
    const rs = st.getBoundingClientRect();
    const k = rs.width / (st.offsetWidth || rs.width || 1);
    if (k > 0) c = { x: (r.left + r.width / 2 - rs.left) / k, y: (r.top + r.height * 0.3 - rs.top) / k };
  }
  const U = s.fx.u();
  const dir = de === "moi" ? 1 : -1;
  const a = dir > 0 ? 0 : Math.PI;
  s.fx.part({ k: "arc", x: c.x + dir * U * 2, y: c.y, vx: dir * U * 26, vy: -U * 1.2, s: U * 2.2, a0: a - 0.65, a1: a + 0.65, l: U * 0.55, c: "rgba(170,232,255,.95)", vie: 0.9, fondu: (k) => 1 - k });
}
/** La tête suit la voix (un niveau de 0 à 1), et parfois une onde part. */
export function vivreVoix(s: Scene, racine: HTMLElement, q: Qui, n: number, ondes = 0.35): void {
  s.parle(q, n);
  if (n > 0.3 && Math.random() < ondes) onde(s, racine, q);
}

// ─── le talkie posé sur la table (un vocal qui attend d'être écouté) ───
/** Où il se pose : sur la table, du côté de qui l'a laissé (sans table relevée : la place libre la plus proche). */
function placeSurTable(s: Scene, table: Zone | undefined, q: Qui): Point {
  if (!table) return s.placeLibre(q);
  const [x, y, w, h] = table;
  return { x: x + w * (q === "moi" ? 0.3 : 0.7), y: y + h * 0.42 };
}
export type TalkiesSurTable = {
  /** Poser le talkie de `q` (son vocal `id`) sur la table ; `anime` : il tombe dessus. */
  poser(q: Qui, id: string, label: string, anime?: boolean): void;
  /** Le retirer (`vite` : sans animation). */
  retirer(q: Qui, vite?: boolean): void;
  /** Le vocal qui attend sur la table, de ce côté. */
  id(q: Qui): string | undefined;
  detruire(): void;
};
/** 📻 Les talkies de la table (un de chaque côté au plus) ; `toucher` : l'un d'eux est touché. */
export function installerTalkiesTable(s: Scene, table: Zone | undefined, toucher: (q: Qui, id: string) => void): TalkiesSurTable {
  const couche = s.couche("devant");
  const poses: Partial<Record<Qui, { id: string; el: HTMLButtonElement }>> = {};
  const retirer = (q: Qui, vite = false) => {
    const p = poses[q];
    if (!p) return;
    delete poses[q];
    const el = p.el;
    if (vite || s.reduit) return el.remove();
    el.animate([{ opacity: 1 }, { opacity: 0, translate: "0 -40%" }], { duration: 300, fill: "forwards" }).finished.then(
      () => el.remove(),
      () => el.remove(),
    );
  };
  return {
    poser(q, id, label, anime = true) {
      if (poses[q]?.id === id) return;
      retirer(q, true);
      const p = placeSurTable(s, table, q);
      const el = document.createElement("button");
      el.type = "button";
      el.className = "sc-talkie-table";
      el.dataset.talkieTable = q;
      el.dataset.vocal = id;
      el.setAttribute("aria-label", label);
      el.style.left = `${p.x * 100}%`;
      el.style.top = `${p.y * 100}%`;
      el.innerHTML = `${SVG_TALKIE}<span class="sc-pastille" aria-hidden="true">🎙️</span>`;
      el.addEventListener("pointerdown", (e) => e.stopPropagation());
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        toucher(q, id);
      });
      couche.append(el);
      if (anime && !s.reduit) el.animate([{ translate: "0 -60%", opacity: 0 }, { translate: "0 0", opacity: 1 }], { duration: 420, easing: "cubic-bezier(.3,1.3,.5,1)" });
      poses[q] = { id, el };
    },
    retirer,
    id: (q) => poses[q]?.id,
    detruire() {
      retirer("moi", true);
      retirer("autre", true);
    },
  };
}
/** Le talkie de la table bouge un peu (on l'a touché : il attend encore). */
export function secouerTalkieTable(racine: HTMLElement, q: Qui): void {
  racine.querySelector<HTMLElement>(`.sc-talkie-table[data-talkie-table="${q}"]`)?.animate([{ rotate: "0deg" }, { rotate: "8deg" }, { rotate: "-8deg" }, { rotate: "0deg" }], { duration: 400 });
}

// ─── la lecture d'un vocal, dans la scène ───
let enLecture: { id: string; arreter: () => void } | null = null;
/** (chaque son mis dans le lecteur a son numéro : on n'arrête que le sien) */
let numeroDuSon = 0;
/**
 * 🎙️ JOUER UN SON DANS LE LECTEUR UNIQUE (la voix d'un mème) : `null` si le téléphone ne l'a pas laissé partir (sans
 * toucher). Le vocal en cours s'arrête.
 */
export async function jouerSon(url: string): Promise<{ a: HTMLAudioElement; arreter: () => void } | null> {
  enLecture?.arreter();
  const a = lecteur();
  const n = ++numeroDuSon;
  a.onended = null;
  a.muted = false;
  a.src = url;
  try {
    await a.play();
  } catch {
    return null;
  }
  return {
    a,
    arreter: () => {
      if (numeroDuSon === n) a.pause();
    },
  };
}
/** Le vocal en cours de lecture (son identifiant). */
export const vocalEnLecture = () => enLecture?.id ?? null;
/** Arrêter la lecture en cours. */
export function arreterLecture(): void {
  enLecture?.arreter();
}

/**
 * ▶ LIRE UN VOCAL DANS LA SCÈNE : la figurine de qui l'a dit reprend son talkie et le dit (la tête suit ses niveaux),
 * l'autre penche la tête ; les barres de sa bulle (`[data-vague="<id>"]`) se colorent. `bloque` : le téléphone n'a pas
 * laissé le son partir (sans toucher) — rien ne s'est joué. `fin` : résolue à la fin (ou à l'arrêt).
 */
export async function lireVocal(s: Scene, racine: HTMLElement, m: MessageFil, surFin?: () => void): Promise<{ etat: "joue" | "bloque"; fin: Promise<void> }> {
  const meme = enLecture?.id === m.id;
  enLecture?.arreter();
  if (meme) return { etat: "joue", fin: Promise.resolve() };
  const q: Qui = m.moi ? "moi" : "autre";
  const autre: Qui = q === "moi" ? "autre" : "moi";
  const niveaux = niveauxDuVocal(m);
  const duree = Math.max(VOCAL.min, Number(m.duree) || 0);
  const a = lecteur();
  numeroDuSon++;
  a.muted = false;
  a.src = m.son;
  try {
    await a.play();
  } catch {
    return { etat: "bloque", fin: Promise.resolve() };
  }
  let fini = false;
  let resoudre: () => void = () => undefined;
  const fin = new Promise<void>((ok) => (resoudre = ok));
  const t = prendreTalkie(s, racine, q, "emet");
  s.sons.kssht();
  if (s.figurine(q).dort) s.figurine(q).reveiller();
  s.figurine(autre).pencher(6, Math.min(60_000, duree * 1000));
  let derniere = -1;
  let lus = -1;
  let desabonner: () => void = () => undefined;
  const barres = () => [...racine.ownerDocument.querySelectorAll<HTMLElement>(`[data-vague="${m.id}"] i`)];
  const arreter = () => {
    if (fini) return;
    fini = true;
    desabonner();
    a.onended = null;
    a.pause();
    barres().forEach((x) => x.classList.remove("lu"));
    t?.classList.remove("emet");
    s.sons.bipFin();
    setTimeout(() => rangerTalkie(s, racine, q), 320);
    s.figurine(autre).pencher(0, 300);
    if (enLecture?.id === m.id) enLecture = null;
    surFin?.();
    resoudre();
  };
  a.onended = arreter;
  const t0 = performance.now();
  desabonner = s.surImage(() => {
    const tt = a.currentTime > 0 ? a.currentTime : (performance.now() - t0) / 1000;
    const i = Math.floor((tt * 1000) / VOCAL.pasMs);
    if (i !== derniere) {
      derniere = i;
      vivreVoix(s, racine, q, niveauA(niveaux, tt));
    }
    const l = barres();
    const nb = Math.round(Math.min(1, tt / duree) * l.length);
    if (nb !== lus) {
      lus = nb;
      l.forEach((x, j) => x.classList.toggle("lu", j < nb));
    }
    if (a.ended || tt > duree + 1.5) arreter();
  });
  enLecture = { id: m.id, arreter };
  return { etat: "joue", fin };
}

/**
 * 📻 EN DIRECT : l'autre parle dans son talkie (le pouls le dit) — sa figurine lève le sien et parle au rythme d'une
 * voix, la mienne tient le sien à l'oreille. Rend de quoi l'arrêter (son vocal arrive, ou il a fini).
 */
export function entendreEnDirect(s: Scene, racine: HTMLElement, de: Qui): () => void {
  const vers: Qui = de === "moi" ? "autre" : "moi";
  if (s.figurine(de).dort) s.figurine(de).reveiller();
  prendreTalkie(s, racine, de, "emet");
  prendreTalkie(s, racine, vers, "ecoute");
  s.sons.kssht();
  s.figurine(vers).pencher(7, 60_000);
  const t0 = performance.now();
  let derniere = -1;
  const graine = 3 + Math.random() * 4;
  const desabonner = s.surImage(() => {
    const t = (performance.now() - t0) / 1000;
    const i = Math.floor((t * 1000) / VOCAL.pasMs);
    if (i === derniere) return;
    derniere = i;
    vivreVoix(s, racine, de, niveauFaux(t, graine), 0.25);
  });
  let fait = false;
  return () => {
    if (fait) return;
    fait = true;
    desabonner();
    rangerTalkie(s, racine, de);
    rangerTalkie(s, racine, vers);
    s.figurine(vers).pencher(0, 400);
  };
}
