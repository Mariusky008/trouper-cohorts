// 🔀 LA BASCULE « UNIVERS POUR TOUS », PAR LES ROUTES — contre le faux Supabase et son faux moteur d'image, jamais la
// vraie base, jamais OpenAI (`lib/direct/univers-pour-tous.ts`, `lib/direct/pont-univers-serveur.ts`).
//
// L'interrupteur se juge des deux côtés, dans la même base :
//   · ÉTEINT (l'app de la CI, :3821) : le chantier reste au propriétaire ; l'appli d'aujourd'hui ne voit pas la figurine
//     du nouveau style de Léa (pas de pont) ;
//   · ALLUMÉ (une seconde app, lancée ici sur :3822 avec `CLIKME_UNIVERS_POUR_TOUS=1`) : Léa entre sans être
//     administratrice ; en ouvrant l'appli, sa figurine du nouveau style devient la sienne (`neutre` = son image assise,
//     `parle` = sa bouche ouverte) ; ses visages se font au nouveau style, dans le même dossier ; Hugo, qui avait sa
//     figurine d'aujourd'hui et vient de valider la nouvelle, la voit remplacée (son prénom gardé) ; Sam, sans figurine
//     du nouveau style, ne change pas — l'appli l'invite à la refaire, et il peut reprendre sa photo d'avant.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI ; ce script lance lui-même la seconde)
//   node scripts/essai-bascule-route.mjs          (sur un faux Supabase tout neuf)
import { createHash } from "node:crypto";
import { lancerSecondeApp } from "./seconde-app.mjs";

const F = "http://127.0.0.1:54321/rest/v1";
const FAUX = F.replace("/rest/v1", "");
const ETEINT = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const ligne = async (h) => (await (await fetch(`${F}/clik_ma_figurine?habitant_id=eq.${h}`)).json())[0] ?? null;
const ia = async () => (await (await fetch(`${FAUX}/__ia`)).json()).filter((c) => typeof c === "string" && c.startsWith("IMAGE "));
const dossierExpressions = (h, neutre) => `${h}/expr-${createHash("sha1").update(neutre).digest("hex").slice(0, 16)}`;

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

// ─── la seconde app : l'interrupteur allumé ───
const { base: ALLUME, arreter } = await lancerSecondeApp();

// ─── Léa (sa figurine du nouveau style seulement), Hugo (celle d'aujourd'hui, puis la nouvelle), Sam (celle d'aujourd'hui) ───
const LEA = { id: "abababab-0000-4000-8000-000000000901", jeton: "jeton-lea-bascule-00000000001" };
const HUGO = { id: "abababab-0000-4000-8000-000000000902", jeton: "jeton-hugo-bascule-0000000001" };
const SAM = { id: "abababab-0000-4000-8000-000000000903", jeton: "jeton-sam-bascule-00000000001" };
await semer("human_habitants", [
  { id: LEA.id, device_token: LEA.jeton, prenom: "Léa", ville_slug: "dax" },
  { id: HUGO.id, device_token: HUGO.jeton, prenom: "Hugo", ville_slug: "dax" },
  { id: SAM.id, device_token: SAM.jeton, prenom: "Sam", ville_slug: "dax" },
]);
const maintenant = new Date().toISOString();
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const nouvelleFigurine = async (h) => {
  const P1 = `${h}/perso/v1`;
  for (const n of ["assise", "assise_parle", "debout"]) await deposer(`${P1}/${n}.png`, PNG, "image/png");
  const perso = {
    version: 1,
    style: "collection-1",
    creee_le: maintenant,
    validee_le: maintenant,
    references: { assise: { chemin: `${P1}/assise.png` }, assise_parle: { chemin: `${P1}/assise_parle.png` }, debout: { chemin: `${P1}/debout.png` } },
    photo: { chemin: `${h}/perso/selfie-essai.jpg`, accord_le: maintenant },
    historique: [{ version: 1, le: maintenant, raison: "« C’est moi ! »", style: "collection-1" }],
  };
  await json(`${P1}/fiche.json`, perso);
  await json(`${h}/perso/fiche.json`, perso);
  return P1;
};
const PL = await nouvelleFigurine(LEA.id);
const PH = await nouvelleFigurine(HUGO.id);
for (const [x, prenom] of [
  [HUGO, "Hugo le bricoleur"],
  [SAM, "Sam"],
]) {
  for (const n of ["n", "p"]) await deposer(`${x.id}/figurine-${n}.webp`, PNG, "image/webp");
  await semer("clik_ma_figurine", [{ habitant_id: x.id, prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, demande_le: maintenant, neutre: `${x.id}/figurine-n.webp`, parle: `${x.id}/figurine-p.webp`, prete_le: maintenant }]);
}

const appeler = async (base, qui, chemin, corps) => {
  const r = await fetch(`${base}${chemin}`, {
    ...(corps ? { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${qui.jeton}` }, body: JSON.stringify(corps) } : { headers: { cookie: `clikme_habitant=${qui.jeton}` } }),
    redirect: "manual",
  });
  return { statut: r.status, lieu: r.headers.get("location") ?? "", ...(await r.json().catch(() => ({}))) };
};

// ═══ ÉTEINT : rien ne change ═══
ok((await appeler(ETEINT, LEA, "/api/direct/univers")).statut === 403 && (await appeler(ETEINT, LEA, "/api/direct/nouvelle-figurine")).statut === 403, "éteint : le chantier reste réservé au propriétaire");
ok((await appeler(ETEINT, LEA, "/univers")).statut === 307, "éteint : « Mon univers » ramène à l'admin qui n'en est pas");
const e0 = await appeler(ETEINT, LEA, "/api/direct/ma-figurine");
ok(e0.etat?.etape === "photo" && (await ligne(LEA.id)) === null, "éteint : l'appli d'aujourd'hui ignore sa figurine du nouveau style (pas de pont)");
const h0 = await appeler(ETEINT, HUGO, "/api/direct/ma-figurine");
ok(h0.etat?.etape === "prete" && (await ligne(HUGO.id))?.neutre === `${HUGO.id}/figurine-n.webp`, "éteint : Hugo garde sa figurine d'aujourd'hui");

// ═══ ALLUMÉ : chacun entre, et sa figurine du nouveau style devient la sienne ═══
const u = await appeler(ALLUME, LEA, "/api/direct/univers");
ok(u.statut === 200 && u.etape && (await appeler(ALLUME, LEA, "/api/direct/nouvelle-figurine")).statut === 200 && (await appeler(ALLUME, LEA, "/api/direct/conversation-univers")).statut !== 403, `allumé : Léa entre dans le chantier sans être administratrice (${u.etape})`);
ok((await appeler(ALLUME, LEA, "/univers")).statut === 200 && (await appeler(ALLUME, LEA, "/univers/figurine")).statut === 200, "allumé : « Mon univers » et « Ta figurine » s'ouvrent");
const e1 = await appeler(ALLUME, LEA, "/api/direct/ma-figurine");
const l1 = await ligne(LEA.id);
ok(
  e1.etat?.etape === "prete" && l1?.neutre === `${PL}/assise.png` && l1.parle === `${PL}/assise_parle.png` && Boolean(l1.prete_le) && l1.prenom === "Léa" && l1.photo === `${LEA.id}/perso/selfie-essai.jpg`,
  `🌉 le pont : en ouvrant l'appli, sa figurine du nouveau style devient la sienne (${l1?.neutre})`,
);
ok(decodeURIComponent(e1.etat?.neutre ?? "").includes("/perso/v1/assise.png") && decodeURIComponent(e1.etat?.parle ?? "").includes("/perso/v1/assise_parle.png"), "l'appli la montre, assise, et la fait parler");
const avantIa = (await ia()).length;
const v = await appeler(ALLUME, LEA, "/api/direct/ma-figurine", { action: "expressions", veut: "colere" });
const faites = (await ia()).slice(avantIa);
ok(v.statut === 200 && faites.length > 0 && faites.every((c) => c.includes("seated in its armchair")), `🎭 ses visages : au nouveau style, sur sa figurine assise (${faites.length} image(s), jamais l'ancienne consigne)`);
const fichiers = await (await fetch(`${STOCK}/list/figurines-clients`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prefix: dossierExpressions(LEA.id, `${PL}/assise.png`), limit: 100 }) })).json().catch(() => []);
ok(Array.isArray(fichiers) && fichiers.some((f) => f.name === "colere-n.webp"), "rangés dans le dossier de sa figurine assise — celui que lit l'appli");
const e2 = await appeler(ALLUME, LEA, "/api/direct/ma-figurine");
ok((await ligne(LEA.id))?.updated_at === l1?.updated_at && e2.etat?.etape === "prete", "le pont n'est posé qu'une fois (rien ne change à la visite suivante)");

const h1 = await appeler(ALLUME, HUGO, "/api/direct/ma-figurine");
const lh = await ligne(HUGO.id);
ok(h1.etat?.etape === "prete" && lh?.neutre === `${PH}/assise.png` && lh.parle === `${PH}/assise_parle.png` && lh.prenom === "Hugo le bricoleur" && lh.photo === `${HUGO.id}/photo.jpg`, "Hugo : sa figurine d'aujourd'hui remplacée par la nouvelle (son prénom et sa photo gardés)");
const s1 = await appeler(ALLUME, SAM, "/api/direct/ma-figurine");
ok(s1.etat?.etape === "prete" && (await ligne(SAM.id))?.neutre === `${SAM.id}/figurine-n.webp`, "Sam, sans figurine du nouveau style : rien ne change");
const avantSam = (await ia()).length;
await appeler(ALLUME, SAM, "/api/direct/ma-figurine", { action: "expressions", veut: "colere" });
ok((await ia()).slice(avantSam).every((c) => !c.includes("seated in its armchair")), "ses visages à lui restent ceux d'aujourd'hui");

// ═══ ÉTAPE 2 : l'appli sait que sa figurine se fait au nouveau style ; la photo d'avant ═══
ok(!e0.etat?.bascule && !h0.etat?.bascule, "éteint : l'appli ne parle pas du nouveau style");
ok(e1.etat?.bascule?.nouveauStyle === true && s1.etat?.bascule?.nouveauStyle === false, "allumé : Léa est au nouveau style, Sam pas encore (l'invitation à la refaire)");
ok((await appeler(ALLUME, { jeton: "inconnu-0000000000000000000" }, "/api/direct/ma-figurine")).etat?.bascule?.nouveauStyle === false, "allumé, sans compte : sa figurine se crée au nouveau style");
await deposer(`${SAM.id}/photo.jpg`, PNG, "image/png");
const ns = await appeler(ALLUME, SAM, "/api/direct/nouvelle-figurine");
ok(ns.etape === "selfie" && decodeURIComponent(ns.photoDAvant ?? "").includes(`${SAM.id}/photo.jpg`), "🖼️ Sam peut reprendre sa photo d'avant");
ok((await appeler(ALLUME, SAM, "/api/direct/nouvelle-figurine", { action: "selfie", photo: "avant", moi: true, age: false })).statut === 400, "sa photo d'avant : « 15 ans ou plus » toujours à cocher");
const sf = await appeler(ALLUME, SAM, "/api/direct/nouvelle-figurine", { action: "selfie", photo: "avant", moi: true, age: true });
ok(sf.statut === 200 && Boolean(sf.id), `sa figurine du nouveau style se sculpte d'après sa photo d'avant (${sf.id})`);

arreter();
console.log(echecs ? `\n${echecs} échec(s)` : "\nla bascule tient ✓");
process.exit(echecs ? 1 : 0);
