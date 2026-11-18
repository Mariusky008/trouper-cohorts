// 🐾 LE CHAT DU SALON, CÔTÉ SERVEUR (`docs/univers/salon-du-duo.md`, section 4.5 ; le lot S3, deuxième partie) — par
// les routes, contre le faux Supabase, jamais la vraie base (`lib/direct/salon-chat-serveur.ts`,
// `GET /api/direct/salon/chat/<boucle>`).
//
// Sans boucle faite : pas de chat à l'ouverture, et ses adresses répondent 404. Ses boucles déposées (celles de l'essai
// C0) et son ronronnement : l'ouverture du salon donne son nom (Moustache), ses boucles faites, à adresse stable, et son
// son ; chaque adresse renvoie vers la vidéo signée, et le téléphone garde ce renvoi six jours ; une boucle pas faite,
// une boucle inconnue : 404 ; sans session : 403.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-salon-chat-route.mjs
import crypto from "node:crypto";
import fs from "node:fs";

const F = "http://127.0.0.1:54321/rest/v1";
const FAUX = F.replace("/rest/v1", "");
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = `${FAUX}/storage/v1/object`;
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `5a105a10-0000-4000-8000-0000000f90${String(n).padStart(2, "0")}`, jeton: `jeton-salon-chat-route-0${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
for (const x of [LEA, SAM]) x.cle = cleProfil(x.id);
const maintenant = new Date().toISOString();
await semer("human_habitants", [LEA, SAM].map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
for (const x of [LEA, SAM]) {
  await deposer(`${x.id}/neutre-essai.png`, PNG, "image/png");
  await json(`profils/${x.cle}.json`, { h: x.id });
}
await semer(
  "clik_ma_figurine",
  [LEA, SAM].map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, neutre: `${x.id}/neutre-essai.png`, parle: `${x.id}/neutre-essai.png`, prete_le: maintenant })),
);
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });

const ouvrir = async (q, cle) => {
  const r = await fetch(`${BASE}/api/direct/proches?ouvrir=${cle}`, { headers: { cookie: `clikme_habitant=${q.jeton}` } });
  return (await r.json().catch(() => null))?.ouverture ?? null;
};
const chat = (q, quoi) => fetch(`${BASE}/api/direct/salon/chat/${quoi}`, { headers: q ? { cookie: `clikme_habitant=${q.jeton}` } : {}, redirect: "manual" });

// ═══ SANS BOUCLE ═══
let o = await ouvrir(LEA, SAM.cle);
ok(o && !("chat" in o), "pas de boucle faite : pas de chat à l'ouverture");
ok((await chat(LEA, "dort")).status === 404, "ses adresses : 404");

// ═══ SES BOUCLES ET SON RONRONNEMENT ═══
const MP4 = fs.readFileSync("scripts/fixtures/chat-fond-vert-essai.mp4");
const FAITES = ["assis", "dort", "genoux", "marche", "alerte"];
for (const b of FAITES) await deposer(`compagnons/chat/${b}/video.mp4`, MP4, "video/mp4");
const RONRON = Buffer.from("ID3ronronnement-essai");
await deposer("compagnons/chat/genoux/ronron.mp3", RONRON, "audio/mpeg");
await json("compagnons/chat/genoux/son.json", { fichier: "ronron.mp3", type: "audio/mpeg", le: maintenant });
o = await ouvrir(LEA, SAM.cle);
ok(o?.chat?.nom === "Moustache", `l'ouverture donne son chat : ${o?.chat?.nom}`);
const boucles = o?.chat?.boucles ?? {};
ok(Object.keys(boucles).sort().join(",") === [...FAITES].sort().join(",") && Object.entries(boucles).every(([b, u]) => u === `/api/direct/salon/chat/${b}`), `ses boucles faites, à adresse stable (${Object.keys(boucles).join(", ")})`);
ok(o?.chat?.son === "/api/direct/salon/chat/son", "et son ronronnement");

// ═══ SES ADRESSES ═══
let r = await chat(LEA, "dort");
const vers = r.headers.get("location") ?? "";
ok(r.status === 302 && vers.includes("compagnons/chat/dort/video.mp4"), `une boucle : renvoyée vers sa vidéo signée (${r.status})`);
ok(r.headers.get("cache-control") === "private, max-age=518400", `le téléphone garde le renvoi six jours (${r.headers.get("cache-control")})`);
const video = await fetch(vers.startsWith("http") ? vers : `${BASE}${vers}`);
ok(video.ok && Buffer.from(await video.arrayBuffer()).length === MP4.length, "la vidéo est bien là, au bout");
r = await chat(LEA, "son");
const versSon = r.headers.get("location") ?? "";
ok(r.status === 302 && versSon.includes("compagnons/chat/genoux/ronron.mp3"), "son ronronnement : renvoyé vers son fichier");
ok((await chat(LEA, "saut")).status === 404, "une boucle pas faite : 404");
ok((await chat(LEA, "pirouette")).status === 404, "une boucle inconnue : 404");
ok((await chat(null, "dort")).status === 403, "sans session : 403");
ok((await chat(SAM, "assis")).status === 302, "le même chat pour Sam");

console.log(echecs ? `\n${echecs} échec(s)` : "\nle chat du salon, côté serveur : tout est bon");
process.exit(echecs ? 1 : 0);
