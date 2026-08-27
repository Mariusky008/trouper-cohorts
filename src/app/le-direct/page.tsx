// LA PAGE QUE VOIT QUELQU'UN QUI REÇOIT UN LIEN.
//
// CE N'EST PAS UNE PAGE QUI PRÉSENTE UNE APPLICATION. C'est une histoire en
// quatre temps, et on la lit dans l'ordre où on la vivrait :
//
//   je regarde  →  je trouve  →  j'en parle  →  on décide  →  on y va
//
// POURQUOI CETTE FORME. « Une application qui regroupe les commerces, les
// événements, les offres, les emplois, la mairie, les salons » se lit comme
// une super-application de plus, et personne ne retient une liste. Une boucle
// se retient : chaque fonction devient la conséquence de la précédente, et la
// dernière — on y va — est la seule qui compte.
//
// LE DIRECT N'EST PAS LA PROMESSE, C'EST LE CARBURANT. Sans lui il n'y a rien
// à découvrir ; mais ce qu'on vend n'est pas « voir ce qui se passe », c'est
// « ne plus choisir seul ». La page est construite autour de ça.
//
// LES ÉCRANS SONT DE VRAIES CAPTURES de l'application qui tourne, pas des
// dessins : une page d'accueil qui redessine son produit en plus joli promet
// un écran qui n'existe pas, et la première ouverture dément la publicité.
// Voir `public/le-direct/` — elles sont refaites à chaque évolution.
//
// NOINDEX, comme `/autour-de-moi` : la maquette qu'elle annonce n'est pas le
// produit fini, et cette page ne doit pas devenir le premier résultat pour
// « clikme » tant que Le Direct n'est pas ouvert aux habitants.
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { MARQUE } from "@/lib/marque";
import { Histoire } from "./histoire";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#05090C",
};

export const metadata: Metadata = {
  title: { absolute: `Ne choisissez plus seul — ${MARQUE}` },
  description:
    "Voyez ce qui se passe autour de vous, proposez-le à vos amis, décidez ensemble et allez-y. Le direct de votre ville.",
  robots: { index: false, follow: false },
  openGraph: {
    title: `Ne choisissez plus seul — ${MARQUE}`,
    description:
      "Vous trouvez. Ils votent. Vous y allez. Le direct de votre ville.",
    locale: "fr_FR",
    type: "website",
  },
};

/**
 * LA FEUILLE DE STYLE EST POSÉE ICI, comme sur `/autour-de-moi` : cette page
 * ne partage rien avec le reste du site, et un fichier global de plus pour
 * deux écrans serait une dette pour personne.
 *
 * ATTENTION : PAS D'ACCENT GRAVE DANS LES COMMENTAIRES CSS ci-dessous. Ce bloc
 * est un littéral de gabarit — un seul accent grave terminerait la chaîne et
 * casserait la compilation. Le défaut a été payé quatre fois sur ce projet.
 */
function StylesLeDirect() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
/* ═══════════════════════════════════════════════════════════════════════
   LA PAGE DES HABITANTS.
   Le monde de l'application, et pas celui d'une page de vente : le noir
   vert d'un ecran ouvert dans la rue, la menthe de ce qui est vivant,
   l'ambre d'une etiquette de prix. Quelqu'un qui descend cette page puis
   appuie sur le bouton doit arriver dans le meme endroit — sinon la page
   promet un produit et en livre un autre.
   ATTENTION : jamais d'accent grave dans ces commentaires, ce bloc est un
   litteral de gabarit et un seul terminerait la chaine.
   ═══════════════════════════════════════════════════════════════════════ */
.ld{--nuit:#05090C;--nuit2:#0A1210;--craie:#EAF2EC;--craie2:#8C9C94;
  --craie3:#6C8078;--menthe:#3DE2A6;--menthe2:#0BA97B;--ambre:#F0B429;
  --trait:rgba(234,242,236,.11);
  background:var(--nuit);color:var(--craie);
  font-family:'Inter',system-ui,-apple-system,sans-serif;
  min-height:100vh;overflow-x:hidden}
.ld *{box-sizing:border-box}

/* Le serif est celui des noms de commerce dans l'application : c'est lui
   qui fait que la page et le produit se ressemblent. */
.ld h1,.ld h2{font-family:Georgia,'Times New Roman',serif;font-weight:700;
  letter-spacing:-.03em;line-height:1.02;margin:0;text-wrap:balance}

/* ── Un temps de l'histoire ─────────────────────────────────────────── */
.ld-e{display:grid;grid-template-columns:1.05fr .95fr;
  gap:clamp(28px,5vw,80px);align-items:center;
  max-width:1180px;margin:0 auto;
  padding:clamp(56px,9vh,110px) clamp(20px,5vw,48px)}
/* L'ALTERNATION EST NOMMEE, PAS COMPTEE. Compter les enfants paraissait plus
   court et se trompait d'un cran : la feuille de style est elle-meme le
   premier enfant de la page, si bien que l'ecran d'ouverture tombait en
   position paire et montrait le telephone AVANT la phrase. Une page qui
   commence par une capture avant d'avoir dit ce qu'on regarde perd sa
   premiere seconde. */
.ld-e2,.ld-e4{direction:rtl}
.ld-e2>*,.ld-e4>*{direction:ltr}
.ld-mot{display:flex;flex-direction:column;align-items:flex-start;gap:16px}

.ld-oeil{margin:0;font-size:11px;font-weight:800;letter-spacing:.14em;
  text-transform:uppercase;color:var(--craie3)}
.ld-oeil.vert{color:var(--menthe)}
.ld-oeil.ambre{color:var(--ambre)}
.ld-t1{font-size:clamp(44px,8vw,96px)}
.ld-t2{font-size:clamp(30px,4.6vw,58px)}
.ld-s{margin:0;font-size:clamp(15px,1.5vw,18px);line-height:1.6;
  color:var(--craie2);max-width:46ch}
.ld-s b{color:var(--craie);font-weight:700}
.ld-n{margin:0;font-size:12.5px;color:var(--craie3)}

/* ── Le bouton. Un seul par ecran, et il dit ce qui se passe apres ──── */
.ld-cta{display:inline-flex;align-items:center;gap:9px;text-decoration:none;
  font-size:15.5px;font-weight:800;color:#04150E;border-radius:14px;
  padding:14px 22px;background:linear-gradient(140deg,var(--menthe),var(--menthe2));
  box-shadow:0 16px 34px -16px rgba(18,185,129,.9);
  transition:transform .16s ease}
.ld-cta:hover{transform:translateY(-1px)}
.ld-cta:active{transform:scale(.98)}
.ld-cta:focus-visible{outline:2px solid var(--menthe);outline-offset:3px}
.ld-cta.grand{font-size:17px;padding:17px 30px}

/* ── L'ECRAN DE L'APPLICATION, EN VRAI ──────────────────────────────── */
.ld-tel{justify-self:center;width:min(320px,78vw);flex:none;
  border-radius:34px;padding:9px;
  background:linear-gradient(170deg,rgba(234,242,236,.15),rgba(234,242,236,.03));
  box-shadow:0 0 0 1px rgba(0,0,0,.7),0 46px 90px -36px rgba(0,0,0,.95)}
.ld-tel img{display:block;width:100%;height:auto;border-radius:26px}

/* ── LE BASCULEMENT ──────────────────────────────────────────────────
   Deux captures du MEME salon, empilees : seule l'opacite varie, pour que
   le changement se lise comme un ecran qui change et non comme une image
   qui charge. */
.ld-pile{position:relative}
.ld-pile img{position:absolute;inset:0;opacity:0;transition:opacity .55s ease}
.ld-pile img.on{position:relative;opacity:1}

.ld-bascule-dit{display:flex;align-items:center;gap:10px;margin:0;
  font-size:14px;font-weight:700;color:#CFF7E6;
  background:rgba(61,226,166,.12);border:1px solid rgba(61,226,166,.34);
  border-radius:14px;padding:12px 15px}
.ld-bascule-dit i{font-style:normal;font-size:16px;line-height:1}

/* ── Ce qu'on trouve autour ─────────────────────────────────────────── */
.ld-cartes{display:flex;flex-direction:column;gap:8px;margin:0;padding:0;
  list-style:none;width:100%;max-width:420px}
.ld-cartes li{display:grid;grid-template-columns:26px 1fr auto;gap:12px;
  align-items:center;padding:12px 15px;background:var(--nuit2);
  border:1px solid var(--trait);border-radius:14px}
.ld-cartes i{font-style:normal;font-size:17px}
.ld-cartes b{font-size:14.5px;font-weight:700}
.ld-cartes em{font-style:normal;font-size:12px;color:var(--craie3);
  font-variant-numeric:tabular-nums}

/* ── Les quatre pas du salon ────────────────────────────────────────── */
.ld-pas{display:flex;flex-direction:column;gap:9px;margin:0;padding:0;
  list-style:none;counter-reset:pas}
.ld-pas li{display:flex;align-items:baseline;gap:12px;
  font-size:clamp(15px,1.6vw,19px);color:var(--craie)}
.ld-pas li::before{counter-increment:pas;content:counter(pas);
  flex:none;width:24px;height:24px;border-radius:50%;
  font-size:11.5px;font-weight:800;line-height:24px;text-align:center;
  color:#04150E;background:var(--menthe)}

/* ── LA PROMESSE, APRES L'HISTOIRE ──────────────────────────────────── */
.ld-fin{display:flex;flex-direction:column;align-items:center;gap:18px;
  text-align:center;padding:clamp(70px,12vh,140px) 20px clamp(80px,14vh,150px);
  border-top:1px solid var(--trait);
  background:radial-gradient(90% 60% at 50% 0%,rgba(61,226,166,.09),transparent 62%)}
.ld-fin-t{display:flex;flex-direction:column;gap:2px;
  font-size:clamp(30px,5.4vw,66px)}
.ld-fin-t span:last-child{color:var(--menthe)}
.ld-fin-s{margin:0;font-size:14px;color:var(--craie2)}
.ld-fin-n{margin:0;font-size:12.5px;color:var(--craie3)}

/* ── Un ecran a la fois, sur telephone ──────────────────────────────── */
@media (max-width:860px){
  .ld-e{grid-template-columns:1fr;gap:30px;
    padding:clamp(44px,7vh,70px) 20px}
  .ld-e2,.ld-e4{direction:ltr}
  .ld-tel{width:min(280px,72vw);order:2}
  .ld-mot{align-items:flex-start}
  .ld-t1{font-size:clamp(38px,12vw,62px)}
  .ld-t2{font-size:clamp(26px,8vw,42px)}
}
@media (prefers-reduced-motion:reduce){
  .ld-pile img{transition:none}
  .ld-cta{transition:none}
}

        `,
      }}
    />
  );
}

export default function LeDirectPage() {
  return (
    <main className="ld">
      <StylesLeDirect />
      <Histoire />

      {/* LA PROMESSE ARRIVE APRÈS L'HISTOIRE, ET PAS AVANT. Une promesse posée
          en tête demande de croire ; posée à la fin, elle nomme ce qu'on vient
          de voir. C'est la différence entre une réclame et une évidence. */}
      <section className="ld-fin">
        <h2 className="ld-fin-t">
          <span>Voyez.</span>
          <span>Choisissez.</span>
          <span>Décidez ensemble.</span>
          <span>Allez-y.</span>
        </h2>
        <p className="ld-fin-s">
          {MARQUE} — le direct de votre ville.
        </p>
        <Link href="/autour-de-moi" className="ld-cta grand">
          Voir ce qui se passe autour de moi
        </Link>
        <p className="ld-fin-n">
          Pas de compte, pas de numéro, rien à installer.
        </p>
      </section>
    </main>
  );
}
