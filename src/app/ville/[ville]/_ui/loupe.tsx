"use client";

// LA CARTE DU JOUR, EN ENTIER.
//
// LE DÉFAUT : on appuyait sur la photo de l'ardoise d'un restaurant et on
// atterrissait sur son site. Or la photo d'un menu N'EST PAS une illustration :
// c'est le contenu. La vignette de la carte du fil la montre en 280 px de haut,
// cadrée — la moitié des plats est hors champ, et le seul geste naturel (appuyer
// dessus pour la voir en grand) menait ailleurs.
//
// CE QUE FAIT CE COMPOSANT, et rien de plus : il montre l'image entière, à la
// largeur de l'écran, dans un conteneur qui défile. Une ardoise est verticale et
// haute ; la faire tenir dans la hauteur de l'écran la rendrait illisible, alors
// que la faire défiler la rend lisible sans rien apprendre à personne.
//
// LE PINCEMENT POUR ZOOMER RESTE CELUI DU SYSTÈME. On ne réimplémente pas le
// zoom : celui du navigateur fonctionne déjà sur une image dans une page, et
// toute imitation serait moins bonne — et différente d'un téléphone à l'autre.
import { useEffect } from "react";

export function Loupe({ src, alt, onFermer }: { src: string; alt: string; onFermer: () => void }) {
  // Échap ferme, et le fond de page ne défile plus derrière : sans ça, le
  // défilement du menu entraîne le fil de la ville dès qu'on arrive en bas.
  useEffect(() => {
    const auClavier = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
    };
    window.addEventListener("keydown", auClavier);
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", auClavier);
      document.body.style.overflow = avant;
    };
  }, [onFermer]);

  return (
    <div className="loupe" role="dialog" aria-modal="true" aria-label={alt}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .loupe{position:fixed;inset:0;z-index:90;background:rgba(10,14,12,.94);
            -webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);
            display:flex;flex-direction:column;}
          /* Le conteneur défile ; l'image garde ses proportions. Une ardoise
             haute se lit en descendant, pas en plissant les yeux. */
          .loupe .zone{flex:1;overflow:auto;-webkit-overflow-scrolling:touch;padding:56px 10px 24px;}
          .loupe .zone img{display:block;width:100%;max-width:760px;margin:0 auto;height:auto;
            border-radius:12px;background:#1B211D;}
          .loupe .fermer{position:absolute;top:10px;right:10px;z-index:2;
            border:none;border-radius:999px;background:rgba(255,255,255,.92);color:#12141A;
            width:42px;height:42px;font-size:19px;font-weight:800;cursor:pointer;font-family:inherit;
            box-shadow:0 8px 24px -12px rgba(0,0,0,.6);}
          .loupe .aide{position:absolute;top:19px;left:14px;z-index:2;color:#DCE8E1;font-size:12.5px;font-weight:700;}
          `,
        }}
      />
      <span className="aide">{alt}</span>
      <button type="button" className="fermer" onClick={onFermer} aria-label="Fermer">
        ✕
      </button>
      {/* Appuyer à côté de l'image ferme aussi — c'est le geste qu'on tente en
          premier, avant de chercher la croix. */}
      <div
        className="zone"
        onClick={(e) => {
          if (e.target === e.currentTarget) onFermer();
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} />
      </div>
    </div>
  );
}
