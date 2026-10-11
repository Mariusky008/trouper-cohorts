/**
 * ✏️ LES PICTOGRAMMES DU DRESSING — des traits, comme ceux de Ma Maison : ils
 * prennent la couleur du texte, et restent nets à toutes les tailles.
 */
export const DESSINS_DRESSING = {
  retour: "M15 5l-7 7 7 7M8.5 12H20",
  fermer: "M6 6l12 12M18 6L6 18",
  cintre: "M12 7.6a2.3 2.3 0 1 1 2.3-2.3c0 1.2-1 1.7-1.7 2.1-.4.2-.6.6-.6 1V9M12 9 3.4 15.4c-.9.7-.4 2.1.7 2.1h15.8c1.1 0 1.6-1.4.7-2.1L12 9z",
  photo: "M4 8.5A2.5 2.5 0 0 1 6.5 6h1.7l1.3-2h5l1.3 2h1.7A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-8zM12 16.2a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2z",
  galerie: "M4.5 5.5h15v13h-15zM4.5 15.5l4.5-4.5 4 4 2.5-2.5 4 4M15.5 9.2a1.2 1.2 0 1 0 0-.1",
  tshirt: "M8.5 4 4 6.5l1.8 3.7 2-.9V20h8.4V9.3l2 .9L20 6.5 15.5 4c-.4 1.4-1.8 2.3-3.5 2.3S8.9 5.4 8.5 4z",
  etoile: "M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9L12 3.5zM18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z",
  reglages: "M5 7h9M18 7h1M5 17h3M12 17h7M14 4.8v4.4M8 14.8v4.4",
  plus: "M12 5v14M5 12h14",
  sac: "M6 8h12l-1 12H7L6 8zM9 8V6.5a3 3 0 0 1 6 0V8",
  coeur: "M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z",
  partager: "M12 15V4M8 7.5 12 3.5l4 4M6 11v7.5h12V11",
  cadeau: "M4.5 9.5h15v3h-15zM6 12.5v7h12v-7M12 9.5v10M12 9.5c-1.6 0-4-1-4-2.8 0-1.2 1-1.9 2-1.6 1.2.4 2 2.4 2 4.4zm0 0c1.6 0 4-1 4-2.8 0-1.2-1-1.9-2-1.6-1.2.4-2 2.4-2 4.4z",
  fleche: "M5 12h14M13 6l6 6-6 6",
  chevron: "M9.5 6l6 6-6 6",
  pantalon: "M7 3.5h10l1 16.5h-4.2L12 9.5 10.2 20H6L7 3.5z",
  chaussure: "M3.5 15.5V9.8l3.4.7 2.6 2.2 4.8 1.2 4.6.6c1 .2 1.6 1 1.6 2v1H3.5v-2z",
  casquette: "M4 14.5c0-4.4 3.6-7.5 8-7.5s8 3.1 8 7.5H4zM12 14.5h9",
  lunettes: "M3 11.5h3.8M17.2 11.5H21M6.8 11.5a2.6 2.6 0 1 0 5.2 0 2.6 2.6 0 1 0-5.2 0zM12 11.5a2.6 2.6 0 1 0 5.2 0 2.6 2.6 0 1 0-5.2 0",
  veste: "M9 4 5 6l-1.5 6 2.5.5V20h12v-7.5l2.5-.5L19 6l-4-2-3 3.5L9 4zM12 7.5V20",
} as const;

export function Dessin({ d, plein = false, className }: { d: string; plein?: boolean; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill={plein ? "currentColor" : "none"} stroke={plein ? "none" : "currentColor"}>
      <path d={d} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
