// 🎨 LES AMBIANCES DE SON UNIVERS — L'ESSAI (`lib/direct/ambiances.ts`, `lib/direct/ambiances-serveur.ts`,
// `app/api/admin/direct/ambiances`) — contre le faux Supabase et son faux moteur d'image, jamais la vraie base, jamais
// OpenAI.
//
// Réservé à l'administrateur, sur SON univers. Ce que Pablito propose : Léa lui a parlé de sa console et de ses
// soirées Minecraft → 🎮 néon et gaming (« Tu m’as parlé d’une console… ») ; Tom, rien de tel, mais sa figurine montre
// un ado → 🗽 un loft à New York ; Zoé, une étagère de livres (« tag » n'est pas dans « étagère ») et l'air d'une
// adulte → 🛋️ cosy ; Sam n'a pas d'univers. Cosy : son décor d'aujourd'hui, rien à faire. Fabriquer : celle que Pablito
// propose d'abord — son monde réinterprété (le loft, les néons…), son élément gardé, en hauteur ; puis une demandée.
// Refaire : elle s'efface ; cosy ne s'efface pas ; une ambiance inconnue : refusée.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-ambiances-route.mjs
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
const LEA = { id: "afafafaf-0000-4000-8000-000000000a01", jeton: "jeton-lea-ambiance-000000001" };
const TOM = { id: "afafafaf-0000-4000-8000-000000000a02", jeton: "jeton-tom-ambiance-000000001" };
const ZOE = { id: "afafafaf-0000-4000-8000-000000000a03", jeton: "jeton-zoe-ambiance-000000001" };
const SAM = { id: "afafafaf-0000-4000-8000-000000000a04", jeton: "jeton-sam-ambiance-000000001" };
await semer("human_habitants", [LEA, TOM, ZOE, SAM].map((x) => ({ id: x.id, device_token: x.jeton, prenom: "Essai", ville_slug: "dax" })));

// ─── leurs figurines (l'âge que montrent leurs traits) et leurs univers ───
const maintenant = new Date().toISOString();
const PNG = await sharp({ create: { width: 64, height: 96, channels: 4, background: { r: 200, g: 140, b: 90, alpha: 1 } } }).png().toBuffer();
async function habiter(x, age, monde) {
  const P1 = `${x.id}/perso/v1`;
  await deposer(`${P1}/assise.png`, PNG, "image/png");
  const perso = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, traits: { age, cheveux: "court" }, references: { assise: { chemin: `${P1}/assise.png` } }, historique: [{ version: 1, le: maintenant, raison: "« C’est moi ! »", style: "collection-1" }] };
  await json(`${P1}/fiche.json`, perso);
  await json(`${x.id}/perso/fiche.json`, perso);
  if (!monde) return;
  await deposer(`${x.id}/monde/v1/decor.png`, PNG, "image/png");
  const fiche = {
    version: 1,
    style: "film-chaleureux-1",
    creee_le: maintenant,
    validee_le: maintenant,
    proposition: monde.proposition,
    ambiance: { lumiere: "fin d'après-midi dorée", palette: ["#e8b06a", "#2f5d73", "#f3ead9"] },
    elements: monde.elements.map((e, n) => ({ id: `e${n + 1}`, ...e, source: "dit", valide: true })),
    regles: [],
    inconnus: [],
    scene: { sol: 0.78, places: [{ id: "hote", x: 0.36, y: 0.8, echelle: 1 }], lumiere: { vient_de: "gauche", couleur: "#ffd9a0" } },
    references: { decor: { chemin: `${x.id}/monde/v1/decor.png` } },
    visibilite: "proches",
    souvenirs: [],
    historique: [{ version: 1, le: maintenant, raison: "sa conversation avec Pablito", style: "film-chaleureux-1" }],
  };
  await json(`${x.id}/monde/v1/fiche.json`, fiche);
  await json(`${x.id}/monde/fiche.json`, fiche);
}
await habiter(LEA, "early twenties", {
  proposition: "Je t'imagine dans ta chambre, ton QG.",
  elements: [
    { quoi: "une console branchée sur un grand écran", pourquoi: "je joue à Minecraft tous les soirs avec mes potes" },
    { quoi: "un poster de mon groupe préféré", pourquoi: "je l'écoute en boucle" },
  ],
});
await habiter(TOM, "a teenager, about 16", { proposition: "Je t'imagine dans un endroit à toi.", elements: [{ quoi: "un ballon de foot", pourquoi: "je joue le samedi" }] });
await habiter(ZOE, "in her fifties", { proposition: "Je t'imagine dans un salon lumineux.", elements: [{ quoi: "une étagère de livres", pourquoi: "je lis tous les soirs" }] });
await habiter(SAM, "about 30", null);

const ROUTE = `${BASE}/api/admin/direct/ambiances`;
const appeler = async (x, corps) => {
  const cookie = x ? `${COOKIE_ADMIN}; clikme_habitant=${x.jeton}` : `clikme_habitant=${LEA.jeton}`;
  const r = await fetch(ROUTE, corps ? { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify(corps) } : { headers: { cookie } });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};

// ─── les gardes ───
ok((await appeler(null)).statut === 403, "l'administrateur seulement");
const s0 = await appeler(SAM);
ok(s0.statut === 200 && s0.etat?.univers === false, "Sam, sans univers : rien à réinterpréter");
ok((await appeler(SAM, { action: "fabriquer" })).error?.includes("Crée d’abord ton univers"), "Sam : « Crée d’abord ton univers »");
ok((await appeler(LEA, { action: "fabriquer", ambiance: "disco" })).statut === 400, "une ambiance inconnue : refusée");

// ─── ce que Pablito propose ───
const l0 = await appeler(LEA);
ok(l0.statut === 200 && l0.etat?.proposee?.ambiance === "neon" && l0.etat.proposee.pourquoi === "Tu m’as parlé d’une console branchée sur un grand écran : je te vois bien dans une pièce pleine de néons 🎮", `Léa (sa console, Minecraft) : 🎮 néon et gaming — « ${l0.etat?.proposee?.pourquoi} »`);
ok(/^http/.test(l0.etat?.images?.cosy ?? "") && Object.keys(l0.etat.images).length === 1 && l0.etat.aFaire?.join() === "neon,new-york,pastel" && /^http/.test(l0.etat.figurine ?? ""), "cosy : son décor d'aujourd'hui ; à faire, celle que Pablito propose d'abord ; sa figurine assise");
const t0 = await appeler(TOM);
ok(t0.etat?.proposee?.ambiance === "new-york" && t0.etat.proposee.pourquoi.startsWith("J’ai imaginé pour toi un loft à New York"), `Tom (rien de tel, l'air d'un ado) : 🗽 New York — « ${t0.etat?.proposee?.pourquoi} »`);
const z0 = await appeler(ZOE);
ok(z0.etat?.proposee?.ambiance === "cosy" && z0.etat.aFaire?.join() === "new-york,neon,pastel", `Zoé (une étagère de livres : pas de « tag » là-dedans) : 🛋️ cosy — « ${z0.etat?.proposee?.pourquoi} »`);
ok([l0, t0, z0].every((e) => !/exemple|t’ai imagin/i.test(e.etat?.proposee?.pourquoi ?? "")), "jamais « exemple », jamais d'accord au masculin ou au féminin");

// ─── fabriquer ───
const avant = (await toutIA()).length;
const f1 = await appeler(LEA, { action: "fabriquer" });
let ia = (await toutIA()).slice(avant);
ok(f1.statut === 200 && f1.fait === "neon" && ia.length === 1 && ia[0].startsWith("DESSIN ") && ia[0].includes("GAMER'S ROOM") && ia[0].includes("Reinterpret THE WORLD in this ambiance") && ia[0].includes("une console branchée sur un grand écran") && ia[0].includes("neon and LED light") && ia[0].includes("NO figurine"), "celle que Pablito propose d'abord : son monde réinterprété en néons, sa console gardée, sans figurine");
const neon = await sharp(await octets(`${LEA.id}/ambiances/neon.webp`)).metadata();
ok(neon.width === 1024 && neon.height === 1536 && neon.format === "webp" && /^http/.test(f1.etat?.images?.neon ?? "") && f1.etat.aFaire?.join() === "new-york,pastel", `rangée en hauteur (${neon.width} × ${neon.height}), signée ; restent New York et pastel`);
const f2 = await appeler(LEA, { action: "fabriquer", ambiance: "pastel" });
ia = (await toutIA()).slice(avant);
ok(f2.fait === "pastel" && ia.some((c) => c.includes("PASTEL ROOM") && c.includes("pastel colours")) && f2.etat?.aFaire?.join() === "new-york", "une demandée : pastel");
const f3 = await appeler(LEA, { action: "fabriquer", ambiance: "neon" });
ok(f3.statut === 200 && !f3.fait && (await toutIA()).length === avant + 2, "déjà faite : rien de plus");
const f4 = await appeler(LEA, { action: "fabriquer" });
ia = (await toutIA()).slice(avant);
ok(f4.fait === "new-york" && ia.some((c) => c.includes("LOFT IN NEW YORK") && c.includes("street style")) && f4.etat?.aFaire?.length === 0, "la dernière : le loft à New York ; tout est fait");
ok((await octets(`${LEA.id}/ambiances/verrou.json`)) === null, "aucun verrou ne reste");
const f5 = await appeler(LEA, { action: "fabriquer" });
ok(f5.statut === 200 && !f5.fait, "plus rien à faire");

// ─── refaire ───
const r1 = await appeler(LEA, { action: "refaire", ambiance: "neon" });
ok(r1.statut === 200 && !r1.etat?.images?.neon && r1.etat.aFaire?.join() === "neon" && (await octets(`${LEA.id}/ambiances/neon.webp`)) === null, "refaire les néons : effacée, à refaire");
ok((await appeler(LEA, { action: "refaire", ambiance: "cosy" })).statut === 400 && /^http/.test((await appeler(LEA)).etat?.images?.cosy ?? ""), "cosy (son décor) ne s'efface pas d'ici");

console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
