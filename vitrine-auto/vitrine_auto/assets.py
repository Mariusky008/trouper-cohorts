import hashlib
import logging
import mimetypes
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import aiohttp


log = logging.getLogger(__name__)


ALLOWED_MIME_PREFIXES = ("image/",)


def _guess_ext(content_type: str, url: str) -> str:
  mime = str(content_type or "").split(";")[0].strip().lower()
  if mime:
    ext = mimetypes.guess_extension(mime) or ""
    if ext:
      return ext
  path = urlparse(url).path
  if "." in path:
    suffix = "." + path.split(".")[-1].lower()
    if 1 < len(suffix) <= 6:
      return suffix
  return ".bin"


def _safe_name(url: str) -> str:
  h = hashlib.sha256(url.encode("utf-8")).hexdigest()[:16]
  return f"img-{h}"


async def download_assets(
  *,
  urls: list[str],
  output_dir: Path,
  limit: int = 12,
  max_bytes: int = 4_000_000,
) -> list[dict[str, Any]]:
  assets_dir = output_dir / "assets"
  assets_dir.mkdir(parents=True, exist_ok=True)

  selected = [u for u in urls if u and u.startswith("http")][: max(limit, 0)]
  results: list[dict[str, Any]] = []
  if not selected:
    return results

  timeout = aiohttp.ClientTimeout(total=25)
  async with aiohttp.ClientSession(timeout=timeout) as session:
    for url in selected:
      try:
        async with session.get(url, allow_redirects=True, headers={"User-Agent": "Mozilla/5.0"}) as r:
          if r.status != 200:
            continue
          content_type = str(r.headers.get("content-type") or "").strip().lower()
          if content_type and not content_type.startswith(ALLOWED_MIME_PREFIXES):
            continue
          content = await r.read()
          if not content or len(content) > max_bytes:
            continue
          ext = _guess_ext(content_type, url)
          file_name = _safe_name(url) + ext
          path = assets_dir / file_name
          path.write_bytes(content)
          results.append({"source_url": url, "file_name": file_name, "relative_path": f"assets/{file_name}"})
      except Exception as e:
        log.info("Asset download skipped: %s (%s)", url, str(e)[:120])

  return results

