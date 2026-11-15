// 👋 LA BIENVENUE « ENTRE CHEZ PABLITO » (15 novembre 2026, `app/collection/bienvenue-chez.tsx`) — contre le faux
// Supabase, jamais la vraie base.
//
// Sans l'univers de Pablito, son adresse directe (`/bienvenue`) dit où l'adopter. L'administrateur adopte le sien (un
// décor, sa figurine assise, deux clés posées). Puis, sur un iPhone : Pablito debout salue ; « C'est un peu comme
// WhatsApp… » — une conversation grise, puis la brume se lève sur son univers (la saison) ; « Touche-en un » : une clé,
// et pourquoi elle est là ; « Tu fais quoi ce week-end ? » — « 🎬 Ciné samedi », « Je le range ? », oui : l'étagère et
// le rappel du jour venu ; la visite, « laisse-moi un souvenir » — un bouquet se pose, « Merci, je le garde. » ; son
// univers s'agrandit (une nouvelle pièce, un endroit secret, « Qui peut entrer ») ; « Par toi ! » — l'esquisse, « Ta
// place », « 📸 Je crée ma figurine ». Ses neuf voix partent, rien ne déborde, jamais le mot interdit, aucune erreur.
// « Passer » la ferme ; « Rejouer » la reprend. 🐾 Son chat, Moustache (les boucles de l'essai C0) : il dort quand la
// brume se lève, l'invité le réveille, il dresse l'oreille au week-end, saute de joie au rangement, renifle le souvenir,
// vient sur les genoux de Pablito quand il raconte son univers — et quand rien ne se passe ; un toucher : son nom. Les images sont des images d'essai (le décor : un salon de
// `public/direct/ensemble` ; la figurine : `scripts/fixtures/figurine-assise-essai.webp`).
import fs from "node:fs";
import { BASE, D, F, lancer } from "./commun.mjs";

const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

// ─── l'administrateur, son téléphone, son univers ───
const ADMIN = "00000000-0000-4000-8000-0000000ad001";
await semer("admins", [{ user_id: ADMIN }]);
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const session = {
  access_token: "faux-admin",
  token_type: "bearer",
  expires_in: 86400,
  expires_at: Math.floor(Date.now() / 1000) + 86400,
  refresh_token: "faux",
  user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} },
};
const COOKIE_ADMIN = `sb-127-auth-token=base64-${b64(session)}`;
const PROPRIO = { id: "abababab-0000-4000-8000-000000000c11", jeton: "jeton-proprio-bienvenue-chez1", prenom: "Marius" };
await semer("human_habitants", [{ id: PROPRIO.id, device_token: PROPRIO.jeton, prenom: PROPRIO.prenom, ville_slug: "dax" }]);
const maintenant = new Date().toISOString();
const FIG = fs.readFileSync("scripts/fixtures/figurine-assise-essai.webp");
const DECOR = fs.readFileSync("public/direct/ensemble/scene-chalet.webp");
const P1 = `${PROPRIO.id}/perso/v1`;
for (const n of ["assise", "assise_parle", "debout"]) await deposer(`${P1}/${n}.webp`, FIG, "image/webp");
const perso = {
  version: 1,
  style: "collection-1",
  creee_le: maintenant,
  validee_le: maintenant,
  references: { assise: { chemin: `${P1}/assise.webp` }, assise_parle: { chemin: `${P1}/assise_parle.webp` }, debout: { chemin: `${P1}/debout.webp` } },
  historique: [{ version: 1, le: maintenant, raison: "« C’est moi ! »", style: "collection-1" }],
};
await json(`${P1}/fiche.json`, perso);
await json(`${PROPRIO.id}/perso/fiche.json`, perso);
const M1 = `${PROPRIO.id}/monde/v1`;
await deposer(`${M1}/decor.webp`, DECOR, "image/webp");
const monde = {
  version: 1,
  style: "film-chaleureux-1",
  creee_le: maintenant,
  validee_le: maintenant,
  proposition: "Je t'imagine dans un chalet face aux montagnes.",
  ambiance: { lumiere: "fin d'après-midi dorée", palette: ["#e8b06a", "#2f5d73", "#f3ead9"] },
  elements: [
    { id: "e1", quoi: "les montagnes", pourquoi: "je marche là-haut tous les dimanches", source: "dit", valide: true, zone: [0.55, 0.1, 0.4, 0.14] },
    { id: "e2", quoi: "la cheminée", pourquoi: "un coin chaud pour les soirs d’hiver, j’ai imaginé", source: "interpretation", zone: [0.02, 0.12, 0.3, 0.2] },
  ],
  regles: [],
  inconnus: [],
  scene: { sol: 0.8, places: [{ id: "hote", x: 0.5, y: 0.66, echelle: 1 }, { id: "invite", x: 0.75, y: 0.66, echelle: 1 }], lumiere: { vient_de: "gauche", couleur: "#ffd9a0" }, figurine: { x: 0.42, y: 0.64, hauteur: 0.2 } },
  references: { decor: { chemin: `${M1}/decor.webp` } },
  visibilite: "proches",
  souvenirs: [],
  historique: [{ version: 1, le: maintenant, raison: "sa conversation avec Pablito", style: "film-chaleureux-1" }],
};
await json(`${M1}/fiche.json`, monde);
await json(`${PROPRIO.id}/monde/fiche.json`, monde);
// 🐾 les boucles du chat (une vidéo d'essai, sur fond vert)
const MP4 = fs.readFileSync("scripts/fixtures/chat-fond-vert-essai.mp4");
for (const bc of ["assis", "dort", "genoux", "alerte", "saut", "renifle", "marche"]) await deposer(`compagnons/chat/${bc}/video.mp4`, MP4, "video/mp4");
/** Le chat joue-t-il cette boucle (dans les `ms` qui viennent) ? */
const chat = (p, boucle, ms = 4000) => p.locator(`.bc-chat[data-boucle="${boucle}"]`).waitFor({ timeout: ms }).then(() => true).catch(() => false);

const b = await lancer({ args: ["--autoplay-policy=no-user-gesture-required"] });
const erreurs = [];
const tel = async () => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(String(e)));
  p.sons = [];
  p.on("request", (r) => /\/collection\/pablito\/.+\.mp3/.test(r.url()) && p.sons.push(new URL(r.url()).pathname.replace(/^.*\/|\.mp3$/g, "")));
  return p;
};
const texte = async (p, sel) => (await p.locator(sel).first().innerText({ timeout: 15000 }).catch(() => "")).replace(/\s+/g, " ").trim();
const debordement = (p) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const sansMotInterdit = async (p) => !/exemple/i.test(await p.evaluate(() => document.body.innerText));
/** La bulle `rang` est dite (écrite en entier). */
const dite = (p, rang) => p.locator(`.bc[data-rang="${rang}"][data-dit="oui"]`).waitFor({ timeout: 20000 }).then(() => true).catch(() => false);
const repondre = async (p, mot) => {
  await p.locator(".bv-reponses button", { hasText: mot }).first().click();
  await p.waitForTimeout(300);
};

// ═══ SANS L'UNIVERS DE PABLITO ═══
const avant = await tel();
await avant.goto(`${BASE}/bienvenue`, { waitUntil: "networkidle" });
ok(/pas encore adopté/.test(await texte(avant, ".ab-carte")) && (await avant.locator(".ab-carte a[href='/admin/humain/univers-essais']").count()) === 1, "sans l'univers de Pablito : sa page dit où l'adopter");
await avant.context().close();

// ═══ L'ADMINISTRATEUR ADOPTE LE SIEN ═══
const adopte = await fetch(`${BASE}/api/admin/direct/pablito`, { method: "POST", headers: { "content-type": "application/json", cookie: `${COOKIE_ADMIN}; clikme_habitant=${PROPRIO.jeton}` }, body: JSON.stringify({ action: "adopter-univers" }) });
ok(adopte.status === 200, "l'administrateur adopte son univers comme celui de Pablito");

// ═══ LA BIENVENUE, SUR UN IPHONE ═══
const p = await tel();
await p.goto(`${BASE}/bienvenue`, { waitUntil: "domcontentloaded" });
await p.locator(".bc").waitFor({ timeout: 15000 });
ok(await dite(p, 1), "1 · Pablito salue (sa bulle s'écrit au rythme de sa voix)");
ok((await p.locator(".bc-scene.grand .bc-accueil:not(.parti) .bv-debout").count()) === 1 && (await p.locator(".bc-monde.flou").count()) === 1, "Pablito debout, en grand, devant son univers flou");
await p.screenshot({ path: `${D}/bienvenue-chez-1-salut.png` });

await repondre(p, "C’est quoi, ClikMe ?");
await p.locator(".bc-gris:not(.parti)").waitFor({ timeout: 8000 }).catch(() => null);
ok((await p.locator(".bc-gris").count()) === 1, "2 · « comme WhatsApp » : une conversation grise, ordinaire");
await p.locator(".bc-gris.parti").waitFor({ timeout: 15000 }).catch(() => null);
ok((await p.locator(".bc-gris.parti").count()) === 1 && (await p.locator(".bc-saison").count()) === 1, "« Mais ici » : la brume se lève sur son univers, avec la saison");
ok(/Moustache/.test(await texte(p, ".bc-chat-nom")), "🐾 son chat, et son nom la première fois : Moustache");
ok(await dite(p, 2), "sa deuxième bulle est dite");
await p.waitForTimeout(2900);
await p.screenshot({ path: `${D}/bienvenue-chez-2-son-univers.png` });
ok((await p.locator(".bc-place .bc-fig").count()) >= 1 && (await p.locator(".bc-monde.flou").count()) === 0, "sa figurine assise, chez elle, à sa place");
ok((await chat(p, "dort")) && (await p.locator(".bc-chat canvas").count()) === 1, "🐾 son chat dort à côté de lui (le vert retiré dans une toile)");

await repondre(p, "On est où, là ?");
ok(await dite(p, 3), "3 · « Là, tu es chez moi… Touche-en un »");
ok((await p.locator(".bc-point").count()) === 2 && /Touche un objet/.test(await texte(p, ".bv-reponses")), "ses deux clés posées sur le décor ; « Touche un objet »");
ok(await chat(p, "assis"), "🐾 l'invité l'a réveillé : il est assis");
ok(await chat(p, "genoux", 12000), "🐾 rien ne se passe (sept secondes) : il vient ronronner sur les genoux de Pablito");
await p.screenshot({ path: `${D}/bienvenue-chez-3b-le-chat-sur-ses-genoux.png` });
await p.waitForTimeout(1200);
await p.locator(".bc-point").first().click();
ok(await chat(p, "assis", 6000), "🐾 on touche une clé : il retourne s'asseoir");
ok(/Les montagnes/.test(await texte(p, ".bc-cle")) && /« je marche là-haut tous les dimanches »/.test(await texte(p, ".bc-cle")), "une clé : ce qui est là, et pourquoi (ses mots)");
await p.screenshot({ path: `${D}/bienvenue-chez-3-une-cle.png` });

await repondre(p, "Trop beau ! Et après ?");
ok(await dite(p, 4), "4 · « Quand on se parle, ma figurine écoute. Tiens : tu fais quoi ce week-end ? »");
ok((await p.locator(".bv-reponses .bc-option").count()) === 3, "trois réponses au choix");
await repondre(p, "Ciné samedi");
ok(await chat(p, "alerte", 2000), "🐾 le week-end : il dresse l'oreille");
ok(/Je le range \?/i.test(await texte(p, ".bc-range")) && /Samedi : ciné/.test(await texte(p, ".bc-range")), "sa figurine demande : « Je le range ? 📅 Samedi : ciné »");
await p.screenshot({ path: `${D}/bienvenue-chez-4-je-le-range.png` });
await repondre(p, "Oui, range-le");
ok(await chat(p, "saut", 2000), "🐾 rangé : un saut de joie");
await p.locator(".bc-rappel").waitFor({ timeout: 6000 }).catch(() => null);
ok((await p.locator(".bc-etagere.pleine").count()) === 1 && /Ce soir, ciné/.test(await texte(p, ".bc-rappel")), "rangé sur l'étagère, puis le rappel du jour venu");
await p.waitForTimeout(700);
await p.screenshot({ path: `${D}/bienvenue-chez-5-range.png` });

await repondre(p, "Et mes proches ?");
ok(await dite(p, 5), "5 · « Tes proches peuvent le visiter… »");
ok((await p.locator(".bc-visite").count()) === 1, "« Tu es chez Pablito, en visite »");
ok(await dite(p, 6), "puis, d'elle-même : « Tu es mon invité : laisse-moi un souvenir ! »");
ok((await p.locator(".bv-reponses .bc-option").count()) === 4, "quatre souvenirs au choix");
await repondre(p, "Un bouquet");
ok(await chat(p, "renifle", 4000), "🐾 il va renifler le bouquet");
ok((await p.locator(".bc-souvenir").count()) === 1, "le bouquet se pose chez lui, « de ta part »");
ok(await dite(p, 7), "« Merci, je le garde. »");
await p.screenshot({ path: `${D}/bienvenue-chez-6-souvenir.png` });

await repondre(p, "Et le mien, il sera comment ?");
ok(await dite(p, 8), "6 · « Ton univers s'agrandit à chaque conversation… »");
ok((await p.locator(".bc-etiquette-flotte").count()) === 2 && (await p.locator(".bc-acces").count()) === 1, "une nouvelle pièce, un endroit secret, « Qui peut entrer »");
ok(await chat(p, "genoux", 5000), "🐾 pendant qu'il raconte : sur ses genoux");
await p.locator(".bc-chat").click();
ok(/Moustache/.test(await texte(p, ".bc-chat-nom")) && (await chat(p, "genoux", 500)), "🐾 un toucher sur le chat, sur ses genoux : son nom (il continue de ronronner)");
await p.screenshot({ path: `${D}/bienvenue-chez-7-il-grandit.png` });

await repondre(p, "Ça commence comment ?");
ok(await dite(p, 9), "7 · « Par toi ! Un selfie pour ta figurine… »");
ok((await p.locator(".bc-chat.cache").count()) === 1, "🐾 à la fin (l'esquisse), il s'efface");
ok((await p.locator(".bc-place.vide .bc-ta-place").count()) === 1 && (await p.locator(".bv-reponses .tu-creer").count()) === 1, "« Ta place », vide ; « 📸 Je crée ma figurine »");
await p.waitForTimeout(2800);
await p.screenshot({ path: `${D}/bienvenue-chez-8-par-toi.png` });
ok((await debordement(p)) <= 0 && (await sansMotInterdit(p)), "rien ne déborde, jamais le mot interdit");
const attendus = ["tuto-bienvenue-1", "tuto-univers-2", "tuto-chez-3", "tuto-chez-4", "tuto-univers-5", "tuto-chez-5", "tuto-chez-5-merci", "tuto-univers-4", "tuto-univers-6"];
ok(
  attendus.every((s) => p.sons.includes(s)),
  `ses neuf voix sont parties (${attendus.filter((s) => !p.sons.includes(s)).join(", ") || "toutes"})`,
);

await p.locator(".bv-reponses .tu-creer").click();
ok(/Fin de la bienvenue/.test(await texte(p, ".ab-carte")) && /ouvre l’atelier/.test(await texte(p, ".ab-carte")), "« Je crée ma figurine » : ce que le bouton fait dans l'appli");
await p.locator(".ab-carte button").click();
ok(await dite(p, 1), "« Rejouer » : elle reprend depuis le début");
await p.locator(".tu-passer").click();
ok(/« Passer »/.test(await texte(p, ".ab-carte")), "« Passer » la ferme");
ok(erreurs.length === 0, `aucune erreur dans la page${erreurs.length ? ` (${erreurs[0]})` : ""}`);

await b.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
