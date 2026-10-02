// 📖 LA LECTURE DE SA CARTE, DANS UNE ROUTE QUI A LE TEMPS.
//
// « Ça a bien récupéré 16 images, mais rien ne s'affiche — ni images, ni
// prix, ni menu. »
//
// LA LECTURE PARTAIT DEPUIS LA PAGE ELLE-MÊME (`after`, après l'avoir servie).
// Or la page n'a pas le temps d'une lecture : seize grandes photos à aller
// chercher, puis un modèle qui les lit — une à deux minutes. Coupée en route,
// elle ne laissait rien : ni plats, ni erreur, et l'essai noté empêchait d'en
// relancer une avant la demi-heure.
//
// LA PAGE NE FAIT PLUS QUE SONNER À CETTE PORTE. Cette route répond tout de
// suite, et lit la carte après sa réponse, avec cinq minutes devant elle.
// Elle ne lit que si c'est dû (`carteALire`) : une visite de plus ne relance
// rien. Elle n'écrit que dans la carte lue ; l'adresse de la page est sa
// seule clé, comme pour la lecture de la fiche.
import { NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { carteALire, lireLaCarte } from "@/lib/site-internet/carte-lue";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const s = (v: unknown) => (v == null ? "" : String(v)).trim();

export async function POST(requete: Request) {
  const p = (await requete.json().catch(() => ({}))) as Record<string, unknown>;
  const slug = s(p.slug);
  if (!/^[a-z0-9-]{2,120}$/i.test(slug)) return NextResponse.json({ erreur: "adresse illisible" }, { status: 400 });
  const { data } = await createAdminClient()
    .from("human_vitrine_sites")
    .select("diagnostic")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const diag = (data as Record<string, unknown> | null)?.diagnostic;
  if (!carteALire(diag)) return NextResponse.json({ lance: false });
  const origine = new URL(requete.url).origin;
  after(async () => {
    try {
      await lireLaCarte(slug, origine);
    } catch {
      /* la prochaine visite relancera */
    }
  });
  return NextResponse.json({ lance: true }, { status: 202 });
}
