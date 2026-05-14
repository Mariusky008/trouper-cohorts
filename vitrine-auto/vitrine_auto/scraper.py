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
      screenshot_path = None

    title = await page.title()
    meta_desc = await page.evaluate(
      "() => document.querySelector('meta[name=\"description\"]')?.content || ''"
    )
    text = await page.evaluate("() => document.body?.innerText || ''")

    images = await page.evaluate(
      """() =>
        Array.from(document.images)
          .map(i => i.currentSrc || i.src)
          .filter(s => s && !s.startsWith('data:'))
          .slice(0, 30)
      """
    )

    await browser.close()

  phone_match = PHONE_RE.search(text or "")
  email_match = EMAIL_RE.search(text or "")

  return {
    "url": url,
    "title": str(title or "").strip(),
    "meta_desc": str(meta_desc or "").strip(),
    "text": str(text or "")[:12000],
    "images": [str(x).strip() for x in (images or []) if str(x).strip()],
    "phone": phone_match.group(0).strip() if phone_match else "",
    "email": email_match.group(0).strip() if email_match else "",
    "screenshot_path": str(screenshot_path) if screenshot_path else "",
  }

