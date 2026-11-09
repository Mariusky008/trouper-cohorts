// Ce que partagent les essais navigateur de l'échange (`scripts/navigateur/echanges-*.mjs`) :
// l'adresse de l'app, celle du faux Supabase, le dossier des captures, et le navigateur.
//
// Ils tournent contre `scripts/faux-supabase.mjs`, jamais la vraie base, et contre une app lancée
// avec ECHANGES_SEUIL_VILLE=3. Chacun veut un faux Supabase neuf (il sème ses commerçants).
// Sur le poste, Playwright n'est pas forcément dans node_modules : PLAYWRIGHT_MODULE dit où le
// prendre, PW_CHROMIUM quel Chromium lancer. Sur GitHub : `.github/workflows/clikme-verifications.yml`.
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const BASE = process.env.ESSAI_BASE ?? "http://localhost:3821";
export const F = process.env.ESSAI_SUPABASE ?? "http://127.0.0.1:54321/rest/v1";
export const D = process.env.ESSAI_CAPTURES ?? path.join(os.tmpdir(), "clikme-captures");
fs.mkdirSync(D, { recursive: true });

const pw = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");
const { chromium } = pw.default ?? pw;
/** `options` : ce qu'un essai ajoute au lancement (`args`, un faux micro…). */
/**
 * PABLITO DIT BIENVENUE, À LA TOUTE PREMIÈRE ARRIVÉE (`app/collection/tuto.tsx`, 9 novembre 2026 : les pages n'ouvrent
 * plus de fenêtre d'elles-mêmes) : on attend que la page sache s'il le faut, et on « passe » avant de toucher la page.
 * Rend `true` s'il y en avait une. (`ici` : l'onglet, du temps où chaque page avait sa fenêtre — il ne sert plus.)
 */
// eslint-disable-next-line no-unused-vars
export async function fermerPablito(p, ici = "") {
  try {
    await p.locator("main.mc[data-charge]").waitFor({ state: "attached", timeout: 8000 });
  } catch {
    return false;
  }
  const passer = p.locator(".tu .tu-passer").first();
  if (!(await passer.count())) return false;
  await passer.click();
  await p.locator(".tu").first().waitFor({ state: "detached", timeout: 5000 }).catch(() => null);
  return true;
}
/**
 * 🪟 LES FENÊTRES DE CLIKME (`app/collection/fenetre.tsx`, à la place de `window.confirm` depuis le 8 novembre 2026) :
 * attend la prochaine, lit ce qu'elle dit, et répond (`oui` : le bouton du geste ; sinon « Annuler »). Rend son texte.
 */
export async function repondreFenetre(p, oui = true) {
  const f = p.locator(".fen[role=alertdialog]").last();
  await f.waitFor({ state: "visible", timeout: 15000 });
  const dit = (await f.innerText()).replace(/\s+/g, " ").trim();
  // (CETTE fenêtre-là, pas « la dernière » : la question suivante peut s'ouvrir aussitôt, et l'essai l'aurait prise pour
  // celle-ci, qui ne disparaît jamais — 9 novembre 2026)
  const celleCi = await f.elementHandle();
  await f.locator(oui ? ".fen-oui" : ".fen-non").click();
  await p.waitForFunction((el) => !el.isConnected, celleCi, { timeout: 5000 });
  return dit;
}
export const lancer = (options = {}) => chromium.launch({ ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}), ...options });

/**
 * 🔔 UN FAUX TÉLÉPHONE ABONNÉ AUX NOTIFICATIONS, au faux service du faux Supabase (`PUSH_ESSAI_ORIGINE`) : sa clé, son
 * secret, son adresse ; `recus(t)` : ce qu'il a reçu, déchiffré comme le ferait le téléphone (RFC 8291, `aes128gcm`).
 */
export function telephone(nom) {
  const ecdh = crypto.createECDH("prime256v1");
  ecdh.generateKeys();
  const auth = crypto.randomBytes(16);
  const endpoint = `${F.replace("/rest/v1", "")}/push/${nom}-${crypto.randomBytes(4).toString("hex")}`;
  return { ecdh, auth, endpoint, abonnement: { endpoint, expirationTime: null, keys: { p256dh: ecdh.getPublicKey().toString("base64url"), auth: auth.toString("base64url") } } };
}
function dechiffrer(t, b64) {
  const buf = Buffer.from(b64, "base64");
  const sel = buf.subarray(0, 16);
  const sa = buf.subarray(21, 21 + buf[20]);
  const chiffre = buf.subarray(21 + buf[20]);
  const h = (k, d) => crypto.createHmac("sha256", k).update(d).digest();
  const ikm = h(h(t.auth, t.ecdh.computeSecret(sa)), Buffer.concat([Buffer.from("WebPush: info\0"), t.ecdh.getPublicKey(), sa, Buffer.from([1])]));
  const prk = h(sel, ikm);
  const cle = h(prk, Buffer.concat([Buffer.from("Content-Encoding: aes128gcm\0"), Buffer.from([1])])).subarray(0, 16);
  const nonce = h(prk, Buffer.concat([Buffer.from("Content-Encoding: nonce\0"), Buffer.from([1])])).subarray(0, 12);
  const d = crypto.createDecipheriv("aes-128-gcm", cle, nonce);
  d.setAuthTag(chiffre.subarray(chiffre.length - 16));
  const clair = Buffer.concat([d.update(chiffre.subarray(0, chiffre.length - 16)), d.final()]);
  let fin = clair.length - 1;
  while (fin >= 0 && clair[fin] === 0) fin--;
  return JSON.parse(clair.subarray(0, fin).toString("utf8"));
}
export const recus = async (t) => ((await (await fetch(`${F.replace("/rest/v1", "")}/__push`)).json()) ?? []).filter((x) => x.adresse === new URL(t.endpoint).pathname && !x.mort).map((x) => dechiffrer(t, x.corps));
