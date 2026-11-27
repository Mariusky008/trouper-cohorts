"use client";

/**
 * ☀️ « QUOI DE NEUF ? », EN HAUT DE DÉCOUVRIR (26 novembre 2026 ; la maquette validée par le propriétaire,
 * https://claude.ai/artifact/YT3qagN9r2jdPZNZBdXhAW ; `lib/direct/fil-decouvrir.ts`, `QuoiDeNeufFil`).
 *
 * Le propriétaire, avec une capture du « Quoi de neuf ? » de Facebook : « tout en haut de la page, une petite section
 * comme le fil d'actualité de Facebook, mais chez nous ce serait les humeurs du jour des gens autour de nous ; et si on
 * n'a pas d'amis, des figurines de personnes qui pourraient avoir des synergies avec nous, à découvrir. Quand on clique
 * dessus, on a la figurine du jour, la possibilité de réagir avec sa figurine, voir sa maison… ».
 *
 * La rangée (elle glisse de côté) :
 *   · la sienne d'abord, « Ton humeur » (avec « ＋ » tant qu'il ne l'a pas dite ; la toucher ouvre « Ton humeur du jour ») ;
 *   · ses proches qui ont dit leur humeur aujourd'hui : leur figurine qui en fait la tête, l'emoji dans un rond rose tant
 *     qu'il ne l'a pas regardée ;
 *   · sans proche, des gens de son âge qui partagent une de ses passions et ont ouvert leur maison (« ⚽ Foot, comme toi »).
 * Toucher une carte : sa figurine du jour en grand (sa pancarte), et « Réagis avec ta figurine » — pour de vrai :
 *   · un proche : un câlin, « Je pense à toi », un cœur, un fou rire, dans leur conversation (sa figurine le fait chez
 *     lui) ; « Lui répondre » (Messages), « Voir sa maison » ;
 *   · quelqu'un à découvrir : 👋 coucou, « ⚽ Allez ! » (sa passion), 😂, 👏 — sa figurine apparaît dans sa pièce en le
 *     faisant (le coucou de la maison ouverte) ; « Frapper à sa porte », et le salon de leur passion (le propriétaire :
 *     « on veut que les gens interagissent les uns avec les autres, l'idée c'est vraiment de créer des liens avec des
 *     inconnus »).
 * Toucher à droite : la suivante ; à gauche : la précédente.
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FigurineAssise } from "./autour";
import type { MaisonFil, ProcheHumeurFil, QuoiDeNeufFil, SilhouetteFil } from "@/lib/direct/fil-decouvrir";
import { GESTES_COUCOU, type GesteCoucou } from "@/lib/direct/ma-maison";
import { nomDuSalon } from "@/lib/direct/salons-ouverts";

export const PHRASES_QUOI_DE_NEUF = {
  titre: "Quoi de neuf ?",
  sousProches: "Les humeurs du jour de tes proches",
  sousDecouvrir: "Ils aiment ce que tu aimes",
  sousSeul: "Dis à tes proches comment tu vas",
  tonHumeur: "Ton humeur",
  aujourdhui: (nom: string) => `${nom} aujourd’hui`,
  commeToi: (e: string, court: string) => `${e} ${court.charAt(0).toUpperCase()}${court.slice(1)}, comme toi`,
  reagis: "Réagis avec ta figurine",
  procheVerra: (prenom: string) => `${prenom} verra ta figurine faire ton geste`,
  inconnuVerra: "Ta figurine apparaît dans sa pièce, avec ton prénom",
  envoye: (prenom: string, e: string) => `${e} C’est parti : ${prenom} va voir ta figurine`,
  repondre: "Lui répondre",
  voirMaison: "Voir sa maison",
  frapper: "Frapper à sa porte",
  fermer: "Fermer",
  precedent: "Précédent",
  suivant: "Suivant",
  rate: "Ça n’a pas marché. Réessaie.",
} as const;
const P = PHRASES_QUOI_DE_NEUF;

/** Les gestes pour un proche : ceux de la conversation (« le salon du duo »), que sa figurine fait chez lui. */
const GESTES_PROCHE = [
  { id: "calin", e: "🤗", nom: "Un câlin", type: "geste", quoi: "calin" },
  { id: "pense", e: "💭", nom: "Je pense à toi", type: "panneau", quoi: "pense" },
  { id: "coeur", e: "❤️", nom: "Un cœur", type: "reaction", quoi: "coeur" },
  { id: "mdr", e: "😂", nom: "Je ris", type: "reaction", quoi: "mdr" },
] as const;

type Carte = { genre: "proche"; p: ProcheHumeurFil } | { genre: "maison"; p: MaisonFil };
const cleCarte = (c: Carte) => `${c.genre}:${c.p.cle}`;

// (ce qu'il a déjà regardé aujourd'hui : le rond rose s'éteint)
const CLE_VUS = "clikme-quoi-de-neuf-vus";
const jour = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
function lireVus(): string[] {
  try {
    const x = JSON.parse(window.localStorage.getItem(CLE_VUS) ?? "null") as { jour?: string; cles?: string[] } | null;
    return x?.jour === jour() && Array.isArray(x.cles) ? x.cles : [];
  } catch {
    return [];
  }
}
function ecrireVus(cles: string[]) {
  try {
    window.localStorage.setItem(CLE_VUS, JSON.stringify({ jour: jour(), cles: cles.slice(-60) }));
  } catch {
    /* (rien) */
  }
}

const poster = (route: string, corps: Record<string, unknown>) =>
  fetch(route, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) })
    .then(async (r) => ({ ok: r.ok, j: ((await r.json().catch(() => ({}))) ?? {}) as { error?: string } }))
    .catch(() => ({ ok: false, j: {} as { error?: string } }));

export function QuoiDeNeuf({ q, moi, pastille, onHumeur, onRepondre, onCoucou }: { q: QuoiDeNeufFil; moi: SilhouetteFil | null; /** une pastille en haut (une surprise) : on se met dessous */ pastille?: boolean; onHumeur: () => void; onRepondre: (cle: string) => void; onCoucou: (cle: string) => void }) {
  const cartes: Carte[] = q.proches.length ? q.proches.map((p) => ({ genre: "proche", p })) : q.decouvrir.map((p) => ({ genre: "maison", p }));
  const [vus, setVus] = useState<string[]>([]);
  const [ouverte, setOuverte] = useState<number | null>(null);
  useEffect(() => {
    void Promise.resolve().then(() => setVus(lireVus()));
  }, []);
  const ouvrir = (i: number) => {
    setOuverte(i);
    const k = cleCarte(cartes[i]);
    if (!vus.includes(k)) {
      const l = [...vus, k];
      setVus(l);
      ecrireVus(l);
    }
  };

  return (
    <section className={`qn${pastille ? " sous-pastille" : ""}`} data-quoi-de-neuf aria-label={P.titre}>
      <div className="qn-tete">
        <h2>{P.titre}</h2>
        <small>{q.proches.length ? P.sousProches : q.decouvrir.length ? P.sousDecouvrir : P.sousSeul}</small>
      </div>
      <div className="qn-rang">
        <button type="button" className="qn-carte qn-moi" onClick={onHumeur} data-mon-humeur={q.mienne ? "1" : undefined}>
          <span className="qn-fig">{moi && <FigurineAssise f={{ ...moi, pancarte: undefined }} hauteur={126} />}</span>
          {q.mienne ? (
            <span className="qn-emoji vu" aria-hidden="true">
              {q.mienne.emoji}
            </span>
          ) : (
            <b className="qn-plus" aria-hidden="true">
              ＋
            </b>
          )}
          <span className="qn-nom">{P.tonHumeur}</span>
        </button>
        {cartes.map((c, i) => (
          <button key={cleCarte(c)} type="button" className={`qn-carte${c.genre === "maison" ? " qn-maison" : ""}`} onClick={() => ouvrir(i)} data-carte={c.p.cle} data-vue={vus.includes(cleCarte(c)) ? "1" : undefined} style={c.genre === "maison" ? { backgroundImage: `url(${c.p.image})` } : undefined}>
            {c.genre === "proche" && (
              <span className={`qn-emoji${vus.includes(cleCarte(c)) ? " vu" : ""}`} aria-hidden="true">
                {c.p.emoji}
              </span>
            )}
            <span className="qn-fig">
              <FigurineAssise f={{ ...c.p.figurine, pancarte: undefined }} hauteur={136} />
            </span>
            {c.genre === "maison" && <span className="qn-passion">{P.commeToi(c.p.passion.e, c.p.passion.court)}</span>}
            <span className="qn-nom">{c.p.prenom}</span>
          </button>
        ))}
      </div>
      {/* (par-dessus tout, menu compris : hors du fil, qui fait sa propre couche) */}
      {ouverte !== null &&
        cartes[ouverte] &&
        createPortal(
        <Histoire
          cartes={cartes}
          i={ouverte}
          moi={moi}
          onAller={(j) => (j >= 0 && j < cartes.length ? ouvrir(j) : setOuverte(null))}
          onFermer={() => setOuverte(null)}
          onRepondre={(cle) => {
            setOuverte(null);
            onRepondre(cle);
          }}
          onCoucou={onCoucou}
        />,
          document.body,
        )}
    </section>
  );
}

/** 📖 Une carte ouverte : sa figurine du jour en grand, et réagir avec la sienne. */
function Histoire({ cartes, i, moi, onAller, onFermer, onRepondre, onCoucou }: { cartes: Carte[]; i: number; moi: SilhouetteFil | null; onAller: (j: number) => void; onFermer: () => void; onRepondre: (cle: string) => void; onCoucou: (cle: string) => void }) {
  const c = cartes[i];
  const [envoi, setEnvoi] = useState<{ cle: string; e: string; texte: string } | null>(null);
  const [geste, setGeste] = useState("");
  const [hauteur, setHauteur] = useState(300);
  useEffect(() => {
    const ajuster = () => setHauteur(Math.max(180, Math.min(340, Math.round(window.innerHeight * 0.36))));
    ajuster();
    window.addEventListener("resize", ajuster);
    return () => window.removeEventListener("resize", ajuster);
  }, []);
  // (Échap ferme ; ← → passent de l'un à l'autre)
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
      else if (e.key === "ArrowRight") onAller(i + 1);
      else if (e.key === "ArrowLeft") onAller(i - 1);
    };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [i, onAller, onFermer]);
  const cle = c.p.cle;
  const fait = envoi?.cle === cleCarte(c) ? envoi : null;

  async function reagirProche(g: (typeof GESTES_PROCHE)[number]) {
    if (c.genre !== "proche" || geste) return;
    setGeste(g.id);
    const r = await poster("/api/direct/proches", { action: "geste", cle, type: g.type, quoi: g.quoi });
    setGeste("");
    setEnvoi({ cle: cleCarte(c), e: g.e, texte: r.ok ? P.envoye(c.p.prenom, g.e) : r.j.error || P.rate });
  }
  async function coucou(g: GesteCoucou, e: string) {
    if (c.genre !== "maison" || geste) return;
    setGeste(g);
    const r = await poster("/api/direct/visites", { action: "coucou", cle, geste: g, ...(g === "allez" ? { e } : {}) });
    setGeste("");
    if (r.ok) onCoucou(cle);
    setEnvoi({ cle: cleCarte(c), e, texte: r.ok ? P.envoye(c.p.prenom, e) : r.j.error || P.rate });
  }

  return (
    <div className={`qn-histoire${c.genre === "maison" ? " qn-chez" : ""}`} role="dialog" aria-modal="true" aria-label={c.p.prenom} data-histoire={cle} style={c.genre === "maison" ? { backgroundImage: `linear-gradient(rgba(11,4,9,.55),rgba(11,4,9,.35) 40%,rgba(11,4,9,.85)),url(${c.p.image})` } : undefined}>
      <div className="qn-barres" aria-hidden="true">
        {cartes.map((x, j) => (
          <i key={cleCarte(x)} className={j <= i ? "lu" : ""} />
        ))}
      </div>
      <div className="qn-h-tete">
        {c.genre === "proche" ? (
          <span className="qn-h-emoji" aria-hidden="true">
            {c.p.emoji}
          </span>
        ) : (
          <span className="qn-h-emoji" aria-hidden="true">
            {c.p.passion.e}
          </span>
        )}
        <span className="qn-h-qui">
          <b>{c.p.prenom}</b>
          <small>{c.genre === "proche" ? P.aujourdhui(c.p.nom) : P.commeToi(c.p.passion.e, c.p.passion.court)}</small>
        </span>
        <button type="button" className="qn-h-fermer" onClick={onFermer} aria-label={P.fermer} data-fermer-histoire>
          ✕
        </button>
      </div>

      <div className="qn-h-milieu">
        <button type="button" className="qn-h-zone g" onClick={() => onAller(i - 1)} aria-label={P.precedent} disabled={i === 0} />
        <span className="qn-h-fig" key={cleCarte(c)}>
          <FigurineAssise f={c.p.figurine} hauteur={hauteur} />
          {fait && (
            <span className="qn-h-geste" key={fait.texte} aria-hidden="true">
              {fait.e}
            </span>
          )}
        </span>
        <button type="button" className="qn-h-zone d" onClick={() => onAller(i + 1)} aria-label={P.suivant} />
      </div>

      <div className="qn-h-bas">
        <div className="qn-h-moi">
          <span className="qn-h-mafig">{moi && <FigurineAssise f={{ ...moi, pancarte: undefined }} hauteur={58} />}</span>
          <span>
            <b>{P.reagis}</b>
            <small>{c.genre === "proche" ? P.procheVerra(c.p.prenom) : P.inconnuVerra}</small>
          </span>
        </div>
        <div className="qn-gestes">
          {c.genre === "proche" ? (
            GESTES_PROCHE.map((g) => (
              <button key={g.id} type="button" className={`qn-geste${geste === g.id ? " part" : ""}`} onClick={() => void reagirProche(g)} data-geste={g.id}>
                <b aria-hidden="true">{g.e}</b>
                {g.nom}
              </button>
            ))
          ) : (
            GESTES_COUCOU.map((g) => {
              // (« Allez ! » avec l'emoji de leur passion)
              const e = g.cle === "allez" ? c.p.passion.e : g.e;
              return (
                <button key={g.cle} type="button" className={`qn-geste${geste === g.cle ? " part" : ""}`} onClick={() => void coucou(g.cle, e)} data-geste={g.cle}>
                  <b aria-hidden="true">{e}</b>
                  {g.nom}
                </button>
              );
            })
          )}
        </div>
        {fait && (
          <p className="qn-h-note" role="status" data-geste-parti>
            {fait.texte}
          </p>
        )}
        <div className="qn-h-boutons">
          {c.genre === "proche" ? (
            <>
              <button type="button" className="qn-bouton" onClick={() => onRepondre(cle)} data-repondre-histoire>
                {P.repondre}
              </button>
              <a className="qn-bouton second" href={`/univers/chez/${encodeURIComponent(cle)}`} data-voir-maison>
                {P.voirMaison}
              </a>
            </>
          ) : (
            <>
              <a className="qn-bouton" href={`/univers/chez/${encodeURIComponent(cle)}`} data-frapper-histoire>
                {P.frapper}
              </a>
              {c.p.passion.id && (
                <a className="qn-bouton second" href={`/univers/salons?theme=${c.p.passion.id}`} data-salon-passion>
                  {nomDuSalon(c.p.passion.id)}
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export const STYLES_QUOI_DE_NEUF = `
.qn{scroll-snap-align:start;padding:calc(64px + env(safe-area-inset-top)) 0 12px;background:#0B0409;border-bottom:1px solid rgba(255,255,255,.08)}
.qn.sous-pastille{padding-top:calc(104px + env(safe-area-inset-top))}
.qn-tete{display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding:0 16px 8px}
.qn-tete h2{flex:none;margin:0;font-size:19px;font-weight:900;color:#FFF4E6;white-space:nowrap}
.qn-tete small{min-width:0;font-size:12.5px;font-weight:700;color:#C9AFC0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.qn-rang{display:flex;gap:8px;overflow-x:auto;padding:0 16px;scroll-snap-type:x proximity;scrollbar-width:none;overscroll-behavior-x:contain}
.qn-rang::-webkit-scrollbar{display:none}
.qn-carte{position:relative;flex:none;width:118px;height:196px;padding:0;border:0;border-radius:16px;overflow:hidden;scroll-snap-align:start;background:#3A1F30 center/cover no-repeat;color:#fff;font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.qn-carte:nth-child(3n+2){background-color:#2F3A4B}
.qn-carte:nth-child(3n){background-color:#4A3B22}
.qn-moi{background:#22121C;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}
.qn-maison::after{content:"";position:absolute;inset:0;background:linear-gradient(rgba(11,4,9,.1),rgba(11,4,9,.2) 50%,rgba(11,4,9,.8))}
.qn-fig{position:absolute;left:0;right:0;bottom:26px;display:flex;justify-content:center;z-index:1;pointer-events:none}
.qn-moi .qn-fig{bottom:40px}
.qn-emoji{position:absolute;left:8px;top:8px;z-index:2;width:32px;height:32px;border-radius:50%;background:#fff;display:grid;place-items:center;font-size:18px;box-shadow:0 0 0 3px #FF2E9A}
.qn-emoji.vu{box-shadow:0 0 0 3px rgba(255,255,255,.3)}
.qn-plus{position:absolute;left:50%;bottom:30px;z-index:2;transform:translateX(-50%);width:30px;height:30px;border-radius:50%;background:#FF2E9A;color:#fff;display:grid;place-items:center;font-size:18px;box-shadow:0 0 0 3px #22121C}
.qn-moi .qn-emoji{left:50%;top:auto;bottom:30px;transform:translateX(-50%)}
.qn-nom{position:absolute;left:4px;right:4px;bottom:7px;z-index:2;text-align:center;font-size:12.5px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 4px rgba(0,0,0,.7)}
.qn-passion{position:absolute;left:5px;right:5px;top:7px;z-index:2;padding:3px 0;border-radius:999px;background:rgba(11,4,9,.7);color:#FFE2B8;font-size:10.5px;font-weight:800;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.qn-histoire{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;background:#3A1F30 center/cover no-repeat;color:#FFF4E6;padding-top:env(safe-area-inset-top);animation:qn-entre .22s ease-out}
@keyframes qn-entre{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:none}}
.qn-barres{display:flex;gap:4px;padding:10px 12px 0}
.qn-barres i{flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.35)}
.qn-barres i.lu{background:#fff}
.qn-h-tete{display:flex;align-items:center;gap:10px;padding:10px 8px 0 14px}
.qn-h-emoji{flex:none;width:38px;height:38px;border-radius:50%;background:#fff;display:grid;place-items:center;font-size:21px}
.qn-h-qui{flex:1;display:flex;flex-direction:column;min-width:0}
.qn-h-qui b{font-size:16px;font-weight:900}
.qn-h-qui small{font-size:12.5px;font-weight:700;color:#F4D9E6}
.qn-h-fermer{width:44px;height:44px;border:0;border-radius:50%;background:none;color:#fff;font:inherit;font-size:20px;cursor:pointer}
.qn-h-milieu{position:relative;flex:1;min-height:0;display:flex;align-items:center;justify-content:center}
.qn-h-zone{position:absolute;top:0;bottom:0;width:34%;border:0;background:none;padding:0;cursor:pointer;z-index:1;-webkit-tap-highlight-color:transparent}
.qn-h-zone.g{left:0}.qn-h-zone.d{right:0}
.qn-h-zone:disabled{cursor:default}
.qn-h-fig{position:relative;display:flex;justify-content:center;animation:qn-entre .25s ease-out}
.qn-h-geste{position:absolute;right:-18px;top:18%;font-size:44px;animation:qn-geste 1.4s ease-out forwards}
@keyframes qn-geste{0%{opacity:0;transform:scale(.4) translateY(20px)}25%{opacity:1;transform:scale(1.2)}100%{opacity:0;transform:scale(1) translateY(-60px)}}
.qn-h-bas{flex:none;display:flex;flex-direction:column;gap:12px;padding:16px 16px calc(18px + env(safe-area-inset-bottom));border-radius:24px 24px 0 0;background:#1A0D14}
.qn-h-moi{display:flex;align-items:center;gap:10px}
.qn-h-mafig{flex:none;display:flex;width:44px;justify-content:center}
.qn-h-moi span{display:flex;flex-direction:column}
.qn-h-moi b{font-size:15px;font-weight:900}
.qn-h-moi small{font-size:12.5px;font-weight:700;color:#C9AFC0}
.qn-gestes{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.qn-geste{display:flex;flex-direction:column;align-items:center;gap:4px;min-height:64px;padding:8px 4px;border:0;border-radius:16px;background:rgba(255,255,255,.1);color:#FFF4E6;font:inherit;font-size:11.5px;font-weight:800;cursor:pointer}
.qn-geste b{font-size:24px;line-height:1}
.qn-geste.part{background:#FF2E9A}
.qn-h-note{margin:0;font-size:13px;font-weight:800;color:#FFE2B8;text-align:center}
.qn-h-boutons{display:flex;gap:8px}
.qn-bouton{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;justify-content:center;min-height:48px;padding:0 12px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font:inherit;font-size:15px;font-weight:900;text-decoration:none;cursor:pointer}
.qn-bouton.second{background:none;box-shadow:inset 0 0 0 1px rgba(255,255,255,.3);color:#FFF4E6}
@media (prefers-reduced-motion:reduce){.qn-histoire,.qn-h-fig,.qn-h-geste{animation:none}}
`;
