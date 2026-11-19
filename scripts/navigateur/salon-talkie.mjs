// 🎙️ LE SALON DU DUO : LE TALKIE-WALKIE (`docs/univers/salon-du-duo.md`, section 4.6 ; le lot S4) — l'adresse d'essai
// `/univers/salon?avec=<clé>`, sur un iPhone, un faux micro (Chromium), contre le faux Supabase et sa fausse
// transcription (jamais la vraie base).
//
// Léa (l'administrateur, sur ce téléphone) est dans son salon avec Sam (« Là, maintenant »). À droite de la saisie, 🎙️ ;
// il devient ➤ dès qu'on écrit. Un toucher trop court : « Garde le micro appuyé… ». Gardé appuyé : la barre (● rouge,
// 0:02, la forme de la voix, « ‹ glisse pour effacer »), le talkie de sa figurine à sa bouche (vert), celui de Sam à son
// oreille (orange) ; chez Sam, le pouls dit « parle ». Relâché : la bulle du vocal (▶, la forme, 0:02), puis ce qu'elle
// a dit, écrit dessous (la fausse transcription). Glissé à gauche : « 🗑️ Vocal effacé ». Sam parle (le pouls) : son
// talkie à sa bouche, celui de Léa à l'oreille ; son vocal arrive et joue tout de suite (« en direct ») — il est noté
// écouté. Sam parti : le vocal de Léa se pose sur la table (le talkie couché qui clignote) ; Sam l'écoute : il s'en va,
// « 📻 Sam a écouté ton vocal ». Sam en laisse un pendant son absence : à l'arrivée, son talkie attend sur la table ; un
// toucher, sa figurine le dit. 💬 : ▶ ferme la feuille et le joue dans la scène. ＋ « 🎙️ Un vocal » : l'astuce. Ni
// débordement, ni erreur, ni le mot « exemple ».
import sharp from "sharp";
import crypto from "node:crypto";
import { BASE, D, F, lancer } from "./commun.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const ADMIN = "00000000-0000-4000-8000-0000000ad001";
await semer("admins", [{ user_id: ADMIN }]);
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const session = {
  access_token: "faux-admin",
  token_type: "bearer",
  expires_in: 86400,
  expires_at: Math.floor(Date.now() / 1000) + 86400,
  refresh_token: "faux",
  user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} },
};
const qui = (n, prenom) => ({ id: `7a1c7a1c-0000-4000-8000-0000000fd0${String(n).padStart(2, "0")}`, jeton: `jeton-salon-talkie-nav-0${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
for (const x of [LEA, SAM]) x.cle = cleProfil(x.id);
const PAIRE = [LEA.id, SAM.id].sort().join("_");
const maintenant = new Date().toISOString();
await semer("human_habitants", [LEA, SAM].map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
for (const x of [LEA, SAM]) {
  await deposer(`${x.id}/neutre-essai.png`, PNG, "image/png");
  await json(`profils/${x.cle}.json`, { h: x.id });
}
await semer(
  "clik_ma_figurine",
  [LEA, SAM].map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, neutre: `${x.id}/neutre-essai.png`, parle: `${x.id}/neutre-essai.png`, prete_le: maintenant })),
);
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
await json(`fils/${PAIRE}/piece.json`, { piece: "salon", le: maintenant });
// (le salon : une pièce en hauteur, ses places et sa table basse relevées)
const piece = (fond) =>
  sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536"><rect width="1024" height="1000" fill="${fond}"/><rect y="1000" width="1024" height="536" fill="#8a6a4a"/><rect x="160" y="1050" width="704" height="300" rx="60" fill="#3c6e8a"/><rect x="620" y="200" width="300" height="260" fill="#bfe3ff"/><ellipse cx="512" cy="1180" rx="170" ry="60" fill="#6b4226"/></svg>`))
    .png()
    .toBuffer();
for (const [n, f] of [["decor.png", "#5b4a6e"], ["lumiere-matin.png", "#9a8ab0"], ["lumiere-nuit.png", "#1d1830"]]) await deposer(`pieces-duo/salon/${n}`, await piece(f), "image/png");
await json("pieces-duo/salon/releve.json", { le: maintenant, emplacements: { cadres: [], places: [{ x: 0.3, y: 0.72, hauteur: 0.3 }, { x: 0.7, y: 0.72, hauteur: 0.3 }], table: [0.33, 0.74, 0.34, 0.09], etagere: [0.6, 0.13, 0.3, 0.16] } });
const assise = (couleur) =>
  sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200"><ellipse cx="400" cy="330" rx="200" ry="190" fill="${couleur}"/><rect x="355" y="500" width="90" height="70" fill="${couleur}"/><rect x="160" y="550" width="480" height="560" rx="50" fill="#5a3a2a"/></svg>`))
    .png()
    .toBuffer();
const poster = (q, corps) => fetch(`${BASE}/api/direct/${corps.action === "calques" ? "salon" : "proches"}`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${q.jeton}` }, body: JSON.stringify(corps) });
for (const x of [LEA, SAM]) {
  await deposer(`${x.id}/perso/v1/assise.png`, await assise(x === LEA ? "#e0a070" : "#7090e0"), "image/png");
  const fiche = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${x.id}/perso/v1/assise.png` } }, historique: [{ version: 1, le: maintenant, raison: "« C’est moi ! »", style: "collection-1" }] };
  await json(`${x.id}/perso/v1/fiche.json`, fiche);
  await json(`${x.id}/perso/fiche.json`, fiche);
  ok((await poster(x, { action: "calques" })).status === 200, `les calques de ${x.prenom}, faits`);
}

/** Un vrai petit son (WAV, une note qui monte et descend), comme un vocal : `sec` secondes. */
function wav(sec) {
  const taux = 8000;
  const n = Math.round(sec * taux);
  const b = Buffer.alloc(44 + n * 2);
  b.write("RIFF", 0);
  b.writeUInt32LE(36 + n * 2, 4);
  b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(taux, 24);
  b.writeUInt32LE(taux * 2, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36);
  b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.sin((i / taux) * 2 * Math.PI * (330 + 60 * Math.sin(i / 900))) * 9000 * Math.abs(Math.sin(i / 1400))), 44 + i * 2);
  return `data:audio/wav;base64,${b.toString("base64")}`;
}
const NIVEAUX = (sec) => Array.from({ length: Math.round((sec * 1000) / 60) }, (_, i) => Math.round(Math.abs(Math.sin(i / 3)) * 15).toString(16)).join("");
const filDe = async (q, cle) => (await (await fetch(`${BASE}/api/direct/proches?fil=${cle}`, { headers: { cookie: `clikme_habitant=${q.jeton}` } })).json())?.fil?.messages ?? [];
const poulsDe = async (q, cle) => (await fetch(`${BASE}/api/direct/proches?pouls=${cle}`, { headers: { cookie: `clikme_habitant=${q.jeton}` } })).json();

await poster(SAM, { action: "la" });
await poster(SAM, { action: "ecrire", cle: LEA.cle, texte: "Coucou !" });

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--autoplay-policy=no-user-gesture-required"] });
const erreurs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true, permissions: ["microphone"] });
await ctx.addCookies([
  { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE },
  { name: "clikme_habitant", value: LEA.jeton, url: BASE },
]);
const p = await ctx.newPage();
p.on("pageerror", (e) => erreurs.push(String(e)));
p.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && erreurs.push(m.text()));
const attendre = async (f, ms = 8000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f().catch(() => false)) return true;
    await p.waitForTimeout(100);
  }
  return false;
};
const texte = async (sel) => (await p.locator(sel).first().innerText({ timeout: 3000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const toast = () => texte(".sd-toast.vu");
const micro = async () => {
  const r = await p.locator(".sd-micro").boundingBox();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
};
const ouvrir = async () => {
  await p.goto(`${BASE}/univers/salon?avec=${SAM.cle}`, { waitUntil: "domcontentloaded" });
  // (en développement, le bouton de Next se pose sur la saisie : on le cache ; il n'existe pas en production)
  await p.addStyleTag({ content: "nextjs-portal{display:none!important}" });
};

await ouvrir();
ok(await attendre(async () => (await texte(".sd-bulle.autre:not([data-ia])")) === "Coucou !", 15000), "le salon est ouvert (la bulle de Sam)");
await p.locator(".sd-scene").dispatchEvent("pointerdown");

// ═══ 🎙️ LE MICRO, À DROITE DE LA SAISIE ; ➤ DÈS QU'ON ÉCRIT ═══
ok((await p.locator(".sd-micro[data-micro]").count()) === 1 && (await p.locator('.sd-envoyer[type="submit"]').count()) === 0, "🎙️ à droite de la saisie (pas de ➤ tant qu'on n'écrit rien)");
await p.locator(".sd-saisie input").fill("un mot");
ok((await p.locator('.sd-envoyer[type="submit"]').count()) === 1 && (await p.locator(".sd-micro").count()) === 0, "on écrit : 🎙️ devient ➤");
await p.locator(".sd-saisie input").fill("");
ok(await attendre(async () => (await p.locator(".sd-micro").count()) === 1, 2000), "la saisie vidée : 🎙️ revient");

// ═══ UN TOUCHER TROP COURT : L'ASTUCE ═══
let m = await micro();
await p.mouse.move(m.x, m.y);
await p.mouse.down();
await p.waitForTimeout(150);
await p.mouse.up();
ok(await attendre(async () => (await toast()).startsWith("📻 Garde le micro appuyé et parle, comme un talkie-walkie."), 3000), `un toucher trop court : « ${await toast()} »`);
ok(await attendre(async () => (await p.locator(".sd-micro.rappel").count()) === 1, 2000), "… et le micro bat (« garde-le appuyé »)");
let filSam = await filDe(SAM, LEA.cle);
ok(!filSam.some((x) => !x.genre && x.son), "rien n'est parti");

// ═══ GARDÉ APPUYÉ : LE VOCAL, EN DIRECT CHEZ SAM ═══
m = await micro();
await p.mouse.move(m.x, m.y);
await p.mouse.down();
ok(await attendre(async () => (await p.locator(".sd-enreg[data-enreg]").count()) === 1, 1500), "appuyé : la barre d'enregistrement");
ok(await attendre(async () => (await p.locator('.sc-talkie[data-talkie="moi"].emet').count()) === 1, 1500), "le talkie de Léa à sa bouche, lumière verte");
ok(await attendre(async () => (await p.locator('.sc-talkie[data-talkie="autre"].ecoute').count()) === 1, 1500), "Sam est là : son talkie à l'oreille, lumière orange");
ok((await texte(".sd-enreg .sd-glisse")) === "‹ glisse pour effacer", `« ${await texte(".sd-enreg .sd-glisse")} »`);
ok(await attendre(async () => (await poulsDe(SAM, LEA.cle)).parle === true, 6000), "chez Sam, le pouls dit « Léa parle dans son talkie »");
ok(await attendre(async () => (await texte(".sd-enreg b")) === "0:02", 6000), `le temps : ${await texte(".sd-enreg b")}`);
const talkieDansLaTete = await p.evaluate(() => Boolean(document.querySelector('.sc-tete[data-tete="moi"] > .sc-talkie')));
ok(talkieDansLaTete, "le talkie suit la tête (posé dans son calque)");
await p.screenshot({ path: `${D}/salon-talkie-1-parle.png` });
await p.waitForTimeout(500);
await p.mouse.up();
ok(await attendre(async () => (await p.locator(".sd-bulle.moi.vocal .sd-vocal").count()) === 1, 2000), "relâché : la bulle du vocal, tout de suite");
const bulle = await p.evaluate(() => {
  const b = document.querySelector(".sd-bulle.moi.vocal");
  return { barres: b?.querySelectorAll(".sd-vague i").length ?? 0, duree: b?.querySelector("small")?.textContent ?? "", lire: b?.querySelector(".sd-lire")?.textContent ?? "" };
});
ok(bulle.barres === 24 && /^0:0[2-3]$/.test(bulle.duree) && bulle.lire === "▶", `▶, la forme de sa voix (${bulle.barres} barres), ${bulle.duree}`);
ok(await attendre(async () => (await p.locator(".sd-enreg").count()) === 0 && (await p.locator('.sc-talkie[data-talkie="moi"]').count()) === 0, 2000), "la barre s'en va, Léa range son talkie");
ok(await attendre(async () => (await p.locator(".sc-talkie-table").count()) === 0, 1500), "Sam l'a entendu en direct : rien n'attend sur la table");
filSam = await filDe(SAM, LEA.cle);
let vocal = filSam.find((x) => !x.genre && x.son && !x.moi);
ok(Boolean(vocal) && vocal.duree >= 2 && vocal.duree <= 4 && /^[0-9a-f]{30,}$/.test(vocal.niveaux ?? ""), `chez Sam : le vocal, sa durée (${vocal?.duree} s), ses niveaux (${vocal?.niveaux?.length} mesures)`);
// (le téléphone de Sam l'a joué en direct : il le note écouté — sinon, quinze secondes plus tard, il irait sur la table)
ok((await (await poster(SAM, { action: "ecoute", cle: LEA.cle, id: vocal?.id })).json()).ok === true, "chez Sam, joué en direct : noté écouté");
ok(await attendre(async () => (await poulsDe(SAM, LEA.cle)).parle !== true, 4000), "chez Sam, le pouls ne dit plus « parle »");
ok(await attendre(async () => /ce soir/.test(await texte(".sd-bulle.moi.vocal q")), 20000), `ce qu'elle a dit, écrit sous la bulle : « ${await texte(".sd-bulle.moi.vocal q")} »`);
filSam = await filDe(SAM, LEA.cle);
vocal = filSam.find((x) => x.id === vocal?.id);
ok(/ce soir/.test((vocal?.repliques ?? []).map((r) => r.texte).join(" ")), "… et chez Sam aussi");
await p.screenshot({ path: `${D}/salon-talkie-2-bulle.png` });

// ═══ GLISSER À GAUCHE : EFFACÉ ═══
const avant = (await filDe(SAM, LEA.cle)).length;
m = await micro();
await p.mouse.move(m.x, m.y);
await p.mouse.down();
await attendre(async () => (await p.locator(".sd-enreg").count()) === 1, 1500);
await p.waitForTimeout(900);
for (let i = 1; i <= 6; i++) await p.mouse.move(m.x - i * 25, m.y);
ok(await attendre(async () => (await toast()) === "🗑️ Vocal effacé", 3000), `glissé à gauche : « ${await toast()} »`);
await p.mouse.up();
ok(await attendre(async () => (await p.locator(".sd-enreg").count()) === 0, 1500), "la barre s'en va");
await p.waitForTimeout(800);
ok((await filDe(SAM, LEA.cle)).length === avant, "rien n'est parti");

// ═══ SAM PARLE EN DIRECT, PUIS SON VOCAL JOUE TOUT DE SUITE ═══
await poster(SAM, { action: "prepare", cle: LEA.cle, oui: true, facon: "parle" });
ok(await attendre(async () => (await p.locator('.sc-talkie[data-talkie="autre"].emet').count()) === 1, 6000), "Sam parle : son talkie à sa bouche, lumière verte");
ok((await p.locator('.sc-talkie[data-talkie="moi"].ecoute').count()) === 1, "… celui de Léa à son oreille, lumière orange");
ok((await toast()) === "📻 Sam te parle…", `« ${await toast()} »`);
await p.screenshot({ path: `${D}/salon-talkie-3-sam-parle.png` });
const rep = await poster(SAM, { action: "vocal", cle: LEA.cle, son: wav(2.2), duree: 2.2, niveaux: NIVEAUX(2.2) });
const vocalSam = (await rep.json()).message;
ok(rep.status === 200 && Boolean(vocalSam?.id), "Sam envoie son vocal (la route)");
await poster(SAM, { action: "prepare", cle: LEA.cle, oui: false });
ok(await attendre(async () => (await p.locator(`.sd-bulle.autre.vocal [data-vague="${vocalSam.id}"]`).count()) === 1, 8000), "son vocal arrive : sa bulle (▶, la forme de sa voix)");
ok(await attendre(async () => (await p.locator(".sd-bulle.autre.vocal .sd-lire").innerText()) === "❚❚", 4000), "… et joue tout de suite (« en direct »)");
ok(await attendre(async () => (await p.locator(`.sd-bulle.autre.vocal [data-vague="${vocalSam.id}"] i.lu`).count()) > 0, 4000), "les barres se colorent au fil de la lecture");
ok((await p.locator('.sc-talkie[data-talkie="autre"].emet').count()) === 1, "la figurine de Sam le dit, son talkie à la bouche");
await p.screenshot({ path: `${D}/salon-talkie-4-direct.png` });
ok(await attendre(async () => (await filDe(SAM, LEA.cle)).find((x) => x.id === vocalSam.id)?.ecoute === true, 8000), "chez Sam : écouté");
ok(await attendre(async () => (await p.locator(".sd-bulle.autre.vocal .sd-lire").innerText()) === "▶", 6000), "fini : ▶ revient");

// ═══ SAM PARTI : LE VOCAL DE LÉA L'ATTEND SUR LA TABLE ═══
await json(`${SAM.id}/la.json`, { le: Date.now() - 600_000 });
ok(await attendre(async () => (await p.locator('[data-presence="absent"]').count()) === 1, 15000), "Sam n'est plus là");
m = await micro();
await p.mouse.move(m.x, m.y);
await p.mouse.down();
await attendre(async () => (await p.locator(".sd-enreg").count()) === 1, 1500);
ok((await p.locator('.sc-talkie[data-talkie="autre"]').count()) === 0, "Sam n'est pas là : pas de talkie à son oreille");
await attendre(async () => (await texte(".sd-enreg b")) === "0:01", 6000);
await p.waitForTimeout(400);
await p.mouse.up();
ok(await attendre(async () => (await p.locator('.sc-talkie-table[data-talkie-table="moi"]').count()) === 1, 4000), "relâché : son talkie se pose sur la table, et clignote");
const surTable = await p.evaluate(() => {
  const t = document.querySelector('.sc-talkie-table[data-talkie-table="moi"]')?.getBoundingClientRect();
  const s = document.querySelector(".sd-scene")?.getBoundingClientRect();
  return t && s ? t.left >= s.left && t.right <= s.right && t.top >= s.top && t.bottom <= s.bottom : false;
});
ok(surTable, "… dans la scène");
await p.screenshot({ path: `${D}/salon-talkie-5-table.png` });
ok(await attendre(async () => !(await p.locator('.sc-talkie-table[data-talkie-table="moi"]').getAttribute("data-vocal"))?.startsWith("envoi-"), 6000), "… avec le vrai vocal, une fois parti");
await p.locator('.sc-talkie-table[data-talkie-table="moi"]').click();
ok(await attendre(async () => (await toast()) === "📻 Ton vocal attend Sam sur la table", 2000), `un toucher : « ${await toast()} »`);
const idMien = await p.locator('.sc-talkie-table[data-talkie-table="moi"]').getAttribute("data-vocal");
ok((await (await poster(SAM, { action: "ecoute", cle: LEA.cle, id: idMien })).json()).ok === true, "Sam l'écoute (la route)");
ok(await attendre(async () => (await p.locator('.sc-talkie-table[data-talkie-table="moi"]').count()) === 0, 15000), "chez Léa, le talkie quitte la table");
ok(await attendre(async () => (await toast()) === "📻 Sam a écouté ton vocal", 3000), `« ${await toast()} »`);
ok((await (await poster(SAM, { action: "ecoute", cle: LEA.cle, id: "pas-un-vocal" })).json()).error !== undefined, "écouter un vocal qui n'existe pas : refusé");
ok((await (await poster(LEA, { action: "ecoute", cle: SAM.cle, id: idMien })).json()).error !== undefined, "écouter son propre vocal : refusé");

// ═══ À L'ARRIVÉE : SON VOCAL ATTEND SUR LA TABLE ═══
const rep2 = await poster(SAM, { action: "vocal", cle: LEA.cle, son: wav(1.6), duree: 1.6, niveaux: NIVEAUX(1.6) });
const laisse = (await rep2.json()).message;
ok(rep2.status === 200 && Boolean(laisse?.id), "Sam laisse un vocal pendant que Léa n'est pas là");
await ouvrir();
ok(await attendre(async () => (await p.locator(`.sc-talkie-table[data-talkie-table="autre"][data-vocal="${laisse.id}"]`).count()) === 1, 15000), "à l'arrivée : son talkie attend sur la table");
ok(await attendre(async () => (await toast()) === "📻 Sam t’a laissé un vocal : touche le talkie sur la table", 4000), `« ${await toast()} »`);
ok((await p.locator(".sd-bulle.autre.vocal").count()) === 1, "sa bulle : le vocal (▶)");
await p.screenshot({ path: `${D}/salon-talkie-6-arrivee.png` });
await p.locator('.sc-talkie-table[data-talkie-table="autre"]').click();
ok(await attendre(async () => (await p.locator('.sc-talkie[data-talkie="autre"].emet').count()) === 1, 3000), "un toucher : sa figurine reprend son talkie et le dit");
ok(await attendre(async () => (await p.locator(".sc-talkie-table").count()) === 0, 3000), "le talkie a quitté la table");
ok(await attendre(async () => (await filDe(SAM, LEA.cle)).find((x) => x.id === laisse.id)?.ecoute === true, 8000), "chez Sam : écouté");
await attendre(async () => (await p.locator('.sc-talkie[data-talkie="autre"]').count()) === 0, 6000);

// ═══ 💬 : LES VOCAUX S'Y ÉCOUTENT (DANS LA SCÈNE) ═══
await p.locator(".sd-fil").click();
ok(await attendre(async () => (await p.locator(".sd-feuille.vu .sd-msg .sd-vocal").count()) >= 3, 4000), `dans 💬 : les vocaux (${await p.locator(".sd-feuille.vu .sd-msg .sd-vocal").count()})`);
ok((await p.locator(`.sd-feuille.vu .sd-msg [data-vague="${vocalSam.id}"] i`).count()) === 24, "… avec la forme de leur voix");
await p.locator(`.sd-feuille.vu .sd-msg [data-vocal="${vocalSam.id}"] .sd-lire`).click();
ok(await attendre(async () => (await p.locator(".sd-feuille.vu").count()) === 0, 2000), "▶ : la feuille se ferme");
ok(await attendre(async () => (await p.locator('.sc-talkie[data-talkie="autre"].emet').count()) === 1, 3000), "… et sa figurine le dit dans la scène");
await attendre(async () => (await p.locator('.sc-talkie[data-talkie="autre"]').count()) === 0, 6000);

// ═══ ＋ « 🎙️ UN VOCAL » ═══
await p.locator(".sd-joindre").click();
await attendre(() => p.evaluate(() => { const f = document.querySelector('.sd-envoi[data-envoi="choix"]'); return Boolean(f) && f.getAnimations().every((a) => a.playState === "finished"); }), 6000);
await p.locator('.sd-joint[data-joint="vocal"]').click();
ok(await attendre(async () => (await p.locator(".sd-envoi").count()) === 0, 3000), "＋ « 🎙️ Un vocal » : la feuille se ferme");
ok(await attendre(async () => (await toast()).startsWith("📻 Garde le micro appuyé") && (await p.locator(".sd-micro.rappel").count()) === 1, 3000), "… l'astuce, et le micro bat");

// ═══ LA PAGE ═══
const page = await p.evaluate(() => ({ deborde: document.documentElement.scrollWidth > window.innerWidth + 1, mot: /exemple/i.test(document.body.innerText) }));
ok(!page.deborde, "aucun débordement");
ok(!page.mot, "jamais le mot « exemple »");
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` : ${erreurs.slice(0, 3).join(" | ")}` : ""}`);

await b.close();
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
