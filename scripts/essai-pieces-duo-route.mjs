// 🛋️ LA PIÈCE DU DUO — L'ESSAI DES CINQ PIÈCES (`lib/direct/pieces-duo-serveur.ts`, `app/api/admin/direct/pieces-duo`,
// `docs/univers/piece-du-duo.md`) — contre le faux Supabase et son faux moteur d'image, jamais la vraie base, jamais
// OpenAI.
//
// Réservé à l'administrateur. Le catalogue est le même pour tous, rangé à part de chaque habitant
// (`pieces-duo/<pièce>/`). Les cinq pièces, rien de fait ; une pièce inconnue : refusée ; un passage fait la pièce (un
// dessin, sans image de départ : le style des univers, les sept emplacements, personne dedans, rien d'alcoolisé),
// rangée et signée ; le passage suivant, son relevé — sans modèle qui voit (la CI n'en a pas), le relevé est noté comme
// raté et la pièce reste ; un relevé posé à la main est lu (les boîtes hors de l'image sont écartées) ; refaire le relevé :
// lui seul ; refaire la pièce : tout.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-pieces-duo-route.mjs
const F = "http://127.0.0.1:54321/rest/v1";
const FAUX = F.replace("/rest/v1", "");
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const octets = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.status === 200 ? Buffer.from(await r.arrayBuffer()) : null;
};
const toutIA = async () => (await (await fetch(`${FAUX}/__ia`)).json()).filter((c) => typeof c === "string");

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const ADMIN = "00000000-0000-4000-8000-0000000ad001";
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
await semer("admins", [{ user_id: ADMIN }]);

const ROUTE = `${BASE}/api/admin/direct/pieces-duo`;
const appeler = async (cookie, corps) => {
  const r = await fetch(ROUTE, corps ? { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify(corps) } : { headers: { cookie } });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const piece = (r, cle) => r.etat?.pieces?.find((p) => p.cle === cle);
const D = "pieces-duo/terrasse";

// ─── les gardes ───
ok((await appeler("")).statut === 403 && (await appeler("", { action: "fabriquer", piece: "salon" })).statut === 403, "l'administrateur seulement");
ok((await appeler(COOKIE_ADMIN, { action: "fabriquer", piece: "grenier" })).statut === 400 && (await appeler(COOKIE_ADMIN, { action: "danser", piece: "salon" })).statut === 400, "une pièce ou une action inconnue : refusée");

// ─── les cinq pièces ───
const e0 = await appeler(COOKIE_ADMIN);
ok(
  e0.statut === 200 &&
    e0.etat?.pieces?.map((p) => p.cle).join(",") === "salon,cuisine,terrasse,chambre,cafe" &&
    e0.etat.pieces.every((p) => p.nom && p.pour && p.emoji && !p.decor && !p.emplacements) &&
    e0.etat.moteurs?.image === true &&
    e0.etat.moteurs.regard === false,
  "les cinq pièces (salon, cuisine, terrasse, chambre vue mer, café), rien de fait ; le moteur d'image branché, pas de modèle qui voit",
);

// ─── 1. la pièce ───
const avant = (await toutIA()).length;
const r1 = await appeler(COOKIE_ADMIN, { action: "fabriquer", piece: "terrasse" });
const ia = (await toutIA()).slice(avant);
ok(r1.statut === 200 && r1.fait === "piece" && /^http/.test(piece(r1, "terrasse")?.decor ?? "") && (await octets(`${D}/decor.png`))?.subarray(1, 4).toString() === "PNG", "1. la terrasse : faite, rangée dans le catalogue (à part de chaque habitant), signée");
const c = ia[0] ?? "";
ok(
  ia.length === 1 &&
    c.startsWith("DESSIN ") &&
    c.includes("a covered terrace under a wooden pergola") &&
    c.includes("STYLE: ") &&
    c.includes("THE SAME SET OF OBJECTS IS IN EVERY ROOM") &&
    ["switched off", "record player", "EMPTY picture frames", "wall shelf", "Leave the seats empty", "two glasses of lemonade"].every((m) => c.includes(m)) &&
    c.includes("NO figurine, no person, no character, no animal, no text, no logo, no brand, nothing alcoholic"),
  `un dessin (sans image de départ) : le style des univers, les sept emplacements, les places vides, une limonade, personne, rien d'alcoolisé (${c.slice(0, 60)}…)`,
);
ok(piece(r1, "salon")?.decor === undefined, "les autres pièces : pas touchées");

// ─── 2. son relevé, sans modèle qui voit ───
const r2 = await appeler(COOKIE_ADMIN, { action: "fabriquer", piece: "terrasse" });
ok(r2.statut === 502 && /relevé/.test(r2.error ?? "") && piece(r2, "terrasse")?.releveRate && /^http/.test(piece(r2, "terrasse")?.decor ?? "") && !piece(r2, "terrasse")?.emplacements, "2. le relevé sans modèle qui voit : noté comme raté, la pièce reste (on la juge à l'œil)");
ok((await toutIA()).length === avant + 1, "rien de plus n'est parti chez le moteur d'image");
ok((await appeler(COOKIE_ADMIN, { action: "fabriquer", piece: "terrasse" })).fait === undefined, "déjà faite (pièce et relevé) : rien de plus");
ok((await octets(`${D}/verrou.json`)) === null, "aucun verrou ne reste");

// ─── un relevé lu (posé à la main, comme le rendrait le modèle qui voit) ───
await deposer(
  `${D}/releve.json`,
  JSON.stringify({
    le: new Date().toISOString(),
    emplacements: {
      tele: [0.1, 0.2, 0.25, 0.15],
      platine: [0.6, 0.55, 0.2, 0.1],
      cadres: [[0.4, 0.1, 0.1, 0.12], [2, 2, 1, 1]],
      etagere: [0.62, 0.2, 0.3, 0.08],
      fenetre: [0.3, 0, 0.5, 0.4],
      places: [{ x: 0.35, y: 0.8, hauteur: 0.3 }, { x: 0.65, y: 0.8, hauteur: 0.3 }],
      chat: { x: 0.85, y: 0.9 },
    },
  }),
  "application/json",
);
const e1 = piece(await appeler(COOKIE_ADMIN), "terrasse")?.emplacements;
ok(e1?.tele?.join() === "0.1,0.2,0.25,0.15" && e1.cadres?.length === 1 && e1.places?.length === 2 && e1.places[1].x === 0.65 && e1.chat?.y === 0.9 && e1.fenetre && e1.etagere && e1.platine, "un relevé : ses sept emplacements lus (le cadre hors de l'image, écarté)");

// ─── refaire ───
const rr = await appeler(COOKIE_ADMIN, { action: "refaire", piece: "terrasse", quoi: "releve" });
ok(rr.statut === 200 && /^http/.test(piece(rr, "terrasse")?.decor ?? "") && !piece(rr, "terrasse")?.emplacements && !piece(rr, "terrasse")?.releveRate && (await octets(`${D}/releve.json`)) === null, "refaire le relevé : lui seul s'efface (la pièce reste)");
const rp = await appeler(COOKIE_ADMIN, { action: "refaire", piece: "terrasse" });
ok(rp.statut === 200 && !piece(rp, "terrasse")?.decor && (await octets(`${D}/decor.png`)) === null, "refaire la pièce : tout s'efface");

console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
