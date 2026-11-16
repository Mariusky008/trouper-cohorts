// 🧩 L'EFFET « COLLAGE » — LE PREMIER ESSAI DE LA MAQUETTE DE LA PIÈCE DU DUO (`lib/direct/pieces-duo-collage-serveur.ts`,
// `app/api/admin/direct/pieces-duo/collage`) — contre le faux Supabase et son faux moteur d'image, jamais la vraie
// base, jamais OpenAI.
//
// Réservé à l'administrateur. Les figurines : celle de ce téléphone (Léa, sa figurine assise du nouveau style), puis
// celles des essais du lot 0 (une détourée aimée ; pas une refusée, pas une debout, pas une en situation). Une pièce pas
// faite, deux fois la même figurine : refusées. Le choix (le salon, Léa à gauche) ; trois passages : la pose de Léa
// sans fauteuil (détourée, fidélité haute), celle de la volontaire, puis le duo généré dans la pièce (la pièce et les
// deux poses, leurs places relevées, de gauche à droite ; un masque : seule la zone des places est peinte, puis
// recollée sur la pièce — hors de cette zone, la pièce reste la même au pixel près) ; puis plus rien. La lumière : celle
// de la pièce par défaut (le salon : le soir) ; une lumière pas encore faite, refusée ; le matin une fois fait, un duo à
// part, d'après la pièce au matin (une image par pièce ET par lumière). L'avis ; refaire le duo : lui seul ; refaire
// les poses : tout ; un nouveau choix efface l'avis.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-pieces-duo-collage-route.mjs
import sharp from "sharp";

const F = "http://127.0.0.1:54321/rest/v1";
const FAUX = F.replace("/rest/v1", "");
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
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
const LEA = { id: "aeaeaeae-0000-4000-8000-000000000c01", jeton: "jeton-lea-collage-000000001" };
await semer("human_habitants", [{ id: LEA.id, device_token: LEA.jeton, prenom: "Léa", ville_slug: "dax" }]);

// ─── Léa : sa figurine assise (le nouveau style) ───
const maintenant = new Date().toISOString();
const PNG = await sharp({ create: { width: 64, height: 96, channels: 4, background: { r: 200, g: 140, b: 90, alpha: 1 } } }).png().toBuffer();
const P1 = `${LEA.id}/perso/v1`;
await deposer(`${P1}/assise.png`, PNG, "image/png");
const perso = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${P1}/assise.png` } }, historique: [{ version: 1, le: maintenant, raison: "« C’est moi ! »", style: "collection-1" }] };
await json(`${P1}/fiche.json`, perso);
await json(`${LEA.id}/perso/fiche.json`, perso);

// ─── les essais du lot 0 : une volontaire, une figurine aimée, une refusée, une debout, une en situation ───
const L0 = "essais-univers";
await json(`${L0}/personnes/vvvvvvvvvvv1.json`, { id: "vvvvvvvvvvv1", nom: "Volontaire 1", accordLe: maintenant, le: maintenant, traits: null });
const resultat = (id, x) => json(`${L0}/resultats/${id}.json`, { id, personne: "vvvvvvvvvvv1", etat: "fait", qualite: "high", taille: "1024x1536", le: maintenant, consigne: "…", ...x });
await resultat("aimeeaimee01", { type: "figurine", variante: "sculptee", avis: "oui" });
await resultat("refuseerefu1", { type: "figurine", variante: "sculptee-libre", avis: "non" });
await resultat("deboutdebou1", { type: "constance", variante: "debout" });
await resultat("photophotop1", { type: "figurine", variante: "sculptee-photo" });
for (const id of ["aimeeaimee01", "refuseerefu1", "deboutdebou1", "photophotop1"]) await deposer(`${L0}/resultats/${id}.png`, PNG, "image/png");

// ─── le salon : fait, ses places relevées (dans le désordre) ───
await deposer("pieces-duo/salon/decor.png", PNG, "image/png");
// (la télé : dans la zone peinte, au-dessus des têtes, sans toucher les figurines — elle doit rester telle quelle)
await json("pieces-duo/salon/releve.json", { le: maintenant, emplacements: { tele: [0.05, 0.19, 0.3, 0.05], cadres: [], places: [{ x: 0.7, y: 0.66, hauteur: 0.28 }, { x: 0.3, y: 0.62, hauteur: 0.32 }] } });

const ROUTE = `${BASE}/api/admin/direct/pieces-duo/collage`;
const appeler = async (cookie, corps) => {
  const r = await fetch(ROUTE, corps ? { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify(corps) } : { headers: { cookie } });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const lea = `${COOKIE_ADMIN}; clikme_habitant=${LEA.jeton}`;
const D = "pieces-duo/collage";

// ─── les gardes ───
ok((await appeler(`clikme_habitant=${LEA.jeton}`)).statut === 403 && (await appeler(`clikme_habitant=${LEA.jeton}`, { action: "fabriquer" })).statut === 403, "l'administrateur seulement");
ok((await appeler(lea, { action: "danser" })).statut === 400, "une action inconnue : refusée");

// ─── les figurines ───
const e0 = await appeler(lea);
const ids = e0.etat?.figurines?.map((f) => f.id) ?? [];
ok(e0.statut === 200 && ids.join() === "moi,aimeeaimee01" && e0.etat.choix === null && e0.etat.moteur === true, `les figurines : celle de ce téléphone, puis l'aimée du lot 0 (ni la refusée, ni la debout, ni celle en situation) — ${ids.join(", ")}`);
ok(e0.etat?.figurines?.[1]?.nom === "Volontaire 1 👍" && e0.etat.figurines.every((f) => /^http/.test(f.image)), "son nom (aimée), leurs images signées");
ok((await appeler(COOKIE_ADMIN)).etat?.figurines?.map((f) => f.id).join() === "aimeeaimee01", "sans figurine sur ce téléphone : celles du lot 0 seulement");
ok((await appeler(lea, { action: "fabriquer" })).statut === 502, "rien de choisi : rien à faire");

// ─── le choix ───
ok((await appeler(lea, { action: "choisir", piece: "cuisine", a: "moi", b: "aimeeaimee01" })).error?.includes("pas encore faite"), "une pièce pas faite : refusée");
ok((await appeler(lea, { action: "choisir", piece: "salon", a: "moi", b: "moi" })).statut === 400 && (await appeler(lea, { action: "choisir", piece: "salon", a: "moi", b: "refuseerefu1" })).statut === 400, "deux fois la même, ou une refusée : refusées");
const c1 = await appeler(lea, { action: "choisir", piece: "salon", a: "moi", b: "aimeeaimee01" });
ok(c1.statut === 200 && c1.etat?.choix?.piece === "salon" && c1.etat.choix.a === "moi" && c1.etat.moment === "soir" && c1.etat.moments?.join() === "soir" && /^http/.test(c1.etat.decor ?? "") && c1.etat.places?.[0]?.x === 0.3 && c1.etat.places[1].x === 0.7 && !c1.etat.poses?.a, "le salon, Léa à gauche : la pièce et ses places relevées, de gauche à droite");

// ─── 1. la pose de Léa, 2. celle de la volontaire ───
const avant = (await toutIA()).length;
const f1 = await appeler(lea, { action: "fabriquer" });
let ia = (await toutIA()).slice(avant);
ok(f1.statut === 200 && f1.fait === "pose-a" && /^http/.test(f1.etat?.poses?.a ?? "") && !f1.etat.poses.b, "1. la pose de Léa : faite, signée");
ok(ia.length === 1 && ia[0].includes(" transparent high ") && ia[0].includes("WITHOUT the armchair") && ia[0].includes("Transparent background"), `sans son fauteuil, détourée, fidèle (${(ia[0] ?? "").slice(0, 70)}…)`);
ok(ia[0].includes("turned three-quarters toward the RIGHT side of the image"), "Léa, à gauche : tournée de trois quarts vers la droite (vers l'autre)");
const f2 = await appeler(lea, { action: "fabriquer" });
ok(f2.fait === "pose-b" && /^http/.test(f2.etat?.poses?.b ?? "") && !f2.etat.generee, "2. la pose de la volontaire");
ok(((await toutIA())[avant + 1] ?? "").includes("turned three-quarters toward the LEFT side of the image"), "la volontaire, à droite : tournée de trois quarts vers la gauche");

// ─── 3. le duo, généré dans la pièce ───
const f3 = await appeler(lea, { action: "fabriquer" });
ia = (await toutIA()).slice(avant + 2);
ok(f3.fait === "duo" && /^http/.test(f3.etat?.generee ?? ""), "3. le duo, généré dans la pièce : fait, signé");
const image = ia.find((c) => c.startsWith("IMAGE ")) ?? "";
ok(
  ia.length === 2 && ia.some((c) => c.startsWith("MASQUE ")) && /^IMAGE \S+  high /.test(image) && image.includes("IMAGE 1 is a room") && image.includes("in the transparent (masked) area only") && image.includes("about 30% from the left and 62% from the top") && image.includes("about 70% from the left") && image.includes("Keep everything outside the masked area EXACTLY as it is"),
  "un masque : seule la zone des places est peinte, les deux assises à leurs places relevées (gauche, puis droite)",
);
ok(image.includes("it follows the outline of the two figurines") && image.includes("a rough cut-out collage") && image.includes("Do not zoom in, do not crop") && image.includes("at EXACTLY the same place and the same size as in IMAGE 1") && image.includes("never sunk into the floor"), "d'après un collage : la pièce telle quelle (ni zoom ni recadrage), les figurines à leur place et à leur taille, les pieds jamais dans le sol");
// (l'image du duo, lue par son adresse signée — son nom porte l'empreinte des places)
const lue = async (url) => (url ? Buffer.from(await (await fetch(url)).arrayBuffer()) : null);
const duo = await lue(f3.etat?.generee);
const px = duo ? await sharp(duo).raw().toBuffer({ resolveWithObject: true }) : null;
ok(px?.info.width === 64 && px.info.height === 96 && px.data[0] === 200 && px.data[1] === 140 && px.data[2] === 90, "recollée sur la pièce : la même taille, et hors de la zone des places, la pièce au pixel près");
// (le faux moteur rend un rectangle orangé de x 16 à 47, y 16 à 79, sur du vide ; les figurines posées — 31 pixels de haut,
// 0,32 de l'image — : Léa de x 11 à 26, y 39 à 69 ; la volontaire de x 37 à 52, y 43 à 73 ; la marge, 4 pixels)
const pixel = (x, y) => [...px.data.subarray((y * 64 + x) * 3, (y * 64 + x) * 3 + 3)].join();
ok(px && pixel(20, 50) === "200,90,60" && pixel(45, 60) === "200,90,60", `sur les deux figurines : l'image rendue (${px && pixel(20, 50)}, ${px && pixel(45, 60)})`);
ok(px && pixel(31, 55) === "200,140,90" && pixel(60, 50) === "200,140,90" && pixel(12, 20) === "200,140,90", `entre elles, à côté, au-dessus (la télé) : la pièce telle quelle, rien que leur silhouette est peinte (${px && pixel(31, 55)})`);
ok((await appeler(lea, { action: "fabriquer" })).fait === undefined && (await toutIA()).length === avant + 4, "tout est fait : plus rien");
ok((await octets(`${D}/verrou.json`)) === null, "aucun verrou ne reste");

// ─── l'avis ───
ok((await appeler(lea, { action: "avis", avis: "bof" })).statut === 400, "un avis inconnu : refusé");
const a1 = await appeler(lea, { action: "avis", avis: "generee", note: "Les posées font autocollant." });
ok(a1.etat?.choix?.avis === "generee" && a1.etat.choix.note === "Les posées font autocollant.", "son avis et son mot, gardés");

// ─── refaire ───
const r1 = await appeler(lea, { action: "refaire", quoi: "duo" });
ok(!r1.etat?.generee && /^http/.test(r1.etat?.poses?.a ?? "") && /^http/.test(r1.etat?.poses?.b ?? ""), "refaire la générée : elle seule s'efface");
const r2 = await appeler(lea, { action: "refaire", quoi: "poses" });
ok(!r2.etat?.poses?.a && !r2.etat?.poses?.b && !r2.etat?.generee, "refaire les poses : tout s'efface");
const c2 = await appeler(lea, { action: "choisir", piece: "salon", a: "aimeeaimee01", b: "moi" });
ok(c2.etat?.choix?.a === "aimeeaimee01" && !c2.etat.choix.avis, "un nouveau choix (l'inverse) : l'avis s'efface");

// ─── la lumière : une image du duo par pièce et par lumière ───
ok((await appeler(lea, { action: "choisir", piece: "salon", a: "moi", b: "aimeeaimee01", moment: "matin" })).error?.includes("pas encore faite"), "une lumière pas encore faite : refusée");
const MATIN = await sharp({ create: { width: 64, height: 96, channels: 4, background: { r: 100, g: 150, b: 200, alpha: 1 } } }).png().toBuffer();
await deposer("pieces-duo/salon/lumiere-matin.png", MATIN, "image/png");
const m1 = await appeler(lea, { action: "choisir", piece: "salon", a: "moi", b: "aimeeaimee01", moment: "matin" });
ok(m1.statut === 200 && m1.etat?.moment === "matin" && m1.etat.moments?.join() === "matin,soir" && !m1.etat.generee, "le matin, une fois fait : choisi (les lumières faites : le matin, le soir) ; son duo pas encore fait");
const avantM = (await toutIA()).length;
let fm = {};
for (let k = 0; k < 3 && !fm.etat?.generee; k++) fm = await appeler(lea, { action: "fabriquer" });
const pxm = await sharp((await lue(fm.etat?.generee)) ?? MATIN).raw().toBuffer({ resolveWithObject: true });
ok(/^http/.test(fm.etat?.generee ?? "") && (await toutIA()).slice(avantM).filter((c) => c.startsWith("IMAGE ")).length >= 1 && pxm.data[0] === 100 && pxm.data[1] === 150 && pxm.data[2] === 200, "son duo, à part : fait d'après la pièce au matin (hors des places, la pièce du matin au pixel près)");

console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
