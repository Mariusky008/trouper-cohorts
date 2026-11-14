"use client";

/**
 * 🏠 UNE PIÈCE ENTIÈRE, VIVANTE — L'ESSAI (`lib/direct/pieces-vivantes-serveur.ts`, 14 novembre 2026 : « chaque pièce
 * entièrement sur l'écran comme sur la photo, mais dézoomée […] deux ou trois gros objets animés, le reste sur des
 * étagères […] les étoiles ça fait très années 2000 : bien plus wow et immersif »). Pour chaque pièce : l'image entière,
 * les objets vedettes repérés, puis sa photo vivante (une vidéo de huit secondes, en boucle). On y entre en plein écran :
 * la pièce vit, sa figurine est assise au premier plan ; on touche une vedette, on s'en approche.
 */
import { useCallback, useEffect, useState } from "react";
import { DansLesPieces } from "@/app/univers/piece-vivante";

type Piece = "salon" | "tele" | "terrasse";
type Etape = "image" | "objets" | "video";
type Cadre = { x: number; y: number; l: number; h: number };
type Etat = {
  piece: Piece;
  decor: boolean;
  faites: Etape[];
  aFaire: Etape[];
  vue?: string;
  video?: string;
  objets?: { objets: (Cadre & { cle: string })[]; place: Cadre | null; ecran: Cadre | null };
  vedettes: { cle: string; nom: string; dit: string }[];
  videoEnCours?: { depuis: string; progres?: number };
  figurine?: string;
  enCours: boolean;
  pieces: Record<Piece, number>;
};
const ROUTE = "/api/admin/direct/pieces-vivantes";
const PIECES: { cle: Piece; nom: string }[] = [
  { cle: "salon", nom: "Le salon" },
  { cle: "tele", nom: "La pièce télé" },
  { cle: "terrasse", nom: "La terrasse" },
];
const ETAPES: { cle: Etape; nom: string }[] = [
  { cle: "image", nom: "La pièce entière, vue de loin (une image, une à deux minutes)" },
  { cle: "objets", nom: "Ses vedettes repérées (quelques secondes)" },
  { cle: "video", nom: "Sa photo vivante : huit secondes de vidéo (quelques minutes)" },
];
const CLE_YOUTUBE = "clikme-essai-tele-youtube";
/** L'identifiant d'une vidéo YouTube, depuis son lien (youtu.be, watch?v=, shorts, embed). */
export function idYoutube(lien: string): string {
  const m = /(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/)([\w-]{11})/.exec(lien.trim());
  return m ? m[1] : "";
}
const pause = (ms: number) => new Promise((ok) => setTimeout(ok, ms));

export function PieceVivante() {
  const [piece, setPiece] = useState<Piece>("salon");
  const [etat, setEtat] = useState<Etat | null>(null);
  const [occupe, setOccupe] = useState("");
  const [dit, setDit] = useState("");
  const [dedans, setDedans] = useState(false);
  const [youtube, setYoutube] = useState("");
  useEffect(() => {
    try {
      setYoutube(window.localStorage.getItem(CLE_YOUTUBE) ?? "");
    } catch {
      /* rien */
    }
  }, []);
  const charger = useCallback(async (p: Piece) => {
    const j = (await (await fetch(`${ROUTE}?piece=${p}`, { cache: "no-store" })).json().catch(() => ({}))) as { etat?: Etat; error?: string };
    if (j.etat) setEtat(j.etat);
    else setDit(j.error || "La page ne s’est pas chargée.");
  }, []);
  useEffect(() => {
    void charger(piece);
  }, [charger, piece]);

  async function envoyer(corps: Record<string, unknown>) {
    const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ piece, ...corps }) });
    return (await r.json().catch(() => ({}))) as { etat?: Etat; error?: string; fait?: Etape; progres?: number };
  }
  // tout, une étape après l'autre ; la vidéo : commandée, puis suivie toutes les huit secondes (un quart d'heure au plus)
  async function fabriquer() {
    setDit("");
    try {
      setOccupe(etat?.aFaire[0] ?? "image");
      for (let k = 0; k < 120; k++) {
        const j = await envoyer({ action: "fabriquer" });
        if (j.etat) setEtat(j.etat);
        if (j.error) return setDit(j.error);
        if (j.fait === "video" || !j.etat?.aFaire.length) break;
        if (typeof j.progres === "number") {
          setOccupe(`video ${j.progres}`);
          await pause(8000);
          continue;
        }
        if (!j.fait) break;
        setOccupe(j.etat.aFaire[0]);
      }
      setDit(`${PIECES.find((x) => x.cle === piece)?.nom} est prête : entre dedans.`);
    } finally {
      setOccupe("");
    }
  }
  async function refaire(e: Etape) {
    setDit("");
    const j = await envoyer({ action: "refaire", etape: e });
    if (j.etat) setEtat(j.etat);
    setDit(j.error ?? "Effacée : touche « Continuer » pour la refaire.");
  }

  const ici = etat?.piece === piece ? etat : null;
  const nom = PIECES.find((x) => x.cle === piece)!.nom;
  const enVideo = occupe.startsWith("video");
  return (
    <section aria-label="Une pièce entière, vivante" style={{ margin: "18px 0", padding: 16, border: "1px solid #e3d7c8", borderRadius: 16, background: "#fffaf3" }}>
      <style>{STYLES}</style>
      <h2 style={{ margin: "0 0 6px", fontSize: 20 }}>🎬 Une pièce entière, vivante (essai)</h2>
      <p style={{ margin: "0 0 10px", color: "#555", lineHeight: 1.45 }}>
        Chaque pièce entière à l’écran, vue de loin, comme l’image de ton univers : deux ou trois gros objets (ce sont eux qui vivent), le reste sur des étagères.
        Puis le moteur vidéo d’OpenAI en fait une <b>photo vivante</b> : la caméra ne bouge pas, seuls les objets vivent (le disque tourne, le feu danse, les
        poissons nagent, la lumière scintille), en boucle. Ensuite, entre dedans : touche un objet, on s’en approche. Coût, environ : 0,25 $ l’image, 0,80 $ la
        vidéo.
      </p>
      <div role="tablist" aria-label="Les pièces" style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "0 0 12px" }}>
        {PIECES.map((x) => (
          <button
            key={x.cle}
            type="button"
            role="tab"
            aria-selected={x.cle === piece}
            className={`pv-onglet${x.cle === piece ? " prise" : ""}`}
            data-piece={x.cle}
            disabled={Boolean(occupe)}
            onClick={() => {
              setDit("");
              setPiece(x.cle);
            }}
            style={{ padding: "8px 14px", borderRadius: 999, border: x.cle === piece ? "0" : "1px solid #c9b8a4", background: x.cle === piece ? "#2b1b12" : "#fff", color: x.cle === piece ? "#fff" : "#2b1b12", fontWeight: 800 }}
          >
            {x.nom}
            {etat?.pieces ? ` · ${etat.pieces[x.cle] === 3 ? "✓" : `${etat.pieces[x.cle]}/3`}` : ""}
          </button>
        ))}
      </div>
      {ici && (
        <p style={{ margin: "0 0 10px", color: "#555" }}>
          <b>{nom}</b> : {ici.vedettes.map((v) => v.nom).join(" · ")}.
        </p>
      )}
      {ici && !ici.decor && <p style={{ margin: "0 0 10px", color: "#b3261e" }}>Ton univers n’a pas encore son décor : crée-le d’abord (/univers/monde).</p>}

      {ici?.vue && (
        <button type="button" className="pv-entrer" onClick={() => setDedans(true)} aria-label={`Entrer dans ${nom.toLowerCase()}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ici.vue} alt="" />
          <span>{ici.video ? "▶ Entrer dans la pièce" : "Entrer (pas encore vivante)"}</span>
        </button>
      )}

      {ici && (
        <ol style={{ margin: "12px 0", padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
          {ETAPES.map((e) => {
            const faite = ici.faites.includes(e.cle);
            const train = (occupe === e.cle || (e.cle === "video" && enVideo)) && !faite;
            return (
              <li key={e.cle} className={`pv-etape${faite ? " faite" : ""}`} data-etape={e.cle} style={{ display: "flex", alignItems: "center", gap: 10, padding: 8, borderRadius: 12, background: faite ? "#eef7ea" : "#f6efe6" }}>
                <span style={{ flex: 1, minWidth: 0, lineHeight: 1.35 }}>
                  {faite ? "✓ " : train ? "… " : ""}
                  {e.nom}
                  {e.cle === "video" && !faite && ici.videoEnCours && ` — commandée, ${ici.videoEnCours.progres ?? 0} %`}
                  {e.cle === "objets" && faite && ici.objets && ` — ${ici.objets.objets.length} trouvée(s)${ici.objets.place ? ", la place du fauteuil" : ""}${ici.objets.ecran ? ", l’écran" : ""}`}
                </span>
                {faite && (
                  <button type="button" disabled={Boolean(occupe)} onClick={() => void refaire(e.cle)} style={{ padding: "6px 12px", borderRadius: 999, border: "1px solid #c9b8a4", background: "#fff", fontWeight: 700 }}>
                    Refaire
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      )}
      {piece === "tele" && (
        <label style={{ display: "grid", gap: 4, margin: "0 0 12px", fontWeight: 700 }}>
          📺 Un lien YouTube pour la télé (ce que tu regardes en ce moment)
          <input
            className="pv-youtube"
            value={youtube}
            placeholder="https://youtu.be/…"
            onChange={(ev) => {
              setYoutube(ev.target.value);
              try {
                window.localStorage.setItem(CLE_YOUTUBE, ev.target.value);
              } catch {
                /* rien */
              }
            }}
            style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid #c9b8a4", fontWeight: 400 }}
          />
        </label>
      )}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        {ici && ici.aFaire.length > 0 && (
          <button type="button" className="pv-fabriquer" disabled={Boolean(occupe) || !ici.decor} onClick={() => void fabriquer()} style={{ padding: "10px 16px", borderRadius: 999, border: 0, background: "#ff2e9a", color: "#fff", fontWeight: 800 }}>
            {occupe
              ? enVideo
                ? `… la vidéo se fait (${occupe.split(" ")[1] ?? 0} %) : garde la page ouverte`
                : `… ${ETAPES.find((x) => x.cle === occupe)?.nom.split(" (")[0] ?? ""}`
              : ici.faites.length || ici.videoEnCours
                ? `Continuer ${nom.toLowerCase()}`
                : `Fabriquer ${nom.toLowerCase()}`}
          </button>
        )}
        {ici?.video && (
          <a href={ici.video} target="_blank" rel="noreferrer" style={{ fontWeight: 700 }}>
            Ouvrir la vidéo seule
          </a>
        )}
      </div>
      {dit && (
        <p role="status" style={{ margin: "10px 0 0" }}>
          {dit}
        </p>
      )}
      {dedans && ici?.vue && (
        <DansLesPieces
          pieces={[{ piece, nom, vue: ici.vue, ...(ici.video ? { video: ici.video } : {}), ...(ici.objets ? { objets: ici.objets } : {}), vedettes: ici.vedettes }]}
          figurine={ici.figurine}
          youtube={idYoutube(youtube)}
          onFermer={() => setDedans(false)}
        />
      )}
    </section>
  );
}

const STYLES = `
.pv-entrer{position:relative;display:block;width:min(100%,300px);aspect-ratio:9/16;margin:0 auto;padding:0;border:0;border-radius:22px;overflow:hidden;background:#140a08;cursor:pointer;box-shadow:0 18px 40px -18px rgba(0,0,0,.6)}
.pv-entrer img{width:100%;height:100%;object-fit:cover;display:block}
.pv-entrer span{position:absolute;left:50%;bottom:16px;transform:translateX(-50%);white-space:nowrap;padding:10px 16px;border-radius:999px;background:rgba(20,10,8,.72);color:#fff;font-weight:800;backdrop-filter:blur(8px)}
`;
