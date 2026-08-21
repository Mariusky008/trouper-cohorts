// CE QU'ON VOIT PENDANT QUE L'ONGLET SE CHARGE.
//
// LE DÉFAUT. Les quatre onglets sont des pages serveur en `force-dynamic` :
// chacune enchaîne une dizaine de lectures avant de rendre quoi que ce soit.
// Sans frontière Suspense au-dessus, le navigateur reste sur l'écran PRÉCÉDENT
// tout ce temps — rien ne bouge, l'onglet appuyé ne s'allume même pas, et on
// appuie une deuxième fois en croyant que c'est bloqué. C'était la première
// chose qu'on remarquait en utilisant l'application.
//
// Ce fichier ne rend pas le chargement plus rapide : il le rend VISIBLE. Le
// navigateur peut alors envoyer la coque immédiatement — la barre d'onglets
// comprise, donc l'onglet allumé — et remplir la vue quand les données
// arrivent.
//
// POURQUOI ICI ET PAS À LA RACINE DU SITE. Une frontière Suspense transforme
// tout `notFound()` situé en dessous en 404 « mou » : HTTP 200 avec la page
// d'erreur dedans. Un `loading.tsx` racine avait déjà causé exactement ça sur
// tout le site (voir `src/app/not-found.tsx`). Celui-ci ne couvre que
// `/ville/**`, et le seul `notFound()` qui s'y trouve — celui d'un clik
// introuvable — a été déplacé dans `generateMetadata`, qui s'exécute avant
// l'envoi de la coque et produit un vrai 404.
//
// LE SQUELETTE IMITE LA FORME, PAS LE CONTENU. Trois blocs sombres aux
// proportions d'une carte : on reconnaît l'écran qui arrive, sans lire un
// faux texte qu'il faudrait ensuite remplacer.
export default function ChargementVille() {
  return (
    <div className="chg" aria-busy="true" aria-live="polite">
      <span className="sr-only">Chargement…</span>
      <div className="chg-t" />
      <div className="chg-c" />
      <div className="chg-c court" />
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .chg{padding:22px 16px;display:flex;flex-direction:column;gap:14px;}
        .chg .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);}
        .chg-t{height:26px;width:52%;border-radius:9px;}
        .chg-c{height:190px;border-radius:20px;}
        .chg-c.court{height:120px;}
        /* Une seule animation pour les trois, décalée : trois pulsations
           synchrones se lisent comme un clignotement, une vague se lit comme
           un chargement. */
        .chg-t,.chg-c{background:linear-gradient(100deg,rgba(255,255,255,.05) 30%,rgba(255,255,255,.11) 50%,rgba(255,255,255,.05) 70%);
          background-size:220% 100%;animation:chgOnde 1.4s ease-in-out infinite;}
        .chg-c{animation-delay:.12s;}
        .chg-c.court{animation-delay:.24s;}
        @keyframes chgOnde{from{background-position:180% 0}to{background-position:-60% 0}}
        @media (prefers-reduced-motion:reduce){
          .chg-t,.chg-c{animation:none;background:rgba(255,255,255,.07);}
        }
      `,
        }}
      />
    </div>
  );
}
