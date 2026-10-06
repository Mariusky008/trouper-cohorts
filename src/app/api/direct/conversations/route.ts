// LES SALONS D'ENSEMBLE DE LA VRAIE VILLE — qui les lit, qui y écrit, qui y entre.
//
// Voir la migration `20261008120000_salons_acces.sql` et les règles dans
// `lib/direct/salons-acces.ts`. CE QUE CETTE ROUTE NE FAIT JAMAIS : rendre à
// quelqu'un qui n'en est pas membre les messages, les photos ou les
// participants d'un salon privé — même s'il en a le lien.
//
// GET ?ville=<ville>                        → mes salons (membre), mes invitations
//     &jetons=a,b                           → + les salons de ces liens d'invitation
//     &ids=a,b                              → + ces salons (lecture d'un salon public ;
//                                             aperçu seul d'un salon privé)
//     &decouvrir=1                          → + les salons publics de la ville que je n'ai pas rejoints
//
// POST { action, … } — toutes demandent l'habitant (un jeton dans un cookie) :
//   ouvrir { ville, base, qui }             → { id }       je crée, j'en suis le créateur
//   geste { id, geste, qui }                → membre seulement
//   lien { id }                             → { jeton }    lien partageable (membre)
//   candidats { id? }                       → { personnes } les personnes de mes salons PRIVÉS
//   inviter { id, ref }                     → invitation nominative (membre)
//   accepter { jeton } | refuser { jeton }  → l'invitation à MON nom seulement
//   demander { id | jeton, qui }            → demande d'entrée dans un salon privé
//   decider { id, auteur, accepter }        → créateur ou modérateur
//   rejoindre { id, qui }                   → salon public seulement
//   quitter { id } · sourdine { id, on }
//   signaler { id, geste?, motif } · bloquer { id, auteur, on }
//   masquer { id, geste } · exclure { id, auteur } (modérateurs)
//   moderateur { id, auteur, on } (créateur) · rendre_prive { id } (créateur)
//
// LIRE NE CRÉE PERSONNE, ET LIRE UN SALON PUBLIC N'Y FAIT PAS ENTRER : seul
// « rejoindre » ajoute aux participants.
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { assurerHabitant, habitantCourant } from "@/lib/direct/habitant";
import { villeSlug } from "@/lib/direct/ville";
import { lookValide } from "@/lib/direct/look";
import { PREFIXE_PRIVE, cheminPrive, rangerPhotoPrivee } from "@/lib/direct/ranger-photo";
import {
  actif,
  apercuPrive,
  empreinte,
  estModerateur,
  exclu,
  peutEcrire,
  peutLire,
  refPour,
  statutPour,
  type LigneConversation,
  type LigneMembre,
} from "@/lib/direct/salons-acces";
import type { BaseConversation, Geste, GesteLu } from "@/lib/direct/conversations";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type Supabase = ReturnType<typeof createAdminClient>;
type Ligne = Record<string, unknown>;

const s = (v: unknown) => String(v ?? "").trim();
const ID = /^[a-z0-9]{16}$/;
const JETON = /^[a-f0-9]{24}$/;
/** Au plus tant de gestes par minute et par habitant : un téléphone qui boucle ne remplit pas la base. */
const PAR_MINUTE = 40;
/** Invitations, demandes, signalements : moins encore. */
const DEMARCHES_PAR_HEURE = 30;

/** Une photo de conversation : dans le seau privé — voir `ranger-photo.ts`. */
const rangerPhoto = (conv: string, valeur: unknown) => rangerPhotoPrivee(conv, valeur);

/** Un texte borné. */
const texte = (v: unknown, n: number) => s(v).slice(0, n);

/**
 * LES PHOTOS PRIVÉES DEVIENNENT L'ADRESSE DE LA ROUTE QUI LES GARDE : une
 * référence `salon:<chemin>` n'est jamais une adresse directe.
 */
function servirPhotos<T>(v: T, conv: string): T {
  if (typeof v === "string") {
    if (!v.startsWith(PREFIXE_PRIVE)) return v;
    const c = cheminPrive(v);
    return (c ? `/api/direct/conversations/photo?c=${conv}&f=${encodeURIComponent(c)}` : "") as T;
  }
  if (Array.isArray(v)) return v.map((x) => servirPhotos(x, conv)) as T;
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, servirPhotos(x, conv)])) as T;
  return v;
}

const lireConv = (r: Ligne): LigneConversation => ({
  id: s(r.id),
  ville_slug: s(r.ville_slug),
  createur: r.createur ? s(r.createur) : null,
  prive: r.prive !== false,
  supprime_le: r.supprime_le ? s(r.supprime_le) : null,
  base: (r.base && typeof r.base === "object" ? r.base : {}) as Ligne,
  activite: s(r.activite),
});
const lireMembre = (r: Ligne): LigneMembre => ({
  conversation: s(r.conversation),
  habitant: s(r.habitant),
  role: (["createur", "moderateur", "membre"].includes(s(r.role)) ? s(r.role) : "membre") as LigneMembre["role"],
  qui: s(r.qui),
  sourdine: Boolean(r.sourdine),
  quitte_le: r.quitte_le ? s(r.quitte_le) : null,
  exclu_le: r.exclu_le ? s(r.exclu_le) : null,
});

const CHAMPS_CONV = "id, ville_slug, createur, prive, supprime_le, base, activite";

async function uneConversation(supabase: Supabase, id: string): Promise<LigneConversation | null> {
  const { data } = await supabase.from("human_conversations").select(CHAMPS_CONV).eq("id", id).maybeSingle();
  return data ? lireConv(data as Ligne) : null;
}
async function monMembre(supabase: Supabase, conv: string, habitant: string): Promise<LigneMembre | null> {
  const { data } = await supabase.from("human_conversation_membres").select("*").eq("conversation", conv).eq("habitant", habitant).maybeSingle();
  return data ? lireMembre(data as Ligne) : null;
}
/** L'habitant derrière une empreinte, parmi ceux qui ont été membres ou ont demandé à entrer. */
async function habitantDeLEmpreinte(supabase: Supabase, conv: string, auteur: string): Promise<string | null> {
  const [{ data: m }, { data: d }, { data: g }] = await Promise.all([
    supabase.from("human_conversation_membres").select("habitant").eq("conversation", conv),
    supabase.from("human_conversation_demandes").select("habitant").eq("conversation", conv),
    supabase.from("human_conversation_gestes").select("habitant").eq("conversation", conv).limit(2000),
  ]);
  for (const r of [...((m ?? []) as Ligne[]), ...((d ?? []) as Ligne[]), ...((g ?? []) as Ligne[])]) {
    const h = s(r.habitant);
    if (h && empreinte(h, conv) === auteur) return h;
  }
  return null;
}
async function mesBlocages(supabase: Supabase, habitant: string): Promise<{ jeBloque: Set<string>; meBloquent: Set<string> }> {
  const [{ data: a }, { data: b }] = await Promise.all([
    supabase.from("human_habitant_blocages").select("bloque").eq("habitant", habitant),
    supabase.from("human_habitant_blocages").select("habitant").eq("bloque", habitant),
  ]);
  return {
    jeBloque: new Set(((a ?? []) as Ligne[]).map((r) => s(r.bloque))),
    meBloquent: new Set(((b ?? []) as Ligne[]).map((r) => s(r.habitant))),
  };
}
/** Entrer, ou revenir après l'avoir quitté. Jamais après une exclusion. */
async function entrer(supabase: Supabase, conv: string, habitant: string, qui: string): Promise<boolean> {
  const avant = await monMembre(supabase, conv, habitant);
  if (exclu(avant)) return false;
  if (avant) {
    const { error } = await supabase.from("human_conversation_membres").update({ quitte_le: null, qui: qui || avant.qui }).eq("conversation", conv).eq("habitant", habitant);
    return !error;
  }
  const { error } = await supabase.from("human_conversation_membres").insert({ conversation: conv, habitant, role: "membre", qui });
  return !error;
}
/** Combien de démarches (invitations, demandes, signalements) dans l'heure. */
async function tropDeDemarches(supabase: Supabase, habitant: string): Promise<boolean> {
  const depuis = new Date(Date.now() - 3600_000).toISOString();
  const [a, b, c] = await Promise.all([
    supabase.from("human_conversation_invitations").select("id", { count: "exact", head: true }).eq("par", habitant).gte("cree_le", depuis),
    supabase.from("human_conversation_demandes").select("conversation", { count: "exact", head: true }).eq("habitant", habitant).gte("cree_le", depuis),
    supabase.from("human_conversation_signalements").select("id", { count: "exact", head: true }).eq("habitant", habitant).gte("cree_le", depuis),
  ]);
  return (a.count ?? 0) + (b.count ?? 0) + (c.count ?? 0) >= DEMARCHES_PAR_HEURE;
}

/** Le geste tel qu'on accepte de le garder — rien d'autre ne passe. */
async function nettoyer(conv: string, g: Record<string, unknown>): Promise<Geste | null> {
  switch (s(g.type)) {
    case "ecrire": {
      const t = texte(g.texte, 1200);
      const photo = await rangerPhoto(conv, g.photo);
      if (!t && !photo) return null;
      const c = g.carte && typeof g.carte === "object" ? (g.carte as Record<string, unknown>) : null;
      return {
        type: "ecrire",
        texte: t,
        ...(photo ? { photo } : {}),
        ...(c ? { carte: { titre: texte(c.titre, 120), detail: texte(c.detail, 400), ...(s(c.tampon) ? { tampon: texte(c.tampon, 60) } : {}), ...(c.pro ? { pro: true } : {}) } } : {}),
        ...(g.systeme ? { systeme: true } : {}),
      };
    }
    case "tete":
      return texte(g.texte, 300) ? { type: "tete", texte: texte(g.texte, 300) } : null;
    case "proposer": {
      const p = g.p && typeof g.p === "object" ? (g.p as Record<string, unknown>) : null;
      if (!p || !s(p.cle) || !s(p.quoi)) return null;
      const photo = await rangerPhoto(conv, p.photo);
      return {
        type: "proposer",
        p: {
          cle: texte(p.cle, 160),
          par: texte(p.par, 40),
          quoi: texte(p.quoi, 160),
          ou: texte(p.ou, 160),
          ...(s(p.prix) ? { prix: texte(p.prix, 40) } : {}),
          ...(s(p.distance) ? { distance: texte(p.distance, 40) } : {}),
          ...(photo ? { photo } : {}),
        },
      };
    }
    case "voix":
      return s(g.propo) ? { type: "voix", propo: texte(g.propo, 160) } : null;
    case "venue":
      return { type: "venue" };
    case "entrer":
      return { type: "entrer", vient: Boolean(g.vient) };
    case "reagir":
      return s(g.message) && s(g.emoji) ? { type: "reagir", message: texte(g.message, 40), emoji: texte(g.emoji, 8) } : null;
    case "voter":
      return s(g.option) ? { type: "voter", option: texte(g.option, 60) } : null;
    // LA VISIBILITÉ NE PASSE PLUS PAR UN GESTE : voir l'action « rendre_prive ».
    default:
      return null;
  }
}

/** Le point de départ d'une conversation, nettoyé comme un geste. */
async function nettoyerBase(id: string, b: Record<string, unknown>, qui: string): Promise<BaseConversation | null> {
  const sujet = texte(b.sujet, 200);
  if (!sujet) return null;
  const photo = await rangerPhoto(id, b.photo);
  const props = Array.isArray(b.propositions) ? (b.propositions as Record<string, unknown>[]).slice(0, 6) : [];
  const vote = b.vote && typeof b.vote === "object" ? (b.vote as Record<string, unknown>) : null;
  const boutique = b.boutique && typeof b.boutique === "object" ? (b.boutique as Record<string, unknown>) : null;
  return {
    cle: id,
    sujet,
    ou: texte(b.ou, 160),
    parQui: qui,
    quand: texte(b.quand, 80),
    prive: b.prive !== false,
    ...(photo ? { photo } : {}),
    ...(s(b.annonce) ? { annonce: texte(b.annonce, 200) } : {}),
    ...(s(b.prix) ? { prix: texte(b.prix, 40) } : {}),
    ...(s(b.reste) ? { reste: texte(b.reste, 60) } : {}),
    ...(s(b.distance) ? { distance: texte(b.distance, 40) } : {}),
    ...(boutique && s(boutique.id) ? { boutique: { id: texte(boutique.id, 120), nom: texte(boutique.nom, 120), lien: texte(boutique.lien, 300) } } : {}),
    ...(vote && Array.isArray(vote.options)
      ? {
          vote: {
            question: texte(vote.question, 200),
            options: (vote.options as Record<string, unknown>[]).slice(0, 4).map((o) => ({
              cle: texte(o.cle, 60),
              label: texte(o.label, 80),
              voix: 0,
              ...(s(o.photo) && /^(https:\/\/|\/)/.test(s(o.photo)) ? { photo: texte(o.photo, 600) } : {}),
            })),
          },
        }
      : {}),
    propositions: props
      .filter((p) => s(p.cle) && s(p.quoi))
      .map((p) => ({
        cle: texte(p.cle, 160),
        par: qui,
        quoi: texte(p.quoi, 160),
        ou: texte(p.ou, 160),
        ...(s(p.prix) ? { prix: texte(p.prix, 40) } : {}),
        ...(s(p.distance) ? { distance: texte(p.distance, 40) } : {}),
        ...(s(p.photo) && /^(https:\/\/|\/)/.test(s(p.photo)) ? { photo: texte(p.photo, 600) } : photo ? { photo } : {}),
        voix: [qui],
      })),
  } as BaseConversation;
}

/** Le prénom qu'il donne, sinon celui qu'on connaît, sinon « Un ami ». */
const prenom = (qui: unknown, connu: string) => {
  const q = texte(qui, 30);
  return q && q !== "Vous" ? q : connu || "Un ami";
};

type Personne = { auteur: string; qui: string; role: string; moi: boolean; look?: string };

/**
 * LES LOOKS D'UNE LISTE D'HABITANTS. Si la colonne n'existe pas encore (la
 * migration du look n'est pas appliquée), rien : chacun garde son look par
 * défaut, et le reste de la réponse n'en souffre pas.
 */
async function looksDe(supabase: Supabase, ids: string[]): Promise<Map<string, string>> {
  const res = new Map<string, string>();
  if (!ids.length) return res;
  try {
    const { data, error } = await supabase.from("human_habitants").select("id, look").in("id", ids.slice(0, 300));
    if (error) return res;
    for (const r of (data ?? []) as Ligne[]) if (lookValide(r.look)) res.set(s(r.id), s(r.look));
  } catch {
    /* pas de looks */
  }
  return res;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ville = villeSlug(s(url.searchParams.get("ville")));
  const liste = (k: string, re: RegExp) =>
    s(url.searchParams.get(k))
      .split(",")
      .map((x) => x.trim())
      .filter((x) => re.test(x))
      .slice(0, 10);
  const idsDemandes = liste("ids", ID);
  const jetons = liste("jetons", JETON);
  const decouvrir = url.searchParams.get("decouvrir") === "1";
  const vide = { ok: false, moi: null, conversations: [], decouvrir: [] };
  let supabase: Supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json(vide);
  }
  const moi = await habitantCourant(supabase);
  try {
    const rien = { data: [] as Ligne[] };
    const [mesM, mesInv, lesLiens, mesDem, blocs] = await Promise.all([
      moi ? supabase.from("human_conversation_membres").select("*").eq("habitant", moi.id).limit(300) : rien,
      moi ? supabase.from("human_conversation_invitations").select("*").eq("pour", moi.id).eq("statut", "attente").limit(50) : rien,
      jetons.length ? supabase.from("human_conversation_invitations").select("*").in("id", jetons) : rien,
      moi ? supabase.from("human_conversation_demandes").select("*").eq("habitant", moi.id).limit(100) : rien,
      moi ? mesBlocages(supabase, moi.id) : Promise.resolve({ jeBloque: new Set<string>(), meBloquent: new Set<string>() }),
    ]);
    const membres = new Map<string, LigneMembre>(((mesM.data ?? []) as Ligne[]).map(lireMembre).map((m) => [m.conversation, m]));
    // UNE INVITATION À MON NOM, ET SEULEMENT LA MIENNE. Un lien nominatif
    // transféré à quelqu'un d'autre ne lui montre rien de plus qu'un lien.
    const invPerso = new Map<string, Ligne>(((mesInv.data ?? []) as Ligne[]).map((r) => [s(r.conversation), r]));
    const liens = ((lesLiens.data ?? []) as Ligne[]).filter((r) => s(r.statut) !== "revoquee" && (!r.expire_le || Date.parse(s(r.expire_le)) > Date.now()));
    const parLien = new Map<string, Ligne>(liens.map((r) => [s(r.conversation), r]));
    const demandes = new Map<string, string>(((mesDem.data ?? []) as Ligne[]).map((r) => [s(r.conversation), s(r.statut)]));

    const ids = new Set<string>([
      ...[...membres.values()].filter((m) => actif(m)).map((m) => m.conversation),
      ...invPerso.keys(),
      ...parLien.keys(),
      ...idsDemandes,
      ...[...demandes.entries()].filter(([, st]) => st === "attente").map(([c]) => c),
    ]);
    const conversations: unknown[] = [];
    if (ids.size) {
      let q = supabase.from("human_conversations").select(CHAMPS_CONV).in("id", [...ids].slice(0, 80));
      if (ville) q = q.eq("ville_slug", ville);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      const convs = ((data ?? []) as Ligne[]).map(lireConv).filter((c) => !c.supprime_le);
      const lisibles = convs.filter((c) => peutLire(c, membres.get(c.id)));
      const idsL = lisibles.map((c) => c.id);
      const [{ data: gestes }, { data: tous }, { data: enAttente }] = await Promise.all([
        idsL.length
          ? supabase.from("human_conversation_gestes").select("id, conversation, habitant, qui, geste, cree_le, masque_le").in("conversation", idsL).order("id", { ascending: true }).limit(5000)
          : rien,
        convs.length ? supabase.from("human_conversation_membres").select("*").in("conversation", convs.map((c) => c.id)) : rien,
        idsL.length ? supabase.from("human_conversation_demandes").select("*").in("conversation", idsL).eq("statut", "attente") : rien,
      ]);
      const parConv = new Map<string, GesteLu[]>();
      for (const g of (gestes ?? []) as Ligne[]) {
        const h = s(g.habitant);
        // MASQUÉ PAR UN MODÉRATEUR, OU ÉCRIT PAR QUELQU'UN QUE J'AI BLOQUÉ : pas pour moi.
        if (g.masque_le || (h && blocs.jeBloque.has(h))) continue;
        const c = s(g.conversation);
        const l = parConv.get(c) ?? [];
        l.push({ id: Number(g.id), qui: s(g.qui), auteur: h ? empreinte(h, c) : "", moi: Boolean(moi && h === moi.id), quand: s(g.cree_le), geste: g.geste as Geste });
        parConv.set(c, l);
      }
      const membresDe = new Map<string, LigneMembre[]>();
      for (const m of ((tous ?? []) as Ligne[]).map(lireMembre)) membresDe.set(m.conversation, [...(membresDe.get(m.conversation) ?? []), m]);
      const looks = await looksDe(supabase, [...new Set([...membresDe.values()].flat().filter((x) => actif(x)).map((x) => x.habitant))]);
      const attenteDe = new Map<string, Ligne[]>();
      for (const d of (enAttente ?? []) as Ligne[]) attenteDe.set(s(d.conversation), [...(attenteDe.get(s(d.conversation)) ?? []), d]);

      for (const c of convs) {
        const m = membres.get(c.id);
        const inv = invPerso.get(c.id);
        const lien = parLien.get(c.id);
        const statut = statutPour(c, m, { demande: (demandes.get(c.id) as "attente" | "acceptee" | "refusee" | undefined) ?? null, invitationPourMoi: Boolean(inv) });
        const actifs = (membresDe.get(c.id) ?? []).filter((x) => actif(x));
        const invitePar = s(inv?.par_qui) || s(lien?.par_qui) || s(c.base.parQui);
        const jeton = s(inv?.id) || s(lien?.id) || undefined;
        if (!peutLire(c, m)) {
          // UN SALON PRIVÉ DONT JE NE SUIS PAS MEMBRE : son titre et qui m'invite.
          conversations.push({
            id: c.id,
            base: apercuPrive(c, invitePar),
            createurMoi: false,
            activite: "",
            gestes: [],
            acces: { statut, prive: true, nb: actifs.length, invitePar, ...(jeton ? { jeton } : {}) },
          });
          continue;
        }
        const participants: Personne[] = actifs.map((x) => ({
          auteur: empreinte(x.habitant, c.id),
          qui: x.qui || "Un ami",
          role: x.role,
          moi: Boolean(moi && x.habitant === moi.id),
          ...(looks.get(x.habitant) ? { look: looks.get(x.habitant) } : {}),
        }));
        conversations.push({
          id: c.id,
          base: servirPhotos(c.base, c.id),
          createurMoi: Boolean(moi && c.createur === moi.id),
          activite: c.activite,
          gestes: servirPhotos(parConv.get(c.id) ?? [], c.id),
          acces: {
            statut,
            prive: c.prive,
            nb: actifs.length,
            participants,
            ...(m && actif(m) ? { role: m.role, sourdine: m.sourdine } : {}),
            ...(estModerateur(m) ? { demandes: (attenteDe.get(c.id) ?? []).map((d) => ({ auteur: empreinte(s(d.habitant), c.id), qui: s(d.qui) || "Quelqu'un" })) } : {}),
            ...(statut === "invite" ? { invitePar, jeton } : {}),
          },
        });
      }
    }

    // LES SALONS PUBLICS DE LA VILLE QUE JE N'AI PAS REJOINTS — sujet, créateur,
    // nombre de participants, dernier message : rien de privé n'y passe.
    const decouverts: unknown[] = [];
    if (decouvrir && ville) {
      const { data } = await supabase
        .from("human_conversations")
        .select(CHAMPS_CONV)
        .eq("ville_slug", ville)
        .eq("prive", false)
        .is("supprime_le", null)
        .order("activite", { ascending: false })
        .limit(40);
      const pubs = ((data ?? []) as Ligne[])
        .map(lireConv)
        .filter((c) => !actif(membres.get(c.id)) && !exclu(membres.get(c.id)) && !(c.createur && (blocs.jeBloque.has(c.createur) || blocs.meBloquent.has(c.createur))))
        .slice(0, 30);
      if (pubs.length) {
        const idsP = pubs.map((c) => c.id);
        const [{ data: mm }, { data: gg }] = await Promise.all([
          supabase.from("human_conversation_membres").select("conversation, habitant, qui, entre_le, quitte_le, exclu_le").in("conversation", idsP),
          supabase.from("human_conversation_gestes").select("conversation, habitant, qui, geste, masque_le").in("conversation", idsP).order("id", { ascending: false }).limit(600),
        ]);
        const nb = new Map<string, number>();
        // QUELQUES VRAIS PARTICIPANTS, pour les asseoir dans l'alcôve : leur
        // prénom, leur look, une empreinte propre à ce salon — rien d'autre.
        const visibles = new Map<string, { auteur: string; qui: string; habitant: string }[]>();
        const actifsP = ((mm ?? []) as Ligne[]).filter((r) => !r.quitte_le && !r.exclu_le).sort((a, b) => s(a.entre_le).localeCompare(s(b.entre_le)));
        for (const r of actifsP) {
          const c = s(r.conversation);
          nb.set(c, (nb.get(c) ?? 0) + 1);
          const l = visibles.get(c) ?? [];
          if (l.length < 3 && !blocs.jeBloque.has(s(r.habitant))) l.push({ auteur: empreinte(s(r.habitant), c), qui: s(r.qui) || "Un ami", habitant: s(r.habitant) });
          visibles.set(c, l);
        }
        const looksP = await looksDe(supabase, [...new Set([...visibles.values()].flat().map((v) => v.habitant))]);
        const dernier = new Map<string, { qui: string; texte: string }>();
        for (const g of (gg ?? []) as Ligne[]) {
          const c = s(g.conversation);
          const x = g.geste as Ligne;
          if (dernier.has(c) || g.masque_le || s(x?.type) !== "ecrire" || x?.systeme || blocs.jeBloque.has(s(g.habitant))) continue;
          if (s(x.texte)) dernier.set(c, { qui: s(g.qui), texte: texte(x.texte, 140) });
        }
        for (const c of pubs)
          decouverts.push({
            id: c.id,
            sujet: s(c.base.sujet),
            ou: s(c.base.ou),
            parQui: s(c.base.parQui),
            ...(s(c.base.photo) ? { photo: servirPhotos(s(c.base.photo), c.id) } : {}),
            nb: nb.get(c.id) ?? 0,
            visibles: (visibles.get(c.id) ?? []).map((v) => ({ auteur: v.auteur, qui: v.qui, ...(looksP.get(v.habitant) ? { look: looksP.get(v.habitant) } : {}) })),
            activite: c.activite,
            ...(dernier.get(c.id) ? { dernier: dernier.get(c.id) } : {}),
          });
      }
    }
    const monLook = moi ? (await looksDe(supabase, [moi.id])).get(moi.id) : undefined;
    return NextResponse.json({ ok: true, moi: moi ? "1" : null, ...(monLook ? { look: monLook } : {}), conversations, decouvrir: decouverts });
  } catch {
    // MIGRATION PAS ENCORE APPLIQUÉE, OU BASE INDISPONIBLE : rien de partagé,
    // l'application garde ce qui est dans le téléphone.
    return NextResponse.json({ ...vide, moi: moi ? "1" : null });
  }
}

export async function POST(request: Request) {
  let p: Ligne | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const action = s(p?.action);
  let supabase: Supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Indisponible." }, { status: 503 });
  }
  const non = (error: string, status = 403) => NextResponse.json({ error }, { status });
  const ok = (x: Ligne = {}) => NextResponse.json({ ok: true, ...x });

  if (action === "ouvrir") {
    const ville = villeSlug(s(p?.ville));
    if (!ville) return non("Ville inconnue.", 400);
    const h = await assurerHabitant(supabase, ville);
    if (!h) return non("Indisponible.", 503);
    const id = randomBytes(12).toString("base64").replace(/[^a-z0-9]/gi, "").toLowerCase().padEnd(16, "0").slice(0, 16);
    const qui = prenom(p?.qui, h.prenom);
    const base = await nettoyerBase(id, (p?.base && typeof p.base === "object" ? p.base : {}) as Ligne, qui);
    if (!base) return non("Il manque le sujet.", 400);
    // PRIVÉ PAR DÉFAUT ; PUBLIC SEULEMENT S'IL L'A CHOISI EN LE CRÉANT.
    const prive = base.prive !== false;
    const { error } = await supabase.from("human_conversations").insert({ id, ville_slug: ville, createur: h.id, base: { ...base, prive }, prive });
    if (error) return non("Enregistrement impossible.", 500);
    await supabase.from("human_conversation_membres").insert({ conversation: id, habitant: h.id, role: "createur", qui });
    return ok({ id });
  }

  // ─── LES INVITATIONS PAR JETON : accepter, refuser, demander par un lien ───
  if (action === "accepter" || action === "refuser" || (action === "demander" && JETON.test(s(p?.jeton)))) {
    const jeton = s(p?.jeton);
    if (!JETON.test(jeton)) return non("Invitation inconnue.", 400);
    const { data: inv } = await supabase.from("human_conversation_invitations").select("*").eq("id", jeton).maybeSingle();
    const i = (inv ?? null) as Ligne | null;
    if (!i || s(i.statut) === "revoquee" || (i.expire_le && Date.parse(s(i.expire_le)) < Date.now())) return non("Cette invitation n'est plus valable.", 410);
    const c = await uneConversation(supabase, s(i.conversation));
    if (!c || c.supprime_le) return non("Ce salon n'existe plus.", 410);
    const h = await assurerHabitant(supabase, c.ville_slug);
    if (!h) return non("Indisponible.", 503);
    const qui = prenom(p?.qui, h.prenom);
    if (i.pour) {
      // NOMINATIVE : SEULE LA PERSONNE INVITÉE PEUT L'ACCEPTER.
      if (s(i.pour) !== h.id) return non("Cette invitation est destinée à quelqu'un d'autre.");
      if (s(i.statut) !== "attente") return non("Tu as déjà répondu à cette invitation.", 409);
      if (action === "refuser") {
        await supabase.from("human_conversation_invitations").update({ statut: "refusee" }).eq("id", jeton);
        return ok();
      }
      if (!(await entrer(supabase, c.id, h.id, qui))) return non("Tu ne peux plus entrer dans ce salon.");
      await supabase.from("human_conversation_invitations").update({ statut: "acceptee" }).eq("id", jeton);
      return ok({ id: c.id });
    }
    // UN LIEN PARTAGEABLE : il a pu être transféré. Salon public : on le lit
    // et on le rejoint soi-même. Salon privé : on DEMANDE, le créateur décide.
    if (!c.prive) return ok({ id: c.id, lecture: true });
    if (action === "refuser") return ok();
    return demander(supabase, c, h.id, qui, jeton);
  }

  // ─── MON FANTÔME : l'identifiant d'un look prédéfini, rattaché à l'habitant ───
  if (action === "look") {
    if (!lookValide(p?.look)) return non("Look inconnu.", 400);
    const h = await assurerHabitant(supabase, villeSlug(s(p?.ville)));
    if (!h) return non("Indisponible.", 503);
    const { error } = await supabase.from("human_habitants").update({ look: s(p?.look) }).eq("id", h.id);
    // Migration pas encore appliquée : le look reste sur l'appareil.
    return ok({ garde: !error });
  }

  // ─── TOUT LE RESTE PORTE SUR UN SALON DONNÉ ───
  const idC = s(p?.id);
  if (action !== "candidats" || idC) {
    if (!ID.test(idC)) return non("Conversation inconnue.", 400);
  }
  const c = idC ? await uneConversation(supabase, idC) : null;
  if (idC && (!c || c.supprime_le)) return non("Conversation inconnue.", 404);
  const h = await assurerHabitant(supabase, c?.ville_slug ?? villeSlug(s(p?.ville)));
  if (!h) return non("Indisponible.", 503);
  const m = c ? await monMembre(supabase, c.id, h.id) : null;
  const qui = prenom(p?.qui, m?.qui || h.prenom);

  if (action === "geste" && c) {
    if (!peutEcrire(c, m)) return non(c.prive ? "Ce salon est réservé à ses membres." : "Rejoins ce salon pour y participer.");
    // UN TÉLÉPHONE QUI BOUCLE NE REMPLIT PAS LA BASE.
    const { count } = await supabase
      .from("human_conversation_gestes")
      .select("id", { count: "exact", head: true })
      .eq("habitant", h.id)
      .gte("cree_le", new Date(Date.now() - 60_000).toISOString());
    if ((count ?? 0) >= PAR_MINUTE) return non("Doucement : réessaie dans une minute.", 429);
    const geste = await nettoyer(c.id, (p?.geste && typeof p.geste === "object" ? p.geste : {}) as Ligne);
    if (!geste) return non("Geste illisible.", 400);
    const { error } = await supabase.from("human_conversation_gestes").insert({ conversation: c.id, habitant: h.id, qui: prenom(p?.qui, h.prenom), geste });
    if (error) return non("Enregistrement impossible.", 500);
    await supabase.from("human_conversations").update({ activite: new Date().toISOString() }).eq("id", c.id);
    return ok();
  }

  if (action === "lien" && c) {
    if (!actif(m)) return non("Seuls les membres peuvent inviter.");
    // LE MÊME LIEN À CHAQUE FOIS pour un même membre : on ne sème pas des jetons.
    const { data: deja } = await supabase.from("human_conversation_invitations").select("id, statut").eq("conversation", c.id).eq("par", h.id).is("pour", null).limit(5);
    const valable = ((deja ?? []) as Ligne[]).find((r) => s(r.statut) !== "revoquee");
    if (valable) return ok({ jeton: s(valable.id) });
    if (await tropDeDemarches(supabase, h.id)) return non("Doucement : réessaie plus tard.", 429);
    const jeton = randomBytes(12).toString("hex");
    const { error } = await supabase.from("human_conversation_invitations").insert({ id: jeton, conversation: c.id, par: h.id, par_qui: qui, pour: null });
    if (error) return non("Enregistrement impossible.", 500);
    return ok({ jeton });
  }

  if (action === "candidats" || action === "inviter") {
    // LES PERSONNES DE MES SALONS PRIVÉS, ET ELLES SEULES — jamais les inconnus
    // croisés dans un grand salon public. Ni celles qui m'ont bloqué, ni celles
    // que j'ai bloquées, ni celles qui sont déjà dans ce salon.
    const { data: miens } = await supabase.from("human_conversation_membres").select("*").eq("habitant", h.id);
    const privesIds = ((miens ?? []) as Ligne[]).map(lireMembre).filter((x) => actif(x)).map((x) => x.conversation);
    const { data: privConvs } = privesIds.length ? await supabase.from("human_conversations").select("id, prive, supprime_le").in("id", privesIds) : { data: [] };
    const privs = ((privConvs ?? []) as Ligne[]).filter((r) => r.prive !== false && !r.supprime_le).map((r) => s(r.id));
    const { data: autres } = privs.length ? await supabase.from("human_conversation_membres").select("*").in("conversation", privs) : { data: [] };
    const { jeBloque, meBloquent } = await mesBlocages(supabase, h.id);
    const dejaLa = new Set<string>();
    if (c) {
      const { data: ici } = await supabase.from("human_conversation_membres").select("*").eq("conversation", c.id);
      for (const x of ((ici ?? []) as Ligne[]).map(lireMembre)) if (actif(x) || exclu(x)) dejaLa.add(x.habitant);
    }
    const personnes = new Map<string, { ref: string; qui: string; habitant: string }>();
    for (const x of ((autres ?? []) as Ligne[]).map(lireMembre)) {
      if (!actif(x) || x.habitant === h.id || jeBloque.has(x.habitant) || meBloquent.has(x.habitant) || dejaLa.has(x.habitant)) continue;
      personnes.set(x.habitant, { ref: refPour(h.id, x.habitant), qui: x.qui || personnes.get(x.habitant)?.qui || "Un ami", habitant: x.habitant });
    }
    if (action === "candidats") return ok({ personnes: [...personnes.values()].map(({ ref, qui: q }) => ({ ref, qui: q })) });
    if (!c || !actif(m)) return non("Seuls les membres peuvent inviter.");
    const cible = [...personnes.values()].find((x) => x.ref === s(p?.ref));
    if (!cible) return non("Cette personne ne peut pas être invitée ici.");
    if (await tropDeDemarches(supabase, h.id)) return non("Doucement : réessaie plus tard.", 429);
    const { data: enCours } = await supabase.from("human_conversation_invitations").select("id").eq("conversation", c.id).eq("pour", cible.habitant).eq("statut", "attente").limit(1);
    if ((enCours ?? []).length) return ok({ deja: true });
    const { error } = await supabase
      .from("human_conversation_invitations")
      .insert({ id: randomBytes(12).toString("hex"), conversation: c.id, par: h.id, par_qui: qui, pour: cible.habitant });
    if (error) return non("Enregistrement impossible.", 500);
    return ok();
  }

  if (!c) return non("Conversation inconnue.", 400);

  if (action === "demander") {
    if (!c.prive) return non("Ce salon est public : rejoins-le directement.", 400);
    return demander(supabase, c, h.id, qui, null);
  }

  if (action === "rejoindre") {
    if (c.prive) return non("Ce salon est privé : il faut y être invité.");
    if (!(await entrer(supabase, c.id, h.id, qui))) return non("Tu ne peux plus rejoindre ce salon.");
    // LE NOMBRE RÉEL DE MEMBRES, après mon entrée : l'écran l'affiche tel quel.
    const { data: mm } = await supabase.from("human_conversation_membres").select("habitant, quitte_le, exclu_le").eq("conversation", c.id);
    const nb = ((mm ?? []) as Ligne[]).filter((r) => !r.quitte_le && !r.exclu_le).length;
    return ok({ nb });
  }

  if (action === "quitter") {
    if (!m) return ok();
    await supabase.from("human_conversation_membres").update({ quitte_le: new Date().toISOString() }).eq("conversation", c.id).eq("habitant", h.id);
    return ok();
  }

  if (action === "sourdine") {
    if (!actif(m)) return non("Tu n'es pas dans ce salon.");
    await supabase.from("human_conversation_membres").update({ sourdine: Boolean(p?.on) }).eq("conversation", c.id).eq("habitant", h.id);
    return ok();
  }

  if (action === "signaler") {
    if (!peutLire(c, m)) return non("Conversation inconnue.", 404);
    if (await tropDeDemarches(supabase, h.id)) return non("Doucement : réessaie plus tard.", 429);
    const geste = Number(p?.geste);
    await supabase.from("human_conversation_signalements").insert({
      conversation: c.id,
      geste: Number.isFinite(geste) && geste > 0 ? geste : null,
      habitant: h.id,
      motif: texte(p?.motif, 300),
    });
    return ok();
  }

  if (action === "bloquer") {
    const cible = await habitantDeLEmpreinte(supabase, c.id, s(p?.auteur));
    if (!cible || cible === h.id) return non("Personne inconnue.", 400);
    if (p?.on === false) await supabase.from("human_habitant_blocages").delete().eq("habitant", h.id).eq("bloque", cible);
    else {
      const { data: deja } = await supabase.from("human_habitant_blocages").select("bloque").eq("habitant", h.id).eq("bloque", cible).maybeSingle();
      if (!deja) await supabase.from("human_habitant_blocages").insert({ habitant: h.id, bloque: cible });
      // SES INVITATIONS EN ATTENTE À MON NOM TOMBENT.
      await supabase.from("human_conversation_invitations").update({ statut: "refusee" }).eq("par", cible).eq("pour", h.id).eq("statut", "attente");
    }
    return ok();
  }

  // ─── MODÉRATION : CRÉATEUR ET MODÉRATEURS ───
  if (action === "decider") {
    if (!estModerateur(m)) return non("Seuls le créateur et les modérateurs décident des entrées.");
    const cible = await habitantDeLEmpreinte(supabase, c.id, s(p?.auteur));
    if (!cible) return non("Demande inconnue.", 404);
    const { data: d } = await supabase.from("human_conversation_demandes").select("*").eq("conversation", c.id).eq("habitant", cible).maybeSingle();
    if (!d || s((d as Ligne).statut) !== "attente") return non("Demande inconnue.", 404);
    const accepter = Boolean(p?.accepter);
    if (accepter && !(await entrer(supabase, c.id, cible, s((d as Ligne).qui)))) return non("Cette personne a été exclue de ce salon.");
    await supabase
      .from("human_conversation_demandes")
      .update({ statut: accepter ? "acceptee" : "refusee", decide_le: new Date().toISOString() })
      .eq("conversation", c.id)
      .eq("habitant", cible);
    return ok();
  }

  if (action === "masquer") {
    if (!estModerateur(m)) return non("Seuls le créateur et les modérateurs peuvent masquer un message.");
    const geste = Number(p?.geste);
    if (!Number.isFinite(geste)) return non("Message inconnu.", 400);
    await supabase.from("human_conversation_gestes").update({ masque_le: new Date().toISOString() }).eq("id", geste).eq("conversation", c.id);
    return ok();
  }

  if (action === "exclure" || action === "moderateur") {
    const cible = await habitantDeLEmpreinte(supabase, c.id, s(p?.auteur));
    const sa = cible ? await monMembre(supabase, c.id, cible) : null;
    if (!cible || !sa || sa.role === "createur") return non("Personne inconnue.", 400);
    if (action === "exclure") {
      if (!estModerateur(m)) return non("Seuls le créateur et les modérateurs peuvent exclure.");
      if (sa.role === "moderateur" && m?.role !== "createur") return non("Seul le créateur peut exclure un modérateur.");
      const t = new Date().toISOString();
      await supabase.from("human_conversation_membres").update({ exclu_le: t, quitte_le: t }).eq("conversation", c.id).eq("habitant", cible);
      return ok();
    }
    if (m?.role !== "createur" || !actif(m)) return non("Seul le créateur nomme les modérateurs.");
    await supabase.from("human_conversation_membres").update({ role: p?.on === false ? "membre" : "moderateur" }).eq("conversation", c.id).eq("habitant", cible);
    return ok();
  }

  if (action === "rendre_prive") {
    // DANS UN SEUL SENS : un salon public peut devenir privé. L'inverse
    // montrerait à tous ce qui a été écrit pour quelques-uns.
    if (m?.role !== "createur" || !actif(m)) return non("Seul le créateur peut le rendre privé.");
    await supabase.from("human_conversations").update({ prive: true, base: { ...c.base, prive: true } }).eq("id", c.id);
    return ok();
  }

  return non("Action inconnue.", 400);
}

/** Demander à entrer dans un salon privé : le créateur ou un modérateur décidera. */
async function demander(supabase: Supabase, c: LigneConversation, habitant: string, qui: string, jeton: string | null) {
  const m = await monMembre(supabase, c.id, habitant);
  if (exclu(m)) return NextResponse.json({ error: "Tu ne peux plus entrer dans ce salon." }, { status: 403 });
  if (actif(m)) return NextResponse.json({ ok: true, id: c.id, membre: true });
  const { data: avant } = await supabase.from("human_conversation_demandes").select("*").eq("conversation", c.id).eq("habitant", habitant).maybeSingle();
  if (avant) {
    const st = s((avant as Ligne).statut);
    if (st === "attente") return NextResponse.json({ ok: true, demande: "attente" });
    if (st === "refusee") return NextResponse.json({ error: "Ta demande a été refusée." }, { status: 403 });
  }
  if (await tropDeDemarches(supabase, habitant)) return NextResponse.json({ error: "Doucement : réessaie plus tard." }, { status: 429 });
  const ligne = { conversation: c.id, habitant, qui, invitation: jeton, statut: "attente", decide_le: null };
  const { error } = avant
    ? await supabase.from("human_conversation_demandes").update(ligne).eq("conversation", c.id).eq("habitant", habitant)
    : await supabase.from("human_conversation_demandes").insert(ligne);
  if (error) return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
  return NextResponse.json({ ok: true, demande: "attente" });
}
