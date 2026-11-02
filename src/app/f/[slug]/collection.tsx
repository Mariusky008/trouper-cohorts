"use client";

/**
 * 🏆 SA COLLECTION DE FIGURINES D'UN COMMERCE — sur sa page de la famille (à la place de la pièce) et dans « Ma
 * collection » (`/collection`). La règle est dans `lib/direct/collection.ts` ; ici, l'envie de la compléter :
 *   · le compteur qui monte et la jauge à 10, avec ses trois paliers (🥈 plus tôt, 🥇 en premier, 🏆 l'or) ;
 *   · LA FIGURINE À GAGNER MAINTENANT, en grand, dans les couleurs de son édition (les feuilles qui tombent en automne,
 *     la neige en hiver…), avec le temps qui reste ;
 *   · l'étagère des dix : gagnées en couleur (et ce reflet qui passe), à gagner en silhouette, manquées en gris, les
 *     rares en holographique ;
 *   · UNE NOUVELLE FIGURINE SE FÊTE : la carte se retourne, les confettis tombent (une fois : on retient ce qu'il a vu).
 * Sans animation pour qui les a coupées (`prefers-reduced-motion`).
 */
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  PALIERS_COLLECTION,
  jourEnClair,
  palierSuivant,
  type CaseCollection,
  type Collection,
} from "@/lib/direct/collection";

type Theme = { a: string; b: string; parts: string[] };
const THEMES: Record<string, Theme> = {
  hiver: { a: "#A8DBFF", b: "#2B4FA6", parts: ["❄️", "❅", "❆"] },
  "saint-valentin": { a: "#FF6B9A", b: "#8E1442", parts: ["💘", "💗", "💕"] },
  printemps: { a: "#FFB8D6", b: "#2F8F57", parts: ["🌸", "🌼", "🌷"] },
  musique: { a: "#B98CFF", b: "#3A1A8C", parts: ["🎶", "🎵", "🎸"] },
  ete: { a: "#FFD54F", b: "#EF5A2A", parts: ["☀️", "🌊", "🍉"] },
  automne: { a: "#FFA24A", b: "#7C3110", parts: ["🍂", "🍁", "🌰"] },
  halloween: { a: "#FF8A1F", b: "#2B0E30", parts: ["🎃", "🦇", "👻"] },
  noel: { a: "#F04B55", b: "#125E37", parts: ["🎄", "✨", "⭐"] },
  rare: { a: "#D9C8FF", b: "#6A47F0", parts: ["✨", "💎", "⭐"] },
};
const themeDe = (c: CaseCollection) =>
  THEMES[c.sorte === "rare" ? "rare" : c.cle] ?? THEMES.rare;
const CLE_VUES = "clikme-collection-vues-v1";
const court = (j: string) => jourEnClair(j).replace(/ (\S{3})\S*$/, " $1.");

function lireVues(): Record<string, number> {
  try {
    return JSON.parse(window.localStorage.getItem(CLE_VUES) || "{}") as Record<
      string,
      number
    >;
  } catch {
    return {};
  }
}

/** Le compteur qui monte jusqu'à `n`. */
function useCompte(n: number) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const duree = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 0 : 900;
    let raf = 0;
    const t0 = performance.now();
    const pas = (t: number) => {
      const u = duree ? Math.min(1, (t - t0) / duree) : 1;
      setV(Math.round(n * (1 - Math.pow(1 - u, 3))));
      if (u < 1) raf = requestAnimationFrame(pas);
    };
    raf = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf);
  }, [n]);
  return v;
}

function Particules({ theme, n = 9 }: { theme: Theme; n?: number }) {
  return (
    <span className="co-parts" aria-hidden="true">
      {Array.from({ length: n }, (_, k) => (
        <i
          key={k}
          style={
            {
              left: `${(k * 37 + 11) % 96}%`,
              "--d": `${(k * 0.83) % 5}s`,
              "--t": `${5 + ((k * 1.7) % 4)}s`,
              fontSize: `${12 + ((k * 5) % 10)}px`,
            } as CSSProperties
          }
        >
          {theme.parts[k % theme.parts.length]}
        </i>
      ))}
    </span>
  );
}

function Carte({
  c,
  figurine,
  vedette,
  onRef,
}: {
  c: CaseCollection;
  figurine: string;
  vedette: boolean;
  onRef?: (el: HTMLLIElement | null) => void;
}) {
  const t = themeDe(c);
  const legende =
    c.etat === "gagnee"
      ? c.numero
        ? `n° ${c.numero}`
        : c.le
          ? court(c.le)
          : "✓"
      : c.etat === "en-cours"
        ? `⏳ ${c.reste} j`
        : c.etat === "a-venir" && c.debut
          ? `dès le ${court(c.debut)}`
          : c.etat === "manquee"
            ? "manquée"
            : "place libre";
  return (
    <li
      ref={onRef}
      className={`co-carte ${c.etat} ${c.sorte}${vedette ? " vedette" : ""}`}
      style={{ "--a": t.a, "--b": t.b } as CSSProperties}
    >
      <span className="co-carte-fond">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={figurine} alt="" draggable={false} />
        <em aria-hidden="true">{c.emoji}</em>
        {c.etat === "gagnee" && <i className="co-reflet" aria-hidden="true" />}
        {c.etat === "gagnee" && <b className="co-coche">✓</b>}
      </span>
      <strong>{c.nom}</strong>
      <small>{legende}</small>
    </li>
  );
}

export function CollectionDuCommerce({
  collection: col,
  titre,
  nom,
  de,
  figurine,
  cadeau,
  slug,
  compact = false,
  lienCollection = true,
}: {
  collection: Collection;
  /** « Ta collection du Comptoir des Fantômes ». */
  titre: string;
  /** Son nom (« Chez Bergine »), et dit après « de » (« de Chez Bergine », « du Comptoir des Fantômes »). */
  nom: string;
  de: string;
  figurine: string;
  cadeau?: string;
  slug: string;
  compact?: boolean;
  lienCollection?: boolean;
}) {
  const n = useCompte(col.gagnees);
  const etagere = useRef<HTMLOListElement>(null);
  const vedetteRef = useRef<HTMLLIElement | null>(null);
  const [fete, setFete] = useState<CaseCollection | null>(null);
  const prochaine = col.cases.find((c) => c.cle === col.prochaine) ?? null;
  const suivant = palierSuivant(col.gagnees);
  const derniere = [...col.cases]
    .filter((c) => c.etat === "gagnee")
    .sort((a, b) => (a.le ?? "").localeCompare(b.le ?? ""))[col.gagnees - 1];

  // l'étagère s'ouvre sur la figurine à gagner
  useEffect(() => {
    const e = etagere.current;
    const v = vedetteRef.current;
    if (e && v)
      e.scrollLeft = Math.max(
        0,
        v.offsetLeft - (e.clientWidth - v.clientWidth) / 2,
      );
  }, [col.prochaine]);

  // UNE NOUVELLE FIGURINE DEPUIS SA DERNIÈRE VISITE : on la fête (une fois). On ne la retient comme vue qu'une fois la
  // fête montrée : le compteur qui monte redessine le bloc à chaque image, et la page se rafraîchit d'elle-même.
  const derniereCle = derniere?.cle ?? "";
  useEffect(() => {
    if (compact || !derniereCle) return;
    const cle = `${slug}:${col.numero}`;
    if ((lireVues()[cle] ?? 0) >= col.gagnees) return;
    const id = window.setTimeout(() => {
      setFete(col.cases.find((c) => c.cle === derniereCle) ?? null);
      try {
        window.localStorage.setItem(CLE_VUES, JSON.stringify({ ...lireVues(), [cle]: col.gagnees }));
      } catch {
        /* navigation privée : on la fêtera la prochaine fois aussi */
      }
    }, 700);
    return () => window.clearTimeout(id);
  }, [compact, derniereCle, slug, col.numero, col.gagnees, col.cases]);

  const tp = prochaine ? themeDe(prochaine) : THEMES.rare;
  const or = col.complete;

  return (
    <section className={`co${compact ? " compact" : ""}`} aria-label={titre}>
      <header className="co-tete">
        <div>
          <p className="co-sur">
            {titre}
            {col.numero > 1 ? ` · n° ${col.numero}` : ""}
          </p>
          <p className="co-compte">
            <b>{n}</b>
            <span>/ {col.total}</span>
            <small>figurine{col.gagnees > 1 ? "s" : ""}</small>
          </p>
        </div>
        {col.trophees.length > 0 && (
          <span className="co-trophees" title="Tes figurines d’or">
            🏆<b>×{col.trophees.length}</b>
          </span>
        )}
      </header>

      <div
        className="co-jauge"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={col.total}
        aria-valuenow={col.gagnees}
        aria-label={`${col.gagnees} figurines sur ${col.total}`}
      >
        <i
          className="co-jauge-plein"
          style={{
            width: `${(Math.min(col.gagnees, col.total) / col.total) * 100}%`,
          }}
        />
        {PALIERS_COLLECTION.map((p) => (
          <span
            key={p.n}
            className={`co-jalon${col.gagnees >= p.n ? " atteint" : ""}`}
            style={{ left: `${(p.n / col.total) * 100}%` }}
          >
            {p.emoji}
          </span>
        ))}
      </div>
      <p className="co-suivant">
        {suivant ? (
          <>
            Encore <b>{suivant.n - col.gagnees}</b> : {suivant.emoji}{" "}
            {suivant.titre}
            {suivant.n === col.total && cadeau ? ` + 🎁 ${cadeau}` : ""}
          </>
        ) : (
          <>🏆 Collection complète !</>
        )}
      </p>

      {/* LA FIGURINE À GAGNER MAINTENANT (ou la figurine d'or) */}
      {or ? (
        <div
          className="co-vedette or"
          style={{ "--a": "#FFE7A0", "--b": "#B8801E" } as CSSProperties}
        >
          <Particules theme={{ a: "", b: "", parts: ["✨", "⭐", "🏆"] }} />
          <span className="co-ruban">COLLECTION COMPLÈTE</span>
          <span className="co-vedette-fig">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={figurine} alt="" draggable={false} />
          </span>
          <b className="co-vedette-nom">
            La figurine d’or{col.or ? ` n° ${col.or}` : ""}
          </b>
          <p className="co-vedette-dit">
            {col.remis
              ? `🎁 Cadeau remis le ${new Date(col.remis).toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" })}. Bravo !`
              : cadeau
                ? `🎁 ${cadeau} : montre cet écran au comptoir.`
                : `Tu as toutes les figurines ${de}. Bravo !`}
          </p>
        </div>
      ) : (
        prochaine && (
          <div
            className={`co-vedette ${prochaine.etat}`}
            style={{ "--a": tp.a, "--b": tp.b } as CSSProperties}
          >
            <Particules theme={tp} />
            <span className="co-ruban">
              {prochaine.etat === "en-cours"
                ? "À GAGNER MAINTENANT"
                : "BIENTÔT"}
            </span>
            <span className="co-vedette-fig">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={figurine} alt="" draggable={false} />
              <em aria-hidden="true">{prochaine.emoji}</em>
            </span>
            <b className="co-vedette-nom">Édition {prochaine.nom}</b>
            {prochaine.etat === "en-cours" ? (
              <>
                <span className="co-puce">
                  ⏳ encore {prochaine.reste} jour
                  {(prochaine.reste ?? 0) > 1 ? "s" : ""} · jusqu’au{" "}
                  {prochaine.fin ? jourEnClair(prochaine.fin) : ""}
                </span>
                <p className="co-vedette-dit">
                  Une visite validée au comptoir {de}, et elle rejoint ta
                  collection.
                </p>
              </>
            ) : (
              <>
                <span className="co-puce">
                  📅 dès le{" "}
                  {prochaine.debut ? jourEnClair(prochaine.debut) : ""}
                </span>
                <p className="co-vedette-dit">
                  Reviens pendant son édition : chaque figurine ne se gagne qu’à
                  son moment.
                </p>
              </>
            )}
          </div>
        )
      )}

      {/* L'ÉTAGÈRE DES DIX */}
      <ol
        className="co-etagere"
        ref={etagere}
        aria-label="Les figurines de la collection"
      >
        {col.cases.map((c) => (
          <Carte
            key={c.cle}
            c={c}
            figurine={figurine}
            vedette={c.cle === col.prochaine}
            onRef={
              c.cle === col.prochaine
                ? (el) => (vedetteRef.current = el)
                : undefined
            }
          />
        ))}
      </ol>

      {!compact && (
        <>
          <ul className="co-paliers">
            {PALIERS_COLLECTION.map((p) => (
              <li key={p.n} className={col.gagnees >= p.n ? "atteint" : ""}>
                <span className="med">{p.emoji}</span>
                <span>
                  <b>
                    {p.n} figurines · {p.titre}
                  </b>
                  <small>
                    {p.n === col.total && cadeau
                      ? `${p.dit} + 🎁 ${cadeau}`
                      : p.dit}
                  </small>
                </span>
                {col.gagnees >= p.n && <i aria-label="atteint">✓</i>}
              </li>
            ))}
          </ul>
          <p className="co-regle">
            ✨ 1 visite validée = 1 figurine · les rares, quand {nom} annonce
            une place libre · une édition manquée est manquée
          </p>
          {lienCollection && (
            <Link className="co-lien" href="/collection">
              Toutes mes figurines →
            </Link>
          )}
        </>
      )}

      {fete && (
        <div
          className="co-fete"
          role="dialog"
          aria-label="Nouvelle figurine"
          onClick={() => setFete(null)}
        >
          <span className="co-confettis" aria-hidden="true">
            {Array.from({ length: 28 }, (_, k) => (
              <i
                key={k}
                style={
                  {
                    left: `${(k * 29 + (k % 3) * 7) % 100}%`,
                    "--d": `${((k * 7) % 11) * 0.09}s`,
                    animationDuration: `${2.1 + ((k * 3) % 7) * 0.22}s`,
                    width: `${6 + (k % 4) * 2}px`,
                    background: [
                      "#FF2E9A",
                      "#F2C46B",
                      "#3DE2A6",
                      "#8EC5FF",
                      "#fff",
                    ][k % 5],
                  } as CSSProperties
                }
              />
            ))}
          </span>
          <div
            className="co-fete-carte"
            style={
              {
                "--a": themeDe(fete).a,
                "--b": themeDe(fete).b,
              } as CSSProperties
            }
          >
            <span className="co-fete-dos" aria-hidden="true">
              ?
            </span>
            <span className="co-fete-face">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={figurine} alt="" />
              <em aria-hidden="true">{fete.emoji}</em>
            </span>
          </div>
          <b className="co-fete-titre">Nouvelle figurine !</b>
          <p>
            {fete.sorte === "rare"
              ? `Édition rare${fete.numero ? ` n° ${fete.numero}` : ""}`
              : `Édition ${fete.nom}`}{" "}
            · {col.gagnees} / {col.total}
          </p>
          <button type="button" onClick={() => setFete(null)}>
            Super !
          </button>
        </div>
      )}
    </section>
  );
}

export const STYLES_COLLECTION = `
.co{--co-or:#F2C46B;--co-rose:#FF2E9A;--co-creme:#FFF4E6;--co-doux:#D9C3CB;position:relative;margin:16px 16px 0;padding:16px 14px 14px;border-radius:24px;
  background:radial-gradient(120% 80% at 50% 0%,rgba(255,46,154,.22),rgba(255,46,154,0) 60%),linear-gradient(180deg,#2A0F22,#170812);border:1px solid rgba(255,255,255,.08);
  box-shadow:0 24px 50px -24px rgba(0,0,0,.9);color:var(--co-creme);overflow:hidden;text-align:left}
.co-tete{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.co-sur{margin:0;font-size:11.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--co-doux)}
.co-compte{display:flex;align-items:baseline;gap:6px;margin:2px 0 0}
.co-compte b{font-size:46px;line-height:1;font-weight:900;letter-spacing:-.03em;background:linear-gradient(135deg,#fff,#FFC8E6 40%,var(--co-or));-webkit-background-clip:text;background-clip:text;color:transparent}
.co-compte span{font-size:22px;font-weight:800;color:var(--co-doux)}
.co-compte small{font-size:13px;font-weight:700;color:var(--co-doux)}
.co-trophees{display:flex;align-items:center;gap:2px;padding:6px 10px;border-radius:999px;background:linear-gradient(135deg,rgba(242,196,107,.35),rgba(184,128,30,.25));border:1px solid rgba(242,196,107,.6);font-size:18px}
.co-trophees b{font-size:13px;color:var(--co-or)}
.co-jauge{position:relative;height:12px;margin:16px 6px 6px;border-radius:999px;background:rgba(255,255,255,.1)}
.co-jauge-plein{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:linear-gradient(90deg,#FF2E9A,#FF8FCB 55%,var(--co-or));box-shadow:0 0 18px rgba(255,46,154,.6);animation:co-remplir 1.1s cubic-bezier(.2,.9,.3,1) both}
.co-jalon{position:absolute;top:50%;display:grid;place-items:center;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;background:#2A1322;border:2px solid rgba(255,255,255,.18);font-size:15px;filter:grayscale(1) brightness(.75);transition:.3s}
.co-jalon:last-child{margin-left:-28px}
.co-jalon.atteint{filter:none;border-color:var(--co-or);background:#3A1A10;box-shadow:0 0 14px rgba(242,196,107,.7);animation:co-pop .6s cubic-bezier(.2,1.5,.4,1) .9s both}
.co-suivant{margin:14px 0 0;font-size:13.5px;color:var(--co-doux)}
.co-suivant b{color:var(--co-creme)}
.co-vedette{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;margin:14px 0 0;padding:34px 16px 18px;border-radius:22px;overflow:hidden;text-align:center;
  background:radial-gradient(90% 70% at 50% 30%,color-mix(in srgb,var(--a) 75%,transparent),transparent 70%),linear-gradient(160deg,var(--b),#1A0814 85%);border:1.5px solid color-mix(in srgb,var(--a) 70%,transparent);
  box-shadow:inset 0 0 40px color-mix(in srgb,var(--a) 25%,transparent),0 18px 40px -18px color-mix(in srgb,var(--b) 80%,black)}
.co-vedette.en-cours{animation:co-lueur 2.8s ease-in-out infinite}
.co-ruban{position:absolute;top:12px;left:50%;transform:translateX(-50%);padding:4px 12px;border-radius:999px;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.25);font-size:10.5px;font-weight:900;letter-spacing:.16em;white-space:nowrap}
.co-vedette-fig{position:relative;display:block;width:150px;height:170px;animation:co-flotte 3.2s ease-in-out infinite}
.co-vedette-fig img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 16px 18px rgba(0,0,0,.55))}
.co-vedette.a-venir .co-vedette-fig img{filter:brightness(0) drop-shadow(0 0 14px color-mix(in srgb,var(--a) 80%,transparent));opacity:.55}
.co-vedette.or .co-vedette-fig img{filter:sepia(1) saturate(3.2) hue-rotate(-12deg) brightness(1.08) drop-shadow(0 0 22px rgba(255,214,120,.9))}
.co-vedette-fig em{position:absolute;right:-6px;top:4px;font-style:normal;font-size:34px;filter:drop-shadow(0 4px 6px rgba(0,0,0,.5));animation:co-tourne 4s ease-in-out infinite}
.co-vedette-nom{font-size:22px;font-weight:900;letter-spacing:-.01em;text-shadow:0 2px 12px rgba(0,0,0,.45)}
.co-puce{padding:5px 12px;border-radius:999px;background:rgba(0,0,0,.35);font-size:12.5px;font-weight:800}
.co-vedette-dit{margin:2px 0 0;max-width:290px;font-size:13.5px;line-height:1.4;color:rgba(255,244,230,.9)}
.co-parts{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.co-parts i{position:absolute;top:-24px;font-style:normal;opacity:.85;animation:co-tombe var(--t) linear var(--d) infinite}
.co-etagere{display:flex;gap:10px;margin:16px -14px 0;padding:6px 14px 12px;list-style:none;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none}
.co-etagere::-webkit-scrollbar{display:none}
.co-carte{flex:none;width:96px;scroll-snap-align:center;text-align:center}
.co-carte-fond{position:relative;display:block;height:124px;border-radius:16px;overflow:hidden;background:linear-gradient(160deg,var(--a),var(--b));border:1.5px solid rgba(255,255,255,.2);box-shadow:0 10px 22px -12px rgba(0,0,0,.9)}
.co-carte-fond img{position:absolute;left:8%;bottom:-2px;width:84%;height:92%;object-fit:contain;object-position:bottom;filter:drop-shadow(0 6px 6px rgba(0,0,0,.45))}
.co-carte-fond em{position:absolute;right:6px;top:5px;font-style:normal;font-size:20px}
.co-carte strong{display:block;margin-top:6px;font-size:12px;line-height:1.15;font-weight:800}
.co-carte small{display:block;font-size:11px;font-weight:700;color:var(--co-doux)}
.co-carte.a-venir .co-carte-fond,.co-carte.rare .co-carte-fond{background:linear-gradient(160deg,#2C1526,#1A0B16)}
.co-carte.a-venir img,.co-carte.rare img,.co-carte.en-cours img{filter:brightness(0);opacity:.45}
.co-carte.a-venir em{opacity:.6}
.co-carte.en-cours .co-carte-fond{background:linear-gradient(160deg,color-mix(in srgb,var(--a) 45%,#1A0B16),color-mix(in srgb,var(--b) 50%,#1A0B16));animation:co-pulse 1.8s ease-in-out infinite}
.co-carte.en-cours small{color:var(--co-or)}
.co-carte.manquee .co-carte-fond{filter:grayscale(1) brightness(.55);border-style:dashed}
.co-carte.manquee small{color:#8D7580}
.co-carte.rare .co-carte-fond,.co-carte.gagnee.rare .co-carte-fond{border:2px solid transparent;background:linear-gradient(#21101C,#21101C) padding-box,linear-gradient(120deg,#C9B6FF,#7B5CFF,#FF7AD9,#7FE7FF,#C9B6FF) border-box;background-size:auto,300% 300%;animation:co-holo 4s linear infinite}
.co-carte.gagnee.rare .co-carte-fond{background:linear-gradient(135deg,#E2D6FF,#9C84FF 40%,#FF9BE0 70%,#9AF0FF) padding-box,linear-gradient(120deg,#C9B6FF,#7B5CFF,#FF7AD9,#7FE7FF,#C9B6FF) border-box}
.co-carte.rare small{color:#C9B6FF}
.co-carte.vedette{transform:translateY(-4px)}
.co-carte.vedette .co-carte-fond{border-color:var(--co-or);box-shadow:0 0 0 2px rgba(242,196,107,.35),0 12px 26px -10px rgba(242,196,107,.55)}
.co-reflet{position:absolute;inset:0;background:linear-gradient(110deg,transparent 35%,rgba(255,255,255,.55) 50%,transparent 65%);transform:translateX(-120%);animation:co-reflet 3.6s ease-in-out infinite}
.co-carte:nth-child(2n) .co-reflet{animation-delay:1.2s}
.co-carte:nth-child(3n) .co-reflet{animation-delay:2.1s}
.co-coche{position:absolute;left:6px;top:6px;display:grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#3DE2A6;color:#062A1B;font-size:12px}
.co-paliers{display:grid;gap:8px;margin:10px 0 0;padding:0;list-style:none}
.co-paliers li{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)}
.co-paliers li.atteint{background:linear-gradient(90deg,rgba(242,196,107,.18),rgba(255,46,154,.1));border-color:rgba(242,196,107,.5)}
.co-paliers .med{font-size:24px;filter:grayscale(1) brightness(.8)}
.co-paliers li.atteint .med{filter:none}
.co-paliers b{display:block;font-size:13.5px}
.co-paliers small{display:block;font-size:12px;color:var(--co-doux)}
.co-paliers li > i{margin-left:auto;font-style:normal;font-weight:900;color:#3DE2A6}
.co-regle{margin:12px 0 0;font-size:11.5px;line-height:1.45;color:#A88E99}
.co-lien{display:block;margin:12px 0 0;padding:12px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);color:var(--co-creme);font-weight:800;text-align:center;text-decoration:none}
.co.compact{margin:0;padding:14px 12px 10px}
.co.compact .co-vedette{padding:30px 12px 14px}
.co.compact .co-vedette-fig{width:110px;height:124px}
.co-fete{position:fixed;inset:0;z-index:80;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:24px;background:rgba(10,3,8,.86);backdrop-filter:blur(6px);animation:co-apparait .3s ease-out both;text-align:center}
.co-fete-carte{position:relative;width:190px;height:250px;transform-style:preserve-3d;animation:co-retourne 1s cubic-bezier(.3,1.3,.5,1) .25s both}
.co-fete-carte > span{position:absolute;inset:0;display:grid;place-items:center;border-radius:22px;backface-visibility:hidden;-webkit-backface-visibility:hidden;border:2px solid rgba(255,255,255,.35)}
.co-fete-dos{background:linear-gradient(135deg,#FF2E9A,#7B1B5E);font-size:80px;font-weight:900;color:rgba(255,255,255,.85)}
.co-fete-face{transform:rotateY(180deg);background:radial-gradient(80% 60% at 50% 35%,var(--a),transparent 75%),linear-gradient(160deg,var(--b),#1A0814);box-shadow:0 0 50px color-mix(in srgb,var(--a) 70%,transparent)}
.co-fete-face img{width:80%;height:80%;object-fit:contain;filter:drop-shadow(0 12px 14px rgba(0,0,0,.5))}
.co-fete-face em{position:absolute;right:12px;top:10px;font-style:normal;font-size:36px}
.co-fete-titre{margin-top:8px;font-size:28px;font-weight:900;letter-spacing:-.02em;animation:co-pop .6s cubic-bezier(.2,1.5,.4,1) 1s both}
.co-fete p{margin:0;font-size:15px;color:var(--co-doux)}
.co-fete button{margin-top:10px;padding:13px 30px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font:inherit;font-weight:900;cursor:pointer}
.co-confettis{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.co-confettis i{position:absolute;top:-20px;width:9px;height:14px;border-radius:2px;animation:co-confetti 2.6s cubic-bezier(.3,.6,.5,1) var(--d) both}
@keyframes co-remplir{from{width:0}}
@keyframes co-pop{from{transform:scale(.3);opacity:0}}
@keyframes co-flotte{0%,100%{transform:translateY(0) rotate(-1.5deg)}50%{transform:translateY(-9px) rotate(1.5deg)}}
@keyframes co-tourne{0%,100%{transform:rotate(-10deg)}50%{transform:rotate(12deg) scale(1.08)}}
@keyframes co-lueur{0%,100%{box-shadow:inset 0 0 40px color-mix(in srgb,var(--a) 25%,transparent),0 0 0 0 color-mix(in srgb,var(--a) 0%,transparent)}50%{box-shadow:inset 0 0 50px color-mix(in srgb,var(--a) 40%,transparent),0 0 26px 2px color-mix(in srgb,var(--a) 45%,transparent)}}
@keyframes co-tombe{0%{transform:translateY(0) rotate(0)}100%{transform:translateY(420px) rotate(320deg)}}
@keyframes co-pulse{0%,100%{box-shadow:0 0 0 0 rgba(242,196,107,.0)}50%{box-shadow:0 0 18px 2px rgba(242,196,107,.55)}}
@keyframes co-holo{to{background-position:0 0,300% 0}}
@keyframes co-reflet{0%,55%{transform:translateX(-120%)}100%{transform:translateX(120%)}}
@keyframes co-apparait{from{opacity:0}}
@keyframes co-retourne{from{transform:rotateY(0) scale(.6)}to{transform:rotateY(180deg) scale(1)}}
@keyframes co-confetti{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(105vh) rotate(720deg);opacity:.9}}
@media (prefers-reduced-motion:reduce){.co *,.co-fete *{animation:none!important}.co-fete-carte{transform:rotateY(180deg)}}
`;
