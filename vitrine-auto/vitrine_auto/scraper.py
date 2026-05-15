import logging
import re
from pathlib import Path
from typing import Any

from .slug import slugify


log = logging.getLogger(__name__)


PHONE_RE = re.compile(r"(\+33|0)[1-9][\s.\-]?(?:\d{2}[\s.\-]?){4}")
EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[a-z]{2,}", re.IGNORECASE)


async def scrape_website(*, url: str, output_dir: Path, slug_hint: str) -> dict[str, Any]:
  from playwright.async_api import async_playwright

  slug = slugify(slug_hint)
  screenshots_dir = output_dir / "screenshots"
  screenshots_dir.mkdir(parents=True, exist_ok=True)
  screenshot_path = screenshots_dir / f"{slug}.jpg"

  async with async_playwright() as p:
    browser = await p.chromium.launch(headless=True)
    page = await browser.new_page(
      viewport={"width": 1280, "height": 800},
      user_agent="Mozilla/5.0 (compatible; VitrineBot/1.0)",
    )
    await page.goto(url, wait_until="networkidle", timeout=30000)
    await page.wait_for_timeout(1500)

    try:
      await page.screenshot(path=str(screenshot_path), full_page=False, type="jpeg", quality=60)
    except Exception:
      try:
        screenshot_path = screenshots_dir / f"{slug}.png"
        await page.screenshot(path=str(screenshot_path), full_page=False, type="png")
      except Exception:
        screenshot_path = None

    title = await page.title()
    meta_desc = await page.evaluate(
      "() => document.querySelector('meta[name=\"description\"]')?.content || ''"
    )
    text = await page.evaluate("() => document.body?.innerText || ''")

    payload = await page.evaluate(
      """() => {
        const out = { images: [], nav_links: [], logo: "", og_image: "" };

        const og = document.querySelector('meta[property="og:image"]')?.content || "";
        out.og_image = og;

        const logoImg =
          document.querySelector('img[alt*="logo" i]')?.currentSrc ||
          document.querySelector('header img')?.currentSrc ||
          document.querySelector('img')?.currentSrc ||
          "";
        out.logo = logoImg || "";

        const imgUrls = new Set();
        for (const img of Array.from(document.images || [])) {
          const src = (img.currentSrc || img.src || "").trim();
          if (!src) continue;
          if (src.startsWith("data:") || src.startsWith("blob:")) continue;
          imgUrls.add(src);
          if (imgUrls.size >= 40) break;
        }
        if (out.og_image) imgUrls.add(out.og_image);
        if (out.logo) imgUrls.add(out.logo);

        try {
          const nodes = Array.from(document.querySelectorAll("body *")).slice(0, 240);
          for (const el of nodes) {
            const bg = window.getComputedStyle(el).backgroundImage || "";
            if (!bg || bg === "none") continue;
            const match = bg.match(/url\\(["']?(https?:\\/\\/[^"')]+)["']?\\)/i);
            if (match && match[1]) imgUrls.add(match[1]);
            if (imgUrls.size >= 50) break;
          }
        } catch (e) {}

        out.images = Array.from(imgUrls).slice(0, 40);

        const navSet = new Set();
        const navNodes = Array.from(document.querySelectorAll("nav a, header a, [role='navigation'] a")).slice(0, 80);
        for (const a of navNodes) {
          const label = (a.textContent || "").trim().replace(/\\s+/g, " ");
          const href = (a.getAttribute("href") || "").trim();
          if (!label || label.length > 60) continue;
          if (!href) continue;
          if (href.startsWith("mailto:") || href.startsWith("tel:")) continue;
          const key = `${label}@@${href}`;
          if (navSet.has(key)) continue;
          navSet.add(key);
          out.nav_links.push({ label, href });
          if (out.nav_links.length >= 12) break;
        }

        return out;
      }"""
    )

    await browser.close()

  phone_match = PHONE_RE.search(text or "")
  email_match = EMAIL_RE.search(text or "")

  return {
    "url": url,
    "title": str(title or "").strip(),
    "meta_desc": str(meta_desc or "").strip(),
    "text": str(text or "")[:12000],
    "images": [str(x).strip() for x in ((payload or {}).get("images") or []) if str(x).strip()],
    "nav_links": (payload or {}).get("nav_links") or [],
    "logo": str((payload or {}).get("logo") or "").strip(),
    "phone": phone_match.group(0).strip() if phone_match else "",
    "email": email_match.group(0).strip() if email_match else "",
    "screenshot_path": str(screenshot_path) if screenshot_path else "",
  }
