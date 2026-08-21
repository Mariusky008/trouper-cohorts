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
import { publier, retirerToutesDe, limiterVivantes, siennesVivantes, siennesPassees, prolonger, retirer, estFamille, type Famille } from "@/lib/direct/publications";
import { familleDuTexte } from "@/lib/direct/famille-texte";
import { saisirPrix } from "@/lib/direct/prix";
import { villeSlug } from "@/lib/direct/ville";
import { envoyerAlertes } from "@/lib/direct/envoi-alertes";
import { echeanceDuTexte } from "@/lib/direct/echeance-texte";
import { preparerFacons, ecrireFacons } from "@/lib/direct/facons-creation";
import { jourParis } from "@/lib/jour-paris";

export const dynamic = "force-dynamic";

const str = (v: unknown) => String(v ?? "").trim();

type Offer = {
  text: string;
  until: string | null;
  photo: string | null;
  clicks: number;
  created_at: string;
  /** VRAI quand l'échéance est passée. Calculé ICI et pas dans l'écran :
   *  l'écran est un composant React, et lire l'horloge pendant un rendu le rend
   *  impur — deux rendus du même état donneraient deux réponses. Sans ce
   *  drapeau, une annonce terminée la veille s'affichait « en ligne » et le
   *  rafraîchissement n'y changeait rien. */
  expiree?: boolean;
};

/** L'offre, avec son état réel vis-à-vis de l'horloge du serveur. */
function avecEtat(o: Offer | null, maintenant = Date.now()): Offer | null {
  if (!o) return null;
  const t = o.until ? Date.parse(o.until) : NaN;
  return { ...o, expiree: Number.isFinite(t) && t <= maintenant };
}

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
// Trois annonces vivantes par commerce : de quoi couvrir une journée (matin,
// midi, soir) sans qu'un seul commerce occupe l'écran d'accueil d'une ville.
const MAX_VIVANTES = 3;

/** Une vidéo n'est acceptée que si elle sort de NOTRE seau `annonces`. */
function videoAcceptee(url: string): string | null {
  if (!url) return null;
  const base = str(process.env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/+$/, "");
  if (!base) return null;
  const attendu = `${base}/storage/v1/object/public/annonces/`;
  return url.startsWith(attendu) && url.length <= 500 && !url.includes("..") ? url : null;
}

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
  //
  // LE BANDEAU PÉRIMÉ NE SURVIT PAS À SA JOURNÉE. Il n'a jamais été effacé :
  // deux jours après, le commerçant rouvrait « Faire une annonce » et retrouvait
  // en haut de l'écran son annonce de l'avant-veille, dans un cadre « Terminée ».
  // Les surfaces publiques la filtraient déjà — elle n'était visible que de lui,
  // et uniquement pour l'encombrer.
  //
  // POURQUOI PAS TOUT DE SUITE À L'ÉCHÉANCE. Le jour même, « Terminée — reprendre
  // ce texte » est exactement ce qu'il veut : son créneau de 14 h est passé, il
  // en rouvre un pour 16 h en un geste. C'est le lendemain que ça devient un
  // vieux papier. Passé sa journée, le texte reste de toute façon accessible
  // dans « Mes annonces passées », qui est fait pour ça.
  const current = async (): Promise<Offer | null> => {
    try {
      const { data } = await supabase.from("human_vitrine_sites").select("current_offer").eq("id", id).maybeSingle();
      const raw = (data as Record<string, unknown> | null)?.current_offer;
      const o = readOffer(raw);
      if (o?.until && jourParis(new Date(o.until)) < jourParis()) {
        // Effacé à la lecture : c'est le moment exact où on sait qu'il est
        // périmé, et ça se répare tout seul sans un balayage nocturne de plus.
        try {
          await supabase.from("human_vitrine_sites").update({ current_offer: null }).eq("id", id);
        } catch {
          /* la colonne refuse : on ne le montre pas pour autant */
        }
        return null;
      }
      return o;
    } catch {
      return null;
    }
  };

  // Ses annonces vivantes — celles du FIL, pas le bandeau. Il peut en avoir
  // trois ; sans cette liste, il ne savait même pas lesquelles tournaient.
  /** Renseigné quand la LECTURE a échoué — pas quand la liste est vide. */
  let lectureKo = "";
  const mesAnnonces = async () => {
    try {
      return (await siennesVivantes(supabase, id)).map((a) => ({
        id: a.id,
        texte: a.texte,
        photo: a.photo,
        video: a.video,
        famille: a.famille,
        publieLe: a.publieLe,
        expireLe: a.expireLe,
      }));
    } catch (e) {
      // « AUCUNE ANNONCE » ET « JE N'AI PAS PU LIRE » NE SONT PAS LA MÊME
      // CHOSE, et l'écran les affichait pareil. C'est ce qui a fait chercher
      // pendant deux jours une annonce dont personne ne pouvait dire si elle
      // existait.
      lectureKo = String((e as { message?: string })?.message ?? e);
      console.error("[offer] lecture des annonces impossible :", lectureKo);
      return [];
    }
  };

  // SES ANNONCES PASSÉES. Il republie souvent la même chose — le plat du
  // jeudi, la fournée du samedi — et retaper le texte à chaque fois est la
  // première raison de ne pas republier du tout.
  const monHistorique = async () =>
    (await siennesPassees(supabase, id)).map((a) => ({
      id: a.id,
      texte: a.texte,
      photo: a.photo,
      famille: a.famille,
      publieLe: a.publieLe,
    }));

  if (action === "annonces") {
    const annonces = await mesAnnonces();
    return NextResponse.json({ ok: true, annonces, historique: await monHistorique(), lectureKo: lectureKo || undefined });
  }

  if (action === "historique") {
    return NextResponse.json({ ok: true, historique: await monHistorique() });
  }

  if (action === "retirer_annonce") {
    const cible = str(p?.id);
    if (!cible) return NextResponse.json({ error: "id requis" }, { status: 400 });
    // LE BANDEAU DU SITE PART AVEC, quand c'est bien de lui qu'il s'agit.
    //
    // « Mes annonces » retire la publication du fil de la ville. Le bandeau de
    // son site, lui, est un objet à part (`current_offer`) : sans ce nettoyage,
    // il continuerait d'annoncer aux visiteurs de son site une place qu'il vient
    // de retirer — la pire promesse qu'on puisse faire à sa place.
    //
    // On compare les textes plutôt que de garder un identifiant : le bandeau
    // n'en a jamais porté, et en ajouter un maintenant laisserait toutes les
    // annonces déjà en base sans correspondance.
    const avant = (await mesAnnonces()).find((a) => a.id === cible);
    await retirer(supabase, cible, id);
    if (avant) {
      const banniere = await current();
      if (banniere && banniere.text.trim() === avant.texte.trim()) {
        try {
          await supabase.from("human_vitrine_sites").update({ current_offer: null }).eq("id", id);
        } catch {
          /* colonne récalcitrante : l'annonce est déjà hors du fil */
        }
      }
    }
    return NextResponse.json({ ok: true, annonces: await mesAnnonces(), historique: await monHistorique() });
  }

  if (action === "prolonger") {
    const cible = str(p?.id);
    if (!cible) return NextResponse.json({ error: "id requis" }, { status: 400 });
    const ok = await prolonger(supabase, cible, id, echeance(p));
    if (!ok) return NextResponse.json({ error: "Prolongation impossible." }, { status: 500 });
    return NextResponse.json({ ok: true, annonces: await mesAnnonces() });
  }

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
    // L'historique part avec la réponse : l'écran remet le parcours à zéro
    // et doit pouvoir montrer immédiatement où le texte a été rangé.
    return NextResponse.json({ ok: true, offer: null, historique: await monHistorique() });
  }

  if (action === "set") {
    const text = str(p?.text).slice(0, 140);
    if (!text) return NextResponse.json({ error: "Écrivez le texte de l'offre." }, { status: 400 });
    // L'ÉCHÉANCE DÉCLARÉE, SINON CELLE QUE LE TEXTE ANNONCE.
    //
    // « Un créneau s'est libéré lundi de 11h à 13h » sans date de fin restait
    // au fil trois jours — sept dans une ville calme — bien après le lundi en
    // question. Le commerçant AVAIT donné la fin : dans sa phrase. On la lit.
    //
    // Uniquement en repli : ce qu'il a choisi explicitement prime toujours, et
    // la déduction rend `null` dès qu'elle n'est pas sûre. Une échéance
    // inventée retirerait une offre encore valable, ce qui est pire que de la
    // laisser un jour de trop.
    const deduite = echeanceDuTexte(text);
    const until = echeance(p) ?? deduite?.expireLe ?? null;
    // On n'accepte que ce qui est DÉJÀ dans sa galerie : le champ est un choix
    // parmi ses photos, pas une adresse d'image libre à publier sur le catalogue.
    const voulue = str(p?.photo);
    // …OU UNE IMAGE FOURNIE TELLE QUELLE, en clair dans la requête.
    //
    // L'affiche d'une vidéo est dans ce cas — elle vient d'être extraite du
    // fichier — et la PHOTO D'ARDOISE aussi, désormais. Celle-ci passait avant
    // par la galerie du commerce, ce qui produisait deux défauts silencieux :
    // la galerie est plafonnée à dix photos, donc la ONZIÈME carte du jour
    // était refusée et le restaurateur ne pouvait plus rien publier ; et sa
    // vitrine finissait tapissée de photos d'ardoises à la place de son
    // commerce. Une ardoise n'est pas une photo de vitrine, elle n'a rien à y
    // faire.
    //
    // CE QUE LE CONTRÔLE PROTÈGE VRAIMENT : pas la provenance, mais l'ADRESSE.
    // Refuser une URL quelconque empêche de faire afficher, sur la page
    // d'accueil d'une ville, une image hébergée ailleurs et qui peut changer
    // après validation. Des octets en clair, bornés en type et en taille, ne
    // posent pas ce problème : il n'y a rien à aller chercher.
    const imageEnClair = /^data:image\/(jpe?g|png|webp);base64,/.test(voulue) && voulue.length <= 900000;
    const photo = voulue && (galerie.includes(voulue) || imageEnClair) ? voulue : null;
    // Le fichier doit venir de NOTRE stockage : accepter une adresse
    // quelconque ferait jouer, sur le fil d'une ville, une vidéo qu'on
    // n'héberge pas et qui peut changer de contenu après coup.
    // L'HÔTE EST ÉPINGLÉ. Le motif précédent acceptait n'importe quel domaine
    // pourvu que le chemin ressemble à du Supabase : un jeton pro suffisait donc
    // à faire jouer, dans le fil de toute une ville, une vidéo hébergée
    // ailleurs — dont le contenu peut changer après validation.
    const video = videoAcceptee(str(p?.video));

    // UNE ANNONCE SANS IMAGE N'EST PAS PUBLIÉE, ET C'EST LA ROUTE QUI LE TIENT.
    //
    // Trois écrans publient par ici, et deux d'entre eux ne demandaient aucune
    // image : « il me reste 8 lasagnes » arrivait dans le fil de la ville en
    // rectangle de couleur avec deux initiales dessus, au milieu de cartes qui
    // ont toutes une photo. Une carte vide ne dessert pas seulement celui qui
    // l'a publiée — elle abîme l'écran entier, qui est le produit.
    //
    // La règle est ici et pas seulement dans l'écran parce qu'un quatrième
    // chemin de publication sera écrit un jour, et qu'il repassera par cette
    // fonction. Chaque écran a de quoi la satisfaire sans effort : à défaut de
    // photo, il fabrique l'image avec les mots de l'annonce.
    if (!photo && !video) {
      return NextResponse.json(
        { error: "Une annonce a besoin d'une image : ajoutez une photo, ou laissez-moi en créer une avec votre texte." },
        { status: 400 }
      );
    }

    // ET SUR DEUX FAMILLES, IL FAUT UNE PHOTO DE CE QU'ON PROPOSE AUJOURD'HUI.
    //
    // La carte du jour et les invendus se choisissent sur ce qu'on VOIT. Deux
    // images y échouent pour la même raison :
    //   · celle qu'on fabrique avec le texte de l'annonce, qui répète en gros
    //     ce qui est écrit trois lignes plus bas ;
    //   · celle de sa fiche Google, importée une fois pour toutes, qui montre
    //     sa devanture — pas les huit parts de tarte dont il parle.
    // Ni l'une ni l'autre ne remplit la carte : elles occupent la place de la
    // seule chose qui donne faim.
    //
    // Partout ailleurs — un événement, un créneau libre, une raison de passer
    // — les deux font honnêtement le travail, et l'exigence serait un blocage
    // gratuit.
    //
    // LA ROUTE NE PEUT PAS LE DEVINER en regardant les octets : c'est l'écran
    // qui déclare d'où vient l'image. Un client qui mentirait sur ces champs
    // ne gagnerait rien qu'une carte terne sur son propre commerce.
    const familleVoulue = estFamille(str(p?.famille)) ? (str(p?.famille) as Famille) : familleDuTexte(text);
    // La vidéo montre forcément quelque chose : elle vient d'être tournée.
    const montreLOffre = Boolean(video) || (p?.visuel !== true && p?.imageDuSite !== true);
    if ((familleVoulue === "menu" || p?.portion === true) && !montreLOffre) {
      return NextResponse.json(
        {
          error:
            p?.imageDuSite === true
              ? "Cette photo vient de votre fiche : elle montre votre commerce, pas ce que vous proposez aujourd'hui. Prenez-en une."
              : "Ici, c'est la photo qui donne envie : ajoutez une photo. Une image fabriquée avec votre texte répéterait ce qui est déjà écrit.",
        },
        { status: 400 }
      );
    }

    const offer: Offer = { text, until, photo, clicks: 0, created_at: new Date().toISOString() };
    /** Renseigné si les façons ont échoué APRÈS la publication de l'annonce. */
    let avertissementFacons = "";
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
    // PLUSIEURS ANNONCES VIVANTES À LA FOIS. Une matinée et une fin de
    // journée n'ont rien à voir : un boulanger annonce sa fournée de 7 h puis
    // ses invendus de 19 h, et les deux méritent d'exister ensemble. La table a
    // toujours su le porter — c'est moi qui retirais les précédentes à chaque
    // enregistrement, par prudence excessive.
    //
    // Le bandeau de SON site ne montre toujours qu'une chose (`current_offer`
    // est un objet unique) : c'est la dernière, et c'est cohérent avec un
    // bandeau. Le fil, lui, les montre toutes.
    //
    // Un plafond, pour qu'un commerce ne monopolise pas le fil de sa ville : au
    // delà de MAX_VIVANTES, la plus ancienne s'efface au profit de la nouvelle.
    // Le fil est un bien commun, pas un mur d'affichage privé.
    await limiterVivantes(supabase, id, MAX_VIVANTES - 1);

    const ville = str(site.city);
    if (ville) {
      const slugVille = villeSlug(ville);
      const pub = await publier(supabase, {
        ville,
        villeSlug: slugVille,
        // LA FAMILLE EST DÉDUITE DU TEXTE, sauf quand l'écran la connaît mieux
        // que lui. Une carte du jour tapée « Aujourd'hui : garbure, magret »
        // ne contient aucun mot qui trahisse un menu — elle serait classée en
        // « offre » et n'apparaîtrait jamais dans l'onglet « Déjeuner » de la
        // ville, qui est pourtant sa seule raison d'exister. On accepte donc
        // une famille imposée, mais seulement une VRAIE : un mot inconnu
        // retomberait sur la déduction plutôt que d'inventer une catégorie.
        famille: familleVoulue,
        texte: text,
        photo,
        video,
        expireLe: until,
        // CE QU'IL RESTE ET L'ARDOISE, saisis par le commerçant.
        //
        // La carte du fil montrait « 2 tables » et « Voir l'ardoise » sans que
        // personne ne les saisisse : c'était du décor. Le lien est borné à
        // http(s) — un `javascript:` collé ici s'exécuterait sur la page
        // d'accueil de toute une ville.
        reste: str(p?.reste).slice(0, 40),
        ardoise: /^https?:\/\//i.test(str(p?.ardoise)) ? str(p?.ardoise).slice(0, 500) : null,
        // LE PRIX ANNONCÉ. Saisi, jamais deviné : nous ne connaissons pas le
        // prix de son menu, et l'inventer le ferait mentir à sa place devant
        // toute une ville.
        prix: saisirPrix(p?.prix),
        site: { id, slug: str(site.slug), nom: str(site.business_name), activite: str(site.activite) },
      });

      // LES FAÇONS D'EN PROFITER, quand le commerçant en a coché.
      //
      // C'est le vrai chaînon manquant : jusqu'ici, publier une annonce depuis
      // ce parcours ne proposait AUCUNE façon à l'habitant. Il fallait aller
      // dans un autre onglet, republier autre chose, et on se retrouvait avec
      // deux annonces pour un seul créneau.
      //
      // Un échec ici ne doit PAS annuler l'annonce : elle est déjà publiée et
      // elle est utile telle quelle. On l'écrit dans la réponse pour que
      // l'écran puisse le dire, plutôt que de faire croire au silence.
      // L'ANNONCE N'A PAS REJOINT LE FIL, ET ÇA SE DIT.
      //
      // LE DÉFAUT : `publier` renvoyait `null` sur n'importe quelle erreur de
      // base, et cette ligne l'ignorait. Le commerçant voyait son écran de
      // confirmation, son bandeau apparaissait sur son site — et son annonce
      // n'existait ni dans « Mes annonces en cours », ni dans le fil de sa
      // ville. Rien, nulle part, ne le disait : ni lui ni nous ne pouvions
      // savoir qu'une colonne manquait en base.
      //
      // Son bandeau reste en ligne : refuser toute la publication parce que le
      // fil n'a pas voulu d'elle lui retirerait aussi ce qui a marché.
      if (!pub?.id) {
        console.error("[offer] publication refusée par la base :", pub?.erreur ?? "raison inconnue");
        avertissementFacons =
          `Votre annonce est en ligne sur votre site, mais elle n'a pas rejoint le fil de ${ville}. ` +
          `Elle n'apparaîtra pas dans « Mes annonces en cours ».`;
      } else if (pub.erreur) {
        // Publiée, mais amputée : le prix ou l'onglet « Déjeuner » manquent.
        console.warn("[offer] publication incomplète :", pub.erreur);
      }

      let faconsErr = "";
      if (pub?.id && (p?.simple || p?.cadeau || p?.express || p?.partage || p?.portion)) {
        const prep = preparerFacons(p ?? {}, { finGenerale: until ?? new Date(Date.now() + 24 * 3600 * 1000).toISOString() });
        if (!prep.ok) faconsErr = prep.erreur;
        else {
          try {
            await ecrireFacons(supabase, prep.facons, {
              siteId: id,
              villeSlug: slugVille,
              titre: text,
              publicationId: pub.id,
            });
          } catch (e) {
            faconsErr = /does not exist|schema cache|Could not find/i.test(String(e))
              ? "Votre annonce est publiée, mais les façons d'en profiter ne sont pas encore activées sur votre espace."
              : "Votre annonce est publiée, mais les façons d'en profiter n'ont pas pu être enregistrées.";
          }
        }
      }
      if (faconsErr) avertissementFacons = [avertissementFacons, faconsErr].filter(Boolean).join(" ");

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

    return NextResponse.json({ ok: true, offer: avecEtat(offer), avertissement: avertissementFacons || undefined });
  }

  // get — la galerie voyage avec l'offre : le sélecteur de photo n'a pas besoin
  // d'un second aller-retour pour s'afficher.
  return NextResponse.json({
    ok: true,
    offer: avecEtat(await current()),
    photos: galerie,
    annonces: await mesAnnonces(),
    historique: await monHistorique(),
    lectureKo: lectureKo || undefined,
  });
}
