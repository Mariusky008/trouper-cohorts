// Page d'accueil publique — volontairement MINIMALE : elle n'a
// qu'un seul job, faire créer le site (hero + formulaire), puis une bande « après
// votre clic » et le pied de page. Tout l'argumentaire (Action Flash, catalogue,
// options, collectif) est montré BIEN mieux par la démo personnalisée, avec les
// vraies photos et les vrais avis du commerce. Les composants des anciennes
// sections restent dans _home/ : réintégrer une section = 1 import + 1 bloc.
import Image from "next/image";
import { MARQUE } from "@/lib/marque";
// HONNÊTETÉ (règle absolue) : mécanisme réel, aucun chiffre/témoignage inventé.
import type { Metadata } from "next";
import { HeroGenerator } from "./_home/hero-generator";
import { VilleVivante, VilleEtat } from "./_home/ville-vivante";
import { ScrollReveal } from "./_home/scroll-reveal";

// LE TITRE SUIT LA PAGE. Il promettait « votre site web gratuit » quand la page
// promet maintenant « votre commerce en direct dans votre ville » : un résultat
// de recherche qui annonce autre chose que la page qu'il ouvre est une visite
// perdue au premier écran. Les mots que l'on cherche vraiment — site gratuit,
// 1 minute — restent, à leur place, dans la description.
export const metadata: Metadata = {
  title: { absolute: `${MARQUE} — votre commerce en direct dans votre ville` },
  description:
    "Une nouveauté, une offre, une place qui se libère : vous le dites, les habitants autour de vous le savent. Et votre site intelligent est créé en 1 minute, gratuitement, à partir de vos informations Google — il répond à vos clients et prend vos rendez-vous.",
  alternates: { canonical: "/" },
  openGraph: {
    title: `${MARQUE} — votre commerce en direct dans votre ville`,
    description:
      "Vous le dites, les habitants autour de vous le savent. Et votre site intelligent est créé en 1 minute, gratuitement, à partir de vos informations Google.",
    siteName: MARQUE,
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${MARQUE} — votre commerce en direct dans votre ville`,
    description: "Vous le dites, les habitants autour de vous le savent. Site intelligent créé en 1 minute, gratuitement.",
  },
};

const PHONE_DISPLAY = process.env.SITE_LETTER_PHONE || "07 68 23 33 47";
const EMAIL = process.env.SITE_LETTER_EMAIL || "contact@popey.academy";
const WA_DIGITS = (process.env.SITE_LETTER_WHATSAPP || "").replace(/\D/g, "") || "33768233347";
const TEL_HREF = `tel:+${WA_DIGITS}`;
const WA_HREF = `https://wa.me/${WA_DIGITS}?text=${encodeURIComponent(
  `Bonjour Marius, je voudrais voir ce que ${MARQUE} construirait pour mon activité.`,
)}`;

export default function HomePage() {
  const year = new Date().getFullYear();

  return (
    <main className="pop-home">
      <ScrollReveal />
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pop-home{--bg:#FAFAF7;--ink:#12140F;--soft:#535851;--faint:#8B8F86;--line:#EAE8DF;--surface:#fff;
            --a1:#12B981;--a2:#0EA5A5;--a3:#7C5CFC;--warm:#F4703A;--wa:#25D366;--gold:#F0B429;
            font-family:var(--font-geist-sans,system-ui),-apple-system,sans-serif;color:var(--ink);background:var(--bg);
            -webkit-font-smoothing:antialiased;overflow-x:hidden;}
          .pop-home *{box-sizing:border-box;}
          .pop-home a{text-decoration:none;color:inherit;}
          .pop-home .wrap{max-width:1120px;margin:0 auto;padding:0 20px;}
          .pop-home .reveal{opacity:0;transform:translateY(26px);transition:opacity .8s cubic-bezier(.22,1,.36,1),transform .8s cubic-bezier(.22,1,.36,1);}
          .pop-home .reveal.reveal-in{opacity:1;transform:none;}
          @media(prefers-reduced-motion:reduce){.pop-home .reveal{opacity:1;transform:none;transition:none;}}

          /* Nav */
          .pop-home .nav{position:sticky;top:0;z-index:40;background:rgba(250,250,247,.72);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border-bottom:1px solid var(--line);}
          .pop-home .nav .in{display:flex;align-items:center;justify-content:space-between;height:62px;}
          .pop-home .brand{display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-decoration:none;color:var(--ink);}
          .pop-home .brand-img{display:block;height:26px;width:auto;}
          .pop-home .brand-sub{font-weight:600;font-size:9.5px;letter-spacing:.02em;color:var(--faint);text-transform:none;}
          .pop-home .navcta{font-weight:800;font-size:13.5px;color:#fff;background:linear-gradient(120deg,var(--a1),var(--a2));padding:9px 16px;border-radius:999px;text-decoration:none;box-shadow:0 10px 22px -10px rgba(18,185,129,.8);}
          @media(max-width:520px){.pop-home .brand-sub{display:none;}}
          /* CATALOGUE (teaser) */
          .pop-home .cat-wrap{display:grid;grid-template-columns:1fr;gap:34px;align-items:center;justify-items:center;text-align:center;}
          @media(min-width:820px){.pop-home .cat-wrap{grid-template-columns:1.05fr .95fr;text-align:left;justify-items:start;}}
          .pop-home .cat-p{font-size:16px;line-height:1.6;color:var(--soft);margin-top:14px;max-width:440px;}
          .pop-home .cat-p b{color:var(--ink);}
          .pop-home .cat-share{margin-top:18px;display:inline-flex;align-items:center;font-size:13px;font-weight:700;color:var(--a2);background:rgba(14,165,165,.1);border:1px solid rgba(14,165,165,.25);border-radius:999px;padding:9px 15px;}
          .pop-home .cat-deck{justify-self:center;}
          /* FOOTER */
          .pop-home .foot{background:#0F1512;color:#C9D2CB;margin-top:0;}
          .pop-home .foot-in{display:grid;grid-template-columns:1fr;gap:26px;padding:44px 20px 30px;}
          @media(min-width:720px){.pop-home .foot-in{grid-template-columns:1.6fr 1fr 1fr;}}
          .pop-home .foot-logo{display:block;height:30px;width:auto;}
          .pop-home .foot-brand p{font-size:13.5px;line-height:1.6;color:#8A968E;margin-top:12px;max-width:320px;}
          .pop-home .foot-col h4{font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#6E7B72;margin-bottom:12px;}
          .pop-home .foot-col a{display:block;font-size:14px;color:#C9D2CB;text-decoration:none;padding:5px 0;}
          .pop-home .foot-col a:hover{color:#fff;}
          .pop-home .foot-sig{display:block;font-size:12px;color:#6E7B72;margin-top:10px;}
          /* Le pied de page est sombre : var(--ink) y serait invisible. */
          .pop-home .foot-vision{text-align:center;font-size:14.5px;line-height:1.5;font-weight:700;color:#E9EFEA;
            padding:24px 20px 2px;max-width:520px;margin:0 auto;}
          .pop-home .foot-bar{border-top:1px solid rgba(255,255,255,.08);padding:16px 20px;text-align:center;font-size:12px;color:#6E7B72;}

          /* ── HERO ── */
          .pop-home .hero{position:relative;padding:60px 0 46px;text-align:center;overflow:hidden;}
          .pop-home .aurora{position:absolute;inset:-20% -10% auto -10%;height:640px;z-index:0;pointer-events:none;filter:blur(64px);opacity:.62;}
          .pop-home .aurora span{position:absolute;border-radius:50%;mix-blend-mode:multiply;animation:auroraMove 16s ease-in-out infinite;}
          .pop-home .aurora .x1{width:480px;height:480px;background:radial-gradient(circle,rgba(18,185,129,.75),transparent 68%);top:-60px;left:2%;}
          .pop-home .aurora .x2{width:440px;height:440px;background:radial-gradient(circle,rgba(124,92,252,.6),transparent 68%);top:-90px;right:4%;animation-delay:-5s;}
          .pop-home .aurora .x3{width:420px;height:420px;background:radial-gradient(circle,rgba(244,112,58,.45),transparent 68%);top:120px;left:38%;animation-delay:-9s;}
          @keyframes auroraMove{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(40px,30px) scale(1.08)}66%{transform:translate(-30px,20px) scale(.96)}}
          .pop-home .hero .inner{position:relative;z-index:2;}
          .pop-home .eyebrow{display:inline-flex;align-items:center;gap:7px;font-size:11.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--a2);background:rgba(255,255,255,.75);box-shadow:0 2px 10px -4px rgba(20,22,15,.2),inset 0 0 0 1px rgba(18,185,129,.18);border-radius:999px;padding:8px 15px;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);}
          .pop-home h1{font-size:38px;line-height:1.03;letter-spacing:-.04em;font-weight:850;margin:20px auto 0;max-width:680px;}
          .pop-home h1 .hl{background:linear-gradient(115deg,var(--a1) 10%,var(--a2) 45%,var(--a3));-webkit-background-clip:text;background-clip:text;color:transparent;}
          /* LE TITRE EN CAPITALES, avec un interlettrage RELÂCHÉ.
             Le -.04em de la casse mixte est réglé pour des lettres à jambages ;
             appliqué à des capitales, il les colle et « EN DIRECT » devient un
             seul mot. Les capitales veulent l'inverse d'un titre serré.
             La casse est faite par le CSS et non tapée dans le texte : un titre
             écrit en majuscules dans le HTML est lu lettre par lettre par
             certains lecteurs d'écran, et il ne se change plus sans réécrire. */
          /* « text-wrap:balance » (pas d'accent grave dans ce bloc : il termine
             le gabarit de chaîne) : sans lui, « EN DIRECT DANS VOTRE / VILLE. »
             laissait un mot seul sur la dernière ligne. Le navigateur égalise
             les longueurs de lignes lui-même — mieux qu'une coupe forcée, qui
             serait fausse dès qu'on change un mot du titre. Ignoré par les
             navigateurs qui ne le connaissent pas : on retombe alors sur le
             retour à la ligne ordinaire, jamais sur un titre cassé. */
          .pop-home h1.caps{text-transform:uppercase;letter-spacing:-.012em;line-height:1.06;text-wrap:balance;}
          /* LE TITRE FAIT DEUX LIGNES, PAS TROIS. Le 680 px hérité était réglé
             pour « Dans 1 minute, votre site sera prêt » ; « EN DIRECT DANS
             VOTRE VILLE. » en capitales demande ~880 px et se brisait, laissant
             « VILLE. » seul sur une troisième ligne. Mesuré au navigateur.
             Uniquement sur grand écran : sur téléphone, deux lignes sont
             impossibles et le repli naturel est le bon. */
          @media(min-width:960px){.pop-home h1.caps{max-width:940px;}}
          /* Les exemples : ce qu'on aurait à dire, avant qu'on explique à qui.
             Volontairement plus discret que la promesse qui suit — c'est une
             liste, pas un argument. */
          .pop-home .cases{font-size:15.5px;line-height:1.55;color:var(--soft);max-width:520px;margin:16px auto 0;position:relative;z-index:2;}
          /* Le prix et la source, en petites capitales, collés au formulaire :
             c'est la dernière chose lue avant de taper son nom. */
          .pop-home .freekick{margin:16px auto 0;font-size:11.5px;font-weight:800;letter-spacing:.11em;
            text-transform:uppercase;color:var(--faint);position:relative;z-index:2;}

          /* ── LE HERO SUR UN PETIT TÉLÉPHONE ────────────────────────────────
             MESURÉ, PAS ESTIMÉ. Le nouveau texte compte trois blocs de plus que
             l'ancien ; à réglages inchangés, le champ « Nom de votre
             établissement » commençait à 682 px — sous la ligne de flottaison
             d'un iPhone SE (667 px). Or cette page n'a QU'UN travail : faire
             remplir ce formulaire. Un argumentaire qu'on lit tout entier avant
             de découvrir qu'il y avait un champ n'est pas un argumentaire.
             Deux réglages, aucun mot coupé :
             — 38 px en CAPITALES ne tient pas sur 375 px : « VOTRE COMMERCE. »
               se brisait en deux. Les capitales occupent plus de largeur que la
               casse mixte pour laquelle cette taille avait été réglée.
             — les respirations verticales se resserrent, la page reste aérée
               mais le formulaire remonte au-dessus du pli. */
          @media(max-width:480px){
            .pop-home .hero{padding:34px 0 38px;}
            .pop-home h1{font-size:31px;margin-top:16px;}
            .pop-home h1.caps{font-size:29px;}
            .pop-home .cases{font-size:15px;margin-top:13px;}
            .pop-home .why{font-size:17.5px;margin-top:13px;}
            .pop-home .sub{font-size:15px;margin-top:10px;}
            .pop-home .freekick{margin-top:13px;font-size:11px;letter-spacing:.09em;}
            .pop-home .genzone{margin-top:18px;}
          }
          /* La phrase « pourquoi le produit existe » — juste sous le titre. */
          .pop-home .why{font-size:19px;line-height:1.45;color:var(--ink);max-width:560px;margin:18px auto 0;font-weight:600;letter-spacing:-.01em;position:relative;z-index:2;}
          .pop-home .why b{font-weight:850;background:linear-gradient(120deg,var(--a1),var(--a2));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;}
          .pop-home .sub{font-size:16px;line-height:1.5;color:var(--soft);max-width:500px;margin:12px auto 0;}
          /* « Une fois créée » : le seul bloc explicatif de la page. Il vient APRÈS
             le formulaire — on montre d'abord, on explique ensuite. */
          .pop-home .works{padding:52px 0 46px;border-top:1px solid var(--line);}
          .pop-home .works-k{text-align:center;font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--faint);}
          .pop-home .works-h{text-align:center;font-size:27px;font-weight:850;letter-spacing:-.02em;line-height:1.14;margin:10px auto 0;max-width:460px;}
          .pop-home .works-p{text-align:center;font-size:16px;line-height:1.55;color:var(--soft);max-width:480px;margin:12px auto 0;}
          .pop-home .works-box{max-width:520px;margin:26px auto 0;border:1px solid var(--line);border-radius:20px;background:var(--surface);padding:22px 20px;}
          .pop-home .works-q{font-size:17px;font-weight:850;letter-spacing:-.01em;line-height:1.3;}
          .pop-home .works-a{font-size:15px;line-height:1.5;color:var(--soft);margin-top:14px;}
          .pop-home .works-a b{color:var(--ink);font-weight:800;}
          .pop-home .works-say{margin-top:14px;border-left:3px solid var(--a1);border-radius:0 12px 12px 0;background:var(--bg);padding:13px 15px;font-size:15.5px;line-height:1.45;font-style:italic;color:var(--ink);}
          /* Les deux destinations. Puces DISCRÈTES : ce bloc avait déjà été
             allégé une fois pour cause de trop de zones de lecture, et des
             puces marquées le redécouperaient en sections. */
          .pop-home .works-ou{list-style:none;margin:8px 0 0;padding:0;}
          .pop-home .works-ou li{position:relative;padding-left:16px;font-size:15px;line-height:1.5;color:var(--soft);margin-top:5px;}
          .pop-home .works-ou li::before{content:"";position:absolute;left:2px;top:9px;width:5px;height:5px;border-radius:50%;background:var(--a1);}
          .pop-home .works-ou b{color:var(--ink);font-weight:800;}
          .pop-home .works-end{text-align:center;font-size:18px;line-height:1.5;color:var(--soft);margin:26px auto 0;max-width:420px;}
          .pop-home .works-end b{color:var(--ink);font-weight:850;}
          @media(min-width:820px){.pop-home .works-h{font-size:32px;} .pop-home .works-box{padding:26px 24px;}}

          /* Générateur (verre) + tags flottants */
          .pop-home .genzone{position:relative;max-width:520px;margin:28px auto 0;}
          .pop-home .gen{position:relative;z-index:3;background:rgba(255,255,255,.82);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.9);border-radius:24px;padding:20px;box-shadow:0 40px 90px -34px rgba(20,22,15,.5),0 0 0 1px rgba(20,22,15,.03);text-align:left;}
          .pop-home .gen-row{margin-bottom:10px;}
          .pop-home .gen-row.two{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
          .pop-home .gen input{width:100%;height:52px;border:1.5px solid var(--line);border-radius:14px;padding:0 15px;font-size:15.5px;font-family:inherit;background:#fff;color:var(--ink);transition:border-color .15s ease,box-shadow .15s ease;}
          .pop-home .gen input:focus{outline:none;border-color:var(--a1);box-shadow:0 0 0 4px rgba(18,185,129,.14);}
          .pop-home .genbtn{position:relative;width:100%;height:56px;margin-top:4px;border:none;border-radius:15px;cursor:pointer;font-family:inherit;font-size:16.5px;font-weight:800;color:#fff;overflow:hidden;
            background:linear-gradient(120deg,var(--a1),var(--a2) 60%,var(--a3));box-shadow:0 18px 38px -12px rgba(18,185,129,.8);transition:transform .12s ease,filter .12s ease;}
          .pop-home .genbtn::after{content:"";position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.45),transparent);transform:skewX(-18deg);animation:sheen 3.4s ease-in-out infinite;}
          @keyframes sheen{0%,60%{left:-60%}100%{left:130%}}
          .pop-home .genbtn:hover{filter:brightness(1.05);}
          .pop-home .genbtn:active{transform:translateY(1px);}
          .pop-home .genbtn:disabled{background:#CBD3CC;box-shadow:none;cursor:not-allowed;}
          .pop-home .genbtn:disabled::after{display:none;}
          .pop-home .genhint{margin-top:11px;font-size:12.5px;color:var(--faint);text-align:center;line-height:1.5;}
          .pop-home .generr{margin-top:12px;font-size:13px;color:#B4453C;line-height:1.5;text-align:center;}
          .pop-home .genwa{display:inline-block;margin-top:8px;background:var(--wa);color:#fff;font-weight:700;border-radius:999px;padding:9px 16px;font-size:13px;}
          .pop-home .ftag{position:absolute;z-index:4;display:inline-flex;align-items:center;gap:6px;background:#fff;border:1px solid var(--line);border-radius:999px;padding:8px 13px;font-size:12.5px;font-weight:700;box-shadow:0 14px 30px -14px rgba(20,22,15,.4);animation:floatY 5.5s ease-in-out infinite;}
          .pop-home .ftag.t1{top:8px;left:-26px;animation-delay:-.4s;}
          .pop-home .ftag.t2{top:64px;right:-30px;animation-delay:-2s;}
          .pop-home .ftag.t3{bottom:78px;left:-34px;animation-delay:-3.2s;}
          .pop-home .ftag.t4{bottom:6px;right:-18px;animation-delay:-1.2s;}
          @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
          @media(max-width:820px){.pop-home .ftag{display:none;}}
          .pop-home .alt{margin-top:20px;font-size:13.5px;color:var(--faint);position:relative;z-index:2;}
          .pop-home .alt a{font-weight:700;color:var(--a2);}

          /* ── LA VILLE VIVANTE ──────────────────────────────────────────────
             DESSINÉE, PAS PHOTOGRAPHIÉE : cette page sert toutes les villes, et
             une photo aérienne de Dax serait fausse pour tous les autres — sans
             compter son poids sur le seul écran où la vitesse décide. Ce qui
             faisait la force de la maquette d'origine, ce n'était pas la photo :
             c'étaient les étiquettes reliées à des points lumineux. */
          .pop-home .vv{position:relative;z-index:1;pointer-events:none;}
          .pop-home .vv-champ{position:absolute;inset:0;}
          .pop-home .vv-pt{position:absolute;display:flex;align-items:center;gap:0;
            opacity:0;transform:translateY(6px);transition:opacity .55s cubic-bezier(.22,1,.36,1),transform .55s cubic-bezier(.22,1,.36,1);}
          .pop-home .vv-pt.on{opacity:1;transform:none;}
          .pop-home .vv-dot{width:7px;height:7px;border-radius:50%;background:var(--a1);flex:none;
            box-shadow:0 0 0 4px rgba(18,185,129,.14),0 0 14px 2px rgba(18,185,129,.5);}
          .pop-home .vv-fil{height:1px;background:linear-gradient(90deg,rgba(18,185,129,.55),rgba(18,185,129,.12));flex:none;}
          /* L'étiquette sombre sur fond clair : c'est le contraste de la
             maquette (nuit + chiffre lumineux) sans en payer la photo. */
          .pop-home .vv-tag{display:inline-flex;align-items:center;gap:8px;background:#12261E;color:#EAF2EC;
            border-radius:12px;padding:8px 12px;box-shadow:0 16px 34px -18px rgba(10,25,18,.75);}
          .pop-home .vv-emo{font-size:13px;line-height:1;flex:none;}
          .pop-home .vv-txt{display:flex;flex-direction:column;gap:1px;font-size:11.5px;line-height:1.25;min-width:0;}
          .pop-home .vv-txt b{color:#7FE3B4;font-weight:800;font-variant-numeric:tabular-nums;}
          .pop-home .vv-txt span{color:#C6D6CD;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}

          /* SOUS 1080 px : PAS DE « AUTOUR ».
             Il n'y a pas de marge autour d'un formulaire sur un téléphone, et
             au-dessus du champ il ne reste pas un pixel — mesuré à 557 px sur
             667. Les points passent donc SOUS le bouton, en bande. Ils ne
             déplacent rien de ce qui décide. */
          @media(max-width:1079px){
            .pop-home .genzone{display:flex;flex-direction:column;}
            .pop-home .vv{order:2;margin-top:14px;}
            .pop-home .vv-champ{position:static;display:flex;flex-wrap:wrap;justify-content:center;gap:7px;}
            .pop-home .vv-pt{position:static;}
            .pop-home .vv-fil,.pop-home .vv-dot{display:none;}
            .pop-home .vv-tag{padding:7px 11px;}
            .pop-home .vv-txt{flex-direction:row;align-items:baseline;gap:6px;}
            .pop-home .vv-txt span{max-width:44vw;}
          }

          /* AU-DESSUS DE 1080 px : la ville entoure le formulaire.
             Les étiquettes sont ancrées HORS du bloc (right:100% / left:100%)
             et non par un décalage en pixels : c'est la seule façon d'être
             certain qu'elles n'entrent jamais dans le formulaire ni ne
             débordent de la page quand la fenêtre rétrécit. */
          @media(min-width:1080px){
            /* LE REPÈRE DES ANCRAGES, EXPLICITE.
               Sans ça, « .vv » reste une boîte de hauteur nulle en tête du bloc,
               et « en haut du formulaire » / « en bas du formulaire » se
               calculent par rapport à un point — les étiquettes flottaient à
               peu près au bon endroit, par accident, et n'importe quel
               changement de marge les aurait déplacées. Ici elle épouse
               exactement la zone du formulaire, et sort du flux : la position
               du champ n'en bouge pas d'un pixel. */
            .pop-home .vv{position:absolute;inset:0;}
            .pop-home .vv-tag{max-width:210px;}
            .pop-home .vv-pt.a1,.pop-home .vv-pt.a3{flex-direction:row-reverse;right:100%;padding-right:14px;}
            .pop-home .vv-pt.a2,.pop-home .vv-pt.a4{left:100%;padding-left:14px;}
            .pop-home .vv-pt.a1{top:6px;}
            .pop-home .vv-pt.a2{top:96px;}
            .pop-home .vv-pt.a3{bottom:96px;}
            .pop-home .vv-pt.a4{bottom:6px;}
            .pop-home .vv-fil{width:26px;}
            /* Quand la ville est connue, les étiquettes « ce qui compose votre
               site » s'effacent au profit de « ce qui se passe chez vous ». Deux
               anneaux d'étiquettes allumés en même temps, c'est du bruit — et
               c'est le moment exact où le sujet de la page change. */
            .pop-home .genzone:has(.vv-p3) .ftag{opacity:.22;transition:opacity .5s ease;}
          }

          /* LA LIGNE QUI DIT LA VÉRITÉ SUR SA VILLE. Elle, on la lit — d'où le
             contraste plein et l'absence de aria-hidden côté composant. */
          .pop-home .vv-etat{margin:16px auto 0;font-size:13.5px;line-height:1.5;color:var(--soft);
            max-width:460px;position:relative;z-index:2;}
          .pop-home .vv-etat b{color:var(--ink);font-weight:800;}

          /* Overlay de construction */
          .pop-home .genov{position:fixed;inset:0;z-index:90;display:flex;align-items:center;justify-content:center;padding:24px;
            background:radial-gradient(700px 500px at 50% 30%,rgba(18,185,129,.18),transparent),rgba(10,12,9,.66);-webkit-backdrop-filter:blur(7px);backdrop-filter:blur(7px);animation:pgFade .3s ease;}
          @keyframes pgFade{from{opacity:0}to{opacity:1}}
          .pop-home .genov-inner{display:flex;flex-direction:column;align-items:center;gap:20px;max-width:340px;width:100%;}
          /* Aperçu « qui se dessine » (mock navigateur) */
          .pop-home .bp-phone{width:100%;background:#0F1512;border-radius:26px;padding:9px;box-shadow:0 50px 110px -30px rgba(0,0,0,.7),inset 0 0 0 1px rgba(255,255,255,.06);}
          .pop-home .bp-bar{display:flex;align-items:center;gap:6px;padding:7px 10px 9px;}
          .pop-home .bp-bar span{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.28);}
          .pop-home .bp-bar em{margin-left:8px;font-style:normal;font-size:10px;color:rgba(255,255,255,.55);background:rgba(255,255,255,.08);border-radius:6px;padding:3px 9px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
          .pop-home .bp-screen{background:#fff;border-radius:19px;overflow:hidden;min-height:300px;}
          .pop-home .bp-hero{position:relative;height:120px;overflow:hidden;background:linear-gradient(135deg,#DFE5DE,#EEF1EC);transition:background .8s ease;}
          .pop-home .bp-hero.lit{background:linear-gradient(150deg,#123B2E,#0E7C7B 55%,#186B4E);}
          .pop-home .bp-sh{position:absolute;inset:0;background:linear-gradient(100deg,transparent 20%,rgba(255,255,255,.55) 45%,transparent 70%);transform:translateX(-100%);animation:bpShimmer 1.5s ease-in-out infinite;}
          .pop-home .bp-hero.lit .bp-sh{opacity:0;transition:opacity .5s;}
          @keyframes bpShimmer{to{transform:translateX(120%)}}
          .pop-home .bp-htxt{position:absolute;left:0;right:0;bottom:0;padding:14px;}
          .pop-home .bp-name{color:#fff;font-family:Georgia,serif;font-size:19px;font-weight:700;line-height:1.1;opacity:0;transform:translateY(8px);transition:opacity .5s ease,transform .5s ease;text-shadow:0 2px 10px rgba(0,0,0,.4);}
          .pop-home .bp-name.on{opacity:1;transform:none;}
          .pop-home .bp-role{color:rgba(255,255,255,.9);font-size:11px;margin-top:3px;opacity:0;transform:translateY(6px);transition:opacity .5s ease .1s,transform .5s ease .1s;}
          .pop-home .bp-role.on{opacity:1;transform:none;}
          .pop-home .bp-stars{color:#FFCF4D;font-size:12px;letter-spacing:1px;margin-top:5px;opacity:0;transition:opacity .5s ease .2s;}
          .pop-home .bp-stars.on{opacity:1;}
          .pop-home .bp-stars span{color:rgba(255,255,255,.75);font-size:10px;letter-spacing:0;margin-left:4px;}
          .pop-home .bp-body{padding:13px;display:flex;flex-direction:column;gap:11px;}
          .pop-home .bp-thumbs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;opacity:0;transform:translateY(10px);transition:opacity .5s ease,transform .5s ease;}
          .pop-home .bp-thumbs.on{opacity:1;transform:none;}
          .pop-home .bp-thumbs i{height:52px;border-radius:9px;background:linear-gradient(135deg,#E7EAE5,#D6Dcd5);}
          .pop-home .bp-thumbs i:nth-child(2){background:linear-gradient(135deg,#DfeAe4,#CBD8D2);}
          .pop-home .bp-thumbs i:nth-child(3){background:linear-gradient(135deg,#E9E6DE,#D8D3C7);}
          .pop-home .bp-chat{display:flex;flex-direction:column;gap:6px;opacity:0;transform:translateY(10px);transition:opacity .5s ease,transform .5s ease;}
          .pop-home .bp-chat.on{opacity:1;transform:none;}
          .pop-home .bp-bub{max-width:82%;padding:8px 11px;border-radius:12px;font-size:11.5px;line-height:1.35;}
          .pop-home .bp-bub.them{background:#EDEFEA;color:#2A2E27;border-top-left-radius:4px;align-self:flex-start;}
          .pop-home .bp-bub.me{background:linear-gradient(120deg,var(--a1),var(--a2));color:#fff;border-top-right-radius:4px;align-self:flex-end;}
          .pop-home .bp-cta{margin-top:2px;text-align:center;background:#123B2E;color:#fff;border-radius:11px;padding:11px;font-size:12.5px;font-weight:700;opacity:0;transform:translateY(10px) scale(.98);transition:opacity .5s ease,transform .5s ease;}
          .pop-home .bp-cta.on{opacity:1;transform:none;}
          /* Statut sous l'aperçu */
          .pop-home .genov-status{width:100%;text-align:center;}
          .pop-home .genov-title{font-size:16.5px;font-weight:800;letter-spacing:-.01em;color:#fff;}
          .pop-home .genov-step{font-size:13.5px;color:rgba(255,255,255,.82);min-height:20px;margin-top:6px;display:flex;align-items:center;justify-content:center;gap:8px;}
          .pop-home .genov-dot{width:8px;height:8px;border-radius:50%;background:var(--a1);box-shadow:0 0 0 0 rgba(18,185,129,.6);animation:pgDot 1.2s ease-out infinite;flex:none;}
          @keyframes pgDot{0%{box-shadow:0 0 0 0 rgba(18,185,129,.55)}100%{box-shadow:0 0 0 9px rgba(18,185,129,0)}}
          .pop-home .genov-bar{height:7px;border-radius:999px;background:rgba(255,255,255,.16);margin:14px auto 0;max-width:280px;overflow:hidden;}
          .pop-home .genov-bar i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--a1),var(--a2));transition:width .6s ease;}
          @media(prefers-reduced-motion:reduce){.pop-home .bp-sh,.pop-home .genov-dot{animation:none}}

          /* ── DÉMO VIVANTE ── */
          .pop-home .demo{padding:56px 0 50px;position:relative;}
          .pop-home .ld{display:grid;grid-template-columns:1fr;gap:34px;align-items:center;}
          @media(min-width:900px){.pop-home .ld{grid-template-columns:1fr 1fr;gap:52px;}}
          .pop-home .sk{font-size:11.5px;letter-spacing:.15em;text-transform:uppercase;color:var(--a2);font-weight:800;}
          .pop-home .ld-h{font-size:30px;line-height:1.1;letter-spacing:-.03em;font-weight:850;margin:10px 0 0;}
          .pop-home .ld-sub{font-size:16px;color:var(--soft);line-height:1.55;margin:12px 0 0;max-width:420px;}
          .pop-home .ld-feats{margin-top:22px;display:flex;flex-direction:column;gap:11px;}
          .pop-home .ld-feat{display:flex;align-items:center;gap:14px;text-align:left;background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:15px 16px;cursor:pointer;font-family:inherit;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease;position:relative;overflow:hidden;}
          .pop-home .ld-feat.on{border-color:transparent;box-shadow:0 20px 44px -22px rgba(18,185,129,.6),inset 0 0 0 1.5px var(--a1);transform:translateY(-2px);}
          .pop-home .ld-feat .ld-ic{width:44px;height:44px;flex:none;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;background:linear-gradient(150deg,rgba(18,185,129,.14),rgba(124,92,252,.1));transition:transform .3s ease;}
          .pop-home .ld-feat.on .ld-ic{transform:scale(1.08) rotate(-4deg);}
          .pop-home .ld-tx{flex:1;min-width:0;}
          .pop-home .ld-tt{display:block;font-size:15.5px;font-weight:800;letter-spacing:-.01em;}
          .pop-home .ld-ts{display:block;font-size:12.5px;color:var(--soft);margin-top:2px;line-height:1.4;}
          .pop-home .ld-prog{position:absolute;left:0;bottom:0;height:3px;width:100%;background:transparent;}
          .pop-home .ld-prog i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--a1),var(--a3));}
          .pop-home .ld-feat.on .ld-prog i.run{animation:ldProg 5.2s linear forwards;}
          @keyframes ldProg{from{width:0}to{width:100%}}

          .pop-home .ld-phone-wrap{position:relative;display:flex;justify-content:center;}
          .pop-home .ld-glow{position:absolute;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(18,185,129,.32),transparent 68%);filter:blur(46px);top:8%;z-index:0;animation:floatY 6s ease-in-out infinite;}
          .pop-home .ld-phone{position:relative;z-index:1;width:300px;max-width:82vw;background:#0F1512;border-radius:38px;padding:11px;box-shadow:0 50px 110px -34px rgba(20,22,15,.62),inset 0 0 0 1px rgba(255,255,255,.06);}
          .pop-home .ld-screen{background:#F7F8F6;border-radius:29px;overflow:hidden;}
          .pop-home .ld-cap{background:linear-gradient(135deg,#15211C,#0C1512);color:#EBF6F0;padding:14px 15px;display:flex;align-items:center;gap:10px;}
          .pop-home .ld-av{width:32px;height:32px;border-radius:10px;background:linear-gradient(140deg,var(--a1),var(--a3));display:flex;align-items:center;justify-content:center;font-size:16px;}
          .pop-home .ld-nm{display:block;font-size:13px;font-weight:700;line-height:1.15;}
          .pop-home .ld-on{display:flex;align-items:center;gap:5px;font-size:10.5px;color:#9FE7C9;}
          .pop-home .ld-on i{width:6px;height:6px;border-radius:50%;background:#3BE38A;box-shadow:0 0 0 3px rgba(59,227,138,.25);}
          .pop-home .ld-body{padding:16px 14px 20px;min-height:264px;}
          .pop-home .ld-chat{display:flex;flex-direction:column;gap:9px;}
          .pop-home .lb{max-width:84%;padding:10px 13px;border-radius:15px;font-size:12.8px;line-height:1.4;opacity:0;transform:translateY(8px);animation:lbIn .45s cubic-bezier(.22,1,.36,1) forwards;}
          .pop-home .lb.them{background:#EAECE6;color:#2A2E27;border-top-left-radius:5px;align-self:flex-start;}
          .pop-home .lb.me{background:linear-gradient(120deg,var(--a1),var(--a2));color:#fff;border-top-right-radius:5px;align-self:flex-end;box-shadow:0 10px 20px -12px rgba(18,185,129,.7);}
          .pop-home .lb.typing{background:#EAECE6;border-top-left-radius:5px;display:flex;gap:4px;width:auto;max-width:56px;align-self:flex-start;}
          .pop-home .lb.typing span{width:6px;height:6px;border-radius:50%;background:#A9AEA3;animation:ldType 1s infinite;}
          .pop-home .lb.typing span:nth-child(2){animation-delay:.15s}.pop-home .lb.typing span:nth-child(3){animation-delay:.3s}
          @keyframes lbIn{to{opacity:1;transform:none}}
          @keyframes ldType{0%,100%{opacity:.3;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}
          .pop-home .ld-revcard{margin-top:4px;background:#fff;border:1px solid var(--line);border-radius:15px;padding:13px 14px;text-align:center;opacity:0;transform:scale(.94);animation:ldPop .5s cubic-bezier(.22,1,.36,1) forwards;box-shadow:0 16px 34px -22px rgba(20,22,15,.5);}
          @keyframes ldPop{to{opacity:1;transform:none}}
          .pop-home .ld-stars{color:var(--gold);font-size:19px;letter-spacing:2px;}
          .pop-home .ld-revtx{font-size:12.5px;color:#2A2E27;font-style:italic;margin-top:5px;}
          .pop-home .ld-count{margin-top:9px;font-size:12px;font-weight:800;color:#0E9F6E;}
          .pop-home .ld-count .up{display:inline-block;background:#E4F7EE;border-radius:999px;padding:2px 9px;margin-right:5px;animation:ldBump .5s .3s both;}
          @keyframes ldBump{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.18)}100%{transform:scale(1);opacity:1}}
          .pop-home .ld-fill{display:flex;flex-direction:column;gap:9px;}
          .pop-home .ld-fillbtn{background:linear-gradient(135deg,var(--warm),#E2551F);color:#fff;border-radius:14px;padding:14px;text-align:center;font-weight:800;font-size:15px;box-shadow:0 16px 30px -12px rgba(226,85,31,.7);opacity:0;transform:translateY(8px);animation:lbIn .45s forwards;}
          .pop-home .ld-chan{display:flex;align-items:center;gap:9px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:11px 13px;font-size:12.8px;color:#2A2E27;opacity:0;transform:translateY(8px);animation:lbIn .45s forwards;}
          .pop-home .ld-chan .c{font-size:15px;}
          .pop-home .ld-chan b{font-weight:800;margin-left:2px;}
          .pop-home .ld-chan.ok{border-color:#CFE9DA;background:linear-gradient(180deg,#F1FBF6,#fff);}
          .pop-home .ld-fillnote{text-align:center;font-size:12px;color:var(--faint);opacity:0;animation:lbIn .45s forwards;}

          /* ── COMMENT ÇA MARCHE ── */
          .pop-home section{padding:52px 0;}
          .pop-home .sh{font-size:28px;line-height:1.12;letter-spacing:-.03em;font-weight:850;text-align:center;margin:9px auto 0;max-width:560px;}
          .pop-home .band{background:var(--surface);border-top:1px solid var(--line);border-bottom:1px solid var(--line);}
          .pop-home .steps{position:relative;display:grid;grid-template-columns:1fr;gap:16px;margin-top:36px;}
          @media(min-width:800px){.pop-home .steps{grid-template-columns:repeat(3,1fr);gap:20px;}}
          .pop-home .step{position:relative;background:var(--surface);border:1px solid var(--line);border-radius:20px;padding:26px 22px 24px;box-shadow:0 20px 46px -30px rgba(20,22,15,.4);transition:opacity .8s cubic-bezier(.22,1,.36,1),transform .8s cubic-bezier(.22,1,.36,1),translate .22s ease,box-shadow .22s ease;}
          .pop-home .step::before{content:"";position:absolute;top:0;left:0;right:0;height:4px;border-radius:20px 20px 0 0;background:linear-gradient(90deg,var(--a1),var(--a3));}
          .pop-home .step:hover{translate:0 -4px;box-shadow:0 30px 56px -30px rgba(20,22,15,.5);}
          @media(min-width:800px){.pop-home .step:not(:last-child)::after{content:"→";position:absolute;top:52px;right:-14px;color:var(--a1);font-size:19px;font-weight:900;z-index:2;}}
          .pop-home .step .badge{display:flex;align-items:center;gap:10px;}
          .pop-home .step .n{width:38px;height:38px;border-radius:12px;background:linear-gradient(140deg,var(--a1),var(--a3));color:#fff;font-weight:850;font-size:17px;display:flex;align-items:center;justify-content:center;box-shadow:0 12px 24px -10px rgba(18,185,129,.7);}
          .pop-home .step .emj{font-size:24px;}
          .pop-home .step h3{font-size:17.5px;font-weight:800;margin:15px 0 6px;letter-spacing:-.01em;}
          .pop-home .step p{font-size:14px;color:var(--soft);line-height:1.55;}

          /* ── SECTEURS (défilé) ── */
          .pop-home .marquee{overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);}
          .pop-home .track{display:inline-flex;gap:11px;padding:4px 0;white-space:nowrap;animation:scrollX 26s linear infinite;}
          .pop-home .marquee:hover .track{animation-play-state:paused;}
          @keyframes scrollX{from{transform:translateX(0)}to{transform:translateX(-50%)}}
          .pop-home .chip{background:var(--surface);border:1px solid var(--line);border-radius:999px;padding:11px 18px;font-size:14px;font-weight:700;box-shadow:0 10px 24px -20px rgba(20,22,15,.5);transition:translate .2s ease,border-color .2s ease,box-shadow .2s ease;}
          .pop-home .chip:hover{translate:0 -2px;border-color:rgba(18,185,129,.45);box-shadow:0 14px 28px -18px rgba(18,185,129,.5);}
          .pop-home .deonto{margin-top:20px;text-align:center;font-size:12.5px;color:var(--faint);max-width:520px;margin-left:auto;margin-right:auto;line-height:1.5;}

          /* ── LE COLLECTIF ── */
          .pop-home .coll-band{position:relative;overflow:hidden;border-radius:28px;margin:0 auto;max-width:1080px;padding:44px 24px;color:#EAF0FA;
            background:radial-gradient(130% 100% at 15% 0%,#1B2748,#111830 45%,#0A0E1A 82%);box-shadow:0 40px 90px -44px rgba(10,14,26,.9);}
          .pop-home .coll-band::before{content:"";position:absolute;left:50%;top:0;width:420px;height:420px;transform:translate(-50%,-42%);background:radial-gradient(circle,rgba(124,106,232,.3),transparent 62%);pointer-events:none;}
          .pop-home .coll-in{position:relative;z-index:1;display:grid;grid-template-columns:1fr;gap:26px;align-items:center;}
          @media(min-width:900px){.pop-home .coll-in{grid-template-columns:1.05fr .95fr;gap:44px;}}
          .pop-home .coll-k{font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:#7FE6C0;font-weight:800;}
          .pop-home .coll-h{font-size:29px;line-height:1.1;letter-spacing:-.03em;font-weight:850;margin:12px 0 0;}
          .pop-home .coll-h em{font-style:normal;color:#7FE6C0;}
          .pop-home .coll-p{font-size:15.5px;line-height:1.6;color:#B8C4DC;margin:14px 0 0;max-width:440px;}
          .pop-home .coll-p b{color:#fff;}
          .pop-home .coll-steps{margin-top:20px;display:flex;flex-direction:column;gap:10px;}
          .pop-home .coll-step{display:flex;align-items:flex-start;gap:12px;font-size:14px;line-height:1.45;color:#DDE6F2;}
          .pop-home .coll-step .cn{flex:none;width:26px;height:26px;border-radius:8px;background:rgba(127,230,192,.14);border:1px solid rgba(127,230,192,.3);color:#7FE6C0;font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center;}
          .pop-home .coll-step b{color:#fff;}
          .pop-home .coll-note{margin-top:18px;font-size:12.5px;color:#8296B6;line-height:1.5;max-width:440px;}
          /* Constellation : vous au centre, les métiers en synergie autour */
          .pop-home .coll-net{position:relative;width:100%;height:294px;}
          .pop-home .coll-core{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:3;width:104px;height:104px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;
            background:radial-gradient(circle at 50% 32%,#8E7DF2,#5B3FA6 78%);box-shadow:0 0 0 1px rgba(255,255,255,.2),0 0 46px -2px rgba(124,106,232,.85),inset 0 2px 0 rgba(255,255,255,.32);animation:collCore 3s ease-in-out infinite;}
          .pop-home .coll-core b{font-family:Georgia,serif;font-size:19px;font-weight:700;color:#fff;line-height:1;}
          .pop-home .coll-core i{font-style:normal;font-size:8.5px;letter-spacing:.14em;text-transform:uppercase;color:#E5DEFF;font-weight:800;margin-top:2px;}
          @keyframes collCore{0%,100%{box-shadow:0 0 0 1px rgba(255,255,255,.2),0 0 40px -6px rgba(124,106,232,.7),inset 0 2px 0 rgba(255,255,255,.32)}50%{box-shadow:0 0 0 1px rgba(255,255,255,.26),0 0 66px 4px rgba(124,106,232,1),inset 0 2px 0 rgba(255,255,255,.32)}}
          .pop-home .coll-line{position:absolute;left:50%;top:50%;height:2px;transform-origin:0 50%;z-index:1;background:linear-gradient(90deg,rgba(127,230,192,.05),rgba(127,230,192,.4));}
          .pop-home .coll-pc{position:absolute;left:50%;top:50%;z-index:2;display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:999px;font-size:12.5px;font-weight:700;color:#28324C;white-space:nowrap;
            background:linear-gradient(180deg,#F6F3FF,#E7E0FB);border:1px solid rgba(232,224,250,.6);box-shadow:0 12px 24px -10px rgba(0,0,0,.6);animation:collFloat 4s ease-in-out var(--fd,0s) infinite;}
          @keyframes collFloat{0%,100%{translate:0 0}50%{translate:0 -6px}}
          .pop-home .coll-flow{position:absolute;left:50%;top:50%;width:8px;height:8px;border-radius:50%;z-index:2;background:#7FE6C0;box-shadow:0 0 12px 3px rgba(127,230,192,.85);opacity:0;animation:collFlow 2.4s ease-in infinite;}
          @keyframes collFlow{0%{opacity:0;transform:translate(-50%,-50%) translate(var(--sx),var(--sy)) scale(.7)}12%{opacity:1}82%{opacity:1;transform:translate(-50%,-50%) translate(calc(var(--sx)*.12),calc(var(--sy)*.12)) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) translate(0,0) scale(.5)}}
          @media(prefers-reduced-motion:reduce){.pop-home .coll-core,.pop-home .coll-flow,.pop-home .coll-pc{animation:none}.pop-home .coll-flow{display:none}}

          /* ── ACTION FLASH ── */
          .pop-home .af-objs{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:28px;}
          @media(min-width:800px){.pop-home .af-objs{grid-template-columns:repeat(4,1fr);}}
          .pop-home .af-obj{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:18px 14px;text-align:center;box-shadow:0 14px 34px -26px rgba(20,22,15,.5);transition:opacity .8s cubic-bezier(.22,1,.36,1),transform .8s cubic-bezier(.22,1,.36,1),translate .2s ease,box-shadow .2s ease,border-color .2s ease;}
          .pop-home .af-obj:hover{translate:0 -4px;border-color:var(--a1);box-shadow:0 22px 44px -24px rgba(18,185,129,.5);}
          .pop-home .gp-card{transition:opacity .8s cubic-bezier(.22,1,.36,1),transform .8s cubic-bezier(.22,1,.36,1),translate .2s ease,box-shadow .2s ease;}
          .pop-home .gp-card:hover{translate:0 -3px;box-shadow:0 26px 50px -30px rgba(20,22,15,.55);}
          .pop-home .cat-share{transition:translate .2s ease;}
          .pop-home .cat-share:hover{translate:0 -2px;}
          .pop-home .af-obj .i{font-size:26px;}
          .pop-home .af-obj .t{font-weight:800;font-size:13.5px;margin-top:8px;letter-spacing:-.01em;line-height:1.25;}
          .pop-home .af-recap{max-width:470px;margin:28px auto 0;background:linear-gradient(160deg,#15211C,#0C1512);border-radius:20px;padding:20px 20px 18px;color:#EBF6F0;box-shadow:0 30px 70px -34px rgba(0,0,0,.7);}
          .pop-home .af-recap .rh{display:flex;align-items:center;gap:9px;font-size:13.5px;font-weight:800;color:#fff;margin-bottom:6px;}
          .pop-home .af-recap .rh .d{width:8px;height:8px;border-radius:50%;background:var(--a1);box-shadow:0 0 0 4px rgba(18,185,129,.18);}
          .pop-home .af-line{display:flex;align-items:center;gap:11px;padding:11px 0;border-top:1px solid rgba(255,255,255,.08);font-size:13.5px;}
          .pop-home .af-line:first-of-type{border-top:none;}
          .pop-home .af-line .ic{font-size:17px;width:22px;text-align:center;flex:none;}
          .pop-home .af-line .tx{flex:1;color:#DDE6E0;}
          .pop-home .af-line .tx b{color:#fff;}
          .pop-home .af-line .tag{flex:none;font-size:10px;font-weight:800;padding:3px 8px;border-radius:7px;letter-spacing:.02em;}
          .pop-home .af-line .tag.free{background:rgba(18,185,129,.16);color:#7EE8B0;}
          .pop-home .af-line .tag.opt{background:rgba(124,92,252,.2);color:#cabdff;}
          .pop-home .af-rnote{font-size:11.5px;color:#9fb8ad;margin-top:13px;line-height:1.45;text-align:center;}
          /* ── GRATUIT / OPTIONS ── */
          .pop-home .gp-cols{display:grid;grid-template-columns:1fr;gap:14px;margin-top:30px;}
          @media(min-width:760px){.pop-home .gp-cols{grid-template-columns:1fr 1fr;}}
          .pop-home .gp-card{border-radius:20px;padding:22px;border:1px solid var(--line);background:var(--surface);box-shadow:0 18px 44px -30px rgba(20,22,15,.5);}
          .pop-home .gp-card{position:relative;}
          .pop-home .gp-card.free{border-color:rgba(18,185,129,.35);background:linear-gradient(180deg,rgba(18,185,129,.07),#fff);}
          .pop-home .gp-card.free::after{content:"0 € · inclus";position:absolute;top:-11px;right:16px;background:linear-gradient(120deg,#12B981,#0EA5A5);color:#fff;font-size:11px;font-weight:800;padding:5px 12px;border-radius:999px;box-shadow:0 10px 22px -12px rgba(18,185,129,.85);}
          .pop-home .gp-card.paid{border-color:rgba(124,92,252,.28);}
          .pop-home .gp-h{font-weight:850;font-size:17px;letter-spacing:-.01em;display:flex;align-items:center;gap:8px;}
          .pop-home .gp-card.free .gp-h{color:#0B7A55;}
          .pop-home .gp-card.paid .gp-h{color:#5B3FA6;}
          .pop-home .gp-sub{font-size:12.5px;color:var(--faint);margin-top:3px;}
          .pop-home .gp-list{margin-top:14px;display:flex;flex-direction:column;gap:10px;}
          .pop-home .gp-item{display:flex;gap:10px;font-size:14px;line-height:1.4;color:var(--soft);}
          .pop-home .gp-item .k{flex:none;font-weight:800;}
          .pop-home .gp-card.free .gp-item .k{color:#12B981;}
          .pop-home .gp-card.paid .gp-item .k{color:#7C5CFC;}
          .pop-home .gp-item b{color:var(--ink);font-weight:700;}
          .pop-home .gp-tag{text-align:center;font-size:16px;font-weight:850;margin-top:24px;color:var(--ink);letter-spacing:-.01em;}
          .pop-home .gp-tag span{color:var(--a2);}
          .pop-home .gp-fine{text-align:center;font-size:12.5px;color:var(--faint);margin-top:10px;max-width:460px;margin-left:auto;margin-right:auto;line-height:1.5;}

          /* ── HONNÊTETÉ + CTA ── */
          .pop-home .honest{text-align:center;max-width:640px;margin:0 auto;}
          .pop-home .honest .b{display:inline-flex;align-items:center;justify-content:center;width:66px;height:66px;border-radius:20px;font-size:30px;background:linear-gradient(140deg,rgba(18,185,129,.16),rgba(124,92,252,.13));border:1px solid var(--line);box-shadow:0 16px 34px -22px rgba(18,185,129,.55);}
          .pop-home .honest h3{font-size:23px;font-weight:850;letter-spacing:-.02em;margin:8px 0 8px;}
          .pop-home .honest p{font-size:15.5px;color:var(--soft);line-height:1.6;max-width:520px;margin:0 auto;}
          .pop-home .honest p b{color:var(--ink);}
          .pop-home .cta-band{position:relative;text-align:center;color:#fff;border-radius:28px;margin:0 auto;max-width:1080px;overflow:hidden;padding:52px 24px;
            background:linear-gradient(125deg,#0E9F6E,#0EA5A5 55%,#7C5CFC);box-shadow:0 40px 90px -40px rgba(14,159,110,.7);}
          .pop-home .cta-band::before{content:"";position:absolute;inset:0;background:radial-gradient(500px 240px at 20% 0%,rgba(255,255,255,.22),transparent),radial-gradient(500px 240px at 90% 100%,rgba(255,255,255,.14),transparent);}
          .pop-home .cta-band .in{position:relative;z-index:1;}
          .pop-home .cta-band h2{font-size:29px;font-weight:850;letter-spacing:-.02em;max-width:520px;margin:0 auto;line-height:1.12;}
          .pop-home .cta-band .cta{display:flex;flex-wrap:wrap;gap:11px;justify-content:center;margin-top:24px;}
          .pop-home .btn{display:inline-flex;align-items:center;gap:9px;border-radius:999px;font-weight:800;font-size:15.5px;padding:15px 24px;cursor:pointer;transition:transform .12s ease,filter .12s ease;}
          .pop-home .btn:active{transform:translateY(1px);}
          .pop-home .btn-wa{background:#fff;color:#0B7A55;box-shadow:0 16px 34px -14px rgba(0,0,0,.4);}
          .pop-home .btn-call{background:rgba(255,255,255,.14);color:#fff;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.5);}
          .pop-home .btn svg{width:19px;height:19px;}
          .pop-home .cta-band .sig{margin-top:16px;font-size:13.5px;color:rgba(255,255,255,.82);}
          .pop-home .cta-band .sig b{color:#fff;}


          @media(min-width:820px){
            .pop-home .hero{padding:84px 0 58px;}
            .pop-home h1{font-size:56px;}
            .pop-home .sub{font-size:19px;}
            .pop-home .sh,.pop-home .ld-h{font-size:34px;}
            .pop-home .cta-band h2{font-size:36px;}
          }
        `,
        }}
      />

      <div className="nav">
        <div className="wrap in">
          {/* Le mot est DANS l'image : le logo horizontal porte déjà « clikme ».
              PNG et non SVG — les SVG de la charte composent le mot avec la
              police Outfit, qui s'afficherait dans une autre police chez un
              visiteur qui ne l'a pas. */}
          <a className="brand" href="#top" aria-label={MARQUE}>
            <Image className="brand-img" src="/clikme-logo.png" alt={MARQUE} width={112} height={45} priority />
            <span className="brand-sub">sites &amp; assistante · commerçants</span>
          </a>
          <a className="navcta" href="#top">✨ Créer mon site</a>
        </div>
      </div>

      {/* ── HERO ── */}
      <header className="hero" id="top">
        <div className="aurora"><span className="x1" /><span className="x2" /><span className="x3" /></div>
        <div className="wrap inner">
          {/* « Gratuit » a quitté cette pastille : il est désormais dit juste
              au-dessus du formulaire, à l'endroit où la question se pose. Le
              répéter ici userait le mot avant qu'il ne serve. Reste ce que le
              titre ne dit pas : à qui cette page s'adresse. */}
          <span className="eyebrow">✦ Commerçants, artisans &amp; pros</span>
          {/* LE TITRE DIT MAINTENANT LE PRODUIT, plus le délai.
              « Dans 1 minute, votre site sera prêt » promettait un site — or ce
              qui distingue Clikme d'un créateur de site, c'est la seconde ligne :
              le commerce paraît EN DIRECT dans sa ville. Le délai n'a pas
              disparu, il est descendu là où il est une preuve et non une
              promesse (« votre site intelligent est créé en 1 minute »). */}
          <h1 className="caps">Votre commerce.<br /><span className="hl">En direct dans votre ville.</span></h1>
          {/* LES EXEMPLES AVANT LA PROMESSE. « Une place qui se libère » se
              comprend sans effort ; « faire savoir aux habitants » ne veut rien
              dire tant qu'on n'a pas en tête ce qu'on aurait à dire. */}
          <p className="cases">
            Une nouveauté, une offre, une place qui se libère, un produit disponible, quelques portions
            restantes…
          </p>
          <p className="why">Vous le dites. <b>{MARQUE} le fait savoir aux habitants autour de vous.</b></p>
          {/* LE PARAGRAPHE SUR LE SITE A ÉTÉ RETIRÉ.
              Il disait « Et votre site intelligent est créé en 1 minute. Il
              répond à vos clients, présente votre activité et vous connecte au
              live de votre ville. » Deux phrases pour ré-expliquer le site,
              alors que le titre promet désormais autre chose — le commerce en
              direct dans sa ville. Le délai et le site sont déjà dits deux fois
              ailleurs : sur le bouton (« Construire mon site — gratuitement »)
              et dans tout le bloc du bas (« Une fois créé, votre site travaille
              pour vous »). Trois fois la même promesse sur un seul écran, c'est
              une promesse qu'on ne lit plus.

              LA LIGNE CI-DESSOUS RESTE, elle. Six mots, et ils répondent aux
              deux seules objections qui subsistent une seconde avant de taper
              son nom : combien ça coûte, et d'où viennent les informations. Les
              retirer ferait du champ un formulaire sans réponse. */}
          <p className="freekick">Gratuit. À partir de vos informations Google.</p>
          {/* LA VILLE, AUTOUR DU FORMULAIRE.
              Elle enveloppe la zone de saisie plutôt que de la précéder : sur
              un téléphone il n'y a plus un pixel disponible au-dessus du champ
              (mesuré à 557 px sur 667), et sur grand écran c'est justement la
              marge autour du formulaire qui était vide. */}
          <div className="genzone">
            <VilleVivante />
            <span className="ftag t1">📸 vos photos</span>
            <span className="ftag t2">⭐ vos avis Google</span>
            <span className="ftag t3">🕐 vos horaires</span>
            <span className="ftag t4">🤖 assistante IA incluse</span>
            <HeroGenerator />
          </div>
          {/* CE QUI SE PASSE VRAIMENT DANS SA VILLE, dès qu'il l'a tapée. Sous
              le formulaire : c'est une réponse à ce qu'il vient d'écrire, pas
              une accroche. */}
          <VilleEtat />
          {/* « Gratuit » est retiré de cette ligne : il est dit au-dessus du
              formulaire. Trois fois le même mot dans un seul écran, et il ne
              veut plus rien dire. */}
          <div className="alt">✓ 60 secondes · ✓ Sans inscription</div>
        </div>
      </header>

      {/* ── CE QU'ELLE FAIT ENSUITE ──
          Placé SOUS le formulaire, et non « après l'animation » : l'animation se
          termine par une redirection vers la maquette personnalisée, il n'y a
          donc pas d'« après » sur cette page. Ce bloc s'adresse à qui hésite
          avant de cliquer. */}
      {/* ── CE QU'IL FAIT ENSUITE ──
          Une seule idée : une phrase suffit, et elle sort du cercle de ses
          propres clients. Le bloc portait huit zones de lecture (titre, chapô,
          question, paragraphe, deux puces, citation, mention) pour dire ça.
          Et trois mots pour le même objet — « site », « plateforme »,
          « sites & assistante » — sur un seul écran. */}
      <section className="works">
        <div className="wrap">
          <div className="works-k reveal">Une fois créé</div>
          <h2 className="works-h reveal">Votre site travaille pour vous.</h2>
          <p className="works-p reveal">
            Il répond aux questions de vos clients, prend les rendez-vous et vous aide à recueillir
            de nouveaux avis Google.
          </p>

          <div className="works-box reveal">
            <div className="works-q">Et quand il se passe quelque chose chez vous, dites-le simplement.</div>
            <div className="works-say">« Il me reste 1 place demain à 8 h. Quelqu&apos;un la prend&nbsp;?&nbsp;»</div>
            <p className="works-a">
              Votre assistante transforme votre phrase en annonce, choisit la photo et la diffuse
              automatiquement&nbsp;:
            </p>
            {/* LES DEUX DESTINATIONS, SUR DEUX LIGNES. C'est le seul endroit de
                la page où une énumération vaut mieux qu'une phrase : ce sont
                deux endroits distincts, et le second — les autres commerces —
                est précisément ce que personne n'attend d'un créateur de site.
                Noyé dans une phrase, il se lit comme une incise. */}
            <ul className="works-ou">
              <li>sur votre site&nbsp;;</li>
              <li>
                et dans <b>le catalogue de votre ville</b>, affiché également par les autres commerces
                du réseau.
              </li>
            </ul>
          </div>

          <div className="works-end reveal">
            Vous vous occupez de votre commerce.<br />
            <b>{MARQUE} s&apos;occupe de vous faire connaître.</b>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="foot">
        <div className="wrap foot-in">
          <div className="foot-brand">
            <Image className="foot-logo" src="/clikme-logo-blanc.png" alt={MARQUE} width={124} height={50} />
            <p>
              {MARQUE} crée gratuitement le site web de votre commerce à partir de votre fiche Google&nbsp;:
              vos photos, vos avis, vos horaires et votre activité, réunis dans un vrai site moderne,
              avec une assistante qui répond à vos clients. Pour les commerçants, artisans, restaurateurs
              et pros de proximité, partout en France.
            </p>
          </div>
          <div className="foot-col">
            <h4>{MARQUE}</h4>
            <a href="#top">Créer mon site</a>
            <a href="/legal#cgu">Conditions d&apos;utilisation</a>
            <a href="/legal#cgv">Conditions de vente</a>
            <a href="/legal#remboursement">Remboursement</a>
            <a href="/legal#confidentialite">Confidentialité</a>
            <a href="/legal#mentions">Mentions légales</a>
          </div>
          <div className="foot-col">
            <h4>Contact</h4>
            <a href={WA_HREF} target="_blank" rel="noreferrer">WhatsApp</a>
            <a href={TEL_HREF}>{PHONE_DISPLAY}</a>
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
            <span className="foot-sig">Marius · France</span>
          </div>
        </div>
        {/* L'ambition, au futur et en bas de page. « Le premier réseau social du
            commerce local » au présent, en haut, décrirait quelque chose qui
            n'existe pas encore — et parlerait à un investisseur, pas au
            commerçant venu voir son site. */}
        <div className="foot-vision">Nous construisons le premier réseau du commerce local. Ville après ville.</div>
        <div className="foot-bar">{MARQUE} · {year} · Tous droits réservés</div>
      </footer>
    </main>
  );
}
