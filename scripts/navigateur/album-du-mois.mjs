// 🗂️ « MA COLLECTION » (`docs/univers/ma-figurine.md`, lot 5) — sur un iPhone, contre le faux Supabase.
//
// Léa a sa figurine, et trois figurines du mois déjà là : le mois dernier, celui d'avant, et un mois de l'an dernier.
// Dans « Mon double du jour », onglet « 🗓️ Du mois » : sous sa figurine de ce mois-ci, « 🗂️ Ma collection » aligne les
// douze mois de chaque année en cartes — ses cartes, le mois en cours avec ses vrais jours, les mois passés vides, les
// mois à venir avec leur thème. Elle touche une carte : elle s'ouvre en grand, avec sa phrase du mois et « 🎭 Fais-la
// parler » ; « Fermer ». Rien ne déborde, ni erreur, ni le mot « exemple ».
import sharp from "sharp";
import crypto from "node:crypto";
import { poserPiece } from "../piece-en-hauteur.mjs";
import { BASE, D, F, lancer } from "./commun.mjs";

const FAUX = F.replace("/rest/v1", "");
const STOCK = `${FAUX}/storage/v1/object`;
const semer = (t, l) =>
  fetch(`${F}/${t}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(l),
  });
const deposer = (chemin, corps, type) =>
  fetch(`${STOCK}/figurines-clients/${chemin}`, {
    method: "POST",
    headers: { "content-type": type },
    body: corps,
  });
const json = (chemin, x) =>
  deposer(chemin, JSON.stringify(x), "application/json");
const cleProfil = (h) =>
  crypto
    .createHash("sha256")
    .update(`clikme-profil:${h}`)
    .digest("hex")
    .slice(0, 16);

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

// (« Ma maison » n'est encore ouverte qu'à l'administrateur, ici : Léa l'est, comme dans les autres essais de sa maison)
const ADMIN = "00000000-0000-4000-8000-0000000ad001";
await semer("admins", [{ user_id: ADMIN }]);
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const session = {
  access_token: "faux-admin",
  token_type: "bearer",
  expires_in: 86400,
  expires_at: Math.floor(Date.now() / 1000) + 86400,
  refresh_token: "faux",
  user: {
    id: ADMIN,
    aud: "authenticated",
    role: "authenticated",
    email: "admin@example.invalid",
    app_metadata: {},
    user_metadata: {},
  },
};

const qui = (n, prenom) => ({
  id: `1d0b1e00-0000-4000-8000-00000000ee0${n}`,
  jeton: `jeton-image-double-000${n}`,
  prenom,
});
const LEA = qui(1, "Léa");
for (const x of [LEA]) x.cle = cleProfil(x.id);
await semer(
  "human_habitants",
  [LEA].map((x) => ({
    id: x.id,
    device_token: x.jeton,
    prenom: x.prenom,
    ville_slug: "dax",
  })),
);
const maintenant = new Date().toISOString();
// (sa figurine assise : 800 × 1 200, transparente — la tête, le cou, le corps et le fauteuil)
const assise = (couleur) =>
  sharp({
    create: {
      width: 800,
      height: 1200,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
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
const fiche = (h) => ({
  version: 1,
  style: "collection-1",
  creee_le: maintenant,
  validee_le: maintenant,
  references: { assise: { chemin: `${h}/perso/v1/assise.png` } },
  historique: [
    {
      version: 1,
      le: maintenant,
      raison: "« C’est moi ! »",
      style: "collection-1",
    },
  ],
});
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
for (const [x, couleur] of [[LEA, "#c8643c"]]) {
  await deposer(
    `${x.id}/perso/v1/assise.png`,
    await assise(couleur),
    "image/png",
  );
  await json(`${x.id}/perso/v1/fiche.json`, fiche(x.id));
  await json(`${x.id}/perso/fiche.json`, fiche(x.id));
  await deposer(`${x.id}/neutre-essai.png`, PNG, "image/png");
  await json(`profils/${x.cle}.json`, { h: x.id });
}
await semer(
  "clik_ma_figurine",
  [LEA].map((x) => ({
    habitant_id: x.id,
    prenom: x.prenom,
    photo: `${x.id}/photo.jpg`,
    accord_le: maintenant,
    neutre: `${x.id}/neutre-essai.png`,
    parle: `${x.id}/neutre-essai.png`,
    prete_le: maintenant,
  })),
);
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
const get = async (chemin, q) => {
  const r = await fetch(`${BASE}${chemin}`, {
    headers: { cookie: `clikme_habitant=${q.jeton}` },
  });
  return { statut: r.status, corps: await r.json().catch(() => null) };
};

// ═══ SES FIGURINES DU MOIS ═══
const ici = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" })
  .format(new Date())
  .slice(0, 7);
const decale = (m, k) => {
  const n = Number(m.slice(0, 4)) * 12 + Number(m.slice(5, 7)) - 1 + k;
  return `${Math.floor(n / 12)}-${String((n % 12) + 1).padStart(2, "0")}`;
};
const SEMES = [decale(ici, -1), decale(ici, -2), decale(ici, -14)];
const carte = (couleur) =>
  sharp({
    create: { width: 400, height: 600, channels: 3, background: couleur },
  })
    .webp()
    .toBuffer();
for (const [k, mois] of SEMES.entries()) {
  const image = `${LEA.id}/mois/${mois}.webp`;
  await deposer(
    image,
    await carte(["#c84a6a", "#4a8ac8", "#6ac84a"][k]),
    "image/webp",
  );
  await json(`${LEA.id}/mois/${mois}.json`, {
    mois,
    cle: "x",
    expression: "émerveillé",
    phrase: `Ma phrase de ${mois}`,
    image,
    le: maintenant,
    parMoteur: false,
  });
}
const api = await get("/api/direct/ma-figurine?mois=1", LEA);
const courante = api.corps?.mois?.courante;
ok(
  api.statut === 200 &&
    courante?.mois === ici &&
    api.corps.mois.passees.length === 3,
  `ses figurines du mois : ${api.corps?.mois?.passees?.length} d'avant, celle de ${courante?.mois}`,
);

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const b = await lancer();
const erreurs = [];
const ctx = await b.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  userAgent: IPHONE,
  isMobile: true,
  hasTouch: true,
});
await ctx.addCookies([
  { name: "clikme_habitant", value: LEA.jeton, url: BASE },
  { name: "sb-127-auth-token", value: `base64-${b64(session)}`, url: BASE },
]);
const lea = await ctx.newPage();
lea.on("pageerror", (e) => erreurs.push(String(e)));
lea.on(
  "console",
  (m) =>
    m.type() === "error" &&
    !/Failed to load resource/.test(m.text()) &&
    erreurs.push(m.text()),
);
const attendre = async (p, f, ms = 15000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f().catch(() => false)) return true;
    await p.waitForTimeout(120);
  }
  return false;
};
const texte = async (loc) =>
  (await loc.innerText().catch(() => "")).replace(/\s+/g, " ").trim();

await lea.goto(`${BASE}/univers/maison`, { waitUntil: "domcontentloaded" });
const chez = lea.locator('.mmc-scene[data-piece="salon"]');
ok(
  await attendre(
    lea,
    async () => (await chez.locator(".mmc-fig").count()) === 1,
    30000,
  ),
  "chez elle : sa figurine",
);
await chez.locator(".mmc-fig").click();
const md = lea.locator("[data-mon-double]");
ok(
  await attendre(lea, async () => (await md.count()) === 1),
  "« Mon double du jour » s'ouvre",
);
await md.locator('[data-onglet="mois"]').click();
const album = md.locator("[data-album]");
ok(
  await attendre(lea, async () => (await album.count()) === 1),
  "🗓️ « Du mois » : « 🗂️ Ma collection », sous sa figurine du mois",
);
ok(
  /^🗂️ Ma collection/.test(await texte(album)),
  `son titre (${(await texte(album)).slice(0, 20)})`,
);

// ═══ LES ANNÉES, DOUZE MOIS CHACUNE ═══
const annees = [...new Set([ici, ...SEMES].map((m) => m.slice(0, 4)))]
  .sort()
  .reverse();
const vues = await album
  .locator("[data-album-annee]")
  .evaluateAll((l) => l.map((x) => x.getAttribute("data-album-annee")));
ok(
  JSON.stringify(vues) === JSON.stringify(annees),
  `ses années, la plus récente d'abord (${vues.join(", ")})`,
);
for (const annee of annees) {
  const a = album.locator(`[data-album-annee="${annee}"]`);
  const cases = await a
    .locator("[data-album-mois]")
    .evaluateAll((l) =>
      l.map((x) => [
        x.getAttribute("data-album-mois"),
        x.getAttribute("data-album-etat"),
      ]),
    );
  const attendu = Array.from({ length: 12 }, (_, k) => {
    const m = `${annee}-${String(k + 1).padStart(2, "0")}`;
    return [
      m,
      SEMES.includes(m)
        ? "prete"
        : m === ici
          ? "en-cours"
          : m < ici
            ? "vide"
            : "a-venir",
    ];
  });
  ok(
    JSON.stringify(cases) === JSON.stringify(attendu),
    `${annee} : douze cases, janvier à décembre, chacune à sa place`,
  );
  const n = attendu.filter((x) => x[1] === "prete").length;
  ok(
    (await texte(a.locator(".alb-compte"))) ===
      (n
        ? `${n} figurine${n > 1 ? "s" : ""} sur 12 en ${annee}`
        : `Pas encore de carte en ${annee}`),
    `… « ${await texte(a.locator(".alb-compte"))} » (un vrai compte)`,
  );
}
for (const mois of SEMES) {
  const img = album.locator(`[data-album-mois="${mois}"] img`);
  ok(
    await attendre(
      lea,
      async () => (await img.evaluate((i) => i.complete && i.naturalWidth)) > 0,
    ),
    `la carte de ${mois} : son image`,
  );
}
const enCours = album.locator(`[data-album-mois="${ici}"]`);
ok(
  (await texte(enCours.locator("em"))) ===
    `${Math.min(courante.jours, 10)}/10 jours`,
  `ce mois-ci : ses vrais jours (« ${await texte(enCours.locator("em"))} », ${courante.jours} selon le serveur)`,
);
const vide = album.locator('[data-album-etat="vide"]').first();
if ((await vide.count()) === 1)
  ok(
    (await texte(vide.locator("em"))) === "Vide",
    "un mois passé sans figurine : « Vide », rien d'inventé",
  );
const avenir = album.locator('[data-album-etat="a-venir"]').first();
if ((await avenir.count()) === 1)
  ok(
    (await texte(avenir.locator("em"))).length > 2,
    `un mois à venir : son thème (« ${await texte(avenir.locator("em"))} »)`,
  );

// rien ne déborde : quatre cartes par ligne, dans l'écran
const boites = await album
  .locator("[data-album-mois]")
  .evaluateAll((l) =>
    l
      .map((x) => x.getBoundingClientRect())
      .map((r) => [r.left, r.right, r.width]),
  );
ok(
  boites.every(([g, d]) => g >= 0 && d <= 390),
  "rien ne déborde",
);
ok(
  boites.every(([, , w]) => w >= 60),
  `des cartes lisibles (au moins ${Math.round(Math.min(...boites.map((x) => x[2])))} pt de large)`,
);
await album.scrollIntoViewIfNeeded();
await lea.screenshot({ path: `${D}/album-du-mois-1.png` });

// ═══ UNE CARTE, EN GRAND ═══
await album.locator(`[data-album-mois="${SEMES[0]}"] button`).click();
const grand = lea.locator(`[data-album-carte="${SEMES[0]}"]`);
ok(
  await attendre(lea, async () => (await grand.count()) === 1),
  "elle touche sa carte du mois dernier : elle s'ouvre en grand",
);
ok(
  (await texte(grand)).includes(`« Ma phrase de ${SEMES[0]} »`) &&
    /Son visage du mois : émerveillé/.test(await texte(grand)),
  "… avec sa phrase du mois et son visage du mois",
);
ok(
  (await texte(grand.locator("[data-album-parler]"))) === "🎭 Fais-la parler",
  "… et « 🎭 Fais-la parler »",
);
const bg = await grand.locator(".alb-grand").boundingBox();
ok(
  bg &&
    bg.x >= 0 &&
    bg.x + bg.width <= 390 &&
    bg.y >= 0 &&
    bg.y + bg.height <= 845,
  "… dans l'écran",
);
await lea.screenshot({ path: `${D}/album-du-mois-2-grand.png` });
await grand.locator("[data-album-fermer]").click();
ok(
  await attendre(
    lea,
    async () => (await grand.count()) === 0 && (await album.count()) === 1,
  ),
  "« Fermer » : retour à sa collection",
);

ok(
  !/exemple/i.test(await lea.locator("body").innerText()),
  "jamais le mot « exemple »",
);
ok(erreurs.length === 0, `aucune erreur (${erreurs.slice(0, 3).join(" | ")})`);
await b.close();
console.log(
  echecs
    ? `\n${echecs} échec(s)`
    : "\nma collection de figurines du mois, sur un iPhone ✓",
);
process.exit(echecs ? 1 : 0);
