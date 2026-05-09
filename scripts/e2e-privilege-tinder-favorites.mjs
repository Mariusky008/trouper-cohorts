import puppeteer from "puppeteer";
import fs from "node:fs";
import path from "node:path";

loadEnvFile(".env.local");
loadEnvFile(".env");

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

async function waitForSwipeReady(page) {
  await page.waitForFunction(
    () => document.documentElement.getAttribute("data-live-ready") === "1",
    { timeout: 90000 }
  );
  await page.waitForSelector("#swipeOverlay.open", { timeout: 25000 });
  await page.waitForSelector("#swipeSaveBtn", { timeout: 25000 });
}

async function main() {
  const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3000";
  const url = `${baseUrl}/popey-privilege-catalogue.html?ville=dax&mode=swipe`;

  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(90000);
    page.setDefaultTimeout(90000);

    const favoritesEndpoint = "/api/popey-human/privilege/favorites";
    let serverFavoriteIds = [];
    await page.setRequestInterception(true);
    page.on("request", async (req) => {
      try {
        const reqUrl = req.url();
        if (!reqUrl.includes(favoritesEndpoint)) {
          req.continue();
          return;
        }
        if (req.method() === "GET") {
          req.respond({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ favorites: serverFavoriteIds }),
          });
          return;
        }
        if (req.method() === "POST") {
          const data = req.postData() || "";
          const parsed = data ? JSON.parse(data) : {};
          serverFavoriteIds = Array.isArray(parsed.placeIds) ? parsed.placeIds : [];
          req.respond({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true, favorites: serverFavoriteIds }),
          });
          return;
        }
        req.respond({ status: 405, contentType: "application/json", body: JSON.stringify({ error: "method" }) });
      } catch {
        req.respond({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "mock_failed" }) });
      }
    });

    await page.goto(url, { waitUntil: "domcontentloaded" });
    await waitForSwipeReady(page);

    await page.click("#swipeSaveBtn");
    await page.waitForFunction(() => {
      const el = document.getElementById("swipeFavCount");
      return el && el.textContent && el.textContent.trim() === "1";
    });

    await page.click("#swipeLikeBtn");
    await page.waitForSelector("#swipeActivateOverlay.open", { timeout: 10000 });
    await page.click(".swp-activate-cancel");
    await page.waitForFunction(() => {
      const overlay = document.getElementById("swipeActivateOverlay");
      return overlay && !overlay.classList.contains("open");
    });

    await page.click("#swipeFavBtn");
    await page.waitForSelector("#swipeFavsOverlay.open", { timeout: 10000 });
    await page.waitForSelector(".js-fav-activate", { timeout: 10000 });
    await page.click(".js-fav-activate");
    await page.waitForSelector("#clientLeadOverlay.open", { timeout: 15000 });

    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
    });

    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForSwipeReady(page);
    await page.waitForFunction(() => {
      const el = document.getElementById("swipeFavCount");
      return el && el.textContent && el.textContent.trim() === "1";
    });

    console.log("[E2E] Privilege Tinder favorites + persistence checks passed.");
    await page.close();
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error("[E2E] Privilege Tinder favorites checks failed.");
  console.error(error);
  process.exit(1);
});
