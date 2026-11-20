// ⭐ JAMAIS SEUL DEVANT UNE VIDÉO, PAR LES ROUTES (`lib/direct/reactions-video.ts`, `reactions-video-serveur.ts`,
// `app/api/direct/tele-du-jour` ; le lot D2b de Découvrir, première partie, `docs/univers/decouvrir.md` section 21) —
// contre le faux Supabase et le faux YouTube (jamais la vraie base, jamais Google).
//
// La nuit passe. Léa, Sam, Inès et Max aiment le foot : la même vidéo est à leur télé. Sam réagit à la seconde (😂 à
// 12,3 ; un doigt qui insiste à 12,8 : une seule ; 😮 d'un geste à 5 ; ❤️ à 30) ; une sorte inconnue, une seconde
// négative, au-delà de la fin : refusées ; une vidéo qui n'est pas à sa télé : 404 ; sans compte : 401. Inès la voit
// sans réagir. Max (il a ajouté Léa, elle non) réagit aussi. Léa demande qui l'a vue : Sam d'abord (trois réactions,
// rangées à la seconde), puis Inès (vue, sans réaction) ; jamais Max. Léa réagit à son tour ; ce que l'appli comprend
// seule (😴 passée, `implicite`) garde sa source ; sa vue est notée (même sans réaction). Chacun n'écrit que son fichier.
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

const qui = (n, prenom) => ({ id: `d2b0d2b0-0000-4000-8000-0000000a10${String(n).padStart(2, "0")}`, jeton: `jeton-reactions-video-route-0${n}`, prenom });
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
const tLea = await voir(LEA);
const V = tLea.tele?.videos?.[0];
ok(Boolean(V?.id) && V.theme === "foot", `la première vidéo de Léa (${V?.id}, ${V?.theme}, ${V?.duree} s)`);
ok((await voir(SAM)).tele?.videos?.some((v) => v.id === V.id), "… elle est aussi à la télé de Sam");
const fichier = (x) => lire(`decouvrir/reactions/${V.id}/${qui8(x.id)}.json`);

// ═══ SAM RÉAGIT, À LA SECONDE ═══
const r1 = await poster(SAM, { action: "reagir", id: V.id, t: 12.34, sorte: "rire" });
ok(r1.statut === 200 && r1.reaction?.t === 12.3 && r1.reaction?.sorte === "rire" && r1.reaction?.source === "rangee", `😂 à 12,3 s (au dixième ; la rangée par défaut) (${r1.statut} ${JSON.stringify(r1.reaction)})`);
const r2 = await poster(SAM, { action: "reagir", id: V.id, t: 12.8, sorte: "rire" });
ok(r2.statut === 200 && r2.ignoree === true, "un doigt qui insiste (😂 encore à 12,8) : une seule");
ok((await poster(SAM, { action: "reagir", id: V.id, t: 5, sorte: "oh", source: "geste" })).reaction?.source === "geste", "😮 d'un geste sans viser, à 5 s");
ok((await poster(SAM, { action: "reagir", id: V.id, t: 30, sorte: "coeur" })).statut === 200, "❤️ à 30 s");
ok((await poster(SAM, { action: "reagir", id: V.id, t: 14, sorte: "pouet" })).statut === 400, "une sorte inconnue : 400");
ok((await poster(SAM, { action: "reagir", id: V.id, t: -1, sorte: "rire" })).statut === 400, "une seconde négative : 400");
ok((await poster(SAM, { action: "reagir", id: V.id, t: (V.duree || 60) + 30, sorte: "rire" })).statut === 400, "au-delà de la fin de la vidéo : 400");
ok((await poster(SAM, { action: "reagir", id: "AAAAAAAAAAA", t: 3, sorte: "rire" })).statut === 404, "une vidéo qui n'est pas à sa télé : 404");
ok((await poster(null, { action: "reagir", id: V.id, t: 3, sorte: "rire" })).statut === 401, "sans compte : 401");
const fSam = await fichier(SAM);
ok(fSam?.reactions?.map((r) => `${r.t}:${r.sorte}`).join(",") === "5:oh,12.3:rire,30:coeur" && fSam.vu > 0 && !("h" in fSam), `son fichier : rangé à la seconde, sans son identifiant (${fSam?.reactions?.map((r) => `${r.t}:${r.sorte}`).join(",")})`);

// ═══ INÈS LA VOIT SANS RÉAGIR ; MAX (PAS PROCHE DES DEUX CÔTÉS) RÉAGIT ═══
ok((await poster(INES, { action: "vue", id: V.id, secondes: 40 })).statut === 200, "Inès la regarde (40 s), sans réagir");
ok(await attendre(async () => (await fichier(INES))?.vu > 0), "… sa vue est notée pour ses proches (même sans réaction)");
ok((await poster(MAX, { action: "reagir", id: V.id, t: 12, sorte: "rire" })).statut === 200, "Max réagit aussi (il a ajouté Léa, elle non)");

// ═══ LÉA : QUI L'A VUE ? ═══
const d = await voir(LEA, `?reactions=${V.id}`);
const noms = (d.proches ?? []).map((p) => p.prenom);
ok(d.statut === 200 && noms.join(",") === "Sam,Inès", `Sam d'abord (trois réactions), puis Inès ; jamais Max (${d.statut} ${noms.join(",")})`);
const sam = d.proches?.[0];
ok(sam?.cle === SAM.cle && sam.reactions.map((r) => r.t).join(",") === "5,12.3,30" && sam.vu > 0, "Sam : sa clé, ses réactions à la seconde, quand il l'a vue");
ok(d.proches?.[1]?.reactions?.length === 0 && d.proches?.[1]?.vu > 0, "Inès : vue, sans réaction (elle s'assoit, silencieuse)");
ok(!JSON.stringify(d).includes(SAM.id) && !JSON.stringify(d).includes(MAX.id), "aucun identifiant de compte n'en sort");
ok((await voir(LEA, "?reactions=AAAAAAAAAAA")).statut === 404, "une vidéo qui n'est pas à sa télé : 404");
ok((await voir(null, `?reactions=${V.id}`)).statut === 401, "sans compte : 401");
const dMax = await voir(MAX, `?reactions=${V.id}`);
ok(dMax.statut === 200 && (dMax.proches ?? []).length === 0, "Max ne voit personne (Léa ne l'a pas ajouté)");

// ═══ LÉA RÉAGIT À SON TOUR ; CE QUE L'APPLI COMPREND SEULE ; SA VUE ═══
ok((await poster(LEA, { action: "reagir", id: V.id, t: 12.9, sorte: "rire" })).statut === 200, "Léa : 😂 à 12,9 (au même moment que Sam)");
ok((await poster(LEA, { action: "reagir", id: V.id, t: 3, sorte: "bof", source: "implicite" })).reaction?.source === "implicite", "😴 passée à 3 s : ce que l'appli comprend seule");
ok((await poster(LEA, { action: "vue", id: V.id, secondes: 3 })).statut === 200, "elle la passe");
ok(await attendre(async () => (await fichier(LEA))?.reactions?.length === 2 && (await fichier(LEA))?.vu > 0), "son fichier : ses deux réactions, sa vue (les deux s'enchaînent sans s'effacer)");
const dSam = await voir(SAM, `?reactions=${V.id}`);
ok((dSam.proches ?? []).map((p) => p.prenom).join(",") === "Léa", "Sam voit Léa (pas Inès : ils ne sont pas proches)");
ok((await fichier(SAM))?.reactions?.length === 3, "chacun n'écrit que son fichier : celui de Sam n'a pas bougé");

console.log(echecs ? `\n${echecs} échec(s)` : "\njamais seul devant une vidéo (les routes) : tout est bon");
process.exit(echecs ? 1 : 0);
