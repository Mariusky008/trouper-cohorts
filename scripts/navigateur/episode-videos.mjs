// 🎞️ L'ÉPISODE, À PARTIR DE SES VIDÉOS DÉJÀ TOURNÉES (8 novembre 2026, `lib/direct/episode-videos.ts`), au comptoir, contre
// le faux Supabase.
//
// Chez Bergine : « Plus de clients » → « En épisode ». À côté de « 📷 Placer mon téléphone », « 🎞️ J'ai déjà mes vidéos »
// (fermé tant qu'il n'a pas dit ce qu'il fabrique). Il en dépose trois (13,7 s, 6,6 s, 5,2 s) : chacune lue (sa durée,
// sa petite image), dans l'ordre où il les a choisies (elles portent toutes la même date) ; il en descend une, la
// remonte, en retire une et la remet. « 🎬 Faire mon épisode » : le téléphone les regarde en accéléré (« Tes vidéos »),
// et « Arrêter » le ramène à ses vidéos ; relancé, il garde les meilleurs moments, puis monte l'épisode jusqu'au bout :
// « Saison … · Épisode … · la tarte aux pommes », prêt à publier. Rien ne déborde, jamais le mot interdit, aucune
// erreur dans la page.
import path from "node:path";
import { BASE, D, F, lancer } from "./commun.mjs";
import { SITES } from "./semer.mjs";

const SLUG = SITES.bergine.slug;
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
await semer("human_vitrine_sites", Object.values(SITES));
const VIDEOS = ["rien", "direct", "cuisine"].map((n) => path.resolve(`public/direct/videos/${n}.webm`));

const b = await lancer({ args: ["--autoplay-policy=no-user-gesture-required"] });
let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
const erreurs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
p.on("pageerror", (e) => erreurs.push(String(e)));
const texte = async (sel) => (await p.locator(sel).first().innerText({ timeout: 15000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const noms = async () => (await p.locator(".ep-videos .ep-video-t b").allInnerTexts()).map((x) => x.trim());

await p.goto(`${BASE}/autour-de-moi/assistante?site=${SLUG}&k=jeton-test`, { waitUntil: "networkidle", timeout: 400000 });
await p.waitForSelector(".ak-cta", { timeout: 60000 });
await p.locator(".ak-cta").click();
await p.waitForSelector(".ac-option.episode", { timeout: 20000 });
await p.locator(".ac-option.episode").click();
await p.waitForSelector(".ep-intro", { timeout: 20000 });

// ═══ « J'AI DÉJÀ MES VIDÉOS » ═══
ok((await texte(".ep-intro")).includes("Dépose tes vidéos") && (await p.locator(".ep-deposer.off input[disabled]").count()) === 1, "à côté de « Placer mon téléphone » : « J’ai déjà mes vidéos », fermé tant qu’il n’a pas dit ce qu’il fabrique");
await p.locator(".ep-champ input").first().fill("la tarte aux pommes");
ok((await p.locator(".ep-deposer.off").count()) === 0, "ouvert dès qu’il l’a dit");
await p.locator(".ep-deposer input").setInputFiles(VIDEOS);
await p.waitForSelector(".ep-videos li", { timeout: 15000 });
await p.waitForFunction(() => document.querySelector(".ep-total")?.textContent?.includes("En tout") && !document.body.innerText.includes("Je la lis"), null, { timeout: 30000 });
const lignes = (await p.locator(".ep-videos li").allInnerTexts()).map((x) => x.replace(/\s+/g, " ").trim());
ok(
  lignes.length === 3 && lignes[0].includes("rien.webm") && lignes[0].includes("0:13") && lignes[1].includes("direct.webm") && lignes[1].includes("0:06") && lignes[2].includes("cuisine.webm") && lignes[2].includes("0:05"),
  `ses trois vidéos, lues, dans l’ordre où il les a choisies (${lignes.join(" | ")})`,
);
const images = await p.evaluate(() => [...document.querySelectorAll(".ep-vignette img")].filter((i) => i.naturalWidth > 0).length);
ok(images === 3, `chacune avec sa petite image (${images})`);
ok((await texte(".ep-total")).includes("0:25") && (await p.locator("button.cz-go", { hasText: "Faire mon épisode" }).isEnabled()), `en tout : ${await texte(".ep-total")}`);
await p.screenshot({ path: `${D}/episode-videos-1-liste.png` });

// les ranger : descendre, remonter ; en retirer une, la remettre
await p.locator(".ep-videos li").nth(0).locator("button[aria-label^='Descendre']").click();
const apres = await noms();
await p.locator(".ep-videos li").nth(1).locator("button[aria-label^='Monter']").click();
ok(apres[0] === "direct.webm" && apres[1] === "rien.webm" && (await noms())[0] === "rien.webm", "↓ puis ↑ : il les range dans l’ordre de sa fabrication");
await p.locator(".ep-videos li").nth(2).locator("button[aria-label^='Retirer']").click();
ok((await p.locator(".ep-videos li").count()) === 2 && (await texte(".ep-total")).includes("0:20"), `✕ : retirée (${await texte(".ep-total")})`);
await p.locator(".ep-corps .ep-deposer input").setInputFiles([VIDEOS[2]]);
await p.waitForFunction(() => document.querySelectorAll(".ep-videos li").length === 3 && !document.body.innerText.includes("Je la lis"), null, { timeout: 20000 });
ok((await noms()).join() === "rien.webm,direct.webm,cuisine.webm", "« ＋ Ajouter une vidéo » : la revoilà, à la fin");

// ═══ « FAIRE MON ÉPISODE » — ARRÊTÉ, PUIS JUSQU'AU BOUT ═══
await p.locator("button.cz-go", { hasText: "Faire mon épisode" }).click();
await p.waitForSelector(".ep-montage.on", { timeout: 10000 });
await p.waitForFunction(() => document.querySelector(".ep-montage.on p")?.textContent?.includes("Je regarde"), null, { timeout: 10000 });
ok((await texte(".ep-montage h2")) === "Tes vidéos", `il les regarde : ${await texte(".ep-montage p")}`);
await p.locator(".ep-montage .cz-second", { hasText: "Arrêter" }).click();
await p.waitForSelector(".ep-videos li", { timeout: 10000 });
ok((await p.locator(".ep-videos li").count()) === 3, "« Arrêter » : retour à ses vidéos, toutes là");

await p.locator("button.cz-go", { hasText: "Faire mon épisode" }).click();
await p.waitForFunction(() => document.querySelector(".ep-montage.on p")?.textContent?.includes("Je garde tes meilleurs moments"), null, { timeout: 60000 });
const etape = await texte(".ep-montage p");
await p.screenshot({ path: `${D}/episode-videos-2-moments.png` });
ok(/\d+\/\d+/.test(etape), `puis il garde les meilleurs moments : ${etape}`);
// l'aperçu montre ses vidéos (la toile n'est pas noire)
const vu = await p.evaluate(() => {
  const c = document.querySelector(".ep-toile");
  const g = c.getContext("2d");
  const d = g.getImageData(0, 0, c.width, c.height).data;
  let n = 0;
  for (let i = 0; i < d.length; i += 4 * 211) n += d[i] + d[i + 1] + d[i + 2] > 120 ? 1 : 0;
  return { n, l: c.width };
});
ok(vu.n > 50, `sous ses yeux, ses vidéos (${JSON.stringify(vu)})`);
await p.waitForSelector(".ep-film video", { timeout: 240000 });
const legende = await texte(".ep-film figcaption");
const secondes = Number(/(\d+) s/.exec(legende)?.[1] ?? 0);
ok(legende.includes("Saison") && legende.includes("Épisode") && legende.includes("la tarte aux pommes") && secondes >= 12, `son épisode est monté : ${legende}`);
ok((await p.locator("button.cz-go", { hasText: "Publier l’épisode" }).count()) === 1 && (await texte(".ep-corps")).includes("Recommencer"), "prêt à publier (ou à recommencer)");
await p.screenshot({ path: `${D}/episode-videos-3-pret.png` });

ok((await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0 && !/exemple/i.test(await p.evaluate(() => document.body.innerText)), "rien ne déborde, sans le mot interdit");
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs.slice(0, 3).join(" | ")})` : ""}`);
await b.close();
if (echecs) {
  console.log(`\n${echecs} échec(s)`);
  process.exit(1);
}
console.log("\nTout est bon.");
