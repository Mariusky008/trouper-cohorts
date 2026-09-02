import { NextResponse } from "next/server";

// LE MANIFESTE DE L'ASSISTANTE.
//
// ─── LE MÊME DÉFAUT QUE POUR « AUTOUR DE MOI », AU MÊME ENDROIT ───────────
//
// « Je n'arrive pas à mettre le lien de l'assistante sur ma page d'accueil du
// téléphone sans que ça me ramène à la page d'accueil clikme.fr. »
//
// La cause est dans `app/layout.tsx` : il déclare `manifest: "/manifest.json"`,
// et ce fichier porte `start_url: "/"`. LE TÉLÉPHONE NE RETIENT PAS LA PAGE
// DEPUIS LAQUELLE ON INSTALLE — il retient ce que le manifeste lui dit
// d'ouvrir. Sans manifeste à elle, l'assistante hérite de celui de la racine et
// devient inatteignable une fois posée sur l'écran d'accueil.
//
// `/autour-de-moi` avait exactement ce défaut et il a été corrigé de cette
// façon. La page de l'assistante est arrivée après, et personne n'y a pensé.
//
// ─── ET C'EST L'ICÔNE QUI COMPTE LE PLUS ICI ──────────────────────────────
//
// Cet écran-là finira sur l'écran d'accueil d'un commerçant, à côté de sa
// banque et de son fournisseur. C'est le seul endroit du produit où l'on est en
// concurrence avec les applications qu'il ouvre vraiment. Elle porte donc son
// propre `id` et son propre nom — « Léa » et pas « Clikme » : ce qu'il ouvre le
// matin, ce n'est pas une plateforme, c'est quelqu'un.
export const dynamic = "force-static";

export async function GET() {
  const manifest = {
    name: "Léa — votre assistante",
    // CE QUI TIENT SOUS UNE ICÔNE, c'est-à-dire une douzaine de signes. « Léa »
    // s'y lit entier, « Assistante Clikme » se ferait couper au milieu.
    short_name: "Léa",
    description: "Racontez-lui votre journée, elle s’occupe du reste.",
    // LES TROIS DOIVENT DÉSIGNER L'ASSISTANTE, ET CHACUN POUR SA RAISON :
    //   · `start_url` décide de ce qui s'ouvre — c'est le défaut corrigé ici ;
    //   · `scope` garde la navigation dans l'application au lieu de rebasculer
    //     dans Safari au premier lien, or l'écran en porte un vers le Direct ;
    //   · `id` empêche le téléphone de confondre cette installation avec celle
    //     d'« Autour de moi » ou du site — sans lui, installer la seconde
    //     écrase la première, et un commerçant a besoin des deux.
    id: "/autour-de-moi/assistante",
    start_url: "/autour-de-moi/assistante",
    scope: "/autour-de-moi",
    display: "standalone",
    // Le fond de l'application, pas le beige du site : c'est ce que le
    // téléphone affiche pendant le lancement, et un éclair clair avant un écran
    // noir se voit.
    background_color: "#05090C",
    theme_color: "#05090C",
    orientation: "portrait",
    icons: [
      { src: "/direct/icone-autour.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/direct/icone-autour-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/direct/icone-autour-masquable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
  return NextResponse.json(manifest, {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8" },
  });
}
