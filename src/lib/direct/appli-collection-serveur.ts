/**
 * 📲 CLIKME SUR SON ÉCRAN D'ACCUEIL, ET 🔔 SES NOTIFICATIONS (le lot 3, 7 novembre 2026) — le côté serveur.
 * Le côté téléphone : `appli-collection.ts` ; l'écran : `app/collection/mon-telephone.tsx`.
 *
 * 1. LE JETON D'INSTALLATION. Sur iPhone, l'appli posée sur l'écran d'accueil a ses propres cookies : rien ne garantit
 *    qu'elle reçoive ceux de Safari, et elle s'ouvrirait sur « Crée ta figurine ». Avant d'installer, la page se recharge
 *    donc sur `/collection?appli=<jeton>`, et son manifeste ouvre cette adresse-là. À la première ouverture de l'appli,
 *    le jeton pose le cookie de SA figurine. Un seul usage, valable 24 h ; rangé dans le seau (`appli/<jeton>.json`).
 *
 * 2. LES NOTIFICATIONS, à ceux qui les ont demandées, et seulement à eux : un proche lui parle, lui écrit, lui répond,
 *    l'invite devant sa télé ; le mot du matin (`rituel-serveur.ts`). Chacun les coupe dans « Moi ». Pas de table :
 *    `notif/abonnes/<habitant>.json` = { ville, abonnements } (cinq téléphones au plus). Un téléphone qui a abandonné son
 *    abonnement (404, 410) est effacé. (Du 7 au 23 novembre 2026, il y avait aussi le mème du jour vers 11 h 30 : il est
 *    parti, l'humeur du jour a pris sa place.)
 * 3. « ↩️ SAM T'A RÉPONDU ! » (7 novembre 2026) : quand on répond à un de ses mèmes (dans « Autour », ou en duo), à
 *    ceux qui ont les notifications — un second interrupteur dans « Moi », « Quand on répond à tes mèmes », allumé par
 *    défaut (anciens abonnés compris : la décision du propriétaire), que chacun coupe (`reponses: false` dans sa fiche).
 *    Jamais à soi-même, jamais pour une réponse qu'il ne pourrait pas voir ; dix par jour au plus
 *    (`notif/reponses/<habitant>/<jour>.json`).
 *
 * SANS CLÉS VAPID, RIEN NE PART ET RIEN NE CASSE. Ce sont les mêmes que pour les salons : `NEXT_PUBLIC_VAPID_PUBLIC_KEY`,
 * `VAPID_PRIVATE_KEY`, `NEXT_PUBLIC_APP_EMAIL`. L'envoi passe par `fetch` (la bibliothèque `web-push` ne fait que
 * chiffrer et signer) : c'est ce qui permet aux essais de joindre un faux service de notifications
 * (`PUSH_ESSAI_ORIGINE`, jamais posé en production).
 *
 * FICHIER SERVEUR.
 */
import { randomBytes } from "node:crypto";
import webpush from "web-push";
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Habitant } from "@/lib/direct/habitant";
import { SEAU_FIGURINES, ecrireJson, lireJson, telecharger } from "@/lib/direct/ma-figurine-serveur";
import { jourParis } from "@/lib/direct/theme-du-jour";
import { sesDixHuitAns } from "@/lib/direct/majorite-serveur";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v));

// ─── 1. 📲 le jeton d'installation ────────────────────────────────────────────────────────────────────────────────
const VALIDITE_JETON = 24 * 3600_000;
const cheminJeton = (j: string) => `appli/${j}.json`;
export const jetonValide = (j: unknown) => /^[a-z0-9]{24}$/.test(s(j));

function nouveauJeton(): string {
  const a = "abcdefghijklmnopqrstuvwxyz0123456789";
  return [...randomBytes(24)].map((o) => a[o % a.length]).join("");
}

/** Il va installer l'appli : un jeton qui fera reconnaître SA figurine à l'appli, à sa première ouverture. */
export async function jetonAppli(supabase: Supabase, habitant: Habitant): Promise<string | null> {
  const j = nouveauJeton();
  return (await ecrireJson(supabase, cheminJeton(j), { h: habitant.id, le: new Date().toISOString() })) ? j : null;
}

/** L'appli s'ouvre pour la première fois avec son jeton : le cookie de sa figurine (à poser par la route). Un seul usage. */
export async function lierAppli(supabase: Supabase, jeton: unknown): Promise<{ deviceToken?: string; error?: string }> {
  if (!jetonValide(jeton)) return { error: "Ce lien d’installation est illisible." };
  const f = await lireJson<{ h?: string; le?: string }>(supabase, cheminJeton(s(jeton)));
  if (!s(f.h)) return { error: "Ce lien d’installation a déjà servi." };
  await supabase.storage.from(SEAU_FIGURINES).remove([cheminJeton(s(jeton))]);
  if (!(Date.now() - Date.parse(s(f.le)) < VALIDITE_JETON)) return { error: "Ce lien d’installation a expiré." };
  const { data } = await supabase.from("human_habitants").select("device_token").eq("id", s(f.h)).maybeSingle();
  const d = s((data as { device_token?: unknown } | null)?.device_token);
  return d ? { deviceToken: d } : { error: "Ta figurine est introuvable." };
}

// ─── 2. 🔔 les abonnements ─────────────────────────────────────────────────────────────────────────────────────────
export type Abonnement = { endpoint: string; keys: { p256dh: string; auth: string } };
// (`reponses` : « Quand on répond à tes mèmes » — absent : allumé)
// (🔔 discussions des vidéos, lot A5 : `discussions` — les trois interrupteurs ; absent : allumé, sauf « Les discussions
// que je suis » pour les 15-17 ans, éteint d'office)
type FicheAbonne = { h: string; ville: string; abonnements: Abonnement[]; le: string; reponses?: boolean; discussions?: Partial<Record<InterrupteurDiscussion, boolean>> };
export const INTERRUPTEURS_DISCUSSION = ["repondu", "proches", "suivies"] as const;
export type InterrupteurDiscussion = (typeof INTERRUPTEURS_DISCUSSION)[number];
const DOSSIER_ABONNES = "notif/abonnes";
const cheminAbonne = (h: string) => `${DOSSIER_ABONNES}/${h}.json`;
/** Un habitant n'a pas vingt téléphones : au-delà, les plus anciens s'effacent. */
const PAR_HABITANT = 5;

/** L'adresse d'un service de notifications, et rien d'autre : en https (ou, pour les essais, le faux service). */
export function abonnementLisible(a: unknown): Abonnement | null {
  const x = (a && typeof a === "object" ? a : {}) as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  const endpoint = s(x.endpoint);
  const p256dh = s(x.keys?.p256dh);
  const auth = s(x.keys?.auth);
  const essai = s(process.env.PUSH_ESSAI_ORIGINE).replace(/\/+$/, "");
  const adresse = /^https:\/\/[^\s]{8,900}$/.test(endpoint) || (essai !== "" && endpoint.startsWith(`${essai}/`) && endpoint.length < 900);
  if (!adresse || !/^[A-Za-z0-9_-]{20,200}$/.test(p256dh) || !/^[A-Za-z0-9_-]{8,100}$/.test(auth)) return null;
  return { endpoint, keys: { p256dh, auth } };
}

const sesAbonnements = (f: Partial<FicheAbonne>): Abonnement[] =>
  (Array.isArray(f.abonnements) ? f.abonnements : []).map(abonnementLisible).filter((x): x is Abonnement => Boolean(x));

/** Il veut le mème du jour à 11 h 30, sur ce téléphone. Le premier signe part tout de suite : « C'est réglé ! ». */
export async function abonner(supabase: Supabase, habitant: Habitant, a: unknown): Promise<{ ok?: boolean; error?: string; statut?: number }> {
  const ab = abonnementLisible(a);
  if (!ab) return { error: "Ce téléphone n’a pas donné d’adresse lisible.", statut: 400 };
  if (!vapid()) return { error: "Les notifications ne sont pas encore prêtes.", statut: 503 };
  const avant = await lireJson<FicheAbonne>(supabase, cheminAbonne(habitant.id));
  const fiche: FicheAbonne = {
    h: habitant.id,
    ville: habitant.villeSlug,
    abonnements: [ab, ...sesAbonnements(avant).filter((x) => x.endpoint !== ab.endpoint)].slice(0, PAR_HABITANT),
    le: new Date().toISOString(),
    ...(avant.reponses === false ? { reponses: false } : {}),
  };
  if (!(await ecrireJson(supabase, cheminAbonne(habitant.id), fiche))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  // (la preuve, tout de suite, que ça arrive bien jusqu'à son téléphone)
  await envoyer(ab, bienvenue());
  return { ok: true };
}

/** Il coupe, sur ce téléphone (`endpoint`) ; sans adresse, partout. */
export async function couper(supabase: Supabase, habitant: Habitant, endpoint: unknown): Promise<{ ok: true }> {
  const avant = await lireJson<FicheAbonne>(supabase, cheminAbonne(habitant.id));
  const reste = s(endpoint) ? sesAbonnements(avant).filter((x) => x.endpoint !== s(endpoint)) : [];
  if (reste.length) await ecrireJson(supabase, cheminAbonne(habitant.id), { ...avant, abonnements: reste });
  else await supabase.storage.from(SEAU_FIGURINES).remove([cheminAbonne(habitant.id)]);
  return { ok: true };
}

/** Ce téléphone (`endpoint`) recevra-t-il le mème du jour ? (le serveur peut avoir effacé un abonnement abandonné) */
export async function estAbonne(supabase: Supabase, habitant: Habitant, endpoint: unknown): Promise<boolean> {
  if (!s(endpoint)) return false;
  return sesAbonnements(await lireJson<FicheAbonne>(supabase, cheminAbonne(habitant.id))).some((x) => x.endpoint === s(endpoint));
}

/** ↩️ « Quand on répond à tes mèmes » : allumé (par défaut), ou coupé. `null` : il n'a pas les notifications. */
export async function prevenuDesReponses(supabase: Supabase, habitant: Habitant): Promise<boolean | null> {
  const f = await lireJson<FicheAbonne>(supabase, cheminAbonne(habitant.id));
  return sesAbonnements(f).length ? f.reponses !== false : null;
}
export async function choisirLesReponses(supabase: Supabase, habitant: Habitant, oui: unknown): Promise<{ ok?: boolean; reponses?: boolean; error?: string; statut?: number }> {
  const f = await lireJson<FicheAbonne>(supabase, cheminAbonne(habitant.id));
  if (!sesAbonnements(f).length) return { error: "Allume d’abord les notifications.", statut: 400 };
  const reste = { ...f };
  delete reste.reponses;
  const ok = await ecrireJson(supabase, cheminAbonne(habitant.id), oui === false ? { ...reste, reponses: false } : reste);
  return ok ? { ok: true, reponses: oui !== false } : { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
}

/** (l'interrupteur, lu dans la fiche ; « suivies » éteint d'office pour les 15-17 ans) */
async function interrupteurAllume(supabase: Supabase, h: string, f: Partial<FicheAbonne>, genre: InterrupteurDiscussion): Promise<boolean> {
  const choisi = f.discussions?.[genre];
  if (typeof choisi === "boolean") return choisi;
  if (genre !== "suivies") return true;
  return (await sesDixHuitAns(supabase, h).catch(() => null)) !== false;
}
/** 🔔 (lot A5) Mes trois interrupteurs des discussions. `null` : il n'a pas les notifications. */
export async function mesInterrupteurs(supabase: Supabase, habitant: Habitant): Promise<Record<InterrupteurDiscussion, boolean> | null> {
  const f = await lireJson<FicheAbonne>(supabase, cheminAbonne(habitant.id));
  if (!sesAbonnements(f).length) return null;
  const l = await Promise.all(INTERRUPTEURS_DISCUSSION.map(async (g) => [g, await interrupteurAllume(supabase, habitant.id, f, g)] as const));
  return Object.fromEntries(l) as Record<InterrupteurDiscussion, boolean>;
}
export async function choisirInterrupteur(supabase: Supabase, habitant: Habitant, genre: unknown, oui: unknown): Promise<{ ok?: boolean; discussions?: Record<InterrupteurDiscussion, boolean>; error?: string; statut?: number }> {
  if (!(INTERRUPTEURS_DISCUSSION as readonly unknown[]).includes(genre)) return { error: "Quel interrupteur ?", statut: 400 };
  const f = await lireJson<FicheAbonne>(supabase, cheminAbonne(habitant.id));
  if (!sesAbonnements(f).length) return { error: "Allume d’abord les notifications.", statut: 400 };
  const ok = await ecrireJson(supabase, cheminAbonne(habitant.id), { ...f, discussions: { ...f.discussions, [genre as InterrupteurDiscussion]: oui !== false } });
  const discussions = ok ? await mesInterrupteurs(supabase, habitant) : null;
  return ok && discussions ? { ok: true, discussions } : { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
}

// ─── 3. 🔔 l'envoi ─────────────────────────────────────────────────────────────────────────────────────────────────
export type Notif = { titre: string; corps: string; url: string; tag: string };

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

/** L'heure et la minute, à Paris. */
export function heureParis(d = new Date()): { h: number; m: number } {
  const [h, m] = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .format(d)
    .split(":")
    .map(Number);
  return { h, m };
}

/** « C'est réglé ! » : la première notification, tout de suite, pour qu'il sache que ça marche. */
function bienvenue(): Notif {
  return {
    titre: "🔔 C’est réglé !",
    corps: "Je te préviendrai ici quand un proche te parle, te répond ou t’invite. Tu peux couper quand tu veux, dans « Moi ».",
    url: "/collection#proches",
    tag: "notif-bienvenue",
  };
}

/** Une notification, chiffrée et signée par `web-push`, envoyée par `fetch`. « mort » : le téléphone l'a abandonnée. */
async function envoyer(ab: Abonnement, n: Notif): Promise<"ok" | "mort" | "echec"> {
  if (!vapid()) return "echec";
  try {
    const d = webpush.generateRequestDetails(ab, JSON.stringify({ title: n.titre, body: n.corps, url: n.url, tag: n.tag }), {
      TTL: 6 * 3600,
      urgency: "normal",
      topic: n.tag.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32),
    });
    const entetes = Object.fromEntries(Object.entries(d.headers as Record<string, string | number>).filter(([k]) => k.toLowerCase() !== "content-length").map(([k, v]) => [k, String(v)]));
    const r = await fetch(d.endpoint, { method: "POST", headers: entetes, body: new Uint8Array(d.body as Buffer), signal: AbortSignal.timeout(10_000) });
    if (r.status === 404 || r.status === 410) return "mort";
    return r.ok ? "ok" : "echec";
  } catch {
    return "echec";
  }
}

/** ↩️ Le texte : qui, où ; le toucher l'ouvre sur la réponse. `tag` : une par mème qui répond (pas deux fois la même). */
export function notifReponse(prenom: string, r: { meme: string; ou?: string; url: string; duo?: boolean }): Notif {
  const qui = prenom.trim() || "Quelqu’un";
  return {
    titre: `↩️ ${qui} t’a répondu${r.duo ? " en duo" : ""} !`,
    corps: r.duo ? "Avec sa figurine, à côté de la tienne. Viens voir 👀" : `${r.ou ? `${r.ou} · ` : ""}avec sa figurine. Viens voir 👀`,
    url: r.url,
    tag: `reponse-${r.meme}`,
  };
}
const REPONSES_PAR_JOUR = 10;

/**
 * ↩️ PRÉVENIR L'AUTEUR D'UN MÈME QU'ON LUI A RÉPONDU — s'il a les notifications, et « Quand on répond à tes mèmes »
 * allumé ; jamais à soi-même ; dix par jour au plus. Appelé après la réponse (`after`), jamais bloquant.
 */
export async function prevenirDUneReponse(supabase: Supabase, auteur: string, deQui: string, r: { meme: string; ou?: string; url: string; duo?: boolean }): Promise<"envoye" | "rien"> {
  if (!auteur || !deQui || auteur === deQui || !vapid()) return "rien";
  const f = await lireJson<FicheAbonne>(supabase, cheminAbonne(auteur));
  const abs = sesAbonnements(f);
  if (!abs.length || f.reponses === false) return "rien";
  const compte = `notif/reponses/${auteur}/${jourParis()}.json`;
  const n = Number((await lireJson<{ n?: number }>(supabase, compte)).n) || 0;
  if (n >= REPONSES_PAR_JOUR) return "rien";
  await ecrireJson(supabase, compte, { n: n + 1 });
  const { data } = await supabase.from("clik_ma_figurine").select("prenom").eq("habitant_id", deQui).maybeSingle();
  const notif = notifReponse(s((data as { prenom?: unknown } | null)?.prenom), r);
  const issues = await Promise.all(abs.map((ab) => envoyer(ab, notif)));
  const morts = abs.filter((_, i) => issues[i] === "mort");
  if (morts.length) {
    const reste = abs.filter((_, i) => issues[i] !== "mort");
    if (reste.length) await ecrireJson(supabase, cheminAbonne(auteur), { ...f, abonnements: reste });
    else await supabase.storage.from(SEAU_FIGURINES).remove([cheminAbonne(auteur)]);
  }
  return issues.includes("ok") ? "envoye" : "rien";
}

/**
 * 🎙️ « Léa t'a parlé ! » : un proche lui a laissé un message avec sa figurine (le talkie-walkie, `talkie-serveur.ts`).
 * `facon` : « repond » — quelqu'un répond à son lien WhatsApp ; « premiere » — avec la figurine qu'il vient de faire.
 */
export function notifParole(prenom: string, url: string, cle: string, facon: "parle" | "repond" | "premiere" = "parle", panneau = ""): Notif {
  const qui = prenom.trim() || "Un proche";
  // 🪧 un panneau que sa figurine brandit (« La conversation vivante », lot R4a)
  if (panneau) return { titre: `🪧 ${qui} : « ${panneau} »`, corps: "Sa figurine te le montre. Viens voir 👀", url, tag: `parole-${cle}` };
  if (facon !== "parle") return { titre: `🎙️ ${qui} t’a répondu avec sa figurine !`, corps: facon === "premiere" ? "Sa toute première. Viens l’écouter 👂" : "Viens l’écouter 👂", url, tag: `parole-${cle}` };
  return { titre: `🎙️ ${qui} t’a parlé !`, corps: "Sa figurine a un message pour toi. Viens l’écouter 👂", url, tag: `parole-${cle}` };
}
const PAROLES_PAR_JOUR = 30;

/**
 * 🎙️ PRÉVENIR QU'UN PROCHE LUI A PARLÉ — s'il a les notifications ; jamais à soi-même ; trente par jour au plus (une
 * seule à la fois par proche : `tag`). Appelé après l'envoi, jamais bloquant.
 */
export async function prevenirDUneParole(
  supabase: Supabase,
  pour: string,
  deQui: string,
  prenom: string,
  o: { url: string; cle: string; facon?: "parle" | "repond" | "premiere"; panneau?: string; ecrit?: { titre: string; corps: string } },
): Promise<"envoye" | "rien"> {
  if (!pour || !deQui || pour === deQui || !vapid()) return "rien";
  const f = await lireJson<FicheAbonne>(supabase, cheminAbonne(pour));
  const abs = sesAbonnements(f);
  if (!abs.length) return "rien";
  const compte = `notif/paroles/${pour}/${jourParis()}.json`;
  const n = Number((await lireJson<{ n?: number }>(supabase, compte)).n) || 0;
  if (n >= PAROLES_PAR_JOUR) return "rien";
  await ecrireJson(supabase, compte, { n: n + 1 });
  // ✍️ (lot M1) un message écrit : « ✍️ Léa t'a écrit », « 🔗 Léa t'a envoyé un lien » (`notifEcrit`, `ecrit.ts`) ;
  // 📷 (lot M2) une photo : « 📷 Léa t'a envoyé une photo » (`notifPhoto`, `photo.ts`) ; 🎬 (lot M3) une vidéo :
  // « 🎬 Léa t'a envoyé une vidéo » (`notifVideo`, `video.ts`)
  // 🔔 (lot S8, « ce qui attend ») deux choses ou plus l'attendent de ce proche : la phrase qui dit tout (« 😘 Léa t'a
  // laissé un bisou, un mème, 2 messages et un vocal ») — elle remplace la précédente (le même `tag`)
  const resume = await import("./ce-qui-attend-serveur").then((m) => m.resumeQuiAttend(supabase, pour, deQui, prenom, o.ecrit?.corps)).catch(() => null);
  const notif = resume
    ? { titre: resume.titre, corps: resume.corps, url: o.url, tag: `parole-${o.cle}` }
    : o.ecrit
      ? { titre: o.ecrit.titre, corps: o.ecrit.corps, url: o.url, tag: `parole-${o.cle}` }
      : notifParole(prenom, o.url, o.cle, o.facon, o.panneau);
  const issues = await Promise.all(abs.map((ab) => envoyer(ab, notif)));
  const morts = abs.filter((_, i) => issues[i] === "mort");
  if (morts.length) {
    const reste = abs.filter((_, i) => issues[i] !== "mort");
    if (reste.length) await ecrireJson(supabase, cheminAbonne(pour), { ...f, abonnements: reste });
    else await supabase.storage.from(SEAU_FIGURINES).remove([cheminAbonne(pour)]);
  }
  return issues.includes("ok") ? "envoye" : "rien";
}

/** 🔔 LES HABITANTS ABONNÉS AUX NOTIFICATIONS (leurs identifiants) : pour l'envoi du matin (`rituel-serveur.ts`). */
export async function habitantsAbonnes(supabase: Supabase): Promise<string[]> {
  const ids: string[] = [];
  for (let debut = 0; debut < 50_000; debut += 1000) {
    const { data } = await supabase.storage.from(SEAU_FIGURINES).list(DOSSIER_ABONNES, { limit: 1000, offset: debut });
    const lot = (Array.isArray(data) ? data : []) as { name?: string }[];
    ids.push(...lot.map((x) => /^([0-9a-f-]{36})\.json$/.exec(s(x.name))?.[1] ?? "").filter(Boolean));
    if (lot.length < 1000) break;
  }
  return ids;
}

/**
 * 🔔 UNE NOTIFICATION À UN HABITANT, UNE FOIS PAR JOUR POUR CE GENRE (`notif/<genre>/<habitant>/<jour>.json`) — s'il a
 * les notifications ; ses téléphones qui ne répondent plus s'effacent.
 */
export async function prevenirUneFoisParJour(supabase: Supabase, pour: string, genre: string, notif: Notif): Promise<"envoye" | "rien"> {
  if (!pour || !/^[a-z-]+$/.test(genre) || !vapid()) return "rien";
  const f = await lireJson<FicheAbonne>(supabase, cheminAbonne(pour));
  const abs = sesAbonnements(f);
  if (!abs.length) return "rien";
  const marque = `notif/${genre}/${pour}/${jourParis()}.json`;
  if (await telecharger(supabase, marque)) return "rien";
  await ecrireJson(supabase, marque, { le: new Date().toISOString() });
  const issues = await Promise.all(abs.map((ab) => envoyer(ab, notif)));
  const morts = abs.filter((_, i) => issues[i] === "mort");
  if (morts.length) {
    const reste = abs.filter((_, i) => issues[i] !== "mort");
    if (reste.length) await ecrireJson(supabase, cheminAbonne(pour), { ...f, abonnements: reste });
    else await supabase.storage.from(SEAU_FIGURINES).remove([cheminAbonne(pour)]);
  }
  return issues.includes("ok") ? "envoye" : "rien";
}

/**
 * 🔔 UNE NOTIFICATION À UN HABITANT (Découvrir, lots D2 et D5 : une invitation devant ma télé, une demande de proche) —
 * s'il a les notifications ; l'appelant en limite le nombre. Ses téléphones qui ne répondent plus s'effacent.
 */
export async function prevenirUnHabitantAppli(supabase: Supabase, pour: string, notif: Notif, genre?: InterrupteurDiscussion): Promise<"envoye" | "rien"> {
  if (!pour || !vapid()) return "rien";
  const f = await lireJson<FicheAbonne>(supabase, cheminAbonne(pour));
  const abs = sesAbonnements(f);
  if (!abs.length) return "rien";
  // (🔔 lot A5 : « Quand on me répond », « Mes proches et mes groupes », « Les discussions que je suis »)
  if (genre && !(await interrupteurAllume(supabase, pour, f, genre))) return "rien";
  const issues = await Promise.all(abs.map((ab) => envoyer(ab, notif)));
  const morts = abs.filter((_, i) => issues[i] === "mort");
  if (morts.length) {
    const reste = abs.filter((_, i) => issues[i] !== "mort");
    if (reste.length) await ecrireJson(supabase, cheminAbonne(pour), { ...f, abonnements: reste });
    else await supabase.storage.from(SEAU_FIGURINES).remove([cheminAbonne(pour)]);
  }
  return issues.includes("ok") ? "envoye" : "rien";
}

/** 🔔 Pour la page admin des mèmes : combien d'abonnés aux notifications, et si les clés sont là. */
export type EtatNotifications = { cles: boolean; abonnes: number };
export async function etatNotifications(supabase: Supabase): Promise<EtatNotifications> {
  let abonnes = 0;
  for (let debut = 0; debut < 50_000; debut += 1000) {
    const { data } = await supabase.storage.from(SEAU_FIGURINES).list(DOSSIER_ABONNES, { limit: 1000, offset: debut });
    const lot = (Array.isArray(data) ? data : []) as { name?: string }[];
    abonnes += lot.filter((x) => /^[0-9a-f-]{36}\.json$/.test(s(x.name))).length;
    if (lot.length < 1000) break;
  }
  return { cles: vapid(), abonnes };
}
