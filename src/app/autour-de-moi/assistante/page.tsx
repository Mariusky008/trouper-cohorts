// L'ESPACE COMMERÇANT — l'enveloppe et la feuille de style.
//
// NOINDEX : c'est l'écran d'un commerçant, pas une page publique, et il n'y a
// pas encore de compte — le manque le plus serieux du produit, et il est note.
//
// ATTENTION : PAS D'ACCENT GRAVE DANS LES COMMENTAIRES CSS ci-dessous. Le bloc
// est un litteral de gabarit ; un seul accent grave terminerait la chaine.
// `npm run verifier:styles` le mesure — et l'a deja mesure six fois.
import type { Metadata, Viewport } from "next";
import { MARQUE } from "@/lib/marque";
import { Assistante } from "./assistante";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#05090C",
};

export const metadata: Metadata = {
  title: { absolute: `Votre assistante — ${MARQUE}` },
  robots: { index: false, follow: false },
};

function Styles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
/* AUSSI SIMPLE QU'UNE MESSAGERIE, ET C'EST LE TEST A PASSER : on doit pouvoir
   dire a un commercant « voila votre assistante, parlez-lui » sans rien ajouter.
   S'il cherche ou creer son annonce, l'ecran a echoue. */
.as{--nuit:#05090C;--nuit2:#0E1614;--craie:#EAF2EC;--craie2:#93A79C;
  --craie3:#6C8078;--menthe:#3DE2A6;--or:#F0B429;--rouge:#FF6B6B;
  --trait:rgba(234,242,236,.13);
  min-height:100dvh;display:flex;flex-direction:column;
  background:var(--nuit);color:var(--craie);
  font-family:'Inter',system-ui,-apple-system,sans-serif}
.as *{box-sizing:border-box}

.as-h{flex:none;display:flex;align-items:center;justify-content:space-between;
  padding:14px clamp(14px,4vw,26px);border-bottom:1px solid var(--trait)}
.as-h b{font-size:15px;font-weight:850;letter-spacing:-.02em;color:var(--menthe)}
.as-h a{text-decoration:none;font-size:13px;font-weight:750;color:var(--craie3)}

.as-qui{flex:none;padding:18px clamp(14px,4vw,26px) 6px}
.as-qui h1{margin:0;font-size:clamp(22px,5.5vw,30px);letter-spacing:-.03em}
.as-qui p{margin:4px 0 0;font-size:13px;color:var(--craie3)}

/* ─── LE FIL ───
   Deux bulles, et rien d'autre. Pas d'horodatage, pas d'avatar, pas d'accuse de
   lecture : chaque ornement d'une messagerie ajouterait une chose a comprendre
   a quelqu'un qui n'a rien demande. */
.as-fil{flex:1;min-height:0;overflow-y:auto;
  padding:14px clamp(14px,4vw,26px) 8px;
  display:flex;flex-direction:column;gap:10px}
.as-elle,.as-lui{margin:0;max-width:86%;padding:12px 15px;border-radius:18px;
  font-size:15.5px;line-height:1.45}
.as-elle{align-self:flex-start;border-bottom-left-radius:6px;
  color:var(--craie);background:var(--nuit2);border:1px solid var(--trait)}
.as-lui{align-self:flex-end;border-bottom-right-radius:6px;
  color:#04150E;background:var(--menthe);font-weight:600}
.as-points{display:flex;gap:5px;align-items:center;padding:16px 17px}
.as-points i{width:6px;height:6px;border-radius:50%;background:var(--craie3);
  animation:asPense 1.2s ease-in-out infinite}
.as-points i:nth-child(2){animation-delay:.15s}
.as-points i:nth-child(3){animation-delay:.3s}
@keyframes asPense{0%,60%,100%{opacity:.25}30%{opacity:1}}
@media (prefers-reduced-motion:reduce){.as-points i{animation:none;opacity:.6}}

/* ═══ LA CARTE DE VALIDATION ═══
   TROIS CHIFFRES, GROS, ET UN SEUL BOUTON VERT. Ce n'est pas un apercu de
   l'annonce : un apercu se survole et se valide sans lire. Ce sont les trois
   valeurs qui peuvent etre fausses — le prix, la quantite, l'heure — sorties du
   texte et grossies, parce que c'est exactement la que le vocal se trompe. Une
   erreur coute alors un doigt au lieu d'une journee. */
.as-carte{align-self:stretch;margin:4px 0;padding:15px 16px;border-radius:18px;
  background:rgba(61,226,166,.07);border:1px solid rgba(61,226,166,.35)}
.as-carte h2{margin:0;font-size:17px;font-weight:850;letter-spacing:-.02em;
  display:flex;align-items:baseline;gap:9px;flex-wrap:wrap}
.as-carte h2 em{font-style:normal;font-size:10.5px;font-weight:850;
  letter-spacing:.1em;text-transform:uppercase;color:var(--or)}
.as-d{margin:5px 0 0;font-size:13.5px;line-height:1.4;color:var(--craie2)}
.as-cles{list-style:none;margin:13px 0 0;padding:0;display:grid;
  grid-template-columns:repeat(3,1fr);gap:9px}
.as-cles li{padding:10px 11px;border-radius:13px;background:rgba(5,9,12,.5);
  border:1px solid var(--trait);text-align:center}
.as-cles b{display:block;font-size:19px;font-weight:850;letter-spacing:-.02em;
  font-variant-numeric:tabular-nums}
.as-cles em{display:block;margin-top:2px;font-style:normal;font-size:10.5px;
  letter-spacing:.06em;text-transform:uppercase;color:var(--craie3)}
.as-valide{display:flex;gap:9px;margin-top:13px}
.as-oui{flex:1;font:inherit;font-size:16px;font-weight:850;color:#04150E;
  cursor:pointer;border:0;border-radius:14px;padding:15px;background:var(--menthe)}
.as-non{flex:none;font:inherit;font-size:14px;font-weight:750;color:var(--craie2);
  cursor:pointer;background:transparent;border:1px solid var(--trait);
  border-radius:14px;padding:15px 17px}

.as-retour{align-self:flex-start;margin:0;font-size:12.5px;color:var(--or)}
.as-echo{align-self:flex-start;margin:0;font-size:12.5px;color:var(--rouge)}

.as-bas{flex:none;padding:10px clamp(14px,4vw,26px) calc(12px + env(safe-area-inset-bottom));
  border-top:1px solid var(--trait);background:var(--nuit)}
.as-vivant{margin:0 0 9px;font-size:14.5px;line-height:1.4;color:var(--craie2)}
.as-saisie{display:flex;align-items:center;gap:9px}
/* LE MICRO EST L'ACTION PRINCIPALE : c'est la seule interface qui ne demande pas
   d'apprendre un geste. Il est gros parce qu'on appuie dessus debout, dans le
   bruit, avec une main. */
.as-micro{flex:none;width:56px;height:56px;border-radius:50%;font-size:22px;
  cursor:pointer;border:0;color:#04150E;background:var(--menthe)}
.as-micro.on{color:#fff;background:var(--rouge);
  animation:asBat 1.6s ease-out infinite}
@keyframes asBat{
  0%{box-shadow:0 0 0 0 rgba(255,107,107,.55)}
  70%{box-shadow:0 0 0 18px rgba(255,107,107,0)}
  100%{box-shadow:0 0 0 0 rgba(255,107,107,0)}
}
@media (prefers-reduced-motion:reduce){.as-micro.on{animation:none}}
.as-micro:disabled{opacity:.4}
/* ET LE CLAVIER NE SE CACHE PAS. S'il rate deux fois, il doit pouvoir taper
   sans chercher un bouton — c'est la condition qu'on s'est donnee en choisissant
   le vocal comme entree principale. */
.as-saisie input{flex:1;min-width:0;font:inherit;font-size:16px;
  color:var(--craie);background:var(--nuit2);border:1px solid var(--trait);
  border-radius:999px;padding:15px 17px}
.as-saisie input::placeholder{color:#4B5A54}
.as-saisie input:focus{outline:2px solid var(--menthe);outline-offset:1px}
.as-env{flex:none;width:44px;height:44px;border-radius:50%;font-size:17px;
  font-weight:850;cursor:pointer;color:var(--craie);background:var(--nuit2);
  border:1px solid var(--trait)}
.as-env:disabled{opacity:.3}

/* LA BARRE DE DEMONSTRATION — hors du produit du commercant, et elle en a l'air. */
.as-demo{display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin-top:11px}
.as-demo span{font-size:10px;font-weight:850;letter-spacing:.12em;
  text-transform:uppercase;color:#3E4C46}
.as-demo button{font:inherit;font-size:11.5px;font-weight:750;cursor:pointer;
  color:var(--craie3);background:transparent;border:1px solid var(--trait);
  border-radius:999px;padding:5px 11px}
.as-demo button.on{color:#04150E;background:var(--or);border-color:var(--or)}
.as-demo button:disabled{opacity:.35}
.as-raz{margin-left:auto;text-decoration:underline;border:0 !important}

/* LA PHOTO SUR LA CARTE DE VALIDATION. Le bouton se voit quand Lea l'a
   demandee, et reste discret sinon : elle est facultative, et une image
   reclamee a chaque annonce se fait ignorer des le troisieme jour. */
.as-photo{display:block;margin-top:12px;cursor:pointer}
.as-photo input{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
.as-photo span{display:block;text-align:center;font-size:14px;font-weight:800;
  color:var(--craie2);background:rgba(5,9,12,.5);border:1px dashed var(--trait);
  border-radius:13px;padding:14px}
.as-photo.demande span{color:var(--or);border-style:solid;
  border-color:rgba(240,180,41,.55);background:rgba(240,180,41,.09)}
.as-vue{display:block;width:100%;margin-top:12px;border-radius:13px;
  aspect-ratio:16/10;object-fit:cover;cursor:pointer}

/* MAINS LIBRES. Petit, parce qu'on n'y touche presque jamais ; visible, parce
   que le jour ou il faut le couper il faut le trouver tout de suite. */
.as-mains{display:flex;align-items:center;gap:9px;margin-top:10px}
.as-mains button{font:inherit;font-size:11.5px;font-weight:750;cursor:pointer;
  color:var(--craie3);background:transparent;border:1px solid var(--trait);
  border-radius:999px;padding:5px 12px}
.as-mains button.on{color:var(--menthe);border-color:rgba(61,226,166,.4)}
.as-mains em{font-style:normal;font-size:11.5px;color:var(--menthe)}

.as-voir{display:block;margin-top:11px;text-align:center;text-decoration:none;
  font-size:14px;font-weight:800;color:var(--menthe)}

/* ─── LE CHOIX DU METIER, AU DEBUT DE LA DEMONSTRATION ─── */
.as-choix{flex:1;padding:26px clamp(14px,4vw,26px)}
.as-choix h1{margin:0;font-size:clamp(24px,6vw,34px);letter-spacing:-.03em}
.as-choix p{margin:10px 0 0;font-size:15px;line-height:1.55;color:var(--craie2);
  max-width:42ch}
.as-choix .as-n{font-size:12.5px;color:var(--craie3)}
.as-metiers{margin-top:20px;display:grid;grid-template-columns:1fr 1fr;gap:10px}
.as-metiers button{font:inherit;text-align:left;cursor:pointer;
  padding:14px 15px;border-radius:15px;color:var(--craie);
  background:var(--nuit2);border:1px solid var(--trait)}
.as-metiers button:hover{border-color:var(--menthe)}
.as-metiers b{display:block;font-size:15px;font-weight:800}
.as-metiers em{display:block;margin-top:3px;font-style:normal;font-size:12px;
  color:var(--craie3)}

@media(max-width:420px){.as-metiers{grid-template-columns:1fr}}
        `,
      }}
    />
  );
}

export default function Page() {
  return (
    <>
      <Styles />
      <Assistante />
    </>
  );
}
