// 🌉 L'APPUI SUR « RELIER MON DRESSING » (page `/maison/relier`, sur clikme.fr).
// Le cookie de l'habitant accompagne ce formulaire parce qu'il part de
// clikme.fr même ; envoyé depuis un autre site, il n'aurait pas de cookie et
// ne relierait rien. Fabrique le jeton à usage unique, et renvoie vers le
// domaine du magasin, qui le consomme (`./arrivee`).
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { hoteDe, magasinDuDomaine, ouvrirPont } from "@/lib/direct/pont-maison";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let retour = "";
  try {
    const f = await request.formData();
    retour = String(f.get("retour") ?? "").slice(0, 600);
  } catch {
    retour = "";
  }
  const hote = hoteDe(retour);
  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Indisponible." }, { status: 503 });
  }
  if (!hote || !(await magasinDuDomaine(supabase, hote))) return NextResponse.json({ error: "Ce n'est pas la page d'un magasin ClikMe." }, { status: 400 });
  const h = await habitantCourant(supabase);
  if (!h) return NextResponse.redirect(`${retour}${retour.includes("?") ? "&" : "?"}pont=aucun`, 303);
  const jeton = await ouvrirPont(supabase, h.id, hote);
  if (!jeton) return NextResponse.json({ error: "Indisponible." }, { status: 503 });
  const u = new URL(retour);
  // EN PRODUCTION, TOUJOURS EN HTTPS : le jeton ne voyage pas en clair.
  const proto = process.env.NODE_ENV === "production" ? "https:" : u.protocol;
  const chemin = `${u.pathname}${u.search}`.replace(/[?&]pont=[^&]*/g, "") || "/";
  const arrivee = `${proto}//${u.host}/api/direct/ma-maison/pont/arrivee?jeton=${encodeURIComponent(jeton)}&retour=${encodeURIComponent(chemin)}`;
  return NextResponse.redirect(arrivee, 303);
}
