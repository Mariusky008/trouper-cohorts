// L'IMAGE DE PARTAGE DE LA MARQUE, POUR LES PAGES QUI ÉCRIVENT LEUR PROPRE APERÇU.
//
// `app/opengraph-image.tsx` la fabrique ; Next la pose d'office sur les pages
// qui n'écrivent pas d'`openGraph`. Mais dès qu'une page écrit le sien — son
// titre, sa description —, Next ne la lui donne plus : « Le Direct de Dax » ou
// la page d'un commerce partaient dans WhatsApp sans aucune image. Ces pages la
// nomment donc ici, explicitement.
//
// LE `?v=` CHANGE QUAND LA CHARTE CHANGE. WhatsApp et les réseaux gardent les
// images en cache par adresse : une nouvelle image sous l'ancienne adresse
// peut mettre des jours à apparaître.
import { MARQUE } from "@/lib/marque";

export const IMAGE_DE_PARTAGE = {
  url: "/opengraph-image?v=charte-brune",
  width: 1200,
  height: 630,
  alt: `${MARQUE} — ta ville, à essayer et à partager`,
};
