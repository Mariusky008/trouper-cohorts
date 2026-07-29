// Demande reçue sur un site EN LIGNE (assistante → « transmettre ma demande »).
// Contrairement à /apercu/book-demo, qui journalise une démonstration et nous
// prévient, NOUS, cette route s'adresse au commerçant : elle enregistre la demande
// dans sa propre table et le prévient par SMS. Rien n'est réservé dans son agenda —
// c'est une demande de rappel, et le client l'a lue comme telle.
//
// Route publique (aucun jeton côté visiteur) : limite par IP + plafond horaire par
// établissement, comme l'inscription « Suivre ce commerce ».
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { proPhoneFrom } from "@/lib/site-internet/pro-phone";

export const dynamic = "force-dynamic";

const s = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);
const migrationMissing = (msg: string) => /does not exist|schema cache|Could not find/i.test(msg);

const IP_MAX = 6;
const IP_WINDOW_MS = 10 * 60 * 1000;
const SITE_MAX_PER_HOUR = 30;
const ipHits = new Map<string, number[]>();

function ipThrottled(ip: string): boolean {
  if (!ip) return false;
  const now = Date.now();
  const hits = (ipHits.get(ip) ?? []).filter((t) => now - t < IP_WINDOW_MS);
  if (ipHits.size > 5000) ipHits.clear();
  if (hits.length >= IP_MAX) {
    ipHits.set(ip, hits);
    return true;
  }
  hits.push(now);
  ipHits.set(ip, hits);
  return false;
}

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for") || "";
  return (fwd.split(",")[0] || request.headers.get("x-real-ip") || "").trim();
}

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }

  const slug = s(p?.slug, 120);
  const prenom = s(p?.prenom, 80);
  const tel = s(p?.tel, 40);
  const kind = ["rdv", "rappel", "devis", "acompte"].includes(s(p?.kind)) ? s(p?.kind) : "rdv";
  const souhait = s(p?.souhait, 120);
  const pourQui = s(p?.pourQui, 80);
  const premiere = s(p?.premiere, 80);

  if (!slug || !prenom || tel.replace(/\D/g, "").length < 8) {
    return NextResponse.json({ error: "Coordonnées incomplètes." }, { status: 400 });
  }
  if (ipThrottled(clientIp(request))) {
    return NextResponse.json({ error: "Trop de demandes. Réessayez dans quelques minutes." }, { status: 429 });
  }

  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("human_vitrine_sites")
    .select("id, business_name, published, whatsapp_phone_e164, metadata")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();

  const site = (row as Record<string, unknown> | null) ?? null;
  if (!site) return NextResponse.json({ error: "Commerce introuvable." }, { status: 404 });

  const siteId = s(site.id);
  const business = s(site.business_name);
  const proPhone = proPhoneFrom(site);

  // Plafond horaire par établissement : au-delà, c'est du bruit.
  try {
    const since = new Date(Date.now() - 3600_000).toISOString();
    const { count } = await supabase
      .from("human_site_requests")
      .select("id", { count: "exact", head: true })
      .eq("site_id", siteId)
      .gte("created_at", since);
    if (typeof count === "number" && count >= SITE_MAX_PER_HOUR) {
      return NextResponse.json({ error: "Trop de demandes en peu de temps. Réessayez plus tard." }, { status: 429 });
    }
  } catch {
    /* table non migrée → les autres filets restent */
  }

  let stored = false;
  try {
    const { error } = await supabase.from("human_site_requests").insert({
      site_id: siteId,
      prenom,
      tel,
      kind,
      souhait: souhait || null,
      pour_qui: pourQui || null,
      premiere: premiere || null,
      consent: true,
      status: "new",
    });
    if (error) throw new Error(error.message);
    stored = true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (!migrationMissing(msg)) {
      return NextResponse.json({ error: "La demande n'a pas pu être enregistrée." }, { status: 500 });
    }
    /* table pas encore migrée → on tente au moins de prévenir le commerçant */
  }

  // Le SMS est le seul canal qui atteint vraiment le commerçant pendant qu'il
  // travaille. Best-effort : le client a déjà sa confirmation.
  if (proPhone) {
    try {
      const { sendSms, isSmsConfigured } = await import("@/lib/site-internet/accueil-sms");
      if (isSmsConfigured()) {
        await sendSms(
          proPhone,
          `${business || "Votre site"} — nouvelle demande : ${prenom} (${tel})` +
            (souhait ? ` · souhait : ${souhait}` : "") +
            (pourQui ? ` · ${pourQui}` : "") +
            `. Rappelez-le·la pour confirmer. [Popey]`
        );
      }
    } catch {
      /* best-effort */
    }
  }

  return NextResponse.json({ ok: true, stored });
}
