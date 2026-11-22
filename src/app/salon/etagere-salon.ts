/**
 * 📚 L'ÉTAGÈRE DANS LA PIÈCE DU DUO (`docs/univers/salon-du-duo.md`, sections 4.9 et 4.10 ; le lot S6) — leurs souvenirs
 * posés sur l'étagère peinte : leur emoji, dans les fentes relevées (`emplacements.fentes`), sinon sur deux rangées de
 * la zone de l'étagère (`emplacements.etagere`). Un toucher ouvre « Votre étagère ». Ce qu'on vient de garder s'y
 * envole depuis la figurine de celui qui l'a dit (« 📌 Noté ! »).
 *
 * MODULE DU NAVIGATEUR (il touche au DOM) : à n'importer que dans un composant client.
 */
import type { EmplacementsDuo } from "@/lib/direct/pieces-duo";
import type { Point, Qui, Scene } from "@/lib/direct/salon";
import type { ObjetVu } from "@/lib/direct/etagere";
import { bez, ease } from "./moteur";

/** Les places des souvenirs : les fentes relevées, sinon deux rangées de quatre sur la zone de l'étagère ; sinon rien. */
export function placesEtagere(e: EmplacementsDuo | null | undefined): Point[] {
  if (e?.fentes?.length) return e.fentes.map((f) => ({ x: f.x, y: f.y }));
  const z = e?.etagere;
  if (!z) return [];
  const [x, y, w, h] = z;
  const rangee = (fy: number) => [0, 1, 2, 3].map((i) => ({ x: x + w * (0.16 + (0.68 * i) / 3), y: y + h * fy }));
  return [...rangee(0.46), ...rangee(0.94)];
}

const STYLE = `
.sc-souvenirs{position:absolute;inset:0;pointer-events:none}
.sc .sc-souvenir{position:absolute;transform:translate(-50%,-100%);margin:0;padding:0;border:0;background:none;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif;font-size:calc(var(--sw)*.04);line-height:1;cursor:pointer;pointer-events:auto;filter:drop-shadow(0 2px 1.5px rgba(40,15,5,.6));-webkit-tap-highlight-color:transparent}
.sc-souvenir.pose{animation:sc-pose .6s cubic-bezier(.2,1.6,.4,1)}
@keyframes sc-pose{0%{transform:translate(-50%,-100%) scale(.3)}100%{transform:translate(-50%,-100%) scale(1)}}
.sc[data-reduit] .sc-souvenir.pose{animation:none}
`;
function installerStyle() {
  if (document.getElementById("sc-etagere-style")) return;
  const s = document.createElement("style");
  s.id = "sc-etagere-style";
  s.textContent = STYLE;
  document.head.append(s);
}

export type EtagereDuSalon = {
  /** Les souvenirs visibles (les plus récents, autant que de places). */
  montrer(objets: readonly ObjetVu[]): void;
  /** « 📌 Noté ! » : l'emoji s'envole de la figurine de `de` jusqu'à sa place, puis s'y pose. */
  envol(o: ObjetVu, de: Qui): Promise<void>;
  /** Où il se poserait (la place du prochain), ou rien s'il n'y a pas d'étagère dans la pièce. */
  readonly aDesPlaces: boolean;
  detruire(): void;
};

export function installerEtagere(scene: Scene, places: Point[], surToucher: (o: ObjetVu) => void): EtagereDuSalon {
  installerStyle();
  const couche = document.createElement("div");
  couche.className = "sc-souvenirs";
  scene.couche("derriere").append(couche);
  let montres: ObjetVu[] = [];
  const dessiner = (pose?: string) => {
    // (une pièce sans étagère relevée : rien à poser — `slice(-0)` les rendrait tous)
    if (!places.length) return couche.replaceChildren();
    couche.replaceChildren(
      ...montres.slice(-places.length).map((o, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = `sc-souvenir${o.id === pose ? " pose" : ""}`;
        b.dataset.souvenir = o.id;
        b.textContent = o.emoji;
        b.setAttribute("aria-label", `${o.titre} — votre étagère`);
        b.style.left = `${places[i].x * 100}%`;
        b.style.top = `${places[i].y * 100}%`;
        b.addEventListener("click", (ev) => {
          ev.stopPropagation();
          surToucher(o);
        });
        return b;
      }),
    );
  };
  return {
    montrer(objets) {
      montres = [...objets];
      dessiner();
    },
    async envol(o, de) {
      const deja = montres.some((x) => x.id === o.id);
      if (!places.length) {
        if (!deja) montres = [...montres, o];
        return;
      }
      const i = Math.min(places.length - 1, deja ? montres.findIndex((x) => x.id === o.id) : montres.length);
      const fin = scene.fx.px(places[i]);
      const p0 = scene.fx.px(scene.repere(de, "haut"));
      const p1 = { x: (p0.x + fin.x) / 2, y: Math.min(p0.y, fin.y) - scene.fx.px({ x: 0, y: 0.12 }).y };
      const U = scene.fx.u;
      if (!scene.reduit)
        await scene.fx.acteur({
          e: o.emoji,
          duree: 1.1,
          pos: (u) => bez(p0, p1, fin, ease.io(u)),
          taille: (u) => U() * (5 - 1.4 * u),
          rot: (u) => Math.sin(u * Math.PI * 2) * 0.3,
          trainee: (q) => {
            if (Math.random() < 0.5) scene.fx.part({ k: "etoile", x: q.x, y: q.y, s: U() * 1.6, c: "#fff3b0", vie: 0.5 });
          },
        });
      if (!deja) montres = [...montres, o];
      dessiner(o.id);
      scene.fx.etincelles(places[i], 6, { t: 0.7 });
    },
    get aDesPlaces() {
      return places.length > 0;
    },
    detruire() {
      couche.remove();
    },
  };
}
