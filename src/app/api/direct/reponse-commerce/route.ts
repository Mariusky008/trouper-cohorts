// ✅ LE COMMERÇANT RÉPOND — « c'est mis de côté » ou « plus disponible ».
//
// Appelée par la page `/reponse/<jeton>`, quand il appuie. Le jeton est signé
// par le serveur (voir `lib/direct/reponse-commerce.ts`) : il désigne UNE
// conversation et UN duel, et rien d'autre. La réponse entre dans le salon
// comme un geste sans habitant derrière — le seul genre de geste que le rejeu
// accepte pour dire « confirmé » (voir `duelReponse` dans `conversations.ts`).
import { after, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { lireJetonReponse } from "@/lib/direct/reponse-commerce";
import { motsDeLAction } from "@/lib/direct/duel";
import { prevenirDeLaReponse } from "@/lib/direct/push-salons";

export const dynamic = "force-dynamic";

/** Il peut se raviser, pas réécrire indéfiniment. */
const REPONSES_MAX = 6;

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const j = lireJetonReponse(String(p?.jeton ?? ""));
  if (!j) return NextResponse.json({ error: "Ce lien n'est plus valable." }, { status: 400 });
  const etat = p?.etat === "confirme" ? "confirme" : p?.etat === "refuse" ? "refuse" : null;
  if (!etat) return NextResponse.json({ error: "Réponse illisible." }, { status: 400 });
  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Indisponible." }, { status: 503 });
  }
  const { data: conv } = await supabase.from("human_conversations").select("id, supprime_le").eq("id", j.c).maybeSingle();
  if (!conv || (conv as Record<string, unknown>).supprime_le) return NextResponse.json({ error: "Ce salon n'existe plus." }, { status: 404 });
  const { data: deja } = await supabase.from("human_conversation_gestes").select("geste").eq("conversation", j.c).is("habitant", null).limit(200);
  const avant = ((deja ?? []) as { geste?: { type?: string; duel?: string } }[]).filter((r) => r.geste?.type === "duelReponse" && r.geste.duel === j.d).length;
  if (avant >= REPONSES_MAX) return NextResponse.json({ error: "Déjà répondu." }, { status: 429 });
  const { error } = await supabase
    .from("human_conversation_gestes")
    .insert({ conversation: j.c, habitant: null, qui: j.m || "Le commerce", geste: { type: "duelReponse", duel: j.d, etat } });
  if (error) return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
  await supabase.from("human_conversations").update({ activite: new Date().toISOString() }).eq("id", j.c);
  // 🔔 CELUI QUI AVAIT DEMANDÉ L'APPREND, MÊME TÉLÉPHONE EN POCHE.
  const mots = motsDeLAction(j.a);
  after(() => prevenirDeLaReponse(supabase, j, { titre: etat === "confirme" ? `${mots.confirme} ✅` : mots.refuse }));
  return NextResponse.json({ ok: true, etat });
}
