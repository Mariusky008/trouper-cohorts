// 🎙️ LE SON D'UN BONJOUR (le chantier « Ma figurine », lot 4 ; `lib/direct/bonjour.ts` ; `docs/univers/ma-figurine.md`,
// section 6) — sa voix, enregistrée par lui. Seulement pour quelqu'un de ClikMe (le cookie d'habitant) ; par sa clé de
// profil, jamais son compte. Les demandes de morceaux (`Range`, ce que fait l'iPhone pour un son) sont servies.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { sonDuBonjour } from "@/lib/direct/bonjour-serveur";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ cle: string }> }) {
  const supabase = createAdminClient();
  if (!(await habitantCourant(supabase))) return NextResponse.json({ error: "Crée d’abord ta figurine sur ce téléphone." }, { status: 401 });
  const son = await sonDuBonjour(supabase, (await params).cle);
  if (!son) return NextResponse.json({ error: "Pas de bonjour." }, { status: 404 });
  const n = son.octets.length;
  const base = { "content-type": son.type, "accept-ranges": "bytes", "cache-control": "private, max-age=86400" };
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") ?? "");
  if (m && (m[1] || m[2])) {
    const debut = m[1] ? Number(m[1]) : Math.max(0, n - Number(m[2]));
    const fin = m[1] && m[2] ? Math.min(n - 1, Number(m[2])) : n - 1;
    if (debut >= n || debut > fin) return new NextResponse(null, { status: 416, headers: { ...base, "content-range": `bytes */${n}` } });
    return new NextResponse(new Uint8Array(son.octets.subarray(debut, fin + 1)), { status: 206, headers: { ...base, "content-range": `bytes ${debut}-${fin}/${n}`, "content-length": String(fin - debut + 1) } });
  }
  return new NextResponse(new Uint8Array(son.octets), { headers: { ...base, "content-length": String(n) } });
}
