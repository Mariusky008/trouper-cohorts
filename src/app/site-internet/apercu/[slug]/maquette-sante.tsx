// Maquette PROFIL C (santé encadrée : psychologue, kiné, orthoptiste).
// Reskin complet calé sur la référence accueil_intelligent_maquette.html :
// palette sauge/crème, ton sobre, AUCUN avis, AUCUN WhatsApp, vocabulaire
// « patients », encart urgence en pied (si le métier le demande), site court et
// plein (approche · rendez-vous · infos pratiques). L'accueil intelligent (bulle
// + conversation) est fourni par <AccueilIntelligent> — la vedette du profil C.
// Les profils A/B gardent la maquette « commerce » (page.tsx).
import { LeadForm } from "../../[slug]/lead-form";
import { AccueilIntelligent } from "./accueil-intelligent";
import type { Confirmation } from "@/lib/site-internet/metier-profiles";

type FaqItem = { q: string; a: string };

export type MaquetteSanteProps = {
  slug: string;
  nom: string;
  metierLabel: string; // « Psychologue » (singulier, capitalisé)
  villeAff: string;
  adresse: string;
  horaires: Array<{ jours?: string; horaires?: string }>;
  heroPhoto: string;
  accent: string;
  showUrgence: boolean;
  termePublic: string; // patients
  confirmation: Confirmation;
  busyWord: string;
  faq: FaqItem[];
  telHref: string;
  mapsHref: string;
  phoneDisplay: string;
};

export function MaquetteSante(p: MaquetteSanteProps) {
  const {
    slug, nom, metierLabel, villeAff, adresse, horaires, heroPhoto, accent,
    showUrgence, termePublic, confirmation, busyWord, faq, telHref, mapsHref, phoneDisplay,
  } = p;
  const roleLine = [metierLabel, villeAff].filter(Boolean).join(" · ");

  return (
    <main className="mqc">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .mqc{--bg:#F6F4EF;--surface:#FFFFFF;--ink:#1C201C;--muted:#71766C;--line:#E7E4DC;
            --accent:${accent};--accent-soft:#E9F0EA;--cream:#FBFAF7;
            font-family:'Inter',system-ui,-apple-system,sans-serif;color:var(--ink);background:var(--bg);
            max-width:520px;margin:0 auto;padding-bottom:40px;-webkit-font-smoothing:antialiased;}
          .mqc *{box-sizing:border-box;}
          .mqc .ribbon{background:var(--accent-soft);color:var(--accent);font-size:12px;font-weight:600;text-align:center;padding:8px 14px;line-height:1.3;letter-spacing:.01em;}
          .mqc .nav{position:sticky;top:0;background:rgba(246,244,239,.92);backdrop-filter:blur(6px);
            border-bottom:1px solid var(--line);padding:13px 20px;display:flex;justify-content:space-between;align-items:center;z-index:5;}
          .mqc .brand{font-family:Georgia,'Times New Roman',serif;font-weight:600;font-size:16px;line-height:1.1;}
          .mqc .brand span{display:block;font-family:inherit;font-size:10px;color:var(--muted);font-weight:500;letter-spacing:.04em;margin-top:2px;font-family:'Inter',sans-serif;}
          .mqc .nav .m{display:flex;flex-direction:column;gap:3px;}
          .mqc .nav .m i{width:18px;height:1.6px;background:var(--ink);display:block;}
          .mqc section{padding:26px 22px;}
          .mqc .alt{background:var(--surface);border-top:1px solid var(--line);border-bottom:1px solid var(--line);}
          .mqc .hero{padding-top:30px;}
          .mqc .hero h2{font-family:Georgia,serif;font-weight:600;font-size:27px;line-height:1.14;letter-spacing:-.01em;}
          .mqc .hero .role{font-size:13px;color:var(--muted);margin:11px 0 16px;letter-spacing:.02em;}
          .mqc .hero .photo{height:158px;border-radius:14px;background:linear-gradient(150deg,#DFE5DC,#CBD6C6);margin-bottom:18px;
            background-size:cover;background-position:center;}
          .mqc .btn-primary{background:var(--accent);color:var(--cream);border:none;border-radius:26px;padding:15px;
            font-size:14.5px;font-weight:600;font-family:inherit;cursor:pointer;width:100%;}
          .mqc .sec-k{font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--accent);font-weight:600;margin-bottom:10px;}
          .mqc .sec-h{font-family:Georgia,serif;font-weight:600;font-size:20px;margin-bottom:10px;line-height:1.2;}
          .mqc .sec-p{font-size:13.5px;color:var(--muted);line-height:1.6;}
          .mqc .rdv{background:var(--accent);color:var(--cream);border-radius:16px;padding:22px;text-align:center;}
          .mqc .rdv h3{font-family:Georgia,serif;font-weight:600;font-size:19px;margin-bottom:7px;}
          .mqc .rdv p{font-size:12.5px;color:#CFE0D3;line-height:1.5;margin-bottom:15px;}
          .mqc .rdv button{background:var(--cream);color:var(--accent);border:none;border-radius:24px;padding:13px 18px;
            font-size:13.5px;font-weight:600;font-family:inherit;cursor:pointer;width:100%;}
          .mqc .infos div{font-size:13px;color:var(--muted);line-height:1.85;}
          .mqc .infos b{color:var(--ink);font-weight:600;}
          .mqc .infos .maplink{display:inline-block;margin-top:10px;color:var(--accent);font-weight:600;text-decoration:underline;font-size:13px;}
          .mqc .foot{padding:24px 22px 30px;border-top:1px solid var(--line);}
          .mqc .foot .fn{font-size:13.5px;color:var(--ink);font-weight:600;}
          .mqc .foot .urg{font-size:11px;color:var(--muted);line-height:1.5;margin-top:9px;}
          .mqc .foot .urg b{color:var(--ink);}
          /* Séparateur net : le site → « parlons de vous » (pitch au praticien). */
          .mqc .switch{padding:30px 22px;text-align:center;background:var(--accent);color:var(--cream);}
          .mqc .switch-line{font-family:Georgia,serif;font-size:18px;line-height:1.35;color:#E7EFE8;}
          .mqc .switch-sub{font-family:Georgia,serif;font-size:21px;font-weight:700;margin-top:6px;color:#fff;}
          .mqc .lead-wrap{padding:28px 22px 8px;}
          .mqc .lead-kick{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);font-weight:700;margin-bottom:6px;}
          .mqc .maq-note{padding:22px;background:var(--surface);border-top:1px solid var(--line);color:var(--muted);font-size:13px;line-height:1.55;text-align:center;}
          .mqc .maq-note b{color:var(--ink);}
        `,
        }}
      />

      <AccueilIntelligent
        slug={slug}
        profil="C"
        praticien={nom}
        termePublic={termePublic}
        accent={accent}
        faq={faq}
        showUrgence={showUrgence}
        confirmation={confirmation}
        busyWord={busyWord}
      />

      <div className="ribbon">✦ Maquette préparée pour {nom} — pas encore en ligne</div>

      <div className="nav">
        <div className="brand">{nom}<span>{roleLine}</span></div>
        <div className="m"><i /><i /><i /></div>
      </div>

      <section className="hero">
        <h2>Un accompagnement,<br />à votre rythme.</h2>
        <div className="role">{roleLine}</div>
        <div className="photo" style={heroPhoto ? { backgroundImage: `url("${heroPhoto}")` } : undefined} />
        <button type="button" className="btn-primary" data-accueil-open>Prendre rendez-vous</button>
      </section>

      <section className="alt">
        <div className="sec-k">Mon approche</div>
        <div className="sec-h">Un premier échange, sans engagement</div>
        <div className="sec-p">
          Un premier rendez-vous pour faire connaissance et comprendre votre besoin. Vous êtes
          accueilli(e) dans un cadre attentif et confidentiel, à votre rythme.
        </div>
      </section>

      <section>
        <div className="sec-k">Rendez-vous</div>
        <div className="rdv">
          <h3>Un créneau, à toute heure</h3>
          <p>Même le soir ou le week-end : posez une question pratique ou réservez, l’accueil s’en occupe — sans jamais vous déranger {busyWord}.</p>
          <button type="button" data-accueil-open>Ouvrir l’accueil →</button>
        </div>
      </section>

      <section className="alt">
        <div className="sec-k">Infos pratiques</div>
        <div className="sec-h">Le cabinet</div>
        <div className="infos">
          {adresse && <div><b>Adresse</b> — {adresse}</div>}
          {horaires.filter((h) => h.jours || h.horaires).length > 0 ? (
            horaires.filter((h) => h.jours || h.horaires).slice(0, 7).map((h, i) => (
              <div key={i}><b>{h.jours || ""}</b>{h.horaires ? ` — ${h.horaires}` : ""}</div>
            ))
          ) : (
            <div><b>Consultations</b> — sur rendez-vous</div>
          )}
          <a className="maplink" href={mapsHref} target="_blank" rel="noreferrer">Voir l’itinéraire →</a>
        </div>
      </section>

      <div className="foot">
        <div className="fn">{roleLine ? `${nom} · ${roleLine}` : nom}</div>
        {showUrgence && (
          <div className="urg"><b>En cas d’urgence</b> : 15 (Samu) · 3114 (prévention du suicide, 24 h/24) · 112</div>
        )}
      </div>

      <div className="switch">
        <div className="switch-line">Voilà ce que verraient vos {termePublic}.</div>
        <div className="switch-sub">Maintenant, parlons de vous.</div>
      </div>

      <div className="lead-wrap">
        <div className="lead-kick">En ligne sous 72 h</div>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: 22, margin: "0 0 6px" }}>Ce site peut être le vôtre.</h2>
        <p style={{ color: "#5A5F58", fontSize: 14, margin: "0 0 14px" }}>
          Il ne manque que votre accord. Laissez votre numéro ou appelez-moi — c’est Marius. Vous ne payez que s’il vous plaît.
        </p>
        <LeadForm slug={slug} />
      </div>

      <div className="maq-note">
        <b>C’est une maquette, faite pour {nom}.</b><br />
        Elle vous plaît ? On la met en ligne en 72 h. Sinon, ça s’arrête là — sans frais, sans engagement.
        {telHref && phoneDisplay ? <><br />Marius · {phoneDisplay}</> : null}
      </div>
    </main>
  );
}
