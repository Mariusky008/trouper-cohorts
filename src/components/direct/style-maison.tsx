"use client";

// 🎨 UNE FEUILLE DE STYLE QUI PREND LES COULEURS DE LA MAISON, QUAND ON LE LUI DEMANDE.
//
// « Pour /autour-de-moi, changer les fonds pour la nouvelle charte, qui est
// plus dans les marrons et le rose. »
//
// L'APPLICATION EST FAITE D'UNE VINGTAINE D'ÉCRANS, et chacun pose sa feuille :
// l'écran de choix, les parcours, la soirée, l'avant-goût… Les repeindre un
// par un, c'était vingt palettes à réécrire, et autant d'oublis possibles.
// Certains servent aussi ailleurs (l'accueil du site, la visite guidée), où ils
// gardent leurs couleurs. D'où un interrupteur, posé une fois en haut de
// l'application (`EnCharteMaison`) : chaque feuille écrite avec `StyleMaison`
// se repeint quand il est allumé — voir `enCharteMaison` —, et reste telle
// quelle ailleurs.
//
// LA FORME EST CELLE D'UNE BALISE <style> : on écrit `<StyleMaison
// dangerouslySetInnerHTML={{ __html: ... }} />`, et la garde des feuilles en
// ligne (`scripts/verifier-styles-en-ligne.mjs`) les lit comme avant.
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { enCharteMaison } from "@/lib/direct/charte-maison";

const CharteMaison = createContext(false);

/** Tout ce qui est dessous prend les couleurs de la maison. */
export function EnCharteMaison({ children }: { children: ReactNode }) {
  return <CharteMaison.Provider value>{children}</CharteMaison.Provider>;
}

export function StyleMaison({
  dangerouslySetInnerHTML,
  force = false,
  href,
  precedence,
}: {
  dangerouslySetInnerHTML: { __html: string };
  /** Repeindre même sans interrupteur — l'atelier d'une page commerçant. */
  force?: boolean;
  /**
   * UNE FEUILLE REMONTÉE DANS L'EN-TÊTE ET GARDÉE UNE SEULE FOIS (voir
   * `StylesDirect`). Repeinte, elle change de nom : React n'en garde qu'une
   * par nom, et il ne faut pas qu'il confonde les deux couleurs.
   */
  href?: string;
  precedence?: string;
}) {
  const maison = useContext(CharteMaison) || force;
  const brut = dangerouslySetInnerHTML.__html;
  const html = useMemo(() => (maison ? enCharteMaison(brut) : brut), [maison, brut]);
  if (href) {
    return (
      <style href={maison ? `${href}-maison` : href} precedence={precedence} dangerouslySetInnerHTML={{ __html: html }} />
    );
  }
  return <style dangerouslySetInnerHTML={{ __html: html }} />;
}
