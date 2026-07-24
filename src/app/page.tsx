// Page d'accueil publique de popey.academy — concept « votre site, construit sous
// vos yeux » : le visiteur entre le nom de son établissement, on récupère ses
// vraies données Google et on lui construit une maquette en ~1 min qu'il peut
// tester (Démo Vivante incluse). Immersif, visuel, peu de texte.
// HONNÊTETÉ (règle absolue) : on montre le mécanisme réel, aucun chiffre inventé,
// aucun faux témoignage. Le hero interactif s'appuie sur les VRAIES infos Google.
import type { Metadata } from "next";
import { HeroGenerator } from "./_home/hero-generator";

export const metadata: Metadata = {
  title: "Popey — votre site web, construit sous vos yeux en 1 minute",
  description:
    "Entrez le nom de votre établissement : Popey construit votre site à partir de vos vraies infos Google, avec une assistante qui accueille vos clients, récolte vos avis et remplit vos créneaux. Testez-le gratuitement.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Popey — votre site web, construit sous vos yeux en 1 minute",
    description:
      "Un site créé à partir de vos vraies infos Google + une assistante qui travaille pour vous. Testez-le gratuitement.",
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

export default function HomePage() {
  const year = new Date().getFullYear();

  const tiles = [
    { ic: "💬", t: "Répond à vos clients", s: "24 h/24, à votre place" },
    { ic: "⭐", t: "Récolte vos avis", s: "vos clients deviennent ambassadeurs" },
    { ic: "📣", t: "Remplit vos créneaux", s: "en un clic, WhatsApp + site" },
    { ic: "🌐", t: "Un vrai site", s: "photos, avis, prise de RDV" },
  ];
  const secteurs = ["🛍️ Commerces", "🍽️ Restaurants & cafés", "💇 Beauté & bien-être", "🩺 Santé", "🔧 Artisans", "🧘 Sport & yoga"];

  return (
    <main className="pop-home">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pop-home{--bg:#FBFAF7;--ink:#141613;--soft:#565B52;--faint:#8A8F84;--line:#EAE7DE;--surface:#fff;
            --a1:#12B981;--a2:#0EA5A5;--a3:#7C5CFC;--warm:#F4703A;--wa:#25D366;
            font-family:var(--font-geist-sans,system-ui),-apple-system,sans-serif;color:var(--ink);background:var(--bg);
            -webkit-font-smoothing:antialiased;overflow-x:hidden;}
          .pop-home *{box-sizing:border-box;}
          .pop-home a{text-decoration:none;color:inherit;}
          .pop-home .wrap{max-width:1080px;margin:0 auto;padding:0 20px;}

          /* Nav */
          .pop-home .nav{position:sticky;top:0;z-index:30;background:rgba(251,250,247,.82);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border-bottom:1px solid var(--line);}
          .pop-home .nav .in{display:flex;align-items:center;justify-content:space-between;height:60px;}
          .pop-home .brand{display:flex;align-items:center;gap:9px;font-weight:800;font-size:19px;letter-spacing:-.02em;}
          .pop-home .brand .dot{width:26px;height:26px;border-radius:9px;background:linear-gradient(140deg,var(--a1),var(--a3));display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;}
          .pop-home .navcall{font-weight:700;font-size:14px;color:var(--a2);}

          /* Hero */
          .pop-home .hero{position:relative;padding:52px 0 40px;text-align:center;overflow:hidden;}
          .pop-home .hero .blob{position:absolute;border-radius:50%;filter:blur(60px);opacity:.5;z-index:0;pointer-events:none;}
          .pop-home .hero .b1{width:440px;height:440px;background:radial-gradient(circle,rgba(18,185,129,.5),transparent 70%);top:-160px;left:-80px;}
          .pop-home .hero .b2{width:420px;height:420px;background:radial-gradient(circle,rgba(124,92,252,.4),transparent 70%);top:-120px;right:-100px;}
          .pop-home .hero .b3{width:360px;height:360px;background:radial-gradient(circle,rgba(244,112,58,.28),transparent 70%);bottom:-180px;left:40%;}
          .pop-home .hero .inner{position:relative;z-index:1;}
          .pop-home .eyebrow{display:inline-flex;align-items:center;gap:7px;font-size:11.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--a2);background:rgba(18,185,129,.10);border-radius:999px;padding:7px 14px;}
          .pop-home h1{font-size:36px;line-height:1.05;letter-spacing:-.035em;font-weight:850;margin:18px auto 0;max-width:640px;}
          .pop-home h1 .hl{background:linear-gradient(115deg,var(--a1),var(--a3));-webkit-background-clip:text;background-clip:text;color:transparent;}
          .pop-home .sub{font-size:17px;line-height:1.5;color:var(--soft);max-width:500px;margin:16px auto 0;}

          /* Générateur (carte centrale) */
          .pop-home .gen{max-width:460px;margin:26px auto 0;background:var(--surface);border:1px solid var(--line);border-radius:22px;padding:18px;box-shadow:0 30px 70px -30px rgba(20,22,19,.4);text-align:left;}
          .pop-home .gen-row{margin-bottom:10px;}
          .pop-home .gen-row.two{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
          .pop-home .gen input{width:100%;height:52px;border:1.5px solid var(--line);border-radius:14px;padding:0 15px;font-size:15.5px;font-family:inherit;background:#FCFCFB;color:var(--ink);transition:border-color .15s ease,box-shadow .15s ease;}
          .pop-home .gen input:focus{outline:none;border-color:var(--a1);box-shadow:0 0 0 4px rgba(18,185,129,.12);}
          .pop-home .genbtn{width:100%;height:56px;margin-top:4px;border:none;border-radius:15px;cursor:pointer;font-family:inherit;font-size:16.5px;font-weight:800;color:#fff;
            background:linear-gradient(120deg,var(--a1),var(--a2));box-shadow:0 16px 34px -12px rgba(18,185,129,.75);transition:transform .12s ease,filter .12s ease;}
          .pop-home .genbtn:hover{filter:brightness(1.04);}
          .pop-home .genbtn:active{transform:translateY(1px);}
          .pop-home .genbtn:disabled{background:#CBD3CC;box-shadow:none;cursor:not-allowed;}
          .pop-home .genhint{margin-top:11px;font-size:12.5px;color:var(--faint);text-align:center;line-height:1.5;}
          .pop-home .generr{margin-top:12px;font-size:13px;color:#B4453C;line-height:1.5;text-align:center;}
          .pop-home .genwa{display:inline-block;margin-top:8px;background:var(--wa);color:#fff;font-weight:700;border-radius:999px;padding:9px 16px;font-size:13px;}
          .pop-home .alt{margin-top:18px;font-size:13.5px;color:var(--faint);}
          .pop-home .alt a{font-weight:700;color:var(--a2);}

          /* Overlay de construction */
          .pop-home .genov{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;padding:24px;
            background:radial-gradient(700px 500px at 50% 30%,rgba(18,185,129,.16),transparent),rgba(12,14,11,.62);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);animation:pgFade .3s ease;}
          @keyframes pgFade{from{opacity:0}to{opacity:1}}
          .pop-home .genov-card{background:#fff;border-radius:24px;padding:32px 26px 26px;max-width:380px;width:100%;text-align:center;box-shadow:0 50px 100px -30px rgba(0,0,0,.6);}
          .pop-home .genov-orb{width:74px;height:74px;border-radius:22px;margin:0 auto;display:flex;align-items:center;justify-content:center;color:#fff;font-size:32px;
            background:linear-gradient(140deg,var(--a1),var(--a3));box-shadow:0 18px 40px -12px rgba(18,185,129,.7);animation:pgPulse 1.5s ease-in-out infinite;}
          @keyframes pgPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
          .pop-home .genov-title{font-size:18px;font-weight:800;letter-spacing:-.01em;margin:18px 0 4px;}
          .pop-home .genov-step{font-size:14px;color:var(--soft);min-height:20px;transition:opacity .3s ease;}
          .pop-home .genov-bar{height:8px;border-radius:999px;background:#EEF0EC;margin:18px 0 10px;overflow:hidden;}
          .pop-home .genov-bar i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--a1),var(--a2));transition:width .6s ease;}
          .pop-home .genov-sub{font-size:12px;color:var(--faint);line-height:1.5;}
          @media(prefers-reduced-motion:reduce){.pop-home .genov-orb{animation:none}}

          /* Aperçu produit (mock téléphone) */
          .pop-home .show{padding:34px 0 8px;}
          .pop-home .phone{max-width:300px;margin:0 auto;background:#0F1512;border-radius:34px;padding:11px;box-shadow:0 40px 90px -34px rgba(20,22,19,.6);}
          .pop-home .phone .screen{background:#fff;border-radius:26px;overflow:hidden;}
          .pop-home .phone .pcap{background:linear-gradient(135deg,#14201B,#0C1512);color:#EBF6F0;padding:14px 15px;display:flex;align-items:center;gap:9px;}
          .pop-home .phone .pcap .av{width:30px;height:30px;border-radius:9px;background:linear-gradient(140deg,var(--a1),var(--a3));display:flex;align-items:center;justify-content:center;font-size:15px;}
          .pop-home .phone .pcap .nm{font-size:13px;font-weight:700;line-height:1.1;}
          .pop-home .phone .pcap .st{font-size:10.5px;color:#9FE7C9;display:flex;align-items:center;gap:5px;}
          .pop-home .phone .pcap .st i{width:6px;height:6px;border-radius:50%;background:#3BE38A;}
          .pop-home .phone .chat{padding:15px 14px 17px;display:flex;flex-direction:column;gap:9px;background:#F7F8F6;}
          .pop-home .phone .cb{max-width:82%;padding:9px 12px;border-radius:14px;font-size:12.5px;line-height:1.4;}
          .pop-home .phone .cb.them{background:#EDEFEA;color:#2A2E27;border-top-left-radius:4px;align-self:flex-start;}
          .pop-home .phone .cb.me{background:linear-gradient(120deg,var(--a1),var(--a2));color:#fff;border-top-right-radius:4px;align-self:flex-end;}
          .pop-home .show .cap{text-align:center;font-size:15px;color:var(--soft);max-width:420px;margin:22px auto 0;line-height:1.55;}
          .pop-home .show .cap b{color:var(--ink);}

          /* Tuiles capacités */
          .pop-home section{padding:46px 0;}
          .pop-home .sk{font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--a2);font-weight:800;text-align:center;}
          .pop-home .sh{font-size:26px;line-height:1.15;letter-spacing:-.025em;font-weight:850;text-align:center;margin:9px auto 0;max-width:560px;}
          .pop-home .tiles{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:28px;}
          @media(min-width:720px){.pop-home .tiles{grid-template-columns:repeat(4,1fr);}}
          .pop-home .tile{background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:20px 16px;text-align:center;box-shadow:0 16px 36px -28px rgba(20,22,19,.4);}
          .pop-home .tile .ic{font-size:30px;}
          .pop-home .tile .tt{font-size:15px;font-weight:800;margin-top:10px;letter-spacing:-.01em;}
          .pop-home .tile .ts{font-size:12.5px;color:var(--soft);margin-top:4px;line-height:1.4;}

          /* Chips secteurs */
          .pop-home .chips{display:flex;flex-wrap:wrap;gap:9px;justify-content:center;margin-top:26px;}
          .pop-home .chip{background:var(--surface);border:1px solid var(--line);border-radius:999px;padding:10px 16px;font-size:14px;font-weight:600;}
          .pop-home .deonto{margin-top:18px;text-align:center;font-size:12.5px;color:var(--faint);max-width:520px;margin-left:auto;margin-right:auto;line-height:1.5;}

          /* Honnêteté + CTA final */
          .pop-home .band{background:var(--surface);border-top:1px solid var(--line);border-bottom:1px solid var(--line);}
          .pop-home .honest{text-align:center;max-width:640px;margin:0 auto;}
          .pop-home .honest .b{font-size:26px;}
          .pop-home .honest h3{font-size:22px;font-weight:850;letter-spacing:-.02em;margin:8px 0 8px;}
          .pop-home .honest p{font-size:15.5px;color:var(--soft);line-height:1.6;max-width:520px;margin:0 auto;}
          .pop-home .honest p b{color:var(--ink);}
          .pop-home .final{text-align:center;}
          .pop-home .final h2{font-size:27px;font-weight:850;letter-spacing:-.02em;max-width:480px;margin:0 auto;line-height:1.15;}
          .pop-home .final .cta{display:flex;flex-wrap:wrap;gap:11px;justify-content:center;margin-top:22px;}
          .pop-home .btn{display:inline-flex;align-items:center;gap:9px;border-radius:999px;font-weight:800;font-size:15.5px;padding:15px 24px;cursor:pointer;}
          .pop-home .btn-wa{background:var(--wa);color:#fff;box-shadow:0 14px 30px -12px rgba(37,211,102,.7);}
          .pop-home .btn-call{background:#fff;color:var(--ink);box-shadow:inset 0 0 0 1.5px var(--line);}
          .pop-home .btn svg{width:19px;height:19px;}
          .pop-home .final .sig{margin-top:16px;font-size:13.5px;color:var(--faint);}
          .pop-home .final .sig b{color:var(--ink);}

          .pop-home footer{border-top:1px solid var(--line);padding:24px 0;text-align:center;font-size:12.5px;color:var(--faint);}

          @media(min-width:820px){
            .pop-home .hero{padding:76px 0 52px;}
            .pop-home h1{font-size:54px;}
            .pop-home .sub{font-size:19px;}
            .pop-home .sh{font-size:32px;}
            .pop-home .final h2{font-size:34px;}
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

      {/* ── Hero : le générateur en vedette ── */}
      <header className="hero">
        <span className="blob b1" /><span className="blob b2" /><span className="blob b3" />
        <div className="wrap inner">
          <span className="eyebrow">✦ Pour les commerçants, artisans &amp; pros</span>
          <h1>Votre site web, <span className="hl">construit sous vos yeux.</span></h1>
          <p className="sub">Entrez le nom de votre établissement. Regardez ce que je crée en 1 minute — puis testez-le.</p>
          <HeroGenerator />
          <div className="alt">Vous préférez en parler ? <a href={WA_HREF} target="_blank" rel="noreferrer">Écrire à Marius</a> · {PHONE_DISPLAY}</div>
        </div>
      </header>

      {/* ── Aperçu produit : l'assistante en action ── */}
      <section className="show">
        <div className="wrap">
          <div className="phone">
            <div className="screen">
              <div className="pcap">
                <span className="av">✦</span>
                <span>
                  <span className="nm">Votre assistante</span><br />
                  <span className="st"><i />en ligne · répond pour vous</span>
                </span>
              </div>
              <div className="chat">
                <div className="cb them">Bonjour, vous avez de la place samedi ?</div>
                <div className="cb me">Bonjour 😊 Oui, il me reste des créneaux samedi ! Je vous en réserve un ?</div>
                <div className="cb them">Parfait, merci !</div>
                <div className="cb me">C&apos;est noté ✨ Et un petit avis Google nous ferait très plaisir 🙏</div>
              </div>
            </div>
          </div>
          <div className="cap">Une assistante <b>intégrée à votre site</b> : elle répond, prend les rendez-vous et transforme vos clients en ambassadeurs — <b>pendant que vous travaillez.</b></div>
        </div>
      </section>

      {/* ── Capacités (tuiles courtes) ── */}
      <section>
        <div className="wrap">
          <div className="sk">Ce qu&apos;elle fait pour vous</div>
          <div className="sh">Elle ne dort jamais.</div>
          <div className="tiles">
            {tiles.map((t) => (
              <div className="tile" key={t.t}>
                <div className="ic">{t.ic}</div>
                <div className="tt">{t.t}</div>
                <div className="ts">{t.s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pour qui ── */}
      <div className="band">
        <section>
          <div className="wrap">
            <div className="sk">Pour qui</div>
            <div className="sh">Pensé pour les pros de proximité.</div>
            <div className="chips">
              {secteurs.map((s) => <span className="chip" key={s}>{s}</span>)}
            </div>
            <div className="deonto">
              Professions de santé &amp; du droit&nbsp;: cadre déontologique respecté — pas de sollicitation d&apos;avis, seulement un accueil qui répond pour vous.
            </div>
          </div>
        </section>
      </div>

      {/* ── Honnêteté ── */}
      <section>
        <div className="wrap honest">
          <div className="b">🤝</div>
          <h3>On vend un outil, pas des promesses.</h3>
          <p>Pas de chiffres magiques. Un <b>site moderne</b> et une <b>assistante qui travaille vraiment</b>, tous les jours. Vous jugez sur pièces — et vous restez libre à chaque étape.</p>
        </div>
      </section>

      {/* ── CTA final ── */}
      <div className="band">
        <section className="final">
          <div className="wrap">
            <h2>Voyez ce que ça donne pour vous.</h2>
            <div className="cta">
              <a className="btn btn-wa" href={WA_HREF} target="_blank" rel="noreferrer">
                <svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2z" /></svg>
                Écrire à Marius sur WhatsApp
              </a>
              <a className="btn btn-call" href={TEL_HREF}>📞 {PHONE_DISPLAY}</a>
            </div>
            <div className="sig">Marius · <b>{PHONE_DISPLAY}</b> · Sud-Ouest de la France</div>
          </div>
        </section>
      </div>

      <footer>Popey · {year}</footer>
    </main>
  );
}
