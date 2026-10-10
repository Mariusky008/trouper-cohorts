// 🔑 LE CODE DONNÉ — et la maison qui va avec.
//
// C'est la SEULE porte vers une maison depuis un autre téléphone. Le bon code
// prouve qu'on lit cette boîte aux lettres :
//   · l'adresse appartient déjà à un habitant de la ville → ce téléphone le
//     devient, et ce qu'il savait rejoint sa maison (`fusionner`) ;
//   · l'adresse est nouvelle → elle se pose sur l'habitant de ce téléphone.
// Prouver son adresse n'abonne à rien : `confirmed_at` (le résumé du jour)
// n'est pas touché, seul `email_verifie_le` l'est.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assurerHabitant, fusionner, habitantCourant, poserCookie } from "@/lib/direct/habitant";
import { villeSlug } from "@/lib/direct/ville";
import { EMAIL_VALIDE, lireMaison, normaliserEmail, verifierCode } from "@/lib/direct/maison-serveur";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();
const MOTS = {
  faux: "Ce n'est pas le bon code.",
  expire: "Ce code n'est plus valable. Demandez-en un nouveau.",
  trop: "Trop d'essais. Demandez un nouveau code.",
  base: "Indisponible pour le moment.",
};

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const email = normaliserEmail(p?.email);
  const code = s(p?.code).replace(/\D/g, "");
  const ville = villeSlug(s(p?.ville));
  if (!EMAIL_VALIDE.test(email) || code.length !== 6 || !ville) return NextResponse.json({ error: "Il faut l'adresse et les six chiffres." }, { status: 400 });
  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json({ error: MOTS.base }, { status: 503 });
  }
  const verdict = await verifierCode(supabase, email, code);
  if (verdict !== "ok") return NextResponse.json({ error: MOTS[verdict] }, { status: verdict === "base" ? 503 : 400 });

  const maintenant = new Date().toISOString();
  try {
    const ici = await habitantCourant(supabase);
    const { data } = await supabase.from("human_habitants").select("id, device_token").eq("ville_slug", ville).eq("email", email).maybeSingle();
    const proprio = (data as Record<string, unknown> | null) ?? null;
    let habitant: string;
    if (proprio) {
      habitant = s(proprio.id);
      if (ici && ici.id !== habitant) await fusionner(supabase, ici.id, habitant);
      await poserCookie(s(proprio.device_token));
      await supabase.from("human_habitants").update({ email_verifie_le: maintenant }).eq("id", habitant);
    } else {
      const h = ici ?? (await assurerHabitant(supabase, ville));
      if (!h) return NextResponse.json({ error: MOTS.base }, { status: 503 });
      habitant = h.id;
      // Une AUTRE adresse confirmée pour le résumé ne passe pas en douce à
      // celle-ci : l'accord de recevoir le résumé est à redonner.
      const changement = h.email && h.email !== email ? { confirmed_at: null } : {};
      await supabase.from("human_habitants").update({ email, email_verifie_le: maintenant, ...changement }).eq("id", habitant);
    }
    const { memoire } = await lireMaison(supabase, habitant);
    return NextResponse.json({ ok: true, memoire, compte: { email, verifie: true } }, { headers: { "cache-control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: MOTS.base }, { status: 503 });
  }
}
