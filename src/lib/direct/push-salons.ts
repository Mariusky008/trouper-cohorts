/**
 * 🔔 PRÉVENIR LES MEMBRES D'UN SALON — « Emma vient de voter ».
 *
 * « Les notifications doivent être utiles, pas envahissantes. » Quatre
 * moments seulement, et chacun ne va qu'à ceux qu'il concerne :
 *
 *   · `duel`    — un duel est lancé : les autres membres, pour qu'ils votent.
 *   · `vote`    — quelqu'un a voté : celui qui hésite, et lui seul.
 *   · `choix`   — il a gardé l'un des deux : ceux qui avaient voté.
 *   · `reponse` — le commerçant a répondu : celui qui avait demandé.
 *
 * CE QUI LES RETIENT : la sourdine du salon (toujours respectée) ; pas deux
 * votes signalés à moins de trois minutes d'écart — le premier suffit à faire
 * revenir ; au plus six par heure et par salon pour une même personne, sauf la
 * réponse du commerçant, qu'on attendait. Jamais à celui qui vient d'agir.
 *
 * SANS CLÉS VAPID OU SANS LA MIGRATION `20261013120000_salons_push.sql`,
 * RIEN NE PART ET RIEN NE CASSE : on lit l'erreur, on rend zéro. Un abonnement
 * que le service push dit mort (404, 410) est effacé.
 *
 * FICHIER SERVEUR.
 */
import webpush from "web-push";
import type { createAdminClient } from "@/lib/supabase/admin";
import { actif, type LigneMembre } from "@/lib/direct/salons-acces";

type Supabase = ReturnType<typeof createAdminClient>;
type Ligne = Record<string, unknown>;

export type SortePush = "duel" | "vote" | "choix" | "reponse";

/** L'écart minimal entre deux notifications de la même sorte, pour un même salon. */
const ECART: Record<SortePush, number> = { duel: 0, vote: 3 * 60_000, choix: 0, reponse: 0 };
/** Au plus tant par heure, par salon et par personne (la réponse du commerçant n'est pas comptée). */
const PAR_HEURE = 6;

let vapidPose: boolean | null = null;
function vapid(): boolean {
  if (vapidPose !== null) return vapidPose;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const mail = process.env.NEXT_PUBLIC_APP_EMAIL;
  if (!pub || !priv || !mail) return (vapidPose = false);
  try {
    webpush.setVapidDetails(`mailto:${mail}`, pub, priv);
    vapidPose = true;
  } catch {
    vapidPose = false;
  }
  return vapidPose;
}

export type Notification = { titre: string; corps: string; url: string; tag: string };

/**
 * ENVOYER, À CEUX QUI DOIVENT L'ÊTRE. `pour` : des habitants ; ceux qui ne sont
 * plus membres, ont mis le salon en sourdine ou ont déjà été prévenus sont
 * retirés ici, pas chez l'appelant.
 */
export async function prevenir(
  supabase: Supabase,
  o: { conv: string; pour: string[]; sauf?: string; sorte: SortePush; n: Notification },
): Promise<{ envoyes: number; personnes: number }> {
  const rien = { envoyes: 0, personnes: 0 };
  if (!vapid()) return rien;
  const cibles = [...new Set(o.pour.filter((h) => h && h !== o.sauf))];
  if (!cibles.length) return rien;
  try {
    // ─── ENCORE MEMBRES, ET PAS EN SOURDINE ───
    const { data: membres } = await supabase.from("human_conversation_membres").select("*").eq("conversation", o.conv).in("habitant", cibles);
    const ecoutent = ((membres ?? []) as Ligne[])
      .map((r) => r as unknown as LigneMembre)
      .filter((m) => actif(m) && !m.sourdine)
      .map((m) => String(m.habitant));
    if (!ecoutent.length) return rien;
    // ─── PAS DEUX FOIS, PAS TROP SOUVENT ───
    const depuis = new Date(Date.now() - 3600_000).toISOString();
    const { data: envois, error: e1 } = await supabase
      .from("human_push_envois")
      .select("habitant, sorte, cree_le")
      .eq("conversation", o.conv)
      .in("habitant", ecoutent)
      .gte("cree_le", depuis);
    if (e1) return rien;
    const maintenant = Date.now();
    const libres = ecoutent.filter((h) => {
      const siens = ((envois ?? []) as Ligne[]).filter((x) => String(x.habitant) === h);
      if (o.sorte !== "reponse" && siens.filter((x) => x.sorte !== "reponse").length >= PAR_HEURE) return false;
      const ecart = ECART[o.sorte];
      return !ecart || !siens.some((x) => x.sorte === o.sorte && maintenant - new Date(String(x.cree_le)).getTime() < ecart);
    });
    if (!libres.length) return rien;
    const { data: abos, error: e2 } = await supabase.from("human_push_abonnements").select("endpoint, habitant, abonnement").in("habitant", libres);
    if (e2 || !abos?.length) return rien;
    const charge = JSON.stringify({ title: o.n.titre, body: o.n.corps, url: o.n.url, tag: o.n.tag });
    const touches = new Set<string>();
    let envoyes = 0;
    await Promise.all(
      (abos as Ligne[]).map(async (a) => {
        try {
          await webpush.sendNotification(a.abonnement as webpush.PushSubscription, charge, {
            TTL: 3600,
            urgency: o.sorte === "reponse" ? "high" : "normal",
            timeout: 5000,
          });
          envoyes++;
          touches.add(String(a.habitant));
        } catch (e) {
          const code = (e as { statusCode?: number })?.statusCode;
          if (code === 404 || code === 410) await supabase.from("human_push_abonnements").delete().eq("endpoint", String(a.endpoint));
        }
      }),
    );
    const quand = new Date().toISOString();
    if (touches.size) await supabase.from("human_push_envois").insert([...touches].map((habitant) => ({ conversation: o.conv, habitant, sorte: o.sorte, cree_le: quand })));
    return { envoyes, personnes: touches.size };
  } catch {
    return rien;
  }
}

// ─── CE QUI SONNE, GESTE PAR GESTE ─────────────────────────────────────────

type GesteBrut = { type?: string; duel?: string; cote?: string; d?: { id?: string; a?: { nom?: string }; b?: { nom?: string } } };
type Rangee = { habitant: string | null; qui: string; geste: GesteBrut };

async function gestesDuSalon(supabase: Supabase, conv: string): Promise<Rangee[]> {
  const { data } = await supabase.from("human_conversation_gestes").select("habitant, qui, geste").eq("conversation", conv).order("id", { ascending: true }).limit(800);
  return ((data ?? []) as Ligne[]).map((r) => ({ habitant: r.habitant ? String(r.habitant) : null, qui: String(r.qui ?? ""), geste: (r.geste ?? {}) as GesteBrut }));
}

const adresseDuSalon = (ville: string, conv: string) => `/ville/${encodeURIComponent(ville)}?salon=${encodeURIComponent(`p:${conv}`)}`;
const court = (v: unknown, n = 60) => String(v ?? "").trim().slice(0, n);

/** Après un geste de membre : un duel lancé, une voix, un choix gardé. Le reste ne sonne pas. */
export async function prevenirDuGeste(
  supabase: Supabase,
  c: { id: string; ville_slug: string; base: Ligne },
  habitant: string,
  qui: string,
  geste: GesteBrut,
): Promise<void> {
  if (geste.type !== "duel" && geste.type !== "duelVote" && geste.type !== "duelFin") return;
  if (!vapid()) return;
  try {
    const url = adresseDuSalon(c.ville_slug, c.id);
    const sujet = court(c.base?.sujet) || "votre salon";
    const nom = qui || "Quelqu'un";
    if (geste.type === "duel") {
      const { data: membres } = await supabase.from("human_conversation_membres").select("habitant").eq("conversation", c.id);
      await prevenir(supabase, {
        conv: c.id,
        pour: ((membres ?? []) as Ligne[]).map((m) => String(m.habitant)),
        sauf: habitant,
        sorte: "duel",
        n: { titre: `${nom} hésite : A ou B ?`, corps: `${court(geste.d?.a?.nom)} contre ${court(geste.d?.b?.nom)} — votez dans « ${sujet} ».`, url, tag: `duel-${geste.d?.id}` },
      });
      return;
    }
    const rangees = await gestesDuSalon(supabase, c.id);
    const lance = rangees.find((r) => r.geste.type === "duel" && r.geste.d?.id === geste.duel);
    if (!lance?.habitant) return;
    const proprio = lance.habitant;
    const d = lance.geste.d ?? {};
    const nomDe = (cote?: string) => court(cote === "a" ? d.a?.nom : d.b?.nom);
    const tranche = rangees.some((r) => r.geste.type === "duelFin" && r.geste.duel === geste.duel && r.habitant === proprio);
    if (geste.type === "duelVote") {
      if (habitant === proprio || tranche) return;
      // LA DERNIÈRE VOIX DE CHACUN, comme au rejeu.
      const voix = new Map<string, string>();
      for (const r of rangees) if (r.geste.type === "duelVote" && r.geste.duel === geste.duel && r.habitant) voix.set(r.habitant, String(r.geste.cote));
      const a = [...voix.values()].filter((x) => x === "a").length;
      const b = [...voix.values()].filter((x) => x === "b").length;
      const tete = a === b ? `Égalité ${a}–${b}` : `${a > b ? "A" : "B"} mène ${Math.max(a, b)}–${Math.min(a, b)}`;
      await prevenir(supabase, {
        conv: c.id,
        pour: [proprio],
        sauf: habitant,
        sorte: "vote",
        n: { titre: `${nom} vient de voter`, corps: `${String(geste.cote).toUpperCase()} : ${nomDe(geste.cote)}. ${tete}.`, url, tag: `vote-${geste.duel}` },
      });
      return;
    }
    // duelFin — seul celui qui a lancé le duel garde ; ceux qui ont voté l'apprennent.
    if (habitant !== proprio) return;
    const votants = rangees.filter((r) => r.geste.type === "duelVote" && r.geste.duel === geste.duel && r.habitant && r.habitant !== proprio).map((r) => r.habitant as string);
    await prevenir(supabase, {
      conv: c.id,
      pour: votants,
      sauf: habitant,
      sorte: "choix",
      n: { titre: `${nom} a choisi`, corps: `${nomDe(geste.cote)} — merci pour vos votes.`, url, tag: `choix-${geste.duel}` },
    });
  } catch {
    /* Une notification qui ne part pas ne casse pas le salon. */
  }
}

/** Le commerçant a répondu : celui qui avait lancé le duel, et lui seul. */
export async function prevenirDeLaReponse(
  supabase: Supabase,
  j: { c: string; d: string; o: string; m?: string },
  n: { titre: string },
): Promise<void> {
  if (!vapid()) return;
  try {
    const { data: conv } = await supabase.from("human_conversations").select("id, ville_slug").eq("id", j.c).maybeSingle();
    if (!conv) return;
    const rangees = await gestesDuSalon(supabase, j.c);
    const lance = rangees.find((r) => r.geste.type === "duel" && r.geste.d?.id === j.d);
    if (!lance?.habitant) return;
    await prevenir(supabase, {
      conv: j.c,
      pour: [lance.habitant],
      sorte: "reponse",
      n: { titre: n.titre, corps: `${court(j.m) || "Le commerce"} · « ${court(j.o, 80)} »`, url: adresseDuSalon(String((conv as Ligne).ville_slug ?? ""), j.c), tag: `reponse-${j.d}` },
    });
  } catch {
    /* idem */
  }
}
