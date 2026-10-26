// 💬 MES MESSAGES, DANS MA MAISON — ceux que les commerçants ont envoyés (étape 4 des cages).
//
// Mike, l'assistant du comptoir, prépare un message ; le commerçant dit oui ; il
// arrive ici, dans la Maison de l'habitant, avec une ou deux réponses à toucher.
// Voir `lib/direct/moteur-messages.ts`.
//
// GET : ses messages (les 50 derniers), avec le commerce qui les envoie — son nom,
// le visage de son fantôme —, et s'il a dit stop à ce commerce. 💌 Et ce que les commerçants
// ont répondu à ses petits mots : leur 💛, et ce qu'ils lui offrent (`reponses`).
// POST « repondre » : une des réponses proposées, une fois. Elle revient dans le carnet
// du commerçant, et Mike s'en souvient pour son message suivant.
// POST « stop » : plus rien de ce commerce, ni ici ni sur WhatsApp (son numéro est effacé).
// POST « reprendre » : il revient sur son stop — les messages dans sa Maison, pas le numéro.
//
// Jamais d'habitant créé ici : sans cookie, il n'a pas de messages.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { tenueDu } from "@/lib/direct/double-metiers";
import type { MessageMaison, ReponseAuMot } from "@/lib/direct/messages-maison";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const migrationManquante = (msg: string) => /does not exist|schema cache|Could not find/i.test(msg);
type Ligne = Record<string, unknown>;

export async function GET() {
  const supabase = createAdminClient();
  const h = await habitantCourant(supabase);
  if (!h) return NextResponse.json({ ok: true, messages: [], reponses: [] });
  const [{ data, error }, mots] = await Promise.all([
    supabase
      .from("clik_message")
      .select("id, site_id, texte, choix, reponse, envoye_le")
      .eq("habitant_id", h.id)
      .eq("canal", "maison")
      .order("envoye_le", { ascending: false })
      .limit(50),
    // 💌 CE QUE LES COMMERÇANTS ONT RÉPONDU À SES PETITS MOTS : un 💛, un cadeau (soixante jours).
    supabase
      .from("clik_mot")
      .select("id, site_id, texte, coeur_le, cadeau")
      .eq("habitant_id", h.id)
      .not("coeur_le", "is", null)
      .gte("created_at", new Date(Date.now() - 60 * 86_400_000).toISOString())
      .order("coeur_le", { ascending: false })
      .limit(20),
  ]);
  if (error && !migrationManquante(error.message)) return NextResponse.json({ error: error.message }, { status: 500 });
  const lignes = (error ? [] : Array.isArray(data) ? data : []) as Ligne[];
  const lesMots = (mots.error ? [] : (mots.data ?? [])) as Ligne[];
  const ids = [...new Set([...lignes, ...lesMots].map((m) => s(m.site_id)))];
  if (!ids.length) return NextResponse.json({ ok: true, messages: [], reponses: [] });
  const [{ data: sites }, { data: contacts }] = await Promise.all([
    supabase.from("human_vitrine_sites").select("id, slug, business_name, activite").in("id", ids),
    supabase.from("clik_contact").select("site_id, stop_le").eq("habitant_id", h.id).in("site_id", ids),
  ]);
  const site = new Map(((Array.isArray(sites) ? sites : []) as Ligne[]).map((x) => [s(x.id), x]));
  const stop = new Set(((Array.isArray(contacts) ? contacts : []) as Ligne[]).filter((k) => k.stop_le).map((k) => s(k.site_id)));
  const commerce = (x: Ligne) => ({
    cle: s(x.slug),
    nom: s(x.business_name),
    visage: `${tenueDu({ metier: s(x.activite) })?.enPied ?? "/direct/double/pied/"}visage.webp`,
  });
  const messages: MessageMaison[] = [];
  for (const m of lignes) {
    const x = site.get(s(m.site_id));
    if (!x) continue;
    messages.push({
      id: s(m.id),
      commerce: commerce(x),
      texte: s(m.texte),
      choix: Array.isArray(m.choix) ? (m.choix as unknown[]).map(s).filter(Boolean) : [],
      reponse: s(m.reponse),
      le: s(m.envoye_le),
      stop: stop.has(s(m.site_id)),
    });
  }
  const reponses: ReponseAuMot[] = [];
  for (const m of lesMots) {
    const x = site.get(s(m.site_id));
    if (x) reponses.push({ id: s(m.id), commerce: commerce(x), mot: s(m.texte), cadeau: s(m.cadeau), le: s(m.coeur_le) });
  }
  return NextResponse.json({ ok: true, messages, reponses });
}

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const action = s(p?.action);
  const supabase = createAdminClient();
  const h = await habitantCourant(supabase);
  if (!h) return NextResponse.json({ error: "Aucun message ici." }, { status: 401 });

  // ── RÉPONDRE D'UN APPUI ────────────────────────────────────────────────────
  if (action === "repondre") {
    const id = s(p?.id);
    const reponse = s(p?.reponse);
    if (!UUID.test(id)) return NextResponse.json({ error: "Message introuvable." }, { status: 404 });
    const { data } = await supabase
      .from("clik_message")
      .select("id, choix, reponse")
      .eq("id", id)
      .eq("habitant_id", h.id)
      .eq("canal", "maison")
      .maybeSingle();
    const m = data as Ligne | null;
    if (!m) return NextResponse.json({ error: "Message introuvable." }, { status: 404 });
    if (s(m.reponse)) return NextResponse.json({ error: "Tu as déjà répondu." }, { status: 409 });
    const choix = Array.isArray(m.choix) ? (m.choix as unknown[]).map(s) : [];
    if (!choix.includes(reponse)) return NextResponse.json({ error: "Cette réponse n'est pas proposée." }, { status: 400 });
    const { error } = await supabase
      .from("clik_message")
      .update({ reponse, repondu_le: new Date().toISOString() })
      .eq("id", id)
      .eq("habitant_id", h.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // ── STOP, OU REPRENDRE, POUR UN COMMERCE ─────────────────────────────────────
  if (action === "stop" || action === "reprendre") {
    const slug = s(p?.cle);
    if (!/^[a-z0-9-]{2,120}$/i.test(slug)) return NextResponse.json({ error: "Commerce introuvable." }, { status: 404 });
    const { data: x } = await supabase.from("human_vitrine_sites").select("id").eq("slug", slug).maybeSingle();
    const siteId = s((x as Ligne | null)?.id);
    if (!siteId) return NextResponse.json({ error: "Commerce introuvable." }, { status: 404 });
    const maintenant = new Date().toISOString();
    const { error } =
      action === "stop"
        ? await supabase
            .from("clik_contact")
            .upsert(
              { site_id: siteId, habitant_id: h.id, whatsapp: null, stop_le: maintenant, updated_at: maintenant },
              { onConflict: "habitant_id,site_id" }
            )
        : await supabase.from("clik_contact").update({ stop_le: null, updated_at: maintenant }).eq("site_id", siteId).eq("habitant_id", h.id);
    if (error) {
      if (migrationManquante(error.message)) return NextResponse.json({ error: "Pas encore possible. Réessaie plus tard." }, { status: 503 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "action inconnue" }, { status: 400 });
}
