// Espace Pro privé — l'« Assistant Avis Google ».
// Le commerçant ouvre ce lien privé (token dans l'URL, ?k=…) sur son téléphone.
// En un geste après chaque client, il ouvre WhatsApp avec un message pré-rédigé
// contenant le lien d'avis Google. Aucun CRM, aucune API : un simple wa.me.
// Ses clients ne voient jamais cette page (aucun lien public n'y mène).
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveMetier } from "@/lib/site-internet/metier-profiles";
import { resolveMetierContent } from "@/lib/site-internet/metier-content";
import { peutParticiper } from "@/lib/site-internet/collectif";
import { followCopy } from "@/lib/site-internet/metier-profiles";
import { proPhoneFrom } from "@/lib/site-internet/pro-phone";
import { slugify } from "@/lib/popey-marketplace";
import { ProActions } from "./pro-actions";
import { ProContacts } from "./pro-contacts";
import { ProAnnonces } from "./pro-annonces";
import { ProRelance } from "./pro-relance";
import { ProAgenda } from "./pro-agenda";
import { ProAssistant } from "./pro-assistant";
import { ProHome } from "./pro-home";
import { ProGallery } from "./pro-gallery";
import { ProServices } from "./pro-services";
import { ProMotifs } from "./pro-motifs";
import { ProApproche } from "./pro-approche";
import { ProFaq } from "./pro-faq";
import { ProCollectif } from "./pro-collectif";
import { ProCatalogue } from "./pro-catalogue";
import { ProDiffusion } from "./pro-diffusion";
import { ProRequests } from "./pro-requests";
import { ProReviewAlert } from "./pro-review-alert";
import { ProTabs, type ProTab } from "./pro-tabs";
import { ProGroup } from "./pro-group";
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
    .select("id, business_name, city, activite, google_rating, google_reviews, google_place_id, pro_token, whatsapp_phone_e164, metadata")
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
  // Promesse d'abonnement dans les mots du métier — reprise telle quelle dans le
  // message de présentation WhatsApp, pour que le client reconnaisse ce à quoi il
  // a dit oui. Et le numéro du commerçant, sans lequel l'affiche WhatsApp n'a pas
  // d'objet (le QR n'ouvrirait aucune conversation).
  const followPromesse = followCopy(mp.entry?.secteur ?? "flux").promesse;
  const hasWaNumber = Boolean(proPhoneFrom(row));
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
  // Statut de mise en ligne : le commerçant ne savait pas si son site était
  // vraiment public, ni à quelle adresse. La publication est une action de notre
  // côté — raison de plus pour la lui afficher. Colonnes récentes → défensif.
  let sitePublished = false;
  let siteUrl = `/site-internet/apercu/${slug}`;
  try {
    const { data: pub } = await supabase
      .from("human_vitrine_sites")
      .select("published, custom_domain")
      .eq("id", siteId)
      .maybeSingle();
    const pr = (pub as Record<string, unknown> | null) ?? null;
    sitePublished = Boolean(pr?.published);
    const dom = str(pr?.custom_domain).trim();
    if (sitePublished && dom) siteUrl = `https://${dom}`;
  } catch {
    /* colonnes non migrées → on reste sur l'aperçu */
  }
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

  // ── Le catalogue de la ville : ce qu'il rapporte réellement. ────────────────
  // Colonnes récentes → lecture séparée (la page reste complète sans migration).
  let catViews = 0;
  let catClicks = 0;
  let catActif = true;
  let catHasOffer = false;
  let catVoisins = 0;
  try {
    const { data: cat } = await supabase
      .from("human_vitrine_sites")
      .select("catalogue_views, catalogue_clicks, current_offer, collectif_actif")
      .eq("id", siteId)
      .maybeSingle();
    const cr = (cat as Record<string, unknown> | null) ?? null;
    if (cr) {
      if (typeof cr.catalogue_views === "number") catViews = cr.catalogue_views;
      if (typeof cr.catalogue_clicks === "number") catClicks = cr.catalogue_clicks;
      if (cr.collectif_actif === false) catActif = false;
      const off = (cr.current_offer && typeof cr.current_offer === "object" ? cr.current_offer : null) as Record<string, unknown> | null;
      const until = off && typeof off.until === "string" ? off.until : null;
      // Composant serveur async : ce code s'exécute une fois par requête, jamais
      // au re-rendu — lire l'horloge y est stable. La règle « purity » vise les
      // composants client, elle ne sait pas distinguer les deux.
      // eslint-disable-next-line react-hooks/purity
      const maintenant = Date.now();
      catHasOffer = Boolean(off && str(off.text).trim() && (!until || Date.parse(until) >= maintenant));
    }
  } catch {
    /* migration catalogue non appliquée → carte avec des zéros, jamais d'erreur */
  }
  // Voisins réellement en ligne : on ne promet pas un réseau, on le compte.
  if (ville && soliciter) {
    try {
      const { data: vs } = await supabase
        .from("human_vitrine_sites")
        .select("id, activite")
        .eq("channel", "letter")
        .eq("city", ville)
        .eq("published", true)
        .neq("id", siteId)
        .limit(200);
      const rows = Array.isArray(vs) ? (vs as Array<Record<string, unknown>>) : [];
      catVoisins = rows.filter((r) => peutParticiper(str(r.activite))).length;
    } catch {
      /* best-effort → 0 voisin affiché */
    }
  }
  const villeUrl = ville ? `/ville/${slugify(ville)}` : "";

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
  const [clientsCount, annoncesCount, demandesCount, rdvCount, rdvTomorrow, , demandesNew] = await Promise.all([
    cnt(supabase.from("human_site_contacts").select("id", { count: "exact", head: true }).eq("site_id", siteId).is("opted_out_at", null)),
    cnt(supabase.from("human_site_relances").select("id", { count: "exact", head: true }).eq("site_id", siteId).gte("created_at", monthIso)),
    cnt(supabase.from("human_site_review_requests").select("id", { count: "exact", head: true }).eq("site_id", siteId).gte("created_at", monthIso)),
    cnt(supabase.from("human_site_bookings").select("id", { count: "exact", head: true }).eq("site_id", siteId).eq("status", "confirmed").gte("slot_local", nowKey)),
    cnt(supabase.from("human_site_bookings").select("id", { count: "exact", head: true }).eq("site_id", siteId).eq("status", "confirmed").gte("slot_local", `${tomorrowKey}T00:00`).lt("slot_local", `${dayAfterKey}T00:00`)),
    cnt(supabase.from("human_site_bookings").select("id", { count: "exact", head: true }).eq("site_id", siteId).eq("status", "confirmed").gte("slot_local", `${weekAgoKey}T00:00`).lt("slot_local", nowKey)),
    // Demandes du site en ligne qui attendent encore un rappel.
    cnt(supabase.from("human_site_requests").select("id", { count: "exact", head: true }).eq("site_id", siteId).eq("status", "new")),
  ]);

  // Combien de clients il n'a PAS encore vus. Même mécanique que les avis : on
  // retient ce qu'il a déjà consulté, la différence fait la pastille. Sans
  // repère, on ne saurait dire « nouveau » que de façon arbitraire.
  let clientsNew = 0;
  try {
    const { data: cs } = await supabase
      .from("human_vitrine_sites")
      .select("pro_clients_seen")
      .eq("id", siteId)
      .maybeSingle();
    const vus = (cs as Record<string, unknown> | null)?.pro_clients_seen;
    clientsNew = Math.max(0, clientsCount - (typeof vus === "number" ? vus : 0));
  } catch {
    /* colonne non migrée → aucune pastille, jamais d'erreur */
  }

  // ── Onglet ACCUEIL : tableau de bord + carte avis (A, B) et/ou note sobre. ──
  const accueilNode = (
    <>
      <ProHome
        nom={nom}
        soliciter={soliciter}
        afficherAvis={afficherAvis}
        views={views}
        rdv={rdvCount}
        annonces={annoncesCount}
        demandes={demandesCount}
        clients={clientsCount}
        clientsNew={clientsNew}
        avis={delta}
        rdvTomorrow={rdvTomorrow}
        demandesNew={demandesNew}
        sitePublished={sitePublished}
        siteUrl={siteUrl}
      />
      {soliciter && villeUrl && (
        <ProCatalogue
          ville={ville}
          villeUrl={villeUrl}
          views={catViews}
          clicks={catClicks}
          hasOffer={catHasOffer}
          actif={catActif}
          voisins={catVoisins}
        />
      )}
      {afficherAvis && (
        <ProReviewAlert
          slug={slug}
          token={token}
          newCount={newReviewCount}
          ratingDropped={ratingDropped}
          reviewsUrl={reviewsUrl}
        />
      )}
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

  const proTabs: ProTab[] = [
    { key: "accueil", label: "Accueil", icon: "🏠", node: accueilNode },
    ...(soliciter
      ? ([
          {
            // Action Flash = cœur commercial. Atteint depuis les grandes actions
            // de l'accueil (pas dans la barre du bas, pour désencombrer le menu).
            key: "annonce",
            label: "Annonce",
            icon: "📣",
            hidden: true,
            node: (
              <ProRelance
                slug={slug}
                token={token}
                nom={nom}
                metier={mp.entry?.label ?? activite}
                ville={ville}
                // Pilotent le vocabulaire des Actions Flash : « créneau » chez un
                // coiffeur, « table » au restaurant, « arrivage » en boutique.
                confirmation={mp.entry?.confirmation ?? "reserve"}
                secteur={mp.entry?.secteur ?? "flux"}
                collectifActif={catActif}
                // Le catalogue n'accepte que les sites PUBLIÉS : tant que le
                // sien ne l'est pas, son annonce n'est visible nulle part.
                voisins={catVoisins}
              />
            ),
          },
          {
            key: "annonces",
            label: "Mes annonces",
            icon: "📣",
            hidden: true, // atteint depuis l'accueil
            node: <ProAnnonces slug={slug} token={token} />,
          },
          {
            key: "clients",
            label: "Clients & avis",
            icon: "👥",
            hidden: true, // atteint depuis « Demander un avis » / « Ajouter un client » de l'accueil
            node: (
              <ProGroup
                groupKey="clients"
                subs={[
                  { key: "liste", label: "Ma liste de clients", node: <ProContacts slug={slug} token={token} reviewLink={reviewLink} /> },
                  {
                    key: "diffusion",
                    label: "Liste de diffusion",
                    node: (
                      <ProDiffusion
                        slug={slug}
                        token={token}
                        nom={nom}
                        promesse={followPromesse}
                        hasWa={hasWaNumber}
                      />
                    ),
                  },
                  { key: "avis", label: "Demander un avis", node: <ProActions slug={slug} token={token} reviewLink={reviewLink} initialHistory={history} /> },
                ]}
              />
            ),
          },
        ] as ProTab[])
      : []),
    {
      // Demandes reçues du site en ligne. Caché du menu : on y arrive depuis
      // l'accueil, qui affiche le nombre restant à traiter.
      key: "demandes",
      label: "Demandes reçues",
      icon: "📥",
      hidden: true,
      node: <ProRequests slug={slug} token={token} />,
    },
    { key: "agenda", label: "Agenda", icon: "📅", node: <ProAgenda slug={slug} token={token} canAskReview={soliciter} reviewLink={reviewLink} /> },
    {
      // « Mon site » sur UNE page (blocs empilés) plutôt que des sous-onglets.
      key: "site",
      label: "Mon site",
      icon: "🎨",
      node: (
        <div className="sitepage">
          <a className="af-seeclient" href={`/site-internet/apercu/${slug}`} target="_blank" rel="noreferrer">
            👁 Voir mon site comme un client <span>↗</span>
          </a>
          <div className="siteblock">
            <ProApproche
              slug={slug}
              token={token}
              suggestionTitre={metierContent.approcheTitre}
              suggestionCorps={metierContent.approcheCorps}
            />
            <div style={{ borderTop: "1px solid var(--hair)", margin: "24px 0 0" }} />
            <ProMotifs slug={slug} token={token} suggestions={motifSuggestions} />
            <div style={{ borderTop: "1px solid var(--hair)", margin: "24px 0 0" }} />
            <ProServices slug={slug} token={token} suggestions={serviceSuggestions} />
            <div style={{ borderTop: "1px solid var(--hair)", margin: "24px 0 0" }} />
            <ProFaq slug={slug} token={token} suggestions={metierContent.faq} />
            {soliciter && (
              <>
                <div style={{ borderTop: "1px solid var(--hair)", margin: "24px 0 0" }} />
                <ProCollectif slug={slug} token={token} />
              </>
            )}
          </div>
          <div className="siteblock"><ProGallery slug={slug} token={token} /></div>
          <div className="siteblock"><ProAssistant slug={slug} token={token} /></div>
        </div>
      ),
    },
  ];

  return (
    <main className="pro">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          /* Identité commune au catalogue : encre, crème, or, turquoise.
             « --violet » garde son nom (il est utilisé partout) mais porte
             désormais le turquoise — renommer 40 occurrences pour la même
             valeur n'aurait rien apporté. « --gold » reste l'or des étoiles
             Google, qui n'est pas notre or de marque. */
          .pro{--paper:#FFFFFF;--ink:#12141A;--soft:#5A5E68;--faint:#9AA0AC;--hair:#E8E4DA;--gold:#F0B429;
            --or:#C8A84B;--violet:#00926E;--violet2:#00C896;--grad:linear-gradient(135deg,#00C896,#00926E);
            --green:#12A65C;--sky:#3B82F6;--pink:#EC4899;--amber:#F59E0B;
            font-family:var(--fb),system-ui,-apple-system,sans-serif;color:var(--ink);
            background:
              radial-gradient(1100px 480px at 100% -8%,rgba(0,200,150,.11),transparent 60%),
              radial-gradient(820px 420px at -12% 4%,rgba(200,168,75,.10),transparent 55%),
              #F6F3EC;
            min-height:100vh;-webkit-font-smoothing:antialiased;}
          .pro *{box-sizing:border-box;}
          .pro .wrap{max-width:460px;margin:0 auto;min-height:100vh;}
          .pro .pad{padding:22px 18px 104px;}
          .pro .eyebrow{display:inline-flex;align-items:center;gap:6px;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--violet);font-weight:700;background:rgba(0,200,150,.09);border:none;border-radius:999px;padding:6px 12px;}
          .pro .eyebrow svg{width:11px;height:11px;stroke:var(--violet);}
          .pro .name{font-weight:800;font-size:28px;line-height:1.08;margin:13px 0 3px;letter-spacing:-.03em;}
          .pro .role{font-size:13.5px;color:var(--soft);font-weight:500;}
          .pro .lockline{font-size:11px;color:var(--faint);margin:8px 0 2px;line-height:1.4;}
          /* Cartes modernes : blanches, arrondies, ombre douce */
          .pro .gcard{margin-top:16px;border:1px solid var(--hair);border-radius:20px;padding:17px 18px;background:var(--paper);box-shadow:0 12px 32px -20px rgba(18,20,26,.28);}
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
          .pro .bar{height:9px;border-radius:999px;background:#EBE7DD;margin-top:15px;overflow:hidden;}
          .pro .bar i{display:block;height:100%;background:var(--grad);border-radius:999px;box-shadow:0 0 12px -2px rgba(0,200,150,.5);}
          .pro .goal{display:flex;justify-content:space-between;font-size:11px;color:var(--faint);margin-top:7px;font-weight:600;}
          .pro .rr{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:14px;padding-top:12px;border-top:1px solid var(--hair);}
          .pro .rr-date{font-size:11.5px;color:var(--faint);}
          .pro .rr-btn{background:#E6F7F1;border:1px solid var(--hair);border-radius:10px;padding:8px 13px;font-size:12.5px;font-weight:700;color:var(--violet);cursor:pointer;font-family:inherit;}
          .pro .afcard .afsub{font-size:12.5px;color:var(--soft);line-height:1.5;margin-top:7px;}
          .pro .afcard .afbtns{display:flex;flex-wrap:wrap;gap:8px;margin-top:13px;}
          .pro .afcard .afbtn{text-decoration:none;border:1px solid var(--hair);background:#fff;color:var(--ink);border-radius:12px;padding:10px 14px;font-size:13px;font-weight:700;box-shadow:0 4px 12px -8px rgba(18,20,26,.22);}
          .pro .afcard .afbtn:active{transform:translateY(1px);}
          /* En-tête de l'onglet « Annonce » (Action Flash) */
          .pro .af-lead{border:1px solid rgba(0,200,150,.22);border-radius:20px;padding:20px 20px 18px;background:linear-gradient(160deg,rgba(0,200,150,.10),#fff);box-shadow:0 12px 32px -22px rgba(0,200,150,.5);}
          .pro .af-lead-k{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--violet);font-weight:800;}
          .pro .af-lead-h{font-size:23px;font-weight:850;letter-spacing:-.02em;margin:6px 0 6px;}
          .pro .af-lead-p{font-size:13.5px;color:var(--soft);line-height:1.5;}
          /* Lien « voir mon site comme un client » (relie l'admin au site public) */
          .pro .af-seeclient{display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;margin-bottom:16px;
            border:1px solid var(--hair);background:var(--paper);color:var(--ink);border-radius:13px;padding:13px;font-size:13.5px;font-weight:700;box-shadow:0 8px 22px -16px rgba(18,20,26,.35);}
          .pro .af-seeclient span{color:var(--violet);font-weight:800;}
          .pro .af-seeclient:active{transform:translateY(1px);}
          /* « Mon site » sur une page : chaque domaine dans un bloc-carte distinct */
          .pro .sitepage{display:flex;flex-direction:column;gap:16px;}
          .pro .siteblock{border:1px solid var(--hair);border-radius:18px;padding:18px 17px;background:var(--paper);box-shadow:0 12px 32px -24px rgba(18,20,26,.3);}

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
