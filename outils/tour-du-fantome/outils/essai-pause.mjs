// La pause (tour-pause.py) : dans l'intro, puis pendant que Mike parle au comptoir (étape « creux »), on fige
// la page, on attend, et rien ne doit avoir bougé (mots écrits, son, animations, films) ; on reprend, et la
// scène continue là où elle s'était arrêtée. Captures avant, pendant et après.
//   node essai-pause.mjs <sortie> [tour] [WxH] [safari]
// « safari » rejoue ce qui arrive sur Safari : mettre en pause une animation en boucle lève une erreur, et (pire cas)
// la suspension du contexte audio ne coupe rien. La voix doit s'arrêter quand même, et le voile s'afficher.
import pw from "/opt/node22/lib/node_modules/playwright/index.js";
import fs from "node:fs";
// le dossier du tour du fantôme (celui qui contient tour/, tour-coiffure/…), servi en local sur le port 8790
const RACINE = new URL("../", import.meta.url).pathname;
const [D, dossier = "tour", taille = "414x747", mode = ""] = process.argv.slice(2);
const safari = mode === "safari";
const [W, H] = taille.split("x").map(Number);
const b = await pw.chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--autoplay-policy=no-user-gesture-required"] });
const c = await b.newContext({ viewport: { width: W, height: H }, isMobile: W < 700, hasTouch: W < 700, deviceScaleFactor: 2 });
const p = await c.newPage();
const err = [];
p.on("pageerror", (e) => err.push(e.message.slice(0, 300)));
await p.route(/\/index\.html$/, (r) => r.fulfill({ status: 200, contentType: "text/html; charset=utf-8",
  body: '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' + fs.readFileSync(RACINE + new URL(r.request().url()).pathname.replace(/^\//, ""), "utf8")
    .replace("  /* ═══ PAGE 1 → PAGE 2 ═══ */", "  window.__va = (v, id) => { changer(v); aller(DEMOS[v].moments.findIndex((m) => m.id === id)); }; window.__son = () => (ac ? ac.state : \"aucun\"); window.__voix = () => (typeof voixEnCours !== \"undefined\" && voixEnCours ? { gel: voixEnCours.gel, fini: voixEnCours.fini } : null);\n  /* ═══ PAGE 1 → PAGE 2 ═══ */") }));
const etat = (sel) => p.evaluate((s) => ({
  mots: (document.querySelector(s) || {}).textContent || "",
  son: window.__son(),
  voix: window.__voix(),
  anim: document.getAnimations().filter((a) => a.playState === "running" && a.playbackRate !== 0 && !(a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest("#gel"))).length,
  films: [...document.querySelectorAll("video")].filter((v) => !v.paused).length,
  voile: !document.querySelector("#gel").hidden,
}), sel);
const photo = (nom) => p.screenshot({ path: `${D}/${dossier}-pause-${nom}.png` });
const ok = [];
const verifier = (quoi, cond) => { ok.push(`${cond ? "✓" : "✗"} ${quoi}`); };

if (safari) await p.addInitScript(() => {
  const P = Animation.prototype.pause;
  Animation.prototype.pause = function () {
    const t = this.effect && this.effect.getTiming ? this.effect.getTiming() : {};
    if (t.iterations === Infinity) throw new DOMException("comme Safari", "InvalidStateError");
    return P.call(this);
  };
  AudioContext.prototype.suspend = function () { return Promise.resolve(); };
});
await p.goto(`http://127.0.0.1:8790/${dossier}/index.html`, { waitUntil: "load" });
await p.locator("#decouvrir").waitFor({ state: "visible", timeout: 20000 });
await p.waitForTimeout(600);
await p.click("#decouvrir", { force: true });

// 1. L'INTRO : le fantôme parle (l'intro s'ouvre après le film d'accueil)
// pendant le film d'ouverture, la page peut ignorer l'appui : on retouche « Découvrez » si l'intro ne s'ouvre pas
for (let k = 0; k < 3 && !(await p.locator("#intro-pause").isVisible()); k++) {
  try { await p.locator("#intro-pause").waitFor({ state: "visible", timeout: 7000 }); } catch (e) { await p.click("#decouvrir", { force: true }).catch(() => {}); }
}
try { await p.locator("#intro-pause").waitFor({ state: "visible", timeout: 10000 }); }
catch (e) { await photo("0-pas-d-intro"); console.log("l'intro ne s'ouvre pas :", err.join(" | ") || "aucune erreur de page"); await b.close(); process.exit(1); }
await p.waitForTimeout(4000);
await p.click("#intro-pause");
await p.waitForTimeout(300);
const i1 = await etat("#intro-dit"); await photo("1-intro-pause");
await p.waitForTimeout(4000);
const i2 = await etat("#intro-dit");
verifier("intro : le voile est là", i1.voile);
verifier(`intro : les mots ne bougent plus (« ${i1.mots.slice(-30)} »)`, i1.mots === i2.mots);
verifier(`intro : sa voix est arrêtée (son ${i2.son}, voix ${JSON.stringify(i2.voix)})`, (safari || i2.son !== "running") && (!i2.voix || i2.voix.fini || i2.voix.gel != null));
verifier(`intro : plus aucune animation (${i2.anim})`, i2.anim === 0);
verifier(`intro : plus aucun film en lecture (${i2.films})`, i2.films === 0);
await p.click("#gel-reprendre");
await p.waitForTimeout(3000);
const i3 = await etat("#intro-dit"); await photo("2-intro-reprise");
verifier(`intro : ça reprend (son ${i3.son}, ${i3.anim} animations)`, !i3.voile && i3.anim > 0 && (i3.mots !== i2.mots || i3.son === "running"));

// 2. LE COMPTOIR : Mike parle sur sa fiche
try { await p.locator("#intro-passer").waitFor({ state: "visible", timeout: 9000 }); await p.click("#intro-passer", { force: true }); }
catch (e) { await p.evaluate(() => document.querySelector("#intro-passer") && document.querySelector("#intro-passer").click()); }
await p.waitForFunction(() => document.querySelector("#accueil").hidden, null, { timeout: 20000 });
await p.waitForTimeout(800);
// les tours sans comptoir de Mike (librairie, bijouterie, lunetier) : la première étape de la démo
const mike = await p.evaluate(() => !!document.querySelector("#mk-fiche"));
if (!mike) {
  await p.waitForTimeout(2500);
  await p.click("#pause"); await p.waitForTimeout(300);
  const d1 = await etat("#bulle"); await photo("3-demo-pause");
  await p.waitForTimeout(4000);
  const d2 = await etat("#bulle");
  verifier("démo : le voile est là", d1.voile);
  verifier(`démo : sa voix est arrêtée (son ${d2.son}, voix ${JSON.stringify(d2.voix)})`, (safari || d2.son !== "running") && (!d2.voix || d2.voix.fini || d2.voix.gel != null));
  verifier(`démo : plus aucune animation (${d2.anim})`, d2.anim === 0);
  await p.click("#gel-reprendre"); await p.waitForTimeout(2500);
  const d3 = await etat("#bulle"); await photo("4-demo-reprise");
  verifier(`démo : ça reprend (son ${d3.son}, ${d3.anim} animations)`, !d3.voile && d3.anim > 0);
  console.log(dossier, "\n" + ok.join("\n"), "\n" + (err.length ? "ERREURS : " + err.join(" | ") : "aucune erreur"));
  await b.close();
  process.exit(0);
}
await p.evaluate(() => __va("clients", "creux"));
await p.waitForTimeout(4200);
await p.click("#pause");
await p.waitForTimeout(300);
const m1 = await etat(".mk-f-dit"); await photo("3-mike-pause");
await p.waitForTimeout(5000);
const m2 = await etat(".mk-f-dit");
verifier("comptoir : le voile est là", m1.voile);
verifier(`comptoir : ses mots ne bougent plus (« ${m1.mots.slice(-30)} »)`, m1.mots.length > 0 && m1.mots === m2.mots);
verifier(`comptoir : sa voix est arrêtée (son ${m2.son}, voix ${JSON.stringify(m2.voix)})`, (safari || m2.son !== "running") && m2.voix && m2.voix.gel != null);
verifier(`comptoir : plus aucune animation (${m2.anim})`, m2.anim === 0);
// un appui ailleurs que sur « Reprendre » ne fait rien
await p.mouse.click(W / 2, H / 3);
await p.waitForTimeout(600);
const m3 = await etat(".mk-f-dit");
verifier("comptoir : un appui sur le voile ne relance rien", m3.voile && m3.mots === m2.mots);
await p.click("#gel-reprendre");
await p.waitForTimeout(2500);
const m4 = await etat(".mk-f-dit"); await photo("4-mike-reprise");
verifier(`comptoir : il reprend sa phrase (« ${m4.mots.slice(-30)} »)`, !m4.voile && m4.mots.length > m2.mots.length && m4.mots.startsWith(m2.mots.trim()));
// la fiche finit, se range, la conversation commence
await p.waitForTimeout(9000);
const fin = await p.evaluate(() => ({ fiche: document.querySelector("#mk-fiche").hidden, fil: document.querySelector("#mk-fil").textContent }));
await photo("5-conversation");
verifier(`comptoir : la conversation commence après la reprise (« ${fin.fil.slice(0, 40)} »)`, fin.fiche && /Mardi/.test(fin.fil));
// au clavier : Espace fige, Espace relance
await p.keyboard.press("Space"); await p.waitForTimeout(300);
const k1 = await etat(".mk-f-dit");
await p.keyboard.press("Space"); await p.waitForTimeout(300);
const k2 = await etat(".mk-f-dit");
verifier("clavier : Espace fige puis relance", k1.voile && !k2.voile);

console.log(dossier, "\n" + ok.join("\n"), "\n" + (err.length ? "ERREURS : " + err.join(" | ") : "aucune erreur"));
await b.close();
