// 🎬 « REGARDER À DEUX » (`docs/univers/ma-maison.md`, section 24), PAR LA ROUTE — contre le faux Supabase et le faux
// YouTube (jamais la vraie base, jamais Google).
//
// Sam est chez Léa (proches des deux côtés) : il lui propose un lien YouTube (son titre vient de sa fiche), puis une
// vidéo de sa télé du jour, qui la remplace. Tom (pas son proche) ne le peut pas ; ni rien choisir, ni un lien qui n'est
// pas YouTube, ni une vidéo dont la fiche ne passe pas, ni une vidéo qui n'est pas à sa télé. Sa séance est
// prête (la vidéo, en pause au début) ; Léa est invitée (« 🎬 Sam veut regarder… »), et sa maison le dit (`regarder`).
// Léa arrive la première : Sam est prévenu, une fois. Sam lance la vidéo ; tant qu'ils ne l'ont pas regardée ensemble
// une vingtaine de secondes, rien. Puis : un souvenir commun, chez les deux, une seule fois — « Gardé avec Sam ·
// 🎬 Vu ensemble, le … » dans la maison de Léa ; le pouls le dit aux deux.
import { poserPiece } from "./piece-en-hauteur.mjs";
import sharp from "sharp";
import crypto from "node:crypto";

const F = "http://127.0.0.1:54321/rest/v1";
const FAUX = F.replace("/rest/v1", "");
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = `${FAUX}/storage/v1/object`;
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const qui8 = (h) => crypto.createHash("sha256").update(`clikme-talkie:qui:${h}`).digest("hex").slice(0, 8);
const lire = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.status === 200 ? await r.json().catch(() => ({})) : {};
};

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `5a5a5a5a-0000-4000-8000-0000005c20${String(n).padStart(2, "0")}`, jeton: `jeton-regarder-a-deux-route-${String(n).padStart(2, "0")}`, prenom });
const LEA = qui(1, "Léa");
const SAM = qui(2, "Sam");
const TOM = qui(3, "Tom");
const GENS = [LEA, SAM, TOM];
const maintenant = new Date().toISOString();
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
await semer("clik_ma_figurine", GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, accord_le: maintenant, prete_le: maintenant })));
const assise = await sharp({ create: { width: 400, height: 600, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="500"><rect y="200" width="300" height="300" rx="50" fill="#7a3e2a"/><circle cx="150" cy="130" r="110" fill="#f0c8a0"/></svg>`), left: 50, top: 80 }])
  .png()
  .toBuffer();
for (const x of GENS) {
  await deposer(`${x.id}/perso/v1/assise.png`, assise, "image/png");
  const fiche = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${x.id}/perso/v1/assise.png` } }, historique: [] };
  await json(`${x.id}/perso/v1/fiche.json`, fiche);
  await json(`${x.id}/perso/fiche.json`, fiche);
  await json(`${x.id}/majeur.json`, { age: 30, adulte: true, le: maintenant });
  await json(`${x.id}/ma-piece/piece.json`, { piece: "salon" });
  await json(`${x.id}/passions.json`, { passions: ["cuisine", "foot", "animaux"], poids: {}, le: maintenant });
}
// (Sam et Léa : proches, des deux côtés ; Tom ne l'est pas)
await json(`${LEA.id}/proches.json`, { ids: [SAM.id] });
await json(`${SAM.id}/proches.json`, { ids: [LEA.id] });
await poserPiece(deposer, "salon", { le: maintenant });
const nuit = await (await fetch(`${BASE}/api/cron/decouvrir-selection`)).json();
ok(nuit.faites?.length > 0, "la nuit est passée (la sélection du jour)");

// (Ma maison, derrière son interrupteur coupé ici : l'administrateur la voit)
const ADMIN = "00000000-0000-4000-8000-0000000ad001";
await semer("admins", [{ user_id: ADMIN }]);
const session = { access_token: "faux-admin", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "faux", user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} } };
const COOKIE_ADMIN = `sb-127-auth-token=base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
const appel = async (x, chemin, corps, aussi = "") => {
  const c = [x ? `clikme_habitant=${x.jeton}` : "", aussi].filter(Boolean).join("; ");
  const r = await fetch(`${BASE}${chemin}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie: c }, body: JSON.stringify(corps) } : { headers: { cookie: c } });
  return { statut: r.status, ...((await r.json().catch(() => ({}))) ?? {}) };
};
const SALONS = "/api/direct/salons-ouverts";
const regarder = (x, corps) => appel(x, "/api/direct/visites", { action: "regarder", ...corps });
const pouls = (x, salon) => appel(x, `${SALONS}?salon=${salon}&depuis=0&connus=`);
const cleDe = async (x) => (await appel(x, "/api/direct/proches")).cle;
const CLE_LEA = await cleDe(LEA);
const CLE_SAM = await cleDe(SAM);
ok(CLE_LEA && CLE_SAM, "les clés de Léa et de Sam");

// ═══ SAM PROPOSE ═══
const tele = (await appel(SAM, "/api/direct/tele-du-jour")).tele;
const V = tele?.videos?.[0];
ok(V?.id && V.titre, `la télé du jour de Sam (${tele?.videos?.length ?? 0} vidéos ; « ${V?.titre} »)`);
ok((await regarder(TOM, { cle: CLE_LEA, id: V.id })).statut === 403, "Tom (pas son proche) : « Regarder à deux, c'est entre proches »");
ok((await regarder(SAM, { cle: CLE_LEA })).statut === 400, "rien de choisi : « Choisis une vidéo »");
const pasYT = await regarder(SAM, { cle: CLE_LEA, lien: "https://vimeo.com/76979871" });
ok(pasYT.statut === 400 && /pas une vidéo YouTube/.test(pasYT.error ?? ""), "un lien qui n'est pas YouTube : refusé");
ok((await regarder(SAM, { cle: CLE_LEA, id: "zzzzzzzzzzz" })).statut === 404, "une vidéo qui n'est pas à sa télé : refusée");
ok((await regarder(SAM, { cle: CLE_SAM, id: V.id })).statut === 400, "chez soi : non");
const alcool = await regarder(SAM, { cle: CLE_LEA, lien: "https://youtu.be/Rg4kZ2pQ73x" });
ok(alcool.statut === 400 && /ne se regarde pas dans ClikMe/.test(alcool.error ?? ""), "un lien YouTube dont la fiche ne passe pas (des mots d'alcool) : refusé");
const parLien = await regarder(SAM, { cle: CLE_LEA, lien: "https://www.youtube.com/watch?v=Rg4kZ2pQ71x&t=42" });
ok(parLien.statut === 200 && parLien.titre === "Vidéo d’essai Rg4kZ2pQ71x", `un lien YouTube : son titre vient de sa fiche (« ${parLien.titre} »)`);
// (puis une vidéo de sa télé : elle remplace la première)
const p1 = await regarder(SAM, { cle: CLE_LEA, id: V.id });
ok(p1.statut === 200 && p1.titre === V.titre, `Sam propose « ${p1.titre} » à Léa`);

// sa séance, prête ; ce qu'elle attend
const SEANCE = `chez-${qui8(SAM.id)}`;
const dossier = `decouvrir/salons/prives/${SEANCE}`;
const t0 = await lire(`${dossier}/tele.json`);
ok(/^chez-/.test(SEANCE) && t0.video?.id === V.id && t0.pause === 0, `sa séance est prête : la vidéo, en pause au début (${SEANCE})`);
const e0 = await lire(`${dossier}/ensemble.json`);
ok(e0.de === SAM.id && e0.avec === LEA.id && e0.video?.id === V.id && !e0.fait, "… elle attend de la regarder avec Léa");

// chez Léa : l'invitation, et sa maison qui le dit
const acc = await appel(LEA, `${SALONS}?accueil=1`);
ok(acc.invitations?.length === 1 && acc.invitations[0].cle === CLE_SAM && acc.invitations[0].titre === V.titre, "Léa est invitée devant la télé de Sam, avec la vidéo");
const mL = (await appel(LEA, "/api/direct/ma-piece", null, COOKIE_ADMIN)).maison;
ok(mL?.regarder?.length === 1 && mL.regarder[0].cle === CLE_SAM && mL.regarder[0].prenom === "Sam" && mL.regarder[0].titre === V.titre, "🛎️ sa maison : « Sam te propose de regarder « … » ensemble »");

// ═══ ILS SE RETROUVENT ═══
const eL = await appel(LEA, SALONS, { action: "entrer-chez", chez: CLE_SAM });
ok(eL.statut === 200 && eL.ouverture?.tele?.seance?.video?.id === V.id && eL.ouverture.tele.seance.pause === 0, "Léa arrive la première : la vidéo de Sam, en pause");
ok((await lire(`${dossier}/ensemble.json`)).prevenu > 0, "… Sam est prévenu (« 🎬 Léa est devant ta télé »)");
const eS = await appel(SAM, SALONS, { action: "entrer-chez", chez: "moi" });
ok(eS.statut === 200 && eS.ouverture?.tele?.seance?.video?.id === V.id && eS.ouverture.presents.length === 2, "Sam arrive : sa télé garde la vidéo proposée ; ils sont deux");
ok(!(await pouls(LEA, SEANCE)).pouls?.souvenir && !(await pouls(SAM, SEANCE)).pouls?.souvenir, "en pause : pas encore de souvenir");
const j = await appel(SAM, SALONS, { action: "tele", salon: SEANCE, quoi: "jouer" });
ok(j.statut === 200 && j.seance?.pause === undefined, "Sam lance la vidéo");
ok(!(await pouls(SAM, SEANCE)).pouls?.souvenir, "… quelques secondes : pas encore");
// (vingt-cinq secondes plus tard)
const t1 = await lire(`${dossier}/tele.json`);
await json(`${dossier}/tele.json`, { ...t1, depart: Date.now() - 25_000 });
ok(!(await pouls(LEA, SEANCE)).pouls?.souvenir, "le pouls de Léa ne le pose pas (c'est celui de l'hôte)");
const ps = (await pouls(SAM, SEANCE)).pouls;
ok(ps?.souvenir === V.titre, `vingt-cinq secondes ensemble : « ✨ « ${ps?.souvenir} » : un souvenir commun »`);
ok((await pouls(LEA, SEANCE)).pouls?.souvenir === V.titre, "… Léa le voit aussi");
await pouls(SAM, SEANCE);

// ═══ LE SOUVENIR COMMUN, CHEZ LES DEUX ═══
const qSam = SEANCE.replace(/^chez-/, "");
const persoL = await lire(`${LEA.id}/etagere-perso.json`);
const persoS = await lire(`${SAM.id}/etagere-perso.json`);
const chezL = (persoL.objets ?? []).filter((o) => o.ensemble === SAM.id && o.message === `ensemble-${qSam}-${V.id}`);
const chezS = (persoS.objets ?? []).filter((o) => o.ensemble === LEA.id && /^ensemble-/.test(o.message));
ok(chezL.length === 1 && chezS.length === 1, `chez Léa et chez Sam, une fois chacun (${chezL.length}, ${chezS.length})`);
ok(chezL[0]?.emoji === "🎬" && chezL[0].titre === V.titre.slice(0, chezL[0].titre.length) && (chezL[0].image?.sorte === "video" || chezL[0].media?.sorte === "video"), "… une vidéo, avec son titre");
const mL2 = (await appel(LEA, "/api/direct/ma-piece", null, COOKIE_ADMIN)).maison;
const objets = JSON.stringify(mL2?.contenu ?? {});
const vu = [mL2?.contenu?.tele, ...(mL2?.contenu?.cadres ?? []), ...(mL2?.contenu?.etagere ?? [])].find((o) => o?.id === chezL[0]?.id);
ok(vu?.image?.src === `https://i.ytimg.com/vi/${V.id}/hqdefault.jpg`, "… sa vignette, lue chez YouTube par le téléphone (rien n'est recopié)");
ok(vu?.avec?.prenom === "Sam" && vu.avec.cle === CLE_SAM && /^🎬 Vu ensemble, le \d{1,2} \S+$/.test(vu.detail ?? ""), `dans la maison de Léa : « Gardé avec Sam · ${vu?.detail} »${vu?.avec?.prenom === "Sam" && vu.avec.cle === CLE_SAM ? "" : ` (${JSON.stringify(vu ?? null)} ; ${CLE_SAM})`}`);
ok(!objets.includes(SAM.id) && !objets.includes(LEA.id), "… aucun compte n'est montré");
const e1 = await lire(`${dossier}/ensemble.json`);
ok(e1.fait > 0, "la séance le retient (une seule fois)");

ok(!/exemple/i.test(JSON.stringify([p1, acc, mL, mL2])), "jamais le mot « exemple »");
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nRegarder à deux : tout est bon.");
process.exit(echecs ? 1 : 0);
