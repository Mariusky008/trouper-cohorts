// UNE FRONTIÈRE DE SUSPENSE, POSÉE LÀ OÙ ELLE EST NÉCESSAIRE — ET NULLE PART
// AILLEURS.
//
// CE QUI S'EST PASSÉ, ET IL FAUT LE RACONTER ENTIER PARCE QUE LES DEUX DÉFAUTS
// ONT LA MÊME CAUSE.
//
// `src/app/loading.tsx` — un écran d'attente générique — vivait à la RACINE de
// l'application. Un fichier `loading.tsx` crée une frontière de Suspense sur
// tout ce qu'il couvre : posé à la racine, il en créait donc une autour de
// CHAQUE page du site. Personne ne l'avait voulu ainsi, et il rendait deux
// services invisibles :
//
//   1. IL AVALAIT LES CODES 404. Next envoie l'enveloppe HTML — et avec elle le
//      code 200 — dès qu'il rencontre une frontière. Tout `notFound()` appelé
//      ensuite arrivait trop tard : les liens morts du site répondaient « tout
//      va bien » à Google. C'est pour ça que le fichier a été retiré.
//
//   2. IL SATISFAISAIT `useSearchParams()`. Ce crochet EXIGE une frontière de
//      Suspense au-dessus de lui pour qu'une page puisse être pré-rendue au
//      build. Six écrans du projet l'utilisent sans en avoir une à eux ; ils
//      empruntaient celle de la racine sans le savoir. Le fichier retiré, la
//      compilation s'est arrêtée sur le premier d'entre eux.
//
// LA BONNE RÉPONSE N'EST PAS DE REMETTRE LE FICHIER RACINE : ce serait
// réintroduire le défaut nº 1 pour corriger le nº 2. Chaque écran concerné pose
// donc SA frontière, ici, à l'endroit exact où le crochet est utilisé — ce qui
// est de toute façon ce que la documentation demande. Les autres routes gardent
// leurs vrais 404.
//
// Le repli est volontairement sobre : ces écrans sont des pages d'ancien
// produit ou d'administration, la frontière ne se voit qu'une fraction de
// seconde, et un grand visuel à cet endroit serait plus visible que la page.
import { Suspense, type ReactNode } from "react";

export function FrontiereSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div aria-hidden="true" style={{ minHeight: "100dvh" }} />}>{children}</Suspense>;
}
