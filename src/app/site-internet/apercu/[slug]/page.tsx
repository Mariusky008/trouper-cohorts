// Maquette publique révélée par le QR de la lettre (le levier de conversion n°1).
// Data-loader : lit les données Google réelles du prospect + résout son PROFIL,
// puis rend la maquette UNIFIÉE (composant MaquetteSante) qui s'adapte au profil
// (A commerce / B santé praticité / C santé encadrée) — palette, avis, contact.
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveMetier } from "@/lib/site-internet/metier-profiles";
import { resolveMetierContent } from "@/lib/site-internet/metier-content";
import { SuivreBouton } from "./suivre-bouton";
import { BarreDirect } from "./barre-direct";
import { habitantCourant } from "@/lib/direct/habitant";
import { noterClic } from "@/lib/direct/publications";
import { ceQuOnAime } from "@/lib/direct/aime";
import { AimeSection } from "./aime-section";
import { horairesLisibles } from "@/lib/site-internet/horaires-pro";
import { villeSlug as slugDeVille } from "@/lib/direct/ville";
import { bookingPlatformName } from "@/lib/site-internet/directories";
import { partnerOffers as loadPartnerOffers, noteCatalogueViews, type PartnerOffer } from "@/lib/site-internet/collectif";
import { MaquetteSante } from "./maquette-sante";

// DEUX LISTES, parce que ce sont deux questions différentes.
//
// « Est-ce un client ou le commerçant ? » décide si l'on montre l'habillage de
// démarchage. Toute origine publique doit voir la boutique : Le Direct, le
// résumé, une alerte, mais aussi le lien traçable qu'il envoie lui-même sur
// WhatsApp et le QR de l'affiche collée dans sa boutique.
const VIA_PUBLIC = new Set(["direct", "catalogue", "digest", "alerte", "offre", "affiche"]);

// « Le collectif lui a-t-il amené quelqu'un ? » est autre chose, et c'est LE
// chiffre qu'il regarde pour juger ce que les autres lui apportent. Un client
// qui scanne l'affiche de sa propre vitrine ou clique son propre message
// WhatsApp vient de SON audience, pas du collectif. Les compter ici gonflerait
// exactement le nombre censé prouver quelque chose.
const VIA_COLLECTIF = new Set(["direct", "catalogue", "digest", "alerte"]);

export const dynamic = "force-dynamic";
export const revalidate = 0;

const str = (v: unknown) => (v == null ? "" : String(v));

// Aperçu de partage (WhatsApp, SMS, réseaux) PROPRE à la maquette — sinon la page
// héritait de l'Open Graph racine (« Popey — le club des bons plans… »). Non
// indexée (maquette privée), mais l'aperçu de partage reste soigné.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const noindex = { robots: { index: false, follow: false } };
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("human_vitrine_sites")
      .select("business_name, city, activite, diagnostic")
      .eq("slug", slug)
      .eq("channel", "letter")
      .maybeSingle();
    const row = (data as Record<string, unknown> | null) ?? null;
    if (!row) return { title: "Votre nouveau site", ...noindex };
    const nom = str(row.business_name) || "Votre commerce";
    const ville = str(row.city);
    const title = `${nom} — votre nouveau site`;
    const description = `La maquette du site de ${nom}${ville ? ` à ${ville}` : ""} : prise de rendez-vous, avis, et un assistant qui répond pour vous.`;
    // L'image de partage est fournie par opengraph-image.tsx (carte générée).
    return {
      title,
      description,
      ...noindex,
      openGraph: { title, description, type: "website" },
      twitter: { card: "summary_large_image", title, description },
    };
  } catch {
    return { title: "Votre nouveau site", ...noindex };
  }
}

export default async function ApercuMaquette({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ via?: string; pub?: string }>;
}) {
  const { slug } = await params;
  const { via, pub } = await searchParams;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("human_vitrine_sites")
    .select("id, business_name, city, activite, address, google_rating, google_reviews, google_place_id, diagnostic, published, gallery_photos, metadata")
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

  // Tracking du scan (première fois) + compteur de vues (best-effort).
  try {
    await supabase
      .from("human_vitrine_sites")
      .update({ contact_scanned_at: new Date().toISOString() })
      .eq("id", str(row.id))
      .is("contact_scanned_at", null);
  } catch {
    /* best-effort */
  }
  // Colonnes RÉCENTES (site_views, services) : lecture séparée et défensive. Si
  // la migration n'est pas encore appliquée, cette requête échoue seule — la page
  // (et toutes les sections pilotées par la config métier) s'affiche quand même.
  let siteViews = 0;
  let proServicesRaw: unknown = [];
  let proUseCasesRaw: unknown = [];
  try {
    const { data: extra } = await supabase
      .from("human_vitrine_sites")
      .select("site_views, services, usecases")
      .eq("id", str(row.id))
      .maybeSingle();
    const ex = (extra as Record<string, unknown> | null) ?? null;
    if (ex) {
      siteViews = typeof ex.site_views === "number" ? ex.site_views : 0;
      proServicesRaw = ex.services;
      proUseCasesRaw = ex.usecases;
    }
    await supabase.from("human_vitrine_sites").update({ site_views: siteViews + 1 }).eq("id", str(row.id));
  } catch {
    /* colonnes non migrées → best-effort, la page reste complète */
  }
  // Visiteur venu du collectif : c'est LE chiffre qui prouve au commerçant que
  // les autres lui amènent du monde. Lecture puis écriture séparée, pour ne rien
  // casser tant que la migration n'est pas passée.
  //
  // `direct` compte dans le MÊME compteur que `catalogue` : Le Direct remplace
  // le catalogue, et ouvrir un second compteur ferait tomber à zéro le chiffre
  // que le commerçant regarde — il conclurait que le collectif ne lui apporte
  // plus rien, au moment précis où il lui apporte davantage.
  if (VIA_COLLECTIF.has(str(via))) {
    try {
      const { data: cc } = await supabase
        .from("human_vitrine_sites")
        .select("catalogue_clicks")
        .eq("id", str(row.id))
        .maybeSingle();
      const prev = typeof (cc as Record<string, unknown> | null)?.catalogue_clicks === "number"
        ? ((cc as Record<string, unknown>).catalogue_clicks as number)
        : 0;
      await supabase.from("human_vitrine_sites").update({ catalogue_clicks: prev + 1 }).eq("id", str(row.id));
    } catch {
      /* colonne non migrée → pas de comptage */
    }
  }
  // « Offre du moment » : bandeau piloté par le pro (colonne récente → défensif).
  // Affiché seulement si actif ET non expiré. Null sinon.
  let offer: { text: string; until: string | null; photo: string | null } | null = null;
  try {
    const { data: o } = await supabase
      .from("human_vitrine_sites")
      .select("current_offer")
      .eq("id", str(row.id))
      .maybeSingle();
    const raw = (o as Record<string, unknown> | null)?.current_offer;
    if (raw && typeof raw === "object") {
      const oo = raw as Record<string, unknown>;
      const text = str(oo.text);
      const until = typeof oo.until === "string" && oo.until ? oo.until : null;
      // Composant serveur async : ce code s'exécute une fois par requête, jamais
      // au re-rendu — lire l'horloge y est stable. La règle « purity » vise les
      // composants client, elle ne sait pas distinguer les deux.
      // eslint-disable-next-line react-hooks/purity
      const expired = until ? Date.parse(until) < Date.now() : false;
      // La photo choisie par le pro pour CETTE annonce (absente sur les annonces
      // antérieures au choix → le deck retombe sur les photos du commerce).
      const photo = str(oo.photo) || null;
      if (text && !expired) offer = { text, until, photo };
    }
  } catch {
    /* colonne non migrée → pas d'offre */
  }

  // « Mon approche » : le texte que le pro a VALIDÉ (colonne récente → défensif).
  // Null = jamais validé → la section n'apparaît pas sur le site en ligne.
  let approche: { titre: string; corps: string } | null = null;
  try {
    const { data: a } = await supabase
      .from("human_vitrine_sites")
      .select("approche")
      .eq("id", str(row.id))
      .maybeSingle();
    const raw = (a as Record<string, unknown> | null)?.approche;
    if (raw && typeof raw === "object") {
      const ao = raw as Record<string, unknown>;
      const corps = str(ao.corps).trim();
      if (corps) approche = { titre: str(ao.titre).trim() || "Mon approche", corps };
    }
  } catch {
    /* colonne non migrée → aucune approche validée */
  }

  // FAQ « Avant de venir » : les réponses du pro si elles existent, sinon la
  // proposition du métier. Colonne récente → lecture défensive, comme ci-dessus.
  let proFaq: Array<{ q: string; a: string }> = [];
  try {
    const { data: f } = await supabase
      .from("human_vitrine_sites")
      .select("faq")
      .eq("id", str(row.id))
      .maybeSingle();
    const raw = (f as Record<string, unknown> | null)?.faq;
    if (Array.isArray(raw)) {
      proFaq = raw
        .map((x) => {
          const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
          return { q: str(o.q).trim(), a: str(o.a).trim() };
        })
        .filter((x) => x.q && x.a)
        .slice(0, 6);
    }
  } catch {
    /* colonne non migrée → on garde la proposition du métier */
  }

  // Le Collectif : les annonces en cours des commerces partenaires de la ville.
  // Chargé uniquement pour un site EN LIGNE — la maquette montre la démonstration.
  let livePartners: PartnerOffer[] = [];
  // Participation au catalogue : pilote AUSSI l'affichage du bloc. Un commerçant
  // qui s'est retiré ne doit pas garder une fenêtre sur le catalogue de sa ville.
  let collectifActif = true;
  if (row.published) {
    try {
      const { data: c } = await supabase
        .from("human_vitrine_sites")
        .select("collectif_actif")
        .eq("id", str(row.id))
        .maybeSingle();
      const cr = (c as Record<string, unknown> | null) ?? null;
      if (cr && cr.collectif_actif === false) collectifActif = false;
    } catch {
      /* colonne non migrée → participation par défaut */
    }
    livePartners = await loadPartnerOffers(supabase, {
      siteId: str(row.id),
      ville: str(row.city),
      activite: str(row.activite) || "Commerce",
      collectifActif,
    });
    // La fenêtre de ce site est une vitrine du catalogue : ce qui s'y affiche
    // compte comme exposition pour les commerces concernés.
    await noteCatalogueViews(supabase, livePartners);
  }

  const nom = str(row.business_name) || "Votre commerce";
  const ville = str(row.city);
  const activite = str(row.activite) || "Commerce";
  const adresse = str(row.address);
  const capWords = (s: string) => s.toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (_m, p, c) => p + c.toUpperCase());
  const villeAff = capWords(ville);
  const metierSing = activite.trim().toLowerCase().replace(/s$/u, "") || "professionnel";
  const rating = typeof row.google_rating === "number" ? row.google_rating : null;
  const reviews = typeof row.google_reviews === "number" ? row.google_reviews : null;

  // ── Profil métier : pilote ce que le site a le DROIT d'afficher ─────────────
  const mp = resolveMetier(activite);
  const profil = mp.profil;
  const termePublic = mp.entry?.terme || mp.def.terme_public;
  const avisShow = mp.def.avis_affichage; // afficher les avis existants (A, B)
  const avisHarvest = mp.def.avis_sollicitation; // récolte active (A seul)
  const avisMode: "prominent" | "doux" | "none" = avisHarvest ? "prominent" : avisShow ? "doux" : "none";
  const waAllowed = mp.def.contacts.includes("WhatsApp"); // WhatsApp = profil A seulement
  // Palette par profil (calée sur les références).
  const accent = profil === "A" ? "#8A4A3B" : profil === "B" ? "#2C5A6E" : "#2E4A3C";
  const accentSoft = profil === "A" ? "#F3E7E2" : profil === "B" ? "#E3EDF1" : "#E9F0EA";
  const showUrgence = mp.entry?.encartUrgence ?? false; // encart urgence (psychisme), découplé
  const confirmation = mp.entry?.confirmation ?? "reserve";
  const moteur = mp.entry?.moteur ?? "M1_acquisition";
  const secteur = mp.entry?.secteur ?? "flux"; // vocabulaire du « Suivre ce commerce »
  const busyWord = confirmation === "reserve" ? "en séance" : "en intervention";
  // Restauration : vocabulaire « tables » (sinon « créneaux ») pour la Démo Vivante.
  const isResto = /restaur|resto|bistrot|brasser|pizz|cr[eê]per|gastronomi|caf[eé]|salon de th[eé]|\bbar\b|\bpub\b|brunch/i.test(activite);
  // Partenaires complémentaires du « collectif », par famille de métier (pilates →
  // bien-être/nutrition ; resto → sorties ; beauté → mariage/événement…).
  const naPart = activite.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const partners = /yoga|pilat|fitness|sport|muscu|coach|danse|gym|barre|zumba|cross ?fit/.test(naPart)
    ? [{ ic: "🌿", t: "Naturopathe" }, { ic: "🥗", t: "Nutritionniste" }, { ic: "💆", t: "Kiné" }, { ic: "🦶", t: "Ostéo" }, { ic: "🧘", t: "Sophrologue" }]
    : /restaur|resto|bistrot|brasser|pizz|gastronomi|caf|\bbar\b|\bpub\b|traiteur|crep|brunch/.test(naPart)
      ? [{ ic: "🍸", t: "Bar à cocktails" }, { ic: "🎶", t: "DJ / musicien" }, { ic: "🚕", t: "Taxi" }, { ic: "🌸", t: "Fleuriste" }, { ic: "🏨", t: "Hôtel" }]
      : /coiff|barbier|esth|ongle|beaut|maquill|tatou|spa|massage|bronz|\bcil|epil/.test(naPart)
        ? [{ ic: "💄", t: "Maquilleuse" }, { ic: "💇", t: "Coiffeur" }, { ic: "📸", t: "Photographe" }, { ic: "🌸", t: "Fleuriste" }, { ic: "👰", t: "Robe de mariée" }]
        : [{ ic: "📸", t: "Photographe" }, { ic: "🌸", t: "Fleuriste" }, { ic: "🍽️", t: "Restaurant" }, { ic: "💇", t: "Coiffeur" }, { ic: "🎉", t: "Événementiel" }];
  // Exemple de recommandation croisée COHÉRENT avec le métier (pilates → bien-être,
  // pas mariage) : un client chez un partenaire complémentaire → recommandé à ce pro.
  const famSport = /yoga|pilat|fitness|sport|muscu|coach|danse|gym|barre|zumba|cross ?fit/.test(naPart);
  const famResto = /restaur|resto|bistrot|brasser|pizz|gastronomi|caf|\bbar\b|\bpub\b|traiteur|crep|brunch/.test(naPart);
  const famBeauty = /coiff|barbier|esth|ongle|beaut|maquill|tatou|spa|massage|bronz|\bcil|epil/.test(naPart);
  const resoExample = famSport
    ? { partner: "un kiné partenaire", clientMsg: "Je veux reprendre le sport, en douceur 🙂", recoMsg: `Le mouvement, c'est la clé — pour ça, ${nom} est LE studio à ${villeAff} 🧘`, oppMsg: "🤝 Nouvelle cliente — elle veut reprendre le sport en douceur. Proposer un cours d'essai ?" }
    : famResto
      ? { partner: "un hôtel partenaire", clientMsg: `On cherche un bon resto ce soir à ${villeAff} 🍽️`, recoMsg: `J'ai LE bon endroit pour vous : ${nom}, à deux pas 😊`, oppMsg: "🤝 Nouveaux clients — ils cherchent où dîner ce soir. Proposer une table ?" }
      : famBeauty
        ? { partner: "un salon de coiffure partenaire", clientMsg: "Je prépare mon mariage 💍", recoMsg: `Vous avez pensé à vos ongles ? ${nom}, c'est la meilleure de ${villeAff} 💅`, oppMsg: "🤝 Nouvelle cliente — elle prépare un mariage et cherche vos prestations. Proposer un créneau ?" }
        : { partner: "un commerce partenaire", clientMsg: `Je cherche un bon ${metierSing} à ${villeAff}`, recoMsg: `J'ai exactement ce qu'il vous faut : ${nom}, tout près 😊`, oppMsg: "🤝 Nouveau client — il cherche vos services. Proposer un créneau ?" };
  // L'exemple d'Action Flash de la Démo Vivante, PROPRE AU MÉTIER — en deux
  // morceaux, parce que la démonstration montre une TRANSFORMATION :
  //   `flashDit`     = la phrase que le commerçant dirait, telle quelle ;
  //   `flashExample` = l'annonce que l'assistante en écrit.
  //
  // Un créneau qui se libère est un cas trop étroit pour porter toute la
  // promesse, et une remise donnerait l'image d'une plateforme de réductions.
  // Le message universel est « il se passe quelque chose chez vous, dites-le » —
  // donc à chaque métier son « quelque chose », le sien.
  // Illustration assumée : jamais présentée comme une donnée réelle du commerce.
  const famTatou = /tatou|piercing/.test(naPart);
  const famBoulange = /boulanger|patiss|viennoiser|chocolat|glacier/.test(naPart);
  const famArtisan = /artisan|menuis|ebenist|plomb|electric|macon|couvreur|peintre|serrur|carrel|vitrier|paysagiste/.test(naPart);
  const famBoutique = /boutique|magasin|pret-a-porter|pret a porter|vetement|bijou|decoration|concept|friperie|fleurist|librairie|epicerie|caviste|primeur/.test(naPart);
  const flash = famTatou
    ? { dit: "Je viens de créer un nouveau motif.", annonce: `Nouveau motif disponible chez ${nom} ✨ Envie de le découvrir ou de l'adapter à votre projet ? Écrivez-moi.` }
    : famBoulange
      ? { dit: "La nouvelle fournée vient de sortir.", annonce: `La nouvelle fournée vient de sortir chez ${nom} 🥖 Passez tant qu'elle est chaude.` }
      : famResto
        ? { dit: "Aujourd'hui, le chef propose un nouveau plat.", annonce: `Nouveau plat à la carte aujourd'hui chez ${nom} 🍽️ Envie d'y goûter ? Écrivez-moi, je vous garde une table.` }
        : famBeauty
          ? { dit: "Un créneau vient de se libérer demain.", annonce: `Un créneau vient de se libérer demain chez ${nom} ✨ Je vous le réserve ?` }
          : famArtisan
            ? { dit: "Je viens de terminer une nouvelle réalisation.", annonce: `Nouvelle réalisation terminée chez ${nom} 🛠️ Envie du même résultat ? Écrivez-moi.` }
            : famBoutique
              ? { dit: "Nous venons de recevoir une nouvelle collection.", annonce: `Nouvelle collection arrivée chez ${nom} ✨ Venez la découvrir, je vous dis tout.` }
              : famSport
                ? { dit: "Il reste des places au cours de demain.", annonce: `Il reste des places au cours de demain chez ${nom} 🧘 Je vous en garde une ?` }
                : { dit: "J'ai une nouveauté à faire connaître aujourd'hui.", annonce: `Nouveauté cette semaine chez ${nom} ✨ Envie d'en savoir plus ? Écrivez-moi.` };
  const flashExample = flash.annonce;

  // La question qu'on pose vraiment à ce métier, et ce que l'assistante en fait :
  // elle répond sur ce qu'elle sait, puis TRANSMET la demande. Elle n'invente pas
  // une disponibilité — il n'y a pas d'agenda branché derrière.
  const tourChat = famResto
    ? { q: "Bonsoir, avez-vous une table pour samedi soir ?", a: `Bonsoir 😊 Je note votre demande pour samedi soir et je la transmets à ${nom} — vous aurez une réponse rapidement.` }
    : famBoutique || famBoulange
      ? { q: "Bonsoir, êtes-vous ouverts demain matin ?", a: `Bonsoir 😊 Voici les horaires de ${nom}, et je transmets votre message pour qu'on vous réponde dès l'ouverture.` }
      : { q: `Bonsoir, avez-vous un créneau samedi ?`, a: `Bonsoir 😊 Je note votre demande pour samedi et je la transmets à ${nom} — vous aurez une réponse rapidement.` };

  const diag = (row.diagnostic && typeof row.diagnostic === "object" ? row.diagnostic : {}) as Record<string, unknown>;
  // LES HORAIRES DU COMMERÇANT PRIMENT. `diagnostic.horaires` vient de Google :
  // c'est une information de seconde main, que le commerçant ne contrôle pas.
  // Lui les saisit dans son espace pro, où ils partent dans
  // `human_site_availability` — et personne ne les lisait. Il modifiait ses
  // horaires, son site n'en montrait rien, et rien ne le lui disait.
  //
  // Repli sur Google quand il n'a rien saisi : mieux vaut une information de
  // seconde main qu'une section vide.
  let horaires = (Array.isArray(diag.horaires) ? diag.horaires : []) as Array<{ jours?: string; horaires?: string }>;
  try {
    const { data: av } = await supabase
      .from("human_site_availability")
      .select("weekday, start_min, end_min")
      .eq("site_id", str(row.id));
    const siennes = horairesLisibles(
      ((Array.isArray(av) ? av : []) as Array<Record<string, unknown>>).map((w) => ({
        weekday: Number(w.weekday),
        start_min: Number(w.start_min),
        end_min: Number(w.end_min),
      }))
    );
    if (siennes.length) horaires = siennes;
  } catch {
    /* table absente → on garde ceux de Google */
  }

  // Photos : celles gérées par le pro en priorité (data URI), sinon Google.
  const proPhotos = (Array.isArray(row.gallery_photos) ? row.gallery_photos : [])
    .map((p) => str(p))
    .filter((u) => /^data:image\//i.test(u))
    .slice(0, 10);
  const googlePhotos = (Array.isArray(diag.photos) ? diag.photos : [])
    .map((p) => str(p))
    .filter((u) => /^https?:\/\//i.test(u))
    .slice(0, 6);
  const photos = proPhotos.length ? proPhotos : googlePhotos;
  // Vidéos du pro (YouTube / mp4) pour le catalogue à swiper — stockées dans metadata.
  const meta = (row.metadata && typeof row.metadata === "object" ? row.metadata : {}) as Record<string, unknown>;
  const galleryVideos = (Array.isArray(meta.gallery_videos) ? meta.gallery_videos : [])
    .map((v) => str(v))
    .filter((u) => /^https?:\/\//i.test(u))
    .slice(0, 6);
  // Prestations RÉELLES saisies par le pro (« Mes accompagnements »). Bornées et
  // nettoyées. Les exemples de la maquette viennent de la config métier (côté
  // composant) : ici, aucun tarif inventé.
  const proServices = (Array.isArray(proServicesRaw) ? proServicesRaw : [])
    .map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : {}))
    .map((x) => ({
      name: str(x.name).slice(0, 80),
      duration: str(x.duration).slice(0, 40) || undefined,
      price: str(x.price).slice(0, 40) || undefined,
      desc: str(x.desc).slice(0, 160) || undefined,
    }))
    .filter((x) => x.name.length > 0)
    .slice(0, 12);
  // Motifs RÉELS saisis par le pro (« Pour quoi venir me voir ? »). Override des
  // motifs proposés par la config métier (côté composant).
  const proMotifs = (Array.isArray(proUseCasesRaw) ? proUseCasesRaw : [])
    .map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : {}))
    .map((x) => ({ icon: str(x.icon).slice(0, 8) || "🔹", title: str(x.title).slice(0, 60), desc: str(x.desc).slice(0, 120) }))
    .filter((x) => x.title.length > 0)
    .slice(0, 8);
  const reviewsTop = (Array.isArray(diag.reviews_top) ? diag.reviews_top : [])
    .map((r) => (typeof r === "object" && r ? (r as Record<string, unknown>) : {}))
    .map((r) => ({ name: str(r.name), text: str(r.text), stars: typeof r.stars === "number" ? (r.stars as number) : null }))
    .filter((r) => r.text.length > 0)
    .slice(0, 3);

  const waDigits = (process.env.SITE_LETTER_WHATSAPP || "").replace(/\D/g, "");
  const phoneDisplay = process.env.SITE_LETTER_PHONE || "";
  const telHref = waDigits ? `tel:+${waDigits}` : "";
  const waHref = waAllowed && waDigits ? `https://wa.me/${waDigits}?text=${encodeURIComponent(`Bonjour, j'ai vu la maquette pour ${nom}, elle me plaît !`)}` : "";
  // Réservation en ligne existante (profil B) — lien Doctolib/Maiia détecté au diagnostic.
  const dirUrl = str(diag.directory_url);
  const doctolibHref = profil === "B" && bookingPlatformName(dirUrl) ? dirUrl : "";
  const mapsHref = `https://www.google.com/maps/search/${encodeURIComponent(`${nom} ${ville}`)}`;
  // Liens Google avis (client) : le deep link « écrire un avis » et la page des
  // avis existants si on a le place_id, sinon repli honnête vers la fiche Maps.
  const placeId = str(row.google_place_id);
  const reviewLink = placeId
    ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`
    : mapsHref;
  const reviewsUrl = placeId
    ? `https://search.google.com/local/reviews?placeid=${encodeURIComponent(placeId)}`
    : mapsHref;
  const note = rating != null ? rating.toFixed(1).replace(".", ",") : null;

  // Mini-agenda : si le pro a configuré des disponibilités, « Prendre rendez-vous »
  // ouvre la vraie page de réservation ; sinon on garde l'accueil (démo).
  let bookingEnabled = false;
  try {
    const { count } = await supabase
      .from("human_site_availability")
      .select("id", { count: "exact", head: true })
      .eq("site_id", str(row.id));
    bookingEnabled = (count ?? 0) > 0;
  } catch {
    /* table non migrée → pas de réservation réelle, accueil démo */
  }
  const bookingHref = bookingEnabled ? `/site-internet/rdv/${slug}` : "";

  // ── Démo « choc » de démarchage (recommandation croisée) ────────────────────
  // Une « cible » est désignée dans l'admin (metadata.demarchage_target=true sur UN
  // prospect). Sur n'importe quel site de démo (non publié), le bouton Réserver
  // ouvre le planning puis recommande cette cible — sauf si la cible EST ce site.
  let demarchageTarget: {
    slug: string; nom: string; ville: string; activite: string; offerText: string; offerIsExample: boolean;
  } | null = null;
  if (!row.published) {
    try {
      const { data: tgt } = await supabase
        .from("human_vitrine_sites")
        .select("slug, business_name, city, activite, current_offer")
        .eq("metadata->>demarchage_target", "true")
        .limit(1)
        .maybeSingle();
      const t = tgt as Record<string, unknown> | null;
      const tSlug = str(t?.slug);
      if (t && tSlug && tSlug !== slug) {
        const rawOffer = (t.current_offer && typeof t.current_offer === "object" ? (t.current_offer as Record<string, unknown>) : null);
        const offText = rawOffer ? str(rawOffer.text) : "";
        demarchageTarget = {
          slug: tSlug,
          nom: str(t.business_name) || "notre partenaire",
          ville: capWords(str(t.city)) || villeAff,
          activite: str(t.activite) || "ses prestations",
          offerText: offText || "une offre de bienvenue rien que pour vous",
          offerIsExample: !offText,
        };
      }
    } catch {
      /* metadata non exploitable → pas de démo démarchage */
    }
  }

  // BARRE DU DIRECT. Uniquement pour un visiteur venu de l'application : sur la
  // page trouvée par une recherche Google, « suivre » ne veut rien dire pour
  // quelqu'un qui ignore ce qu'est Le Direct.
  //
  // Elle porte aussi le retour au fil. Sans elle, l'habitant qui ouvre une
  // boutique depuis Le Direct atterrit dans un site complet sans aucun chemin de
  // retour — il doit fermer l'onglet, et il ne revient pas.
  const visiteurPublic = VIA_PUBLIC.has(str(via));
  const venuDuDirect = str(via) === "direct";
  // Quelle ANNONCE a mené ici. Le commerçant saura laquelle de ses publications
  // a fonctionné, pas seulement qu'on est venu du Direct.
  if (venuDuDirect && str(pub)) void noterClic(supabase, str(pub));
  let dejaSuivi = false;
  const villeDuSite = slugDeVille(str(row.city));

  // CE QUE LES GENS AIMENT ICI, déduit des réactions réelles. Uniquement pour
  // un visiteur venu du Direct : sur la page trouvée par une recherche Google,
  // « ce que les gens aiment » parlerait d'habitants dont ce visiteur ne fait
  // pas partie — et la section n'aurait pas le même sens.
  //
  // Vide sous le seuil : elle ne s'affiche pas du tout.
  const aime = venuDuDirect ? await ceQuOnAime(supabase, str(row.id)) : [];
  if (venuDuDirect) {
    try {
      const h = await habitantCourant(supabase);
      if (h) {
        const { data: sv } = await supabase
          .from("human_suivis")
          .select("site_id")
          .eq("habitant_id", h.id)
          .eq("site_id", str(row.id))
          .maybeSingle();
        dejaSuivi = Boolean(sv);
      }
    } catch {
      /* tables non migrées → bouton « Suivre » non allumé, jamais d'erreur */
    }
  }

  return (
    <>
    {venuDuDirect && (
      <BarreDirect ville={villeDuSite}>
        <SuivreBouton siteId={str(row.id)} ville={villeDuSite} suiviInitial={dejaSuivi} />
      </BarreDirect>
    )}
    {/* Juste sous la barre du Direct : c'est la première chose qu'on lit en
        arrivant du fil, et c'est exactement le moment où l'on se demande
        pourquoi les gens vont là. */}
    <AimeSection lignes={aime} ville={villeAff} />
    <MaquetteSante
      slug={slug}
      profil={profil}
      nom={nom}
      metierLabel={capWords(metierSing)}
      villeAff={villeAff}
      adresse={adresse}
      horaires={horaires}
      photos={photos}
      accent={accent}
      accentSoft={accentSoft}
      showUrgence={showUrgence}
      termePublic={termePublic}
      confirmation={confirmation}
      moteur={moteur}
      secteur={secteur}
      busyWord={busyWord}
      content={resolveMetierContent(activite, profil)}
      avisMode={avisMode}
      note={note}
      reviewsCount={reviews}
      reviewsTop={reviewsTop}
      reviewLink={reviewLink}
      reviewsUrl={reviewsUrl}
      bookingHref={bookingHref}
      services={proServices}
      proMotifs={proMotifs}
      published={Boolean(row.published)}
      telHref={telHref}
      waHref={waHref}
      doctolibHref={doctolibHref}
      mapsHref={mapsHref}
      phoneDisplay={phoneDisplay}
      offer={offer}
      isResto={isResto}
      partners={partners}
      resoExample={resoExample}
      flashExample={flashExample}
      flashDit={flash.dit}
      tourChat={tourChat}
      demarchageTarget={demarchageTarget}
      galleryVideos={galleryVideos}
      approche={approche}
      proFaq={proFaq}
      partnerOffers={livePartners}
      collectifActif={collectifActif}
      visiteurPublic={visiteurPublic}
    />
    </>
  );
}
