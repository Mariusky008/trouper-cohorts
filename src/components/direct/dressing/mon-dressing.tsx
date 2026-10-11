"use client";

/**
 * 👔 MON DRESSING — « Vos vêtements personnels ».
 *
 * LES ÉCRANS 3, 4 ET 10 DE LA MAQUETTE. Vide : le Fantôme, ce que le dressing
 * apporte (des looks qui vous ressemblent, une meilleure aide pour choisir,
 * vous restez maître de votre dressing), et le premier geste. Rempli : la
 * grille, les filtres, « Gérer ». Une pièce touchée s'ouvre en grand, avec ce
 * que ClikMe en a compris et de quoi le corriger ou la retirer.
 *
 * ═══ IL DIT OÙ VIVENT LES PIÈCES ═══════════════════════════════════════════
 *
 * « Gardé dans votre Maison » dans une vraie ville (et donc retrouvé sur les
 * pages des boutiques et sur un autre téléphone) ; « gardé sur ce téléphone »
 * dans la démonstration ou quand le serveur ne répond pas. On ne laisse pas
 * croire qu'une photo est en lieu sûr quand elle ne l'est pas.
 */

import { useMemo, useState, type ReactNode } from "react";
import { COULEURS, FILTRES, NOM_SORTE, PIECES_MIN, SAISONS, STYLES, type Filtre, type Vetement } from "@/lib/direct/dressing";
import { exemplePossible, remplirAvecLExemple, retirerPiece, useDressing } from "@/lib/direct/dressing-depot";
import { AjoutPiece } from "./ajout-piece";
import { Dessin, DESSINS_DRESSING } from "./dessins-dressing";
import { Porte } from "./porte";
import { StylesDressing } from "./styles-dressing";
import { VideoFantome } from "@/components/direct/video-fantome";

export function MonDressing({
  onRetour,
  dedans = false,
  enPlus,
}: {
  onRetour?: () => void;
  /** Dans une page qui défile déjà (Ma Maison) : pas de surcouche plein écran. */
  dedans?: boolean;
  /** Ce que la page hôte ajoute sous la grille (Ma Maison : « Ce que je sais de vos goûts »). */
  enPlus?: ReactNode;
}) {
  const e = useDressing();
  const [ajout, setAjout] = useState(false);
  const [filtre, setFiltre] = useState<Filtre>("tous");
  const [gerer, setGerer] = useState(false);
  const [vue, setVue] = useState<Vetement | null>(null);
  const [exemple, setExemple] = useState(false);

  const filtres = useMemo(() => FILTRES.filter((f) => f.cle === "tous" || (f.cle !== "robes" ? true : e.pieces.some((p) => p.sorte === "robe"))), [e.pieces]);
  const visibles = useMemo(() => {
    const f = FILTRES.find((x) => x.cle === filtre) ?? FILTRES[0];
    return e.pieces.filter((p) => f.sortes.includes(p.sorte));
  }, [e.pieces, filtre]);
  const n = e.pieces.length;

  const retirer = async (p: Vetement) => {
    await retirerPiece(p.id);
    setVue(null);
  };

  return (
    <div className={`dr${dedans ? " dedans" : ""}`}>
      <header className="dr-tete">
        {onRetour ? (
          <button type="button" className="dr-rond" onClick={onRetour} aria-label="Revenir">
            <Dessin d={DESSINS_DRESSING.retour} />
          </button>
        ) : (
          <span />
        )}
        <div>
          <h1>Mon dressing</h1>
          <p>{n ? `${n} pièce${n > 1 ? "s" : ""}` : "Vos vêtements personnels"}</p>
        </div>
        <span />
      </header>

      <div className="dr-corps">
        {/* PAS PENDANT QU'IL S'OUVRE : un dressing rempli ne doit pas voir passer le tuto. */}
        {e.pret && !n && (
          <>
            {/* ═══ LA PREMIÈRE OUVERTURE, LE DRESSING VIDE : LE FANTÔME MONTRE LE GESTE ═══
                « L'utilisateur arrive dans Mon Dressing et voit la vignette de
                cinq à sept secondes. Juste dessous : "Montrez-moi quelques
                vêtements que vous portez. Je chercherai en ville ce qui va
                avec." Puis : 📸 Ajouter mon premier vêtement. »
                Le Fantôme photographie un jean pendu dans sa penderie : c'est
                exactement ce qu'on va lui demander de faire. Une fois, et elle
                reste sur le téléphone qui montre le jean — voir `VideoFantome`.
                TROIS, PAS « QUELQUES » : « 3 paraît réalisable et concret » — et
                c'est le seuil des looks (`PIECES_MIN`). */}
            <VideoFantome nom="dressing" classe="dr-video" />
            <p className="dr-video-dit">Montrez-moi {PIECES_MIN} vêtements que vous portez. Je chercherai en ville ce qui va avec.</p>
            <div className="dr-pile">
              <button type="button" className="dr-cta" onClick={() => setAjout(true)}>
                <Dessin d={DESSINS_DRESSING.photo} /> Ajouter mon premier vêtement
              </button>
            </div>
            <div className="dr-trois">
              <div>
                <i>
                  <Dessin d={DESSINS_DRESSING.cintre} />
                </i>
                Des looks qui vous ressemblent
              </div>
              <div>
                <i>
                  <Dessin d={DESSINS_DRESSING.tshirt} />
                </i>
                Une meilleure aide pour choisir
              </div>
              <div>
                <i>
                  <Dessin d={DESSINS_DRESSING.etoile} />
                </i>
                Vous restez maître de votre dressing
              </div>
            </div>
          </>
        )}

        <div className="dr-h2">
          <h2>Mes pièces ({n})</h2>
          {n > 0 && (
            <button type="button" className="dr-gerer" aria-pressed={gerer} onClick={() => setGerer((g) => !g)}>
              <Dessin d={DESSINS_DRESSING.reglages} /> {gerer ? "Terminé" : "Gérer"}
            </button>
          )}
        </div>
        <div className="dr-filtres" role="group" aria-label="Filtrer">
          {filtres.map((f) => (
            <button key={f.cle} type="button" aria-pressed={filtre === f.cle} onClick={() => setFiltre(f.cle)}>
              {f.nom}
            </button>
          ))}
        </div>

        {!e.pret ? (
          <p className="dr-note">J’ouvre votre dressing…</p>
        ) : n === 0 ? (
          <div className="dr-vide">
            <div className="dr-vide-dessins" aria-hidden="true">
              <Dessin d={DESSINS_DRESSING.tshirt} />
              <Dessin d={DESSINS_DRESSING.veste} />
              <Dessin d={DESSINS_DRESSING.pantalon} />
              <Dessin d={DESSINS_DRESSING.chaussure} />
              <Dessin d={DESSINS_DRESSING.casquette} />
            </div>
            <b>Aucune pièce pour l’instant</b>
            <p>Ajoutez au moins {PIECES_MIN} pièces pour que ClikMe puisse vous proposer des looks.</p>
            <button type="button" className="dr-cta" onClick={() => setAjout(true)}>
              <Dessin d={DESSINS_DRESSING.photo} /> Ajouter une pièce
            </button>
            {exemplePossible(e) && (
              <button
                type="button"
                className="dr-lien"
                disabled={exemple}
                onClick={async () => {
                  setExemple(true);
                  await remplirAvecLExemple();
                  setExemple(false);
                }}
              >
                {exemple ? "Je range l’exemple…" : "Pas de vêtement sous la main ? Essayer avec un dressing d’exemple"}
              </button>
            )}
          </div>
        ) : (
          <div className="dr-grille">
            {visibles.map((p) => (
              <button
                key={p.id}
                type="button"
                className="dr-vig"
                onClick={() => (gerer ? void retirerPiece(p.id) : setVue(p))}
                aria-label={gerer ? `Retirer ${p.nom}` : p.nom}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.photo} alt="" loading="lazy" />
                <b>{p.nom}</b>
                {gerer && (
                  <span className="dr-moins" aria-hidden="true">
                    −
                  </span>
                )}
              </button>
            ))}
            {!gerer && filtre === "tous" && (
              <button type="button" className="dr-plus" onClick={() => setAjout(true)}>
                <span>+</span>
                Ajouter une pièce
              </button>
            )}
          </div>
        )}

        {e.pret && n > 0 && n < PIECES_MIN && (
          <p className="dr-note">
            Encore {PIECES_MIN - n} pièce{PIECES_MIN - n > 1 ? "s" : ""} et je pourrai vous proposer des looks avec ce que vous avez déjà.
          </p>
        )}
        {e.pret && (
          <p className="dr-ou">
            <Dessin d={DESSINS_DRESSING.cintre} className="" />
            {e.ou === "serveur" ? (
              <span>
                <b>Gardé dans votre Maison.</b> Retrouvé sur l’application et sur les pages des boutiques ClikMe. Visible par vous seul.
              </span>
            ) : e.ou === "memoire" ? (
              <span>
                <b>Navigation privée :</b> vos pièces ne seront pas gardées après cette visite.
              </span>
            ) : e.replie ? (
              <span>
                <b>Gardé sur ce téléphone</b> pour l’instant : votre Maison ne répond pas. Visible par vous seul.
              </span>
            ) : (
              <span>
                <b>Gardé sur ce téléphone.</b> Visible par vous seul.
              </span>
            )}
          </p>
        )}
        {enPlus}
      </div>

      {vue && (
        <Porte>
          <div className="dr-voile" onClick={() => setVue(null)}>
            <div className="dr-feuille" role="dialog" aria-modal="true" aria-label={vue.nom} onClick={(ev) => ev.stopPropagation()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="dr-grande" src={vue.photo} alt="" />
              <h3>{vue.nom}</h3>
              <div className="dr-puces">
                <span>{NOM_SORTE[vue.sorte]}</span>
                <span>
                  <i className="ton" style={{ background: COULEURS[vue.couleur].hex }} />
                  {COULEURS[vue.couleur].nom}
                </span>
                {vue.style && <span>{STYLES[vue.style]}</span>}
                {vue.matiere && <span>{vue.matiere.charAt(0).toUpperCase() + vue.matiere.slice(1)}</span>}
                {vue.saison && vue.saison !== "toutes" && <span>{SAISONS[vue.saison]}</span>}
              </div>
              <button type="button" className="dr-retirer" onClick={() => void retirer(vue)}>
                Retirer de mon dressing
              </button>
              <button type="button" className="dr-lien" onClick={() => setVue(null)}>
                Fermer
              </button>
              <StylesDressing />
            </div>
          </div>
        </Porte>
      )}

      {ajout && (
        <Porte>
          <AjoutPiece onFermer={() => setAjout(false)} onFini={() => setAjout(false)} />
          <StylesDressing />
        </Porte>
      )}
      <StylesDressing />
    </div>
  );
}
