// 📒 LE CARNET, AU COMPTOIR (jeton pro) — ceux qui ont libéré leur fantôme à la fin de ses films.
//
// « lire » : une ligne par personne — la cage qu'elle a libérée en dernier, avec le
// prénom et le fantôme qu'elle avait, combien de ses films elle a vus jusqu'au bout,
// si elle veut être prévenue, si elle a dit stop, ses passages. JAMAIS son numéro ni
// son identifiant : le carnet n'en a pas besoin, et une ligne se désigne par sa
// dernière cage (`ref`). Voir `lib/direct/carnet.ts`.
//
// « passage » : il la note venue aujourd'hui (`oui`), ou l'enlève s'il s'est trompé.
// Un passage par personne et par jour (`clik_visite`).
//
// « stop » : elle lui a répondu stop sur WhatsApp. DÉFINITIF pour ce commerce : son
// numéro est effacé, et seule elle peut redire oui — en laissant à nouveau son numéro
// à la fin d'un film (`api/direct/cage` efface alors le stop).
//
// 📲 « OUI, PRÉVIENS-LES » (étape 3, `lib/direct/previens-les.ts`) :
// « numeros » : les numéros de ceux qui veulent être prévenus — seulement quand il ouvre
// l'écran pour leur écrire, puisque c'est son WhatsApp qui enverra. « envoye » : il a
// envoyé le message de Mike à quelqu'un ; on le garde (`clik_message`), après avoir revérifié
// les règles du carnet de messages : elle veut toujours être prévenue, pas deux messages le
// même jour ni plus de deux par semaine, rien avant 9 h ni après 20 h 30, pas d'alcool offert.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { estCage } from "@/lib/direct/cages";
import { lookValide } from "@/lib/direct/look";
import { jourParis } from "@/lib/jour-paris";
import type { LigneCarnet } from "@/lib/direct/carnet";
import { HEURES_FERMEES, heureOuverte, peutLuiEcrire, plusPermis, plusPropre } from "@/lib/direct/previens-les";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const migrationManquante = (msg: string) => /does not exist|schema cache|Could not find/i.test(msg);

type Ligne = Record<string, unknown>;
type Supabase = ReturnType<typeof createAdminClient>;

/** Ses passages, du plus récent au plus ancien — vide tant que `clik_visite` n'existe pas. */
async function passagesDe(supabase: Supabase, siteId: string, habitantId?: string): Promise<Ligne[]> {
  let q = supabase.from("clik_visite").select("habitant_id, jour").eq("site_id", siteId);
  if (habitantId) q = q.eq("habitant_id", habitantId);
  const { data, error } = await q.order("jour", { ascending: false }).limit(5000);
  if (error) return [];
  return Array.isArray(data) ? (data as Ligne[]) : [];
}

/** Ses messages envoyés, du plus récent au plus ancien — vide tant que `clik_message` n'existe pas. */
async function messagesDe(supabase: Supabase, siteId: string, habitantId?: string): Promise<Ligne[]> {
  let q = supabase.from("clik_message").select("habitant_id, plus, envoye_le").eq("site_id", siteId);
  if (habitantId) q = q.eq("habitant_id", habitantId);
  const { data, error } = await q.order("envoye_le", { ascending: false }).limit(5000);
  if (error) return [];
  return Array.isArray(data) ? (data as Ligne[]) : [];
}

/** La personne d'une ligne du carnet : sa cage doit être une cage de CE commerce. */
async function habitantDeLaLigne(supabase: Supabase, siteId: string, ref: string): Promise<string> {
  if (!UUID.test(ref)) return "";
  const { data } = await supabase.from("clik_cage").select("habitant_id").eq("id", ref).eq("site_id", siteId).maybeSingle();
  return s((data as Ligne | null)?.habitant_id);
}

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const slug = s(p?.slug);
  const token = s(p?.token);
  const action = s(p?.action) || "lire";
  if (!slug || !token) return NextResponse.json({ error: "slug/token requis" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("human_vitrine_sites")
    .select("id, pro_token")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const site = (row as Ligne | null) ?? null;
  if (!site || !site.pro_token || s(site.pro_token) !== token) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
  const siteId = s(site.id);

  // ── LIRE LE CARNET ──────────────────────────────────────────────────────
  if (action === "lire") {
    const [cages, contacts, passages, messages] = await Promise.all([
      supabase
        .from("clik_cage")
        .select("id, habitant_id, cage, prenom, look, updated_at")
        .eq("site_id", siteId)
        .order("updated_at", { ascending: false })
        .limit(2000),
      supabase.from("clik_contact").select("habitant_id, whatsapp, stop_le").eq("site_id", siteId).limit(2000),
      passagesDe(supabase, siteId),
      messagesDe(supabase, siteId),
    ]);
    if (cages.error) {
      // Les cages pas encore activées : un carnet vide, qui le dit, plutôt qu'une page en erreur.
      if (migrationManquante(cages.error.message)) return NextResponse.json({ ok: true, actif: false, lignes: [] });
      return NextResponse.json({ error: cages.error.message }, { status: 500 });
    }

    // UNE LIGNE PAR PERSONNE : les cages arrivent de la plus récente à la plus ancienne,
    // la première rencontrée est donc celle qu'elle a libérée en dernier.
    const parPersonne = new Map<string, LigneCarnet>();
    for (const c of (Array.isArray(cages.data) ? cages.data : []) as Ligne[]) {
      const h = s(c.habitant_id);
      const cage = c.cage;
      if (!h || !estCage(cage)) continue;
      const deja = parPersonne.get(h);
      if (deja) {
        deja.films += 1;
        // Un prénom ou un fantôme donné sur un film plus ancien vaut mieux que rien.
        if (!deja.prenom) deja.prenom = s(c.prenom);
        if (!deja.look && lookValide(c.look)) deja.look = s(c.look);
        continue;
      }
      parPersonne.set(h, {
        ref: s(c.id),
        prenom: s(c.prenom),
        look: lookValide(c.look) ? s(c.look) : "",
        cage,
        le: s(c.updated_at),
        films: 1,
        prevenir: false,
        stop: false,
        passages: 0,
        dernierPassage: null,
        messages: [],
      });
    }
    for (const k of (Array.isArray(contacts.data) ? contacts.data : []) as Ligne[]) {
      const l = parPersonne.get(s(k.habitant_id));
      if (!l) continue;
      l.stop = Boolean(k.stop_le);
      l.prevenir = Boolean(k.whatsapp) && !l.stop;
    }
    for (const v of passages) {
      const l = parPersonne.get(s(v.habitant_id));
      if (!l) continue;
      l.passages += 1;
      if (!l.dernierPassage) l.dernierPassage = s(v.jour).slice(0, 10);
    }
    for (const m of messages) {
      const l = parPersonne.get(s(m.habitant_id));
      if (l && l.messages.length < 5) l.messages.push({ le: s(m.envoye_le), plus: s(m.plus) });
    }
    return NextResponse.json({ ok: true, actif: true, aujourdhui: jourParis(), lignes: [...parPersonne.values()] });
  }

  // ── LES NUMÉROS DE CEUX QUI VEULENT ÊTRE PRÉVENUS ──────────────────────────
  // Chacun avec la référence de sa ligne du carnet (sa dernière cage), pour que l'écran les relie.
  if (action === "numeros") {
    const { data: ks, error } = await supabase
      .from("clik_contact")
      .select("habitant_id, whatsapp, stop_le")
      .eq("site_id", siteId)
      .not("whatsapp", "is", null)
      .is("stop_le", null)
      .limit(2000);
    if (error) {
      if (migrationManquante(error.message)) return NextResponse.json({ ok: true, numeros: [] });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const numero = new Map<string, string>();
    for (const k of (Array.isArray(ks) ? ks : []) as Ligne[]) if (s(k.whatsapp) && !k.stop_le) numero.set(s(k.habitant_id), s(k.whatsapp));
    const numeros: { ref: string; whatsapp: string }[] = [];
    if (numero.size) {
      const { data: cs } = await supabase
        .from("clik_cage")
        .select("id, habitant_id, updated_at")
        .eq("site_id", siteId)
        .in("habitant_id", [...numero.keys()])
        .order("updated_at", { ascending: false })
        .limit(2000);
      for (const c of (Array.isArray(cs) ? cs : []) as Ligne[]) {
        const h = s(c.habitant_id);
        if (!numero.has(h)) continue;
        numeros.push({ ref: s(c.id), whatsapp: numero.get(h) as string });
        numero.delete(h);
      }
    }
    return NextResponse.json({ ok: true, numeros });
  }

  const ref = s(p?.ref).slice(0, 64);
  const habitantId = await habitantDeLaLigne(supabase, siteId, ref);
  if (!habitantId) return NextResponse.json({ error: "Cette personne n'est pas dans ton carnet." }, { status: 404 });

  // ── UN PASSAGE AUJOURD'HUI (ou l'enlever) ────────────────────────────────
  if (action === "passage") {
    const jour = jourParis();
    const { error } =
      p?.oui === false
        ? await supabase.from("clik_visite").delete().eq("site_id", siteId).eq("habitant_id", habitantId).eq("jour", jour)
        : await supabase
            .from("clik_visite")
            .upsert({ site_id: siteId, habitant_id: habitantId, jour }, { onConflict: "site_id,habitant_id,jour" });
    if (error) {
      if (migrationManquante(error.message)) return NextResponse.json({ error: "Les passages ne sont pas encore activés." }, { status: 503 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const siens = await passagesDe(supabase, siteId, habitantId);
    return NextResponse.json({ ok: true, passages: siens.length, dernierPassage: siens.length ? s(siens[0].jour).slice(0, 10) : null });
  }

  // ── ELLE A DIT STOP ──────────────────────────────────────────────────────
  if (action === "stop") {
    const maintenant = new Date().toISOString();
    const { error } = await supabase
      .from("clik_contact")
      .upsert(
        { site_id: siteId, habitant_id: habitantId, whatsapp: null, stop_le: maintenant, updated_at: maintenant },
        { onConflict: "habitant_id,site_id" }
      );
    if (error) {
      if (migrationManquante(error.message)) return NextResponse.json({ error: "Le carnet n'est pas encore activé." }, { status: 503 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  // ── IL A ENVOYÉ LE MESSAGE DE MIKE ────────────────────────────────────────
  if (action === "envoye") {
    const texte = s(p?.texte).slice(0, 1000);
    const plus = plusPropre(s(p?.plus));
    if (!texte) return NextResponse.json({ error: "Le message est vide." }, { status: 400 });
    if (!plusPermis(plus)) {
      return NextResponse.json({ error: "Pas d'alcool offert (loi Évin)." }, { status: 400 });
    }
    if (!heureOuverte()) return NextResponse.json({ error: HEURES_FERMEES }, { status: 409 });
    const { data: k, error: ek } = await supabase
      .from("clik_contact")
      .select("whatsapp, stop_le")
      .eq("site_id", siteId)
      .eq("habitant_id", habitantId)
      .maybeSingle();
    if (ek && migrationManquante(ek.message)) return NextResponse.json({ error: "Le carnet n'est pas encore activé." }, { status: 503 });
    const contact = k as Ligne | null;
    if (!contact || !s(contact.whatsapp) || contact.stop_le) {
      return NextResponse.json({ error: "Cette personne ne veut pas, ou plus, être prévenue." }, { status: 409 });
    }
    const deja = (await messagesDe(supabase, siteId, habitantId)).map((m) => ({ le: s(m.envoye_le), plus: s(m.plus) }));
    const regle = peutLuiEcrire(deja);
    if (!regle.oui) return NextResponse.json({ error: `${regle.pourquoi}.` }, { status: 409 });
    const { error } = await supabase.from("clik_message").insert({ site_id: siteId, habitant_id: habitantId, texte, plus });
    if (error) {
      if (migrationManquante(error.message)) return NextResponse.json({ error: "Les messages ne sont pas encore activés." }, { status: 503 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "action inconnue" }, { status: 400 });
}
