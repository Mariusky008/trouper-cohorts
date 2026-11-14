// 📚 L'ÉTAGÈRE, LOT E4 « MON ÉTAGÈRE », PAR LES ROUTES — contre le faux Supabase, jamais la vraie base
// (`lib/direct/etagere.ts`, `etagere-serveur.ts`, `/api/direct/etagere`, `/api/direct/visites`).
//
// Sam a deux étagères, posées d'avance : avec Léa (« Tes pivoines », qui le concernent ; le resto promis, à eux deux ;
// le permis de Léa) et avec Inès (son marathon). « MON ÉTAGÈRE » : chez Sam, ses pivoines et le resto (noté avec Léa),
// son marathon (avec Inès) — pas le permis de Léa, qui est chez elle. DÉPOSER : sur la sienne, « Mon concert »,
// aujourd'hui, montré à ses visiteurs (le rappel du matin : « Aujourd'hui : ton concert 🎤… ») ; sur la leur, pour
// Léa, « Ton anniversaire » tapé avec son année de naissance (sa prochaine fois ; « Ton anniversaire » chez elle,
// « L'anniversaire de Léa » chez lui ; il s'envolera chez elle, pas chez lui). MONTRER : ses pivoines oui, le resto
// (à eux deux) non ; Léa, en visite chez Sam, voit son concert et ses pivoines — ni la phrase, ni avec qui. CACHER :
// le marathon n'est plus chez lui, il reste sur leur étagère. LES GARDE-FOUS : un sujet sensible, un jour passé, deux
// fois la même chose, douze par jour.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-etagere-mienne-route.mjs
import crypto from "node:crypto";

const F = "http://127.0.0.1:54321/rest/v1";
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lire = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.status === 200 ? r.json().catch(() => null) : null;
};
const cleProfil = (h) => crypto.createHash("sha256").update(`clikme-profil:${h}`).digest("hex").slice(0, 16);
const qui8 = (h) => crypto.createHash("sha256").update(`clikme-talkie:qui:${h}`).digest("hex").slice(0, 8);
const paire = (a, b) => [a.id, b.id].sort().join("_");

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const qui = (n, prenom) => ({ id: `e7a6e7a6-0000-4000-8000-0000000e70${String(n).padStart(2, "0")}`, jeton: `jeton-etagere-e4-route-00${String(n).padStart(2, "0")}`, prenom });
const SAM = qui(1, "Sam");
const LEA = qui(2, "Léa");
const INES = qui(3, "Inès");
const GENS = [SAM, LEA, INES];
for (const x of GENS) x.cle = cleProfil(x.id);
const maintenant = new Date().toISOString();
await semer("human_habitants", GENS.map((x) => ({ id: x.id, device_token: x.jeton, prenom: x.prenom, ville_slug: "dax" })));
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
for (const x of GENS) {
  await deposer(`${x.id}/neutre-essai.png`, PNG, "image/png");
  await json(`profils/${x.cle}.json`, { h: x.id });
}
await semer(
  "clik_ma_figurine",
  GENS.map((x) => ({ habitant_id: x.id, prenom: x.prenom, photo: `${x.id}/photo.jpg`, accord_le: maintenant, neutre: `${x.id}/neutre-essai.png`, parle: `${x.id}/neutre-essai.png`, prete_le: maintenant })),
);
await json(`${SAM.id}/proches.json`, { ids: [LEA.id, INES.id] });
for (const x of [LEA, INES]) await json(`${x.id}/proches.json`, { ids: [SAM.id] });

// ─── Sam : sa figurine assise, son univers (ouvert à ses proches) ───
const P1 = `${SAM.id}/perso/v1`;
for (const n of ["assise", "assise_parle"]) await deposer(`${P1}/${n}.png`, PNG, "image/png");
const perso = { version: 1, style: "collection-1", creee_le: maintenant, validee_le: maintenant, references: { assise: { chemin: `${P1}/assise.png` }, assise_parle: { chemin: `${P1}/assise_parle.png` } }, historique: [{ version: 1, le: maintenant, raison: "« C’est moi ! »", style: "collection-1" }] };
await json(`${P1}/fiche.json`, perso);
await json(`${SAM.id}/perso/fiche.json`, perso);
const M1 = `${SAM.id}/monde/v1`;
await deposer(`${M1}/decor.png`, PNG, "image/png");
const monde = {
  version: 1,
  style: "film-chaleureux-1",
  creee_le: maintenant,
  validee_le: maintenant,
  proposition: "Je t'imagine dans un atelier ouvert sur la mer.",
  ambiance: { lumiere: "fin d'après-midi dorée", palette: ["#e8b06a", "#2f5d73", "#f3ead9"] },
  elements: [],
  regles: [],
  inconnus: [],
  scene: { sol: 0.8, places: [{ id: "hote", x: 0.32, y: 0.84, echelle: 1 }, { id: "invite", x: 0.7, y: 0.86, echelle: 1 }], lumiere: { vient_de: "gauche", couleur: "#ffd9a0" } },
  references: { decor: { chemin: `${M1}/decor.png` } },
  visibilite: "proches",
  souvenirs: [],
  historique: [{ version: 1, le: maintenant, raison: "sa conversation avec Pablito", style: "film-chaleureux-1" }],
};
await json(`${M1}/fiche.json`, monde);
await json(`${SAM.id}/monde/fiche.json`, monde);

// ═══ LES ÉTAGÈRES, POSÉES D'AVANCE ═══
const jour = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
const dansJours = (n) => new Date(Date.parse(`${jour}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const ilYa = (j) => new Date(Date.now() - j * 86_400_000).toISOString();
const objet = (id, de, concerne, x) => ({ id, genre: "gout", emoji: "💐", titre: "Les pivoines", concerne, citation: "J'adore les pivoines", de8: qui8(de.id), message: `msg${id}`.padEnd(12, "0").slice(0, 12), le: ilYa(4), etat: "actif", ...x });
const etagere = (a, b, objets) => json(`fils/${paire(a, b)}/etagere.json`, { v: 1, objets, lu: Date.now() - 3_600_000, verrou: 0, vus: { [qui8(a.id)]: objets.map((o) => o.id), [qui8(b.id)]: objets.map((o) => o.id) } });
await etagere(SAM, LEA, [
  objet("pivoines", LEA, qui8(SAM.id), { nuance: "aime", titreToi: "Tes pivoines", citation: "Toi qui adores les pivoines" }),
  objet("resto", SAM, "deux", { genre: "promesse", emoji: "🍝", titre: "Le resto italien", citation: "Faut qu'on se fasse ce resto italien !" }),
  objet("permis", LEA, qui8(LEA.id), { genre: "date", sorte: "epreuve", emoji: "🚗", titre: "Le permis", titreToi: "Ton permis", quand: dansJours(5), citation: "Je passe le permis" }),
]);
await etagere(SAM, INES, [objet("marathon", INES, qui8(SAM.id), { genre: "date", sorte: "evenement", emoji: "🏃", titre: "Le marathon", titreToi: "Ton marathon", quand: dansJours(10), citation: "Ton marathon, c'est bientôt" })]);

const voir = async (q, chemin) => {
  const r = await fetch(`${BASE}/api/direct/${chemin}`, { headers: q ? { cookie: `clikme_habitant=${q.jeton}` } : {} });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const agir = async (q, corps) => {
  const r = await fetch(`${BASE}/api/direct/etagere`, { method: "POST", headers: { "content-type": "application/json", cookie: `clikme_habitant=${q.jeton}` }, body: JSON.stringify(corps) });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const mienne = async (q) => (await voir(q, "etagere?moi=1")).etagere;

// ═══ 🏡 MON ÉTAGÈRE ═══
ok((await voir(null, "etagere?moi=1")).statut === 401, "sans figurine : 401");
const m0 = await mienne(SAM);
const trouve = (m, id) => m?.objets?.find((o) => o.id === id);
ok(trouve(m0, "pivoines")?.titre === "Tes pivoines" && trouve(m0, "pivoines").avec?.prenom === "Léa" && trouve(m0, "pivoines").avec.cle === LEA.cle && trouve(m0, "pivoines").peutMontrer === true && !trouve(m0, "pivoines").montre, "chez Sam : « Tes pivoines », noté avec Léa (sa clé), qu'il peut montrer");
ok(trouve(m0, "resto")?.avec?.prenom === "Léa" && trouve(m0, "resto").peutMontrer === false && trouve(m0, "marathon")?.avec?.prenom === "Inès" && !trouve(m0, "permis"), "le resto (à eux deux : il ne peut pas le montrer), son marathon (avec Inès) ; pas le permis de Léa");
ok(m0?.univers === true && m0.cle === SAM.cle && m0.montres === 0 && /^http/.test(m0.image) && !JSON.stringify(m0).includes(LEA.id), "son univers existe (sa clé, pour se voir comme ses visiteurs), rien de montré, sa figurine ; jamais un identifiant");
const ml = await mienne(LEA);
ok(trouve(ml, "permis")?.titre === "Ton permis" && trouve(ml, "resto") && !trouve(ml, "pivoines") && !trouve(ml, "marathon") && ml.univers === false, "chez Léa : son permis, le resto ; pas les pivoines de Sam ; pas encore d'univers");

// ═══ ✋ DÉPOSER, SUR LA SIENNE ═══
const c1 = await agir(SAM, { action: "deposer", genre: "date", sorte: "evenement", titre: "Mon concert", emoji: "🎤", quand: jour, montre: true });
ok(c1.statut === 200 && /^[0-9a-f]{12}$/.test(c1.id ?? ""), `Sam dépose « Mon concert », aujourd'hui, montré à ses visiteurs (${c1.statut} ${c1.error ?? ""})`);
const m1 = await mienne(SAM);
const concert = trouve(m1, c1.id);
ok(concert?.titre === "Ton concert" && concert.depose === true && !concert.avec && concert.montre === true && concert.peutMontrer && concert.de === "moi" && concert.citation === "" && m1.montres === 1, "sur sa page : « Ton concert », déposé par lui, sur la sienne, montré (1)");
const fp = await lire(`${SAM.id}/etagere-perso.json`);
ok(fp?.objets?.[0]?.titre === "Le concert" && fp.objets[0].titreToi === "Ton concert" && fp.objets[0].message === `depot-${c1.id}` && fp.montres?.join() === c1.id && fp.depots?.n === 1, "gardé dans son dossier : « Le concert » (« Ton concert » pour lui), montré, un dépôt aujourd'hui");
const rs = (await voir(SAM, "etagere?rappels=1")).rappels ?? [];
ok(rs.length === 1 && rs[0].cas === "mien" && rs[0].texte === "Aujourd’hui : ton concert 🎤 Tu l’avais posé sur ton étagère 📌" && rs[0].fait === false && rs[0].cle === "", `☀️ le matin, sa figurine le lui rappelle : « ${rs[0]?.texte} »`);

// ═══ ✋ DÉPOSER, SUR LA LEUR (POUR LÉA) ═══
const a1 = await agir(SAM, { action: "deposer", avec: LEA.cle, pour: "lui", genre: "date", sorte: "fete", titre: "Ton anniversaire", emoji: "🎂", quand: "1995-12-02" });
ok(a1.statut === 200 && a1.id, `Sam dépose, sur leur étagère, pour Léa, « Ton anniversaire » (avec son année de naissance) (${a1.statut} ${a1.error ?? ""})`);
const fe = await lire(`fils/${paire(SAM, LEA)}/etagere.json`);
const an = fe?.objets?.find((o) => o.id === a1.id);
const prochain = jour.slice(5) <= "12-02" ? `${jour.slice(0, 4)}-12-02` : `${Number(jour.slice(0, 4)) + 1}-12-02`;
ok(an?.concerne === qui8(LEA.id) && an.de8 === qui8(SAM.id) && an.depose === true && an.annuel === true && an.quand === prochain && an.titre === "L’anniversaire" && an.titreToi === "Ton anniversaire" && an.citation === "", `sur leur étagère : il concerne Léa, déposé par Sam, tous les ans, le ${an?.quand}`);
ok(fe?.vus?.[qui8(SAM.id)]?.includes(a1.id) && !fe.vus[qui8(LEA.id)]?.includes(a1.id), "Sam l'a déjà vu ; chez Léa, il reste à voir se poser");
const el = (await voir(LEA, `etagere?avec=${SAM.cle}`)).etagere;
const anL = el?.objets?.find((o) => o.id === a1.id);
ok(anL?.titre === "Ton anniversaire" && anL.depose === true && anL.de === "lui" && anL.ditPar === "Sam" && anL.rayon === "avenir", "chez Léa : « Ton anniversaire », déposé par Sam, à venir");
const es = (await voir(SAM, `etagere?avec=${LEA.cle}`)).etagere;
ok(es?.objets?.find((o) => o.id === a1.id)?.titre === "L’anniversaire de Léa", "chez Sam : « L’anniversaire de Léa »");
const scL = (await voir(LEA, `proches?vivant=${SAM.cle}`)).vivant?.etagere;
const scS = (await voir(SAM, `proches?vivant=${LEA.cle}`)).vivant?.etagere;
ok(scL?.nouveaux?.includes(a1.id) && !scS?.nouveaux?.includes(a1.id), "dans leur conversation : il s'envolera chez Léa, pas chez Sam");
ok(trouve(await mienne(LEA), a1.id)?.avec?.prenom === "Sam" && !trouve(await mienne(SAM), a1.id), "il se range sur « Mon étagère » de Léa (avec Sam) ; pas sur celle de Sam");
const d2 = await agir(LEA, { action: "deposer", avec: SAM.cle, genre: "gout", titre: "Notre chanson", emoji: "🎧" });
ok(d2.statut === 200 && trouve(await mienne(SAM), d2.id)?.titre === "Notre chanson" && trouve(await mienne(LEA), d2.id), "Léa dépose « Notre chanson » (pour eux deux, par défaut) : sur « Mon étagère » des deux");

// ═══ 👀 MONTRER À SES VISITEURS ═══
ok((await agir(SAM, { action: "montrer", id: "resto", avec: LEA.cle, oui: true })).statut === 403, "le resto (à eux deux) : il reste entre eux");
ok((await agir(SAM, { action: "montrer", id: "permis", avec: LEA.cle, oui: true })).statut === 404, "le permis de Léa : pas le sien");
ok((await agir(SAM, { action: "montrer", id: "pivoines", avec: LEA.cle, oui: true })).statut === 200 && (await mienne(SAM)).montres === 2, "ses pivoines : montrées (2)");
const vue = (await voir(LEA, `visites?cle=${SAM.cle}`)).vue;
const vit = vue?.etagere ?? [];
ok(vue?.etat === "ouvert" && vit.length === 2 && vit.some((o) => o.titre === "Les pivoines" && o.detail === "Sam adore" && o.emoji === "💐") && vit.some((o) => o.titre === "Le concert" && o.emoji === "🎤"), `Léa, en visite chez Sam : son étagère montre « Les pivoines · Sam adore » et « Le concert » (${JSON.stringify(vit.map((o) => `${o.titre} · ${o.detail}`))})`);
ok(!JSON.stringify(vit).match(/citation|adores les pivoines|Léa|avec/), "ni la phrase dite, ni avec qui");
ok((await voir(null, `visites?cle=${SAM.cle}`)).vue?.etagere === undefined, "un inconnu (son univers est réservé à ses proches) : rien");
ok((await voir(SAM, `visites?cle=${SAM.cle}`)).vue?.etagere?.length === 2, "Sam se voit comme ses visiteurs le voient");
ok((await agir(SAM, { action: "montrer", id: "pivoines", avec: LEA.cle, oui: false })).statut === 200 && (await voir(LEA, `visites?cle=${SAM.cle}`)).vue?.etagere?.length === 1, "plus montrées : la visite ne les voit plus");

// ═══ 🙈 CACHER, RETIRER, LES GESTES SUR LA SIENNE ═══
ok((await agir(SAM, { action: "cacher", id: "marathon", avec: INES.cle })).statut === 200 && !trouve(await mienne(SAM), "marathon"), "le marathon n'est plus chez Sam…");
ok((await lire(`fils/${paire(SAM, INES)}/etagere.json`))?.objets?.find((o) => o.id === "marathon")?.etat === "actif" && trouve(await mienne(SAM), "pivoines"), "… il reste sur leur étagère, avec Inès");
const ep = await agir(SAM, { action: "deposer", genre: "date", sorte: "epreuve", titre: "Le code", emoji: "📝", quand: jour });
ok(ep.statut === 200 && (await agir(SAM, { action: "reussi", mien: true, id: ep.id })).statut === 200 && trouve(await mienne(SAM), ep.id)?.etat === "fierte" && trouve(await mienne(SAM), ep.id).rayon === "fiertes", "son épreuve, aujourd'hui : « 🏆 C'est réussi » → une fierté, sur sa propre étagère");
ok((await agir(SAM, { action: "retirer", mien: true, id: c1.id })).statut === 200 && !trouve(await mienne(SAM), c1.id) && (await mienne(SAM)).montres === 0 && (await voir(LEA, `visites?cle=${SAM.cle}`)).vue?.etagere?.length === 0, "retirer « Mon concert » : parti de sa page, de ce que voient ses visiteurs");

// ═══ LES GARDE-FOUS ═══
const e1 = await agir(SAM, { action: "deposer", genre: "date", titre: "Le dentiste", quand: dansJours(2) });
ok(e1.statut === 400 && /bons moments/.test(e1.error ?? ""), `un sujet sensible : « ${e1.error} »`);
const e2 = await agir(SAM, { action: "deposer", genre: "date", titre: "Le brunch", quand: dansJours(-1) });
ok(e2.statut === 400 && /jour/.test(e2.error ?? ""), `un jour passé : « ${e2.error} »`);
ok((await agir(SAM, { action: "deposer", avec: "0123456789abcdef", genre: "gout", titre: "Les crêpes" })).statut === 404, "sur l'étagère de quelqu'un qui n'existe pas : 404");
const g1 = await agir(SAM, { action: "deposer", genre: "gout", titre: "Les crêpes", emoji: "🥐" });
ok(g1.statut === 200 && (await agir(SAM, { action: "deposer", genre: "gout", titre: "les crêpes" })).statut === 409, "deux fois la même chose : « C'est déjà sur ton étagère »");
// (déjà quatre aujourd'hui : le concert, l'anniversaire de Léa, le code, les crêpes)
let n = 4;
let dernier = null;
for (let k = 0; k < 12 && (!dernier || dernier.statut === 200); k++) {
  dernier = await agir(SAM, { action: "deposer", genre: "gout", titre: `Le goût ${k}`, emoji: "🍓" });
  if (dernier.statut === 200) n++;
}
ok(n === 12 && dernier?.statut === 429, `douze dépôts par jour, toutes étagères confondues (${n}, puis ${dernier?.statut})`);
const st = await lire(`stats/etagere/${jour}.json`);
ok((st?.deposes ?? 0) >= 12, `📊 les dépôts se comptent (${st?.deposes})`);

console.log(echecs ? `\n${echecs} échec(s)` : "\nmon étagère tient ✓");
process.exit(echecs ? 1 : 0);
