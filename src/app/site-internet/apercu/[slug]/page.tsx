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
import { carteDepuisFiche, enGrand } from "@/lib/site-internet/carte-depuis-fiche";
import { couvertureDuDiagnostic, photosCandidates } from "@/lib/site-internet/couverture";
import { raisonLisible } from "@/lib/site-internet/fiche-google";
import { COLONNES_FICHE, construireFiche } from "@/lib/site-internet/fiche-du-site";
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

/**
 * SA FICHE GOOGLE A-T-ELLE ÉTÉ LUE ? `places_found` le dit pour les pages
 * récentes ; pour les plus anciennes, une page sans note, sans avis et sans
 * photo Google n'a visiblement rien reçu de sa fiche.
 */
function ficheLue(row: Record<string, unknown>): { lue: boolean; erreurs: string[]; detail?: string } {
  const d = (row.diagnostic && typeof row.diagnostic === "object" ? row.diagnostic : {}) as Record<string, unknown>;
  const erreurs = (Array.isArray(d.fiche_erreurs) ? d.fiche_erreurs : []).map((e) => String(e)).filter(Boolean);
  const rien =
    row.google_rating == null &&
    !(Array.isArray(d.photos) && d.photos.length) &&
    !(Array.isArray(d.reviews_top) && d.reviews_top.length);
  return {
    lue: d.places_found === false ? false : !rien,
    erreurs: erreurs.map(raisonLisible),
    // LE MESSAGE EXACT, POUR NOUS : c'est lui qui nomme le champ refusé.
    detail: erreurs.length ? erreurs.join(" | ").slice(0, 600) : undefined,
  };
}

export default async function ApercuMaquette({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ via?: string; pub?: string; salon?: string }>;
}) {
  const { slug } = await params;
  const { via, pub, salon } = await searchParams;
  /**
   * ═══ QUI ARRIVE PAR UNE CONVERSATION EST UN CLIENT, JAMAIS LE PROSPECT ═══
   *
   * Le lien d'invitation au salon porte `?salon=1` et rien d'autre : c'est
   * quelqu'un à qui un ami vient d'écrire « regarde, ça vous dit ? ».
   *
   * SANS CETTE LIGNE, IL RECEVAIT L'ARGUMENTAIRE DE VENTE. Faute d'origine
   * connue, la page le prenait pour le commerçant venu découvrir sa maquette :
   * elle lui ouvrait la visite guidée par-dessus l'écran — « Votre page est
   * prête », « Découvrir ma page » — et lui proposait en pied de la garder
   * gratuitement. Un ami invité voyait donc le commerçant se vendre son propre
   * site, ce qui est à la fois incompréhensible et humiliant.
   *
   * C'est la même règle que `VIA_PUBLIC`, appliquée à une origine qui n'y
   * figurait pas parce qu'elle n'existait pas encore.
   */
  const visiteurPublic = VIA_PUBLIC.has(str(via)) || Boolean(str(salon));
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
    .select(COLONNES_FICHE)
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
  /**
   * ═══ EST-IL CLIENT ? ON LE DEMANDE À LA COLONNE QUE L'ADMIN ÉCRIT ═════════
   *
   * SYMPTÔME : « je l'ai validé sur l'admin et j'ai encore la présentation avec
   * la voix IA et l'invitation à confirmer ». Le commerçant validé continuait de
   * recevoir l'argumentaire de vente de sa propre page — exactement le bug que
   * la migration `separer_client_et_visibilite` avait déjà corrigé ailleurs.
   *
   * POURQUOI ICI ET NULLE PART AILLEURS : cette page était le DERNIER lecteur de
   * `published`. Les onze autres (le fil de la ville, les voisins, le sitemap,
   * l'espace pro, le géocodeur) lisent `est_client` depuis la migration ; l'admin
   * écrit `est_client` et commente explicitement que « `published` reste tenue à
   * jour par le déclencheur miroir ». Toute la chaîne tenait donc sur ce
   * déclencheur — et un déclencheur absent de la base ne se signale pas : il ne
   * fait simplement rien. L'écriture réussit, l'admin relit `est_client`, trouve
   * la bonne valeur, annonce « publié » — et cette page, seule, lit l'ancienne
   * colonne restée fausse.
   *
   * ON NE DÉPEND PLUS DE LUI. `est_client` d'abord, `published` en secours : la
   * page est juste que le miroir tourne ou non, et elle le restera le jour où la
   * colonne obsolète disparaîtra.
   *
   * LECTURE SÉPARÉE, comme les autres colonnes récentes : si la migration n'est
   * pas appliquée sur cette base-là, c'est cette requête qui échoue, pas la
   * page.
   */
  let estClient = Boolean(row.published);
  try {
    const { data: axe } = await supabase
      .from("human_vitrine_sites")
      .select("est_client")
      .eq("id", str(row.id))
      .maybeSingle();
    const a = (axe as Record<string, unknown> | null) ?? null;
    if (a && typeof a.est_client === "boolean") estClient = a.est_client;
  } catch {
    /* colonne non migrée → on retombe sur `published`, l'ancien sens */
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

  /* LA FICHE SE FABRIQUE DANS `fiche-du-site.ts` — le double du chef suit la
     même recette, pour que sa conversation et cette page disent la même
     chose. Seuls ses horaires saisis sont lus ici, la page lisant déjà tout le
     reste. */
  let disponibilites: Array<Record<string, unknown>> = [];
  try {
    const { data: av } = await supabase
      .from("human_site_availability")
      .select("weekday, start_min, end_min")
      .eq("site_id", str(row.id));
    disponibilites = (Array.isArray(av) ? av : []) as Array<Record<string, unknown>>;
  } catch {
    /* table absente → on garde ceux de Google */
  }
  const { fiche, nom, note, reviews } = construireFiche(slug, row, { disponibilites, services: proServicesRaw });

  /* LE PRÉNOM DE SON DOUBLE, s'il en a donné un avec sa voix. Lecture à part :
     sans la migration, le double s'appelle simplement « le chef ». */
  let prenomChef = "";
  try {
    const { data: dv } = await supabase
      .from("human_vitrine_sites")
      .select("double_voix_prenom")
      .eq("id", str(row.id))
      .maybeSingle();
    prenomChef = str((dv as Record<string, unknown> | null)?.double_voix_prenom).slice(0, 30);
  } catch {
    /* colonne non migrée */
  }

  const waDigits = (process.env.SITE_LETTER_WHATSAPP || "").replace(/\D/g, "");
  const phoneDisplay = process.env.SITE_LETTER_PHONE || "";
  const waHref = waDigits
    ? `https://wa.me/${waDigits}?text=${encodeURIComponent(`Bonjour, j'ai vu la page ClikMe de ${nom}, elle me plaît !`)}`
    : "";
  const keepHref = waHref || (waDigits ? `tel:+${waDigits}` : "");

  return (
    <PageBoutique
      slug={slug}
      carte={carteDepuisFiche(fiche)}
      prenomChef={prenomChef || undefined}
      // « On montre au commerçant SA page » — la seule chose que `!published`
      // voulait dire, et que `est_client` dit maintenant sans ambiguïté. Un
      // visiteur venu du public n'est jamais dans ce cas, même si le commerçant
      // n'a pas encore signé.
      modeDemo={!estClient && !visiteurPublic}
      venuDuDirect={venuDuDirect}
      phoneDisplay={phoneDisplay}
      keepHref={keepHref}
      note={note}
      reviewsCount={reviews}
      // SA PHOTO CLIKME : son état et les photos dont elle peut partir, dans
      // l'ordre exact où le serveur les numérote. Jamais pour un visiteur.
      couverture={
        visiteurPublic
          ? undefined
          : {
              etat: couvertureDuDiagnostic(row.diagnostic),
              candidates: photosCandidates(row).map(enGrand),
              fiche: ficheLue(row),
            }
      }
    />
  );
}
