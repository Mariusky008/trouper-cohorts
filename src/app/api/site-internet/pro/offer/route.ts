// « Offre du moment » — le pro pilote un bandeau affiché sur SON site public.
// Ex. « Happy hour -30% ce soir 18-20 h » ou « 2 places dispo samedi ».
// Le bandeau renvoie vers un lien de réservation TRAÇABLE (/o/[slug]) : chaque
// clic est compté → le pro voit des RÉSULTATS RÉELS (jamais un chiffre inventé).
//
// Objet stocké dans human_vitrine_sites.current_offer (jsonb) :
//   { text, until (ISO|null), photo (string|null), clicks, created_at }
//   null = aucune offre active.
//
// Actions (POST, jeton pro privé requis) : get | set {text, until|days, photo} | clear.
//
// `photo` est l'image qui illustre CETTE annonce dans le catalogue de la ville.
// Elle est vérifiée contre la galerie du commerce : sans ce contrôle, un jeton
// pro égaré permettrait d'afficher n'importe quelle image sur une page publique.
//
// `until` (ISO) prime sur `days` : une offre « de 16 h à 18 h » doit disparaître
// à 18 h, pas au bout d'une journée entière. C'est la seule façon d'annoncer
// honnêtement quelque chose qui ne dure que deux heures — sans elle, le
// commerçant devrait revenir la retirer à la main, et ne le ferait pas.
import { NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { photosDe } from "@/lib/site-internet/collectif";
import { publier, retirerToutesDe } from "@/lib/direct/publications";
import { familleDuTexte } from "@/lib/direct/famille-texte";
import { villeSlug } from "@/lib/direct/ville";
import { envoyerAlertes } from "@/lib/direct/envoi-alertes";

export const dynamic = "force-dynamic";

const str = (v: unknown) => String(v ?? "").trim();

type Offer = { text: string; until: string | null; photo: string | null; clicks: number; created_at: string };

function readOffer(v: unknown): Offer | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const text = str(o.text);
  if (!text) return null;
  return {
    text,
    until: typeof o.until === "string" && o.until ? o.until : null,
    photo: typeof o.photo === "string" && o.photo ? o.photo : null,
    clicks: typeof o.clicks === "number" ? o.clicks : 0,
    created_at: typeof o.created_at === "string" && o.created_at ? o.created_at : new Date().toISOString(),
  };
}

const MAX_MS = 30 * 24 * 3600 * 1000; // au-delà, ce n'est plus « l'offre du moment »

/**
 * L'échéance de l'annonce, en ISO. Le client sait seul à quelle heure locale son
 * offre s'arrête ; on ne recalcule donc pas ici, on VALIDE : une date passée ou
 * aberrante devient « sans limite » plutôt qu'une offre morte à la naissance.
 */
function echeance(p: Record<string, unknown> | null): string | null {
  const brut = str(p?.until);
  if (brut) {
    const t = Date.parse(brut);
    if (!Number.isNaN(t) && t > Date.now()) return new Date(Math.min(t, Date.now() + MAX_MS)).toISOString();
    return null;
  }
  const days = typeof p?.days === "number" ? p.days : Number(str(p?.days)) || 0;
  if (days > 0) {
    const d = new Date();
    d.setDate(d.getDate() + Math.min(30, Math.round(days)));
    return d.toISOString();
  }
  return null;
}

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const slug = str(p?.slug);
  const token = str(p?.token);
  const action = str(p?.action) || "get";
  if (!slug || !token) return NextResponse.json({ error: "slug/token requis" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("human_vitrine_sites")
    // `city`, `slug`, `business_name` et `activite` servent au pont vers Le
    // Direct : la publication porte son auteur, dénormalisé au moment où elle
    // est écrite.
    .select("id, slug, business_name, city, activite, pro_token, gallery_photos, diagnostic")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const site = (row as Record<string, unknown> | null) ?? null;
  if (!site || !site.pro_token || str(site.pro_token) !== token) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
  const id = str(site.id);
  // Mêmes photos que son site : les siennes si elles existent, sinon Google.
  // On ne lisait que `gallery_photos` — un commerce dont le site est plein de
  // photos Google se voyait annoncer « aucune photo ».
  const galerie = photosDe(site);

  // Lecture défensive : colonne récente (migration peut ne pas être appliquée).
  const current = async (): Promise<Offer | null> => {
    try {
      const { data } = await supabase.from("human_vitrine_sites").select("current_offer").eq("id", id).maybeSingle();
      const raw = (data as Record<string, unknown> | null)?.current_offer;
      return readOffer(raw);
    } catch {
      return null;
    }
  };

  if (action === "clear") {
    try {
      await supabase.from("human_vitrine_sites").update({ current_offer: null }).eq("id", id);
    } catch {
      return NextResponse.json({ error: "Enregistrement impossible (colonne non migrée)." }, { status: 500 });
    }
    // Le bandeau ET le fil. Retirer son offre de son site tout en la laissant
    // dans Le Direct enverrait des gens vers une offre qu'il vient d'annuler —
    // c'est la pire promesse qu'on puisse faire à sa place.
    await retirerToutesDe(supabase, id);
    return NextResponse.json({ ok: true, offer: null });
  }

  if (action === "set") {
    const text = str(p?.text).slice(0, 140);
    if (!text) return NextResponse.json({ error: "Écrivez le texte de l'offre." }, { status: 400 });
    const until = echeance(p);
    // On n'accepte que ce qui est DÉJÀ dans sa galerie : le champ est un choix
    // parmi ses photos, pas une adresse d'image libre à publier sur le catalogue.
    const voulue = str(p?.photo);
    // L'affiche d'une vidéo n'est PAS dans la galerie : elle vient d'être
    // extraite du fichier. On l'accepte à ce titre, en la bornant comme une
    // photo de galerie — sans quoi le champ redeviendrait une adresse d'image
    // libre à publier sur une page publique.
    const posterVideo = /^data:image\/(jpe?g|png|webp);base64,/.test(voulue) && voulue.length <= 900000;
    const photo = voulue && (galerie.includes(voulue) || posterVideo) ? voulue : null;
    // Le fichier doit venir de NOTRE stockage : accepter une adresse
    // quelconque ferait jouer, sur le fil d'une ville, une vidéo qu'on
    // n'héberge pas et qui peut changer de contenu après coup.
    const videoBrute = str(p?.video);
    const video = /^https:\/\/\S+\/storage\/v1\/object\/public\/annonces\/\S+$/.test(videoBrute) ? videoBrute : null;
    const offer: Offer = { text, until, photo, clicks: 0, created_at: new Date().toISOString() };
    try {
      await supabase.from("human_vitrine_sites").update({ current_offer: offer }).eq("id", id);
    } catch {
      return NextResponse.json({ error: "Enregistrement impossible (colonne non migrée)." }, { status: 500 });
    }

    // LE PONT VERS LE DIRECT. `current_offer` reste le bandeau du site du
    // commerçant — un objet, remplacé à chaque fois. Le fil de la ville, lui, a
    // besoin d'une publication par annonce : un identifiant stable, une famille,
    // sa propre échéance. Écrire aux deux endroits ici, plutôt que de faire lire
    // `current_offer` au fil, est ce qui permet à un commerce d'avoir plusieurs
    // choses vivantes à dire en même temps.
    //
    // La famille est déduite du texte : le commerçant écrit une phrase, il ne
    // remplit pas un formulaire à catégories. Un échec de publication ne fait pas
    // échouer l'enregistrement — son bandeau est déjà en ligne, et lui refuser sa
    // propre offre parce que le fil est indisponible serait absurde.
    // UNE SEULE OFFRE VIVANTE À LA FOIS, parce que c'est ce que son écran lui
    // promet : il voit « votre offre en cours », au singulier, et un bouton pour
    // la remplacer. Sans ce retrait, enregistrer cinq fois dans la semaine
    // laisserait cinq cartes de lui dans le fil, disant cinq choses
    // différentes — et il n'aurait aucun moyen de s'en apercevoir.
    //
    // La table sait porter plusieurs publications par commerce ; c'est l'écran
    // qui n'en propose qu'une. Le jour où il en proposera plusieurs, c'est cette
    // ligne qui saute, pas le modèle.
    await retirerToutesDe(supabase, id);

    const ville = str(site.city);
    if (ville) {
      const slugVille = villeSlug(ville);
      await publier(supabase, {
        ville,
        villeSlug: slugVille,
        famille: familleDuTexte(text),
        texte: text,
        photo,
        video,
        expireLe: until,
        site: { id, slug: str(site.slug), nom: str(site.business_name), activite: str(site.activite) },
      });

      // L'ALERTE PART ICI, pas dans un cron. Une place qui se libère à 16 h et
      // annoncée à 17 h n'est plus une place qui se libère. `after()` : le
      // travail s'exécute une fois la réponse envoyée — le commerçant n'attend
      // pas que les e-mails partent, et ne voit aucune différence.
      //
      // `alerteAEnvoyer` reste seul juge : publier « nouveau menu » ne déclenche
      // rien, seule une place libre ou une échéance proche compte.
      after(async () => {
        try {
          await envoyerAlertes(supabase, slugVille);
        } catch {
          /* le filet quotidien rattrapera */
        }
      });
    }

    return NextResponse.json({ ok: true, offer });
  }

  // get — la galerie voyage avec l'offre : le sélecteur de photo n'a pas besoin
  // d'un second aller-retour pour s'afficher.
  return NextResponse.json({ ok: true, offer: await current(), photos: galerie });
}
