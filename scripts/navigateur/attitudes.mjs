// 🙆 SES ATTITUDES (8 novembre 2026, `ATTITUDES` dans `lib/direct/ma-figurine.ts`) : l'étape 2 des « Trois façons de le
// dire » — tout le corps de la figurine parle (la tête dans les mains, le rire en douce…). Contre le faux Supabase et sa
// fausse IA de texte — jamais la vraie base, jamais le moteur d'image (ses images sont déposées d'avance, comme s'il les
// avait faites).
//
// Inès a sa figurine, et deux attitudes déjà faites : la tête dans les mains, le rire en douce. Dans « Créer », le tiroir
// « Visage » a désormais deux rangées : ses huit visages, puis « Son attitude » (six). « 🤦 Oh non » : sa figurine se
// tient la tête. Puis elle écrit sa phrase et choisit « 😂 Faire rire » : les trois façons de le dire proposent le rire en
// douce (la BD), la tête dans les mains (le cinéma), la grimace (l'affiche) — la fausse IA a reçu ces attitudes en indice.
// Elle prend la BD : sa figurine rit en douce, son mème part en BD, son attitude est gardée à côté du message (la
// colonne de la table ne connaît que quatre sentiments) ; et chez celui qui le reçoit, c'est bien elle qui rit en douce.
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
const etiquettes = async () => (await p.locator(".tr-choix .tr-rendu").allInnerTexts()).map((x) => x.replace(/\s+/g, " ").trim());

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

// ═══ LA FEUILLE « SON VISAGE, AU CHOIX » : SES VISAGES, PUIS SES ATTITUDES (le tiroir « Visage » jusqu'au 9 novembre 2026) ═══
await p.goto(`${BASE}/collection?v=${Date.now()}#figurine`, { waitUntil: "networkidle" });
await p.waitForSelector(".tf-moi .tf-texte textarea", { timeout: 60000 });
await fermerPablito(p, "#o-figurine");
await p.locator(".tf-moi .tf-sa-tete").click();
await p.waitForSelector(".tf-feuille-tete.ouverte .tf-att", { timeout: 10000 });
// (la feuille monte du bas : on mesure une fois arrivée)
await p.waitForFunction(() => document.getAnimations().every((a) => a.playState !== "running" || a.effect?.getTiming().iterations === Infinity), null, { timeout: 5000 });
const attitudes = (await p.locator(".tf-moi .tf-att button").allInnerTexts()).map((x) => x.replace(/\s+/g, " ").trim());
ok(
  (await p.locator(".tf-moi .tf-expr button").count()) === 8 && attitudes.length === 6 && ["Oh non", "En douce", "Bras croisés", "Victoire", "Chut", "Cœur"].every((a, k) => attitudes[k].includes(a)),
  `deux rangées : ses huit visages, puis « Son attitude » (${attitudes.join(" · ")})`,
);
// (9 novembre 2026 : « quand je clique sur “Son attitude”, ça ne fonctionne pas » — le menu du bas couvrait le tiroir,
// et l'ordinateur ne pouvait pas défiler de côté.) Chaque bouton, une fois amené à l'écran, est bien sous le doigt.
const sousLeDoigt = () =>
  p.evaluate(() =>
    [...document.querySelectorAll(".tf-feuille-tete .tf-expr button, .tf-feuille-tete .tf-att button")]
      .filter((x) => {
        x.scrollIntoView({ block: "nearest", inline: "nearest" });
        const r = x.getBoundingClientRect();
        return !x.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2));
      })
      .map((x) => x.textContent.trim()),
  );
const cachesTel = await sousLeDoigt();
ok(cachesTel.length === 0, `au téléphone : les quatorze boutons de la feuille se touchent, rien sous le menu du bas (${cachesTel.join(", ") || "aucun caché"})`);
await p.setViewportSize({ width: 1280, height: 800 });
await p.waitForTimeout(400);
const deCote = await p.evaluate(() => [...document.querySelectorAll(".tf-feuille-tete .tf-expr, .tf-feuille-tete .tf-att")].map((x) => x.scrollWidth - x.clientWidth));
const cachesOrdi = await sousLeDoigt();
ok(deCote.length === 2 && deCote.every((d) => d <= 1) && cachesOrdi.length === 0, `à l'ordinateur : toutes les têtes et attitudes à l'écran, sans défiler de côté (${deCote.join(", ")} ; ${cachesOrdi.join(", ") || "aucun caché"})`);
await p.setViewportSize({ width: 390, height: 844 });
await p.waitForTimeout(400);
await p.locator(".tf-feuille-tete .tf-att button", { hasText: "Oh non" }).click();
await p.waitForTimeout(500);
const tient = await p.evaluate(() => {
  const f = document.querySelector('.tf-moi [data-visage="tete"]');
  return { la: Boolean(f), img: [...(f?.querySelectorAll("img") ?? [])].some((i) => /tete-n\.webp/.test(i.src) && i.naturalWidth > 0) };
});
ok(
  tient.la && tient.img && (await texte(".tf-sa-tete-dit")).includes("🤦") && (await p.locator(".tf-moi .tf-att button.pris").count()) === 1 && (await p.locator(".tf-moi .tf-expr button.pris").count()) === 0,
  "« 🤦 Oh non » : sa figurine se tient la tête (son image, et un seul choix pour les deux rangées)",
);
await p.screenshot({ path: `${D}/attitudes-1-son-visage.png` });
await p.locator(".tf-feuille-tete .tf-garder").click();
await p.waitForFunction(() => !document.querySelector(".tf-feuille.ouverte"), null, { timeout: 5000 });

// ═══ « FAIRE RIRE » : LES TROIS FAÇONS, AVEC SES ATTITUDES ═══
await p.locator(".tf-moi .tf-texte textarea").fill(PHRASE);
await p.locator(".tr-intentions button", { hasText: "Faire rire" }).click();
await p.waitForFunction(() => document.querySelectorAll(".tr-choix .tr-rendu").length === 3, null, { timeout: 15000 });
await p.waitForTimeout(2200);
const trois = await etiquettes();
ok(trois[0].includes("En BD") && trois[0].includes("En douce") && trois[1].includes("En film") && trois[1].includes("Oh non") && trois[2].includes("En affiche") && trois[2].includes("Grimace"), `trois façons, trois corps : ${trois.join(" | ")}`);
ok((await p.locator(".tr-nouvelle").count()) === 1 && (await texte(".tr-rendu:nth-child(3) .tr-nouvelle")).includes("nouvelle tête"), "la grimace pas encore faite : « ✨ nouvelle tête » (les deux attitudes, elles, sont prêtes)");
await p.locator(".tr").scrollIntoViewIfNeeded();
await p.screenshot({ path: `${D}/attitudes-2-trois-facons.png` });

// ═══ ELLE PREND LA BD : ELLE RIT EN DOUCE ═══
await p.locator(".tr-choix .tr-rendu").nth(0).click();
await p.waitForSelector(".tr-rendu.pris", { timeout: 5000 });
ok((await texte(".tf-sa-tete-dit")).includes("🤭") && (await p.locator('.tf-moi [data-visage="endouce"]').count()) > 0, "« En BD » choisi : sa figurine rit en douce, la main devant la bouche");
await p.locator(".tf-moi .tf-quelle-voix button", { hasText: "voix de femme" }).click();
await p.locator(".tf-envoyer").click();
await p.waitForSelector(".tf-meme-pret video", { timeout: 90000 });
const [msg] = await lire("clik_figurine_message", `habitant_id=eq.${INES.id}&order=created_at.desc&limit=1`);
const aCote = await (await fetch(`${STOCK}/figurines-clients/${INES.id}/m-${msg?.id}.json`)).json().catch(() => ({}));
ok(msg?.id && !msg.sentiment && aCote.sentiment === "endouce" && aCote.rendu === "bd" && String(aCote.meme ?? "").includes(msg.id), `son attitude gardée à côté du message : ${aCote.sentiment}, en ${aCote.rendu}`);
await p.screenshot({ path: `${D}/attitudes-3-meme.png` });

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
