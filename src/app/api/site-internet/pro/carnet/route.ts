// 📒 LE CARNET, AU COMPTOIR (jeton pro) — ceux qui ont libéré leur fantôme à la fin de ses films.
//
// « lire » : une ligne par personne — la cage qu'elle a libérée en dernier, avec le
// prénom et le fantôme qu'elle avait, combien de ses films elle a vus jusqu'au bout,
// si elle veut être prévenue, si elle a dit stop, ses passages, et sa place dans sa
// famille (son numéro, son palier : `lib/direct/famille.ts`). JAMAIS son numéro ni
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
//
// 💬 LE MOTEUR DE MESSAGES (étape 4, `lib/direct/moteur-messages.ts`) :
// « maison » : il a dit oui au message que Mike a préparé ; il arrive dans la Maison de
// la personne (« Mes messages »), avec ses réponses faciles. Revérifié ici : pas de stop, les
// mêmes règles, et le silence (jamais deux d'affilée sans réponse dans la semaine ; après
// trois sans réponse, plus rien jusqu'à son prochain fantôme), jamais deux fois le même modèle.
// « repondu » : elle lui a répondu sur WhatsApp — ClikMe ne le voit pas, il le note.
//
// 🧾 LE TICKET DE MIKE (étape 5, `lib/direct/ticket-mike.ts`) : « ticket » rend ses sept derniers
// jours et les sept d'avant — fantômes libérés, venus, venus après son signal, messages, réponses.
//
// 🏪 L'ARDOISE DE SA VITRINE (`lib/direct/vitrine-fantomes.ts`) : « ardoise » écrit l'info du moment
// (90 signes au plus), vide l'efface ; « lire » la rend, si elle est du jour.
//
// 💌 SES PETITS MOTS (`lib/direct/petits-mots.ts`) : « mots » les lit (soixante jours), avec le prénom et
// le fantôme de leur auteur ; « coeur » {id, oui} : son 💛 (le mot passe dans sa vitrine) ; « offrir »
// {id, cadeau} : il offre un petit quelque chose (jamais d'alcool), avec son 💛.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { estCage } from "@/lib/direct/cages";
import { lookValide } from "@/lib/direct/look";
import { jourParis } from "@/lib/jour-paris";
import { HEURES_FERMEES, heureOuverte, plusPermis, plusPropre } from "@/lib/direct/previens-les";
import { estModele, silenceDe } from "@/lib/direct/moteur-messages";
import { calculerTicket, type Gestes } from "@/lib/direct/ticket-mike";
import type { PetitMot } from "@/lib/direct/petits-mots";
import { REPONDU_WHATSAPP, type LigneCarnet, type MessageEnvoye } from "@/lib/direct/carnet";
import { lireFamille } from "@/lib/direct/famille-serveur";

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
  // Les colonnes du moteur (`…_clik_messages_maison.sql`) d'abord ; sans elles, celles de « Oui, préviens-les ».
  for (const colonnes of ["id, habitant_id, plus, envoye_le, canal, modele, choix, reponse, repondu_le, texte", "id, habitant_id, plus, envoye_le"]) {
    let q = supabase.from("clik_message").select(colonnes).eq("site_id", siteId);
    if (habitantId) q = q.eq("habitant_id", habitantId);
    const { data, error } = await q.order("envoye_le", { ascending: false }).limit(5000);
    if (!error) return Array.isArray(data) ? (data as unknown as Ligne[]) : [];
  }
  return [];
}

/** Une ligne de `clik_message`, telle que le carnet et le moteur la lisent. */
function enMessage(m: Ligne): MessageEnvoye {
  const canal = s(m.canal) === "maison" ? "maison" : "whatsapp";
  return {
    id: s(m.id),
    le: s(m.envoye_le),
    plus: s(m.plus),
    canal,
    modele: s(m.modele),
    reponse: s(m.reponse),
    choix: Array.isArray(m.choix) ? (m.choix as unknown[]).map(s).filter(Boolean) : [],
    texte: s(m.texte),
  };
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
    const [cages, contacts, passages, messages, famille] = await Promise.all([
      supabase
        .from("clik_cage")
        .select("id, habitant_id, cage, prenom, look, updated_at")
        .eq("site_id", siteId)
        .order("updated_at", { ascending: false })
        .limit(2000),
      supabase.from("clik_contact").select("habitant_id, whatsapp, stop_le").eq("site_id", siteId).limit(2000),
      passagesDe(supabase, siteId),
      messagesDe(supabase, siteId),
      lireFamille(supabase, siteId).catch(() => null),
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
      if (l && l.messages.length < 20) l.messages.push(enMessage(m));
    }
    // 👻 SA PLACE DANS SA FAMILLE : son numéro d'arrivée et son palier.
    if (famille) {
      for (const [h, l] of parPersonne) {
        const numero = famille.numeroDe(h);
        if (numero) Object.assign(l, { numero, grade: famille.gradeDe(h) });
      }
    }
    const { data: ard, error: eArd } = await supabase.from("clik_ardoise").select("texte, ecrite_le").eq("site_id", siteId).maybeSingle();
    const a = eArd ? null : (ard as Ligne | null);
    const ardoise = a && jourParis(new Date(s(a.ecrite_le))) === jourParis() ? s(a.texte) : null;
    return NextResponse.json({ ok: true, actif: true, aujourdhui: jourParis(), lignes: [...parPersonne.values()], ardoise });
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

  // ── 🏪 L'ARDOISE DE SA VITRINE : L'INFO DU MOMENT (vide : on l'efface) ─────────
  if (action === "ardoise") {
    const texte = s(p?.texte).replace(/\s+/g, " ").slice(0, 90);
    const { error } = texte
      ? await supabase.from("clik_ardoise").upsert({ site_id: siteId, texte, ecrite_le: new Date().toISOString() }, { onConflict: "site_id" })
      : await supabase.from("clik_ardoise").delete().eq("site_id", siteId);
    if (error) {
      if (migrationManquante(error.message)) return NextResponse.json({ error: "L'ardoise n'est pas encore activée." }, { status: 503 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, ardoise: texte || null });
  }

  // ── 💌 SES PETITS MOTS ─────────────────────────────────────────────────────
  if (action === "mots") {
    const { data, error } = await supabase
      .from("clik_mot")
      .select("id, habitant_id, texte, liste, coeur_le, cadeau, created_at")
      .eq("site_id", siteId)
      .gte("created_at", new Date(Date.now() - 60 * 86_400_000).toISOString())
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) {
      if (migrationManquante(error.message)) return NextResponse.json({ ok: true, actif: false, mots: [] });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const lignes = (data ?? []) as Ligne[];
    const qui = new Map<string, Ligne>();
    const ids = [...new Set(lignes.map((m) => s(m.habitant_id)))];
    if (ids.length) {
      const { data: cs } = await supabase.from("clik_cage").select("habitant_id, prenom, look, updated_at").eq("site_id", siteId).in("habitant_id", ids).order("updated_at", { ascending: false });
      for (const c of (cs ?? []) as Ligne[]) if (!qui.has(s(c.habitant_id))) qui.set(s(c.habitant_id), c);
    }
    const mots: PetitMot[] = lignes.map((m) => {
      const c = qui.get(s(m.habitant_id));
      return {
        id: s(m.id),
        prenom: s(c?.prenom),
        look: lookValide(c?.look) ? s(c?.look) : "",
        texte: s(m.texte),
        liste: m.liste === true,
        le: s(m.created_at),
        coeur: Boolean(m.coeur_le),
        cadeau: s(m.cadeau),
      };
    });
    return NextResponse.json({ ok: true, actif: true, mots });
  }

  // ── 💛 SON COUP DE CŒUR, 🎁 CE QU'IL OFFRE ─────────────────────────────────────
  if (action === "coeur" || action === "offrir") {
    const id = s(p?.id);
    if (!UUID.test(id)) return NextResponse.json({ error: "Ce mot est introuvable." }, { status: 404 });
    const { data: m } = await supabase.from("clik_mot").select("id, cadeau").eq("id", id).eq("site_id", siteId).maybeSingle();
    if (!m) return NextResponse.json({ error: "Ce mot est introuvable." }, { status: 404 });
    const maintenant = new Date().toISOString();
    let maj: Record<string, unknown>;
    if (action === "coeur") {
      maj = { coeur_le: p?.oui === false ? null : maintenant };
    } else {
      const cadeau = plusPropre(s(p?.cadeau));
      if (!cadeau) return NextResponse.json({ error: "Dis ce que tu offres." }, { status: 400 });
      if (!plusPermis(cadeau)) return NextResponse.json({ error: "Pas d'alcool offert (loi Évin)." }, { status: 400 });
      if (s((m as Ligne).cadeau)) return NextResponse.json({ error: "Tu lui as déjà offert quelque chose pour ce mot." }, { status: 409 });
      maj = { cadeau, cadeau_le: maintenant, coeur_le: maintenant };
    }
    const { error } = await supabase.from("clik_mot").update(maj).eq("id", id).eq("site_id", siteId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // ── 🧾 LE TICKET DE MIKE : SES SEPT DERNIERS JOURS, ET LES SEPT D'AVANT ─────────
  if (action === "ticket") {
    const maintenant = Date.now();
    const depuis = new Date(maintenant - 16 * 86_400_000).toISOString();
    const [cs, vs, ms] = await Promise.all([
      supabase.from("clik_cage").select("habitant_id, cage, created_at").eq("site_id", siteId).gte("created_at", depuis).limit(5000),
      supabase.from("clik_visite").select("habitant_id, jour").eq("site_id", siteId).gte("jour", depuis.slice(0, 10)).limit(5000),
      messagesDe(supabase, siteId),
    ]);
    if (cs.error) {
      if (migrationManquante(cs.error.message)) return NextResponse.json({ ok: true, actif: false });
      return NextResponse.json({ error: cs.error.message }, { status: 500 });
    }
    const gestes: Gestes = {
      cages: ((cs.data ?? []) as Ligne[]).filter((c) => estCage(c.cage)).map((c) => ({ qui: s(c.habitant_id), cage: c.cage as Gestes["cages"][number]["cage"], le: s(c.created_at) })),
      visites: vs.error ? [] : ((vs.data ?? []) as Ligne[]).map((v) => ({ qui: s(v.habitant_id), jour: s(v.jour).slice(0, 10) })),
      messages: ms.map((m) => {
        const e = enMessage(m);
        return { qui: s(m.habitant_id), le: e.le, canal: e.canal ?? "whatsapp", modele: e.modele ?? "", reponse: e.reponse ?? "", repondu: s(m.repondu_le) };
      }),
    };
    return NextResponse.json({ ok: true, actif: true, semaine: calculerTicket(gestes, maintenant), avant: calculerTicket(gestes, maintenant - 7 * 86_400_000) });
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
    // LES MÊMES RÈGLES QUE LES MESSAGES DE MIKE : pas deux le même jour, deux par semaine, et le silence.
    const [deja, { data: cg }] = await Promise.all([
      messagesDe(supabase, siteId, habitantId),
      supabase.from("clik_cage").select("updated_at").eq("site_id", siteId).eq("habitant_id", habitantId).order("updated_at", { ascending: false }).limit(1),
    ]);
    const le = s((Array.isArray(cg) ? (cg[0] as Ligne | undefined) : undefined)?.updated_at);
    const tais = silenceDe({ le, messages: deja.map(enMessage), stop: false });
    if (tais) return NextResponse.json({ error: tais }, { status: 409 });
    const { error } = await supabase.from("clik_message").insert({ site_id: siteId, habitant_id: habitantId, texte, plus });
    if (error) {
      if (migrationManquante(error.message)) return NextResponse.json({ error: "Les messages ne sont pas encore activés." }, { status: 503 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  // ── 💬 IL A DIT OUI AU MESSAGE DE MIKE : IL ARRIVE DANS SA MAISON ─────────────
  if (action === "maison") {
    const texte = s(p?.texte).slice(0, 600);
    const modele = p?.modele;
    const choix = (Array.isArray(p?.choix) ? (p?.choix as unknown[]) : []).map((x) => s(x).slice(0, 30)).filter(Boolean).slice(0, 2);
    if (!texte) return NextResponse.json({ error: "Le message est vide." }, { status: 400 });
    if (!estModele(modele)) return NextResponse.json({ error: "Ce message n'est pas un message de Mike." }, { status: 400 });
    if (!heureOuverte()) return NextResponse.json({ error: HEURES_FERMEES }, { status: 409 });
    // Ce que le moteur sait d'elle : sa dernière cage, son stop, ses messages.
    const [{ data: c }, { data: k }, deja] = await Promise.all([
      supabase.from("clik_cage").select("updated_at").eq("site_id", siteId).eq("habitant_id", habitantId).order("updated_at", { ascending: false }).limit(1),
      supabase.from("clik_contact").select("stop_le").eq("site_id", siteId).eq("habitant_id", habitantId).maybeSingle(),
      messagesDe(supabase, siteId, habitantId),
    ]);
    const messages = deja.map(enMessage);
    const le = s((Array.isArray(c) ? (c[0] as Ligne | undefined) : undefined)?.updated_at);
    const tais = silenceDe({ le, messages, stop: Boolean((k as Ligne | null)?.stop_le) });
    if (tais) return NextResponse.json({ error: tais }, { status: 409 });
    if (messages.some((m) => m.modele === modele)) return NextResponse.json({ error: "Ce message lui a déjà été envoyé." }, { status: 409 });
    const { error } = await supabase
      .from("clik_message")
      .insert({ site_id: siteId, habitant_id: habitantId, texte, plus: "", canal: "maison", modele, choix });
    if (error) {
      if (migrationManquante(error.message)) return NextResponse.json({ error: "Les messages dans Ma Maison ne sont pas encore activés." }, { status: 503 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  // ── ELLE A RÉPONDU SUR WHATSAPP ────────────────────────────────────────────
  // Son dernier message WhatsApp sans réponse la prend : c'est ce qui remet le silence à zéro.
  if (action === "repondu") {
    const sienne = (await messagesDe(supabase, siteId, habitantId)).map(enMessage).find((m) => m.canal === "whatsapp" && !m.reponse);
    if (!sienne?.id) return NextResponse.json({ error: "Aucun message WhatsApp n'attend sa réponse." }, { status: 404 });
    const { error } = await supabase
      .from("clik_message")
      .update({ reponse: REPONDU_WHATSAPP, repondu_le: new Date().toISOString() })
      .eq("id", sienne.id)
      .eq("site_id", siteId);
    if (error) {
      if (migrationManquante(error.message)) return NextResponse.json({ error: "Les réponses ne sont pas encore activées." }, { status: 503 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "action inconnue" }, { status: 400 });
}
