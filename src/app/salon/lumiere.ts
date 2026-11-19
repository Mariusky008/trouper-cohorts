/**
 * 🌙 LA LUMIÈRE ET LA MÉTÉO DE LA PIÈCE (`docs/univers/salon-du-duo.md`, section 4.11 ; le lot S7) — sur le moteur :
 *
 * - **la nuit** : les lampes de la pièce éclairent vraiment (un halo chaud qui respire sur chaque lampe relevée), la télé
 *   jette sa lueur bleue qui scintille, les coins s'assombrissent un peu (jamais un voile gris, jamais un carré sombre) ;
 *   dehors, dans les carreaux, la lune, des étoiles qui scintillent, quelques fenêtres allumées de la ville ;
 * - **la météo du jour, à la fenêtre seulement** (dans les carreaux relevés, `fenetreCoins` : jamais sur les rideaux ni
 *   dedans) : 🌧️ la pluie (des traits qui tombent, des gouttes qui glissent sur la vitre), ❄️ la neige, ⛈️ l'orage (la
 *   pluie forte, un éclair qui illumine la pièce, un grondement, les figurines sursautent), 🌫️ le brouillard, ☁️ un ciel
 *   gris ; ☀️ le soleil, de jour : des rayons qui entrent par la fenêtre, une flaque de lumière au sol, de la poussière
 *   qui danse dedans.
 *
 * Tout est dans les couches de la pièce (sous la caméra) : ça suit le cadrage. Mouvement réduit : une image fixe. Le
 * mode léger : moitié moins de gouttes.
 *
 * MODULE DU NAVIGATEUR (il touche au DOM) : à n'importer que dans un composant client.
 */
import type { Scene } from "@/lib/direct/salon";
import type { MomentDuo, Zone } from "@/lib/direct/pieces-duo";
import type { CleMeteo } from "@/lib/direct/meteo";

/** Le style de la lumière (posé une fois dans la page du salon). */
export const STYLES_LUMIERE = `
.sc-ciel{position:absolute;pointer-events:none;mix-blend-mode:multiply;opacity:0;transition:opacity 1.6s ease}
.sc-ciel[data-ciel="gris"]{background:linear-gradient(180deg,#7d879c,#a3acbd 70%,#8a8f9e);opacity:.7}
.sc-ciel[data-ciel="neige"]{background:linear-gradient(180deg,#c7cfdd,#e4e8f0);opacity:.55}
.sc-ciel[data-ciel="brouillard"]{background:linear-gradient(180deg,#d9dde4,#eef0f3);mix-blend-mode:screen;opacity:.6}
.sc-ciel[data-ciel="nuit"]{background:linear-gradient(180deg,#26357f,#33449a 55%,#4a4692);opacity:.8}
canvas.sc-meteo{position:absolute;pointer-events:none;mix-blend-mode:screen}
.sc-halo{position:absolute;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;pointer-events:none;mix-blend-mode:screen;background:radial-gradient(circle,rgba(255,236,200,.8),rgba(255,196,120,.3) 30%,rgba(255,170,90,0) 68%);animation:sc-l-respire 6s ease-in-out infinite}
.sc-lueur-tele{position:absolute;transform:translate(-50%,-50%);border-radius:50%;pointer-events:none;mix-blend-mode:screen;background:radial-gradient(ellipse,rgba(140,190,255,.55),rgba(120,170,255,0) 68%);animation:sc-l-tele 2.6s steps(13) infinite}
.sc-vignette{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 75% 70% at 52% 52%,transparent 52%,rgba(6,5,22,.5) 100%)}
.sc-rai{position:absolute;transform-origin:50% 0;pointer-events:none;mix-blend-mode:screen;background:linear-gradient(90deg,transparent,rgba(255,222,170,var(--a,.3)) 50%,transparent);-webkit-mask-image:linear-gradient(180deg,transparent,#000 9%,rgba(0,0,0,.55) 50%,transparent 88%);mask-image:linear-gradient(180deg,transparent,#000 9%,rgba(0,0,0,.55) 50%,transparent 88%);filter:blur(calc(var(--sw)*.006));animation:sc-l-rai var(--d,6s) ease-in-out infinite;animation-delay:var(--dl,0s)}
.sc-flaque{position:absolute;transform:translate(-50%,-50%);border-radius:50%;pointer-events:none;mix-blend-mode:screen;background:radial-gradient(ellipse,rgba(255,206,140,.42),rgba(255,180,110,.12) 50%,transparent 70%);animation:sc-l-respire 9s ease-in-out infinite}
canvas.sc-poussiere{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;mix-blend-mode:screen}
.sc-eclair{position:absolute;inset:0;pointer-events:none;background:#eef3ff;mix-blend-mode:screen;opacity:0}
@keyframes sc-l-respire{0%,100%{opacity:.72}50%{opacity:1}}
@keyframes sc-l-rai{0%,100%{opacity:.45}50%{opacity:1}}
@keyframes sc-l-tele{0%{opacity:.7}15%{opacity:1}23%{opacity:.6}38%{opacity:.95}46%{opacity:.75}62%{opacity:1}77%{opacity:.68}100%{opacity:.85}}
@media (prefers-reduced-motion:reduce){.sc-halo,.sc-lueur-tele,.sc-rai,.sc-flaque{animation:none}}
`;

export type LumiereSalon = {
  /** Le temps qu'il fait (rien : la fenêtre telle qu'elle est). */
  meteo(m: CleMeteo | null): void;
  detruire(): void;
};

const hasard = (a: number, b: number) => a + Math.random() * (b - a);
const pc = (x: number) => `${x * 100}%`;

/** Les carreaux : leur boîte (fractions de l'image) et le découpage de la boîte (en %). */
function carreaux(coins: [number, number][]) {
  const xs = coins.map((c) => c[0]);
  const ys = coins.map((c) => c[1]);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  const w = Math.max(0.001, Math.max(...xs) - x0);
  const h = Math.max(0.001, Math.max(...ys) - y0);
  const clip = `polygon(${coins.map(([x, y]) => `${(((x - x0) / w) * 100).toFixed(2)}% ${(((y - y0) / h) * 100).toFixed(2)}%`).join(",")})`;
  return { x0, y0, w, h, clip };
}

/**
 * 🌙 INSTALLER LA LUMIÈRE de la pièce : la nuit (lampes, télé, ciel étoilé), et la météo, une fois connue (`meteo`).
 * `largeur`, `hauteur` : la taille de la plaque (pour les angles des rayons).
 */
export function installerLumiere(
  s: Scene,
  o: { moment: MomentDuo; largeur: number; hauteur: number; fenetre?: [number, number][]; lampes?: Zone[]; tele?: Zone },
): LumiereSalon {
  const derriere = s.couche("derriere");
  const devant = s.couche("devant");
  const nuit = o.moment === "nuit";
  const els: HTMLElement[] = [];
  const poser = (parent: HTMLElement, el: HTMLElement) => {
    parent.append(el);
    els.push(el);
    return el;
  };
  const div = (classe: string) => {
    const d = document.createElement("div");
    d.className = classe;
    return d;
  };

  // ─── la nuit : les lampes éclairent, la télé jette sa lueur, les coins s'assombrissent ───
  if (nuit) {
    (o.lampes ?? []).forEach(([x, y, w, h], i) => {
      const d = poser(derriere, div("sc-halo"));
      d.dataset.lampe = String(i);
      const taille = Math.max(w, (h * o.hauteur) / o.largeur) * 2.8;
      Object.assign(d.style, { left: pc(x + w / 2), top: pc(y + h * 0.3), width: pc(Math.min(0.6, taille)), animationDelay: `${-i * 1.7}s` });
    });
    if (o.tele) {
      const [x, y, w, h] = o.tele;
      const d = poser(derriere, div("sc-lueur-tele"));
      Object.assign(d.style, { left: pc(x + w / 2), top: pc(y + h * 0.6), width: pc(w * 1.9), height: pc(h * 2.8) });
    }
    poser(devant, div("sc-vignette"));
  }

  // ─── la fenêtre : son ciel (une teinte), et une toile pour la pluie, la neige, les étoiles ───
  const f = o.fenetre && o.fenetre.length >= 3 ? carreaux(o.fenetre) : null;
  let ciel: HTMLElement | null = null;
  let toile: HTMLCanvasElement | null = null;
  if (f) {
    ciel = poser(derriere, div("sc-ciel"));
    toile = poser(derriere, document.createElement("canvas")) as HTMLCanvasElement;
    toile.className = "sc-meteo";
    toile.dataset.meteo = "";
    for (const el of [ciel, toile]) Object.assign(el.style, { left: pc(f.x0), top: pc(f.y0), width: pc(f.w), height: pc(f.h), clipPath: f.clip, webkitClipPath: f.clip });
    if (nuit) ciel.dataset.ciel = "nuit";
  }
  const g = toile?.getContext("2d") ?? null;
  const leger = s.leger;
  const GOUTTES = Array.from({ length: leger ? 65 : 130 }, () => ({ x: Math.random(), y: Math.random(), l: hasard(0.04, 0.09), v: hasard(0.9, 1.5) }));
  const PERLES = Array.from({ length: leger ? 12 : 24 }, () => ({ x: Math.random(), y: Math.random(), r: hasard(1.2, 3.2), v: 0, pause: Math.random() * 3 }));
  const FLOCONS = Array.from({ length: leger ? 40 : 80 }, () => ({ x: Math.random(), y: Math.random(), r: hasard(0.8, 2.4), v: hasard(0.06, 0.14), ph: Math.random() * 6 }));
  const ETOILES = Array.from({ length: 60 }, () => ({ x: Math.random(), y: Math.random() * 0.6, r: hasard(0.5, 1.6), ph: Math.random() * 6, v: hasard(1.2, 3.5) }));
  const VILLE = Array.from({ length: 16 }, () => ({ x: hasard(0.1, 0.95), y: hasard(0.74, 0.94), w: hasard(1.1, 2.2), ph: Math.random() * 6 }));
  let quoi: CleMeteo | null = null;
  let mw = 0;
  let mh = 0;
  let dpr = 1;
  let prochainEclair = hasard(3, 6);

  // ─── le soleil : des rayons qui entrent par la fenêtre, une flaque au sol, la poussière qui danse ───
  let soleil: HTMLElement[] = [];
  let poussiere: HTMLCanvasElement | null = null;
  const POUSSIERE = Array.from({ length: leger ? 14 : 28 }, () => ({ x: Math.random(), y: Math.random(), v: hasard(0.006, 0.02), ph: Math.random() * 6, r: hasard(0.6, 1.6) }));
  let zoneRais: { x: number; y: number; w: number; h: number } | null = null;
  const allumerSoleil = () => {
    if (!f || nuit || soleil.length) return;
    // (de la fenêtre vers le milieu du sol de la pièce)
    const cx = f.x0 + f.w / 2;
    const cy = f.y0 + f.h * 0.55;
    const versX = 0.5;
    const versY = 0.86;
    const dx = (versX - cx) * o.largeur;
    const dy = (versY - cy) * o.hauteur;
    const angle = Math.atan2(-dx, dy);
    const long = Math.hypot(dx, dy) / o.hauteur;
    const soir = o.moment === "soir";
    const rais = [
      { a: soir ? 0.32 : 0.22, w: f.w * 0.55, dx: -0.12, d: 6, dl: 0 },
      { a: soir ? 0.24 : 0.16, w: f.w * 0.35, dx: 0.18, d: 8, dl: -2 },
      { a: soir ? 0.2 : 0.14, w: f.w * 0.25, dx: 0.42, d: 7, dl: -4 },
    ].map((r) => {
      const d = poser(derriere, div("sc-rai"));
      Object.assign(d.style, { left: pc(cx + r.dx * f.w), top: pc(cy), width: pc(r.w), height: pc(long * 1.15), transform: `translateX(-50%) rotate(${angle}rad)` });
      d.style.setProperty("--a", String(r.a));
      d.style.setProperty("--d", `${r.d}s`);
      d.style.setProperty("--dl", `${r.dl}s`);
      return d;
    });
    const flaque = poser(derriere, div("sc-flaque"));
    Object.assign(flaque.style, { left: pc(versX), top: pc(versY), width: pc(0.5), height: pc(0.16) });
    poussiere = poser(derriere, document.createElement("canvas")) as HTMLCanvasElement;
    poussiere.className = "sc-poussiere";
    zoneRais = { x: Math.min(cx, versX) - 0.08, y: cy, w: Math.abs(versX - cx) + 0.16, h: versY - cy };
    soleil = [...rais, flaque, poussiere];
  };
  const eteindreSoleil = () => {
    for (const el of soleil) el.remove();
    soleil = [];
    poussiere = null;
    zoneRais = null;
  };

  // ─── l'éclair de l'orage (toute la pièce), son grondement, les figurines sursautent ───
  const eclair = poser(devant, div("sc-eclair"));
  const unEclair = () => {
    if (s.reduit) return;
    eclair.animate([{ opacity: 0 }, { opacity: 0.55, offset: 0.1 }, { opacity: 0.05, offset: 0.25 }, { opacity: 0.4, offset: 0.35 }, { opacity: 0 }], { duration: 520 });
    setTimeout(() => {
      s.sons.bruit(1300, 0.1, 95, 0.7);
      for (const q of ["moi", "autre"] as const) if (!s.figurine(q).dort) s.figurine(q).secouer(0.35);
    }, 260);
  };

  /** Dehors, la nuit : la lune, les étoiles qui scintillent, les fenêtres allumées de la ville. */
  const cielDeNuit = (t: number) => {
    if (!g) return;
    const clair = quoi === "pluie" || quoi === "orage" ? 0.45 : quoi === "neige" || quoi === "brouillard" ? 0.6 : 1;
    const u = mw / 110;
    const lx = mw * 0.66;
    const ly = mh * 0.17;
    const lr = Math.max(3, mw * 0.075);
    const halo = g.createRadialGradient(lx, ly, lr * 0.6, lx, ly, lr * 5);
    halo.addColorStop(0, `rgba(255,246,210,${0.35 * clair + 0.08})`);
    halo.addColorStop(1, "rgba(255,246,210,0)");
    g.fillStyle = halo;
    g.beginPath();
    g.arc(lx, ly, lr * 5, 0, 7);
    g.fill();
    g.fillStyle = `rgba(255,250,228,${0.5 + 0.5 * clair})`;
    g.beginPath();
    g.arc(lx, ly, lr, 0, 7);
    g.fill();
    for (const e of ETOILES) {
      const a = (0.4 + 0.6 * Math.sin(t * e.v + e.ph)) * clair;
      if (a <= 0.06) continue;
      g.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
      g.beginPath();
      g.arc(e.x * mw, e.y * mh, e.r * u, 0, 7);
      g.fill();
    }
    for (const v of VILLE) {
      g.fillStyle = `rgba(255,205,120,${(0.6 + 0.25 * Math.sin(t * 0.5 + v.ph)).toFixed(3)})`;
      g.fillRect(v.x * mw, v.y * mh, v.w * u, v.w * 1.3 * u);
    }
  };

  const dessiner = (dt: number, t: number) => {
    // (la poussière dans les rayons du soleil)
    if (poussiere && zoneRais) {
      const pg = poussiere.getContext("2d");
      const W = poussiere.clientWidth;
      const H = poussiere.clientHeight;
      if (pg && W && H) {
        const d = Math.min(2, devicePixelRatio || 1);
        if (poussiere.width !== Math.round(W * d)) poussiere.width = Math.round(W * d);
        if (poussiere.height !== Math.round(H * d)) poussiere.height = Math.round(H * d);
        pg.setTransform(d, 0, 0, d, 0, 0);
        pg.clearRect(0, 0, W, H);
        for (const p of POUSSIERE) {
          p.y -= p.v * dt;
          if (p.y < 0) p.y = 1;
          const x = (zoneRais.x + (p.x + Math.sin(t * 0.4 + p.ph) * 0.05) * zoneRais.w) * W;
          const y = (zoneRais.y + p.y * zoneRais.h) * H;
          pg.fillStyle = `rgba(255,236,200,${(0.35 + 0.35 * Math.sin(t * 1.3 + p.ph)).toFixed(3)})`;
          pg.beginPath();
          pg.arc(x, y, p.r * (W / 400), 0, 7);
          pg.fill();
        }
      }
    }
    if (!g || !toile) return;
    const W = toile.clientWidth;
    const H = toile.clientHeight;
    if (!W || !H) return;
    const d = Math.min(2, devicePixelRatio || 1);
    if (W !== mw || H !== mh || d !== dpr) {
      mw = W;
      mh = H;
      dpr = d;
      toile.width = Math.round(W * d);
      toile.height = Math.round(H * d);
    }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, mw, mh);
    if (nuit) cielDeNuit(t);
    if (quoi === "pluie" || quoi === "orage") {
      const n = Math.min(GOUTTES.length, quoi === "orage" ? 130 : 75);
      const vit = quoi === "orage" ? 1.7 : 1.1;
      g.strokeStyle = "rgba(225,235,255,.42)";
      g.lineWidth = Math.max(0.6, mw / 160);
      g.beginPath();
      for (let i = 0; i < n; i++) {
        const p = GOUTTES[i];
        p.y += p.v * vit * dt;
        if (p.y > 1.1) {
          p.y = -0.1;
          p.x = Math.random();
        }
        const x = p.x * mw;
        const y = p.y * mh;
        g.moveTo(x, y);
        g.lineTo(x - p.l * mh * 0.2, y + p.l * mh);
      }
      g.stroke();
      for (const p of PERLES) {
        p.pause -= dt;
        if (p.pause < 0) {
          p.v = hasard(0.02, 0.12);
          if (Math.random() < 0.02) p.pause = hasard(0.5, 2.5);
        }
        if (p.pause < 0) p.y += p.v * dt;
        if (p.y > 1.05) {
          p.y = -0.05;
          p.x = Math.random();
        }
        const x = p.x * mw;
        const y = p.y * mh;
        const r = p.r * (mw / 120);
        const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
        gr.addColorStop(0, "rgba(255,255,255,.8)");
        gr.addColorStop(0.5, "rgba(200,215,240,.25)");
        gr.addColorStop(1, "rgba(60,70,100,.3)");
        g.fillStyle = gr;
        g.beginPath();
        g.arc(x, y, r, 0, 7);
        g.fill();
      }
      if (quoi === "orage") {
        prochainEclair -= dt;
        if (prochainEclair < 0) {
          prochainEclair = hasard(5, 9);
          unEclair();
        }
      }
    } else if (quoi === "neige") {
      g.fillStyle = "rgba(255,255,255,.92)";
      for (const fl of FLOCONS) {
        fl.y += fl.v * dt;
        if (fl.y > 1.05) {
          fl.y = -0.05;
          fl.x = Math.random();
        }
        g.beginPath();
        g.arc((fl.x + Math.sin(t * 0.8 + fl.ph) * 0.02) * mw, fl.y * mh, fl.r * (mw / 140), 0, 7);
        g.fill();
      }
      const bas = g.createLinearGradient(0, mh * 0.8, 0, mh);
      bas.addColorStop(0, "rgba(255,255,255,0)");
      bas.addColorStop(1, "rgba(255,255,255,.8)");
      g.fillStyle = bas;
      g.fillRect(0, mh * 0.8, mw, mh * 0.2);
    }
  };

  // (mouvement réduit : une image fixe, redessinée quand la météo change)
  let t0 = 0;
  const desabonner = s.reduit ? () => undefined : s.surImage((dt, t) => dessiner(Math.min(0.1, dt), t));
  const fixe = () => {
    if (s.reduit) requestAnimationFrame(() => dessiner(0, (t0 += 1)));
  };
  fixe();

  return {
    meteo(m) {
      quoi = m;
      if (toile) toile.dataset.meteo = m ?? "";
      if (ciel) ciel.dataset.ciel = nuit ? "nuit" : m === "pluie" || m === "orage" || m === "nuages" ? "gris" : m === "neige" ? "neige" : m === "brouillard" ? "brouillard" : "";
      if (m === "soleil" && !nuit) allumerSoleil();
      else eteindreSoleil();
      fixe();
    },
    detruire() {
      desabonner();
      eteindreSoleil();
      for (const el of els) el.remove();
    },
  };
}
