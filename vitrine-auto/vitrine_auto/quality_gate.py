from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class GateResult:
  passed: bool
  reason: str


def run_quality_gate(*, scraped: dict, html_path: Path, assets_dir: Path) -> GateResult:
  phone = str(scraped.get("phone") or "").strip()
  email = str(scraped.get("email") or "").strip()
  text = str(scraped.get("text") or "")
  title = str(scraped.get("title") or "").strip()

  if not phone and not email:
    return GateResult(False, "missing_contact")
  if len(text.strip()) < 800 and not title:
    return GateResult(False, "too_little_content")
  if not html_path.exists():
    return GateResult(False, "missing_html")

  size = html_path.stat().st_size
  if size < 20_000:
    return GateResult(False, "html_too_small")
  if size > 350_000:
    return GateResult(False, "html_too_big")

  assets_count = 0
  if assets_dir.exists() and assets_dir.is_dir():
    assets_count = len([p for p in assets_dir.iterdir() if p.is_file()])
  if assets_count == 0:
    return GateResult(False, "no_assets")

  return GateResult(True, "")

