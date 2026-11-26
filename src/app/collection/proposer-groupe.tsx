"use client";

/**
 * 📣 « ＋ PROPOSER » (Mes groupes, le lot G2, 26 novembre 2026 ; la maquette G0 validée, planche « Proposer ») : on fabrique
 * sa carte, et on la voit pendant qu'on la fait — son nom, la passion, la vidéo pour commencer (sa télé du jour, un lien
 * YouTube, ou les nouveautés de la passion), quand, pour qui (tout le monde : les adultes ; ou mes proches), 4 ou 8
 * places, un mot. « Maintenant » et tout le monde : pas de proposition, on va tout de suite au salon de la passion.
 */
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { THEMES_DECOUVRIR, type IdTheme } from "@/lib/direct/decouvrir";
import { videoYouTube, vignetteYouTube } from "@/lib/direct/tele";
import { MOT_GROUPE_MAX, NOM_GROUPE_MAX, PHRASES_PROPOSITIONS as P, aParis, quandLisible, type PlacesGroupe, type PourQui, type PropositionGroupe } from "@/lib/direct/groupes";
import type { TeleDuJour } from "@/lib/direct/tele-du-jour";

type Video = { genre: "tele"; id: string; titre: string } | { genre: "lien" } | { genre: "nouveautes" };
type Jour = "maintenant" | "soir" | "demain" | "autre";
const HEURES = [18, 19, 20, 21, 22];

export function ProposerGroupe({ tele, moi, adulte, onFermer, onPubliee }: { tele: TeleDuJour | null; moi: string | null; adulte: boolean; onFermer: () => void; onPubliee: (p: PropositionGroupe) => void }) {
  const themes = useMemo(() => {
    const passions = tele?.passions ?? [];
    const l = THEMES_DECOUVRIR.filter((t) => adulte || !t.adultes);
    return [...l.filter((t) => passions.includes(t.id)), ...l.filter((t) => !passions.includes(t.id))];
  }, [adulte, tele]);
  const [nom, setNom] = useState("");
  const [theme, setTheme] = useState<IdTheme>(themes[0]?.id ?? "series");
  const videos = (tele?.videos ?? []).slice(0, 6);
  const [video, setVideo] = useState<Video>(videos[0] ? { genre: "tele", id: videos[0].id, titre: videos[0].titre } : { genre: "nouveautes" });
  const [lien, setLien] = useState("");
  const [jour, setJour] = useState<Jour>("soir");
  const [heure, setHeure] = useState(21);
  const [autreDate, setAutreDate] = useState("");
  const [pour, setPour] = useState<PourQui>(adulte ? "tous" : "proches");
  const [places, setPlaces] = useState<PlacesGroupe>(8);
  const [mot, setMot] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  const t = THEMES_DECOUVRIR.find((x) => x.id === theme);
  const maintenant = jour === "maintenant";
  const quand = (() => {
    if (jour === "maintenant") return Date.now();
    if (jour === "soir") return aParis(0, heure);
    if (jour === "demain") return aParis(1, heure);
    const [a, m, j] = autreDate.split("-").map(Number);
    if (!a || !m || !j) return NaN;
    const jours = Math.round((Date.UTC(a, m - 1, j) - Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())) / 86_400_000);
    return aParis(jours, heure);
  })();
  const nbPlaces: PlacesGroupe = pour === "proches" ? 4 : places;
  const nomVu = nom.trim() || (t ? `${t.court[0].toUpperCase()}${t.court.slice(1)} ensemble` : "");
  const duLien = video.genre === "lien" ? videoYouTube(lien.trim()) : null;
  const vignette = video.genre === "tele" ? vignetteYouTube(video.id) : duLien ? vignetteYouTube(duLien.id) : null;
  const ceSoirPasse = aParis(0, HEURES[HEURES.length - 1]) < Date.now();

  async function publier() {
    if (envoi) return;
    setErreur("");
    // (maintenant, et pour tout le monde : le salon de la passion, tout de suite)
    if (maintenant && pour === "tous") return void window.location.assign(`/univers/salons?theme=${theme}`);
    if (!Number.isFinite(quand)) return setErreur("Choisis le jour.");
    if (!maintenant && quand < Date.now()) return setErreur("Cette heure est passée : choisis-en une autre.");
    setEnvoi(true);
    const corps = {
      action: "proposer",
      nom: nom.trim(),
      theme,
      quand,
      pour,
      places: nbPlaces,
      mot: mot.trim(),
      ...(video.genre === "tele" ? { video: video.id } : video.genre === "lien" && lien.trim() ? { lien: lien.trim() } : {}),
    };
    const r = await fetch("/api/direct/mes-groupes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) }).catch(() => null);
    const j = ((await r?.json().catch(() => null)) ?? {}) as { proposition?: PropositionGroupe; error?: string };
    setEnvoi(false);
    if (!r?.ok || !j.proposition) return setErreur(j.error || "Pas de réseau : réessaie dans un instant.");
    onPubliee(j.proposition);
  }

  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="pg" role="dialog" aria-label={P.titre} data-proposer-groupe>
      <div className="pg-haut">
        <button type="button" className="pg-fermer" onClick={onFermer} aria-label="Fermer">
          ✕
        </button>
        <strong>{P.titre}</strong>
      </div>
      <div className="pg-corps">
        {/* l'aperçu : la carte telle que les autres la verront */}
        <div className="pg-apercu" data-apercu>
          <div className="pg-apercu-haut">
            <span className="pg-pochette" style={vignette ? { backgroundImage: `url(${vignette})` } : undefined}>
              <i aria-hidden="true">{video.genre === "nouveautes" ? "📰" : "▶"}</i>
            </span>
            <span>
              <b>
                {t?.e} {nomVu}
              </b>
              <small>🕘 {maintenant ? P.maintenant : Number.isFinite(quand) ? quandLisible(quand) : "…"}</small>
              <small>👥 {P.confirmes(1, nbPlaces)}</small>
            </span>
          </div>
          {mot.trim() && <p className="pg-mot">« {mot.trim()} »</p>}
          <span className="pg-sieges">
            {Array.from({ length: nbPlaces }, (_, k) =>
              k === 0 ? (
                <span key={k} className="pg-siege moi">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {moi ? <img src={moi} alt="" /> : "🙂"}
                </span>
              ) : (
                <span key={k} className="pg-siege">
                  ＋
                </span>
              ),
            )}
          </span>
        </div>
        <p className="pg-ou">{P.ouVa(pour === "tous", maintenant)}</p>

        <label className="pg-champ">
          <span>{P.sonNom}</span>
          <input type="text" maxLength={NOM_GROUPE_MAX} value={nom} onChange={(e) => setNom(e.target.value)} placeholder={P.nomIndice} data-nom />
        </label>

        <div>
          <p className="pg-etiquette">{P.passion}</p>
          <div className="pg-rang">
            {themes.map((x) => (
              <button key={x.id} type="button" className={`pg-puce${theme === x.id ? " pris" : ""}`} aria-pressed={theme === x.id} onClick={() => setTheme(x.id)} data-theme={x.id}>
                {x.e} {x.court}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="pg-etiquette">{P.video}</p>
          <div className="pg-rang">
            {videos.map((v) => (
              <button
                key={v.id}
                type="button"
                className={`pg-vignette${video.genre === "tele" && video.id === v.id ? " pris" : ""}`}
                style={{ backgroundImage: `linear-gradient(180deg,rgba(0,0,0,0) 40%,rgba(0,0,0,.8)),url(${vignetteYouTube(v.id)})` }}
                aria-pressed={video.genre === "tele" && video.id === v.id}
                onClick={() => setVideo({ genre: "tele", id: v.id, titre: v.titre })}
                data-video={v.id}
              >
                <span>{v.titre}</span>
              </button>
            ))}
            <button type="button" className={`pg-vignette vide${video.genre === "nouveautes" ? " pris" : ""}`} aria-pressed={video.genre === "nouveautes"} onClick={() => setVideo({ genre: "nouveautes" })} data-nouveautes>
              <b aria-hidden="true">📰</b>
              {P.nouveautes}
            </button>
          </div>
          {/* 🔗 (26 novembre 2026) le lien, toujours en vue : n'importe quelle vidéo YouTube, pas seulement celles du jour */}
          <label className={`pg-champ pg-lien${video.genre === "lien" ? " pris" : ""}`} data-lien>
            <span>🔗 {P.unLien}</span>
            <input
              type="url"
              inputMode="url"
              value={lien}
              onFocus={() => setVideo({ genre: "lien" })}
              onChange={(e) => {
                setLien(e.target.value);
                setVideo({ genre: "lien" });
              }}
              placeholder={P.lienIndice}
              data-lien-adresse
            />
          </label>
        </div>

        <div>
          <p className="pg-etiquette">{P.quand}</p>
          <div className="pg-rang">
            {(
              [
                ["maintenant", P.maintenant],
                ...(ceSoirPasse ? [] : [["soir", P.ceSoir]]),
                ["demain", P.demain],
                ["autre", P.autreJour],
              ] as [Jour, string][]
            ).map(([k, n]) => (
              <button key={k} type="button" className={`pg-puce${jour === k ? " pris" : ""}`} aria-pressed={jour === k} onClick={() => setJour(k)} data-jour={k}>
                {n}
              </button>
            ))}
          </div>
          {jour === "autre" && (
            <label className="pg-champ">
              <input type="date" value={autreDate} onChange={(e) => setAutreDate(e.target.value)} data-date />
            </label>
          )}
          {!maintenant && (
            <div className="pg-rang pg-heures">
              {HEURES.filter((h) => jour !== "soir" || aParis(0, h) > Date.now()).map((h) => (
                <button key={h} type="button" className={`pg-puce${heure === h ? " pris" : ""}`} aria-pressed={heure === h} onClick={() => setHeure(h)} data-heure={h}>
                  {h} h
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pg-deux">
          <div>
            <p className="pg-etiquette">{P.pourQui}</p>
            {adulte && (
              <button type="button" className={`pg-choix${pour === "tous" ? " pris" : ""}`} aria-pressed={pour === "tous"} onClick={() => setPour("tous")} data-pour="tous">
                <b aria-hidden="true">🌍</b>
                {P.tous}
                <small>{P.tousSous}</small>
              </button>
            )}
            <button type="button" className={`pg-choix${pour === "proches" ? " pris" : ""}`} aria-pressed={pour === "proches"} onClick={() => setPour("proches")} data-pour="proches">
              <b aria-hidden="true">👥</b>
              {P.proches}
            </button>
            {!adulte && <small className="pg-note">{P.jeunes}</small>}
          </div>
          <div>
            <p className="pg-etiquette">{P.places}</p>
            {([4, 8] as PlacesGroupe[]).map((n) => (
              <button key={n} type="button" className={`pg-choix${nbPlaces === n ? " pris" : ""}`} aria-pressed={nbPlaces === n} disabled={pour === "proches" && n === 8} onClick={() => setPlaces(n)} data-places={n}>
                <b>{n}</b>
                places
              </button>
            ))}
          </div>
        </div>

        <label className="pg-champ">
          <span>{P.mot}</span>
          <input type="text" maxLength={MOT_GROUPE_MAX} value={mot} onChange={(e) => setMot(e.target.value)} placeholder={P.motIndice} data-mot />
        </label>
        {erreur && (
          <p className="pg-erreur" role="alert" data-erreur>
            {erreur}
          </p>
        )}
      </div>
      <div className="pg-bas">
        <button type="button" className="pg-publier" onClick={() => void publier()} disabled={envoi} data-publier>
          {maintenant && pour === "tous" ? P.allerAuSalon : P.publier}
        </button>
      </div>
      <style>{STYLES_PROPOSER}</style>
    </div>,
    document.body,
  );
}

const STYLES_PROPOSER = `
.pg{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;background:radial-gradient(120% 40% at 100% 0%,rgba(255,46,154,.18),rgba(255,46,154,0) 60%),#120c09;color:#FFF4E6;font-family:var(--font-clikme),Poppins,system-ui,sans-serif;animation:pg-monte .3s cubic-bezier(.2,.9,.3,1.1)}
@keyframes pg-monte{from{transform:translateY(24px);opacity:0}}
.pg-haut{display:flex;align-items:center;gap:8px;padding:calc(12px + env(safe-area-inset-top)) 16px 6px}
.pg-haut strong{flex:1;font-size:21px;font-weight:800;letter-spacing:-.02em}
.pg-fermer{width:40px;height:40px;border:0;border-radius:50%;background:rgba(255,255,255,.08);color:#FFF4E6;font:inherit;font-size:16px;cursor:pointer}
.pg-corps{flex:1;overflow-y:auto;padding:4px 0 110px;display:flex;flex-direction:column;gap:14px;max-width:560px;width:100%;margin:0 auto;box-sizing:border-box}
.pg-apercu{align-self:center;width:250px;box-sizing:border-box;padding:10px;display:flex;flex-direction:column;gap:8px;border:1px solid rgba(255,196,140,.28);border-radius:18px;background:rgba(28,14,18,.85);box-shadow:0 18px 40px -18px rgba(255,46,154,.55)}
.pg-apercu-haut{display:flex;gap:10px;align-items:center}
.pg-apercu-haut>span:last-child{display:flex;flex-direction:column;min-width:0}
.pg-apercu b{font-size:16px;font-weight:800;line-height:1.2;overflow-wrap:anywhere}
.pg-apercu small{color:#cdb8a4;font-size:13.5px;font-weight:600}
.pg-pochette{flex:none;display:flex;align-items:center;justify-content:center;width:76px;height:64px;border-radius:12px;background:linear-gradient(135deg,#5a2440,#2a1020) center/cover no-repeat}
.pg-pochette i{display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.9);color:#222;font-style:normal;font-size:12px}
.pg-mot{margin:0;padding:8px 10px;border-radius:12px;background:#fff4e6;color:#2a1a10;font-family:Caveat,cursive;font-weight:700;font-size:18px;line-height:1.05}
.pg-sieges{display:flex;flex-wrap:wrap;gap:6px}
.pg-siege{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;overflow:hidden;box-shadow:inset 0 0 0 2px rgba(255,244,230,.3);color:rgba(255,244,230,.55);font-size:12px}
.pg-siege.moi{background:#3a2430;box-shadow:0 0 0 2px #ff2e9a}
.pg-siege img{width:100%;height:100%;object-fit:cover;object-position:50% 14%}
.pg-ou{margin:-4px 16px 0;text-align:center;color:#cdb8a4;font-size:12.5px}
.pg-champ{display:flex;flex-direction:column;gap:6px;padding:0 16px}
.pg-champ span{color:#F2C46B;font-weight:800;font-size:15px}
.pg-lien{margin-top:10px}
.pg-lien span{font-size:14px}
.pg-lien.pris input{border-color:#ff2e9a;box-shadow:0 0 0 2px rgba(255,46,154,.35)}
.pg-champ input{min-height:48px;padding:0 14px;border:1px solid rgba(255,196,140,.3);border-radius:14px;background:#1c1411;color:#FFF4E6;font:inherit;font-size:16px}
.pg-etiquette{margin:0 0 8px;padding:0 16px;color:#F2C46B;font-weight:800;font-size:15px}
.pg-rang{display:flex;gap:8px;overflow-x:auto;padding:2px 16px 4px;scrollbar-width:none}
.pg-rang::-webkit-scrollbar{display:none}
.pg-heures{margin-top:8px}
.pg-puce{flex:none;min-height:40px;padding:0 14px;border:1px solid rgba(255,196,140,.28);border-radius:999px;background:#1c1411;color:#FFF4E6;font:inherit;font-size:14px;font-weight:700;white-space:nowrap;cursor:pointer}
.pg-puce.pris,.pg-choix.pris{border-color:#ff2e9a;background:rgba(255,46,154,.2);color:#fff}
.pg-vignette{flex:none;position:relative;display:flex;align-items:flex-end;width:132px;height:84px;padding:6px 8px;box-sizing:border-box;border:0;border-radius:12px;background:#1c1411 center/cover no-repeat;color:#fff;font:inherit;font-size:11.5px;font-weight:700;line-height:1.15;text-align:left;cursor:pointer}
.pg-vignette span{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.pg-vignette.vide{flex-direction:column;align-items:center;justify-content:center;gap:2px;width:96px;border:1px dashed rgba(255,196,140,.35);text-align:center}
.pg-vignette.vide b{font-size:22px}
.pg-vignette.pris{box-shadow:0 0 0 3px #ff2e9a}
.pg-deux{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:0 16px}
.pg-deux .pg-etiquette{padding:0}
.pg-choix{display:flex;align-items:center;gap:8px;width:100%;min-height:48px;margin-bottom:8px;padding:0 12px;border:1px solid rgba(255,196,140,.28);border-radius:14px;background:#1c1411;color:#FFF4E6;font:inherit;font-size:14px;font-weight:700;text-align:left;cursor:pointer}
.pg-choix small{margin-left:auto;color:#cdb8a4;font-size:11.5px;font-weight:600}
.pg-choix:disabled{opacity:.4;cursor:default}
.pg-note{display:block;color:#cdb8a4;font-size:12px}
.pg-erreur{margin:0 16px;padding:10px 14px;border-radius:14px;background:rgba(255,80,80,.14);color:#ffd0d0;font-size:14px}
.pg-bas{position:absolute;left:0;right:0;bottom:0;padding:14px 16px calc(18px + env(safe-area-inset-bottom));background:linear-gradient(180deg,rgba(18,12,9,0),#120c09 35%)}
.pg-publier{display:block;width:100%;max-width:528px;margin:0 auto;min-height:54px;border:0;border-radius:999px;background:linear-gradient(135deg,#ff4fb0,#ff2e9a);color:#fff;font:inherit;font-weight:800;font-size:17px;box-shadow:0 10px 26px rgba(255,46,154,.45);cursor:pointer}
.pg-publier:disabled{opacity:.6}
`;
