"use client";

/**
 * 🧍 LES POSES DE TA FIGURINE — L'ESSAI P0 (`docs/univers/poses-figurine.md` ; `lib/direct/poses-figurine-serveur.ts`).
 * Le propriétaire, le 16 novembre 2026, après la maquette de la messagerie visuelle : « attaque aussi les figurines ».
 * Ses poses (debout d'abord, puis les autres d'après elle), puis LA SCÈNE : dans une pièce du duo, vide, sa figurine se
 * lève, marche jusqu'à la télé, la regarde, danse, va à l'étagère, rejoint l'autre place pour un câlin, revient, fait
 * coucou, boit un chocolat chaud et se rassoit. Puis son avis : se ressemble-t-elle d'une pose à l'autre ?
 */
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { AVIS_POSES, COUT_POSE_FIGURINE, POSES_FIGURINE, ancresDeLaPiece, dureeDuTrajet, poseFigurineDe, type AvisPoses, type Endroit, type EtatPosesFigurine, type PoseFigurine } from "@/lib/direct/poses-figurine";

const ROUTE = "/api/admin/direct/poses-figurine";
const pause = (ms: number) => new Promise((ok) => setTimeout(ok, ms));
type Reponse = { etat?: EtatPosesFigurine; error?: string; fait?: PoseFigurine };
const euros = (x: number) => x.toFixed(2).replace(".", ",");
const bouton: CSSProperties = { padding: "8px 14px", borderRadius: 999, border: "1px solid #c9b8a4", background: "#fff", fontWeight: 700 };
const fort: CSSProperties = { ...bouton, background: "#ff2e9a", color: "#fff", border: 0 };
const damier: CSSProperties = { background: "repeating-conic-gradient(#efe6da 0% 25%, #fbf6ef 0% 50%) 50% / 16px 16px" };
/** (un pas toutes les 260 ms : les deux images de la marche s'enchaînent) */
const PAS = 260;

/** Où elle en est dans la scène : sa pose, où elle se tient, vers où elle va, la durée du trajet en cours, son geste. */
type Scene = { pose: PoseFigurine; ici: Endroit; sens: 1 | -1; duree: number; geste?: "hop" | "danse" | "coucou" | "coeur" };

export function PosesDeLaFigurine() {
  const [etat, setEtat] = useState<EtatPosesFigurine | null>(null);
  const [occupe, setOccupe] = useState<PoseFigurine | "tout" | null>(null);
  const [dit, setDit] = useState("");
  const [pieceCle, setPieceCle] = useState<string>("");
  const [voirEndroits, setVoirEndroits] = useState(false);
  const [avis, setAvis] = useState<AvisPoses | null>(null);
  const [note, setNote] = useState("");

  const charger = useCallback(async () => {
    const j = (await (await fetch(ROUTE, { cache: "no-store" })).json().catch(() => ({}))) as Reponse;
    if (j.etat) {
      setEtat(j.etat);
      if (j.etat.avis) {
        setAvis(j.etat.avis.avis);
        setNote(j.etat.avis.note ?? "");
      }
    } else setDit(j.error || "La page ne s’est pas chargée.");
  }, []);
  useEffect(() => {
    void charger();
  }, [charger]);

  async function envoyer(corps: Record<string, unknown>): Promise<Reponse> {
    const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
    const j = (await r.json().catch(() => ({}))) as Reponse;
    if (j.etat) setEtat(j.etat);
    return j;
  }
  async function faire(pose: PoseFigurine) {
    setDit("");
    setOccupe(pose);
    try {
      const j = await envoyer({ action: "fabriquer", pose });
      setDit(j.error || (j.fait ? `« ${poseFigurineDe(j.fait).nom} » est faite.` : ""));
    } finally {
      setOccupe(null);
    }
  }
  /** Toutes celles qui manquent, une par passage (« debout » d'abord). */
  async function toutFaire() {
    setDit("");
    setOccupe("tout");
    try {
      for (let k = 0; k < POSES_FIGURINE.length + 2; k++) {
        const j = await envoyer({ action: "fabriquer" });
        if (j.error) return setDit(j.error);
        if (!j.fait) break;
      }
      setDit("Ses poses sont faites : regarde-la vivre dans la pièce, plus bas.");
    } finally {
      setOccupe(null);
    }
  }
  async function refaire(pose: PoseFigurine) {
    setDit("");
    await envoyer({ action: "refaire", pose });
  }
  async function donnerAvis() {
    if (!avis) return setDit("Choisis d’abord ton avis.");
    const j = await envoyer({ action: "avis", avis, note });
    setDit(j.error || "Ton avis est noté, merci.");
  }

  const faites = etat?.poses.filter((p) => p.image).length ?? 0;
  const reste = POSES_FIGURINE.length - faites;
  const image = (p: PoseFigurine) => etat?.poses.find((x) => x.cle === p)?.image;

  return (
    <section aria-label="Les poses de ta figurine" className="pf" style={{ margin: "18px 0", padding: 16, border: "1px solid #e3d7c8", borderRadius: 16, background: "#fffaf3" }}>
      <style>{CSS}</style>
      <h2 style={{ margin: "0 0 6px", fontSize: 20 }}>🧍 Les poses de ta figurine (P0)</h2>
      <p style={{ margin: "0 0 12px", color: "#555", lineHeight: 1.45 }}>
        Aujourd’hui, ta figurine n’existe qu’assise dans son fauteuil : elle ne peut pas se lever. Ici, ses poses, faites une fois, sur un fond transparent : debout d’abord (ses
        jambes et ses chaussures sont inventées une fois), puis les autres d’après elle. Puis la scène : dans une pièce du duo, elle se lève, va à la télé, danse, rejoint
        l’autre place… Environ {euros(COUT_POSE_FIGURINE)} $ la pose, {euros(COUT_POSE_FIGURINE * POSES_FIGURINE.length)} $ les {POSES_FIGURINE.length}. Juge surtout une chose :
        est-ce bien elle, d’une pose à l’autre ?
      </p>
      {etat && !etat.moteur && <p style={{ color: "#b3261e" }}>Le moteur d’image n’est pas branché ici.</p>}
      {etat && !etat.figurine && <p style={{ color: "#b3261e" }}>Ce téléphone n’a pas de figurine du nouveau style : fais-la d’abord (/univers/figurine).</p>}

      <h3 style={{ margin: "12px 0 6px", fontSize: 16 }}>1. Ses poses ({faites}/{POSES_FIGURINE.length})</h3>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
        <div style={{ width: 90, height: 135, borderRadius: 12, overflow: "hidden", display: "grid", placeItems: "center", ...damier }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {etat?.figurine ? <img src={etat.figurine} alt="Ta figurine, assise dans son fauteuil" style={{ maxWidth: "100%", maxHeight: "100%" }} /> : <span style={{ fontSize: 32 }}>🪑</span>}
        </div>
        {etat?.figurine && reste > 0 && (
          <button type="button" className="pf-tout" disabled={Boolean(occupe)} onClick={() => void toutFaire()} style={fort}>
            {occupe === "tout" ? "… elles se dessinent (une minute chacune) : garde la page ouverte" : reste === 1 ? "Faire sa dernière pose" : `Faire ses ${reste} poses`}
          </button>
        )}
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))", gap: 8 }}>
        {(etat?.poses ?? []).map((p) => (
          <li key={p.cle} className="pf-pose" data-pose={p.cle} style={{ padding: 6, borderRadius: 12, background: p.image ? "#eef7ea" : "#f6efe6", display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ borderRadius: 8, overflow: "hidden", aspectRatio: "2 / 3", display: "grid", placeItems: "center", ...damier }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.image ? <img src={p.image} alt={p.nom} style={{ maxWidth: "100%", maxHeight: "100%" }} /> : <span style={{ fontSize: 26 }}>{p.emoji}</span>}
            </div>
            <b style={{ fontSize: 12, lineHeight: 1.2 }}>{p.nom}</b>
            {p.image ? (
              <button type="button" disabled={Boolean(occupe)} onClick={() => void refaire(p.cle)} style={{ ...bouton, padding: "3px 8px", fontSize: 12 }}>
                Refaire
              </button>
            ) : (
              <button type="button" disabled={Boolean(occupe) || !etat?.figurine} onClick={() => void faire(p.cle)} style={{ ...bouton, padding: "3px 8px", fontSize: 12 }}>
                {occupe === p.cle ? "… une minute" : "Faire"}
              </button>
            )}
          </li>
        ))}
      </ul>

      <h3 style={{ margin: "16px 0 6px", fontSize: 16 }}>2. Elle vit dans la pièce</h3>
      {etat && (
        <LaScene
          etat={etat}
          image={image}
          pieceCle={pieceCle || etat.pieces[0]?.cle || ""}
          choisirPiece={setPieceCle}
          voirEndroits={voirEndroits}
          setVoirEndroits={setVoirEndroits}
          setDit={setDit}
        />
      )}

      <h3 style={{ margin: "16px 0 6px", fontSize: 16 }}>3. Ton avis</h3>
      <div role="radiogroup" aria-label="Ton avis sur ses poses" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {AVIS_POSES.map((a) => (
          <button key={a.cle} type="button" role="radio" aria-checked={avis === a.cle} className="pf-avis" data-avis={a.cle} onClick={() => setAvis(a.cle)} style={{ ...bouton, ...(avis === a.cle ? { background: "#1d1d1f", color: "#fff", borderColor: "#1d1d1f" } : {}) }}>
            {a.dit}
          </button>
        ))}
      </div>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Un mot ? (ce qui change d’une pose à l’autre, ce qui manque…)" rows={2} style={{ width: "100%", marginTop: 8, padding: 8, borderRadius: 10, border: "1px solid #c9b8a4", fontSize: 15, boxSizing: "border-box" }} />
      <button type="button" className="pf-donner-avis" onClick={() => void donnerAvis()} style={{ ...bouton, marginTop: 6 }}>
        Enregistrer mon avis
      </button>
      {dit && (
        <p role="status" className="pf-dit" style={{ margin: "10px 0 0" }}>
          {dit}
        </p>
      )}
    </section>
  );
}

/** Les gestes de la scène, dans l'ordre des boutons. */
const GESTES = [
  { cle: "lever", dit: "🧍 Se lever" },
  { cle: "tele", dit: "📺 Aller à la télé" },
  { cle: "danse", dit: "💃 Danser" },
  { cle: "etagere", dit: "📚 Aller à l’étagère" },
  { cle: "calin", dit: "🤗 Rejoindre l’autre" },
  { cle: "coucou", dit: "👋 Coucou" },
  { cle: "tasse", dit: "☕ Un chocolat chaud" },
  { cle: "asseoir", dit: "🪑 S’asseoir" },
] as const;
type Geste = (typeof GESTES)[number]["cle"];

function LaScene({
  etat,
  image,
  pieceCle,
  choisirPiece,
  voirEndroits,
  setVoirEndroits,
  setDit,
}: {
  etat: EtatPosesFigurine;
  image: (p: PoseFigurine) => string | undefined;
  pieceCle: string;
  choisirPiece: (c: string) => void;
  voirEndroits: boolean;
  setVoirEndroits: (v: boolean) => void;
  setDit: (t: string) => void;
}) {
  const piece = etat.pieces.find((p) => p.cle === pieceCle);
  const ancres = ancresDeLaPiece(piece?.emplacements, Boolean(piece?.ajuste));
  const depart: Scene = { pose: image("assise") ? "assise" : "debout", ici: ancres.place, sens: 1, duree: 0 };
  const [scene, setSceneEtat] = useState<Scene>(depart);
  const ref = useRef<Scene>(depart);
  const tour = useRef(0);
  const [joue, setJoue] = useState<string>("");
  const setScene = (s: Scene | ((x: Scene) => Scene)) => {
    ref.current = typeof s === "function" ? s(ref.current) : s;
    setSceneEtat(ref.current);
  };

  // (une autre pièce : elle se rassoit à sa place, tout geste en cours s'arrête)
  useEffect(() => {
    tour.current++;
    const d: Scene = { pose: image("assise") ? "assise" : "debout", ici: ancresDeLaPiece(piece?.emplacements, Boolean(piece?.ajuste)).place, sens: 1, duree: 0 };
    ref.current = d;
    setSceneEtat(d);
    setJoue("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pieceCle, Boolean(image("assise"))]);

  if (!image("debout")) return <p style={{ color: "#555" }}>Fais d’abord sa pose « Debout » : la scène en a besoin.</p>;

  /** Elle va quelque part : les deux pas s'enchaînent pendant le trajet, tournée du bon côté. */
  async function aller(t: number, vers: Endroit) {
    const de = ref.current.ici;
    if (Math.abs(vers.x - de.x) < 0.01 && Math.abs(vers.pieds - de.pieds) < 0.01) return;
    const duree = dureeDuTrajet(de, vers);
    const sens: 1 | -1 = vers.x >= de.x ? 1 : -1;
    const marche = image("marche-1") && image("marche-2");
    setScene({ pose: marche ? "marche-1" : "debout", ici: vers, sens, duree });
    const debut = Date.now();
    for (let k = 1; Date.now() - debut < duree; k++) {
      await pause(PAS);
      if (tour.current !== t) return;
      if (marche) setScene((s) => ({ ...s, pose: k % 2 ? "marche-2" : "marche-1" }));
    }
    setScene((s) => ({ ...s, pose: "debout", duree: 0, sens: 1 }));
  }
  const poser = (pose: PoseFigurine, geste?: Scene["geste"]) => setScene((s) => ({ ...s, pose: image(pose) ? pose : "debout", duree: 0, sens: 1, geste }));
  async function tenir(t: number, pose: PoseFigurine, ms: number, geste?: Scene["geste"]) {
    poser(pose, geste);
    await pause(ms);
    if (tour.current === t) poser("debout");
  }
  async function lever(t: number) {
    if (ref.current.pose !== "assise") return;
    setScene((s) => ({ ...s, ici: ancres.place, pose: "debout", duree: 0, geste: "hop" }));
    await pause(500);
    if (tour.current === t) setScene((s) => ({ ...s, geste: undefined }));
  }
  const pasLa = (quoi: string) => setDit(`Cette pièce n’a pas encore ${quoi} posée : la page d’essais, « 🛋️ La pièce du duo », « ✋ Ajuster à la main ».`);

  async function geste(g: Geste, t: number) {
    if (tour.current !== t) return;
    if (g === "asseoir") {
      await aller(t, ancres.place);
      if (tour.current === t) poser(image("assise") ? "assise" : "debout");
      return;
    }
    await lever(t);
    if (tour.current !== t) return;
    if (g === "lever") return;
    if (g === "tele" || g === "etagere") {
      const ou = g === "tele" ? ancres.tele : ancres.etagere;
      if (!ou) return pasLa(g === "tele" ? "sa télé" : "son étagère");
      await aller(t, ou);
      if (tour.current === t) poser("dos");
      return;
    }
    if (g === "calin") {
      await aller(t, ancres.autre);
      if (tour.current === t) await tenir(t, "calin", 2600, "coeur");
      return;
    }
    if (g === "danse") return tenir(t, "danse", 3200, "danse");
    if (g === "coucou") return tenir(t, "coucou", 2400, "coucou");
    if (g === "tasse") return tenir(t, "tasse", 3000);
  }
  async function un(g: Geste) {
    setDit("");
    const t = ++tour.current;
    setJoue(g);
    await geste(g, t);
    if (tour.current === t) setJoue("");
  }
  /** ▶ Tout : se lever, la télé (la regarder, danser), l'étagère, l'autre (un câlin), revenir, coucou, une tasse, s'asseoir. */
  async function tout() {
    setDit("");
    const t = ++tour.current;
    setJoue("tout");
    const suite: [Geste, number][] = [
      ["lever", 400],
      ["tele", 2200],
      ["danse", 200],
      ["etagere", 1800],
      ["calin", 300],
      ["asseoir", 0],
    ];
    for (const [g, apres] of suite) {
      if (g === "asseoir") {
        await aller(t, ancres.place);
        if (tour.current !== t) return;
        await tenir(t, "coucou", 2200, "coucou");
        if (tour.current !== t) return;
        await tenir(t, "tasse", 2600);
      }
      if ((g === "tele" && !ancres.tele) || (g === "etagere" && !ancres.etagere)) continue;
      await geste(g, t);
      if (tour.current !== t) return;
      await pause(apres);
    }
    if (tour.current === t) setJoue("");
  }

  const p = poseFigurineDe(scene.pose);
  const src = image(scene.pose) ?? image("debout");
  const H = ancres.hauteur * scene.ici.echelle * p.taille;
  const enMarche = scene.pose === "marche-1" || scene.pose === "marche-2";
  const transition = scene.duree ? `left ${scene.duree}ms linear, bottom ${scene.duree}ms linear, height ${scene.duree}ms linear` : "none";
  const endroits: [string, Endroit | undefined][] = [
    ["🪑", ancres.place],
    ["🤗", ancres.autre],
    ["📺", ancres.tele],
    ["📚", ancres.etagere],
  ];

  return (
    <div>
      {etat.pieces.length > 0 ? (
        <div role="radiogroup" aria-label="La pièce" style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          {etat.pieces.map((x) => (
            <button key={x.cle} type="button" role="radio" aria-checked={x.cle === pieceCle} className="pf-piece" data-piece={x.cle} onClick={() => choisirPiece(x.cle)} style={{ ...bouton, padding: "5px 10px", ...(x.cle === pieceCle ? { background: "#1d1d1f", color: "#fff", borderColor: "#1d1d1f" } : {}) }}>
              {x.emoji} {x.nom}
            </button>
          ))}
        </div>
      ) : (
        <p style={{ color: "#555", margin: "0 0 8px" }}>Aucune pièce du duo n’est encore faite : la scène se joue sur un fond simple.</p>
      )}
      <div className="pf-scene" data-pose={scene.pose} data-joue={joue || undefined} style={{ position: "relative", width: "min(100%, 360px)", aspectRatio: "2 / 3", borderRadius: 20, overflow: "hidden", background: "linear-gradient(180deg,#e9dccb,#cdb89c 62%,#a88b6b)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {piece && <img src={piece.decor} alt={piece.nom} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
        {voirEndroits &&
          endroits.map(([e, o]) =>
            o ? (
              <span key={e} className="pf-endroit" style={{ position: "absolute", left: `${o.x * 100}%`, top: `${o.pieds * 100}%`, transform: "translate(-50%,-50%)", fontSize: 14, padding: "1px 4px", borderRadius: 8, background: "rgba(255,255,255,.85)" }}>
                {e}
              </span>
            ) : null,
          )}
        <div className={`pf-figurine${scene.geste ? ` pf-${scene.geste}` : ""}`} style={{ position: "absolute", left: `${scene.ici.x * 100}%`, bottom: `${(1 - scene.ici.pieds) * 100}%`, height: `${H * 100}%`, transform: "translateX(-50%)", transition, zIndex: 2 }}>
          <span aria-hidden="true" style={{ position: "absolute", left: "50%", bottom: "-3%", width: "70%", height: "7%", transform: "translateX(-50%)", borderRadius: "50%", background: "radial-gradient(closest-side, rgba(0,0,0,.38), rgba(0,0,0,0))" }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={enMarche ? "pf-pas" : undefined} src={src} alt={`Ta figurine : ${p.nom}`} style={{ position: "relative", display: "block", height: "100%", width: "auto", transform: `scaleX(${scene.sens})`, transformOrigin: "50% 100%" }} />
          {scene.geste === "coeur" && (
            <span aria-hidden="true" className="pf-coeur-vole">
              ❤️
            </span>
          )}
        </div>
      </div>
      <label style={{ display: "inline-flex", gap: 6, alignItems: "center", fontSize: 14, margin: "8px 0" }}>
        <input type="checkbox" checked={voirEndroits} onChange={(e) => setVoirEndroits(e.target.checked)} /> Voir les endroits où elle peut aller
      </label>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button type="button" className="pf-tout-jouer" onClick={() => void tout()} style={fort}>
          {joue === "tout" ? "… elle vit (touche un geste pour l’arrêter)" : "▶ Tout jouer"}
        </button>
        {GESTES.map((g) => (
          <button key={g.cle} type="button" className="pf-geste" data-geste={g.cle} onClick={() => void un(g.cle)} style={{ ...bouton, padding: "6px 10px", fontSize: 14 }}>
            {g.dit}
          </button>
        ))}
      </div>
    </div>
  );
}

const CSS = `
.pf-pas{animation:pf-pas ${PAS}ms ease-in-out infinite alternate}
@keyframes pf-pas{from{translate:0 0}to{translate:0 -2.5%}}
.pf-hop img{animation:pf-hop .5s ease-out}
@keyframes pf-hop{0%{translate:0 0}40%{translate:0 -7%}100%{translate:0 0}}
.pf-danse img{animation:pf-danse .55s ease-in-out infinite alternate}
@keyframes pf-danse{from{rotate:-6deg;translate:0 0}to{rotate:6deg;translate:0 -5%}}
.pf-coucou img{animation:pf-coucou .45s ease-in-out infinite alternate}
@keyframes pf-coucou{from{rotate:-2deg}to{rotate:2deg}}
.pf-coeur-vole{position:absolute;left:50%;top:-6%;font-size:22px;animation:pf-coeur 1.3s ease-out infinite}
@keyframes pf-coeur{from{opacity:1;translate:-50% 0;scale:.7}to{opacity:0;translate:-50% -90%;scale:1.3}}
@media (prefers-reduced-motion: reduce){.pf-pas,.pf-hop img,.pf-danse img,.pf-coucou img,.pf-coeur-vole{animation:none}}
`;
