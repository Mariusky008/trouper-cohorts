#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// GÉNÉRATION DES LETTRES EN PDF — un fichier par prospect.
//
//   node scripts/lettres-pdf.mjs --ville=dax --out=./lettres [--no-solid-header]
//
// Le script ne recompose RIEN : il ouvre la page d'impression en lot de l'admin
// (/admin/humain/site-internet/lettres/<ville>), qui est la seule vérité sur le
// contenu des lettres et sur les exclusions, puis découpe la pile en un PDF A4
// par prospect. Dupliquer ici la logique de composition serait le meilleur moyen
// de voir les deux versions diverger sans que personne ne s'en aperçoive.
//
// Authentification : la page vit dans /admin/humain, protégée par session. Passe
// le cookie d'une session admin via --cookie="sb-...=...; sb-...=..." ou la
// variable d'environnement ADMIN_COOKIE (récupérable dans l'onglet Réseau du
// navigateur, requête vers /admin/humain, en-tête Cookie).
//
// Options :
//   --ville=<nom>          ville de la campagne (obligatoire)
//   --out=<dossier>        dossier de sortie (défaut ./lettres-<ville>)
//   --base=<url>           URL de l'application (défaut http://localhost:3000)
//   --cookie=<cookie>      cookie de session admin (ou $ADMIN_COOKIE)
//   --no-solid-header      remplace l'aplat noir de tête par un double filet
//                          épais de même hauteur — à utiliser si le tirage
//                          d'essai sur papier épais donne un noir irrégulier
// ─────────────────────────────────────────────────────────────────────────────
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer";

const args = new Map(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? "1"] : [a, "1"];
  })
);

const ville = args.get("ville");
if (!ville) {
  console.error("Usage : node scripts/lettres-pdf.mjs --ville=dax [--out=./lettres] [--no-solid-header]");
  process.exit(1);
}

const base = (args.get("base") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
const out = args.get("out") || `./lettres-${ville.toLowerCase().replace(/\s+/g, "-")}`;
const cookie = args.get("cookie") || process.env.ADMIN_COOKIE || "";
const sansAplat = args.has("no-solid-header");

const url =
  `${base}/admin/humain/site-internet/lettres/${encodeURIComponent(ville)}` +
  (sansAplat ? "?filet=1" : "");

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
try {
  const page = await browser.newPage();
  if (cookie) {
    const { hostname } = new URL(base);
    await browser.setCookie(
      ...cookie
        .split(";")
        .map((c) => c.trim())
        .filter(Boolean)
        .map((c) => {
          const i = c.indexOf("=");
          return { name: c.slice(0, i), value: c.slice(i + 1), domain: hostname, path: "/" };
        })
    );
  }

  const res = await page.goto(url, { waitUntil: "networkidle0", timeout: 120_000 });
  if (!res || !res.ok()) throw new Error(`La page a répondu ${res ? res.status() : "rien"} — session admin expirée ?`);

  // Laisse FitLetter mesurer et mettre à l'échelle avant de figer les pages.
  await page.evaluate(() => document.fonts?.ready);
  await new Promise((r) => setTimeout(r, 1200));

  const rapport = await page.evaluate(() => window.__CLIKME_RAPPORT__ || null);
  if (!rapport) throw new Error("Rapport de campagne introuvable — page inattendue (redirigé vers la connexion ?).");

  const slugs = await page.evaluate(() =>
    Array.from(document.querySelectorAll("#letter-root .sheet")).map((s) => s.dataset.slug || "")
  );

  await mkdir(out, { recursive: true });
  // Masque le chrome de l'admin une fois pour toutes ; puis, pour chaque feuille,
  // on ne laisse visible qu'elle. Imprimer feuille par feuille plutôt que de
  // découper un gros PDF garantit qu'un nom de fichier ne se retrouve jamais en
  // face de la mauvaise lettre.
  await page.addStyleTag({
    content: `.no-print{display:none!important}
      body header{display:none!important}
      body main{padding:0!important;margin:0!important;max-width:none!important}
      #letter-root{padding:0!important}
      .si-root .sheet{display:none!important;box-shadow:none!important;margin:0!important}
      .si-root .sheet.ck-print{display:block!important}`,
  });

  const ecrits = [];
  for (const slug of slugs) {
    if (!slug) continue;
    await page.evaluate((s) => {
      document.querySelectorAll("#letter-root .sheet").forEach((el) => el.classList.remove("ck-print"));
      document.querySelector(`#letter-root .sheet[data-slug="${s}"]`)?.classList.add("ck-print");
    }, slug);
    const pdf = await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
    await writeFile(path.join(out, `${slug}.pdf`), pdf);
    ecrits.push(slug);
  }

  console.log(`\n─── Rapport de campagne — ${ville} ───`);
  console.log(`PDF générés               : ${ecrits.length}`);
  console.log(`Exclus (déontologie)      : ${rapport.exclu_deontologie}`);
  console.log(`Exclus (données insuff.)  : ${rapport.exclu_donnees}`);
  if (rapport.details.length) {
    console.log(`\nDétail des exclusions :`);
    for (const d of rapport.details) console.log(`  · ${d.nom || d.slug} [${d.raison}] — ${d.detail}`);
  }
  console.log(`\nDossier : ${path.resolve(out)}\n`);

  if (ecrits.length !== rapport.genere) {
    console.warn(
      `⚠ ${rapport.genere} lettre(s) composée(s) mais ${ecrits.length} PDF écrit(s). ` +
        `Une feuille sans data-slug ? Vérifie avant d'imprimer.`
    );
    process.exitCode = 1;
  }
} finally {
  await browser.close();
}
