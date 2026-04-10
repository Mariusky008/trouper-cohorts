import puppeteer from "puppeteer";

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function loginAndCheckScope(browser, baseUrl, account) {
  const page = await browser.newPage();
  try {
    await page.goto(`${baseUrl}/popey-human/login`, { waitUntil: "networkidle2" });
    await page.type("#email", account.email);
    await page.type("#password", account.password);

    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2" }),
      page.click('button[type="submit"]'),
    ]);

    await page.goto(`${baseUrl}/popey-human/app/annuaire`, { waitUntil: "networkidle2" });

    const modeText = await page.$eval("main", (root) => root.textContent || "");
    if (!modeText.includes(`Mode actif: ${account.expectedMode}`)) {
      throw new Error(
        `Unexpected mode for ${account.label}. Expected ${account.expectedMode}.`
      );
    }

    const visibleMembers = await page.$$eval("p", (nodes) =>
      nodes.filter((node) => (node.textContent || "").startsWith("Métier:")).length
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
    await page.close();
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
