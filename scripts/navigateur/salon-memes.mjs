// 🎭 LE SALON DU DUO : LES MÈMES (`docs/univers/salon-du-duo.md`, section 4.7 ; le lot S5) — l'adresse d'essai
// `/univers/salon?avec=<clé>`, sur un iPhone, contre le faux Supabase (jamais la vraie base).
//
// Léa (l'administrateur, sur ce téléphone) est dans son salon avec Sam. Un troisième onglet, 🎭 Mèmes : « ✨ Du jour »,
// « ✍️ Le mien », puis les mèmes prêts. Un toucher sur « Fou rire » : le projecteur s'allume tout de suite, « Action ! »,
// le texte arrive mot à mot dans une bulle de BD au-dessus de sa figurine, puis tout s'éteint ; il en reste une carte
// dans sa bulle (😂 « … », « ▶ Revoir ») ; chez Sam, par la route, le mème (sa tête, sa danse). « ▶ Revoir » le rejoue.
// « ✍️ Le mien » : la feuille « Ton mème » (des idées, ce qu'elle dit, 120 signes, sa tête, « 🎶 Elle danse »,
// « 🎬 Action ! », grisé tant que c'est vide). Sam joue un mème : sa figurine le joue chez Léa, sa carte a 😂 ❤️ 🔥 (🔥
// part). Sam en laisse un pendant l'absence de Léa : rejoué à l'arrivée. 💬 : « ▶ Revoir ». ＋ « 🎭 Un mème » : la feuille.
// 🎙️ « MA VOIX » (un faux micro) : la feuille, le micro qui bat ; gardé appuyé, la barre ; relâché, « 🎙️ Ta voix · 0:02 »,
// « 🎬 Action ! » s'allume sans texte ; sa figurine le dit avec ma voix (🎙️ et la forme de la voix dans la bulle de BD,
// qui se colore) ; la carte, puis ce que j'ai dit, écrit tout seul ; chez Sam, sa voix ; « ▶ Revoir », avec ses mots ;
// Sam en joue un avec sa voix et un texte : sa figurine le dit chez Léa.
// Ni débordement, ni erreur, ni le mot « exemple ».
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
const qui = (n, prenom) => ({ id: `6e6e6e6e-0000-4000-8000-0000000fe0${String(n).padStart(2, "0")}`, jeton: `jeton-salon-memes-nav-0${String(n).padStart(2, "0")}`, prenom });
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

const filDe = async (q, cle) => (await (await fetch(`${BASE}/api/direct/proches?fil=${cle}`, { headers: { cookie: `clikme_habitant=${q.jeton}` } })).json())?.fil?.messages ?? [];

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
const ouvrir = async () => {
  await p.goto(`${BASE}/univers/salon?avec=${SAM.cle}`, { waitUntil: "domcontentloaded" });
  // (en développement, le bouton de Next se pose sur la saisie : on le cache ; il n'existe pas en production)
  await p.addStyleTag({ content: "nextjs-portal{display:none!important}" });
};

const bd = async (qui) => (await texte(`.sc-bd[data-meme="${qui}"]`)).replace(/ /g, " ").replace("🎙️", "").trim();
const eteint = () => attendre(async () => (await p.locator(".sc-projecteur, .sc-bd").count()) === 0, 9000);
/** Un vrai petit son (WAV) de `sec` secondes. */
function wav(sec) {
  const taux = 8000;
  const n = Math.round(sec * taux);
  const o = Buffer.alloc(44 + n * 2);
  o.write("RIFF", 0);
  o.writeUInt32LE(36 + n * 2, 4);
  o.write("WAVEfmt ", 8);
  o.writeUInt32LE(16, 16);
  o.writeUInt16LE(1, 20);
  o.writeUInt16LE(1, 22);
  o.writeUInt32LE(taux, 24);
  o.writeUInt32LE(taux * 2, 28);
  o.writeUInt16LE(2, 32);
  o.writeUInt16LE(16, 34);
  o.write("data", 36);
  o.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) o.writeInt16LE(Math.round(Math.sin((i / taux) * 2 * Math.PI * 330) * 8000), 44 + i * 2);
  return `data:audio/wav;base64,${o.toString("base64")}`;
}
const NIVEAUX = (sec) => Array.from({ length: Math.round((sec * 1000) / 60) }, (_, i) => Math.round(Math.abs(Math.sin(i / 3)) * 15).toString(16)).join("");

await ouvrir();
ok(await attendre(async () => (await texte(".sd-bulle.autre:not([data-ia])")) === "Coucou !", 15000), "le salon est ouvert (la bulle de Sam)");
await p.locator(".sd-scene").dispatchEvent("pointerdown");

// ═══ L'ONGLET 🎭 MÈMES ═══
const onglets = await p.locator(".sd-onglet").evaluateAll((l) => l.map((x) => x.textContent.replace(/▾/g, "").trim()));
ok(onglets.join(" | ") === "💌 Petites attentions | 🛋️ Ensemble | 🎭 Mèmes", `trois onglets (${onglets.join(" | ")})`);
await p.locator('.sd-onglet[data-onglet="memes"]').click();
ok(await attendre(async () => (await p.locator('.sd-gestes[data-gestes="memes"]').count()) === 1, 2000), "🎭 Mèmes : la barre des mèmes");
const puces = await p.locator('.sd-gestes[data-gestes="memes"] .sd-geste').evaluateAll((l) => l.map((x) => [...x.querySelectorAll("span")].map((y) => y.textContent.trim()).join(" ")));
ok(puces[0] === "✨ Du jour" && puces[1] === "✍️ Le mien" && puces[2] === "🎙️ Ma voix" && puces.includes("😂 Fou rire") && puces.includes("😍 Je t’aime"), `« Du jour », « Le mien », « Ma voix », puis les mèmes prêts (${puces.slice(0, 5).join(" | ")}…)`);
await p.screenshot({ path: `${D}/salon-memes-1-onglet.png` });

// ═══ UN TOUCHER : IL EST JOUÉ ═══
const FOU_RIRE = "Non mais attends… j’en peux plus. Arrête, j’ai mal aux joues.";
const t0 = Date.now();
await p.locator('[data-meme-pret="fou-rire"]').click();
ok(await attendre(async () => (await p.locator('.sc-projecteur.vu[data-projecteur="moi"]').count()) === 1, 1500), `le projecteur s'allume sur sa figurine (${Date.now() - t0} ms)`);
ok(await attendre(async () => (await p.locator('.sc-bd[data-meme="moi"]').count()) === 1, 2500), "« Action ! », puis la bulle de BD au-dessus d'elle");
await p.waitForTimeout(600);
await p.screenshot({ path: `${D}/salon-memes-2-joue.png` });
const premiers = await p.locator('.sc-bd[data-meme="moi"] span').count();
ok(premiers >= 1 && premiers < FOU_RIRE.split(" ").length, `les mots arrivent un à un (${premiers} déjà)`);
ok(await attendre(async () => (await bd("moi")) === FOU_RIRE, 6000), "… jusqu'au dernier");
ok(await eteint(), "« Coupez ! » : tout s'éteint");
ok(await attendre(async () => (await texte(".sd-bulle.moi.meme .sd-meme-texte")) === `😂 « ${FOU_RIRE} »`, 3000), `sa bulle : « ${await texte(".sd-bulle.moi.meme .sd-meme-texte")} »`);
ok((await p.locator(".sd-bulle.moi.meme [data-revoir]").count()) === 1 && (await p.locator(".sd-bulle.moi.meme [data-reaction-meme]").count()) === 0, "« ▶ Revoir » (pas de réaction sur le sien)");
let chezSam = await filDe(SAM, LEA.cle);
const m1 = chezSam.find((m) => m.genre === "meme" && m.texte === FOU_RIRE);
ok(m1?.meme?.tete === "rire" && m1.meme.pret === "fou-rire" && !m1.moi, "chez Sam : le mème, sa tête, d'où il vient");
await p.locator(".sd-bulle.moi.meme [data-revoir]").click();
ok(await attendre(async () => (await p.locator('.sc-bd[data-meme="moi"]').count()) === 1, 2500), "« ▶ Revoir » : elle le rejoue");
await eteint();

// ═══ ✍️ « TON MÈME » ═══
await p.locator("[data-meme-mien]").click();
ok(await attendre(async () => (await p.locator("[data-feuille-meme]").count()) === 1, 3000), "« ✍️ Le mien » : la feuille « Ton mème »");
await attendre(() => p.evaluate(() => { const f = document.querySelector("[data-feuille-meme]"); return Boolean(f) && f.getAnimations().every((a) => a.playState === "finished"); }), 4000);
ok(await p.locator("[data-feuille-meme] [data-action]").isDisabled(), "vide : « 🎬 Action ! » est grisé");
ok((await p.locator("[data-feuille-meme] [data-tete-meme]").count()) === 7, "sept têtes");
await p.locator('[data-feuille-meme] [data-idee="je-t-aime"]').click();
ok((await p.locator("[data-feuille-meme] textarea").inputValue()).startsWith("Je t’aime.") && (await p.locator('[data-tete-meme="amour"]').getAttribute("aria-checked")) === "true", "une idée : son texte, sa tête");
const MIEN = "Ce soir c’est crêpes, et je ne partage pas la dernière.";
await p.locator("[data-feuille-meme] textarea").fill(MIEN);
await p.locator('[data-tete-meme="grimace"]').click();
await p.locator("[data-feuille-meme] [data-danse]").check();
ok((await texte("[data-feuille-meme] .sd-meme-compte")) === `${[...MIEN].length} / 120`, `le compte des signes (${await texte("[data-feuille-meme] .sd-meme-compte")})`);
await p.screenshot({ path: `${D}/salon-memes-3-le-mien.png` });
await p.locator("[data-feuille-meme] [data-action]").click();
ok(await attendre(async () => (await p.locator("[data-feuille-meme]").count()) === 0, 2000), "« 🎬 Action ! » : la feuille se ferme");
ok(await attendre(async () => (await bd("moi")) === MIEN, 7000), "sa figurine le joue");
ok(await attendre(async () => (await texte(".sd-bulle.moi.meme .sd-meme-texte")) === `😜 « ${MIEN} »`, 9000), "sa bulle : 😜 et ce qu'elle dit");
chezSam = await filDe(SAM, LEA.cle);
const m2 = chezSam.find((m) => m.genre === "meme" && m.texte === MIEN);
ok(m2?.meme?.tete === "grimace" && m2.meme.danse === true && !m2.meme.pret, "chez Sam : sa tête, sa danse");
await eteint();

// ═══ 🎙️ MA VOIX ═══
await p.locator("[data-meme-voix]").click();
ok(await attendre(async () => (await p.locator("[data-feuille-meme]").count()) === 1, 3000), "« 🎙️ Ma voix » : la feuille « Ton mème »");
ok((await p.locator("[data-feuille-meme] .sd-micro.rappel").count()) === 1, "… le micro bat (« garde-le appuyé »)");
await attendre(() => p.evaluate(() => { const f = document.querySelector("[data-feuille-meme]"); return Boolean(f) && f.getAnimations().every((a) => a.playState === "finished"); }), 4000);
await p.locator("[data-feuille-meme] .sd-micro").scrollIntoViewIfNeeded();
const rm = await p.locator("[data-feuille-meme] .sd-micro").boundingBox();
await p.mouse.move(rm.x + rm.width / 2, rm.y + rm.height / 2);
await p.mouse.down();
ok(await attendre(async () => (await p.locator("[data-feuille-meme] [data-enreg]").count()) === 1, 2000), "gardé appuyé : la barre ● rouge");
await p.waitForTimeout(2300);
await p.mouse.up();
ok(await attendre(async () => /Ta voix · 0:0[23]/.test(await texte("[data-feuille-meme] [data-ta-voix]")), 3000), `relâché : « ${await texte("[data-feuille-meme] [data-ta-voix] b")} »`);
ok(!(await p.locator("[data-feuille-meme] [data-action]").isDisabled()) && (await p.locator("[data-feuille-meme] .sd-meme-facultatif").count()) === 1, "sans texte, « 🎬 Action ! » s'allume (le texte est facultatif)");
await p.locator('[data-tete-meme="amour"]').click();
await p.screenshot({ path: `${D}/salon-memes-5-ma-voix.png` });
await p.locator("[data-feuille-meme] [data-action]").click();
ok(await attendre(async () => (await p.locator("[data-feuille-meme]").count()) === 0, 2000), "« 🎬 Action ! » : la feuille se ferme");
ok(await attendre(async () => (await p.locator('.sc-bd[data-meme="moi"][data-voix="1"]').count()) === 1, 3000), "sa figurine le dit avec ma voix : 🎙️ dans la bulle de BD");
ok((await p.locator('.sc-bd[data-meme="moi"] .sc-bd-voix i').count()) === 16, "sans texte : la forme de ma voix");
ok(await attendre(async () => (await p.locator('.sc-bd[data-meme="moi"] .sc-bd-voix i.lu').count()) >= 4, 4000), "… qui se colore pendant qu'elle parle");
await p.screenshot({ path: `${D}/salon-memes-6-voix-jouee.png` });
await eteint();
ok(await attendre(async () => (await p.locator(".sd-bulle.moi.meme [data-meme-voix]").count()) === 1, 3000), `sa carte : « ${await texte(".sd-bulle.moi.meme .sd-meme-texte")} »`);
ok(await attendre(async () => /ce soir/.test(await texte(".sd-bulle.moi.meme .sd-meme-texte")), 20000), `ce que j'ai dit s'écrit tout seul : « ${await texte(".sd-bulle.moi.meme .sd-meme-texte")} »`);
chezSam = await filDe(SAM, LEA.cle);
const mv = chezSam.find((m) => m.genre === "meme" && m.meme?.voix);
ok(Boolean(mv?.son) && mv.meme.tete === "amour" && mv.duree >= 1.5 && Boolean(mv.niveaux), `chez Sam : sa voix (${mv?.duree} s), sa tête, ses niveaux`);
await p.locator(".sd-bulle.moi.meme [data-revoir]").click();
ok(await attendre(async () => (await p.locator('.sc-bd[data-meme="moi"][data-voix="1"] span:not(.sc-bd-micro)').count()) >= 2, 4000), "« ▶ Revoir » : elle le redit, avec ses mots cette fois");
await eteint();
const VOIX_SAM = "Je t’entends d’ici !";
ok((await poster(SAM, { action: "meme-salon", cle: LEA.cle, texte: VOIX_SAM, tete: "joie", son: wav(1.6), duree: 1.6, niveaux: NIVEAUX(1.6) })).status === 200, "Sam en joue un avec sa voix (la route)");
ok(await attendre(async () => (await p.locator('.sc-bd[data-meme="autre"][data-voix="1"]').count()) === 1, 15000), "sa figurine le dit chez Léa, avec sa voix");
ok(await attendre(async () => (await bd("autre")) === VOIX_SAM, 6000), `… et ses mots (« ${await bd("autre")} »)`);
await eteint();

// ═══ SAM JOUE UN MÈME : SA FIGURINE LE JOUE CHEZ LÉA ═══
const SIEN = "Bravo ! Quelle classe. Je vais le raconter à tout le monde.";
const rep = await poster(SAM, { action: "meme-salon", cle: LEA.cle, texte: SIEN, tete: "euphorie", pret: "bravo" });
const memeSam = (await rep.json()).message;
ok(rep.status === 200 && Boolean(memeSam?.id), "Sam joue un mème (la route)");
ok(await attendre(async () => (await p.locator('.sc-bd[data-meme="autre"]').count()) === 1, 15000), "sa figurine le joue chez Léa (le pouls)");
await p.waitForTimeout(1500);
await p.screenshot({ path: `${D}/salon-memes-4-sam.png` });
ok(await attendre(async () => (await texte(".sd-bulle.autre.meme .sd-meme-texte")) === `🤩 « ${SIEN} »`, 9000), "sa bulle : 🤩 et ce qu'il dit");
const reacs = await p.locator(".sd-bulle.autre.meme [data-reaction-meme]").evaluateAll((l) => l.map((x) => x.textContent));
ok(reacs.join(" ") === "😂 ❤️ 🔥", `sur sa carte : ${reacs.join(" ")}`);
await eteint();
await p.locator('.sd-bulle.autre.meme [data-reaction-meme="feu"]').click();
let feu = false;
for (let k = 0; k < 30 && !feu; k++) {
  const v = await (await fetch(`${BASE}/api/direct/proches?vivant=${LEA.cle}`, { headers: { cookie: `clikme_habitant=${SAM.jeton}` } })).json();
  feu = (v?.vivant?.gestes ?? []).some((g) => g.type === "reaction" && g.cle === "feu" && g.message === memeSam?.id && !g.moi);
  if (!feu) await p.waitForTimeout(200);
}
ok(feu, "🔥 : la réaction part, chez Sam");

// ═══ À L'ARRIVÉE : SON MÈME EST REJOUÉ ═══
const LAISSE = "Tu me manques. Voilà, c’est dit. On se voit quand ?";
ok((await poster(SAM, { action: "meme-salon", cle: LEA.cle, texte: LAISSE, tete: "tristesse" })).status === 200, "Sam en laisse un pendant que Léa n'est pas là");
await ouvrir();
ok(await attendre(async () => (await bd("autre")) === LAISSE, 20000), "à l'arrivée : sa figurine le rejoue");
ok((await p.locator(".sd-scene[data-meme-joue]").count()) === 1, "… pendant ce temps, les bulles laissent la place à sa bulle de BD");
await eteint();
ok(await attendre(async () => (await texte(".sd-bulle.autre.meme .sd-meme-texte")) === `😢 « ${LAISSE} »`, 4000), "… puis sa bulle : 😢 et ce qu'il dit");

// ═══ 💬 : « ▶ REVOIR » ═══
await p.locator(".sd-fil").click();
ok(await attendre(async () => (await p.locator(".sd-feuille.vu .sd-msg .sd-meme").count()) >= 3, 4000), `dans 💬 : les mèmes (${await p.locator(".sd-feuille.vu .sd-msg .sd-meme").count()})`);
await p.locator(`.sd-feuille.vu .sd-msg [data-revoir="${memeSam.id}"]`).click();
ok(await attendre(async () => (await p.locator(".sd-feuille.vu").count()) === 0, 2000), "« ▶ Revoir » : la feuille se ferme");
ok(await attendre(async () => (await bd("autre")).length > 0, 3000), "… et sa figurine le rejoue");
await eteint();

// ═══ ＋ « 🎭 UN MÈME » ═══
await p.locator(".sd-joindre").click();
await attendre(() => p.evaluate(() => { const f = document.querySelector('.sd-envoi[data-envoi="choix"]'); return Boolean(f) && f.getAnimations().every((a) => a.playState === "finished"); }), 6000);
await p.locator('.sd-joint[data-joint="meme"]').click();
ok(await attendre(async () => (await p.locator("[data-feuille-meme]").count()) === 1 && (await p.locator(".sd-envoi").count()) === 0, 3000), "＋ « 🎭 Un mème » : la feuille « Ton mème »");

// ═══ LA PAGE ═══
const page = await p.evaluate(() => ({ deborde: document.documentElement.scrollWidth > window.innerWidth + 1, mot: /exemple/i.test(document.body.innerText) }));
ok(!page.deborde, "aucun débordement");
ok(!page.mot, "jamais le mot « exemple »");
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` : ${erreurs.slice(0, 3).join(" | ")}` : ""}`);

await b.close();
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
