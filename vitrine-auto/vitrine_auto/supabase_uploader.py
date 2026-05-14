import json
import logging
from pathlib import Path
from typing import Any

import aiohttp

from .config import required_env, supabase_url, vitrine_public_base_url


log = logging.getLogger(__name__)


def _base(url: str) -> str:
  return str(url or "").rstrip("/")


async def upsert_vitrine_site(
  *,
  slug: str,
  business_name: str,
  city: str,
  category: str,
  source_website: str,
  whatsapp_phone_e164: str | None,
  status: str,
  storage_prefix: str,
  error_reason: str | None,
  metadata: dict[str, Any],
) -> None:
  base = _base(supabase_url())
  if not base:
    raise RuntimeError("Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)")
  service_key = required_env("SUPABASE_SERVICE_ROLE_KEY")

  url = f"{base}/rest/v1/human_vitrine_sites?on_conflict=slug"
  headers = {
    "apikey": service_key,
    "Authorization": f"Bearer {service_key}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates,return=minimal",
  }

  public_url = f"{vitrine_public_base_url()}/{slug}"
  row = {
    "slug": slug,
    "business_name": business_name,
    "city": city,
    "category": category,
    "source_website": source_website,
    "whatsapp_phone_e164": whatsapp_phone_e164,
    "status": status,
    "public_url": public_url,
    "storage_prefix": storage_prefix,
    "error_reason": error_reason,
    "metadata": metadata or {},
  }

  async with aiohttp.ClientSession() as session:
    async with session.post(url, headers=headers, data=json.dumps([row])) as r:
      if r.status not in (200, 201, 204):
        raw = await r.text()
        raise RuntimeError(f"Supabase upsert error {r.status}: {raw[:500]}")


async def fetch_queued_vitrine_sites(*, limit: int) -> list[dict[str, Any]]:
  base = _base(supabase_url())
  if not base:
    raise RuntimeError("Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)")
  service_key = required_env("SUPABASE_SERVICE_ROLE_KEY")

  url = f"{base}/rest/v1/human_vitrine_sites"
  headers = {
    "apikey": service_key,
    "Authorization": f"Bearer {service_key}",
    "Accept": "application/json",
  }
  params = {
    "status": "eq.queued",
    "select": "id,slug,business_name,city,category,source_website,whatsapp_phone_e164,metadata,created_at",
    "order": "created_at.asc",
    "limit": str(max(1, int(limit or 1))),
  }

  async with aiohttp.ClientSession() as session:
    async with session.get(url, headers=headers, params=params) as r:
      if r.status != 200:
        raw = await r.text()
        raise RuntimeError(f"Supabase fetch queued error {r.status}: {raw[:500]}")
      data = await r.json()
      return data if isinstance(data, list) else []


async def upload_directory(*, bucket: str, storage_prefix: str, local_dir: Path) -> None:
  base = _base(supabase_url())
  if not base:
    raise RuntimeError("Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)")
  service_key = required_env("SUPABASE_SERVICE_ROLE_KEY")

  async def upload_file(session: aiohttp.ClientSession, rel_path: str, file_path: Path):
    url = f"{base}/storage/v1/object/{bucket}/{storage_prefix}/{rel_path}"
    headers = {
      "apikey": service_key,
      "Authorization": f"Bearer {service_key}",
      "x-upsert": "true",
      "Content-Type": "application/octet-stream",
    }
    data = file_path.read_bytes()
    async with session.post(url, headers=headers, data=data) as r:
      if r.status not in (200, 201):
        raw = await r.text()
        raise RuntimeError(f"Supabase upload error {r.status}: {raw[:400]}")

  files: list[tuple[str, Path]] = []
  for path in local_dir.rglob("*"):
    if not path.is_file():
      continue
    rel_path = str(path.relative_to(local_dir)).replace("\\", "/")
    files.append((rel_path, path))

  timeout = aiohttp.ClientTimeout(total=120)
  async with aiohttp.ClientSession(timeout=timeout) as session:
    for rel_path, file_path in files:
      await upload_file(session, rel_path, file_path)
