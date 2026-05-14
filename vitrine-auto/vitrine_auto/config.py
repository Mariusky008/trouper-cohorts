import os

from dotenv import load_dotenv


load_dotenv()


def env(name: str, default: str = "") -> str:
  return str(os.getenv(name, default) or "").strip()


def required_env(name: str) -> str:
  value = env(name)
  if not value:
    raise RuntimeError(f"Missing env var: {name}")
  return value


def supabase_url() -> str:
  return env("NEXT_PUBLIC_SUPABASE_URL") or env("SUPABASE_URL")


def vitrine_public_base_url() -> str:
  return env("VITRINE_PUBLIC_BASE_URL", "https://vitrine.popey.academy").rstrip("/")

