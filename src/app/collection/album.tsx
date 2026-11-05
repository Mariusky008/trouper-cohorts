"use client";

/**
 * 📒 MES FIGURINES, EN ALBUM — refait le 4 novembre 2026 (« la section “Mes figurines” n'est pas du tout addictive, UX
 * et UI : à refaire pour la rendre bien meilleure »). Une page d'album par commerce, comme un album d'autocollants :
 *   · EN HAUT, le compteur qui monte (« 4 / 10 »), la jauge et ses paliers, et CE QUI VIENT ENSUITE (« encore 2 : 🥇 ») ;
 *   · LA FIGURINE À GAGNER MAINTENANT, qui brille, avec les jours qui restent, et « J'y vais » ;
 *   · LES QUATORZE CASES : gagnées en couleur (avec leur jour), celle du mois qui pulse, celles à venir en silhouette
 *     sous cadenas, les manquées en gris, les rares en holographique ; et au bout, LA CASE D'OR, fermée jusqu'à 10 ;
 *   · LES NOUVELLES depuis sa dernière visite de l'album portent « Nouvelle ! » (une fois) ;
 *   · on touche une case : elle s'ouvre en grand, avec ce qu'elle raconte.
 * Tout est vrai (`Collection`, `lib/direct/collection.ts`) : aucun chiffre n'est inventé.
 */
import { useEffect, useState, type CSSProperties } from "react";
import type { MaFamille } from "@/lib/direct/famille";
import { PALIERS_COLLECTION, jourCourt, jourEnClair, palierSuivant, type CaseCollection, type Collection } from "@/lib/direct/collection";
import { deNom } from "@/lib/echanges/echanges";
import { Particules, THEMES } from "@/app/f/[slug]/collection";
import { FigurineOuClik } from "./mascotte";

const FIGURINE_PAR_DEFAUT = "/direct/double/pied/salut-1.webp";
const CLE_VUES = "clikme-album-vues-v1";
const OR = { a: "#FFE7A0", b: "#B8801E", parts: ["✨", "⭐", "🏆"] };
const themeDe = (c: CaseCollection) => THEMES[c.sorte === "rare" ? "rare" : c.cle] ?? THEMES.rare;
const court = jourCourt;

function lireVues(): Record<string, number> {
  try {
    return JSON.parse(window.localStorage.getItem(CLE_VUES) || "{}") as Record<string, number>;
  } catch {
    return {};
  }
}

/** Le compteur qui monte jusqu'à `n`. */
function useCompte(n: number) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const duree = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 0 : 1000;
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

/** Ce qu'une case dit sous elle. */
function legende(c: CaseCollection): string {
  if (c.etat === "gagnee") return c.numero ? `n° ${c.numero}` : c.le ? court(c.le) : "✓";
  if (c.etat === "en-cours") return `⏳ ${c.reste} j`;
  if (c.etat === "a-venir") return c.debut ? court(c.debut) : "bientôt";
  if (c.etat === "manquee") return "manquée";
  return "rare";
}

type Ouverte = { f: MaFamille; c: CaseCollection | "or" } | null;

// ─── une page d'album : un commerce ───────────────────────────────────────────────────────────────
function PageAlbum({ f, ordre, onOuvre }: { f: MaFamille; ordre: number; onOuvre: (o: Ouverte) => void }) {
  const col = f.collection as Collection;
  const fig = f.figurine ?? FIGURINE_PAR_DEFAUT;
  const n = useCompte(Math.min(col.gagnees, col.total));
  const suivant = palierSuivant(col.gagnees);
  const enCours = col.cases.find((c) => c.etat === "en-cours" && c.cle === col.prochaine) ?? null;
  const cle = `${f.slug}:${col.numero}`;
  // LES NOUVELLES depuis sa dernière visite de l'album : marquées une fois (la toute première visite ne marque rien).
  // (L'album ne s'affiche qu'après le chargement de ses familles, dans le navigateur : on lit ce qu'il a vu tout de suite.)
  const [nouvelles] = useState<Set<string>>(() => {
    const vues = typeof window === "undefined" ? undefined : lireVues()[cle];
    if (vues == null || col.gagnees <= vues) return new Set();
    return new Set(
      col.cases
        .filter((c) => c.etat === "gagnee")
        .sort((a, b) => (b.le ?? "").localeCompare(a.le ?? ""))
        .slice(0, col.gagnees - vues)
        .map((c) => c.cle),
    );
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(CLE_VUES, JSON.stringify({ ...lireVues(), [cle]: col.gagnees }));
    } catch {
      /* navigation privée */
    }
  }, [cle, col.gagnees]);

  const t = enCours ? themeDe(enCours) : THEMES.rare;
  return (
    <article className="ab-page" style={{ "--d0": `${ordre * 0.12}s` } as CSSProperties} aria-label={`Ta collection ${deNom(f.nom)}`}>
      <header className="ab-tete">
        <a className="ab-nom" href={`/f/${encodeURIComponent(f.slug)}`}>
          <span className="ab-avatar" aria-hidden="true">
            <FigurineOuClik className="ab-img" src={fig} fixe />
          </span>
          <span>
            <b>{f.nom}</b>
            <small>
              {col.numero > 1 ? `Collection n° ${col.numero} · ` : ""}sa page ›
            </small>
          </span>
        </a>
        {col.trophees.length > 0 && (
          <span className="ab-trophees" title="Tes figurines d’or">
            🏆<b>×{col.trophees.length}</b>
          </span>
        )}
      </header>

      <div className="ab-compte">
        <p className="ab-chiffre">
          <b>{n}</b>
          <span>/ {col.total}</span>
        </p>
        <div className="ab-jauge-bloc">
          <div className="ab-jauge" role="progressbar" aria-valuemin={0} aria-valuemax={col.total} aria-valuenow={Math.min(col.gagnees, col.total)} aria-label={`${col.gagnees} figurines sur ${col.total}`}>
            <i style={{ width: `${(Math.min(col.gagnees, col.total) / col.total) * 100}%` }} />
            {PALIERS_COLLECTION.map((p) => (
              <span key={p.n} className={col.gagnees >= p.n ? "atteint" : ""} style={{ left: `${(p.n / col.total) * 100}%` }}>
                {p.emoji}
              </span>
            ))}
          </div>
          <p className="ab-suivant">
            {suivant ? (
              <>
                Encore <b>{suivant.n - col.gagnees}</b> → {suivant.emoji} {suivant.titre}
                {suivant.n === col.total && f.cadeau ? ` + 🎁 ${f.cadeau}` : ""}
              </>
            ) : (
              <>🏆 Collection complète !</>
            )}
          </p>
        </div>
      </div>

      {enCours && (
        <a className="ab-maintenant" href={`/f/${encodeURIComponent(f.slug)}`} style={{ "--a": t.a, "--b": t.b } as CSSProperties}>
          <Particules theme={t} n={6} />
          <span className="ab-m-fig">
            <FigurineOuClik className="ab-img" src={fig} edition={enCours.cle} />
            <em aria-hidden="true">{enCours.emoji}</em>
          </span>
          <span className="ab-m-texte">
            <small>● À GAGNER MAINTENANT</small>
            <b>Édition {enCours.nom}</b>
            <span>
              Encore {enCours.reste} jour{(enCours.reste ?? 0) > 1 ? "s" : ""} : une visite, et elle est dans ton album.
            </span>
          </span>
          <span className="ab-m-go">J’y vais ›</span>
        </a>
      )}

      <ol className="ab-grille" aria-label="Les cases de l’album">
        {col.cases.map((c, i) => {
          const th = themeDe(c);
          const nouv = nouvelles.has(c.cle);
          return (
            <li key={c.cle} style={{ "--a": th.a, "--b": th.b, "--d": `calc(var(--d0) + ${i * 0.035}s)` } as CSSProperties}>
              <button
                type="button"
                className={`ab-case ${c.etat} ${c.sorte}${nouv ? " nouvelle" : ""}`}
                onClick={() => onOuvre({ f, c })}
                aria-label={`${c.sorte === "rare" ? "Édition rare" : `Édition ${c.nom}`} : ${legende(c)}`}
              >
                <span className="ab-fond">
                  <FigurineOuClik className="ab-img" src={fig} edition={c.sorte === "rare" ? null : c.cle} rare={c.sorte === "rare"} fixe />
                  <em aria-hidden="true">{c.etat === "a-venir" ? "🔒" : c.emoji}</em>
                  {c.etat === "en-cours" && (
                    <b className="ab-q" aria-hidden="true">
                      ?
                    </b>
                  )}
                  {c.etat === "gagnee" && <i className="ab-reflet" aria-hidden="true" />}
                  {nouv && <strong className="ab-nouv">Nouvelle !</strong>}
                </span>
                <small>{legende(c)}</small>
              </button>
            </li>
          );
        })}
        <li className="ab-or-li" style={{ "--d": `calc(var(--d0) + ${col.cases.length * 0.035}s)` } as CSSProperties}>
          <button type="button" className={`ab-case ab-or${col.complete ? " gagnee" : ""}`} onClick={() => onOuvre({ f, c: "or" })} aria-label="La figurine d’or">
            <span className="ab-fond">
              <FigurineOuClik className="ab-img" src={fig} fixe />
              <em aria-hidden="true">🏆</em>
              {col.complete && <i className="ab-reflet" aria-hidden="true" />}
              <span className="ab-or-texte">
                <b>La figurine d’or</b>
                <small>{col.complete ? (col.or ? `n° ${col.or}` : "à toi !") : `${Math.min(col.gagnees, col.total)} / ${col.total}`}</small>
              </span>
            </span>
          </button>
        </li>
      </ol>
    </article>
  );
}

// ─── une case, en grand ────────────────────────────────────────────────────────────────────────────
function Fiche({ o, onFerme }: { o: NonNullable<Ouverte>; onFerme: () => void }) {
  const { f, c } = o;
  const col = f.collection as Collection;
  const fig = f.figurine ?? FIGURINE_PAR_DEFAUT;
  const de = deNom(f.nom);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onFerme();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onFerme]);

  const or = c === "or";
  const th = or ? OR : themeDe(c);
  const etat = or ? (col.complete ? "gagnee" : "a-venir") : c.etat;
  const titre = or ? `La figurine d’or${col.complete && col.or ? ` n° ${col.or}` : ""}` : c.sorte === "rare" ? `Édition rare${c.numero ? ` n° ${c.numero}` : ""}` : `Édition ${c.nom}`;
  let dit: string;
  let puce: string;
  if (or) {
    const reste = Math.max(0, col.total - col.gagnees);
    puce = col.complete ? "🏆 À toi" : `🔒 Encore ${reste}`;
    dit = col.complete
      ? col.remis
        ? `Ta collection ${de} est complète. 🎁 Cadeau remis : bravo !`
        : f.cadeau
          ? `Ta collection ${de} est complète. 🎁 ${f.cadeau} : montre cet écran au comptoir.`
          : `Ta collection ${de} est complète. Bravo !`
      : `Elle s’ouvre à ${col.total} figurines ${de}, numérotée${f.cadeau ? `, avec 🎁 ${f.cadeau}` : ""}.`;
  } else if (c.etat === "gagnee") {
    puce = c.le ? `✓ Gagnée le ${jourEnClair(c.le)}` : "✓ Gagnée";
    dit = c.sorte === "rare" ? "Une rare : gagnée le jour d’une place libre. Elles ne sont que deux." : "Elle est dans ton album pour toujours.";
  } else if (c.etat === "en-cours") {
    puce = `⏳ Encore ${c.reste} jour${(c.reste ?? 0) > 1 ? "s" : ""}${c.fin ? ` · jusqu’au ${jourEnClair(c.fin)}` : ""}`;
    dit = `Une visite validée au comptoir ${de}, et elle rejoint ton album. Après, elle est manquée.`;
  } else if (c.etat === "a-venir") {
    puce = c.debut ? `📅 Dès le ${jourEnClair(c.debut)}` : "📅 Bientôt";
    dit = "Elle ne se gagne que pendant son mois : reviens à ce moment-là.";
  } else if (c.etat === "manquee") {
    puce = "Manquée";
    dit = "Son mois est passé. Une édition manquée est manquée : c’est ce qui rend les autres précieuses.";
  } else {
    puce = "✨ Rare";
    dit = `Elle ne se gagne que le jour où ${f.nom} annonce une place libre. Il n’y en a que deux.`;
  }

  return (
    <div className="ab-voile" role="dialog" aria-modal="true" aria-label={titre} onClick={onFerme}>
      <div className="ab-fiche" onClick={(e) => e.stopPropagation()} style={{ "--a": th.a, "--b": th.b } as CSSProperties}>
        <span className={`ab-grande ${etat}${!or && c.sorte === "rare" ? " rare" : ""}${or ? " ab-or" : ""}`}>
          {etat === "gagnee" && <Particules theme={th} n={8} />}
          <FigurineOuClik className="ab-img" src={fig} edition={or || c.sorte === "rare" ? null : c.cle} rare={!or && c.sorte === "rare"} />
          <em aria-hidden="true">{or ? "🏆" : c.etat === "a-venir" ? "🔒" : c.emoji}</em>
          {etat === "gagnee" && <i className="ab-reflet" aria-hidden="true" />}
        </span>
        <b className="ab-f-titre">{titre}</b>
        <span className="ab-f-puce">{puce}</span>
        <p>{dit}</p>
        <div className="ab-f-actions">
          {!or && c.etat === "en-cours" && (
            <a className="ab-f-go" href={`/f/${encodeURIComponent(f.slug)}`}>
              Voir {f.nom} ›
            </a>
          )}
          <button type="button" onClick={onFerme}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

export function Album({ familles }: { familles: MaFamille[] }) {
  const [ouverte, setOuverte] = useState<Ouverte>(null);
  const avec = familles.filter((f) => f.collection);
  if (!avec.length) return null;
  return (
    <>
      <div className="ab">
        {avec.map((f, i) => (
          <PageAlbum key={f.slug} f={f} ordre={i} onOuvre={setOuverte} />
        ))}
      </div>
      {ouverte && <Fiche o={ouverte} onFerme={() => setOuverte(null)} />}
    </>
  );
}

export const STYLES_ALBUM = `
.ab{display:grid;grid-template-columns:minmax(0,1fr);gap:18px}
.ab-page{position:relative;padding:14px 12px 14px;border-radius:26px;background:linear-gradient(180deg,rgba(255,255,255,.075),rgba(255,255,255,.03));border:1px solid rgba(255,255,255,.12);box-shadow:0 26px 50px -30px rgba(0,0,0,.95);animation:ab-entre .55s cubic-bezier(.2,.9,.3,1) var(--d0) both}
.ab-tete{display:flex;align-items:center;justify-content:space-between;gap:10px}
.ab-nom{display:flex;align-items:center;gap:10px;min-width:0;color:#FFF4E6;text-decoration:none}
.ab-avatar{position:relative;flex:none;width:44px;height:44px;border-radius:14px;overflow:hidden;background:linear-gradient(160deg,#FF9AD0,#7B1B5E)}
.ab-avatar .ab-img{position:absolute;left:8%;bottom:-2px;width:84%;height:94%;object-fit:contain;object-position:bottom}
.ab-nom > span:last-child{display:flex;flex-direction:column;min-width:0}
.ab-nom b{font-size:17px;line-height:1.15;font-weight:900;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ab-nom small{font-size:12px;color:#A88E99}
.ab-trophees{flex:none;padding:6px 10px;border-radius:999px;background:linear-gradient(135deg,#FFE7A0,#B8801E);color:#2A1408;font-weight:900;font-size:15px;box-shadow:0 0 18px rgba(255,214,120,.5)}
.ab-trophees b{font-size:13px;margin-left:2px}
.ab-compte{display:flex;align-items:center;gap:14px;margin:14px 2px 0}
.ab-chiffre{flex:none;margin:0;display:flex;align-items:baseline;gap:3px}
.ab-chiffre b{font-size:46px;line-height:.9;font-weight:900;letter-spacing:-.04em;font-variant-numeric:tabular-nums;background:linear-gradient(135deg,#fff,#FFC8E6 50%,#F2C46B);-webkit-background-clip:text;background-clip:text;color:transparent}
.ab-chiffre span{font-size:17px;font-weight:800;color:#A88E99}
.ab-jauge-bloc{flex:1;min-width:0}
.ab-jauge{position:relative;height:12px;margin:10px 12px 0 0;border-radius:999px;background:rgba(255,255,255,.1)}
.ab-jauge i{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:linear-gradient(90deg,#FF2E9A,#FF8FCB 60%,#F2C46B);box-shadow:0 0 14px rgba(255,46,154,.6);transform-origin:left;animation:ab-remplir 1.1s cubic-bezier(.2,.9,.3,1) var(--d0) both}
.ab-jauge span{position:absolute;top:50%;display:grid;place-items:center;width:24px;height:24px;margin:-12px 0 0 -12px;border-radius:50%;background:#2A1220;border:2px solid rgba(255,255,255,.2);font-size:13px;filter:grayscale(1);opacity:.7}
.ab-jauge span.atteint{filter:none;opacity:1;border-color:#F2C46B;box-shadow:0 0 10px rgba(242,196,107,.7)}
.ab-suivant{margin:10px 0 0;font-size:13px;line-height:1.35;color:#D9C3CB}
.ab-suivant b{color:#FFF4E6}
.ab-maintenant{position:relative;display:flex;align-items:center;gap:12px;margin:14px 0 0;padding:10px 12px 10px 10px;border-radius:20px;overflow:hidden;color:#FFF4E6;text-decoration:none;
  background:radial-gradient(80% 120% at 0% 0%,color-mix(in srgb,var(--a) 55%,transparent),transparent 70%),linear-gradient(120deg,color-mix(in srgb,var(--b) 85%,#000),#1E0A17);
  border:1.5px solid color-mix(in srgb,var(--a) 80%,transparent);box-shadow:0 0 30px -8px color-mix(in srgb,var(--a) 70%,transparent);animation:ab-pouls 2.4s ease-in-out infinite}
.ab-m-fig{position:relative;flex:none;width:58px;height:74px;border-radius:14px;overflow:hidden;background:linear-gradient(160deg,var(--a),var(--b));border:2px solid #F2C46B}
.ab-m-fig .ab-img{position:absolute;left:8%;bottom:-2px;width:84%;height:90%;object-fit:contain;object-position:bottom}
.ab-m-fig em{position:absolute;left:3px;top:1px;font-style:normal;font-size:16px}
.ab-m-texte{position:relative;display:flex;flex-direction:column;gap:1px;min-width:0}
.ab-m-texte small{font-size:10px;font-weight:900;letter-spacing:.12em;color:#F2C46B;animation:ab-clignote 1.6s ease-in-out infinite}
.ab-m-texte b{font-size:17px;line-height:1.1;font-weight:900}
.ab-m-texte span{font-size:12.5px;line-height:1.3;color:rgba(255,244,230,.85)}
.ab-m-go{position:relative;flex:none;margin-left:auto;padding:9px 13px;border-radius:999px;background:#FF2E9A;color:#fff;font-size:13px;font-weight:900;white-space:nowrap;box-shadow:0 8px 18px -8px rgba(255,46,154,.9)}
.ab-grille{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:14px 0 0;padding:0;list-style:none}
.ab-grille li{display:flex;animation:ab-pop .5s cubic-bezier(.2,1.5,.4,1) var(--d) both}
.ab-or-li{grid-column:span 2}
.ab-case{display:flex;flex-direction:column;align-items:stretch;gap:4px;width:100%;padding:0;border:0;background:none;color:#FFF4E6;font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .15s}
.ab-case:active{transform:scale(.95)}
.ab-fond{position:relative;display:block;aspect-ratio:3/4;border-radius:14px;overflow:hidden;background:linear-gradient(160deg,color-mix(in srgb,var(--a) 22%,#2A1220),#1A0913);border:1.5px solid rgba(255,255,255,.12)}
.ab-fond .ab-img{position:absolute;left:8%;bottom:-2px;width:84%;height:88%;object-fit:contain;object-position:bottom}
.ab-fond em{position:absolute;left:4px;top:3px;z-index:1;font-style:normal;font-size:15px;line-height:1}
.ab-case small{font-size:10.5px;font-weight:800;line-height:1.1;text-align:center;color:#A88E99;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ab-case.gagnee .ab-fond{background:linear-gradient(160deg,var(--a),var(--b));border-color:rgba(255,255,255,.55);box-shadow:0 8px 16px -8px rgba(0,0,0,.8)}
.ab-case.gagnee .ab-fond .ab-img{filter:drop-shadow(0 5px 5px rgba(0,0,0,.45))}
.ab-case.gagnee small{color:#FFF4E6}
.ab-reflet{position:absolute;inset:0;background:linear-gradient(110deg,transparent 35%,rgba(255,255,255,.55) 50%,transparent 65%);transform:translateX(-120%);animation:ab-reflet 4.2s ease-in-out infinite}
.ab-case.en-cours .ab-fond{background:linear-gradient(160deg,color-mix(in srgb,var(--a) 45%,#2A1220),color-mix(in srgb,var(--b) 70%,#000));border:2px solid #F2C46B;animation:ab-pouls 2s ease-in-out infinite}
.ab-case.en-cours .ab-fond .ab-img{filter:brightness(0);opacity:.55}
.ab-q{position:absolute;inset:0;display:grid;place-items:center;font-size:30px;font-weight:900;color:#FFF4E6;text-shadow:0 2px 12px rgba(0,0,0,.6);animation:ab-flotte 1.8s ease-in-out infinite}
.ab-case.en-cours small{color:#F2C46B}
.ab-case.a-venir .ab-fond .ab-img{filter:brightness(0);opacity:.4}
.ab-case.manquee .ab-fond{filter:grayscale(1);opacity:.42;border-style:dashed}
.ab-case.manquee .ab-fond .ab-img{filter:brightness(.6)}
.ab-case.rare .ab-fond,.ab-case.gagnee.rare .ab-fond{border:2px solid transparent;background:linear-gradient(135deg,#2A1640,#160A24) padding-box,linear-gradient(120deg,#C9B6FF,#7B5CFF,#FF7AD9,#7FE7FF,#C9B6FF) border-box;background-size:auto,300% 300%;animation:ab-holo 4s linear infinite}
.ab-case.rare .ab-fond .ab-img{filter:brightness(0);opacity:.45}
.ab-case.gagnee.rare .ab-fond{background:linear-gradient(135deg,#E2D6FF,#9C84FF 40%,#FF9BE0 70%,#9AF0FF) padding-box,linear-gradient(120deg,#C9B6FF,#7B5CFF,#FF7AD9,#7FE7FF,#C9B6FF) border-box;background-size:auto,300% 300%}
.ab-case.gagnee.rare .ab-fond .ab-img{filter:drop-shadow(0 5px 5px rgba(0,0,0,.45))}
.ab-case.nouvelle .ab-fond{animation:ab-nouvelle .9s cubic-bezier(.2,1.6,.4,1) both;box-shadow:0 0 0 3px #FF2E9A,0 0 22px rgba(255,46,154,.8)}
.ab-nouv{position:absolute;left:50%;bottom:6px;z-index:2;transform:translateX(-50%);padding:2px 7px;border-radius:999px;background:#FF2E9A;color:#fff;font-size:9.5px;font-weight:900;white-space:nowrap;box-shadow:0 4px 10px rgba(0,0,0,.4)}
.ab-or .ab-fond{aspect-ratio:auto;height:100%;min-height:100%;background:linear-gradient(135deg,#3A2A10,#1C1208);border:2px dashed rgba(255,214,120,.55)}
.ab-or .ab-fond .ab-img{left:auto;right:4%;width:46%;height:88%;filter:sepia(1) saturate(3) hue-rotate(-12deg) brightness(.35)}
.ab-or .ab-fond em{font-size:20px}
.ab-or-texte{position:absolute;left:10px;bottom:10px;display:flex;flex-direction:column;align-items:flex-start;max-width:52%;text-align:left}
.ab-or-texte b{font-size:14px;line-height:1.1;font-weight:900;color:#FFE7A0}
.ab-or-texte small{margin-top:3px;font-size:12px;font-weight:900;color:#F2C46B}
.ab-or.gagnee .ab-fond{background:linear-gradient(135deg,#FFE7A0,#B8801E);border:2px solid #FFE7A0;box-shadow:0 0 24px rgba(255,214,120,.6)}
.ab-or.gagnee .ab-fond .ab-img{filter:sepia(1) saturate(3.2) hue-rotate(-12deg) brightness(1.05) drop-shadow(0 5px 5px rgba(0,0,0,.4))}
.ab-or.gagnee .ab-or-texte b,.ab-or.gagnee .ab-or-texte small{color:#2A1408}
.ab-or-li .ab-case{height:100%}
/* une case en grand */
.ab-voile{position:fixed;inset:0;z-index:50;display:grid;place-items:end center;padding:16px 16px calc(16px + env(safe-area-inset-bottom));background:rgba(10,3,8,.72);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);animation:ab-voile .25s ease both}
.ab-fiche{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;max-width:400px;box-sizing:border-box;padding:22px 18px 18px;border-radius:28px;text-align:center;
  background:radial-gradient(90% 60% at 50% 0%,color-mix(in srgb,var(--a) 40%,transparent),transparent 70%),#1E0C18;border:1px solid rgba(255,255,255,.14);box-shadow:0 30px 60px rgba(0,0,0,.7);animation:ab-monte .4s cubic-bezier(.2,1.3,.4,1) both}
.ab-grande{position:relative;display:block;width:170px;aspect-ratio:3/4;border-radius:22px;overflow:hidden;background:linear-gradient(160deg,color-mix(in srgb,var(--a) 30%,#2A1220),#1A0913);border:2px solid rgba(255,255,255,.2);animation:ab-tourne .7s cubic-bezier(.2,1.2,.4,1) both}
.ab-grande .ab-img{position:absolute;left:8%;bottom:-2px;width:84%;height:88%;object-fit:contain;object-position:bottom}
.ab-grande em{position:absolute;left:8px;top:6px;z-index:1;font-style:normal;font-size:26px}
.ab-grande.gagnee{background:linear-gradient(160deg,var(--a),var(--b));border-color:#F2C46B;box-shadow:0 0 0 4px rgba(242,196,107,.25),0 18px 30px -12px rgba(0,0,0,.9)}
.ab-grande.en-cours .ab-img,.ab-grande.a-venir .ab-img,.ab-grande.rare:not(.gagnee) .ab-img{filter:brightness(0);opacity:.5}
.ab-grande.manquee{filter:grayscale(1);opacity:.6}
.ab-grande.ab-or:not(.gagnee) .ab-img{filter:sepia(1) saturate(3) hue-rotate(-12deg) brightness(.35)}
.ab-grande.ab-or.gagnee .ab-img{filter:sepia(1) saturate(3.2) hue-rotate(-12deg) brightness(1.05)}
.ab-f-titre{margin-top:6px;font-size:22px;line-height:1.1;font-weight:900;letter-spacing:-.02em}
.ab-f-puce{padding:5px 12px;border-radius:999px;background:rgba(255,255,255,.1);font-size:13px;font-weight:800;color:#F2C46B}
.ab-fiche p{margin:2px 0 0;max-width:320px;font-size:14px;line-height:1.45;color:#D9C3CB}
.ab-f-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:10px}
.ab-f-actions a,.ab-f-actions button{padding:12px 20px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#FFF4E6;font:inherit;font-size:15px;font-weight:900;text-decoration:none;cursor:pointer}
.ab-f-actions .ab-f-go{background:#FF2E9A;border-color:#FF2E9A;box-shadow:0 10px 22px -10px rgba(255,46,154,.9)}
@keyframes ab-entre{from{opacity:0;transform:translateY(16px)}}
@keyframes ab-pop{from{opacity:0;transform:scale(.6) rotate(-6deg)}}
@keyframes ab-remplir{from{transform:scaleX(0)}}
@keyframes ab-reflet{0%,55%{transform:translateX(-120%)}80%,100%{transform:translateX(120%)}}
@keyframes ab-pouls{0%,100%{box-shadow:0 0 0 0 rgba(242,196,107,.0),0 0 18px -6px rgba(242,196,107,.6)}50%{box-shadow:0 0 0 4px rgba(242,196,107,.18),0 0 28px -4px rgba(242,196,107,.85)}}
@keyframes ab-flotte{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes ab-clignote{50%{opacity:.55}}
@keyframes ab-holo{to{background-position:0 0,300% 0}}
@keyframes ab-nouvelle{0%{transform:scale(.4) rotate(-12deg)}60%{transform:scale(1.12) rotate(3deg)}}
@keyframes ab-voile{from{opacity:0}}
@keyframes ab-monte{from{opacity:0;transform:translateY(40px) scale(.96)}}
@keyframes ab-tourne{from{transform:perspective(600px) rotateY(-90deg)}}
@media (min-width:600px){.ab-grille{grid-template-columns:repeat(8,minmax(0,1fr))}}
@media (min-width:860px){
  .ab{gap:24px}
  .ab-page{padding:20px 22px}
  .ab-chiffre b{font-size:60px}
  .ab-voile{place-items:center}
}
@media (prefers-reduced-motion:reduce){.ab *,.ab-voile,.ab-voile *{animation:none!important}}
`;
