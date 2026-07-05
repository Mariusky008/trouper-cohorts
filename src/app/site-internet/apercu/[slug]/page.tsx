// Maquette publique révélée par le QR de la lettre (le levier de conversion n°1).
// Une vraie mini-vitrine mobile pour le commerçant, nourrie par SES contenus
// Google publics (photos + avis réels) → elle ressemble vraiment à son commerce.
// Un bandeau discret rappelle que c'est une maquette préparée par Marius. Scan tracké.
import { createAdminClient } from "@/lib/supabase/admin";
import { LeadForm } from "../../[slug]/lead-form";

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
        `,
        }}
      />

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
