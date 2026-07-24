// Page d'accueil publique de popey.academy — concept « votre site, construit sous
// vos yeux ». Immersif, animé, interactif : hero générateur (vraies infos Google),
// démo vivante de l'assistante, apparition au défilement, secteurs en défilé.
// HONNÊTETÉ (règle absolue) : mécanisme réel, aucun chiffre/témoignage inventé.
import type { Metadata } from "next";
import { HeroGenerator } from "./_home/hero-generator";
import { LivingDemo } from "./_home/living-demo";
import { ScrollReveal } from "./_home/scroll-reveal";

export const metadata: Metadata = {
  title: "Popey — votre site web, construit sous vos yeux en 1 minute",
  description:
    "Entrez le nom de votre établissement : Popey construit votre site à partir de vos vraies infos Google, avec une assistante qui accueille vos clients, récolte vos avis et remplit vos créneaux. Testez-le gratuitement.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Popey — votre site web, construit sous vos yeux en 1 minute",
    description: "Un site créé à partir de vos vraies infos Google + une assistante qui travaille pour vous. Testez-le gratuitement.",
    siteName: "Popey",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Popey — votre site web, construit sous vos yeux",
    description: "Un site à votre image + une assistante qui travaille pour vous. Testez-le gratuitement.",
  },
};

const PHONE_DISPLAY = process.env.SITE_LETTER_PHONE || "07 68 23 33 47";
const WA_DIGITS = (process.env.SITE_LETTER_WHATSAPP || "").replace(/\D/g, "") || "33768233347";
const TEL_HREF = `tel:+${WA_DIGITS}`;
const WA_HREF = `https://wa.me/${WA_DIGITS}?text=${encodeURIComponent(
  "Bonjour Marius, je voudrais voir ce que Popey construirait pour mon activité.",
)}`;

const STEPS = [
  { n: "1", ic: "🔎", t: "On lit votre fiche Google", d: "Vos vraies photos, vos avis, vos horaires. Rien à saisir." },
  { n: "2", ic: "✨", t: "On construit votre site", d: "Beau, rapide, à votre image — avec l'assistante intégrée." },
  { n: "3", ic: "🚀", t: "Vous testez, puis c'est à vous", d: "Vous l'explorez en live. Il vous plaît ? On le met en ligne." },
];
const SECTEURS = ["🛍️ Commerces", "🍽️ Restaurants & cafés", "💇 Beauté & coiffure", "💅 Ongles & esthétique", "🩺 Santé", "🔧 Artisans", "🧘 Yoga & sport", "🎨 Tatoueurs", "🐾 Animalerie", "☕ Bars & brasseries"];
// Constellation « collectif » : métiers complémentaires en orbite (exemple générique,
// non concurrents entre eux). Positions calculées sur une ellipse autour de « Vous ».
const COLLECTIF_ORBIT = [
  { ic: "🍽️", t: "Resto" }, { ic: "💇", t: "Coiffeur" }, { ic: "🌸", t: "Fleuriste" },
  { ic: "📸", t: "Photographe" }, { ic: "🧘", t: "Yoga" }, { ic: "🥗", t: "Nutrition" },
];
const COLLECTIF_NODES = COLLECTIF_ORBIT.map((p, i, arr) => {
  const ang = (i / arr.length) * Math.PI * 2 - Math.PI / 2;
  const x = Math.round(Math.cos(ang) * 120);
  const y = Math.round(Math.sin(ang) * 106);
  return { ...p, x, y, len: Math.round(Math.hypot(x, y)), deg: Math.round((Math.atan2(y, x) * 180) / Math.PI) };
});

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
          .pop-home .brand{display:flex;align-items:center;gap:9px;font-weight:800;font-size:20px;letter-spacing:-.02em;}
          .pop-home .brand .dot{width:28px;height:28px;border-radius:9px;background:linear-gradient(140deg,var(--a1),var(--a3));display:flex;align-items:center;justify-content:center;color:#fff;font-size:15px;box-shadow:0 6px 16px -6px rgba(18,185,129,.7);}
          .pop-home .navcall{font-weight:700;font-size:14px;color:var(--a2);display:inline-flex;gap:6px;align-items:center;}

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
          .pop-home .sub{font-size:17px;line-height:1.5;color:var(--soft);max-width:500px;margin:16px auto 0;}

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
          .pop-home .step{position:relative;background:var(--surface);border:1px solid var(--line);border-radius:20px;padding:24px 22px;box-shadow:0 20px 46px -30px rgba(20,22,15,.4);}
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
          .pop-home .chip{background:var(--surface);border:1px solid var(--line);border-radius:999px;padding:11px 18px;font-size:14px;font-weight:700;box-shadow:0 10px 24px -20px rgba(20,22,15,.5);}
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

          /* ── HONNÊTETÉ + CTA ── */
          .pop-home .honest{text-align:center;max-width:640px;margin:0 auto;}
          .pop-home .honest .b{font-size:30px;}
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

          .pop-home footer{border-top:1px solid var(--line);padding:26px 0;text-align:center;font-size:12.5px;color:var(--faint);}

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
          <div className="brand"><span className="dot">✦</span> Popey</div>
          <a className="navcall" href={TEL_HREF}>📞 {PHONE_DISPLAY}</a>
        </div>
      </div>

      {/* ── HERO ── */}
      <header className="hero">
        <div className="aurora"><span className="x1" /><span className="x2" /><span className="x3" /></div>
        <div className="wrap inner">
          <span className="eyebrow">✦ Pour les commerçants, artisans &amp; pros</span>
          <h1>Votre site web,<br /><span className="hl">construit sous vos yeux.</span></h1>
          <p className="sub">Entrez le nom de votre établissement. Regardez ce que je crée en 1 minute — puis testez-le.</p>
          <div className="genzone">
            <span className="ftag t1">📸 vos photos</span>
            <span className="ftag t2">⭐ vos avis Google</span>
            <span className="ftag t3">🕐 vos horaires</span>
            <span className="ftag t4">🤖 votre assistante</span>
            <HeroGenerator />
          </div>
          <div className="alt">Vous préférez en parler ? <a href={WA_HREF} target="_blank" rel="noreferrer">Écrire à Marius</a> · {PHONE_DISPLAY}</div>
        </div>
      </header>

      {/* ── DÉMO VIVANTE (interactive) ── */}
      <section className="demo">
        <div className="wrap">
          <LivingDemo />
        </div>
      </section>

      {/* ── LE COLLECTIF ── */}
      <section>
        <div className="wrap">
          <div className="coll-band reveal">
            <div className="coll-in">
              <div>
                <div className="coll-k">🤝 Le collectif de votre ville</div>
                <h2 className="coll-h">Et si les autres commerces de votre ville vous <em>envoyaient des clients&nbsp;?</em></h2>
                <p className="coll-p">
                  Popey rassemble les commerces et artisans <b>les mieux notés</b> de votre ville. Chacun est associé à
                  <b> une dizaine de métiers complémentaires</b> — jamais des concurrents.
                </p>
                <div className="coll-steps">
                  <div className="coll-step"><span className="cn">1</span><span>Un client réserve chez un partenaire et cherche <b>autre chose</b> à côté.</span></div>
                  <div className="coll-step"><span className="cn">2</span><span>Mon assistante lui recommande <b>le bon pro du collectif</b> — vous.</span></div>
                  <div className="coll-step"><span className="cn">3</span><span>Et vous faites pareil. <b>Les meilleurs s&apos;envoient des clients.</b></span></div>
                </div>
                <p className="coll-note">
                  Le collectif se construit commerce par commerce&nbsp;: c&apos;est une ambition qu&apos;on bâtit avec vous. Aucune
                  donnée partagée sans accord, jamais un concurrent en face.
                </p>
              </div>
              <div className="coll-net" aria-hidden="true">
                {COLLECTIF_NODES.map((nd) => (
                  <span key={`l-${nd.t}`} className="coll-line" style={{ width: `${nd.len}px`, transform: `rotate(${nd.deg}deg)` }} />
                ))}
                {COLLECTIF_NODES.map((nd, i) => (
                  <span key={`f-${nd.t}`} className="coll-flow" style={{ ["--sx" as string]: `${nd.x}px`, ["--sy" as string]: `${nd.y}px`, animationDelay: `${0.4 + i * 0.36}s` }} />
                ))}
                {COLLECTIF_NODES.map((nd, i) => (
                  <span key={`p-${nd.t}`} className="coll-pc" style={{ transform: `translate(calc(-50% + ${nd.x}px), calc(-50% + ${nd.y}px))`, ["--fd" as string]: `${i * 0.4}s` }}>{nd.ic} {nd.t}</span>
                ))}
                <span className="coll-core"><b>Vous</b><i>votre commerce</i></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ── */}
      <div className="band">
        <section>
          <div className="wrap">
            <div className="sk reveal" style={{ textAlign: "center" }}>Comment ça marche</div>
            <div className="sh reveal">Trois étapes, et c&apos;est à vous.</div>
            <div className="steps">
              {STEPS.map((s, i) => (
                <div className="step reveal" key={s.n} style={{ transitionDelay: `${i * 110}ms` }}>
                  <div className="badge"><span className="n">{s.n}</span><span className="emj">{s.ic}</span></div>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ── SECTEURS (défilé) ── */}
      <section>
        <div className="wrap">
          <div className="sk reveal" style={{ textAlign: "center" }}>Pour qui</div>
          <div className="sh reveal">Pensé pour les pros de proximité.</div>
        </div>
        <div className="marquee reveal" style={{ marginTop: 30 }}>
          <div className="track">
            {[...SECTEURS, ...SECTEURS].map((s, i) => <span className="chip" key={i}>{s}</span>)}
          </div>
        </div>
        <div className="wrap">
          <div className="deonto reveal">
            Professions de santé &amp; du droit&nbsp;: cadre déontologique respecté — pas de sollicitation d&apos;avis, seulement un accueil qui répond pour vous.
          </div>
        </div>
      </section>

      {/* ── HONNÊTETÉ ── */}
      <div className="band">
        <section>
          <div className="wrap honest reveal">
            <div className="b">🤝</div>
            <h3>On vend un outil, pas des promesses.</h3>
            <p>Pas de chiffres magiques. Un <b>site moderne</b> et une <b>assistante qui travaille vraiment</b>, tous les jours. Vous jugez sur pièces — et vous restez libre à chaque étape.</p>
          </div>
        </section>
      </div>

      {/* ── CTA final ── */}
      <section>
        <div className="wrap">
          <div className="cta-band reveal">
            <div className="in">
              <h2>Voyez ce que ça donne pour vous.</h2>
              <div className="cta">
                <a className="btn btn-wa" href={WA_HREF} target="_blank" rel="noreferrer">
                  <svg viewBox="0 0 24 24" fill="#0B7A55"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2z" /></svg>
                  Écrire à Marius sur WhatsApp
                </a>
                <a className="btn btn-call" href={TEL_HREF}>📞 {PHONE_DISPLAY}</a>
              </div>
              <div className="sig">Marius · <b>{PHONE_DISPLAY}</b> · Sud-Ouest de la France</div>
            </div>
          </div>
        </div>
      </section>

      <footer>Popey · {year}</footer>
    </main>
  );
}
