"use client";

/**
 * 🧩 L'EFFET « COLLAGE » (`lib/direct/pieces-duo-collage-serveur.ts`) — le premier essai de la maquette de la pièce du
 * duo : deux vraies figurines dans une vraie pièce, POSÉES par l'écran (assises sans fauteuil, à leurs places, avec une
 * ombre et la lumière de la pièce) ou GÉNÉRÉES avec la pièce. Le propriétaire choisit en regardant les deux, sur son
 * téléphone.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { ANCRE_ASSISE, AVIS_COLLAGE, COUT_COLLAGE, HAUTEUR_MAX_DUO, HAUTEUR_MIN_DUO, MOMENTS_DUO, hauteurDuo, type AvisCollage, type EtatCollage, type EtatPiecesDuo, type MomentDuo, type PlaceDuo } from "@/lib/direct/pieces-duo";

const ROUTE = "/api/admin/direct/pieces-duo/collage";
const PIECES = "/api/admin/direct/pieces-duo";
const euros = (n: number) => n.toFixed(2).replace(".", ",");
const pc = (x: number) => `${(x * 100).toFixed(2)}%`;
const ETAPES: Record<string, string> = { "pose-a": "la première figurine, assise sans fauteuil", "pose-b": "la seconde figurine, assise sans fauteuil", duo: "le duo, généré dans la pièce" };

/**
 * Une figurine posée : le point qui touche le siège sur sa place, la taille des deux (`hauteurDuo`), une ombre, la lumière
 * de gauche — exactement là où l'image du duo l'assiéra. `onGlisser` : on la fait glisser du doigt (✋ Ajuster leurs places).
 */
function Posee({ src, place, h, cote, onGlisser }: { src: string; place: PlaceDuo; h: number; cote: "a" | "b"; onGlisser?: (dx: number, dy: number) => void }) {
  const dernier = useRef<{ x: number; y: number } | null>(null);
  const glisse = onGlisser
    ? {
        onPointerDown: (e: React.PointerEvent<HTMLSpanElement>) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          dernier.current = { x: e.clientX, y: e.clientY };
        },
        onPointerMove: (e: React.PointerEvent<HTMLSpanElement>) => {
          const scene = e.currentTarget.parentElement?.getBoundingClientRect();
          if (!dernier.current || !scene?.width || !scene.height) return;
          onGlisser((e.clientX - dernier.current.x) / scene.width, (e.clientY - dernier.current.y) / scene.height);
          dernier.current = { x: e.clientX, y: e.clientY };
        },
        onPointerUp: () => (dernier.current = null),
        onPointerCancel: () => (dernier.current = null),
      }
    : {};
  return (
    <>
      <span className="cd-ombre" style={{ left: pc(place.x), top: pc(place.y), width: pc(h * 0.62), height: pc(h * 0.07) }} aria-hidden="true" />
      <span className={`cd-fig${onGlisser ? " cd-glisse" : ""}`} data-figurine={cote} style={{ left: pc(place.x), top: pc(place.y - ANCRE_ASSISE * h), height: pc(h) }} {...glisse}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" draggable={false} />
        <i className="cd-lumiere" style={{ WebkitMaskImage: `url("${src}")`, maskImage: `url("${src}")` }} aria-hidden="true" />
      </span>
    </>
  );
}

export function CollageDuo() {
  const [etat, setEtat] = useState<EtatCollage | null>(null);
  const [pieces, setPieces] = useState<EtatPiecesDuo | null>(null);
  const [piece, setPiece] = useState<string>("");
  const [moment, setMoment] = useState<MomentDuo | "">("");
  const [elues, setElues] = useState<string[]>([]);
  const [occupe, setOccupe] = useState(false);
  const [dit, setDit] = useState("");
  const [note, setNote] = useState("");
  // ✋ les places en train d'être ajustées (en points d'assise) et leur taille, avant d'être enregistrées
  const [reglage, setReglage] = useState<{ places: PlaceDuo[]; h: number } | null>(null);
  const recevoir = useCallback((e: EtatCollage) => {
    setEtat(e);
    if (e.choix) {
      setPiece((p) => p || e.choix!.piece);
      setMoment((m) => m || e.moment || "");
      setElues((l) => (l.length ? l : [e.choix!.a, e.choix!.b]));
      setNote((n) => n || e.choix!.note || "");
    }
  }, []);
  const charger = useCallback(async () => {
    const [c, p] = await Promise.all([
      fetch(ROUTE, { cache: "no-store" }).then((r) => r.json().catch(() => ({}))),
      fetch(PIECES, { cache: "no-store" }).then((r) => r.json().catch(() => ({}))),
    ]);
    if (c.etat) recevoir(c.etat as EtatCollage);
    else setDit(c.error || "L’essai ne s’est pas chargé.");
    if (p.etat) setPieces(p.etat as EtatPiecesDuo);
  }, [recevoir]);
  useEffect(() => {
    void Promise.resolve().then(charger);
  }, [charger]);
  async function envoyer(corps: Record<string, unknown>) {
    const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
    const j = (await r.json().catch(() => ({}))) as { etat?: EtatCollage; error?: string; fait?: string };
    // (les deux places pas encore posées dans cette pièce : l'ajustement s'ouvre de lui-même, sur les posées)
    const e = j.etat;
    if (j.error?.startsWith("Pose d’abord leurs deux places") && e?.poses.a && e.poses.b) setReglage((x) => x ?? { places: e.places.map((p) => ({ ...p })), h: hauteurDuo(e.places) });
    if (j.etat) recevoir(j.etat);
    return j;
  }
  function elire(id: string) {
    setElues((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id].slice(-2)));
  }
  /** Installer : le choix, puis trois passages au plus (deux poses, le duo). */
  async function installer() {
    setDit("");
    setOccupe(true);
    try {
      const c = await envoyer({ action: "choisir", piece, a: elues[0], b: elues[1], ...(momentChoisi ? { moment: momentChoisi } : {}) });
      if (c.error) return setDit(c.error);
      for (let k = 0; k < 3; k++) {
        setDit(`… ${k + 1}/3 (une minute chacune, garde la page ouverte)`);
        const j = await envoyer({ action: "fabriquer" });
        if (j.error) return setDit(j.error);
        if (!j.fait) break;
        setDit(`Fait : ${ETAPES[j.fait] ?? j.fait}.`);
      }
      setDit("Les deux versions sont prêtes : compare-les.");
    } finally {
      setOccupe(false);
    }
  }
  async function refaire(quoi: "poses" | "duo") {
    setDit("");
    await envoyer({ action: "refaire", quoi });
    await installer();
  }
  /** ✋ Une figurine glissée du doigt (en fractions de la pièce). */
  function glisser(k: number, dx: number, dy: number) {
    setReglage((r) => r && { ...r, places: r.places.map((p, i) => (i === k ? { ...p, x: Math.min(0.98, Math.max(0.02, p.x + dx)), y: Math.min(0.98, Math.max(0.05, p.y + dy)) } : p)) });
  }
  function grandir(d: number) {
    setReglage((r) => r && { ...r, h: Math.min(HAUTEUR_MAX_DUO, Math.max(HAUTEUR_MIN_DUO, Math.round((r.h + d) * 100) / 100)) });
  }
  /**
   * ✋ Enregistrer leurs places : dans les zones de la pièce (comme « ✋ Ajuster à la main », plus haut) — une place tracée à
   * la main est la boîte de la figurine entière, son bas aux pieds. L'image du duo se refait alors à ces places.
   */
  async function enregistrerPlaces() {
    if (!reglage || !laPiece) return;
    const r3 = (x: number) => Math.round(x * 1000) / 1000;
    const places = reglage.places.map((p) => ({ x: r3(p.x), y: r3(Math.min(1, p.y + (1 - ANCRE_ASSISE) * reglage.h)), hauteur: r3(reglage.h) }));
    setOccupe(true);
    try {
      const r = await fetch(PIECES, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "ajuster", piece: laPiece.cle, emplacements: { ...(laPiece.emplacements ?? { cadres: [] }), places } }),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (j.error || !r.ok) return setDit(j.error || "Leurs places n’ont pas pu être enregistrées.");
      setReglage(null);
      await charger();
      setDit(`Leurs places sont enregistrées. « Faire ce qui manque » refait la générée à ces places (environ 0,17 €) ; la maquette aussi, à la prochaine visite.`);
    } finally {
      setOccupe(false);
    }
  }
  async function donnerAvis(avis: AvisCollage) {
    const j = await envoyer({ action: "avis", avis, note });
    setDit(j.error || "Merci, c’est noté.");
  }
  const faites = pieces?.pieces.filter((p) => p.decor) ?? [];
  const laPiece = faites.find((p) => p.cle === piece);
  // (les lumières faites de la pièce choisie ; la sienne d'abord, par défaut)
  const lumieresFaites = laPiece ? MOMENTS_DUO.filter((m) => m.cle === laPiece.moment || laPiece.lumieres?.[m.cle]) : [];
  const momentChoisi: MomentDuo | "" = lumieresFaites.some((m) => m.cle === moment) ? moment : (laPiece?.moment ?? "");
  const memeChoix = etat?.choix && etat.choix.piece === piece && etat.choix.a === elues[0] && etat.choix.b === elues[1] && etat.moment === momentChoisi;
  const nomDe = (id: string) => etat?.figurines.find((f) => f.id === id)?.nom ?? "";
  return (
    <section aria-label="L’effet collage" style={{ margin: "18px 0", padding: 16, border: "1px solid #e3d7c8", borderRadius: 16, background: "#fffaf3" }}>
      <h2 style={{ margin: "0 0 6px", fontSize: 20 }}>🧩 L’effet « collage » : deux figurines dans une pièce</h2>
      <p style={{ margin: "0 0 10px", color: "#555", lineHeight: 1.45 }}>
        Deux vraies figurines dans une vraie pièce. <b>Ton choix : la version générée</b> (« très bien ») — une image du duo par pièce et par lumière,
        faite une fois. Les figurines sont d’abord posées à leurs places (comme dans « Posées », qui montre exactement où et à quelle taille), puis le moteur les assoit
        pour de vrai, dans leur silhouette seulement : les meubles, la télé, les cadres et l’étagère restent tels quels. Environ {euros(COUT_COLLAGE)} € la première fois (les deux poses et le duo), puis environ
        0,17 € par autre lumière.
      </p>
      {etat && !etat.moteur && <p style={{ color: "#b3261e" }}>Le moteur d’image n’est pas branché ici.</p>}
      <p style={{ margin: "0 0 10px" }}>
        <a href="/admin/humain/piece-du-duo" className="cd-maquette">
          ▶ Ouvrir la maquette de la pièce du duo
        </a>{" "}
        <small style={{ color: "#666" }}>(avec le duo choisi ici)</small>
      </p>

      <h3 className="cd-titre">1. La pièce</h3>
      {faites.length ? (
        <div className="cd-chips">
          {faites.map((p) => (
            <button key={p.cle} type="button" className={piece === p.cle ? "elue" : ""} onClick={() => setPiece(p.cle)} aria-pressed={piece === p.cle}>
              {p.emoji} {p.nom}
            </button>
          ))}
        </div>
      ) : (
        <p style={{ margin: 0, color: "#666" }}>Fais d’abord les pièces, juste au-dessus.</p>
      )}
      {lumieresFaites.length > 1 && (
        <div className="cd-chips" style={{ marginTop: 8 }} role="group" aria-label="La lumière">
          {lumieresFaites.map((m) => (
            <button key={m.cle} type="button" className={momentChoisi === m.cle ? "elue" : ""} onClick={() => setMoment(m.cle)} aria-pressed={momentChoisi === m.cle}>
              {m.emoji} {m.nom}
            </button>
          ))}
        </div>
      )}

      <h3 className="cd-titre">2. Les deux figurines {elues.length ? `(${elues.length}/2)` : ""}</h3>
      {etat?.figurines.length ? (
        <div className="cd-figurines">
          {etat.figurines.map((f) => {
            const rang = elues.indexOf(f.id);
            return (
              <button key={f.id} type="button" className={rang >= 0 ? "elue" : ""} onClick={() => elire(f.id)} aria-pressed={rang >= 0} data-id={f.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.image} alt="" />
                <small>{f.nom}</small>
                {rang >= 0 && <b>{rang === 0 ? "à gauche" : "à droite"}</b>}
              </button>
            );
          })}
        </div>
      ) : (
        <p style={{ margin: 0, color: "#666" }}>Aucune figurine : ouvre /univers/figurine sur ce téléphone, ou fais des figurines dans les essais plus bas.</p>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", margin: "12px 0" }}>
        <button type="button" className="cd-principal" disabled={occupe || !piece || elues.length !== 2} onClick={() => void installer()}>
          {occupe ? "… (garde la page ouverte)" : memeChoix ? "Faire ce qui manque" : "Les installer dans la pièce"}
        </button>
      </div>
      {dit && (
        <p role="status" style={{ margin: "0 0 10px" }}>
          {dit}
        </p>
      )}

      {memeChoix && etat?.decor && (
        <div className="cd-versions">
          <figure>
            <figcaption>
              <b>Générées avec la pièce</b> <small>(ton choix : une image par lumière, faite une fois)</small>
            </figcaption>
            <span className="cd-scene" data-version="generee">
              {etat.generee ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="cd-fond" src={etat.generee} alt={`${nomDe(elues[0])} et ${nomDe(elues[1])}, générés dans la pièce`} />
              ) : (
                <span className="cd-attente">Pas encore faite.</span>
              )}
            </span>
          </figure>
          <figure>
            <figcaption>
              <b>Posées sur la pièce</b> <small>(là où la générée les assied, à leur taille)</small>
            </figcaption>
            <span className="cd-scene" data-version="posees">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="cd-fond" src={etat.decor} alt="La pièce, avec les deux figurines posées" />
              {(["a", "b"] as const).map((c, k) => {
                const src = etat.poses[c];
                const places = reglage?.places ?? etat.places;
                return src ? <Posee key={c} src={src} place={places[k]} h={reglage?.h ?? hauteurDuo(etat.places)} cote={c} onGlisser={reglage ? (dx, dy) => glisser(k, dx, dy) : undefined} /> : null;
              })}
              {(!etat.poses.a || !etat.poses.b) && <span className="cd-attente">Les poses ne sont pas encore faites.</span>}
            </span>
            {etat.poses.a && etat.poses.b && laPiece && (
              <span className="cd-reglage">
                {reglage ? (
                  <>
                    <small>
                      Fais glisser chaque figurine sur son siège (ses cuisses sur l’assise, ses pieds devant), puis ajuste leur taille à celle des sièges. Elles sont déjà
                      tournées l’une vers l’autre, de trois quarts, comme les sièges.
                    </small>
                    <span className="cd-chips">
                      <button type="button" onClick={() => grandir(-0.01)} disabled={occupe}>
                        ➖ Plus petites
                      </button>
                      <button type="button" onClick={() => grandir(0.01)} disabled={occupe}>
                        ➕ Plus grandes
                      </button>
                    </span>
                    <span className="cd-chips">
                      <button type="button" className="elue" onClick={() => void enregistrerPlaces()} disabled={occupe}>
                        Enregistrer leurs places
                      </button>
                      <button type="button" onClick={() => setReglage(null)} disabled={occupe}>
                        Annuler
                      </button>
                    </span>
                  </>
                ) : (
                  <span className="cd-chips">
                    <button type="button" onClick={() => setReglage({ places: etat.places.map((p) => ({ ...p })), h: hauteurDuo(etat.places) })} disabled={occupe}>
                      ✋ Ajuster leurs places
                    </button>
                  </span>
                )}
              </span>
            )}
          </figure>
        </div>
      )}

      {memeChoix && (etat?.poses.a || etat?.generee) && (
        <div className="cd-avis">
          <h3 className="cd-titre">3. Ton avis</h3>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Un mot (ce qui cloche, ce qui marche)…" rows={2} />
          <div className="cd-chips">
            {AVIS_COLLAGE.map((a) => (
              <button key={a.cle} type="button" className={etat?.choix?.avis === a.cle ? "elue" : ""} onClick={() => void donnerAvis(a.cle)} disabled={occupe}>
                {a.dit}
              </button>
            ))}
          </div>
          <div className="cd-chips" style={{ marginTop: 8 }}>
            <button type="button" className="clair" disabled={occupe} onClick={() => void refaire("poses")}>
              Refaire les poses (et la générée)
            </button>
            <button type="button" className="clair" disabled={occupe} onClick={() => void refaire("duo")}>
              Refaire la générée
            </button>
          </div>
        </div>
      )}
      <style>{`
.cd-titre{margin:14px 0 8px;font-size:15px}
.cd-maquette{display:inline-block;padding:9px 14px;border-radius:999px;background:#2b1a0c;color:#fff;font-weight:800;font-size:14px;text-decoration:none}
.cd-chips{display:flex;gap:8px;flex-wrap:wrap}
.cd-chips button,.cd-principal{padding:8px 12px;border-radius:999px;border:1px solid #ff2e9a;background:#fff;color:#c2186f;font-weight:700;font-size:13px;cursor:pointer}
.cd-chips button.elue,.cd-principal{background:#ff2e9a;color:#fff}
.cd-principal{padding:10px 16px;font-size:14px;font-weight:800}
.cd-chips button:disabled,.cd-principal:disabled{opacity:.55;cursor:default}
.cd-figurines{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px}
.cd-figurines button{position:relative;display:flex;flex-direction:column;align-items:center;gap:4px;padding:6px;border-radius:12px;border:2px solid #eadfce;background:#fff;cursor:pointer}
.cd-figurines button.elue{border-color:#ff2e9a;box-shadow:0 0 0 2px rgba(255,46,154,.2)}
.cd-figurines img{width:100%;aspect-ratio:2/3;object-fit:contain;background:#f4ece0;border-radius:8px}
.cd-figurines small{font-size:11px;color:#555;text-align:center;line-height:1.2}
.cd-figurines b{position:absolute;top:4px;left:4px;padding:1px 6px;border-radius:999px;background:#ff2e9a;color:#fff;font-size:10px}
.cd-versions{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}
.cd-versions figure{margin:0;display:flex;flex-direction:column;gap:6px}
.cd-versions small{color:#666}
.cd-scene{position:relative;display:block;aspect-ratio:2/3;border-radius:14px;overflow:hidden;background:#2b1a0c}
.cd-scene .cd-fond{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.cd-fig{position:absolute;transform:translateX(-50%)}
.cd-glisse{touch-action:none;cursor:grab;outline:2px dashed #ff2e9a;outline-offset:2px;border-radius:6px}
.cd-reglage{display:flex;flex-direction:column;gap:8px}
.cd-reglage small{color:#555;line-height:1.4}
.cd-fig img{display:block;height:100%;width:auto;filter:drop-shadow(5px 4px 5px rgba(30,15,5,.4)) saturate(.94) sepia(.07)}
.cd-lumiere{position:absolute;inset:0;-webkit-mask-size:100% 100%;mask-size:100% 100%;background:linear-gradient(90deg,rgba(255,196,120,.42),rgba(255,214,160,.08) 55%,rgba(30,15,5,.3));mix-blend-mode:soft-light}
.cd-ombre{position:absolute;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(closest-side,rgba(25,12,0,.5),rgba(25,12,0,0))}
.cd-attente{position:absolute;inset:0;display:grid;place-items:center;padding:20px;text-align:center;color:#fff;background:rgba(0,0,0,.35);font-size:14px}
.cd-avis textarea{width:100%;box-sizing:border-box;padding:8px 10px;border-radius:10px;border:1px solid #e0d3c2;font:inherit;font-size:14px;margin-bottom:8px}
`}</style>
    </section>
  );
}
