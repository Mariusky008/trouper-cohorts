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


async def search_businesses(
  *, query: str, location: str | None, token: str, max_rating: float, max_results: int
) -> list[dict[str, Any]]:
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

  run_mode = env("APIFY_RUN_MODE", "async")
  actor_max_results = max_results * 3
  if run_mode == "sync_dataset":
    items = await _run_sync_get_dataset_items(
      token=token, query=query, location=location, max_results=actor_max_results
    )
  else:
    run_id = await _start_run(token=token, query=query, location=location, max_results=actor_max_results)
    timeout_s = int(env("APIFY_TIMEOUT_S", "900") or "900")
    poll_interval_s = int(env("APIFY_POLL_INTERVAL_S", "8") or "8")
    items = await _wait_for_results(token=token, run_id=run_id, timeout_s=timeout_s, poll_interval_s=poll_interval_s)

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


def _normalize_actor_id(raw_actor_id: str) -> str:
  actor_id = raw_actor_id
  if "/" in actor_id and "~" not in actor_id:
    parts = actor_id.split("/")
    if len(parts) >= 2:
      actor_id = f"{parts[0]}~{'/'.join(parts[1:])}"
  return actor_id


def _as_bool(value: str) -> bool:
  return str(value or "").strip().lower() in ("1", "true", "yes", "y", "on")


def _build_actor_input(*, query: str, location: str | None, max_results: int) -> dict[str, Any]:
  input_mode = env("APIFY_INPUT_MODE", "searchQueries")
  language = env("APIFY_LANGUAGE", "en")
  if input_mode == "datapilot":
    actor_limit = max(1, min(30, max_results))
    use_proxy = _as_bool(env("APIFY_USE_PROXY", "false"))
    proxy_groups_raw = env("APIFY_PROXY_GROUPS", "RESIDENTIAL")
    proxy_groups = [g.strip() for g in proxy_groups_raw.split(",") if g.strip()]
    return {
      "query": query,
      "location": (location or "France").strip(),
      "limit": actor_limit,
      "useApifyProxy": use_proxy,
      "apifyProxyGroups": proxy_groups if use_proxy else [],
    }

  actor_max_results = max(50, max_results)
  if input_mode == "legacy":
    return {
      "searchStringsArray": [f"{query} {location}".strip() if location else query],
      "maxCrawledPlacesPerSearch": actor_max_results,
      "language": language,
      "countryCode": "FR",
      "includeWebResults": True,
      "additionalInfo": True,
    }
  return {
    "searchQueries": [f"{query} {location}".strip() if location else query],
    "maxResults": actor_max_results,
    "language": language,
  }


async def _start_run(*, token: str, query: str, location: str | None, max_results: int) -> str:
  actor_input = _build_actor_input(query=query, location=location, max_results=max_results)

  input_mode = env("APIFY_INPUT_MODE", "searchQueries")
  default_actor_id = "datapilot/google-maps-scraper" if input_mode == "datapilot" else "futurizerush/google-maps-scraper"
  actor_id = env("APIFY_ACTOR_ID", default_actor_id)
  actor_id = env("APIFY_ACTOR_ID", "futurizerush/google-maps-scraper")
  normalized_actor_id = _normalize_actor_id(actor_id)
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

async def _run_sync_get_dataset_items(
  *, token: str, query: str, location: str | None, max_results: int
) -> list[dict[str, Any]]:
  actor_input = _build_actor_input(query=query, location=location, max_results=max_results)

  input_mode = env("APIFY_INPUT_MODE", "searchQueries")
  default_actor_id = "datapilot/google-maps-scraper" if input_mode == "datapilot" else "futurizerush/google-maps-scraper"
  actor_id = env("APIFY_ACTOR_ID", default_actor_id)
  actor_id = env("APIFY_ACTOR_ID", "futurizerush/google-maps-scraper")
  normalized_actor_id = _normalize_actor_id(actor_id)
  actor_id_encoded = aiohttp.helpers.quote(normalized_actor_id, safe="~")

  timeout_s = int(env("APIFY_TIMEOUT_S", "900") or "900")
  headers = {"Authorization": f"Bearer {token}"}
  async with aiohttp.ClientSession(headers=headers) as session:
    async with session.post(
      url,
      json=actor_input,
      params={"token": token, "timeout": str(timeout_s)},
      timeout=aiohttp.ClientTimeout(total=timeout_s + 30),
    ) as r:
      if r.status != 200:
        raw = await r.text()
        raise RuntimeError(f"Apify sync error {r.status}: {raw[:300]}")
      items = await r.json()
      return items if isinstance(items, list) else []


async def _wait_for_results(
  *, token: str, run_id: str, timeout_s: int = 900, poll_interval_s: int = 8
) -> list[dict[str, Any]]:
  status_url = f"https://api.apify.com/v2/actor-runs/{run_id}"
  dataset_url = f"{status_url}/dataset/items"
  headers = {"Authorization": f"Bearer {token}"}

  elapsed = 0
  async with aiohttp.ClientSession(headers=headers) as session:
    while elapsed < timeout_s:
      await asyncio.sleep(poll_interval_s)
      elapsed += poll_interval_s
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
