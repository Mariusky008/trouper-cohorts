// 🔒 UNE PHOTO DE SALON — servie seulement à qui peut lire ce salon.
//
// GET ?c=<conversation>&f=<chemin> → redirection vers une adresse signée de
// deux minutes, ou 404. Les photos des salons sont rangées dans un seau privé
// (`rangerPhotoPrivee`) : sans passer ici, aucune adresse ne les ouvre. Même
// réponse (404) pour « n'existe pas » et « pas pour toi » : on ne confirme pas
// l'existence d'un salon privé à qui n'en est pas.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { PREFIXE_PRIVE, SEAU_SALONS, cheminPrive } from "@/lib/direct/ranger-photo";
import { peutLire, type LigneMembre } from "@/lib/direct/salons-acces";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();
const introuvable = () => new NextResponse("Introuvable.", { status: 404, headers: { "cache-control": "no-store" } });

export async function GET(request: Request) {
  const url = new URL(request.url);
  const conv = s(url.searchParams.get("c"));
  const chemin = cheminPrive(`${PREFIXE_PRIVE}${s(url.searchParams.get("f"))}`);
  if (!/^[a-z0-9]{16}$/.test(conv) || !chemin || !chemin.startsWith(`${conv}/`)) return introuvable();
  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch {
    return introuvable();
  }
  const { data: c } = await supabase.from("human_conversations").select("id, prive, supprime_le").eq("id", conv).maybeSingle();
  if (!c) return introuvable();
  const ligne = c as Record<string, unknown>;
  const moi = await habitantCourant(supabase);
  let membre: LigneMembre | null = null;
  if (moi) {
    const { data } = await supabase.from("human_conversation_membres").select("*").eq("conversation", conv).eq("habitant", moi.id).maybeSingle();
    membre = (data as LigneMembre | null) ?? null;
  }
  if (!peutLire({ prive: ligne.prive !== false, supprime_le: ligne.supprime_le ? s(ligne.supprime_le) : null }, membre)) return introuvable();
  const { data: signe } = await supabase.storage.from(SEAU_SALONS).createSignedUrl(chemin, 120);
  if (!signe?.signedUrl) return introuvable();
  return NextResponse.redirect(signe.signedUrl, { status: 302, headers: { "cache-control": "private, no-store" } });
}
