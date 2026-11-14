// 🎬 LES VIDÉOS, L'ÉCRAN — lot M3 (`app/collection/videos.tsx`, `docs/univers/messages-ecrits.md` section 6), contre
// le faux Supabase et sa fausse modération, jamais la vraie base.
//
// Les vidéos d'essai sont ENREGISTRÉES PAR LE NAVIGATEUR LUI-MÊME (une toile animée, comme une caméra) : des WebM qui,
// comme ceux d'un navigateur, ne disent pas leur durée — à l'une, on l'ajoute dans son en-tête.
//
// Léa et Zoé sont proches ; chacune ouvre leur conversation. « ＋ » → 🎬 Une vidéo : Léa choisit une vidéo de 2 s. LA
// FEUILLE : le téléphone la lit (sa durée, « 0:02 » ; ses trois images, celle du milieu en affiche), une légende, trois
// têtes ; « Envoyer à Zoé » : « Envoi… 0 % », puis « Vérification… » ; la vignette dans le fil (▶, « 0:02 »), sa figurine la
// montre dans un petit cadre (sans son), la légende dans la bulle, « 🗑️ Effacer » sous elle. Chez Zoé, elle arrive toute
// seule ; un toucher la lit en grand, AVEC LE SON (rien pour l'enregistrer) ; elle la fait glisser vers le bas : fermée, et
// la figurine de Léa la montre. CE QUI NE PART PAS : 31 secondes (« 31 s : 30 secondes au plus », AVANT l'envoi : rien
// n'est déposé) ; plus de 25 Mo ; un format qu'on ne prend pas ; une vidéo que le téléphone ne sait pas lire ; une image
// que la modération refuse (« Cette vidéo ne peut pas partir. ») ; la modération en panne (« Réessayer », sans la
// redéposer). Léa efface sa vidéo. La ligne de Léa chez Zoé : « T'a envoyé : 🎬 … ». Rien ne déborde, jamais le mot
// interdit, aucune erreur dans la page.
import crypto from "node:crypto";
import fs from "node:fs";
import { BASE, D, F, fermerPablito, lancer } from "./commun.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const img = (nom) => fs.readFileSync(`public/direct/double/${nom}.webp`);
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);
const plat = (x) => String(x ?? "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();

const qui = (n, prenom) => ({ id: `e8e8e8e8-0000-4000-8000-0000000016${String(n).padStart(2, "0")}`, jeton: `jeton-videos-m3-ecran-00000${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const ZOE = qui(2, "Zoé");
const GENS = [LEA, ZOE];
for (const x of GENS) x.cle = cleProfil(x.id);
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
for (const [i, x] of GENS.entries()) {
  await deposer(`${x.id}/neutre-essai.webp`, img(["pied/salut-1", "pied/montre"][i]), "image/webp");
  await deposer(`${x.id}/parle-essai.webp`, img(["pied/salut-1", "pied/montre"][i]), "image/webp");
  await json(`${x.id}/majeur.json`, { le: new Date().toISOString(), age: 15 });
  await json(`profils/${x.cle}.json`, { h: x.id });
}
await semer(
  "clik_ma_figurine",
  GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo-essai.jpg`, accord_le: new Date().toISOString(), neutre: `${x.id}/neutre-essai.webp`, parle: `${x.id}/parle-essai.webp`, prete_le: new Date().toISOString() })),
);
await json(`${LEA.id}/proches.json`, { ids: [ZOE.id] });
await json(`${ZOE.id}/proches.json`, { ids: [LEA.id] });
const lister = async (dossier) => {
  const r = await fetch(`${STOCK}/list/figurines-clients`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prefix: dossier, limit: 1000 }) });
  return r.status === 200 ? ((await r.json().catch(() => [])) ?? []).map((x) => x.name) : [];
};
const PAIRE = [LEA.id, ZOE.id].sort().join("_");

const b = await lancer();
let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

// ─── les vidéos d'essai, enregistrées par le navigateur (une toile animée) ───
const atelier = await (await b.newContext()).newPage();
await atelier.goto(`${BASE}/collection`, { waitUntil: "domcontentloaded" });
async function enregistrer(l, h, ms, teinte) {
  const b64 = await atelier.evaluate(
    async ({ l, h, ms, teinte }) => {
      const c = document.createElement("canvas");
      c.width = l;
      c.height = h;
      const ctx = c.getContext("2d");
      const flux = c.captureStream(25);
      const rec = new MediaRecorder(flux, { mimeType: "video/webm;codecs=vp8" });
      const morceaux = [];
      rec.ondataavailable = (e) => e.data.size && morceaux.push(e.data);
      const fini = new Promise((ok) => (rec.onstop = ok));
      const t0 = performance.now();
      let tourne = true;
      const dessiner = () => {
        const t = (performance.now() - t0) / ms;
        ctx.fillStyle = `hsl(${teinte + t * 90}, 70%, 50%)`;
        ctx.fillRect(0, 0, l, h);
        ctx.fillStyle = "#fff";
        ctx.fillRect(t * l * 0.8, h * 0.4, l * 0.2, h * 0.2);
        if (tourne) requestAnimationFrame(dessiner);
      };
      dessiner();
      rec.start(200);
      await new Promise((ok) => setTimeout(ok, ms));
      rec.stop();
      tourne = false;
      await fini;
      const octets = new Uint8Array(await new Blob(morceaux, { type: "video/webm" }).arrayBuffer());
      let s = "";
      for (let i = 0; i < octets.length; i += 0x8000) s += String.fromCharCode(...octets.subarray(i, i + 0x8000));
      return btoa(s);
    },
    { l, h, ms, teinte },
  );
  return Buffer.from(b64, "base64");
}
/** (la durée, ajoutée dans l'en-tête d'un WebM du navigateur : `Segment/Info/Duration`, en millisecondes) */
function avecDuree(webm, secondes) {
  const i = webm.indexOf(Buffer.from([0x15, 0x49, 0xa9, 0x66]));
  let n = 1;
  while (n <= 8 && !(webm[i + 4] & (0x80 >> (n - 1)))) n++;
  let v = webm[i + 4] & (0xff >> n);
  for (let k = 1; k < n; k++) v = v * 256 + webm[i + 4 + k];
  const contenu = webm.subarray(i + 4 + n, i + 4 + n + v);
  const duree = Buffer.alloc(11);
  duree.set([0x44, 0x89, 0x88]);
  duree.writeDoubleBE(secondes * 1000, 3);
  const neuf = Buffer.concat([contenu, duree]);
  const taille = Buffer.alloc(8);
  taille[0] = 0x01;
  taille.writeUIntBE(neuf.length, 2, 6);
  return Buffer.concat([webm.subarray(0, i + 4), taille, neuf, webm.subarray(i + 4 + n + v)]);
}
const CONCERT = await enregistrer(640, 360, 2000, 300);
// (en portrait, deux fois trop grandes : le téléphone les réduit à 321 et 322 pixels de large — la fausse modération
// refuse 321, ne répond pas pour 322)
const REFUSEE = await enregistrer(642, 1280, 900, 0);
const PANNE = await enregistrer(644, 1280, 900, 120);
const LONGUE = avecDuree(await enregistrer(160, 90, 600, 200), 31);
const ENCORE = avecDuree(await enregistrer(480, 270, 1200, 30), 1.2);
await atelier.context().close();
ok(CONCERT.length > 1000 && REFUSEE.length > 1000 && LONGUE.length > 500, `les vidéos d'essai, enregistrées par le navigateur (${Math.round(CONCERT.length / 1024)} Ko, ${Math.round(REFUSEE.length / 1024)} Ko…)`);

const tel = async (q) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.addCookies([{ name: "clikme_habitant", value: q.jeton, url: BASE }]);
  const p = await ctx.newPage();
  p.err = [];
  p.on("pageerror", (e) => p.err.push(String(e)));
  return p;
};
const texte = async (p, sel) => plat(await p.locator(sel).first().innerText({ timeout: 15000 }).catch(() => ""));
const compte = (p, sel) => p.locator(sel).count();
const debordement = (p) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const attendre = (p, f, arg, ms = 15000) => p.waitForFunction(f, arg, { timeout: ms }).then(() => true).catch(() => false);
async function ouvrirAvec(p, avec) {
  await p.goto(`${BASE}/collection?v=${Date.now()}#proches`, { waitUntil: "networkidle" });
  await fermerPablito(p, "#o-proches");
  await p.waitForSelector(`#o-proches .pr-carte[data-cle="${avec.cle}"] .pr-mini`, { timeout: 60000 });
  await p.locator(`#o-proches .pr-carte[data-cle="${avec.cle}"] .pr-mini`).click();
  await p.waitForSelector(".pr-plein .pr-scene", { timeout: 30000 });
  await p.waitForSelector(".pr-plein .pv-calque.lui", { state: "attached", timeout: 15000 });
}
/** « ＋ » → 🎬 Une vidéo, puis la vidéo choisie (comme dans la pellicule). `voir` : ce que le « ＋ » propose. */
async function choisirVideo(p, nom, octets, type = "video/webm", voir) {
  await p.locator(".pr-plein .pr-ecrire-plus").click();
  await p.waitForSelector('.pr-feuille-plus.ouverte .pr-plus-choix[data-plus="video"]', { timeout: 10000 });
  if (voir) voir(await p.locator(".pr-feuille-plus .pr-plus-choix").evaluateAll((l) => l.map((x) => x.dataset.plus)));
  const [choix] = await Promise.all([p.waitForEvent("filechooser", { timeout: 10000 }), p.locator('.pr-feuille-plus .pr-plus-choix[data-plus="video"]').click()]);
  await choix.setFiles({ name: nom, mimeType: type, buffer: octets });
  await p.waitForSelector(".pr-feuille-video.ouverte", { timeout: 10000 });
}
const impossible = (p, phrase) => attendre(p, (t) => (document.querySelector(".pr-feuille-video .vd-impossible")?.textContent ?? "") === t, phrase, 20000);

const lea = await tel(LEA);
const zoe = await tel(ZOE);
// (les dépôts au seau depuis le téléphone de Léa : on les compte)
const envois = [];
lea.on("request", (r) => {
  if (r.method() === "PUT" && r.url().includes("/storage/v1/object/upload/sign/")) envois.push(r.url());
});
await ouvrirAvec(lea, ZOE);
await ouvrirAvec(zoe, LEA);

// ═══ « ＋ » → 🎬 UNE VIDÉO : LA FEUILLE ═══
let choixPlus = [];
await choisirVideo(lea, "concert.webm", CONCERT, "video/webm", (l) => (choixPlus = l));
ok(choixPlus.slice(0, 2).join("|") === "photo|video", `« ＋ » : 📷 une photo, 🎬 une vidéo (${choixPlus.join(" · ")})`);
ok(await attendre(lea, () => Boolean(document.querySelector(".pr-feuille-video .vd-apercu video")?.getAttribute("poster")?.startsWith("data:image/jpeg")), null, 25000), "la feuille : sa vidéo, lue dans le téléphone, une de ses images en affiche");
ok((await texte(lea, ".pr-feuille-video .vd-apercu .vd-duree")) === "0:02", `sa durée, lue par le téléphone (un WebM qui ne la dit pas) : « ${await texte(lea, ".pr-feuille-video .vd-apercu .vd-duree")} »`);
await lea.locator(".pr-feuille-video .ph-legende").fill("Haha le concert hier soir");
const tetes = await lea.locator(".pr-feuille-video .ph-tetes button").evaluateAll((l) => l.map((x) => `${x.dataset.tete}${x.classList.contains("pris") ? "*" : ""}`));
ok(tetes.length === 3 && tetes[0] === "rire*", `une légende, trois têtes (« haha » : le rire d'abord) (${tetes.join(" · ")})`);
await lea.locator('.pr-feuille-video .ph-tetes button[data-tete="joie"]').click();
ok((await texte(lea, ".pr-feuille-video .ph-envoyer")) === "Envoyer à Zoé" && (await texte(lea, ".pr-feuille-video .pr-note")).includes("ne peut pas la montrer ailleurs"), "« Envoyer à Zoé » ; elle reste dans leur conversation");
await lea.screenshot({ path: `${D}/videos-1-feuille.png` });

// ═══ ELLE L'ENVOIE : CE QUI EST PARTI, LE FIL, LA SCÈNE ═══
await lea.evaluate(() => {
  const bouton = document.querySelector(".pr-feuille-video .ph-envoyer");
  window.__vus = [];
  new MutationObserver(() => window.__vus.push(bouton.textContent)).observe(bouton, { childList: true, subtree: true, characterData: true });
});
await lea.locator(".pr-feuille-video .ph-envoyer").click();
ok(await attendre(lea, () => !document.querySelector(".pr-feuille-video.ouverte") && Boolean(document.querySelector(".pr-plein .pr-fil li.vd-li.moi .vd-vignette img")), null, 25000), "envoyée : la feuille se ferme, la vignette dans le fil");
const vus = await lea.evaluate(() => window.__vus);
ok(vus.some((t) => /^Envoi… \d+ %$/.test(t)) && vus.includes("Vérification…") && envois.length === 1, `« Envoi… 0 % » (ce qui est parti), puis « Vérification… » ; un seul dépôt (${[...new Set(vus)].join(" → ")})`);
ok((await texte(lea, ".pr-plein .pr-fil li.vd-li.moi .vd-duree")) === "0:02" && (await compte(lea, ".pr-plein .pr-fil li.vd-li.moi .vd-lecture")) === 1, "dans le fil : ▶ et sa durée, « 0:02 »");
ok((await lea.locator(".pr-plein .pr-scene .fqp").first().getAttribute("data-lecture")) === "muet" && (await compte(lea, ".pr-plein .pr-scene .vd-cadre img")) === 1 && (await lea.locator(".pr-plein .pr-scene").getAttribute("data-tete")) === "joie", "sa figurine la montre dans un petit cadre (sa vignette, ▶), sans son, avec la joie");
ok((await texte(lea, ".pr-plein .pr-dit-ecrit")) === "« Haha le concert hier soir »" && (await texte(lea, ".pr-plein .pr-fil li.vd-li.moi .pr-ecrit-texte")) === "Haha le concert hier soir", "la légende : dans la bulle, et sous la vignette");
ok((await compte(lea, ".pr-plein .pr-fil li.vd-li.moi .pr-effacer")) === 1, "« 🗑️ Effacer » sous sa vidéo");
await lea.screenshot({ path: `${D}/videos-2-envoyee.png` });

// ═══ CHEZ ZOÉ : ELLE ARRIVE ; EN GRAND, AVEC LE SON ; GLISSER POUR FERMER ═══
ok(await attendre(zoe, () => Boolean(document.querySelector(".pr-plein .pr-fil li.vd-li.lui .vd-vignette img")), null, 25000), "chez Zoé, la vidéo arrive toute seule");
await zoe.locator(".pr-plein .pr-fil li.vd-li.lui button.vd-bulle").click();
await zoe.waitForSelector(".vd-grand video", { timeout: 10000 }).catch(() => null);
const lecteur = await zoe
  .locator(".vd-grand video")
  .evaluate((v) => ({ src: Boolean(v.currentSrc || v.src), controles: v.controls, muet: v.muted, liste: v.getAttribute("controlslist") ?? "" }))
  .catch(() => ({}));
ok(lecteur.src && lecteur.controles && !lecteur.muet && lecteur.liste.includes("nodownload") && (await texte(zoe, ".vd-grand .ph-grand-legende")) === "« Haha le concert hier soir »" && (await compte(zoe, ".vd-grand [download]")) === 0, "un toucher : en grand, avec le son, sa légende ; rien pour l'enregistrer");
ok(await attendre(zoe, () => (document.querySelector(".vd-grand video")?.readyState ?? 0) >= 2, null, 15000), "elle se lit (son adresse signée répond)");
await zoe.screenshot({ path: `${D}/videos-3-en-grand.png` });
const boite = await zoe.locator(".vd-grand").boundingBox();
await zoe.mouse.move(boite.x + 30, boite.y + 120);
await zoe.mouse.down();
await zoe.mouse.move(boite.x + 30, boite.y + 200, { steps: 4 });
await zoe.mouse.move(boite.x + 30, boite.y + 290, { steps: 4 });
await zoe.mouse.up();
ok(await attendre(zoe, () => !document.querySelector(".vd-grand")), "elle la fait glisser vers le bas : fermée");
ok(await attendre(zoe, () => Boolean(document.querySelector(".pr-plein .pr-scene .vd-cadre img"))), "puis la figurine de Léa la montre, dans son cadre");
ok((await compte(zoe, ".pr-plein .pr-fil li.vd-li .pr-effacer")) === 0, "rien à effacer chez Zoé (ce n'est pas la sienne)");

// ═══ CE QUI NE PART PAS, AVANT L'ENVOI (rien n'est déposé) ═══
const avant = envois.length;
await choisirVideo(lea, "longue.webm", LONGUE);
ok(await impossible(lea, "31 s : 30 secondes au plus"), "31 secondes : « 31 s : 30 secondes au plus », avant l'envoi");
ok((await texte(lea, ".pr-feuille-video .pr-bouton.grand")) === "Choisir une autre vidéo" && (await compte(lea, ".pr-feuille-video .ph-legende")) === 0, "« Choisir une autre vidéo »");
await lea.screenshot({ path: `${D}/videos-4-trop-longue.png` });
await lea.locator(".pr-feuille-video .pr-bouton.grand").click();
await attendre(lea, () => !document.querySelector(".pr-feuille-video.ouverte"));
await choisirVideo(lea, "lourde.mp4", Buffer.alloc(25 * 1024 * 1024 + 10), "video/mp4");
ok(await impossible(lea, "Cette vidéo est trop lourde : 25 Mo au plus."), "plus de 25 Mo : « Cette vidéo est trop lourde : 25 Mo au plus. »");
await lea.locator(".pr-feuille-video .pr-bouton.grand").click();
await attendre(lea, () => !document.querySelector(".pr-feuille-video.ouverte"));
await choisirVideo(lea, "film.avi", Buffer.from("RIFF....AVI "), "video/x-msvideo");
ok(await impossible(lea, "Ce format de vidéo n’est pas pris."), "un format qu'on ne prend pas : « Ce format de vidéo n'est pas pris. »");
await lea.locator(".pr-feuille-video .pr-bouton.grand").click();
await attendre(lea, () => !document.querySelector(".pr-feuille-video.ouverte"));
await choisirVideo(lea, "abimee.mp4", Buffer.from("ceci n'est pas une vidéo, seulement des mots"), "video/mp4");
ok(await impossible(lea, "Ce téléphone n’arrive pas à lire cette vidéo."), "une vidéo que le téléphone ne sait pas lire : « Ce téléphone n'arrive pas à lire cette vidéo. »");
await lea.locator(".pr-feuille-video .pr-bouton.grand").click();
await attendre(lea, () => !document.querySelector(".pr-feuille-video.ouverte"));
ok(envois.length === avant, "rien n'a été déposé pour elles");

// ═══ CE QUE LE SERVEUR REFUSE ═══
await choisirVideo(lea, "refusee.webm", REFUSEE);
await lea.waitForSelector(".pr-feuille-video .vd-apercu video", { timeout: 20000 }).catch(() => null);
await lea.locator(".pr-feuille-video .ph-envoyer").click();
ok(await impossible(lea, "Cette vidéo ne peut pas partir."), "la modération refuse une de ses images : « Cette vidéo ne peut pas partir. »");
ok((await texte(lea, ".pr-feuille-video .pr-bouton.grand")) === "Choisir une autre vidéo", "« Choisir une autre vidéo »");
await lea.screenshot({ path: `${D}/videos-5-refusee.png` });
await lea.locator(".pr-feuille-video .pr-bouton.grand").click();
ok(await attendre(lea, () => !document.querySelector(".pr-feuille-video.ouverte")) && (await compte(lea, ".pr-plein .pr-fil li.vd-li")) === 1, "fermée ; rien n'est parti");
await choisirVideo(lea, "panne.webm", PANNE);
await lea.waitForSelector(".pr-feuille-video .vd-apercu video", { timeout: 20000 }).catch(() => null);
await lea.locator(".pr-feuille-video .ph-envoyer").click();
await lea.waitForSelector(".pr-feuille-video .ph-erreur", { timeout: 20000 }).catch(() => null);
ok((await texte(lea, ".pr-feuille-video .ph-erreur")) === "La vidéo n’a pas pu être vérifiée. Réessaie dans un instant." && (await texte(lea, ".pr-feuille-video .ph-envoyer")) === "Réessayer", "la modération ne répond pas : elle ne part pas, « Réessayer »");
ok((await lister(`fils/${PAIRE}/v`)).some((n) => n.endsWith("-brut.webm")), "elle attend dans le seau (déposée, pas encore partie)");
const envoisAvant = envois.length;
await lea.locator(".pr-feuille-video .ph-envoyer").click();
await lea.waitForSelector(".pr-feuille-video .ph-envoyer:not([disabled])", { timeout: 20000 }).catch(() => null);
ok(envois.length === envoisAvant && (await texte(lea, ".pr-feuille-video .ph-erreur")).includes("Réessaie"), "réessayer : la même vidéo, sans la redéposer ; toujours pas vérifiée");
await lea.keyboard.press("Escape");
ok(await attendre(lea, () => !document.querySelector(".pr-feuille-video.ouverte") && Boolean(document.querySelector(".pr-plein"))), "Échap ferme la feuille, pas la conversation");

// ═══ 🗑️ LÉA EFFACE SA VIDÉO ═══
await lea.locator(".pr-plein .pr-fil li.vd-li.moi .pr-effacer").click();
await lea.waitForSelector(".fen .fen-oui", { timeout: 10000 }).catch(() => null);
await lea.locator(".fen .fen-oui").click();
ok(await attendre(lea, () => !document.querySelector(".pr-plein .pr-fil li.vd-li")), "Léa efface sa vidéo : partie de son fil");

// ═══ LA LIGNE DE LÉA, CHEZ ZOÉ (une vidéo qui dit sa durée) ═══
await choisirVideo(lea, "encore.webm", ENCORE);
await lea.waitForSelector(".pr-feuille-video .vd-apercu video", { timeout: 20000 }).catch(() => null);
await lea.locator(".pr-feuille-video .ph-legende").fill("Encore le concert");
await lea.locator(".pr-feuille-video .ph-envoyer").click();
ok(await attendre(lea, () => Boolean(document.querySelector(".pr-plein .pr-fil li.vd-li.moi")), null, 25000), "une vidéo qui dit sa durée : partie");
await zoe.locator(".pr-plein .pr-retour").first().click();
ok(await attendre(zoe, (c) => (document.querySelector(`#o-proches .pr-carte[data-cle="${c}"] .pr-dernier`)?.textContent ?? "").includes("🎬"), LEA.cle, 20000), "chez Zoé, dans « Proches », la ligne de Léa change");
const ligne = await texte(zoe, `#o-proches .pr-carte[data-cle="${LEA.cle}"] .pr-dernier`);
ok(ligne.startsWith("T’a envoyé : 🎬 Encore le concert"), `« T'a envoyé : 🎬 Encore le concert » (${ligne})`);

// ═══ PARTOUT ═══
for (const [nom, p] of [["Léa", lea], ["Zoé", zoe]]) {
  ok(p.err.length === 0, `${nom} : aucune erreur dans la page${p.err.length ? ` (${p.err[0]})` : ""}`);
  ok((await debordement(p)) <= 0, `${nom} : rien ne déborde`);
  ok(!/exemple/i.test(await p.evaluate(() => document.body.innerText)), `${nom} : jamais le mot interdit`);
}

await b.close();
console.log(echecs ? `${echecs} ÉCHEC(S)` : "Tout est bon.");
process.exit(echecs ? 1 : 0);
