// ⚡ MES RÉACTIONS (en haut de « Créer », `clikme.fr/collection#reactions`) — contre le faux Supabase, sans moteur
// d'image (ici, les poses « faites » sont posées à la main dans le seau).
//
// Inès a sa figurine, et trois poses déjà faites (MDR, sa figurine seule, son visage gêné). Ses huit réactions sont
// dessinées d'avance : un toucher sur « MDR » → le sticker (512 px, sa figurine détourée, le fond transparent) ; sur
// « Sérieusement ? » (pas encore de pose) → sa figurine de tous les jours et l'emoji. Chaque envoi est compté. Le prout,
// à l'intensité « Interminable », avec sa vraie tête (seule + gênée) → une petite vidéo, avec « clikme.fr » ; le hoquet,
// sans sa pose → la version avec l'emoji. Rien ne déborde, jamais le mot interdit.
import fs from "node:fs";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { BASE, D, F, fermerPablito, lancer } from "./commun.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const INES = { id: "dddddddd-0000-4000-8000-000000000081", jeton: "jeton-ines-000000000000001" };
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const lire = async (t, q) => (await fetch(`${F}/${t}?${q}`)).json();

await semer("human_vitrine_sites", [{ id: "ffffffff-0000-4000-8000-000000000081", slug: "comptoir-rx-dax", channel: "letter", business_name: "Le Comptoir", city: "Dax", activite: "Restaurant", published: true, est_client: true }]);
await semer("human_habitants", [{ id: INES.id, device_token: INES.jeton, prenom: "Inès", ville_slug: "dax" }]);
const neutre = `${INES.id}/neutre-essai.webp`;
for (const [nom, src] of [
  ["neutre", "public/direct/double/pied/salut-1.webp"],
  ["parle", "public/direct/double/parle-1.webp"],
]) {
  await fetch(`${STOCK}/figurines-clients/${INES.id}/${nom}-essai.webp`, { method: "POST", headers: { "content-type": "image/webp" }, body: fs.readFileSync(src) });
}
await semer("clik_ma_figurine", [{ habitant_id: INES.id, prenom: "Inès", photo: `${INES.id}/photo-essai.jpg`, accord_le: new Date().toISOString(), neutre, parle: `${INES.id}/parle-essai.webp`, prete_le: new Date().toISOString() }]);
// ses poses « faites » : sa figurine sur un fond transparent (comme le moteur les rend), dans le dossier de ses expressions
const dossier = `${INES.id}/expr-${createHash("sha1").update(neutre).digest("hex").slice(0, 16)}`;
const fig = await sharp("public/direct/double/pied/salut-1.webp").resize(360, 540, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
const detouree = await sharp({ create: { width: 600, height: 900, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: fig, left: 120, top: 330 }])
  .webp()
  .toBuffer();
for (const p of ["mdr", "seule", "gene"]) await fetch(`${STOCK}/figurines-clients/${dossier}/r-${p}.webp`, { method: "POST", headers: { "content-type": "image/webp" }, body: detouree });

const b = await lancer({ args: ["--autoplay-policy=no-user-gesture-required"] });
let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, acceptDownloads: true });
await ctx.addCookies([{ name: "clikme_habitant", value: INES.jeton, url: BASE }]);
const ines = await ctx.newPage();
ines.err = [];
ines.on("pageerror", (e) => ines.err.push(String(e)));
const texte = async (sel) => (await ines.locator(sel).first().innerText({ timeout: 15000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const telecharge = async (action) => {
  const [dl] = await Promise.all([ines.waitForEvent("download", { timeout: 30000 }), action()]);
  const chemin = `${D}/rx-${dl.suggestedFilename()}`;
  await dl.saveAs(chemin);
  return { nom: dl.suggestedFilename(), chemin, octets: fs.statSync(chemin).size };
};

// ═══ « CRÉER » : SES RÉACTIONS, EN HAUT ═══
await ines.goto(`${BASE}/collection#reactions`, { waitUntil: "networkidle" });
await fermerPablito(ines, "#o-figurine");
await ines.waitForFunction(() => document.querySelectorAll("#reactions .rx-tuile img").length === 8, null, { timeout: 60000 });
ok((await ines.locator(".mc-nav button.pris").innerText()).includes("Créer") && (await ines.locator("#tf-o-reactions[aria-selected=true]").count()) === 1 && (await texte("#tf-o-reactions")).includes("Répondre vite"), "« #reactions » ouvre « Créer », sur l'onglet « ⚡ Répondre vite »");
ok((await texte("#reactions .rx-tete b")) === "Ta tête à la place des emojis" && (await texte("#reactions .rx-tete small")).includes("Un toucher, c’est envoyé"), "⚡ la promesse, en titre : « Ta tête à la place des emojis » — un toucher, c'est envoyé");
const noms = await ines.locator("#reactions .rx-tuile .rx-nom").allInnerTexts();
ok(noms.join("|") === "Mort de rire|Sérieusement ?|Bravo|Choqué|Bisou|Grimace|Amour|Top", `ses huit réactions, dessinées d'avance (${noms.join(" · ")})`);
ok((await ines.locator("#reactions .rx-tuile.vraie").count()) === 1 && (await ines.locator('#reactions .rx-tuile.vraie[aria-label="Mort de rire"]').count()) === 1, "MDR a déjà sa pose (les autres : sa figurine et l'emoji)");
await ines.locator("#reactions").screenshot({ path: `${D}/reactions-1-grille.png` });

// un toucher sur MDR : le sticker (512 px, détouré, le fond transparent)
const mdr = await telecharge(() => ines.locator('#reactions .rx-tuile[aria-label="Mort de rire"]').click());
const mm = await sharp(mdr.chemin).metadata();
const coin = await sharp(mdr.chemin).extract({ left: 0, top: 500, width: 8, height: 8 }).raw().toBuffer();
ok(mdr.nom === "mdr-clikme.png" && mm.width === 512 && mm.height === 512 && mm.hasAlpha && coin[3] === 0, `un toucher : le sticker MDR (${mm.width}×${mm.height}, détouré, fond transparent)`);
// (9 novembre 2026, l'ami : « un petit retour visuel, pour confirmer que le tap a fonctionné ») — ici, sans feuille de
// partage, il est enregistré : le bandeau le dit
await ines.waitForSelector(".rx-bandeau", { timeout: 5000 });
ok((await texte(".rx-bandeau")).includes("« Mort de rire » est enregistré"), `le toucher se voit : « ${await texte(".rx-bandeau")} »`);
fs.copyFileSync(mdr.chemin, `${D}/reactions-2-sticker-mdr.png`);
// « Sérieusement ? » : pas encore de pose → sa figurine de tous les jours, l'emoji et le mot
const ser = await telecharge(() => ines.locator('#reactions .rx-tuile[aria-label="Sérieusement ?"]').click());
ok(ser.nom === "serieux-clikme.png" && (await sharp(ser.chemin).metadata()).width === 512, `« Sérieusement ? » : en attendant sa pose, sa figurine et l'emoji (${Math.round(ser.octets / 1024)} Ko)`);
fs.copyFileSync(ser.chemin, `${D}/reactions-3-sticker-serieux.png`);
await ines.waitForTimeout(500);
const envois = (await lire("clik_meme_evenement", "message_id=like.r-*")).length || (await lire("clik_meme_evenement", "type=eq.partage")).filter((e) => String(e.message_id).startsWith("r-")).length;
ok(envois === 2, `chaque envoi est compté (${envois})`);
// sans moteur ici : une pose ne se fait pas (et une réaction inconnue non plus)
const api = (corps) =>
  ines.evaluate(async (c) => {
    const r = await fetch("/api/direct/ma-figurine", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(c) });
    return { statut: r.status, ...(await r.json().catch(() => ({}))) };
  }, corps);
ok((await api({ action: "pose", cle: "serieux" })).statut === 400 && (await api({ action: "pose", cle: "nimporte" })).statut === 400 && (await api({ action: "reaction-envoi", cle: "nimporte" })).statut === 400, "sans moteur, pas de pose ; une réaction inconnue : non");

// ═══ 💥 LE PROUT, « INTERMINABLE », AVEC SA VRAIE TÊTE (seule, puis gênée) — les gags sont dans « Répondre vite »
// (9 novembre 2026 : « Animer », sous sa figurine, est parti ; ils n'étaient plus qu'en double) ═══
await ines.locator("#tf-o-parler").click();
ok((await ines.locator("#tf-reactions[hidden]").count()) === 1 && (await ines.locator(".tf-moi .tf-g-animer, .tf-moi .tf-tiroir-gags").count()) === 0, "« 💬 Faire un mème » : ses réactions se rangent ; plus de gags en double sous sa figurine");
await ines.locator("#tf-o-reactions").click();
ok((await texte("#reactions .rx-sous")).includes("Un gag, en petite vidéo") && (await texte("#reactions .rx-sous-dit")).includes("Pour détendre une conversation"), "« 💥 Un gag, en petite vidéo » : pour détendre une conversation");
await ines.locator(".rx-gag", { hasText: "Le prout" }).click();
await ines.waitForSelector("#tf-reactions:not([hidden]) .rx-gag.pris", { timeout: 5000 });
ok((await texte(".rx-gag.pris")).includes("Le prout"), "« Le prout » choisi");
await ines.locator(".rx-intensite input").fill("5");
await ines.waitForFunction(() => document.querySelector(".rx-intensite b")?.textContent === "Interminable");
ok((await texte(".rx-lancer")).includes("Le prout (5 s)"), `la jauge d'intensité : « Interminable », plus long (${await texte(".rx-lancer")})`);
await ines.locator(".rx-lancer").click();
await ines.waitForSelector(".rx-toile.visible", { timeout: 10000 });
await ines.waitForTimeout(1800);
await ines.locator(".rx-toile").screenshot({ path: `${D}/reactions-4-prout.png` });
await ines.waitForSelector(".rx-video", { timeout: 30000 });
const prout = await telecharge(() => ines.locator(".rx-envoyer").click());
ok(/^prout-clikme\.(webm|mp4)$/.test(prout.nom) && prout.octets > 20_000, `la vidéo du prout (${prout.nom}, ${Math.round(prout.octets / 1024)} Ko)`);
// le hoquet, sans sa pose : la version avec l'emoji
await ines.locator(".rx-gag", { hasText: "Le hoquet" }).click();
ok((await ines.locator(".rx-intensite").count()) === 0, "le hoquet : pas de jauge (elle est au prout)");
await ines.locator(".rx-lancer").click();
await ines.waitForSelector(".rx-video", { timeout: 30000 });
const hoquet = await telecharge(() => ines.locator(".rx-envoyer").click());
ok(/^hoquet-clikme\.(webm|mp4)$/.test(hoquet.nom) && hoquet.octets > 10_000, `la vidéo du hoquet (${Math.round(hoquet.octets / 1024)} Ko)`);
await ines.waitForTimeout(500);
const gags = (await lire("clik_meme_evenement", "type=eq.partage")).map((e) => String(e.message_id)).filter((m) => m === "r-prout" || m === "r-hoquet");
ok(gags.length === 2, `les gags envoyés sont comptés aussi (${gags.join(", ")})`);
ok((await ines.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0 && !/exemple/i.test(await texte("#reactions")), "rien ne déborde, sans le mot interdit");
await ines.screenshot({ path: `${D}/reactions-5-page.png`, fullPage: false });
ok(ines.err.length === 0, `aucune erreur dans la page${ines.err.length ? ` (${ines.err.join(" | ").slice(0, 300)})` : ""}`);

await b.close();
if (echecs) {
  console.log(`\n${echecs} échec(s)`);
  process.exit(1);
}
console.log("\nTout est bon.");
