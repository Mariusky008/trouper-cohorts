// ⭐ UNE CONVERSATION À TRAVERS LE TEMPS, ACCROCHÉE À LA VIDÉO, PAR LES ROUTES (`lib/direct/reactions-video.ts`,
// `reactions-video-serveur.ts`, `app/api/direct/tele-du-jour` ; le lot D2b de Découvrir, deuxième partie,
// `docs/univers/decouvrir.md` section 22) — contre le faux Supabase, le faux YouTube et le faux service de notifications
// (jamais la vraie base, jamais Google, jamais un vrai téléphone).
//
// Léa, Sam, Inès et Max aiment le foot : la même vidéo est à leur télé. Sam la regarde le premier : 😂 à 6 s, il écrit
// « Il va tirer de là ?! » à 10 s (😮, déduit des mots), « haha trop fort » à 14 s (😂) ; des mots vides : 400 ; 120
// caractères : 90 gardés ; les mêmes mots deux fois : une seule. Personne ne l'avait vue : aucune notification. Inès la
// voit sans réagir : aucune non plus. Léa ouvre : les mots de Sam, à leur seconde. Elle répond à son 😂 (« Trop drôle »,
// juste après, à 6,6 s) : Sam reçoit « ↩ Léa t'a répondu » (une fois par vidéo : la deuxième réponse ne le redit pas) ;
// répondre à une seconde où il n'a rien fait, à Max (pas proche des deux côtés), à Inès (silencieuse), sans mots : refusé.
// Léa réagit, puis la voit jusqu'au bout : Inès, qui l'avait vue, reçoit « 🎬 Léa a regardé « … » : revois-la avec ses
// réactions » (Sam non : il a déjà eu « t'a répondu » ; Max jamais) ; une deuxième vue ne la redit pas. Sam voit les
// réponses de Léa ; Inès non (une réponse n'est montrée qu'à celui à qui elle répond). Sam rouvre la vidéo déjà vue
// (`?video=`) et répond à la réponse : Léa reçoit « ↩ Sam t'a répondu ». Aucun identifiant de compte n'en sort.
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
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);
const qui8 = (h) => crypto.createHash("sha256").update(`clikme-talkie:qui:${h}`).digest("hex").slice(0, 8);

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};
const attendre = async (f, ms = 6000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f().catch(() => false)) return true;
    await new Promise((r) => setTimeout(r, 120));
  }
  return false;
};
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

const qui = (n, prenom) => ({ id: `d2b2d2b2-0000-4000-8000-0000000c10${String(n).padStart(2, "0")}`, jeton: `jeton-conversation-video-route-0${n}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const INES = qui(3, "Inès");
const MAX = qui(4, "Max");
const GENS = [LEA, SAM, INES, MAX];
for (const x of GENS) x.cle = cleProfil(x.id);
const maintenant = new Date().toISOString();
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
for (const x of GENS) {
  await json(`profils/${x.cle}.json`, { h: x.id });
  await json(`${x.id}/majeur.json`, { age: 30, adulte: true, le: maintenant });
  await json(`${x.id}/passions.json`, { passions: ["foot"], poids: {}, le: maintenant });
}
// (Léa, Sam et Inès se sont ajoutés des deux côtés ; Max a ajouté Léa, elle non)
await json(`${LEA.id}/proches.json`, { ids: [SAM.id, INES.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
await json(`${INES.id}/proches.json`, { ids: [LEA.id] });
await json(`${MAX.id}/proches.json`, { ids: [LEA.id] });

// ─── leurs téléphones (un faux service de notifications, au faux Supabase) ───
function telephone(nom) {
  const ecdh = crypto.createECDH("prime256v1");
  ecdh.generateKeys();
  const auth = crypto.randomBytes(16);
  const endpoint = `${FAUX}/push/${nom}-${crypto.randomBytes(4).toString("hex")}`;
  return { ecdh, auth, endpoint, abonnement: { endpoint, expirationTime: null, keys: { p256dh: ecdh.getPublicKey().toString("base64url"), auth: auth.toString("base64url") } } };
}
/** Déchiffrer comme le téléphone (RFC 8291, `aes128gcm`). */
function dechiffrer(t, b64) {
  const buf = Buffer.from(b64, "base64");
  const sel = buf.subarray(0, 16);
  const sa = buf.subarray(21, 21 + buf[20]);
  const chiffre = buf.subarray(21 + buf[20]);
  const h = (k, d) => crypto.createHmac("sha256", k).update(d).digest();
  const ikm = h(h(t.auth, t.ecdh.computeSecret(sa)), Buffer.concat([Buffer.from("WebPush: info\0"), t.ecdh.getPublicKey(), sa, Buffer.from([1])]));
  const prk = h(sel, ikm);
  const cle = h(prk, Buffer.concat([Buffer.from("Content-Encoding: aes128gcm\0"), Buffer.from([1])])).subarray(0, 16);
  const nonce = h(prk, Buffer.concat([Buffer.from("Content-Encoding: nonce\0"), Buffer.from([1])])).subarray(0, 12);
  const d = crypto.createDecipheriv("aes-128-gcm", cle, nonce);
  d.setAuthTag(chiffre.subarray(chiffre.length - 16));
  const clair = Buffer.concat([d.update(chiffre.subarray(0, chiffre.length - 16)), d.final()]);
  let fin = clair.length - 1;
  while (fin >= 0 && clair[fin] === 0) fin--;
  return JSON.parse(clair.subarray(0, fin).toString("utf8"));
}
/** Ce que son téléphone a reçu de la télé du jour (pas le « C'est réglé ! » de l'abonnement). */
const recus = async (t) =>
  ((await (await fetch(`${FAUX}/__push`)).json()) ?? [])
    .filter((x) => x.adresse === new URL(t.endpoint).pathname)
    .map((x) => dechiffrer(t, x.corps))
    .filter((n) => /^tele-/.test(n.tag ?? ""));
const TEL = {};
for (const x of [LEA, SAM, INES, MAX]) {
  TEL[x.prenom] = telephone(`conversation-${x.prenom.normalize("NFD").replace(/[^a-z]/gi, "").toLowerCase()}`);
  const r = await fetch(`${BASE}/api/direct/ma-figurine`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${x.jeton}` }, body: JSON.stringify({ action: "notif", abonnement: TEL[x.prenom].abonnement }) });
  ok(r.status === 200, `${x.prenom} a les notifications (${r.status})`);
}

const route = `${BASE}/api/direct/tele-du-jour`;
const voir = async (x, q = "") => {
  const r = await fetch(`${route}${q}`, { headers: x ? { cookie: `clikme_habitant=${x.jeton}` } : {} });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};
const poster = async (x, corps) => {
  const r = await fetch(route, { method: "POST", headers: { "content-type": "application/json", ...(x ? { cookie: `clikme_habitant=${x.jeton}` } : {}) }, body: JSON.stringify(corps) });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};

// ═══ LA NUIT PASSE : LA MÊME VIDÉO EST À LEUR TÉLÉ ═══
const nuit = await (await fetch(`${BASE}/api/cron/decouvrir-selection`)).json();
ok(Array.isArray(nuit.faites) && nuit.faites.length > 0, "la nuit est passée");
const V = (await voir(LEA)).tele?.videos?.[0];
ok(Boolean(V?.id) && V.duree >= 30, `la première vidéo de Léa (${V?.id}, ${V?.duree} s)`);
ok((await voir(SAM)).tele?.videos?.some((v) => v.id === V.id), "… elle est aussi à la télé de Sam");
const fichier = (x) => lire(`decouvrir/reactions/${V.id}/${qui8(x.id)}.json`);

// ═══ SAM LA REGARDE LE PREMIER : IL RÉAGIT, IL ÉCRIT À LA SECONDE ═══
ok((await poster(SAM, { action: "reagir", id: V.id, t: 6, sorte: "rire" })).statut === 200, "Sam : 😂 à 6 s");
const e1 = await poster(SAM, { action: "ecrire", id: V.id, t: 10.04, texte: "  Il va tirer   de là ?! " });
ok(e1.statut === 200 && e1.reaction?.t === 10 && e1.reaction?.texte === "Il va tirer de là ?!" && e1.reaction?.sorte === "oh", `il écrit « Il va tirer de là ?! » à 10 s : 😮, déduit des mots (${JSON.stringify(e1.reaction)})`);
const e2 = await poster(SAM, { action: "ecrire", id: V.id, t: 14, texte: "haha trop fort" });
ok(e2.reaction?.sorte === "rire", "« haha trop fort » à 14 s : 😂");
ok((await poster(SAM, { action: "ecrire", id: V.id, t: 10.5, texte: "Il va tirer de là ?!" })).ignoree === true, "les mêmes mots, envoyés deux fois : une seule");
ok((await poster(SAM, { action: "ecrire", id: V.id, t: 16, texte: "   " })).statut === 400, "des mots vides : 400");
const long = await poster(SAM, { action: "ecrire", id: V.id, t: 18, texte: "a".repeat(120) });
ok(long.statut === 200 && long.reaction?.texte?.length === 90, "120 caractères : 90 gardés");
ok((await poster(null, { action: "ecrire", id: V.id, t: 3, texte: "coucou" })).statut === 401, "sans compte : 401");
ok((await poster(SAM, { action: "ecrire", id: "AAAAAAAAAAA", t: 3, texte: "coucou" })).statut === 404, "une vidéo qui n'est pas à sa télé : 404");
ok((await poster(SAM, { action: "vue", id: V.id, fin: true, secondes: V.duree })).statut === 200, "Sam la voit jusqu'au bout");
ok((await poster(INES, { action: "vue", id: V.id, secondes: 40 })).statut === 200, "Inès la voit, sans réagir");
await attendre(async () => (await fichier(INES))?.vu > 0);
await pause(500);
ok((await recus(TEL.Léa)).length === 0 && (await recus(TEL.Sam)).length === 0 && (await recus(TEL.Inès)).length === 0, "personne ne l'avait vue avant Sam, Inès n'a pas réagi : aucune notification");

// ═══ LÉA OUVRE : LES MOTS DE SAM, À LEUR SECONDE ═══
const d = await voir(LEA, `?reactions=${V.id}`);
const sam = d.proches?.find((p) => p.cle === SAM.cle);
const sesMots = (sam?.reactions ?? []).map((r) => `${r.t}:${r.sorte}${r.texte ? `:${r.texte.slice(0, 11)}` : ""}`).join(",");
ok(d.statut === 200 && sesMots === "6:rire,10:oh:Il va tirer,14:rire:haha trop f,18:oh:aaaaaaaaaaa", `Sam : ses réactions et ses mots, à leur seconde (${sesMots})`);
ok(Array.isArray(d.miennes) && d.miennes.length === 0 && d.vue === false, "les siennes : aucune encore ; pas encore vue");

// ═══ ↩ LÉA RÉPOND À SAM, AU MOMENT MÊME ═══
const rep1 = await poster(LEA, { action: "repondre", id: V.id, a: SAM.cle, repond: 6, texte: "Trop drôle", sorte: "rire" });
ok(rep1.statut === 200 && rep1.reaction?.t === 6.6 && rep1.reaction?.a === SAM.cle && rep1.reaction?.repond === 6 && rep1.reaction?.sorte === "rire", `« 😂 Trop drôle » à son 😂 de 6 s : juste après, à 6,6 s (${JSON.stringify(rep1.reaction)})`);
ok(
  await attendre(async () => {
    const n = (await recus(TEL.Sam)).find((x) => x.title === "↩ Léa t’a répondu");
    return n && n.body === `À 0:06 de « ${[...V.titre].length > 40 ? [...V.titre].slice(0, 39).join("").trimEnd() + "…" : V.titre} » : « Trop drôle »` && n.url === `/collection?tele=${V.id}&t=3#decouvrir` && n.tag === `tele-reponse-${V.id}`;
  }),
  `Sam reçoit « ↩ Léa t'a répondu » : la seconde, le titre, ses mots ; un toucher ouvre la vidéo à 0:03 (${JSON.stringify((await recus(TEL.Sam))[0] ?? null)})`,
);
const rep2 = await poster(LEA, { action: "repondre", id: V.id, a: SAM.cle, repond: 10, texte: "Grave !" });
ok(rep2.statut === 200 && rep2.reaction?.t === 10.6 && rep2.reaction?.sorte === "oh", "une deuxième réponse (« Grave ! », à ses mots de 10 s) : sa sorte déduite des mots");
await pause(700);
ok((await recus(TEL.Sam)).length === 1, "… Sam n'est prévenu qu'une fois par vidéo");
ok((await poster(LEA, { action: "repondre", id: V.id, a: SAM.cle, repond: 8, texte: "Quoi ?" })).statut === 404, "répondre à une seconde où Sam n'a rien fait : 404");
ok((await poster(LEA, { action: "repondre", id: V.id, a: MAX.cle, repond: 6, texte: "Salut" })).statut === 404, "répondre à Max (pas proche des deux côtés) : 404");
ok((await poster(LEA, { action: "repondre", id: V.id, a: INES.cle, repond: 0, texte: "Alors ?" })).statut === 404, "répondre à Inès (vue sans réagir) : 404");
ok((await poster(LEA, { action: "repondre", id: V.id, a: SAM.cle, repond: 6, texte: "" })).statut === 400, "une réponse sans mots : 400");

// ═══ LÉA RÉAGIT, PUIS LA VOIT : « 🎬 LÉA A REGARDÉ… » À INÈS ═══
ok((await poster(LEA, { action: "reagir", id: V.id, t: 20, sorte: "oh" })).statut === 200, "Léa : 😮 à 20 s");
ok((await poster(LEA, { action: "vue", id: V.id, fin: true, secondes: V.duree })).statut === 200, "elle la voit jusqu'au bout");
ok(
  await attendre(async () => {
    const n = (await recus(TEL.Inès)).find((x) => x.tag === `tele-${V.id}`);
    return n && n.title.startsWith("🎬 Léa a regardé « ") && n.body === "Revois-la avec ses réactions, à la seconde." && n.url === `/collection?tele=${V.id}#decouvrir`;
  }),
  `Inès (qui l'avait vue) reçoit « 🎬 Léa a regardé « … » : revois-la avec ses réactions » (${JSON.stringify((await recus(TEL.Inès))[0] ?? null)})`,
);
ok((await recus(TEL.Sam)).length === 1, "Sam non : il a déjà eu « t'a répondu »");
ok((await recus(TEL.Max)).length === 0, "Max jamais (Léa ne l'a pas ajouté)");
ok((await poster(LEA, { action: "vue", id: V.id, secondes: 5 })).statut === 200, "Léa la revoit");
await pause(800);
ok((await recus(TEL.Inès)).length === 1, "… une deuxième vue ne la redit pas (une fois par proche et par vidéo)");
const fLea = await fichier(LEA);
ok(fLea?.prevenus?.join(",") === INES.cle && fLea?.repondus?.join(",") === SAM.cle && !JSON.stringify(fLea).includes(INES.id) && !JSON.stringify(fLea).includes(SAM.id), "son fichier : qui est prévenu (des clés, jamais un compte)");

// ═══ LES RÉPONSES : POUR CELUI À QUI ELLES RÉPONDENT ═══
const dSam = await voir(SAM, `?reactions=${V.id}`);
const leaVueParSam = dSam.proches?.find((p) => p.cle === LEA.cle);
ok(leaVueParSam?.reactions?.map((r) => `${r.t}:${r.texte ?? r.sorte}`).join(",") === "6.6:Trop drôle,10.6:Grave !,20:oh", `Sam voit les réponses de Léa, à leur seconde (${leaVueParSam?.reactions?.map((r) => `${r.t}:${r.texte ?? r.sorte}`).join(",")})`);
ok(dSam.vue === true && dSam.miennes?.length === 4, "Sam l'a déjà vue (« 💬 Ce qui s'est dit » montrera tout) ; ses quatre réactions");
const dInes = await voir(INES, `?reactions=${V.id}`);
const leaVueParInes = dInes.proches?.find((p) => p.cle === LEA.cle);
ok(leaVueParInes?.reactions?.map((r) => `${r.t}:${r.sorte}`).join(",") === "20:oh", "Inès voit le 😮 de Léa, pas ses réponses à Sam");
ok((dInes.proches ?? []).every((p) => p.cle !== SAM.cle), "… ni Sam (ils ne sont pas proches)");

// ═══ SAM ROUVRE LA VIDÉO DÉJÀ VUE, ET RÉPOND À LA RÉPONSE ═══
ok((await voir(SAM)).tele?.videos?.every((v) => v.id !== V.id), "dans sa télé du jour, elle ne revient plus (déjà vue)…");
const rouvre = await voir(SAM, `?video=${V.id}`);
ok(rouvre.statut === 200 && rouvre.video?.id === V.id && rouvre.video?.theme === "foot", "… mais la notification la rouvre (`?video=`)");
ok((await voir(SAM, "?video=AAAAAAAAAAA")).statut === 404 && (await voir(null, `?video=${V.id}`)).statut === 401, "une vidéo qui n'est pas à sa télé : 404 ; sans compte : 401");
const rep3 = await poster(SAM, { action: "repondre", id: V.id, a: LEA.cle, repond: 6.6, texte: "Mdr oui", sorte: "rire" });
ok(rep3.statut === 200 && rep3.reaction?.t === 7.2, "Sam répond à « Trop drôle » (une réponse pour lui) : la conversation continue, à 7,2 s");
ok(await attendre(async () => (await recus(TEL.Léa)).some((x) => x.title === "↩ Sam t’a répondu" && /« Mdr oui »$/.test(x.body))), "Léa reçoit « ↩ Sam t'a répondu »");
ok((await poster(INES, { action: "repondre", id: V.id, a: LEA.cle, repond: 6.6, texte: "Moi aussi" })).statut === 404, "Inès ne peut pas répondre à une réponse qui n'est pas pour elle : 404");
const tout = JSON.stringify([d, dSam, dInes, rouvre]);
ok(!GENS.some((x) => tout.includes(x.id)), "aucun identifiant de compte n'en sort");

console.log(echecs ? `\n${echecs} échec(s)` : "\nune conversation à travers le temps (les routes) : tout est bon");
process.exit(echecs ? 1 : 0);
