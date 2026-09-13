"use client";

// 📤 ENVOYER SON ESSAI AU COMMERÇANT — le dernier centimètre de l'essayage.
//
// ═══ POURQUOI CE FICHIER EXISTE À CÔTÉ DE `prevenir.ts` ═══════════════════
//
// `prevenir.ts` ÉCRIT LE MESSAGE, celui-ci le FAIT PARTIR — et les deux ne
// peuvent pas vivre ensemble parce que le second ne s'exécute que dans un
// navigateur, avec un `File` et une feuille de partage. Le premier reste du
// texte pur, testable, sans navigateur.
//
// ═══ CE QU'IL FAUT SAVOIR AVANT DE LIRE LE CODE ═══════════════════════════
//
// UNE ADRESSE `wa.me` NE TRANSPORTE PAS D'IMAGE. Il n'existe aucun paramètre
// pour ça, et il n'y en aura pas : WhatsApp ne laisse pas une page web joindre
// un fichier à une conversation. C'est la contrainte, elle ne se contourne pas,
// et tout ce fichier en découle.
//
// LA SEULE FAÇON D'ENVOYER LA PHOTO EST LA FEUILLE DE PARTAGE DU TÉLÉPHONE.
// `navigator.share({ files })` ouvre le panneau d'iOS avec l'image et le texte ;
// WhatsApp y figure, à côté des Messages, du mail et du reste. On ne choisit
// donc pas WhatsApp à la place de la cliente — on lui donne son propre panneau,
// qui contient WhatsApp.
//
// ET ON NE PEUT PAS AVOIR LES DEUX. Ouvrir `wa.me` sur le bon numéro ET joindre
// la photo est impossible dans un navigateur, aujourd'hui. Le choix est donc :
//
//   · LA PHOTO PART, le destinataire est choisi à la main (partage) ;
//   · LE DESTINATAIRE EST PRÉ-REMPLI, la photo ne part pas (wa.me).
//
// ON PRÉFÈRE LA PHOTO, parce que c'est elle qui rend le message utile : « je
// veux ÇA » avec l'image vaut dix lignes de description. Le nom du commerce est
// dans le texte, donc rien ne se perd.
//
// ═══ ET ON N'ANNONCE JAMAIS QUE C'EST ENVOYÉ ══════════════════════════════
//
// Ni le partage ni `wa.me` n'envoient quoi que ce soit : ils OUVRENT. C'est
// encore à la cliente d'appuyer sur « envoyer ». Un écran qui dirait « c'est
// réservé » lui ferait croire que c'est fait, et le salon ne saurait rien —
// exactement le défaut qu'on corrige, en pire, parce que cette fois elle y
// croit. Cette fonction rend donc CE QU'ELLE A FAIT, pas ce qu'elle espère, et
// l'écran doit poser la question. Même règle que `prevenir.ts`.

/** Ce qui s'est réellement passé. Jamais « envoyé » : voir l'en-tête. */
export type Sortie =
  | { par: "partage" }
  | { par: "whatsapp" }
  /** Le partage a été ouvert puis refermé sans rien choisir. */
  | { par: "abandon" }
  /**
   * LE COMMERCE EST INVENTÉ, DONC SON NUMÉRO AUSSI.
   *
   * « Ça ouvre bien WhatsApp mais propose mon propre carnet d'adresses. » Pas un
   * défaut de code : `numeroDeFiction` produit une adresse valide dans sa forme
   * et absente de l'annuaire de WhatsApp, qui s'ouvre alors sur la liste des
   * conversations. On ne l'ouvre donc plus, et on montre le message qui
   * partirait — voir `prevenir` dans `mur-contenu.tsx`.
   */
  | { par: "fiction"; telephone: string }
  | { par: "impossible"; pourquoi: string };

/** Une image en `data:` devient un fichier, seule forme que le partage accepte. */
async function enFichier(image: string, nom: string): Promise<File> {
  const r = await fetch(image);
  const b = await r.blob();
  const ext = b.type.includes("png") ? "png" : "jpg";
  return new File([b], `${nom}.${ext}`, { type: b.type || "image/jpeg" });
}

/**
 * OUVRIR LE PARTAGE AVEC LA PHOTO, OU WHATSAPP SANS ELLE.
 *
 * `texteAvecPhoto` et `texteSansPhoto` viennent tous deux de `prevenirPourEssai`
 * — un message qui dit « voici le rendu » ne doit jamais partir par le chemin
 * qui ne l'emporte pas.
 */
export async function partagerLEssai(o: {
  image: string;
  nom: string;
  texteAvecPhoto: string;
  /**
   * LE CHEMIN DE SECOURS, QUAND LA FEUILLE DE PARTAGE N'EXISTE PAS.
   *
   * IL EST FACULTATIF, ET SEULEMENT POUR « quiconque ». Montrer son essai à ses
   * amis n'a pas de destinataire connu d'avance : le carnet d'adresses est
   * alors le BON écran — c'est là que sont les amis — et c'est le seul endroit
   * du produit où l'ouvrir est juste. Écrire au commerçant, lui, exige son
   * numéro, et `viser: "commercant"` ne part jamais sans.
   */
  whatsapp?: string;
  /**
   * QUI DOIT RECEVOIR, ET C'EST CE QUI DÉCIDE DE L'ORDRE DES DEUX CHEMINS.
   *
   * ═══ LE DÉFAUT, VU SUR UN VRAI TÉLÉPHONE ════════════════════════════════
   *
   * « Quand je veux mettre de côté, ça ouvre WhatsApp mais sur mon répertoire,
   * alors que je devrais être mis en contact avec le commerçant dont je ne
   * connais évidemment pas le numéro. »
   *
   * C'EST EXACT, ET L'ARBITRAGE DE L'EN-TÊTE ÉTAIT LE BON — POUR L'AUTRE
   * BOUTON. « On préfère la photo, parce que c'est elle qui rend le message
   * utile » vaut quand on écrit à quelqu'un qu'on connaît : on le cherche dans
   * sa liste, on le trouve. Ça ne vaut pas du tout quand le destinataire est un
   * commerce dont on n'a pas le numéro — et c'est LE cas de ce bouton-là. La
   * feuille de partage ouvre alors une liste d'amis pour un message adressé à
   * un opticien, c'est-à-dire un cul-de-sac : le numéro n'est nulle part, donc
   * le message ne peut aller nulle part.
   *
   * « commercant » MET DONC LE NUMÉRO D'ABORD. La photo ne part pas — c'est la
   * contrainte de `wa.me`, elle ne se contourne pas — mais le message arrive.
   * Un message qui arrive sans photo vaut infiniment mieux qu'une photo qu'on
   * ne sait pas où envoyer, et l'écran propose la photo juste après, en second
   * geste, pour qui veut.
   *
   * « quiconque » GARDE L'ANCIEN ORDRE, et il a toujours sa place : c'est le
   * chemin de « je montre ça à mes amis », où le destinataire EST dans la liste.
   */
  viser?: "commercant" | "quiconque";
}): Promise<Sortie> {
  /**
   * LE CHEMIN DU COMMERÇANT NE PASSE PAS PAR LA FEUILLE DE PARTAGE.
   * Voir `viser` ci-dessus : sans le numéro, il n'y a pas de message.
   */
  if (o.viser === "commercant") {
    // SANS NUMÉRO, ON N'OUVRE RIEN. Le carnet d'adresses ne contient pas le
    // commerçant : l'ouvrir serait un cul-de-sac, et l'appelant a de quoi
    // dire pourquoi — voir `telFiction` sur le mur.
    if (!o.whatsapp) return { par: "impossible", pourquoi: "aucun numéro" };
    try {
      window.open(o.whatsapp, "_blank", "noopener,noreferrer");
      return { par: "whatsapp" };
    } catch (e) {
      return { par: "impossible", pourquoi: e instanceof Error ? e.message : String(e) };
    }
  }

  const n =
    typeof navigator !== "undefined"
      ? (navigator as Navigator & {
          canShare?: (d: ShareData) => boolean;
          share?: (d: ShareData) => Promise<void>;
        })
      : null;

  if (n?.share && n.canShare) {
    try {
      const fichier = await enFichier(o.image, o.nom);
      const charge = { files: [fichier], text: o.texteAvecPhoto };
      if (n.canShare(charge)) {
        await n.share(charge);
        return { par: "partage" };
      }
    } catch (e) {
      /**
       * « ABORTERROR » N'EST PAS UNE PANNE, C'EST UN REFUS.
       *
       * iOS le lève quand on referme la feuille de partage sans rien choisir.
       * Retomber sur WhatsApp à ce moment-là ouvrirait une application que la
       * personne vient tout juste de refuser — le pire moment pour insister.
       */
      if (e instanceof Error && (e.name === "AbortError" || e.name === "NotAllowedError")) {
        return { par: "abandon" };
      }
      // Toute autre panne : on continue vers WhatsApp, qui marche partout.
    }
  }

  try {
    // ICI, ET ICI SEULEMENT, UNE ADRESSE SANS NUMÉRO EST LA BONNE : on montre
    // son essai à quelqu'un qu'on connaît, donc WhatsApp doit demander lequel.
    window.open(
      o.whatsapp ?? `https://wa.me/?text=${encodeURIComponent(o.texteAvecPhoto)}`,
      "_blank",
      "noopener,noreferrer",
    );
    return { par: "whatsapp" };
  } catch (e) {
    return { par: "impossible", pourquoi: e instanceof Error ? e.message : String(e) };
  }
}
