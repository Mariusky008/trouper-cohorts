"use client";

/**
 * 🛋️ LA PIÈCE DU DUO : L'ESSAI DES CINQ PIÈCES (`lib/direct/pieces-duo-serveur.ts`) — le propriétaire les juge sur son
 * téléphone : le style (chacune sa signature), et si chaque pièce a bien ses emplacements (la télé, la platine, les
 * cadres, l'étagère, la fenêtre, deux places, le coin du chat), dessinés par-dessus une fois relevés.
 *
 * Les pièces refaites (15 novembre 2026) : chacune en trois lumières (matin, soir, nuit — on passe de l'une à l'autre
 * sous l'image) ; ce qui gênerait le doigt est signalé (deux objets qui se chevauchent, un objet trop petit, deux places
 * trop loin) ; « ✋ Ajuster à la main » : on trace soi-même chaque zone sur l'image (plus sûr que le modèle qui voit, pour
 * cinq images faites une fois).
 *
 * 🏠 LE LOT M0 (`docs/univers/ma-maison.md`, 2) : neuf pièces, refaites avec les éléments de la maquette du salon (celles
 * d'avant sont signalées « ancienne consigne », et se refont d'un bouton) ; la chambre musicale, d'après l'image que le
 * propriétaire dépose ici ; et « 🌅 Les pièces en largeur » : le panorama de chaque pièce (la maison de chacun), qu'on fait
 * glisser au doigt, en trois lumières, ses zones posées à la main (la place : le centre).
 */
import { useCallback, useEffect, useRef, useState, type PointerEvent as PointerEvenement } from "react";
import {
  COUT_PIECE_ENTIERE,
  EMPLACEMENTS_DITS,
  MOMENTS_DUO,
  PARTIES_LARGE,
  PIECES_DUO,
  RATIO_LARGE,
  ZONE_MIN_LARGE,
  alertesEmplacements,
  lumieresAFaire,
  type EmplacementsDuo,
  type EtatPiecesDuo,
  type MomentDuo,
  type PieceDuoVue,
  type PlaceDuo,
  type Zone,
} from "@/lib/direct/pieces-duo";

const ROUTE = "/api/admin/direct/pieces-duo";
const euros = (n: number) => n.toFixed(2).replace(".", ",");
/** (une figurine assise : à peu près 0,8 fois aussi large que haute ; l'image est une fois et demie plus haute que large) */
const LARGEUR_ASSISE = 0.8;

function Boite({ z, emoji, active }: { z: Zone; emoji: string; active?: boolean }) {
  return (
    <span
      className={`pd-boite${active ? " active" : ""}`}
      style={{ left: `${z[0] * 100}%`, top: `${z[1] * 100}%`, width: `${z[2] * 100}%`, height: `${z[3] * 100}%` }}
      aria-hidden="true"
    >
      <i>{emoji}</i>
    </span>
  );
}

/** Une place : le point où la figurine touche son siège, et la silhouette de sa taille assise (pour juger). `ratio` : la hauteur de l'image sur sa largeur. */
function Place({ q, active, ratio }: { q: PlaceDuo; active?: boolean; ratio: number }) {
  const l = q.hauteur * LARGEUR_ASSISE * ratio;
  return (
    <>
      <span
        className={`pd-silhouette${active ? " active" : ""}`}
        style={{ left: `${(q.x - l / 2) * 100}%`, top: `${(q.y - q.hauteur) * 100}%`, width: `${l * 100}%`, height: `${q.hauteur * 100}%` }}
        aria-hidden="true"
      />
      <span className="pd-point place" style={{ left: `${q.x * 100}%`, top: `${q.y * 100}%` }} aria-hidden="true">
        🪑
      </span>
    </>
  );
}

function Calque({ e, cible, ratio = 1.5 }: { e: EmplacementsDuo; cible?: Cible; ratio?: number }) {
  return (
    <>
      {e.table && <Boite z={e.table} emoji={EMPLACEMENTS_DITS.table.emoji} active={cible === "table"} />}
      {(e.lampes ?? []).map((z, k) => (
        <Boite key={`l${k}`} z={z} emoji={EMPLACEMENTS_DITS.lampes.emoji} active={cible === `lampe${k}`} />
      ))}
      {e.fenetre && <Boite z={e.fenetre} emoji={EMPLACEMENTS_DITS.fenetre.emoji} active={cible === "fenetre"} />}
      {e.tele && <Boite z={e.tele} emoji={EMPLACEMENTS_DITS.tele.emoji} active={cible === "tele"} />}
      {e.platine && <Boite z={e.platine} emoji={EMPLACEMENTS_DITS.platine.emoji} active={cible === "platine"} />}
      {e.cadres.map((z, k) => (
        <Boite key={k} z={z} emoji={EMPLACEMENTS_DITS.cadres.emoji} active={cible === `cadre${k}`} />
      ))}
      {e.etagere && <Boite z={e.etagere} emoji={EMPLACEMENTS_DITS.etagere.emoji} active={cible === "etagere"} />}
      {e.places.map((q, k) => (
        <Place key={k} q={q} active={cible === `place${k}`} ratio={ratio} />
      ))}
      {e.chat && (
        <span className={`pd-point${cible === "chat" ? " active" : ""}`} style={{ left: `${e.chat.x * 100}%`, top: `${e.chat.y * 100}%` }} aria-hidden="true">
          🐾
        </span>
      )}
    </>
  );
}

// ─── ✋ AJUSTER À LA MAIN ───────────────────────────────────────────────────────────────────────────────────────────────
type Cible = "tele" | "platine" | "cadre0" | "cadre1" | "cadre2" | "etagere" | "fenetre" | "table" | "lampe0" | "lampe1" | "place0" | "place1" | "chat";
const CIBLES: { cle: Cible; emoji: string; nom: string }[] = [
  { cle: "tele", emoji: "📺", nom: "L’écran de la télé" },
  { cle: "platine", emoji: "🎵", nom: "La platine" },
  { cle: "cadre0", emoji: "🖼️", nom: "Le cadre 1 (l’intérieur)" },
  { cle: "cadre1", emoji: "🖼️", nom: "Le cadre 2 (l’intérieur)" },
  { cle: "cadre2", emoji: "🖼️", nom: "Le cadre 3 (l’intérieur)" },
  { cle: "etagere", emoji: "📚", nom: "L’étagère" },
  { cle: "fenetre", emoji: "🪟", nom: "La fenêtre" },
  { cle: "table", emoji: "☕", nom: "La table basse" },
  { cle: "lampe0", emoji: "💡", nom: "La lampe 1" },
  { cle: "lampe1", emoji: "💡", nom: "La lampe 2" },
  { cle: "place0", emoji: "🪑", nom: "La place de gauche" },
  { cle: "place1", emoji: "🪑", nom: "La place de droite" },
  { cle: "chat", emoji: "🐾", nom: "Le coin du chat" },
];
/** (en largeur : une seule place, le centre) */
const CIBLES_LARGE = CIBLES.filter((c) => c.cle !== "place1").map((c) => (c.cle === "place0" ? { ...c, nom: "Le centre (sa figurine)" } : c));
const estCadre = (c: Cible): c is "cadre0" | "cadre1" | "cadre2" => c === "cadre0" || c === "cadre1" || c === "cadre2";
const estLampe = (c: Cible): c is "lampe0" | "lampe1" => c === "lampe0" || c === "lampe1";
const borne = (x: number) => Math.min(1, Math.max(0, x));
const arrondi = (x: number) => Math.round(x * 1000) / 1000;

function aDeja(e: EmplacementsDuo, c: Cible): boolean {
  if (estCadre(c)) return Boolean(e.cadres[Number(c.slice(-1))]);
  if (estLampe(c)) return Boolean(e.lampes?.[Number(c.slice(-1))]);
  if (c === "place0" || c === "place1") return Boolean(e.places[Number(c.slice(-1))]);
  return Boolean(e[c]);
}

/** Pose un tracé (un rectangle, ou un point pour le chat) sur l'emplacement visé. */
function poser(e: EmplacementsDuo, c: Cible, x1: number, y1: number, x2: number, y2: number): EmplacementsDuo | string {
  const [a, b, l, h] = [Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1)].map(arrondi);
  if (c === "chat") return { ...e, chat: { x: arrondi(x2), y: arrondi(y2) } };
  if (c === "place0" || c === "place1") {
    if (h < 0.08) return "Trace la figurine assise plus grande : du haut de sa tête jusqu’à ses pieds.";
    const k = Number(c.slice(-1));
    const places = [...e.places];
    places[k] = { x: arrondi(a + l / 2), y: arrondi(b + h), hauteur: Math.min(0.6, h) };
    // (la place de gauche d'abord)
    return { ...e, places: places.filter(Boolean).sort((p, q) => p.x - q.x) };
  }
  if (l < 0.015 || h < 0.015) return "Glisse le doigt pour tracer un rectangle.";
  const z: Zone = [a, b, l, h];
  if (estCadre(c)) {
    const cadres = [...e.cadres];
    cadres[Math.min(Number(c.slice(-1)), cadres.length)] = z;
    return { ...e, cadres };
  }
  if (estLampe(c)) {
    const lampes = [...(e.lampes ?? [])];
    lampes[Math.min(Number(c.slice(-1)), lampes.length)] = z;
    return { ...e, lampes };
  }
  // (l'écran retracé en rectangle : ses quatre coins posés à la main ne valent plus)
  if (c === "tele") {
    const { teleCoins: _, ...reste } = e;
    void _;
    return { ...reste, tele: z };
  }
  return { ...e, [c]: z };
}

function effacer(e: EmplacementsDuo, c: Cible): EmplacementsDuo {
  if (estCadre(c)) return { ...e, cadres: e.cadres.filter((_, k) => k !== Number(c.slice(-1))) };
  if (estLampe(c)) return { ...e, lampes: (e.lampes ?? []).filter((_, k) => k !== Number(c.slice(-1))) };
  if (c === "place0" || c === "place1") return { ...e, places: e.places.filter((_, k) => k !== Number(c.slice(-1))) };
  const f = { ...e };
  delete f[c];
  if (c === "tele") delete f.teleCoins;
  return f;
}

function Ajusteur({
  p,
  src,
  large,
  enregistrer,
  fermer,
}: {
  p: PieceDuoVue;
  src: string;
  /** 🌅 sur le panorama (une seule place : le centre) */
  large?: boolean;
  enregistrer: (e: EmplacementsDuo) => Promise<string | null>;
  fermer: () => void;
}) {
  const cibles = large ? CIBLES_LARGE : CIBLES;
  const [e, setE] = useState<EmplacementsDuo>(() => (large ? p.large.emplacements : p.emplacements) ?? { cadres: [], places: [] });
  const [cible, setCible] = useState<Cible>("tele");
  const defile = useRef<HTMLSpanElement>(null);
  const [trace, setTrace] = useState<[number, number, number, number] | null>(null);
  const [dit, setDit] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const cadre = useRef<HTMLSpanElement>(null);
  const ou = (ev: PointerEvenement) => {
    const r = cadre.current!.getBoundingClientRect();
    return [borne((ev.clientX - r.left) / r.width), borne((ev.clientY - r.top) / r.height)] as const;
  };
  const alertes = alertesEmplacements(e, large ? ZONE_MIN_LARGE : undefined);
  const consigne =
    cible === "chat"
      ? "Touche l’endroit où le chat se couche."
      : cible.startsWith("place")
        ? "Trace la figurine assise entière, dans son fauteuil : du haut de sa tête jusqu’au sol (sa largeur ne compte pas)."
        : "Glisse le doigt sur l’image pour tracer la zone.";
  const image = (
      <span
        ref={cadre}
        className={large ? "pd-image panorama" : "pd-image grande"}
        style={{ touchAction: "none" }}
        onPointerDown={(ev) => {
          ev.currentTarget.setPointerCapture(ev.pointerId);
          const [x, y] = ou(ev);
          setTrace([x, y, x, y]);
          setDit("");
        }}
        onPointerMove={(ev) => {
          if (!trace) return;
          const [x, y] = ou(ev);
          setTrace([trace[0], trace[1], x, y]);
        }}
        onPointerUp={(ev) => {
          if (!trace) return;
          const [x, y] = ou(ev);
          const r = poser(e, cible, trace[0], trace[1], x, y);
          setTrace(null);
          if (typeof r === "string") return setDit(r);
          setE(r);
          // (la suivante qui manque)
          const i = cibles.findIndex((c) => c.cle === cible);
          const suivante = [...cibles.slice(i + 1), ...cibles.slice(0, i)].find((c) => !aDeja(r, c.cle));
          if (suivante) setCible(suivante.cle);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={p.nom} draggable={false} />
        <Calque e={e} cible={cible} ratio={large ? 1 / RATIO_LARGE : 1.5} />
        {trace && cible !== "chat" && (
          <span
            className="pd-trace"
            style={{
              left: `${Math.min(trace[0], trace[2]) * 100}%`,
              top: `${Math.min(trace[1], trace[3]) * 100}%`,
              width: `${Math.abs(trace[2] - trace[0]) * 100}%`,
              height: `${Math.abs(trace[3] - trace[1]) * 100}%`,
            }}
            aria-hidden="true"
          />
        )}
      </span>
  );
  return (
    <div className={`pd-ajuste${large ? " large" : ""}`}>
      {large ? (
        <span className="pd-defile-bloc">
          <span ref={defile} className="pd-defile">
            {image}
          </span>
          {/* (sur un téléphone, le doigt trace : on fait défiler le panorama avec ce curseur) */}
          <input
            type="range"
            min={0}
            max={100}
            defaultValue={0}
            aria-label="Faire défiler le panorama"
            onChange={(ev) => {
              const d = defile.current;
              if (d) d.scrollLeft = ((d.scrollWidth - d.clientWidth) * Number(ev.target.value)) / 100;
            }}
          />
        </span>
      ) : (
        image
      )}
      <div className="pd-outils">
        <b>
          ✋ {p.emoji} {p.nom} {large ? "en largeur" : ""} : à la main
        </b>
        <span className="pd-cibles" role="radiogroup" aria-label="Que tracer ?">
          {cibles.map((c) => (
            <button key={c.cle} type="button" role="radio" aria-checked={cible === c.cle} data-cible={c.cle} className={cible === c.cle ? "choisie" : ""} onClick={() => setCible(c.cle)}>
              {c.emoji} {c.nom} {aDeja(e, c.cle) ? "✓" : ""}
            </button>
          ))}
        </span>
        <small>{consigne}</small>
        {dit && <small className="pd-rate">{dit}</small>}
        {alertes.length > 0 && (
          <ul className="pd-alertes">
            {alertes.map((a) => (
              <li key={a}>⚠️ {a}</li>
            ))}
          </ul>
        )}
        <span className="pd-gestes">
          <button
            type="button"
            disabled={envoi}
            onClick={async () => {
              setEnvoi(true);
              const erreur = await enregistrer(e);
              setEnvoi(false);
              if (erreur) setDit(erreur);
              else fermer();
            }}
          >
            {envoi ? "…" : "Enregistrer"}
          </button>
          <button type="button" className="clair" disabled={!aDeja(e, cible)} onClick={() => setE(effacer(e, cible))}>
            Effacer cette zone
          </button>
          <button type="button" className="clair" onClick={fermer}>
            Annuler
          </button>
        </span>
      </div>
    </div>
  );
}

// ─── UNE PIÈCE ─────────────────────────────────────────────────────────────────────────────────────────────────────────
/** 🖼️ (la chambre musicale) l'image choisie, réduite dans le téléphone (2048 px au plus), en adresse `data:` */
async function reduire(f: File): Promise<string> {
  const b = await createImageBitmap(f);
  const k = Math.min(1, 2048 / Math.max(b.width, b.height));
  const c = document.createElement("canvas");
  c.width = Math.round(b.width * k);
  c.height = Math.round(b.height * k);
  c.getContext("2d")!.drawImage(b, 0, 0, c.width, c.height);
  b.close();
  return c.toDataURL("image/jpeg", 0.92);
}

function Piece({
  p,
  voir,
  occupe,
  faire,
  refaire,
  ajuster,
  deposer,
}: {
  p: PieceDuoVue;
  voir: boolean;
  occupe: boolean;
  faire: () => void;
  refaire: (quoi: "piece" | "releve" | "lumieres") => void;
  ajuster: (e: EmplacementsDuo) => Promise<string | null>;
  deposer: (image: string) => void;
}) {
  const [vue, setVue] = useState<MomentDuo>(p.moment);
  const [main, setMain] = useState(false);
  const e = p.emplacements;
  const trouves = e
    ? [e.tele && "tele", e.platine && "platine", e.cadres.length && "cadres", e.etagere && "etagere", e.fenetre && "fenetre", e.places.length === 2 && "places", e.chat && "chat", e.table && "table", e.lampes?.length && "lampes"].filter(Boolean)
    : [];
  const src = vue === p.moment ? p.decor : (p.lumieres[vue] ?? p.decor);
  const lumieresFaites = lumieresAFaire(p.cle).every((m) => p.lumieres[m]);
  const attend = p.depuisImage && !p.source;
  const prochaine = attend ? "" : !p.decor ? "Faire la pièce" : !e && !p.releveRate ? "Relever ses emplacements" : !lumieresFaites ? "Faire ses lumières" : "";
  if (main && p.decor && src) return <Ajusteur p={p} src={src} enregistrer={ajuster} fermer={() => setMain(false)} />;
  return (
    <figure className="pd-piece" data-piece={p.cle}>
      <span className="pd-image">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={p.nom} data-moment={vue} />
        ) : p.source ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.source} alt="L’image déposée" data-source="1" style={{ objectFit: "contain" }} />
        ) : (
          <span className="pd-vide">{p.emoji}</span>
        )}
        {voir && e && <Calque e={e} />}
        {p.ancienne && <span className="pd-ancienne">ancienne consigne</span>}
      </span>
      {p.decor && (
        <span className="pd-moments" role="radiogroup" aria-label="La lumière">
          {MOMENTS_DUO.map((m) => {
            const la = m.cle === p.moment || Boolean(p.lumieres[m.cle]);
            return (
              <button key={m.cle} type="button" role="radio" aria-checked={vue === m.cle} data-moment={m.cle} disabled={!la} onClick={() => setVue(m.cle)}>
                {m.emoji} {m.nom}
              </button>
            );
          })}
        </span>
      )}
      <figcaption>
        <b>
          {p.emoji} {p.nom}
        </b>{" "}
        <small>{p.pour}</small>
        {p.ancienne && <span className="pd-rate">Faite avec l’ancienne consigne : à refaire, avec les éléments de la maquette.</span>}
        {attend && <span className="pd-rate">Dépose d’abord l’image de la chambre (elle n’est pas dans le code) : la personne sera retirée, une télé ajoutée.</span>}
        {p.decor && e && (
          <span className="pd-trouves">
            Emplacements {p.ajuste ? "posés à la main" : "trouvés"} : {trouves.length}/9
          </span>
        )}
        {p.releveRate && <span className="pd-rate">Relevé raté : {p.releveRate}</span>}
        {p.alertes.length > 0 && (
          <ul className="pd-alertes">
            {p.alertes.map((a) => (
              <li key={a}>⚠️ {a}</li>
            ))}
          </ul>
        )}
        <span className="pd-gestes">
          {prochaine && (
            <button type="button" disabled={occupe} onClick={faire}>
              {occupe ? "… (une minute)" : prochaine}
            </button>
          )}
          {p.depuisImage && (
            <label className={`pd-depot${occupe ? " eteint" : ""}`}>
              🖼️ {p.source ? "Changer l’image" : "Déposer l’image"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                disabled={occupe}
                data-geste="deposer"
                onChange={async (ev) => {
                  const f = ev.target.files?.[0];
                  ev.target.value = "";
                  if (!f) return;
                  if (p.decor && !window.confirm("Changer l’image efface la chambre faite (en hauteur et en largeur) : elle se refera d’après la nouvelle. Continuer ?")) return;
                  deposer(await reduire(f));
                }}
              />
            </label>
          )}
          {p.decor && (
            <button type="button" className="clair" data-geste="ajuster" disabled={occupe} onClick={() => setMain(true)}>
              ✋ Ajuster à la main
            </button>
          )}
          {p.decor && (
            <button type="button" className="clair" disabled={occupe} onClick={() => refaire("piece")}>
              Refaire la pièce
            </button>
          )}
          {p.decor && (e || p.releveRate) && (
            <button type="button" className="clair" disabled={occupe} onClick={() => refaire("releve")}>
              Refaire le relevé
            </button>
          )}
          {Object.keys(p.lumieres).length > 0 && (
            <button type="button" className="clair" disabled={occupe} onClick={() => refaire("lumieres")}>
              Refaire les lumières
            </button>
          )}
        </span>
      </figcaption>
    </figure>
  );
}

// ─── 🌅 UNE PIÈCE EN LARGEUR ───────────────────────────────────────────────────────────────────────────────────────────
type QuoiLarge = "tout" | "centre" | "gauche" | "droite" | "panorama" | "lumieres" | "releve";
const NOMS_ETAPES: Record<string, string> = { centre: "le centre", gauche: "la gauche", droite: "la droite", panorama: "le panorama" };
/** « le centre », « la gauche (soir) »… */
const nomEtape = (e: string) => {
  const [x, m] = e.split("-");
  return `${NOMS_ETAPES[x] ?? x}${m ? ` (${MOMENTS_DUO.find((y) => y.cle === m)?.nom.toLowerCase() ?? m})` : ""}`;
};

function Largeur({
  p,
  voir,
  occupe,
  faire,
  refaire,
  ajuster,
}: {
  p: PieceDuoVue;
  voir: boolean;
  occupe: boolean;
  faire: () => void;
  refaire: (quoi: QuoiLarge) => void;
  ajuster: (e: EmplacementsDuo) => Promise<string | null>;
}) {
  const [vue, setVue] = useState<MomentDuo>(p.moment);
  const [main, setMain] = useState(false);
  const L = p.large;
  const principal = L.panoramas[p.moment];
  const pano = L.panoramas[vue] ?? principal;
  const total = L.faites.length + L.aFaire.length;
  const prochaine = L.aFaire[0];
  if (main && principal) return <Ajusteur p={p} src={principal} large enregistrer={ajuster} fermer={() => setMain(false)} />;
  return (
    <figure className="pd-large" data-large={p.cle}>
      <figcaption>
        <b>
          {p.emoji} {p.nom}
        </b>{" "}
        <small>
          {L.faites.length}/{total} étapes{L.ajuste ? " · zones posées à la main" : ""}
        </small>
      </figcaption>
      {pano ? (
        <span className="pd-defile">
          <span className="pd-image panorama">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pano} alt={`${p.nom}, en largeur`} data-moment={vue} />
            {voir && L.emplacements && <Calque e={L.emplacements} ratio={1 / RATIO_LARGE} />}
          </span>
        </span>
      ) : Object.keys(L.parties).length ? (
        <span className="pd-parties">
          {(["gauche", "centre", "droite"] as const).map((x) =>
            L.parties[x] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={x} src={L.parties[x]} alt={NOMS_ETAPES[x]} data-partie={x} />
            ) : (
              <span key={x} className="pd-partie-vide">
                {NOMS_ETAPES[x]}
              </span>
            ),
          )}
        </span>
      ) : (
        <span className="pd-large-vide">{p.decor ? "Pas encore faite." : "D’abord la pièce en hauteur."}</span>
      )}
      {principal && (
        <span className="pd-moments" role="radiogroup" aria-label="La lumière, en largeur">
          {MOMENTS_DUO.map((m) => (
            <button key={m.cle} type="button" role="radio" aria-checked={vue === m.cle} data-moment={m.cle} disabled={!L.panoramas[m.cle]} onClick={() => setVue(m.cle)}>
              {m.emoji} {m.nom}
            </button>
          ))}
        </span>
      )}
      {L.alertes.length > 0 && (
        <ul className="pd-alertes">
          {L.alertes.map((a) => (
            <li key={a}>⚠️ {a}</li>
          ))}
        </ul>
      )}
      <span className="pd-gestes">
        {prochaine && p.decor && (
          <button type="button" data-geste="largeur" disabled={occupe} onClick={faire}>
            {occupe ? "… (une minute)" : `Faire ${nomEtape(prochaine)}`}
          </button>
        )}
        {principal && (
          <button type="button" className="clair" data-geste="ajuster-largeur" disabled={occupe} onClick={() => setMain(true)}>
            ✋ Ajuster à la main
          </button>
        )}
        {L.faites.length > 0 && (
          <button type="button" className="clair" disabled={occupe} onClick={() => refaire("tout")}>
            Refaire la largeur
          </button>
        )}
        {(["gauche", "droite"] as const).map(
          (c) =>
            L.faites.includes(c) && (
              <button key={c} type="button" className="clair" disabled={occupe} onClick={() => refaire(c)}>
                Refaire {NOMS_ETAPES[c]}
              </button>
            ),
        )}
        {L.faites.some((x) => x.includes("-")) && (
          <button type="button" className="clair" disabled={occupe} onClick={() => refaire("lumieres")}>
            Refaire ses lumières
          </button>
        )}
        {L.emplacements && (
          <button type="button" className="clair" disabled={occupe} onClick={() => refaire("releve")}>
            Effacer ses zones
          </button>
        )}
      </span>
    </figure>
  );
}

export function PiecesDuDuo() {
  const [etat, setEtat] = useState<EtatPiecesDuo | null>(null);
  const [occupe, setOccupe] = useState<string | null>(null);
  const [dit, setDit] = useState("");
  const [voir, setVoir] = useState(true);
  const charger = useCallback(async () => {
    const j = (await (await fetch(ROUTE, { cache: "no-store" })).json().catch(() => ({}))) as { etat?: EtatPiecesDuo; error?: string };
    if (j.etat) setEtat(j.etat);
    else setDit(j.error || "La page ne s’est pas chargée.");
  }, []);
  useEffect(() => {
    void Promise.resolve().then(charger);
  }, [charger]);
  async function envoyer(corps: Record<string, unknown>) {
    const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
    const j = (await r.json().catch(() => ({}))) as { etat?: EtatPiecesDuo; error?: string; fait?: string };
    if (j.etat) setEtat(j.etat);
    return j;
  }
  /** Un passage sur une pièce (en hauteur : la pièce, son relevé, ses lumières ; en largeur : une étape) ; `false` s'il a raté. */
  async function mener(piece: string, action: "fabriquer" | "fabriquerLargeur" = "fabriquer"): Promise<boolean> {
    setOccupe(piece);
    const j = await envoyer({ action, piece });
    if (j.error) {
      setDit(j.error);
      return false;
    }
    return true;
  }
  async function faire(piece: string, action: "fabriquer" | "fabriquerLargeur" = "fabriquer") {
    setDit("");
    try {
      await mener(piece, action);
    } finally {
      setOccupe(null);
    }
  }
  const lire = async () => ((await (await fetch(ROUTE, { cache: "no-store" })).json().catch(() => ({}))) as { etat?: EtatPiecesDuo }).etat;
  async function toutFaire() {
    setDit("");
    let attend = false;
    try {
      for (const p of PIECES_DUO) {
        // EN HAUTEUR : quatre passages au plus (la pièce, son relevé, ses deux autres lumières)
        for (let k = 0; k < 4; k++) {
          const v = (await lire())?.pieces.find((x) => x.cle === p.cle);
          if (v?.depuisImage && !v.source) {
            attend = true;
            break;
          }
          if (v?.decor && (v.emplacements || v.releveRate) && lumieresAFaire(p.cle).every((m) => v.lumieres?.[m])) break;
          if (!(await mener(p.cle)) && !v?.decor) return;
        }
        // EN LARGEUR : une étape par passage (le centre, la gauche, la droite, le panorama, puis ses deux autres lumières)
        for (let k = 0; k < 4 * 3; k++) {
          const v = (await lire())?.pieces.find((x) => x.cle === p.cle);
          if (!v?.decor || !v.large.aFaire.length) break;
          if (!(await mener(p.cle, "fabriquerLargeur"))) return;
        }
      }
      setDit(`Toutes les pièces sont faites, en hauteur et en largeur, en trois lumières${attend ? " (sauf la chambre musicale, qui attend son image)" : ""} : regarde-les sur ton téléphone, et pose leurs zones à la main.`);
    } finally {
      setOccupe(null);
    }
  }
  async function refaireAnciennes() {
    const anciennes = etat?.pieces.filter((p) => p.ancienne) ?? [];
    if (!anciennes.length) return;
    const ok = window.confirm(
      `Refaire les ${anciennes.length} pièces faites avec l’ancienne consigne (${anciennes.map((p) => p.nom).join(", ")}) ? Leurs images et leurs zones s’effacent, puis tout se refait avec les éléments de la maquette, en hauteur et en largeur (environ ${euros(anciennes.length * COUT_PIECE_ENTIERE)} €, garde la page ouverte).`,
    );
    if (!ok) return;
    setDit("");
    for (const p of anciennes) await envoyer({ action: "refaire", piece: p.cle, quoi: "piece" });
    await toutFaire();
  }
  async function refaire(piece: string, quoi: "piece" | "releve" | "lumieres") {
    setDit("");
    await envoyer({ action: "refaire", piece, quoi });
  }
  async function refaireLargeur(piece: string, quoi: QuoiLarge) {
    setDit("");
    await envoyer({ action: "refaireLargeur", piece, quoi });
  }
  async function ajuster(piece: string, emplacements: EmplacementsDuo, action: "ajuster" | "ajusterLargeur" = "ajuster"): Promise<string | null> {
    const j = await envoyer({ action, piece, emplacements });
    return j.error ?? null;
  }
  async function deposer(piece: string, image: string) {
    setDit("");
    setOccupe(piece);
    try {
      const j = await envoyer({ action: "deposerSource", piece, image });
      setDit(j.error ?? "L’image est déposée : fais la pièce (« Faire la pièce »).");
    } finally {
      setOccupe(null);
    }
  }
  const faites = etat?.pieces.filter((p) => p.decor).length ?? 0;
  const anciennes = etat?.pieces.filter((p) => p.ancienne).length ?? 0;
  const bloque = (cle: string) => occupe === cle || (Boolean(occupe) && occupe !== cle);
  return (
    <section aria-label="La pièce du duo" style={{ margin: "18px 0", padding: 16, border: "1px solid #e3d7c8", borderRadius: 16, background: "#fffaf3" }}>
      <h2 style={{ margin: "0 0 6px", fontSize: 20 }}>🛋️ Les neuf pièces : en hauteur (le salon du duo) et en largeur (la maison)</h2>
      <p style={{ margin: "0 0 10px", color: "#555", lineHeight: 1.45 }}>
        Le même catalogue pour tous. Chaque pièce a les éléments de la maquette du salon : la télé, la platine, trois cadres vides, l’étagère vide, la fenêtre et
        son ciel, deux lampes, la table basse, le coin du chat, et des places libres (la figurine vient avec son fauteuil) — deux en hauteur, une au centre en
        largeur. Chacune existe le matin, le soir et la nuit. Faites une fois pour tous, environ {euros(COUT_PIECE_ENTIERE)} € la pièce (en hauteur et en largeur,
        trois lumières). Juge le style, puis trace les emplacements à la main.
      </p>
      {etat && !etat.moteurs.image && <p style={{ color: "#b3261e" }}>Le moteur d’image n’est pas branché ici.</p>}
      {etat && !etat.moteurs.regard && <p style={{ color: "#8a5a00" }}>Le modèle qui voit n’est pas branché ici : les emplacements ne seront pas relevés (les pièces, si).</p>}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", margin: "0 0 12px" }}>
        <button type="button" className="pd-principal" disabled={Boolean(occupe)} onClick={() => void toutFaire()}>
          {occupe ? "… (garde la page ouverte)" : faites ? "Faire ce qui manque" : "Faire toutes les pièces"}
        </button>
        {anciennes > 0 && (
          <button type="button" className="pd-principal clair" data-geste="anciennes" disabled={Boolean(occupe)} onClick={() => void refaireAnciennes()}>
            {anciennes === 1 ? "Refaire l’ancienne" : `Refaire les ${anciennes} anciennes`}
          </button>
        )}
        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input type="checkbox" checked={voir} onChange={(e) => setVoir(e.target.checked)} /> Voir les emplacements
        </label>
      </div>
      {dit && (
        <p role="status" style={{ margin: "0 0 10px" }}>
          {dit}
        </p>
      )}
      <div className="pd-grille">
        {etat?.pieces.map((p) => (
          <Piece
            key={p.cle}
            p={p}
            voir={voir}
            occupe={bloque(p.cle)}
            faire={() => void faire(p.cle)}
            refaire={(q) => void refaire(p.cle, q)}
            ajuster={(e) => ajuster(p.cle, e)}
            deposer={(image) => void deposer(p.cle, image)}
          />
        ))}
      </div>
      <h3 style={{ margin: "22px 0 6px", fontSize: 18 }}>🌅 Les pièces en largeur (la maison de chacun)</h3>
      <p style={{ margin: "0 0 10px", color: "#555", lineHeight: 1.45 }}>
        La même pièce, « tout autour » : un panorama ({PARTIES_LARGE.length} images du moteur, assemblées), fait d’après la pièce en hauteur, une place libre au
        centre. Fais-le glisser au doigt. Ses zones se posent à la main ; la place, c’est le centre (la figurine dans son fauteuil, de la tête au sol).
      </p>
      <div className="pd-larges">
        {etat?.pieces.map((p) => (
          <Largeur
            key={p.cle}
            p={p}
            voir={voir}
            occupe={bloque(p.cle)}
            faire={() => void faire(p.cle, "fabriquerLargeur")}
            refaire={(q) => void refaireLargeur(p.cle, q)}
            ajuster={(e) => ajuster(p.cle, e, "ajusterLargeur")}
          />
        ))}
      </div>
      <style>{`
.pd-grille{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px}
.pd-piece{margin:0;display:flex;flex-direction:column;gap:6px}
.pd-image{position:relative;display:block;aspect-ratio:2/3;border-radius:14px;overflow:hidden;background:#2b1a0c}
.pd-image img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;user-select:none;-webkit-user-drag:none}
.pd-vide{position:absolute;inset:0;display:grid;place-items:center;font-size:54px;opacity:.5}
.pd-ancienne{position:absolute;left:8px;top:8px;padding:3px 8px;border-radius:999px;background:#b3261e;color:#fff;font-size:11.5px;font-weight:800}
.pd-boite{position:absolute;border:2px solid #ff2e9a;border-radius:6px;background:rgba(255,46,154,.12);pointer-events:none}
.pd-boite i{position:absolute;left:-2px;top:-2px;transform:translateY(-100%);padding:0 4px;border-radius:6px 6px 6px 0;background:#ff2e9a;font-style:normal;font-size:12px}
.pd-boite.active{border-color:#ffd400;background:rgba(255,212,0,.2)}
.pd-silhouette{position:absolute;border:2px dashed rgba(255,255,255,.85);border-radius:40% 40% 10px 10px;background:rgba(255,255,255,.1);pointer-events:none}
.pd-silhouette.active{border-color:#ffd400}
.pd-point{position:absolute;transform:translate(-50%,-50%);display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 0 0 2px #ff2e9a;font-size:13px;pointer-events:none}
.pd-point.active{box-shadow:0 0 0 3px #ffd400}
.pd-trace{position:absolute;border:2px solid #ffd400;background:rgba(255,212,0,.18);pointer-events:none}
.pd-moments{display:flex;gap:4px}
.pd-moments button{flex:1;padding:5px 4px;border-radius:999px;border:1px solid #e3d7c8;background:#fff;font-size:12px;cursor:pointer}
.pd-moments button[aria-checked="true"]{background:#2b1a0c;color:#fff;border-color:#2b1a0c}
.pd-moments button:disabled{opacity:.4;cursor:default}
.pd-piece figcaption,.pd-large figcaption{display:flex;flex-direction:column;gap:3px;line-height:1.35}
.pd-piece small,.pd-large small{color:#666}
.pd-trouves{font-size:13px;color:#2d6a2d}
.pd-rate{font-size:13px;color:#b3261e}
.pd-alertes{margin:2px 0 0;padding:0;list-style:none;font-size:12.5px;color:#8a5a00;display:flex;flex-direction:column;gap:2px}
.pd-gestes{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px}
.pd-gestes button,.pd-principal,.pd-depot{padding:8px 12px;border-radius:999px;border:0;background:#ff2e9a;color:#fff;font-weight:800;font-size:13px;cursor:pointer}
.pd-principal{padding:10px 16px;font-size:14px}
.pd-gestes button.clair,.pd-principal.clair{border:1px solid #ff2e9a;background:#fff;color:#c2186f}
.pd-gestes button:disabled,.pd-principal:disabled{opacity:.6;cursor:default}
.pd-depot{display:inline-flex;align-items:center;background:#2b1a0c}
.pd-depot.eteint{opacity:.6;pointer-events:none}
.pd-ajuste{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:14px;align-items:flex-start}
.pd-image.grande{flex:0 1 420px;width:min(100%,420px);cursor:crosshair}
.pd-outils{flex:1 1 240px;display:flex;flex-direction:column;gap:8px;line-height:1.4}
.pd-cibles{display:flex;flex-wrap:wrap;gap:5px}
.pd-cibles button{padding:6px 10px;border-radius:999px;border:1px solid #e3d7c8;background:#fff;font-size:12.5px;cursor:pointer}
.pd-cibles button.choisie{background:#ffd400;border-color:#c9a800;font-weight:700}
.pd-larges{display:flex;flex-direction:column;gap:18px}
.pd-large{margin:0;display:flex;flex-direction:column;gap:6px}
.pd-defile{display:block;overflow-x:auto;border-radius:14px;-webkit-overflow-scrolling:touch}
.pd-image.panorama{aspect-ratio:${RATIO_LARGE};width:max(100%,900px);border-radius:0}
.pd-ajuste.large .pd-image.panorama{width:max(100%,1200px);cursor:crosshair}
.pd-defile-bloc{flex:1 1 100%;min-width:0;display:flex;flex-direction:column;gap:6px}
.pd-parties{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}
.pd-parties img,.pd-partie-vide{width:100%;aspect-ratio:3/2;object-fit:cover;border-radius:10px;background:#2b1a0c}
.pd-partie-vide{display:grid;place-items:center;color:#fff;opacity:.5;font-size:12px}
.pd-large-vide{display:grid;place-items:center;aspect-ratio:${RATIO_LARGE};max-height:160px;border-radius:14px;background:#2b1a0c;color:#fff;opacity:.6;font-size:13px}
`}</style>
    </section>
  );
}
