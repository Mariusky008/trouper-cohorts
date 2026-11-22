// 📍 AUTOUR DE MOI — les mèmes laissés dans la ville (`lib/direct/autour.ts`, `autour-serveur.ts` ; le plan :
// `docs/reprise.md`, section 4).
//
// GET ?ville=<slug>                 → { ville, lieux, derniers } : la carte (sans ville : la sienne)
// GET ?lieu=<id>&ville=<slug>        → { lieu, memes } : les mèmes d'un lieu, pour le swipe
// GET ?profil=<clé>                  → { profil } : un créateur (ses mèmes déposés pour tout le monde)
// GET ?chercher=<texte>&lat=&lng=     → { endroits } : 🔎 un endroit de la ville (la gare, une rue…), près du centre de la carte
// POST { action: "deposer", meme, lieu? | ici?: { lat, lng }, qui, mot?, nomLieu?, reponseA? } → { lieu }
//      (« ici » : sa position, arrondie en une zone d'environ 500 m ; elle n'est gardée nulle part telle quelle)
// POST { action: "retirer", meme }
// POST { action: "proche", profil: <clé>, oui: true|false } → { proche } : 👯 l'ajouter à ses proches (ou l'en retirer)
// Signaler un mème : la route de toujours (`/api/direct/ma-figurine`, `signaler`).
//
// 🧍 LA FIGURINE POSÉE (22 novembre 2026, le nouvel « Autour » ; `docs/univers/autour.md`) :
// GET ?figurines=1&ville=<slug>       → { ville, lieux, derniers } : la carte des figurines posées aujourd'hui
// GET ?figurines=1&lieu=<id>          → { lieu, figurines } : celles d'un lieu, assises, avec leur mot
// GET ?mesTetes=1                     → { tetes } : ses têtes à choisir (son humeur du jour, ses expressions)
// POST { action: "poser", lieu? | ici?: { lat, lng }, mot, tete, qui, nomLieu?, reponseA? } → { lieu, id }
// POST { action: "retirer-pose", id } ; POST { action: "signaler-pose", lieu, id }
import { NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { villeSlug } from "@/lib/direct/ville";
import { carteDe, carteDesFigurines, deposer, devenirProche, figurinesDuLieu, memesDuLieu, mesTetes, poserSaFigurine, profilDe, retirer, retirerSaFigurine, signalerUneFigurine } from "@/lib/direct/autour-serveur";
import { prevenirDUneReponse } from "@/lib/direct/appli-collection-serveur";
import { chercherEndroits } from "@/lib/direct/geocodeur-serveur";

export const dynamic = "force-dynamic";
const sansCache = { "cache-control": "no-store" };

export async function GET(request: Request) {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  const q = new URL(request.url).searchParams;
  // 🔎 un endroit de la ville, pour y aller sur la carte (et y déposer, s'il veut)
  if (q.has("chercher")) return NextResponse.json({ ok: true, endroits: await chercherEndroits(q.get("chercher"), { lat: q.get("lat"), lng: q.get("lng") }) }, { headers: sansCache });
  const profil = q.get("profil");
  if (profil) {
    const p = await profilDe(supabase, profil, moi);
    return NextResponse.json(p ? { ok: true, profil: p } : { error: "Ce profil n’existe pas." }, { status: p ? 200 : 404, headers: sansCache });
  }
  if (q.has("mesTetes")) return moi ? NextResponse.json({ ok: true, tetes: await mesTetes(supabase, moi.id) }, { headers: sansCache }) : NextResponse.json({ error: "Crée d’abord ta figurine." }, { status: 403, headers: sansCache });
  const ville = villeSlug(q.get("ville") ?? "") || moi?.villeSlug || "";
  const lieu = q.get("lieu");
  // 🧍 la figurine posée : la carte, un lieu
  if (q.has("figurines")) {
    if (lieu) {
      const r = await figurinesDuLieu(supabase, ville, lieu, moi);
      return NextResponse.json(r.lieu ? { ok: true, ...r } : { error: "Personne n’est posé ici aujourd’hui." }, { status: r.lieu ? 200 : 404, headers: sansCache });
    }
    return NextResponse.json({ ok: true, compte: Boolean(moi), ...(await carteDesFigurines(supabase, ville, moi)) }, { headers: sansCache });
  }
  if (lieu) {
    const r = await memesDuLieu(supabase, ville, lieu, moi);
    return NextResponse.json(r.lieu ? { ok: true, ...r } : { error: "Ce lieu n’a pas encore de mème." }, { status: r.lieu ? 200 : 404, headers: sansCache });
  }
  return NextResponse.json({ ok: true, compte: Boolean(moi), ...(await carteDe(supabase, ville, moi)) }, { headers: sansCache });
}

export async function POST(request: Request) {
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json({ error: "Crée d’abord ta figurine." }, { status: 403 });
  if (p?.action === "deposer") {
    const r = await deposer(supabase, moi, { meme: p.meme, lieu: p.lieu, ici: p.ici, qui: p.qui, mot: p.mot, nomLieu: p.nomLieu, reponseA: p.reponseA });
    // ↩️ « Sam t'a répondu ! » : à l'auteur du mème, après la réponse (jamais bloquant)
    const a = r.aPrevenir;
    if (a) after(() => prevenirDUneReponse(supabase, a.auteur, moi.id, { meme: a.meme, ou: a.ou, url: a.url }).then(() => undefined, () => undefined));
    // (sans son âge déclaré : `age`, l'écran le lui demande, une fois)
    return NextResponse.json(r.ok ? { ok: true, lieu: r.lieu } : { error: r.error, ...(r.age ? { age: true } : {}) }, { status: r.ok ? 200 : (r.statut ?? 400) });
  }
  if (p?.action === "retirer") return NextResponse.json(await retirer(supabase, moi, p.meme));
  // 🧍 poser sa figurine (son mot du jour, sa tête, qui la voit), la retirer, en signaler une
  if (p?.action === "poser") {
    const r = await poserSaFigurine(supabase, moi, { lieu: p.lieu, ici: p.ici, qui: p.qui, mot: p.mot, tete: p.tete, nomLieu: p.nomLieu, reponseA: p.reponseA });
    const a = r.aPrevenir;
    if (a) after(() => prevenirDUneReponse(supabase, a.auteur, moi.id, { meme: a.meme, ou: a.ou, url: a.url }).then(() => undefined, () => undefined));
    return NextResponse.json(r.ok ? { ok: true, lieu: r.lieu, id: r.id } : { error: r.error, ...(r.age ? { age: true } : {}) }, { status: r.ok ? 200 : (r.statut ?? 400) });
  }
  if (p?.action === "retirer-pose") return NextResponse.json(await retirerSaFigurine(supabase, moi, p.id));
  if (p?.action === "signaler-pose") {
    const r = await signalerUneFigurine(supabase, moi, p.lieu, p.id);
    return NextResponse.json(r.ok ? { ok: true } : { error: r.error }, { status: r.ok ? 200 : (r.statut ?? 400) });
  }
  // 👯 l'ajouter à ses proches (ou l'en retirer), depuis son profil
  if (p?.action === "proche") {
    const r = await devenirProche(supabase, moi, p.profil, p.oui);
    return NextResponse.json(r.error ? { error: r.error } : { ok: true, proche: r.proche }, { status: r.error ? (r.statut ?? 400) : 200 });
  }
  return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
}
