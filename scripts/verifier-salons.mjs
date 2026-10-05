/**
 * 🔐 LA GARDE DES SALONS — qui lit, qui écrit, qui entre. Contre le faux
 * Supabase (`scripts/faux-supabase.mjs`) et l'application branchée dessus.
 *
 * TROIS TÉLÉPHONES, TROIS COOKIES : Léa crée, Karim est invité, Nadia est
 * l'inconnue à qui l'on a transféré le lien. On vérifie, par la route
 * elle-même et sur les adresses directes des photos :
 *
 *   · un lien transféré ne montre d'un salon privé que son titre — ni
 *     messages, ni photos, ni participants — et ne permet pas d'écrire ;
 *   · la demande d'entrée attend la décision du créateur ;
 *   · une invitation nominative ne s'accepte que par la personne invitée ;
 *   · seules les personnes de mes salons PRIVÉS sont proposées à l'invitation ;
 *   · un salon public se lit sans y entrer, se rejoint d'un geste ;
 *   · bloquer, masquer, exclure, quitter, rendre privé.
 *
 * Usage (les deux serveurs tournent déjà) :
 *   node scripts/verifier-salons.mjs [port de l'app] [port du faux Supabase]
 */
import pw from "/opt/node22/lib/node_modules/playwright/index.js";
const { request } = pw;

const APP = `http://localhost:${process.argv[2] ?? "3821"}`;
const SUPA = `http://127.0.0.1:${process.argv[3] ?? "54321"}`;
const ROUTE = "/api/direct/conversations";
// Une vraie image (8 × 8, orange) : la route la passe par sharp.
const PHOTO =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEUlEQVR4nGP4ME0DK2IYWhIAMz5rgaSp/1oAAAAASUVORK5CYII=";

let echecs = 0;
const ok = (cond, quoi) => {
  console.log(`  ${cond ? "ok  " : "ÉCHEC"} ${quoi}`);
  if (!cond) echecs++;
};

const telephone = async () => request.newContext({ baseURL: APP });
const lire = async (t, q = "") => (await (await t.get(`${ROUTE}?ville=dax${q}`)).json());
const faire = async (t, corps) => {
  const r = await t.post(ROUTE, { data: corps });
  return { statut: r.status(), j: await r.json().catch(() => ({})) };
};
const salonDe = (lu, id) => lu.conversations.find((c) => c.id === id);

const lea = await telephone();
const karim = await telephone();
const nadia = await telephone();

console.log("1. Léa crée un salon privé, y écrit avec une photo");
const s1 = await faire(lea, { action: "ouvrir", ville: "dax", qui: "Léa", base: { sujet: "Laquelle pour samedi ?", ou: "Une boutique", quand: "Samedi", prive: true, photo: PHOTO } });
ok(s1.statut === 200 && s1.j.id, "salon créé");
const S1 = s1.j.id;
const g1 = await faire(lea, { action: "geste", id: S1, qui: "Léa", geste: { type: "ecrire", texte: "La rouge ou la noire ?", photo: PHOTO } });
ok(g1.statut === 200, "Léa écrit");
let vu = salonDe(await lire(lea), S1);
ok(vu?.acces?.statut === "membre" && vu.acces.role === "createur" && vu.acces.nb === 1, "Léa : membre, créatrice, 1 membre");
const photoMsg = vu?.gestes?.find((g) => g.geste.photo)?.geste.photo ?? "";
ok(photoMsg.startsWith("/api/direct/conversations/photo?"), "la photo du message est servie par la route, pas par une adresse directe");
const rLea = await lea.get(photoMsg, { maxRedirects: 0 });
ok(rLea.status() === 302, "Léa obtient la photo (redirection signée)");
const signee = rLea.headers().location ?? "";
const chemin = decodeURIComponent(new URL(photoMsg, APP).searchParams.get("f") ?? "");
const directe = await (await request.newContext()).get(`${SUPA}/storage/v1/object/public/salons-prives/${chemin}`);
ok(directe.status() >= 400, "l'adresse publique directe de la photo ne répond pas (seau privé)");

console.log("2. Le lien est transféré à Nadia, qui n'est pas invitée");
const lien = await faire(lea, { action: "lien", id: S1 });
ok(typeof lien.j.jeton === "string", "Léa obtient un lien d'invitation");
const J1 = lien.j.jeton;
let luN = await lire(nadia, `&jetons=${J1}`);
vu = salonDe(luN, S1);
ok(vu?.acces?.statut === "a_demander", "Nadia voit une porte « demander à entrer »");
const texteN = JSON.stringify(vu ?? {});
ok(!texteN.includes("La rouge ou la noire") && !texteN.includes("photo?") && !texteN.includes("salon:") && (vu?.gestes?.length ?? 0) === 0, "ni messages, ni photos dans ce qu'elle reçoit");
ok(!vu?.acces?.participants, "ni la liste des participants");
ok(vu?.base?.sujet === "Laquelle pour samedi ?" && vu?.acces?.invitePar === "Léa", "seulement le titre et qui invite");
ok((await nadia.get(photoMsg, { maxRedirects: 0 })).status() === 404, "la photo du salon lui répond 404, même avec l'adresse exacte");
ok(signee ? (await nadia.get(signee.replace(/^https?:\/\/[^/]+/, SUPA))).status() === 200 : false, "(une adresse signée transmise reste lisible deux minutes — c'est sa nature)");
ok((await faire(nadia, { action: "geste", id: S1, qui: "Nadia", geste: { type: "ecrire", texte: "coucou" } })).statut === 403, "Nadia ne peut pas écrire");
ok((await faire(nadia, { action: "rejoindre", id: S1, qui: "Nadia" })).statut === 403, "ni « rejoindre » un salon privé");

console.log("3. Nadia demande à entrer ; Léa refuse");
const dN = await faire(nadia, { action: "demander", jeton: J1, qui: "Nadia" });
ok(dN.statut === 200 && dN.j.demande === "attente", "demande en attente");
vu = salonDe(await lire(lea), S1);
const demNadia = vu?.acces?.demandes?.find((d) => d.qui === "Nadia");
ok(Boolean(demNadia), "Léa voit la demande de Nadia");
ok((await faire(karim, { action: "decider", id: S1, auteur: demNadia?.auteur, accepter: true })).statut === 403, "un non-membre ne peut pas décider à sa place");
ok((await faire(lea, { action: "decider", id: S1, auteur: demNadia?.auteur, accepter: false })).statut === 200, "Léa refuse");
vu = salonDe(await lire(nadia, `&jetons=${J1}`), S1);
ok(vu?.acces?.statut === "refusee" && (vu?.gestes?.length ?? 0) === 0, "Nadia : refusée, toujours rien à lire");

console.log("4. Karim ouvre le même lien ; Léa accepte");
ok((await faire(karim, { action: "demander", jeton: J1, qui: "Karim" })).j.demande === "attente", "Karim demande");
vu = salonDe(await lire(lea), S1);
const demKarim = vu?.acces?.demandes?.find((d) => d.qui === "Karim");
ok((await faire(lea, { action: "decider", id: S1, auteur: demKarim?.auteur, accepter: true })).statut === 200, "Léa accepte");
vu = salonDe(await lire(karim), S1);
ok(vu?.acces?.statut === "membre" && vu.acces.nb === 2 && vu.gestes.length === 1, "Karim : membre, voit le message, 2 membres");
ok((await karim.get(photoMsg, { maxRedirects: 0 })).status() === 302, "Karim obtient la photo");

console.log("5. Invitation nominative dans un second salon privé");
const S2 = (await faire(lea, { action: "ouvrir", ville: "dax", qui: "Léa", base: { sujet: "Déjeuner de vendredi", ou: "Le Bordeaux", quand: "Vendredi" } })).j.id;
const cand = await faire(lea, { action: "candidats", id: S2 });
const refKarim = cand.j.personnes?.find((p) => p.qui === "Karim")?.ref;
ok(Boolean(refKarim) && !cand.j.personnes.some((p) => p.qui === "Nadia"), "Léa peut inviter Karim (salon privé partagé), pas Nadia");
ok((await faire(lea, { action: "inviter", id: S2, ref: refKarim })).statut === 200, "invitation envoyée à Karim");
ok((await faire(lea, { action: "inviter", id: S2, ref: "0123456789abcdef0123" })).statut === 403, "une référence inventée est refusée");
vu = salonDe(await lire(karim), S2);
ok(vu?.acces?.statut === "invite" && (vu?.gestes?.length ?? 0) === 0 && !vu?.acces?.participants, "Karim voit l'invitation, sans le contenu");
const J2 = vu?.acces?.jeton;
ok((await faire(nadia, { action: "accepter", jeton: J2, qui: "Nadia" })).statut === 403, "Nadia ne peut pas accepter l'invitation de Karim, même avec le jeton");
ok((await faire(nadia, { action: "demander", jeton: J2, qui: "Nadia" })).statut === 403, "ni s'en servir pour demander à entrer");
ok((await faire(karim, { action: "accepter", jeton: J2, qui: "Karim" })).statut === 200, "Karim accepte");
vu = salonDe(await lire(karim), S2);
ok(vu?.acces?.statut === "membre" && vu.acces.nb === 2, "Karim est membre du second salon");

console.log("6. Un salon public : lu sans y entrer, rejoint d'un geste");
const S3 = (await faire(lea, { action: "ouvrir", ville: "dax", qui: "Léa", base: { sujet: "Qui déjeune au Bordeaux ce midi ?", ou: "Le Bordeaux", quand: "Ce midi", prive: false } })).j.id;
await faire(lea, { action: "geste", id: S3, qui: "Léa", geste: { type: "ecrire", texte: "J'y vais vers 12 h 30" } });
luN = await lire(nadia, "&decouvrir=1");
const dec = luN.decouvrir.find((d) => d.id === S3);
ok(Boolean(dec) && dec.nb === 1 && dec.dernier?.texte === "J'y vais vers 12 h 30", "Nadia le découvre : sujet, 1 participant, dernier message");
ok(!luN.decouvrir.some((d) => d.id === S1 || d.id === S2), "aucun salon privé dans « à découvrir »");
vu = salonDe(await lire(nadia, `&ids=${S3}`), S3);
ok(vu?.acces?.statut === "lecture" && vu.gestes.length === 1, "Nadia le lit");
vu = salonDe(await lire(lea), S3);
ok(vu?.acces?.nb === 1, "… et le lire ne l'a pas ajoutée aux participants");
ok((await faire(nadia, { action: "geste", id: S3, qui: "Nadia", geste: { type: "ecrire", texte: "moi aussi" } })).statut === 403, "elle ne peut pas écrire avant de rejoindre");
ok((await faire(nadia, { action: "rejoindre", id: S3, qui: "Nadia" })).statut === 200, "elle rejoint");
ok((await faire(nadia, { action: "geste", id: S3, qui: "Nadia", geste: { type: "ecrire", texte: "Moi aussi !" } })).statut === 200, "et peut écrire");
vu = salonDe(await lire(lea), S3);
ok(vu?.acces?.nb === 2, "2 participants");
const candidatsS2 = await faire(lea, { action: "candidats", id: S2 });
ok(!candidatsS2.j.personnes?.some((p) => p.qui === "Nadia"), "un salon public partagé ne fait pas de Nadia une personne invitable");

console.log("7. Bloquer, masquer, exclure");
await faire(karim, { action: "rejoindre", id: S3, qui: "Karim" });
vu = salonDe(await lire(karim), S3);
const msgNadia = vu.gestes.find((g) => g.qui === "Nadia");
ok((await faire(karim, { action: "bloquer", id: S3, auteur: msgNadia.auteur })).statut === 200, "Karim bloque Nadia");
vu = salonDe(await lire(karim), S3);
ok(!vu.gestes.some((g) => g.qui === "Nadia"), "Karim ne voit plus ses messages");
vu = salonDe(await lire(lea), S3);
ok(vu.gestes.some((g) => g.qui === "Nadia"), "Léa les voit toujours");
ok((await faire(nadia, { action: "masquer", id: S3, geste: msgNadia.id })).statut === 403, "Nadia ne peut pas masquer");
ok((await faire(lea, { action: "masquer", id: S3, geste: msgNadia.id })).statut === 200, "Léa (créatrice) masque le message");
vu = salonDe(await lire(lea), S3);
ok(!vu.gestes.some((g) => g.id === msgNadia.id), "message masqué pour tous");
ok((await faire(karim, { action: "exclure", id: S3, auteur: msgNadia.auteur })).statut === 403, "Karim ne peut pas exclure");
ok((await faire(lea, { action: "exclure", id: S3, auteur: msgNadia.auteur })).statut === 200, "Léa exclut Nadia");
ok((await faire(nadia, { action: "geste", id: S3, qui: "Nadia", geste: { type: "ecrire", texte: "re" } })).statut === 403, "Nadia ne peut plus écrire");
ok((await faire(nadia, { action: "rejoindre", id: S3, qui: "Nadia" })).statut === 403, "ni revenir");
ok((await faire(lea, { action: "signaler", id: S3, geste: msgNadia.id, motif: "test" })).statut === 200, "signaler un message");

console.log("8. Quitter, sourdine, rendre privé");
ok((await faire(karim, { action: "sourdine", id: S1, on: true })).statut === 200, "Karim met S1 en sourdine");
ok(salonDe(await lire(karim), S1)?.acces?.sourdine === true, "sourdine enregistrée");
ok((await faire(karim, { action: "quitter", id: S1 })).statut === 200, "Karim quitte S1");
ok(!salonDe(await lire(karim), S1), "S1 n'est plus dans ses salons");
ok((await karim.get(photoMsg, { maxRedirects: 0 })).status() === 404, "et sa photo ne lui est plus servie");
ok((await faire(lea, { action: "rendre_prive", id: S3 })).statut === 200, "Léa rend S3 privé");
vu = salonDe(await lire(nadia, `&ids=${S3}`), S3);
ok(vu?.acces?.statut === "exclu" && (vu?.gestes?.length ?? 0) === 0, "Nadia (exclue) n'y lit plus rien");
ok(!(await lire(nadia, "&decouvrir=1")).decouvrir.some((d) => d.id === S3), "S3 quitte « à découvrir »");

console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTOUT PASSE");
process.exit(echecs ? 1 : 0);
