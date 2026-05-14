import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any

from .apify_search import search_businesses
from .assets import download_assets
from .config import env
from .quality_gate import run_quality_gate
from .scraper import scrape_website
from .site_generator import generate_site
from .slug import slugify
from .supabase_uploader import upload_directory, upsert_vitrine_site


log = logging.getLogger(__name__)


def _setup_logging():
  logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()],
  )


async def run_pipeline(
  *, ville: str, categorie: str, queries: list[str], batch_size: int, max_rating: float, dry_run: bool
) -> None:
  _setup_logging()

  output_root = Path(__file__).resolve().parents[1] / "output"
  output_root.mkdir(parents=True, exist_ok=True)

  token = env("APIFY_TOKEN")
  anthropic_api_key = env("ANTHROPIC_API_KEY")
  bucket = env("SUPABASE_VITRINES_BUCKET", "vitrines")

  queries_raw = env("QUERIES")
  effective_queries = [q.strip() for q in queries if str(q or "").strip()]
  if not effective_queries and queries_raw:
    effective_queries = [q.strip() for q in queries_raw.split(",") if q.strip()]
  if not effective_queries:
    effective_queries = [categorie]

  businesses: list[dict[str, Any]] = []
  seen_websites: set[str] = set()
  seen_place_ids: set[str] = set()

  for q in effective_queries:
    remaining = batch_size - len(businesses)
    if remaining <= 0:
      break

    found = await search_businesses(
      query=q,
      location=ville,
      token=token,
      max_rating=max_rating,
      max_results=remaining,
    )

    for biz in found:
      website = str(biz.get("website") or "").strip()
      place_id = str(biz.get("place_id") or "").strip()
      if place_id and place_id in seen_place_ids:
        continue
      if website and website in seen_websites:
        continue
      if website:
        seen_websites.add(website)
      if place_id:
        seen_place_ids.add(place_id)
      businesses.append(biz)
      if len(businesses) >= batch_size:
        break

  if not businesses:
    log.info("Aucune entreprise trouvée.")
    return

  def unique_slug(base: str, biz: dict[str, Any]) -> str:
    base_slug = base or "vitrine"
    suffix = ""
    place_id = str(biz.get("place_id") or "").strip()
    website = str(biz.get("website") or "").strip()
    if place_id:
      suffix = place_id[-6:].lower()
    elif website:
      suffix = slugify(website.replace("https://", "").replace("http://", ""))[:6]

    candidate = base_slug
    if (output_root / candidate).exists() and suffix:
      candidate = f"{base_slug}-{suffix}"
    return candidate

  for biz in businesses:
    base_slug = str(biz.get("slug") or "").strip()
    slug = unique_slug(base_slug, biz)
    site_dir = output_root / slug
    site_dir.mkdir(parents=True, exist_ok=True)

    meta: dict[str, Any] = {"generated_at": datetime.now().isoformat()}

    try:
      scraped = await scrape_website(url=str(biz["website"]), output_dir=site_dir, slug_hint=slug)
      (site_dir / "scraped.json").write_text(json.dumps(scraped, ensure_ascii=False, indent=2), encoding="utf-8")

      assets = await download_assets(urls=list(scraped.get("images") or []), output_dir=site_dir)
      meta["assets"] = assets

      html = await generate_site(scraped=scraped, biz=biz, assets=assets, api_key=anthropic_api_key)
      html_path = site_dir / "index.html"
      html_path.write_text(html, encoding="utf-8")

      scraped_for_gate = dict(scraped)
      if not str(scraped_for_gate.get("phone") or "").strip():
        scraped_for_gate["phone"] = str(biz.get("phone") or "").strip()
      if not str(scraped_for_gate.get("email") or "").strip():
        scraped_for_gate["email"] = str(biz.get("email") or "").strip()

      gate = run_quality_gate(scraped=scraped_for_gate, html_path=html_path, assets_dir=site_dir / "assets")
      if not gate.passed:
        await upsert_vitrine_site(
          slug=slug,
          business_name=str(biz.get("name") or ""),
          city=str(ville or ""),
          category=str(biz.get("search_query") or categorie or ""),
          source_website=str(biz.get("website") or ""),
          status="error",
          storage_prefix=slug,
          error_reason=gate.reason,
          metadata=meta,
        )
        log.info("Gate KO %s: %s", slug, gate.reason)
        continue

      if dry_run:
        await upsert_vitrine_site(
          slug=slug,
          business_name=str(biz.get("name") or ""),
          city=str(ville or ""),
          category=str(biz.get("search_query") or categorie or ""),
          source_website=str(biz.get("website") or ""),
          status="generated",
          storage_prefix=slug,
          error_reason=None,
          metadata=meta,
        )
        log.info("Dry-run OK %s", slug)
        continue

      await upload_directory(bucket=bucket, storage_prefix=slug, local_dir=site_dir)
      await upsert_vitrine_site(
        slug=slug,
        business_name=str(biz.get("name") or ""),
        city=str(ville or ""),
        category=str(biz.get("search_query") or categorie or ""),
        source_website=str(biz.get("website") or ""),
        status="uploaded",
        storage_prefix=slug,
        error_reason=None,
        metadata=meta,
      )
      log.info("Uploaded %s", slug)
    except Exception as e:
      await upsert_vitrine_site(
        slug=slug,
        business_name=str(biz.get("name") or ""),
        city=str(ville or ""),
        category=str(biz.get("search_query") or categorie or ""),
        source_website=str(biz.get("website") or ""),
        status="error",
        storage_prefix=slug,
        error_reason=str(e)[:250],
        metadata=meta,
      )
      log.info("Error %s: %s", slug, str(e)[:250])
