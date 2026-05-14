import json
import logging
import re
from typing import Any

import aiohttp


log = logging.getLogger(__name__)


MASTER_PROMPT = """
Tu es un expert en création de sites web modernes pour PME locales.

Objectif : générer un site 1-page utilisable immédiatement (pas une simple démo), rapide, lisible, orienté prise de contact.

Contraintes strictes :
1) Retourne UNIQUEMENT du HTML (pas de Markdown, pas d'explication).
2) HTML/CSS pur (CSS dans <style>). Aucun framework externe. Google Fonts OK.
3) Responsive mobile-first + desktop.
4) Ne pas inventer d'informations (horaires, services, SIRET, etc.). Si une info manque, rester générique.
5) Images : utiliser uniquement les chemins relatifs fournis dans `assets` (ex: "assets/img-xxxx.jpg"). Ne pas utiliser d'URL externe.
6) Inclure au minimum : Hero, Services (déduits du texte si possible), Réalisations/Galerie (si assets), Contact, FAQ courte.
7) Ajouter une section "Mentions" (basique) avec identité de l'entreprise si dispo, sinon un texte neutre.
8) Bouton CTA principal : "Demander un devis" (ou "Nous contacter") avec lien tel: ou mailto: si dispo. Si téléphone, ajouter un bouton WhatsApp vers https://wa.me/{phone_e164_digits_only}.
8) Bouton CTA principal : "Demander un devis" (ou "Nous contacter") avec lien tel: ou mailto: si dispo. Si téléphone, ajouter un bouton WhatsApp vers https://wa.me/{{phone_e164_digits_only}}.

DONNÉES :
{data}

Commencer par <!DOCTYPE html>
""".strip()


def _clean_phone_digits(raw: str) -> str:
  digits = re.sub(r"\D", "", str(raw or ""))
  if digits.startswith("33"):
    digits = digits[2:]
  if digits.startswith("0"):
    digits = digits[1:]
  if len(digits) == 9:
    return "33" + digits
  return ""


async def generate_site(
  *,
  scraped: dict[str, Any],
  biz: dict[str, Any],
  assets: list[dict[str, Any]],
  api_key: str,
) -> str:
  phone_raw = str(scraped.get("phone") or biz.get("phone") or "").strip()
  phone_e164_digits_only = _clean_phone_digits(phone_raw)

  payload_data = {
    "business": {
      "name": str(biz.get("name") or "").strip(),
      "website": str(biz.get("website") or "").strip(),
      "category": str(biz.get("category") or "").strip(),
      "city": str(biz.get("city") or "").strip(),
      "address": str(biz.get("address") or "").strip(),
      "rating": biz.get("rating"),
    },
    "scraped": {
      "title": str(scraped.get("title") or "").strip(),
      "meta_desc": str(scraped.get("meta_desc") or "").strip(),
      "text": str(scraped.get("text") or "")[:5000],
      "phone": phone_raw,
      "email": str(scraped.get("email") or biz.get("email") or "").strip(),
    },
    "assets": [{"relative_path": a.get("relative_path"), "source_url": a.get("source_url")} for a in assets],
    "phone_e164_digits_only": phone_e164_digits_only,
  }

  if not api_key:
    name = payload_data["business"]["name"] or "Entreprise"
    return (
      "<!DOCTYPE html><html><head><meta charset=\"utf-8\" />"
      f"<title>{name}</title></head><body><h1>{name}</h1>"
      "<p>Mode démo (ANTHROPIC_API_KEY manquante).</p></body></html>"
    )

  prompt = MASTER_PROMPT.format(data=json.dumps(payload_data, ensure_ascii=False, indent=2))
  body = {
    "model": "claude-sonnet-4-20250514",
    "max_tokens": 8000,
    "messages": [{"role": "user", "content": prompt}],
  }

  headers = {
    "Content-Type": "application/json",
    "x-api-key": api_key,
    "anthropic-version": "2023-06-01",
  }

  async with aiohttp.ClientSession() as session:
    async with session.post(
      "https://api.anthropic.com/v1/messages",
      json=body,
      headers=headers,
      timeout=aiohttp.ClientTimeout(total=120),
    ) as r:
      if r.status != 200:
        raw = await r.text()
        raise RuntimeError(f"Anthropic API error {r.status}: {raw[:500]}")
      data = await r.json()

  text = str((data.get("content") or [{}])[0].get("text") or "").strip()
  if not text.startswith("<!DOCTYPE"):
    m = re.search(r"<!DOCTYPE html>.*", text, flags=re.IGNORECASE | re.DOTALL)
    if m:
      text = m.group(0).strip()
    else:
      raise ValueError("Anthropic: HTML invalide")

  return text
