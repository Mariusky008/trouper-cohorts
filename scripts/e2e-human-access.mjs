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

async function loginAndCheckScope(browser, baseUrl, account) {
  const context =
    typeof browser.createBrowserContext === "function" ? await browser.createBrowserContext() : null;
  const page = context ? await context.newPage() : await browser.newPage();
  page.setDefaultNavigationTimeout(90000);
  page.setDefaultTimeout(90000);
  try {
    await page.goto(`${baseUrl}/popey-human/login`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#email");
    await page.waitForSelector("#password");
    await page.type("#email", account.email);
    await page.type("#password", account.password);

    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      page.click('button[type="submit"]'),
    ]);

    await page.goto(`${baseUrl}/popey-human/app/annuaire`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => {
      const text = document.body?.textContent || "";
      return text.includes("Annuaire") && text.includes("Mode actif:");
    });

    const modeText = await page.$eval("body", (root) => root.textContent || "");
    if (!modeText.includes(`Mode actif: ${account.expectedMode}`)) {
      throw new Error(
        `Unexpected mode for ${account.label}. Expected ${account.expectedMode}.`
      );
    }

    const visibleMembers = await page.$$eval(
      'a[href^="/popey-human/app/annuaire?member="]',
      (nodes) => nodes.length
    );

    console.log(
      `[E2E] ${account.label} -> mode=${account.expectedMode}, visibleMembers=${visibleMembers}`
    );

    const minimum = Number(account.minVisibleMembers || "0");
    if (Number.isFinite(minimum) && minimum > 0 && visibleMembers < minimum) {
      throw new Error(
        `Not enough visible members for ${account.label}: got ${visibleMembers}, expected >= ${minimum}`
      );
    }

    return { mode: account.expectedMode, visibleMembers };
  } finally {
    if (context) {
      await context.close();
    } else {
      await page.close();
    }
  }
}

async function main() {
  const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3000";
  const accounts = [
    {
      label: "BINOME",
      email: required("HUMAN_E2E_BINOME_EMAIL"),
      password: required("HUMAN_E2E_BINOME_PASSWORD"),
      expectedMode: "BINOME_ONLY",
      minVisibleMembers: process.env.HUMAN_E2E_BINOME_MIN_MEMBERS || "0",
    },
    {
      label: "SELECTED",
      email: required("HUMAN_E2E_SELECTED_EMAIL"),
      password: required("HUMAN_E2E_SELECTED_PASSWORD"),
      expectedMode: "SELECTED_MEMBERS",
      minVisibleMembers: process.env.HUMAN_E2E_SELECTED_MIN_MEMBERS || "0",
    },
    {
      label: "SPHERE",
      email: required("HUMAN_E2E_SPHERE_EMAIL"),
      password: required("HUMAN_E2E_SPHERE_PASSWORD"),
      expectedMode: "SPHERE_FULL",
      minVisibleMembers: process.env.HUMAN_E2E_SPHERE_MIN_MEMBERS || "0",
    },
  ];

  const browser = await puppeteer.launch({ headless: true });
  try {
    const results = [];
    for (const account of accounts) {
      results.push(await loginAndCheckScope(browser, baseUrl, account));
    }

    if (
      results[0].visibleMembers > results[1].visibleMembers ||
      results[1].visibleMembers > results[2].visibleMembers
    ) {
      throw new Error(
        "Access monotonicity failed: BINOME <= SELECTED <= SPHERE is not respected."
      );
    }

    console.log("[E2E] Human access scope checks passed.");
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error("[E2E] Human access scope checks failed.");
  console.error(error);
  process.exit(1);
});
