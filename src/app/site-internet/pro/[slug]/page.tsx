// Espace Pro privé — l'« Assistant Avis Google ».
// Le commerçant ouvre ce lien privé (token dans l'URL, ?k=…) sur son téléphone.
// En un geste après chaque client, il ouvre WhatsApp avec un message pré-rédigé
// contenant le lien d'avis Google. Aucun CRM, aucune API : un simple wa.me.
// Ses clients ne voient jamais cette page (aucun lien public n'y mène).
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveMetier } from "@/lib/site-internet/metier-profiles";
import { resolveMetierContent } from "@/lib/site-internet/metier-content";
import { ProActions } from "./pro-actions";
import { ProContacts } from "./pro-contacts";
import { ProRelance } from "./pro-relance";
import { ProAgenda } from "./pro-agenda";
import { ProAssistant } from "./pro-assistant";
import { ProDashboard } from "./pro-dashboard";
import { ProGallery } from "./pro-gallery";
import { ProServices } from "./pro-services";
import { ProMotifs } from "./pro-motifs";
import { ProReviewAlert } from "./pro-review-alert";
import { ProBriefing } from "./pro-briefing";
import { ProTabs, type ProTab } from "./pro-tabs";
import { ProGroup, type Sub } from "./pro-group";
import { ProAssistantHub } from "./pro-assistant-hub";
import { ReviewRefresh } from "./review-refresh";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Lien PRIVÉ (jeton ?k=…) : jamais indexé, et aucun aperçu de partage hérité du
// catalogue Privilège. Neutre et discret si le pro le colle quelque part.
export const metadata: Metadata = {
  title: "Espace pro privé",
  description: "Votre espace privé.",
  robots: { index: false, follow: false },
  openGraph: { title: "Espace pro privé", description: "", images: [] },
};

const str = (v: unknown) => (v == null ? "" : String(v));

function NotFound() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui", padding: 24, textAlign: "center" }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Lien introuvable</h1>
        <p style={{ color: "#666" }}>Ce lien privé n&apos;est plus valide. Contactez-nous directement.</p>
      </div>
    </main>
  );
}

export default async function EspacePro({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ k?: string }>;
}) {
  const { slug } = await params;
  const { k } = await searchParams;
  const token = str(k).trim();
  if (!token) return <NotFound />;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("human_vitrine_sites")
    .select("id, business_name, city, activite, google_rating, google_reviews, google_place_id, pro_token")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();

  const row = (data as Record<string, unknown> | null) ?? null;
  // Accès refusé si le jeton ne correspond pas (ou n'a pas encore été généré).
  if (!row || !row.pro_token || str(row.pro_token) !== token) return <NotFound />;

  const nom = str(row.business_name) || "Votre commerce";
  const ville = str(row.city);
  const activite = str(row.activite) || "Commerce";
  const placeId = str(row.google_place_id);
  const rating = typeof row.google_rating === "number" ? row.google_rating : null;
  const reviews = typeof row.google_reviews === "number" ? row.google_reviews : null;

  // Garde-fou déontologique (NON négociable) : la sollicitation d'avis et la
  // relance créneaux sont réservées aux métiers non réglementés (déonto none).
  // En santé (B/C) et droit (D) : AUCUN bouton — ni avis sollicités, ni relance
  // commerciale. L'affichage des avis existants reste permis si avis_affichage.
  const mp = resolveMetier(activite);
  const soliciter = mp.def.avis_sollicitation; // A commerce/bien-être uniquement
  const afficherAvis = mp.def.avis_affichage; // A + B ; jamais C/D
  // Contenu suggéré (exemples métier) pour amorcer « Mes accompagnements » et
  // « Pour quoi venir me voir ? ». Le pro reste libre de tout reformuler.
  const metierContent = resolveMetierContent(activite, mp.profil);
  const serviceSuggestions = metierContent.demoServices ?? [];
  const motifSuggestions = metierContent.motifs ?? [];

  // Lien d'avis Google : le deep link « écrire un avis » si on a le place_id
  // (récupéré au diagnostic), sinon un repli honnête vers la fiche Maps.
  const reviewLink = placeId
    ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${nom} ${ville}`)}`;

  // Journal du jour (« vos demandes du jour »).
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  let history: { client_name: string | null; created_at: string }[] = [];
  try {
    const { data: reqs } = await supabase
      .from("human_site_review_requests")
      .select("client_name, created_at")
      .eq("site_id", str(row.id))
      .gte("created_at", startOfDay.toISOString())
      .order("created_at", { ascending: false })
      .limit(20);
    if (Array.isArray(reqs)) history = reqs as typeof history;
  } catch {
    /* table pas encore migrée → historique vide, la page reste fonctionnelle */
  }

  const note = rating != null ? rating.toFixed(1).replace(".", ",") : null;
  // Objectif motivant (pas une promesse) : le prochain palier au-dessus du réel.
  const goal = reviews != null ? Math.max(100, Math.ceil((reviews + 20) / 50) * 50) : 100;
  const goalPct = reviews != null ? Math.min(100, Math.round((reviews / goal) * 100)) : 0;

  // Suivi dans le temps (« +N avis ») — lecture tolérante : colonnes peut-être
  // pas migrées. Au 1er passage, on ancre le point de départ = total actuel.
  let baseline: number | null = null;
  let refreshedAt = "";
  try {
    const { data: t } = await supabase
      .from("human_vitrine_sites")
      .select("pro_reviews_baseline, google_reviews_refreshed_at")
      .eq("id", str(row.id))
      .maybeSingle();
    if (t) {
      baseline = typeof (t as Record<string, unknown>).pro_reviews_baseline === "number" ? ((t as Record<string, unknown>).pro_reviews_baseline as number) : null;
      refreshedAt = str((t as Record<string, unknown>).google_reviews_refreshed_at);
    }
    if (baseline == null && reviews != null) {
      await supabase
        .from("human_vitrine_sites")
        .update({ pro_reviews_baseline: reviews, pro_baseline_at: new Date().toISOString() })
        .eq("id", str(row.id));
      baseline = reviews;
    }
  } catch {
    /* colonnes non migrées → pas de delta, la carte reste fonctionnelle */
  }
  const delta = baseline != null && reviews != null && reviews - baseline > 0 ? reviews - baseline : 0;

  // Étoiles honnêtes : reflètent la vraie note (pas 5 pleines si 3,9).
  const rStars = rating != null ? Math.max(1, Math.min(5, Math.round(rating))) : 5;
  const starsOn = "★".repeat(rStars);
  const starsOff = "★".repeat(5 - rStars);

  // ── Tableau de bord : chiffres réels agrégés (best-effort). ──────────────────
  const siteId = str(row.id);
  // Vues : colonne récente → lecture séparée et défensive (page complète même si
  // la migration site_views n'a pas encore été appliquée).
  let views = 0;
  try {
    const { data: v } = await supabase.from("human_vitrine_sites").select("site_views").eq("id", siteId).maybeSingle();
    const vr = (v as Record<string, unknown> | null) ?? null;
    if (vr && typeof vr.site_views === "number") views = vr.site_views;
  } catch {
    /* colonne non migrée → 0 */
  }

  // Alerte nouvel avis : compare le compteur Google actuel à ce que le pro a vu.
  // 1re visite → on ancre le point de départ (aucune fausse alerte). Colonnes
  // récentes → lecture défensive.
  let newReviewCount = 0;
  let ratingDropped = false;
  try {
    const { data: rs } = await supabase.from("human_vitrine_sites").select("pro_reviews_seen, pro_rating_seen").eq("id", siteId).maybeSingle();
    const r = (rs as Record<string, unknown> | null) ?? null;
    let reviewsSeen = r && typeof r.pro_reviews_seen === "number" ? (r.pro_reviews_seen as number) : null;
    let ratingSeen = r && typeof r.pro_rating_seen === "number" ? (r.pro_rating_seen as number) : null;
    if (reviewsSeen == null && reviews != null) {
      reviewsSeen = reviews;
      ratingSeen = rating;
      await supabase.from("human_vitrine_sites").update({ pro_reviews_seen: reviews, pro_rating_seen: rating }).eq("id", siteId);
    }
    if (reviews != null && reviewsSeen != null) newReviewCount = Math.max(0, reviews - reviewsSeen);
    if (rating != null && ratingSeen != null && rating < ratingSeen - 0.01) ratingDropped = true;
  } catch {
    /* colonnes non migrées → pas d'alerte */
  }
  const reviewsUrl = placeId
    ? `https://search.google.com/local/reviews?placeid=${encodeURIComponent(placeId)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${nom} ${ville}`)}`;
  const monthIso = (() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  })();
  const nowKey = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
    .format(new Date())
    .replace(" ", "T")
    .slice(0, 16);
  const cnt = async (q: PromiseLike<{ count: number | null }>): Promise<number> => {
    try {
      const { count } = await q;
      return count ?? 0;
    } catch {
      return 0;
    }
  };
  // Bornes de dates (heure murale Paris) pour le briefing : demain / 7 derniers jours.
  const parisDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  };
  const tomorrowKey = parisDate(1);
  const dayAfterKey = parisDate(2);
  const weekAgoKey = parisDate(-7);
  const [clientsCount, annoncesCount, demandesCount, rdvCount, rdvTomorrow, honoredRecent] = await Promise.all([
    cnt(supabase.from("human_site_contacts").select("id", { count: "exact", head: true }).eq("site_id", siteId).is("opted_out_at", null)),
    cnt(supabase.from("human_site_relances").select("id", { count: "exact", head: true }).eq("site_id", siteId).gte("created_at", monthIso)),
    cnt(supabase.from("human_site_review_requests").select("id", { count: "exact", head: true }).eq("site_id", siteId).gte("created_at", monthIso)),
    cnt(supabase.from("human_site_bookings").select("id", { count: "exact", head: true }).eq("site_id", siteId).eq("status", "confirmed").gte("slot_local", nowKey)),
    cnt(supabase.from("human_site_bookings").select("id", { count: "exact", head: true }).eq("site_id", siteId).eq("status", "confirmed").gte("slot_local", `${tomorrowKey}T00:00`).lt("slot_local", `${dayAfterKey}T00:00`)),
    cnt(supabase.from("human_site_bookings").select("id", { count: "exact", head: true }).eq("site_id", siteId).eq("status", "confirmed").gte("slot_local", `${weekAgoKey}T00:00`).lt("slot_local", nowKey)),
  ]);

  // ── Onglet ACCUEIL : tableau de bord + carte avis (A, B) et/ou note sobre. ──
  const accueilNode = (
    <>
      <ProBriefing
        nom={nom}
        soliciter={soliciter}
        views={views}
        rdvTomorrow={rdvTomorrow}
        honoredRecent={honoredRecent}
        clients={clientsCount}
      />
      {afficherAvis && (
        <ProReviewAlert
          slug={slug}
          token={token}
          newCount={newReviewCount}
          ratingDropped={ratingDropped}
          reviewsUrl={reviewsUrl}
        />
      )}
      <ProDashboard
        views={views}
        rdv={rdvCount}
        avis={delta}
        annonces={annoncesCount}
        demandes={demandesCount}
        clients={clientsCount}
        soliciter={soliciter}
        afficherAvis={afficherAvis}
      />
      {afficherAvis && (
        <div className="gcard">
          <div className="top">
            <span className="lab">Vos avis Google</span>
            <span className="g">
              <svg width="13" height="13" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.9a5 5 0 0 1-2.2 3.3v2.8h3.6c2.1-2 3.2-4.9 3.2-7.9z" /><path fill="#34A853" d="M12 23c2.9 0 5.3-1 7.1-2.6l-3.6-2.8c-1 .7-2.3 1.1-3.5 1.1-2.7 0-5-1.8-5.8-4.3H2.5v2.8A11 11 0 0 0 12 23z" /><path fill="#FBBC05" d="M6.2 14.4a6.6 6.6 0 0 1 0-4.2V7.4H2.5a11 11 0 0 0 0 9.8z" /><path fill="#EA4335" d="M12 5.5c1.5 0 2.9.5 4 1.5l3-3A11 11 0 0 0 2.5 7.4l3.7 2.8C7 7.3 9.3 5.5 12 5.5z" /></svg>
              Google
            </span>
          </div>
          {reviews != null ? (
            <>
              <div className="val">
                <span className="num">{reviews}</span>
                <span>
                  <span className="stars">{starsOn}<span className="off">{starsOff}</span></span>
                  <br />
                  <span className="rate">{note ? `${note} sur 5 · ` : ""}avis vérifiés</span>
                </span>
                {delta > 0 && <span className="delta">📈 +{delta} depuis le début</span>}
              </div>
              <div className="bar"><i style={{ width: `${goalPct}%` }} /></div>
              <div className="goal"><span>Aujourd&apos;hui : {reviews}</span><span>Objectif : {goal}</span></div>
              <ReviewRefresh slug={slug} token={token} refreshedAt={refreshedAt} />
            </>
          ) : (
            <>
              <div className="empty" style={{ marginTop: 8 }}>Chaque avis renforce votre visibilité locale. Commencez à en récolter dès aujourd&apos;hui.</div>
              <ReviewRefresh slug={slug} token={token} refreshedAt={refreshedAt} />
            </>
          )}
        </div>
      )}
      <div className="gcard afcard" style={{ marginTop: 14 }}>
        <span className="lab">🖨️ Affiche à imprimer</span>
        <div className="afsub">
          Une affiche prête à poser à votre caisse : vos client·es scannent le QR pour{soliciter ? " vous laisser un avis ou" : ""} réserver.
        </div>
        <div className="afbtns">
          {soliciter && (
            <a className="afbtn" href={`/site-internet/pro/${slug}/affiche?k=${encodeURIComponent(token)}&type=avis`} target="_blank" rel="noreferrer">⭐ Affiche avis</a>
          )}
          <a className="afbtn" href={`/site-internet/pro/${slug}/affiche?k=${encodeURIComponent(token)}&type=rdv`} target="_blank" rel="noreferrer">📅 Affiche réservation</a>
        </div>
      </div>
      {!soliciter && (
        <div className="gcard" style={{ marginTop: 14 }}>
          <div className="empty">
            Votre espace est volontairement sobre. Votre profession étant encadrée, nous ne sollicitons pas
            d&apos;avis et n&apos;envoyons aucune relance commerciale en votre nom. Votre site et votre accueil
            intelligent travaillent pour vous — dans le respect de votre cadre déontologique.
          </div>
        </div>
      )}
    </>
  );

  // ── 4 onglets clairs (au lieu de 8) centrés sur l'assistante ────────────────
  //  🏠 Accueil = hub de l'assistante (briefing + chiffres + alertes)
  //  📣 Clients = Demander un avis + Ma liste + Annonce (commerce)
  //  📅 Agenda  = dispos + rappels + RDV
  //  🎨 Mon site = Contenu + Photos + Fiche assistante
  const siteSubs: Sub[] = [
    {
      key: "contenu",
      label: "Contenu",
      node: (
        <>
          <ProMotifs slug={slug} token={token} suggestions={motifSuggestions} />
          <div style={{ borderTop: "1px solid var(--hair)", margin: "26px 0 0" }} />
          <ProServices slug={slug} token={token} suggestions={serviceSuggestions} />
        </>
      ),
    },
    { key: "photos", label: "Photos", node: <ProGallery slug={slug} token={token} /> },
    { key: "fiche", label: "Fiche assistante", node: <ProAssistant slug={slug} token={token} /> },
  ];

  const proTabs: ProTab[] = [
    { key: "accueil", label: "Accueil", icon: "🏠", node: accueilNode },
    ...(soliciter
      ? ([
          {
            key: "clients",
            label: "Clients",
            icon: "📣",
            node: (
              <ProGroup
                groupKey="clients"
                subs={[
                  { key: "avis", label: "Demander un avis", node: <ProActions slug={slug} token={token} reviewLink={reviewLink} initialHistory={history} /> },
                  { key: "liste", label: "Ma liste", node: <ProContacts slug={slug} token={token} reviewLink={reviewLink} /> },
                  { key: "annonce", label: "Annonce", node: <ProRelance slug={slug} token={token} /> },
                ]}
              />
            ),
          },
        ] as ProTab[])
      : []),
    { key: "agenda", label: "Agenda", icon: "📅", node: <ProAgenda slug={slug} token={token} canAskReview={soliciter} reviewLink={reviewLink} /> },
    { key: "site", label: "Mon site", icon: "🎨", node: <ProGroup groupKey="site" subs={siteSubs} /> },
  ];

  return (
    <main className="pro">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro{--paper:#FFFFFF;--ink:#191A2C;--soft:#5A5E78;--faint:#9DA0B8;--hair:#ECEDF6;--gold:#F0B429;
            --violet:#6D4AE0;--violet2:#8A6BE0;--grad:linear-gradient(135deg,#8A6BE0,#5B3FA6);
            --green:#12A65C;--sky:#3B82F6;--pink:#EC4899;--amber:#F59E0B;
            font-family:'Inter',system-ui,-apple-system,sans-serif;color:var(--ink);
            background:
              radial-gradient(1100px 480px at 100% -8%,rgba(109,74,224,.10),transparent 60%),
              radial-gradient(820px 420px at -12% 4%,rgba(59,130,246,.07),transparent 55%),
              #F4F5FC;
            min-height:100vh;-webkit-font-smoothing:antialiased;}
          .pro *{box-sizing:border-box;}
          .pro .wrap{max-width:460px;margin:0 auto;min-height:100vh;}
          .pro .pad{padding:22px 18px 104px;}
          .pro .eyebrow{display:inline-flex;align-items:center;gap:6px;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--violet);font-weight:700;background:rgba(109,74,224,.09);border:none;border-radius:999px;padding:6px 12px;}
          .pro .eyebrow svg{width:11px;height:11px;stroke:var(--violet);}
          .pro .name{font-weight:800;font-size:28px;line-height:1.08;margin:13px 0 3px;letter-spacing:-.03em;}
          .pro .role{font-size:13.5px;color:var(--soft);font-weight:500;}
          .pro .lockline{font-size:11px;color:var(--faint);margin:8px 0 2px;line-height:1.4;}
          /* Cartes modernes : blanches, arrondies, ombre douce */
          .pro .gcard{margin-top:16px;border:1px solid var(--hair);border-radius:20px;padding:17px 18px;background:var(--paper);box-shadow:0 12px 32px -20px rgba(25,26,44,.28);}
          .pro .gcard .top{display:flex;align-items:center;justify-content:space-between;}
          .pro .gcard .lab{font-size:11px;letter-spacing:.05em;text-transform:uppercase;color:var(--soft);font-weight:700;}
          .pro .gcard .g{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--faint);font-weight:600;}
          .pro .gcard .val{display:flex;align-items:baseline;gap:11px;margin-top:11px;}
          .pro .gcard .num{font-weight:800;font-size:38px;line-height:1;letter-spacing:-.02em;font-variant-numeric:tabular-nums;}
          .pro .gcard .stars{color:var(--gold);font-size:15px;letter-spacing:1px;}
          .pro .gcard .stars .off{color:rgba(240,180,41,.28);}
          .pro .gcard .rate{font-size:13px;color:var(--soft);}
          .pro .gcard .delta{margin-left:auto;align-self:flex-start;font-size:12px;font-weight:800;color:#0E9E63;background:#E4F7EE;border-radius:999px;padding:5px 11px;white-space:nowrap;}
          .pro .gcard .empty{font-size:13px;color:var(--soft);line-height:1.5;}
          .pro .bar{height:9px;border-radius:999px;background:#EEEFF7;margin-top:15px;overflow:hidden;}
          .pro .bar i{display:block;height:100%;background:var(--grad);border-radius:999px;box-shadow:0 0 12px -2px rgba(109,74,224,.5);}
          .pro .goal{display:flex;justify-content:space-between;font-size:11px;color:var(--faint);margin-top:7px;font-weight:600;}
          .pro .rr{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:14px;padding-top:12px;border-top:1px solid var(--hair);}
          .pro .rr-date{font-size:11.5px;color:var(--faint);}
          .pro .rr-btn{background:#F1EFFB;border:1px solid var(--hair);border-radius:10px;padding:8px 13px;font-size:12.5px;font-weight:700;color:var(--violet);cursor:pointer;font-family:inherit;}
          .pro .afcard .afsub{font-size:12.5px;color:var(--soft);line-height:1.5;margin-top:7px;}
          .pro .afcard .afbtns{display:flex;flex-wrap:wrap;gap:8px;margin-top:13px;}
          .pro .afcard .afbtn{text-decoration:none;border:1px solid var(--hair);background:#fff;color:var(--ink);border-radius:12px;padding:10px 14px;font-size:13px;font-weight:700;box-shadow:0 4px 12px -8px rgba(25,26,44,.22);}
          .pro .afcard .afbtn:active{transform:translateY(1px);}

          /* ══════════ ORDINATEUR : menu latéral + colonne large et aérée ══════════ */
          @media (min-width:900px){
            .pro{padding-left:236px;}
            .pro .wrap{max-width:900px;margin:0 auto;min-height:100vh;}
            .pro .pad{padding:40px 42px 72px;}
            .pro .name{font-size:36px;margin-top:16px;}
            .pro .role{font-size:15px;}
            .pro .dash .grid{grid-template-columns:repeat(3,1fr);gap:13px;}
          }
          @media (min-width:1280px){
            .pro .wrap{max-width:960px;}
          }
          `,
        }}
      />
      <div className="wrap">
        <div className="pad">
          <span className="eyebrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="#6E6E64" strokeWidth="2"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
            Espace pro · privé
          </span>
          <div className="name">{nom}</div>
          <div className="role">{activite}{ville ? ` · ${ville}` : ""}</div>
          <div className="lockline">🔒 Espace privé — vos clients ne voient jamais cette page.</div>

          <ProTabs tabs={proTabs} />
        </div>
      </div>
      <ProAssistantHub slug={slug} token={token} nom={nom} />
    </main>
  );
}
