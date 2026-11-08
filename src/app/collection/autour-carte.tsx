"use client";

/**
 * 🗺️ LA CARTE D'« AUTOUR DE MOI » (le lot B ; le plan : `docs/reprise.md`, section 4).
 *
 * MapLibre, et les tuiles d'OpenFreeMap (gratuites, sans clé, sans compte : décidé par le propriétaire le 7 novembre
 * 2026), dont le style clair est REPEINT aux couleurs de ClikMe une fois chargé : la nuit, l'eau sombre, les rues en
 * prune. Les lieux sont des marqueurs HTML : un commerce = le visage d'une figurine dans une goutte, avec le nombre de
 * mèmes ; une zone « Ailleurs » = un cercle en pointillés, « quelque part par ici », jamais une épingle.
 *
 * 🔎 UN ENDROIT CHERCHÉ (8 novembre 2026 : « j'ai tapé “la gare”, la carte n'a pas bougé ») : `cible` — la carte y vole,
 * une épingle et son nom. `ApercuOu` : la petite carte du dépôt, « ton mème apparaîtra ici ».
 *
 * SI LA CARTE NE SE CHARGE PAS (pas de WebGL, pas de réseau, tuiles refusées), `onPanne` : l'écran montre la liste des
 * lieux à la place. MapLibre n'est chargé qu'à l'ouverture de l'onglet (`import()`), pas avec le reste de l'appli.
 */
import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Lieu } from "@/lib/direct/autour";

export const STYLE_CARTE = "https://tiles.openfreemap.org/styles/liberty";

type Props = {
  lieux: Lieu[];
  /** Sa position, pour « Ma position » (gardée sur le téléphone, jamais envoyée telle quelle). */
  moi: { lat: number; lng: number } | null;
  /** Un nombre qui change : recentrer sur `moi`. */
  recentrer: number;
  /** 🔎 Un endroit cherché (la gare, une rue) : la carte y vole, une épingle à son nom. `n` change : on y retourne. */
  cible?: { lat: number; lng: number; nom: string; n: number } | null;
  onLieu: (id: string) => void;
  onPanne: () => void;
};

/** Repeindre le style clair d'OpenFreeMap aux couleurs de ClikMe (la nuit, l'eau sombre, les rues en prune). */
function repeindre(carte: { getStyle: () => { layers?: { id: string; type: string }[] }; setPaintProperty: (l: string, p: string, v: unknown) => void }) {
  for (const l of carte.getStyle().layers ?? []) {
    const id = l.id.toLowerCase();
    const peindre = (p: string, v: unknown) => {
      try {
        carte.setPaintProperty(l.id, p, v);
      } catch {
        /* une couche sans cette propriété : on passe */
      }
    };
    if (l.type === "background") peindre("background-color", "#0E0A10");
    else if (l.type === "fill") peindre("fill-color", /water/.test(id) ? "#10212B" : /park|wood|grass|landcover|forest|garden/.test(id) ? "#13221A" : /building/.test(id) ? "#1F1822" : "#16111A");
    else if (l.type === "fill-extrusion") peindre("fill-extrusion-color", "#1F1822");
    else if (l.type === "line") peindre("line-color", /water|river/.test(id) ? "#15303D" : /motorway|trunk|primary/.test(id) ? "#3A2C41" : /boundary|admin/.test(id) ? "#2A2030" : "#2A2030");
    else if (l.type === "symbol") {
      peindre("text-color", "#9C8795");
      peindre("text-halo-color", "#0E0A10");
      peindre("icon-opacity", 0.35);
    }
  }
}

/** Un marqueur : la goutte d'un commerce (son visage, son nombre), ou la zone floue d'« Ailleurs ». */
function marqueur(l: Lieu, onLieu: (id: string) => void): HTMLElement {
  const b = document.createElement("button");
  b.type = "button";
  b.className = l.type === "zone" ? "auc-zone" : `auc-goutte${l.n ? "" : " vide"}`;
  b.setAttribute("aria-label", `${l.nom}, ${l.n} mème${l.n > 1 ? "s" : ""}`);
  b.dataset.lieu = l.id;
  if (l.type === "zone") {
    b.innerHTML = `<b>✨ ${l.n}</b><small></small>`;
    (b.querySelector("small") as HTMLElement).textContent = l.nom;
  } else {
    const visage = l.visages[0];
    b.innerHTML = `<span class="auc-forme"></span>${visage ? `<img alt="" src="">` : `<span class="auc-emoji"></span>`}${l.n ? `<i>${l.n}</i>` : ""}`;
    if (visage) (b.querySelector("img") as HTMLImageElement).src = visage;
    else (b.querySelector(".auc-emoji") as HTMLElement).textContent = l.emoji;
  }
  b.addEventListener("click", (e) => {
    e.stopPropagation();
    onLieu(l.id);
  });
  return b;
}

export function CarteAutour({ lieux, moi, recentrer, cible = null, onLieu, onPanne }: Props) {
  const boite = useRef<HTMLDivElement>(null);
  const carte = useRef<import("maplibre-gl").Map | null>(null);
  const marques = useRef<import("maplibre-gl").Marker[]>([]);
  const marqueMoi = useRef<import("maplibre-gl").Marker | null>(null);
  const marqueCible = useRef<import("maplibre-gl").Marker | null>(null);
  const rappels = useRef({ onLieu, onPanne });
  // (la carte arrive après coup, MapLibre chargé à la demande : les lieux et « Toi » attendent qu'elle soit là)
  const [prete, setPrete] = useState(false);
  useEffect(() => {
    rappels.current = { onLieu, onPanne };
  }, [onLieu, onPanne]);

  // LA CARTE, une fois
  useEffect(() => {
    let fini = false;
    let panne = false;
    const tomber = () => {
      if (panne || fini) return;
      panne = true;
      rappels.current.onPanne();
    };
    (async () => {
      try {
        const ml = await import("maplibre-gl");
        if (fini || !boite.current) return;
        // (son « worker » : MapLibre le cherche à côté de lui, ce que le paquetage de l'appli ne sait pas faire ; on lui
        // donne l'adresse du fichier, servi tel quel avec l'appli)
        ml.setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href);
        const c = new ml.Map({ container: boite.current, style: STYLE_CARTE, center: [-1.0538, 43.7102], zoom: 14, attributionControl: { compact: true } });
        carte.current = c;
        setPrete(true);
        const delai = window.setTimeout(() => !c.isStyleLoaded() && tomber(), 12_000);
        c.on("load", () => {
          window.clearTimeout(delai);
          repeindre(c as unknown as Parameters<typeof repeindre>[0]);
        });
        c.on("error", (e: { error?: { status?: number; message?: string } }) => {
          // (une tuile qui manque n'est pas une panne ; le style qui ne vient pas, si)
          if (!c.isStyleLoaded() && /style|Failed to fetch|NetworkError/i.test(String(e?.error?.message ?? ""))) tomber();
        });
      } catch {
        tomber();
      }
    })();
    return () => {
      fini = true;
      carte.current?.remove();
      carte.current = null;
    };
  }, []);

  // LES LIEUX : refaits quand la liste change ; la vue englobe ceux qui ont des mèmes
  useEffect(() => {
    let fini = false;
    (async () => {
      const c = carte.current;
      if (!c) return;
      const ml = await import("maplibre-gl");
      if (fini) return;
      for (const m of marques.current) m.remove();
      marques.current = lieux.map((l) => new ml.Marker({ element: marqueur(l, (id) => rappels.current.onLieu(id)), anchor: l.type === "zone" ? "center" : "bottom" }).setLngLat([l.lng, l.lat]).addTo(c));
      const vus = lieux.filter((l) => l.n > 0);
      if (vus.length > 1) {
        const b = new ml.LngLatBounds();
        for (const l of vus) b.extend([l.lng, l.lat]);
        // (la place libre : sous le titre et la recherche, au-dessus de « Déposer mon mème » et des derniers mèmes)
        const h = c.getContainer().clientHeight;
        c.fitBounds(b, { padding: { top: Math.min(230, h * 0.3), bottom: Math.min(420, h * 0.48), left: 60, right: 60 }, maxZoom: 15, duration: 0 });
      } else if (vus.length === 1) c.jumpTo({ center: [vus[0].lng, vus[0].lat], zoom: 15 });
      else if (lieux[0]) c.jumpTo({ center: [lieux[0].lng, lieux[0].lat], zoom: 14 });
    })();
    return () => {
      fini = true;
    };
  }, [lieux, prete]);

  // « MA POSITION » : un point, vu de lui seul
  useEffect(() => {
    let fini = false;
    (async () => {
      const c = carte.current;
      if (!c || !moi) return;
      const ml = await import("maplibre-gl");
      if (fini) return;
      if (!marqueMoi.current) {
        const p = document.createElement("span");
        p.className = "auc-moi";
        p.setAttribute("aria-label", "Toi");
        marqueMoi.current = new ml.Marker({ element: p }).setLngLat([moi.lng, moi.lat]).addTo(c);
      } else marqueMoi.current.setLngLat([moi.lng, moi.lat]);
      c.flyTo({ center: [moi.lng, moi.lat], zoom: 15 });
    })();
    return () => {
      fini = true;
    };
  }, [moi, recentrer, prete]);

  // 🔎 L'ENDROIT CHERCHÉ : la carte y vole, une épingle à son nom
  useEffect(() => {
    let fini = false;
    (async () => {
      const c = carte.current;
      if (!c) return;
      marqueCible.current?.remove();
      marqueCible.current = null;
      if (!cible) return;
      const ml = await import("maplibre-gl");
      if (fini) return;
      const e = document.createElement("span");
      e.className = "auc-cible";
      // (l'animation, sur l'intérieur : MapLibre place l'épingle par son `transform`)
      e.innerHTML = '<span class="auc-cible-in"><b></b><i></i></span>';
      (e.querySelector("b") as HTMLElement).textContent = cible.nom;
      marqueCible.current = new ml.Marker({ element: e, anchor: "bottom" }).setLngLat([cible.lng, cible.lat]).addTo(c);
      // (au milieu de ce qu'on voit de la carte : entre la recherche, en haut, et la feuille des mèmes, en bas)
      const h = c.getContainer().clientHeight || 700;
      c.flyTo({ center: [cible.lng, cible.lat], zoom: 16, offset: [0, (Math.min(230, h * 0.3) - Math.min(420, h * 0.48)) / 2] });
    })();
    return () => {
      fini = true;
    };
  }, [cible, prete]);

  return <div ref={boite} className="auc-carte" aria-label="La carte des mèmes" />;
}

/**
 * 📍 « TON MÈME APPARAÎTRA ICI » — la petite carte du dépôt (8 novembre 2026 : « ça n'indique aucun lieu, je pense ») :
 * le lieu choisi (une épingle), ou la zone « quelque part par ici » (un cercle) pour « Ailleurs » et un endroit cherché.
 * Elle ne bouge pas sous le doigt. Sans carte (pas de WebGL, pas de réseau) : rien — le texte dit déjà où.
 */
export function ApercuOu({ point, zone }: { point: { lat: number; lng: number }; zone: boolean }) {
  const boite = useRef<HTMLDivElement>(null);
  const carte = useRef<import("maplibre-gl").Map | null>(null);
  const marque = useRef<import("maplibre-gl").Marker | null>(null);
  const [prete, setPrete] = useState(false);
  const [panne, setPanne] = useState(false);
  const depart = useRef(point);
  useEffect(() => {
    let fini = false;
    (async () => {
      try {
        const ml = await import("maplibre-gl");
        if (fini || !boite.current) return;
        ml.setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href);
        const p = depart.current;
        const c = new ml.Map({ container: boite.current, style: STYLE_CARTE, center: [p.lng, p.lat], zoom: 15, interactive: false, attributionControl: false });
        carte.current = c;
        c.on("load", () => repeindre(c as unknown as Parameters<typeof repeindre>[0]));
        c.on("error", () => !c.isStyleLoaded() && setPanne(true));
        setPrete(true);
      } catch {
        setPanne(true);
      }
    })();
    return () => {
      fini = true;
      carte.current?.remove();
      carte.current = null;
    };
  }, []);
  useEffect(() => {
    let fini = false;
    (async () => {
      const c = carte.current;
      if (!c) return;
      const ml = await import("maplibre-gl");
      if (fini) return;
      marque.current?.remove();
      const e = document.createElement("span");
      e.className = zone ? "auc-apercu-zone" : "auc-apercu-pin";
      e.textContent = zone ? "" : "📍";
      marque.current = new ml.Marker({ element: e, anchor: zone ? "center" : "bottom" }).setLngLat([point.lng, point.lat]).addTo(c);
      c.jumpTo({ center: [point.lng, point.lat], zoom: zone ? 14.6 : 15.5 });
    })();
    return () => {
      fini = true;
    };
  }, [point.lat, point.lng, zone, prete]);
  if (panne) return null;
  return <div ref={boite} className="auc-apercu" aria-hidden="true" />;
}

export const STYLES_CARTE_AUTOUR = `
.auc-carte{position:absolute;inset:0;background:#0E0A10}
.auc-carte .maplibregl-ctrl-attrib{background:rgba(14,10,16,.7)!important;color:#9C8795}
.auc-carte .maplibregl-ctrl-attrib a{color:#CBB9C3}
.auc-goutte{position:relative;z-index:2;width:56px;height:56px;padding:0;border:0;background:none;cursor:pointer}
.auc-goutte .auc-forme{position:absolute;inset:0;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#FFFFFF;box-shadow:0 10px 20px -8px rgba(0,0,0,.9)}
.auc-goutte img,.auc-goutte .auc-emoji{position:absolute;left:4px;top:4px;width:48px;height:48px;border-radius:50%;object-fit:cover;object-position:50% 18%;background:#FF2E9A;display:grid;place-items:center;font-size:24px}
.auc-goutte i{position:absolute;right:-8px;top:-6px;min-width:22px;height:22px;padding:0 6px;box-sizing:border-box;border-radius:999px;background:#FF2E9A;color:#fff;font:800 12px/22px Poppins,system-ui,sans-serif;font-style:normal;text-align:center;box-shadow:0 0 0 2px #0E0A10}
.auc-goutte.vide{z-index:1;opacity:.55;transform:scale(.8)}
.auc-zone{display:flex;flex-direction:column;align-items:center;justify-content:center;width:96px;height:96px;border-radius:50%;border:1.5px dashed rgba(255,225,77,.6);background:rgba(255,225,77,.08);color:#FFE14D;cursor:pointer;font:inherit}
.auc-zone b{font:800 15px Poppins,system-ui,sans-serif}
.auc-zone small{max-width:80px;font-size:10.5px;line-height:1.15;color:#E9DCA0;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.auc-moi{display:block;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 0 0 5px rgba(255,255,255,.18),0 0 0 10px rgba(255,255,255,.07)}
.auc-cible{z-index:3;pointer-events:none}
.auc-cible-in{display:flex;flex-direction:column;align-items:center;animation:auc-tombe .45s cubic-bezier(.2,1.5,.4,1)}
.auc-cible b{max-width:180px;padding:6px 12px;border-radius:999px;background:#fff;color:#16101A;font:800 13px Poppins,system-ui,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 10px 24px -8px rgba(0,0,0,.9)}
.auc-cible i{width:0;height:0;border:8px solid transparent;border-top:12px solid #fff;margin-top:-1px}
.auc-apercu{position:relative;width:100%;height:150px;border-radius:18px;overflow:hidden;background:#16111A;box-shadow:inset 0 0 0 1px rgba(255,255,255,.1)}
.auc-apercu-pin{font-size:34px;line-height:1;filter:drop-shadow(0 6px 8px rgba(0,0,0,.7))}
.auc-apercu-zone{display:block;width:110px;height:110px;border-radius:50%;border:2px dashed rgba(255,225,77,.8);background:rgba(255,225,77,.14)}
@keyframes auc-tombe{from{transform:translateY(-24px);opacity:0}}
`;
