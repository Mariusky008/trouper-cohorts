// MON COMMERCE — l'enveloppe et la feuille de style.
//
// NOINDEX : c'est l'écran du commerçant, il montre ce que ses annonces ont
// produit, et il n'a rien à faire dans un moteur de recherche.
//
// ATTENTION : PAS D'ACCENT GRAVE DANS LES COMMENTAIRES CSS ci-dessous. Le bloc
// est un littéral de gabarit ; un seul accent grave terminerait la chaîne.
// `npm run verifier:styles` le mesure — déjà payé six fois.
import type { Metadata, Viewport } from "next";
import { MARQUE } from "@/lib/marque";
import { MonCommerce } from "./mon-commerce";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#05090C",
};

export const metadata: Metadata = {
  title: { absolute: `Mon commerce — ${MARQUE}` },
  robots: { index: false, follow: false },
};

function Styles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
/* Le monde de l'application, en version outil — comme l'ecran de preparation :
   meme fond, meme menthe, mais des lignes larges et des libelles lisibles
   debout derriere un comptoir, souvent d'une seule main. */
.mc{--nuit:#05090C;--nuit2:#0E1614;--craie:#EAF2EC;--craie2:#93A79C;
  --craie3:#6C8078;--menthe:#3DE2A6;--or:#F0B429;
  --trait:rgba(234,242,236,.13);
  min-height:100vh;background:var(--nuit);color:var(--craie);
  font-family:'Inter',system-ui,-apple-system,sans-serif;
  padding:clamp(16px,4vw,40px);max-width:720px;margin:0 auto}
.mc *{box-sizing:border-box}
.mc-h{padding-bottom:18px;border-bottom:1px solid var(--trait)}
.mc-oeil{margin:0;font-size:11px;font-weight:850;letter-spacing:.2em;
  text-transform:uppercase;color:var(--menthe)}
.mc h1{margin:6px 0 0;font-size:clamp(24px,6vw,34px);font-weight:900;
  letter-spacing:-.03em;line-height:1.05}
.mc-m{margin:6px 0 0;font-size:14px;color:var(--craie2)}
.mc section{margin-top:28px}
.mc-t{margin:0;font-size:11.5px;font-weight:850;letter-spacing:.14em;
  text-transform:uppercase;color:var(--craie3)}
.mc-n{margin:6px 0 0;font-size:13px;line-height:1.5;color:var(--craie2)}

/* ─── CE QUE CA A DONNE ───
   En premier, et c'est delibere : la recompense avant la corvee. Un ecran qui
   ouvre sur « qu'allez-vous publier ? » est un formulaire ; un ecran qui ouvre
   sur « voila ce que ca a produit » est une raison de l'ouvrir. */
.mc-bilan{margin-top:24px;padding:18px;border-radius:18px;
  background:rgba(61,226,166,.07);border:1px solid rgba(61,226,166,.24)}
.mc-b-quoi{margin:8px 0 0;font-family:Georgia,serif;font-size:19px;
  font-weight:700;letter-spacing:-.02em}
.mc-chiffres{display:flex;flex-wrap:wrap;gap:26px;margin-top:14px}
.mc-chiffres span{display:block;font-size:12.5px;line-height:1.35;
  color:var(--craie2);max-width:16ch}
.mc-chiffres b{display:block;font-size:30px;font-weight:900;color:var(--menthe);
  letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.mc-b-mot{margin:14px 0 0;font-size:12.5px;line-height:1.5;color:var(--craie3)}

/* ─── REMETTRE ───
   Le bouton est a droite et il est plein : c'est le seul geste de l'ecran, et
   il doit se toucher d'un pouce sans viser. */
.mc-liste{list-style:none;margin:12px 0 0;padding:0;display:flex;
  flex-direction:column;gap:8px}
.mc-liste li{display:flex;align-items:center;gap:12px;padding:12px 13px;
  border-radius:14px;background:var(--nuit2);border:1px solid var(--trait)}
.mc-l{flex:1;min-width:0}
.mc-l b{display:block;font-size:15px;font-weight:800;letter-spacing:-.01em}
.mc-l em{display:block;margin-top:3px;font-style:normal;font-size:12px;
  color:var(--craie3)}
.mc-b{flex:none;font:inherit;font-size:13.5px;font-weight:850;cursor:pointer;
  color:#04150E;background:var(--menthe);border:0;border-radius:999px;
  padding:11px 17px}
.mc-b.on{color:var(--menthe);background:rgba(61,226,166,.12);
  border:1px solid rgba(61,226,166,.4)}
.mc-b:active{transform:scale(.97)}
.mc-ok{margin:12px 0 0;font-size:13px;color:var(--menthe)}

/* ═══ QU'EST-CE QU'ON MET EN AVANT AUJOURD'HUI ? ═══════════════════════════

   LE SEUL GESTE QUOTIDIEN D'UNE BOUTIQUE DE VETEMENTS. Il n'a pas de fournee a
   remettre, il a une piece a designer — et ce bloc doit se traverser d'un
   pouce, debout derriere un comptoir, en moins de dix secondes.

   LA SUGGESTION RESSEMBLE A UNE CARTE, PAS A UN FORMULAIRE. Une photo, un nom,
   une phrase qui dit pourquoi celle-la : c'est ce qui transforme « laquelle
   aujourd'hui ? » en un oui ou un non. */
.mc-avant-sug,.mc-avant-on{display:flex;align-items:center;gap:13px;
  margin-top:12px;padding:12px;border-radius:16px;background:var(--nuit2);
  border:1px solid var(--trait)}
.mc-avant-sug img,.mc-avant-on img{flex:none;width:76px;height:96px;
  object-fit:cover;object-position:center 22%;border-radius:11px;display:block}
.mc-avant-l{flex:1;min-width:0}
.mc-avant-l b{display:block;font-size:16px;font-weight:850;
  letter-spacing:-.015em;line-height:1.15}
.mc-avant-l em{display:block;margin-top:5px;font-style:normal;font-size:12.5px;
  line-height:1.45;color:var(--craie2)}
.mc-avant-l s{display:block;margin-top:6px;text-decoration:none;font-size:12px;
  font-weight:800;color:var(--craie3)}
/* L'ETIQUETTE DU JOUR EN PETIT, AU-DESSUS DU NOM. C'est le meme mot que le
   client verra en grand sur la page de la boutique : le commercant doit
   reconnaitre ce qu'il a publie sans avoir a ouvrir l'autre ecran. */
.mc-avant-e{display:inline-block;margin-bottom:5px;font-size:9.5px;
  font-weight:900;letter-spacing:.1em;border-radius:999px;padding:4px 9px;
  background:rgba(240,38,155,.16);color:#FF7ECB;
  border:1px solid rgba(240,38,155,.4)}
.mc-avant-on{border-color:rgba(61,226,166,.34);
  background:linear-gradient(120deg,rgba(61,226,166,.08),var(--nuit2))}
.mc-avant-on .mc-avant-l s{color:var(--menthe)}

/* LES SIX RAISONS. Une liste fermee, et c'est volontaire : un champ libre
   aurait donne « SUPER PROMO !!! » en trois jours, c'est-a-dire la seule chose
   que ce produit ne doit pas devenir. */
.mc-raisons{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}
.mc-raisons button{flex:1 1 150px;min-width:0;text-align:left;font:inherit;
  cursor:pointer;border-radius:13px;padding:10px 12px;color:var(--craie);
  background:transparent;border:1px solid var(--trait);
  transition:border-color .16s ease,background .16s ease}
.mc-raisons button b{display:block;font-size:10.5px;font-weight:900;
  letter-spacing:.07em}
.mc-raisons button em{display:block;margin-top:3px;font-style:normal;
  font-size:11.5px;color:var(--craie3)}
.mc-raisons button.on{border-color:var(--menthe);
  background:rgba(61,226,166,.1)}
.mc-raisons button.on b{color:var(--menthe)}

/* LE PRIX BARRE N'APPARAIT QUE SOUS LA PASTILLE DE REMISE. Ce qui n'est pas
   demande ne se remplit pas par habitude — et c'est exactement ce qui empeche
   ClikMe de devenir une application de promotions. */
.mc-prix{display:block;margin-top:11px}
.mc-prix span{display:block;font-size:12px;font-weight:700;
  color:var(--craie2);margin-bottom:6px}
.mc-prix input{width:100%;font:inherit;font-size:15px;color:var(--craie);
  background:var(--nuit2);border:1px solid var(--trait);border-radius:12px;
  padding:12px 13px}
.mc-prix input:focus{outline:2px solid var(--menthe);outline-offset:1px}

.mc-avant-go{display:flex;align-items:center;justify-content:center;gap:9px;
  width:100%;margin-top:13px;font:inherit;font-size:16px;font-weight:850;
  cursor:pointer;color:#04150E;background:var(--menthe);border:0;
  border-radius:999px;padding:16px 18px}
.mc-avant-go s{text-decoration:none;font-size:17px;line-height:1}
.mc-avant-go:active{transform:scale(.985)}
/* IL SE DESACTIVE PLUTOT QUE DE DISPARAITRE, et il DIT ce qui manque. Un bouton
   qui s'efface laisse chercher pourquoi ; un bouton gris qui lit « Indiquez le
   prix habituel » repond avant qu'on ait pose la question. */
.mc-avant-go:disabled{cursor:default;opacity:.42;
  background:rgba(61,226,166,.25);color:#04150E}

/* SA COLLECTION. Elle se touche aux arrivages, pas tous les matins : elle est
   donc en bas du bloc, et elle ne dit qu'un chiffre — celui de l'essayable,
   qui decide si « Surprends-moi » a de quoi surprendre. */
.mc-coll{margin-top:20px;padding-top:16px;border-top:1px solid var(--trait)}
.mc-coll-c{margin:8px 0 0;font-size:15px;font-weight:700;color:var(--craie)}
.mc-coll-c b{font-size:22px;font-weight:900;color:var(--menthe);
  margin-right:4px}
.mc-coll-c i{font-style:normal;font-size:13px;color:var(--craie3)}
.mc-coll .mc-n b{color:var(--or);font-weight:800}
.mc-ok a{color:inherit}

/* ─── LES TAILLES QU'IL LUI RESTE ───
   Le seul bloc de saisie de tout le produit, et il est fait de pastilles. Un
   champ de texte aurait donne « 38/40 env. » en trois jours : une information
   que le client ne peut plus ni lire d'un coup d'oeil ni filtrer. Les
   pastilles tiennent au pouce, gardent le meme vocabulaire d'une boutique a
   l'autre, et se cochent debout derriere un comptoir. */
.mc-tl{list-style:none;margin:14px 0 0;padding:0;display:flex;
  flex-direction:column;gap:8px}
.mc-tl li{border:1px solid var(--trait);border-radius:14px;
  background:var(--nuit2);overflow:hidden}
.mc-tl li.on{border-color:rgba(61,226,166,.4)}
.mc-tl-h{display:flex;align-items:center;gap:11px;width:100%;font:inherit;
  text-align:left;cursor:pointer;color:inherit;background:none;border:0;
  padding:10px 12px}
.mc-tl-h img{width:42px;height:52px;object-fit:cover;border-radius:8px;
  flex:0 0 auto;background:rgba(234,242,236,.06)}
.mc-tl-n{flex:1;min-width:0}
.mc-tl-n b{display:block;font-size:14.5px;font-weight:750;
  letter-spacing:-.01em;overflow:hidden;text-overflow:ellipsis;
  white-space:nowrap}
.mc-tl-n em{display:block;margin-top:2px;font-style:normal;font-size:12.5px;
  font-weight:700;color:var(--menthe)}
/* CE QUI N'EST PAS RENSEIGNE NE PREND PAS LA COULEUR DE CE QUI L'EST : la
   menthe est la couleur de ce qui est en ligne, et rien d'autre. */
.mc-tl-n em.vide{color:var(--craie2);font-weight:600}
.mc-tl-h s{text-decoration:none;font-size:13px;color:var(--craie2);
  flex:0 0 auto}
.mc-tl-e{padding:2px 12px 12px;display:flex;flex-direction:column;gap:8px}
.mc-tl-r{display:flex;flex-wrap:wrap;gap:6px}
/* QUARANTE-SIX SUR QUARANTE-CINQ POINTS, MESURE SUR L'ECRAN. La premiere
   version faisait 46 sur 41 : un pouce vise plus mal en hauteur qu'en largeur,
   et 41 points, c'est la pastille d'a cote une fois sur dix. */
.mc-tl-r button{font:inherit;font-size:14px;font-weight:800;cursor:pointer;
  min-width:46px;padding:11px 12px;border-radius:999px;color:var(--craie2);
  background:rgba(234,242,236,.05);border:1px solid var(--trait)}
.mc-tl-r button.on{color:#04150E;background:var(--menthe);
  border-color:var(--menthe)}
.mc-tl-r button:active{transform:scale(.96)}
.mc-tl-f{margin:2px 0 0;font-size:12.5px;line-height:1.5;color:var(--craie2)}
.mc-tl-x{font:inherit;font-size:12.5px;font-weight:700;cursor:pointer;
  color:var(--craie2);background:none;border:0;padding:0;margin-left:8px;
  text-decoration:underline}
.mc-tl-plus{display:block;width:100%;margin-top:10px;font:inherit;
  font-size:13.5px;font-weight:750;cursor:pointer;color:var(--craie2);
  background:none;border:1px solid var(--trait);border-radius:999px;
  padding:11px}

/* ─── CE QUI REVIENT ───
   Deduit de l'historique, jamais declare. C'est la seule analyse qui serve a
   decider : « la garbure, plutot le jeudi » se relit, un taux de conversion
   ne se relit pas. */
.mc-hab{list-style:none;margin:12px 0 0;padding:0;display:flex;
  flex-direction:column;gap:9px}
.mc-hab li{padding-left:13px;border-left:2px solid rgba(240,180,41,.5)}
.mc-hab b{display:block;font-size:15px;font-weight:800;letter-spacing:-.01em}
.mc-hab em{display:block;margin-top:2px;font-style:normal;font-size:12.5px;
  color:var(--or)}
.mc-vide{padding:40px;color:#93A79C;font-family:system-ui,sans-serif}
`,
      }}
    />
  );
}

export default function Page() {
  return (
    <>
      <Styles />
      <MonCommerce />
    </>
  );
}
