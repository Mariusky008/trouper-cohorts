"use client";

/**
 * 🏛️ PLACER LES LIEUX PUBLICS SUR LA VRAIE CARTE (`/admin/humain/lieux-publics`). Un nom (ou une suggestion), un emoji,
 * un toucher sur la carte : la position. Les commerces de la ville sont là en petits points gris, pour se repérer ; les
 * lieux déjà placés, avec leur emoji. MapLibre et les tuiles d'OpenFreeMap, comme la carte d'« Autour ».
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "maplibre-gl/dist/maplibre-gl.css";
import { STYLE_CARTE } from "@/app/collection/autour-carte";
import { EMOJIS_LIEUX_PUBLICS, NOM_LIEU_PUBLIC_MAX, type LieuPublic } from "@/lib/direct/autour";

type Point = { lat: number; lng: number };
const ROUTE = "/api/admin/direct/lieux-publics";
const poster = async (corps: unknown) => {
  const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) }).catch(() => null);
  return { ok: Boolean(r?.ok), ...((await r?.json().catch(() => ({}))) as { error?: string } | undefined) };
};
const pastille = (texte: string, fond: string) => {
  const e = document.createElement("div");
  e.textContent = texte;
  e.style.cssText = `font-size:20px;line-height:1;padding:4px 6px;border-radius:12px;background:${fond};box-shadow:0 2px 6px rgba(0,0,0,.35)`;
  return e;
};

export function PlacerLesLieux({ ville, lieux, commerces, centre, suggestions }: { ville: string; lieux: LieuPublic[]; commerces: (Point & { nom: string })[]; centre: Point & { zoom: number }; suggestions: { nom: string; emoji: string }[] }) {
  const router = useRouter();
  const boite = useRef<HTMLDivElement>(null);
  const carte = useRef<import("maplibre-gl").Map | null>(null);
  const marqueNouveau = useRef<import("maplibre-gl").Marker | null>(null);
  const [nom, setNom] = useState("");
  const [emoji, setEmoji] = useState<string>("📍");
  const [point, setPoint] = useState<Point | null>(null);
  const [erreur, setErreur] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [panne, setPanne] = useState(false);

  // LA CARTE : les commerces (repères), les lieux déjà placés ; un toucher pose le nouveau
  useEffect(() => {
    let fini = false;
    (async () => {
      try {
        const ml = await import("maplibre-gl");
        if (fini || !boite.current) return;
        ml.setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href);
        const c = new ml.Map({ container: boite.current, style: STYLE_CARTE, center: [centre.lng, centre.lat], zoom: centre.zoom });
        carte.current = c;
        c.addControl(new ml.NavigationControl({ showCompass: false }));
        for (const x of commerces) new ml.Marker({ element: pastille("•", "#ddd") }).setLngLat([x.lng, x.lat]).setPopup(new ml.Popup({ offset: 12 }).setText(x.nom)).addTo(c);
        for (const l of lieux) new ml.Marker({ element: pastille(l.emoji, "#fff") }).setLngLat([l.lng, l.lat]).setPopup(new ml.Popup({ offset: 14 }).setText(l.nom)).addTo(c);
        c.on("click", (e: { lngLat: { lat: number; lng: number } }) => setPoint({ lat: Math.round(e.lngLat.lat * 1e6) / 1e6, lng: Math.round(e.lngLat.lng * 1e6) / 1e6 }));
        c.on("error", () => !c.isStyleLoaded() && setPanne(true));
      } catch {
        setPanne(true);
      }
    })();
    return () => {
      fini = true;
      carte.current?.remove();
      carte.current = null;
    };
  }, [centre.lat, centre.lng, centre.zoom, commerces, lieux]);

  // LE NOUVEAU : son marqueur suit le dernier toucher (ou les deux nombres tapés)
  useEffect(() => {
    let fini = false;
    (async () => {
      const c = carte.current;
      if (!c) return;
      const ml = await import("maplibre-gl");
      if (fini) return;
      marqueNouveau.current?.remove();
      marqueNouveau.current = point ? new ml.Marker({ element: pastille(emoji, "#FF2E9A") }).setLngLat([point.lng, point.lat]).addTo(c) : null;
    })();
    return () => {
      fini = true;
    };
  }, [point, emoji]);

  async function placer() {
    setErreur("");
    if (!nom.trim()) return setErreur("Donne-lui un nom.");
    if (!point) return setErreur("Touche la carte, là où il est.");
    setOccupe(true);
    const r = await poster({ action: "placer", ville, nom, emoji, lat: point.lat, lng: point.lng });
    setOccupe(false);
    if (!r.ok) return setErreur(r.error || "Pas enregistré.");
    setNom("");
    setPoint(null);
    router.refresh();
  }
  async function retirer(l: LieuPublic) {
    if (!window.confirm(`Retirer « ${l.nom} » de la carte ? Les mèmes déposés là ne se montreront plus.`)) return;
    setOccupe(true);
    const r = await poster({ action: "retirer", ville, id: l.id });
    setOccupe(false);
    if (!r.ok) return setErreur(r.error || "Pas enregistré.");
    router.refresh();
  }

  const champ: React.CSSProperties = { padding: "8px 10px", borderRadius: 8, border: "1px solid #ccc", font: "inherit" };
  return (
    <div style={{ display: "grid", gap: 16, gridTemplateColumns: "minmax(0, 1fr)" }}>
      <div ref={boite} className="lp-carte" style={{ height: 460, borderRadius: 12, overflow: "hidden", background: "#e9e9ee" }} />
      {panne && <p style={{ margin: 0, color: "#a33" }}>La carte ne s’est pas chargée : tape la latitude et la longitude à la main.</p>}
      <section className="lp-formulaire" style={{ display: "grid", gap: 10, padding: 14, borderRadius: 12, border: "1px solid #ddd", background: "#fff" }}>
        <b>Un lieu public</b>
        {suggestions.length > 0 && (
          <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {suggestions.map((x) => (
              <button
                key={x.nom}
                type="button"
                className="lp-suggestion"
                style={{ padding: "6px 12px", borderRadius: 999, border: "1px solid #ccc", background: "#fafafa", cursor: "pointer" }}
                onClick={() => {
                  setNom(x.nom);
                  setEmoji(x.emoji);
                }}
              >
                {x.emoji} {x.nom}
              </button>
            ))}
          </span>
        )}
        <input className="lp-nom" style={champ} value={nom} maxLength={NOM_LIEU_PUBLIC_MAX} onChange={(e) => setNom(e.target.value)} placeholder="Son nom : « Les Arènes »" aria-label="Son nom" />
        <span style={{ display: "flex", gap: 4, flexWrap: "wrap" }} role="radiogroup" aria-label="Son emoji">
          {EMOJIS_LIEUX_PUBLICS.map((e) => (
            <button key={e} type="button" role="radio" aria-checked={emoji === e} onClick={() => setEmoji(e)} style={{ fontSize: 20, padding: "2px 6px", borderRadius: 8, border: emoji === e ? "2px solid #FF2E9A" : "1px solid #ddd", background: "#fff" }}>
              {e}
            </button>
          ))}
        </span>
        <span style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input className="lp-lat" style={{ ...champ, width: 140 }} inputMode="decimal" value={point?.lat ?? ""} onChange={(e) => setPoint((p) => ({ lat: Number(e.target.value), lng: p?.lng ?? NaN }))} placeholder="Latitude" aria-label="Latitude" />
          <input className="lp-lng" style={{ ...champ, width: 140 }} inputMode="decimal" value={point?.lng ?? ""} onChange={(e) => setPoint((p) => ({ lat: p?.lat ?? NaN, lng: Number(e.target.value) }))} placeholder="Longitude" aria-label="Longitude" />
          <small style={{ color: "#666" }}>{point ? "Position touchée sur la carte." : "Touche la carte, là où il est."}</small>
        </span>
        <button type="button" className="lp-placer" disabled={occupe} onClick={() => void placer()} style={{ justifySelf: "start", padding: "10px 16px", borderRadius: 999, border: 0, background: "#FF2E9A", color: "#fff", fontWeight: 700 }}>
          📍 Placer ce lieu
        </button>
        {erreur && (
          <p role="alert" style={{ margin: 0, color: "#a33" }}>
            {erreur}
          </p>
        )}
      </section>
      <section style={{ display: "grid", gap: 8 }}>
        <b>Sur la carte de {ville} ({lieux.length})</b>
        {lieux.length === 0 && <p style={{ margin: 0, color: "#555" }}>Aucun pour l’instant.</p>}
        {lieux.map((l) => (
          <div key={l.id} className="lp-lieu" data-lieu={l.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 12px", borderRadius: 10, border: "1px solid #ddd", background: "#fff" }}>
            <span style={{ fontSize: 20 }}>{l.emoji}</span>
            <b style={{ flex: 1 }}>{l.nom}</b>
            <small style={{ color: "#666" }}>
              {l.lat.toFixed(5)}, {l.lng.toFixed(5)}
            </small>
            <button type="button" className="lp-retirer" disabled={occupe} onClick={() => void retirer(l)} style={{ padding: "6px 12px", borderRadius: 999, border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}>
              Retirer
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
