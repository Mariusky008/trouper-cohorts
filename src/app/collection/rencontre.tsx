"use client";

/**
 * 💬 LA RENCONTRE DU JOUR, sur « Ma collection » (`lib/direct/rencontre.ts`) : ce que sa figurine a dit aujourd'hui à
 * une autre figurine (un ami invité, ou un commerce), EN DIRECT la première fois (`Spectacle` : les deux figurines sur
 * scène, chaque réplique à son rythme, avec son geste) ; à la fin, ce qui a été partagé, la carte souvenir et, entre
 * deux clients d'accord, leurs impressions (`ApresRencontre`). Sous chaque
 * phrase de SA figurine : « ✅ C'est tout moi » / « 🙅 Jamais de la vie » — c'est ce qui la fait lui ressembler —, et
 * une émotion sur n'importe quelle phrase. Sa ressemblance en pourcentage ; « Invite un ami : demain, vos figurines
 * discutent » (WhatsApp) ; ses rencontres d'avant. À lire seulement (pas de voix, décidé le 4 novembre 2026).
 *
 * L'INVITATION : `/collection?ami=<code>` — le code est gardé sur l'appareil, et accepté dès qu'il a un compte.
 *
 * LE RÉSEAU DES FIGURINES (5 novembre 2026, `lib/direct/reseau.ts`) : la rencontre du jour est toujours hors de son
 * entourage (un commerçant, un membre, un personnage imaginaire de ClikMe, Pablito) ; ses amis et proches, il lance une
 * discussion quand il veut (`AMIS_PAR_JOUR` par jour) ; chaque conversation a son format (« Le défi »…) et finit par une
 * question pour lui (« Et toi ? ») — sa réponse nourrit les suivantes.
 *
 * MISE EN VALEUR LE 5 NOVEMBRE 2026 (« une partie importante… que ça donne vraiment envie d'inviter quelqu'un, ou de
 * comprendre que si on ne le fait pas, on peut appuyer sur un compte à rebours pour être mis en contact avec un
 * membre ; et la figurine marrante explique le fonctionnement ») : le guide explique (`guide.tsx`) ; la rencontre du jour en vedette,
 * et le temps qui reste avant la suivante ; deux grands choix — « Invite un ami » et le bouton rond « Rencontre un
 * membre » (3… 2… 1…).
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  EMOTIONS,
  IMPRESSION_MAX,
  VERDICTS,
  deNom,
  dureeReplique,
  gesteDe,
  impressionRefusee,
  texteInvitation,
  type Emotion,
  type Participant,
  type Reaction,
  type RencontreVue,
  type Verdict,
} from "@/lib/direct/rencontre";
import { AMIS_PAR_JOUR, REPONSE_MAX } from "@/lib/direct/reseau";
import { THEMES_AMIS } from "@/lib/direct/scenarios";
import { PanneauEnvoi } from "./ma-figurine";
import { FigurineGuide, GuideDit } from "./guide";
import { versLeStudio } from "./vers-le-studio";
import { TEXTE_MAX } from "@/lib/direct/ma-figurine";

type Etat = {
  rencontre: RencontreVue | null;
  besoinCarte?: boolean;
  personne?: boolean;
  retiree?: boolean;
  ressemblance: number | null;
  amis: number;
  avant: { id: string; jour: string; avec: string; titre?: string }[];
  membreAujourdhui: boolean;
  ouvert: boolean;
  amisListe?: { n: number; prenom: string; carte: boolean; image: string; figurine: boolean }[];
  discussionsRestantes?: number;
  nouvelle?: RencontreVue;
};
const CLE_AMI = "clikme-ami-v1";

async function poster(corps: Record<string, unknown>) {
  const r = await fetch("/api/direct/rencontre", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
  const j = (await r.json().catch(() => ({}))) as Record<string, unknown>;
  if (!r.ok) throw new Error(String(j.error || "Ça n’est pas parti. Réessaie dans un instant."));
  return j;
}

const nomDe = (p: Participant) => (p.type === "client" ? p.prenom || "Quelqu’un" : p.nom);
const jourCourt = (j: string) => new Date(`${j}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

/**
 * Sa figurine s'il l'a ; sinon (un fantôme, un commerce sans figurine) une silhouette de figurine, et « ? ». Un
 * personnage de ClikMe : Pablito (sa figurine), les autres leur emoji.
 */
function Avatar({ p, grand = false, scene = false }: { p: Participant; grand?: boolean; scene?: boolean }) {
  if (p.type === "personnage" && !p.image)
    return (
      <span className={`rd-av perso${grand ? " grand" : ""}${scene ? " scene" : ""}`} aria-hidden="true">
        <b className="rd-perso">{p.emoji}</b>
      </span>
    );
  const vraie = p.type === "client" ? p.figurine : p.type === "personnage" || !p.image.startsWith("/direct/double/");
  return (
    <span className={`rd-av${grand ? " grand" : ""}${scene ? " scene" : ""}${vraie ? " figurine" : ""}`} aria-hidden="true">
      {vraie ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.image} alt="" draggable={false} />
      ) : (
        <>
          <FigurineGuide className="rd-clik" ombre fixe />
          <b className="rd-q">?</b>
        </>
      )}
    </span>
  );
}

const cleDirect = (id: string) => `clikme-rencontre-direct-${id}`;
/** A-t-il déjà regardé cette rencontre en direct (sur cet appareil) ? */
export const dejaVueEnDirect = (id: string) => {
  try {
    return Boolean(window.localStorage.getItem(cleDirect(id)));
  } catch {
    return false;
  }
};
const noterVue = (id: string) => {
  try {
    window.localStorage.setItem(cleDirect(id), "1");
  } catch {
    /* rien */
  }
};

/** Les onomatopées de la BD, geste par geste. */
const ONOMATOPEES: Record<string, string> = {
  rit: "HA HA !",
  danse: "♪ ♫",
  grimace: "BLEH !",
  surprise: "QUOI ?!",
  clin: "CLIN !",
  touchee: "♥",
  applaudit: "CLAP CLAP !",
  reflechit: "HMMM…",
};
const minutesDe = (r: RencontreVue) => Math.max(1, Math.round(r.repliques.reduce((n, x) => n + dureeReplique(x.texte), 1200) / 60_000));

/**
 * 📖 LA CONVERSATION, EN BD, À RELIRE — une case par réplique, les deux figurines face à face (la sienne à gauche).
 * « ✅ C'est tout moi » / « 🙅 Jamais de la vie » sous les phrases de SA figurine (c'est ce qui la fait lui ressembler) ;
 * une émotion en touchant une phrase.
 */
function Fil({ r, onRessemblance, ressemblance }: { r: RencontreVue; onRessemblance: (n: number | null) => void; ressemblance: number | null }) {
  const [reactions, setReactions] = useState<Record<number, Reaction>>(r.reactions);
  // (une émotion : en touchant la phrase — 5 novembre 2026 : six boutons sous chaque ligne, c'était illisible)
  const [ouverte, setOuverte] = useState<number | null>(null);
  const [erreur, setErreur] = useState("");
  async function reagir(n: number, x: { v?: Verdict | null; e?: Emotion | null }) {
    setErreur("");
    const avant = reactions[n] ?? {};
    const apres: Reaction = { ...avant };
    if (x.v !== undefined) {
      if (x.v) apres.v = x.v;
      else delete apres.v;
    }
    if (x.e !== undefined) {
      if (x.e) apres.e = x.e;
      else delete apres.e;
    }
    setReactions((m) => ({ ...m, [n]: apres }));
    try {
      const j = await poster({ action: "reagir", id: r.id, n, ...x });
      onRessemblance((j.ressemblance as number | null) ?? null);
    } catch (e) {
      setReactions((m) => ({ ...m, [n]: avant }));
      setErreur((e as Error).message);
    }
  }
  return (
    <>
      <p className="rd-aide">🪞 C’est toi ? Dis-le sous les phrases de ta figurine : elle apprend à te ressembler.</p>
      <ol className="rd-fil bd">
        {r.repliques.map((x, n) => {
          const re = reactions[n] ?? {};
          const g = x.geste ? gesteDe(x.geste) : null;
          return (
            <li key={n} className={`${x.moi ? "moi" : "autre"} reagir`}>
              <Avatar p={x.moi ? r.moi : r.autre} />
              <div className="rd-bulle" onClick={() => setOuverte((o) => (o === n ? null : n))}>
                <small>
                  {x.moi ? "Ta figurine" : nomDe(r.autre)}
                  {g && (
                    <span className="rd-geste">
                      {" "}
                      · {g.emoji} {g.dit}
                    </span>
                  )}
                </small>
                <p>
                  {x.texte}
                  {re.e && ouverte !== n && <span className="rd-emo-pose">{re.e}</span>}
                </p>
                {(x.moi || ouverte === n) && (
                  <div className="rd-reac" onClick={(e) => e.stopPropagation()}>
                    {x.moi &&
                      VERDICTS.map((v) => (
                        <button key={v.cle} type="button" className={`rd-verdict${re.v === v.cle ? " pris" : ""}`} aria-pressed={re.v === v.cle} onClick={() => reagir(n, { v: re.v === v.cle ? null : v.cle })}>
                          {v.emoji} {v.dit}
                        </button>
                      ))}
                    {ouverte === n &&
                      EMOTIONS.map((e) => (
                        <button key={e} type="button" className={`rd-emo${re.e === e ? " pris" : ""}`} aria-pressed={re.e === e} aria-label={`Réagir ${e}`} onClick={() => reagir(n, { e: re.e === e ? null : e })}>
                          {e}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="rd-ressemblance">
        {ressemblance == null ? (
          <>🪞 Dis-lui si c’est bien toi : elle apprend à te ressembler.</>
        ) : (
          <>
            🪞 Ta figurine te ressemble à <b>{ressemblance} %</b>
            <span className="rd-jauge">
              <i style={{ width: `${ressemblance}%` }} />
            </span>
          </>
        )}
      </p>
      {erreur && (
        <p className="tf-erreur" role="alert">
          {erreur}
        </p>
      )}
    </>
  );
}

/** Une figurine sur la scène du théâtre (ou de l'affiche) : sa figurine, ou l'emoji d'un personnage sans figurine. */
function FigScene({ p }: { p: Participant }) {
  if (p.type === "personnage" && !p.image)
    return (
      <span className="rs-perso" aria-hidden="true">
        {p.emoji}
      </span>
    );
  const vraie = p.type === "client" ? p.figurine : p.type === "personnage" || !p.image.startsWith("/direct/double/");
  return vraie ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={p.image} alt="" draggable={false} />
  ) : (
    // (pas encore de figurine : sa silhouette, et « ? » — jamais celle d'un autre)
    <span className="rs-silhouette" aria-hidden="true">
      <b>?</b>
    </span>
  );
}

/** La bulle de BD de celui qui parle : le texte arrive lettre après lettre. */
function Bulle({ texte, moi, nom, geste }: { texte: string; moi: boolean; nom: string; geste?: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n >= texte.length) return;
    const t = window.setTimeout(() => setN((x) => Math.min(texte.length, x + 2)), 22);
    return () => window.clearTimeout(t);
  }, [n, texte.length]);
  const g = geste ? gesteDe(geste) : null;
  return (
    <div className={`rs-bulle ${moi ? "gauche" : "droite"}`} aria-live="polite">
      <small>
        {nom}
        {g && <span> · {g.emoji}</span>}
      </small>
      <p>
        {texte.slice(0, n)}
        <span className="rs-reste" aria-hidden="true">
          {texte.slice(n)}
        </span>
      </p>
    </div>
  );
}

type Relook = { image: string; etat: "" | "cours" | "erreur" };

/** ✨ Ce que la figurine du commerçant propose, et sa figurine relookée (avant / après), et le lien vers SA page. */
function Proposition({ r, relook, grand = false }: { r: RencontreVue; relook: Relook; grand?: boolean }) {
  if (!r.proposition) return null;
  return (
    <section className={`ra-proposition${grand ? " grand" : ""}`}>
      <small>
        {r.scenario?.emoji ?? "✨"} {nomDe(r.autre).toUpperCase()} TE PROPOSE
      </small>
      <b>{r.proposition.titre}</b>
      {r.proposition.pourquoi && <p>{r.proposition.pourquoi}</p>}
      {r.transformable &&
        (relook.image ? (
          <span className="ra-avap">
            <span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.moi.image} alt="Ta figurine, avant" />
              <i>AVANT</i>
            </span>
            <span className="apres">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={relook.image} alt="Ta figurine, relookée" />
              <i>APRÈS ✨</i>
            </span>
          </span>
        ) : relook.etat === "cours" ? (
          <span className="ra-relook-cours" role="status">
            <i />✨ Ta figurine passe entre les mains de {nomDe(r.autre)}…
          </span>
        ) : null)}
      {r.action && (
        <a className="og-go ra-action" href={r.action.lien}>
          {r.action.texte}
        </a>
      )}
    </section>
  );
}

/**
 * 🎬 L'ÉPISODE, AU THÉÂTRE — 6 novembre 2026, le patron : « il faudrait que les deux figurines se parlent face à face, ou
 * comme dans une BD, qui donne vraiment l'effet visuel qu'elles discutent » ; « pas d'effet wow… on a du mal à scroller
 * la conversation jusqu'en bas ». Tout l'écran : les deux figurines face à face, la bulle de celle qui parle (le texte
 * arrive lettre après lettre), l'onomatopée de son geste ; une réplique après l'autre, à son rythme, sans rien à faire
 * défiler. Toucher : la suivante (à gauche : la précédente). À la fin : « FIN », la proposition du commerçant et sa
 * figurine relookée, la carte souvenir.
 */
function Theatre({ r, relook, onFin, onFermer }: { r: RencontreVue; relook: Relook; onFin: () => void; onFermer: () => void }) {
  const total = r.repliques.length;
  const [montrees, setMontrees] = useState(0);
  const [pause, setPause] = useState(false);
  const fini = montrees >= total + 1;
  const parle = montrees >= 1 && montrees <= total ? r.repliques[montrees - 1] : null;
  // la réplique suivante, à son heure (la première après un instant ; « FIN » après la dernière)
  useEffect(() => {
    if (fini || pause) return;
    const t = window.setTimeout(() => setMontrees((n) => n + 1), montrees === 0 ? 900 : dureeReplique(r.repliques[montrees - 1]?.texte ?? ""));
    return () => window.clearTimeout(t);
  }, [montrees, pause, fini, r.repliques]);
  const prevenu = useRef(false);
  useEffect(() => {
    if (!fini || prevenu.current) return;
    prevenu.current = true;
    noterVue(r.id);
    onFin();
  }, [fini, r.id, onFin]);
  // (la page derrière ne défile plus ; Échap ferme)
  useEffect(() => {
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const touche = (e: KeyboardEvent) => e.key === "Escape" && onFermer();
    window.addEventListener("keydown", touche);
    return () => {
      document.body.style.overflow = avant;
      window.removeEventListener("keydown", touche);
    };
  }, [onFermer]);
  function toucher(e: React.MouseEvent<HTMLDivElement>) {
    if (fini) return;
    const x = e.clientX - e.currentTarget.getBoundingClientRect().left;
    if (x < e.currentTarget.clientWidth * 0.28) setMontrees((n) => Math.max(1, n - 1));
    else setMontrees((n) => Math.min(total + 1, n + 1));
  }
  const ono = parle?.geste ? ONOMATOPEES[parle.geste] : "";
  return createPortal(
    <div className={`rs-theatre${fini ? " fini" : ""}${pause ? " pause" : ""}`} role="dialog" aria-modal="true" aria-label={`L’épisode : ${r.titre || nomDe(r.autre)}`}>
      <div className="rs-segments" aria-hidden="true">
        {r.repliques.map((_, k) => (
          <i key={k} className={k < montrees - 1 || fini ? "fait" : k === montrees - 1 ? "en-cours" : ""} style={k === montrees - 1 && !fini ? { animationDuration: `${dureeReplique(r.repliques[k].texte)}ms` } : undefined} />
        ))}
      </div>
      <header className="rs-haut">
        <span className={`rs-direct${fini ? " fini" : pause ? " pause" : ""}`}>{fini ? "✓ TERMINÉE" : pause ? "⏸ EN PAUSE" : "● EN DIRECT"}</span>
        <b>{r.scenario ? `${r.scenario.emoji} ${r.scenario.nom}` : r.titre}</b>
        <button type="button" className="rs-fermer" aria-label="Fermer" onClick={onFermer}>
          ✕
        </button>
      </header>
      {!fini ? (
        <>
          <div className="rs-scene" onClick={toucher}>
            <span className="rs-decor" aria-hidden="true" />
            {/* le récitatif de la BD : le titre de l'épisode */}
            {r.titre && (
              <span className="rs-recit" aria-hidden="true">
                <small>ÉPISODE</small>« {r.titre} »
              </span>
            )}
            {parle && <Bulle key={montrees} texte={parle.texte} moi={parle.moi} nom={parle.moi ? "Ta figurine" : nomDe(r.autre)} geste={parle.geste} />}
            {ono && (
              <b className={`rs-ono ${parle?.moi ? "gauche" : "droite"}`} key={`o-${montrees}`} aria-hidden="true">
                {ono}
              </b>
            )}
            {montrees === 0 && (
              <b className="rs-claquette" aria-hidden="true">
                🎬 ACTION !
              </b>
            )}
            <span className={`rs-fig gauche${parle?.moi ? ` parle g-${parle.geste ?? ""}` : parle ? " ecoute" : ""}`}>
              <FigScene p={r.moi} />
              <small>Ta figurine</small>
            </span>
            <span className={`rs-fig droite${parle && !parle.moi ? ` parle g-${parle.geste ?? ""}` : parle ? " ecoute" : ""}`}>
              <FigScene p={r.autre} />
              <small>{nomDe(r.autre)}</small>
            </span>
          </div>
          <div className="rs-barre">
            <small>
              {Math.min(montrees, total)} / {total} · ~{minutesDe(r)} min · 🍿 tu es spectateur
            </small>
          </div>
          <div className="rs-controles">
            <button type="button" onClick={() => setPause((x) => !x)}>
              {pause ? "▶ Reprendre" : "⏸ Pause"}
            </button>
            <button type="button" className="rs-passer" onClick={() => setMontrees(total + 1)}>
              ⏭ Passer à la fin
            </button>
          </div>
        </>
      ) : (
        <div className="rs-fin">
          <b className="rs-fin-mot">FIN</b>
          <Proposition r={r} relook={relook} grand />
          <CarteSouvenir titre={r.titre || `Rencontre avec ${nomDe(r.autre)}`} jour={r.jour} moi={r.moi} autre={r.autre} avec={nomDe(r.autre)} nouvelle />
          <span className="rs-fin-actions">
            <button type="button" className="og-go rs-suite" onClick={onFermer}>
              🪞 Ce que ça dit de moi ›
            </button>
            <button type="button" className="rs-revoir" onClick={() => setMontrees(0)}>
              ↺ Revoir
            </button>
          </span>
        </div>
      )}
    </div>,
    document.body,
  );
}

/** 🎟️ L'AFFICHE DE L'ÉPISODE : les deux figurines face à face, avec qui, le thème, le titre, et « ▶ Regarder ». */
function Affiche({ r, vue, jourEnTete, genre, onRegarder }: { r: RencontreVue; vue: boolean; jourEnTete: string; genre: string; onRegarder: () => void }) {
  return (
    <section className={`ep-affiche${vue ? " vue" : ""}`}>
      <div className="ep-duo" aria-hidden="true">
        <span className="ep-fig gauche">
          <FigScene p={r.moi} />
        </span>
        <b className="ep-vs">&amp;</b>
        <span className="ep-fig droite">
          <FigScene p={r.autre} />
        </span>
      </div>
      <span className="rd-qui">
        <small>
          {jourEnTete}
          {genre ? ` · ${genre}` : ""}
        </small>
        <b>
          {r.quoi === "ami" ? "Ta figurine a discuté avec " : "Ta figurine a rencontré "}
          {r.autre.type === "commerce" ? `la figurine ${deNom(r.autre.nom)}` : nomDe(r.autre)}
        </b>
        {r.autre.type === "client" && r.autre.titre && <span>« {r.autre.titre} »</span>}
        {r.autre.type === "personnage" && (
          <span>
            {r.autre.emoji} {r.autre.role}
          </span>
        )}
      </span>
      {(r.scenario || r.format) && <span className="ep-theme">{r.scenario ? `${r.scenario.emoji} ${r.scenario.nom}` : `🎲 ${r.format!.nom}`}</span>}
      {r.titre && <b className="ep-titre">« {r.titre} »</b>}
      <button type="button" className={`ep-play${vue ? " revoir" : ""}`} onClick={onRegarder}>
        {vue ? "↺ Revoir l’épisode" : "▶ Regarder l’épisode"}
        <small>~{minutesDe(r)} min</small>
      </button>
    </section>
  );
}

/** 🎞️ LA CARTE SOUVENIR d'une rencontre : les deux figurines, son titre, le jour. */
export function CarteSouvenir({ titre, jour, moi, autre, avec, nouvelle = false, petite = false, onClick }: { titre: string; jour: string; moi?: Participant; autre: Participant | { image: string; figurine: boolean; emoji?: string }; avec: string; nouvelle?: boolean; petite?: boolean; onClick?: () => void }) {
  const contenu = (
    <>
      {nouvelle && <span className="cs-ruban">🎉 Nouvelle carte souvenir !</span>}
      <small className="cs-etiquette">🎞️ CARTE SOUVENIR</small>
      <span className="cs-duo">
        {moi && <Avatar p={moi} grand />}
        <Avatar
          p={
            "type" in autre
              ? autre
              : autre.emoji
                ? { type: "personnage", cle: "", nom: avec, role: "", emoji: autre.emoji, image: autre.image }
                : { type: "client", prenom: avec, titre: "", image: autre.image, figurine: autre.figurine }
          }
          grand
        />
      </span>
      <b className="cs-titre">{titre}</b>
      <span className="cs-qui">
        avec {avec} · {jourCourt(jour)}
      </span>
    </>
  );
  return onClick ? (
    <button type="button" className={`cs${petite ? " petite" : ""}`} onClick={onClick}>
      {contenu}
    </button>
  ) : (
    <div className={`cs${nouvelle ? " nouvelle" : ""}${petite ? " petite" : ""}`}>{contenu}</div>
  );
}

/**
 * 💬 « SI VOUS ÊTES D'ACCORD, ÉCHANGER VOS IMPRESSIONS » — entre deux clients : chacun dit oui ; tant que l'autre n'a
 * pas dit oui, rien ne s'écrit (et on ne sait pas s'il a refusé). Ensuite, leurs impressions ici, sur ClikMe : pas de
 * numéro, d'adresse ni de lien.
 */
function Echange({ r, onRencontre }: { r: RencontreVue; onRencontre: (x: RencontreVue) => void }) {
  const e = r.echange!;
  const autre = nomDe(r.autre);
  const [texte, setTexte] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  async function vouloir(oui: boolean) {
    setErreur("");
    try {
      const j = await poster({ action: "echanger", id: r.id, oui });
      onRencontre(j.rencontre as RencontreVue);
    } catch (x) {
      setErreur((x as Error).message);
    }
  }
  async function envoyer() {
    const t = texte.trim().replace(/\s+/g, " ");
    const refus = impressionRefusee(t);
    if (refus) return setErreur(refus);
    setEnvoi(true);
    setErreur("");
    try {
      const j = await poster({ action: "impression", id: r.id, texte: t });
      setTexte("");
      onRencontre(j.rencontre as RencontreVue);
    } catch (x) {
      setErreur((x as Error).message);
    } finally {
      setEnvoi(false);
    }
  }
  return (
    <section className="ra-echange" aria-label="Vos impressions">
      <b>💬 Vos impressions</b>
      {!e.moi ? (
        <>
          <small>Envie d’échanger tes impressions avec {autre} sur cette rencontre ? Seulement si vous êtes d’accord tous les deux.</small>
          <button type="button" className="mp-bouton ra-oui" onClick={() => vouloir(true)}>
            🙋 Oui, je veux bien
          </button>
        </>
      ) : !e.autre ? (
        <>
          <small className="ra-note">✓ C’est noté ! Si {autre} est d’accord aussi, vous pourrez vous écrire ici.</small>
          <button type="button" className="ra-retirer" onClick={() => vouloir(false)}>
            Retirer mon accord
          </button>
        </>
      ) : (
        <>
          <small>Vous êtes d’accord tous les deux 🎉 Pas de numéro, d’adresse ni de lien : on se parle ici.</small>
          {e.messages.length > 0 && (
            <ol className="ra-fil">
              {e.messages.map((m, k) => (
                <li key={k} className={m.moi ? "moi" : "autre"}>
                  <small>{m.moi ? "Toi" : autre}</small>
                  <p>{m.texte}</p>
                </li>
              ))}
            </ol>
          )}
          <textarea value={texte} maxLength={IMPRESSION_MAX} rows={2} onChange={(x) => setTexte(x.target.value)} placeholder={`Ton impression, pour ${autre}…`} aria-label="Ton impression" />
          <span className="ra-actions">
            <button type="button" className="mp-bouton ra-envoyer" onClick={envoyer} disabled={envoi || !texte.trim()}>
              {envoi ? "…" : "Envoyer"}
            </button>
            <button type="button" className="ra-retirer" onClick={() => vouloir(false)}>
              Ne plus échanger
            </button>
          </span>
        </>
      )}
      {erreur && (
        <p className="tf-erreur" role="alert">
          {erreur}
        </p>
      )}
    </section>
  );
}

/**
 * 🗨️ « ET TOI ? » — la question de fin, pour lui (« l'idée, c'est de faire réagir et commenter… pertinent par rapport
 * à ce qu'on dit de soi ») : sa réponse est gardée, et ses prochaines conversations s'en servent.
 */
function EtToi({ r, onRencontre }: { r: RencontreVue; onRencontre: (x: RencontreVue) => void }) {
  const [texte, setTexte] = useState(r.reponse ?? "");
  const [ouvert, setOuvert] = useState(!r.reponse);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  async function envoyer() {
    const t = texte.trim().replace(/\s+/g, " ");
    const refus = impressionRefusee(t);
    if (refus) return setErreur(refus);
    setEnvoi(true);
    setErreur("");
    try {
      const j = await poster({ action: "repondre", id: r.id, texte: t });
      onRencontre(j.rencontre as RencontreVue);
      setOuvert(false);
    } catch (x) {
      setErreur((x as Error).message);
    } finally {
      setEnvoi(false);
    }
  }
  return (
    <section className="ra-ettoi" aria-label="Et toi ?">
      <b>🗨️ Et toi ?</b>
      <p className="ra-question">{r.question}</p>
      {!ouvert && r.reponse ? (
        <>
          <p className="ra-reponse">
            <small>Ta réponse</small>
            {r.reponse}
          </p>
          <button type="button" className="ra-retirer" onClick={() => setOuvert(true)}>
            Changer ma réponse
          </button>
        </>
      ) : (
        <>
          <textarea value={texte} maxLength={REPONSE_MAX} rows={2} onChange={(x) => setTexte(x.target.value)} placeholder="Ta réponse, en quelques mots…" aria-label="Ta réponse" />
          <small>Ta figurine s’en souviendra dans ses prochaines conversations.</small>
          <button type="button" className="mp-bouton ra-envoyer" onClick={envoyer} disabled={envoi || !texte.trim()}>
            {envoi ? "…" : "Répondre"}
          </button>
        </>
      )}
      {erreur && (
        <p className="tf-erreur" role="alert">
          {erreur}
        </p>
      )}
    </section>
  );
}

/**
 * 🏁 APRÈS L'ÉPISODE, SUR LA PAGE — une histoire qui se lit dans l'ordre : ce qu'il a proposé (chez un commerçant, et
 * le lien pour l'essayer), ce que sa figurine a révélé de lui, « Et toi ? », leurs impressions (entre deux clients), la
 * BD à relire (« c'est tout moi » / « jamais de la vie »), ce qui a été partagé, la carte souvenir.
 */
/**
 * 🎭 « FAIS-EN UN MÈME » (7 novembre 2026, on resserre sur le mème) : les meilleures répliques de SA figurine dans
 * l'épisode ; un toucher, et le studio s'ouvre avec la réplique écrite — il n'a plus qu'à l'écouter et la partager.
 */
function FaisEnUnMeme({ r }: { r: RencontreVue }) {
  if (r.moi.type !== "client" || !r.moi.figurine) return null;
  const siennes = [...new Set(r.repliques.filter((x) => x.moi).map((x) => x.texte.replace(/\s+/g, " ").trim()))]
    .filter((x) => x.length >= 12 && x.length <= TEXTE_MAX)
    .sort((a, b) => b.length - a.length)
    .slice(0, 3);
  if (!siennes.length) return null;
  return (
    <section className="ra-meme" aria-label="Fais-en un mème">
      <b>🎭 Fais-en un mème</b>
      <small>Une réplique de ta figurine, à envoyer telle quelle :</small>
      <div className="ra-meme-liste">
        {siennes.map((x) => (
          <button key={x} type="button" onClick={() => versLeStudio({ texte: x })}>
            « {x} »<em>Créer ce mème ›</em>
          </button>
        ))}
      </div>
    </section>
  );
}

function ApresRencontre({
  r,
  relook,
  onRencontre,
  onRessemblance,
  ressemblance,
}: {
  r: RencontreVue;
  relook: Relook;
  onRencontre: (x: RencontreVue) => void;
  onRessemblance: (n: number | null) => void;
  ressemblance: number | null;
}) {
  return (
    <div className="ra">
      <Proposition r={r} relook={relook} />
      <FaisEnUnMeme r={r} />
      {r.revele && (
        <section className="ra-revele">
          <b>🪞 Ce que ta figurine a révélé de toi</b>
          <p>{r.revele}</p>
        </section>
      )}
      {r.question && <EtToi key={r.id} r={r} onRencontre={onRencontre} />}
      {r.echange && <Echange r={r} onRencontre={onRencontre} />}
      <details className="ra-bd">
        <summary>
          <span aria-hidden="true">📖</span> Relire la conversation <small>et dire si c’est bien toi</small>
        </summary>
        <Fil key={r.id} r={r} onRessemblance={onRessemblance} ressemblance={ressemblance} />
      </details>
      {r.partage && r.partage.length > 0 && (
        <section className="ra-partage">
          <b>✨ Ce qui a été partagé</b>
          <ul>
            {r.partage.map((x, k) => (
              <li key={k}>{x}</li>
            ))}
          </ul>
        </section>
      )}
      <CarteSouvenir titre={r.titre || `Rencontre avec ${nomDe(r.autre)}`} jour={r.jour} moi={r.moi} autre={r.autre} avec={nomDe(r.autre)} />
    </div>
  );
}

/**
 * 🎬 UN ÉPISODE : son affiche (« ▶ Regarder »), le théâtre, puis ce qu'il en reste sur la page. Chez un commerçant
 * qui relooke (le coiffeur, la boutique…), sa figurine relookée est demandée dès qu'il lance l'épisode : elle est prête
 * à la fin. `direct` : un épisode tout neuf (une discussion d'ami qu'il vient de lancer) s'ouvre aussitôt.
 */
function Episode({
  r,
  direct,
  jourEnTete,
  genre,
  ressemblance,
  onRessemblance,
  onRencontre,
}: {
  r: RencontreVue;
  direct: boolean;
  jourEnTete: string;
  genre: string;
  ressemblance: number | null;
  onRessemblance: (n: number | null) => void;
  onRencontre: (x: RencontreVue) => void;
}) {
  const [vue, setVue] = useState(() => !direct && (dejaVueEnDirect(r.id) || Object.keys(r.reactions).length > 0));
  const [theatre, setTheatre] = useState(direct);
  const [relook, setRelook] = useState<Relook>({ image: r.transformation ?? "", etat: "" });
  const demande = useRef(false);
  const relooker = useCallback(() => {
    if (!r.transformable || r.transformation || demande.current) return;
    demande.current = true;
    setRelook((x) => ({ ...x, etat: "cours" }));
    void (async () => {
      for (let k = 0; k < 10; k++) {
        try {
          const j = await poster({ action: "relooker", id: r.id });
          if (j.image) return setRelook({ image: String(j.image), etat: "" });
          if (!j.enCours) break;
        } catch {
          break;
        }
        await new Promise((ok) => window.setTimeout(ok, 15_000));
      }
      setRelook((x) => ({ ...x, etat: x.image ? "" : "erreur" }));
    })();
  }, [r.id, r.transformable, r.transformation]);
  // (un épisode qui s'ouvre tout seul : son relooking part aussitôt)
  useEffect(() => {
    if (direct) void Promise.resolve().then(relooker);
  }, [direct, relooker]);
  const fin = useCallback(() => setVue(true), []);
  const fermer = useCallback(() => setTheatre(false), []);
  return (
    <>
      <Affiche
        r={r}
        vue={vue}
        jourEnTete={jourEnTete}
        genre={genre}
        onRegarder={() => {
          setTheatre(true);
          relooker();
        }}
      />
      {theatre && <Theatre r={r} relook={relook} onFin={fin} onFermer={fermer} />}
      {vue && <ApresRencontre r={r} relook={relook} onRencontre={onRencontre} onRessemblance={onRessemblance} ressemblance={ressemblance} />}
    </>
  );
}

/** Le temps qui reste jusqu'à minuit, heure de Paris (la prochaine rencontre du jour). */
function useJusquaMinuit(): string {
  const [reste, setReste] = useState("");
  useEffect(() => {
    const maj = () => {
      const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
      const g = (k: string) => Number(p.find((x) => x.type === k)?.value ?? 0);
      const s = 86_400 - (g("hour") * 3600 + g("minute") * 60 + g("second"));
      const d = (n: number) => String(n).padStart(2, "0");
      setReste(`${d(Math.floor(s / 3600))}:${d(Math.floor((s % 3600) / 60))}:${d(s % 60)}`);
    };
    maj();
    const t = window.setInterval(maj, 1000);
    return () => window.clearInterval(t);
  }, []);
  return reste;
}

/**
 * 🎲 « RENCONTRER UN MEMBRE » : un gros bouton rond ; on appuie, le compte à rebours tourne (3… 2… 1…), et le guide présente
 * un membre de sa ville. Déjà fait aujourd'hui : le temps qui reste jusqu'à demain.
 */
function BoutonMembre({ fait, onRencontre, onAttente, desactive }: { fait: boolean; onRencontre: (r: RencontreVue) => void; onAttente: () => void; desactive?: boolean }) {
  const [compte, setCompte] = useState<number | null>(null);
  const [erreur, setErreur] = useState("");
  const minuit = useJusquaMinuit();
  async function lancer() {
    if (!window.confirm("Ta figurine, ton prénom et ta carte seront présentés à un membre de ta ville. D’accord ?")) return;
    setErreur("");
    const reponse = poster({ action: "membre" });
    for (const n of [3, 2, 1]) {
      setCompte(n);
      await new Promise((ok) => window.setTimeout(ok, 750));
    }
    try {
      const j = await reponse;
      setCompte(null);
      if (j.rencontre) onRencontre(j.rencontre as RencontreVue);
      else onAttente();
    } catch (e) {
      setCompte(null);
      setErreur((e as Error).message);
    }
  }
  return (
    <div className="rd-choix rd-membre">
      <b>🎲 Rencontre un membre</b>
      <small>Une figurine de ta ville, au hasard. Vous découvrez vos personnages en regardant leur conversation, en direct.</small>
      {fait ? (
        <span className="rd-rebours" aria-label="Prochaine rencontre de membre">
          <i>⏳</i>
          <b>{minuit}</b>
          <small>avant ta prochaine rencontre de membre</small>
        </span>
      ) : (
        <button type="button" className={`rd-rond${compte != null ? " tourne" : ""}`} onClick={lancer} disabled={compte != null || desactive}>
          {compte != null ? <b key={compte}>{compte}</b> : <span>Appuie !</span>}
        </button>
      )}
      {erreur && (
        <p className="tf-erreur" role="alert">
          {erreur}
        </p>
      )}
    </div>
  );
}

export function RencontreDuJour({
  compte,
  version = 0,
  allerA,
  sousLEpisode,
}: {
  compte: boolean | null;
  version?: number;
  allerA?: (o: string) => void;
  /** Sous l'épisode du jour : sa figurine du mois, qui se mérite en dix jours de rencontres (`ma-collection.tsx`). */
  sousLEpisode?: ReactNode;
}) {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [chargement, setChargement] = useState(false);
  const [ressemblance, setRessemblance] = useState<number | null>(null);
  const [invitation, setInvitation] = useState("");
  const [ami, setAmi] = useState("");
  const [ancienne, setAncienne] = useState<RencontreVue | null>(null);
  /** Celle qu'il regarde à la place de la rencontre du jour est toute neuve (une discussion d'ami) : en direct. */
  const [neuve, setNeuve] = useState(false);
  const [discute, setDiscute] = useState<number | null>(null);
  const [attente, setAttente] = useState(false);
  const [erreur, setErreur] = useState("");
  // 🎬 AVEC UN AMI, ON CHOISIT LE THÈME (6 novembre 2026) : l'ami touché, puis le thème
  const [choixAmi, setChoixAmi] = useState<number | null>(null);
  const [theme, setTheme] = useState<string>(THEMES_AMIS[0].cle);
  const minuit = useJusquaMinuit();

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      const j = (await (await fetch("/api/direct/rencontre", { cache: "no-store" })).json()) as Etat & { compte?: boolean };
      setEtat(j);
      setRessemblance(j.ressemblance ?? null);
    } catch {
      setEtat(null);
    } finally {
      setChargement(false);
    }
  }, []);

  // LE LIEN D'UN AMI (`?ami=<code>`) : gardé sur l'appareil, accepté dès qu'il a un compte
  useEffect(() => {
    try {
      const code = new URL(window.location.href).searchParams.get("ami");
      if (code) window.localStorage.setItem(CLE_AMI, code);
    } catch {
      /* rien de gardé */
    }
  }, []);
  useEffect(() => {
    if (!compte) return;
    let fini = false;
    (async () => {
      let code = "";
      try {
        code = window.localStorage.getItem(CLE_AMI) ?? "";
      } catch {
        code = "";
      }
      if (code) {
        try {
          const j = await poster({ action: "accepter", code });
          if (!fini && j.ami) setAmi(String(j.ami));
        } catch {
          /* un lien qui n'est plus valable : tant pis */
        }
        try {
          window.localStorage.removeItem(CLE_AMI);
        } catch {
          /* rien */
        }
      }
      if (!fini) await charger();
    })();
    return () => {
      fini = true;
    };
  }, [compte, version, charger]);

  async function inviter() {
    setErreur("");
    try {
      const j = await poster({ action: "inviter" });
      setInvitation(`${window.location.origin}${String(j.lien)}`);
    } catch (e) {
      setErreur((e as Error).message);
    }
  }
  async function signaler(id: string) {
    if (!window.confirm("Signaler cette conversation ? Elle ne s’affichera plus.")) return;
    try {
      await poster({ action: "signaler", id });
      setAncienne(null);
      await charger();
    } catch (e) {
      setErreur((e as Error).message);
    }
  }
  async function bloquer(id: string) {
    if (!window.confirm("Ne plus rencontrer ce membre ?")) return;
    try {
      await poster({ action: "bloquer", id });
      setErreur("");
      window.alert("C’est noté : vous ne serez plus présentés.");
    } catch (e) {
      setErreur((e as Error).message);
    }
  }
  async function arreter() {
    try {
      await poster({ action: "arreter-membres" });
      setAttente(false);
      await charger();
    } catch (e) {
      setErreur((e as Error).message);
    }
  }
  const voir = useCallback(async (id: string) => {
    try {
      const j = (await (await fetch(`/api/direct/rencontre?id=${id}`, { cache: "no-store" })).json()) as { rencontre?: RencontreVue };
      setAncienne(j.rencontre ?? null);
      setNeuve(false);
      if (j.rencontre) window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setAncienne(null);
    }
  }, []);
  /** La rencontre a changé (leurs impressions, sa réponse) : celle d'aujourd'hui, ou celle d'avant qu'il regarde. */
  const majRencontre = useCallback((x: RencontreVue) => {
    setAncienne((a) => (a && a.id === x.id ? x : a));
    setEtat((e) => (e && e.rencontre?.id === x.id ? { ...e, rencontre: x } : e));
  }, []);
  /** Une discussion toute neuve (avec un ami) : il la regarde en direct, à la place de celle du jour. */
  const regarder = useCallback((x: RencontreVue) => {
    setAncienne(x);
    setNeuve(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  async function discuter(n: number) {
    setErreur("");
    setDiscute(n);
    try {
      const j = await poster({ action: "discuter", n, theme });
      setChoixAmi(null);
      setEtat((e) => (e ? { ...e, discussionsRestantes: Number(j.restantes) || 0 } : e));
      regarder(j.rencontre as RencontreVue);
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setDiscute(null);
    }
  }
  const tete = (
    <header className="og-tete">
      <small>RENCONTRES</small>
      <h2>L’épisode du jour</h2>
    </header>
  );
  const explique = (
    <GuideDit
      cle="pablito-rencontres"
      popup
      repliques={[
        { t: "Chaque jour, ta figurine tourne un épisode avec une autre figurine 🎬", v: "joie" },
        { t: "Toi, tu regardes : elles se parlent face à face, rient, font des grimaces. Deux minutes, en direct 🍿", v: "rire" },
        { t: "Chez un commerçant, sa figurine te propose quelque chose : un style, un look, un menu… et tu peux l’essayer en vrai ✨", v: "euphorie" },
        { t: "Avec tes amis, c’est toi qui choisis le thème : la dispute, l’amour, la sortie… 👯", v: "joie" },
        { t: "À la fin, ce que ta figurine a révélé de toi, et une carte souvenir pour ta collection 🪞", v: "neutre", apres: "grimace" },
      ]}
    />
  );

  if (compte === false)
    return (
      <div className="rd-onglet">
        {tete}
        {explique}
        <button type="button" className="og-go" onClick={() => allerA?.("figurine")}>
          📸 Crée ta figurine pour commencer
        </button>
      </div>
    );
  if (!etat)
    return (
      <div className="rd-onglet">
        {tete}
        <div className="rd rd-attente" aria-live="polite">
          {chargement || compte == null ? "💬 Ta figurine discute…" : ""}
        </div>
      </div>
    );

  const r = ancienne ?? etat.rencontre;
  const amisListe = etat.amisListe ?? [];
  const restantes = etat.discussionsRestantes ?? AMIS_PAR_JOUR;
  // avec qui : un ami, un membre, un personnage de ClikMe (imaginaire), un commerce
  const genre = r ? (r.quoi === "ami" ? "AVEC UN AMI" : r.membre ? "UN MEMBRE" : r.autre.type === "personnage" ? "UN PERSONNAGE" : r.autre.type === "commerce" ? "UN COMMERCE" : "") : "";
  const ami0 = amisListe.find((x) => x.n === choixAmi);
  // UNE HISTOIRE QUI SE LIT DANS L'ORDRE (6 novembre 2026 : « il y a énormément de choses partout, on ne sait pas ce
  // qu'il faut regarder ») : l'épisode du jour ; puis « envie d'un autre épisode ? » (un ami et un thème, un membre,
  // inviter) ; puis ses épisodes d'avant
  return (
    <div className="rd-onglet">
      {tete}
      {explique}
      {ami && !etat.nouvelle && (
        <p className="rd-ami" role="status">
          🎉 Toi et {ami}, c’est fait : dès que {ami} aura fait sa carte, vos figurines tourneront leur premier épisode !
        </p>
      )}
      {etat.nouvelle && ancienne?.id !== etat.nouvelle.id && (
        <p className="rd-ami rd-nouvelle" role="status">
          🎉 {nomDe(etat.nouvelle.autre)} vient d’arriver : vos figurines ont tourné un épisode !{" "}
          <button type="button" className="mp-bouton" onClick={() => regarder(etat.nouvelle!)}>
            ▶ Regarder
          </button>
        </p>
      )}

      {/* 🎬 L'ÉPISODE DU JOUR */}
      <div className={`rd${r ? " rd-vedette" : ""}`}>
        {etat.besoinCarte ? (
          <div className="rd-teaser">
            <b>D’abord, ton personnage 🃏</b>
            <p>Ta figurine parle comme toi : fais ta carte (sept questions), et elle part tourner ses épisodes.</p>
            <button type="button" className="og-go" onClick={() => allerA?.("personnage")}>
              🃏 Faire ma carte
            </button>
          </div>
        ) : etat.retiree ? (
          <p className="rd-note">Cette conversation a été retirée. Rendez-vous demain pour le prochain épisode.</p>
        ) : etat.personne || !r ? (
          <p className="rd-note">Personne à rencontrer aujourd’hui : invite un ami, ou appuie sur « Rencontre un membre » 👇</p>
        ) : (
          <>
            <Episode
              key={r.id}
              r={r}
              direct={Boolean(ancienne && neuve)}
              jourEnTete={ancienne && !neuve ? jourCourt(r.jour).toUpperCase() : "AUJOURD’HUI"}
              genre={genre}
              ressemblance={ressemblance}
              onRessemblance={setRessemblance}
              onRencontre={majRencontre}
            />
            <p className="rd-ia">
              Écrit par l’IA, pour jouer.
              {r.autre.type === "commerce" ? " Ce n’est pas le commerçant qui parle." : r.autre.type === "personnage" && r.autre.cle !== "pablito" ? " Ce personnage est imaginaire : il n’existe pas en vrai." : ""}{" "}
              <button type="button" onClick={() => signaler(r.id)}>
                Signaler
              </button>
              {r.membre && (
                <button type="button" onClick={() => bloquer(r.id)}>
                  Ne plus rencontrer ce membre
                </button>
              )}
              {ancienne && (
                <button
                  type="button"
                  onClick={() => {
                    setAncienne(null);
                    setNeuve(false);
                  }}
                >
                  ← Ma rencontre du jour
                </button>
              )}
            </p>
          </>
        )}
        {!etat.besoinCarte && (
          <p className="rd-prochaine">
            ⏳ Prochaine rencontre dans <b>{minuit}</b>
          </p>
        )}
      </div>
      {sousLEpisode}

      {/* 🎬 ENVIE D'UN AUTRE ÉPISODE ? */}
      {!etat.besoinCarte && (
        <section className="rd-autres" aria-label="D’autres épisodes">
          <h3>🎬 Envie d’un autre épisode ?</h3>
          {amisListe.length > 0 && (
            <div className="rd-amis">
              <b>👯 Avec un ami, sur le thème de ton choix</b>
              <small>
                {restantes > 0 ? `Choisis un ami, puis le thème : encore ${restantes} aujourd’hui.` : "Tu as lancé tes épisodes du jour avec tes amis : reviens demain !"}
              </small>
              <ul>
                {amisListe.map((x) => (
                  <li key={x.n} className={choixAmi === x.n ? "pris" : ""}>
                    <Avatar p={{ type: "client", prenom: x.prenom, titre: "", image: x.image, figurine: x.figurine }} />
                    <span className="rd-ami-nom">{x.prenom}</span>
                    {x.carte ? (
                      <button type="button" className="mp-bouton" onClick={() => setChoixAmi((c) => (c === x.n ? null : x.n))} disabled={discute != null || restantes <= 0} aria-expanded={choixAmi === x.n}>
                        💬 Discuter
                      </button>
                    ) : (
                      <small>pas encore sa carte</small>
                    )}
                  </li>
                ))}
              </ul>
              {ami0 && (
                <div className="rd-themes" role="group" aria-label={`Le thème, avec ${ami0.prenom}`}>
                  <b>Le thème, avec {ami0.prenom} ?</b>
                  <div className="rd-themes-liste">
                    {THEMES_AMIS.map((x) => (
                      <button key={x.cle} type="button" className={theme === x.cle ? "pris" : ""} aria-pressed={theme === x.cle} onClick={() => setTheme(x.cle)}>
                        <span aria-hidden="true">{x.emoji}</span> {x.nom}
                      </button>
                    ))}
                  </div>
                  <button type="button" className="og-go rd-lancer" onClick={() => discuter(ami0.n)} disabled={discute != null}>
                    {discute != null ? "🎬 Elles tournent…" : "▶ Lancer l’épisode"}
                  </button>
                </div>
              )}
            </div>
          )}
          <div className="rd-choix-grille">
            <div className="rd-choix rd-inviter">
              <b>📲 Invite un ami</b>
              <small>
                Dès qu’il a fait sa carte, vos figurines tournent leur premier épisode ; ensuite, c’est toi qui choisis le thème ({AMIS_PAR_JOUR} par jour).{" "}
                {etat.amis ? `Déjà ${etat.amis} ami${etat.amis > 1 ? "s" : ""} relié${etat.amis > 1 ? "s" : ""} !` : ""}
              </small>
              {invitation ? (
                <PanneauEnvoi lien={invitation} texte={texteInvitation("")} titre="Ton invitation est prête ✓" />
              ) : (
                <button type="button" className="mp-bouton" onClick={inviter}>
                  📲 Inviter un ami
                </button>
              )}
            </div>
            <BoutonMembre
              fait={etat.membreAujourdhui}
              onRencontre={(x) => {
                setAncienne(null);
                setNeuve(false);
                setEtat((e) => (e ? { ...e, rencontre: x, membreAujourdhui: true, personne: false, retiree: false } : e));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onAttente={() => {
                setAttente(true);
                setEtat((e) => (e ? { ...e, ouvert: true } : e));
              }}
            />
          </div>
          {(attente || etat.ouvert) && !etat.membreAujourdhui && (
            <p className="rd-file" role="status">
              🕐 Tu es dans la file : le prochain membre de ta ville qui appuie rencontrera ta figurine. Tu la verras ici.{" "}
              <button type="button" onClick={arreter}>
                Ne plus me faire rencontrer
              </button>
            </p>
          )}
        </section>
      )}

      {/* 🎞️ SES ÉPISODES D'AVANT (leurs cartes souvenirs) : les toucher les rouvre */}
      {etat.avant.length > 0 && (
        <section className="rd-souvenirs" aria-label="Tes épisodes">
          <b>🎞️ Tes épisodes ({etat.avant.length})</b>
          <div className="rd-souvenirs-liste">
            {etat.avant.map((x) => (
              <button key={x.id} type="button" className="rd-souv" onClick={() => voir(x.id)}>
                <b>{x.titre || `Rencontre avec ${x.avec}`}</b>
                <small>
                  avec {x.avec} · {jourCourt(x.jour)}
                </small>
              </button>
            ))}
          </div>
        </section>
      )}
      {erreur && (
        <p className="tf-erreur" role="alert">
          {erreur}
        </p>
      )}
    </div>
  );
}

export const STYLES_RENCONTRE = `
.rd-onglet{display:flex;flex-direction:column;gap:16px}
.rd-vedette{border:1.5px solid rgba(255,46,154,.5);background:linear-gradient(180deg,rgba(255,46,154,.14),rgba(255,255,255,.03));box-shadow:0 26px 50px -30px rgba(255,46,154,.8)}
.rd-av .rd-clik{position:absolute;left:8%;bottom:0;width:84%;height:94%;opacity:.45}
.rd-q{position:absolute;inset:0;display:grid;place-items:center;color:#FFF4E6;font-size:16px;font-weight:900;text-shadow:0 1px 3px rgba(0,0,0,.6)}
.rd-av.grand .rd-q{font-size:24px}
.rd-av.perso{display:grid;place-items:center;background:radial-gradient(70% 60% at 50% 40%,#FFE2A8,#F2A93B 62%,#8A4B12)}
.rd-perso{font-size:19px;line-height:1}
.rd-av.grand .rd-perso{font-size:30px}
.rd-av.scene .rd-perso{font-size:52px}
.rs-fig.droite .rd-perso{transform:scaleX(-1)}
.rd-format{align-self:flex-start;margin-top:4px;padding:3px 9px;border-radius:999px;background:rgba(142,197,255,.14);border:1px solid rgba(142,197,255,.4);color:#D8E9FF!important;font-size:11.5px!important;font-weight:800}
.rd-nouvelle{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.rd-nouvelle .mp-bouton{padding:6px 12px;font-size:13px}
.rd-amis{display:flex;flex-direction:column;gap:8px;padding:16px;border-radius:24px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12)}
.rd-amis > b{font-size:17px;font-weight:900}
.rd-amis > small{font-size:13px;line-height:1.4;color:#D9C3CB}
.rd-amis ul{display:flex;flex-direction:column;gap:8px;margin:0;padding:0;list-style:none}
.rd-amis li{display:flex;align-items:center;gap:10px;min-width:0}
.rd-amis .rd-ami-nom{flex:1;min-width:0;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rd-amis li .mp-bouton{flex:none;padding:7px 12px;font-size:13px}
.rd-amis li > small{flex:none;font-size:12px;color:#A88E99}
.rd-prochaine{margin:0;padding-top:10px;border-top:1px solid rgba(255,255,255,.1);font-size:13.5px;color:#D9C3CB;text-align:center}
.rd-prochaine b{font-variant-numeric:tabular-nums;color:#F2C46B;font-size:15px}
.rd-jauge{display:block;height:8px;margin-top:6px;border-radius:999px;background:rgba(255,255,255,.12);overflow:hidden}
.rd-jauge i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#FF2E9A,#F2C46B);transition:width .6s cubic-bezier(.2,1.2,.4,1)}
.rd-choix-grille{display:grid;grid-template-columns:minmax(0,1fr);gap:12px}
.rd-choix{display:flex;flex-direction:column;gap:8px;padding:16px;border-radius:24px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12)}
.rd-choix > b{font-size:19px;font-weight:900}
.rd-choix > small{font-size:13.5px;line-height:1.4;color:#D9C3CB}
.rd-membre{align-items:center;text-align:center;background:radial-gradient(80% 70% at 50% 100%,rgba(242,196,107,.18),transparent 70%),rgba(255,255,255,.06);border-color:rgba(242,196,107,.4)}
.rd-rond{display:grid;place-items:center;width:132px;height:132px;margin:6px 0 2px;border-radius:50%;border:0;background:conic-gradient(from 0deg,#FF2E9A,#F2C46B,#FF2E9A);color:#fff;font:inherit;cursor:pointer;box-shadow:0 0 0 8px rgba(255,46,154,.15),0 18px 34px -12px rgba(255,46,154,.9);animation:rd-appel 2s ease-in-out infinite}
.rd-rond span{display:grid;place-items:center;width:110px;height:110px;border-radius:50%;background:#2A0F1F;font-size:17px;font-weight:900}
.rd-rond b{display:grid;place-items:center;width:110px;height:110px;border-radius:50%;background:#2A0F1F;font-size:52px;font-weight:900;animation:rd-chiffre .75s cubic-bezier(.2,1.6,.4,1)}
.rd-rond.tourne{animation:rd-tourne .75s linear infinite}
.rd-rond.tourne b{animation:rd-chiffre .75s cubic-bezier(.2,1.6,.4,1),rd-contre .75s linear infinite}
.rd-rond:disabled{cursor:default}
.rd-rebours{display:flex;flex-direction:column;align-items:center;gap:2px;margin:6px 0}
.rd-rebours i{font-style:normal;font-size:30px}
.rd-rebours b{font-size:30px;font-weight:900;font-variant-numeric:tabular-nums;color:#F2C46B}
.rd-rebours small{font-size:12.5px;color:#D9C3CB}
.rd-file{margin:0;padding:12px 14px;border-radius:16px;background:rgba(142,197,255,.1);border:1px solid rgba(142,197,255,.4);font-size:13.5px;line-height:1.45;color:#D8E9FF}
.rd-file button{border:0;background:none;color:#A8C8F0;font:inherit;font-size:12.5px;text-decoration:underline;cursor:pointer}
@keyframes rd-appel{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
@keyframes rd-tourne{to{transform:rotate(360deg)}}
@keyframes rd-contre{to{transform:rotate(-360deg)}}
@keyframes rd-chiffre{from{transform:scale(2.2);opacity:0}}
@media (min-width:860px){.rd-choix-grille{grid-template-columns:1fr 1fr}}
.rd{display:flex;flex-direction:column;gap:14px;padding:16px;border-radius:26px;background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.03));border:1px solid rgba(255,255,255,.12)}
.rd-attente{min-height:120px;display:grid;place-items:center;color:#D9C3CB;font-weight:800}
.rd-teaser{display:flex;flex-direction:column;gap:8px}
.rd-teaser b{font-size:19px;font-weight:900;line-height:1.15}
.rd-teaser p,.rd-note{margin:0;font-size:14px;line-height:1.45;color:#D9C3CB}
.rd-ami{margin:0;padding:10px 14px;border-radius:14px;background:rgba(61,226,166,.12);border:1px solid rgba(61,226,166,.45);font-size:14px;font-weight:800;color:#BFF7E2}
.rd-tete{display:flex;align-items:center;gap:12px}
.rd-qui{display:flex;flex-direction:column;min-width:0}
.rd-qui small{font-size:10.5px;font-weight:900;letter-spacing:.12em;color:#F2C46B}
.rd-qui b{font-size:17px;line-height:1.15;font-weight:900}
.rd-qui span{font-size:12.5px;color:#A88E99}
.rd-av{position:relative;flex:none;display:block;width:34px;height:34px;border-radius:50%;overflow:hidden;background:radial-gradient(70% 60% at 50% 40%,#FF9AD0,#C2367F 62%,#5E1240);border:2px solid rgba(255,255,255,.25)}
.rd-av.grand{width:54px;height:54px}
.rd-av img{position:absolute;left:8%;bottom:-2px;width:84%;height:94%;object-fit:contain;object-position:bottom}
.rd-av.figurine img{left:0;top:0;width:100%;height:100%;object-fit:cover;object-position:50% 18%}
.rd-fil{display:flex;flex-direction:column;gap:10px;margin:0;padding:0;list-style:none}
.rd-fil li{display:flex;align-items:flex-end;gap:8px;animation:rd-arrive .35s cubic-bezier(.2,1.3,.4,1) both}
.rd-fil li.moi{flex-direction:row-reverse}
.rd-bulle{max-width:82%;padding:10px 12px 8px;border-radius:18px 18px 18px 6px;background:rgba(255,255,255,.09)}
.rd-fil li.moi .rd-bulle{border-radius:18px 18px 6px 18px;background:linear-gradient(135deg,rgba(255,46,154,.32),rgba(123,27,94,.4))}
.rd-bulle small{display:block;font-size:10.5px;font-weight:900;letter-spacing:.04em;color:#F2C46B}
.rd-bulle p{margin:2px 0 6px;font-size:15px;line-height:1.38;color:#FFF4E6}
.rd-reac{display:flex;flex-wrap:wrap;gap:4px;margin-top:2px}
.rd-reac button{padding:4px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.2);color:#E8D3DC;font:inherit;font-size:12px;font-weight:800;cursor:pointer}
.rd-reac button.pris{border-color:#F2C46B;background:rgba(242,196,107,.2);color:#FFF4E6}
.rd-reac .rd-emo{padding:3px 6px;font-size:14px}
.rd-tape{display:flex;gap:4px;margin:0 0 0 44px}
.rd-tape i{width:7px;height:7px;border-radius:50%;background:#D9C3CB;animation:rd-tape 1s ease-in-out infinite}
.rd-tape i:nth-child(2){animation-delay:.15s}
.rd-tape i:nth-child(3){animation-delay:.3s}
.rd-ressemblance{margin:0;padding:10px 14px;border-radius:14px;background:rgba(242,196,107,.1);border:1px solid rgba(242,196,107,.35);font-size:13.5px;line-height:1.4;color:#FFE7B8}
.rd-ressemblance b{font-size:16px;color:#fff}
.rd-ia{margin:0;font-size:12px;color:#8D7580}
.rd-ia button{margin-left:8px;border:0;background:none;color:#A88E99;font:inherit;font-size:12px;text-decoration:underline;cursor:pointer}
.rd-inviter{display:flex;flex-direction:column;gap:10px;padding-top:12px;border-top:1px solid rgba(255,255,255,.1)}
.rd-inviter > b{font-size:15px;line-height:1.3}
/* 🎬 en direct : la scène, la barre, les gestes */
.rs-scene{position:relative;display:grid;grid-template-columns:1fr auto 1fr;align-items:end;gap:6px;padding:16px 10px 10px;border-radius:22px;background:radial-gradient(60% 80% at 25% 100%,rgba(255,46,154,.28),transparent 70%),radial-gradient(60% 80% at 75% 100%,rgba(242,196,107,.22),transparent 70%),linear-gradient(180deg,#2A0D22,#170612);border:1px solid rgba(255,255,255,.1);overflow:hidden}
.rs-scene::after{content:"";position:absolute;left:8%;right:8%;bottom:20px;height:10px;border-radius:50%;background:rgba(0,0,0,.45);filter:blur(4px)}
.rs-fig{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:4px;transform-origin:50% 100%}
.rs-fig small{font-size:11px;font-weight:900;color:#D9C3CB;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rs-fig.droite .rd-av{transform:scaleX(-1)}
.rs-fig.droite .rd-q{transform:scaleX(-1)}
.rs-centre{z-index:1;align-self:center;font-size:26px;animation:rs-flotte 2s ease-in-out infinite}
.rs-fig.parle{animation:rs-parle .45s ease-in-out 4}
.rs-fig.parle small{color:#F2C46B}
.rs-fig.g-rit{animation:rs-rit .18s linear 10}
.rs-fig.g-danse{animation:rs-danse .6s ease-in-out 5}
.rs-fig.g-grimace{animation:rs-grimace .5s ease-in-out 3}
.rs-fig.g-surprise{animation:rs-saute .5s cubic-bezier(.3,1.7,.5,1) 2}
.rs-fig.g-clin{animation:rs-clin .8s ease-in-out 2}
.rs-fig.g-touchee{animation:rs-coeur .6s ease-in-out 3}
.rs-fig.g-applaudit{animation:rs-saute .35s ease-in-out 5}
.rs-fig.g-reflechit{animation:rs-clin 1.6s ease-in-out 2}
.rs-emoji{position:absolute;z-index:2;top:8px;font-size:34px;animation:rs-emoji 1.8s ease-out forwards;pointer-events:none}
.rs-emoji.gauche{left:18%}
.rs-emoji.droite{right:18%}
.rs-scene.fini .rs-fig{animation:rs-flotte 2.4s ease-in-out infinite}
.rd-av.scene{width:92px;height:92px;border-width:3px}
.rd-av.scene .rd-q{font-size:34px}
.rs-barre{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:4px 10px}
.rs-barre small{grid-column:1/-1;font-size:12px;color:#A88E99}
.rs-direct{padding:4px 9px;border-radius:999px;background:#E5323B;color:#fff;font-size:10.5px;font-weight:900;letter-spacing:.08em;animation:rs-clignote 1.4s ease-in-out infinite}
.rs-direct.pause{background:#6B5A63;animation:none}
.rs-direct.fini{background:#2E9E6B;animation:none}
.rs-progres{display:block;height:6px;border-radius:999px;background:rgba(255,255,255,.12);overflow:hidden}
.rs-progres i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#FF2E9A,#F2C46B);transition:width .8s ease}
.rs-controles{display:flex;gap:8px;flex-wrap:wrap}
.rs-controles button{padding:7px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.07);color:#FFF4E6;font:inherit;font-size:12.5px;font-weight:800;cursor:pointer}
.rd-fil.direct{max-height:min(52vh,430px);overflow-y:auto;overscroll-behavior:contain;padding-right:2px}
.rd-geste{font-weight:700;letter-spacing:0;color:#D9C3CB}
.rd-tape-li{display:block!important}
@keyframes rs-parle{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes rs-rit{0%,100%{transform:rotate(0)}25%{transform:rotate(-5deg)}75%{transform:rotate(5deg)}}
@keyframes rs-danse{0%,100%{transform:rotate(-10deg) translateY(0)}50%{transform:rotate(10deg) translateY(-8px)}}
@keyframes rs-grimace{0%,100%{transform:scale(1,1)}50%{transform:scale(1.15,.82)}}
@keyframes rs-saute{0%,100%{transform:translateY(0)}40%{transform:translateY(-18px)}}
@keyframes rs-clin{0%,100%{transform:rotate(0)}50%{transform:rotate(-9deg)}}
@keyframes rs-coeur{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
@keyframes rs-emoji{0%{opacity:0;transform:translateY(20px) scale(.5)}20%{opacity:1;transform:translateY(0) scale(1.15)}100%{opacity:0;transform:translateY(-34px) scale(1)}}
@keyframes rs-flotte{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes rs-clignote{50%{opacity:.55}}
/* 🏁 après : ce qui a été partagé, la carte souvenir, leurs impressions */
.ra{display:flex;flex-direction:column;gap:12px;animation:rd-arrive .5s cubic-bezier(.2,1.3,.4,1) both}
.ra-partage{padding:14px 16px;border-radius:18px;background:rgba(142,197,255,.08);border:1px solid rgba(142,197,255,.35)}
.ra-partage b{font-size:15px;font-weight:900}
.ra-partage ul{display:flex;flex-direction:column;gap:6px;margin:8px 0 0;padding:0 0 0 18px;font-size:14px;line-height:1.4;color:#E4EEFF}
.cs{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;width:100%;max-width:320px;margin:0 auto;padding:18px 16px 16px;border-radius:22px;border:2px solid rgba(242,196,107,.65);background:radial-gradient(90% 70% at 50% 0%,rgba(242,196,107,.25),transparent 70%),linear-gradient(160deg,#4A1838,#1E0918);color:#FFF4E6;font:inherit;text-align:center;box-shadow:0 22px 40px -22px rgba(242,196,107,.7)}
.cs.nouvelle{animation:cs-arrive .9s cubic-bezier(.2,1.4,.4,1) both}
.cs-ruban{position:absolute;top:-12px;left:50%;transform:translateX(-50%);padding:4px 12px;border-radius:999px;background:linear-gradient(90deg,#FF2E9A,#F2C46B);color:#fff;font-size:12px;font-weight:900;white-space:nowrap}
.cs-etiquette{font-size:10.5px;font-weight:900;letter-spacing:.14em;color:#F2C46B}
.cs-duo{display:flex;align-items:center;justify-content:center}
.cs-duo .rd-av + .rd-av{margin-left:-12px}
.cs-titre{font-size:19px;line-height:1.15;font-weight:900}
.cs-qui{font-size:12.5px;color:#D9C3CB}
.cs.petite{max-width:none;margin:0;padding:12px 10px;gap:4px;cursor:pointer;border-width:1.5px}
.cs.petite .cs-titre{font-size:14px}
.cs.petite .cs-qui{font-size:11px}
.cs.petite .cs-etiquette{font-size:9px}
@keyframes cs-arrive{from{opacity:0;transform:rotateY(80deg) scale(.8)}}
.ra-echange{display:flex;flex-direction:column;gap:8px;padding:14px 16px;border-radius:18px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14)}
.ra-echange > b{font-size:15px;font-weight:900}
.ra-echange > small{font-size:13px;line-height:1.4;color:#D9C3CB}
.ra-note{color:#BFF7E2!important}
.ra-retirer{align-self:flex-start;border:0;background:none;color:#A88E99;font:inherit;font-size:12.5px;text-decoration:underline;cursor:pointer}
.ra-fil{display:flex;flex-direction:column;gap:6px;margin:0;padding:0;list-style:none}
.ra-fil li{max-width:85%;padding:8px 11px;border-radius:14px;background:rgba(255,255,255,.09)}
.ra-fil li.moi{align-self:flex-end;background:rgba(255,46,154,.25)}
.ra-fil small{font-size:10.5px;font-weight:900;color:#F2C46B}
.ra-fil p{margin:2px 0 0;font-size:14px;line-height:1.4}
.ra-echange textarea{width:100%;padding:10px 12px;border-radius:14px;border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.25);color:#FFF4E6;font:inherit;font-size:15px;resize:vertical}
.ra-actions{display:flex;align-items:center;gap:12px}
.ra-revele{padding:14px 16px;border-radius:18px;background:linear-gradient(135deg,rgba(255,46,154,.2),rgba(242,196,107,.14));border:1.5px solid rgba(255,46,154,.55)}
.ra-revele b{font-size:15px;font-weight:900}
.ra-revele p{margin:6px 0 0;font-size:16px;line-height:1.4;font-weight:700;color:#FFF4E6}
.rd-aide{margin:0;font-size:12.5px;color:#A88E99;text-align:center}
.rd-fil li.reagir .rd-bulle{cursor:pointer}
.rd-emo-pose{margin-left:6px;font-size:15px}
.ra-ettoi{display:flex;flex-direction:column;gap:8px;padding:14px 16px;border-radius:18px;background:rgba(242,196,107,.08);border:1px solid rgba(242,196,107,.45)}
.ra-ettoi > b{font-size:15px;font-weight:900;color:#F2C46B}
.ra-question{margin:0;font-size:16px;line-height:1.35;font-weight:800;color:#FFF4E6}
.ra-ettoi > small{font-size:12.5px;color:#D9C3CB}
.ra-ettoi textarea{width:100%;padding:10px 12px;border-radius:14px;border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.25);color:#FFF4E6;font:inherit;font-size:15px;resize:vertical}
.ra-ettoi .ra-envoyer{align-self:flex-start}
.ra-reponse{margin:0;padding:8px 11px;border-radius:14px;background:rgba(255,46,154,.2);font-size:14px;line-height:1.4}
.ra-reponse small{display:block;font-size:10.5px;font-weight:900;color:#F2C46B}
/* 🎞️ ses cartes souvenirs */
.rd-souvenirs{display:flex;flex-direction:column;gap:8px}
.rd-souvenirs > b{font-size:14px;font-weight:900;color:#D9C3CB}
.rd-souvenirs-liste{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;scroll-snap-type:x mandatory}
.rd-souv{flex:none;display:flex;flex-direction:column;gap:2px;width:170px;padding:10px 12px;border-radius:16px;border:1.5px solid rgba(242,196,107,.45);background:linear-gradient(160deg,rgba(74,24,56,.9),rgba(30,9,24,.9));color:#FFF4E6;font:inherit;text-align:left;cursor:pointer;scroll-snap-align:start}
.rd-souv b{font-size:13.5px;line-height:1.2;font-weight:900}
.rd-souv small{font-size:11.5px;color:#A88E99}
@keyframes rd-arrive{from{opacity:0;transform:translateY(10px) scale(.97)}}
@keyframes rd-tape{0%,100%{opacity:.3;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}
@media (min-width:860px){.rd{padding:22px 26px}.rd-bulle{max-width:68%}}
/* ═══ 6 novembre 2026 : L'ÉPISODE — l'affiche, le théâtre en BD, la fin ═══ */
.rd-vedette{gap:12px}
.ep-affiche{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;margin:-4px -4px 0;padding:14px 12px 16px;border-radius:24px;text-align:center;overflow:hidden;
  background:radial-gradient(circle at 50% 38%,rgba(255,214,120,.28),transparent 46%),radial-gradient(rgba(255,255,255,.07) 1.2px,transparent 1.3px) 0 0/9px 9px,linear-gradient(160deg,#3A0E2C,#1A0714)}
.ep-affiche::before{content:"";position:absolute;inset:0;background:repeating-conic-gradient(from 0deg at 50% 40%,rgba(255,46,154,.09) 0 8deg,transparent 8deg 18deg);pointer-events:none}
.ep-duo{position:relative;display:flex;align-items:flex-end;justify-content:center;gap:0;width:100%;height:190px;perspective:700px}
.ep-fig{position:relative;display:block;width:44%;max-width:170px;height:100%}
.ep-fig > img,.ep-fig > .rs-silhouette{position:absolute;left:50%;bottom:0;box-sizing:border-box;width:auto;height:100%;aspect-ratio:2/3;max-width:100%;translate:-50% 0;object-fit:cover;border-radius:18px;border:3px solid #1D0A17;box-shadow:4px 5px 0 #1D0A17}
.ep-fig > .rs-silhouette b{font-size:40px}
.ep-fig.gauche{transform:rotateY(16deg) translateX(8px);animation:ep-souffle 3.2s ease-in-out infinite}
.ep-fig.droite{transform:rotateY(-16deg) translateX(-8px);animation:ep-souffle 3.2s ease-in-out -1.6s infinite}
.ep-fig .rs-perso{position:absolute;inset:auto 0 10px;font-size:84px;line-height:1;text-align:center}
.ep-vs{position:absolute;left:50%;top:44%;z-index:2;transform:translate(-50%,-50%) rotate(-8deg);display:grid;place-items:center;width:46px;height:46px;border-radius:50%;background:#F2C46B;color:#2A0F1F;font-size:24px;font-weight:900;box-shadow:0 0 0 4px #2A0F1F,0 10px 22px rgba(0,0,0,.6)}
.ep-affiche .rd-qui{position:relative;align-items:center}
.ep-theme{position:relative;padding:6px 12px;border-radius:999px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);font-size:13px;font-weight:900;color:#FFF4E6}
.ep-titre{position:relative;font-size:21px;line-height:1.15;font-weight:900;letter-spacing:-.02em;background:linear-gradient(135deg,#fff,#FFC8E6 55%,#F2C46B);-webkit-background-clip:text;background-clip:text;color:transparent}
.ep-play{position:relative;display:flex;flex-direction:column;align-items:center;gap:1px;margin-top:4px;padding:14px 30px;border:0;border-radius:999px;background:linear-gradient(135deg,#FF2E9A,#FF7A59);color:#fff;font:inherit;font-size:17px;font-weight:900;cursor:pointer;box-shadow:0 14px 30px -10px rgba(255,46,154,1);animation:ep-appel 2.2s ease-in-out infinite}
.ep-play small{font-size:11px;font-weight:800;opacity:.85}
.ep-play.revoir{background:rgba(255,255,255,.12);box-shadow:inset 0 0 0 1px rgba(255,255,255,.22);animation:none;font-size:15px;padding:11px 22px}
/* le théâtre : tout l'écran */
.rs-theatre{--fig:min(43vw,190px);position:fixed;inset:0;z-index:80;display:flex;flex-direction:column;padding:calc(10px + env(safe-area-inset-top)) 12px calc(14px + env(safe-area-inset-bottom));box-sizing:border-box;color:#FFF4E6;
  font-family:var(--font-clikme),Poppins,system-ui,-apple-system,"Segoe UI",sans-serif;
  background:radial-gradient(60% 40% at 25% 70%,rgba(255,46,154,.22),transparent 70%),radial-gradient(60% 40% at 75% 70%,rgba(242,196,107,.18),transparent 70%),radial-gradient(rgba(255,255,255,.06) 1.3px,transparent 1.4px) 0 0/10px 10px,linear-gradient(180deg,#24091C,#0F040C);
  animation:rs-ouvre .35s ease-out both}
.rs-segments{display:flex;gap:3px}
.rs-segments i{flex:1;height:3px;border-radius:999px;background:rgba(255,255,255,.2)}
.rs-segments i.fait{background:#FFF4E6}
.rs-theatre.pause .rs-segments i.en-cours{animation-play-state:paused}
.rs-segments i.en-cours{background:linear-gradient(90deg,#FFF4E6 50%,rgba(255,255,255,.25) 50%);background-size:200% 100%;animation:rs-remplit 3s linear forwards}
.rs-haut{display:flex;align-items:center;gap:10px;margin-top:10px}
.rs-haut b{flex:1;min-width:0;font-size:14px;font-weight:900;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rs-fermer{flex:none;display:grid;place-items:center;width:36px;height:36px;border:0;border-radius:50%;background:rgba(255,255,255,.12);color:#fff;font-size:16px;cursor:pointer}
.rs-theatre .rs-scene{position:relative;flex:1;display:block;min-height:0;margin:8px 0 0;padding:0;border:0;border-radius:0;background:none;overflow:hidden;cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none}
.rs-theatre .rs-scene::after{display:none}
.rs-decor{position:absolute;left:4%;right:4%;bottom:6px;height:22px;border-radius:50%;background:radial-gradient(closest-side,rgba(0,0,0,.6),transparent)}
.rs-theatre .rs-fig{position:absolute;bottom:14px;z-index:1;display:flex;flex-direction:column;align-items:center;gap:6px;width:var(--fig);transition:transform .35s cubic-bezier(.2,1.4,.4,1),filter .35s,opacity .35s;animation:none}
.rs-theatre .rs-fig > img,.rs-theatre .rs-fig > .rs-silhouette,.rs-theatre .rs-fig > .rd-clik{display:block;box-sizing:border-box;width:100%;height:calc(var(--fig) * 1.5);object-fit:cover;border-radius:22px;border:3px solid #1D0A17;box-shadow:4px 5px 0 #1D0A17,0 0 0 2px rgba(255,255,255,.12)}
.rs-theatre .rs-fig .rs-perso{display:grid;place-items:center;box-sizing:border-box;width:100%;height:calc(var(--fig) * 1.5);border-radius:22px;border:3px solid #1D0A17;box-shadow:4px 5px 0 #1D0A17;background:radial-gradient(70% 60% at 50% 40%,#FFE2A8,#F2A93B 62%,#8A4B12);font-size:96px;line-height:1}
.rs-silhouette{position:relative;display:block;overflow:hidden;background:radial-gradient(70% 60% at 50% 35%,#5A2148,#2A0F1F)}
.rs-silhouette b{position:absolute;inset:0;display:grid;place-items:center;font-size:56px;font-weight:900;color:#FFC8E6}
.rs-theatre .rs-fig small{font-size:12px;font-weight:900;color:#D9C3CB}
.rs-theatre .rs-fig.gauche{left:1%;transform:perspective(700px) rotateY(14deg)}
.rs-theatre .rs-fig.droite{right:1%;transform:perspective(700px) rotateY(-14deg)}
.rs-theatre .rs-fig.ecoute{filter:brightness(.62) saturate(.8)}
.rs-theatre .rs-fig.parle small{color:#F2C46B}
.rs-theatre .rs-fig.gauche.parle{transform:perspective(700px) rotateY(14deg) scale(1.08);animation:rs-parle-g .5s ease-in-out infinite}
.rs-theatre .rs-fig.droite.parle{transform:perspective(700px) rotateY(-14deg) scale(1.08);animation:rs-parle-d .5s ease-in-out infinite}
.rs-theatre .rs-fig.parle.g-rit{animation:rs-rit .16s linear infinite}
.rs-theatre .rs-fig.parle.g-danse{animation:rs-danse .6s ease-in-out infinite}
.rs-theatre .rs-fig.parle.g-grimace{animation:rs-grimace .5s ease-in-out infinite}
.rs-theatre .rs-fig.parle.g-surprise{animation:rs-saute .5s cubic-bezier(.3,1.7,.5,1) 2}
.rs-theatre .rs-fig.parle.g-applaudit{animation:rs-saute .35s ease-in-out infinite}
/* la bulle de BD */
.rs-bulle{position:absolute;bottom:calc(var(--fig) * 1.5 + 64px);z-index:3;max-width:78%;padding:12px 16px 14px;border-radius:24px;background:#FFFDF7;color:#1D0A17;border:3px solid #1D0A17;box-shadow:5px 6px 0 #1D0A17;animation:rs-pop .35s cubic-bezier(.2,1.6,.4,1) both}
.rs-bulle.gauche{left:3%}
.rs-bulle.droite{right:3%}
.rs-bulle::after{content:"";position:absolute;bottom:-21px;width:26px;height:22px;background:#FFFDF7;border:3px solid #1D0A17;border-top:0;clip-path:polygon(0 0,100% 0,30% 100%)}
.rs-bulle.gauche::after{left:30px;border-right:0}
.rs-bulle.droite::after{right:30px;border-left:0;clip-path:polygon(0 0,100% 0,70% 100%)}
.rs-bulle small{display:block;margin-bottom:3px;font-size:11px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:#C2187A}
.rs-bulle p{margin:0;font-size:18px;line-height:1.32;font-weight:800}
.rs-reste{visibility:hidden}
.rs-recit{position:absolute;left:3%;top:4%;z-index:2;max-width:70%;padding:8px 12px;background:#F2C46B;color:#1D0A17;border:3px solid #1D0A17;box-shadow:4px 4px 0 #1D0A17;font-size:16px;line-height:1.2;font-weight:900;transform:rotate(-1.5deg)}
.rs-recit small{display:block;font-size:10px;letter-spacing:.14em;color:#7A2E55}
.rs-ono{position:absolute;z-index:4;bottom:calc(var(--fig) * 1.1);font-size:34px;font-weight:900;letter-spacing:.02em;color:#F2C46B;-webkit-text-stroke:2px #1D0A17;paint-order:stroke fill;text-shadow:4px 4px 0 #FF2E9A;animation:rs-ono 1.4s cubic-bezier(.2,1.6,.4,1) both;pointer-events:none}
.rs-ono.gauche{left:6%;transform:rotate(-12deg)}
.rs-ono.droite{right:6%;transform:rotate(10deg)}
.rs-claquette{position:absolute;left:50%;top:36%;z-index:4;transform:translate(-50%,-50%) rotate(-6deg);padding:10px 18px;border-radius:14px;background:#1D0A17;color:#FFF4E6;font-size:26px;font-weight:900;box-shadow:0 0 0 3px #F2C46B;animation:rs-pop .5s cubic-bezier(.2,1.6,.4,1) both}
.rs-theatre .rs-barre{display:block;margin-top:6px;text-align:center}
.rs-theatre .rs-barre small{font-size:12px;color:#A88E99}
.rs-theatre .rs-controles{justify-content:center;margin-top:8px}
.rs-theatre .rs-controles button{padding:10px 16px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#FFF4E6;font:inherit;font-size:14px;font-weight:900;cursor:pointer}
/* la fin */
.rs-fin{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;gap:14px;margin-top:10px;padding-bottom:8px;overflow-y:auto;overscroll-behavior:contain}
.rs-fin-mot{font-size:56px;line-height:1;font-weight:900;letter-spacing:.06em;color:#F2C46B;-webkit-text-stroke:2px #1D0A17;paint-order:stroke fill;text-shadow:5px 5px 0 #FF2E9A;animation:rs-pop .6s cubic-bezier(.2,1.6,.4,1) both}
.rs-fin .cs{flex:none}
.rs-fin-actions{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;max-width:360px}
.rs-fin-actions .og-go{width:100%;box-sizing:border-box;border:0;font:inherit;font-size:16px;font-weight:900;cursor:pointer}
.rs-revoir{border:0;background:none;color:#D9C3CB;font:inherit;font-size:13.5px;font-weight:800;text-decoration:underline;cursor:pointer}
/* ce qu'il propose (chez un commerçant), avant / après */
.ra-meme{display:flex;flex-direction:column;gap:6px;width:100%;max-width:420px;box-sizing:border-box;padding:14px 16px;border-radius:20px;background:linear-gradient(160deg,rgba(255,46,154,.2),rgba(255,122,89,.1));border:1.5px solid rgba(255,46,154,.55)}
.ra-meme > b{font-size:18px;font-weight:900}
.ra-meme > small{font-size:12.5px;color:#E8D3DC}
.ra-meme-liste{display:flex;flex-direction:column;gap:8px;margin-top:4px}
.ra-meme-liste button{display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:11px 13px;border-radius:16px;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.25);color:#FFF4E6;font:inherit;font-size:14px;font-weight:700;line-height:1.35;text-align:left;cursor:pointer}
.ra-meme-liste em{font-style:normal;font-size:12px;font-weight:900;color:#FF9FD2}
.ra-proposition{display:flex;flex-direction:column;gap:6px;width:100%;max-width:420px;box-sizing:border-box;padding:14px 16px;border-radius:20px;background:linear-gradient(160deg,rgba(242,196,107,.18),rgba(255,46,154,.1));border:1.5px solid rgba(242,196,107,.55)}
.ra-proposition > small{font-size:10.5px;font-weight:900;letter-spacing:.12em;color:#F2C46B}
.ra-proposition > b{font-size:19px;line-height:1.2;font-weight:900}
.ra-proposition > p{margin:0;font-size:14px;line-height:1.45;color:#E8D3DC}
.ra-proposition.grand{animation:rs-pop .6s .15s cubic-bezier(.2,1.4,.4,1) both}
.ra-avap{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:4px}
.ra-avap span{position:relative;display:block;border-radius:16px;overflow:hidden;background:#2A0F1F}
.ra-avap img{display:block;width:100%;aspect-ratio:2/3;object-fit:cover}
.ra-avap i{position:absolute;left:8px;bottom:8px;padding:3px 8px;border-radius:999px;background:rgba(0,0,0,.6);font-style:normal;font-size:11px;font-weight:900}
.ra-avap .apres{box-shadow:0 0 0 2.5px #F2C46B,0 0 26px rgba(242,196,107,.55);animation:rs-pop .7s cubic-bezier(.2,1.4,.4,1) both}
.ra-avap .apres i{background:#F2C46B;color:#2A0F1F}
.ra-relook-cours{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:14px;background:rgba(0,0,0,.25);font-size:13.5px;font-weight:800;color:#FFE7B8}
.ra-relook-cours i{flex:none;width:16px;height:16px;border-radius:50%;border:2.5px solid rgba(242,196,107,.3);border-top-color:#F2C46B;animation:rs-tourne .9s linear infinite}
.ra-action{margin-top:4px;text-align:center}
.ra-bd{border-radius:18px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);padding:0 12px}
.ra-bd summary{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;padding:13px 2px;list-style:none;cursor:pointer;font-size:15px;font-weight:900}
.ra-bd summary::-webkit-details-marker{display:none}
.ra-bd summary small{font-size:12.5px;font-weight:700;color:#A88E99}
.ra-bd[open]{padding-bottom:12px}
.rd-fil.bd .rd-bulle{background:#FFFDF7;color:#1D0A17;border:2.5px solid #1D0A17;box-shadow:3px 4px 0 #1D0A17}
.rd-fil.bd li.moi .rd-bulle{background:#FFE3F1}
.rd-fil.bd .rd-bulle small{color:#C2187A}
.rd-fil.bd .rd-bulle p{color:#1D0A17;font-weight:700}
.rd-fil.bd .rd-geste{color:#7A4D63}
/* d'autres épisodes */
.rd-autres{display:flex;flex-direction:column;gap:12px}
.rd-autres > h3{margin:6px 0 0;font-size:20px;font-weight:900}
.rd-amis li.pris{padding:4px;margin:-4px;border-radius:14px;background:rgba(255,46,154,.12)}
.rd-themes{display:flex;flex-direction:column;gap:10px;padding:12px;border-radius:18px;background:rgba(0,0,0,.22);animation:rd-arrive .35s cubic-bezier(.2,1.3,.4,1) both}
.rd-themes > b{font-size:15px;font-weight:900}
.rd-themes-liste{display:flex;flex-wrap:wrap;gap:6px}
.rd-themes-liste button{padding:8px 12px;border-radius:999px;border:1.5px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#FFF4E6;font:inherit;font-size:13px;font-weight:800;cursor:pointer}
.rd-themes-liste button.pris{border-color:#FF2E9A;background:rgba(255,46,154,.22)}
.rd-lancer{border:0;font:inherit;font-size:16px;font-weight:900;cursor:pointer}
.rd-lancer:disabled{opacity:.7}
@keyframes ep-souffle{0%,100%{translate:0 0}50%{translate:0 -5px}}
@keyframes ep-appel{0%,100%{box-shadow:0 14px 30px -10px rgba(255,46,154,1)}50%{box-shadow:0 0 0 8px rgba(255,46,154,.22),0 14px 30px -10px rgba(255,46,154,1)}}
@keyframes rs-ouvre{from{opacity:0;transform:scale(1.04)}}
@keyframes rs-remplit{from{background-position:100% 0}to{background-position:0 0}}
@keyframes rs-pop{from{opacity:0;transform:scale(.6)}}
@keyframes rs-ono{0%{opacity:0;scale:.3}20%{opacity:1;scale:1.15}35%{scale:1}80%{opacity:1}100%{opacity:0;scale:1.05}}
@keyframes rs-parle-g{0%,100%{translate:0 0}50%{translate:0 -10px}}
@keyframes rs-parle-d{0%,100%{translate:0 0}50%{translate:0 -10px}}
@keyframes rs-tourne{to{transform:rotate(360deg)}}
@media (min-width:860px){.rs-theatre{padding-left:max(24px,calc(50vw - 420px));padding-right:max(24px,calc(50vw - 420px))}.rs-bulle p{font-size:20px}}
@media (prefers-reduced-motion:reduce){.rd *,.rd-onglet *,.rs-theatre *{animation:none!important}}
`;
