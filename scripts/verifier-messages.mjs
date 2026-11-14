// ✍️ ÉCRIRE, PARTAGER (lot M1), SANS TÉLÉPHONE — `src/lib/direct/ecrit.ts` (le cahier : `docs/univers/messages-ecrits.md`).
//
// Ce qui se vérifie ici :
//   · le texte : 1 000 signes au plus (un emoji compte pour un), rien d'invisible, les retours à la ligne gardés (deux
//     d'affilée au plus), un texte vide refusé ; la bulle (140 signes, coupée à un mot) ; le temps que la figurine met
//     à le dire ; la tête choisie par les règles des vocaux ;
//   · le lien : reconnu dans le texte (sans la ponctuation de la phrase), refusé s'il n'est ni http ni https ;
//   · les adresses que le serveur refuse d'aller lire : les adresses IP nues (même déguisées), les noms internes, les
//     ports inhabituels, un identifiant dans l'adresse ; les adresses internes une fois le nom traduit (IPv4, IPv6) ;
//   · ce qu'une page dit d'elle-même (ses balises de partage, dans n'importe quel ordre ; une image relative) ;
//   · les sites connus ; ce que les figurines lisent d'un message (jamais l'adresse du lien) ;
//   · les phrases : la notification, la ligne de « Chez moi » — sans accord de genre, sans le mot interdit.
//
//   node scripts/verifier-messages.mjs
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const exige = createRequire(import.meta.url);
const ts = exige("typescript");
const deja = new Map();
/** Un fichier partagé de `src/lib/direct`, et ses imports relatifs (rien d'autre : ni base, ni réseau). */
const charger = (chemin) => {
  const plein = path.resolve(chemin);
  if (deja.has(plein)) return deja.get(plein).exports;
  const js = ts.transpileModule(readFileSync(plein, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const boite = { exports: {} };
  deja.set(plein, boite);
  new Function("exports", "module", "require", js)(boite.exports, boite, (x) => {
    if (!x.startsWith("./")) throw new Error(`import inattendu : ${x}`);
    return charger(path.join(path.dirname(plein), `${x}.ts`));
  });
  return boite.exports;
};
const E = charger("src/lib/direct/ecrit.ts");
const T = charger("src/lib/direct/talkie.ts");
const P = charger("src/lib/direct/photo.ts");
const { motInterdit } = charger("src/lib/direct/mots-interdits.ts");

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

// ═══ LE TEXTE ═══
ok(E.texteEcrit("  On se voit samedi ?  ") === "On se voit samedi ?", "les espaces autour s'en vont");
ok(E.texteEcrit("Salut\r\n\r\n\r\n\r\nça va ?") === "Salut\n\nça va ?", "les retours à la ligne : deux d'affilée au plus");
ok(E.texteEcrit("ok​‮  top\u0007") === "ok top", "rien d'invisible (espaces sans largeur, marques de direction, contrôle)");
ok(E.texteEcrit("👨‍👩‍👧 trop bien 🎉") === "👨‍👩‍👧 trop bien 🎉", "les emojis passent tels quels (le liant des familles aussi)");
ok(E.texteEcrit("") === null && E.texteEcrit("   \n ") === null && E.texteEcrit(42) === null, "vide, ou pas un texte : refusé");
ok(E.texteEcrit("a".repeat(1000)) !== null && E.texteEcrit("a".repeat(1001)) === null, "1 000 signes au plus");
ok(E.texteEcrit("🎉".repeat(1000)) !== null && E.signes("🎉🎉") === 2, "un emoji compte pour un signe");
const long = `${"Un message un peu long qui parle de tout et de rien ".repeat(5)}fin`;
const b = E.texteDeBulle(long);
ok(E.signes(b) <= 140 && b.endsWith("…") && !b.includes("  ") && long.startsWith(b.slice(0, -1).trimEnd()), `la bulle : 140 signes, coupée à un mot (« ${b} »)`);
ok(E.texteDeBulle("Court.") === "Court.", "un message court : en entier");
ok(E.dureeDeLecture("Oui") === 2 && E.dureeDeLecture(long) <= 12 && E.dureeDeLecture(long) > 6, `le temps de le dire : de 2 à 12 s (${E.dureeDeLecture("Oui")} s, ${E.dureeDeLecture(long)} s)`);
const dispo = ["joie", "rire", "colere", "tete"];
ok(T.proposerParRegles("Trop drôle ce que tu m'as raconté, mdr 😂", dispo)[0] === "rire", `la tête choisie par les règles des vocaux : « mdr » → ${T.proposerParRegles("Trop drôle ce que tu m'as raconté, mdr 😂", dispo)[0]}`);
ok(motInterdit("espèce de connard") && !motInterdit("On se voit samedi ?"), "les mots interdits, comme pour un vocal");

// ═══ LE LIEN ═══
const l1 = E.lienDuTexte("Regarde ça : https://www.youtube.com/watch?v=abc123. Trop bien !");
ok(l1?.url === "https://www.youtube.com/watch?v=abc123" && l1.site === "youtube.com", `le lien, sans le point de la phrase (${l1?.url} · ${l1?.site})`);
ok(E.lienDuTexte("(voir https://fr.wikipedia.org/wiki/Dax_(Landes))")?.url === "https://fr.wikipedia.org/wiki/Dax_(Landes)", "une parenthèse du lien reste ; celle de la phrase s'en va");
ok(E.lienDuTexte("http://lemonde.fr/article?x=1&y=2, à lire")?.url === "http://lemonde.fr/article?x=1&y=2", "la virgule de la phrase s'en va");
ok(E.lienDuTexte("pas de lien ici") === null && E.lienDuTexte("ftp://serveur.fr/x") === null && E.lienDuTexte("javascript:alert(1)") === null, "pas de lien, ou ni http ni https : rien");
ok(E.lienDuTexte("«https://site.fr»")?.url === "https://site.fr/", "les guillemets français ne font pas partie du lien");
// 🔗 (l'écran de M1) le texte en morceaux : ses liens à part, recollés ils redonnent le texte
const texteMorceaux = "Regarde https://youtu.be/abc. Et (http://lemonde.fr/a) aussi, puis ftp://x.fr !";
const morceaux = E.morceauxDuTexte(texteMorceaux);
ok(
  morceaux.map((x) => x.texte).join("") === texteMorceaux &&
    morceaux.filter((x) => x.url).map((x) => `${x.texte}>${x.site}`).join(" | ") === "https://youtu.be/abc>youtu.be | http://lemonde.fr/a>lemonde.fr",
  `le texte en morceaux : deux liens (sans le point ni la parenthèse de la phrase, pas le ftp), recollés le texte entier (${morceaux.map((x) => (x.url ? `[${x.texte}]` : x.texte)).join("")})`,
);
ok(E.morceauxDuTexte("").length === 0 && E.morceauxDuTexte("Pas de lien").length === 1 && !E.morceauxDuTexte("Pas de lien")[0].url, "sans lien : un seul morceau, ou aucun");

// ═══ LES ADRESSES QUE LE SERVEUR REFUSE D'ALLER LIRE ═══
const refusee = (u, pourquoi) => ok(E.urlLisible(u) === null, `refusée : ${pourquoi} (${u})`);
refusee("http://localhost:3821/api", "la machine elle-même");
refusee("http://127.0.0.1/", "une adresse IP nue");
refusee("http://2130706433/", "une adresse IP déguisée (un seul nombre)");
refusee("http://0x7f.0.0.1/", "une adresse IP déguisée (en hexadécimal)");
refusee("http://[::1]/", "une adresse IPv6 nue");
refusee("http://169.254.169.254/latest/meta-data/", "l'adresse des métadonnées d'un hébergeur");
refusee("http://10.0.0.5/", "un réseau privé");
refusee("http://192.168.1.1/", "un réseau privé");
refusee("http://imprimante.local/", "un nom du réseau local");
refusee("http://serveur.internal/", "un nom interne");
refusee("http://site.fr:8080/", "un port inhabituel");
refusee("https://moi:secret@site.fr/", "un identifiant dans l'adresse");
refusee("file:///etc/passwd", "un fichier");
refusee("http://intranet/", "un nom sans point");
ok(E.urlLisible("https://www.youtube.com/watch?v=abc")?.hostname === "www.youtube.com" && E.urlLisible("http://lemonde.fr:80/x") !== null, "le web public : lisible");
const interne = (ip) => E.adresseInterne(ip);
ok(["127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.0.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "224.0.0.1", "255.255.255.255"].every(interne), "les adresses internes IPv4, une fois le nom traduit");
ok(["::1", "::", "fc00::1", "fd12:3456::1", "fe80::1", "ff02::1", "::ffff:127.0.0.1", "::ffff:10.0.0.1", "2001:db8::1"].every(interne), "les adresses internes IPv6 (et l'IPv4 qui s'y cache)");
ok(!["8.8.8.8", "93.184.216.34", "172.32.0.1", "2606:4700:4700::1111", "2a00:1450:4007:80b::200e", "::ffff:8.8.8.8"].some(interne), "les adresses du web public : acceptées");

// ═══ CE QU'UNE PAGE DIT D'ELLE-MÊME ═══
const html = `<html><head><title>Secours</title><meta content="Le Grand Bleu &mdash; la bande-annonce" property="og:title"><meta property="og:site_name" content="Cinéma &amp; Co"><meta name="twitter:image" content="/affiche.jpg"></head><body>Le texte</body></html>`;
const a = E.apercuDuHtml(html, "https://cinema.fr/films/grand-bleu");
ok(a.titre === "Le Grand Bleu — la bande-annonce" && a.site === "Cinéma & Co" && a.image === "https://cinema.fr/affiche.jpg", `les balises de partage, dans n'importe quel ordre ; l'image relative devenue absolue (${JSON.stringify(a)})`);
ok(E.apercuDuHtml("<title>Juste un titre</title>", "https://x.fr/").titre === "Juste un titre" && E.apercuDuHtml("<p>rien</p>", "https://x.fr/").titre === "", "sans balise de partage : le titre de la page ; sans rien : pas d'aperçu");
ok(E.apercuDuHtml(`<meta property="og:image" content="javascript:alert(1)"><title>t</title>`, "https://x.fr/").image === "", "une image qui n'est ni http ni https : ignorée");
ok(E.signes(E.apercuDuHtml(`<title>${"Très long titre ".repeat(20)}</title>`, "https://x.fr/").titre) <= 120, "un titre trop long : coupé (120 signes)");

// ═══ LES SITES CONNUS, CE QUE LISENT LES FIGURINES ═══
ok(E.sorteDuSite("youtube.com") === "video" && E.sorteDuSite("open.spotify.com") === "musique" && E.sorteDuSite("music.apple.com") === "musique" && E.sorteDuSite("deezer.com") === "musique" && E.sorteDuSite("lemonde.fr") === null, "les sites de musique et de vidéo connus");
ok(E.phraseDepart("lemonde.fr") === "Tu quittes ClikMe pour lemonde.fr", "« Tu quittes ClikMe pour lemonde.fr »");
ok(E.texteLuDeLEcrit({ texte: "Regarde https://youtu.be/xyz trop bien", lien: { titre: "Le Grand Bleu" } }) === "Regarde trop bien — Le Grand Bleu", "les figurines lisent le texte et le titre du lien, jamais son adresse");
ok(T.texteLuDuMessage({ genre: "ecrit", texte: "On se voit samedi ?" }) === "On se voit samedi ?" && T.texteLuDuMessage({ repliques: [{ de: 0, a: 1, texte: "Salut", tete: null }], duree: 1 }) === "Salut", "un écrit, un vocal : ce que les figurines en lisent");

// ═══ LES PHRASES ═══
const n1 = E.notifEcrit("Léa", { texte: "On se voit samedi ? J'ai une idée de sortie pour toi, tu vas adorer, promis juré" });
ok(n1.titre === "✍️ Léa t’a écrit" && E.signes(n1.corps) <= 60 && n1.corps.endsWith("…"), `la notification : « ${n1.titre} » — « ${n1.corps} »`);
const n2 = E.notifEcrit("Léa", { texte: "https://youtu.be/xyz", lien: { titre: "Le Grand Bleu", site: "youtube.com" } });
ok(n2.titre === "🔗 Léa t’a envoyé un lien" && n2.corps === "Le Grand Bleu", `un lien seul : « ${n2.titre} » — « ${n2.corps} »`);
ok(E.ligneDeLEcrit({ texte: "On se voit samedi ?" }) === "On se voit samedi ?" && E.ligneDeLEcrit({ texte: "https://youtu.be/x", lien: { titre: "Le Grand Bleu" } }) === "🔗 Le Grand Bleu", "la ligne de « Chez moi » : le message, ou « 🔗 Le titre du lien »");
const GENRE = /\b(content|contente|heureux|heureuse|seul|seule|fatigu[ée]e?|prête?|fière?|motivée?|ravie?|surprise?|occupée?|parti|partie)\b/i;
// 📷 (lot M2) les photos : la légende, la notification, la ligne, ce que les figurines en lisent, les limites
ok(P.legendePhoto(undefined) === "" && P.legendePhoto("  La  plage\n au soleil ") === "La plage au soleil" && P.legendePhoto("Coucou\u200b🌅") === "Coucou 🌅" && P.legendePhoto(42) === null, "la légende : sur une ligne, sans espaces en trop ni caractère invisible, les emojis tels quels");
ok(P.legendePhoto("é".repeat(200)) === "é".repeat(200) && P.legendePhoto("é".repeat(201)) === null && P.legendePhoto("🌅".repeat(200)) !== null, "la légende : 200 signes au plus (un emoji compte pour un)");
const np = P.notifPhoto("Léa", "");
const npLongue = P.notifPhoto("Léa", "On a fait le tour du lac à vélo, il faisait si beau qu'on est restés jusqu'au soir");
ok(np.titre === "📷 Léa t’a envoyé une photo" && np.corps === "Viens voir 👀" && [...npLongue.corps].length <= 60 && npLongue.corps.endsWith("…"), `la notification : « ${np.titre} » — « ${npLongue.corps} »`);
ok(P.lignePhoto("") === "📷 Une photo" && P.lignePhoto(" La plage ") === "📷 La plage", "la ligne de « Chez moi » : « 📷 La légende », ou « 📷 Une photo »");
ok(T.texteLuDuMessage({ genre: "photo", legende: "La plage", media: { chemin: "x" } }) === "La plage" && T.texteLuDuMessage({ genre: "photo" }) === "", "les figurines lisent la légende d'une photo, jamais l'image");
ok(P.PHOTO.max === 5 * 1024 * 1024 && P.PHOTO.parJour === 30 && P.PHOTO.cote === 1600 && P.PHOTO.legende === 200, "les limites du cahier : 5 Mo, 30 par jour, 1 600 pixels, 200 signes de légende");
const phrases = [...Object.values(E.PHRASES_ECRIT), n1.titre, n2.titre, E.phraseDepart("site.fr"), ...Object.values(P.PHRASES_PHOTO), np.titre];
ok(phrases.every((x) => !GENRE.test(x) && !/exemple/i.test(x) && !motInterdit(x)), `les phrases : sans accord, sans le mot interdit (${phrases.filter((x) => GENRE.test(x) || /exemple/i.test(x)).join(" | ") || "toutes"})`);
ok(E.ECRIT.max === 1000 && E.ECRIT.parJour === 300 && E.ECRIT.bulle === 140 && E.APERCU.delai === 5000 && E.APERCU.page === 1024 * 1024 && E.APERCU.largeur === 600, "les limites du cahier : 1 000 signes, 300 par jour, la bulle à 140, l'aperçu en 5 s et 1 Mo, l'image à 600 pixels");

console.log(echecs ? `\n${echecs} échec(s)` : "\nles règles de l'écrit tiennent ✓");
process.exit(echecs ? 1 : 0);
