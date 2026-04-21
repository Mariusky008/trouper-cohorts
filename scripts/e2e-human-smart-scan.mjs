import puppeteer from "puppeteer";
import fs from "node:fs";
import path from "node:path";

loadEnvFile(".env.local");
loadEnvFile(".env");

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function loadEnvFile(fileName) {
  const filePath = path.resolve(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) return;

  const raw = fs.readFileSync(filePath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex <= 0) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    if (!key || process.env[key]) continue;

    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

async function clickButtonContaining(page, snippets, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  const normalizedSnippets = snippets.map((snippet) => snippet.toLowerCase());
  while (Date.now() < deadline) {
    const clicked = await page.evaluate((parts) => {
      const buttons = Array.from(document.querySelectorAll("button"));
      for (const button of buttons) {
        const text = (button.textContent || "").toLowerCase().replace(/\s+/g, " ").trim();
        if (!text) continue;
        if (parts.some((part) => text.includes(part)) && !(button).disabled) {
          button.click();
          return true;
        }
      }
      return false;
    }, normalizedSnippets);
    if (clicked) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Unable to click button containing one of: ${snippets.join(", ")}`);
}

async function ensureText(page, snippets, timeoutMs = 20000) {
  await page.waitForFunction(
    (parts) => {
      const text = (document.body?.textContent || "").toLowerCase();
      return parts.every((part) => text.includes(part));
    },
    { timeout: timeoutMs },
    snippets.map((s) => s.toLowerCase())
  );
}

async function hasText(page, snippet) {
  return page.evaluate((part) => {
    const text = (document.body?.textContent || "").toLowerCase();
    return text.includes(part.toLowerCase());
  }, snippet);
}

async function importContactsIfNeeded(page) {
  const needsImport = await hasText(page, "aucun contact importe");
  if (!needsImport) return;

  const fixtureDir = path.resolve(process.cwd(), "scripts", "fixtures");
  if (!fs.existsSync(fixtureDir)) {
    fs.mkdirSync(fixtureDir, { recursive: true });
  }
  const fixturePath = path.resolve(fixtureDir, "e2e-smart-scan-contacts.csv");
  const fixtureCsv = [
    "name,phone,city,company",
    "Nicolas Test,+33601010101,Dax,Test Habitat",
    "Claire Test,+33602020202,Saint-Paul-les-Dax,Test Conseil",
    "Julien Test,+33603030303,Dax,Test Services",
  ].join("\n");
  fs.writeFileSync(fixturePath, fixtureCsv, "utf8");

  const input = await page.$('input[type="file"]');
  if (!input) {
    throw new Error("Unable to find file input for contact import.");
  }
  await input.uploadFile(fixturePath);
  await ensureText(page, ["contacts importes"]);
  await page.waitForFunction(() => {
    const button = Array.from(document.querySelectorAll("button")).find((item) =>
      (item.textContent || "").toLowerCase().includes("continuer"),
    );
    return Boolean(button && !button.disabled);
  });
}

async function login(page, baseUrl, email, password) {
  await page.goto(`${baseUrl}/popey-human/login`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#email");
  await page.waitForSelector("#password");
  await page.type("#email", email);
  await page.type("#password", password);

  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded" }), page.click('button[type="submit"]')]);
}

async function main() {
  const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3000";
  const email = required("HUMAN_E2E_SPHERE_EMAIL");
  const password = required("HUMAN_E2E_SPHERE_PASSWORD");

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(90000);
  page.setDefaultTimeout(90000);

  try {
    await login(page, baseUrl, email, password);
    console.log("[E2E-SMART-SCAN] Login OK");

    await page.goto(`${baseUrl}/popey-human/entrepreneur-smart-scan-test`, { waitUntil: "domcontentloaded" });
    await ensureText(page, ["mini-agence smart scan"]);
    console.log("[E2E-SMART-SCAN] Smart Scan page OK");

    const onDailyStage = await hasText(page, "cockpit mission quotidienne");
    if (!onDailyStage) {
      await importContactsIfNeeded(page);
      await page.waitForFunction(() => {
        const button = Array.from(document.querySelectorAll("button")).find((item) =>
          (item.textContent || "").toLowerCase().includes("continuer"),
        );
        return Boolean(button);
      });
      await clickButtonContaining(page, ["continuer"]);
      await ensureText(page, ["cockpit mission quotidienne"]);
      console.log("[E2E-SMART-SCAN] Scan -> Daily transition OK");
    }

    // Qualifier flow (optional): run when an unqualified contact is shown.
    const qualifierVisible = await hasText(page, "type d opportunite");
    if (qualifierVisible) {
      await clickButtonContaining(page, ["peut acheter"]);
      await clickButtonContaining(page, ["froid", "tiede", "brulant"]);
      await clickButtonContaining(page, ["travail serieux"]);
      await clickButtonContaining(page, ["enregistrer la fiche"]);
      await clickButtonContaining(page, ["voir les actions possibles"]);
      console.log("[E2E-SMART-SCAN] Qualification flow OK");
    } else {
      console.log("[E2E-SMART-SCAN] Qualification step skipped (contact already qualified).");
    }

    // Action -> WhatsApp transition -> next profile
    await clickButtonContaining(page, ["eclaireur", "partage croise", "pack", "nouvelles", "veille", "mise en relation", "ex-clients"]);
    await clickButtonContaining(page, ["envoyer sur whatsapp"]);
    await clickButtonContaining(page, ["passez au prochain profil"]);
    console.log("[E2E-SMART-SCAN] CTA WhatsApp flow OK");

    // Open history and assert activity is visible
    await clickButtonContaining(page, ["historique"]);
    await ensureText(page, ["historique recent", "filtres"]);
    console.log("[E2E-SMART-SCAN] History panel OK");

    console.log("[E2E-SMART-SCAN] Smart Scan critical flow checks passed.");
  } finally {
    await page.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error("[E2E-SMART-SCAN] Smart Scan critical flow checks failed.");
  console.error(error);
  process.exit(1);
});
