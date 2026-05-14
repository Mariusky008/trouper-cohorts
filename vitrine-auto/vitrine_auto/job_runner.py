import asyncio
import json
import os
from datetime import datetime, timezone
from typing import Any

import aiohttp

from .pipeline import run_pipeline


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _supabase_rest_base() -> str:
    supabase_url = (os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL") or "").strip()
    if not supabase_url:
        raise RuntimeError("Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)")
    return supabase_url.rstrip("/") + "/rest/v1"


def _supabase_headers() -> dict[str, str]:
    key = (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or "").strip()
    if not key:
        raise RuntimeError("Missing SUPABASE_SERVICE_ROLE_KEY")
    return {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"}


async def _fetch_next_job(session: aiohttp.ClientSession) -> dict[str, Any] | None:
    url = f"{_supabase_rest_base()}/human_vitrine_jobs?status=eq.queued&order=created_at.asc&limit=1"
    async with session.get(url, headers=_supabase_headers()) as resp:
        if resp.status != 200:
            text = await resp.text()
            raise RuntimeError(f"Supabase fetch job error {resp.status}: {text}")
        rows = await resp.json()
        if not isinstance(rows, list) or len(rows) == 0:
            return None
        row = rows[0]
        if not isinstance(row, dict):
            return None
        return row


async def _patch_job(session: aiohttp.ClientSession, job_id: str, payload: dict[str, Any]) -> None:
    url = f"{_supabase_rest_base()}/human_vitrine_jobs?id=eq.{job_id}"
    async with session.patch(url, headers=_supabase_headers(), data=json.dumps(payload)) as resp:
        if resp.status not in (200, 204):
            text = await resp.text()
            raise RuntimeError(f"Supabase patch job error {resp.status}: {text}")


def _to_str_list(value: Any) -> list[str]:
    if not value:
        return []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    return [part.strip() for part in str(value).split(",") if part.strip()]


async def run_one_job() -> bool:
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=60)) as session:
        job = await _fetch_next_job(session)
        if not job:
            return False

        job_id = str(job.get("id") or "").strip()
        if not job_id:
            return False

        started_at = _now_iso()
        await _patch_job(session, job_id, {"status": "running", "started_at": started_at, "updated_at": started_at, "error_reason": None})

        try:
            city = str(job.get("city") or "").strip()
            metiers = _to_str_list(job.get("metiers"))
            batch_size = int(job.get("batch_size") or 5)
            max_rating = float(job.get("max_rating") or 3.5)
            dry_run = bool(job.get("dry_run") or False)

            if not city or len(metiers) == 0:
                raise RuntimeError("Job invalid: city/metiers required")

            await run_pipeline(
                ville=city,
                categorie=metiers[0],
                queries=metiers,
                batch_size=max(1, min(30, batch_size)),
                max_rating=max(0.0, min(5.0, max_rating)),
                dry_run=dry_run,
            )

            finished_at = _now_iso()
            await _patch_job(session, job_id, {"status": "done", "finished_at": finished_at, "updated_at": finished_at})
            return True
        except Exception as exc:
            finished_at = _now_iso()
            await _patch_job(
                session,
                job_id,
                {
                    "status": "error",
                    "finished_at": finished_at,
                    "updated_at": finished_at,
                    "error_reason": str(exc),
                },
            )
            raise


def main() -> None:
    did_run = asyncio.run(run_one_job())
    if not did_run:
        return


if __name__ == "__main__":
    main()

