// 🗂️ LES FICHES DU CHANTIER « UNIVERS » (lot 1, le socle), PAR LES ROUTES — contre le faux Supabase, jamais la vraie
// base (`lib/direct/fiches-serveur.ts`, `app/api/direct/perso`, `app/api/admin/direct/fiches`).
//
// Léa a sa figurine d'aujourd'hui, fabriquée depuis ce lot : ses traits et la signature de ses deux images sont dans le
// dossier de sa fabrication. Sa fiche « version 0 » se lit sans rien écrire : elle la voit (ses images, ni chemins ni
// consignes) ; l'admin voit tout. Ses images sont REFAISABLES quand la consigne de leur signature est mot pour mot celle
// que la fiche redonne ; ses traits changent, elles ne le sont plus. Sam a une figurine d'avant ce lot (ni traits ni
// signature) ; Hugo n'en a pas. Puis Léa a une figurine du nouveau style (version 1, rangée) : l'admin revient à sa
// version 0 (une version 2, recopiée, sans rien refaire), puis à la 1 (une version 3, les mêmes images). Une fiche qui
// désigne les images d'un autre n'est pas crue. Son univers, de même. Personne d'autre que l'admin n'entre côté admin.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-fiches-route.mjs          (sur un faux Supabase tout neuf)
const F = "http://127.0.0.1:54321/rest/v1";
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lire = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.status === 200 ? r.json() : null;
};

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const LEA = { id: "abababab-0000-4000-8000-000000000401", jeton: "jeton-lea-fiches-000000000001", prenom: "Léa" };
const SAM = { id: "abababab-0000-4000-8000-000000000402", jeton: "jeton-sam-fiches-000000000001", prenom: "Sam" };
const HUGO = { id: "abababab-0000-4000-8000-000000000403", jeton: "jeton-hugo-fiches-00000000001", prenom: "Hugo" };
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
const maintenant = new Date().toISOString();

await semer("admins", [{ user_id: ADMIN }]);
await semer("human_habitants", [LEA, SAM, HUGO].map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
const FAB_LEA = `${LEA.id}/fab-aaaaaaaaaaaa`;
const FAB_SAM = `${SAM.id}/fab-bbbbbbbbbbbb`;
await semer("clik_ma_figurine", [
  { habitant_id: LEA.id, prenom: "Léa", photo: `${LEA.id}/photo.jpg`, accord_le: maintenant, neutre: `${FAB_LEA}/fig-n.webp`, parle: `${FAB_LEA}/fig-p.webp`, prete_le: maintenant },
  { habitant_id: SAM.id, prenom: "Sam", photo: null, accord_le: maintenant, neutre: `${FAB_SAM}/fig-n.webp`, parle: `${FAB_SAM}/fig-p.webp`, prete_le: maintenant },
]);
for (const c of [`${FAB_LEA}/fig-n.webp`, `${FAB_LEA}/fig-p.webp`, `${FAB_SAM}/fig-n.webp`, `${FAB_SAM}/fig-p.webp`, `${LEA.id}/photo.jpg`]) await deposer(c, Buffer.alloc(64, 7), "image/webp");
// (ce que la fabrication range désormais à côté de ses images : ses traits, et la signature de chacune)
const TRAITS = { cheveux: "gris poivre et sel, épais", barbe: "aucune", yeux: "bruns", lunettes: false, portrait: "A woman in her fifties with thick salt-and-pepper hair." };
await json(`${FAB_LEA}/traits.json`, TRAITS);
await json(`${LEA.id}/univers.json`, { univers: "artisan" });
const sig = (consigne, entrees) => ({ moteur: "gpt-image-essai", consigne, entrees, le: maintenant, qualite: "high", fidelite: "high", fond: "opaque", dureeS: 41, empreinte: "0123456789abcdef" });
await json(`${FAB_LEA}/fig-n.signature.json`, sig("une consigne d'avant", ["photo"]));
await json(`${FAB_LEA}/fig-p.signature.json`, sig("une autre consigne d'avant", ["fig-n.webp"]));

const perso = (qui) => fetch(`${BASE}/api/direct/perso`, { headers: qui ? { cookie: `clikme_habitant=${qui.jeton}` } : {} }).then(async (r) => ({ statut: r.status, ...(await r.json().catch(() => ({}))) }));
const admin = (h, cookie = COOKIE_ADMIN) => fetch(`${BASE}/api/admin/direct/fiches?h=${h}`, { headers: { cookie } }).then(async (r) => ({ statut: r.status, ...(await r.json().catch(() => ({}))) }));
const revenir = (corps, cookie = COOKIE_ADMIN) =>
  fetch(`${BASE}/api/admin/direct/fiches`, { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify(corps) }).then(async (r) => ({ statut: r.status, ...(await r.json().catch(() => ({}))) }));

// ═══ CE QU'IL VOIT DE SA FICHE ═══
ok((await perso(null)).statut === 403, "sans compte : rien");
ok((await perso(HUGO)).fiche === null, "Hugo n'a pas de figurine : pas de fiche");
const l0 = await perso(LEA);
ok(l0.origine === "aujourd-hui" && l0.fiche?.version === 0 && l0.fiche.style === "ressort-1" && l0.fiche.validee_le, `Léa : sa figurine d'aujourd'hui, la version 0 (${l0.origine}, v${l0.fiche?.version})`);
ok(/^http/.test(l0.fiche?.images?.neutre ?? "") && /^http/.test(l0.fiche?.images?.parle ?? "") && l0.fiche.complete === true, "ses deux images, en adresses signées");
// (hors de ses adresses signées, qui portent forcément le chemin de leur image)
const vu = JSON.stringify({ ...l0, fiche: { ...l0.fiche, images: null } });
ok(!vu.includes("fab-aaaaaaaaaaaa") && !vu.includes("consigne") && !vu.includes("photo.jpg") && !vu.includes("gris poivre") && !vu.includes("signature"), "ni chemins, ni consignes, ni son selfie, ni ses traits dans ce qu'il voit");
ok((await lire(`${LEA.id}/perso/fiche.json`)) === null, "rien n'est écrit pour sa version 0");

// ═══ L'ADMIN VOIT TOUT ═══
ok((await admin(LEA.id, `clikme_habitant=${LEA.jeton}`)).statut === 403 && (await revenir({ action: "revenir", h: LEA.id, genre: "perso", version: 0 }, `clikme_habitant=${LEA.jeton}`)).statut === 403, "côté admin : un habitant n'entre pas");
ok((await admin("pas-un-habitant")).statut === 400, "un habitant qui n'en est pas un : refusé");
const a0 = await admin(LEA.id);
const f0 = a0.perso?.fiche;
ok(f0?.traits?.cheveux === TRAITS.cheveux && f0.habit === "artisan" && f0.photo?.chemin === `${LEA.id}/photo.jpg`, "ses traits gardés, son habit, son selfie");
ok(
  f0?.references?.neutre?.signature?.entrees?.join() === `${LEA.id}/photo.jpg` && f0.references.parle.signature.entrees.join() === `${FAB_LEA}/fig-n.webp` && f0.references.neutre.signature.moteur === "gpt-image-essai",
  "la signature de chaque image : le moteur, et ce qu'on lui a donné (son selfie ; sa figurine bouche fermée)",
);
ok(f0?.visages?.dossier?.startsWith(`${LEA.id}/expr-`) && f0.historique?.[0]?.version === 0, "le dossier de ses visages, son historique");
const attendue = a0.perso?.attendues?.neutre ?? "";
ok(a0.perso?.refaisables?.neutre === false && attendue.includes(TRAITS.cheveux) && attendue.includes("artisan"), "une consigne d'avant : pas refaisable ; celle que la fiche redonne porte ses traits et son habit");
await json(`${FAB_LEA}/fig-n.signature.json`, sig(attendue, ["photo"]));
await json(`${FAB_LEA}/fig-p.signature.json`, sig(a0.perso.attendues.parle, ["fig-n.webp"]));
const a1 = await admin(LEA.id);
ok(a1.perso?.refaisables?.neutre === true && a1.perso.refaisables.parle === true, "la consigne de la signature, mot pour mot celle de la fiche : refaisables");
await json(`${FAB_LEA}/traits.json`, { ...TRAITS, cheveux: "blonds, courts" });
ok((await admin(LEA.id)).perso?.refaisables?.neutre === false, "ses traits changent : sa figurine ne se refait plus à l'identique");
await json(`${FAB_LEA}/traits.json`, TRAITS);
const s0 = await admin(SAM.id);
ok(s0.perso?.fiche?.version === 0 && !s0.perso.fiche.traits && !s0.perso.fiche.photo && Object.values(s0.perso.refaisables).every((x) => x === false), "Sam, une figurine d'avant ce lot : sa fiche, sans traits ni signatures");

// ═══ LE NOUVEAU STYLE, SES VERSIONS ═══
const V1 = `${LEA.id}/perso/v1`;
for (const n of ["assise", "assise-p", "debout"]) await deposer(`${V1}/${n}.png`, Buffer.alloc(64, 9), "image/png");
const fiche1 = {
  version: 1,
  style: "collection-1",
  creee_le: maintenant,
  validee_le: maintenant,
  traits: TRAITS,
  habit: "artisan",
  fauteuil: { description: "a small cosy armchair", couleurs: ["#c9a27e"], de: "depart" },
  references: {
    assise: { chemin: `${V1}/assise.png`, signature: sig("la consigne sculptée", [`${LEA.id}/photo.jpg`]) },
    assise_parle: { chemin: `${V1}/assise-p.png` },
    debout: { chemin: `${V1}/debout.png` },
  },
  historique: [
    { version: 0, le: maintenant, raison: "sa figurine d'avant « Univers »", style: "ressort-1" },
    { version: 1, le: maintenant, raison: "sa figurine du nouveau style", style: "collection-1" },
  ],
};
await json(`${V1}/fiche.json`, fiche1);
await json(`${LEA.id}/perso/fiche.json`, fiche1);
const l1 = await perso(LEA);
ok(l1.origine === "rangee" && l1.fiche?.version === 1 && l1.fiche.style === "collection-1" && l1.fiche.complete === true && Object.keys(l1.fiche.images).sort().join() === "assise,assise_parle,debout", "sa figurine du nouveau style : la version 1, ses trois images");
const r2 = await revenir({ action: "revenir", h: LEA.id, genre: "perso", version: 0 });
ok(r2.fiche?.version === 2 && r2.fiche.style === "ressort-1" && r2.fiche.references.neutre.chemin === `${FAB_LEA}/fig-n.webp`, `retour à la version 0 : une version 2, ses images d'avant, rien refait (v${r2.fiche?.version})`);
ok(r2.fiche?.historique?.map((e) => e.version).join() === "0,1,2" && r2.fiche.historique[2].raison === "retour à la version 0", "son historique : 0, 1, 2 — « retour à la version 0 »");
ok((await lire(`${LEA.id}/perso/v2/fiche.json`))?.version === 2 && (await lire(`${LEA.id}/perso/fiche.json`))?.version === 2 && (await lire(`${V1}/fiche.json`))?.version === 1, "la version 2 rangée, la 1 gardée telle quelle");
ok((await perso(LEA)).fiche?.version === 2, "il voit la version 2");
ok((await revenir({ action: "revenir", h: LEA.id, genre: "perso", version: 2 })).statut === 400 && (await revenir({ action: "revenir", h: LEA.id, genre: "perso", version: 7 })).statut === 404, "déjà la version en cours, ou une version qui n'existe pas : refusé");
const r3 = await revenir({ action: "revenir", h: LEA.id, genre: "perso", version: 1 });
ok(r3.fiche?.version === 3 && r3.fiche.style === "collection-1" && r3.fiche.references.assise.chemin === `${V1}/assise.png` && r3.fiche.validee_le === maintenant, "retour à la version 1 : une version 3, les mêmes images, toujours validée");

// ═══ UNE FICHE QUI DÉSIGNE LES IMAGES D'UN AUTRE N'EST PAS CRUE ═══
await json(`${SAM.id}/perso/fiche.json`, { ...fiche1, references: { assise: { chemin: `${V1}/assise.png` } } });
const s1 = await perso(SAM);
ok(s1.origine === "aujourd-hui" && s1.fiche?.version === 0, "Sam : une fiche qui montre l'image de Léa est ignorée (sa version 0 à lui)");

// ═══ SON UNIVERS ═══
ok((await admin(LEA.id)).monde === null, "pas encore d'univers");
const monde = (v) => ({
  version: v,
  style: "film-chaleureux-1",
  creee_le: maintenant,
  proposition: "Un atelier ouvert sur la mer.",
  ambiance: { lumiere: "dorée", palette: ["#e8b06a"] },
  elements: [{ id: "etabli", quoi: "un établi", pourquoi: "je bricole tous les dimanches", source: "dit" }],
  scene: { sol: 0.78, places: [{ id: "hote", x: 0.36, y: 0.8, echelle: 1 }], lumiere: { vient_de: "gauche", couleur: "#ffd9a0" } },
  references: { decor: { chemin: `${LEA.id}/monde/v${v}/decor.webp` } },
  souvenirs: [],
  historique: [{ version: v, le: maintenant, raison: "sa création", style: "film-chaleureux-1" }],
});
await json(`${LEA.id}/monde/v1/fiche.json`, monde(1));
await json(`${LEA.id}/monde/v2/fiche.json`, monde(2));
await json(`${LEA.id}/monde/fiche.json`, monde(2));
const am = await admin(LEA.id);
ok(am.monde?.fiche?.version === 2 && am.monde.fiche.visibilite === "proches" && am.monde.fiche.elements[0].source === "dit", "son univers : la version 2, « mes proches » par défaut");
const rm = await revenir({ action: "revenir", h: LEA.id, genre: "monde", version: 1 });
ok(rm.fiche?.version === 3 && rm.fiche.references.decor.chemin === `${LEA.id}/monde/v1/decor.webp`, "retour à son décor d'avant : une version 3, le décor de la 1");
ok((await revenir({ action: "revenir", h: LEA.id, genre: "monde", version: 0 })).statut === 404, "un univers n'a pas de version 0");

console.log(echecs ? `\n${echecs} échec(s)` : "\nles fiches tiennent ✓");
process.exit(echecs ? 1 : 0);
