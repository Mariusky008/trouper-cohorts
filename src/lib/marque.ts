// Le nom de la marque, en UN seul endroit.
//
// Le produit change de nom (Popey → Clikme) : sans point unique, le changement
// se fait à 495 endroits, et il en reste toujours un — typiquement l'adresse
// d'expédition des e-mails ou un titre de page. Tout ce qui est VISIBLE par un
// commerçant ou un habitant doit passer par ici.
//
// Ne couvre pas : les identifiants techniques (slugs, clés de stockage, noms de
// tables), qui ne se renomment pas sans migration et que personne ne lit.
export const MARQUE = "Popey";

/** Le nom au fil du texte, quand il est précédé d'un article : « le catalogue {MARQUE} ». */
export const MARQUE_LONG = `${MARQUE}`;
