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

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

async function isLoginScreen(page) {
  const text = await page.evaluate(() => (document.body?.textContent || "").toLowerCase());
  return text.includes("se connecter") && text.includes("mot de passe");
}

async function login(page, baseUrl, email, password) {
  await page.goto(`${baseUrl}/popey-human/login`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#email", { timeout: 20000 });
  await page.type("#email", email, { delay: 10 });
  await page.type("#password", password, { delay: 10 });
  const submitted = await page.evaluate(() => {
    const normalize = (value) =>
      (value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
    const buttons = Array.from(document.querySelectorAll("button"));
    for (const button of buttons) {
      const text = normalize(button.textContent || "");
      if (text.includes("se connecter") && !(button).disabled) {
        button.click();
        return true;
      }
    }
    return false;
  });
  if (!submitted) {
    await page.focus("#password");
    await page.keyboard.press("Enter");
  }
  await Promise.race([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => null),
    page
      .waitForFunction(
        () => {
          const href = window.location.href;
          return href.includes("/popey-human/app") || href.includes("/popey-human/entrepreneur-smart-scan-test");
        },
        { timeout: 20000 },
      )
      .catch(() => null),
  ]);
  await new Promise((resolve) => setTimeout(resolve, 600));
}

async function main() {
  const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3000";
  const email = required("HUMAN_E2E_SPHERE_EMAIL");
  const password = required("HUMAN_E2E_SPHERE_PASSWORD");

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(90000);
  page.setDefaultTimeout(90000);

  let alliancesSearchResponse = null;
  page.on("response", async (response) => {
    const request = response.request();
    const url = response.url();
    if (!url.includes("/api/popey-human/smart-scan/alliances/search")) return;
    if (request.method() !== "POST") return;
    if (alliancesSearchResponse) return;
    let body = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    alliancesSearchResponse = { status: response.status(), body };
  });

  try {
    await login(page, baseUrl, email, password);
    if (await isLoginScreen(page)) {
      throw new Error("Login failed: still on login screen.");
    }

    await page.goto(`${baseUrl}/popey-human/entrepreneur-smart-scan-test?panel=alliances`, { waitUntil: "domcontentloaded" });

    await page.waitForFunction(
      () => (document.body?.textContent || "").toLowerCase().includes("trouver mes"),
      { timeout: 20000 },
    );

    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="Ajoute tes metiers cibles"]');
      if (!input) return;
      input.focus();
      input.value = "Agent immobilier, Consultant marketing";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const clicked = await page.evaluate(() => {
      const normalize = (value) =>
        (value || "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/\s+/g, " ")
          .trim();
      const buttons = Array.from(document.querySelectorAll("button"));
      for (const button of buttons) {
        const text = normalize(button.textContent || "");
        if (!text) continue;
        if (!text.includes("trouver mes")) continue;
        if ((button).disabled) continue;
        button.click();
        return true;
      }
      return false;
    });
    if (!clicked) {
      throw new Error("Unable to click 'Trouver mes ...' button on Alliances panel.");
    }

    const deadline = Date.now() + 35000;
    while (!alliancesSearchResponse && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    if (!alliancesSearchResponse) {
      throw new Error("Alliances search was not triggered (no POST /alliances/search observed after click).");
    }

    console.log("[E2E-ALLIANCES] Manual search triggered:", JSON.stringify(alliancesSearchResponse));
  } finally {
    await page.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error("[E2E-ALLIANCES] Checks failed.");
  console.error(error);
  process.exit(1);
});
