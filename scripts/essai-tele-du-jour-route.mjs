// 📺 MA TÉLÉ DU JOUR (`lib/direct/tele-du-jour.ts`, `tele-du-jour-serveur.ts`, `app/api/direct/tele-du-jour` ; le lot
// D1 de Découvrir, `docs/univers/decouvrir.md` section 15), PAR LES ROUTES — contre le faux Supabase et le faux YouTube
// (jamais la vraie base, jamais Google).
//
// La nuit passe (la sélection du lot D0). Léa (adulte : le foot, la cuisine, les animaux) : ses vidéos, celles de ses
// trois passions, mêlées (les trois thèmes dès les trois premières), sans doublon, quarante au plus. Vue jusqu'au bout :
// elle ne revient plus, son thème monte ; passée avant 15 s : il descend ; illisible : rien ne bouge. Le foot très
// regardé revient plus souvent, sans faire disparaître les autres. 📌 Garder : elle va chez elle (un clip, son lien) ;
// deux fois : « déjà chez toi » ; une vidéo qui n'est pas à sa télé : 404. 📤 Envoyer à Sam (son proche) : un message
// dans leur conversation, sur la télé de leur duo — Sam la voit ; à Max (pas son proche) : refusé. Noé (15 ans) : pas
// le salon des jeunes parents, même s'il est dans ses passions ; ses vidéos sont celles des 15-17 ans. Sans passions :
// rien (« Tes passions » d'abord). Sans compte : 401.
import crypto from "node:crypto";

const F = "http://127.0.0.1:54321/rest/v1";
const FAUX = F.replace("/rest/v1", "");
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = `${FAUX}/storage/v1/object`;
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const json = (chemin, x) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(x) });
const lire = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.status === 200 ? r.json().catch(() => null) : null;
};
const lister = async (dossier) => {
  const r = await fetch(`${STOCK}/list/figurines-clients`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prefix: dossier, limit: 1000 }) });
  return r.status === 200 ? ((await r.json().catch(() => [])) ?? []).map((x) => x.name) : [];
};
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `d1d1d1d1-0000-4000-8000-0000000d10${String(n).padStart(2, "0")}`, jeton: `jeton-tele-du-jour-route-00${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const MAX = qui(3, "Max");
const NOE = qui(4, "Noé");
const ZOE = qui(5, "Zoé");
const GENS = [LEA, SAM, MAX, NOE, ZOE];
for (const x of GENS) x.cle = cleProfil(x.id);
const maintenant = new Date().toISOString();
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
for (const x of GENS) {
  await fetch(`${STOCK}/figurines-clients/${x.id}/neutre-essai.png`, { method: "POST", headers: { "content-type": "image/png" }, body: PNG });
  await json(`profils/${x.cle}.json`, { h: x.id });
}
await semer(
  "clik_ma_figurine",
  GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, neutre: `${x.id}/neutre-essai.png`, parle: `${x.id}/neutre-essai.png`, prete_le: maintenant })),
);
// (Léa et Sam se sont ajoutés tous les deux ; Max a ajouté Léa, pas elle)
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
await json(`${MAX.id}/proches.json`, { ids: [LEA.id] });
await json(`${LEA.id}/majeur.json`, { age: 34, adulte: true, le: maintenant });
await json(`${NOE.id}/majeur.json`, { age: 15, adulte: false, le: maintenant });
await json(`${LEA.id}/passions.json`, { passions: ["foot", "cuisine", "animaux"], poids: {}, le: maintenant });
await json(`${NOE.id}/passions.json`, { passions: ["foot", "parents", "manga"], poids: {}, le: maintenant });

const voir = async (x) => {
  const r = await fetch(`${BASE}/api/direct/tele-du-jour`, { headers: x ? { cookie: `clikme_habitant=${x.jeton}` } : {} });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};
const poster = async (x, corps) => {
  const r = await fetch(`${BASE}/api/direct/tele-du-jour`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${x.jeton}` }, body: JSON.stringify(corps) });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};
const poids = async (x) => (await lire(`${x.id}/passions.json`))?.poids ?? {};

// ═══ SANS COMPTE, SANS PASSIONS ═══
ok((await voir(null)).statut === 401, "sans compte : 401");
ok((await voir(ZOE)).tele?.passions?.length === 0, "sans passions : rien (« Tes passions » d'abord)");

// ═══ LA NUIT PASSE ═══
const nuit = await (await fetch(`${BASE}/api/cron/decouvrir-selection`)).json();
ok(nuit.faites?.length === 23, `la nuit est passée (${nuit.faites?.length} sélections)`);

// ═══ CE QUI ATTEND LÉA ═══
const t1 = (await voir(LEA)).tele;
const v1 = t1?.videos ?? [];
ok(t1?.passions?.join() === "foot,cuisine,animaux", "ses trois passions");
ok(v1.length === 40 && v1.every((v) => ["foot", "cuisine", "animaux"].includes(v.theme)) && new Set(v1.map((v) => v.id)).size === v1.length, `quarante vidéos de ses passions, sans doublon (${v1.length})`);
ok(new Set(v1.slice(0, 3).map((v) => v.theme)).size === 3, `mêlées : les trois thèmes dès les trois premières (${v1.slice(0, 3).map((v) => v.theme).join(", ")})`);
ok(v1.every((v) => /^[A-Za-z0-9_-]{11}$/.test(v.id) && v.titre && v.chaine && v.duree >= 30), "chacune : son identifiant YouTube, son titre, sa chaîne, sa durée");
ok(t1.vuesAujourdhui === 0 && !t1.vide, "rien de vu aujourd'hui");

// ═══ VUE JUSQU'AU BOUT, PASSÉE, ILLISIBLE ═══
const [a, b] = [v1[0], v1.find((v) => v.theme !== v1[0].theme)];
ok((await poster(LEA, { action: "vue", id: a.id, fin: true })).ok === true, "vue jusqu'au bout : notée");
const t2 = (await voir(LEA)).tele;
ok(!t2.videos.some((v) => v.id === a.id) && t2.vuesAujourdhui === 1 && (await poids(LEA))[a.theme] === 1, `elle ne revient plus ; son thème monte (${a.theme} : ${(await poids(LEA))[a.theme]})`);
await poster(LEA, { action: "vue", id: b.id, secondes: 4 });
ok((await poids(LEA))[b.theme] === -1, `passée avant 15 s : son thème descend (${b.theme} : ${(await poids(LEA))[b.theme]})`);
const c = t2.videos.find((v) => v.id !== b.id && v.theme === "animaux");
const avantC = (await poids(LEA)).animaux ?? 0;
await poster(LEA, { action: "vue", id: c.id, illisible: true, secondes: 0 });
ok(((await poids(LEA)).animaux ?? 0) === avantC && !(await voir(LEA)).tele.videos.some((v) => v.id === c.id), "illisible : elle part, rien ne bouge");
ok((await poster(LEA, { action: "vue", id: "AbCdEfGhIjK" })).statut === 404, "une vidéo qui n'est pas à sa télé : 404");

// ═══ LE FOOT TRÈS REGARDÉ REVIENT PLUS SOUVENT ═══
await json(`${LEA.id}/passions.json`, { passions: ["foot", "cuisine", "animaux"], poids: { foot: 12 }, le: maintenant });
const dix = (await voir(LEA)).tele.videos.slice(0, 10);
const foot = dix.filter((v) => v.theme === "foot").length;
ok(foot >= 5 && dix.some((v) => v.theme !== "foot"), `le foot très regardé : ${foot} sur les dix premières, les autres restent`);

// ═══ 📌 GARDER ═══
// (pas le foot : son poids est déjà au plus haut)
const g = (await voir(LEA)).tele.videos.find((v) => v.theme !== "foot");
const avantG = (await poids(LEA))[g.theme] ?? 0;
const r1 = await poster(LEA, { action: "garder", id: g.id });
const perso = await lire(`${LEA.id}/etagere-perso.json`);
const garde = (perso?.objets ?? []).find((o) => JSON.stringify(o).includes(g.id));
ok(r1.ok === true && Boolean(garde), `📌 Garder : chez elle (${r1.error ?? "ok"})`);
ok(JSON.stringify(garde ?? {}).includes(`watch?v=${g.id}`) && (await poids(LEA))[g.theme] === avantG + 2, "… un clip, son lien YouTube ; son thème monte de deux");
const r2 = await poster(LEA, { action: "garder", id: g.id });
ok(r2.ok === true && r2.deja === true && (perso?.objets ?? []).filter((o) => JSON.stringify(o).includes(g.id)).length === 1, "deux fois : « déjà chez toi », une seule fois chez elle");
ok((await poster(LEA, { action: "garder", id: "AbCdEfGhIjK" })).statut === 404, "garder une vidéo qui n'est pas à sa télé : 404");

// ═══ 📤 ENVOYER À UN PROCHE ═══
const e = (await voir(LEA)).tele.videos[1];
const re = await poster(LEA, { action: "envoyer", id: e.id, a: SAM.cle });
ok(re.ok === true, `📤 à Sam : envoyée (${re.error ?? "ok"})`);
const paire = [LEA.id, SAM.id].sort().join("_");
const noms = await lister(`fils/${paire}/m`);
const message = noms.length ? await lire(`fils/${paire}/m/${noms[noms.length - 1]}`) : null;
ok(noms.length === 1 && message?.genre === "ecrit" && message.texte.includes(e.id) && message.de === LEA.id, "un message dans leur conversation (son titre, son lien)");
const tele = await lire(`fils/${paire}/tele.json`);
ok(tele?.message === message?.id, "… mis sur la télé de leur duo");
const chezSam = await (await fetch(`${BASE}/api/direct/tele?avec=${LEA.cle}`, { headers: { cookie: `clikme_habitant=${SAM.jeton}` } })).json();
ok(chezSam.programme?.sorte === "youtube" && chezSam.programme.id === e.id, `Sam la voit sur leur télé (${chezSam.programme?.sorte}, ${chezSam.programme?.id})`);
const rm = await poster(LEA, { action: "envoyer", id: e.id, a: MAX.cle });
ok(rm.statut === 403, `à Max (pas son proche) : refusé (${rm.statut})`);

// ═══ NOÉ, 15 ANS ═══
const tn = (await voir(NOE)).tele;
ok(tn.passions.join() === "foot,manga" && tn.videos.length > 0 && tn.videos.every((v) => v.theme !== "parents"), `pas le salon des jeunes parents (${tn.passions.join(", ")})`);
const jeunes = await lire(`decouvrir/selection/${new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" })}/foot-jeunes.json`);
ok(tn.videos.filter((v) => v.theme === "foot").every((v) => (jeunes?.videos ?? []).some((x) => x.id === v.id)), "ses vidéos de foot : celles des 15-17 ans");

console.log(echecs ? `\n${echecs} échec(s)` : "\nma télé du jour tient ✓");
process.exit(echecs ? 1 : 0);
