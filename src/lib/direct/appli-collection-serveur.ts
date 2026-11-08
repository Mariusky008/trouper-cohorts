/**
 * 📲 CLIKME SUR SON ÉCRAN D'ACCUEIL, ET 🔔 LE MÈME DU JOUR À 11 H 30 (le lot 3, 7 novembre 2026) — le côté serveur.
 * Le côté téléphone : `appli-collection.ts` ; l'écran : `app/collection/mon-telephone.tsx`.
 *
 * 1. LE JETON D'INSTALLATION. Sur iPhone, l'appli posée sur l'écran d'accueil a ses propres cookies : rien ne garantit
 *    qu'elle reçoive ceux de Safari, et elle s'ouvrirait sur « Crée ta figurine ». Avant d'installer, la page se recharge
 *    donc sur `/collection?appli=<jeton>`, et son manifeste ouvre cette adresse-là. À la première ouverture de l'appli,
 *    le jeton pose le cookie de SA figurine. Un seul usage, valable 24 h ; rangé dans le seau (`appli/<jeton>.json`).
 *
 * 2. LA NOTIFICATION DU MÈME DU JOUR, chaque jour vers 11 h 30 (heure de Paris), à ceux qui l'ont demandée, et seulement
 *    à eux. On ne l'envoie pas à celui qui a déjà répondu. Le thème est en titre, c'est lui qui donne envie, et on n'ajoute
 *    le chiffre de sa ville que s'il est vrai (au moins `SEUIL_REPONSES`). Chacun la coupe dans « Moi ». Pas de table :
 *    `notif/abonnes/<habitant>.json` = { ville, abonnements } (cinq téléphones au plus) ; `notif/envois/<jour>.json` :
 *    la journée est faite, on ne recommence pas. Un téléphone qui a abandonné son abonnement (404, 410) est effacé.
 *
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
import { SEAU_FIGURINES, ecrireJson, idsDuJour, lireJson, telecharger } from "@/lib/direct/ma-figurine-serveur";
import { SEUIL_REPONSES, jourParis, nomVille, themeDuJour } from "@/lib/direct/theme-du-jour";

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
type FicheAbonne = { h: string; ville: string; abonnements: Abonnement[]; le: string; reponses?: boolean };
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

// ─── 3. 🔥 l'envoi de 11 h 30 ──────────────────────────────────────────────────────────────────────────────────────
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

/** Le texte du jour : le thème en titre, et le chiffre de sa ville seulement s'il est vrai. */
export function notifDuJour(jour: string, ville: string, n: number): Notif {
  const t = themeDuJour(jour);
  const chiffre = n >= SEUIL_REPONSES && ville ? ` · déjà ${n} réponses à ${nomVille(ville)}` : "";
  return { titre: `${t.emoji} ${t.titre}`, corps: `Le mème du jour : réponds avec ta figurine 🎭${chiffre}`, url: "/collection#jour", tag: "meme-du-jour" };
}

function bienvenue(): Notif {
  const { h, m } = heureParis();
  const quand = h < 11 || (h === 11 && m < 30) ? "aujourd’hui" : "demain";
  return {
    titre: "🔔 C’est réglé !",
    corps: `Le mème du jour arrivera ici ${quand} vers 11 h 30. Tu peux couper quand tu veux, dans « Moi ».`,
    url: "/collection#jour",
    tag: "meme-du-jour-bienvenue",
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

/** 🎙️ « Léa t'a parlé ! » : un proche lui a laissé un message avec sa figurine (le talkie-walkie, `talkie-serveur.ts`). */
export function notifParole(prenom: string, url: string, cle: string): Notif {
  const qui = prenom.trim() || "Un proche";
  return { titre: `🎙️ ${qui} t’a parlé !`, corps: "Sa figurine a un message pour toi. Viens l’écouter 👂", url, tag: `parole-${cle}` };
}
const PAROLES_PAR_JOUR = 30;

/**
 * 🎙️ PRÉVENIR QU'UN PROCHE LUI A PARLÉ — s'il a les notifications ; jamais à soi-même ; trente par jour au plus (une
 * seule à la fois par proche : `tag`). Appelé après l'envoi, jamais bloquant.
 */
export async function prevenirDUneParole(supabase: Supabase, pour: string, deQui: string, prenom: string, o: { url: string; cle: string }): Promise<"envoye" | "rien"> {
  if (!pour || !deQui || pour === deQui || !vapid()) return "rien";
  const f = await lireJson<FicheAbonne>(supabase, cheminAbonne(pour));
  const abs = sesAbonnements(f);
  if (!abs.length) return "rien";
  const compte = `notif/paroles/${pour}/${jourParis()}.json`;
  const n = Number((await lireJson<{ n?: number }>(supabase, compte)).n) || 0;
  if (n >= PAROLES_PAR_JOUR) return "rien";
  await ecrireJson(supabase, compte, { n: n + 1 });
  const notif = notifParole(prenom, o.url, o.cle);
  const issues = await Promise.all(abs.map((ab) => envoyer(ab, notif)));
  const morts = abs.filter((_, i) => issues[i] === "mort");
  if (morts.length) {
    const reste = abs.filter((_, i) => issues[i] !== "mort");
    if (reste.length) await ecrireJson(supabase, cheminAbonne(pour), { ...f, abonnements: reste });
    else await supabase.storage.from(SEAU_FIGURINES).remove([cheminAbonne(pour)]);
  }
  return issues.includes("ok") ? "envoye" : "rien";
}

export type BilanDuJour = { jour: string; personnes: number; envoyes: number; morts: number; dejaRepondu: number; deja?: boolean; sansCles?: boolean };

/**
 * 🔥 LE MÈME DU JOUR, À CEUX QUI L'ONT DEMANDÉ. Une fois par jour (`notif/envois/<jour>.json`) ; `force` (les essais)
 * passe outre. Par paquets de vingt : une fonction a une minute, pas plus.
 */
export async function envoyerLeMemeDuJour(supabase: Supabase, o: { force?: boolean } = {}): Promise<BilanDuJour> {
  const jour = jourParis();
  const bilan: BilanDuJour = { jour, personnes: 0, envoyes: 0, morts: 0, dejaRepondu: 0 };
  if (!vapid()) return { ...bilan, sansCles: true };
  const marque = `notif/envois/${jour}.json`;
  if (!o.force) {
    if (await telecharger(supabase, marque)) return { ...bilan, deja: true };
    await ecrireJson(supabase, marque, { debut: new Date().toISOString() });
  }
  const noms: string[] = [];
  for (let debut = 0; debut < 50_000; debut += 1000) {
    const { data } = await supabase.storage.from(SEAU_FIGURINES).list(DOSSIER_ABONNES, { limit: 1000, offset: debut });
    const lot = (Array.isArray(data) ? data : []) as { name?: string }[];
    noms.push(...lot.map((x) => s(x.name)).filter((n) => /^[0-9a-f-]{36}\.json$/.test(n)));
    if (lot.length < 1000) break;
  }
  // (combien de réponses dans chaque ville : une seule fois par ville)
  const parVille = new Map<string, Promise<number>>();
  const reponses = (ville: string) => {
    if (!ville) return Promise.resolve(0);
    if (!parVille.has(ville)) parVille.set(ville, idsDuJour(supabase, ville, jour).then((x) => x.length));
    return parVille.get(ville) as Promise<number>;
  };
  for (let k = 0; k < noms.length; k += 20) {
    await Promise.all(
      noms.slice(k, k + 20).map(async (nom) => {
        const f = await lireJson<FicheAbonne>(supabase, `${DOSSIER_ABONNES}/${nom}`);
        const abs = sesAbonnements(f);
        if (!s(f.h) || !abs.length) return;
        bilan.personnes++;
        // (il a déjà répondu aujourd'hui : rien à lui rappeler)
        if (await telecharger(supabase, `${s(f.h)}/du-jour/${jour}.json`)) return void bilan.dejaRepondu++;
        const n = notifDuJour(jour, s(f.ville), await reponses(s(f.ville)));
        const issues = await Promise.all(abs.map((ab) => envoyer(ab, n)));
        bilan.envoyes += issues.filter((x) => x === "ok").length;
        const morts = abs.filter((_, i) => issues[i] === "mort");
        if (!morts.length) return;
        bilan.morts += morts.length;
        const reste = abs.filter((_, i) => issues[i] !== "mort");
        if (reste.length) await ecrireJson(supabase, `${DOSSIER_ABONNES}/${nom}`, { ...f, abonnements: reste });
        else await supabase.storage.from(SEAU_FIGURINES).remove([`${DOSSIER_ABONNES}/${nom}`]);
      }),
    );
  }
  if (!o.force) await ecrireJson(supabase, marque, { fin: new Date().toISOString(), ...bilan });
  return bilan;
}

/** 🔔 Pour la page admin des mèmes : combien d'abonnés, le dernier envoi, et si les clés sont là. */
export type EtatNotifications = { cles: boolean; abonnes: number; dernier: (BilanDuJour & { fin?: string }) | null };
export async function etatNotifications(supabase: Supabase): Promise<EtatNotifications> {
  let abonnes = 0;
  for (let debut = 0; debut < 50_000; debut += 1000) {
    const { data } = await supabase.storage.from(SEAU_FIGURINES).list(DOSSIER_ABONNES, { limit: 1000, offset: debut });
    const lot = (Array.isArray(data) ? data : []) as { name?: string }[];
    abonnes += lot.filter((x) => /^[0-9a-f-]{36}\.json$/.test(s(x.name))).length;
    if (lot.length < 1000) break;
  }
  const { data } = await supabase.storage.from(SEAU_FIGURINES).list("notif/envois", { limit: 100, sortBy: { column: "name", order: "desc" } });
  const nom = ((Array.isArray(data) ? data : []) as { name?: string }[]).map((x) => s(x.name)).filter((n) => /^\d{4}-\d{2}-\d{2}\.json$/.test(n)).sort().pop();
  const dernier = nom ? await lireJson<BilanDuJour & { fin?: string }>(supabase, `notif/envois/${nom}`) : null;
  return { cles: vapid(), abonnes, dernier: dernier && dernier.jour ? (dernier as BilanDuJour & { fin?: string }) : null };
}
