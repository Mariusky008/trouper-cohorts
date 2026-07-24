// Page d'accueil publique de popey.academy — NOUVEAU concept : « un beau site web
// + une assistante qui travaille pour vous », à destination des commerçants,
// artisans et professionnels de proximité. But : donner envie et faire contacter
// Marius (appel / WhatsApp direct). Style clair et lumineux, sans JS client.
// HONNÊTETÉ (règle absolue du projet) : on vend le MÉCANISME et l'outil, jamais des
// résultats chiffrés inventés, aucun faux témoignage, aucune statistique fabriquée.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Popey — un site web + une assistante qui travaille pour vous",
  description:
    "Pour les commerçants, artisans et professionnels : un beau site créé à partir de vos vraies infos, avec une assistante qui accueille vos clients, récolte vos avis et remplit vos créneaux — même quand vous êtes occupé.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Popey — un site web + une assistante qui travaille pour vous",
    description:
      "Un beau site à votre image et une assistante qui accueille vos clients 24 h/24, récolte vos avis Google et remplit vos créneaux creux.",
    siteName: "Popey",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Popey — un site web + une assistante qui travaille pour vous",
    description:
      "Un beau site à votre image et une assistante qui accueille vos clients, récolte vos avis et remplit vos créneaux.",
  },
};

const PHONE_DISPLAY = process.env.SITE_LETTER_PHONE || "07 68 23 33 47";
const WA_DIGITS = (process.env.SITE_LETTER_WHATSAPP || "").replace(/\D/g, "") || "33768233347";
const TEL_HREF = `tel:+${WA_DIGITS}`;
const WA_HREF = `https://wa.me/${WA_DIGITS}?text=${encodeURIComponent(
  "Bonjour Marius, je voudrais en savoir plus sur le site + l'assistante Popey pour mon activité.",
)}`;

export default function HomePage() {
  const year = new Date().getFullYear();

  const capabilities = [
    {
      ic: "🕐",
      t: "Elle accueille vos clients 24 h/24",
      d: "Horaires, accès, prestations, où se garer… Elle répond aux questions à votre place, à toute heure — même quand vous êtes en rendez-vous ou fermé.",
    },
    {
      ic: "⭐",
      t: "Elle transforme vos clients en ambassadeurs",
      d: "Au bon moment, elle demande un avis Google aux clients satisfaits et les invite à rejoindre votre liste WhatsApp. Votre réputation travaille pour vous.",
    },
    {
      ic: "📣",
      t: "Elle remplit vos créneaux creux",
      d: "Un trou dans l'agenda ? En un clic : un message à vos habitués sur WhatsApp et une annonce sur votre site. Vous décidez, elle prépare tout.",
    },
    {
      ic: "🌐",
      t: "Un vrai site, à votre image",
      d: "Photos, horaires, avis Google, prise de contact et de rendez-vous. Élégant sur mobile comme sur ordinateur, prêt à convertir vos visiteurs.",
    },
  ];

  const steps = [
    { n: "1", t: "On crée votre site", d: "À partir de vos vraies infos (photos, avis, horaires Google). Vous le découvrez, vous validez, on ajuste ce que vous voulez." },
    { n: "2", t: "Votre assistante s'installe", d: "Elle accueille vos clients, répond, récolte les avis et prévient vos habitués. Elle travaille pendant que vous travaillez." },
    { n: "3", t: "Vous gardez la main", d: "Un espace privé sur votre téléphone pour suivre vos avis, vos rendez-vous et lancer une annonce en quelques secondes." },
  ];

  const secteurs = [
    { ic: "🛍️", t: "Commerces & boutiques" },
    { ic: "🍽️", t: "Restaurants, cafés & bars" },
    { ic: "💇", t: "Beauté & bien-être" },
    { ic: "🩺", t: "Santé & professions du soin" },
    { ic: "🔧", t: "Artisans & indépendants" },
    { ic: "🧘", t: "Sport, yoga & coaching" },
  ];

  return (
    <main className="pop-home">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pop-home{--bg:#FBF8F2;--surface:#FFFFFF;--ink:#1B2019;--soft:#5C6357;--faint:#8B9184;--line:#ECE7DC;
            --accent:#0E9F6E;--accent-d:#0A7E58;--warm:#E8663D;--gold:#E0A63C;--wa:#25D366;
            font-family:var(--font-geist-sans,system-ui),-apple-system,sans-serif;color:var(--ink);background:var(--bg);
            -webkit-font-smoothing:antialiased;overflow-x:hidden;}
          .pop-home *{box-sizing:border-box;}
          .pop-home a{text-decoration:none;color:inherit;}
          .pop-home .wrap{max-width:1080px;margin:0 auto;padding:0 22px;}
          .pop-home .btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;border-radius:999px;
            font-weight:700;font-size:15.5px;padding:15px 26px;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease,filter .12s ease;}
          .pop-home .btn:active{transform:translateY(1px);}
          .pop-home .btn-wa{background:var(--wa);color:#fff;box-shadow:0 14px 30px -12px rgba(37,211,102,.7);}
          .pop-home .btn-wa:hover{filter:brightness(1.03);}
          .pop-home .btn-call{background:#fff;color:var(--ink);box-shadow:inset 0 0 0 1.5px var(--line);}
          .pop-home .btn-call:hover{box-shadow:inset 0 0 0 1.5px var(--accent);color:var(--accent-d);}
          .pop-home .btn svg{width:19px;height:19px;}

          /* Barre du haut */
          .pop-home .nav{position:sticky;top:0;z-index:30;background:rgba(251,248,242,.85);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border-bottom:1px solid var(--line);}
          .pop-home .nav .in{display:flex;align-items:center;justify-content:space-between;height:62px;}
          .pop-home .brand{display:flex;align-items:center;gap:9px;font-weight:800;font-size:20px;letter-spacing:-.02em;}
          .pop-home .brand .dot{width:26px;height:26px;border-radius:9px;background:linear-gradient(140deg,var(--accent),var(--accent-d));display:flex;align-items:center;justify-content:center;color:#fff;font-size:15px;}
          .pop-home .nav .navcall{display:inline-flex;align-items:center;gap:7px;font-weight:700;font-size:14px;color:var(--accent-d);}
          .pop-home .nav .navcall .ph{display:none;}
          @media(min-width:560px){.pop-home .nav .navcall .ph{display:inline;}}

          /* Hero */
          .pop-home .hero{position:relative;padding:64px 0 54px;text-align:center;
            background:radial-gradient(900px 460px at 50% -10%,rgba(14,159,110,.10),transparent 60%),
                       radial-gradient(700px 360px at 12% 8%,rgba(232,102,61,.07),transparent 55%);}
          .pop-home .eyebrow{display:inline-block;font-size:11.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--accent-d);
            background:rgba(14,159,110,.10);border-radius:999px;padding:7px 15px;}
          .pop-home h1{font-size:38px;line-height:1.08;letter-spacing:-.03em;font-weight:800;margin:20px auto 0;max-width:760px;}
          .pop-home h1 .hl{background:linear-gradient(120deg,var(--accent),var(--warm));-webkit-background-clip:text;background-clip:text;color:transparent;}
          .pop-home .lead{font-size:17.5px;line-height:1.6;color:var(--soft);max-width:620px;margin:20px auto 0;}
          .pop-home .cta{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-top:30px;}
          .pop-home .trust{margin-top:18px;font-size:13px;color:var(--faint);line-height:1.5;max-width:520px;margin-left:auto;margin-right:auto;}
          .pop-home .trust b{color:var(--soft);font-weight:600;}

          /* Bloc constat */
          .pop-home .band{background:var(--surface);border-top:1px solid var(--line);border-bottom:1px solid var(--line);}
          .pop-home .constat{padding:52px 0;text-align:center;}
          .pop-home .constat .q{font-size:23px;line-height:1.4;font-weight:700;max-width:680px;margin:0 auto;letter-spacing:-.01em;}
          .pop-home .constat .q .muted{color:var(--faint);font-weight:600;}
          .pop-home .constat .a{margin-top:16px;font-size:16px;color:var(--soft);max-width:560px;margin-left:auto;margin-right:auto;line-height:1.6;}
          .pop-home .constat .a b{color:var(--accent-d);}

          /* Sections */
          .pop-home section{padding:60px 0;}
          .pop-home .sk{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent-d);font-weight:800;text-align:center;}
          .pop-home .sh{font-size:29px;line-height:1.15;letter-spacing:-.02em;font-weight:800;text-align:center;margin:10px auto 0;max-width:640px;}
          .pop-home .ss{font-size:16px;color:var(--soft);text-align:center;max-width:560px;margin:14px auto 0;line-height:1.6;}

          .pop-home .cards{display:grid;grid-template-columns:1fr;gap:16px;margin-top:36px;}
          @media(min-width:680px){.pop-home .cards{grid-template-columns:1fr 1fr;}}
          .pop-home .card{background:var(--surface);border:1px solid var(--line);border-radius:20px;padding:24px;box-shadow:0 18px 40px -28px rgba(27,32,25,.4);}
          .pop-home .card .ic{width:48px;height:48px;border-radius:14px;background:linear-gradient(150deg,rgba(14,159,110,.16),rgba(14,159,110,.06));display:flex;align-items:center;justify-content:center;font-size:24px;}
          .pop-home .card h3{font-size:18.5px;font-weight:800;letter-spacing:-.01em;margin:15px 0 7px;}
          .pop-home .card p{font-size:14.5px;color:var(--soft);line-height:1.6;}

          /* Étapes */
          .pop-home .steps{display:grid;grid-template-columns:1fr;gap:16px;margin-top:36px;}
          @media(min-width:760px){.pop-home .steps{grid-template-columns:repeat(3,1fr);}}
          .pop-home .step{position:relative;padding:24px;border-radius:20px;background:var(--surface);border:1px solid var(--line);}
          .pop-home .step .n{width:38px;height:38px;border-radius:12px;background:linear-gradient(140deg,var(--accent),var(--accent-d));color:#fff;font-weight:800;font-size:18px;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 22px -10px rgba(14,159,110,.7);}
          .pop-home .step h3{font-size:17.5px;font-weight:800;margin:14px 0 6px;letter-spacing:-.01em;}
          .pop-home .step p{font-size:14px;color:var(--soft);line-height:1.6;}

          /* Secteurs */
          .pop-home .secteurs{display:flex;flex-wrap:wrap;gap:11px;justify-content:center;margin-top:34px;}
          .pop-home .sec{display:inline-flex;align-items:center;gap:9px;background:var(--surface);border:1px solid var(--line);border-radius:999px;padding:11px 18px;font-size:14.5px;font-weight:600;}
          .pop-home .sec .i{font-size:17px;}
          .pop-home .deonto{margin-top:22px;text-align:center;font-size:13px;color:var(--faint);max-width:560px;margin-left:auto;margin-right:auto;line-height:1.55;}

          /* Honnêteté */
          .pop-home .honest{background:linear-gradient(180deg,#FFFDF8,var(--surface));border:1px solid var(--line);border-radius:24px;padding:36px 26px;text-align:center;max-width:720px;margin:0 auto;}
          .pop-home .honest .badge{font-size:24px;}
          .pop-home .honest h3{font-size:23px;font-weight:800;letter-spacing:-.02em;margin:10px 0 10px;}
          .pop-home .honest p{font-size:16px;color:var(--soft);line-height:1.65;max-width:560px;margin:0 auto;}
          .pop-home .honest p b{color:var(--ink);}

          /* CTA final */
          .pop-home .final{text-align:center;padding:64px 0 72px;
            background:radial-gradient(700px 340px at 50% 120%,rgba(14,159,110,.12),transparent 60%);}
          .pop-home .final h2{font-size:30px;font-weight:800;letter-spacing:-.02em;max-width:560px;margin:0 auto;line-height:1.15;}
          .pop-home .final p{font-size:16.5px;color:var(--soft);margin:14px auto 0;max-width:520px;line-height:1.6;}
          .pop-home .final .sig{margin-top:22px;font-size:14px;color:var(--faint);}
          .pop-home .final .sig b{color:var(--ink);font-weight:700;}

          /* Footer */
          .pop-home footer{border-top:1px solid var(--line);padding:26px 0;text-align:center;font-size:13px;color:var(--faint);}

          @media(min-width:820px){
            .pop-home .hero{padding:88px 0 68px;}
            .pop-home h1{font-size:52px;}
            .pop-home .lead{font-size:19px;}
            .pop-home .sh{font-size:34px;}
            .pop-home .constat .q{font-size:27px;}
            .pop-home .final h2{font-size:38px;}
          }
        `,
        }}
      />

      {/* ── Barre ── */}
      <div className="nav">
        <div className="wrap in">
          <div className="brand"><span className="dot">✦</span> Popey</div>
          <a className="navcall" href={TEL_HREF}>📞 <span className="ph">{PHONE_DISPLAY}</span></a>
        </div>
      </div>

      {/* ── Hero ── */}
      <header className="hero">
        <div className="wrap">
          <span className="eyebrow">Pour les commerçants, artisans &amp; pros</span>
          <h1>Un beau site web. Et une <span className="hl">assistante qui travaille pour vous.</span></h1>
          <p className="lead">
            Popey crée votre site à partir de vos vraies infos, et y intègre une assistante qui accueille vos
            clients, récolte vos avis Google et remplit vos créneaux — même quand vous êtes occupé.
          </p>
          <div className="cta">
            <a className="btn btn-wa" href={WA_HREF} target="_blank" rel="noreferrer">
              <svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2z" /></svg>
              Parler à Marius sur WhatsApp
            </a>
            <a className="btn btn-call" href={TEL_HREF}>📞 {PHONE_DISPLAY}</a>
          </div>
          <p className="trust">
            <b>Sans abonnement piégeux.</b> On vous montre votre futur site gratuitement. S&apos;il vous plaît, on le
            met en ligne — sinon ça s&apos;arrête là, sans frais et sans relance.
          </p>
        </div>
      </header>

      {/* ── Le constat ── */}
      <div className="band">
        <div className="wrap constat">
          <div className="q">
            Aujourd&apos;hui, un client vous cherche sur Google, tombe sur votre fiche… <span className="muted">et repart.</span>
          </div>
          <div className="a">
            Vous étiez en rendez-vous, ou fermé. <b>Personne n&apos;a répondu à sa place.</b> C&apos;est exactement
            ce que Popey corrige.
          </div>
        </div>
      </div>

      {/* ── Ce que fait l'assistante ── */}
      <section>
        <div className="wrap">
          <div className="sk">Votre assistante</div>
          <div className="sh">Elle ne dort jamais. Elle travaille pour vous.</div>
          <div className="ss">Intégrée à votre site, elle s&apos;occupe de ce que vous n&apos;avez pas le temps de faire.</div>
          <div className="cards">
            {capabilities.map((c) => (
              <div className="card" key={c.t}>
                <div className="ic">{c.ic}</div>
                <h3>{c.t}</h3>
                <p>{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comment ça marche ── */}
      <div className="band">
        <section>
          <div className="wrap">
            <div className="sk">Comment ça marche</div>
            <div className="sh">Trois étapes, et c&apos;est à vous.</div>
            <div className="steps">
              {steps.map((s) => (
                <div className="step" key={s.n}>
                  <div className="n">{s.n}</div>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ── Pour qui ── */}
      <section>
        <div className="wrap">
          <div className="sk">Pour qui</div>
          <div className="sh">Pensé pour les pros de proximité.</div>
          <div className="secteurs">
            {secteurs.map((s) => (
              <span className="sec" key={s.t}><span className="i">{s.ic}</span> {s.t}</span>
            ))}
          </div>
          <div className="deonto">
            Pour les professions de santé et du droit, le cadre déontologique est respecté&nbsp;: pas de
            sollicitation d&apos;avis ni de relance commerciale — seulement un accueil qui répond pour vous.
          </div>
        </div>
      </section>

      {/* ── Honnêteté ── */}
      <div className="band">
        <section>
          <div className="wrap">
            <div className="honest">
              <div className="badge">🤝</div>
              <h3>On vend un outil, pas des promesses.</h3>
              <p>
                On ne vous garantit pas de chiffres magiques. On vous donne un <b>site moderne</b> et une
                <b> assistante qui travaille vraiment</b>, tous les jours. Vous jugez sur pièces — et vous restez
                libre à chaque étape.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* ── CTA final ── */}
      <section className="final">
        <div className="wrap">
          <h2>Envie de voir votre futur site&nbsp;?</h2>
          <p>Marius vous le montre gratuitement et sans engagement. Un appel, un message — et vous voyez ce que ça donne pour votre activité.</p>
          <div className="cta">
            <a className="btn btn-wa" href={WA_HREF} target="_blank" rel="noreferrer">
              <svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2z" /></svg>
              Écrire à Marius sur WhatsApp
            </a>
            <a className="btn btn-call" href={TEL_HREF}>📞 {PHONE_DISPLAY}</a>
          </div>
          <div className="sig">Marius · <b>{PHONE_DISPLAY}</b></div>
        </div>
      </section>

      <footer>Popey · {year} — Sud-Ouest de la France</footer>
    </main>
  );
}
