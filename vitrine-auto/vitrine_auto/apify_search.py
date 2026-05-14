import asyncio
import logging
from datetime import datetime
from typing import Any

import aiohttp

from .config import env
from .slug import slugify


log = logging.getLogger(__name__)


def _as_float(value: Any) -> float | None:
  try:
    return float(value)
  except Exception:
    return None


async def search_businesses(*, query: str, token: str, max_rating: float, max_results: int) -> list[dict[str, Any]]:
  if not token:
    return [
      {
        "slug": "demo-boulangerie",
        "name": "Boulangerie Test",
        "website": "https://example.com",
        "phone": "0558000001",
        "email": "",
        "address": "Dax 40100",
        "rating": 3.1,
        "reviews_count": 42,
        "category": "Boulangerie",
        "scraped_at": datetime.now().isoformat(),
      }
    ]

  run_id = await _start_run(token=token, query=query, max_results=max_results * 3)
  items = await _wait_for_results(token=token, run_id=run_id)

  results: list[dict[str, Any]] = []
  for item in items:
    rating = _as_float(item.get("totalScore") or item.get("rating"))
    if rating is None or rating > max_rating:
      continue

    website = str(item.get("website") or item.get("url") or "").strip()
    if not website or not website.startswith("http"):
      continue

    name = str(item.get("title") or item.get("name") or "").strip() or "Entreprise"
    phone = str(
      item.get("phone")
      or item.get("phoneUnformatted")
      or item.get("internationalPhoneNumber")
      or ""
    ).strip()

    results.append(
      {
        "slug": slugify(name),
        "name": name,
        "website": website,
        "phone": phone,
        "email": str(item.get("email") or "").strip(),
        "address": str(item.get("address") or "").strip(),
        "rating": rating,
        "reviews_count": int(item.get("reviewsCount") or 0),
        "category": str(item.get("categoryName") or "").strip(),
        "scraped_at": datetime.now().isoformat(),
      }
    )
    if len(results) >= max_results:
      break

  return results


async def _start_run(*, token: str, query: str, max_results: int) -> str:
  input_mode = env("APIFY_INPUT_MODE", "searchQueries")
  actor_max_results = max(50, max_results)
  language = env("APIFY_LANGUAGE", "en")
  if input_mode == "legacy":
    actor_input = {
      "searchStringsArray": [query],
      "maxCrawledPlacesPerSearch": actor_max_results,
      "language": language,
      "countryCode": "FR",
      "includeWebResults": True,
      "additionalInfo": True,
    }
  else:
    actor_input = {
      "searchQueries": [query],
      "maxResults": actor_max_results,
      "language": language,
    }

  actor_id = env("APIFY_ACTOR_ID", "futurizerush/google-maps-scraper")
  normalized_actor_id = actor_id
  if "/" in normalized_actor_id and "~" not in normalized_actor_id:
    parts = normalized_actor_id.split("/")
    if len(parts) >= 2:
      normalized_actor_id = f"{parts[0]}~{'/'.join(parts[1:])}"

  actor_id_encoded = aiohttp.helpers.quote(normalized_actor_id, safe="~")
  url = f"https://api.apify.com/v2/acts/{actor_id_encoded}/runs"
  async with aiohttp.ClientSession() as session:
    async with session.post(
      url,
      json=actor_input,
      headers={"Authorization": f"Bearer {token}"},
      params={"token": token},
      timeout=aiohttp.ClientTimeout(total=30),
    ) as r:
      if r.status not in (200, 201):
        raw = await r.text()
        raise RuntimeError(f"Apify start error {r.status}: {raw[:300]}")
      data = await r.json()
      return str(data["data"]["id"])


async def _wait_for_results(*, token: str, run_id: str, timeout_s: int = 300) -> list[dict[str, Any]]:
  status_url = f"https://api.apify.com/v2/actor-runs/{run_id}"
  dataset_url = f"{status_url}/dataset/items"
  headers = {"Authorization": f"Bearer {token}"}

  elapsed = 0
  async with aiohttp.ClientSession(headers=headers) as session:
    while elapsed < timeout_s:
      await asyncio.sleep(8)
      elapsed += 8
      async with session.get(status_url, timeout=aiohttp.ClientTimeout(total=30)) as r:
        data = await r.json()
        status = str(data.get("data", {}).get("status", ""))
      if status:
        log.info("Apify run %s: %s (%ss)", run_id, status, elapsed)
      if status == "SUCCEEDED":
        async with session.get(
          dataset_url,
          params={"format": "json", "clean": "true"},
          timeout=aiohttp.ClientTimeout(total=60),
        ) as r:
          items = await r.json()
          return items if isinstance(items, list) else []
      if status in ("FAILED", "TIMED-OUT", "ABORTED"):
        raise RuntimeError(f"Apify run failed: {status}")

  raise TimeoutError(f"Apify timeout après {timeout_s}s")
