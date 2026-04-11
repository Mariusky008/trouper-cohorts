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
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

async function login(page, baseUrl, email, password) {
  await page.goto(`${baseUrl}/popey-human/login`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#email");
  await page.waitForSelector("#password");
  await page.type("#email", email);
  await page.type("#password", password);

  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    page.click('button[type="submit"]'),
  ]);
}

async function assertPageHas(page, baseUrl, route, expectedStrings) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    (snippets) => {
      const text = document.body?.textContent || "";
      return snippets.every((snippet) => text.includes(snippet));
    },
    {},
    expectedStrings
  );
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
    console.log("[E2E-RADAR] Login OK");

    await assertPageHas(page, baseUrl, "/popey-human/app/cash", ["Cash", "Mouvement manuel"]);
    console.log("[E2E-RADAR] Cash page OK");

    await assertPageHas(page, baseUrl, "/popey-human/app/cash?modal=events", ["Historique entrées / sorties"]);
    console.log("[E2E-RADAR] Cash modal events OK");

    await assertPageHas(page, baseUrl, "/popey-human/app/notifications", ["Centre de notifications"]);
    console.log("[E2E-RADAR] Notifications page OK");

    await assertPageHas(page, baseUrl, "/popey-human/app/signal?signalFilter=open", ["Signal", "Mode Talkie-Walkie", "Actifs"]);
    console.log("[E2E-RADAR] Signal page + filters OK");

    console.log("[E2E-RADAR] Popey Human radar checks passed.");
  } finally {
    await page.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error("[E2E-RADAR] Popey Human radar checks failed.");
  console.error(error);
  process.exit(1);
});
