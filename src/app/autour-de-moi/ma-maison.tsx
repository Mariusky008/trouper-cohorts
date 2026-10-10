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
import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { FantomeAnime, StylesFantome } from "@/components/direct/fantome-anime";
import { histoireDesDuels } from "@/components/direct/duel-salon";
import { abonnerLook, monLook } from "@/lib/direct/look";
import { changerDeLook } from "./prendre-place";
import type { FamilleDouble } from "@/lib/direct/double-metiers";
import type { PieceGardee } from "@/lib/direct/pieces-gardees";
import { abonnerEnvies, AUCUNES_ENVIES, chargerEnvies } from "@/lib/direct/soiree-envies";
import {
  etatDe,
  motDuFantome,
  phraseDesPieces,
  ordreSelonLHeure,
  pieceParCle,
  PIECES,
  signauxDesDuels,
  signauxDesEnvies,
  signauxDesGardees,
  signauxDesSuivis,
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
  noterLesSignaux,
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
  suivis,
  familleDeCarte,
  nomDeSoiree,
  onDecouvrir,
  onVoirGardee,
  demandeGeste = 0,
  reglagesEnPlus,
}: {
  /** Dans une vraie ville : la Maison est gardée par le serveur et l'adresse la retrouve. */
  reelle: boolean;
  gardees: PieceGardee[];
  suivis: { id: string; nom: string; famille: FamilleDouble; photo?: string }[];
  familleDeCarte: (carte: string) => FamilleDouble | undefined;
  nomDeSoiree: (cle: string) => string | undefined;
  /** « Découvrir » depuis une pièce : le Direct, sur son métier. */
  onDecouvrir: (branche: string) => void;
  onVoirGardee?: (p: PieceGardee) => void;
  /** Le Fantôme du bas, sur cette page : il ouvre la pièce du moment. */
  demandeGeste?: number;
  /** Ce que les réglages gardent de l'application (aide, mes fantômes, installer). */
  reglagesEnPlus?: ReactNode;
}) {
  const etat = useSyncExternalStore(abonnerMaisonPrivee, chargerMaisonPrivee, maisonPriveeServeur);
  const envies = useSyncExternalStore(abonnerEnvies, chargerEnvies, () => AUCUNES_ENVIES);
  const look = useSyncExternalStore(abonnerLook, monLook, monLook);
  const heure = useSyncExternalStore(rien, heureIci, heureServeur);
  const [vue, setVue] = useState<Vue>({ ou: "entree" });

  /* CE QUE L'APPLICATION SAVAIT DÉJÀ ENTRE DANS LA MAISON — pièces mises de
     côté, duels, commerces suivis, envies de soirée. Après le rendu : l'histoire
     des duels se lit dans le téléphone. */
  useEffect(() => {
    const derives: Signal[] = [
      ...signauxDesGardees(gardees, familleDeCarte),
      ...signauxDesDuels(histoireDesDuels()),
      ...signauxDesSuivis(suivis, Date.now()),
      ...signauxDesEnvies(envies, nomDeSoiree),
    ];
    noterLesSignaux(derives);
  }, [gardees, suivis, envies, familleDeCarte, nomDeSoiree]);

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
  const [moment, ...autres] = etats;

  return (
    <div className="mz" key="entree">
      <header className="mz-tete">
        <div className="mz-tete-h">
          <h1>
            Ma <b>Maison</b>
          </h1>
          <button type="button" className="mz-moi" onClick={() => setVue({ ou: "reglages" })} aria-label="Réglages de ma Maison">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={look.image} alt="" />
            <i aria-hidden="true">⚙︎</i>
          </button>
        </div>
        <p className="mz-sous">Montrez-moi un peu de vous. Je vais chercher en ville ce qui vous ressemble.</p>
        <div className="mz-scene">
          <FantomeAnime humeur={allumees ? "excited" : "idle"} taille={112} />
          <div className="mz-bulle">
            <b>{mot.titre}</b>
            <span>{mot.texte}</span>
          </div>
        </div>
      </header>

      <div className="mz-progres" aria-label={phraseDesPieces(allumees)}>
        <span>{phraseDesPieces(allumees)}</span>
        <i aria-hidden="true">
          {PIECES.map((p, k) => (
            <s key={p.cle} className={k < allumees ? "on" : ""} />
          ))}
        </i>
      </div>

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

      {/* LA PIÈCE DU MOMENT, EN GRAND — celle que l'heure met devant. */}
      <p className="mz-moment">{momentDeLaJournee(heure)}</p>
      <CartePiece e={moment} grande onOuvrir={() => setVue({ ou: "piece", cle: moment.piece.cle })} />
      <div className="mz-grille">
        {autres.map((e) => (
          <CartePiece key={e.piece.cle} e={e} onOuvrir={() => setVue({ ou: "piece", cle: e.piece.cle })} />
        ))}
      </div>

      <p className="mz-prive">
        <i aria-hidden="true">🔒</i>
        Votre Maison est privée. Les commerçants n’en voient rien.
      </p>
      <StylesMaMaison />
    </div>
  );
}

/** Au-dessus de la pièce du moment : pourquoi elle est devant. */
function momentDeLaJournee(h: number): string {
  if (h >= 5 && h < 11) return "Ce matin";
  if (h >= 11 && h < 14) return "Ce midi";
  if (h >= 14 && h < 18) return "Cet après-midi";
  return "Ce soir";
}

// ─── L'ENTRÉE : UNE CARTE PAR PIÈCE ────────────────────────────────────────

/**
 * UNE PIÈCE, CE QU'ELLE SAIT ET CE QU'ELLE APPORTE. Endormie, elle n'est pas
 * seulement éteinte : elle dit le petit geste qui la réveille, et ce qu'il
 * débloquera (« Gardez 3 pièces → je chercherai en ville ce qui va avec »).
 */
function CartePiece({ e, grande, onOuvrir }: { e: EtatPiece; grande?: boolean; onOuvrir: () => void }) {
  const etatCarte = e.enPause ? "pause" : e.allumee ? "on" : "dort";
  return (
    <button type="button" className={`mz-carte ${etatCarte}${grande ? " grande" : ""}`} onClick={onOuvrir}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={e.piece.photo} alt="" loading={grande ? "eager" : "lazy"} />
      {etatCarte === "on" ? (
        <span className="mz-badge on" title="Apprend de vous">
          {grande ? "✨ Apprend de vous" : "✨"}
        </span>
      ) : etatCarte === "pause" ? (
        <span className="mz-badge" title="En pause">
          {grande ? "💤 En pause" : "💤"}
        </span>
      ) : null}
      <span className="mz-carte-t">
        <b>
          <i aria-hidden="true">{e.piece.icone}</i> {e.piece.nom}
        </b>
        <em>
          {e.ligne} <strong>{e.suite}</strong>
        </em>
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
  const dit = e.enPause
    ? "Je fais une pause dans cette pièce : je n’apprends rien et ne propose rien. Réveillez-la quand vous voulez."
    : e.allumee
      ? p.benefice
      : `${p.reveil.action} : ${p.reveil.gain}.`;
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
            Réveiller la pièce
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
              Mettre la pièce en pause
            </button>
          )}
          {vider ? (
            <span className="mz-sur">
              Tout ce qu’elle sait de vous sera oublié.
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
              Vider la pièce
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
          <h3>Les pièces</h3>
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
  background:radial-gradient(130% 60% at 70% 0%,rgba(255,170,70,.22),transparent 60%),radial-gradient(90% 50% at 10% 30%,rgba(255,120,60,.10),transparent 60%),#140D08;}
:where(.mz) button{font:inherit;color:inherit;}

/* ── L'ENTRÉE ── */
.mz-tete{position:relative;padding:calc(18px + env(safe-area-inset-top)) 18px 6px;overflow:hidden;}
.mz-tete::before{content:"";position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(4px 4px at 18% 22%,rgba(255,210,140,.7),transparent),radial-gradient(3px 3px at 82% 30%,rgba(255,210,140,.55),transparent),
  radial-gradient(5px 5px at 64% 12%,rgba(255,190,110,.45),transparent),radial-gradient(3px 3px at 36% 8%,rgba(255,220,160,.5),transparent);}
.mz-tete-h{display:flex;align-items:center;justify-content:space-between;gap:12px;}
.mz-tete h1{margin:0;font-size:32px;line-height:1.05;font-weight:900;letter-spacing:-.01em;}
.mz-tete h1 b{color:#F6B54B;}
.mz-moi{position:relative;flex:none;width:46px;height:46px;padding:0;border-radius:50%;border:1.5px solid rgba(246,181,75,.75);background:#2a1a0f;cursor:pointer;}
.mz-moi img{width:100%;height:100%;border-radius:50%;object-fit:cover;object-position:50% 12%;}
.mz-moi i{position:absolute;right:-4px;bottom:-4px;display:grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#F6B54B;color:#2a1a0f;font-style:normal;font-size:12px;}
.mz-sous{margin:8px 0 0;max-width:32ch;font-size:14px;line-height:1.4;color:#E9D3B6;}
.mz-scene{position:relative;display:flex;align-items:flex-end;gap:10px;margin-top:10px;min-height:118px;}
.mz-scene .fa{flex:none;margin-left:2px;}
.mz-bulle{position:relative;flex:1;min-width:0;margin-bottom:22px;padding:11px 13px;border-radius:16px 16px 16px 4px;background:#FFF1DC;color:#3a240f;box-shadow:0 10px 26px -12px rgba(0,0,0,.6);}
.mz-bulle b{display:block;font-size:14.5px;}
.mz-bulle span{display:block;margin-top:2px;font-size:13px;line-height:1.35;color:#6b4a2a;}
.mz-progres{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:2px 16px 0;padding:11px 14px;border-radius:16px;
  background:rgba(255,236,210,.05);border:1px solid rgba(246,181,75,.22);font-size:13.5px;font-weight:700;color:#FFE7C2;}
.mz-progres i{display:flex;gap:4px;flex:none;}
.mz-progres s{display:block;width:14px;height:5px;border-radius:3px;background:rgba(255,236,210,.14);}
.mz-progres s.on{background:#F6B54B;box-shadow:0 0 8px rgba(246,181,75,.6);}
.mz-garder{display:flex;align-items:center;gap:12px;width:calc(100% - 32px);margin:10px 16px 0;padding:11px 14px;text-align:left;border-radius:16px;cursor:pointer;
  background:rgba(255,236,210,.05);border:1px solid rgba(246,181,75,.4);}
.mz-garder>i{font-style:normal;font-size:20px;}
.mz-garder span{flex:1;min-width:0;}
.mz-garder b{display:block;font-size:14px;}
.mz-garder em{display:block;margin-top:2px;font-style:normal;font-size:12.5px;color:#E9D3B6;}
.mz-garder s{text-decoration:none;font-size:22px;color:#F6B54B;}
.mz-moment{margin:18px 18px 8px;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#F6B54B;}

/* LES PIÈCES — de vraies pièces, chaudes ; celle du moment en grand. */
.mz-carte{position:relative;display:flex;flex-direction:column;justify-content:flex-end;width:100%;min-height:186px;padding:14px;text-align:left;border-radius:22px;overflow:hidden;cursor:pointer;
  border:1.5px solid rgba(255,236,210,.14);background:#1d130c;isolation:isolate;}
.mz-carte.grande{width:calc(100% - 32px);margin:0 16px;min-height:230px;border-radius:26px;}
.mz-carte img{position:absolute;inset:0;z-index:-2;width:100%;height:100%;object-fit:cover;object-position:50% 40%;transition:filter .3s,transform .6s;}
.mz-carte::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(20,13,8,0) 30%,rgba(20,13,8,.55) 58%,rgba(20,13,8,.94) 100%);}
/* Endormie : la lumière baissée, PAS éteinte — et la phrase qui la réveille. */
.mz-carte.dort img{filter:saturate(.75) brightness(.7);}
.mz-carte.on{border-color:rgba(246,181,75,.8);box-shadow:0 0 0 1px rgba(246,181,75,.18) inset,0 14px 34px -16px rgba(255,170,60,.75);}
.mz-carte.pause img{filter:grayscale(.6) brightness(.5);}
.mz-badge{position:absolute;top:10px;right:10px;display:grid;place-items:center;min-width:28px;height:28px;padding:0 9px;border-radius:999px;font-size:12px;font-weight:800;background:rgba(20,13,8,.72);color:#E9D3B6;border:1px solid rgba(255,236,210,.25);}
.mz-badge.on{background:rgba(246,181,75,.92);color:#2a1a0f;border-color:transparent;}
.mz-carte-t b{display:block;font-size:15.5px;line-height:1.15;font-weight:900;}
.mz-carte-t b i{font-style:normal;}
.mz-carte.grande .mz-carte-t b{font-size:21px;}
.mz-carte-t em{display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;margin-top:5px;font-style:normal;font-size:12.5px;line-height:1.32;color:#FFF4E6;}
.mz-carte-t strong{font-weight:700;color:#FFD58A;}
.mz-carte.grande .mz-carte-t em{font-size:14.5px;-webkit-line-clamp:3;}
.mz-grille{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 16px 0;}
.mz-prive{display:flex;gap:8px;margin:16px 18px 0;font-size:12px;line-height:1.45;color:#BFA88C;}
.mz-prive i{font-style:normal;}

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
@media (max-width:340px){.mz-tete h1{font-size:28px;}.mz-scene .fa{transform:scale(.78);transform-origin:0 100%;margin-right:-24px;}.mz-carte{min-height:150px;padding:12px;}.mz-grille{grid-template-columns:1fr;}.mz-grille .mz-carte{min-height:132px;}.mz-carte.grande{min-height:200px;}.mz-progres s{width:9px;}.mz-piece-h{height:250px;}}
@media (prefers-reduced-motion: reduce){.mz-carte img{transition:none;}}
`,
        }}
      />
    </>
  );
}
