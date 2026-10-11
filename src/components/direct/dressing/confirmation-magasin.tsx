"use client";

/**
 * ✅ « LE MAGASIN CONFIRME ! » — l'écran 19 de la maquette, et son envers
 * (« plus disponible »). Il n'existe QUE parce que le commerçant a appuyé sur
 * le lien de sa demande (`/reponse/cote/…`) : jamais avant. Voir
 * `lib/direct/mise-de-cote.ts`.
 *
 * DEUX ENDROITS L'AFFICHENT, LE MÊME DESSIN :
 *   · le look lui-même, quand la réponse arrive pendant qu'il est ouvert ;
 *   · `ReponseDuMagasin`, une fenêtre qui s'ouvre d'elle-même sur l'application
 *     ou la page d'une boutique quand la réponse est arrivée entre-temps
 *     (une notification l'y a souvent amené).
 */

import { cettePiece } from "@/lib/direct/dressing";
import { marquerVueCote, suivieIci, useMisesDeCote, type DemandeCote } from "@/lib/direct/mises-de-cote";
import { Dessin, DESSINS_DRESSING } from "./dessins-dressing";
import { Porte } from "./porte";
import { StylesDressing } from "./styles-dressing";

/** « votre veste », « vos baskets », et l'accord qui va avec. */
export function votrePiece(nom: string): { dit: string; e: string } {
  const c = cettePiece(nom);
  if (c.startsWith("ces ")) return { dit: `vos ${c.slice(4)}`, e: "es" };
  if (c.startsWith("cette ")) return { dit: `votre ${c.slice(6)}`, e: "e" };
  return { dit: `votre ${c.replace(/^ce /, "")}`, e: "" };
}
const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const avecOnglet = (page: string) => `${page}${page.includes("?") ? "&" : "?"}onglet=infos`;

export function EcranMagasinConfirme({
  demande,
  image,
  demo = false,
  onSalon,
  onFermer,
}: {
  demande: Pick<DemandeCote, "quoi" | "prix" | "photo" | "magasin" | "page" | "etat">;
  /** Le look porté, quand il y en a un : c'est lui qu'on montre plutôt que la photo du magasin. */
  image?: string | null;
  /** La démonstration : personne n'a appuyé, et l'écran le dit. */
  demo?: boolean;
  onSalon?: () => void;
  onFermer: () => void;
}) {
  const { dit, e } = votrePiece(demande.quoi);
  const confirme = demande.etat === "confirmee";
  const chez = demande.magasin ? ` chez ${demande.magasin}` : "";
  return (
    <div className="dr-confirme">
      <span className={`dr-cintre-grand${confirme ? "" : " eteint"}`} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/direct/dressing/dressing-cintre.webp" alt="" />
      </span>
      <p className="dr-titre">{confirme ? "Le magasin confirme !" : "Le magasin n’a plus cette pièce"}</p>
      <p className="dr-sous">
        {confirme ? `${majuscule(dit)} est bien mis${e} de côté${chez}.` : `${demande.magasin || "Le magasin"} vous a répondu : ${dit} n’est plus disponible.`}
      </p>
      <div className="dr-ligne carte">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {(image || demande.photo) && <img src={image || demande.photo} alt="" />}
        <span>
          <b>{demande.quoi}</b>
          {demande.prix && <strong>{demande.prix}</strong>}
          {confirme ? <s className="dr-gardee">✓ Mise de côté confirmée</s> : <s className="dr-indispo">Plus disponible</s>}
        </span>
      </div>
      {demo && <p className="dr-note">Démonstration : dans un vrai magasin, c’est le commerçant qui confirme, d’un appui sur sa demande.</p>}
      <div className="dr-pile">
        {demande.page && !demo && (
          <button type="button" className="dr-cta" onClick={() => window.location.assign(avecOnglet(demande.page as string))}>
            <Dessin d={DESSINS_DRESSING.sac} /> Voir les infos du magasin
          </button>
        )}
        {confirme && onSalon && (
          <button type="button" className={demande.page && !demo ? "dr-bis" : "dr-cta"} onClick={onSalon}>
            <Dessin d={DESSINS_DRESSING.partager} /> Partager dans un salon
          </button>
        )}
        <button type="button" className="dr-lien" onClick={onFermer}>
          {confirme ? "Continuer mes achats →" : "Fermer"}
        </button>
      </div>
    </div>
  );
}

/**
 * LA RÉPONSE ARRIVÉE ENTRE-TEMPS. Posée sur l'application et sur la page des
 * boutiques ; elle ne questionne le serveur que si ce téléphone a envoyé une
 * demande (`useMisesDeCote`), et ne rouvre jamais une réponse déjà vue.
 */
export function ReponseDuMagasin() {
  const { demandes } = useMisesDeCote();
  const d = demandes.find((x) => x.etat !== "envoyee" && !x.vue && !suivieIci(x.r));
  if (!d) return null;
  return (
    <Porte>
      <div className="dr-voile" onClick={() => marquerVueCote(d.r)}>
        <div className="dr-feuille" role="dialog" aria-modal="true" aria-label="La réponse du magasin" onClick={(ev) => ev.stopPropagation()}>
          <EcranMagasinConfirme demande={d} onFermer={() => marquerVueCote(d.r)} />
        </div>
      </div>
      <StylesDressing />
    </Porte>
  );
}
