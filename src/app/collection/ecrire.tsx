"use client";

/**
 * ✍️ ÉCRIRE, PARTAGER — L'ÉCRAN (lot M1 ; le cahier : `docs/univers/messages-ecrits.md`, sections 3 et 4.1 à 4.3 ; le
 * serveur : `lib/direct/ecrit-serveur.ts`, les règles : `lib/direct/ecrit.ts`).
 *
 *   · LA BARRE DU BAS (`BarreEcrire`), comme une messagerie qu'on connaît déjà : « ＋ » à gauche (🎭 un mème, 🪧 un
 *     panneau, 🎁 un cadeau ; les photos et les vidéos viendront avec les lots M2 et M3), le champ « Écrire… » au milieu,
 *     à droite LE MICRO quand le champ est vide (son geste d'aujourd'hui : enregistrer, « Ta figurine a compris ça »,
 *     envoyer), LA FLÈCHE dès qu'on tape. Trois petites têtes au-dessus du champ (les règles des vocaux,
 *     `proposerParRegles`, sans modèle) : la première est prise d'office, un toucher en change. Le frein tiré
 *     (`CLIKME_ECRIT=0`) : le micro seulement, comme avant.
 *   · L'ÉCRIT DANS LE FIL (`BulleEcrite`) : le texte en entier, la tête, l'heure, les réactions (appui long) ; un toucher :
 *     sa figurine le redit dans la scène — les mots l'un après l'autre, la bouche qui bouge, SANS AUCUN SON.
 *   · UN LIEN (`CarteLien`) : son aperçu, préparé par le serveur (l'image recopiée chez nous, le titre, le site) ; sans
 *     aperçu possible, le lien tout simple. Un toucher l'ouvre dans un nouvel onglet ; un site que ClikMe ne connaît pas
 *     passe d'abord par « Tu quittes ClikMe pour <site> ». YouTube, Spotify, Deezer, Apple Music : une carte un peu plus
 *     belle (l'affiche, la pochette).
 *   · EFFACER (`BoutonEffacer`) : sous son propre message, quand il est choisi, dans les 24 heures — pour les deux.
 *
 * FICHIER NAVIGATEUR.
 */
import { useEffect, useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { Feuille } from "./ma-figurine";
import { demanderOui } from "./fenetre";
import { sentimentDe, type Expressions, type Sentiment } from "@/lib/direct/ma-figurine";
import { proposerParRegles, tetesJouables, type LienDuMessage, type MessageFil } from "@/lib/direct/talkie";
import { ECRIT, PHRASES_ECRIT, morceauxDuTexte, phraseDepart, siteDe, signes } from "@/lib/direct/ecrit";

/** « lemonde.fr/article/… » : une adresse à lire d'un coup d'œil (sans « https:// » ni « www. »). */
export const adresseCourte = (u: string, max = 40) => {
  const s = u.replace(/^https?:\/\/(www\.)?/i, "");
  return [...s].length > max ? `${[...s].slice(0, max - 1).join("")}…` : s;
};

/**
 * « lemonde.fr » : le VRAI site d'un lien, lu dans son adresse — jamais le nom que la page se donne (« Cinéma & Co »,
 * qu'elle choisit elle-même) : c'est lui qu'on montre avant de quitter ClikMe.
 */
export const domaineDe = (url: string, repli = "") => {
  try {
    return siteDe(new URL(url).hostname);
  } catch {
    return repli;
  }
};

/**
 * ✍️ Les mots qu'un écrit fait dire à sa figurine, dans la bulle de la scène (ils apparaissent l'un après l'autre) : un
 * lien, raccourci ; un message qui n'est qu'un lien, son titre (« 🔗 Le clip de la fête »).
 */
export function motsDeLEcrit(m: Pick<MessageFil, "repliques" | "lien">): string[] {
  const mots = (m.repliques[0]?.texte ?? "").split(" ").filter(Boolean);
  const lien = (w: string) => /^https?:\/\//i.test(w);
  if (m.lien?.titre && mots.length && mots.every(lien)) return ["🔗", ...m.lien.titre.split(/\s+/).filter(Boolean)];
  return mots.map((w) => (lien(w) ? adresseCourte(w, 30) : w));
}

/** Un choix du « ＋ ». */
export type ChoixPlus = { cle: string; emoji: string; nom: string; onChoisi: () => void };

export function BarreEcrire({
  prenom,
  expressions,
  ecrire,
  premier,
  plus,
  onMicro,
  onEnvoyer,
  onTape,
}: {
  prenom: string;
  /** Ses visages déjà faits : les petites têtes au-dessus du champ. */
  expressions: Expressions;
  /** Faux : le frein est tiré (`CLIKME_ECRIT=0`), le micro seulement. */
  ecrire: boolean;
  /** Pas encore de message entre eux : « Lui parler ». */
  premier: boolean;
  plus: ChoixPlus[];
  onMicro: () => void;
  /** Il envoie (une erreur lancée reste écrite au-dessus du champ, son texte n'est pas perdu). */
  onEnvoyer: (texte: string, tete: Sentiment) => Promise<void>;
  /** Il est en train d'écrire (sa figurine se penche chez l'autre). */
  onTape?: (oui: boolean) => void;
}) {
  const [texte, setTexte] = useState("");
  const [choisie, setChoisie] = useState<Sentiment | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [plusOuvert, setPlusOuvert] = useState(false);
  const champ = useRef<HTMLTextAreaElement>(null);
  // (le champ grandit avec le texte, cinq lignes au plus)
  useEffect(() => {
    const el = champ.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight + 3, 132)}px`;
  }, [texte]);

  const plein = texte.trim();
  const n = signes(plein);
  const trop = n > ECRIT.max;
  const proposees = plein ? proposerParRegles(plein, tetesJouables(Object.keys(expressions))) : [];
  // (la tête qu'il a touchée reste, même si ses mots en font proposer d'autres)
  const liste = choisie && !proposees.includes(choisie) ? [choisie, ...proposees.slice(0, 2)] : proposees;
  const tete = choisie ?? liste[0];

  function changer(v: string) {
    setTexte(v);
    setErreur("");
    if (!v.trim()) setChoisie(null);
    onTape?.(Boolean(v.trim()));
  }
  async function envoyer() {
    if (!plein || trop || envoi || !tete) return;
    setEnvoi(true);
    setErreur("");
    try {
      await onEnvoyer(plein, tete);
      setTexte("");
      setChoisie(null);
      onTape?.(false);
    } catch (e) {
      setErreur(e instanceof Error && e.message ? e.message : "Ça n’a pas marché. Réessaie.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <>
      <div className="pr-ecrire">
        {erreur && (
          <p className="pr-erreur" role="alert">
            {erreur}
          </p>
        )}
        {plein && ecrire && (
          <div className="pr-ecrire-tetes" role="radiogroup" aria-label="La tête de ta figurine">
            {liste.map((c) => {
              const v = sentimentDe(c);
              const img = expressions[c]?.n;
              return (
                <button key={c} type="button" role="radio" aria-checked={c === tete} className={c === tete ? "pris" : ""} data-tete={c} onClick={() => setChoisie(c)}>
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt="" draggable={false} />
                  ) : (
                    <span className="emoji" aria-hidden="true">
                      {v?.emoji}
                    </span>
                  )}
                  {v?.court}
                </button>
              );
            })}
          </div>
        )}
        <div className="pr-ecrire-ligne">
          <button type="button" className="pr-ecrire-plus" aria-label="Envoyer autre chose : un mème, un panneau…" aria-expanded={plusOuvert} onClick={() => setPlusOuvert(true)}>
            ＋
          </button>
          {ecrire ? (
            <>
              <textarea
                ref={champ}
                className="pr-ecrire-champ"
                name="ecrire"
                rows={1}
                maxLength={ECRIT.max * 2}
                placeholder={PHRASES_ECRIT.champ}
                aria-label={`Écrire à ${prenom}`}
                value={texte}
                onChange={(e) => changer(e.target.value)}
                onKeyDown={(e) => {
                  // (Entrée envoie à l'ordinateur ; au téléphone, elle va à la ligne : la flèche envoie)
                  if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing || !window.matchMedia?.("(pointer: fine)").matches) return;
                  e.preventDefault();
                  void envoyer();
                }}
              />
              {plein ? (
                <button type="button" className="pr-ecrire-envoyer" aria-label={`Envoyer à ${prenom}`} disabled={envoi || trop} onClick={() => void envoyer()}>
                  <IconeEnvoyer />
                </button>
              ) : (
                <button type="button" className="pr-ecrire-micro" aria-label={premier ? "Lui parler à voix haute" : "Lui répondre à voix haute"} onClick={onMicro}>
                  <IconeMicro taille={20} />
                </button>
              )}
            </>
          ) : (
            <button type="button" className="pr-bouton grand pr-ecrire-micro-grand" onClick={onMicro}>
              <IconeMicro taille={16} />
              {premier ? "Lui parler" : "Lui répondre"}
            </button>
          )}
        </div>
        {ecrire && n > ECRIT.max - 100 && <small className={`pr-ecrire-compte${trop ? " trop" : ""}`}>{trop ? PHRASES_ECRIT.long : `${n} / ${ECRIT.max}`}</small>}
      </div>
      <Feuille ouverte={plusOuvert} onFermer={() => setPlusOuvert(false)} titre="Envoyer autre chose" className="pr-feuille pr-feuille-plus">
        <b className="pv-feuille-titre">Envoyer à {prenom}…</b>
        <div className="pr-plus">
          {plus.map((x) => (
            <button
              key={x.cle}
              type="button"
              className="pr-plus-choix"
              data-plus={x.cle}
              onClick={() => {
                setPlusOuvert(false);
                x.onChoisi();
              }}
            >
              <span aria-hidden="true">{x.emoji}</span>
              {x.nom}
            </button>
          ))}
        </div>
      </Feuille>
    </>
  );
}

/** Les gestes d'un message du fil (l'appui long : les réactions). */
type GestesBouton = {
  onPointerDown: (e: PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
  onContextMenu: (e: MouseEvent) => void;
};

/** ✍️ Un message écrit, dans le fil : le texte en entier (ses liens soulignés), la carte de son lien, « Effacer ». */
/** (`dessous` : ce qui se pose sous la bulle — 🎵 « Le ranger dans mon univers ? », `ranger-univers.tsx`) */
export function BulleEcrite({ m, img, vu, bas, gestes, onJouer, onEffacer, dessous }: { m: MessageFil; img: string; vu: boolean; bas: string; gestes: GestesBouton; onJouer: () => void; onEffacer?: () => void; dessous?: ReactNode }) {
  return (
    <li className={`${m.moi ? "moi" : "lui"} pr-ecrit-li`}>
      <div className="pr-ecrit-bloc">
        <button type="button" className={`pr-ecrit${vu ? " vu" : ""}${m.nouveau ? " nouveau" : ""}`} {...gestes} onClick={onJouer}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt="" draggable={false} />
          <span>
            <span className="pr-ecrit-texte">
              {morceauxDuTexte(m.texte ?? "").map((x, k) =>
                x.url ? (
                  <span key={k} className="lien">
                    {adresseCourte(x.texte)}
                  </span>
                ) : (
                  <span key={k}>{x.texte}</span>
                ),
              )}
            </span>
            <small>{bas}</small>
          </span>
        </button>
        {m.lien && <CarteLien lien={m.lien} />}
        {dessous}
        {onEffacer && <BoutonEffacer onEffacer={onEffacer} />}
      </div>
    </li>
  );
}

/** 🔗 L'aperçu d'un lien (sans aperçu : le lien tout simple). Un site inconnu demande d'abord. */
export function CarteLien({ lien }: { lien: LienDuMessage }) {
  const apercu = Boolean(lien.titre || lien.image);
  const site = domaineDe(lien.url, lien.site);
  async function ouvrir(e: MouseEvent<HTMLAnchorElement>) {
    // (un site connu s'ouvre tout de suite, dans un nouvel onglet)
    if (lien.sorte) return;
    e.preventDefault();
    if (await demanderOui({ emoji: "🔗", titre: phraseDepart(site), texte: adresseCourte(lien.url, 90), oui: "Y aller" })) window.open(lien.url, "_blank", "noopener,noreferrer");
  }
  return (
    <a
      className={`ec-lien${apercu ? "" : " simple"}${lien.sorte ? ` ${lien.sorte}` : ""}`}
      href={lien.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      referrerPolicy="no-referrer"
      data-site={site}
      onClick={(e) => void ouvrir(e)}
    >
      {lien.image && (
        <span className="ec-lien-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lien.image} alt="" draggable={false} loading="lazy" />
          {lien.sorte === "video" && <i aria-hidden="true">▶</i>}
        </span>
      )}
      <span className="ec-lien-texte">
        <b>{apercu ? lien.titre || adresseCourte(lien.url) : adresseCourte(lien.url, 60)}</b>
        <small>
          {lien.sorte === "musique" ? "🎵" : lien.sorte === "video" ? "🎬" : "🔗"} {site}
        </small>
      </span>
    </a>
  );
}

/** 🗑️ Sous son propre message choisi (dans les 24 heures) : l'effacer, pour les deux. */
export function BoutonEffacer({ onEffacer }: { onEffacer: () => void }) {
  return (
    <button type="button" className="pr-effacer" onClick={onEffacer}>
      🗑️ Effacer
    </button>
  );
}

function IconeMicro({ taille }: { taille: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v4" />
    </svg>
  );
}
function IconeEnvoyer() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.4 20.4 21 12 3.4 3.6l.1 6.5L15 12 3.5 13.9z" fill="currentColor" />
    </svg>
  );
}

export const STYLES_ECRIRE = `
.pr-ecrire{flex:none;display:flex;flex-direction:column;gap:6px;padding-top:4px}
.pr-ecrire-ligne{display:flex;align-items:flex-end;gap:8px}
.pr-ecrire-plus{flex:none;width:46px;height:46px;border:0;border-radius:50%;background:#2A1422;color:#FFF4E6;font:inherit;font-size:24px;font-weight:700;line-height:1;cursor:pointer;box-shadow:inset 0 0 0 1.5px rgba(242,196,107,.5);-webkit-tap-highlight-color:transparent}
.pr-ecrire-champ{flex:1 1 auto;min-width:0;height:46px;min-height:46px;max-height:132px;margin:0;padding:12px 16px;border:1.5px solid rgba(255,255,255,.12);border-radius:23px;background:#22101B;color:#FFF4E6;font:inherit;font-size:15px;line-height:1.35;resize:none;box-sizing:border-box;outline:none}
.pr-ecrire-champ:focus{border-color:rgba(255,46,154,.7)}
.pr-ecrire-champ::placeholder{color:#8E7383}
.pr-ecrire-micro,.pr-ecrire-envoyer{flex:none;display:grid;place-items:center;width:46px;height:46px;padding:0;border:0;border-radius:50%;background:#FF2E9A;color:#fff;cursor:pointer;box-shadow:0 10px 22px -10px rgba(255,46,154,.95);-webkit-tap-highlight-color:transparent}
.pr-ecrire-envoyer:disabled{opacity:.55}
.pr-ecrire-micro-grand{flex:1 1 auto;width:auto}
.pr-ecrire-tetes{display:flex;gap:6px;padding-left:54px;overflow-x:auto}
.pr-ecrire-tetes button{flex:none;display:flex;align-items:center;gap:5px;height:34px;padding:0 11px 0 4px;border:1.5px solid rgba(255,255,255,.1);border-radius:999px;background:#2A1422;color:#E8D3DC;font:inherit;font-size:11.5px;font-weight:800;cursor:pointer;-webkit-tap-highlight-color:transparent}
.pr-ecrire-tetes img{width:26px;height:26px;border-radius:50%;object-fit:cover;object-position:50% 18%;background:#3A1A30}
.pr-ecrire-tetes .emoji{display:grid;place-items:center;width:26px;height:26px;font-size:17px}
.pr-ecrire-tetes button.pris{border-color:#FFF4E6;background:#FFF4E6;color:#2A0F1F}
.pr-ecrire-compte{align-self:flex-end;font-size:11px;font-weight:800;color:#B49AA8}
.pr-ecrire-compte.trop{color:#FFB4B4}
.pr-plus{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:12px}
.pr-plus-choix{display:flex;flex-direction:column;align-items:center;gap:4px;padding:14px 4px;border:0;border-radius:18px;background:rgba(255,255,255,.07);color:#FFF4E6;font:inherit;font-size:12.5px;font-weight:800;cursor:pointer;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.1)}
.pr-plus-choix span{font-size:30px;line-height:1.1}
/* ✍️ l'écrit dans le fil : le texte en entier, sa carte de lien, « Effacer » */
.pr-fil li.pr-ecrit-li{align-items:flex-start}
.pr-ecrit-bloc{display:flex;flex-direction:column;align-items:flex-start;gap:4px;max-width:86%;min-width:0}
.pr-fichier{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:16px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.12);color:inherit;text-decoration:none;max-width:100%}
.pr-fichier .e{font-size:26px;line-height:1;flex:none}
.pr-fichier b{display:block;font-weight:700;font-size:14px;line-height:1.25;overflow-wrap:anywhere}
.pr-fichier small{display:block;margin-top:2px;font-size:11.5px;opacity:.65}
.pr-fil li.moi .pr-ecrit-bloc{align-items:flex-end}
.pr-fil .pr-ecrit-bloc > button.pr-ecrit{max-width:100%}
.pr-ecrit-texte{font-size:14px;line-height:1.4;white-space:pre-wrap;overflow-wrap:anywhere}
.pr-ecrit-texte .lien{color:#FFB3DA;text-decoration:underline;text-underline-offset:2px}
.ec-lien{display:flex;flex-direction:column;width:min(280px,100%);border-radius:16px;overflow:hidden;background:#22101B;border:1.5px solid rgba(255,255,255,.1);color:#FFF4E6;text-decoration:none;-webkit-tap-highlight-color:transparent}
.pr-fil li.moi .ec-lien{background:#33122A}
.ec-lien.musique,.ec-lien.video{border-color:rgba(242,196,107,.55)}
.ec-lien-image{position:relative;display:block}
.pr-fil .ec-lien img{display:block;width:100%;height:auto;aspect-ratio:1.91/1;max-height:170px;border-radius:0;object-fit:cover;object-position:50% 50%;background:#3A1A30}
.pr-fil .ec-lien.musique img{aspect-ratio:1/1;max-height:220px}
.ec-lien-image i{position:absolute;left:50%;top:50%;display:grid;place-items:center;width:48px;height:48px;margin:-24px 0 0 -24px;border-radius:50%;background:rgba(14,4,11,.72);color:#fff;font-style:normal;font-size:20px;padding-left:3px;box-sizing:border-box}
.ec-lien-texte{display:flex;flex-direction:column;gap:2px;padding:8px 11px 9px}
.ec-lien b{font-size:13px;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}
.ec-lien.simple{width:auto;max-width:100%}
.ec-lien.simple b{color:#FFB3DA;text-decoration:underline;text-underline-offset:2px;font-weight:700}
.pr-fil li.avec-effacer{flex-direction:column;align-items:flex-end;gap:3px}
.pr-fil li button.pr-effacer{display:inline-flex;max-width:none;padding:3px 10px;border:0;border-radius:999px;background:rgba(255,255,255,.06);color:#E8D3DC;font:inherit;font-size:11.5px;font-weight:800;cursor:pointer}
/* la bulle de la scène : les mots d'un écrit apparaissent l'un après l'autre */
.pr-sous-titre .pr-mot{transition:opacity .18s}
.pr-sous-titre .pr-mot.cache{opacity:0}
`;
