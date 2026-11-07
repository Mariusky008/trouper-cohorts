// 📍 AUTOUR DE MOI — les mèmes laissés dans la ville (`lib/direct/autour.ts`, `autour-serveur.ts` ; le plan :
// `docs/reprise.md`, section 4).
//
// GET ?ville=<slug>                 → { ville, lieux, derniers } : la carte (sans ville : la sienne)
// GET ?lieu=<id>&ville=<slug>        → { lieu, memes } : les mèmes d'un lieu, pour le swipe
// GET ?profil=<clé>                  → { profil } : un créateur (ses mèmes déposés pour tout le monde)
// POST { action: "deposer", meme, lieu? | ici?: { lat, lng }, qui, mot?, nomLieu?, reponseA? } → { lieu }
//      (« ici » : sa position, arrondie en une zone d'environ 500 m ; elle n'est gardée nulle part telle quelle)
// POST { action: "retirer", meme }
// POST { action: "proche", profil: <clé>, oui: true|false } → { proche } : 👯 l'ajouter à ses proches (ou l'en retirer)
// Signaler un mème : la route de toujours (`/api/direct/ma-figurine`, `signaler`).
import { NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { villeSlug } from "@/lib/direct/ville";
import { carteDe, deposer, devenirProche, memesDuLieu, profilDe, retirer } from "@/lib/direct/autour-serveur";
import { prevenirDUneReponse } from "@/lib/direct/appli-collection-serveur";

export const dynamic = "force-dynamic";
const sansCache = { "cache-control": "no-store" };

export async function GET(request: Request) {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  const q = new URL(request.url).searchParams;
  const profil = q.get("profil");
  if (profil) {
    const p = await profilDe(supabase, profil, moi);
    return NextResponse.json(p ? { ok: true, profil: p } : { error: "Ce profil n’existe pas." }, { status: p ? 200 : 404, headers: sansCache });
  }
  const ville = villeSlug(q.get("ville") ?? "") || moi?.villeSlug || "";
  const lieu = q.get("lieu");
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
  // 👯 l'ajouter à ses proches (ou l'en retirer), depuis son profil
  if (p?.action === "proche") {
    const r = await devenirProche(supabase, moi, p.profil, p.oui);
    return NextResponse.json(r.error ? { error: r.error } : { ok: true, proche: r.proche }, { status: r.error ? (r.statut ?? 400) : 200 });
  }
  return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
}
