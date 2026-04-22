import puppeteer from "puppeteer";
import fs from "node:fs";
import path from "node:path";

loadEnvFile(".env.local");
loadEnvFile(".env");

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function optional(name) {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : "";
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

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function step(label) {
  console.log(`[E2E-SCOUT-FLOW] STEP ${label}`);
}

async function clickButtonContaining(page, snippets, timeoutMs = 15000) {
  const parts = snippets.map((s) => normalize(s));
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const clicked = await page.evaluate((expectedParts) => {
      const normalizeText = (value) =>
        (value || "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/\s+/g, " ")
          .trim();
      const buttons = Array.from(document.querySelectorAll("button"));
      for (const button of buttons) {
        const text = normalizeText(button.textContent || "");
        if (!text) continue;
        if (expectedParts.some((part) => text.includes(part)) && !button.disabled) {
          button.click();
          return true;
        }
      }
      return false;
    }, parts);
    if (clicked) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Unable to click button containing one of: ${snippets.join(", ")}`);
}

async function ensureText(page, snippets, timeoutMs = 20000) {
  const parts = snippets.map((s) => normalize(s));
  await page.waitForFunction(
    (expectedParts) => {
      const text = (document.body?.textContent || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ");
      return expectedParts.every((part) => text.includes(part));
    },
    { timeout: timeoutMs },
    parts,
  );
}

async function ensureAnyText(page, snippets, timeoutMs = 20000) {
  const parts = snippets.map((s) => normalize(s));
  await page.waitForFunction(
    (expectedParts) => {
      const text = (document.body?.textContent || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ");
      return expectedParts.some((part) => text.includes(part));
    },
    { timeout: timeoutMs },
    parts,
  );
}

async function setInputValue(page, selector, value, timeoutMs = 20000) {
  await page.waitForSelector(selector, { timeout: timeoutMs });
  const written = await page.evaluate(
    (inputSelector, nextValue) => {
      const input = document.querySelector(inputSelector);
      if (!(input instanceof HTMLInputElement)) return false;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      if (!setter) return false;
      setter.call(input, "");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      setter.call(input, String(nextValue));
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    },
    selector,
    value,
  );
  if (!written) {
    throw new Error(`Unable to set input value for selector: ${selector}`);
  }
}

async function login(page, baseUrl, email, password) {
  await page.goto(`${baseUrl}/popey-human/login`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#email");
  await page.waitForSelector("#password");
  await page.type("#email", email);
  await page.type("#password", password);
  const submitted = await page.evaluate(() => {
    const submit = document.querySelector('button[type="submit"]');
    if (!submit || submit.hasAttribute("disabled")) return false;
    submit.click();
    return true;
  });
  if (!submitted) {
    await page.focus("#password");
    await page.keyboard.press("Enter");
  }
  await Promise.race([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => null),
    page
      .waitForFunction(
        () => window.location.href.includes("/popey-human/app"),
        { timeout: 20000 },
      )
      .catch(() => null),
  ]);
  await new Promise((resolve) => setTimeout(resolve, 600));
}

async function loginWithAnyHumanAccount(page, baseUrl) {
  const candidates = [
    { email: optional("HUMAN_E2E_BINOME_EMAIL"), password: optional("HUMAN_E2E_BINOME_PASSWORD"), label: "BINOME" },
    { email: optional("HUMAN_E2E_SELECTED_EMAIL"), password: optional("HUMAN_E2E_SELECTED_PASSWORD"), label: "SELECTED" },
    { email: optional("HUMAN_E2E_SPHERE_EMAIL"), password: optional("HUMAN_E2E_SPHERE_PASSWORD"), label: "SPHERE" },
  ].filter((item) => item.email && item.password);

  if (candidates.length === 0) {
    throw new Error("Missing E2E credentials. Define at least one HUMAN_E2E_*_EMAIL/PASSWORD pair.");
  }

  for (const account of candidates) {
    await login(page, baseUrl, account.email, account.password);
    await page.goto(`${baseUrl}/popey-human/app/eclaireurs`, { waitUntil: "domcontentloaded" });
    const hasAccess = await page
      .waitForFunction(
        () => window.location.href.includes("/popey-human/app/eclaireurs") && Boolean(document.querySelector('input[name="first_name"]')),
        { timeout: 7000 },
      )
      .then(() => true)
      .catch(() => false);
    if (hasAccess) return account.label;
  }

  throw new Error("No configured E2E account can access /popey-human/app/eclaireurs.");
}

async function createScoutAndExtractLink(page, baseUrl) {
  await page.goto(`${baseUrl}/popey-human/app/eclaireurs`, {
    waitUntil: "domcontentloaded",
  });
  try {
    await page.waitForFunction(
      () => {
        const href = window.location.href;
        const hasForm = Boolean(document.querySelector('input[name="first_name"]'));
        return href.includes("/popey-human/app/eclaireurs") && hasForm;
      },
      { timeout: 25000 },
    );
  } catch {
    const debug = await page.evaluate(() => ({
      href: window.location.href,
      text: (document.body?.textContent || "").slice(0, 400),
    }));
    throw new Error(`Eclaireurs page not ready. URL=${debug.href} BODY=${debug.text}`);
  }

  const unique = Date.now().toString().slice(-6);
  await page.type('input[name="first_name"]', `Scout${unique}`);
  await page.type('input[name="last_name"]', "E2E");
  await page.type('input[name="phone"]', `0600${unique}`);
  await page.type('input[name="email"]', `scout-e2e-${unique}@example.com`);
  await clickButtonContaining(page, ["generer le lien eclaireur"], 10000);
  await Promise.race([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => null),
    page.waitForFunction(
      () =>
        Boolean(
          Array.from(document.querySelectorAll("button")).find((button) =>
            ((button.textContent || "").toLowerCase().includes("regenerer lien")),
          ),
        ),
      { timeout: 20000 },
    ).catch(() => null),
  ]);
  const link = await page.evaluate(() => {
    const text = document.body?.textContent || "";
    const shortMatch = text.match(/popey-human\/eclaireur\?code=([A-Z0-9-]{9})/i);
    if (shortMatch) return `/popey-human/eclaireur?code=${shortMatch[1]}`;
    const fullMatch = text.match(/popey-human\/eclaireur\/([a-f0-9]{16,64})/i);
    if (fullMatch) return `/popey-human/eclaireur/${fullMatch[1]}`;
    return "";
  });
  if (!link) throw new Error("Unable to extract scout magic link.");
  return `${baseUrl}${link}`;
}

async function submitReferralFromScout(browser, link) {
  const page = await browser.newPage();
  const unique = Date.now().toString().slice(-6);
  const contactName = `Nicolas Pipeline ${unique}`;
  const contactPhone = `0611${unique}`;
  step("SCOUT_OPEN_LINK");
  await page.goto(link, { waitUntil: "domcontentloaded" });
  try {
    await ensureText(page, ["portail eclaireur"]);
  } catch {
    const debug = await page.evaluate(() => ({
      href: window.location.href,
      text: (document.body?.textContent || "").slice(0, 500),
    }));
    throw new Error(`Scout portal not ready. URL=${debug.href} BODY=${debug.text}`);
  }
  step("SCOUT_OPEN_ALERT_FORM");
  await clickButtonContaining(page, ["alerte"], 10000);
  await page.waitForSelector('input[name="contact_name"]', { timeout: 20000 });
  await page.waitForSelector('input[name="contact_phone"]', { timeout: 20000 });
  await page.waitForSelector('input[name="project_type"]', { timeout: 20000 });
  await page.waitForSelector('textarea[name="comment"]', { timeout: 20000 });
  step("SCOUT_FILL_ALERT_FORM");
  await page.type('input[name="contact_name"]', contactName);
  await page.type('input[name="contact_phone"]', contactPhone);
  await page.type('input[name="project_type"]', "Immo");
  await page.type('textarea[name="comment"]', `E2E pipeline scout ${unique}`);
  step("SCOUT_SUBMIT_ALERT");
  await clickButtonContaining(page, ["lancer mon alerte"], 10000);
  await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => null);
  step("SCOUT_ASSERT_SENT");
  try {
    await ensureAnyText(page, ["alerte envoyee", "opportunite envoyee", contactName], 25000);
  } catch {
    const debug = await page.evaluate(() => ({
      href: window.location.href,
      text: (document.body?.textContent || "").slice(0, 700),
    }));
    throw new Error(`Scout submit confirmation not found. URL=${debug.href} BODY=${debug.text}`);
  }
  return { scoutPage: page, contactName };
}

async function progressReferralAsMember(page, contactName) {
  step("MEMBER_OPEN_ECLAIREURS");
  await page.goto(`${process.env.E2E_BASE_URL || "http://localhost:3000"}/popey-human/app/eclaireurs`, {
    waitUntil: "domcontentloaded",
  });
  await ensureText(page, ["opportunites entrantes"]);
  await ensureText(page, [contactName], 20000);

  step("MEMBER_MARK_RDV");
  await setInputValue(page, 'input[name="estimated_deal_value"]', "12000");
  await clickButtonContaining(page, ["marquer rdv"], 10000);
  await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => null);

  await ensureText(page, [contactName, "statut: rdv"], 20000);
  step("MEMBER_MARK_OFFERED");
  await clickButtonContaining(page, ["marquer offre envoyee"], 10000);
  await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => null);

  await ensureText(page, [contactName, "statut: offre"], 20000);
  step("MEMBER_MARK_SIGNED");
  await setInputValue(page, 'input[name="signed_amount"]', "15000");
  await clickButtonContaining(page, ["marquer signe"], 10000);
  await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => null);
  await ensureText(page, [contactName, "statut: signe"], 20000);
}

async function verifyScoutSync(scoutPage, contactName) {
  step("SCOUT_VERIFY_SYNC");
  await scoutPage.bringToFront();
  await scoutPage.goto(scoutPage.url().split("?")[0] + "?tab=history", { waitUntil: "domcontentloaded" });
  await ensureText(scoutPage, ["historique", contactName, "signe"], 20000);
  await ensureText(scoutPage, ["recu", "rdv", "offre", "signe"], 20000);
}

async function main() {
  const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3000";
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox"],
    protocolTimeout: 120000,
  });
  try {
    const memberPage = await browser.newPage();
    const accountLabel = await loginWithAnyHumanAccount(memberPage, baseUrl);
    console.log(`[E2E-SCOUT-FLOW] Login account: ${accountLabel}`);
    const link = await createScoutAndExtractLink(memberPage, baseUrl);
    const { scoutPage, contactName } = await submitReferralFromScout(browser, link);
    await progressReferralAsMember(memberPage, contactName);
    await verifyScoutSync(scoutPage, contactName);
    console.log("[E2E-SCOUT-FLOW] PASSED");
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error("[E2E-SCOUT-FLOW] FAILED");
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
