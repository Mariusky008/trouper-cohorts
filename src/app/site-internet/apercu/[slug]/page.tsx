// 🏪 LA PAGE D'ACCUEIL D'UN COMMERÇANT — révélée par le QR de la lettre, ou
// ouverte depuis Le Direct, ou trouvée par un lien qu'il a envoyé lui-même.
//
// ═══ CE QUE CE FICHIER FAIT, ET IL NE FAIT QUE ÇA ═════════════════════════
//
// Il CHARGE. Il lit les données Google du prospect, ses horaires, ses photos,
// ses prestations, puis fabrique l'objet qu'attend la boutique — voir
// `lib/site-internet/carte-depuis-fiche.ts`, qui explique longuement pourquoi
// il laisse VIDE tout ce qu'une fiche Google ne contient pas.
//
// Il ne dessine rien : le dessin est dans `page-boutique.tsx`, qui pose la
// boutique, la voix et la demande finale. Les deux étaient mélangés dans les
// six cents lignes précédentes, et c'est ce qui rendait impossible de changer
// l'un sans toucher l'autre.
//
// ═══ LES ADRESSES DE DÉMONSTRATION PASSENT AVANT SUPABASE ═════════════════
//
// `/site-internet/apercu/demo-coiffeur`, `demo-onglerie`, `demo-restaurant`,
// `demo-mode`… ne lisent aucune base : elles sortent du paquet de
// démonstration. C'est ce qui permet de les ouvrir l'une après l'autre pour
// vérifier que la page tient sur chaque métier — voir `fiches-demo.ts`.
//
// ═══ CE QUI A DISPARU ═════════════════════════════════════════════════════
//
// La maquette vitrine, et avec elle tout ce qu'elle seule chargeait : « Mon
// approche », la FAQ du métier, les motifs de consultation, le mini-agenda, la
// démo de démarchage croisé, les partenaires du collectif, la barre « Suivre
// ce commerce ».
//
// `maquette-sante.tsx` A ÉTÉ SUPPRIMÉ, PAS LAISSÉ DE CÔTÉ. Il n'avait plus un
// seul appelant, et un fichier de huit cents lignes que rien ne rend est pire
// qu'absent : il continue de compiler, il apparaît dans les recherches, et le
// jour où quelqu'un le retouche il croit travailler sur la page du commerçant.
// Ses composants enfants sont maintenant orphelins à leur tour — ils tomberont
// dans un ménage à eux, avec la vérification qui va avec.
//
// LES COMPTEURS, EUX, SONT RESTÉS. `contact_scanned_at`, `site_views` et
// `catalogue_clicks` sont les trois chiffres que le commerçant regarde : ils
// n'ont rien à voir avec le dessin de la page, et les perdre en la redessinant
// aurait fait croire que le collectif ne lui apporte plus rien, au moment
// précis où on lui montre le contraire.
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { noterClic } from "@/lib/direct/publications";
import { horairesLisibles } from "@/lib/site-internet/horaires-pro";
import { ligneDuJour } from "@/lib/site-internet/opening-hours";
import { numeroAppel, numeroReservations } from "@/lib/site-internet/pro-phone";
import { carteDepuisFiche, type FicheCommercant } from "@/lib/site-internet/carte-depuis-fiche";
import { carteDeDemo, estAdresseDeDemo, listeDesDemos } from "@/lib/site-internet/fiches-demo";
import { PageBoutique } from "./page-boutique";
import { IndexDesDemos } from "./index-demos";

// DEUX LISTES, parce que ce sont deux questions différentes.
//
// « Est-ce un client ou le commerçant ? » décide si l'on montre la demande de
// démarchage. Toute origine publique doit voir la boutique nue : Le Direct, le
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
const capWords = (s: string) =>
  s.toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (_m, p, c) => p + c.toUpperCase());

// Aperçu de partage (WhatsApp, SMS, réseaux) PROPRE à la page — sinon elle
// héritait de l'Open Graph racine. Non indexée (maquette privée), mais l'aperçu
// de partage reste soigné.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const noindex = { robots: { index: false, follow: false } };
  if (estAdresseDeDemo(slug)) {
    const c = carteDeDemo(slug);
    const title = c ? `${c.nom} — démonstration` : "Les pages de démonstration";
    return { title, ...noindex };
  }
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("human_vitrine_sites")
      .select("business_name, city")
      .eq("slug", slug)
      .eq("channel", "letter")
      .maybeSingle();
    const row = (data as Record<string, unknown> | null) ?? null;
    if (!row) return { title: "Votre page", ...noindex };
    const nom = str(row.business_name) || "Votre commerce";
    const ville = str(row.city);
    const title = `${nom} — sur ClikMe`;
    const description = `Ce que ${nom}${ville ? ` à ${capWords(ville)}` : ""} propose aujourd’hui : ce qu’on peut y essayer, ce qui revient chez eux, et comment y aller.`;
    // L'image de partage est fournie par opengraph-image.tsx (carte générée).
    return {
      title,
      description,
      ...noindex,
      openGraph: { title, description, type: "website" },
      twitter: { card: "summary_large_image", title, description },
    };
  } catch {
    return { title: "Votre page", ...noindex };
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
  const visiteurPublic = VIA_PUBLIC.has(str(via));
  const venuDuDirect = str(via) === "direct";

  // ── LES ADRESSES DE DÉMONSTRATION, AVANT TOUTE LECTURE ────────────────────
  //
  // Aucune base, aucun réseau : c'est précisément ce qui les rend ouvrables
  // partout, y compris là où les clés Supabase n'existent pas. Elles montrent
  // le commerce COMPLET — moments, catalogue, voix — c'est-à-dire ClikMe une
  // fois habité ; la page d'un vrai prospect, elle, ne montre que ce que sa
  // fiche Google contient. La différence est expliquée dans `fiches-demo.ts`.
  if (estAdresseDeDemo(slug)) {
    const carte = carteDeDemo(slug);
    if (!carte) return <IndexDesDemos entrees={listeDesDemos()} inconnue={slug} />;
    return (
      <PageBoutique
        slug={slug}
        carte={carte}
        // ELLES S'AVOUENT INVENTÉES, ET C'EST LA CONDITION POUR LES MONTRER.
        // Un vrai commerçant, lui, ne reçoit jamais cette phrase sous son nom.
        invente
        modeDemo={!visiteurPublic}
        venuDuDirect={venuDuDirect}
        phoneDisplay={process.env.SITE_LETTER_PHONE || ""}
        note={carte.google?.note ?? null}
        reviewsCount={carte.google?.avis ?? null}
      />
    );
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("human_vitrine_sites")
    .select("id, business_name, city, activite, address, google_rating, google_reviews, google_place_id, diagnostic, published, gallery_photos")
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
  // la migration n'est pas encore appliquée, cette requête échoue seule — et la
  // page s'affiche quand même, avec un catalogue vide.
  let siteViews = 0;
  let proServicesRaw: unknown = [];
  try {
    const { data: extra } = await supabase
      .from("human_vitrine_sites")
      .select("site_views, services")
      .eq("id", str(row.id))
      .maybeSingle();
    const ex = (extra as Record<string, unknown> | null) ?? null;
    if (ex) {
      siteViews = typeof ex.site_views === "number" ? ex.site_views : 0;
      proServicesRaw = ex.services;
    }
    await supabase.from("human_vitrine_sites").update({ site_views: siteViews + 1 }).eq("id", str(row.id));
  } catch {
    /* colonnes non migrées → best-effort, la page reste complète */
  }
  // Visiteur venu du collectif : c'est LE chiffre qui prouve au commerçant que
  // les autres lui amènent du monde. `direct` compte dans le MÊME compteur que
  // `catalogue` : Le Direct remplace le catalogue, et ouvrir un second compteur
  // ferait tomber à zéro le chiffre qu'il regarde.
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
  // Quelle ANNONCE a mené ici. Le commerçant saura laquelle de ses publications
  // a fonctionné, pas seulement qu'on est venu du Direct.
  if (venuDuDirect && str(pub)) void noterClic(supabase, str(pub));

  const nom = str(row.business_name) || "Votre commerce";
  const ville = str(row.city);
  const activite = str(row.activite) || "Commerce";
  const villeAff = capWords(ville);
  const rating = typeof row.google_rating === "number" ? row.google_rating : null;
  const reviews = typeof row.google_reviews === "number" ? row.google_reviews : null;
  const note = rating != null ? rating.toFixed(1).replace(".", ",") : null;
  const diag = (row.diagnostic && typeof row.diagnostic === "object" ? row.diagnostic : {}) as Record<string, unknown>;

  // LES HORAIRES DU COMMERÇANT PRIMENT. `diagnostic.horaires` vient de Google :
  // c'est une information de seconde main, qu'il ne contrôle pas. Lui les
  // saisit dans son espace pro, où ils partent dans `human_site_availability`.
  // Repli sur Google quand il n'a rien saisi : mieux vaut une information de
  // seconde main qu'une ligne vide.
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

  // Prestations RÉELLES saisies par le pro. Bornées et nettoyées : aucun tarif
  // inventé ne peut entrer ici, et le catalogue reste vide s'il n'a rien saisi.
  const services = (Array.isArray(proServicesRaw) ? proServicesRaw : [])
    .map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : {}))
    .map((x) => ({
      nom: str(x.name).slice(0, 80),
      prix: str(x.price).slice(0, 40) || undefined,
      detail: str(x.desc).slice(0, 160) || undefined,
    }))
    .filter((x) => x.nom.length > 0)
    .slice(0, 12);

  // LES AVIS GOOGLE, TELS QU'ILS ONT ÉTÉ ÉCRITS. Ils dormaient dans le
  // diagnostic depuis toujours et l'ancienne maquette les affichait ; la
  // boutique, elle, ne connaissait que les avis laissés DANS ClikMe — donc
  // aucun, chez un prospect. Bornés et nettoyés, comme le reste.
  const avisGoogle = (Array.isArray(diag.reviews_top) ? diag.reviews_top : [])
    .map((r) => (r && typeof r === "object" ? (r as Record<string, unknown>) : {}))
    .map((r) => ({
      qui: str(r.name).slice(0, 60) || "Un client",
      texte: str(r.text).slice(0, 400),
      note: typeof r.stars === "number" ? (r.stars as number) : null,
    }))
    .filter((r) => r.texte.length > 0)
    .slice(0, 4);

  const waDigits = (process.env.SITE_LETTER_WHATSAPP || "").replace(/\D/g, "");
  const phoneDisplay = process.env.SITE_LETTER_PHONE || "";
  const waHref = waDigits
    ? `https://wa.me/${waDigits}?text=${encodeURIComponent(`Bonjour, j'ai vu la page ClikMe de ${nom}, elle me plaît !`)}`
    : "";
  const keepHref = waHref || (waDigits ? `tel:+${waDigits}` : "");

  const fiche: FicheCommercant = {
    slug,
    nom,
    metier: activite,
    ville: villeAff,
    adresse: str(row.address).replace(/,?\s*France\s*$/i, "").trim(),
    horaires: ligneDuJour(horaires),
    photos,
    note: note ?? undefined,
    avis: reviews ?? undefined,
    // ═══ SON NUMÉRO, ET IL Y A UNE SEULE VÉRITÉ SUR LE SUJET ══════════════
    //
    // « Ouvrir le WhatsApp avec le numéro du pro et le message pré-rempli. »
    //
    // `diag.telephone` N'EXISTE PAS. La clé du diagnostic est `phone`, et il y
    // a trois endroits où un numéro peut se trouver selon la façon dont ce
    // commerce est entré dans le produit — la colonne WhatsApp s'il a ouvert
    // son espace, le formulaire de rappel s'il nous a laissé le sien, la fiche
    // Google sinon. `pro-phone.ts` connaît les trois, plus les congés, et
    // répond à la bonne question : « à quel numéro les HABITANTS écrivent-ils ? »
    // — qui n'est pas la même que « comment joint-on le commerçant ? ».
    //
    // WHATSAPP D'ABORD, LE FIXE SINON. Un restaurant publie presque toujours
    // un fixe, et un fixe ne fait pas de WhatsApp : la boutique retombe alors
    // sur le bouton « Appeler », qui est juste en dessous.
    telephone: numeroReservations(row) || numeroAppel(row) || undefined,
    site: str(diag.website) || str(diag.site) || undefined,
    mapsHref: `https://www.google.com/maps/search/${encodeURIComponent(`${nom} ${ville}`)}`,
    services,
    avisGoogle,
  };

  return (
    <PageBoutique
      slug={slug}
      carte={carteDepuisFiche(fiche)}
      // « On montre au commerçant SA page » — la seule chose que `!published`
      // voulait dire. Un visiteur venu du public n'est jamais dans ce cas,
      // même si la page n'est pas encore publiée.
      modeDemo={!row.published && !visiteurPublic}
      venuDuDirect={venuDuDirect}
      phoneDisplay={phoneDisplay}
      keepHref={keepHref}
      note={note}
      reviewsCount={reviews}
    />
  );
}
