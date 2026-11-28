// 🙂 L'HUMEUR DU JOUR, C'EST LA TÊTE DE SA FIGURINE (`docs/univers/ma-maison.md`, section 27 ; 22 novembre 2026, le
// propriétaire : « mon humeur du jour, lorsque je la renseigne, devrait être la tête que je fais dans ma maison, et un
// peu partout où on voit ma tête » ; puis : « ajoute deux expressions effectivement ! ») — sur un iPhone, contre le faux
// Supabase et le faux moteur d'image.
//
// Léa a sa figurine assise du nouveau style ; elle ouvre l'appli : ses SEPT expressions se font (les cinq, puis 😢 la
// tristesse et 😠 la colère). Son humeur du jour : la tristesse. Chez elle, sa figurine fait la tête triste (son corps
// sans sa tête, l'expression dans la boîte de sa tête ; le médaillon aussi) ; Sam, son proche, la voit pareille en
// visite ; dans leur messagerie, sa tête est la triste (à gauche chez elle, à droite chez Sam) ; dans sa télé du jour, sa
// figurine vivante la porte quand rien d'autre ne la change. Elle passe à la colère : la tête fâchée. Son humeur d'hier :
// sa figurine habituelle. Une figurine qui n'en avait que cinq : seules les deux nouvelles se font. Ni erreur, ni le mot
// « exemple ».
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
const effacer = (chemins) => fetch(`${STOCK}/figurines-clients`, { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ prefixes: chemins }) });
const expressionsIA = async () => (await (await fetch(`${FAUX}/__ia`)).json()).filter((c) => typeof c === "string" && c.startsWith("IMAGE ") && c.includes("The head keeps EXACTLY the same position"));
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

// (« Ma maison » n'est encore ouverte qu'à l'administrateur, ici : Léa l'est, comme dans les autres essais de sa maison)
const ADMIN = "00000000-0000-4000-8000-0000000ad001";
await semer("admins", [{ user_id: ADMIN }]);
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const session = { access_token: "faux-admin", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "faux", user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} } };

const qui = (n, prenom) => ({ id: `4a150a15-0000-4000-8000-00000000ee0${n}`, jeton: `jeton-ma-maison-humeur-000${n}`, prenom });
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
}
await semer(
  "clik_ma_figurine",
  [LEA, SAM].map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, neutre: `${x.id}/neutre-essai.png`, parle: `${x.id}/neutre-essai.png`, prete_le: maintenant })),
);
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
await poserPiece(deposer, "salon", {
  fond: "#4a5a6e",
  sol: "#6a5040",
  le: maintenant,
  emplacements: {
    tele: [0.32, 0.2, 0.36, 0.15],
    etagere: [0.76, 0.1, 0.2, 0.34],
    cadres: [[0.06, 0.44, 0.1, 0.09]],
    table: [0.44, 0.78, 0.14, 0.05],
    places: [
      { x: 0.3, y: 0.86, hauteur: 0.3 },
      { x: 0.7, y: 0.86, hauteur: 0.3 },
    ],
  },
});
await json(`${LEA.id}/ma-piece/piece.json`, { piece: "salon", le: maintenant });
await json(`${LEA.id}/ma-piece/vu.json`, { le: Date.now() });
const jour = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
const humeur = (visage, j = jour) => json(`${LEA.id}/humeur.json`, { jour: j, visage, le: new Date().toISOString() });
const get = async (chemin, q) => {
  const r = await fetch(`${BASE}${chemin}`, { headers: { cookie: `clikme_habitant=${q.jeton}` } });
  return { statut: r.status, corps: await r.json().catch(() => null) };
};

// ═══ LÉA OUVRE L'APPLI : SES SEPT EXPRESSIONS ═══
const K = empreinte(`${LEA.id}/perso/v1/assise.png`);
const SEPT = ["sourire", "rire", "surprise", "bof", "grimace", "triste", "fache"];
const ADRESSE = /^\/api\/direct\/salon\/fichier\/[0-9a-f]{32}-\d+\.webp$/;
const avant = (await expressionsIA()).length;
ok((await get("/api/direct/ma-figurine", LEA)).statut === 200, "Léa ouvre l'appli");
const etat = await attendreQue(async () => {
  const e = await lire(`${LEA.id}/calques/${K}-expressions.json`);
  return e?.le ? e : null;
}, 90000);
ok(SEPT.every((e) => ADRESSE.test(etat?.tetes?.[e] ?? "")), `ses sept expressions, à adresse stable (${Object.keys(etat?.tetes ?? {}).join(", ")})`);
const faites = (await expressionsIA()).slice(avant);
ok(faites.length === 8 && faites.some((c) => c.includes("TALKING")) && faites.some((c) => c.includes("SAD") && c.includes("no tears running")) && faites.some((c) => c.includes("GRUMPY") && c.includes("never scary")), `huit demandes au moteur : la tristesse et la colère comprises, tendres, et la bouche ouverte (${faites.length})`);

// ═══ SON HUMEUR DU JOUR : LA TRISTESSE ═══
await humeur("tristesse");
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer();
const erreurs = [];
const tel = async (q, admin = false) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: IPHONE, isMobile: true, hasTouch: true });
  await ctx.addCookies([{ name: "clikme_habitant", value: q.jeton, url: BASE }, ...(admin ? [{ name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE }] : [])]);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(String(e)));
  p.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && erreurs.push(m.text()));
  return p;
};
const attendre = async (p, f, ms = 15000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f().catch(() => false)) return true;
    await p.waitForTimeout(120);
  }
  return false;
};
const charge = (p, img) => p.evaluate((x) => (x ? x.complete && x.naturalWidth > 0 : false), img);

const lea = await tel(LEA, true);
await lea.goto(`${BASE}/univers/maison`, { waitUntil: "domcontentloaded" });
const chez = lea.locator('.mmc-scene[data-piece="salon"]');
const figJour = chez.locator('.mmc-fig [data-tete-du-jour="triste"]');
ok(await attendre(lea, async () => (await figJour.count()) === 1), "chez elle : sa figurine fait la tête de son humeur, la tristesse");
const [teteSrc, corpsSrc] = await Promise.all([figJour.locator("img.mmc-fig-tete").getAttribute("src"), figJour.locator("img:not(.mmc-fig-tete)").getAttribute("src")]);
ok(teteSrc === etat?.tetes?.triste && ADRESSE.test(corpsSrc ?? ""), "… l'expression triste, posée sur son corps sans sa tête");
ok(await attendre(lea, async () => (await charge(lea, await figJour.locator("img.mmc-fig-tete").elementHandle())) && (await charge(lea, await figJour.locator("img:not(.mmc-fig-tete)").elementHandle()))), "… les deux images se chargent");
// (28/11) les deux boîtes d'un seul coup, dans la même image : la figurine saute en arrivant (0,5 s) puis respire, et deux
// mesures séparées tombaient sur deux moments du saut (la tête « au-dessus » de sa figurine de 1,7 px)
const [bf, bt] = await figJour.evaluate((f) => {
  const r = (e) => { const b = e?.getBoundingClientRect(); return b ? { x: b.x, y: b.y, width: b.width, height: b.height } : null; };
  return [r(f), r(f.querySelector("img.mmc-fig-tete"))];
});
ok(bf && bt && bt.width > 10 && bt.y >= bf.y - 1 && bt.y + bt.height < bf.y + bf.height * 0.75 && Math.abs(bt.x + bt.width / 2 - (bf.x + bf.width / 2)) < bf.width * 0.2, `… la tête en haut de sa figurine, au milieu (${JSON.stringify({ bf, bt })})`);
ok((await chez.locator(".mmc-medaillon img.du-jour").getAttribute("src")) === etat?.tetes?.triste, "… le médaillon de l'en-tête aussi");
ok(/😢/.test(await chez.locator("[data-humeur]").innerText()), "… et son humeur, écrite à côté");
await lea.waitForTimeout(400);
await lea.screenshot({ path: `${D}/ma-maison-humeur-1-triste.png` });

// ═══ SAM, EN VISITE ═══
const sam = await tel(SAM);
await sam.goto(`${BASE}/univers/chez/${LEA.cle}?piece=1`, { waitUntil: "domcontentloaded" });
const scene = sam.locator('.mmc-visite[data-visite="ouvert"] .mmc-scene');
ok(await attendre(sam, async () => (await scene.locator('.mmc-fig [data-tete-du-jour="triste"] img.mmc-fig-tete').getAttribute("src")) === etat?.tetes?.triste), "Sam, son proche, en visite : la même tête triste");
ok((await scene.locator(".mmc-porte .mmc-medaillon img.du-jour").getAttribute("src").catch(() => null)) === etat?.tetes?.triste, "… dès la porte, dans le médaillon");

// ═══ LEUR MESSAGERIE ═══
const chezElle = await get(`/api/direct/proches?ouvrir=${SAM.cle}`, LEA);
const chezLui = await get(`/api/direct/proches?ouvrir=${LEA.cle}`, SAM);
ok(chezElle.corps?.ouverture?.scene?.calques?.a?.tete?.fichier === etat?.tetes?.triste, `la messagerie, chez elle : sa tête est la triste (à gauche)`);
ok(chezLui.corps?.ouverture?.scene?.calques?.b?.tete?.fichier === etat?.tetes?.triste, "… chez Sam : la sienne à droite, triste aussi");

// ═══ SA TÉLÉ DU JOUR ═══
const viv = (await get("/api/direct/tele-du-jour?vivante=1", LEA)).corps?.vivante;
ok(viv?.humeur === "triste" && viv.expressions?.triste === etat?.tetes?.triste && viv.expressions?.fache === etat?.tetes?.fache, "sa figurine vivante (la télé du jour, la séance) : la tristesse, quand rien d'autre ne change sa tête");

// ═══ ELLE PASSE À LA COLÈRE ═══
await humeur("colere");
await lea.reload({ waitUntil: "domcontentloaded" });
ok(await attendre(lea, async () => (await chez.locator('.mmc-fig [data-tete-du-jour="fache"] img.mmc-fig-tete').getAttribute("src")) === etat?.tetes?.fache), "elle passe à la colère : la tête fâchée");
await lea.waitForTimeout(400);
await lea.screenshot({ path: `${D}/ma-maison-humeur-2-fache.png` });
ok((await get(`/api/direct/proches?ouvrir=${SAM.cle}`, LEA)).corps?.ouverture?.scene?.calques?.a?.tete?.fichier === etat?.tetes?.fache, "… dans la messagerie aussi");

// ═══ SON HUMEUR D'HIER ═══
await humeur("tristesse", "2000-01-01");
await lea.reload({ waitUntil: "domcontentloaded" });
ok(await attendre(lea, async () => (await chez.locator(".mmc-fig img").count()) === 1 && (await chez.locator("[data-tete-du-jour]").count()) === 0), "son humeur d'hier : sa figurine habituelle, d'une seule image");
const habituelle = (await get(`/api/direct/proches?ouvrir=${SAM.cle}`, LEA)).corps?.ouverture?.scene?.calques?.a?.tete?.fichier;
ok(habituelle && !Object.values(etat?.tetes ?? {}).includes(habituelle), "… et sa tête habituelle dans la messagerie");

// ═══ UNE FIGURINE QUI N'EN AVAIT QUE CINQ ═══
const cinq = Object.fromEntries(Object.entries(etat?.tetes ?? {}).filter(([e]) => e !== "triste" && e !== "fache"));
await json(`${LEA.id}/calques/${K}-expressions.json`, { ...etat, tetes: cinq, le: undefined });
await effacer(["triste", "fache"].flatMap((e) => [`${LEA.id}/calques/${K}-expression-${e}.png`, `${LEA.id}/calques/${K}-tete-${e}.png`]));
const n = (await expressionsIA()).length;
await get("/api/direct/ma-figurine", LEA);
const rattrape = await attendreQue(async () => {
  const e = await lire(`${LEA.id}/calques/${K}-expressions.json`);
  return e?.le && e.tetes?.triste && e.tetes?.fache ? e : null;
}, 60000);
const deux = (await expressionsIA()).slice(n);
ok(Boolean(rattrape) && deux.length === 2 && deux.some((c) => c.includes("SAD")) && deux.some((c) => c.includes("GRUMPY")) && rattrape.tetes.sourire === etat?.tetes?.sourire, `une figurine qui n'en avait que cinq : seules la tristesse et la colère se font (${deux.length} demandes)`);

for (const p of [lea, sam]) ok(!/exemple/i.test(await p.evaluate(() => document.body.innerText)), "jamais le mot « exemple »");
ok(!erreurs.length, `aucune erreur${erreurs.length ? ` : ${erreurs.slice(0, 3).join(" | ")}` : ""}`);

await b.close();
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
