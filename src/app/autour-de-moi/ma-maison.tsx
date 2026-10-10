"use client";

// 🏠 MA MAISON — « Vous me montrez un peu de vous. Je vais voir ce que la ville
// a pour vous. »
//
// QUATRE VUES, UNE MAISON :
//   · l'entrée : le Fantôme, ce qu'il a déjà rangé, et les sept pièces — dans
//     l'ordre de l'heure (la cuisine à midi, les sorties le soir) ;
//   · une pièce : ce que vous m'avez dit, ce que j'ai remarqué, ce que je crois,
//     et de quoi la mettre en pause ou la vider ;
//   · les réglages : la Maison privée, l'adresse qui la retrouve, mon fantôme,
//     tout effacer ;
//   · l'adresse et le code : « Emportez votre Maison avec vous ».
//
// RIEN ICI NE DEMANDE DE REMPLIR UN PROFIL. Une pièce vide dit le petit geste
// qui la réveille et ce qu'il débloquera ; une pièce qui apprend dit ce qu'elle
// fait déjà pour vous. On montre ce que ça APPORTE, pas ce que ça stocke — ce
// que la Maison sait reste visible, mais sous le bénéfice. Les réglages restent
// derrière la roue dentée. Voir `lib/direct/maison.ts`.
import { useMemo, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { FantomeAnime, StylesFantome } from "@/components/direct/fantome-anime";
import { abonnerLook, monLook } from "@/lib/direct/look";
import { changerDeLook } from "./prendre-place";
import type { PieceGardee } from "@/lib/direct/pieces-gardees";
import { CourrierDuFantome, RevoirLesSurprises } from "./surprises";
import {
  etatDe,
  motDuFantome,
  ordreSelonLHeure,
  pieceParCle,
  type ClePiece,
  type EtatPiece,
  type Signal,
} from "@/lib/direct/maison";
import {
  abonnerMaisonPrivee,
  chargerMaisonPrivee,
  choisirDansLaPiece,
  demanderLeCode,
  donnerLeCode,
  effacerToutLaMaison,
  maisonPriveeServeur,
  mettreEnPause,
  refuserLeTrait,
  viderLaPiece,
} from "@/lib/direct/maison-memoire";

type Vue = { ou: "entree" } | { ou: "piece"; cle: ClePiece } | { ou: "reglages" } | { ou: "compte" };

const rien = () => () => {};
const heureServeur = () => 12;
const heureIci = () => new Date().getHours();

export function MaMaison({
  reelle,
  gardees,
  surprises,
  onDecouvrir,
  onVoirGardee,
  demandeGeste = 0,
  reglagesEnPlus,
}: {
  /** Dans une vraie ville : la Maison est gardée par le serveur et l'adresse la retrouve. */
  reelle: boolean;
  gardees: PieceGardee[];
  /**
   * LES SURPRISES DU JOUR — la tournée est tenue par l'application (le badge
   * en dépend), l'écran aussi : ici, l'enveloppe du Fantôme. Voir `surprises.tsx`.
   */
  surprises?: { aOuvrir: number; duJour: number; onOuvrir: (revoir: boolean) => void };
  /** « Découvrir » depuis une pièce : le Direct, sur son métier. */
  onDecouvrir: (branche: string) => void;
  onVoirGardee?: (p: PieceGardee) => void;
  /** Le Fantôme du bas, sur cette page : il ouvre la pièce du moment. */
  demandeGeste?: number;
  /** Ce que les réglages gardent de l'application (aide, mes fantômes, installer). */
  reglagesEnPlus?: ReactNode;
}) {
  const etat = useSyncExternalStore(abonnerMaisonPrivee, chargerMaisonPrivee, maisonPriveeServeur);
  const look = useSyncExternalStore(abonnerLook, monLook, monLook);
  const heure = useSyncExternalStore(rien, heureIci, heureServeur);
  const [vue, setVue] = useState<Vue>({ ou: "entree" });

  const etats = useMemo(() => {
    const ordre = ordreSelonLHeure(heure);
    return ordre.map((cle) => etatDe(etat.memoire, pieceParCle(cle)));
  }, [etat.memoire, heure]);

  /* LE FANTÔME DU BAS : la pièce du moment, celle que l'heure met devant. */
  const [vuGeste, setVuGeste] = useState(demandeGeste);
  if (demandeGeste !== vuGeste) {
    setVuGeste(demandeGeste);
    if (demandeGeste > 0) setVue({ ou: "piece", cle: etats[0].piece.cle });
  }

  if (vue.ou === "piece") {
    const e = etats.find((x) => x.piece.cle === vue.cle) ?? etatDe(etat.memoire, pieceParCle(vue.cle));
    return (
      <div className="mz" key={`piece-${vue.cle}`}>
        <VuePiece e={e} gardees={gardees} onRetour={() => setVue({ ou: "entree" })} onDecouvrir={onDecouvrir} onVoirGardee={onVoirGardee} />
        <StylesMaMaison />
      </div>
    );
  }
  if (vue.ou === "reglages") {
    return (
      <div className="mz" key="reglages">
        <VueReglages
          reelle={reelle}
          etats={etats}
          look={look}
          compte={etat.compte}
          serveur={etat.serveur}
          onRetour={() => setVue({ ou: "entree" })}
          onCompte={() => setVue({ ou: "compte" })}
        >
          {reglagesEnPlus}
        </VueReglages>
        <StylesMaMaison />
      </div>
    );
  }
  if (vue.ou === "compte") {
    return (
      <div className="mz" key="compte">
        <VueCompte onRetour={() => setVue({ ou: "entree" })} />
        <StylesMaMaison />
      </div>
    );
  }

  const allumees = etats.filter((e) => e.allumee).length;
  const mot = motDuFantome(etats);
  /* « EMPORTEZ VOTRE MAISON AVEC VOUS » — seulement quand il y a quelque chose
     à emporter, dans la vraie ville, et tant que l'adresse n'est pas prouvée. */
  const proposerCompte = reelle && etat.serveur === "pret" && allumees > 0 && !etat.compte?.verifie;
  const etatDeLaCle = (cle: ClePiece) => etats.find((e) => e.piece.cle === cle) ?? etatDe(etat.memoire, pieceParCle(cle));
  const ouvrir = (cle: ClePiece) => () => setVue({ ou: "piece", cle });

  return (
    <div className="mz" key="entree">
      {/* LA MAQUETTE : un titre, une phrase, la roue des réglages. */}
      <header className="mz-tete">
        <div>
          <h1>Ma Maison</h1>
          <p>Ajoutez ce qui vous ressemble. ClikMe cherche en ville ce qui vous correspond.</p>
        </div>
        <button type="button" className="mz-roue" onClick={() => setVue({ ou: "reglages" })} aria-label="Réglages de ma Maison">
          <Dessin d={DESSINS.roue} />
        </button>
      </header>

      {/* UNE SEULE INTERVENTION DU FANTÔME. LE JOUR OÙ IL REVIENT DE LA VILLE
          AVEC QUELQUE CHOSE, c'est l'enveloppe qui prend sa place. */}
      {surprises && surprises.aOuvrir > 0 ? (
        <CourrierDuFantome n={surprises.aOuvrir} onOuvrir={() => surprises.onOuvrir(false)} />
      ) : (
        <section className="mz-scene">
          <FantomeAnime humeur={allumees ? "excited" : "idle"} taille={76} />
          <div className="mz-dit">
            <b className="mz-bulle">{mot.titre}</b>
            <span>Choisissez une pièce pour que je cherche pour vous.</span>
          </div>
        </section>
      )}
      {surprises && !surprises.aOuvrir && surprises.duJour > 0 && <RevoirLesSurprises n={surprises.duJour} onRevoir={() => surprises.onOuvrir(true)} />}

      <button type="button" className="mz-connait" onClick={() => setVue({ ou: "reglages" })}>
        <Dessin d={DESSINS.maison} plein />
        <span>
          {allumees ? (
            <>
              <b>
                {allumees} {allumees > 1 ? "pièces" : "pièce"}
              </b>{" "}
              {allumees > 1 ? "commencent" : "commence"} à vous connaître
            </>
          ) : (
            <>Vos pièces attendent de vous connaître</>
          )}
        </span>
        <Dessin d={DESSINS.chevron} />
      </button>

      {proposerCompte && (
        <button type="button" className="mz-garder" onClick={() => setVue({ ou: "compte" })}>
          <i aria-hidden="true">📱</i>
          <span>
            <b>Emportez votre Maison avec vous</b>
            <em>Retrouvez-la sur un autre téléphone, avec votre adresse e-mail.</em>
          </span>
          <s aria-hidden="true">›</s>
        </button>
      )}

      <div className="mz-grille">
        {PRINCIPALES.map((cle) => (
          <CartePiece key={cle} e={etatDeLaCle(cle)} onOuvrir={ouvrir(cle)} />
        ))}
      </div>
      <p className="mz-suite" aria-hidden="true">
        <Dessin d={DESSINS.bas} /> Faites défiler pour voir la suite
      </p>

      <h2 className="mz-h2">Les autres pièces</h2>
      <p className="mz-h2-sous">D&apos;autres espaces pour vous aider au quotidien.</p>
      <div className="mz-liste">
        {AUTRES.map((cle) => (
          <CartePiece key={cle} e={etatDeLaCle(cle)} large onOuvrir={ouvrir(cle)} />
        ))}
      </div>

      <section className="mz-privee">
        <FantomeAnime humeur="quiet" taille={84} />
        <div>
          <b>Votre Maison est privée</b>
          <span>Vos commerçants ne voient pas vos données personnelles.</span>
          <button type="button" onClick={() => setVue({ ou: "reglages" })}>
            <Dessin d={DESSINS.roue} />
            <span>Gérer mes pièces</span>
            <Dessin d={DESSINS.chevron} />
          </button>
        </div>
      </section>
      <StylesMaMaison />
    </div>
  );
}

// ─── L'ENTRÉE : UNE CARTE PAR PIÈCE ────────────────────────────────────────

/** Les quatre pièces de la grille, puis « Les autres pièces », en grandes cartes. */
const PRINCIPALES: ClePiece[] = ["dressing", "miroir", "cuisine", "sorties"];
const AUTRES: ClePiece[] = ["interieur", "librairie", "bienetre"];

/** LES PICTOGRAMMES DE LA MAQUETTE — des traits, pas des emojis : ils prennent la couleur de la pièce. */
const DESSINS = {
  dressing: "M12 7.6a2.3 2.3 0 1 1 2.3-2.3c0 1.2-1 1.7-1.7 2.1-.4.2-.6.6-.6 1V9M12 9 3.4 15.4c-.9.7-.4 2.1.7 2.1h15.8c1.1 0 1.6-1.4.7-2.1L12 9z",
  miroir: "M12 19.5c-2.6-1.6-4-4.1-4-6.9 0-2.9 1.5-5.5 4-7.3 2.5 1.8 4 4.4 4 7.3 0 2.8-1.4 5.3-4 6.9zM8.4 10.3C6.7 9.6 4.8 9.5 3 9.9c0 4.9 4 9.6 9 9.6s9-4.7 9-9.6c-1.8-.4-3.7-.3-5.4.4",
  cuisine: "M7 3v7.5M4.5 3v5.2a2.5 2.5 0 0 0 5 0V3M7 10.7V21M17.5 21V3c-2.2 1.3-3.4 4-3.4 7.4v3.1h3.4",
  sorties: "M4.5 4h15L12 12.5 4.5 4zM12 12.5V20M8 20.5h8M7.5 7.4h9M16 4l2.4-2.2",
  interieur: "M5.5 11.5V8.4A3.4 3.4 0 0 1 8.9 5h6.2a3.4 3.4 0 0 1 3.4 3.4v3.1M3 13.6a2.1 2.1 0 1 1 4.2 0V15h9.6v-1.4a2.1 2.1 0 1 1 4.2 0v3.9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3.9zM6 19.5V21M18 19.5V21",
  librairie: "M12 6.6C10.1 5.1 7.5 4.5 3.5 4.5v13.4c4 0 6.6.6 8.5 2.1 1.9-1.5 4.5-2.1 8.5-2.1V4.5c-4 0-6.6.6-8.5 2.1zM12 6.6V20",
  bienetre: "M12 19.5c-2.6-1.6-4-4.1-4-6.9 0-2.9 1.5-5.5 4-7.3 2.5 1.8 4 4.4 4 7.3 0 2.8-1.4 5.3-4 6.9zM8.4 10.3C6.7 9.6 4.8 9.5 3 9.9c0 4.9 4 9.6 9 9.6s9-4.7 9-9.6c-1.8-.4-3.7-.3-5.4.4",
  roue: "M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM19.4 13.5l1.6 1.2-2 3.4-1.9-.7a7.6 7.6 0 0 1-2.1 1.2l-.3 2h-4l-.3-2a7.6 7.6 0 0 1-2.1-1.2l-1.9.7-2-3.4 1.6-1.2a7.4 7.4 0 0 1 0-3l-1.6-1.2 2-3.4 1.9.7a7.6 7.6 0 0 1 2.1-1.2l.3-2h4l.3 2a7.6 7.6 0 0 1 2.1 1.2l1.9-.7 2 3.4-1.6 1.2a7.4 7.4 0 0 1 0 3z",
  maison: "M3.5 11 12 4l8.5 7v8.5a1 1 0 0 1-1 1h-5v-5.5h-5v5.5h-5a1 1 0 0 1-1-1V11z",
  fleche: "M5 12h14M13 6l6 6-6 6",
  chevron: "M9.5 6l6 6-6 6",
  bas: "M6 9.5l6 6 6-6",
} as const;

function Dessin({ d, plein = false }: { d: string; plein?: boolean }) {
  return (
    <svg className="mz-dessin" viewBox="0 0 24 24" aria-hidden="true" fill={plein ? "currentColor" : "none"} stroke={plein ? "none" : "currentColor"}>
      <path d={d} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * UNE PIÈCE, CE QU'ELLE FAIT POUR VOUS — sa photo, son pictogramme dans un
 * anneau de sa couleur, sa phrase, son étiquette et la flèche. `large` : les
 * « autres pièces », en travers. Ce qu'elle sait de vous est dedans (et dans
 * « N pièces commencent à vous connaître ») ; une pièce en pause le dit.
 */
function CartePiece({ e, large, onOuvrir }: { e: EtatPiece; large?: boolean; onOuvrir: () => void }) {
  const etatCarte = e.enPause ? "pause" : e.allumee ? "on" : "dort";
  const p = e.piece;
  return (
    <button
      type="button"
      className={`mz-carte ${etatCarte}${large ? " large" : ""}`}
      style={{ "--t": p.teinte } as CSSProperties}
      onClick={onOuvrir}
      aria-label={`${p.nom} — ${p.promesse}${e.enPause ? " (en pause)" : ""}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.photo} alt="" loading={large ? "lazy" : "eager"} />
      <i className="mz-anneau">
        <Dessin d={DESSINS[p.cle]} />
      </i>
      {e.enPause && <span className="mz-badge">💤 En pause</span>}
      <span className="mz-carte-t">
        <b>{p.nom}</b>
        <em>{p.promesse}</em>
        <span className="mz-carte-bas">
          <s className="mz-etiquette">{p.etiquette}</s>
          <u className="mz-fleche">
            <Dessin d={DESSINS.fleche} />
          </u>
        </span>
      </span>
    </button>
  );
}

// ─── UNE PIÈCE ─────────────────────────────────────────────────────────────

/**
 * EN HAUT, CE QUE LA PIÈCE FAIT POUR VOUS — dit par le Fantôme, sur la photo
 * de la pièce. Dessous, ce qu'elle sait de vous, en trois parts qui ne se
 * mélangent jamais : ce que vous m'avez dit, ce que j'ai remarqué, ce que je
 * crois. Mettre en pause et vider restent au pied de la page, discrets.
 */
function VuePiece({
  e,
  gardees,
  onRetour,
  onDecouvrir,
  onVoirGardee,
}: {
  e: EtatPiece;
  gardees: PieceGardee[];
  onRetour: () => void;
  onDecouvrir: (branche: string) => void;
  onVoirGardee?: (p: PieceGardee) => void;
}) {
  const [vider, setVider] = useState(false);
  const p = e.piece;
  const choix = p.choix;
  const coches = new Set(e.dit);
  const gardeeDe = (s: Signal) => (s.id.startsWith("garde|") ? gardees.find((g) => `garde|${g.carte}|${g.piece}` === s.id) : undefined);
  /* LA MISSION DU FANTÔME — ce qu'il va faire après qu'on a nourri la Maison. */
  const dit = e.enPause
    ? "Je fais une pause ici : je n’apprends rien et ne propose rien. Réveillez-moi quand vous voulez."
    : e.allumee
      ? p.mission.active
      : p.mission.vide;
  return (
    <>
      <header className="mz-piece-h">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.photo} alt="" />
        <button type="button" className="mz-retour" onClick={onRetour} aria-label="Revenir à ma Maison">
          ←
        </button>
        <span className="mz-piece-t">
          <b>
            <i aria-hidden="true">{p.icone}</i> {p.nom}
          </b>
          <em>{p.sous}</em>
        </span>
      </header>

      <div className="mz-piece-dit">
        <FantomeAnime humeur={e.enPause ? "sleeping" : e.allumee ? "leaving" : "curious"} taille={78} />
        <p>{dit}</p>
      </div>

      <div className="mz-corps">
        {e.enPause ? (
          <button type="button" className="mz-cta large" onClick={() => mettreEnPause(p.cle, false)}>
            Me réveiller
          </button>
        ) : !e.allumee ? (
          <button type="button" className="mz-cta large" onClick={() => onDecouvrir(p.branche)}>
            Découvrir dans la ville →
          </button>
        ) : null}

        <h2 className="mz-sait">
          Ce que je sais de vous
          <small>Vous gardez la main : corrigez ce qui ne vous ressemble pas.</small>
        </h2>

        <section className="mz-bloc">
          <h3>
            <i aria-hidden="true">💬</i> Ce que vous m’avez dit
          </h3>
          {choix && (
            <>
              <p className="mz-question">{choix.titre}</p>
              <div className="mz-puces">
                {choix.options.map((o) => {
                  const on = coches.has(o.cle);
                  return (
                    <button
                      key={o.cle}
                      type="button"
                      className={`mz-puce${on ? " on" : ""}`}
                      aria-pressed={on}
                      onClick={() => choisirDansLaPiece(p.cle, on ? e.dit.filter((x) => x !== o.cle) : [...e.dit, o.cle])}
                    >
                      {on ? "✓ " : ""}
                      {o.mot}
                    </button>
                  );
                })}
              </div>
            </>
          )}
          {p.bientot && <p className="mz-note bientot">{p.bientot}</p>}
        </section>

        <section className="mz-bloc">
          <h3>
            <i aria-hidden="true">👀</i> Ce que j’ai remarqué
            {e.remarque.length > 0 && <small>{e.remarque.length}</small>}
          </h3>
          {e.remarque.length ? (
            <ul className="mz-gestes">
              {e.remarque.slice(0, 12).map((s) => {
                const g = gardeeDe(s);
                const contenu = (
                  <>
                    {s.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.image} alt="" loading="lazy" />
                    ) : (
                      <i aria-hidden="true">{p.icone}</i>
                    )}
                    <b>{s.quoi}</b>
                    <em>{s.d}</em>
                  </>
                );
                return (
                  <li key={s.id}>
                    {g && onVoirGardee ? (
                      <button type="button" onClick={() => onVoirGardee(g)}>
                        {contenu}
                      </button>
                    ) : (
                      <div>{contenu}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mz-note">{p.remplit}</p>
          )}
        </section>

        <section className="mz-bloc">
          <h3>
            <i aria-hidden="true">💡</i> Ce que je crois
          </h3>
          {e.crois.length ? (
            <ul className="mz-crois">
              {e.crois.map((g) => (
                <li key={g.trait}>
                  <span>
                    <b>Vous aimez {g.mot}</b>
                    <em>
                      {g.pour} gestes sur {g.sur} vont dans ce sens
                    </em>
                  </span>
                  <button type="button" onClick={() => refuserLeTrait(p.cle, g.trait)}>
                    Ce n’est pas moi
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mz-note">Rien encore : il me faut au moins trois gestes dans le même sens avant de croire quoi que ce soit.</p>
          )}
        </section>

        <div className="mz-discret">
          {!e.enPause && (
            <button type="button" onClick={() => mettreEnPause(p.cle, true)}>
              Faire une pause ici
            </button>
          )}
          {vider ? (
            <span className="mz-sur">
              Tout ce que je sais de vous ici sera oublié.
              <button
                type="button"
                className="mz-cta danger"
                onClick={() => {
                  viderLaPiece(p.cle);
                  setVider(false);
                }}
              >
                Vider
              </button>
              <button type="button" className="mz-cta creux" onClick={() => setVider(false)}>
                Garder
              </button>
            </span>
          ) : (
            <button type="button" onClick={() => setVider(true)}>
              Tout oublier ici
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ─── LES RÉGLAGES ──────────────────────────────────────────────────────────

function VueReglages({
  reelle,
  etats,
  look,
  compte,
  serveur,
  onRetour,
  onCompte,
  children,
}: {
  reelle: boolean;
  etats: EtatPiece[];
  look: { image: string; nom: string };
  compte: { email: string | null; verifie: boolean } | null;
  serveur: "attente" | "pret" | "absent";
  onRetour: () => void;
  onCompte: () => void;
  children?: ReactNode;
}) {
  const [effacer, setEffacer] = useState<"non" | "sur" | "fait" | "rate">("non");
  return (
    <>
      <div className="mz-page-h">
        <button type="button" className="mz-retour plat" onClick={onRetour}>
          ← Ma Maison
        </button>
        <b>Réglages</b>
      </div>
      <div className="mz-corps">
        <section className="mz-bloc">
          <h3>🔒 Votre Maison est privée</h3>
          <p className="mz-note">
            {reelle
              ? serveur === "absent"
                ? "Elle vit pour l’instant sur ce téléphone : le serveur qui doit la garder n’est pas encore prêt."
                : "Elle est gardée par ClikMe, pour vous seul. Aucun commerçant, aucun autre habitant ne peut la voir."
              : "Dans la démonstration, elle reste sur ce téléphone."}
          </p>
        </section>

        {reelle && serveur !== "absent" && (
          <section className="mz-bloc">
            <h3>Votre Maison sur un autre téléphone</h3>
            {compte?.verifie && compte.email ? (
              <p className="mz-note">
                Elle vous suit sur tous vos téléphones avec <b>{compte.email}</b>.
              </p>
            ) : (
              <>
                <p className="mz-note">Votre adresse e-mail et un code à six chiffres : la même Maison, où que vous soyez.</p>
                <button type="button" className="mz-cta" onClick={onCompte}>
                  Emporter ma Maison
                </button>
              </>
            )}
          </section>
        )}

        <section className="mz-bloc">
          <h3>Mon fantôme</h3>
          <div className="mz-look">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={look.image} alt="" />
            <span>
              <b>{look.nom}</b>
              <em>C’est lui qui vous représente dans les salons.</em>
            </span>
            <button type="button" className="mz-cta creux" onClick={changerDeLook}>
              Changer
            </button>
          </div>
        </section>

        <section className="mz-bloc">
          <h3>Ce que ClikMe apprend</h3>
          <ul className="mz-pieces">
            {etats.map((e) => (
              <li key={e.piece.cle}>
                <span>
                  <i aria-hidden="true">{e.piece.icone}</i>
                  {e.piece.nom}
                </span>
                <button type="button" className={`mz-bascule${e.enPause ? "" : " on"}`} aria-pressed={!e.enPause} onClick={() => mettreEnPause(e.piece.cle, !e.enPause)}>
                  {e.enPause ? "En pause" : "Active"}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="mz-bloc">
          <h3>Tout effacer</h3>
          {effacer === "fait" ? (
            <p className="mz-note">C’est fait : votre Maison est vide, ses photos et ce qu’elle savait sont effacés.</p>
          ) : effacer === "rate" ? (
            <p className="mz-note">Je n’ai pas pu joindre le serveur. Réessayez dans un instant.</p>
          ) : effacer === "sur" ? (
            <span className="mz-sur">
              Ce que vous m’avez dit, ce que j’ai remarqué, vos photos : tout part, pour de bon.
              <button
                type="button"
                className="mz-cta danger"
                onClick={() => void effacerToutLaMaison().then((ok) => setEffacer(ok ? "fait" : "rate"))}
              >
                Tout effacer
              </button>
              <button type="button" className="mz-cta creux" onClick={() => setEffacer("non")}>
                Garder
              </button>
            </span>
          ) : (
            <button type="button" className="mz-cta creux danger-t" onClick={() => setEffacer("sur")}>
              Effacer toute ma Maison
            </button>
          )}
        </section>

        {children}
      </div>
    </>
  );
}

// ─── L'ADRESSE ET LE CODE ──────────────────────────────────────────────────

function VueCompte({ onRetour }: { onRetour: () => void }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [etape, setEtape] = useState<"adresse" | "code" | "fait">("adresse");
  const [erreur, setErreur] = useState("");
  const [occupe, setOccupe] = useState(false);

  async function envoyer() {
    setOccupe(true);
    setErreur("");
    const r = await demanderLeCode(email.trim());
    setOccupe(false);
    if ("erreur" in r) setErreur(r.erreur);
    else setEtape("code");
  }
  async function valider() {
    setOccupe(true);
    setErreur("");
    const r = await donnerLeCode(email.trim(), code);
    setOccupe(false);
    if ("erreur" in r) setErreur(r.erreur);
    else setEtape("fait");
  }

  return (
    <>
      <div className="mz-page-h">
        <button type="button" className="mz-retour plat" onClick={onRetour}>
          ← Ma Maison
        </button>
      </div>
      <div className="mz-corps mz-compte">
        <FantomeAnime humeur={etape === "fait" ? "celebrate" : etape === "code" ? "whisper" : "idle"} taille={96} />
        {etape === "fait" ? (
          <>
            <h2>C’est fait</h2>
            <p>Votre Maison vous suit maintenant sur tous vos téléphones. Ce code ne vous abonne à rien.</p>
            <button type="button" className="mz-cta" onClick={onRetour}>
              Revenir à ma Maison
            </button>
          </>
        ) : etape === "code" ? (
          <form
            onSubmit={(ev) => {
              ev.preventDefault();
              if (code.length === 6 && !occupe) void valider();
            }}
          >
            <h2>Le code</h2>
            <p>
              Je viens de l’envoyer à <b>{email.trim()}</b>. Il est valable dix minutes.
            </p>
            <input
              className="mz-champ mz-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="••••••"
              aria-label="Code à six chiffres"
              value={code}
              onChange={(ev) => setCode(ev.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            {erreur && <p className="mz-erreur">{erreur}</p>}
            <button type="submit" className="mz-cta" disabled={code.length !== 6 || occupe}>
              {occupe ? "Un instant…" : "Valider"}
            </button>
            <button
              type="button"
              className="mz-lien"
              onClick={() => {
                setCode("");
                setErreur("");
                setEtape("adresse");
              }}
            >
              Changer d’adresse ou renvoyer un code
            </button>
          </form>
        ) : (
          <form
            onSubmit={(ev) => {
              ev.preventDefault();
              if (!occupe) void envoyer();
            }}
          >
            <h2>Emportez votre Maison avec vous</h2>
            <p>Retrouvez-la sur un autre téléphone. Votre adresse e-mail : je vous envoie un code à six chiffres.</p>
            <input
              className="mz-champ"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="vous@exemple.fr"
              aria-label="Adresse e-mail"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
            />
            {erreur && <p className="mz-erreur">{erreur}</p>}
            <button type="submit" className="mz-cta" disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()) || occupe}>
              {occupe ? "Un instant…" : "Recevoir mon code"}
            </button>
            <p className="mz-note">Aucun mot de passe. Aucun abonnement. Votre adresse ne sert qu’à retrouver votre Maison.</p>
          </form>
        )}
      </div>
    </>
  );
}

// ─── LE STYLE ──────────────────────────────────────────────────────────────

function StylesMaMaison() {
  return (
    <>
      <StylesFantome />
      <style
      dangerouslySetInnerHTML={{
        __html: `
/* ELLE DÉFILE ELLE-MÊME : la page de l'onglet ne défile pas (l'application est posée en position fixe). */
.mz{position:relative;height:100%;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:0 0 calc(110px + env(safe-area-inset-bottom));color:#FFF4E6;
  background:radial-gradient(120% 34% at 50% 0%,rgba(255,170,90,.07),transparent 70%),#170F0B;}
:where(.mz) button{font:inherit;color:inherit;}

/* ── L'ENTRÉE, D'APRÈS LA MAQUETTE : de l'air, des photos claires, une couleur par pièce ── */
.mz-dessin{display:block;width:100%;height:100%;}
.mz-tete{position:relative;padding:calc(20px + env(safe-area-inset-top)) 16px 0;}
.mz-tete h1{margin:0;padding-right:56px;font-size:32px;line-height:1.02;font-weight:900;letter-spacing:-.02em;color:#fff;}
.mz-tete p{margin:6px 0 0;max-width:330px;font-size:13.5px;line-height:1.38;color:#C4B9B3;}
.mz-roue{position:absolute;top:calc(16px + env(safe-area-inset-top));right:16px;display:grid;place-items:center;width:44px;height:44px;padding:10px;border-radius:50%;cursor:pointer;
  color:#fff;background:rgba(255,255,255,.04);border:1px solid rgba(255,240,230,.16);}
.mz-scene{display:flex;align-items:center;gap:2px;margin:16px 16px 0;padding:8px 8px 10px 2px;border-radius:22px;
  background:#1F150F;border:1px solid rgba(255,235,215,.08);}
.mz-scene .fa{flex:none;}
.mz-dit{flex:1;min-width:0;}
.mz-bulle{position:relative;display:inline-block;padding:8px 9px;border-radius:20px;font-size:12.5px;letter-spacing:-.005em;line-height:1.25;font-weight:800;color:#fff;
  background:rgba(255,255,255,.03);border:1.5px solid rgba(255,240,230,.5);}
.mz-bulle::after{content:"";position:absolute;left:14px;bottom:-7px;width:12px;height:12px;background:#221811;
  border-right:1.5px solid rgba(255,240,230,.5);border-bottom:1.5px solid rgba(255,240,230,.5);transform:skewX(-28deg) rotate(45deg);}
.mz-dit>span{display:block;margin:10px 0 0 2px;font-size:13px;line-height:1.4;color:#B3A59D;}
.mz-connait{display:flex;align-items:center;gap:8px;width:calc(100% - 32px);margin:10px 16px 0;padding:10px 12px;border-radius:999px;cursor:pointer;text-align:left;
  font-size:12.5px;white-space:nowrap;color:#fff;background:#1F160F;border:1px solid rgba(255,235,215,.14);}
.mz-connait>.mz-dessin:first-child{flex:none;width:18px;height:18px;color:#F2A65A;}
.mz-connait>span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;}
.mz-connait b{font-weight:800;color:#F2A65A;}
.mz-connait>.mz-dessin:last-child{flex:none;width:16px;height:16px;color:#E9DED6;}
.mz-garder{display:flex;align-items:center;gap:12px;width:calc(100% - 32px);margin:10px 16px 0;padding:11px 14px;text-align:left;border-radius:16px;cursor:pointer;
  background:rgba(255,236,210,.05);border:1px solid rgba(246,181,75,.4);}
.mz-garder>i{font-style:normal;font-size:20px;}
.mz-garder span{flex:1;min-width:0;}
.mz-garder b{display:block;font-size:14px;}
.mz-garder em{display:block;margin-top:2px;font-style:normal;font-size:12.5px;color:#E9D3B6;}
.mz-garder s{text-decoration:none;font-size:22px;color:#F6B54B;}

/* LES PIÈCES : la photo, l'anneau de sa couleur, sa phrase, son étiquette, la flèche. */
.mz-grille{display:grid;grid-template-columns:1fr 1fr;gap:11px;margin:14px 16px 0;}
.mz-carte{position:relative;display:flex;flex-direction:column;justify-content:flex-end;width:100%;aspect-ratio:.88;padding:62px 11px 11px;text-align:left;border-radius:22px;overflow:hidden;cursor:pointer;isolation:isolate;
  background:#1F150F;border:1px solid rgba(255,235,215,.1);box-shadow:0 14px 30px -18px rgba(0,0,0,.7);}
/* Les photos actuelles sont plus sombres que celles de la maquette : on les éclaire. */
.mz-carte img{position:absolute;inset:0;z-index:-2;width:100%;height:100%;object-fit:cover;object-position:50% 38%;filter:brightness(1.38) saturate(1.06);transition:filter .3s,transform .6s;}
.mz-carte::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(24,15,10,0) 22%,rgba(24,15,10,.5) 46%,rgba(26,17,11,.93) 68%,#1D140E 100%);}
.mz-carte:active img{transform:scale(1.03);}
.mz-carte.pause img{filter:grayscale(.65) brightness(.75);}
.mz-anneau{position:absolute;top:10px;left:10px;display:grid;place-items:center;width:44px;height:44px;padding:9px;border-radius:50%;
  color:var(--t);border:2.5px solid var(--t);background:rgba(28,17,11,.55);backdrop-filter:blur(2px);}
.mz-badge{position:absolute;top:12px;right:12px;padding:5px 10px;border-radius:999px;font-size:12px;font-weight:800;color:#F3E6DB;background:rgba(20,12,8,.72);border:1px solid rgba(255,236,210,.25);}
.mz-carte-t{display:block;}
.mz-carte-t b{display:block;font-size:16.5px;line-height:1.1;font-weight:800;letter-spacing:-.01em;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mz-carte-t em{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;margin-top:4px;font-style:normal;font-size:12px;line-height:1.3;color:#D2C9C1;}
.mz-carte-bas{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px;}
.mz-etiquette{padding:4px 13px;border-radius:999px;font-size:12px;font-weight:800;text-decoration:none;color:#22140B;background:var(--t);}
.mz-fleche{flex:none;display:grid;place-items:center;width:30px;height:30px;padding:6.5px;border-radius:50%;text-decoration:none;color:#fff;background:rgba(20,12,8,.45);border:1px solid rgba(255,240,230,.3);}
/* En travers : le texte à gauche, la photo qui s'ouvre à droite. */
.mz-liste{display:grid;gap:12px;margin:14px 16px 0;}
.mz-carte.large{aspect-ratio:auto;min-height:168px;padding:70px 16px 13px;justify-content:flex-end;}
.mz-carte.large::after{background:linear-gradient(90deg,rgba(26,17,11,.95) 0%,rgba(26,17,11,.78) 36%,rgba(26,17,11,.12) 72%,rgba(26,17,11,0) 100%);}
.mz-carte.large img{object-position:60% 50%;}
.mz-carte.large .mz-anneau{top:12px;left:14px;width:48px;height:48px;padding:10px;}
.mz-carte.large .mz-carte-t{max-width:60%;}
.mz-carte.large .mz-carte-t b{font-size:18.5px;}
.mz-carte.large .mz-carte-t em{-webkit-line-clamp:3;font-size:12.5px;}
.mz-carte.large .mz-fleche{position:absolute;right:14px;bottom:14px;}
.mz-suite{display:flex;align-items:center;justify-content:center;gap:8px;margin:16px 16px 0;font-size:13px;color:#A99B92;}
.mz-suite::before,.mz-suite::after{content:"";flex:1;max-width:60px;height:1px;background:rgba(255,235,215,.12);}
.mz-suite .mz-dessin{width:16px;height:16px;}
.mz-h2{margin:26px 16px 0;font-size:27px;line-height:1.05;font-weight:900;letter-spacing:-.02em;color:#fff;}
.mz-h2-sous{margin:6px 16px 0;font-size:13.5px;color:#B9ADA6;}
/* LA MAISON EST PRIVÉE — et c'est d'ici qu'on gère ses pièces. */
.mz-privee{display:flex;align-items:center;gap:8px;margin:14px 16px 0;padding:12px 14px 12px 4px;border-radius:22px;background:#1F150F;border:1px solid rgba(255,235,215,.08);}
.mz-privee .fa{flex:none;}
.mz-privee>div{flex:1;min-width:0;}
.mz-privee b{display:block;font-size:16px;font-weight:800;color:#fff;}
.mz-privee>div>span{display:block;margin-top:3px;font-size:13px;line-height:1.38;color:#B9ADA6;}
.mz-privee button{display:flex;align-items:center;gap:10px;width:100%;margin-top:10px;padding:9px 12px;border-radius:999px;cursor:pointer;text-align:left;font-size:14px;
  background:rgba(255,255,255,.02);border:1px solid rgba(255,240,230,.18);}
.mz-privee button>.mz-dessin{flex:none;width:18px;height:18px;}
.mz-privee button>span{flex:1;}

/* ── UNE PIÈCE : le bénéfice d'abord ── */
.mz-piece-h{position:relative;height:300px;overflow:hidden;}
.mz-piece-h img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 45%;}
.mz-piece-h::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,13,8,.25),rgba(20,13,8,0) 30%,rgba(20,13,8,.5) 70%,#140D08 100%);}
.mz-retour{position:absolute;z-index:2;top:calc(12px + env(safe-area-inset-top));left:14px;display:grid;place-items:center;width:40px;height:40px;padding:0;border-radius:50%;
  border:1px solid rgba(255,236,210,.3);background:rgba(20,13,8,.55);font-size:18px;cursor:pointer;}
.mz-retour.plat{position:static;width:auto;height:auto;padding:8px 12px;border-radius:12px;font-size:14px;}
.mz-piece-t{position:absolute;z-index:2;left:18px;right:18px;bottom:16px;}
.mz-piece-t b{display:block;font-size:28px;font-weight:900;line-height:1.05;}
.mz-piece-t b i{font-style:normal;}
.mz-piece-t em{display:block;margin-top:4px;font-style:normal;font-size:13.5px;color:#E9D3B6;}
.mz-piece-dit{position:relative;display:flex;align-items:flex-end;gap:8px;margin:-6px 16px 0;}
.mz-piece-dit .fa{flex:none;}
.mz-piece-dit p{flex:1;min-width:0;margin:0 0 14px;padding:12px 14px;border-radius:16px 16px 16px 4px;background:#FFF1DC;color:#3a240f;font-size:14.5px;line-height:1.4;font-weight:600;
  box-shadow:0 10px 26px -12px rgba(0,0,0,.6);}
.mz-page-h{display:flex;align-items:center;gap:12px;padding:calc(14px + env(safe-area-inset-top)) 14px 4px;}
.mz-page-h b{font-size:20px;}
.mz-corps{padding:6px 16px 0;}
.mz-sait{margin:22px 2px 0;font-size:19px;font-weight:900;}
.mz-sait small{display:block;margin-top:3px;font-size:12.5px;font-weight:500;color:#BFA88C;}
.mz-bloc{margin-top:12px;padding:14px;border-radius:18px;background:rgba(255,236,210,.04);border:1px solid rgba(255,236,210,.1);}
.mz-bloc h3{display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 8px;margin:0 0 10px;font-size:15.5px;}
.mz-bloc h3 i{font-style:normal;}
.mz-bloc h3 small{margin-left:auto;font-size:12px;font-weight:700;color:#BFA88C;}
.mz-question{margin:0 0 8px;font-size:13px;font-weight:700;color:#FFD58A;}
.mz-puces{display:flex;flex-wrap:wrap;gap:8px;}
.mz-puce{padding:8px 13px;border-radius:999px;border:1.5px solid rgba(255,236,210,.22);background:rgba(255,236,210,.04);font-size:13.5px;cursor:pointer;}
.mz-puce.on{border-color:#F6B54B;background:rgba(246,181,75,.18);color:#FFD58A;font-weight:700;}
/* Ce que j'ai remarqué : des vignettes qu'on fait défiler, pas une liste de base de données. */
.mz-gestes{display:flex;gap:10px;margin:0 -14px;padding:0 14px 4px;list-style:none;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;}
.mz-gestes::-webkit-scrollbar{display:none;}
.mz-gestes li{flex:none;width:128px;scroll-snap-align:start;}
.mz-gestes li>*{display:flex;flex-direction:column;align-items:stretch;gap:6px;width:100%;padding:0;text-align:left;border:0;background:transparent;}
.mz-gestes button{cursor:pointer;}
.mz-gestes img,.mz-gestes li i{display:grid;place-items:center;width:128px;height:128px;border-radius:16px;object-fit:cover;background:#2a1a0f;font-style:normal;font-size:34px;
  border:1px solid rgba(255,236,210,.12);}
.mz-gestes b{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:13px;line-height:1.25;}
.mz-gestes em{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-style:normal;font-size:11.5px;line-height:1.3;color:#BFA88C;}
.mz-crois{display:flex;flex-direction:column;gap:8px;margin:0;padding:0;list-style:none;}
.mz-crois li{display:flex;align-items:center;gap:10px;padding:12px;border-radius:14px;background:linear-gradient(135deg,rgba(246,181,75,.16),rgba(246,181,75,.06));border:1px solid rgba(246,181,75,.3);}
.mz-crois span{flex:1;min-width:0;}
.mz-crois b{display:block;font-size:14.5px;}
.mz-crois em{display:block;margin-top:2px;font-style:normal;font-size:12px;color:#E9D3B6;}
.mz-crois button{flex:none;padding:8px 11px;border-radius:10px;border:1px solid rgba(255,236,210,.3);background:rgba(20,13,8,.4);font-size:12.5px;font-weight:700;cursor:pointer;}
.mz-note{margin:0;font-size:13px;line-height:1.45;color:#BFA88C;}
.mz-note b{color:#FFF4E6;}
.mz-note.bientot{margin-top:10px;padding:9px 11px;border-radius:12px;background:rgba(255,236,210,.04);border:1px dashed rgba(255,236,210,.18);}
.mz-discret{display:flex;flex-wrap:wrap;align-items:center;gap:6px 18px;margin:22px 4px 0;}
.mz-discret>button{padding:6px 0;border:0;background:transparent;font-size:12.5px;color:#BFA88C;text-decoration:underline;text-underline-offset:3px;cursor:pointer;}
.mz-cta{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 18px;border-radius:14px;border:0;cursor:pointer;
  background:linear-gradient(180deg,#FFC861,#F0A22E);color:#2a1a0f !important;font-weight:800;font-size:14.5px;}
.mz-cta.large{display:flex;width:100%;min-height:50px;margin-top:4px;font-size:15.5px;}
.mz-cta:disabled{opacity:.45;cursor:default;}
.mz-cta.creux{background:transparent;border:1.5px solid rgba(255,236,210,.28);color:#FFF4E6 !important;font-weight:700;}
.mz-cta.danger{background:#C2412D;color:#fff !important;}
.mz-cta.danger-t{border-color:rgba(232,110,90,.6);color:#FFB4A6 !important;}
.mz-sur{display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-size:13px;color:#FFD2C8;}

/* ── LES RÉGLAGES (derrière la roue dentée) ── */
.mz-look{display:flex;align-items:center;gap:12px;}
.mz-look img{flex:none;width:52px;height:52px;border-radius:50%;object-fit:cover;object-position:50% 12%;background:#2a1a0f;border:1.5px solid rgba(246,181,75,.6);}
.mz-look span{flex:1;min-width:0;}
.mz-look b{display:block;font-size:14.5px;}
.mz-look em{display:block;margin-top:2px;font-style:normal;font-size:12px;color:#BFA88C;}
.mz-pieces{display:flex;flex-direction:column;gap:6px;margin:0;padding:0;list-style:none;}
.mz-pieces li{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:14px;}
.mz-pieces li span{display:flex;align-items:center;gap:8px;}
.mz-pieces li i{font-style:normal;}
.mz-bascule{min-width:86px;padding:7px 10px;border-radius:999px;border:1.5px solid rgba(255,236,210,.22);background:transparent;font-size:12.5px;cursor:pointer;}
.mz-bascule.on{border-color:rgba(120,210,150,.7);color:#A9F0C0;}

/* ── L'ADRESSE ET LE CODE ── */
.mz-compte{display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center;padding-top:10px;}
.mz-compte form{display:flex;flex-direction:column;align-items:stretch;gap:12px;width:100%;max-width:360px;}
.mz-compte h2{margin:8px 0 0;font-size:24px;font-weight:900;}
.mz-compte p{margin:0;font-size:14px;line-height:1.45;color:#E9D3B6;}
.mz-champ{width:100%;min-height:50px;padding:0 14px;border-radius:14px;border:1.5px solid rgba(255,236,210,.25);background:rgba(255,236,210,.06);color:#FFF4E6;font:inherit;font-size:16px;}
.mz-champ:focus{outline:none;border-color:#F6B54B;}
.mz-code{text-align:center;letter-spacing:.4em;font-size:26px;font-weight:800;}
.mz-erreur{color:#FFB4A6 !important;font-size:13px !important;}
.mz-lien{border:0;background:transparent;color:#F6B54B !important;font-size:13px;text-decoration:underline;cursor:pointer;}
@media (max-width:360px){.mz-connait{white-space:normal;}.mz-connait>span{overflow:visible;}}
@media (max-width:340px){.mz-tete h1{font-size:29px;}.mz-carte{aspect-ratio:auto;min-height:196px;}.mz-carte-t b{white-space:normal;}.mz-carte-t em{-webkit-line-clamp:3;}.mz-tete p{font-size:13.5px;}.mz-grille{gap:9px;}.mz-carte{padding:10px;}.mz-carte-t b{font-size:14.5px;}.mz-carte-t em{font-size:11.5px;}.mz-anneau{width:40px;height:40px;padding:8px;}.mz-etiquette{padding:4px 10px;font-size:12px;}.mz-fleche{width:28px;height:28px;padding:6px;}.mz-carte.large .mz-carte-t{max-width:70%;}.mz-piece-h{height:250px;}}
@media (prefers-reduced-motion: reduce){.mz-carte img{transition:none;}}
`,
        }}
      />
    </>
  );
}
