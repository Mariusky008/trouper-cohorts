"use client";

/**
 * 📷 AJOUTER UNE PIÈCE — « 1 Prendre la photo · 2 Valider · 3 Analyse ».
 *
 * LES ÉCRANS 5 À 9 DE LA MAQUETTE, DANS SON ORDRE : les conseils et les deux
 * façons d'ajouter (appareil photo ou galerie), la photo à valider, l'analyse
 * (couleur, type, style, matière, saison — les cases se cochent une à une),
 * puis « Pièce ajoutée ! » avec ce que ClikMe a compris, en étiquettes.
 *
 * ═══ CE QUI PEUT RATER, ET CE QUE L'ÉCRAN FAIT ALORS ══════════════════════
 *
 *   · LA PHOTO NE S'OUVRE PAS → on le dit, et on repropose.
 *   · CE N'EST PAS UN VÊTEMENT → « Je ne vois pas de vêtement sur cette
 *     photo », sans ranger quoi que ce soit.
 *   · L'ANALYSE N'EST PAS BRANCHÉE (ou ne répond pas) → deux questions, la
 *     place et la couleur, la couleur déjà mesurée au centre de la photo. On ne
 *     prétend pas avoir analysé ce qu'on n'a pas analysé.
 *   · L'ANALYSE S'EST TROMPÉE → « Corriger », directement sur l'écran de la
 *     pièce ajoutée. C'est le « Ce n'est pas moi » de Ma Maison, appliqué à un
 *     vêtement.
 *
 * LA PHOTO NE PART QU'APRÈS « VALIDER » : rien n'est envoyé tant qu'on ne l'a
 * pas regardée.
 */

import { useRef, useState } from "react";
import {
  CLES_COULEUR,
  COULEURS,
  NOM_SORTE,
  SAISONS,
  STYLES,
  lireFiche,
  type CleCouleur,
  type Fiche,
  type SorteVetement,
  type Vetement,
} from "@/lib/direct/dressing";
import { analyserPhoto, corrigerPiece, couleurAuCentre, rangerPiece, reduirePhoto } from "@/lib/direct/dressing-depot";
import { Dessin, DESSINS_DRESSING } from "./dessins-dressing";

type Etape = "conseils" | "valider" | "analyse" | "choisir" | "ajoutee" | "pasvetement";

/** Le temps de l'animation des cinq cases : on ne coupe pas la dernière en plein vol. */
const ANALYSE_MIN_MS = 2300;
const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms));

const LIGNES_ANALYSE = ["Couleur", "Type (haut, pantalon…)", "Style", "Matière", "Saison"];

/** Les places qu'on propose à la main, dans l'ordre d'un placard. */
const PLACES_A_LA_MAIN: { sorte: SorteVetement; nom: string }[] = [
  { sorte: "haut", nom: "Haut" },
  { sorte: "maille", nom: "Pull" },
  { sorte: "dessus", nom: "Veste" },
  { sorte: "bas", nom: "Pantalon ou jupe" },
  { sorte: "robe", nom: "Robe" },
  { sorte: "chaussures", nom: "Chaussures" },
  { sorte: "accessoire", nom: "Accessoire" },
];

export function AjoutPiece({
  onFini,
  onFermer,
  finir = "Voir mon dressing",
}: {
  /** Une pièce vient d'être rangée et on veut passer à la suite. */
  onFini: (v: Vetement | null) => void;
  onFermer: () => void;
  /** Le second bouton de « Pièce ajoutée » : « Voir mon dressing », ou « Continuer » depuis un look. */
  finir?: string;
}) {
  const [etape, setEtape] = useState<Etape>("conseils");
  const [photo, setPhoto] = useState<{ blob: Blob; dataUrl: string } | null>(null);
  const [fiche, setFiche] = useState<Fiche | null>(null);
  const [piece, setPiece] = useState<Vetement | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [lente, setLente] = useState(false);
  const [corriger, setCorriger] = useState(false);
  const [range, setRange] = useState(false);
  const appareil = useRef<HTMLInputElement>(null);
  const galerie = useRef<HTMLInputElement>(null);

  const recommencer = () => {
    setPhoto(null);
    setFiche(null);
    setPiece(null);
    setErreur(null);
    setCorriger(false);
    setRange(false);
    setEtape("conseils");
  };

  const recue = async (f: File | undefined) => {
    if (!f) return;
    setErreur(null);
    const p = await reduirePhoto(f, 1200);
    if (!p) {
      setErreur("Cette photo ne s’ouvre pas sur ce téléphone. Essayez-en une autre, ou prenez-la avec l’appareil photo.");
      return;
    }
    setPhoto({ blob: p.blob, dataUrl: p.dataUrl });
    setEtape("valider");
  };

  const ranger = async (f: Fiche) => {
    if (!photo) return;
    setRange(true);
    const r = await rangerPiece(photo, f);
    setRange(false);
    if ("erreur" in r) {
      setErreur(r.erreur);
      setFiche(f);
      setEtape("choisir");
      return;
    }
    setPiece(r);
    setFiche(f);
    setEtape("ajoutee");
  };

  const analyser = async () => {
    if (!photo) return;
    setEtape("analyse");
    setErreur(null);
    setLente(false);
    const petite = await reduirePhoto(photo.blob, 640, 0.8);
    const lenteurs = setTimeout(() => setLente(true), ANALYSE_MIN_MS);
    const [a, couleur] = await Promise.all([
      petite ? analyserPhoto(petite.dataUrl) : Promise.resolve({ fiche: null, vetement: true, sansIA: true }),
      couleurAuCentre(photo.dataUrl),
      attendre(ANALYSE_MIN_MS),
    ]);
    clearTimeout(lenteurs);
    if (!a.sansIA && !a.vetement) {
      setEtape("pasvetement");
      return;
    }
    if (a.fiche) {
      await ranger(a.fiche);
      return;
    }
    // SANS ANALYSE : on demande la place, la couleur mesurée est déjà choisie.
    setFiche({ sorte: "haut", couleur, nom: "" });
    setEtape("choisir");
  };

  /**
   * UN BROUILLON, PAS UNE FICHE : le nom reste tel qu'on le tape (sinon on ne
   * pourrait pas taper d'espace) et n'est nettoyé qu'à l'enregistrement. Il
   * suit la place et la couleur tant que personne ne l'a écrit à la main.
   */
  const ficheChoisie = (f: Fiche | null, maj: Partial<Fiche>): Fiche => {
    const base: Fiche = { sorte: "haut" as SorteVetement, couleur: "gris" as CleCouleur, nom: "", ...(f ?? {}) };
    const suite: Fiche = { ...base, ...maj };
    const auto = `${NOM_SORTE[base.sorte]} ${COULEURS[base.couleur].nom.toLowerCase()}`;
    if (maj.nom === undefined && (!base.nom || base.nom === auto)) suite.nom = `${NOM_SORTE[suite.sorte]} ${COULEURS[suite.couleur].nom.toLowerCase()}`;
    return suite;
  };

  const enregistrerCorrection = async () => {
    const f = lireFiche(fiche);
    if (!piece || !f) return;
    const ok = await corrigerPiece(piece.id, f);
    if (ok) {
      setPiece({ ...piece, ...f });
      setFiche(f);
      setCorriger(false);
    } else setErreur("La correction n’a pas pu être enregistrée.");
  };

  const etapeNo = etape === "conseils" ? 1 : etape === "valider" ? 2 : 3;

  return (
    <div className="dr" role="dialog" aria-modal="true" aria-label="Ajouter une pièce">
      <header className="dr-tete">
        <button type="button" className="dr-rond" onClick={etape === "valider" ? recommencer : onFermer} aria-label={etape === "valider" ? "Reprendre" : "Fermer"}>
          <Dessin d={DESSINS_DRESSING.retour} />
        </button>
        <div>
          <h1>{etape === "ajoutee" ? "Mon dressing" : "Ajouter une pièce"}</h1>
        </div>
        <span />
      </header>
      <div className="dr-corps">
        {etape !== "ajoutee" && etape !== "pasvetement" && (
          <div className="dr-etapes" aria-label={`Étape ${etapeNo} sur 3`}>
            {["Prendre la photo", "Valider", "Analyse"].map((t, i) => (
              <div key={t} className={i + 1 < etapeNo ? "fait" : i + 1 === etapeNo ? "la" : ""}>
                <i>{i + 1 < etapeNo ? "✓" : i + 1}</i>
                {t}
              </div>
            ))}
          </div>
        )}

        {etape === "conseils" && (
          <>
            <div className="dr-conseil">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/direct/fantome-humeurs/fantome-pointing.webp" alt="" />
              <div>
                <b>Prenez la photo de votre vêtement</b>
                <ul>
                  <li>Sur un fond neutre</li>
                  <li>Le vêtement bien visible</li>
                  <li>Bonne lumière</li>
                </ul>
              </div>
            </div>
            <div className="dr-cadre vide" aria-hidden="true">
              <Dessin d={DESSINS_DRESSING.cintre} />
            </div>
            {erreur && <p className="dr-erreur">{erreur}</p>}
            <div className="dr-pile">
              <button type="button" className="dr-cta" onClick={() => appareil.current?.click()}>
                <Dessin d={DESSINS_DRESSING.photo} /> Prendre une photo
              </button>
              <button type="button" className="dr-bis" onClick={() => galerie.current?.click()}>
                <Dessin d={DESSINS_DRESSING.galerie} /> Choisir dans la galerie
              </button>
            </div>
            <div className="dr-exemples">
              <b>Exemples de bonnes photos</b>
              <div>
                {["tshirt", "jean", "baskets", "veste"].map((x) => (
                  <span key={x}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/direct/dressing/exemple-${x}.webp`} alt="" />
                    <i>✓</i>
                  </span>
                ))}
                <span className="non" title="Évitez les photos trop chargées">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/direct/dressing/exemple-tas.webp" alt="" />
                  <i>✕</i>
                </span>
              </div>
            </div>
            <p className="dr-note">La photo est analysée pour reconnaître la pièce, puis rangée dans votre Maison. Elle n’est montrée à personne, ni aux commerçants.</p>
            <input ref={appareil} type="file" accept="image/*" capture="environment" hidden onChange={(e) => void recue(e.target.files?.[0])} />
            <input ref={galerie} type="file" accept="image/*" hidden onChange={(e) => void recue(e.target.files?.[0])} />
          </>
        )}

        {etape === "valider" && photo && (
          <>
            <div className="dr-cadre">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.dataUrl} alt="Votre photo" />
            </div>
            <div className="dr-pile">
              <button type="button" className="dr-cta" onClick={() => void analyser()}>
                Valider la photo
              </button>
              <button type="button" className="dr-lien" onClick={recommencer}>
                Reprendre
              </button>
            </div>
          </>
        )}

        {etape === "analyse" && (
          <div aria-live="polite">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="dr-fant" src="/direct/fantome-humeurs/fantome-searching.webp" alt="" style={{ marginTop: 26 }} />
            <p className="dr-titre">ClikMe analyse votre vêtement…</p>
            <div className={`dr-barre${lente ? " lente" : ""}`}>
              <i />
            </div>
            <ul className="dr-liste">
              {LIGNES_ANALYSE.map((l, i) => (
                <li key={l} style={{ animationDelay: `${300 + i * 380}ms` }}>
                  <i>✓</i>
                  {l}
                </li>
              ))}
            </ul>
            {range && <p className="dr-note">Je la range dans votre dressing…</p>}
          </div>
        )}

        {etape === "pasvetement" && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="dr-fant" src="/direct/fantome-humeurs/fantome-curious.webp" alt="" style={{ marginTop: 26 }} />
            <p className="dr-titre">Je ne vois pas de vêtement sur cette photo</p>
            <p className="dr-sous">Posez la pièce à plat ou sur un cintre, devant un mur clair, et reprenez la photo.</p>
            <div className="dr-pile">
              <button type="button" className="dr-cta" onClick={recommencer}>
                Reprendre la photo
              </button>
            </div>
          </>
        )}

        {etape === "choisir" && photo && (
          <>
            <div className="dr-ajoutee" style={{ marginTop: 22 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.dataUrl} alt="" />
            </div>
            <p className="dr-question">Qu’est-ce que c’est ?</p>
            <ChoixFiche fiche={fiche} onFiche={(maj) => setFiche((f) => ficheChoisie(f, maj))} />
            {erreur && <p className="dr-erreur">{erreur}</p>}
            <div className="dr-pile">
              <button
                type="button"
                className="dr-cta"
                disabled={!lireFiche(fiche) || range}
                onClick={() => {
                  const f = lireFiche(fiche);
                  if (f) void ranger(f);
                }}
              >
                {range ? "Je la range…" : "Ranger cette pièce"}
              </button>
            </div>
          </>
        )}

        {etape === "ajoutee" && piece && (
          <>
            <div className="dr-ajoutee">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={piece.photo} alt="" />
              <i aria-hidden="true">✓</i>
            </div>
            <p className="dr-titre" style={{ marginTop: 34 }}>
              Pièce ajoutée !
            </p>
            <p className="dr-sous" style={{ marginTop: 4, fontSize: 16, color: "#E8DCCB" }}>
              {piece.nom}
            </p>
            {!corriger ? (
              <>
                <div className="dr-puces">
                  <span>{NOM_SORTE[piece.sorte]}</span>
                  <span>
                    <i className="ton" style={{ background: COULEURS[piece.couleur].hex }} />
                    {COULEURS[piece.couleur].nom}
                  </span>
                  {piece.style && <span>{STYLES[piece.style]}</span>}
                  {piece.matiere && <span>{piece.matiere.charAt(0).toUpperCase() + piece.matiere.slice(1)}</span>}
                  {piece.saison && piece.saison !== "toutes" && <span>{SAISONS[piece.saison]}</span>}
                </div>
                <button type="button" className="dr-lien" onClick={() => setCorriger(true)}>
                  Ce n’est pas tout à fait ça ? Corriger
                </button>
              </>
            ) : (
              <>
                <ChoixFiche fiche={fiche} onFiche={(maj) => setFiche((f) => ficheChoisie(f, maj))} nom />
                <div className="dr-pile">
                  <button type="button" className="dr-cta" onClick={() => void enregistrerCorrection()}>
                    Enregistrer
                  </button>
                </div>
              </>
            )}
            {erreur && <p className="dr-erreur">{erreur}</p>}
            {!corriger && (
              <div className="dr-pile">
                <button type="button" className="dr-cta" onClick={recommencer}>
                  Ajouter une autre pièce
                </button>
                <button type="button" className="dr-bis" onClick={() => onFini(piece)}>
                  {finir}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** La place, la couleur — et le nom quand on corrige. */
export function ChoixFiche({ fiche, onFiche, nom = false }: { fiche: Fiche | null; onFiche: (maj: Partial<Fiche>) => void; nom?: boolean }) {
  return (
    <>
      <div className="dr-puces" role="group" aria-label="Type de pièce">
        {PLACES_A_LA_MAIN.map((p) => (
          <button key={p.sorte} type="button" aria-pressed={fiche?.sorte === p.sorte} onClick={() => onFiche({ sorte: p.sorte })}>
            {p.nom}
          </button>
        ))}
      </div>
      <p className="dr-question" style={{ fontSize: 14, marginTop: 14 }}>
        Sa couleur
      </p>
      <div className="dr-puces" role="group" aria-label="Couleur">
        {CLES_COULEUR.map((c) => (
          <button key={c} type="button" aria-pressed={fiche?.couleur === c} onClick={() => onFiche({ couleur: c })}>
            <i className="ton" style={{ background: COULEURS[c].hex }} />
            {COULEURS[c].nom}
          </button>
        ))}
      </div>
      {nom && (
        <label className="dr-champ">
          <span>Son nom</span>
          <input value={fiche?.nom ?? ""} maxLength={48} onChange={(e) => onFiche({ nom: e.target.value })} />
        </label>
      )}
    </>
  );
}
