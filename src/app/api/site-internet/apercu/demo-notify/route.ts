// « Buzz dans la poche » de la démo : le testeur entre son numéro et reçoit un
// vrai SMS « Nouveau rendez-vous — … », comme s'il était le praticien. C'est le
// moment qui déclenche le « il me le faut ». Best-effort : ne casse jamais.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSms, isSmsConfigured } from "@/lib/site-internet/accueil-sms";

export const dynamic = "force-dynamic";

const str = (v: unknown) => String(v ?? "").trim();

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const slug = str(p?.slug).slice(0, 120);
  const phone = str(p?.phone).slice(0, 30);
  const slot = str(p?.slot).slice(0, 60);
  const pourQui = str(p?.pourQui).slice(0, 40);
  if (!phone) return NextResponse.json({ ok: false, error: "Numéro requis." }, { status: 400 });
  if (!isSmsConfigured()) return NextResponse.json({ ok: false, error: "SMS non configuré." }, { status: 200 });

  let praticien = "Cabinet";
  if (slug) {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("human_vitrine_sites")
        .select("business_name")
        .eq("slug", slug)
        .eq("channel", "letter")
        .maybeSingle();
      praticien = str((data as Record<string, unknown> | null)?.business_name) || praticien;
    } catch {
      /* best-effort */
    }
  }

  const body =
    `Accueil ${praticien} — Nouveau rendez-vous : ${slot || "créneau confirmé"}` +
    (pourQui ? ` (${pourQui})` : "") +
    `. Vous étiez en séance : l'accueil s'en est occupé. [Démo Popey]`;

  const res = await sendSms(phone, body);
  return NextResponse.json({ ok: res.ok, error: res.ok ? undefined : res.reason });
}
