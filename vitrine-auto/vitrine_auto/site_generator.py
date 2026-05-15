"""
Module : Génération du site via Claude API
Master Prompt niveau "Miroiterie de l'Adour" — qualité premium systématique
"""
import json
import logging
import re
from typing import Any

import asyncio
import aiohttp

from .config import env

log = logging.getLogger(__name__)

ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"

def _ensure_scroll_reveal(html: str) -> str:
    text = str(html or "")
    if "IntersectionObserver" in text:
        return text
    style = (
        "<style>.reveal{opacity:0;transform:translateY(18px);transition:opacity .5s ease,transform .5s ease}"
        ".reveal.visible{opacity:1;transform:translateY(0)}</style>"
    )
    script = (
        "<script>(function(){try{var els=document.querySelectorAll('.reveal');"
        "if(!els||!els.length||!('IntersectionObserver'in window)){return;}"
        "var io=new IntersectionObserver(function(entries){entries.forEach(function(e){"
        "if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target);}});},{threshold:0.1});"
        "els.forEach(function(el){io.observe(el);});}catch(e){}})();</script>"
    )
    if "</head>" in text and ".reveal" not in text:
        text = text.replace("</head>", f"{style}</head>", 1)
    if "</body>" in text:
        text = text.replace("</body>", f"{script}</body>", 1)
    else:
        text = text + script
    return text

# ═══════════════════════════════════════════════════════════════════
# MASTER PROMPT — NE PAS RACCOURCIR, CHAQUE LIGNE EST INTENTIONNELLE
# ═══════════════════════════════════════════════════════════════════
MASTER_PROMPT = """Tu es un expert senior en développement front-end et design UI/UX premium pour PME locales françaises.

Ta mission : transformer les données d'un site existant médiocre en une vitrine web de niveau agence haut de gamme.
Le résultat doit ressembler à un site fait par une agence parisienne à 5000€, pas à un template WordPress.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DONNÉES DE L'ENTREPRISE SOURCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{data}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STACK TECHNIQUE OBLIGATOIRE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- HTML5 + CSS3 pur dans une balise <style> — zéro framework CSS externe
- Google Fonts uniquement (pas d'autre CDN)
- JavaScript vanilla minimal (scroll reveal + navigation mobile + dropdowns)
- Un seul fichier index.html autonome et auto-suffisant
- Toutes les images : balises <img> avec src chemins relatifs fournis dans `assets` (ex: "assets/img-xxxx.jpg")
- Compatible : Chrome, Safari iOS, Firefox, Samsung Internet

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYSTÈME DE DESIGN — APPLIQUER EXACTEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Variables CSS racine (toujours dans :root) :
  --ant: #1C1F22          (anthracite principal)
  --ant-mid: #2C3035      (anthracite moyen)
  --ant-light: #3D4349    (anthracite clair)
  --gold: #B8A87A         (or principal)
  --gold-l: #D4C89A       (or clair — accents titres)
  --gold-d: #8C7D57       (or foncé)
  --silver: #C8CDD4       (argent — textes secondaires dark)
  --silver-l: #E8EAED     (argent clair)
  --white: #F5F6F7        (blanc cassé — fond général)
  --offwhite: #ECEEF0     (fond secondaire)
  --muted: #6B7280        (texte muted clair)
  --radius: 14px
  --radius-sm: 8px
  --nav-h: 72px

Typographie :
  TITRES   : font-family 'Cormorant Garamond' serif, font-weight 300 ou 400
             Utiliser <em> en italic pour les mots-clés dans les titres
  CORPS    : font-family 'DM Sans' sans-serif, font-weight 400 ou 500
  Google Fonts à charger :
  https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRUCTURE DE PAGE OBLIGATOIRE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. NAVIGATION FIXE (position:fixed top:0 z-index:200)
   - Fond : rgba(28,31,34,0.93) avec backdrop-filter:blur(18px)
   - Bordure bas : 1px solid rgba(200,205,212,0.1)
   - Logo à gauche : nom entreprise en Cormorant Garamond 300, uppercase, letter-spacing:0.1em
     Le mot-clé du secteur en couleur gold-l
   - Liens navigation centrés (desktop uniquement)
   - Bouton CTA WhatsApp à droite : background #25D366, border-radius:40px, padding 9px 20px
   - Hamburger menu sur mobile (3 barres animées en croix via CSS transform)
   - Menu mobile : plein écran fond anthracite, liens verticaux avec border-bottom subtil

2. HERO SECTION (hauteur : calc(100svh - var(--nav-h)), min 520px, max 900px)
   - Image de fond en balise img avec position:absolute, object-fit:cover
   - Div overlay avec pseudo-element ::after : gradient linear-gradient(105deg, rgba(28,31,34,0.88) 42%, rgba(28,31,34,0.45) 100%)
   - Contenu texte en position:relative z-index:2, aligné à gauche, max-width:1100px centré
   - Eyebrow : 11px uppercase letter-spacing:0.2em couleur gold-l, margin-bottom:18px
   - H1 : Cormorant Garamond 300, clamp(44px,5.5vw,82px), couleur white, line-height:1.04
     Toujours un mot-clé en <em> italic gold-l
   - Lead : 16px DM Sans, couleur rgba(232,234,237,0.78), max-width:480px, line-height:1.65
   - Stats bar : 2-3 chiffres clés en flex gap:36px
     Chiffres : Cormorant Garamond 600 38px gold-l
     Labels : 10px uppercase letter-spacing:0.12em silver
   - Bouton WA vert + bouton ghost transparent côte à côte en flex

3. SECTION SERVICES (fond var(--white))
   - Padding: 90px 60px 0, max-width:1100px centré
   - Eyebrow 11px gold uppercase + H2 Cormorant 300 + texte lead DM Sans muted
   - Grille 2 colonnes desktop (gap:20px) / 1 colonne mobile
   - Chaque card service :
     * height:260px, border-radius:14px, overflow:hidden, position:relative
     * img en position:absolute top:0 left:0 width:100% height:100% object-fit:cover
     * Div overlay en position:absolute inset:0 avec gradient bas sombre
     * Tag pill : background rgba(184,168,122,.2) border 1px solid rgba(184,168,122,.45) border-radius:20px
     * Titre Cormorant 26px blanc + sous-titre 12px rgba(232,234,237,.7)
     * Hover sur l'img : transform scale(1.05) transition .5s ease

4. DARK STRIP ANTHRACITE "POURQUOI NOUS CHOISIR" (fond var(--ant), padding:80px 0)
   - Contenu max-width:1100px centré, padding horizontal 60px
   - H2 blanc + texte lead silver
   - Grille 3 cards (gap:16px) :
     * Fond rgba(255,255,255,0.04) border 1px solid rgba(255,255,255,0.07) border-radius:14px
     * Padding 32px 28px
     * Icône emoji 32px block margin-bottom:18px
     * Titre Cormorant 22px gold-l + texte silver 13.5px line-height:1.6
   - Bloc citation encadré en dessous :
     * Fond rgba(255,255,255,0.03) border 1px solid rgba(184,168,122,.2)
     * Position relative overflow:hidden
     * Guillemet géant décoratif en ::before : font-size:180px color rgba(184,168,122,.07)
     * Texte Cormorant italic blanc clamp(20px,2.2vw,30px) + auteur 12px gold uppercase

5. CTA BANDE CENTRALE (fond var(--white), text-align:center, padding:80px 60px)
   - H2 Cormorant 300 centré + texte lead centré max-width:500px
   - Deux boutons centrés en flex justify-content:center

6. FOOTER (fond var(--ant), padding:60px 0 32px)
   - Grille 4 colonnes desktop / 2 colonnes mobile / 1 colonne small mobile
   - Max-width 1100px centré
   - Colonne 1 (2fr) : logo + description courte silver
   - Colonnes 2-4 (1fr chacune) : titre h4 10px uppercase gold + liens silver hover blanc
   - Ligne séparatrice 1px solid rgba(200,205,212,.08) + copyright 12px light-muted

7. STICKY CTA MOBILE UNIQUEMENT (display:none desktop, display:block mobile <960px)
   - position:fixed bottom:0 left:0 right:0 z-index:150
   - Padding 10px 16px 16px
   - Fond dégradé : linear-gradient(0deg, var(--white) 60%, transparent 100%)
   - Lien full-width : background #25D366 border-radius:14px padding:15px
   - box-shadow : 0 8px 24px rgba(37,211,102,.35)
   - Icône WhatsApp SVG fill:#fff + texte "Devis gratuit — Répondons en 2h"
   - Body doit avoir padding-bottom:74px quand mobile menu actif

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CSS RESPONSIVE — BREAKPOINT UNIQUE 960px
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@media(max-width:960px) :
  --nav-h redéfini à 60px
  Navigation desktop masquée (display:none), hamburger visible (display:block)
  Sections : padding horizontal 24px au lieu de 60px
  Hero content : padding 0 28px
  Hero title : font-size 40px, puis 34px à 480px
  Grilles services : grid-template-columns 1fr
  Grilles "pourquoi" : 1fr 1fr puis 1fr à 480px
  Footer : grid-template-columns 1fr 1fr puis 1fr à 480px
  Sticky CTA : display:block
  body : padding-bottom:74px

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANIMATIONS ET INTERACTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hero (CSS keyframes fadeUp) :
  @keyframes fadeUp {{ from{{opacity:0;transform:translateY(22px)}} to{{opacity:1;transform:translateY(0)}} }}
  eyebrow : animation fadeUp .55s ease .15s both
  h1      : animation fadeUp .65s ease .28s both
  lead    : animation fadeUp .55s ease .42s both
  stats   : animation fadeUp .55s ease .52s both
  actions : animation fadeUp .55s ease .64s both

Scroll reveal sur toutes les sections :
  Classe .reveal : opacity:0 transform:translateY(18px) transition:opacity .5s ease, transform .5s ease
  Classe .reveal.visible : opacity:1 transform:translateY(0)
  JavaScript IntersectionObserver threshold:0.1, unobserve après première apparition

Navigation dropdowns (si sous-pages détectées) :
  Toggle au clic (PAS au hover — trop fragile sur mobile)
  Classe .open sur .nav-item active
  Fermeture automatique au clic extérieur (document addEventListener click)
  Flèche SVG qui tourne 180deg quand ouvert

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ICÔNE WHATSAPP SVG — UTILISER CE PATH EXACT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
</svg>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RÈGLES DE CONTENU — PERSONNALISATION RÉELLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Utilise OBLIGATOIREMENT les vraies informations extraites :
   - Nom exact de l'entreprise dans le logo nav et le H1
   - Vrai numéro de téléphone dans tous les liens tel: et wa.me/
   - Vraie adresse dans la section contact
   - Vrais services/produits extraits du texte source dans les cards services
   - Vraie note Google si disponible (ex: "4.2 · Google · +67 avis")
   - Vraie année de création si dans le texte → calcule les années d'expérience

2. Rédige des accroches percutantes à partir du texte extrait :
   - H1 : formule courte impactante qui parle du bénéfice client (pas juste le nom)
   - Lead : 1-2 phrases qui expliquent la valeur unique de l'entreprise
   - Stats bar : chiffres réels si disponibles, sinon rester générique (ne pas inventer de chiffres)

3. Pour les images :
   - Utilise UNIQUEMENT les chemins relatifs fournis dans `assets` (ex: "assets/img-xxxx.jpg")
   - Si pas d'assets utilisables, n'invente pas d'URL externe et garde des blocks sans image
   - JAMAIS background-image CSS avec URL

4. Adapte le CTA et le vocabulaire au secteur :
   Restaurant/bar     → "Réserver une table" / "Notre carte" / "Le chef"
   Artisan/BTP        → "Devis gratuit" / "Nos réalisations" / "Savoir-faire"
   Commerce/retail    → "Découvrir notre boutique" / "Nos produits" / "Venir nous voir"
   Santé/beauté       → "Prendre rendez-vous" / "Nos soins" / "L'équipe"
   Immobilier         → "Estimer mon bien" / "Nos annonces" / "Nos experts"
   Restauration rapide→ "Commander" / "Notre menu" / "Livraison disponible"

5. Section "Pourquoi nous choisir" — 3 arguments adaptés au secteur :
   Artisan       → Fabrication locale / Nos propres compagnons / Service dépannage
   Restaurant    → Produits frais et locaux / Chef expérimenté / Ambiance chaleureuse
   Commerce      → Conseil personnalisé / Stock disponible / Service après-vente
   (adapter selon les infos extraites)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DÉTAILS PREMIUM QUI FONT LA DIFFÉRENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ces éléments transforment un site correct en site premium :

+ Scrollbar personnalisée : width:6px, thumb couleur silver, track transparent
+ Sections avec padding vertical 80-90px (jamais moins de 48px)
+ Max-width 1100px sur desktop avec margin:0 auto
+ Section-eyebrow TOUJOURS présent avant chaque H2
  (11px uppercase gold letter-spacing:.18em, margin-bottom:14px)
+ Les H2 ont TOUJOURS un mot en <em> italic pour la variation typographique
+ Cards services avec tag pill doré semi-transparent (jamais badge plein uni)
+ Dark strip anthracite entre les sections claires (contraste fort)
+ Citation du gérant/propriétaire avec guillemet géant décoratif ::before
+ Bouton WhatsApp avec box-shadow colorée : 0 8px 28px rgba(37,211,102,.3)
+ Hover sur boutons : translateY(-2px) + shadow plus forte (transition .2s)
+ Espace blanc généreux entre les éléments (jamais d'impression de compression)
+ Toutes les transitions : .2s ease ou .5s ease (jamais instantané)
+ overflow-x:hidden sur body pour éviter le scroll horizontal mobile
+ html avec scroll-behavior:smooth

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CE QU'IL NE FAUT JAMAIS FAIRE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Utiliser Bootstrap, Tailwind ou tout autre framework CSS
- Sortir de la palette de couleurs définie
- Sections avec padding vertical < 48px
- font-weight 700 ou 800 (max 600 pour Cormorant, 500 pour DM Sans)
- Sticky CTA visible sur desktop
- background-image: url('https://...') dans le CSS
- Laisser du Lorem ipsum ou contenu placeholder
- Site qui ressemble à un template générique
- Oublier les animations fadeUp sur le hero
- Oublier le scroll reveal IntersectionObserver sur les sections
- Oublier le menu hamburger fonctionnel sur mobile

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMAT DE SORTIE — ABSOLUMENT CRITIQUE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Retourne UNIQUEMENT le code HTML complet.
- Commence DIRECTEMENT par <!DOCTYPE html>
- Termine par </html>
- Zéro texte avant ou après le HTML
- Zéro balise markdown (pas de ```html ni ```)
- Zéro commentaire du type "Voici le site..."
- Le fichier doit faire au minimum 400 lignes

Numéro WhatsApp (déjà formaté, utiliser tel quel dans wa.me/) : {phone_clean}
"""


async def generate_site(
    *,
    scraped: dict[str, Any],
    biz: dict[str, Any],
    assets: list[dict[str, Any]],
    api_key: str,
    revision_instructions: str = "",
) -> str:
    if not api_key:
        log.warning("ANTHROPIC_API_KEY manquant — génération site démo")
        return _demo_html(biz)

    phone_raw = str(scraped.get("phone") or biz.get("phone", "") or "").strip()
    phone_clean = re.sub(r"[\s.\-()]", "", phone_raw)
    if phone_clean.startswith("0"):
        phone_clean = "33" + phone_clean[1:]
    phone_clean = phone_clean.lstrip("+")

    data_summary = {
        "nom_entreprise": str(biz.get("name") or "").strip(),
        "secteur": str(biz.get("category") or "").strip(),
        "site_url": str(biz.get("website") or "").strip(),
        "titre_page": str(scraped.get("title") or "").strip(),
        "meta_description": str(scraped.get("meta_desc") or "").strip(),
        "texte_principal": str(scraped.get("text") or "")[:4000],
        "telephone": phone_raw,
        "email": str(scraped.get("email") or biz.get("email") or "").strip(),
        "adresse": str(scraped.get("address") or biz.get("address") or "").strip(),
        "ville": str(biz.get("city") or "").strip(),
        "horaires": str(scraped.get("hours") or "").strip(),
        "note_google": f"{biz.get('rating','')} / 5 ({biz.get('reviews_count','')} avis)" if biz.get("rating") else "",
        "assets": [{"relative_path": a.get("relative_path"), "source_url": a.get("source_url")} for a in (assets or [])],
        "logo_url": str(scraped.get("logo") or "").strip(),
        "navigation_pages": scraped.get("nav_links", []),
    }

    try:
        prompt = MASTER_PROMPT.format(data=json.dumps(data_summary, ensure_ascii=False, indent=2), phone_clean=phone_clean)
    except Exception as e:
        raise RuntimeError(
            "Erreur formatage MASTER_PROMPT (accolades non échappées ?). Utiliser {{ et }} pour des accolades littérales."
        ) from e
    extra = str(revision_instructions or "").strip()
    if extra:
        prompt = prompt + "\n\nINSTRUCTIONS DE MODIFICATION (prioritaires) :\n" + extra[:6000] + "\n"

    nav_links = scraped.get("nav_links") or []
    if isinstance(nav_links, list) and len(nav_links) > 0:
        prompt = (
            prompt
            + "\n\nNAVIGATION (OBLIGATOIRE) :\n"
            + "- La liste `navigation_pages` est fournie dans les données.\n"
            + "- Reprends EXACTEMENT ces intitulés dans la navigation (même ordre) et crée des sections correspondantes.\n"
            + "- Ne remplace pas par des intitulés génériques type \"Nos services\" si une navigation existe.\n"
            + "- Chaque item doit scroller vers une section (ancres #...) dans la page.\n"
        )

    if assets:
        prompt = (
            prompt
            + "\n\nCONTRAINTE ASSETS (OBLIGATOIRE) :\n"
            + "- La liste `assets` n’est pas vide : tu dois utiliser AU MOINS 3 images.\n"
            + "- 1 image en HERO (balise <img> en background), et au moins 2 images dans les cards services.\n"
            + "- Les src doivent être des chemins relatifs exactement comme dans `assets` (ex: assets/img-xxxx.jpg).\n"
        )

    payload = {
        "model": env("ANTHROPIC_MODEL", "claude-sonnet-4-20250514") or "claude-sonnet-4-20250514",
        "max_tokens": int(env("ANTHROPIC_MAX_TOKENS", "16000") or "16000"),
        "messages": [{"role": "user", "content": prompt}],
    }

    headers = {
        "Content-Type"     : "application/json",
        "x-api-key"        : api_key,
        "anthropic-version": "2023-06-01",
    }

    timeout_s = int(env("ANTHROPIC_TIMEOUT_S", "600") or "600")
    retries = int(env("ANTHROPIC_RETRIES", "2") or "2")

    last_exc: Exception | None = None
    async with aiohttp.ClientSession() as session:
        for attempt in range(retries + 1):
            try:
                async with session.post(
                    ANTHROPIC_API_URL,
                    json=payload,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=timeout_s),
                ) as r:
                    if r.status != 200:
                        body = await r.text()
                        raise RuntimeError(f"Claude API error {r.status}: {body[:300]}")
                    data = await r.json()
                    last_exc = None
                    break
            except (asyncio.TimeoutError, aiohttp.ClientError) as e:
                last_exc = e
                if attempt >= retries:
                    raise
                log.warning("Anthropic timeout/network error (attempt %s/%s)", attempt + 1, retries + 1)

    if last_exc:
        raise last_exc

    html = data["content"][0]["text"].strip()

    # ── Nettoyage si Claude a ajouté des backticks markdown ──
    if html.startswith("```"):
        html = re.sub(r'^```(?:html)?\n?', '', html)
        html = re.sub(r'\n?```$', '', html)
        html = html.strip()

    # ── Vérification HTML valide ──────────────────────────────
    if not html.lower().startswith("<!doctype"):
        match = re.search(r'<!DOCTYPE html>.*', html, re.DOTALL | re.IGNORECASE)
        if match:
            html = match.group(0)
        else:
            raise ValueError(f"HTML invalide retourné par Claude (début: {html[:100]})")

    html = _ensure_scroll_reveal(html)

    # ── Checks qualité — log si éléments manquants ───────────
    checks = {
        "Cormorant Garamond": "Cormorant Garamond" in html,
        "DM Sans": "DM Sans" in html,
        "var(--ant)": "var(--ant)" in html,
        "var(--gold": "var(--gold" in html,
        "sticky CTA": "sticky" in html.lower() or "position:fixed" in html,
        "wa.me/": "wa.me/" in html,
        "IntersectionObserver": "IntersectionObserver" in html,
        "fadeUp": "fadeUp" in html,
    }
    failed = [k for k, v in checks.items() if not v]
    if assets and "assets/" not in html:
        failed = failed + ["assets_used"]
    if failed:
        log.warning(f"  Checks qualite echoues : {failed}")
    else:
        log.info(f"  Tous les checks qualite passes ({len(html)//1024}KB, {html.count(chr(10))} lignes)")

    return html


def _demo_html(biz: dict) -> str:
    """HTML minimal de démonstration quand pas de clé API"""
    name = biz.get("name", "Mon Entreprise")
    phone = biz.get("phone", "0500000000")
    phone_clean = re.sub(r'[\s.\-()]', '', phone)
    if phone_clean.startswith("0"):
        phone_clean = "33" + phone_clean[1:]
    phone_clean = phone_clean.lstrip("+")

    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>{name} — Vitrine Mobile Demo</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;1,300&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet"/>
<style>
*{{box-sizing:border-box;margin:0;padding:0}}
:root{{--ant:#1C1F22;--gold-l:#D4C89A;--white:#F5F6F7;--radius:14px}}
body{{font-family:'DM Sans',sans-serif;background:var(--white);color:var(--ant);padding-bottom:80px}}
.hero{{background:var(--ant);padding:80px 28px 60px;min-height:60vh;display:flex;flex-direction:column;justify-content:flex-end}}
.eyebrow{{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--gold-l);margin-bottom:14px}}
h1{{font-family:'Cormorant Garamond',serif;font-weight:300;font-size:48px;color:#F5F6F7;line-height:1.05;margin-bottom:20px}}
h1 em{{font-style:italic;color:var(--gold-l)}}
.lead{{font-size:15px;color:rgba(232,234,237,.75);max-width:440px;line-height:1.65;margin-bottom:32px}}
.btn-wa{{display:inline-flex;align-items:center;gap:10px;background:#25D366;color:#fff;padding:14px 28px;border-radius:var(--radius);text-decoration:none;font-size:15px;font-weight:500;box-shadow:0 8px 28px rgba(37,211,102,.3)}}
.section{{padding:60px 28px 0;max-width:600px;margin:0 auto}}
.eyebrow2{{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#B8A87A;margin-bottom:10px}}
h2{{font-family:'Cormorant Garamond',serif;font-weight:300;font-size:36px;margin-bottom:8px;color:var(--ant)}}
h2 em{{font-style:italic;color:#6B7280}}
.note{{font-size:13px;color:#6B7280;padding:16px;background:#ECEEF0;border-radius:8px;margin-top:16px;line-height:1.5}}
.sticky{{position:fixed;bottom:0;left:0;right:0;padding:10px 20px 20px;background:linear-gradient(0deg,var(--white) 60%,transparent)}}
.sticky a{{display:flex;align-items:center;justify-content:center;gap:10px;background:#25D366;color:#fff;padding:15px;border-radius:var(--radius);text-decoration:none;font-size:15px;font-weight:500;box-shadow:0 8px 24px rgba(37,211,102,.35)}}
.wa-svg{{width:20px;height:20px;fill:#fff;flex-shrink:0}}
</style>
</head>
<body>
<div class="hero">
  <p class="eyebrow">Vitrine Mobile — Mode démo</p>
  <h1>{name}<br/><em>Votre vitrine</em><br/>premium.</h1>
  <p class="lead">Configurez ANTHROPIC_API_KEY pour générer automatiquement un site premium complet à partir des vraies données de l'entreprise.</p>
  <a class="btn-wa" href="https://wa.me/{phone_clean}">
    <svg class="wa-svg" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    Devis gratuit WhatsApp
  </a>
</div>
<div class="section">
  <p class="eyebrow2">Configuration requise</p>
  <h2>Site <em>démo</em></h2>
  <p style="font-size:14px;color:#6B7280;line-height:1.65;margin-top:8px">
    Clé ANTHROPIC_API_KEY manquante dans le fichier .env.
    Une fois configurée, Claude génère un site premium complet avec toutes
    les vraies informations de l'entreprise.
  </p>
  <div class="note">Téléphone détecté : {phone}<br/>Ce numéro sera intégré dans tous les boutons WhatsApp du site généré.</div>
</div>
<div class="sticky">
  <a href="https://wa.me/{phone_clean}">
    <svg class="wa-svg" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    Devis gratuit — Répondons en 2h
  </a>
</div>
</body>
</html>"""
