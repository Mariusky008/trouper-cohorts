// 💬 LA DISCUSSION D'UNE VIDÉO, À L'ÉCRAN (`app/collection/discussion-video.tsx`, `/univers/discussion` ;
// `docs/univers/discussions-video.md`, le lot A1) — sur un iPhone, contre le faux Supabase et le faux YouTube.
//
// Léa a vu une vidéo ; Sam (son proche) y a écrit à 0:08 ; Inès (une inconnue) a laissé un mot à la fin. Léa ouvre la
// discussion : la vidéo en haut, « ▶ Revoir la vidéo » ; 👯 Mes proches · 1 (ouvert d'office) : « Sam · à 0:08 », ses
// mots ; 🌍 Tous · 1 : le mot d'Inès, « ▶ 🎙️ 3 s ». Une vidéo qu'elle n'a jamais croisée : « Cette discussion n'est
// plus là ». (Lot A2) Elle écrit sous la vidéo : « 🌍 Lu par tous ceux qui la regardent », l'accord la première fois,
// « Publier » ; elle répond au mot d'Inès (« ↩ Inès ») ; un lien ne part pas ; elle efface son mot. Rien ne déborde,
// jamais le mot « exemple », aucune erreur.
import crypto from "node:crypto";
import { BASE, D, F, lancer } from "./commun.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const json = (chemin, x) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(x) });
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

// (les pages « Univers » s'ouvrent encore à l'administrateur : sa session, fausse)
const ADMIN = "00000000-0000-4000-8000-0000000ad001";
await semer("admins", [{ user_id: ADMIN }]);
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const session = { access_token: "faux-admin", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "faux", user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@clikme.invalid", app_metadata: {}, user_metadata: {} } };

const qui = (n, prenom) => ({ id: `5d1e5d1e-0000-4000-8000-0000000d15${String(n).padStart(2, "0")}`, jeton: `jeton-discussion-nav-000${n}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const INES = qui(3, "Inès");
const GENS = [LEA, SAM, INES];
const maintenant = new Date().toISOString();
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
for (const x of GENS) {
  await json(`profils/${cleProfil(x.id)}.json`, { h: x.id });
  await json(`${x.id}/majeur.json`, { age: 34, adulte: true, le: maintenant });
  await json(`${x.id}/passions.json`, { passions: ["foot"], poids: {}, le: maintenant });
}
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
const nuit = await (await fetch(`${BASE}/api/cron/decouvrir-selection`)).json();
ok(nuit.faites?.length > 0, "la nuit est passée");
const appel = async (x, chemin, corps) => {
  const r = await fetch(`${BASE}${chemin}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${x.jeton}` }, body: JSON.stringify(corps) } : { headers: { cookie: `clikme_habitant=${x.jeton}` } });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};
const V = (await appel(LEA, "/api/direct/tele-du-jour")).tele?.videos?.[0]?.id;
ok(Boolean(V), `la première vidéo de Léa (${V})`);
ok((await appel(LEA, "/api/direct/tele-du-jour", { action: "vue", id: V, fin: true, secondes: 30 })).statut === 200, "Léa l'a vue");
ok((await appel(SAM, "/api/direct/tele-du-jour", { action: "vue", id: V, fin: true, secondes: 30 })).statut === 200, "Sam aussi");
ok((await appel(SAM, "/api/direct/tele-du-jour", { action: "ecrire", id: V, t: 8, texte: "Il va tirer de là ?!" })).statut === 200, "… il y a écrit à 0:08");
const VOIX = Buffer.concat([Buffer.from("1a45dfa39f4286810142f7810142f2810442f381084282847765626d", "hex"), crypto.randomBytes(4000)]);
ok((await appel(INES, "/api/direct/mots-video", { action: "publier", id: V, son: `data:audio/webm;base64,${VOIX.toString("base64")}`, duree: 3, accord: true })).statut === 200, "Inès a laissé un mot à la fin");

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer();
const erreurs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
await ctx.addCookies([{ name: "clikme_habitant", value: LEA.jeton, url: BASE }, { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE }]);
await ctx.route(/^https:\/\/i\.ytimg\.com\//, (r) => r.fulfill({ status: 200, contentType: "image/png", body: PNG }));
const p = await ctx.newPage();
p.on("pageerror", (e) => erreurs.push(String(e)));
p.on("console", (m) => m.type() === "error" && !/Failed to load resource/i.test(m.text()) && erreurs.push(m.text()));
const attendre = async (f, ms = 15000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f().catch(() => false)) return true;
    await p.waitForTimeout(120);
  }
  return false;
};
const texte = async (loc) => (await loc.innerText().catch(() => "")).replace(/\s+/g, " ").trim();

// ═══ LÉA OUVRE LA DISCUSSION ═══
await p.goto(`${BASE}/univers/discussion?video=${V}`, { waitUntil: "domcontentloaded" });
ok(await attendre(async () => (await p.locator(`[data-discussion="${V}"]`).count()) === 1), "la discussion s'ouvre");
const revoir = p.locator("[data-revoir-discussion]");
ok((await texte(revoir)) === "▶ Revoir la vidéo" && (await revoir.getAttribute("href")) === `/univers/salons?chez=moi&video=${V}`, "« ▶ Revoir la vidéo » la rouvre dans son salon");
const proches = p.locator('[data-cercle="proches"]');
ok((await texte(proches)) === "👯 Mes proches · 1" && (await proches.getAttribute("aria-selected")) === "true", `« ${await texte(proches)} », ouvert d'office`);
const ligne = p.locator('[data-fil="proches"] [data-ligne="8"]');
ok(await attendre(async () => (await ligne.count()) === 1), "la ligne de Sam");
ok(/Sam · à 0:08/.test(await texte(ligne)) && /Il va tirer de là \?!/.test(await texte(ligne)), `« ${await texte(ligne)} »`);
await p.screenshot({ path: `${D}/discussion-video-1.png` });

// ═══ 🌍 TOUS ═══
const tousB = p.locator('[data-cercle="tous"]');
ok((await texte(tousB)) === "🌍 Tous · 1", `« ${await texte(tousB)} »`);
await tousB.click();
ok(await attendre(async () => (await p.locator('[data-fil="tous"] [data-mot]').count()) === 1), "🌍 : le mot d'Inès");
const mot = p.locator('[data-fil="tous"] [data-mot]');
ok(/Inès/.test(await texte(mot)) && /▶ 🎙️ 3 s/.test(await texte(mot)), `« ${await texte(mot)} »`);
await p.screenshot({ path: `${D}/discussion-video-2.png` });

// ═══ (A2) ✍️ ÉCRIRE SOUS LA VIDÉO ═══
const form = p.locator("[data-ecrire]");
ok(/🌍 Lu par tous ceux qui la regardent/.test(await texte(form)), "« 🌍 Lu par tous ceux qui la regardent »");
await form.locator("input").fill("Son meilleur album reste le premier.");
await form.locator('button[type="submit"]').click();
ok(await attendre(async () => (await p.locator("[data-accord]").count()) === 1), "la première fois : l'accord");
ok(/Tous ceux qui regardent cette vidéo verront ta figurine et ce mot/.test(await texte(p.locator("[data-accord]"))), `« ${await texte(p.locator("[data-accord]"))} »`);
await p.locator("[data-accord-publier]").click();
ok(await attendre(async () => (await p.locator('[data-fil="tous"] [data-ecrit]').count()) === 1), "« Publier » : son mot est sous la vidéo");
ok(/Toi/.test(await texte(p.locator('[data-fil="tous"] [data-ecrit]'))) && /Son meilleur album/.test(await texte(p.locator('[data-fil="tous"] [data-ecrit]'))), "… « Toi », ses mots");
ok(/Ton mot est sous la vidéo/.test(await texte(p.locator("[data-note]"))), "« ✓ Ton mot est sous la vidéo. »");
// (🔔 lot A3 : la première fois, « Te prévenir quand quelqu'un écrit ici ? »)
ok(await attendre(async () => (await p.locator("[data-proposer-suivre]").count()) === 1), "« 🔔 Te prévenir quand quelqu’un écrit ici ? »");
ok((await p.locator("[data-suivi]").getAttribute("data-suivi")) === "discret" && /🤫 Sans bruit/.test(await texte(p.locator("[data-suivi]"))), "… en attendant : « 🤫 Sans bruit »");
await p.locator("[data-proposer-oui]").click();
ok(await attendre(async () => (await p.locator("[data-suivi]").getAttribute("data-suivi")) === "prevenir"), "« Oui » : « 🔔 Me prévenir »");
await p.locator("[data-suivi]").click();
ok(await attendre(async () => (await p.locator("[data-feuille-suivi] [data-niveau]").count()) === 3), "⋯ : les trois niveaux");
await p.screenshot({ path: `${D}/discussion-video-suivi.png` });
await p.locator('[data-feuille-suivi] [data-niveau="non"]').click();
ok(await attendre(async () => (await p.locator("[data-suivi]").getAttribute("data-suivi")) === "non"), "« 🔕 Ne plus suivre » : retenu");
await p.screenshot({ path: `${D}/discussion-video-3.png` });
// (répondre au mot dit d'Inès)
await p.waitForTimeout(3200);
await p.locator('[data-fil="tous"] [data-mot] [data-repondre]').click();
ok(/Répondre à Inès/.test(await texte(p.locator("[data-reponse-a]"))), "« ↩ Répondre à Inès »");
await form.locator("input").fill("Ta voix est trop drôle");
await form.locator('button[type="submit"]').click();
ok(await attendre(async () => (await p.locator('[data-fil="tous"] [data-ecrit]').count()) === 2), "sa réponse arrive, sans redemander l'accord");
const lignes = (await p.locator('[data-fil="tous"] > ul > li').allInnerTexts()).map((x) => x.replace(/\s+/g, " "));
ok(lignes.length === 3 && /Inès/.test(lignes[0]) && /↩ Inès/.test(lignes[1]) && /Son meilleur album/.test(lignes[2]), `le fil : le mot d'Inès, sa réponse juste après, puis son premier mot (${lignes.join(" | ")})`);
// (un lien ne part pas)
await p.waitForTimeout(3200);
await form.locator("input").fill("allez voir www.monsite.fr");
await form.locator('button[type="submit"]').click();
ok(await attendre(async () => /un lien ne part pas ici/.test(await texte(p.locator("[data-note]")))), `un lien : « ${await texte(p.locator("[data-note]"))} »`);
// (effacer)
const mien = p.locator('[data-fil="tous"] [data-ecrit]').filter({ hasText: "Son meilleur album" });
await mien.locator("[data-effacer]").click();
ok(await attendre(async () => (await p.locator('[data-fil="tous"] [data-ecrit]').count()) === 1), "« Effacer » : son mot est parti");

// ═══ (A3) « NOUVEAU » DEPUIS LA DERNIÈRE FOIS ═══
ok((await appel(SAM, "/api/direct/discussion-video", { action: "publier", id: V, texte: "Quel but !", accord: true })).statut === 200, "pendant ce temps, Sam écrit sous la vidéo");
await p.reload({ waitUntil: "domcontentloaded" });
await p.locator('[data-cercle="tous"]').click();
const neuf = p.locator('[data-fil="tous"] [data-neuf]');
ok(await attendre(async () => (await neuf.count()) === 1), "à son retour, le mot de Sam est « Nouveau »");
ok(/Quel but/.test(await texte(neuf)), `« ${await texte(neuf)} »`);

// ═══ RIEN NE DÉBORDE, JAMAIS « EXEMPLE » ═══
ok((await p.evaluate(() => document.documentElement.scrollWidth)) <= 390, "rien ne déborde");
ok(!/exemple/i.test(await p.locator("body").innerText()), "jamais le mot « exemple »");

// ═══ UNE VIDÉO JAMAIS CROISÉE ═══
await p.goto(`${BASE}/univers/discussion?video=AAAAAAAAAAA`, { waitUntil: "domcontentloaded" });
ok(await attendre(async () => /Cette discussion n’est plus là/.test(await texte(p.locator("[data-discussion-erreur]")))), "une vidéo jamais croisée : « Cette discussion n’est plus là »");

ok(erreurs.length === 0, `aucune erreur${erreurs.length ? ` : ${erreurs.join(" | ")}` : ""}`);
await b.close();
console.log(echecs ? `\n${echecs} échec(s).` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
