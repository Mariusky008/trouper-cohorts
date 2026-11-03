/**
 * 🪀 SA FIGURINE, À PARTIR D'UN SELFIE — voir `lib/direct/figurine-pro.ts`.
 *
 * Trois gestes, contre son jeton pro :
 *   · `etat` : celle qu'il a validée, celle qui attend son « C'est moi », ses essais du jour ;
 *   · `fabriquer` : son selfie (réduit par son téléphone) et son accord → le moteur d'image fabrique le buste
 *     (`fabriquerFigurine`) ; il devient « proposé ». Trois essais par jour au plus ;
 *   · `valider` : « C'est moi » → la proposée devient SA figurine, celle que le Studio met dans ses vidéos ;
 *   · `fabriquer-edition`, `valider-edition` : 🍂 SA FIGURINE DU MOIS — sa figurine validée, habillée pour l'édition
 *     du moment (`collection.ts`) ; elle compte dans les mêmes trois essais du jour.
 *
 * 🗂 CHAQUE FIGURINE VALIDÉE ENTRE DANS SA COLLECTION (`etat.collection`) et n'en sort plus : quand il en refait une,
 * ou quand l'édition passe, il la garde, et peut toujours la remettre dans un petit film.
 *
 * LE SELFIE N'EST JAMAIS GARDÉ : il arrive avec la requête, sert à la fabrication, et s'oublie avec elle. Ce qui reste,
 * avec sa figurine : ses traits EN MOTS (« cheveux gris poivre et sel… », `decrireTraits`), pour l'habiller sans la changer.
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FamilleDouble } from "@/lib/direct/double-metiers";
import { jourDe } from "@/lib/direct/figurine-pro";
import { ajouterALaCollection, propositionChoisie, propositionsDe, deposerImage, ecrireEtat, editionDuJour, etatPublic, fabriquerFigurine, habillerFigurine, lireEtat, lireImage } from "@/lib/direct/figurine-pro-serveur";

export const dynamic = "force-dynamic";
/** Une génération d'image prend de trente secondes à deux minutes. */
export const maxDuration = 300;

const s = (v: unknown) => String(v ?? "").trim();
const FAMILLES: FamilleDouble[] = ["table", "bar", "coiffure", "ongles", "fleurs", "mode", "createur", "lunettes", "seance", "librairie"];

function selfieDe(dataUrl: string): Buffer | null {
  const m = /^data:image\/(?:jpeg|jpg|png|webp);base64,(.+)$/i.exec(dataUrl);
  if (!m) return null;
  const b = Buffer.from(m[1], "base64");
  return b.length && b.length <= 3 * 1024 * 1024 ? b : null;
}

export async function POST(request: Request) {
  const debut = Date.now();
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const slug = s(p?.slug);
  const token = s(p?.token);
  const action = s(p?.action) || "etat";
  if (!slug || !token) return NextResponse.json({ error: "slug/token requis" }, { status: 400 });

  const supabase = createAdminClient();
  const { data } = await supabase.from("human_vitrine_sites").select("id, pro_token").eq("slug", slug).eq("channel", "letter").maybeSingle();
  const site = (data as Record<string, unknown> | null) ?? null;
  if (!site || !site.pro_token || s(site.pro_token) !== token) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const siteId = s(site.id);

  try {
    const etat = await lireEtat(supabase, siteId);

    if (action === "etat") return NextResponse.json({ ok: true, etat: etatPublic(supabase, etat) });

    if (action === "valider") {
      // CELLE QU'IL A CHOISIE parmi les deux propositions (`choix` : son rang)
      const prise = propositionChoisie(etat, p?.choix);
      if (!prise) return NextResponse.json({ error: "Aucune figurine à valider." }, { status: 400 });
      // UN NOUVEAU VISAGE : celle du mois portait l'ancien, elle est à rhabiller (les éditions passées restent)
      const { edition } = editionDuJour();
      const editions = edition && etat.editions?.[edition.cleAnnee] ? { ...etat.editions, [edition.cleAnnee]: {} } : etat.editions;
      const le = new Date().toISOString();
      const collection = ajouterALaCollection(etat, { chemin: prise.chemin, le, cle: "selfie", nom: "Ma figurine", emoji: "🪀" });
      // ses traits en mots suivent sa figurine : on s'en sert pour l'habiller sans la changer ; et la voie qu'il a
      // préférée (`modele`) reste notée — ses choix diront laquelle garder
      console.info("[figurine] choisie :", JSON.stringify({ modele: prise.modele, parmi: propositionsDe(etat).map((x) => x.modele) }));
      const suivant = {
        ...etat,
        validee: { chemin: prise.chemin, le, traits: prise.traits ?? null, modele: prise.modele },
        proposee: null,
        proposees: null,
        editions,
        collection,
      };
      await ecrireEtat(supabase, siteId, suivant);
      return NextResponse.json({ ok: true, etat: etatPublic(supabase, suivant) });
    }

    if (action === "fabriquer") {
      if (p?.accord !== true) return NextResponse.json({ error: "Il faut votre accord pour fabriquer votre figurine." }, { status: 400 });
      const selfie = selfieDe(s(p?.selfie));
      if (!selfie) return NextResponse.json({ error: "Selfie manquant ou trop lourd (3 Mo au plus)." }, { status: 400 });
      const famille = FAMILLES.includes(p?.famille as FamilleDouble) ? (p?.famille as FamilleDouble) : "createur";
      const maintenant = new Date();
      if (etatPublic(supabase, etat, maintenant).essaisRestants <= 0)
        return NextResponse.json({ error: "Trois figurines aujourd'hui, c'est le maximum. Revenez demain !" }, { status: 429 });
      // L'ESSAI COMPTE DÈS QU'IL PART : une génération coûte, réussie ou non
      const jour = jourDe(maintenant);
      const essais = { jour, n: (etat.essais?.jour === jour ? etat.essais.n : 0) + 1 };
      await ecrireEtat(supabase, siteId, { ...etat, essais });
      const f = await fabriquerFigurine({ selfie, famille, avant: debut + (maxDuration - 15) * 1000 });
      if ("erreur" in f) {
        return NextResponse.json({ error: f.erreur, etat: etatPublic(supabase, { ...etat, essais }) }, { status: f.statut });
      }
      // SES PROPOSITIONS (deux, une par voie), déposées l'une après l'autre
      const le = new Date().toISOString();
      const proposees = [];
      for (const im of f.images) proposees.push({ chemin: await deposerImage(supabase, siteId, im.png), le, modele: `${im.voie}:${im.modele}`, traits: f.traits ?? null });
      const suivant = { ...etat, essais, proposee: proposees[0], proposees };
      await ecrireEtat(supabase, siteId, suivant);
      return NextResponse.json({ ok: true, etat: etatPublic(supabase, suivant) });
    }

    if (action === "fabriquer-edition") {
      const { edition } = editionDuJour();
      if (!edition) return NextResponse.json({ error: "Aucune édition en ce moment." }, { status: 400 });
      if (!etat.validee) return NextResponse.json({ error: "Fabrique d'abord ta figurine, à partir d'un selfie." }, { status: 400 });
      const maintenant = new Date();
      if (etatPublic(supabase, etat, maintenant).essaisRestants <= 0)
        return NextResponse.json({ error: "Trois figurines aujourd'hui, c'est le maximum. Revenez demain !" }, { status: 429 });
      const buste = await lireImage(supabase, etat.validee.chemin);
      if (!buste) return NextResponse.json({ error: "Ta figurine est introuvable. Refais-la à partir d'un selfie." }, { status: 404 });
      const jour = jourDe(maintenant);
      const essais = { jour, n: (etat.essais?.jour === jour ? etat.essais.n : 0) + 1 };
      await ecrireEtat(supabase, siteId, { ...etat, essais });
      const f = await habillerFigurine({ buste, cleEdition: edition.cle, nomEdition: edition.nom, traits: etat.validee.traits, avant: debut + (maxDuration - 15) * 1000 });
      if ("erreur" in f) return NextResponse.json({ error: f.erreur, etat: etatPublic(supabase, { ...etat, essais }) }, { status: f.statut });
      const le = new Date().toISOString();
      const proposees = [];
      for (const im of f.images) proposees.push({ chemin: await deposerImage(supabase, siteId, im.png), le, modele: `${im.voie}:${im.modele}` });
      const editions = { ...(etat.editions ?? {}) };
      editions[edition.cleAnnee] = { ...(editions[edition.cleAnnee] ?? {}), proposee: proposees[0], proposees };
      const suivant = { ...etat, essais, editions };
      await ecrireEtat(supabase, siteId, suivant);
      return NextResponse.json({ ok: true, etat: etatPublic(supabase, suivant) });
    }

    if (action === "valider-edition") {
      const { edition } = editionDuJour();
      const sienne = edition ? etat.editions?.[edition.cleAnnee] : undefined;
      const prise = sienne ? propositionChoisie(sienne, p?.choix) : null;
      if (!edition || !prise) return NextResponse.json({ error: "Aucune figurine du mois à valider." }, { status: 400 });
      const le = new Date().toISOString();
      console.info("[figurine] édition choisie :", JSON.stringify({ modele: prise.modele, parmi: propositionsDe(sienne ?? {}).map((x) => x.modele) }));
      const editions = { ...(etat.editions ?? {}), [edition.cleAnnee]: { validee: { chemin: prise.chemin, le }, proposee: null, proposees: null } };
      // 🗂 ELLE ENTRE DANS SA COLLECTION, avec les dates de son édition : elle y reste quand l'édition passe
      const collection = ajouterALaCollection(etat, {
        chemin: prise.chemin,
        le,
        cle: edition.cleAnnee,
        nom: edition.nom,
        emoji: edition.emoji,
        debut: edition.debut,
        fin: edition.fin,
      });
      const suivant = { ...etat, editions, collection };
      await ecrireEtat(supabase, siteId, suivant);
      return NextResponse.json({ ok: true, etat: etatPublic(supabase, suivant) });
    }

    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  } catch (e) {
    console.error("[figurine] erreur :", String((e as Error)?.message ?? e).slice(0, 300));
    return NextResponse.json({ error: "La figurine n'a pas pu être enregistrée. Réessayez." }, { status: 500 });
  }
}
