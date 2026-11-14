// ✍️ ÉCRIRE, PARTAGER (lot M1), PAR LES ROUTES — contre le faux Supabase et le faux site des aperçus, jamais la vraie
// base (`lib/direct/ecrit.ts`, `ecrit-serveur.ts`, `POST /api/direct/proches`).
//
// Léa et Sam sont proches ; Max a ajouté Léa, pas l'inverse. Sans session : 401 ; Max : 403. Léa écrit à Sam : le
// message est gardé dans le même dossier que les vocaux (un vocal d'avant, un écrit, un vocal d'après : le fil les range
// dans l'ordre) ; la tête choisie par les règles (« mdr » : le rire), ou la sienne ; la bulle (140 signes) ; chez Sam,
// « nouveau », un non-lu, sa ligne de « Chez moi » ; la notification « ✍️ Léa t'a écrit ». Ce qui est refusé : un texte
// vide, trop long (1 001 signes), un mot interdit, au-delà de trois cents par jour. UN LIEN : l'aperçu préparé après la
// réponse (le titre, le site, l'image recopiée chez nous en WebP de 600 pixels) ; une redirection suivie ; la
// notification « 🔗 Léa t'a envoyé un lien » ; une page sans titre ; une page trop lente (plus de 5 s) ; les adresses
// internes jamais lues (le faux site n'a jamais reçu ces demandes). LES FIGURINES LISENT L'ÉCRIT : « Jeudi prochain je
// passe le permis » écrit se note sur l'étagère (une question à Léa). EFFACER : le sien, dans les 24 heures, pour les deux
// (pas celui de l'autre : 403 ; plus vieux : 400). SIGNALER un écrit : il disparaît chez celui qui signale. LA MESURE.
// LE FREIN (`CLIKME_ECRIT=0`, une seconde app) : plus d'écrit (404), ce qui a été écrit reste lisible.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI, dont CLIKME_APERCU_ESSAI_BASE)
//   node scripts/essai-messages-route.mjs
import crypto from "node:crypto";
import fs from "node:fs";
import sharp from "sharp";
import { lancerSecondeApp } from "./seconde-app.mjs";
import { recus, telephone } from "./navigateur/commun.mjs";

const F = "http://127.0.0.1:54321/rest/v1";
const FAUX = F.replace("/rest/v1", "");
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = `${FAUX}/storage/v1/object`;
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lire = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.status === 200 ? r.json().catch(() => null) : null;
};
const lireOctets = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.status === 200 ? Buffer.from(await r.arrayBuffer()) : null;
};
const lister = async (dossier) => {
  const r = await fetch(`${STOCK}/list/figurines-clients`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prefix: dossier, limit: 1000 }) });
  return r.status === 200 ? ((await r.json().catch(() => [])) ?? []).map((x) => x.name) : [];
};
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);
const qui8 = (h) => crypto.createHash("sha256").update(`clikme-talkie:qui:${h}`).digest("hex").slice(0, 8);
const paire = (a, b) => [a.id, b.id].sort().join("_");
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `e7a6e7a6-0000-4000-8000-0000000f10${String(n).padStart(2, "0")}`, jeton: `jeton-messages-m1-route-00${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const MAX = qui(3, "Max");
const GENS = [LEA, SAM, MAX];
for (const x of GENS) x.cle = cleProfil(x.id);
const maintenant = new Date().toISOString();
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
for (const x of GENS) {
  await deposer(`${x.id}/neutre-essai.png`, PNG, "image/png");
  await json(`profils/${x.cle}.json`, { h: x.id });
}
await semer(
  "clik_ma_figurine",
  GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, neutre: `${x.id}/neutre-essai.png`, parle: `${x.id}/neutre-essai.png`, prete_le: maintenant })),
);
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
await json(`${MAX.id}/proches.json`, { ids: [LEA.id] });

const VOIX = fs.readFileSync("scripts/fixtures/voix-essai.mp3");
let rang = 0;
/** Un vocal déjà envoyé, il y a quelques minutes. */
async function vocal(de, a, texte, ilYaMin) {
  const pair = paire(de, a);
  const ts = Date.now() - ilYaMin * 60_000;
  const id = `mv${String(++rang).padStart(10, "0")}`;
  await deposer(`fils/${pair}/s/${id}.mp3`, VOIX, "audio/mpeg");
  await json(`fils/${pair}/m/${String(ts).padStart(13, "0")}-${qui8(de.id)}-${id}.json`, { id, de: de.id, le: new Date(ts).toISOString(), duree: 2, son: `fils/${pair}/s/${id}.mp3`, type: "audio/mpeg", repliques: [{ de: 0, a: 2, texte, tete: null }] });
  return id;
}
const voir = async (q, chemin, base = BASE) => {
  const r = await fetch(`${base}/api/direct/${chemin}`, { headers: q ? { cookie: `clikme_habitant=${q.jeton}` } : {} });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const poster = async (q, corps, base = BASE) => {
  const r = await fetch(`${base}/api/direct/proches`, { method: "POST", headers: { "content-type": "application/json", ...(q ? { cookie: `clikme_habitant=${q.jeton}` } : {}) }, body: JSON.stringify(corps) });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const ecrire = (q, avec, texte, x = {}, base = BASE) => poster(q, { action: "ecrire", cle: avec.cle, texte, ...x }, base);
const fil = async (q, avec, base = BASE) => (await voir(q, `proches?fil=${avec.cle}`, base)).fil;
const ficheDe = async (a, b, id) => {
  const nom = (await lister(`fils/${paire(a, b)}/m`)).find((n) => n.endsWith(`-${id}.json`));
  return nom ? lire(`fils/${paire(a, b)}/m/${nom}`) : null;
};
/** L'aperçu se prépare après la réponse : on attend qu'il soit là (ou qu'il n'y en ait pas). */
async function attendreApercu(a, b, id, ms = 12000) {
  let f = null;
  for (let t = 0; t < ms; t += 300) {
    f = await ficheDe(a, b, id);
    if (f?.lien?.titre) return f;
    await attendre(300);
  }
  return f;
}

// ═══ LES PORTES ═══
ok((await poster(null, { action: "ecrire", cle: SAM.cle, texte: "Salut" })).statut === 403, "sans session : refusé");
ok((await ecrire(MAX, LEA, "Coucou Léa")).statut === 403, "Max (il a ajouté Léa, pas l'inverse) : 403");
ok((await ecrire(LEA, { cle: "0000000000000000" }, "Coucou")).statut === 404, "un proche qui n'existe pas : 404");

// ═══ ✍️ LÉA ÉCRIT À SAM ═══
const telSam = telephone("sam-messages");
await json(`notif/abonnes/${SAM.id}.json`, { h: SAM.id, ville: "dax", abonnements: [telSam.abonnement], le: new Date().toISOString() });
const v1 = await vocal(SAM, LEA, "Tu fais quoi ce week-end ?", 6);
const e1 = await ecrire(LEA, SAM, "Trop drôle ton histoire de canard, mdr 😂 On se voit samedi ?");
const m1 = e1.message;
ok(e1.statut === 200 && m1?.genre === "ecrit" && m1.moi && m1.son === "" && m1.texte === "Trop drôle ton histoire de canard, mdr 😂 On se voit samedi ?", `écrit : « ${m1?.texte} »`);
ok(m1?.repliques?.length === 1 && m1.repliques[0].tete === "rire" && m1.repliques[0].texte === m1.texte && m1.duree >= 2 && m1.duree <= 12, `la tête choisie par les règles (« mdr » : ${m1?.repliques?.[0]?.tete}), le temps de le dire (${m1?.duree} s)`);
await attendre(30);
const v2 = await vocal(SAM, LEA, "Samedi ça marche !", 0);
const fiche1 = await ficheDe(LEA, SAM, m1.id);
ok(fiche1?.genre === "ecrit" && fiche1.de === LEA.id && fiche1.tete === "rire" && !fiche1.son && !fiche1.lien, "gardé dans le dossier des vocaux : { genre: \"ecrit\", texte, tete }");
const fs1 = await fil(SAM, LEA);
const ordre = (fs1?.messages ?? []).map((x) => x.id);
ok(ordre.join(",") === [v1, m1.id, v2].join(","), `le fil range vocaux et écrits dans l'ordre (${ordre.length} messages)`);
const vuSam = fs1?.messages?.find((x) => x.id === m1.id);
ok(vuSam && !vuSam.moi && vuSam.nouveau && vuSam.genre === "ecrit" && vuSam.repliques[0].tete === "rire", "chez Sam : l'écrit de Léa, nouveau, dans la tête du rire");
const e2 = await ecrire(LEA, SAM, "Salut", { tete: "colere" });
ok(e2.message?.repliques?.[0]?.tete === "colere", "la tête qu'elle a choisie (parmi les siennes) est gardée");
const e3 = await ecrire(LEA, SAM, "Salut encore", { tete: "inconnue" });
ok(e3.statut === 200 && e3.message?.repliques?.[0]?.tete !== "inconnue", "une tête qui n'existe pas : les règles choisissent");
const longTexte = `${"On se voit samedi pour le cinéma et après on mange une crêpe au marché, ".repeat(3)}fin`;
const e4 = await ecrire(LEA, SAM, longTexte);
ok(e4.message?.texte === longTexte && [...e4.message.repliques[0].texte].length <= 140 && e4.message.repliques[0].texte.endsWith("…"), "un long message : en entier dans le fil, 140 signes dans la bulle");
let notifs = [];
for (let k = 0; k < 30 && !notifs.some((n) => n.title === "✍️ Léa t’a écrit"); k++) {
  notifs = await recus(telSam);
  await attendre(300);
}
const n1 = notifs.find((n) => n.title === "✍️ Léa t’a écrit");
ok(n1 && [...n1.body].length <= 60 && n1.body.startsWith("Trop drôle ton histoire") && n1.url === `/collection?parler=${LEA.cle}#proches`, `la notification : « ${n1?.title} » — « ${n1?.body} »`);
const liste = (await voir(SAM, "proches")).proches ?? [];
const pLea = liste.find((p) => p.cle === LEA.cle);
ok(pLea?.nonLus >= 1 && pLea.dernier?.ecrit && pLea.dernier.texte === longTexte.replace(/\s+/g, " ").trim() && !pLea.dernier.moi, `« Chez moi », chez Sam : ${pLea?.nonLus} non-lu(s), la ligne de Léa (un écrit)`);

// ═══ CE QUI EST REFUSÉ ═══
ok((await ecrire(LEA, SAM, "   ")).statut === 400 && (await ecrire(LEA, SAM, "   ")).error === "Écris quelque chose d’abord.", "un message vide : « Écris quelque chose d'abord. »");
const trop = await ecrire(LEA, SAM, "a".repeat(1001));
ok(trop.statut === 400 && trop.error === "Un message de 1 000 signes au plus.", `1 001 signes : « ${trop.error} »`);
const vilain = await ecrire(LEA, SAM, "T'es vraiment un connard");
ok(vilain.statut === 422 && vilain.error === "Ça, ta figurine ne le dit pas. Réessaie autrement 🙂", "un mot interdit : la phrase des vocaux");
const jourParis = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
await json(`${LEA.id}/ecrits-jour.json`, { jour: jourParis, n: 300 });
const assez = await ecrire(LEA, SAM, "Encore un");
ok(assez.statut === 429 && assez.error === "Assez de messages pour aujourd’hui : reviens demain.", "au-delà de trois cents par jour : demain");
await json(`${LEA.id}/ecrits-jour.json`, { jour: jourParis, n: 10 });

// ═══ 🔗 UN LIEN ═══
const l1 = await ecrire(LEA, SAM, "Regarde la bande-annonce : http://pages.essai.invalid/pages/film.");
ok(l1.statut === 200 && l1.message?.lien?.url === "http://pages.essai.invalid/pages/film" && l1.message.lien.site === "pages.essai.invalid" && !l1.message.lien.titre, "le lien reconnu (sans le point de la phrase), l'aperçu pas encore là");
const fl1 = await attendreApercu(LEA, SAM, l1.message.id);
ok(fl1?.lien?.titre === "Le Grand Bleu — la bande-annonce" && fl1.lien.site === "Cinéma & Co" && fl1.lien.image === `fils/${paire(LEA, SAM)}/a/${l1.message.id}.webp`, `l'aperçu, préparé après la réponse : « ${fl1?.lien?.titre} » · ${fl1?.lien?.site}`);
const img = await lireOctets(fl1?.lien?.image ?? "x");
const meta = img ? await sharp(img).metadata().catch(() => null) : null;
ok(meta?.format === "webp" && meta.width <= 600 && img.length < 200_000, `l'image recopiée chez nous, en WebP, ${meta?.width} pixels de large (${img?.length ?? 0} octets)`);
const vl = (await fil(SAM, LEA))?.messages?.find((x) => x.id === l1.message.id);
ok(vl?.lien?.titre === "Le Grand Bleu — la bande-annonce" && /^http/.test(vl.lien.image ?? "") && !vl.lien.image.includes("pages.essai.invalid"), "chez Sam : l'aperçu, l'image servie par chez nous (jamais par le site)");
const lienSeul = await ecrire(LEA, SAM, "http://pages.essai.invalid/pages/vers-film");
const fl2 = await attendreApercu(LEA, SAM, lienSeul.message.id);
ok(fl2?.lien?.titre === "Le Grand Bleu — la bande-annonce", "une redirection : suivie (et revérifiée)");
for (let k = 0; k < 30 && !notifs.some((n) => n.title === "🔗 Léa t’a envoyé un lien"); k++) {
  notifs = await recus(telSam);
  await attendre(300);
}
const n2 = notifs.find((n) => n.title === "🔗 Léa t’a envoyé un lien");
ok(n2?.body === "Le Grand Bleu — la bande-annonce", `un lien seul : « ${n2?.title} » — « ${n2?.body} »`);
ok(((await voir(SAM, "proches")).proches ?? []).find((p) => p.cle === LEA.cle)?.dernier?.texte === "🔗 Le Grand Bleu — la bande-annonce", "la ligne de « Chez moi » : « 🔗 Le titre du lien »");
const sansTitre = await ecrire(LEA, SAM, "http://pages.essai.invalid/pages/sans-titre");
const lente = await ecrire(LEA, SAM, "http://pages.essai.invalid/pages/lente");
await attendre(9000);
const fs3 = await ficheDe(LEA, SAM, sansTitre.message.id);
const fl4 = await ficheDe(LEA, SAM, lente.message.id);
ok(fs3?.lien?.url && !fs3.lien.titre && !fs3.lien.image, "une page sans titre : le lien tout simple");
ok(fl4?.lien?.url && !fl4.lien.titre, "une page trop lente (plus de 5 s) : le lien tout simple");
const avantPages = ((await (await fetch(`${FAUX}/__pages`)).json()) ?? []).length;
const internes = ["http://127.0.0.1:54321/pages/film", "http://localhost:54321/pages/film", "http://[::1]:54321/pages/film", "http://2130706433:54321/pages/film", "http://169.254.169.254/latest/meta-data/"];
const ids = [];
for (const u of internes) ids.push((await ecrire(LEA, SAM, `Regarde ${u}`)).message?.id);
await attendre(4000);
const fichesInternes = await Promise.all(ids.map((id) => ficheDe(LEA, SAM, id)));
ok(fichesInternes.every((f) => f?.lien?.url && !f.lien.titre && !f.lien.image), "les adresses internes : jamais d'aperçu (le lien tout simple)");
ok(((await (await fetch(`${FAUX}/__pages`)).json()) ?? []).length === avantPages, "le faux site n'a reçu aucune de ces demandes : le serveur ne les a jamais lues");
const yt = await ecrire(LEA, SAM, "https://www.youtube.com/watch?v=abc123");
ok(yt.message?.lien?.sorte === "video" && yt.message.lien.site === "youtube.com", "un site de vidéo connu : sa carte (« video »)");

// ═══ 📚 LES FIGURINES LISENT L'ÉCRIT ═══
// (l'étagère lit ce qui s'est posé depuis une minute : on repart d'une conversation à eux, toute neuve)
const NINA = qui(4, "Nina");
NINA.cle = cleProfil(NINA.id);
await semer("human_habitants", [{ id: NINA.id, device_token: NINA.jeton, prenom: NINA.prenom, ville_slug: "dax" }]);
await deposer(`${NINA.id}/neutre-essai.png`, PNG, "image/png");
await json(`profils/${NINA.cle}.json`, { h: NINA.id });
await semer("clik_ma_figurine", [{ habitant_id: NINA.id, prenom: NINA.prenom, photo: `${NINA.id}/photo.jpg`, accord_le: maintenant, neutre: `${NINA.id}/neutre-essai.png`, parle: `${NINA.id}/neutre-essai.png`, prete_le: maintenant }]);
await json(`${LEA.id}/proches.json`, { ids: [SAM.id, NINA.id] });
await json(`${NINA.id}/proches.json`, { ids: [LEA.id] });
// (un message écrit il y a trois minutes : l'échange s'est posé)
const vieux = Date.now() - 3 * 60_000;
await json(`fils/${paire(LEA, NINA)}/m/${String(vieux).padStart(13, "0")}-${qui8(LEA.id)}-ecritpermis1.json`, { id: "ecritpermis1", de: LEA.id, le: new Date(vieux).toISOString(), genre: "ecrit", texte: "Jeudi prochain je passe le permis, je stresse trop", tete: "tete" });
await voir(NINA, `proches?vivant=${LEA.cle}`);
let et = null;
for (let k = 0; k < 40 && !et?.objets?.length; k++) {
  await attendre(300);
  et = await lire(`fils/${paire(LEA, NINA)}/etagere.json`);
}
const pp = et?.objets?.[0];
ok(pp?.genre === "date" && pp.citation === "Jeudi prochain je passe le permis, je stresse trop" && pp.etat === "propose" && pp.demande?.a === qui8(LEA.id), "leurs figurines lisent l'écrit : le permis se note (une question à Léa)");

// ═══ 🗑️ EFFACER ═══
const ef = await ecrire(LEA, SAM, "Oups, pas pour toi");
ok((await poster(SAM, { action: "effacer", cle: LEA.cle, id: ef.message.id })).statut === 403, "Sam ne peut pas effacer le message de Léa (403)");
const ok1 = await poster(LEA, { action: "effacer", cle: SAM.cle, id: ef.message.id });
ok(ok1.statut === 200 && !(await ficheDe(LEA, SAM, ef.message.id)) && !(await fil(SAM, LEA))?.messages?.some((x) => x.id === ef.message.id) && !(await fil(LEA, SAM))?.messages?.some((x) => x.id === ef.message.id), "Léa efface le sien : parti, pour les deux");
ok((await poster(LEA, { action: "effacer", cle: SAM.cle, id: ef.message.id })).statut === 404, "l'effacer deux fois : il n'existe plus");
const avecImage = l1.message.id;
ok((await poster(LEA, { action: "effacer", cle: SAM.cle, id: avecImage })).statut === 200 && !(await lireOctets(`fils/${paire(LEA, SAM)}/a/${avecImage}.webp`)), "un lien effacé : l'image de son aperçu aussi");
const vVocal = await vocal(LEA, SAM, "Un vieux vocal", 25 * 60);
const trop24 = await poster(LEA, { action: "effacer", cle: SAM.cle, id: vVocal });
ok(trop24.statut === 400 && trop24.error === "Il ne peut plus être effacé (24 heures au plus).", "plus de 24 heures : il reste");
const vRecent = await vocal(LEA, SAM, "Un vocal récent", 2);
ok((await poster(LEA, { action: "effacer", cle: SAM.cle, id: vRecent })).statut === 200 && !(await lireOctets(`fils/${paire(LEA, SAM)}/s/${vRecent}.mp3`)), "un vocal aussi, avec sa voix");

// ═══ 🚩 SIGNALER UN ÉCRIT ═══
const sg = await ecrire(LEA, SAM, "Un message que Sam ne veut plus voir");
ok((await poster(SAM, { action: "signaler", cle: LEA.cle, id: sg.message.id })).statut === 200 && !(await fil(SAM, LEA))?.messages?.some((x) => x.id === sg.message.id) && (await fil(LEA, SAM))?.messages?.some((x) => x.id === sg.message.id), "Sam le signale : il disparaît chez lui (l'équipe le regarde)");

// ═══ 📊 LA MESURE ═══
const st = await lire(`stats/messages/${jourParis}.json`);
ok(st?.ecrits >= 10 && st.liens >= 8 && st.apercus >= 2 && st.sansApercu >= 2 && st.effaces >= 3 && st.ecrivains >= 1, `les compteurs du jour : ${st?.ecrits} écrits, ${st?.liens} liens, ${st?.apercus} aperçus, ${st?.sansApercu} sans aperçu, ${st?.effaces} effacés`);

// ═══ LE FREIN ═══
const seconde = await lancerSecondeApp({ port: 3825, env: { CLIKME_ECRIT: "0" } });
try {
  const ferme = await ecrire(LEA, SAM, "Encore là ?", {}, seconde.base);
  ok(ferme.statut === 404 && ferme.error === "Écrire n’est pas encore ouvert.", "le frein serré : plus d'écrit (404)");
  ok((await fil(SAM, LEA, seconde.base))?.messages?.some((x) => x.id === m1.id && x.genre === "ecrit"), "le frein serré : ce qui a été écrit reste lisible");
} finally {
  seconde.arreter();
}

console.log(echecs ? `\n${echecs} échec(s)` : "\nl'écrit tient, par les routes ✓");
process.exit(echecs ? 1 : 0);
