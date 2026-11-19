"use client";

import { useCallback, useEffect, useState } from "react";
import { THEMES_DECOUVRIR, type IdTheme, type SelectionDuJour } from "@/lib/direct/decouvrir";
import { surYouTube, vignetteYouTube } from "@/lib/direct/tele";

const ROUTE = "/api/admin/direct/decouvrir";
type Etat = { branche: boolean; jour: string; themes: { theme: IdTheme; adultes: SelectionDuJour | null; jeunes: SelectionDuJour | null }[] };
const minutes = (s: number) => `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, "0")}`;

export function SelectionDecouvrir() {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [erreur, setErreur] = useState("");
  const [note, setNote] = useState("");
  const [occupe, setOccupe] = useState("");
  const [vue, setVue] = useState<Record<string, "adultes" | "jeunes">>({});
  const [liens, setLiens] = useState<Record<string, string>>({});

  const charger = useCallback(async () => {
    const r = await fetch(ROUTE, { cache: "no-store" }).catch(() => null);
    const j = (await r?.json().catch(() => ({}))) as Etat & { error?: string };
    if (!r?.ok) return setErreur(j?.error || "La page ne répond pas.");
    setEtat(j);
  }, []);
  useEffect(() => {
    void Promise.resolve().then(charger);
  }, [charger]);

  const agir = async (corps: Record<string, unknown>, quoi: string, fait: string) => {
    setOccupe(quoi);
    setErreur("");
    setNote("");
    const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) }).catch(() => null);
    const j = (await r?.json().catch(() => ({}))) as { error?: string };
    setOccupe("");
    if (!r?.ok) return setErreur(j?.error || "Ça n’a pas marché.");
    setNote(fait);
    await charger();
  };

  if (!etat) return <p style={{ marginTop: 18 }}>{erreur || "Chargement…"}</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
      {!etat.branche && (
        <p data-pas-branche style={{ margin: 0, padding: 12, borderRadius: 12, background: "#fff4e5", border: "1px solid #f3c27a", lineHeight: 1.5 }}>
          ⚠️ La clé YouTube n’est pas encore branchée. Il faut la créer dans Google Cloud (l’API « YouTube Data API v3 » activée, la clé restreinte à
          elle), puis la ranger dans Vercel sous le nom <code>YOUTUBE_API_KEY</code>. Ensuite, la sélection se fait chaque nuit, ou tout de suite avec
          « Refaire tous les thèmes ».
        </p>
      )}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <b>Aujourd’hui : {etat.jour}</b>
        <button type="button" data-refaire-tout disabled={!!occupe || !etat.branche} onClick={() => agir({ action: "refaire" }, "tout", "La sélection du jour est refaite.")}>
          {occupe === "tout" ? "Ça cherche… (une minute)" : "↻ Refaire tous les thèmes"}
        </button>
        <small style={{ color: "#666" }}>(environ 6 900 des 10 000 unités YouTube du jour)</small>
      </div>
      {(erreur || note) && (
        <p data-note style={{ margin: 0, padding: 10, borderRadius: 10, background: erreur ? "#fde8e8" : "#e8f7ee", color: erreur ? "#a11" : "#14532d" }}>
          {erreur || note}
        </p>
      )}
      {etat.themes.map(({ theme, adultes, jeunes }) => {
        const t = THEMES_DECOUVRIR.find((x) => x.id === theme)!;
        const cote = vue[theme] ?? "adultes";
        const sel = cote === "jeunes" ? jeunes : adultes;
        return (
          <section key={theme} data-theme={theme} style={{ border: "1px solid #e4e4e7", borderRadius: 14, padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>
                {t.e} {t.nom}
              </h2>
              <span style={{ color: "#666" }}>
                {adultes?.videos.length ?? 0} vidéos{t.adultes ? " · adultes seulement" : ` · ${jeunes?.videos.length ?? 0} pour les 15-17 ans`}
              </span>
              <span style={{ flex: 1 }} />
              {!t.adultes && (
                <span style={{ display: "flex", gap: 4 }}>
                  {(["adultes", "jeunes"] as const).map((c) => (
                    <button key={c} type="button" data-cote={c} aria-pressed={cote === c} onClick={() => setVue((v) => ({ ...v, [theme]: c }))} style={{ fontWeight: cote === c ? 700 : 400 }}>
                      {c === "adultes" ? "Adultes" : "15-17 ans"}
                    </button>
                  ))}
                </span>
              )}
              <button type="button" data-refaire disabled={!!occupe || !etat.branche} onClick={() => agir({ action: "refaire", theme }, theme, `${t.nom} : refait.`)}>
                {occupe === theme ? "Ça cherche…" : "↻ Refaire"}
              </button>
            </div>
            {sel?.erreur && <p style={{ margin: "8px 0 0", color: "#a11" }}>⚠️ La dernière recherche a échoué : {sel.erreur}</p>}
            {!sel?.videos.length ? (
              <p style={{ margin: "8px 0 0", color: "#666" }}>Pas encore de sélection aujourd’hui.</p>
            ) : (
              <ol style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "grid", gap: 8 }}>
                {sel.videos.map((v) => (
                  <li key={v.id} data-video={v.id} style={{ display: "grid", gridTemplateColumns: "120px minmax(0,1fr) auto", gap: 10, alignItems: "center" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={vignetteYouTube(v.id)} alt="" referrerPolicy="no-referrer" style={{ width: 120, aspectRatio: "16/9", objectFit: "cover", borderRadius: 8, background: "#eee" }} />
                    <span style={{ minWidth: 0 }}>
                      <a href={surYouTube(v.id)} target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>
                        {v.titre}
                      </a>
                      <br />
                      <small style={{ color: "#666" }}>
                        {v.chaine} · {minutes(v.duree)}
                        {v.ajoutee ? " · ajoutée à la main" : ""}
                      </small>
                    </span>
                    <button type="button" data-retirer disabled={!!occupe} onClick={() => agir({ action: "retirer", theme, id: v.id }, v.id, "Retirée de toutes les télés.")}>
                      Retirer
                    </button>
                  </li>
                ))}
              </ol>
            )}
            <form
              style={{ display: "flex", gap: 8, marginTop: 10 }}
              onSubmit={(e) => {
                e.preventDefault();
                void agir({ action: "ajouter", theme, lien: liens[theme] ?? "" }, `+${theme}`, "Ajoutée en tête du thème.").then(() => setLiens((l) => ({ ...l, [theme]: "" })));
              }}
            >
              <input data-lien placeholder="Ajouter une vidéo : son lien YouTube" value={liens[theme] ?? ""} onChange={(e) => setLiens((l) => ({ ...l, [theme]: e.target.value }))} style={{ flex: 1, minWidth: 0, padding: 8 }} />
              <button type="submit" data-ajouter disabled={!!occupe || !(liens[theme] ?? "").trim()}>
                Ajouter
              </button>
            </form>
          </section>
        );
      })}
    </div>
  );
}
