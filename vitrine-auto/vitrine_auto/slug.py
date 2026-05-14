import re
import unicodedata


def slugify(value: str, max_len: int = 60) -> str:
  text = str(value or "").strip()
  if not text:
    return "vitrine"
  text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
  text = text.lower()
  text = re.sub(r"[^a-z0-9\s-]", "", text)
  text = re.sub(r"[\s_-]+", "-", text).strip("-")
  return (text or "vitrine")[:max_len]

