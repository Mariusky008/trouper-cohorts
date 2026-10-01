/**
 * 🔤 UN NOM DE COMMERCE TAPÉ EN MINUSCULES REDEVIENT UN NOM PROPRE.
 *
 * « J'ai rentré un restaurant "le bordeaux" à Dax » — et sa page titrait
 * « Bienvenue à le bordeaux. » Deux fautes en trois mots : l'article qui ne
 * se contracte pas, et un nom propre écrit comme un nom commun.
 *
 * ON NE TOUCHE QU'À CE QUI EST ENTIÈREMENT EN MINUSCULES. Un nom saisi avec
 * ses majuscules est le sien — « L'atelier de Zoé », « MOMA », « chez Paulo »
 * écrit exprès — et on le garde tel quel. Seul le nom tapé vite, tout en bas
 * de casse, est redressé : chaque mot prend sa capitale, sauf les petits mots
 * de liaison au milieu (« Le Café de la Gare »).
 */
const PETITS = new Set(["de", "du", "des", "la", "le", "les", "et", "à", "au", "aux", "en", "sur", "sous", "chez"]);

export function nomPropre(brut: string): string {
  const nom = brut.trim().replace(/\s+/g, " ");
  if (!nom || nom !== nom.toLowerCase()) return nom;
  return nom
    .split(" ")
    .map((mot, i) => {
      if (i > 0 && PETITS.has(mot)) return mot;
      // « l'atelier » → « L'Atelier », « d'artagnan » → « d'Artagnan » au milieu
      const m = /^([ldjmnst]['’])(.*)$/.exec(mot);
      if (m) return (i === 0 ? m[1][0].toUpperCase() + m[1].slice(1) : m[1]) + cap(m[2]);
      return cap(mot);
    })
    .join(" ");
}

const cap = (m: string) => m.replace(/^(\p{L})/u, (c) => c.toUpperCase()).replace(/-(\p{L})/gu, (_x, c: string) => `-${c.toUpperCase()}`);
