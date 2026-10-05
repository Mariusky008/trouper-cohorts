"use client";

// 🎬 UNE SCÈNE DU FIL DE LA VILLE, EMPILÉE EN CALQUES — voir `scenes-ville.ts`.
//
// « Utiliser une composition par calques, masque ou transformation de
// perspective adaptée à la stack existante. » La stack, c'est le navigateur :
//
//   1. LE DÉCOR — la vraie photo du commerce, à sa forme exacte ;
//   2. L'AFFICHE — posée sur ses quatre coins mesurés : une transformation
//      projective (matrix3d) la plie au plan de la vitrine, et un reflet de
//      vitre passe dessus ;
//   3. LES FANTÔMES — à leur échelle, dans la lumière de la photo, avec une
//      ombre de contact là où ils touchent le sol ;
//   4. LE PREMIER PLAN — les morceaux de la photo qui passent devant (le bord
//      d'une table, un objet de la vitrine), redessinés par-dessus, découpés
//      dans la photo elle-même.
//
// Aucune image n'est fabriquée, ni au partage ni quand on fait défiler.
//
// L'ESSAI EST MONTRÉ TEL QUEL. On le cadre, on ne le touche pas : le visage
// pour une coupe ou des lunettes, toute la tenue pour la mode (l'image
// entière, posée sur son propre flou plutôt que rognée), les mains pour
// l'onglerie.
//
// SI UNE COUCHE NE SE CHARGE PAS, on ne montre pas une scène à trous : la
// carte simple prend la place — l'essai, le nom et la photo du commerce.
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Calque, Point, Quad, SceneAmbiance, SceneVille, SceneVitrine } from "@/lib/direct/scenes-ville";

const POSITION: Record<string, string> = {
  visage: "50% 22%",
  mains: "50% 55%",
  "en-pied": "50% 20%",
};

/** La largeur de la scène à l'écran — la perspective se calcule en points. */
function useLargeur<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [l, setL] = useState(0);
  useEffect(() => {
    const e = ref.current;
    if (!e) return;
    const ro = new ResizeObserver(() => setL(e.clientWidth));
    ro.observe(e);
    return () => ro.disconnect();
  }, []);
  return [ref, l] as const;
}

/* ═══ LA TRANSFORMATION PROJECTIVE ══════════════════════════════════════════
   Le rectangle de l'affiche (0,0)-(w,h) envoyé sur les quatre coins mesurés.
   La méthode classique : chaque quadrilatère s'écrit comme l'image du repère
   de base par une matrice 3×3 ; on compose l'une avec l'inverse de l'autre. */
type M3 = number[];
const adj = (m: M3): M3 => [
  m[4] * m[8] - m[5] * m[7], m[2] * m[7] - m[1] * m[8], m[1] * m[5] - m[2] * m[4],
  m[5] * m[6] - m[3] * m[8], m[0] * m[8] - m[2] * m[6], m[2] * m[3] - m[0] * m[5],
  m[3] * m[7] - m[4] * m[6], m[1] * m[6] - m[0] * m[7], m[0] * m[4] - m[1] * m[3],
];
const mul = (a: M3, b: M3): M3 => {
  const c: M3 = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) c[3 * i + j] = a[3 * i] * b[j] + a[3 * i + 1] * b[3 + j] + a[3 * i + 2] * b[6 + j];
  return c;
};
const mulv = (m: M3, v: number[]) => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
function repere(p: Point[]): M3 {
  const m = [p[0][0], p[1][0], p[2][0], p[0][1], p[1][1], p[2][1], 1, 1, 1];
  const v = mulv(adj(m), [p[3][0], p[3][1], 1]);
  return mul(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]]);
}
/** Le matrix3d qui plie un rectangle w×h sur `dst` (en points). */
function matrice(w: number, h: number, dst: Point[]): string {
  const src: Point[] = [[0, 0], [w, 0], [w, h], [0, h]];
  // ORDRE DU REPÈRE : haut-gauche, haut-droite, bas-gauche, puis bas-droite.
  const t = mul(repere([dst[0], dst[1], dst[3], dst[2]]), adj(repere([src[0], src[1], src[3], src[2]])));
  const k = t.map((x) => x / t[8]);
  return `matrix3d(${[k[0], k[3], 0, k[6], k[1], k[4], 0, k[7], 0, 0, 1, 0, k[2], k[5], 0, k[8]].map((x) => +x.toFixed(9)).join(",")})`;
}
const dist = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);

function StyleCalque(c: Calque): CSSProperties {
  return {
    left: `${c.x * 100}%`,
    top: `${c.y * 100}%`,
    height: `${c.h * 100}%`,
    transform: `translate(-50%, -100%)${c.miroir ? " scaleX(-1)" : ""}`,
    // LA LUEUR : un liseré doré, serré, puis un halo plus large et très
    // léger — la lumière chaude de la salle qui accroche la silhouette.
    ...(c.filtre || c.lueur
      ? {
          filter: [
            c.filtre,
            c.lueur && "drop-shadow(0 0 1.2px rgba(255,190,110,.95)) drop-shadow(0 -1px 5px rgba(255,165,75,.5))",
            "drop-shadow(0 2px 3px rgba(0,0,0,.35))",
          ]
            .filter(Boolean)
            .join(" "),
        }
      : {}),
  };
}

/** Les fantômes, leur ombre de contact, puis ce qui passe devant eux. */
function Calques({ calques, devant, decor, ratio }: { calques?: Calque[]; devant?: Point[][]; decor: string; ratio: number }) {
  return (
    <>
      {(calques ?? []).map((c) => (
        <span key={`${c.src}${c.x}`}>
          {c.ombre && (
            // L'OMBRE DE CONTACT : une ellipse floue sous ses pieds, aussi large
            // que lui. C'est elle qui le pose sur le sol au lieu de le coller.
            <i
              className="scv-ombre"
              aria-hidden="true"
              style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%`, width: `${(c.h * 62) / ratio}%`, height: `${c.h * 9}%` }}
            />
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="scv-calque" src={c.src} alt="" aria-hidden="true" style={StyleCalque(c)} />
          {c.lueur && (
            // LA MÊME SILHOUETTE, TEINTE AMBRÉE, EN MULTIPLICATION : elle ne
            // touche que le fantôme, le dore, et l'assombrit vers le bas —
            // la lumière des lampes tombe d'en haut.
            // eslint-disable-next-line @next/next/no-img-element
            <img className="scv-calque scv-chaud" src={c.src} alt="" aria-hidden="true" style={{ ...StyleCalque({ ...c, filtre: undefined, lueur: false }), filter: undefined }} />
          )}
        </span>
      ))}
      {(devant ?? []).map((poly, i) => (
        // LE PREMIER PLAN, DÉCOUPÉ DANS LA PHOTO : il repasse devant.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          className="scv-devant"
          src={decor}
          alt=""
          aria-hidden="true"
          style={{ clipPath: `polygon(${poly.map(([x, y]) => `${(x * 100).toFixed(2)}% ${(y * 100).toFixed(2)}%`).join(",")})` }}
        />
      ))}
    </>
  );
}

function Vitrine({ s, photo, onErreur }: { s: SceneVitrine; photo: string; onErreur: () => void }) {
  const [ref, L] = useLargeur<HTMLDivElement>();
  /** La forme de l'essai, lue au chargement : elle décide comment il remplit l'affiche. */
  const [formeEssai, setFormeEssai] = useState(0);
  const H = L / s.ratio;
  const coins = s.affiche.coins.map(([x, y]) => [x * L, y * H] as Point) as Quad;
  // LA TAILLE PROPRE DE L'AFFICHE : sa largeur et sa hauteur moyennes à
  // l'écran. Le texte y est écrit à cette échelle, puis plié avec elle.
  const w = Math.max(1, (dist(coins[0], coins[1]) + dist(coins[3], coins[2])) / 2);
  const h = Math.max(1, (dist(coins[0], coins[3]) + dist(coins[1], coins[2])) / 2);
  const cadrage = s.affiche.cadrage;
  return (
    <div
      ref={ref}
      className="scv scv-vitrine"
      style={{ aspectRatio: String(s.ratio) }}
      role="img"
      aria-label="L'essai, en affiche dans la vitrine du commerce"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="scv-decor" src={s.decor} alt="" onError={onErreur} />
      {L > 0 && (
        <div className="scv-affiche" style={{ width: w, height: h, transform: matrice(w, h, coins) }}>
          {/* LA TENUE ENTIÈRE, SANS BANDES FLOUES : un portrait plus large que
              l'affiche remplit sa hauteur et ne perd que des côtés — la tête
              et les pieds restent. Plus étroit qu'elle, il est posé entier sur
              son propre flou. */}
          {cadrage === "en-pied" && formeEssai > 0 && formeEssai < w / h ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="scv-flou" src={photo} alt="" aria-hidden="true" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="scv-essai entier" src={photo} alt="" onError={onErreur} />
            </>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="scv-essai"
              src={photo}
              alt=""
              style={{ objectPosition: POSITION[cadrage] ?? "50% 30%" }}
              onLoad={(e) => setFormeEssai(e.currentTarget.naturalWidth / Math.max(1, e.currentTarget.naturalHeight))}
              onError={onErreur}
            />
          )}
          {/* LA PHRASE MANUSCRITE, SEULEMENT SI L'AFFICHE EST ASSEZ GRANDE POUR LA LIRE. */}
          {w > 110 && s.affiche.mot && (
            <span className="scv-mot" style={{ fontSize: Math.max(10, Math.round(w * 0.09)) }}>
              {s.affiche.mot} ♡
            </span>
          )}
          <i className="scv-vitre" aria-hidden="true" />
        </div>
      )}
      <Calques calques={s.calques} devant={s.devant} decor={s.decor} ratio={s.ratio} />
      <span className="scv-coin gauche">✨ Essai virtuel</span>
    </div>
  );
}

function Ambiance({ s, onErreur }: { s: SceneAmbiance; onErreur: () => void }) {
  return (
    <div className="scv scv-ambiance" style={{ aspectRatio: String(s.ratio) }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="scv-decor" src={s.decor} alt="" onError={onErreur} />
      <Calques calques={s.calques} devant={s.devant} decor={s.decor} ratio={s.ratio} />
      <span className="scv-coin">✨ Ambiance illustrée</span>
    </div>
  );
}

/**
 * LA SCÈNE D'UNE PUBLICATION. `photo` : l'essai (vitrine) ; une ambiance
 * montre sa propre photo de salle. `repli` : ce qu'il faut pour la carte simple.
 */
export function SceneDuFil({
  scene,
  photo,
  repli,
}: {
  scene: SceneVille;
  photo: string;
  repli: { commerce?: string; miniature?: string; essai: boolean; cadrage?: string; mention?: string };
}) {
  const [cassee, setCassee] = useState(false);
  const casser = () => setCassee(true);
  if (cassee) return <CarteSimple photo={photo} {...repli} />;
  return (
    <>
      <StylesScene />
      {scene.rendu === "vitrine" ? <Vitrine s={scene} photo={photo} onErreur={casser} /> : <Ambiance s={scene} onErreur={casser} />}
    </>
  );
}

/**
 * LA CARTE SIMPLE — « sans devanture adaptée, afficher une belle carte simple
 * avec l'essai et le vrai commerce ». L'essai en grand, cadré selon le métier,
 * et en bas le commerce : sa photo à lui et son nom. Elle sert aussi quand
 * une scène ne peut pas se monter.
 */
export function CarteSimple({
  photo,
  commerce,
  miniature,
  essai,
  cadrage,
  mention,
}: {
  photo: string;
  commerce?: string;
  miniature?: string;
  essai: boolean;
  cadrage?: string;
  /** « Coupe proposée par », « Tenue proposée par »… — voir mentionDuCommerce. */
  mention?: string;
}) {
  const [sansPhoto, setSansPhoto] = useState(false);
  return (
    <>
      <StylesScene />
      <div className={`scv-simple${cadrage === "en-pied" ? " haute" : ""}`}>
        {!sansPhoto && (
          <>
            {cadrage === "en-pied" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="scv-flou" src={photo} alt="" aria-hidden="true" />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={`scv-plein${cadrage === "en-pied" ? " entier" : ""}`}
              src={photo}
              alt=""
              style={cadrage && cadrage !== "en-pied" ? { objectPosition: POSITION[cadrage] } : undefined}
              onError={() => setSansPhoto(true)}
            />
          </>
        )}
        {essai && <span className="scv-coin gauche haut">✨ Essai virtuel</span>}
        {commerce && (
          <span className="scv-chez">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {miniature && <img src={miniature} alt="" />}
            <span>
              <small>{mention ?? (essai ? "Proposé par" : "Chez")}</small>
              <b>{commerce}</b>
            </span>
          </span>
        )}
      </div>
    </>
  );
}

function StylesScene() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.scv{position:relative;width:100%;overflow:hidden;border-radius:18px;background:#1a1411;isolation:isolate;}
.scv-decor,.scv-plein,.scv-devant{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;}
.scv-devant{z-index:5;pointer-events:none;}
.scv-calque{position:absolute;width:auto;z-index:4;pointer-events:none;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35));}
.scv-chaud{filter:sepia(1) saturate(3.2) hue-rotate(-12deg) brightness(.92);mix-blend-mode:multiply;opacity:.42;
  -webkit-mask-image:linear-gradient(180deg,rgba(0,0,0,.35) 0%,#000 75%);mask-image:linear-gradient(180deg,rgba(0,0,0,.35) 0%,#000 75%);}
.scv-ombre{position:absolute;z-index:3;transform:translate(-50%,-62%);border-radius:50%;pointer-events:none;
  background:radial-gradient(closest-side,rgba(0,0,0,.55),rgba(0,0,0,.28) 55%,transparent);filter:blur(2px);}

.scv-affiche{position:absolute;left:0;top:0;z-index:2;overflow:hidden;transform-origin:0 0;background:#efe4d4;box-sizing:border-box;
  border:2.5px solid #f2e9d8;box-shadow:0 6px 16px rgba(0,0,0,.38),inset 0 0 0 1px rgba(255,255,255,.18);}
.scv-essai{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;filter:brightness(.94) saturate(1.02);}
.scv-essai.entier,.scv-plein.entier{object-fit:contain;}
.scv-flou{position:absolute;inset:-8%;width:116%;height:116%;object-fit:cover;filter:blur(14px) saturate(1.1) brightness(.85);}
.scv-mot{position:absolute;left:7%;right:7%;bottom:7%;z-index:2;font-family:var(--font-main-levee),"Caveat","Segoe Script",cursive;
  line-height:1;color:#fff8ee;text-shadow:0 1px 6px rgba(0,0,0,.6);font-weight:600;}
.scv-vitre{position:absolute;inset:0;z-index:3;pointer-events:none;
  background:
    linear-gradient(118deg,rgba(255,255,255,.18) 0 10%,transparent 22% 64%,rgba(255,255,255,.08) 72%,transparent 82%),
    linear-gradient(180deg,rgba(255,214,160,.10),rgba(20,10,4,.18));}

.scv-coin{position:absolute;right:10px;bottom:10px;z-index:7;display:inline-flex;align-items:center;gap:6px;padding:6px 11px;border-radius:999px;
  background:rgba(20,13,9,.74);color:#FFF4E6;font-size:12.5px;font-weight:700;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);}
.scv-coin.gauche{right:auto;left:10px;background:#fbdcc8;color:#3a1d10;}
.scv-coin.haut{bottom:auto;top:12px;}

.scv-simple{position:relative;width:100%;aspect-ratio:4/5;max-height:480px;overflow:hidden;border-radius:18px;background:#241A15;isolation:isolate;}
.scv-simple.haute{aspect-ratio:3/4;}
.scv-simple::after{content:"";position:absolute;left:0;right:0;bottom:0;height:34%;z-index:1;pointer-events:none;
  background:linear-gradient(180deg,transparent,rgba(16,10,7,.82));}
.scv-chez{position:absolute;left:12px;right:12px;bottom:12px;z-index:3;display:flex;align-items:center;gap:10px;color:#FFF4E6;}
.scv-chez img{width:42px;height:42px;border-radius:12px;object-fit:cover;flex:none;box-shadow:0 0 0 2px rgba(255,244,230,.85);}
.scv-chez span{display:grid;min-width:0;}
.scv-chez small{font-family:var(--font-clikme-leger),var(--font-clikme),system-ui,sans-serif;font-weight:500;font-size:12px;color:#EADBC8;}
.scv-chez b{font-size:15.5px;font-weight:700;line-height:1.2;overflow-wrap:anywhere;}
`,
      }}
    />
  );
}
