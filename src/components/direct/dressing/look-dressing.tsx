"use client";

/**
 * 🧥 UN LOOK AVEC MON DRESSING — la pièce de la boutique, portée avec les siennes.
 *
 * LES ÉCRANS 12 À 19 DE LA MAQUETTE, DANS SON ORDRE :
 *
 *   · « Bonne nouvelle ! Cette veste se combine avec 7 pièces de votre
 *     dressing. » — ce qui va avec, compté, montré.
 *   · « Créer un look avec votre dressing » — ClikMe a choisi ; « Modifier »
 *     laisse la main.
 *   · « Je crée votre look… » — le rendu, par le moteur de l'essayage.
 *   · Le look complet — la photo, et les pièces qui la composent sur le côté.
 *   · « Autres idées de looks » — même veste, d'autres façons de la porter.
 *   · « Détails du look » — chaque pièce, et d'où elle vient. « Réserver
 *     cette veste ».
 *   · « C'est mis de côté ! » — et ce qu'on peut faire ensuite.
 *
 * ═══ CE QUI N'EST PAS ENCORE LÀ, ET L'ÉCRAN LE DIT ═════════════════════════
 *
 *   · LE DRESSING EST VIDE, OU IL LUI MANQUE UNE PLACE (pas de chaussures pour
 *     une veste) → on dit ce qui manque et on propose de l'ajouter, ici même.
 *   · LE MOTEUR D'IMAGE N'EST PAS BRANCHÉ, OU A ÉCHOUÉ → les pièces sont
 *     montrées ensemble, à plat, avec « Aperçu des pièces ensemble ». On ne
 *     fait pas passer un collage pour un rendu porté.
 *   · « LE MAGASIN CONFIRME » (écran 19) demande que le commerçant reçoive la
 *     demande dans son espace : mettre de côté range la pièce dans les pièces
 *     gardées et propose de prévenir le magasin, comme l'essai le fait déjà.
 */

import { useMemo, useState } from "react";
import {
  NOM_SORTE,
  cettePiece,
  compatibles,
  enOrdreDeTenue,
  looksPossibles,
  phraseCompatibles,
  placesManquantes,
  sorteDuNom,
  tenueAccordee,
  votreVetement,
  type Look,
  type PieceBoutique,
  type Vetement,
} from "@/lib/direct/dressing";
import { exemplePossible, photoEnDataUrl, remplirAvecLExemple, useDressing } from "@/lib/direct/dressing-depot";
import { AjoutPiece } from "./ajout-piece";
import { Dessin, DESSINS_DRESSING } from "./dessins-dressing";
import { Porte } from "./porte";
import { StylesDressing } from "./styles-dressing";

type Etape = "accueil" | "bonne" | "selection" | "generation" | "resultat" | "autres" | "details" | "cote";

export type LookFait = { image: string | null; pieces: Vetement[]; titre: string };

/** « Votre chemise », « Vos baskets » — l'étiquette sous une vignette. */
const etiquette = (v: Vetement) => {
  const x = votreVetement(v);
  return x.charAt(0).toUpperCase() + x.slice(1).split(" ").slice(0, 2).join(" ");
};

export function LookAvecMonDressing({
  piece,
  lieu,
  pour,
  photoPersonne,
  onFermer,
  onReserver,
  onPrevenir,
  onSalon,
}: {
  piece: PieceBoutique;
  /** Le nom de la boutique. */
  lieu: string;
  pour: "homme" | "femme";
  /** La photo que la personne vient de prendre pour l'essai de cette boutique, s'il y en a une. */
  photoPersonne?: string | null;
  onFermer: () => void;
  /** Mettre la pièce de côté : la page hôte la range dans les pièces gardées. */
  onReserver: (look: LookFait) => void;
  /** Prévenir le magasin (l'étape « agir » de l'essai). Absent : le bouton ne s'affiche pas. */
  onPrevenir?: () => void;
  /** Ouvrir un salon avec le look. Absent là où il n'y a pas de salon. */
  onSalon?: (look: LookFait) => void;
}) {
  const e = useDressing();
  const p = useMemo<PieceBoutique>(() => ({ ...piece, sorte: piece.sorte ?? sorteDuNom(piece.nom) }), [piece]);
  const compat = useMemo(() => compatibles(p, e.pieces), [p, e.pieces]);
  const looks = useMemo(() => looksPossibles(p, e.pieces), [p, e.pieces]);
  const manque = useMemo(() => placesManquantes(p, e.pieces), [p, e.pieces]);
  const [etape, setEtape] = useState<Etape | null>(null);
  const [ajout, setAjout] = useState(false);
  const [choisies, setChoisies] = useState<Vetement[]>([]);
  const [modifier, setModifier] = useState(false);
  const [fait, setFait] = useState<LookFait | null>(null);
  const [planche, setPlanche] = useState(false);
  const [surElle, setSurElle] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [lookVu, setLookVu] = useState(0);
  const [exemple, setExemple] = useState(false);

  /* L'ÉTAPE DE DÉPART SE DÉDUIT DU DRESSING, tant que la personne n'a rien
     touché : vide ou incomplet → l'accueil ; sinon → « Bonne nouvelle ». Elle
     suit le dressing quand on y ajoute une pièce depuis l'accueil. */
  const depart: Etape = looks.length ? "bonne" : "accueil";
  const ici: Etape | "chargement" = !e.pret ? "chargement" : etape ?? depart;

  const lookActuel: Look | undefined = looks[0];
  const titreDe = (pieces: Vetement[]) => looks.find((l) => l.pieces.map((x) => x.id).sort().join() === pieces.map((x) => x.id).sort().join())?.titre ?? "Votre look";

  const versSelection = (pieces?: Vetement[]) => {
    setChoisies(pieces ?? lookActuel?.pieces ?? compat.slice(0, 3));
    setModifier(false);
    setEtape("selection");
  };

  const basculer = (v: Vetement) =>
    setChoisies((cs) => (cs.some((x) => x.id === v.id) ? cs.filter((x) => x.id !== v.id) : cs.length >= 3 ? cs : [...cs, v]));

  const creer = async (choix: Vetement[]) => {
    const pieces = enOrdreDeTenue(choix);
    setEtape("generation");
    setErreur(null);
    setPlanche(false);
    const titre = titreDe(pieces);
    try {
      const [imgPiece, personne, ...autres] = await Promise.all([
        photoEnDataUrl({ photo: p.photo }),
        photoPersonne ? photoEnDataUrl({ photo: photoPersonne }, 1024) : Promise.resolve(null),
        ...pieces.map((v) => photoEnDataUrl(v)),
      ]);
      if (!imgPiece || autres.some((x) => !x)) throw new Error("photos");
      const r = await fetch("/api/direct/dressing/look", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          pour,
          personne,
          piece: { nom: p.nom, sorte: p.sorte, image: imgPiece },
          autres: pieces.map((v, i) => ({ nom: v.nom, sorte: v.sorte, image: autres[i] })),
        }),
      });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; image?: string; surElle?: boolean; sansMoteur?: boolean; error?: string };
      if (r.ok && j.ok && j.image) {
        setFait({ image: j.image, pieces, titre });
        setSurElle(Boolean(j.surElle));
      } else {
        // PAS DE RENDU : les pièces ensemble, à plat, et l'écran le dit.
        setFait({ image: null, pieces, titre });
        setPlanche(true);
        if (!j.sansMoteur) setErreur(j.error || "Le rendu porté n’a pas abouti.");
      }
    } catch {
      setFait({ image: null, pieces, titre });
      setPlanche(true);
      setErreur("Le rendu porté n’a pas abouti.");
    }
    setEtape("resultat");
  };

  const accordee = tenueAccordee([p.couleur, ...choisies.map((v) => v.couleur)]);

  return (
    <div className="dr" role="dialog" aria-modal="true" aria-label="Un look avec mon dressing">
      <header className="dr-tete">
        <button
          type="button"
          className="dr-rond"
          onClick={() => {
            if (ici === "selection") return setEtape("bonne");
            if (ici === "resultat" || ici === "autres") return setEtape(ici === "autres" ? "resultat" : "selection");
            if (ici === "details") return setEtape("resultat");
            onFermer();
          }}
          aria-label="Revenir"
        >
          <Dessin d={DESSINS_DRESSING.retour} />
        </button>
        <div>
          <h1>{ici === "details" ? "Détails du look" : ici === "autres" ? "Autres idées de looks" : "Avec mon dressing"}</h1>
          <p>{ici === "details" ? "Toutes les pièces de ce look" : ici === "autres" ? "Même pièce, d’autres styles" : lieu}</p>
        </div>
        <button type="button" className="dr-rond" onClick={onFermer} aria-label="Fermer">
          <Dessin d={DESSINS_DRESSING.fermer} />
        </button>
      </header>

      <div className="dr-corps">
        {ici === "chargement" && <p className="dr-note">J’ouvre votre dressing…</p>}

        {ici === "accueil" && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="dr-fant" src="/direct/fantome-humeurs/fantome-excited.webp" alt="" style={{ marginTop: 10 }} />
            {e.pieces.length === 0 ? (
              <>
                <p className="dr-titre">Votre dressing est vide</p>
                <p className="dr-sous">Ajoutez quelques vêtements pour créer des looks avec les articles des commerçants.</p>
                <ul className="dr-avantages">
                  <li>
                    <Dessin d={DESSINS_DRESSING.photo} /> Prenez en photo vos pièces
                  </li>
                  <li>
                    <Dessin d={DESSINS_DRESSING.etoile} /> ClikMe les analyse automatiquement
                  </li>
                  <li>
                    <Dessin d={DESSINS_DRESSING.sac} /> Puis les utilise pour créer des looks
                  </li>
                </ul>
              </>
            ) : (
              <>
                <p className="dr-titre">Il me manque de quoi compléter la tenue</p>
                <p className="dr-sous">
                  {manque.length
                    ? `Pour porter ${cettePiece(p.nom)}, ajoutez ${manque.join(" et ")} à votre dressing.`
                    : `Je ne trouve rien dans votre dressing qui aille avec ${cettePiece(p.nom)}. Ajoutez une pièce, ou essayez-la seule.`}
                </p>
              </>
            )}
            <div className="dr-pile">
              <button type="button" className="dr-cta" onClick={() => setAjout(true)}>
                <Dessin d={DESSINS_DRESSING.photo} /> {e.pieces.length ? "Ajouter une pièce" : "Ajouter ma première pièce"}
              </button>
              {exemplePossible(e) && e.pieces.length === 0 && (
                <button
                  type="button"
                  className="dr-bis"
                  disabled={exemple}
                  onClick={async () => {
                    setExemple(true);
                    await remplirAvecLExemple();
                    setExemple(false);
                  }}
                >
                  {exemple ? "Je range l’exemple…" : "Essayer avec un dressing d’exemple"}
                </button>
              )}
              <button type="button" className="dr-lien" onClick={onFermer}>
                Plus tard
              </button>
            </div>
          </>
        )}

        {ici === "bonne" && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="dr-fant" src="/direct/fantome-humeurs/fantome-celebrate.webp" alt="" style={{ marginTop: 4, width: 128 }} />
            <p className="dr-titre">Bonne nouvelle !</p>
            <p className="dr-sous" style={{ fontSize: 16 }}>
              {phraseCompatibles(p, compat.length).replace(/(\d+ pièces?)/, "§$1§")
                .split("§")
                .map((t, i) => (i === 1 ? <b key={i} className="dr-or">{t}</b> : <span key={i}>{t}</span>))}
            </p>
            <div className="dr-mosaique">
              <figure className="boutique">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.photo} alt="" />
                <figcaption>
                  {p.sorte ? NOM_SORTE[p.sorte] : "La pièce"} (boutique)
                </figcaption>
                <i>✓</i>
              </figure>
              {compat.slice(0, 7).map((v) => (
                <figure key={v.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={v.photo} alt="" />
                  <figcaption>{etiquette(v)}</figcaption>
                  <i>✓</i>
                </figure>
              ))}
            </div>
            <div className="dr-encart">
              <Dessin d={DESSINS_DRESSING.etoile} />
              <span>
                <b>ClikMe</b> a trouvé {looks.length > 1 ? `${looks.length} combinaisons cohérentes` : "une combinaison cohérente"} avec votre style.
              </span>
            </div>
            <div className="dr-pile">
              <button type="button" className="dr-cta" onClick={() => versSelection()}>
                <Dessin d={DESSINS_DRESSING.cintre} /> Voir toutes les combinaisons <Dessin d={DESSINS_DRESSING.fleche} />
              </button>
              <button type="button" className="dr-lien" onClick={onFermer}>
                Continuer mes achats
              </button>
            </div>
          </>
        )}

        {ici === "selection" && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="dr-fant" src="/direct/fantome-humeurs/fantome-pointing.webp" alt="" style={{ width: 120, marginTop: 2 }} />
            <p className="dr-titre">Créer un look avec votre dressing</p>
            <p className="dr-sous">Je choisis les meilleures pièces pour vous, ou vous pouvez les sélectionner.</p>
            <div className="dr-h2" style={{ marginTop: 16 }}>
              <h2 style={{ fontSize: 16 }}>Pièces sélectionnées ({choisies.length})</h2>
              <button type="button" className="dr-modifier" aria-pressed={modifier} onClick={() => setModifier((m) => !m)}>
                {modifier ? "Terminé" : "✎ Modifier"}
              </button>
            </div>
            <div className="dr-grille">
              {(modifier ? compat : choisies).map((v) => {
                const pris = choisies.some((x) => x.id === v.id);
                return (
                  <button key={v.id} type="button" className={`dr-vig${pris ? " choisie" : ""}`} onClick={() => modifier && basculer(v)} aria-pressed={pris}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={v.photo} alt="" />
                    <b>{v.nom}</b>
                    {pris && <span className="dr-coche">✓</span>}
                  </button>
                );
              })}
            </div>
            {modifier && <p className="dr-note">Trois pièces au plus, en plus de celle de la boutique.</p>}
            {!accordee && <p className="dr-erreur">Ces couleurs se disputent la vedette : gardez une seule couleur vive avec la pièce de la boutique.</p>}
            <p className="dr-question">Pièce proposée par le magasin</p>
            <div className="dr-ligne">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.photo} alt="" />
              <span>
                <b>{p.nom}</b>
                <em>
                  {p.prix ? `${p.prix} · ` : ""}
                  {lieu}
                </em>
              </span>
            </div>
            <div className="dr-pile">
              <button type="button" className="dr-cta" disabled={!choisies.length} onClick={() => void creer(choisies)}>
                <Dessin d={DESSINS_DRESSING.etoile} /> Créer le look
              </button>
            </div>
          </>
        )}

        {ici === "generation" && (
          <div aria-live="polite">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="dr-fant" src="/direct/fantome-humeurs/fantome-searching.webp" alt="" style={{ marginTop: 40, width: 170 }} />
            <p className="dr-titre">Je crée votre look…</p>
            <p className="dr-sous">Cela prend quelques secondes.</p>
            <div className="dr-barre lente">
              <i />
            </div>
          </div>
        )}

        {ici === "resultat" && fait && (
          <>
            <div className="dr-rendu">
              {fait.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="dr-rendu-img" src={fait.image} alt={`Le look : ${p.nom} avec ${fait.pieces.map((v) => v.nom.toLowerCase()).join(", ")}`} />
              ) : (
                <Planche piece={p} pieces={fait.pieces} />
              )}
              <div className="dr-colonne">
                <figure>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.photo} alt="" />
                  <figcaption>{p.sorte ? NOM_SORTE[p.sorte] : "Pièce"} (commerce)</figcaption>
                </figure>
                {fait.pieces.map((v) => (
                  <figure key={v.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={v.photo} alt="" />
                    <figcaption>{etiquette(v)}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
            <p className="dr-note" style={{ marginTop: 10 }}>
              {planche
                ? "Aperçu des pièces ensemble : le rendu porté n’est pas disponible pour le moment."
                : surElle
                  ? "Le look, sur votre photo de l’essai. Simulation : la coupe réelle peut varier."
                  : `Le look, porté par ${pour === "homme" ? "un modèle" : "une modèle"}. Simulation : la coupe réelle peut varier.`}
            </p>
            {erreur && <p className="dr-erreur">{erreur}</p>}
            <div className="dr-pile">
              <button type="button" className="dr-cta" onClick={() => setEtape("details")}>
                <Dessin d={DESSINS_DRESSING.coeur} plein /> J’aime ce look
              </button>
              {looks.length > 1 && (
                <button type="button" className="dr-bis" onClick={() => setEtape("autres")}>
                  Autres idées de looks
                </button>
              )}
            </div>
          </>
        )}

        {ici === "autres" && fait && (
          <>
            <div className="dr-carrousel" onScroll={(ev) => setLookVu(Math.round(ev.currentTarget.scrollLeft / Math.max(1, ev.currentTarget.clientWidth * 0.78)))}>
              {looks.map((l, i) => {
                const meme = l.pieces.map((x) => x.id).sort().join() === fait.pieces.map((x) => x.id).sort().join();
                return (
                  <article key={l.titre} className={`dr-idee${i === lookVu ? " vue" : ""}`}>
                    {meme && fait.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="dr-idee-img" src={fait.image} alt="" />
                    ) : (
                      <Planche piece={p} pieces={l.pieces} petite />
                    )}
                    <b>{meme ? "Le look actuel" : l.titre}</b>
                    <em>{l.sous}</em>
                    <div className="dr-idee-pieces">
                      {[p.photo, ...l.pieces.map((v) => v.photo)].slice(0, 4).map((src, k) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={k} src={src} alt="" />
                      ))}
                    </div>
                    <p className="dr-idee-raison">{l.raison}</p>
                    <button
                      type="button"
                      className={meme ? "dr-bis" : "dr-cta"}
                      onClick={() => (meme ? setEtape("details") : void creer(l.pieces))}
                    >
                      {meme ? "Garder celui-ci" : "Voir ce look porté"}
                    </button>
                  </article>
                );
              })}
            </div>
            <div className="dr-points" aria-hidden="true">
              {looks.map((l, i) => (
                <i key={l.titre} className={i === lookVu ? "la" : ""} />
              ))}
            </div>
          </>
        )}

        {ici === "details" && fait && (
          <>
            <div className="dr-hero-look">
              {fait.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fait.image} alt="" />
              ) : (
                <Planche piece={p} pieces={fait.pieces} petite />
              )}
              <div>
                <span className="dr-k">✦ Votre look</span>
                <b>{fait.titre}</b>
                <em>{looks.find((l) => l.titre === fait.titre)?.raison ?? lookActuel?.raison}</em>
              </div>
            </div>
            <p className="dr-question">Les pièces de ce look ({fait.pieces.length + 1})</p>
            <div className="dr-lignes">
              <div className="dr-ligne boutique">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.photo} alt="" />
                <span>
                  <b>{p.nom}</b>
                  {p.prix && <strong>{p.prix}</strong>}
                  <em>{lieu}</em>
                </span>
              </div>
              {fait.pieces.map((v) => (
                <div key={v.id} className="dr-ligne">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={v.photo} alt="" />
                  <span>
                    <b>{v.nom}</b>
                    <em>
                      <Dessin d={DESSINS_DRESSING.cintre} /> Votre dressing
                    </em>
                  </span>
                </div>
              ))}
            </div>
            <div className="dr-pile">
              <button
                type="button"
                className="dr-cta"
                onClick={() => {
                  onReserver(fait);
                  setEtape("cote");
                }}
              >
                <Dessin d={DESSINS_DRESSING.sac} /> Réserver {cettePiece(p.nom)}
              </button>
            </div>
          </>
        )}

        {ici === "cote" && fait && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="dr-fant" src="/direct/fantome-humeurs/fantome-gift.webp" alt="" style={{ marginTop: 10, width: 170 }} />
            <p className="dr-titre">C’est mis de côté !</p>
            <p className="dr-sous">
              {cettePiece(p.nom).charAt(0).toUpperCase() + cettePiece(p.nom).slice(1)} vous attend dans vos pièces gardées, avec votre look.
              {onPrevenir ? " Prévenez le magasin pour qu’il vous la garde." : ""}
            </p>
            <div className="dr-ligne carte">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fait.image ?? p.photo} alt="" />
              <span>
                <b>{p.nom}</b>
                {p.prix && <strong>{p.prix}</strong>}
                <s className="dr-gardee">✓ Mise de côté</s>
              </span>
            </div>
            <div className="dr-pile">
              {onPrevenir && (
                <button type="button" className="dr-cta" onClick={onPrevenir}>
                  <Dessin d={DESSINS_DRESSING.cadeau} /> Prévenir le magasin
                </button>
              )}
              {onSalon && (
                <button type="button" className={onPrevenir ? "dr-bis" : "dr-cta"} onClick={() => onSalon(fait)}>
                  <Dessin d={DESSINS_DRESSING.partager} /> Partager dans un salon
                </button>
              )}
              <button type="button" className="dr-lien" onClick={onFermer}>
                Continuer mes achats →
              </button>
            </div>
          </>
        )}
      </div>

      {ajout && (
        <Porte>
          <AjoutPiece finir="Continuer" onFermer={() => setAjout(false)} onFini={() => setAjout(false)} />
          <StylesDressing />
        </Porte>
      )}
      <StylesDressing />
    </div>
  );
}

/**
 * LES PIÈCES ENSEMBLE, À PLAT — quand il n'y a pas de rendu porté. La pièce de
 * la boutique en grand, les siennes à côté : c'est ce qu'on étalerait sur un
 * lit pour voir si ça va ensemble.
 */
function Planche({ piece, pieces, petite = false }: { piece: PieceBoutique; pieces: Vetement[]; petite?: boolean }) {
  return (
    <div className={`dr-planche${petite ? " petite" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="grande" src={piece.photo} alt="" />
      <div>
        {pieces.map((v) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={v.id} src={v.photo} alt="" />
        ))}
      </div>
    </div>
  );
}
