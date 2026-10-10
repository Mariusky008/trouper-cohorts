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
//   · l'adresse et le code : « Pour ne jamais perdre votre Maison ».
//
// RIEN ICI NE DEMANDE DE REMPLIR UN PROFIL. Une pièce vide dit comment elle se
// remplira toute seule, et ce que ça débloquera ; le seul choix proposé est
// celui qui rend service tout de suite. Voir `lib/direct/maison.ts`.
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
      <div className="mz">
        <VuePiece e={e} gardees={gardees} onRetour={() => setVue({ ou: "entree" })} onDecouvrir={onDecouvrir} onVoirGardee={onVoirGardee} />
        <StylesMaMaison />
      </div>
    );
  }
  if (vue.ou === "reglages") {
    return (
      <div className="mz">
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
      <div className="mz">
        <VueCompte onRetour={() => setVue({ ou: "entree" })} />
        <StylesMaMaison />
      </div>
    );
  }

  const allumees = etats.filter((e) => e.allumee).length;
  const mot = motDuFantome(etats);
  /* « POUR NE JAMAIS PERDRE VOTRE MAISON » — seulement quand il y a quelque
     chose à perdre, dans la vraie ville, et tant que l'adresse n'est pas prouvée. */
  const proposerCompte = reelle && etat.serveur === "pret" && allumees > 0 && !etat.compte?.verifie;

  return (
    <div className="mz">
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
        <p className="mz-sous">Ajoutez ce qui vous ressemble. Je vais chercher en ville ce qui vous correspond.</p>
        <div className="mz-scene">
          <FantomeAnime humeur={allumees ? "excited" : "idle"} taille={112} />
          <div className="mz-bulle">
            <b>{mot.titre}</b>
            <span>{mot.texte}</span>
          </div>
        </div>
      </header>

      <div className="mz-progres" aria-label={`${allumees} pièce${allumees > 1 ? "s" : ""} sur 7 vous connaissent`}>
        <span>
          <b>{allumees}</b> pièce{allumees > 1 ? "s" : ""} qui {allumees > 1 ? "vous connaissent" : "vous connaît"}
        </span>
        <i aria-hidden="true">
          {PIECES.map((p, k) => (
            <s key={p.cle} className={k < allumees ? "on" : ""} />
          ))}
        </i>
      </div>

      {proposerCompte && (
        <button type="button" className="mz-garder" onClick={() => setVue({ ou: "compte" })}>
          <span>
            <b>Ne perdez jamais votre Maison</b>
            <em>Votre adresse e-mail, et un code à six chiffres. C’est tout.</em>
          </span>
          <s aria-hidden="true">›</s>
        </button>
      )}

      <div className="mz-grille">
        {etats.map((e) => (
          <CartePiece key={e.piece.cle} e={e} onOuvrir={() => setVue({ ou: "piece", cle: e.piece.cle })} />
        ))}
      </div>

      <p className="mz-prive">
        <i aria-hidden="true">🔒</i>
        Votre Maison est privée. Les commerçants n’en voient rien : ClikMe leur dit seulement que leurs nouveautés ont trouvé des
        personnes intéressées.
      </p>
      <StylesMaMaison />
    </div>
  );
}

// ─── L'ENTRÉE : UNE CARTE PAR PIÈCE ────────────────────────────────────────

function CartePiece({ e, onOuvrir }: { e: EtatPiece; onOuvrir: () => void }) {
  return (
    <button type="button" className={`mz-carte${e.allumee ? " on" : ""}${e.enPause ? " pause" : ""}`} onClick={onOuvrir}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={e.piece.photo} alt="" loading="lazy" />
      <span className="mz-carte-i" aria-hidden="true">
        {e.piece.icone}
      </span>
      <span className="mz-carte-t">
        <b>{e.piece.nom}</b>
        <em>{e.ligne}</em>
      </span>
      <s aria-hidden="true">›</s>
    </button>
  );
}

// ─── UNE PIÈCE ─────────────────────────────────────────────────────────────

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
  return (
    <>
      <header className="mz-piece-h">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.photo} alt="" />
        <button type="button" className="mz-retour" onClick={onRetour} aria-label="Revenir à ma Maison">
          ←
        </button>
        <span className="mz-piece-t">
          <i aria-hidden="true">{p.icone}</i>
          <b>{p.nom}</b>
          <em>{e.enPause ? "En pause : elle n’apprend rien et ne propose rien." : p.sous}</em>
        </span>
      </header>

      <div className="mz-corps">
        <p className="mz-debloque">
          <i aria-hidden="true">✨</i>
          {p.debloque}
        </p>

        {choix && (
          <section className="mz-bloc">
            <h3>
              {choix.titre}
              <small>Vous me l’avez dit</small>
            </h3>
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
          </section>
        )}

        <section className="mz-bloc">
          <h3>
            Ce que j’ai remarqué<small>{e.remarque.length ? `${e.remarque.length}` : ""}</small>
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
                    <span>
                      <b>{s.quoi}</b>
                      <em>{s.d}</em>
                    </span>
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
            <div className="mz-vide">
              <p>{p.remplit}</p>
              <button type="button" className="mz-cta creux" onClick={() => onDecouvrir(p.branche)}>
                Découvrir dans la ville →
              </button>
            </div>
          )}
        </section>

        <section className="mz-bloc">
          <h3>
            Ce que je crois<small>jamais d’après un seul geste</small>
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
            <p className="mz-note">Il me faut au moins trois gestes dans le même sens avant de croire quoi que ce soit.</p>
          )}
        </section>

        <div className="mz-actions">
          <button type="button" className="mz-cta creux" onClick={() => mettreEnPause(p.cle, !e.enPause)}>
            {e.enPause ? "Reprendre la pièce" : "Mettre en pause"}
          </button>
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
            <button type="button" className="mz-cta creux" onClick={() => setVider(true)}>
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
            <h3>Retrouver ma Maison</h3>
            {compte?.verifie && compte.email ? (
              <p className="mz-note">
                Elle vous suit sur tous vos téléphones avec <b>{compte.email}</b>.
              </p>
            ) : (
              <>
                <p className="mz-note">Sur un autre téléphone, ou si celui-ci perd ses données : votre adresse e-mail et un code.</p>
                <button type="button" className="mz-cta" onClick={onCompte}>
                  Ne jamais la perdre
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
            <p>Votre Maison vous suivra sur tous vos téléphones. Ce code ne vous abonne à rien.</p>
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
            <h2>Ne perdez jamais votre Maison</h2>
            <p>Votre adresse e-mail : je vous envoie un code à six chiffres. Le même code vous rend votre Maison sur un autre téléphone.</p>
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
  background:radial-gradient(130% 60% at 70% 0%,rgba(255,170,70,.20),transparent 60%),radial-gradient(90% 50% at 10% 30%,rgba(255,120,60,.10),transparent 60%),#140D08;}
:where(.mz) button{font:inherit;color:inherit;}
.mz-tete{position:relative;padding:calc(18px + env(safe-area-inset-top)) 18px 8px;overflow:hidden;}
.mz-tete::before{content:"";position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(4px 4px at 18% 22%,rgba(255,210,140,.7),transparent),radial-gradient(3px 3px at 82% 30%,rgba(255,210,140,.55),transparent),
  radial-gradient(5px 5px at 64% 12%,rgba(255,190,110,.45),transparent),radial-gradient(3px 3px at 36% 8%,rgba(255,220,160,.5),transparent);}
.mz-tete-h{display:flex;align-items:center;justify-content:space-between;gap:12px;}
.mz-tete h1{margin:0;font-size:32px;line-height:1.05;font-weight:900;letter-spacing:-.01em;}
.mz-tete h1 b{color:#F6B54B;}
.mz-moi{position:relative;flex:none;width:46px;height:46px;padding:0;border-radius:50%;border:1.5px solid rgba(246,181,75,.75);background:#2a1a0f;cursor:pointer;}
.mz-moi img{width:100%;height:100%;border-radius:50%;object-fit:cover;object-position:50% 12%;}
.mz-moi i{position:absolute;right:-4px;bottom:-4px;display:grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#F6B54B;color:#2a1a0f;font-style:normal;font-size:12px;}
.mz-sous{margin:8px 0 0;max-width:30ch;font-size:14px;line-height:1.4;color:#E9D3B6;}
.mz-scene{position:relative;display:flex;align-items:flex-end;gap:10px;margin-top:14px;min-height:118px;}
.mz-scene .fa{flex:none;margin-left:2px;}
.mz-bulle{position:relative;flex:1;min-width:0;margin-bottom:22px;padding:11px 13px;border-radius:16px 16px 16px 4px;background:#FFF1DC;color:#3a240f;box-shadow:0 10px 26px -12px rgba(0,0,0,.6);}
.mz-bulle b{display:block;font-size:14.5px;}
.mz-bulle span{display:block;margin-top:2px;font-size:13px;line-height:1.35;color:#6b4a2a;}
.mz-progres{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:4px 16px 0;padding:11px 14px;border-radius:16px;
  background:rgba(255,236,210,.05);border:1px solid rgba(246,181,75,.22);font-size:13px;color:#E9D3B6;}
.mz-progres b{color:#FFF4E6;font-size:16px;}
.mz-progres i{display:flex;gap:4px;}
.mz-progres s{display:block;width:16px;height:5px;border-radius:3px;background:rgba(255,236,210,.14);}
.mz-progres s.on{background:#F6B54B;box-shadow:0 0 8px rgba(246,181,75,.6);}
.mz-garder{display:flex;align-items:center;gap:12px;width:calc(100% - 32px);margin:10px 16px 0;padding:12px 14px;text-align:left;border-radius:16px;cursor:pointer;
  background:linear-gradient(135deg,rgba(246,181,75,.22),rgba(246,181,75,.08));border:1.5px solid rgba(246,181,75,.7);}
.mz-garder span{flex:1;min-width:0;}
.mz-garder b{display:block;font-size:14.5px;}
.mz-garder em{display:block;margin-top:2px;font-style:normal;font-size:12.5px;color:#E9D3B6;}
.mz-garder s{text-decoration:none;font-size:22px;color:#F6B54B;}
.mz-grille{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 16px 0;}
.mz-carte{position:relative;display:flex;flex-direction:column;justify-content:flex-end;min-height:132px;padding:12px;text-align:left;border-radius:18px;overflow:hidden;cursor:pointer;
  border:1.5px solid rgba(255,236,210,.12);background:#1d130c;isolation:isolate;}
.mz-carte:last-child:nth-child(odd){grid-column:1 / -1;min-height:104px;}
.mz-carte img{position:absolute;inset:0;z-index:-2;width:100%;height:100%;object-fit:cover;filter:grayscale(.7) brightness(.42);transition:filter .3s;}
.mz-carte::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(20,13,8,0) 20%,rgba(20,13,8,.88) 100%);}
.mz-carte.on{border-color:rgba(246,181,75,.75);box-shadow:0 0 0 1px rgba(246,181,75,.18) inset,0 12px 30px -16px rgba(255,170,60,.7);}
.mz-carte.on img{filter:none;}
.mz-carte.pause{opacity:.7;}
.mz-carte-i{display:grid;place-items:center;width:36px;height:36px;margin-bottom:auto;border-radius:50%;background:rgba(20,13,8,.6);border:1.5px solid rgba(246,181,75,.6);font-size:18px;}
.mz-carte-t b{display:block;font-size:15.5px;line-height:1.15;}
.mz-carte-t em{display:block;margin-top:3px;font-style:normal;font-size:12px;line-height:1.3;color:#E9D3B6;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.mz-carte.on .mz-carte-t em{color:#FFD58A;}
.mz-carte>s{position:absolute;right:12px;bottom:12px;text-decoration:none;font-size:20px;color:#F6B54B;}
.mz-prive{display:flex;gap:8px;margin:16px 18px 0;font-size:12px;line-height:1.45;color:#BFA88C;}
.mz-prive i{font-style:normal;}

.mz-piece-h{position:relative;height:200px;overflow:hidden;}
.mz-piece-h img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:brightness(.6);}
.mz-piece-h::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,13,8,.2),#140D08 96%);}
.mz-retour{position:absolute;z-index:2;top:calc(12px + env(safe-area-inset-top));left:14px;display:grid;place-items:center;width:40px;height:40px;padding:0;border-radius:50%;
  border:1px solid rgba(255,236,210,.3);background:rgba(20,13,8,.55);font-size:18px;cursor:pointer;}
.mz-retour.plat{position:static;width:auto;height:auto;padding:8px 12px;border-radius:12px;font-size:14px;}
.mz-piece-t{position:absolute;z-index:2;left:18px;right:18px;bottom:12px;}
.mz-piece-t i{font-style:normal;font-size:24px;}
.mz-piece-t b{display:block;margin-top:2px;font-size:26px;font-weight:900;line-height:1.05;}
.mz-piece-t em{display:block;margin-top:4px;font-style:normal;font-size:13px;color:#E9D3B6;}
.mz-page-h{display:flex;align-items:center;gap:12px;padding:calc(14px + env(safe-area-inset-top)) 14px 4px;}
.mz-page-h b{font-size:20px;}
.mz-corps{padding:6px 16px 0;}
.mz-debloque{display:flex;gap:9px;margin:0;padding:12px 14px;border-radius:16px;background:rgba(246,181,75,.12);border:1px solid rgba(246,181,75,.35);font-size:14px;line-height:1.4;}
.mz-debloque i{font-style:normal;}
.mz-bloc{margin-top:16px;padding:14px;border-radius:18px;background:rgba(255,236,210,.04);border:1px solid rgba(255,236,210,.1);}
.mz-bloc h3{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;column-gap:10px;row-gap:2px;margin:0 0 10px;font-size:15.5px;}
.mz-bloc h3 small{font-size:11.5px;font-weight:600;color:#BFA88C;}
.mz-puces{display:flex;flex-wrap:wrap;gap:8px;}
.mz-puce{padding:8px 13px;border-radius:999px;border:1.5px solid rgba(255,236,210,.22);background:rgba(255,236,210,.04);font-size:13.5px;cursor:pointer;}
.mz-puce.on{border-color:#F6B54B;background:rgba(246,181,75,.18);color:#FFD58A;font-weight:700;}
.mz-gestes{display:flex;flex-direction:column;gap:8px;margin:0;padding:0;list-style:none;}
.mz-gestes li>*{display:flex;align-items:center;gap:11px;width:100%;padding:6px;text-align:left;border-radius:14px;border:0;background:rgba(255,236,210,.04);}
.mz-gestes button{cursor:pointer;}
.mz-gestes img,.mz-gestes li i{flex:none;display:grid;place-items:center;width:48px;height:48px;border-radius:11px;object-fit:cover;background:#2a1a0f;font-style:normal;font-size:20px;}
.mz-gestes span{min-width:0;}
.mz-gestes b{display:block;font-size:14px;line-height:1.25;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.mz-gestes em{display:block;margin-top:2px;font-style:normal;font-size:12px;color:#BFA88C;}
.mz-vide p{margin:0 0 10px;font-size:13.5px;line-height:1.45;color:#E9D3B6;}
.mz-crois{display:flex;flex-direction:column;gap:8px;margin:0;padding:0;list-style:none;}
.mz-crois li{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;background:rgba(246,181,75,.08);}
.mz-crois span{flex:1;min-width:0;}
.mz-crois b{display:block;font-size:14px;}
.mz-crois em{display:block;margin-top:2px;font-style:normal;font-size:12px;color:#BFA88C;}
.mz-crois button{flex:none;padding:7px 10px;border-radius:10px;border:1px solid rgba(255,236,210,.25);background:transparent;font-size:12px;cursor:pointer;}
.mz-note{margin:0;font-size:13px;line-height:1.45;color:#BFA88C;}
.mz-note b{color:#FFF4E6;}
.mz-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px;}
.mz-cta{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 18px;border-radius:14px;border:0;cursor:pointer;
  background:linear-gradient(180deg,#FFC861,#F0A22E);color:#2a1a0f !important;font-weight:800;font-size:14.5px;}
.mz-cta:disabled{opacity:.45;cursor:default;}
.mz-cta.creux{background:transparent;border:1.5px solid rgba(255,236,210,.28);color:#FFF4E6 !important;font-weight:700;}
.mz-cta.danger{background:#C2412D;color:#fff !important;}
.mz-cta.danger-t{border-color:rgba(232,110,90,.6);color:#FFB4A6 !important;}
.mz-sur{display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-size:13px;color:#FFD2C8;}
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
.mz-compte{display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center;padding-top:10px;}
.mz-compte form{display:flex;flex-direction:column;align-items:stretch;gap:12px;width:100%;max-width:360px;}
.mz-compte h2{margin:8px 0 0;font-size:24px;font-weight:900;}
.mz-compte p{margin:0;font-size:14px;line-height:1.45;color:#E9D3B6;}
.mz-champ{width:100%;min-height:50px;padding:0 14px;border-radius:14px;border:1.5px solid rgba(255,236,210,.25);background:rgba(255,236,210,.06);color:#FFF4E6;font:inherit;font-size:16px;}
.mz-champ:focus{outline:none;border-color:#F6B54B;}
.mz-code{text-align:center;letter-spacing:.4em;font-size:26px;font-weight:800;}
.mz-erreur{color:#FFB4A6 !important;font-size:13px !important;}
.mz-lien{border:0;background:transparent;color:#F6B54B !important;font-size:13px;text-decoration:underline;cursor:pointer;}
@media (max-width:340px){.mz-tete h1{font-size:28px;}.mz-carte{min-height:118px;}.mz-progres s{width:11px;}}
@media (prefers-reduced-motion: reduce){.mz-carte img{transition:none;}}
`,
        }}
      />
    </>
  );
}
