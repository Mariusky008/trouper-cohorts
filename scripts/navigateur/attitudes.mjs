// 🙆 SES ATTITUDES (8 novembre 2026, `ATTITUDES` dans `lib/direct/ma-figurine.ts`) : l'étape 2 des « Trois façons de le
// dire » — tout le corps de la figurine parle (la tête dans les mains, le rire en douce…). Contre le faux Supabase et sa
// fausse IA de texte — jamais la vraie base, jamais le moteur d'image (ses images sont déposées d'avance, comme s'il les
// avait faites).
//
// Inès a sa figurine, et deux attitudes déjà faites : la tête dans les mains, le rire en douce. Par la route, « 😂 Faire
// rire » propose le rire en douce (la BD), la tête dans les mains (le cinéma), la grimace (l'affiche) — la fausse IA a
// reçu ces attitudes en indice. Dans « Créer » (un seul écran depuis le 10 novembre 2026), la rangée « Son visage » : ses
// huit humeurs, puis ses six attitudes. « 🤦 Oh non » : sa figurine se tient la tête ; son mème part avec son attitude,
// gardée à côté du message (la colonne de la table ne connaît que quatre sentiments) ; « Sa version » : en BD, il se
// refait à la même place ; et chez celui qui le reçoit, c'est bien elle qui se tient la tête.
// Rien ne déborde, jamais le mot interdit, aucune erreur dans la page.
import fs from "node:fs";
import { createHash } from "node:crypto";
import { BASE, D, F, fermerPablito, lancer } from "./commun.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const IA = F.replace("/rest/v1", "/__ia");
const INES = { id: "abababab-0000-4000-8000-000000000502", jeton: "jeton-ines-attitudes-0001", prenom: "Inès" };
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const lire = async (t, q) => (await fetch(`${F}/${t}?${q}`)).json();
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const img = (nom) => fs.readFileSync(`public/direct/double/${nom}.webp`);

// ─── Inès, sa figurine, sa joie, et deux attitudes ───
await semer("human_habitants", [{ id: INES.id, device_token: INES.jeton, prenom: INES.prenom, ville_slug: "dax" }]);
const neutre = `${INES.id}/neutre-essai.webp`;
await deposer(neutre, img("pied/salut-1"), "image/webp");
await deposer(`${INES.id}/parle-essai.webp`, img("pied/parle-1"), "image/webp");
await semer("clik_ma_figurine", [{ habitant_id: INES.id, prenom: INES.prenom, photo: `${INES.id}/photo-essai.jpg`, accord_le: new Date().toISOString(), neutre, parle: `${INES.id}/parle-essai.webp`, prete_le: new Date().toISOString() }]);
await deposer(`${INES.id}/majeur.json`, JSON.stringify({ le: new Date().toISOString(), age: 15 }), "application/json");
const dossier = `${INES.id}/expr-${createHash("sha1").update(neutre).digest("hex").slice(0, 16)}`;
const FAITES = { joie: "pied/salut-2", tete: "reflechit", endouce: "content" };
for (const [cle, nom] of Object.entries(FAITES)) {
  await deposer(`${dossier}/${cle}-n.webp`, img(nom), "image/webp");
  await deposer(`${dossier}/${cle}-p.webp`, img(nom), "image/webp");
}

const b = await lancer({ args: ["--autoplay-policy=no-user-gesture-required"] });
let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
const erreurs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await ctx.addCookies([{ name: "clikme_habitant", value: INES.jeton, url: BASE }]);
const p = await ctx.newPage();
p.on("pageerror", (e) => erreurs.push(String(e)));
const texte = async (sel) => (await p.locator(sel).first().innerText({ timeout: 15000 }).catch(() => "")).replace(/\s+/g, " ").trim();

// ═══ PAR LA ROUTE : « FAIRE RIRE », AVEC SES ATTITUDES ═══
const route = async (corps) => {
  const r = await fetch(`${BASE}/api/direct/ma-figurine`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${INES.jeton}` }, body: JSON.stringify(corps) });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const PHRASE = "Je devais rentrer tôt ce soir";
const r1 = await route({ action: "rendus", texte: PHRASE, intention: "rire" });
ok(r1.statut === 200 && r1.par === "ia" && r1.rendus?.map((r) => `${r.style}:${r.visage}`).join(" ") === "bd:endouce cinema:tete affiche:grimace", `« Faire rire » : le rire en douce, la tête dans les mains, la grimace (${r1.rendus?.map((r) => `${r.style} ${r.visage}`).join(" · ")}, par ${r1.par})`);
const laConsigne = ((await (await fetch(IA)).json()) ?? []).findLast((c) => c.includes("TROIS INTERPRÉTATIONS")) ?? "";
ok(/ATTITUDE/.test(laConsigne) && /tete \(la tête dans les mains\)/.test(laConsigne) && laConsigne.includes("endouce, tete, grimace"), "la fausse IA connaît ses attitudes (et celles qui vont avec « faire rire »)");
const r2 = await route({ action: "rendus", texte: PHRASE, intention: "rire", tour: 1 });
ok(r2.statut === 200 && r2.par === "regles" && r2.rendus?.every((r, k) => r.visage !== r1.rendus?.[k]?.visage), `« 🎲 Trois autres » : les attitudes tournent aussi (${r2.rendus?.map((r) => r.visage).join(", ")})`);

// ═══ « SON VISAGE » : UNE RANGÉE — SES HUMEURS, PUIS SES ATTITUDES (10 novembre 2026 : « Créer » sur un seul écran ; avant,
// une feuille, et le tiroir « Visage » jusqu'au 9 novembre) ═══
await p.goto(`${BASE}/collection?v=${Date.now()}#figurine`, { waitUntil: "networkidle" });
await p.waitForSelector(".tf-moi .tf-texte textarea", { timeout: 60000 });
await fermerPablito(p, "#o-figurine");
const noms = (await p.locator(".tf-moi .tf-v[data-cle] .tf-v-nom").allInnerTexts()).map((x) => x.trim());
const attitudes = noms.slice(-6);
ok(noms.length === 14 && noms[0] === "Normal" && ["Oh non", "En douce", "Bras croisés", "Victoire", "Chut", "Cœur"].every((a, k) => attitudes[k].includes(a)), `une rangée : « Normal », ses sept humeurs, puis ses six attitudes (${attitudes.join(" · ")})`);
// (9 novembre 2026 : « quand je clique sur “Son attitude”, ça ne fonctionne pas » — le menu du bas couvrait le tiroir,
// et l'ordinateur ne pouvait pas défiler de côté.) Chaque vignette, une fois amenée à l'écran, est bien sous le doigt.
const sousLeDoigt = () =>
  p.evaluate(() =>
    [...document.querySelectorAll(".tf-moi .tf-v")]
      .filter((x) => {
        x.scrollIntoView({ block: "nearest", inline: "nearest" });
        const r = x.getBoundingClientRect();
        return !x.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2));
      })
      .map((x) => x.textContent.trim()),
  );
const cachesTel = await sousLeDoigt();
ok(cachesTel.length === 0, `au téléphone : ses quatorze vignettes se touchent (la rangée glisse), rien sous le menu du bas (${cachesTel.join(", ") || "aucune cachée"})`);
await p.setViewportSize({ width: 1280, height: 800 });
await p.waitForTimeout(400);
const deCote = await p.evaluate(() => [...document.querySelectorAll(".tf-moi .tf-rangee")].map((x) => x.scrollWidth - x.clientWidth));
const cachesOrdi = await sousLeDoigt();
ok(deCote.length === 1 && deCote.every((d) => d <= 1) && cachesOrdi.length === 0, `à l'ordinateur : toutes les têtes et attitudes à l'écran, sans défiler de côté (${deCote.join(", ")} ; ${cachesOrdi.join(", ") || "aucune cachée"})`);
await p.setViewportSize({ width: 390, height: 844 });
await p.waitForTimeout(400);
await p.locator('.tf-moi .tf-v[data-cle="tete"]').click();
await p.waitForTimeout(500);
const tient = await p.evaluate(() => {
  const f = document.querySelector('.tf-moi [data-visage="tete"]');
  return { la: Boolean(f), img: [...(f?.querySelectorAll("img") ?? [])].some((i) => /tete-n\.webp/.test(i.src) && i.naturalWidth > 0) };
});
ok(
  tient.la && tient.img && (await texte(".tf-moi .tf-tete-nom")).includes("🤦") && (await p.locator(".tf-moi .tf-v[aria-checked=true]").count()) === 1 && (await p.locator('.tf-moi .tf-v[data-cle="tete"][aria-checked=true]').count()) === 1,
  "« 🤦 Oh non » : sa figurine se tient la tête (son image, son nom dessous, et un seul choix pour toute la rangée)",
);
await p.screenshot({ path: `${D}/attitudes-1-son-visage.png` });

// ═══ SON MÈME, AVEC SON ATTITUDE ; PUIS « SA VERSION » (la BD, le film, l'affiche), SUR SON MÈME PRÊT ═══
await p.locator(".tf-moi .tf-texte textarea").fill(PHRASE);
await p.locator(".tf-envoyer").click();
await p.waitForSelector(".tf-meme-pret video", { timeout: 90000 });
const [msg] = await lire("clik_figurine_message", `habitant_id=eq.${INES.id}&order=created_at.desc&limit=1`);
const aCote = await (await fetch(`${STOCK}/figurines-clients/${INES.id}/m-${msg?.id}.json`)).json().catch(() => ({}));
ok(msg?.id && !msg.sentiment && aCote.sentiment === "tete" && !aCote.rendu && String(aCote.meme ?? "").includes(msg.id), `son attitude gardée à côté du message (la table ne connaît que quatre sentiments) : ${aCote.sentiment}`);
await p.waitForFunction(() => document.querySelectorAll(".tf-feuille-meme .tr-rendu").length === 4, null, { timeout: 15000 });
await p.waitForTimeout(1200);
const trois = (await p.locator(".tf-feuille-meme .tr-rendu:not(.tr-video)").evaluateAll((l) => l.map((b) => b.getAttribute("aria-label")))).join(" | ");
ok(/^En BD : .+ \| En film : .+ \| En affiche : .+$/.test(trois), `ses trois versions, chacune avec sa tête : ${trois}`);
await p.screenshot({ path: `${D}/attitudes-2-trois-facons.png` });
await p.locator(".tf-feuille-meme .tr-rendu.tr-bd").click();
await p.waitForSelector(".tf-feuille-meme .tf-meme-cours", { timeout: 10000 });
await p.waitForSelector(".tf-feuille-meme .tf-meme-pret video", { timeout: 90000 });
const aCote2 = await (await fetch(`${STOCK}/figurines-clients/${INES.id}/m-${msg?.id}.json`)).json().catch(() => ({}));
ok(aCote2.rendu === "bd" && aCote2.sentiment === "tete" && aCote2.meme === aCote.meme && (await p.locator('.tf-moi [data-visage="tete"]').count()) > 0, `« En BD » : son mème se refait en BD, à la même place ; sa tête (pas encore faite, celle de la BD) ne change pas la sienne (${aCote2.rendu}, ${aCote2.sentiment})`);
await p.screenshot({ path: `${D}/attitudes-3-meme.png` });
await p.keyboard.press("Escape");

// ═══ CHEZ CELUI QUI LE REÇOIT ═══
// son mème : la vidéo (fabriquée avec son attitude)
const r = await b.newContext({ viewport: { width: 390, height: 844 } });
const q = await r.newPage();
q.on("pageerror", (e) => erreurs.push(String(e)));
await q.goto(`${BASE}/figurine/${msg.id}`, { waitUntil: "networkidle" });
ok((await q.locator(".mr-meme video").count()) === 1, "chez celui qui le reçoit : son mème, en vidéo");
// un message sans vidéo (sa voix seule, la tête dans les mains) : sa figurine la joue, avec l'image de son attitude
const son = `data:audio/webm;base64,${Buffer.from("GkXfo".repeat(400)).toString("base64")}`;
const m2 = await route({ action: "message", son, duree: 2, commerces: [], sentiment: "tete" });
await q.goto(`${BASE}/figurine/${String(m2.lien ?? "").split("/").pop()}`, { waitUntil: "networkidle" });
await q.waitForSelector(".mr-fig", { timeout: 20000 });
const recu = await q.evaluate(() => {
  const f = document.querySelector('.mr-fig[data-visage="tete"]');
  return { la: Boolean(f), img: [...(f?.querySelectorAll("img") ?? [])].some((i) => /tete-n\.webp/.test(decodeURIComponent(i.src))) };
});
ok(m2.statut === 200 && recu.la && recu.img, `sans vidéo : sa figurine se tient la tête chez celui qui le reçoit (${JSON.stringify(recu)})`);
await r.close();

ok((await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0 && !/exemple/i.test(await p.evaluate(() => document.body.innerText)), "rien ne déborde, sans le mot interdit");
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.slice(0, 3).join(" | ")})` : ""}`);
await b.close();
if (echecs) {
  console.log(`\n${echecs} échec(s)`);
  process.exit(1);
}
console.log("\nTout est bon.");
