// Maquette publique révélée par le QR de la lettre (le levier de conversion n°1).
// Une vraie mini-vitrine mobile pour le commerçant, nourrie par SES contenus
// Google publics (photos + avis réels) → elle ressemble vraiment à son commerce.
// Un bandeau discret rappelle que c'est une maquette préparée par Marius. Scan tracké.
import { createAdminClient } from "@/lib/supabase/admin";
import { LeadForm } from "../../[slug]/lead-form";
import { IntroOverlay } from "./intro-overlay";
import { FeedbackNudge } from "./feedback-nudge";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const str = (v: unknown) => (v == null ? "" : String(v));
const clip = (t: string, n = 220) => (t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t);

export default async function ApercuMaquette({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("human_vitrine_sites")
    .select("id, business_name, city, activite, address, google_rating, google_reviews, diagnostic")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();

  const row = (data as Record<string, unknown> | null) ?? null;
  if (!row) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui", padding: 24, textAlign: "center" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Lien introuvable</h1>
          <p style={{ color: "#666" }}>Ce lien n&apos;est plus valide. Contactez-nous directement.</p>
        </div>
      </main>
    );
  }

  // Volume de recherches réel (si renseigné) — lecture tolérante : la colonne
  // peut ne pas être migrée. Honnête : aucun chiffre inventé, le bloc « demande »
  // ne s'affiche que si un vrai nombre existe.
  let searchVolume: number | null = null;
  try {
    const { data: r2 } = await supabase
      .from("human_vitrine_sites")
      .select("search_volume")
      .eq("slug", slug)
      .eq("channel", "letter")
      .maybeSingle();
    const sv = (r2 as Record<string, unknown> | null)?.search_volume;
    if (typeof sv === "number" && sv > 0) searchVolume = sv;
  } catch {
    /* colonne non migrée → pas de bloc demande */
  }

  // Tracking du scan (première fois).
  try {
    await supabase
      .from("human_vitrine_sites")
      .update({ contact_scanned_at: new Date().toISOString() })
      .eq("id", str(row.id))
      .is("contact_scanned_at", null);
  } catch {
    /* best-effort */
  }

  const nom = str(row.business_name) || "Votre commerce";
  const ville = str(row.city);
  const activite = str(row.activite) || "Commerce";
  const adresse = str(row.address);
  // Affichage propre : ville en Capitale, métier au singulier (les données sont
  // parfois stockées « dax » / « psychologues » → « Dax » / « psychologue »).
  const capWords = (s: string) => s.toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (_m, p, c) => p + c.toUpperCase());
  const villeAff = capWords(ville);
  const metierSing = activite.trim().toLowerCase().replace(/s$/u, "") || "professionnel";
  const rating = typeof row.google_rating === "number" ? row.google_rating : null;
  const reviews = typeof row.google_reviews === "number" ? row.google_reviews : null;
  const diag = (row.diagnostic && typeof row.diagnostic === "object" ? row.diagnostic : {}) as Record<string, unknown>;
  const horaires = (Array.isArray(diag.horaires) ? diag.horaires : []) as Array<{ jours?: string; horaires?: string }>;

  // Contenus RÉELS de la fiche Google (récupérés au diagnostic).
  const photos = (Array.isArray(diag.photos) ? diag.photos : [])
    .map((p) => str(p))
    .filter((u) => /^https?:\/\//i.test(u))
    .slice(0, 6);
  const reviewsTop = (Array.isArray(diag.reviews_top) ? diag.reviews_top : [])
    .map((r) => (typeof r === "object" && r ? (r as Record<string, unknown>) : {}))
    .map((r) => ({ name: str(r.name), text: str(r.text), stars: typeof r.stars === "number" ? (r.stars as number) : null }))
    .filter((r) => r.text.length > 0)
    .slice(0, 3);
  const heroPhoto = photos[0] || "";
  const galleryPhotos = photos.slice(heroPhoto ? 1 : 0);

  const waDigits = (process.env.SITE_LETTER_WHATSAPP || "").replace(/\D/g, "");
  const phoneDisplay = process.env.SITE_LETTER_PHONE || "";
  const telHref = waDigits ? `tel:+${waDigits}` : "";
  const waHref = waDigits ? `https://wa.me/${waDigits}?text=${encodeURIComponent(`Bonjour, j'ai vu la maquette pour ${nom}, elle me plaît !`)}` : "";
  const mapsHref = `https://www.google.com/maps/search/${encodeURIComponent(`${nom} ${ville}`)}`;
  const note = rating != null ? rating.toFixed(1).replace(".", ",") : null;
  const stars = rating != null ? "★".repeat(Math.round(rating)) + "☆".repeat(Math.max(0, 5 - Math.round(rating))) : "";
  const rvStars = (n: number | null) => "★".repeat(n != null ? Math.max(1, Math.min(5, Math.round(n))) : 5);

  const services = ["Nos prestations", "Prendre rendez-vous", "Nous contacter"];

  return (
    <main className="mq">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .mq{--dk:#0B0D12;--cr:#FBFAF7;--gold:#B8A87A;--soft:#8E93A0;
            font-family:'Inter',system-ui,-apple-system,sans-serif;color:#14140F;background:#fff;
            max-width:520px;margin:0 auto;padding-bottom:96px;-webkit-font-smoothing:antialiased;}
          .mq *{box-sizing:border-box;}
          .mq .ribbon{background:var(--gold);color:#14140F;font-size:12.5px;font-weight:600;text-align:center;padding:8px 14px;line-height:1.3;}
          .mq .hero{position:relative;background:var(--dk);color:var(--cr);overflow:hidden;}
          .mq .hero-photo{position:absolute;inset:0;background-size:cover;background-position:center;}
          .mq .hero-photo::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,13,18,.58) 0%,rgba(11,13,18,.84) 58%,rgba(11,13,18,.96) 100%);}
          .mq .hero-inner{position:relative;padding:30px 22px 26px;}
          .mq .kicker{font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#CDD1DA;}
          .mq .hname{font-family:Georgia,'Times New Roman',serif;font-size:34px;line-height:1.05;font-weight:700;margin:8px 0 6px;}
          .mq .hsub{color:#C7CBD4;font-size:14px;}
          .mq .rev{margin-top:14px;font-size:14px;color:#EBD9A8;}
          .mq .rev b{color:#fff;font-weight:700;}
          /* ---- Avis Google : ils sautent au visage au scan ---- */
          .mq .grev{margin-top:20px;background:#fff;color:#14140F;border-radius:18px;padding:18px 20px;display:flex;align-items:center;gap:18px;box-shadow:0 10px 30px rgba(0,0,0,.28);}
          .mq .grev-score{font-family:Georgia,serif;font-size:46px;font-weight:700;line-height:1;color:#14140F;}
          .mq .grev-right{flex:1;min-width:0;}
          .mq .grev-stars{color:#FBBC04;font-size:22px;letter-spacing:2px;line-height:1;}
          .mq .grev-glabel{margin-top:7px;font-size:13.5px;color:#5F6368;display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
          .mq .glogo{font-weight:700;font-size:15px;letter-spacing:-.5px;font-family:Arial,sans-serif;}
          .mq .glogo .b{color:#4285F4;}.mq .glogo .r{color:#EA4335;}.mq .glogo .y{color:#FBBC04;}.mq .glogo .b2{color:#4285F4;}.mq .glogo .g{color:#34A853;}.mq .glogo .r2{color:#EA4335;}
          .mq .grev-link{display:inline-block;margin-top:2px;font-size:13px;color:#1a73e8;font-weight:600;text-decoration:none;}
          .mq .grev-badge{margin-left:auto;flex:none;align-self:flex-start;font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#188038;background:#E6F4EA;border-radius:999px;padding:5px 10px;}
          .mq .cta{display:flex;gap:10px;margin-top:20px;}
          .mq .cta a{flex:1;text-align:center;padding:14px;border-radius:14px;font-weight:700;font-size:15px;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:7px;}
          .mq .cta .call{background:var(--cr);color:var(--dk);}
          .mq .cta .wa{background:#25D366;color:#052e16;}
          .mq .sec{padding:24px 22px;border-bottom:1px solid #EEECE6;}
          .mq .sec h2{font-family:Georgia,serif;font-size:20px;margin:0 0 12px;}
          .mq .sec .sub{color:#8A877E;font-size:13px;margin:-6px 0 14px;}
          /* ---- Galerie photos réelles ---- */
          .mq .gallery{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
          .mq .gallery img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:12px;display:block;background:#EEECE6;}
          .mq .gallery img.big{grid-column:1 / -1;aspect-ratio:16/9;}
          /* ---- Emplacements photos (repli honnête) ---- */
          .mq .cards{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;}
          .mq .card{aspect-ratio:1;border-radius:12px;background:linear-gradient(160deg,#F3F1EC,#E7E4DC);border:1px dashed #D6D3CB;display:flex;align-items:center;justify-content:center;color:#B4B1A8;font-size:11px;text-align:center;padding:6px;}
          /* ---- Avis en toutes lettres ---- */
          .mq .rvcard{border:1px solid #EDEBE5;border-radius:14px;padding:14px 16px;margin-bottom:10px;background:#fff;}
          .mq .rvhead{display:flex;align-items:center;justify-content:space-between;gap:8px;}
          .mq .rvstars{color:#FBBC04;font-size:13px;letter-spacing:1px;}
          .mq .rvg{font-size:10px;color:#8A877E;font-weight:600;letter-spacing:.04em;}
          .mq .rvtext{font-size:14.5px;line-height:1.5;color:#2A2A24;margin:7px 0 8px;}
          .mq .rvname{font-size:12.5px;color:#8A877E;font-weight:600;}
          .mq .hours div{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #F0EEE8;font-size:14.5px;}
          .mq .hours div b{font-weight:600;}
          .mq .svc{display:flex;gap:10px;flex-wrap:wrap;}
          .mq .svc span{border:1px solid #E0DDD4;border-radius:999px;padding:8px 14px;font-size:13.5px;color:#444;}
          .mq .lead-wrap{padding:26px 22px 8px;}
          .mq .lead-kick{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);font-weight:700;margin-bottom:6px;}
          .mq .maq-note{padding:20px 22px;background:#FBFAF7;border-top:1px solid #EEECE6;color:#6E6E64;font-size:13px;line-height:1.5;text-align:center;}
          .mq .maq-note b{color:#14140F;}
          .mq .dock{position:fixed;left:0;right:0;bottom:0;max-width:520px;margin:0 auto;background:#fff;border-top:1px solid #E4E1D9;padding:10px 14px;display:flex;gap:10px;}
          .mq .dock a{flex:1;text-align:center;padding:13px;border-radius:12px;font-weight:800;font-size:15px;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:7px;}
          .mq .dock .call{background:var(--dk);color:#fff;}
          .mq .dock .wa{background:#25D366;color:#052e16;}
          /* ===== ACTE 2 — l'explication, APRÈS l'immersion dans le site ===== */
          /* Projection émotionnelle (bloc chaud) → bascule vers « pourquoi ce site ». */
          .mq .project{padding:32px 22px;text-align:center;background:#FBF7EF;border-top:1px solid #EEE7D9;border-bottom:1px solid #EEE7D9;}
          .mq .project .p-lead{font-family:Georgia,serif;font-size:22px;font-weight:700;color:#14140F;}
          .mq .project .p-body{font-size:15px;color:#5A554C;line-height:1.55;margin:12px auto 0;max-width:392px;}
          .mq .project .p-body b{color:#14140F;}
          .mq .project .p-acts{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:16px auto 0;max-width:360px;}
          .mq .project .p-acts span{background:#fff;border:1px solid #E4DECF;border-radius:999px;padding:8px 14px;font-size:13px;color:#3A3A32;font-weight:500;}
          .mq .project .p-tail{font-family:Georgia,serif;font-style:italic;font-size:15px;color:#8A857A;margin-top:16px;}
          /* Dernier maillon du flux : la feature aboutit au bénéfice business. */
          .mq .spot .step.out{background:#171B24;border-color:#3A3320;}
          .mq .spot .step.out .n{background:transparent;color:#E8C24A;font-size:16px;}
          .mq .spot .step.out .tx b{color:#E8C24A;}
          /* Projection « dans 6 mois » — QUALITATIVE (aucun chiffre inventé). */
          .mq .six{padding:30px 22px;text-align:center;background:#FBF7EF;border-top:1px solid #EEE7D9;border-bottom:1px solid #EEE7D9;}
          .mq .six .six-lead{font-family:Georgia,serif;font-size:23px;font-weight:700;color:#14140F;}
          .mq .six .six-items{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:16px auto 0;max-width:380px;}
          .mq .six .six-items span{background:#fff;border:1px solid #E4DECF;border-radius:999px;padding:8px 14px;font-size:13px;color:#3A3A32;font-weight:500;}
          .mq .six .six-tail{margin-top:16px;font-size:14.5px;color:#5A554C;line-height:1.5;}
          .mq .six .six-tail b{color:#14140F;font-weight:700;}
          .mq .spot{background:var(--dk);color:var(--cr);padding:30px 24px;text-align:center;}
          .mq .spot .pre{font-family:Georgia,serif;font-size:22px;font-weight:700;line-height:1.25;}
          .mq .spot .feat{display:inline-flex;align-items:center;gap:8px;margin-top:16px;background:#171B24;border:1px solid #2A2F3B;border-radius:999px;padding:9px 16px;font-weight:700;font-size:14px;color:#E8C24A;}
          .mq .spot .flow{margin-top:22px;display:flex;flex-direction:column;gap:0;}
          .mq .spot .step{display:flex;align-items:center;gap:12px;text-align:left;padding:11px 14px;background:#12161E;border:1px solid #232833;border-radius:12px;}
          .mq .spot .step .n{width:24px;height:24px;border-radius:50%;background:#E8C24A;color:#14140F;font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center;flex:none;}
          .mq .spot .step .tx{font-size:13.5px;color:#DFE3EA;line-height:1.3;}
          .mq .spot .arw{color:#3A4150;font-size:15px;padding:3px 0;}
          .mq .spot .concl{margin-top:20px;font-size:14px;color:#AEB2BC;line-height:1.5;}
          .mq .spot .concl b{color:#E8C24A;}
          .mq .demand2{padding:28px 22px;text-align:center;border-bottom:1px solid #EEECE6;}
          .mq .demand2 .num{font-family:Georgia,serif;font-size:42px;font-weight:700;line-height:1;color:#14140F;}
          .mq .demand2 .cap{font-size:15px;color:#6E6E64;margin-top:8px;line-height:1.45;}
          .mq .demand2 .cap b{color:#14140F;}
          .mq .demand2 .tie{margin-top:14px;font-size:13.5px;color:#8A6D1E;background:#FBF4E2;border:1px solid #EAD9A9;border-radius:10px;padding:10px 14px;line-height:1.4;}
          .mq .cmp{padding:26px 22px;border-bottom:1px solid #EEECE6;}
          .mq .cmp h2{font-family:Georgia,serif;font-size:20px;margin-bottom:4px;}
          .mq .cmp .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px;}
          .mq .cmp .col{border:1px solid #E4E1D9;border-radius:14px;padding:15px 14px;}
          .mq .cmp .col.you{border-color:#14140F;box-shadow:0 6px 18px rgba(0,0,0,.08);}
          .mq .cmp .col .t{font-size:11px;letter-spacing:.08em;text-transform:uppercase;font-weight:700;color:#8A877E;margin-bottom:10px;}
          .mq .cmp .col.you .t{color:#14140F;}
          .mq .cmp .col .li{display:flex;gap:7px;align-items:flex-start;font-size:13px;padding:4px 0;color:#3A3A32;line-height:1.3;}
          .mq .cmp .col .li .c{color:#188038;font-weight:800;flex:none;}
          .mq .cmp .col .end{font-size:11.5px;color:#B4B1A8;margin-top:6px;font-style:italic;}
        `,
        }}
      />

      <IntroOverlay />
      <FeedbackNudge targetId="mq-act2" />

      <div className="ribbon">✦ Maquette préparée pour {nom} — pas encore en ligne</div>

      <section className="hero">
        {heroPhoto && <div className="hero-photo" style={{ backgroundImage: `url("${heroPhoto}")` }} />}
        <div className="hero-inner">
          <div className="kicker">{activite}{ville ? ` · ${ville}` : ""}</div>
          <div className="hname">{nom}</div>
          <div className="hsub">Votre nouvelle vitrine, claire et mobile — comme la verraient vos clients.</div>
          {note && reviews != null && reviews > 0 ? (
            <div className="grev">
              <div className="grev-score">{note}</div>
              <div className="grev-right">
                <div className="grev-stars">{stars}</div>
                <div className="grev-glabel">
                  <span className="glogo"><span className="b">G</span><span className="r">o</span><span className="y">o</span><span className="b2">g</span><span className="g">l</span><span className="r2">e</span></span>
                  <span>· {reviews} avis</span>
                </div>
                <a className="grev-link" href={mapsHref} target="_blank" rel="noreferrer">Voir les avis →</a>
              </div>
              {rating != null && rating >= 4.5 && <span className="grev-badge">Recommandé</span>}
            </div>
          ) : note ? (
            <div className="rev"><b>{stars}</b> &nbsp;{note}/5</div>
          ) : null}
          <div className="cta">
            {telHref && <a className="call" href={telHref}>📞 Appeler</a>}
            {waHref && <a className="wa" href={waHref}>💬 WhatsApp</a>}
          </div>
        </div>
      </section>

      <section className="sec">
        <h2>Ce que nous faisons</h2>
        <div className="svc">
          {services.map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
      </section>

      <section className="sec">
        <h2>En images</h2>
        {galleryPhotos.length > 0 ? (
          <div className="gallery">
            {galleryPhotos.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} className={galleryPhotos.length >= 3 && i === 0 ? "big" : ""} src={src} alt={`${nom} — photo ${i + 1}`} loading="lazy" />
            ))}
          </div>
        ) : (
          <>
            <div className="sub">Vos plus belles photos seront mises en avant ici.</div>
            <div className="cards">
              <div className="card">Vos photos</div>
              <div className="card">Vos photos</div>
              <div className="card">Vos photos</div>
            </div>
          </>
        )}
      </section>

      {reviewsTop.length > 0 && (
        <section className="sec">
          <h2>Ils en parlent</h2>
          {note && <div className="sub">{stars} {note}/5 sur Google{reviews != null ? ` · ${reviews} avis` : ""}</div>}
          {reviewsTop.map((r, i) => (
            <div className="rvcard" key={i}>
              <div className="rvhead">
                <span className="rvstars">{rvStars(r.stars)}</span>
                <span className="rvg">AVIS GOOGLE</span>
              </div>
              <p className="rvtext">« {clip(r.text)} »</p>
              {r.name && <div className="rvname">{r.name}</div>}
            </div>
          ))}
        </section>
      )}

      {horaires.length > 0 && (
        <section className="sec">
          <h2>Horaires</h2>
          <div className="hours">
            {horaires.slice(0, 7).map((h, i) => (
              <div key={i}><span>{str(h.jours)}</span><b>{str(h.horaires)}</b></div>
            ))}
          </div>
        </section>
      )}

      <section className="sec">
        <h2>Nous trouver</h2>
        <p style={{ margin: "0 0 12px", color: "#6E6E64", fontSize: 14.5 }}>{adresse || ville}</p>
        <a href={mapsHref} style={{ color: "#14140F", fontWeight: 600, textDecoration: "underline" }}>Voir l&apos;itinéraire →</a>
      </section>

      <section className="project" id="mq-act2">
        <div className="p-lead">Imaginez.</div>
        <div className="p-body">Ce soir, un habitant de {villeAff || "votre ville"} cherche un {metierSing}. Il tombe sur cette page. En moins de <b>10 secondes</b>, il peut :</div>
        <div className="p-acts"><span>📞 vous appeler</span><span>💬 vous écrire</span><span>⭐ lire vos avis</span><span>📍 vous localiser</span></div>
        <div className="p-tail">Sans chercher. Sans hésiter.</div>
      </section>

      <section className="spot">
        <div className="pre">Ce n&apos;est pas qu&apos;une vitrine.<br />C&apos;est un site qui travaille pour vous.</div>
        <div className="feat">⭐ Assistant Avis Google</div>
        <div className="flow">
          <div className="step"><span className="n">1</span><span className="tx">Après chaque client, vous ouvrez votre espace privé.</span></div>
          <div className="arw">↓</div>
          <div className="step"><span className="n">2</span><span className="tx">Un clic : votre message de remerciement est déjà prêt sur WhatsApp.</span></div>
          <div className="arw">↓</div>
          <div className="step"><span className="n">3</span><span className="tx">Le client laisse son avis Google en quelques secondes.</span></div>
          <div className="arw">↓</div>
          <div className="step out"><span className="n">↗</span><span className="tx">Votre visibilité Google grandit — <b>plus d&apos;appels, plus de clients</b>.</span></div>
        </div>
        <div className="concl">Après chaque client, <b>un geste suffit</b>. Votre réputation travaille pour vous, semaine après semaine.</div>
      </section>

      {searchVolume && (
        <section className="demand2">
          <div className="num">≈ {searchVolume}</div>
          <div className="cap">personnes cherchent <b>« {metierSing}{villeAff ? ` à ${villeAff}` : ""} »</b><br />sur Google, chaque mois.</div>
          <div className="tie">⭐ Chaque nouvel avis vous rapproche de la première place — devant vos concurrents.</div>
        </section>
      )}

      <section className="cmp">
        <h2>La différence</h2>
        <div className="grid">
          <div className="col">
            <div className="t">Site classique</div>
            <div className="li"><span className="c">✓</span>Beau</div>
            <div className="li"><span className="c">✓</span>Moderne</div>
            <div className="end">…et c&apos;est tout.</div>
          </div>
          <div className="col you">
            <div className="t">Votre futur site</div>
            <div className="li"><span className="c">✓</span>Beau</div>
            <div className="li"><span className="c">✓</span>Moderne</div>
            <div className="li"><span className="c">✓</span>Demande des avis</div>
            <div className="li"><span className="c">✓</span>Facilite les contacts</div>
            <div className="li"><span className="c">✓</span>Travaille votre visibilité</div>
          </div>
        </div>
      </section>

      <section className="six">
        <div className="six-lead">Et dans six mois&nbsp;?</div>
        <div className="six-items">
          <span>⭐ Plus d&apos;avis Google</span>
          <span>📞 Plus d&apos;appels</span>
          <span>💬 Plus de demandes WhatsApp</span>
          <span>🌍 Une meilleure visibilité</span>
        </div>
        <div className="six-tail">Votre futur site n&apos;a qu&apos;un objectif : <b>transformer des visiteurs en clients.</b></div>
      </section>

      <div className="lead-wrap">
        <div className="lead-kick">En ligne sous 72 h</div>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: 22, margin: "0 0 6px" }}>Ce site peut être le vôtre.</h2>
        <p style={{ color: "#6E6E64", fontSize: 14, margin: "0 0 14px" }}>
          Il ne manque que votre accord. Laissez votre numéro ou appelez-moi — c&apos;est Marius. Vous ne payez que s&apos;il vous plaît.
        </p>
        <LeadForm slug={slug} />
      </div>

      <div className="maq-note">
        <b>C&apos;est une maquette, faite pour {nom}.</b><br />
        Elle vous plaît ? On la met en ligne en 72 h. Sinon, ça s&apos;arrête là — sans frais, sans engagement.
        {phoneDisplay ? <><br />Marius · {phoneDisplay}</> : null}
      </div>

      <div className="dock">
        {telHref && <a className="call" href={telHref}>📞 Appeler</a>}
        {waHref && <a className="wa" href={waHref}>💬 WhatsApp</a>}
      </div>
    </main>
  );
}
