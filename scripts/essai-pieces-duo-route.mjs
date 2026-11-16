// 🛋️ LA PIÈCE DU DUO — L'ESSAI DES PIÈCES (`lib/direct/pieces-duo-serveur.ts`, `app/api/admin/direct/pieces-duo`,
// `docs/univers/piece-du-duo.md`, `docs/univers/ma-maison.md`) — contre le faux Supabase et son faux moteur d'image,
// jamais la vraie base, jamais OpenAI.
//
// Réservé à l'administrateur. Le catalogue est le même pour tous, rangé à part de chaque habitant
// (`pieces-duo/<pièce>/`). Les neuf pièces (les cinq premières, le hangar, l'appart à New York, la rue, puis la chambre
// musicale), rien de fait ; une pièce inconnue : refusée ; un passage fait la pièce (un dessin, sans image de départ : le
// style des univers, les emplacements de la maquette, personne dedans, rien d'alcoolisé), rangée et signée ; le passage
// suivant, son relevé — sans modèle qui voit (la CI n'en a pas), le relevé est noté comme raté et la pièce reste ; un
// relevé posé à la main est lu (les boîtes hors de l'image sont écartées) ; refaire le relevé : lui seul ; refaire la
// pièce : tout.
//
// Les pièces refaites (15 novembre 2026) : la consigne donne à chaque pièce sa signature et sa lumière, répartit les objets
// (chacun à part, assez grand), vide l'étagère et les cadres ; après le relevé, deux passages font ses deux autres
// lumières (des retouches de la pièce : la même pièce, une autre heure) ; « ajuster » pose les zones à la main (elles
// remplacent le relevé) ; ce qui gênerait le doigt est signalé (chevauchement, objet petit, places loin).
//
// 🏠 Le lot M0 (16 novembre 2026 au soir) : la consigne a les éléments de la maquette du salon (la télé au mur du fond,
// trois cadres, deux lampes, la table basse entre deux places LIBRES, le coin du chat, le même cadrage) et se signe
// (`fabrique.json`) — une pièce d'avant est signalée « ancienne » ; LA LARGEUR : le centre (d'après la pièce en hauteur),
// la gauche et la droite (la toile prolongée, un masque), le panorama assemblé sans moteur (3584 × 1024), puis ses deux
// autres lumières (chaque partie retouchée, les côtés d'après le centre déjà retouché) ; ses zones posées à la main (une
// seule place : le centre) ; refaire un côté efface ce qui en dépend ; LA CHAMBRE MUSICALE : d'après l'image déposée
// (refusée ailleurs), la personne retirée, une télé ajoutée.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-pieces-duo-route.mjs
import sharp from "sharp";

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
const DL = `${D}/large`;

// ─── les gardes ───
ok((await appeler("")).statut === 403 && (await appeler("", { action: "fabriquer", piece: "salon" })).statut === 403, "l'administrateur seulement");
ok((await appeler(COOKIE_ADMIN, { action: "fabriquer", piece: "grenier" })).statut === 400 && (await appeler(COOKIE_ADMIN, { action: "danser", piece: "salon" })).statut === 400, "une pièce ou une action inconnue : refusée");

// ─── les neuf pièces ───
const e0 = await appeler(COOKIE_ADMIN);
ok(
  e0.statut === 200 &&
    e0.etat?.pieces?.map((p) => p.cle).join(",") === "salon,cuisine,terrasse,chambre,cafe,hangar,newyork,rue,chambre-musicale" &&
    e0.etat.pieces.every((p) => p.nom && p.pour && p.emoji && !p.decor && !p.emplacements && !p.ancienne && ["matin", "soir", "nuit"].includes(p.moment) && Object.keys(p.lumieres ?? {}).length === 0 && p.alertes?.length === 0) &&
    piece(e0, "terrasse").moment === "matin" &&
    piece(e0, "chambre").moment === "soir" &&
    !/alcool/.test(piece(e0, "terrasse").pour) &&
    e0.etat.moteurs?.image === true &&
    e0.etat.moteurs.regard === false,
  "les neuf pièces (salon, cuisine, terrasse, chambre vue mer, café ; hangar, appart à New York, rue ; la chambre musicale), rien de fait ; le moteur d'image branché, pas de modèle qui voit",
);
ok(
  e0.etat.pieces.every((p) => p.large?.faites?.length === 0 && p.large.aFaire?.length === 12 && p.large.aFaire.slice(0, 4).join() === "centre,gauche,droite,panorama" && Object.keys(p.large.panoramas).length === 0) &&
    piece(e0, "chambre-musicale").depuisImage === true &&
    !piece(e0, "chambre-musicale").source &&
    !piece(e0, "salon").depuisImage &&
    piece(e0, "terrasse").large.aFaire[4] === "centre-soir" &&
    piece(e0, "terrasse").large.aFaire.at(-1) === "panorama-nuit",
  "🌅 chaque pièce a sa largeur à faire, en douze étapes (le centre, la gauche, la droite, le panorama ; puis les mêmes dans ses deux autres lumières) ; la chambre musicale attend son image",
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
    c.includes("a covered veranda terrace in full daylight") &&
    c.includes("STYLE: ") &&
    !c.includes("golden practical lights") &&
    c.includes("THIS ROOM'S OWN IDENTITY") &&
    c.includes("whitewashed walls") &&
    c.includes("THE LIGHT: daytime") &&
    c.includes("THE SAME OBJECTS ARE IN EVERY ROOM") &&
    c.includes("no object overlaps, touches or hides another one") &&
    ["a WIDE shot that shows the whole place", "AND THEY ARE BIG", "switched off", "LARGE — about one third of the image width — in the middle of the back wall", "record player", "Three EMPTY picture frames", "(poster size)", "completely EMPTY", "carafe of lemonade", "At least two lamps: a tall outdoor floor lantern", "a clear EMPTY spot of floor", "each in its own little armchair", "Leave both spots completely empty: no chair, no sofa", "in a lower corner", "COMPOSITION (the same framing for every room)", "the main light comes from the window"].every((m) => c.includes(m)) &&
    !c.includes("Two big EMPTY") &&
    c.includes("NO figurine, no person, no character, no animal, no text, no logo, no brand, nothing alcoholic"),
  `un dessin (sans image de départ) aux éléments de la maquette : sa signature et sa lumière, la télé au mur du fond, trois cadres vides, deux lampes, la table basse (la carafe de citronnade) entre deux places libres (la figurine vient avec son fauteuil), le même cadrage, personne, rien d'alcoolisé (${c.slice(0, 60)}…)`,
);
const fab = JSON.parse((await octets(`${D}/fabrique.json`))?.toString() || "{}");
ok(fab.version === 3 && !piece(r1, "terrasse")?.ancienne, "la pièce se signe de sa consigne (version 3) : pas « ancienne »");
ok(piece(r1, "salon")?.decor === undefined, "les autres pièces : pas touchées");

// ─── une pièce d'avant : « ancienne consigne » ───
await deposer("pieces-duo/salon/decor.png", await sharp({ create: { width: 64, height: 96, channels: 3, background: { r: 90, g: 60, b: 40 } } }).png().toBuffer(), "image/png");
const ea = await appeler(COOKIE_ADMIN);
ok(piece(ea, "salon")?.ancienne === true && /^http/.test(piece(ea, "salon")?.decor ?? ""), "une pièce faite avant (sans sa signature) : signalée « ancienne consigne »");
const er = await appeler(COOKIE_ADMIN, { action: "refaire", piece: "salon" });
ok(!piece(er, "salon")?.decor && !piece(er, "salon")?.ancienne, "refaite : elle s'efface (elle se refera avec les éléments de la maquette)");

// ─── 2. son relevé, sans modèle qui voit ───
const r2 = await appeler(COOKIE_ADMIN, { action: "fabriquer", piece: "terrasse" });
ok(r2.statut === 502 && /relevé/.test(r2.error ?? "") && piece(r2, "terrasse")?.releveRate && /^http/.test(piece(r2, "terrasse")?.decor ?? "") && !piece(r2, "terrasse")?.emplacements, "2. le relevé sans modèle qui voit : noté comme raté, la pièce reste (on la juge à l'œil)");
ok((await toutIA()).length === avant + 1, "rien de plus n'est parti chez le moteur d'image");

// ─── 3. ses deux autres lumières (la terrasse est au matin : le soir, puis la nuit) ───
const avantL = (await toutIA()).length;
const l1 = await appeler(COOKIE_ADMIN, { action: "fabriquer", piece: "terrasse" });
const l2 = await appeler(COOKIE_ADMIN, { action: "fabriquer", piece: "terrasse" });
const iaL = (await toutIA()).slice(avantL);
ok(
  l1.statut === 200 && l1.fait === "lumiere" && l1.moment === "soir" && l2.fait === "lumiere" && l2.moment === "nuit" && /^http/.test(piece(l2, "terrasse")?.lumieres?.soir ?? "") && /^http/.test(piece(l2, "terrasse")?.lumieres?.nuit ?? "") && !piece(l2, "terrasse")?.lumieres?.matin,
  "3. ses deux autres lumières, une par passage : le soir, puis la nuit (le matin, c'est la pièce elle-même)",
);
ok(
  iaL.length === 2 &&
    iaL.every((x) => x.startsWith("IMAGE ") && x.includes(" high ") && x.includes("EXACTLY THE SAME ROOM") && x.includes("every object at exactly the same place") && x.includes("the picture frames empty, the shelf empty, the empty spots")) &&
    iaL[0].includes("early evening") &&
    iaL[1].includes("night: dark outside"),
  "des retouches de la pièce (l'image de départ, la fidélité haute) : la même pièce, seule l'heure change",
);
ok((await octets(`${D}/lumiere-soir.png`))?.subarray(1, 4).toString() === "PNG" && (await octets(`${D}/lumiere-matin.png`)) === null, "rangées à côté de la pièce (lumiere-soir.png, lumiere-nuit.png)");
ok((await appeler(COOKIE_ADMIN, { action: "fabriquer", piece: "terrasse" })).fait === undefined && (await toutIA()).length === avantL + 2, "tout est fait (la pièce, son relevé, ses lumières) : rien de plus");
ok((await octets(`${D}/verrou.json`)) === null, "aucun verrou ne reste");

// ─── 🌅 4. la largeur ───
const sansHauteur = await appeler(COOKIE_ADMIN, { action: "fabriquerLargeur", piece: "salon" });
ok(sansHauteur.statut === 502 && /hauteur/.test(sansHauteur.error ?? "") && (await octets("pieces-duo/salon/verrou.json")) === null, "4. la largeur d'une pièce pas encore faite en hauteur : refusée (elle se fait d'après elle), sans verrou laissé");
const avantG = (await toutIA()).length;
const g1 = await appeler(COOKIE_ADMIN, { action: "fabriquerLargeur", piece: "terrasse" });
const g2 = await appeler(COOKIE_ADMIN, { action: "fabriquerLargeur", piece: "terrasse" });
const g3 = await appeler(COOKIE_ADMIN, { action: "fabriquerLargeur", piece: "terrasse" });
const iaG = (await toutIA()).slice(avantG);
const g4 = await appeler(COOKIE_ADMIN, { action: "fabriquerLargeur", piece: "terrasse" });
ok([g1, g2, g3, g4].map((x) => `${x.statut}:${x.fait}`).join() === "200:centre,200:gauche,200:droite,200:panorama", "le centre, la gauche, la droite, puis le panorama : une étape par passage");
const [ce, ga, ma, dr, md] = iaG;
ok(
  iaG.length === 5 &&
    ce.startsWith("IMAGE ") &&
    ce.includes(" high ") &&
    ["EXACTLY THE SAME ROOM", "the CENTRAL part of a panorama", "ONE clear EMPTY spot of floor", "one small figurine in its own little armchair", "NOT in this central part", "carafe of lemonade", "THE LIGHT: daytime"].every((m) => ce.includes(m)) &&
    !ce.includes("IMAGE 2"),
  "le centre : une retouche de la pièce en hauteur (la même pièce, plus large) — une place libre au milieu, la télé, les cadres, la table basse ; le reste sur les côtés",
);
ok(
  ga.startsWith("IMAGE ") &&
    ga.includes("Extend the room to the LEFT") &&
    ga.includes("a bright blue sky over the sea") &&
    ga.includes("completely EMPTY") &&
    ga.includes("never repeat a unique object") &&
    ga.includes("IMAGE 2 is the same room in a vertical frame") &&
    ma === "MASQUE 1536x1024" &&
    dr.includes("Extend the room to the RIGHT") &&
    dr.includes("record player") &&
    dr.includes("a cushion for a cat on a low stone bench") &&
    md === "MASQUE 1536x1024",
  "la gauche (la fenêtre, l'étagère vide, une lampe) et la droite (la platine, le coin du chat, l'autre lampe) : la toile prolongée, avec son masque, sans rien répéter",
);
const pano = await octets(`${DL}/panorama.webp`);
const meta = pano ? await sharp(pano).metadata() : {};
ok(meta.format === "webp" && meta.width === 3584 && meta.height === 1024 && (await toutIA()).length === avantG + 5, `le panorama : assemblé sans moteur, 3584 × 1024 (${meta.width} × ${meta.height})`);
ok(/^http/.test(piece(g4, "terrasse")?.large?.panoramas?.matin ?? "") && piece(g4, "terrasse").large.faites.length === 4 && piece(g4, "terrasse").large.aFaire[0] === "centre-soir" && Object.keys(piece(g4, "terrasse").large.parties).length === 0, "rangé dans pieces-duo/terrasse/large/, signé ; ensuite, ses autres lumières");
ok(/^http/.test(piece(g2, "terrasse")?.large?.parties?.centre ?? "") && /^http/.test(piece(g2, "terrasse")?.large?.parties?.gauche ?? ""), "(tant que le panorama n'est pas fait, ses parties faites se voient)");

// ─── 5. la largeur dans ses deux autres lumières ───
const avantM = (await toutIA()).length;
const faits = [];
for (let k = 0; k < 8; k++) faits.push((await appeler(COOKIE_ADMIN, { action: "fabriquerLargeur", piece: "terrasse" })).fait);
const iaM = (await toutIA()).slice(avantM);
ok(faits.join() === "centre-soir,gauche-soir,droite-soir,panorama-soir,centre-nuit,gauche-nuit,droite-nuit,panorama-nuit", `5. ses deux autres lumières : chaque partie retouchée, puis assemblée (${faits.join(" ")})`);
ok(
  iaM.length === 6 &&
    iaM.every((x) => x.startsWith("IMAGE ") && x.includes("EXACTLY THE SAME IMAGE") && x.includes("Change ONLY the time of day")) &&
    !iaM[0].includes("IMAGE 2") &&
    iaM[1].includes("IMAGE 2 is the next part of the same panorama, already in that light") &&
    iaM[0].includes("early evening") &&
    iaM[3].includes("night: dark outside"),
  "des retouches (sans masque) : le centre d'abord, puis chaque côté d'après le centre déjà retouché (pas de raccord visible)",
);
const em = await appeler(COOKIE_ADMIN, { action: "fabriquerLargeur", piece: "terrasse" });
ok(em.fait === undefined && /^http/.test(piece(em, "terrasse")?.large?.panoramas?.nuit ?? "") && piece(em, "terrasse").large.aFaire.length === 0 && (await toutIA()).length === avantM + 6, "tout est fait en largeur : rien de plus");
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
      table: [0.42, 0.7, 0.16, 0.08],
      lampes: [[0.05, 0.3, 0.08, 0.3], [5, 5, 1, 1]],
    },
  }),
  "application/json",
);
const e1 = piece(await appeler(COOKIE_ADMIN), "terrasse")?.emplacements;
ok(e1?.tele?.join() === "0.1,0.2,0.25,0.15" && e1.cadres?.length === 1 && e1.places?.length === 2 && e1.places[1].x === 0.65 && e1.chat?.y === 0.9 && e1.fenetre && e1.etagere && e1.platine && e1.table?.join() === "0.42,0.7,0.16,0.08" && e1.lampes?.length === 1, "un relevé : ses emplacements lus, la table basse et les lampes comprises (le cadre et la lampe hors de l'image, écartés)");
ok(piece(await appeler(COOKIE_ADMIN), "terrasse")?.alertes?.length === 0, "des objets à part, assez grands, des places proches : aucune alerte");

// ─── ✋ ajuster à la main ───
ok((await appeler(COOKIE_ADMIN, { action: "ajuster", piece: "salon", emplacements: { tele: [0.1, 0.1, 0.3, 0.2] } })).statut === 400, "ajuster une pièce pas encore faite : refusé");
ok((await appeler(COOKIE_ADMIN, { action: "ajuster", piece: "terrasse", emplacements: { tele: [3, 3, 1, 1] } })).statut === 400, "rien qui tienne debout : refusé");
const aj = await appeler(COOKIE_ADMIN, {
  action: "ajuster",
  piece: "terrasse",
  emplacements: { tele: [0.1, 0.1, 0.3, 0.2], platine: [0.2, 0.15, 0.2, 0.1], cadres: [[0.5, 0.1, 0.05, 0.1]], places: [{ x: 0.2, y: 0.8, hauteur: 0.3 }, { x: 0.85, y: 0.8, hauteur: 0.3 }] },
});
const pa = piece(aj, "terrasse");
const relu = JSON.parse((await octets(`${D}/releve.json`))?.toString() || "{}");
ok(aj.statut === 200 && pa?.ajuste === true && pa.emplacements?.tele?.join() === "0.1,0.1,0.3,0.2" && !pa.emplacements.etagere && relu.ajuste === true && !relu.erreur, "ajuster : les zones posées à la main remplacent le relevé (« posés à la main »)");
ok(
  pa?.alertes?.length === 3 &&
    pa.alertes.some((a) => /télé et la platine se chevauchent/.test(a)) &&
    pa.alertes.some((a) => /cadre est petit \(5 % de la largeur\)/.test(a)) &&
    pa.alertes.some((a) => /places sont loin/.test(a)),
  `ce qui gênerait le doigt : signalé (${(pa?.alertes ?? []).join(" ; ")})`,
);

// ─── ✋ la largeur, à la main ───
ok((await appeler(COOKIE_ADMIN, { action: "ajusterLargeur", piece: "cuisine", emplacements: { tele: [0.4, 0.2, 0.1, 0.2] } })).statut === 400, "ajuster la largeur d'une pièce sans panorama : refusé");
const al = await appeler(COOKIE_ADMIN, {
  action: "ajusterLargeur",
  piece: "terrasse",
  emplacements: { tele: [0.44, 0.2, 0.12, 0.25], cadres: [[0.3, 0.1, 0.05, 0.2]], places: [{ x: 0.5, y: 0.95, hauteur: 0.5 }, { x: 0.7, y: 0.9, hauteur: 0.5 }] },
});
const lv = piece(al, "terrasse")?.large;
const releveL = JSON.parse((await octets(`${DL}/releve.json`))?.toString() || "{}");
ok(lv?.alertes?.length === 0, `sur le panorama, « petit » se mesure en pixels comme en hauteur : un cadre de 5 % de sa largeur ne l'est pas (${(lv?.alertes ?? []).join(" ; ")})`);
ok(al.statut === 200 && lv?.ajuste === true && lv.emplacements?.places?.length === 1 && lv.emplacements.places[0].x === 0.5 && lv.emplacements.tele?.join() === "0.44,0.2,0.12,0.25" && releveL.ajuste === true && piece(al, "terrasse")?.emplacements?.tele?.join() === "0.1,0.1,0.3,0.2", "ses zones sur le panorama : une seule place, le centre ; celles de la hauteur ne bougent pas");

// ─── ↩️ refaire dans la largeur ───
ok((await appeler(COOKIE_ADMIN, { action: "refaireLargeur", piece: "terrasse", quoi: "danser" })).statut === 400, "refaire quoi ? refusé");
const rg = await appeler(COOKIE_ADMIN, { action: "refaireLargeur", piece: "terrasse", quoi: "gauche" });
const lg = piece(rg, "terrasse")?.large;
ok(
  rg.statut === 200 &&
    lg?.aFaire.join() === "gauche,panorama,gauche-soir,panorama-soir,gauche-nuit,panorama-nuit" &&
    (await octets(`${DL}/centre.png`)) !== null &&
    (await octets(`${DL}/droite-nuit.png`)) !== null &&
    (await octets(`${DL}/gauche-soir.png`)) === null &&
    lv?.emplacements &&
    lg.emplacements,
  "refaire la gauche : elle, ses lumières et les panoramas s'effacent ; le centre, la droite et les zones restent",
);
const rgl = await appeler(COOKIE_ADMIN, { action: "fabriquerLargeur", piece: "terrasse" });
ok(rgl.fait === "gauche", "et le passage suivant la refait");
const rlum = await appeler(COOKIE_ADMIN, { action: "refaireLargeur", piece: "terrasse", quoi: "lumieres" });
ok(piece(rlum, "terrasse")?.large?.faites.join() === "centre,gauche,droite" && (await octets(`${DL}/centre-soir.png`)) === null, "refaire ses lumières : elles seules (et le panorama manquant reste à faire)");

// ─── refaire les lumières : elles seules ───
const rl = await appeler(COOKIE_ADMIN, { action: "refaire", piece: "terrasse", quoi: "lumieres" });
ok(rl.statut === 200 && Object.keys(piece(rl, "terrasse")?.lumieres ?? {}).length === 0 && /^http/.test(piece(rl, "terrasse")?.decor ?? "") && piece(rl, "terrasse")?.ajuste === true && (await octets(`${D}/lumiere-soir.png`)) === null && (await octets(`${DL}/centre.png`)) !== null, "refaire les lumières : elles seules s'effacent (la pièce, ses zones et sa largeur restent)");

// ─── refaire ───
const rr = await appeler(COOKIE_ADMIN, { action: "refaire", piece: "terrasse", quoi: "releve" });
ok(rr.statut === 200 && /^http/.test(piece(rr, "terrasse")?.decor ?? "") && !piece(rr, "terrasse")?.emplacements && !piece(rr, "terrasse")?.releveRate && (await octets(`${D}/releve.json`)) === null, "refaire le relevé : lui seul s'efface (la pièce reste)");
const rp = await appeler(COOKIE_ADMIN, { action: "refaire", piece: "terrasse" });
ok(rp.statut === 200 && !piece(rp, "terrasse")?.decor && piece(rp, "terrasse")?.large?.faites.length === 0 && !piece(rp, "terrasse")?.large?.emplacements && (await octets(`${DL}/centre.png`)) === null && (await octets(`${D}/fabrique.json`)) === null, "refaire la pièce : sa largeur s'efface aussi (elle est faite d'après elle), ses zones comprises");
const l3 = await appeler(COOKIE_ADMIN, { action: "fabriquer", piece: "terrasse" });
ok(l3.fait === "piece", "une pièce sans lumière ni relevé : refaite depuis le début");
await appeler(COOKIE_ADMIN, { action: "fabriquer", piece: "terrasse" });
await appeler(COOKIE_ADMIN, { action: "fabriquer", piece: "terrasse" });
ok((await octets(`${D}/lumiere-soir.png`)) !== null, "(la pièce, son relevé, sa lumière du soir, refaits)");
const rp2 = await appeler(COOKIE_ADMIN, { action: "refaire", piece: "terrasse" });
ok(rp2.statut === 200 && !piece(rp2, "terrasse")?.decor && (await octets(`${D}/decor.png`)) === null && (await octets(`${D}/lumiere-soir.png`)) === null && (await octets(`${D}/releve.json`)) === null, "refaire la pièce : tout s'efface (ses lumières aussi)");

// ─── 🖼️ la chambre musicale, d'après l'image déposée ───
const M = "pieces-duo/chambre-musicale";
const image = `data:image/png;base64,${(await sharp({ create: { width: 300, height: 200, channels: 3, background: { r: 120, g: 80, b: 160 } } }).png().toBuffer()).toString("base64")}`;
ok((await appeler(COOKIE_ADMIN, { action: "deposerSource", piece: "salon", image })).statut === 400 && (await octets("pieces-duo/salon/source.png")) === null, "déposer une image pour une autre pièce : refusé");
const sans = await appeler(COOKIE_ADMIN, { action: "fabriquer", piece: "chambre-musicale" });
ok(sans.statut === 502 && /Dépose d’abord l’image/.test(sans.error ?? "") && (await octets(`${M}/verrou.json`)) === null, "la chambre musicale sans son image : elle l'attend");
ok((await appeler(COOKIE_ADMIN, { action: "deposerSource", piece: "chambre-musicale", image: "data:text/plain;base64,Ym9uam91cg==" })).statut === 400, "ce qui n'est pas une image : refusé");
const dep = await appeler(COOKIE_ADMIN, { action: "deposerSource", piece: "chambre-musicale", image });
const src = await octets(`${M}/source.png`);
ok(dep.statut === 200 && /^http/.test(piece(dep, "chambre-musicale")?.source ?? "") && src?.subarray(1, 4).toString() === "PNG" && (await sharp(src).metadata()).width === 300, "déposée : rangée en png, signée (elle n'est pas dans le dépôt)");
const avantC = (await toutIA()).length;
const cm = await appeler(COOKIE_ADMIN, { action: "fabriquer", piece: "chambre-musicale" });
const iaC = (await toutIA()).slice(avantC);
ok(
  cm.fait === "piece" &&
    iaC.length === 1 &&
    iaC[0].startsWith("IMAGE ") &&
    iaC[0].includes(" high ") &&
    ["Make EXACTLY THIS ROOM", "REMOVE the person and any character", "every interface element", "ADD those that are missing (the TV above all)", "Three EMPTY picture frames", "a clear EMPTY spot of floor"].every((m) => iaC[0].includes(m)),
  "la chambre en hauteur : une retouche de l'image déposée — la même chambre, sans sa personne ni ce qui est dessiné par-dessus, une télé ajoutée, les éléments de la maquette",
);
const avantCL = (await toutIA()).length;
const cml = await appeler(COOKIE_ADMIN, { action: "fabriquerLargeur", piece: "chambre-musicale" });
const iaCL = (await toutIA()).slice(avantCL);
ok(cml.fait === "centre" && iaCL[0]?.includes("IMAGE 2 is the original drawing of this same room") && iaCL[0].includes("WITHOUT its person"), "sa largeur : d'après la chambre en hauteur, et l'image déposée pour en voir plus (sans sa personne)");
const redep = await appeler(COOKIE_ADMIN, { action: "deposerSource", piece: "chambre-musicale", image });
ok(redep.statut === 200 && !piece(redep, "chambre-musicale")?.decor && piece(redep, "chambre-musicale")?.large?.faites.length === 0 && /^http/.test(piece(redep, "chambre-musicale")?.source ?? ""), "une autre image déposée : la chambre faite s'efface (elle se refait d'après elle)");

console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
