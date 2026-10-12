/**
 * ⚖️ AVANT OU APRÈS ? — l'essai demandé à toute la ville, et ses votes d'un appui.
 *
 * « Lorsqu'une personne fait un essayage, ne pourrait-on pas lui permettre
 * d'envoyer cet essayage sur le fil de La ville, pour avoir des avis si par
 * exemple elle n'a pas d'amis ? Que ce soit ludique, qu'il y ait l'avant et
 * l'après, que les gens puissent en un clic dire s'ils préfèrent l'avant ou
 * l'après — et un salon public, branché à La ville, où l'on retrouve les votes
 * de La ville et ceux du salon. »
 *
 * ═══ CE QUI EST PUBLIÉ ═══════════════════════════════════════════════════
 *
 * Une publication de La ville (genre « essai ») qui porte DEUX photos : la
 * sienne (`avant`) et l'essai (`photo`). Elle vit 48 heures (`fin`), puis
 * s'efface pour de bon : la ligne est retirée et les deux photos sont
 * supprimées du stockage. Son auteur peut tout retirer avant.
 *
 * À la publication, le serveur ouvre AUSSI un salon public (« Avant ou
 * après ? ») où le même vote est posé en tête. Son identifiant est rangé dans
 * la publication (`salon`) ; la publication est rangée dans le salon
 * (`avantApres.pub`).
 *
 * ═══ UN SEUL COMPTE, TROIS ENDROITS ═══════════════════════════════════════
 *
 *   · LA VILLE — un geste `{ type: "vote", v }` sur la publication ;
 *   · LE SALON — le vote ordinaire du salon (`{ type: "voter", option }`) ;
 *   · LES AMIS — « Ça me va ? » envoyé sur WhatsApp, quand la publication
 *     y est reliée (`avis`) : « ça te va trop bien » compte pour l'après,
 *     « bof » pour l'avant.
 *
 * UNE VOIX PAR PERSONNE : La ville et le salon connaissent la même personne
 * (l'habitant de ce téléphone) ; si elle a voté aux deux endroits, c'est son
 * dernier vote qui compte. Un ami du lien WhatsApp vote par son téléphone.
 *
 * CELLE QUI DEMANDE NE VOTE PAS : « le groupe conseille, il ne décide jamais
 * à la place de l'utilisateur ». Ses éventuels votes ne comptent pas.
 *
 * FICHIER SERVEUR.
 */
import { randomBytes } from "crypto";
import type { createAdminClient } from "@/lib/supabase/admin";
import { effacerPhotoRangee } from "@/lib/direct/ranger-photo";

type Supabase = ReturnType<typeof createAdminClient>;

/** Quarante-huit heures, pas une de plus : au-delà, La ville perdrait son « maintenant ». */
export const DUREE_AVANT_APRES_MS = 48 * 3600_000;
export const QUESTION_AVANT_APRES = "Avant ou après ?";

export type CoteAA = "avant" | "apres";
export type CompteAA = { avant: number; apres: number; monVote?: CoteAA };

const s = (v: unknown, n = 600) => String(v ?? "").trim().slice(0, n);
const cote = (v: unknown): CoteAA | null => (v === "avant" || v === "apres" ? v : null);

/** Ce que La ville sait d'une publication avant/après. */
export type CibleAA = { pub: string; auteur: string; salon?: string; avis?: string };

/** Un vote, d'où qu'il vienne : qui (une clé stable), quoi, quand. */
type Voix = { qui: string; v: CoteAA; t: number };

/**
 * LE COMPTE FUSIONNÉ — pur. Une voix par personne (son dernier vote), sans
 * celle qui demande. `moi` : pour dire au téléphone ce qu'il a déjà voté.
 */
export function fusionner(voix: Voix[], auteur: string, moi?: string | null): CompteAA {
  const dernier = new Map<string, Voix>();
  for (const x of voix) {
    if (!x.qui || x.qui === `h:${auteur}`) continue;
    const d = dernier.get(x.qui);
    if (!d || x.t >= d.t) dernier.set(x.qui, x);
  }
  const out: CompteAA = { avant: 0, apres: 0 };
  for (const x of dernier.values()) out[x.v]++;
  const mien = moi ? dernier.get(`h:${moi}`) : undefined;
  return mien ? { ...out, monVote: mien.v } : out;
}

/** Les voix telles que le salon les compte lui-même (le dernier vote de chaque membre, auteur compris). */
function compteDuSalon(voix: Voix[]): { avant: number; apres: number } {
  const dernier = new Map<string, CoteAA>();
  for (const x of [...voix].sort((a, b) => a.t - b.t)) dernier.set(x.qui, x.v);
  const out = { avant: 0, apres: 0 };
  for (const v of dernier.values()) out[v]++;
  return out;
}

export type ResultatAA = CompteAA & {
  /**
   * POUR LE SALON : ce qu'il faut ajouter au compte qu'il fait lui-même de ses
   * propres votes pour retomber sur le compte fusionné (peut être négatif : un
   * membre qui a voté « avant » dans le salon puis « après » dans La ville).
   */
  exterieur: { avant: number; apres: number };
};

/** LES VOTES DE PLUSIEURS PUBLICATIONS, en trois lectures au plus. */
export async function votesAvantApres(supabase: Supabase, cibles: CibleAA[], moi?: string | null): Promise<Map<string, ResultatAA>> {
  const res = new Map<string, ResultatAA>();
  if (!cibles.length) return res;
  const parPub = new Map<string, Voix[]>(cibles.map((c) => [c.pub, []]));
  const duSalon = new Map<string, Voix[]>();
  const salonVersPub = new Map(cibles.filter((c) => c.salon).map((c) => [c.salon as string, c.pub]));
  const avisVersPub = new Map(cibles.filter((c) => c.avis).map((c) => [c.avis as string, c.pub]));
  try {
    const [{ data: gv }, { data: gs }, { data: av }] = await Promise.all([
      supabase.from("human_ville_gestes").select("publication, habitant, geste, cree_le").in("publication", [...parPub.keys()]).order("id", { ascending: true }).limit(5000),
      salonVersPub.size
        ? supabase.from("human_conversation_gestes").select("conversation, habitant, geste, cree_le, masque_le").in("conversation", [...salonVersPub.keys()]).order("id", { ascending: true }).limit(5000)
        : Promise.resolve({ data: [] }),
      avisVersPub.size
        ? supabase.from("human_maison_elements").select("id, donnees").in("id", [...avisVersPub.keys()]).eq("sorte", "avis-amis")
        : Promise.resolve({ data: [] }),
    ]);
    for (const g of (gv ?? []) as Record<string, unknown>[]) {
      const x = (g.geste ?? {}) as Record<string, unknown>;
      const v = cote(x.v);
      if (x.type !== "vote" || !v) continue;
      parPub.get(s(g.publication))?.push({ qui: `h:${s(g.habitant)}`, v, t: Date.parse(s(g.cree_le)) || 0 });
    }
    for (const g of (gs ?? []) as Record<string, unknown>[]) {
      const x = (g.geste ?? {}) as Record<string, unknown>;
      const v = cote(x.option);
      const pub = salonVersPub.get(s(g.conversation));
      if (x.type !== "voter" || !v || !pub || g.masque_le) continue;
      const voix = { qui: `h:${s(g.habitant)}`, v, t: Date.parse(s(g.cree_le)) || 0 };
      parPub.get(pub)?.push(voix);
      duSalon.set(pub, [...(duSalon.get(pub) ?? []), voix]);
    }
    for (const a of (av ?? []) as Record<string, unknown>[]) {
      const pub = avisVersPub.get(s(a.id));
      const d = (a.donnees ?? {}) as Record<string, unknown>;
      if (!pub || !Array.isArray(d.votes)) continue;
      for (const x of d.votes as Record<string, unknown>[]) {
        if (!s(x?.a)) continue;
        parPub.get(pub)?.push({ qui: `a:${s(x.a, 40)}`, v: x?.v === "non" ? "avant" : "apres", t: Date.parse(s(x?.t)) || 0 });
      }
    }
  } catch {
    /* tables absentes : des zéros, pas d'erreur */
  }
  for (const c of cibles) {
    const total = fusionner(parPub.get(c.pub) ?? [], c.auteur, moi);
    const salon = compteDuSalon(duSalon.get(c.pub) ?? []);
    res.set(c.pub, { ...total, exterieur: { avant: total.avant - salon.avant, apres: total.apres - salon.apres } });
  }
  return res;
}

/** Un identifiant de salon, au même format que ceux qu'ouvre la route des conversations. */
const idSalon = () => randomBytes(12).toString("base64").replace(/[^a-z0-9]/gi, "").toLowerCase().padEnd(16, "0").slice(0, 16);

/**
 * LE SALON PUBLIC, OUVERT EN MÊME TEMPS QUE LA PUBLICATION. Public parce que
 * c'est le sens de la démarche (« elle n'a pas d'amis à qui demander ») ;
 * le même vote en tête, les deux photos dedans, la boutique à un appui.
 * `null` : la table des salons n'est pas là, la publication vit sans salon.
 */
export async function ouvrirSalonAvantApres(
  supabase: Supabase,
  o: {
    ville: string;
    habitant: string;
    qui: string;
    pub: string;
    fin: string;
    avant: string;
    apres: string;
    quoi: string;
    prix?: string;
    magasin?: string;
    boutique?: { id: string; nom: string; lien: string };
  },
): Promise<string | null> {
  const id = idSalon();
  const base = {
    cle: id,
    sujet: QUESTION_AVANT_APRES,
    ou: o.magasin || "",
    parQui: o.qui,
    quand: "Pendant 48 h",
    prive: false,
    photo: o.apres,
    ...(o.quoi ? { annonce: o.quoi } : {}),
    ...(o.prix ? { prix: o.prix } : {}),
    ...(o.boutique ? { boutique: o.boutique } : {}),
    vote: {
      question: QUESTION_AVANT_APRES,
      options: [
        { cle: "avant", label: "Avant", voix: 0, photo: o.avant },
        { cle: "apres", label: "Après", voix: 0, photo: o.apres },
      ],
    },
    propositions: [],
    avantApres: { pub: o.pub, fin: o.fin },
  };
  try {
    const { error } = await supabase.from("human_conversations").insert({ id, ville_slug: o.ville, createur: o.habitant, base, prive: false });
    if (error) return null;
    await supabase.from("human_conversation_membres").insert({ conversation: id, habitant: o.habitant, role: "createur", qui: o.qui });
    // LE PREMIER MOT, pour que le salon ne s'ouvre pas sur un vide.
    await supabase.from("human_conversation_gestes").insert({
      conversation: id,
      habitant: o.habitant,
      qui: o.qui,
      geste: { type: "ecrire", systeme: true, texte: `${o.qui} demande à la ville : avant ou après ? Votez d’un appui, et dites-lui pourquoi.` },
    });
    return id;
  } catch {
    return null;
  }
}

/** Une publication avant/après dont les 48 heures sont passées. */
export const estFinie = (d: Record<string, unknown> | null | undefined, maintenant = Date.now()) =>
  Boolean(d?.avantApres) && Number.isFinite(Date.parse(s(d?.fin))) && Date.parse(s(d?.fin)) <= maintenant;

/**
 * TOUT S'EFFACE : les deux photos quittent le stockage, la publication est
 * retirée, et le salon perd ses photos. `supprimerSalon` : son auteur a tout
 * retiré — le salon disparaît avec. Sinon (les 48 heures sont passées), ses
 * membres gardent la conversation, sans les photos.
 */
export async function effacerAvantApres(supabase: Supabase, id: string, d: Record<string, unknown>, supprimerSalon: boolean): Promise<void> {
  await Promise.all([effacerPhotoRangee(d.photo, "ville", id), effacerPhotoRangee(d.avant, "ville", `${id}-avant`)]);
  const { photo: _p, avant: _a, ...reste } = d;
  void _p;
  void _a;
  const maintenant = new Date().toISOString();
  try {
    await supabase.from("human_ville_publications").update({ retire_le: maintenant, donnees: { ...reste, efface: true } }).eq("id", id);
    const salon = s(d.salon, 40);
    if (!salon) return;
    if (supprimerSalon) {
      await supabase.from("human_conversations").update({ supprime_le: maintenant }).eq("id", salon);
      return;
    }
    const { data } = await supabase.from("human_conversations").select("base").eq("id", salon).maybeSingle();
    const base = ((data as Record<string, unknown> | null)?.base ?? null) as Record<string, unknown> | null;
    if (!base) return;
    const vote = base.vote as { question: string; options: Record<string, unknown>[] } | undefined;
    const { photo: _bp, ...sansPhoto } = base;
    void _bp;
    await supabase
      .from("human_conversations")
      .update({
        base: {
          ...sansPhoto,
          ...(vote ? { vote: { ...vote, options: vote.options.map(({ photo: _op, ...o }) => (void _op, o)) } } : {}),
          // C'EST FINI, et le salon le sait : la ville ne le voit plus dans « Découvrir ».
          ...(base.avantApres && typeof base.avantApres === "object" ? { avantApres: { ...(base.avantApres as Record<string, unknown>), fin: maintenant } } : {}),
        },
      })
      .eq("id", salon);
  } catch {
    /* on réessaiera à la prochaine lecture du fil */
  }
}

/** Le salon d'un avant/après dont les 48 heures sont passées : on ne le propose plus à la ville. */
export function salonFini(base: Record<string, unknown> | null | undefined, maintenant = Date.now()): boolean {
  const aa = base?.avantApres as Record<string, unknown> | undefined;
  const fin = Date.parse(s(aa?.fin));
  return Boolean(aa) && Number.isFinite(fin) && fin <= maintenant;
}

/**
 * LES VOTES VENUS D'AILLEURS, POUR LES SALONS AVANT/APRÈS QU'ON LIT : ce que
 * La ville et les amis ont voté, à ajouter à ce que le salon compte lui-même.
 */
export async function votesDesSalons(supabase: Supabase, salons: { id: string; pub: string }[], moi?: string | null): Promise<Map<string, ResultatAA>> {
  const out = new Map<string, ResultatAA>();
  if (!salons.length) return out;
  try {
    const { data } = await supabase.from("human_ville_publications").select("id, habitant, donnees").in("id", salons.map((x) => x.pub));
    const pubs = new Map(((data ?? []) as Record<string, unknown>[]).map((p) => [s(p.id), p]));
    const cibles: CibleAA[] = [];
    for (const x of salons) {
      const p = pubs.get(x.pub);
      const d = (p?.donnees ?? {}) as Record<string, unknown>;
      if (!p) continue;
      cibles.push({ pub: x.pub, auteur: s(p.habitant), salon: x.id, ...(s(d.avis) ? { avis: s(d.avis) } : {}) });
    }
    const votes = await votesAvantApres(supabase, cibles, moi);
    for (const x of salons) {
      const v = votes.get(x.pub);
      if (v) out.set(x.id, v);
    }
  } catch {
    /* sans La ville, le salon compte seul */
  }
  return out;
}

/**
 * LE BALAYAGE DE LA NUIT. La lecture du fil efface déjà ce qui a passé ses
 * 48 heures ; mais dans une ville où personne n'ouvre La ville, les photos
 * attendraient. Le passage quotidien (`/api/cron/direct-cloture`) les efface
 * quoi qu'il arrive : au plus tard la nuit qui suit la fin.
 */
export async function effacerLesAvantApresFinis(supabase: Supabase, maintenant = Date.now()): Promise<number> {
  try {
    const { data, error } = await supabase
      .from("human_ville_publications")
      .select("id, donnees")
      .is("retire_le", null)
      .eq("persistant", true)
      .limit(1000);
    if (error) return 0;
    const finies = ((data ?? []) as Record<string, unknown>[]).filter((p) => estFinie(p.donnees as Record<string, unknown>, maintenant));
    for (const p of finies) await effacerAvantApres(supabase, s(p.id), (p.donnees ?? {}) as Record<string, unknown>, false);
    return finies.length;
  } catch {
    return 0;
  }
}
