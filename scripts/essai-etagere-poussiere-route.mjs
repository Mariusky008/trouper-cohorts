// 📚 L'ÉTAGÈRE, LOT E3 « LA POUSSIÈRE ET LES IDÉES », PAR LES ROUTES — contre le faux Supabase, jamais la vraie base
// (`lib/direct/etagere.ts`, `etagere-serveur.ts`, `/api/direct/etagere`, `/api/direct/proches`).
//
// Sam et Nina se sont dit huit messages, le dernier il y a douze jours ; sur leur étagère, le concert de Nina (le 1er
// du mois dernier, passé) et le fraisier de sa grand-mère. LA POUSSIÈRE : chez Sam, la scène le dit, et sa figurine,
// rien qu'à lui : « 12 jours sans un mot… Votre étagère prend la poussière. Nina avait son concert… », « 🎙️ Lui
// demander comment c'était » ; chez Nina, la sienne (« Tu avais ton concert… ») ; la page : « 🕸️ Elle prend la
// poussière · 12 jours sans un mot » ; sa ligne, dans « Chez moi » : « 🕸️ Votre étagère prend la poussière », en gris.
// SE RALLUMER : Sam lui écrit ; la scène s'éclaire, « L'ÉTAGÈRE SE RALLUME » (une carte, une fois par personne) ; la
// page : « ✨ Bien éclairée · vous vous êtes parlé 1 jour sur 7 ». LES IDÉES : « Offrir » chez Léa : ses pivoines,
// son roman (pas les goûts de Sam) ; pas chez quelqu'un qui n'est pas un proche. LA MESURE : les compteurs du jour.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-etagere-poussiere-route.mjs
import crypto from "node:crypto";
import fs from "node:fs";

const F = "http://127.0.0.1:54321/rest/v1";
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lire = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.status === 200 ? r.json().catch(() => null) : null;
};
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);
const qui8 = (h) => crypto.createHash("sha256").update(`clikme-talkie:qui:${h}`).digest("hex").slice(0, 8);
const paire = (a, b) => [a.id, b.id].sort().join("_");

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `e7a6e7a6-0000-4000-8000-0000000e50${String(n).padStart(2, "0")}`, jeton: `jeton-etagere-e3-route-00${String(n).padStart(2, "0")}`, prenom });
const SAM = qui(1, "Sam");
const NINA = qui(2, "Nina");
const LEA = qui(3, "Léa");
const MAX = qui(4, "Max");
const GENS = [SAM, NINA, LEA, MAX];
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
await json(`${SAM.id}/proches.json`, { ids: [NINA.id, LEA.id] });
for (const x of [NINA, LEA]) await json(`${x.id}/proches.json`, { ids: [SAM.id] });
await json(`${MAX.id}/proches.json`, { ids: [SAM.id] });

const VOIX = fs.readFileSync("scripts/fixtures/voix-essai.mp3");
let rang = 0;
async function message(de, a, texte, ilYaJours) {
  const pair = paire(de, a);
  const ts = Date.now() - ilYaJours * 86_400_000;
  const id = `eq${String(++rang).padStart(10, "0")}`;
  await deposer(`fils/${pair}/s/${id}.mp3`, VOIX, "audio/mpeg");
  await json(`fils/${pair}/m/${String(ts).padStart(13, "0")}-${qui8(de.id)}-${id}.json`, { id, de: de.id, le: new Date(ts).toISOString(), duree: 2, son: `fils/${pair}/s/${id}.mp3`, type: "audio/mpeg", repliques: [{ de: 0, a: 2, texte, tete: null }] });
}
// (huit messages entre Sam et Nina, le dernier il y a douze jours)
for (let k = 0; k < 8; k++) await message(k % 2 ? SAM : NINA, k % 2 ? NINA : SAM, `Message ${k + 1}`, 19 - k);
const jour = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
const moisDernier = (() => {
  const d = new Date(`${jour}T12:00:00Z`);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1, 12)).toISOString().slice(0, 10);
})();
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const nomMois = MOIS[Number(moisDernier.slice(5, 7)) - 1];
const ilYa = (j) => new Date(Date.now() - j * 86_400_000).toISOString();
const objet = (id, de, concerne, x) => ({ id, genre: "date", emoji: "🎧", titre: "Le concert", concerne, citation: "…", de8: qui8(de.id), message: `msg${id}`.padEnd(12, "0").slice(0, 12), le: ilYa(30), etat: "actif", ...x });
await json(`fils/${paire(SAM, NINA)}/etagere.json`, {
  v: 1,
  objets: [
    objet("concert", NINA, qui8(NINA.id), { sorte: "evenement", titreToi: "Ton concert", quand: moisDernier, etat: "passe" }),
    objet("fraisier", NINA, qui8(NINA.id), { genre: "gout", emoji: "🍰", titre: "Le fraisier de sa grand-mère", nuance: "aime" }),
  ],
  lu: Date.now(),
  verrou: 0,
  vus: { [qui8(SAM.id)]: ["concert", "fraisier"], [qui8(NINA.id)]: ["concert", "fraisier"] },
});
await json(`fils/${paire(SAM, LEA)}/etagere.json`, {
  v: 1,
  objets: [
    objet("pivoines", LEA, qui8(LEA.id), { genre: "gout", emoji: "💐", titre: "Les pivoines", nuance: "aime", le: ilYa(3) }),
    objet("phares", LEA, qui8(LEA.id), { genre: "gout", emoji: "📖", titre: "Le roman des phares", nuance: "envie", le: ilYa(2) }),
    objet("pizzas", SAM, qui8(SAM.id), { genre: "gout", emoji: "🍕", titre: "Les pizzas", nuance: "aime", le: ilYa(1) }),
  ],
  lu: Date.now(),
  verrou: 0,
  vus: { [qui8(SAM.id)]: ["pivoines", "phares", "pizzas"] },
});

const voir = async (q, chemin) => {
  const r = await fetch(`${BASE}/api/direct/${chemin}`, { headers: { cookie: `clikme_habitant=${q.jeton}` } });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const vivant = async (q, avec) => (await voir(q, `proches?vivant=${avec.cle}`)).vivant?.etagere;

// ═══ 🕸️ LA POUSSIÈRE ═══
const s1 = await vivant(SAM, NINA);
ok(s1?.etat === "poussiere" && s1.poussiere?.jours === 12, `chez Sam : la poussière, 12 jours sans un mot (${s1?.etat}, ${s1?.poussiere?.jours})`);
ok(s1.poussiere.texte === `12 jours sans un mot… Votre étagère prend la poussière. Nina avait son concert le 1er ${nomMois} 🎧` && s1.poussiere.bouton === "🎙️ Lui demander comment c’était", `rien que pour lui : « ${s1.poussiere.texte} »`);
const n1 = await vivant(NINA, SAM);
ok(n1?.poussiere?.texte.endsWith(`Tu avais ton concert le 1er ${nomMois} 🎧`), `chez Nina, la sienne : « ${n1?.poussiere?.texte} »`);
const page = (await voir(SAM, `etagere?avec=${NINA.cle}`)).etagere;
ok(page?.etat === "poussiere" && page.phraseEtat === "🕸️ Elle prend la poussière · 12 jours sans un mot", `la page : « ${page?.phraseEtat} »`);
const ligne = (await voir(SAM, "proches")).proches?.find((p) => p.cle === NINA.cle)?.etagere;
ok(ligne?.txt === "🕸️ Votre étagère prend la poussière" && ligne.gris === true, "sa ligne, dans « Chez moi » : « 🕸️ Votre étagère prend la poussière », en gris");

// ═══ ✨ SE RALLUMER ═══
const SON = `data:audio/mpeg;base64,${fs.readFileSync("scripts/fixtures/voix-essai.mp3").toString("base64")}`;
const env = await fetch(`${BASE}/api/direct/proches`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${SAM.jeton}` }, body: JSON.stringify({ action: "envoyer", cle: NINA.cle, son: SON, duree: 2.35, repliques: [{ de: 0, a: 2.35, texte: "Alors, ce concert ?", tete: null }] }) });
ok(env.status === 200, "Sam écrit à Nina");
const s2 = await vivant(SAM, NINA);
ok(s2?.etat === "eclairee" && !s2.poussiere && s2.rallumes?.length === 1 && s2.rallumes[0].nouvelle, "la scène s'éclaire : « L'ÉTAGÈRE SE RALLUME », nouvelle");
const r = await fetch(`${BASE}/api/direct/etagere`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${SAM.jeton}` }, body: JSON.stringify({ action: "vu", avec: NINA.cle, ids: [s2.rallumes[0].id] }) });
ok(r.status === 200 && !(await vivant(SAM, NINA)).rallumes[0].nouvelle && (await vivant(NINA, SAM)).rallumes[0].nouvelle, "Sam l'a vue ; chez Nina, elle attend encore");
ok((await vivant(SAM, NINA)).rallumes.length === 1, "une seule fois");
ok((await voir(SAM, `etagere?avec=${NINA.cle}`)).etagere?.phraseEtat === "✨ Bien éclairée · vous vous êtes parlé 1 jour sur 7", "la page : « ✨ Bien éclairée · vous vous êtes parlé 1 jour sur 7 »");
ok(!(await voir(SAM, "proches")).proches?.find((p) => p.cle === NINA.cle)?.etagere?.gris, "sa ligne n'est plus grise");

// ═══ 🎁 LES IDÉES ═══
const g = (await voir(SAM, `etagere?gouts=${LEA.cle}`)).gouts ?? [];
ok(g.map((x) => `${x.emoji} ${x.titre}`).join(" · ") === "📖 le roman des phares · 💐 les pivoines", `« Offrir » chez Léa : ses goûts, pas ceux de Sam (${g.map((x) => x.titre).join(", ")})`);
ok(!((await voir(MAX, `etagere?gouts=${SAM.cle}`)).gouts ?? []).length, "chez quelqu'un qui n'est pas un proche : rien");

// ═══ 📊 LA MESURE ═══
await fetch(`${BASE}/api/direct/etagere`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${SAM.jeton}` }, body: JSON.stringify({ action: "retirer", avec: LEA.cle, id: "pizzas" }) });
const stats = await lire(`stats/etagere/${jour}.json`);
ok(stats?.rallumees === 1 && stats.retires === 1, `les compteurs du jour : une étagère rallumée, un souvenir retiré (${JSON.stringify(stats)})`);

console.log(echecs ? `\n${echecs} échec(s)` : "\nla poussière et les idées tiennent ✓");
process.exit(echecs ? 1 : 0);
