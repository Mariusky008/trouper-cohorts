"use client";

/**
 * 📣 MON RÉSEAU DE DIFFUSION — au comptoir (l'accueil et Ma boutique). « Votre communication ne s'arrête plus à vos
 * abonnés » : ses vidéos passent aussi chez deux commerçants partenaires, près de chez lui, et les leurs chez lui.
 * La règle est dans `lib/direct/diffusion.ts` ; la route, `/api/site-internet/pro/diffusion-croisee`.
 *
 * Ce qu'il voit :
 *   · tant qu'il n'est pas dans le réseau : ce que c'est, les trois règles, et SON ACCORD à cocher — rien ne part
 *     chez lui sans ;
 *   · ensuite : ses deux partenaires, l'envoi automatique (ou une par une), les vidéos reçues de leur part (diffuser,
 *     pas celle-ci), et les siennes chez eux.
 */
import { useEffect, useState } from "react";
import type { CommerceComptoir } from "@/lib/direct/comptoir-ville";

type Video = {
  id: string;
  le: string;
  de: { nom: string; metier: string; page: string };
  vers: string;
  texte: string;
  decouverte: string;
  photo: string;
  video: string | null;
  statut: "en-attente" | "diffusee" | "refusee" | "perimee";
  diffuseeLe: string | null;
  reseaux: string[];
  erreur: string | null;
};
type Etat = {
  reglage: { active: boolean; auto: boolean };
  partenaires: { nom: string; metier: string; ville: string; ou: string; page: string }[];
  recues: Video[];
  envois: Video[];
  reseauxConnectes: boolean;
  plafond: number;
  cetteSemaine: number;
};
type Reponse = { ok?: boolean; etat?: Etat; error?: string };

async function demander(c: CommerceComptoir, corps: Record<string, unknown>): Promise<Reponse> {
  if (!c.reel) return { error: "Ton réseau de diffusion se règle avec ton lien pro." };
  try {
    const r = await fetch("/api/site-internet/pro/diffusion-croisee", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: c.reel.slug, token: c.reel.token, ...corps }),
    });
    const j = (await r.json().catch(() => ({}))) as Reponse;
    return r.ok ? j : { ...j, error: j.error ?? "Ça n'a pas marché. Réessaie." };
  } catch {
    return { error: "Pas de réseau : réessaie dans un instant." };
  }
}

const RESEAU: Record<string, string> = { instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok", linkedin: "LinkedIn", youtube: "YouTube" };
const STATUT: Record<Video["statut"], string> = {
  "en-attente": "⏳ En attente",
  diffusee: "✅ Diffusée",
  refusee: "Pas diffusée",
  perimee: "Plus d’actualité",
};
const jour = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" });

export function MonReseau({ commerce, onRetour }: { commerce: CommerceComptoir; onRetour: () => void }) {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [accord, setAccord] = useState(false);
  const [enCours, setEnCours] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    // sans lien pro (la visite du comptoir), rien à demander : l'écran le dit
    if (!commerce.reel) return;
    let vivant = true;
    void demander(commerce, { action: "etat" }).then((r) => {
      if (!vivant) return;
      if (r.etat) setEtat(r.etat);
      else if (r.error) setErreur(r.error);
    });
    return () => {
      vivant = false;
    };
  }, [commerce]);

  const agir = async (cle: string, corps: Record<string, unknown>) => {
    if (enCours) return;
    setEnCours(cle);
    setErreur(null);
    const r = await demander(commerce, corps);
    setEnCours(null);
    if (r.etat) setEtat(r.etat);
    if (r.error) setErreur(r.error);
  };

  const visite = !commerce.reel;
  const actif = etat?.reglage.active ?? false;

  return (
    <div className="dr">
      <style>{STYLES}</style>
      <div className="dr-haut">
        <button type="button" className="dr-retour" onClick={onRetour}>
          ‹ Mon comptoir
        </button>
        <span className="dr-titre">📣 Mon réseau</span>
      </div>
      <div className="dr-corps">
        {visite || (etat && !actif) ? (
          <section className="dr-intro">
            <h2>Tes vidéos, vues aussi chez tes voisins</h2>
            <p>
              Quand tu publies une vidéo, elle passe aussi sur les réseaux de <b>deux commerçants partenaires</b>, près de chez toi, en « découverte du
              quartier ». Et les leurs passent chez toi.
            </p>
            <ul className="dr-regles">
              <li>
                <span aria-hidden="true">📍</span> Deux partenaires tout près, choisis par ClikMe
              </li>
              <li>
                <span aria-hidden="true">🤝</span> Jamais un concurrent : pas deux coiffeurs ensemble
              </li>
              <li>
                <span aria-hidden="true">⚖️</span> Autant de diffusion donnée que reçue
              </li>
              <li>
                <span aria-hidden="true">🗓️</span> {etat?.plafond ?? 2} vidéos de partenaires par semaine au plus sur tes réseaux
              </li>
            </ul>
            {visite ? (
              <p className="dr-visite">👀 Ici, c’est la visite du comptoir : ton réseau de diffusion se règle dans <b>ton</b> comptoir, celui de ton lien pro.</p>
            ) : (
              <>
                <label className="dr-accord">
                  <input type="checkbox" checked={accord} onChange={(e) => setAccord(e.target.checked)} />
                  <span>J’accepte d’accueillir sur mes réseaux les vidéos de mes deux partenaires, et que les miennes passent chez eux.</span>
                </label>
                <button type="button" className="cz-go grand" disabled={!accord || !!enCours} onClick={() => void agir("rejoindre", { action: "rejoindre", accord: true })}>
                  📣 Rejoindre le réseau
                </button>
                {!accord && <small className="dr-note">Coche la case juste au-dessus : c’est ton accord.</small>}
              </>
            )}
          </section>
        ) : !etat ? (
          <p className="dr-attente">{erreur ? "" : "Je regarde ton réseau…"}</p>
        ) : (
          <>
            <section className="dr-statut">
              <div>
                <b>Diffusion croisée</b>
                <em>Active</em>
              </div>
              <button type="button" className="dr-lien" disabled={!!enCours} onClick={() => void agir("quitter", { action: "quitter" })}>
                Quitter le réseau
              </button>
            </section>

            <section className="dr-bloc">
              <h3>Mes deux partenaires de diffusion</h3>
              {etat.partenaires.length ? (
                <div className="dr-partenaires">
                  {etat.partenaires.map((p) => (
                    <a key={p.page} className="dr-partenaire" href={p.page} target="_blank" rel="noopener noreferrer">
                      <b>{p.nom}</b>
                      <em>{[p.metier, p.ou].filter(Boolean).join(" · ")}</em>
                      <i>Activé</i>
                    </a>
                  ))}
                </div>
              ) : null}
              {etat.partenaires.length < 2 && (
                <p className="dr-note">
                  {etat.partenaires.length === 0
                    ? "Tu es le premier du réseau dans ta ville : dès qu’un voisin le rejoint, vous vous diffusez l’un l’autre."
                    : "Ton deuxième partenaire arrive dès qu’un troisième commerce de ta ville rejoint le réseau."}
                </p>
              )}
            </section>

            <section className="dr-bloc">
              <h3>Leurs vidéos sur mes réseaux</h3>
              <div className="dr-choix" role="radiogroup" aria-label="Comment leurs vidéos partent">
                <button type="button" role="radio" aria-checked={etat.reglage.auto} className={etat.reglage.auto ? "on" : ""} onClick={() => !etat.reglage.auto && void agir("auto", { action: "auto", auto: true })}>
                  <b>Automatique</b>
                  <em>
                    Elles partent toutes seules, {etat.plafond} par semaine au plus ({etat.cetteSemaine} cette semaine)
                  </em>
                </button>
                <button type="button" role="radio" aria-checked={!etat.reglage.auto} className={!etat.reglage.auto ? "on" : ""} onClick={() => etat.reglage.auto && void agir("auto", { action: "auto", auto: false })}>
                  <b>Une par une</b>
                  <em>Elles m’attendent ici, je choisis</em>
                </button>
              </div>
              {!etat.reseauxConnectes && <p className="dr-avertir">Connecte tes réseaux (Ma boutique → Réseaux) pour accueillir leurs vidéos ; en attendant, elles t’attendent ici.</p>}
            </section>

            <section className="dr-bloc">
              <h3>Reçues de mes partenaires</h3>
              {etat.recues.length ? (
                etat.recues.map((v) => (
                  <article key={v.id} className="dr-video">
                    {v.video ? (
                      <video src={v.video} poster={v.photo} controls playsInline preload="none" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.photo} alt="" />
                    )}
                    <div>
                      <b>
                        {v.de.nom}
                        {v.de.metier ? <span> · {v.de.metier}</span> : null}
                      </b>
                      <p>{v.decouverte}</p>
                      <i className={`dr-puce ${v.statut}`}>
                        {STATUT[v.statut]}
                        {v.statut === "diffusee" && v.diffuseeLe ? ` le ${jour(v.diffuseeLe)}${v.reseaux.length ? ` · ${v.reseaux.map((x) => RESEAU[x] ?? x).join(", ")}` : ""}` : ""}
                      </i>
                      {v.statut === "en-attente" && (
                        <div className="dr-actions">
                          <button type="button" className="cz-go" disabled={!!enCours} onClick={() => void agir(`d-${v.id}`, { action: "diffuser", id: v.id })}>
                            {enCours === `d-${v.id}` ? "Elle part…" : "📣 Diffuser sur mes réseaux"}
                          </button>
                          <button type="button" className="cz-second" disabled={!!enCours} onClick={() => void agir(`r-${v.id}`, { action: "refuser", id: v.id })}>
                            Pas celle-ci
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                ))
              ) : (
                <p className="dr-note">Rien pour l’instant : dès qu’un partenaire publie une vidéo, elle arrive ici.</p>
              )}
            </section>

            <section className="dr-bloc">
              <h3>Mes vidéos chez eux</h3>
              {etat.envois.length ? (
                <ul className="dr-envois">
                  {etat.envois.map((v) => (
                    <li key={`${v.id}-${v.vers}`}>
                      <span>{v.texte || "Ma vidéo"}</span>
                      <em>
                        {v.vers} : {STATUT[v.statut]}
                        {v.statut === "diffusee" && v.diffuseeLe ? ` le ${jour(v.diffuseeLe)}` : ""}
                      </em>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="dr-note">Ta prochaine vidéo partira chez tes partenaires. Fais-en une : Ma boutique → Plus de clients → En petit film.</p>
              )}
            </section>
          </>
        )}
        {erreur && <p className="dr-erreur">{erreur}</p>}
      </div>
    </div>
  );
}

const STYLES = `
.dr{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;background:var(--fond);overflow:hidden;}
.dr-haut{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px 0;}
.dr-retour{border:1px solid var(--trait);border-radius:999px;padding:9px 16px;background:var(--nappe);font-weight:700;}
.dr-titre{font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--rose);}
.dr-corps{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:14px;padding:14px 16px calc(28px + env(safe-area-inset-bottom,0px));scrollbar-width:none;}
.dr-corps::-webkit-scrollbar{display:none;}
.dr-intro{display:flex;flex-direction:column;gap:12px;}
.dr-intro h2{margin:0;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:23px;line-height:1.15;}
.dr-intro p{margin:0;font-size:15px;line-height:1.45;color:var(--gris);}
.dr-intro p b{color:var(--creme);}
.dr-regles{margin:0;padding:12px 14px;list-style:none;display:grid;gap:8px;border-radius:18px;background:var(--nappe);border:1px solid var(--trait);font-size:14px;line-height:1.35;}
.dr-regles span{display:inline-block;width:24px;}
.dr-visite{padding:12px 14px;border-radius:16px;background:rgba(245,162,58,.12);border:1px solid rgba(245,162,58,.45);color:var(--creme)!important;font-size:14px!important;}
.dr-accord{display:flex;align-items:flex-start;gap:10px;font-size:14px;line-height:1.4;}
.dr-accord input{flex:none;width:22px;height:22px;margin-top:1px;accent-color:var(--rose);}
.dr-note{margin:0;font-size:13px;line-height:1.4;color:var(--gris);text-align:center;}
.dr-attente{margin:0;padding:14px;color:var(--gris);}
.dr-statut{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px;border-radius:20px;background:linear-gradient(160deg,rgba(61,226,166,.16),rgba(255,46,154,.08));border:1px solid rgba(61,226,166,.45);}
.dr-statut div{display:flex;flex-direction:column;gap:2px;}
.dr-statut b{font-size:16px;}
.dr-statut em{font-style:normal;font-size:13px;font-weight:800;color:#3DE2A6;}
.dr-lien{border:0;background:none;color:var(--gris);font-size:13px;text-decoration:underline;}
.dr-bloc{display:flex;flex-direction:column;gap:10px;}
.dr-bloc h3{margin:0;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:17px;}
.dr-partenaires{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.dr-partenaire{display:flex;flex-direction:column;gap:4px;padding:12px;border-radius:18px;background:var(--nappe);border:1px solid var(--trait);color:var(--creme);text-decoration:none;}
.dr-partenaire b{font-size:15px;line-height:1.2;}
.dr-partenaire em{font-style:normal;font-size:12.5px;color:var(--gris);}
.dr-partenaire i{align-self:flex-start;font-style:normal;font-size:11.5px;font-weight:800;padding:3px 8px;border-radius:999px;background:rgba(61,226,166,.16);color:#3DE2A6;}
.dr-choix{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.dr-choix button{display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:12px;border-radius:18px;border:2px solid var(--trait);background:var(--nappe);color:var(--creme);text-align:left;}
.dr-choix button.on{border-color:var(--rose);background:rgba(255,46,154,.1);}
.dr-choix b{font-size:15px;}
.dr-choix em{font-style:normal;font-size:12.5px;line-height:1.35;color:var(--gris);}
.dr-avertir{margin:0;padding:10px 12px;border-radius:14px;background:rgba(245,162,58,.12);border:1px solid rgba(245,162,58,.4);font-size:13.5px;line-height:1.4;}
.dr-video{display:grid;grid-template-columns:96px 1fr;gap:12px;padding:10px;border-radius:18px;background:var(--nappe);border:1px solid var(--trait);}
.dr-video video,.dr-video img{width:96px;height:170px;object-fit:cover;border-radius:12px;background:#000;}
.dr-video>div{display:flex;flex-direction:column;align-items:flex-start;gap:6px;min-width:0;}
.dr-video b{font-size:15px;}
.dr-video b span{font-weight:600;color:var(--gris);font-size:13px;}
.dr-video p{margin:0;font-size:13.5px;line-height:1.4;color:var(--gris);}
.dr-puce{font-style:normal;font-size:12px;font-weight:800;padding:3px 9px;border-radius:999px;background:rgba(255,244,230,.08);color:var(--gris);}
.dr-puce.en-attente{background:rgba(245,162,58,.16);color:var(--ambre);}
.dr-puce.diffusee{background:rgba(61,226,166,.16);color:#3DE2A6;}
.dr-actions{display:flex;flex-direction:column;align-items:stretch;gap:6px;width:100%;}
.dr-envois{margin:0;padding:0;list-style:none;display:grid;gap:8px;}
.dr-envois li{display:flex;flex-direction:column;gap:3px;padding:10px 12px;border-radius:14px;background:var(--nappe);border:1px solid var(--trait);}
.dr-envois span{font-size:14px;line-height:1.3;}
.dr-envois em{font-style:normal;font-size:12.5px;color:var(--gris);}
.dr-erreur{margin:0;padding:10px 12px;border-radius:14px;background:rgba(245,162,58,.12);border:1px solid rgba(245,162,58,.4);font-size:14px;text-align:center;}
`;
