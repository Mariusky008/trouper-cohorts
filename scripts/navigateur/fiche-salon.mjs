// ✨ LA FICHE D'UNE FIGURINE DANS UN SALON (25 novembre 2026, `docs/univers/fil.md`, section 10) — le propriétaire :
// « quand on clique sur une figurine dans le salon et que les options s'ouvrent, je veux qu'on voie la figurine telle
// qu'elle a été faite dans Ma maison, avec pancarte s'il y en a une ».
//
// Sam a préparé son double du jour (sa tête qui rit, sa pancarte), il vient depuis huit jours (🔥, l'auréole), le foot
// est sa passion du moment (l'écharpe), Léa lui a offert une surprise (le cœur). Il est au salon du foot. Léa y entre et
// touche sa figurine : sa fiche la montre en grand — sa tête du jour sur son corps, l'auréole, l'écharpe, le cœur et
// leurs étiquettes, sa pancarte au-dessus, le halo de Ma maison ; puis ses gestes, comme avant.
import sharp from "sharp";
import crypto from "node:crypto";
import { poserPiece } from "../piece-en-hauteur.mjs";
import { BASE, D, F, lancer } from "./commun.mjs";

const FAUX = F.replace("/rest/v1", "");
const STOCK = `${FAUX}/storage/v1/object`;
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lire = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.ok ? JSON.parse(Buffer.from(await r.arrayBuffer()).toString() || "null") : null;
};
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);
const empreinte = (chemin) => crypto.createHash("sha1").update(chemin).digest("hex").slice(0, 16);
const pause = (ms) => new Promise((fini) => setTimeout(fini, ms));

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
async function attendreQue(f, ms = 30000) {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    const v = await f().catch(() => null);
    if (v) return v;
    await pause(400);
  }
  return null;
}

const ADMIN = "00000000-0000-4000-8000-0000000ad001";
await semer("admins", [{ user_id: ADMIN }]);
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const session = { access_token: "faux-admin", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "faux", user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} } };

const qui = (n, prenom) => ({ id: `f1c4e5a1-0000-4000-8000-00000000fc0${n}`, jeton: `jeton-fiche-salon-nav-000${n}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
for (const x of [LEA, SAM]) x.cle = cleProfil(x.id);
await semer("human_habitants", [LEA, SAM].map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
const maintenant = new Date().toISOString();
// (sa figurine assise : 800 × 1 200, transparente — la tête, le cou, le corps et le fauteuil)
const assise = (couleur) =>
  sharp({ create: { width: 800, height: 1200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      {
        input: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200">
            <ellipse cx="400" cy="430" rx="130" ry="120" fill="${couleur}"/>
            <rect x="370" y="540" width="60" height="40" fill="${couleur}"/>
            <rect x="240" y="570" width="320" height="330" rx="30" fill="#5a3a2a"/>
          </svg>`,
        ),
        left: 0,
        top: 0,
      },
    ])
    .png()
    .toBuffer();
const fiche = (h) => ({ version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${h}/perso/v1/assise.png` } }, historique: [{ version: 1, le: maintenant, raison: "« C’est moi ! »", style: "collection-1" }] });
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
for (const [x, couleur] of [
  [LEA, "#c8643c"],
  [SAM, "#3c8cc8"],
]) {
  await deposer(`${x.id}/perso/v1/assise.png`, await assise(couleur), "image/png");
  await json(`${x.id}/perso/v1/fiche.json`, fiche(x.id));
  await json(`${x.id}/perso/fiche.json`, fiche(x.id));
  await deposer(`${x.id}/neutre-essai.png`, PNG, "image/png");
  await json(`profils/${x.cle}.json`, { h: x.id });
  await json(`${x.id}/majeur.json`, { age: 30, adulte: true, le: maintenant });
  await json(`${x.id}/passions.json`, { passions: ["foot", "cuisine", "animaux"], poids: {}, le: maintenant });
}
await semer(
  "clik_ma_figurine",
  [LEA, SAM].map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, neutre: `${x.id}/neutre-essai.png`, parle: `${x.id}/neutre-essai.png`, prete_le: maintenant })),
);
await poserPiece(deposer, "salon", { le: maintenant });
const nuit = await (await fetch(`${BASE}/api/cron/decouvrir-selection`)).json();
ok(nuit.faites?.length > 0, "la nuit est passée (la télé des salons)");

const appel = async (q, chemin, corps) => {
  const r = await fetch(`${BASE}${chemin}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${q.jeton}` }, body: JSON.stringify(corps) } : { headers: { cookie: `clikme_habitant=${q.jeton}` } });
  return { statut: r.status, corps: await r.json().catch(() => null) };
};

// ═══ SAM : SES EXPRESSIONS, SON DOUBLE DU JOUR, CE QU'IL PORTE ═══
const K = empreinte(`${SAM.id}/perso/v1/assise.png`);
ok((await appel(SAM, "/api/direct/ma-figurine")).statut === 200, "Sam ouvre l'appli");
const etat = await attendreQue(async () => {
  const e = await lire(`${SAM.id}/calques/${K}-expressions.json`);
  return e?.le && e.tetes?.rire ? e : null;
}, 90000);
ok(Boolean(etat?.tetes?.rire), "ses expressions sont prêtes");
const PANCARTE = "Qui vient voir le match ?";
ok((await appel(SAM, "/api/direct/mon-double", { action: "tete", e: "rire" })).statut === 200, "son double du jour : la tête qui rit");
ok((await appel(SAM, "/api/direct/mon-double", { action: "pancarte", texte: PANCARTE })).statut === 200, `… sa pancarte : « ${PANCARTE} »`);
const jourDe = (ms) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date(ms));
await json(`${SAM.id}/presence.json`, { jours: [7, 6, 5, 4, 3, 2, 1, 0].map((n) => jourDe(Date.now() - n * 86_400_000)) });
await json(`${SAM.id}/mes-salons.json`, { themes: { foot: { n: 3, dernier: Date.now() - 3600_000 } } });
await json(`${SAM.id}/coeur.json`, { prenom: "Léa", sorte: "surprise", le: new Date().toISOString() });
const entree = await appel(SAM, "/api/direct/salons-ouverts", { action: "entrer", theme: "foot" });
const qSam = entree.corps?.ouverture?.moi;
ok(entree.statut === 200 && Boolean(qSam), "Sam est au salon du foot");

// ═══ LÉA ENTRE, ET TOUCHE SA FIGURINE ═══
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer();
const erreurs = [];
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
await ctx.addCookies([
  { name: "clikme_habitant", value: LEA.jeton, url: BASE },
  { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE },
]);
await ctx.route("https://www.youtube.com/iframe_api", (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: "window.YT={Player:function(){}};" }));
await ctx.route(/^https:\/\/i\.ytimg\.com\//, (r) => r.fulfill({ status: 200, contentType: "image/png", body: PNG }));
// (le faux moteur d'images rend des images transparentes : pour que la capture montre quelque chose, son corps et sa tête
// du jour sont redessinés ici — un corps dans son fauteuil, une tête qui rit)
const dessin = (l, h, svg) => sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${l}" height="${h}">${svg}</svg>`)).png().toBuffer();
const samIci = entree.corps?.ouverture?.presents?.find((x) => x.q === qSam);
const chemin = (u) => (u ? new URL(u, BASE).pathname : "");
const CORPS = await dessin(800, 1200, `<rect x="370" y="540" width="60" height="40" fill="#e9b48a"/><rect x="240" y="570" width="320" height="330" rx="30" fill="#3c8cc8"/><rect x="180" y="760" width="440" height="300" rx="40" fill="#7a4a34"/>`);
const TETE = await dessin(400, 400, `<ellipse cx="200" cy="200" rx="185" ry="185" fill="#e9b48a"/><path d="M60 120 Q200 -20 340 120 L340 90 Q200 -60 60 90Z" fill="#3b2418"/><circle cx="140" cy="180" r="18" fill="#2a1a10"/><circle cx="260" cy="180" r="18" fill="#2a1a10"/><path d="M110 250 Q200 350 290 250Z" fill="#7a1f2a"/>`);
if (samIci?.tete) {
  await ctx.route((u) => u.pathname === chemin(samIci.tete.corps), (r) => r.fulfill({ status: 200, contentType: "image/png", body: CORPS }));
  await ctx.route((u) => u.pathname === chemin(samIci.tete.src), (r) => r.fulfill({ status: 200, contentType: "image/png", body: TETE }));
}
const lea = await ctx.newPage();
lea.on("pageerror", (e) => erreurs.push(String(e)));
lea.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && erreurs.push(m.text()));
const attendre = async (f, ms = 15000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f().catch(() => false)) return true;
    await lea.waitForTimeout(150);
  }
  return false;
};
const texte = async (loc) => (await loc.innerText().catch(() => "")).replace(/\s+/g, " ").trim();

await lea.goto(`${BASE}/univers/salons?theme=foot`, { waitUntil: "domcontentloaded" });
const figSam = lea.locator(`.so-fig[data-q="${qSam}"]`);
ok(await attendre(async () => (await figSam.count()) === 1, 30000), "Léa entre : Sam est là");
ok(await attendre(async () => (await figSam.locator("[data-tete-du-jour]").count()) === 1 && (await figSam.locator("[data-pancarte]").count()) === 1), "… dans le salon, sa tête du jour et sa pancarte (comme avant)");
await figSam.click({ force: true });
const f = lea.locator(`[data-fiche="${qSam}"]`);
ok(await attendre(async () => (await f.count()) === 1), "toucher sa figurine : sa fiche s'ouvre");
const grande = f.locator("[data-figurine-fiche]");
ok((await grande.getAttribute("data-figurine-fiche")) === "calques", "✨ sa figurine en grand, comme dans Ma maison : son corps et sa tête du jour");
ok((await grande.locator(".so-jour-tete").getAttribute("src")) === etat?.tetes?.rire, "… la tête qu'il a choisie pour aujourd'hui (il rit)");
ok((await texte(grande.locator("[data-pancarte]"))) === PANCARTE, `… sa pancarte au-dessus : « ${PANCARTE} »`);
const orn = (await grande.locator("[data-ornements]").getAttribute("data-ornements").catch(() => "")) ?? "";
ok(/aureole/.test(orn) && /foot/.test(orn) && /coeur/.test(orn), `… ce qu'il porte toute seule : l'auréole, l'écharpe du foot, le cœur (${orn})`);
ok(/🔥\s*8/.test(await texte(grande.locator(".orn-serie"))) && /offert par Léa/.test(await texte(grande.locator(".orn-souvenir"))), "… et leurs étiquettes : « 🔥 8 », « 🎁 offert par Léa »");
ok((await grande.locator(".so-halo").count()) === 1, "… le halo de Ma maison");
const boite = await grande.boundingBox();
ok(boite && boite.height >= 160, `… en grand (${Math.round(boite?.height ?? 0)} pt de haut)`);
// (rien ne déborde de la feuille : la pancarte au-dessus, l'étiquette du cœur dessous, le nom après)
const feuille = await lea.locator(".so-feuille").boundingBox();
const pancarte = await grande.locator("[data-pancarte]").boundingBox();
const souvenir = await grande.locator(".orn-souvenir").boundingBox();
const nom = await f.locator("h2").boundingBox();
ok(feuille && pancarte && pancarte.y >= feuille.y + 4, "… la pancarte tient dans la feuille");
ok(souvenir && nom && souvenir.y + souvenir.height <= nom.y + 1, "… l'étiquette du cœur ne cache pas son prénom");
ok((await texte(f.locator("h2"))) === "Sam" && (await lea.locator("[data-geste]").count()) >= 3 && (await lea.locator("[data-ajouter-proche]").count()) === 1, "dessous, comme avant : son prénom, les gestes, « 👯 Ajouter en proche »");
await lea.waitForTimeout(500);
await lea.screenshot({ path: `${D}/fiche-salon-1-sam.png` });
// (un geste depuis sa fiche : elle se ferme, comme avant)
await lea.locator("[data-geste]").first().click();
ok(await attendre(async () => (await f.count()) === 0), "un geste : sa fiche se ferme");
ok(!erreurs.length, `aucune erreur${erreurs.length ? ` : ${erreurs.slice(0, 3).join(" | ")}` : ""}`);

await b.close();
if (echecs) {
  console.log(`\n${echecs} ÉCHEC(S)`);
  process.exit(1);
}
console.log("\nTout est bon.");
