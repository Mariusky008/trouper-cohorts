// 🎙️ LE TALKIE-WALKIE DES FIGURINES — l'onglet « Proches » (`lib/direct/talkie.ts`, `talkie-serveur.ts`).
//
// GET                                   → { proches, presence, cle } : ses proches, vivants (sa figurine, « Là
//                                          maintenant », ses non-lus, la dernière chose dite) ; s'il se montre « là » ;
//                                          sa clé (son lien : `/collection?proche=<clé>`)
// GET ?presence=1                       → { presence } (« Moi »)
// GET ?fil=<clé>                        → { fil } : sa conversation avec ce proche (ils se sont ajoutés tous les deux)
// POST { action: "la" }                 → { nonLus } : 🟢 ClikMe est ouvert (toutes les minutes, page visible)
// POST { action: "comprendre", son, duree } → { repliques, par, transcrit, dispo } : « Ta figurine a compris ça » — ses phrases,
//      et trois têtes proposées pour chacune. Rien n'est gardé, rien ne part.
// POST { action: "envoyer", cle, son, duree, repliques } → { message } : il l'envoie (les têtes qu'il a choisies)
// POST { action: "presence", oui }      → { presence } : « Montrer à mes proches quand je suis là »
// POST { action: "proche", cle, oui }   → { ok } : « L'ajouter aussi » (ou le retirer de ses proches)
// POST { action: "signaler", cle, id }  → { ok } : 🚩 un message qu'il ne veut plus voir (l'équipe le regarde)
// Un proche se désigne toujours par sa clé de profil, jamais par son identifiant.
import { NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { changerProche, choisirPresence, comprendre, envoyerParole, filAvec, maCle, maPresence, marquerLa, mesProchesVivants, prevenirDeLaParole, signalerParole } from "@/lib/direct/talkie-serveur";

export const dynamic = "force-dynamic";
// (comprendre : la transcription, puis les têtes proposées)
export const maxDuration = 60;

const sansCache = { "cache-control": "private, no-store" };
const SANS_COMPTE = { error: "Crée d’abord ta figurine." };

export async function GET(request: Request) {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_COMPTE, { status: 403 });
  const q = new URL(request.url).searchParams;
  if (q.get("presence")) return NextResponse.json({ ok: true, presence: await maPresence(supabase, moi) }, { headers: sansCache });
  const fil = q.get("fil");
  if (fil) {
    const r = await filAvec(supabase, moi, fil);
    if (!r.fil) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400, headers: sansCache });
    return NextResponse.json({ ok: true, fil: r.fil }, { headers: sansCache });
  }
  const [proches, presence, cle] = await Promise.all([mesProchesVivants(supabase, moi), maPresence(supabase, moi), maCle(supabase, moi)]);
  return NextResponse.json({ ok: true, proches, presence, cle }, { headers: sansCache });
}

export async function POST(request: Request) {
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_COMPTE, { status: 403 });
  if (p?.action === "la") return NextResponse.json({ ok: true, ...(await marquerLa(supabase, moi)) }, { headers: sansCache });
  if (p?.action === "comprendre") {
    const r = await comprendre(supabase, moi, p.son, p.duree);
    if (!r.repliques) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400 });
    return NextResponse.json({ ok: true, repliques: r.repliques, par: r.par, transcrit: r.transcrit, dispo: r.dispo }, { headers: sansCache });
  }
  if (p?.action === "envoyer") {
    const r = await envoyerParole(supabase, moi, p.cle, p.son, p.duree, p.repliques);
    if (!r.message) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400 });
    // 🔔 « Zoé t'a parlé ! » : après l'envoi, jamais bloquant
    const a = r.aPrevenir;
    if (a) after(() => prevenirDeLaParole(supabase, moi, a));
    return NextResponse.json({ ok: true, message: r.message }, { headers: sansCache });
  }
  if (p?.action === "presence") return NextResponse.json({ ok: true, ...(await choisirPresence(supabase, moi, p.oui)) }, { headers: sansCache });
  if (p?.action === "proche" || p?.action === "signaler") {
    const r = p.action === "proche" ? await changerProche(supabase, moi, p.cle, p.oui) : await signalerParole(supabase, moi, p.cle, p.id);
    return NextResponse.json(r.ok ? { ok: true } : { error: r.error }, { status: r.ok ? 200 : (r.statut ?? 400), headers: sansCache });
  }
  return NextResponse.json({ error: "Demande incomplète." }, { status: 400 });
}
