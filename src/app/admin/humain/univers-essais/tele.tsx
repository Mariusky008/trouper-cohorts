"use client";

/**
 * 📺 LA TÉLÉ DU DUO : L'ESSAI (`app/univers/tele-duo.tsx`, `lib/direct/tele.ts`) — avant la maquette de la pièce vivante,
 * le propriétaire essaie la télé sur son téléphone, dans une vraie pièce (celles de « 🛋️ La pièce du duo ») : de loin,
 * l'écran montre ce qui passe ; un toucher, la caméra s'approche ; « ▶ Allumer la télé ». Un lien collé ici passe à la
 * télé (YouTube, TikTok, Instagram) ; sans lien, le clip de secours du jour.
 *
 * ✋ L'ÉCRAN À SA PLACE (15 novembre 2026, le propriétaire : « le clip n'est pas aux bonnes dimensions de la télé, il se
 * trouve en dehors ») : l'écran d'une pièce que le modèle qui voit n'a pas trouvé (ou mal) se trace ici, d'un coin à
 * l'autre ; il remplace celui du relevé (les autres zones restent), comme « ✋ Ajuster à la main » plus haut.
 *
 * Et ses clips de secours : la courte liste que la télé passe quand le duo ne s'est encore envoyé aucun lien (une
 * adresse YouTube par ligne, huit au plus).
 */
import { useCallback, useEffect, useState } from "react";
import type { EmplacementsDuo, EtatPiecesDuo, PieceDuoVue } from "@/lib/direct/pieces-duo";
import { programmeDuLien, secoursDuJour, surYouTube, vignetteYouTube, type ClipSecours, type ProgrammeTele, type ZoneTele } from "@/lib/direct/tele";
import { TeleDuo } from "@/app/univers/tele-duo";

const ROUTE = "/api/admin/direct/tele";
/** (une pièce dont la télé n'a pas été relevée : une zone au mur, pour l'essai) */
const ZONE_PAR_DEFAUT: ZoneTele = [0.56, 0.18, 0.3, 0.13];

/** La caméra près de la télé : l'écran au milieu, sur 90 % de la largeur (ou 60 % de la hauteur). */
function pres(z: ZoneTele) {
  const k = Math.min(0.9 / z[2], 0.6 / z[3]);
  const cx = z[0] + z[2] / 2;
  const cy = z[1] + z[3] / 2;
  return `translate(${(0.5 - cx * k) * 100}%, ${(0.45 - cy * k) * 100}%) scale(${k})`;
}

export function TeleDuDuoEssai() {
  const [secours, setSecours] = useState<ClipSecours[]>([]);
  const [texte, setTexte] = useState("");
  const [refuses, setRefuses] = useState<string[]>([]);
  const [dit, setDit] = useState("");
  const [pieces, setPieces] = useState<PieceDuoVue[]>([]);
  const [piece, setPiece] = useState<string>("");
  const [lien, setLien] = useState("");
  const [proche, setProche] = useState(false);
  const [tracer, setTracer] = useState(false);
  const [trace, setTrace] = useState<[number, number, number, number] | null>(null);
  const charger = useCallback(async () => {
    const [t, p] = await Promise.all([
      fetch(ROUTE, { cache: "no-store" }).then((r) => r.json()).catch(() => ({})),
      fetch("/api/admin/direct/pieces-duo", { cache: "no-store" }).then((r) => r.json()).catch(() => ({})),
    ]);
    const s = ((t as { secours?: ClipSecours[] }).secours ?? []) as ClipSecours[];
    setSecours(s);
    setTexte(s.map((c) => surYouTube(c.id, c.debut)).join("\n"));
    const faites = ((p as { etat?: EtatPiecesDuo }).etat?.pieces ?? []).filter((x) => x.decor);
    setPieces(faites);
    setPiece((x) => x || faites[0]?.cle || "");
  }, []);
  useEffect(() => {
    void Promise.resolve().then(charger);
  }, [charger]);

  async function ranger() {
    setDit("");
    const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "secours", liens: texte }) });
    const j = (await r.json().catch(() => ({}))) as { secours?: ClipSecours[]; refuses?: string[]; error?: string };
    setRefuses(j.refuses ?? []);
    if (j.secours) {
      setSecours(j.secours);
      setDit(`Rangée : ${j.secours.length} clip${j.secours.length > 1 ? "s" : ""}.`);
    } else setDit(j.error ?? "La liste n’a pas été rangée.");
  }

  /** ✋ L'écran tracé : il remplace celui du relevé (les autres zones de la pièce restent). */
  async function poserEcran(z: ZoneTele) {
    if (!p) return;
    const emplacements: EmplacementsDuo = { ...(p.emplacements ?? { cadres: [], places: [] }), tele: z };
    const r = await fetch("/api/admin/direct/pieces-duo", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "ajuster", piece: p.cle, emplacements }) });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    setTracer(false);
    setDit(j.error ?? "L’écran de la télé est à sa place.");
    await charger();
  }
  const ou = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const b = (x: number) => Math.min(1, Math.max(0, x));
    return [b((e.clientX - r.left) / r.width), b((e.clientY - r.top) / r.height)] as const;
  };

  const p = pieces.find((x) => x.cle === piece);
  const zone: ZoneTele = (p?.emplacements?.tele as ZoneTele | undefined) ?? ZONE_PAR_DEFAUT;
  const colle = lien.trim() ? programmeDuLien(lien) : null;
  const clip = secoursDuJour(secours, `essai:${new Date().toISOString().slice(0, 10)}`);
  const programme: ProgrammeTele = colle
    ? colle.sorte === "youtube"
      ? { ...colle, apercu: vignetteYouTube(colle.id) }
      : colle
    : clip
      ? { sorte: "secours", ...clip }
      : { sorte: "eteinte" };
  const cleTele = `${piece}|${programme.sorte}|${"id" in programme ? programme.id : "url" in programme ? programme.url : ""}`;

  return (
    <section aria-label="La télé du duo" style={{ margin: "18px 0", padding: 16, border: "1px solid #e3d7c8", borderRadius: 16, background: "#fffaf3" }}>
      <h2 style={{ margin: "0 0 6px", fontSize: 20 }}>📺 La télé du duo : l’essai</h2>
      <p style={{ margin: "0 0 10px", color: "#555", lineHeight: 1.45 }}>
        La télé passe le dernier lien YouTube que vous vous êtes envoyé ; un lien TikTok ou Instagram, son aperçu et « Ouvrir » ; sans lien, un clip de votre
        liste. De loin, l’écran montre ce qui passe ; touche la télé : la caméra s’approche, puis « Allumer la télé » (le son, sur iPhone).
      </p>

      <div className="tvd-essai">
        <div className="tvd-scene" data-proche={proche ? "1" : "0"}>
          <div className="tvd-plan" style={{ transform: proche ? pres(zone) : "none" }}>
            {p?.decor ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="tvd-piece" src={p.decor} alt={p.nom} />
            ) : (
              <span className="tvd-vide">Fais d’abord une pièce, plus haut (« 🛋️ La pièce du duo »).</span>
            )}
            <TeleDuo key={cleTele} programme={programme} secours={secours} zone={zone} proche={proche} onToucher={() => setProche(true)} />
          </div>
          {proche && (
            <button type="button" className="tvd-recul" onClick={() => setProche(false)}>
              ↩ La pièce entière
            </button>
          )}
          {tracer && (
            <span
              className="tvd-tracer"
              style={{ touchAction: "none" }}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                const [x, y] = ou(e);
                setTrace([x, y, x, y]);
              }}
              onPointerMove={(e) => {
                if (!trace) return;
                const [x, y] = ou(e);
                setTrace([trace[0], trace[1], x, y]);
              }}
              onPointerUp={(e) => {
                if (!trace) return;
                const [x, y] = ou(e);
                const z: ZoneTele = [Math.min(trace[0], x), Math.min(trace[1], y), Math.abs(x - trace[0]), Math.abs(y - trace[1])].map((v) => Math.round(v * 1000) / 1000) as ZoneTele;
                setTrace(null);
                if (z[2] < 0.03 || z[3] < 0.02) return setDit("Glisse le doigt d’un coin de l’écran à l’autre.");
                void poserEcran(z);
              }}
            >
              <small>Glisse le doigt sur l’écran de la télé, d’un coin à l’autre</small>
              {trace && (
                <i
                  style={{
                    left: `${Math.min(trace[0], trace[2]) * 100}%`,
                    top: `${Math.min(trace[1], trace[3]) * 100}%`,
                    width: `${Math.abs(trace[2] - trace[0]) * 100}%`,
                    height: `${Math.abs(trace[3] - trace[1]) * 100}%`,
                  }}
                />
              )}
            </span>
          )}
        </div>

        <div className="tvd-outils">
          {pieces.length > 0 && (
            <span className="tvd-pieces" role="radiogroup" aria-label="La pièce">
              {pieces.map((x) => (
                <button key={x.cle} type="button" role="radio" aria-checked={x.cle === piece} data-piece-tele={x.cle} onClick={() => setPiece(x.cle)}>
                  {x.emoji} {x.nom}
                </button>
              ))}
            </span>
          )}
          {p && !p.emplacements?.tele && <small style={{ color: "#8a5a00" }}>L’écran de la télé de cette pièce n’a pas été repéré : place-le, d’un coin à l’autre.</small>}
          {p?.decor && (
            <button
              type="button"
              className="tvd-placer"
              data-geste="placer-ecran"
              onClick={() => {
                setProche(false);
                setDit("");
                setTracer((x) => !x);
              }}
            >
              {tracer ? "Annuler" : p.emplacements?.tele ? "✋ Replacer l’écran de la télé" : "✋ Placer l’écran de la télé"}
            </button>
          )}
          <label className="tvd-champ">
            Un lien à passer (YouTube, TikTok, Instagram) — vide : le clip du jour
            <input type="url" inputMode="url" value={lien} onChange={(e) => setLien(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
          </label>
          {lien.trim() && !colle && <small style={{ color: "#b3261e" }}>Ce lien ne passe pas à la télé (ni YouTube, ni TikTok, ni Instagram).</small>}

          <label className="tvd-champ">
            Les clips de secours (un lien YouTube par ligne, huit au plus)
            <textarea rows={6} value={texte} onChange={(e) => setTexte(e.target.value)} />
          </label>
          <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button type="button" className="tvd-ranger" onClick={() => void ranger()}>
              Ranger la liste
            </button>
            {dit && <small role="status">{dit}</small>}
          </span>
          {refuses.length > 0 && (
            <small style={{ color: "#b3261e" }}>
              Pas des vidéos YouTube, laissées de côté : {refuses.join(" · ")}
            </small>
          )}
          {secours.length > 0 && (
            <span className="tvd-clips">
              {secours.map((c) => (
                <a key={c.id} href={surYouTube(c.id, c.debut)} target="_blank" rel="noopener noreferrer" data-clip={c.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={vignetteYouTube(c.id)} alt="" referrerPolicy="no-referrer" />
                </a>
              ))}
            </span>
          )}
        </div>
      </div>
      <style>{`
.tvd-essai{display:flex;flex-wrap:wrap;gap:14px;align-items:flex-start}
.tvd-scene{position:relative;flex:0 1 380px;width:min(100%,380px);aspect-ratio:2/3;border-radius:14px;overflow:hidden;background:#2b1a0c}
.tvd-plan{position:absolute;inset:0;transform-origin:0 0;transition:transform .7s cubic-bezier(.3,.7,.2,1)}
.tvd-piece{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.tvd-vide{position:absolute;inset:0;display:grid;place-items:center;padding:20px;color:#f3ead9;text-align:center}
.tvd-tracer{position:absolute;inset:0;z-index:5;cursor:crosshair;background:rgba(0,0,0,.18)}
.tvd-tracer small{position:absolute;left:8px;right:8px;top:8px;padding:6px 10px;border-radius:10px;background:rgba(20,20,24,.82);color:#fff;font-size:12.5px;text-align:center}
.tvd-tracer i{position:absolute;border:2px solid #ffd400;background:rgba(255,212,0,.18)}
.tvd-placer{align-self:flex-start;padding:7px 12px;border-radius:999px;border:1px solid #ff2e9a;background:#fff;color:#c2186f;font-weight:800;font-size:13px;cursor:pointer}
.tvd-recul{position:absolute;left:10px;bottom:10px;padding:8px 12px;border:0;border-radius:999px;background:rgba(20,20,24,.82);color:#fff;font-weight:700;font-size:13px;cursor:pointer}
.tvd-outils{flex:1 1 240px;display:flex;flex-direction:column;gap:10px;line-height:1.4}
.tvd-pieces{display:flex;flex-wrap:wrap;gap:5px}
.tvd-pieces button{padding:6px 10px;border-radius:999px;border:1px solid #e3d7c8;background:#fff;font-size:12.5px;cursor:pointer}
.tvd-pieces button[aria-checked="true"]{background:#2b1a0c;color:#fff;border-color:#2b1a0c}
.tvd-champ{display:flex;flex-direction:column;gap:4px;font-size:13px;color:#444}
.tvd-champ input,.tvd-champ textarea{padding:8px 10px;border:1px solid #e3d7c8;border-radius:10px;font:inherit;font-size:14px;background:#fff}
.tvd-ranger{padding:8px 12px;border-radius:999px;border:0;background:#ff2e9a;color:#fff;font-weight:800;font-size:13px;cursor:pointer}
.tvd-clips{display:flex;flex-wrap:wrap;gap:6px}
.tvd-clips img{width:88px;height:50px;object-fit:cover;border-radius:6px;display:block}
`}</style>
    </section>
  );
}
