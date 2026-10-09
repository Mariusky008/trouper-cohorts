/**
 * « BIENVENUE AU BOCAL », ET NON « À LE BOCAL ».
 *
 * Le nom vient de Google, avec son article. La phrase doit le contracter comme
 * on le dirait — au, aux, à la, à l' — sinon la première ligne de la page, la
 * plus grosse, porte une faute qu'un restaurateur verra avant tout le reste.
 *
 * LA PAGE ET SON IMAGE DE PARTAGE LA DISENT TOUTES DEUX : la vignette qu'on
 * reçoit dans WhatsApp reprend le titre de la page qu'elle ouvre. Fichier
 * partagé, lu par le navigateur et par le serveur.
 */

/** « Le Bocal » → ["au", "Bocal"] : le petit mot, puis le nom tel qu'on l'écrit. */
export function aLaMaisonEnDeux(nom: string): [string, string] {
  /* SANS ÉGARD À LA CASSE : « le bordeaux », tapé en minuscules, donnait
     « Bienvenue à le bordeaux ». L'article se contracte quelle que soit la
     façon dont il a été écrit, et le nom qui suit garde sa capitale. */
  const cap = (s: string) => s.replace(/^(\p{L})/u, (x) => x.toUpperCase());
  // « Bienvenue à Chez Bergine » → « Bienvenue chez Bergine ».
  if (/^chez\s/i.test(nom)) return ["chez", cap(nom.slice(5))];
  if (/^le\s/i.test(nom)) return ["au", cap(nom.slice(3))];
  if (/^les\s/i.test(nom)) return ["aux", cap(nom.slice(4))];
  if (/^la\s/i.test(nom)) return ["à la", cap(nom.slice(3))];
  // L'ÉLISION RESTE AVEC LE NOM : « à » / « l’Atelier », jamais « à l’ » seul en bout de ligne.
  if (/^l['’]/i.test(nom)) return ["à", `l’${cap(nom.slice(2))}`];
  if (/^(un|une)\s/i.test(nom)) return ["à", `${nom[0].toLowerCase()}${nom.slice(1)}`];
  return ["à", nom];
}

/** « au Bocal », « à l’Atelier », « chez Bergine ». */
export function aLaMaison(nom: string): string {
  return aLaMaisonEnDeux(nom).join(" ");
}
