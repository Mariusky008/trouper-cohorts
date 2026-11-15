// 📺 LA TÉLÉ DE LA PIÈCE DU DUO — CE QU'ELLE PASSE (`lib/direct/tele.ts`, `tele-serveur.ts`, `GET /api/direct/tele`,
// `/api/admin/direct/tele`) — contre le faux Supabase, jamais la vraie base, jamais YouTube.
//
// Sam et Léa sont proches ; Zoé n'est pas proche de Sam. Sans session : 401 ; pas proches : 403 ; une clé inconnue :
// 404. Aucun lien entre eux : le clip de secours du jour, dans la liste du propriétaire (ses cinq clips, tant qu'il n'en
// a pas rangé d'autre). Léa envoie un clip YouTube (« youtu.be/…?t=1m5s », son aperçu), puis Sam une chanson Spotify
// (pas pour la télé) : la télé passe le clip, à 65 s, son aperçu signé, envoyé par l'autre. Léa envoie un TikTok : chez
// les deux, « ouvrir » (TikTok ne se lit pas dans l'écran). Sam le signale : chez lui, le clip revient ; chez Léa, le
// TikTok reste. Les clips de secours (l'administrateur seulement) : une liste collée, ce qui n'est pas YouTube refusé et
// rendu, huit au plus, sans double ; rien de YouTube : refusé, la liste d'avant reste. Une liste vide rangée à la main :
// la télé éteinte.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-tele-route.mjs
import crypto from "node:crypto";

const F = "http://127.0.0.1:54321/rest/v1";
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);
const qui8 = (h) => crypto.createHash("sha256").update(`clikme-talkie:qui:${h}`).digest("hex").slice(0, 8);
const paire = (a, b) => [a.id, b.id].sort().join("_");

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `e7a6e7a6-0000-4000-8000-0000000f70${String(n).padStart(2, "0")}`, jeton: `jeton-tele-route-00${String(n).padStart(2, "0")}`, prenom });
const SAM = qui(1, "Sam");
const LEA = qui(2, "Léa");
const ZOE = qui(3, "Zoé");
const TOM = qui(4, "Tom");
const GENS = [SAM, LEA, ZOE, TOM];
for (const x of GENS) x.cle = cleProfil(x.id);
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
for (const x of GENS) await json(`profils/${x.cle}.json`, { h: x.id });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });
await json(`${ZOE.id}/proches.json`, { ids: [SAM.id, TOM.id] });
await json(`${TOM.id}/proches.json`, { ids: [ZOE.id] });

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
let rang = 0;
/** Un message écrit avec son lien, il y a quelques minutes. */
async function lien(de, a, url, ilYaMin, extra = {}) {
  const pair = paire(de, a);
  const ts = Date.now() - ilYaMin * 60_000;
  const id = `tv${String(++rang).padStart(10, "0")}`;
  await json(`fils/${pair}/m/${String(ts).padStart(13, "0")}-${qui8(de.id)}-${id}.json`, { id, de: de.id, le: new Date(ts).toISOString(), genre: "ecrit", texte: `Regarde ça ${url}`, tete: null, lien: { url, site: new URL(url).hostname, ...extra } });
  return id;
}
const tele = async (q, avec) => {
  const r = await fetch(`${BASE}/api/direct/tele${avec === undefined ? "" : `?avec=${avec}`}`, { headers: q ? { cookie: `clikme_habitant=${q.jeton}` } : {} });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const DEFAUT = ["7CGKeID7nRc", "nd8RD3tjNQE", "R2KeQqLzr00", "ko70cExuzZM", "e5s8MdtnbMM"];

// ─── les gardes ───
ok((await tele(null, LEA.cle)).statut === 401, "sans session : 401");
ok((await tele(SAM, ZOE.cle)).statut === 403, "pas proches (Zoé a ajouté Sam, pas l'inverse) : 403");
ok((await tele(SAM, "0123456789abcdef")).statut === 404 && (await tele(SAM, SAM.cle)).statut === 404, "une clé inconnue, ou la sienne : 404");

// ─── aucun lien : le clip de secours du jour ───
const t0 = await tele(SAM, LEA.cle);
ok(t0.statut === 200 && t0.programme?.sorte === "secours" && DEFAUT.includes(t0.programme.id) && t0.secours?.map((c) => c.id).join() === DEFAUT.join(), `aucun lien : un clip de secours, dans les cinq du propriétaire (${t0.programme?.id})`);
ok((await tele(LEA, SAM.cle)).programme?.id === t0.programme?.id, "le même clip chez les deux, ce jour-là");

// ─── le dernier lien YouTube ───
const P = paire(SAM, LEA);
await deposer(`fils/${P}/a/clip.webp`, PNG, "image/png");
await lien(LEA, SAM, "https://youtu.be/AbCdEfGhIjK?t=1m5s", 30, { titre: "Notre chanson", image: `fils/${P}/a/clip.webp`, sorte: "video" });
await lien(SAM, LEA, "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC", 20, { titre: "Une chanson", sorte: "musique" });
const t1 = await tele(SAM, LEA.cle);
ok(
  t1.programme?.sorte === "youtube" && t1.programme.id === "AbCdEfGhIjK" && t1.programme.debut === 65 && t1.programme.titre === "Notre chanson" && t1.programme.moi === false && /^http/.test(t1.programme.apercu ?? "") && !t1.programme.apercu.includes("ytimg"),
  `le dernier lien YouTube (la chanson Spotify n'est pas pour la télé) : à 65 s, son aperçu signé, envoyé par Léa (${JSON.stringify(t1.programme)})`,
);
ok((await tele(LEA, SAM.cle)).programme?.moi === true, "chez Léa : c'est elle qui l'a envoyé");

// ─── un TikTok plus récent : « ouvrir » ───
const tik = await lien(LEA, SAM, "https://www.tiktok.com/@quelquun/video/7300000000000000000", 10, { titre: "Trop drôle" });
const t2 = await tele(SAM, LEA.cle);
ok(t2.programme?.sorte === "ouvrir" && t2.programme.plateforme === "tiktok" && t2.programme.url.includes("tiktok.com") && t2.programme.titre === "Trop drôle" && !t2.programme.apercu, "un TikTok plus récent : « ouvrir » (il ne se lit pas dans l'écran), sans aperçu à lui");

// ─── Sam le signale : chez lui, le clip revient ───
await json(`${SAM.id}/paroles-cachees.json`, { ids: [tik] });
ok((await tele(SAM, LEA.cle)).programme?.id === "AbCdEfGhIjK", "signalé par Sam : chez lui, la télé repasse le clip");
ok((await tele(LEA, SAM.cle)).programme?.sorte === "ouvrir", "chez Léa, le TikTok reste");

// ─── les clips de secours (l'administrateur) ───
const ADMIN = "00000000-0000-4000-8000-0000000ad001";
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const session = { access_token: "faux-admin", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "faux", user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} } };
const COOKIE_ADMIN = `sb-127-auth-token=base64-${b64(session)}`;
await semer("admins", [{ user_id: ADMIN }]);
const admin = async (cookie, corps) => {
  const r = await fetch(`${BASE}/api/admin/direct/tele`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify(corps) } : { headers: { cookie } });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
ok((await admin("")).statut === 403 && (await admin(`clikme_habitant=${SAM.jeton}`, { action: "secours", liens: "https://youtu.be/AbCdEfGhIjK" })).statut === 403, "les clips de secours : l'administrateur seulement");
ok((await admin(COOKIE_ADMIN)).secours?.map((c) => c.id).join() === DEFAUT.join(), "tant qu'il n'en a pas rangé d'autre : ses cinq clips");
const r1 = await admin(COOKIE_ADMIN, {
  action: "secours",
  liens: "https://www.youtube.com/watch?v=Zz9Yy8Xx7Ww&list=PLx\n  \nhttps://lemonde.fr/un-article\nhttps://youtu.be/Zz9Yy8Xx7Ww\nhttps://www.youtube.com/shorts/Qq1Ww2Ee3Rr",
});
ok(r1.statut === 200 && r1.secours?.map((c) => c.id).join() === "Zz9Yy8Xx7Ww,Qq1Ww2Ee3Rr" && r1.refuses?.join() === "https://lemonde.fr/un-article", `une liste collée : les vidéos YouTube gardées (sans double), le reste refusé et rendu (${JSON.stringify(r1.refuses)})`);
const r2 = await admin(COOKIE_ADMIN, { action: "secours", liens: "pas un lien\nhttps://lemonde.fr" });
ok(r2.statut === 400 && (await admin(COOKIE_ADMIN)).secours?.length === 2, "rien de YouTube : refusé, la liste d'avant reste");
ok((await admin(COOKIE_ADMIN, { action: "secours", liens: Array.from({ length: 12 }, (_, i) => `https://youtu.be/${String(i).padStart(2, "0")}aaaaaaaaa`).join("\n") })).secours?.length === 8, "huit au plus");
await admin(COOKIE_ADMIN, { action: "secours", liens: "https://youtu.be/Zz9Yy8Xx7Ww" });
const t3 = await tele(ZOE, TOM.cle);
ok(t3.programme?.sorte === "secours" && t3.programme.id === "Zz9Yy8Xx7Ww" && t3.secours?.length === 1, "un duo sans lien : le clip de la liste rangée");
await json("tele/secours.json", { clips: [], le: new Date().toISOString() });
ok((await tele(ZOE, TOM.cle)).programme?.sorte === "eteinte", "une liste vide : la télé reste éteinte");

console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
