// 🎬 LA FAMILLE DANS SES VIDÉOS — l'accord, la route du comptoir (« video »), puis le début et la fin dessinés.
//
// Le Fournil des Fantômes (commerce inventé des essais) : quatre fantômes hier (Léa et Hugo d'accord pour les
// vidéos, Inès non, Karim d'accord mais son prénom caché partout), Nina arrivée aujourd'hui ; un record de 2
// avant-hier, battu hier. Puis ce qui doit tenir : la case de la fiche jamais cochée d'avance, cochée elle part
// avec la cage, on change d'avis sur sa page, « Ouvre d'abord une cage » pour qui n'est pas de la famille ; la
// route « video » ne donne le prénom, le numéro et le petit mot (déjà public) que de ceux qui l'ont accepté, jamais
// d'identifiant, l'or d'abord ; « la semaine » quand hier était vide ; rien pour un prospect. Enfin le début
// (« Rejoins ma famille ») et la fin (« la famille d'hier », les cages, son lien) dessinés dans la page, image par
// image, sur ces vraies données, celles d'une famille vide et celles de la démonstration : ce qui s'écrit, rien
// qui ne doive pas s'écrire, aucune erreur. Les montages complets (film photo, interview, épisode) ne sont pas
// joués ici : il y faut des photos, une caméra et une voix.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { BASE, D, F, lancer } from "./commun.mjs";

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SITE = "99999999-0000-4000-8000-000000000031";
const SLUG = "fournil-des-fantomes-dax";
const CALME = { id: "99999999-0000-4000-8000-000000000032", slug: "mercerie-du-calme-dax" };
const VIDE = { id: "99999999-0000-4000-8000-000000000033", slug: "cordonnerie-neuve-dax" };
const PROSPECT = { id: "99999999-0000-4000-8000-000000000034", slug: "prospect-du-fournil-dax" };
const jour = (d) => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(d);
const AUJ = jour(new Date());
/** n jours de calendrier avant aujourd'hui (pas des tranches de 24 h : le passage à l'heure d'hiver). */
const ilYa = (n) => {
  const d = new Date(`${AUJ}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};
const h = (k) => `99999999-1111-4000-8000-00000000000${k}`;
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const site = (id, slug, nom, activite, client = true) => ({ id, slug, channel: "letter", business_name: nom, city: "Dax", activite, published: true, est_client: client, pro_token: "jeton-test" });

await semer("human_vitrine_sites", [
  site(SITE, SLUG, "Le Fournil des Fantômes", "Boulangerie"),
  site(CALME.id, CALME.slug, "La Mercerie du Calme", "Mercerie"),
  site(VIDE.id, VIDE.slug, "La Cordonnerie Neuve", "Cordonnier"),
  site(PROSPECT.id, PROSPECT.slug, "Un prospect du fournil", "Boulangerie", false),
]);
await semer(
  "clik_cage",
  [
    ["Léa", "cosy", 1, 10],
    ["Hugo", "denim", 2, 9],
    ["Inès", "artiste", 3, 8],
    ["Karim", "voyageur", 4, 7],
    ["Nina", "fleuri", 5, 0],
  ].map(([prenom, look, k, jours]) => ({
    site_id: SITE,
    habitant_id: h(k),
    film: "page",
    cage: "adore",
    prenom,
    look,
    created_at: new Date(`${ilYa(jours)}T${jours ? "10" : "08"}:00:00Z`).toISOString(),
    updated_at: new Date().toISOString(),
  })),
);
await semer("clik_presence", [
  ...[1, 2, 3, 4].map((k) => ({ site_id: SITE, habitant_id: h(k), jour: ilYa(1) })),
  ...[1, 2].map((k) => ({ site_id: SITE, habitant_id: h(k), jour: ilYa(2) })),
  { site_id: SITE, habitant_id: h(5), jour: AUJ },
]);
// Inès : cinq passages (or) ; Hugo : un (argent).
await semer("clik_visite", [...[1, 2, 3, 4, 5].map((n) => ({ site_id: SITE, habitant_id: h(3), jour: ilYa(n) })), { site_id: SITE, habitant_id: h(2), jour: ilYa(2) }]);
await semer("clik_accord", [1, 2, 4, 5].map((k) => ({ site_id: SITE, habitant_id: h(k), video: true })));
// Karim a caché son prénom partout.
await semer("human_habitants", { id: h(4), prenom_vitrine: false });
await semer("clik_mot", [
  { site_id: SITE, habitant_id: h(1), texte: "Le meilleur pain du quartier", liste: true, jour: ilYa(1) },
  { site_id: SITE, habitant_id: h(2), texte: "Merci pour la baguette encore chaude", liste: false, jour: ilYa(1) },
  { site_id: SITE, habitant_id: h(3), texte: "Ma pause du matin", liste: true, jour: ilYa(1) },
  { site_id: SITE, habitant_id: h(4), texte: "Toujours un sourire", liste: true, jour: ilYa(1) },
]);
// LA MERCERIE : personne hier, deux il y a trois jours.
await semer("clik_cage", [6, 7].map((k) => ({ site_id: CALME.id, habitant_id: h(k), film: "page", cage: "adore", prenom: "", look: "soleil", created_at: new Date(`${ilYa(5)}T10:00:00Z`).toISOString(), updated_at: new Date().toISOString() })));
await semer("clik_presence", [6, 7].map((k) => ({ site_id: CALME.id, habitant_id: h(k), jour: ilYa(3) })));

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
const video = async (slug = SLUG, token = "jeton-test") => {
  const r = await fetch(`${BASE}/api/site-internet/pro/famille`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, token, action: "video" }) });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const accord = async (oui, cookie = "") => {
  const r = await fetch(`${BASE}/api/direct/famille`, { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify({ slug: SLUG, action: "video", oui }) });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const accordDe = async (habitant) => (await (await fetch(`${F}/clik_accord?site_id=eq.${SITE}&habitant_id=eq.${habitant}`)).json())[0]?.video;

// ═══ LA ROUTE DU COMPTOIR ═══
ok((await video(SLUG, "mauvais")).statut === 403, "un mauvais jeton : refusé");
ok((await video(PROSPECT.slug)).statut === 404, "un prospect : pas de famille dans ses vidéos (sa page n'existe pas)");
let v = await video();
ok(v.statut === 200 && v.quand === "hier" && v.hier === 4 && v.record === 4 && v.recordBattuHier === true && v.membres === 5, `la famille d'hier : 4, record battu, 5 membres (${v.quand}/${v.hier}/${v.record}/${v.recordBattuHier}/${v.membres})`);
ok(v.nom === "Le Fournil des Fantômes" && v.lien === `clikme.fr/f/${SLUG}` && v.branche, `son nom, son lien (${v.lien})`);
ok(v.surprises === null, `pas de surprise du jour : la cage dorée du Reel ne promet rien (${v.surprises})`);
// UNE BOULANGERIE EST À TABLE : le fantôme de la table, pas celui du bien-être (il tombait dans les séances).
ok(v.hote === "/direct/double/pied/salut-1.webp", `une boulangerie : le fantôme de la table (${v.hote})`);
const fv = v.fantomes ?? [];
ok(fv.length === 4 && !fv.some((x) => x.look === "fleuri"), `hier : quatre fantômes, pas Nina venue aujourd'hui (${fv.map((x) => x.look)})`);
ok(fv[0]?.prenom === "Léa" && fv[0]?.numero === 1 && fv[0]?.mot === "Le meilleur pain du quartier", `Léa d'abord, d'accord, avec son mot public (${JSON.stringify(fv[0])})`);
const hugo = fv.find((x) => x.prenom === "Hugo");
ok(hugo?.numero === 2 && hugo.grade === "argent" && hugo.mot === undefined, `Hugo : son prénom, son numéro, mais pas son mot resté privé (${JSON.stringify(hugo)})`);
const ines = fv.find((x) => x.look === "artiste");
ok(ines && ines.prenom === undefined && ines.numero === undefined && ines.mot === undefined && ines.grade === "or", `Inès, sans accord : son fantôme seul (${JSON.stringify(ines)})`);
const karim = fv.find((x) => x.look === "voyageur");
ok(karim && karim.prenom === undefined && karim.numero === undefined && karim.mot === undefined, `Karim, prénom caché partout : son fantôme seul (${JSON.stringify(karim)})`);
ok(fv[1]?.look === "artiste", `après ceux qui ont un mot, l'or (${fv.map((x) => `${x.look}/${x.grade}`)})`);
ok(![1, 2, 3, 4, 5].some((k) => JSON.stringify(v).includes(h(k))) && !JSON.stringify(v).includes("Inès") && !JSON.stringify(v).includes("Karim"), "jamais d'identifiant, ni le prénom de qui n'a pas dit oui");
const vc = await video(CALME.slug);
ok(vc.statut === 200 && vc.quand === "semaine" && vc.hier === 0 && vc.fantomes?.length === 2 && vc.recordBattuHier === false, `hier vide : la famille de la semaine (${vc.quand}, ${vc.fantomes?.length})`);
const vv = await video(VIDE.slug);
ok(vv.statut === 200 && vv.membres === 0 && vv.fantomes?.length === 0, "une famille vide : aucun fantôme");

// ═══ L'ACCORD ═══
ok((await accord(true)).statut === 403, "sans être de la famille : « Ouvre d'abord une cage »");
ok((await accord("oui")).statut === 400, "un accord qui n'est ni oui ni non : refusé");

const b = await lancer();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
const erreurs = [];
p.on("pageerror", (e) => erreurs.push(String(e)));
const texte = async (sel) => (await p.locator(sel).first().innerText({ timeout: 15000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const cookie = async () => (await ctx.cookies()).map((c) => `${c.name}=${c.value}`).join("; ");

await p.goto(`${BASE}/f/${SLUG}`, { waitUntil: "networkidle", timeout: 400000 });
await p.waitForSelector(".fm-foule .l1", { timeout: 60000 });
await p.locator(".fm-cage-b").first().click();
await p.waitForSelector(".fm-fiche", { timeout: 10000 });
const caseVideo = p.locator(".fm-accord input[type=checkbox]");
ok((await caseVideo.count()) === 1 && !(await caseVideo.isChecked()), "la case des vidéos : jamais cochée d'avance");
const motsBoulangerie = await texte(".fm-mots");
ok(motsBoulangerie.includes("Rien que la vidéo m’a donné faim") && !motsBoulangerie.includes("Un vrai moment pour soi"), `une boulangerie : les petits mots de la table (${motsBoulangerie})`);
ok((await texte(".fm-accord")).includes("Mon prénom et mon petit mot peuvent apparaître dans ses vidéos") && (await texte(".fm-accord")).includes("seul ton fantôme y apparaît"), "elle dit ce qu'elle permet, et ce qui se passe sans elle");
await p.fill("#fm-prenom", "Margot");
await caseVideo.check();
await p.locator(".fm-fiche .fm-accord").scrollIntoViewIfNeeded();
await p.screenshot({ path: `${D}/famille-video-1-fiche.png` });
await p.locator(".fm-fiche button[type=submit]").click();
await p.waitForSelector(".fm-video-accord", { timeout: 20000 });
const margot = (await (await fetch(`${F}/clik_cage?site_id=eq.${SITE}`)).json()).find((c) => c.prenom === "Margot")?.habitant_id;
ok((await accordDe(margot)) === true, "cochée : son accord part avec sa cage");
ok((await texte(".fm-video-accord")).includes("avec ton prénom et ton petit mot") && (await texte(".fm-video-accord button")) === "Retirer mon prénom", "sa page le rappelle, avec « Retirer mon prénom »");
await p.locator(".fm-video-accord button").click();
await p.waitForFunction(() => document.querySelector(".fm-video-accord button")?.textContent?.includes("Montrer"), null, { timeout: 15000 });
ok((await accordDe(margot)) === false && (await texte(".fm-video-accord")).includes("ton fantôme seul"), "elle change d'avis : retiré");
await p.locator(".fm-video-accord").scrollIntoViewIfNeeded();
await p.screenshot({ path: `${D}/famille-video-2-accord.png` });
ok((await accord(true, await cookie())).statut === 200 && (await accordDe(margot)) === true, "et le redonne");
ok((await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0, "la page ne déborde pas");
// Sans la case cochée : pas d'accord.
const p2 = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
await p2.goto(`${BASE}/f/${SLUG}`, { waitUntil: "networkidle" });
await p2.waitForSelector(".fm-foule .l1", { timeout: 60000 });
await p2.locator(".fm-cage-b").first().click();
await p2.fill("#fm-prenom", "Théo");
await p2.locator(".fm-fiche button[type=submit]").click();
await p2.waitForSelector(".fm-video-accord", { timeout: 20000 });
const theo = (await (await fetch(`${F}/clik_cage?site_id=eq.${SITE}`)).json()).find((c) => c.prenom === "Théo")?.habitant_id;
ok((await accordDe(theo)) === false && (await p2.locator(".fm-video-accord button").innerText()) === "Montrer mon prénom", "la case laissée vide : son fantôme seul");

// ═══ LE DÉBUT ET LA FIN, DESSINÉS ═══
// Les fichiers du dessin, passés de TypeScript à JavaScript et servis à la page (même origine : ses images).
const MODULES = {
  "famille-video": "src/lib/direct/famille-video.ts",
  famille: "src/lib/direct/famille.ts",
  cages: "src/lib/direct/cages.ts",
  look: "src/lib/direct/look.ts",
  "interview-signature": "src/lib/direct/interview-signature.ts",
  "interview-fantome": "src/lib/direct/interview-fantome.ts",
  "reel-du-jour": "src/lib/direct/reel-du-jour.ts",
  "reel-dessin": "src/lib/direct/reel-dessin.ts",
  echanges: "src/lib/echanges/echanges.ts",
};
const js = (nom) => {
  const src = fs.readFileSync(path.join(RACINE, MODULES[nom]), "utf8");
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  return out.replace(/from\s+"(?:\.\/|@\/lib\/(?:direct|echanges)\/)([a-z-]+)"/g, (tout, m) => {
    if (!MODULES[m]) throw new Error(`module inattendu : ${m}`);
    return `from "/__essai/${m}.js"`;
  });
};
await p.route("**/__essai/*.js", (r) => r.fulfill({ contentType: "text/javascript", body: js(path.basename(new URL(r.request().url()).pathname, ".js")) }));

const dessiner = async (d, nom) =>
  p.evaluate(
    async ({ d, nom }) => {
      const m = await import("/__essai/famille-video.js");
      const P = { affiche: "Impact, sans-serif", texte: getComputedStyle(document.body).fontFamily || "sans-serif", serif: "Georgia, serif" };
      const im = await m.chargerFamilleVideo(d);
      const toile = document.createElement("canvas");
      toile.width = 720;
      toile.height = 1280;
      const g = toile.getContext("2d");
      // CE QUI S'ÉCRIT : chaque fillText, noté
      const ecrits = new Set();
      const fillText = CanvasRenderingContext2D.prototype.fillText;
      g.fillText = function (t, ...r) {
        ecrits.add(String(t));
        return fillText.call(this, t, ...r);
      };
      const images = {};
      const varie = () => {
        const px = g.getImageData(0, 0, 720, 1280).data;
        let min = 255,
          max = 0;
        for (let i = 0; i < px.length; i += 4 * 97) {
          min = Math.min(min, px[i]);
          max = Math.max(max, px[i]);
        }
        return max - min;
      };
      const contrastes = [];
      // LE BANDEAU, PAR-DESSUS UNE IMAGE DE SA VIDÉO (ici, un plan gris)
      const plan = (u) => {
        g.fillStyle = "#6B5A50";
        g.fillRect(0, 0, 720, 1280);
        m.dessinerBandeauFamille(g, P, im, u);
      };
      for (const u of [0.9, 1.6, 2.4]) {
        plan(u);
        contrastes.push(varie());
      }
      plan(1.6);
      images.ouverture = toile.toDataURL("image/png");
      for (const u of [0.5, 1.5, 2.6, 3.3, 4.0, 4.5]) {
        m.dessinerFinFamille(g, P, d, im, u, null);
        contrastes.push(varie());
      }
      m.dessinerFinFamille(g, P, d, im, 1.9, null);
      images.fin = toile.toDataURL("image/png");
      m.dessinerFinFamille(g, P, d, im, 1.2, null);
      images.fin2 = toile.toDataURL("image/png");
      m.dessinerFinFamille(g, P, d, im, 4.3, null);
      images.cages = toile.toDataURL("image/png");
      m.dessinerFinFamille(g, P, d, im, m.FIN_FAMILLE, null);
      const noirFinal = varie();
      return { nom, ecrits: [...ecrits], images, contrastes, noirFinal, hote: Boolean(im.hote), fantomes: im.fantomes.filter(Boolean).length, cages: im.cages.filter(Boolean).length, duree: [m.OUVERTURE_FAMILLE, m.BANDEAU_FAMILLE, m.FIN_FAMILLE] };
    },
    { d, nom },
  );
const enregistrer = (r) => {
  for (const [k, url] of Object.entries(r.images)) fs.writeFileSync(path.join(D, `famille-video-${r.nom}-${k}.png`), Buffer.from(url.split(",")[1], "base64"));
};

const vrai = await dessiner(v, "vraie");
enregistrer(vrai);
const ecrit = vrai.ecrits.join(" | ");
/** Le texte écrit, bout à bout (un petit mot peut tenir sur deux lignes). */
const suite = (r) => r.ecrits.join(" ").replace(/[«»]/g, " ").replace(/\s+/g, " ");
ok(vrai.hote && vrai.fantomes === 4 && vrai.cages === 3, `ses images : son fantôme, les 4 fantômes, les 3 cages (${vrai.hote}/${vrai.fantomes}/${vrai.cages})`);
ok(["Rejoins ma famille de fantômes !", "Je te gâte : lien dans ma bio"].every((t) => vrai.ecrits.includes(t)), "le début : le bandeau « Rejoins ma famille de fantômes ! · Je te gâte : lien dans ma bio », par-dessus sa vidéo");
ok(["LA FAMILLE D’HIER", "4 fantômes", "Record battu !"].every((t) => vrai.ecrits.includes(t)), `la fin : la famille d'hier, 4 fantômes, record battu (${ecrit.slice(0, 200)})`);
ok(suite(vrai).includes("Le meilleur pain du quartier") && vrai.ecrits.includes("Léa · fantôme n°1"), "Léa s'avance avec son mot, son prénom et son numéro");
ok(!ecrit.includes("Hugo"), "Hugo, sans petit mot public, ne s'avance pas : son fantôme dans la foule");
ok(!/Inès|Karim|Ma pause du matin|Toujours un sourire|Merci pour la baguette/.test(ecrit), "jamais le prénom ni le mot de qui n'a pas dit oui (ni un mot resté privé)");
ok(["Libère ton fantôme", "Rejoins la famille", "Lien dans ma bio", `clikme.fr/f/${SLUG}`, "On bat le record aujourd’hui ? (4)"].every((t) => vrai.ecrits.includes(t)), "puis les cages, « Lien dans ma bio », son lien, le record à battre");
ok(!/exemple/i.test(ecrit), "jamais le mot « exemple »");
ok(vrai.contrastes.every((c) => c > 40), `chaque image a quelque chose à voir (${vrai.contrastes})`);
ok(vrai.noirFinal < 4, `elle finit au noir (${vrai.noirFinal})`);

const semaine = await dessiner(vc, "semaine");
ok(semaine.ecrits.includes("LA FAMILLE DE LA SEMAINE") && semaine.ecrits.includes("2 fantômes") && semaine.ecrits.includes("Record : 2"), `hier vide : la famille de la semaine (${semaine.ecrits.slice(0, 8).join(" | ")})`);
const vide = await dessiner(vv, "vide");
enregistrer(vide);
ok(vide.ecrits.includes("Sois mon tout premier") && vide.ecrits.includes("fantôme !") && !vide.ecrits.some((t) => /record/i.test(t)), "une famille vide : « Sois mon tout premier fantôme ! », sans record");
const demo = await p.evaluate(async () => (await import("/__essai/famille.js")).familleVideoDemo({ nom: "Chez Bergine", branche: "table", hote: "/direct/double/pied/salut-1.webp" }));
const d = await dessiner(demo, "demo");
enregistrer(d);
ok(d.fantomes === 12 && d.ecrits.includes("23 fantômes") && d.ecrits.includes("Record : 29") && d.ecrits.includes("Léa · fantôme n°12"), `la démonstration : sa famille inventée (${d.fantomes} fantômes)`);
ok(suite(d).includes("Ma nouvelle adresse préférée") && !d.ecrits.some((x) => /^[»!?;:]/.test(x.trim())), "le petit mot de la démonstration : jamais un « » » ni un « ! » seul au début d'une ligne");
ok(!suite(d).includes("Merci pour l’accueil de samedi"), "une fin resserrée : un seul fantôme s'avance");
ok(vrai.duree[0] === 0 && vrai.duree[1] === 3 && vrai.duree[2] === 4.8, `le produit d'abord : pas d'écran d'ouverture, un bandeau de ${vrai.duree[1]} s, une fin de ${vrai.duree[2]} s`);

// ═══ 🎞️ LE REEL DU JOUR ═══
// Le vrai stock de la cage dorée : 5 surprises prévues, 2 prises — il en reste 3.
await semer("clik_surprise", [{ site_id: SITE, jour: AUJ, libelle: "Une chouquette offerte", stock: 5, pris: 2 }]);
v = await video();
ok(v.surprises === 3, `le vrai stock de la cage dorée : il en reste 3 (${v.surprises})`);
const reel = await p.evaluate(
  async ({ d }) => {
    const r = await import("/__essai/reel-du-jour.js");
    const des = await import("/__essai/reel-dessin.js");
    const fv = await import("/__essai/famille-video.js");
    const fa = await import("/__essai/interview-fantome.js");
    // SA PHRASE : celle qui nomme son plat, pas son bonjour ; jamais une prise sans son, jamais une hésitation dedans
    const prise = (sousTitres, o = {}) => ({ sousTitres, questionFin: 0.8, coupe: 9, audio: true, ...o });
    const bonjour = { texte: "Bonjour, je suis Paul et voilà.", debut: 1, fin: 2.8 };
    const magret = { texte: "Notre magret au miel cuit doucement toute la matinée !", debut: 3.4, fin: 6.6 };
    const forts = fa.motsForts("Magret au miel", "18 €");
    const choix = r.phraseDuReel([prise([bonjour, magret])], forts);
    const sansSon = r.phraseDuReel([prise([bonjour, magret], { audio: false })], forts);
    const hesite = r.phraseDuReel([prise([magret], { coupes: [{ de: 4.5, a: 5 }] })], forts);
    const appels = [r.appelDuReel({ surprises: 15 }), r.appelDuReel({ surprises: 1 }), r.appelDuReel({ surprises: 0 }), r.appelDuReel({ surprises: 3, motCle: "fantôme" })];
    // LES IMAGES, DESSINÉES — avec les polices de l'app, comme `polices()` de l'interview les lit
    const lire = (variable, repli) => {
      const sonde = document.createElement("span");
      sonde.style.fontFamily = `var(${variable}), ${repli}`;
      document.body.appendChild(sonde);
      const f = getComputedStyle(sonde).fontFamily || repli;
      sonde.remove();
      return f;
    };
    const P = { affiche: lire("--font-affiche", "Impact, sans-serif"), texte: lire("--font-clikme", "sans-serif"), serif: lire("--font-enseigne", "Georgia, serif") };
    await Promise.all([`100px ${P.affiche}`, `800 23px ${P.texte}`, `600 34px ${P.texte}`, `900 56px ${P.texte}`].map((f) => document.fonts.load(f).catch(() => null)));
    const charge = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
    const photo = await charge("/direct/table/magret/3.jpg");
    const famIm = await fv.chargerFamilleVideo(d);
    const sig = await import("/__essai/interview-signature.js");
    const im = { photo, fondCarte: sig.fabriquerFondCarte(), cage: await des.chargerCageDoree(), hote: famIm.hote, grain: null };
    const toile = document.createElement("canvas");
    toile.width = 720;
    toile.height = 1280;
    const g = toile.getContext("2d");
    const ecrits = new Set();
    const fillText = CanvasRenderingContext2D.prototype.fillText;
    g.fillText = function (t, ...x) {
      ecrits.add(String(t));
      return fillText.call(this, t, ...x);
    };
    const images = {};
    const dessiner = (scene, t, nom) => {
      des.dessinerReel(g, P, scene, im, t, des.morceauxDuReel(scene.phrase));
      if (nom) images[nom] = toile.toDataURL("image/png");
    };
    const scene = { plat: "Magret au miel", prix: "18 €", entete: "CE MIDI CHEZ BERGINE", nomCadre: "Chez Bergine · Dax", phrase: choix, appel: r.appelDuReel({ surprises: d.surprises }), lien: d.lien, video: null };
    const T = des.tempsDuReel(choix);
    dessiner(scene, 1.4, "accroche");
    for (const u of [0.5, 1.2, 2.0, 2.8]) dessiner(scene, T.phrase + u, u === 2.0 ? "phrase" : null);
    for (const u of [0.3, 0.8, 1.0, 1.55]) dessiner(scene, T.appel + u, u === 1.0 ? "cage" : u === 1.55 ? "libre" : null);
    dessiner(scene, T.appel + 2.9, "appel");
    const avecCage = [...ecrits];
    ecrits.clear();
    dessiner({ ...scene, appel: r.appelDuReel({ surprises: null }) }, T.appel + 2.9, "sans");
    const sansCage = [...ecrits];
    ecrits.clear();
    dessiner({ ...scene, appel: r.appelDuReel({ surprises: d.surprises, motCle: "FANTÔME" }) }, T.appel + 2.9, "fantome");
    return {
      choix: choix && { k: choix.k, de: choix.de, a: choix.a, mots: choix.mots.map((w) => w.m).join(" ") },
      sansSon,
      hesite,
      appels,
      duree: r.dureeDuReel(choix),
      dureeSans: r.dureeDuReel(null),
      avecCage,
      sansCage,
      fantome: [...ecrits],
      images,
      photo: Boolean(photo),
      cage: Boolean(im.cage),
      polices: P,
    };
  },
  { d: demo },
);
for (const [k, url] of Object.entries(reel.images)) fs.writeFileSync(path.join(D, `reel-${k}.png`), Buffer.from(url.split(",")[1], "base64"));
ok(reel.choix?.mots.startsWith("Notre magret au miel") && reel.choix.de < 3.4 && reel.choix.a > 6.4, `sa phrase : celle qui nomme son plat (${reel.choix?.mots})`);
ok(reel.sansSon === null && reel.hesite === null, "jamais sans son son, jamais une phrase où il hésite");
ok(reel.duree >= 7 && reel.duree <= 12 && reel.dureeSans >= 6 && reel.dureeSans <= 8, `une dizaine de secondes (${reel.duree.toFixed(1)} s ; ${reel.dureeSans.toFixed(1)} s sans phrase)`);
const [a15, a1, a0, aMot] = reel.appels;
ok(a15.cage && a15.lignes.join(" ") === "LES 15 PREMIERS" && a15.accent === "15" && a15.sous === "qui ouvrent ma cage dorée gagnent une surprise.", `le vrai stock, dit comme la règle : « ${a15.lignes.join(" ")} ${a15.sous} »`);
ok(a1.lignes.join(" ") === "LE PREMIER" && a1.sous === "qui ouvre ma cage dorée gagne une surprise.", `une seule : « ${a1.lignes.join(" ")} ${a1.sous} »`);
ok(![a15, a1].some((x) => /par personne|aujourd/i.test(x.sous + x.etiquette)), "plus de « aujourd'hui · une par personne »");
ok(!a0.cage && a0.lignes.join(" ") === "REJOINS LA FAMILLE" && a0.bas === "Lien dans ma bio", "plus de surprise : pas de cage dorée, pas de chiffre inventé");
ok(aMot.bas === "Écris FANTÔME en commentaire" && aMot.ou === "ou lien dans ma bio" && a15.bas === "Lien dans ma bio" && a15.ou === null, "« Écris FANTÔME » (et « ou lien dans ma bio ») seulement s'il répond aux commentaires ; sinon sa bio seule");
ok(reel.fantome.includes("Écris FANTÔME en commentaire") && reel.fantome.includes("ou lien dans ma bio") && !reel.fantome.includes("clikme.fr/f/ton-commerce"), `le Reel avec FANTÔME : le bouton, et la bio pour les pressés (${reel.fantome.slice(-4).join(" | ")})`);
ok(reel.photo && reel.cage, "la photo de son plat et la cage dorée se chargent");
ok(/MAGRET ?\|? ?AU MIEL/.test(reel.avecCage.join("|")) && ["18 €", "CE MIDI CHEZ BERGINE", "FACE AU FANTÔME", "Chez Bergine · Dax", "LA SURPRISE DU CHEF", "LES ", "15", "PREMIERS", "Lien dans ma bio", "clikme.fr/f/ton-commerce"].every((t) => reel.avecCage.includes(t)), `le Reel : son plat, son prix, la signature de l'émission, les 15 premiers, le chemin (${reel.avecCage.join(" | ").slice(0, 260)})`);
ok(reel.avecCage.join(" ").includes("qui ouvrent ma cage dorée gagnent une surprise."), "la phrase dessous : qui ouvrent ma cage dorée gagnent une surprise");
ok(/anton/i.test(reel.polices.affiche) && /poppins/i.test(reel.polices.texte), `les polices de l'interview (${reel.polices.affiche} · ${reel.polices.texte})`);
ok(reel.avecCage.some((t) => /magret/i.test(t) && t !== "MAGRET AU MIEL"), "ses mots s'allument pendant sa phrase");
ok(reel.sansCage.includes("REJOINS") && reel.sansCage.includes("Libère ton fantôme : je te gâte !") && !reel.sansCage.some((t) => /surprise/i.test(t)), "sans surprise du jour : son fantôme invite, aucune surprise annoncée");
ok(![...reel.avecCage, ...reel.sansCage].some((t) => /exemple/i.test(t)), "jamais « exemple » à l'écran");

// 👻 « JE RÉPONDS MOI-MÊME AUX COMMENTAIRES FANTÔME » : éteint d'abord, puis allumé par la route de ses réseaux
const reseaux = async (corps) => (await fetch(`${BASE}/api/site-internet/pro/reseaux`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: SLUG, token: "jeton-test", ...corps }) })).json();
const avant = await reseaux({ action: "etat" });
const allume = await reseaux({ action: "fantome", on: true });
const relu = await reseaux({ action: "etat" });
ok(avant.fantome === false && allume.fantome === true && relu.fantome === true, `les commentaires FANTÔME : éteints par défaut, allumés et gardés (${avant.fantome}/${allume.fantome}/${relu.fantome})`);
ok((await reseaux({ action: "fantome", on: false })).fantome === false, "et il peut les éteindre");

// 🥖 UNE BOULANGERIE A SES MOTS : sa fournée, pas un plat du jour.
const prop = await (await fetch(`${BASE}/api/site-internet/pro/proposition`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: SLUG, token: "jeton-test", action: "lire" }) })).json();
ok(/Ta fournée du jour \?/.test(prop.proposition?.phrase ?? "") && !/plat du jour/.test(prop.proposition?.phrase ?? ""), `sa proposition du matin : « Ta fournée du jour ? » (${prop.proposition?.phrase})`);
await p.goto(`${BASE}/autour-de-moi/assistante?site=${SLUG}&k=jeton-test`, { waitUntil: "networkidle", timeout: 400000 });
// L'accueil est prêt quand sa carte « Ma famille » est là (avant, un toucher se perd).
await p.waitForSelector(".fc-carte", { timeout: 60000 });
await p.getByText("Publier une annonce", { exact: true }).first().click({ timeout: 30000 });
// L'écran suivant se compile au premier passage (app de développement à froid) : on attend ses mots, pas un temps fixe.
await p.waitForFunction(() => /fournée du jour|plat du jour|menu du jour/i.test(document.body.innerText), null, { timeout: 90000 }).catch(() => {});
await p.screenshot({ path: `${D}/famille-video-3-boulangerie.png` });
// La proposition du matin (« Ta fournée du jour ? ») ou le titre « Publier la fournée du jour », selon qu'elle est arrivée.
const publier = (await p.locator("body").innerText()).replace(/\s+/g, " ");
ok(/fournée du jour/i.test(publier) && !/plat du jour|menu du jour/i.test(publier), "au comptoir : sa fournée du jour, jamais le plat du jour");
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` : ${erreurs[0]}` : ""}`);
await b.close();
console.log(echecs ? `${echecs} ÉCHEC(S)` : "TOUT EST BON");
process.exit(echecs ? 1 : 0);
