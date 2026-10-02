// LA PAGE MONTRÉE AUX HABITANTS — une maquette, pas le produit.
//
// Tout le site s'adresse au commerçant. Celle-ci s'adresse à celui qui marche
// dans la rue, et elle sert à savoir si l'idée lui parle avant qu'on la
// construise. Ce qu'elle met en scène et ce qui n'existe pas sont détaillés en
// tête de `apercu-habitant.tsx` et de `lib/direct/apercu-habitant.ts`.
//
// NOINDEX, ET CE N'EST PAS UN DÉTAIL. Une page qui promet une recherche par
// envie et des alertes, indexée sous le même domaine que l'argumentaire
// commerçant, finirait par être le premier résultat pour « clikme » — et par
// vendre à des commerçants des fonctions qui n'existent pas. Elle se partage
// par un lien, à quelques personnes, et à personne d'autre.
import type { Metadata, Viewport } from "next";
import { MARQUE } from "@/lib/marque";
import { ApercuHabitant } from "./apercu-habitant";
import { CopainsDuQuartier, type CopainsProps } from "./copains-du-quartier";
import { VilleOrdinateur, type VilleOrdinateurProps } from "./ville-ordinateur";
import { VilleSelonEcran } from "./ville-selon-ecran";
import { EnCharteMaison } from "@/components/direct/style-maison";
import { toutesLesCartes, type CarteAutour } from "@/lib/direct/apercu-habitant";
import { choisirLesCopains, fantomeDe } from "@/lib/direct/copains";
import { carteDeDemo, estAdresseDeDemo } from "@/lib/site-internet/fiches-demo";
import { lireLeSite } from "@/lib/site-internet/fiche-du-site";

/**
 * `viewport-fit=cover` — SANS LUI, L'IPHONE LAISSE UNE BANDE.
 *
 * Défaut rapporté sur iPhone 16 Pro Max : « un énorme espace libre » sous
 * l'application. Sans cette valeur, Safari encadre la page à l'intérieur des
 * marges de sécurité et peint ces marges avec le fond du site — beige. Avec
 * elle, la page occupe l'écran d'un bord à l'autre et `env(safe-area-inset-*)`
 * rend enfin de vraies valeurs, dont la mise en page a besoin pour ne pas
 * glisser sous l'encoche ni sous la barre gestuelle.
 *
 * Cet objet REMPLACE celui de `app/layout.tsx` : il faut donc y répéter la
 * largeur et l'échelle, sinon on les perdrait.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  // La couleur des barres du système, pour que le noir de l'application ne
  // s'arrête pas net au bord de l'écran.
  themeColor: "#120C09",
};

export const metadata: Metadata = {
  title: { absolute: `Autour de moi — un aperçu de ${MARQUE}` },
  description:
    "Ce qui se passe maintenant à deux cents mètres de vous, et ce que vous pourriez demander. Une idée en test.",
  robots: { index: false, follow: false },
  // SON PROPRE MANIFESTE, sinon « ajouter à l'écran d'accueil » posait l'icône
  // et ouvrait clikme.fr : le manifeste racine porte `start_url: "/"`, et c'est
  // lui que le téléphone suit, pas la page depuis laquelle on installe.
  manifest: "/autour-de-moi/manifest.webmanifest",
  // Sur iPhone, ces deux-là décident du nom sous l'icône et du fait que la
  // barre du navigateur disparaisse. Sans eux, on ouvre un onglet Safari.
  appleWebApp: { capable: true, title: "Autour de moi", statusBarStyle: "black-translucent" },
  /**
   * L'ICÔNE AU SIGNE RECENTRÉ — c'est ici qu'elle est née, et c'est elle que
   * tout le site porte maintenant (voir `icons` dans `app/layout.tsx`).
   *
   * LE SIGNE ÉTAIT DÉCENTRÉ. Défaut rapporté : « le logo sur l'écran
   * d'accueil est étrange, c'est un petit K ». Mesuré dans `icon.svg` : le
   * signe occupe 86 × 128 points sur une tuile de 512 et son centre tombe à
   * (231, 202) au lieu de (256, 256), sur à peine un quart de la largeur.
   * Celui-ci est le même signe, recentré et porté à 285 points de haut.
   *
   * Elle avait d'abord été gardée pour « Autour de moi » seul, pour que les
   * deux installations se distinguent. « Les logos ne sont pas tous
   * identiques, j'aimerais qu'ils soient tous pareils, et plutôt celui-ci,
   * plus gros et visible » : la marque passe avant. Les deux installations
   * restent séparées par leur nom et leur `start_url`.
   * `icon.svg` ne sert plus qu'au logo animé du site.
   */
  icons: {
    icon: [
      { url: "/direct/icone-autour.svg", type: "image/svg+xml" },
      { url: "/direct/icone-autour-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/direct/icone-autour-512.png",
    apple: "/direct/icone-autour-180.png",
  },
};

// LA PASTILLE DU BANDEAU NE PORTE PLUS LA VILLE MAIS LE MÉTIER : on y choisit
// la branche qu'on regarde. Et le lien de retour d'avis a disparu de l'écran —
// il ajoutait une sortie hors de l'application dans une maquette qui doit se
// jouer, pas se commenter. Le retour se demande de vive voix, en montrant.
/**
 * ═══ « EXPLORER MA VILLE », DEPUIS LA PAGE D'UN COMMERCE ═══════════════════
 *
 * `?depuis=` nomme le commerce d'où l'on vient — un commerce de la démonstration
 * (son identifiant), ou une vraie page (son adresse). On retrouve sa carte, on
 * choisit ses deux copains (`lib/direct/copains.ts`), et l'écran des copains
 * passe devant l'application. Sans `depuis`, ou si on ne le retrouve pas,
 * l'application s'ouvre comme d'habitude.
 */
async function leCommerce(depuis: string): Promise<{ carte: CarteAutour; fictif: boolean } | null> {
  if (!depuis || !/^[a-z0-9-]{2,120}$/i.test(depuis)) return null;
  const demo = toutesLesCartes().find((c) => c.id === depuis);
  if (demo) return { carte: demo, fictif: true };
  if (estAdresseDeDemo(depuis)) {
    const c = carteDeDemo(depuis);
    return c ? { carte: c, fictif: true } : null;
  }
  try {
    const site = await lireLeSite(depuis);
    return site ? { carte: site.carte, fictif: false } : null;
  } catch {
    return null;
  }
}

export default async function AutourDeMoiPage({
  searchParams,
}: {
  searchParams: Promise<{ depuis?: string; retour?: string }>;
}) {
  const sp = await searchParams;
  const trouve = await leCommerce(String(sp.depuis ?? ""));
  let copains: CopainsProps | null = null;
  let ville: VilleOrdinateurProps = { copains: [] };
  if (trouve) {
    const { carte } = trouve;
    const choisis = choisirLesCopains(carte, toutesLesCartes());
    // LE RETOUR NE PEUT MENER QUE CHEZ NOUS : une adresse relative, jamais une
    // autre origine glissée dans le lien.
    const retour = String(sp.retour ?? "");
    copains = {
      moi: { nom: carte.nom, metier: carte.metier, ville: carte.ville || "votre ville", fantome: fantomeDe(carte) },
      copains: choisis,
      retour: /^\/(?!\/)/.test(retour) ? retour : undefined,
      // LES COPAINS VIENNENT DE LA DÉMONSTRATION : la page le dit, toujours.
      fictifs: choisis.length > 0,
    };
    ville = {
      moi: { id: carte.id, nom: carte.nom, ville: carte.ville || "votre ville", fantome: fantomeDe(carte) },
      copains: choisis.map((x) => x.id),
      retour: copains.retour,
    };
  }
  // SUR UN ORDINATEUR, LES COPAINS ET LA VILLE SONT LE MÊME ÉCRAN — voir
  // `VilleOrdinateur`. Sur un téléphone, rien ne change : l'écran des
  // copains passe devant l'application.
  return (
    <VilleSelonEcran
      ordinateur={<VilleOrdinateur {...ville} />}
      telephone={
        // L'APPLICATION AUX COULEURS DE LA MAISON : nuit brune et rose, au
        // lieu de la nuit bleue et de la menthe — voir `StyleMaison`.
        <EnCharteMaison>
          <ApercuHabitant />
          {copains && <CopainsDuQuartier {...copains} />}
        </EnCharteMaison>
      }
    />
  );
}
