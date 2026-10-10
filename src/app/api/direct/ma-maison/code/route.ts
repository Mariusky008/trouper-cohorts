// ✉️ LE CODE À SIX CHIFFRES — « Pour ne jamais perdre votre maison ».
//
// La réponse est la même que l'adresse soit connue ou non : on n'apprend pas
// ici qui habite ClikMe. Trois codes par adresse en quinze minutes, pas plus.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { villeSlug } from "@/lib/direct/ville";
import { EMAIL_VALIDE, normaliserEmail, nouveauCode } from "@/lib/direct/maison-serveur";
import { sendCodeMaison } from "@/lib/site-internet/ville-mail";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const email = normaliserEmail(p?.email);
  const ville = villeSlug(s(p?.ville));
  if (!EMAIL_VALIDE.test(email)) return NextResponse.json({ error: "Cette adresse ne semble pas complète." }, { status: 400 });
  if (!ville) return NextResponse.json({ error: "Ville inconnue." }, { status: 400 });
  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Indisponible pour le moment." }, { status: 503 });
  }
  const r = await nouveauCode(supabase, email, ville);
  if ("erreur" in r) {
    return r.erreur === "trop"
      ? NextResponse.json({ error: "Trois codes viennent de partir. Patientez quelques minutes." }, { status: 429 })
      : NextResponse.json({ error: "Indisponible pour le moment." }, { status: 503 });
  }
  // SANS SERVICE D'E-MAIL, EN DÉVELOPPEMENT SEULEMENT, le code s'écrit dans le
  // journal du serveur : c'est ainsi qu'on l'essaie sans boîte aux lettres.
  // En production, pas de clé = pas de code, et on le dit.
  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "L'envoi d'e-mails n'est pas configuré." }, { status: 503 });
    console.log(`[ma-maison] code pour ${email} : ${r.code}`);
    return NextResponse.json({ ok: true });
  }
  const parti = await sendCodeMaison(email, r.code);
  return parti ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "L'e-mail n'est pas parti. Réessayez." }, { status: 502 });
}
