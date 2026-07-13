// Maquette PROFIL C (santé encadrée) — SPEC « maquette configurable » v2.
// Un vrai site plein des données Google du praticien (photos, horaires, adresse,
// téléphone) + textes proposés par métier (catalogue déterministe). Au milieu :
// le configurateur (3 questions) qui met en avant LA brique qui le sert. Aucun
// avis, aucun WhatsApp (déontologie), encart urgence en pied. Une seule barre
// fixe (Appeler + Prendre RDV) ; l'accueil intelligent s'ouvre en surimpression.
import { LeadForm } from "../../[slug]/lead-form";
import { AccueilIntelligent } from "./accueil-intelligent";
import { MaquetteConfigurateur } from "./maquette-configurateur";
import type { Confirmation, Moteur, Profil } from "@/lib/site-internet/metier-profiles";
import type { MetierContent } from "@/lib/site-internet/metier-content";

export type ReviewSnippet = { name: string; text: string; stars: number | null };

export type MaquetteSanteProps = {
  slug: string;
  profil: Profil;
  nom: string;
  metierLabel: string;
  villeAff: string;
  adresse: string;
  horaires: Array<{ jours?: string; horaires?: string }>;
  photos: string[];
  accent: string;
  accentSoft: string;
  showUrgence: boolean;
  termePublic: string;
  confirmation: Confirmation;
  moteur: Moteur;
  busyWord: string;
  content: MetierContent;
  // Avis : "prominent" (A), "doux" (B), "none" (C). Rien ne s'affiche sans vrais avis.
  avisMode: "prominent" | "doux" | "none";
  note: string | null;
  reviewsCount: number | null;
  reviewsTop: ReviewSnippet[];
  telHref: string;
  waHref: string; // WhatsApp (profil A seulement, sinon "")
  doctolibHref: string; // réservation en ligne existante (profil B), sinon ""
  mapsHref: string;
  phoneDisplay: string;
};

export function MaquetteSante(p: MaquetteSanteProps) {
  const {
    slug, profil, nom, metierLabel, villeAff, adresse, horaires, photos, accent, accentSoft,
    showUrgence, termePublic, confirmation, moteur, busyWord, content,
    avisMode, note, reviewsCount, reviewsTop, telHref, waHref, doctolibHref, mapsHref, phoneDisplay,
  } = p;
  const stars = (n: number | null) => "★".repeat(n != null ? Math.max(1, Math.min(5, Math.round(n))) : 5);
  const showAvis = avisMode !== "none" && note != null && reviewsCount != null && reviewsCount > 0;
  const roleLine = [metierLabel, villeAff].filter(Boolean).join(" · ");
  const heroPhoto = photos[0] || "";
  const gallery = photos.slice(heroPhoto ? 1 : 0);
  const galClass = gallery.length >= 4 ? "g4" : gallery.length === 3 ? "g3" : gallery.length === 2 ? "g2" : gallery.length === 1 ? "g1" : "";
  const shortAddr = adresse.replace(/,?\s*France\s*$/i, "").trim();
  const heures = horaires.filter((h) => h.jours || h.horaires).slice(0, 7);

  return (
    <main className="mqc">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .mqc{--bg:#F6F4EF;--surface:#FFF;--ink:#1C201C;--muted:#71766C;--line:#E7E4DC;
            --accent:${accent};--accent-soft:${accentSoft};--cream:#FBFAF7;--gold:#B8862F;
            font-family:'Inter',system-ui,-apple-system,sans-serif;color:var(--ink);background:var(--bg);
            max-width:520px;margin:0 auto;padding-bottom:78px;scroll-behavior:smooth;-webkit-font-smoothing:antialiased;}
          .mqc *{box-sizing:border-box;}
          .mqc .banner{background:var(--accent-soft);color:var(--accent);font-size:12px;font-weight:600;text-align:center;padding:9px 14px;line-height:1.35;}
          /* HERO photo */
          .mqc .hero{position:relative;height:290px;overflow:hidden;}
          .mqc .hero .img{position:absolute;inset:0;background:linear-gradient(160deg,#5E6B5C,#39423A);background-size:cover;background-position:center;}
          .mqc .hero .veil{position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,20,15,.12),rgba(15,20,15,.86));}
          .mqc .hero .txt{position:absolute;left:0;right:0;bottom:0;padding:20px;color:var(--cream);}
          .mqc .hero .k{font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;opacity:.85;}
          .mqc .hero h2{font-family:Georgia,serif;font-weight:600;font-size:27px;line-height:1.08;margin:7px 0 5px;}
          .mqc .hero .sub{font-size:12.5px;opacity:.85;margin-bottom:13px;}
          .mqc .hero .acts{display:flex;gap:8px;}
          .mqc .hero .acts a{flex:1;text-align:center;text-decoration:none;border-radius:24px;padding:12px;font-size:12.5px;font-weight:600;cursor:pointer;}
          .mqc .a-call{background:var(--cream);color:var(--ink);}
          .mqc .a-rdv{background:var(--accent);color:var(--cream);}
          /* TEASER */
          .mqc .teaser{background:var(--accent-soft);border-bottom:1px solid var(--line);padding:13px 18px;display:flex;align-items:center;gap:10px;text-decoration:none;color:var(--ink);}
          .mqc .teaser .ic{flex:none;color:var(--accent);display:flex;}
          .mqc .teaser .tx{font-size:12.5px;line-height:1.45;}
          .mqc .teaser .tx b{color:var(--accent);font-weight:600;}
          .mqc .teaser .go2{margin-left:auto;flex:none;color:var(--accent);font-weight:700;font-size:16px;}
          /* SECTIONS */
          .mqc section{padding:24px 20px;}
          .mqc .alt{background:var(--surface);border-top:1px solid var(--line);border-bottom:1px solid var(--line);}
          .mqc .sec-k{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--accent);font-weight:600;margin-bottom:8px;}
          .mqc .sec-h{font-family:Georgia,serif;font-weight:600;font-size:20px;margin-bottom:9px;line-height:1.2;}
          .mqc .sec-p{font-size:13.5px;color:var(--muted);line-height:1.6;}
          .mqc .proposed{font-size:10.5px;color:var(--muted);font-style:italic;margin-top:10px;opacity:.85;}
          /* GALERIE adaptative */
          .mqc .g1 img{width:100%;height:180px;object-fit:cover;border-radius:12px;display:block;}
          .mqc .g2{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
          .mqc .g2 img{width:100%;height:120px;object-fit:cover;border-radius:10px;display:block;}
          .mqc .g3{display:grid;grid-template-columns:2fr 1fr;grid-template-rows:82px 82px;gap:8px;}
          .mqc .g3 img{width:100%;height:100%;object-fit:cover;border-radius:10px;display:block;}
          .mqc .g3 img:first-child{grid-row:1/3;}
          .mqc .g4{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
          .mqc .g4 img{width:100%;height:104px;object-fit:cover;border-radius:10px;display:block;}
          /* AVIS — prominent (A) / doux (B) */
          .mqc .rev-top{display:flex;align-items:center;gap:11px;margin-bottom:13px;}
          .mqc .rev-score{font-family:Georgia,serif;font-size:30px;font-weight:600;line-height:1;}
          .mqc .rev-stars{color:var(--gold);font-size:15px;letter-spacing:1px;}
          .mqc .rev-meta{font-size:11.5px;color:var(--muted);margin-top:3px;}
          .mqc .rev-c{border:1px solid var(--line);border-radius:12px;padding:12px 14px;background:var(--bg);margin-bottom:9px;}
          .mqc .rev-c .q{font-size:12.5px;line-height:1.45;font-style:italic;}
          .mqc .rev-c .a{font-size:11px;color:var(--muted);margin-top:6px;}
          .mqc .rev-c .a .s{color:var(--gold);}
          .mqc .rev-line{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--muted);}
          .mqc .rev-line .st{color:var(--gold);letter-spacing:.5px;}
          .mqc .rev-line b{color:var(--ink);font-weight:600;}
          /* CONTACT (WhatsApp A / Doctolib B) */
          .mqc .contact{display:flex;gap:10px;margin-top:14px;}
          .mqc .contact a{flex:1;text-align:center;border:1px solid var(--accent);color:var(--accent);border-radius:22px;padding:11px;font-size:12.5px;font-weight:600;text-decoration:none;}
          .mqc .contact a.wa{border-color:#25843f;color:#1a6b31;}
          /* CARTES */
          .mqc .cards{display:flex;flex-direction:column;gap:9px;margin-top:12px;}
          .mqc .c{border:1px solid var(--line);border-radius:12px;padding:13px 14px;background:var(--bg);}
          .mqc .c h4{font-family:Georgia,serif;font-size:14.5px;font-weight:600;margin-bottom:3px;}
          .mqc .c p{font-size:11.5px;color:var(--muted);line-height:1.45;}
          /* HORAIRES + CARTE */
          .mqc .hours{display:flex;flex-direction:column;margin-top:4px;}
          .mqc .hr{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--line);font-size:12.5px;}
          .mqc .hr:last-child{border:none;}
          .mqc .hr .h{color:var(--muted);}
          .mqc .map{margin-top:12px;border:1px solid var(--line);border-radius:12px;overflow:hidden;}
          .mqc .map .canvas{height:110px;position:relative;background:
            repeating-linear-gradient(0deg,#E8E6DF,#E8E6DF 1px,transparent 1px,transparent 22px),
            repeating-linear-gradient(90deg,#E8E6DF,#E8E6DF 1px,transparent 1px,transparent 22px),#F1EFE9;}
          .mqc .map .pin{position:absolute;left:50%;top:46%;transform:translate(-50%,-100%);color:var(--accent);}
          .mqc .map .addr{padding:11px 13px;background:var(--surface);font-size:12px;display:flex;justify-content:space-between;align-items:center;gap:10px;}
          .mqc .map .addr a{color:var(--accent);font-weight:600;text-decoration:none;white-space:nowrap;font-size:11.5px;}
          /* FAQ */
          .mqc .faq details{border-bottom:1px solid var(--line);}
          .mqc .faq summary{padding:12px 0;font-size:13px;font-weight:500;cursor:pointer;list-style:none;display:flex;justify-content:space-between;gap:10px;}
          .mqc .faq summary::-webkit-details-marker{display:none;}
          .mqc .faq summary::after{content:"+";color:var(--accent);font-weight:600;}
          .mqc .faq details[open] summary::after{content:"–";}
          .mqc .faq p{font-size:12.5px;color:var(--muted);line-height:1.55;padding:0 0 12px;}
          /* CONFIGURATEUR */
          .mqc .cfg{background:var(--accent);color:var(--cream);padding:24px 18px;}
          .mqc .cfg-lead{font-family:Georgia,serif;font-weight:600;font-size:20px;line-height:1.22;}
          .mqc .cfg-sub{font-size:12.5px;color:#CFE0D3;margin:8px 0 18px;line-height:1.5;}
          .mqc .cfg .q{margin-bottom:16px;}
          .mqc .cfg .lab{font-size:11.5px;font-weight:600;margin-bottom:8px;color:#DDEAE0;}
          .mqc .cfg .opts{display:flex;flex-direction:column;gap:6px;}
          .mqc .cfg .opt{border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.06);border-radius:11px;padding:11px 13px;font-size:12.5px;font-family:inherit;cursor:pointer;text-align:left;color:var(--cream);}
          .mqc .cfg .opt.on{background:var(--cream);color:var(--accent);font-weight:600;border-color:var(--cream);}
          .mqc .cfg .go{width:100%;background:var(--cream);color:var(--accent);border:none;border-radius:24px;padding:13px;font-size:13.5px;font-weight:600;font-family:inherit;cursor:pointer;margin-top:4px;}
          .mqc .cfg .go:disabled{opacity:.4;cursor:not-allowed;}
          .mqc .result{background:var(--accent-soft);border-top:1px solid var(--line);padding:22px 18px;}
          .mqc .result .ack{font-size:12.5px;line-height:1.5;margin-bottom:14px;}
          .mqc .result .ack b{color:var(--accent);}
          .mqc .feat{border:1px solid var(--accent);border-radius:13px;padding:15px;background:var(--surface);position:relative;}
          .mqc .feat .pill{position:absolute;top:-9px;left:13px;background:var(--accent);color:var(--cream);font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;font-weight:600;padding:3px 9px;border-radius:12px;}
          .mqc .feat h4{font-family:Georgia,serif;font-size:15px;font-weight:600;margin-bottom:5px;}
          .mqc .feat p{font-size:12px;color:var(--muted);line-height:1.5;}
          .mqc .feat ul{margin-top:8px;list-style:none;}
          .mqc .feat li{font-size:11.5px;padding:4px 0 4px 15px;position:relative;line-height:1.4;}
          .mqc .feat li::before{content:"—";position:absolute;left:0;color:var(--accent);}
          .mqc .others{margin-top:10px;font-size:11.5px;color:var(--muted);line-height:1.5;}
          /* CLÔTURE */
          .mqc .close{padding:24px 20px 28px;text-align:center;border-top:1px solid var(--line);}
          .mqc .close .t{font-family:Georgia,serif;font-size:18px;font-weight:600;margin-bottom:6px;}
          .mqc .close .p{font-size:12.5px;color:var(--muted);line-height:1.55;}
          .mqc .close .p b{color:var(--ink);}
          .mqc .close .lead{margin-top:16px;}
          .mqc .close .urg{font-size:10.5px;color:var(--muted);margin-top:14px;line-height:1.45;}
          .mqc .close .urg b{color:var(--ink);}
          /* BARRE FIXE unique */
          .mqc .bar{position:fixed;left:0;right:0;bottom:0;max-width:520px;margin:0 auto;background:rgba(255,255,255,.96);backdrop-filter:blur(8px);border-top:1px solid var(--line);padding:10px 12px 14px;display:flex;gap:8px;z-index:20;}
          .mqc .bar a{flex:1;text-align:center;text-decoration:none;border-radius:22px;padding:12px;font-size:12.5px;font-weight:600;cursor:pointer;}
          .mqc .bar .call{border:1px solid var(--ink);color:var(--ink);}
          .mqc .bar .rdv{background:var(--accent);color:var(--cream);}
        `,
        }}
      />

      <AccueilIntelligent
        slug={slug}
        profil="C"
        praticien={nom}
        termePublic={termePublic}
        accent={accent}
        faq={content.faq}
        showUrgence={showUrgence}
        confirmation={confirmation}
        moteur={moteur}
        busyWord={busyWord}
        hideBubble
      />

      <div className="banner">✦ Maquette préparée pour {nom} — pas encore en ligne</div>

      <div className="hero">
        <div className="img" style={heroPhoto ? { backgroundImage: `url("${heroPhoto}")` } : undefined} />
        <div className="veil" />
        <div className="txt">
          <div className="k">{roleLine}</div>
          <h2>{nom}</h2>
          <div className="sub">Sur rendez-vous{shortAddr ? ` · ${shortAddr}` : ""}</div>
          <div className="acts">
            {telHref && <a className="a-call" href={telHref}>📞 Appeler</a>}
            <a className="a-rdv" data-accueil-open>Prendre rendez-vous</a>
          </div>
        </div>
      </div>

      <a className="teaser" href="#mqc-cfg">
        <span className="ic">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" /><circle cx="12" cy="12" r="3.2" /></svg>
        </span>
        <span className="tx">Ce site n’est pas figé : <b>il s’adaptera à votre façon de travailler.</b></span>
        <span className="go2">↓</span>
      </a>

      <section>
        <div className="sec-k">Mon approche</div>
        <div className="sec-h">{content.approcheTitre}</div>
        <div className="sec-p">{content.approcheCorps}</div>
      </section>

      {gallery.length > 0 && (
        <section className="alt">
          <div className="sec-k">Le cabinet</div>
          <div className="sec-h">En images</div>
          <div className={galClass}>
            {(gallery.length >= 4 ? gallery.slice(0, 4) : gallery).map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} alt={`${nom} — photo ${i + 1}`} loading="lazy" />
            ))}
          </div>
        </section>
      )}

      {content.consultTitre && content.consultCartes.length > 0 && (
        <section>
          <div className="sec-k">Consultations</div>
          <div className="sec-h">{content.consultTitre}</div>
          <div className="cards">
            {content.consultCartes.map((c) => (
              <div className="c" key={c.h}><h4>{c.h}</h4><p>{c.p}</p></div>
            ))}
          </div>
          <div className="proposed">Textes proposés, ajustables ensemble.</div>
        </section>
      )}

      {showAvis && avisMode === "prominent" && (
        <section className="alt">
          <div className="sec-k">Avis</div>
          <div className="rev-top">
            <div className="rev-score">{note}</div>
            <div><div className="rev-stars">{stars(Number((note || "0").replace(",", ".")))}</div><div className="rev-meta">{reviewsCount} avis Google</div></div>
          </div>
          {reviewsTop.slice(0, 2).map((r, i) => (
            <div className="rev-c" key={i}>
              <div className="q">« {r.text.length > 180 ? r.text.slice(0, 179).trimEnd() + "…" : r.text} »</div>
              <div className="a"><span className="s">{stars(r.stars)}</span>{r.name ? ` · ${r.name}` : ""} · Google</div>
            </div>
          ))}
        </section>
      )}

      {showAvis && avisMode === "doux" && (
        <section className="alt">
          <div className="rev-line"><span className="st">{stars(Number((note || "0").replace(",", ".")))}</span> <b>{note}</b> · {reviewsCount} avis Google</div>
          {reviewsTop.slice(0, 1).map((r, i) => (
            <div className="rev-c" key={i} style={{ marginTop: 12 }}>
              <div className="q">« {r.text.length > 160 ? r.text.slice(0, 159).trimEnd() + "…" : r.text} »</div>
              <div className="a"><span className="s">{stars(r.stars)}</span> · Patient vérifié · Google</div>
            </div>
          ))}
        </section>
      )}

      <MaquetteConfigurateur slug={slug} profil={profil} />

      <section id="rdv">
        <div className="sec-k">Rendez-vous</div>
        <div className="sec-h">Horaires &amp; accès</div>
        {heures.length > 0 && (
          <div className="hours">
            {heures.map((h, i) => (
              <div className="hr" key={i}><span className="d">{h.jours || ""}</span><span className="h">{h.horaires || ""}</span></div>
            ))}
          </div>
        )}
        <div className="map">
          <div className="canvas"><div className="pin"><svg width="24" height="24" viewBox="0 0 24 24" fill={accent}><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" /></svg></div></div>
          <div className="map-addr addr"><span>{shortAddr || villeAff}</span><a href={mapsHref} target="_blank" rel="noreferrer">Itinéraire →</a></div>
        </div>
        {(waHref || doctolibHref) && (
          <div className="contact">
            {telHref && <a href={telHref}>📞 Appeler</a>}
            {waHref && <a className="wa" href={waHref}>💬 WhatsApp</a>}
            {doctolibHref && <a href={doctolibHref} target="_blank" rel="noreferrer">Doctolib</a>}
          </div>
        )}
      </section>

      <section className="alt faq">
        <div className="sec-k">Questions fréquentes</div>
        <div className="sec-h">Avant de venir</div>
        {content.faq.map((f, i) => (
          <details key={i}><summary>{f.q}</summary><p>{f.a}</p></details>
        ))}
      </section>

      <div className="close">
        <div className="t">Ce site peut être le vôtre.</div>
        <div className="p">
          Il vous plaît ? On le met en ligne sous 72 h — ou on change ce que vous voulez.<br />
          Sinon, ça s’arrête là — sans frais, sans relance.
          {phoneDisplay ? <><br /><b>Marius · {phoneDisplay}</b></> : null}
        </div>
        <div className="lead"><LeadForm slug={slug} /></div>
        {showUrgence && (
          <div className="urg"><b>En cas d’urgence</b> : 15 (Samu) · 3114 (prévention du suicide, 24 h/24) · 112</div>
        )}
      </div>

      <div className="bar">
        {telHref && <a className="call" href={telHref}>📞 Appeler</a>}
        <a className="rdv" data-accueil-open>Prendre rendez-vous</a>
      </div>
    </main>
  );
}
