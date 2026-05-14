

&#x20;

**VITRINE AUTO**

Pipeline de génération automatique de vitrines web

─────────────────────────────────────────



*Briefing technique complet pour l'ingénieur*



Client

**Jean-Philippe Roth**

Dax (40) — Landes

**Objectif :** générer automatiquement des vitrines web pour 50 PME locales,
les publier sur `vitrine.popey.academy/{slug}` (hébergé sur l'infra existante), et envoyer les messages WhatsApp via Twilio.



Stack : Python 3.10+ · Apify · Playwright · Claude API · Supabase (DB + Storage) · Next.js (Vercel) · Twilio WhatsApp

## Décisions validées (v1)

- Objectif livrable : chaque vitrine générée doit pouvoir devenir un site réellement utilisable par le client (pas seulement une démo).
- Images : réutilisation autorisée des images du site source, mais en les téléchargeant puis en les hébergeant dans la vitrine (pas de hotlinking).
- WhatsApp : prospection à froid uniquement via templates WhatsApp approuvés (Meta) côté Twilio.
- Publication : URL propre `https://vitrine.popey.academy/{slug}` sur l'infra existante (Vercel), sans URL Netlify.
- Quality gate avant dashboard : rejeter automatiquement les vitrines “vides” ou incohérentes (détails en section 2.2).
- Persistance : éviter de stocker des screenshots en base64 dans `state.json` (stocker des fichiers + chemins, ou SQLite plus tard).

\


# **1. Vue d'ensemble du projet**

Jean-Philippe Roth prospecte des PME locales à Dax (Landes) dont le site web est de mauvaise qualité (note Google < 3,5/5). Pour chaque entreprise, le système génère automatiquement une vitrine (HTML + assets), la publie sur `https://vitrine.popey.academy/{slug}` via l'infra existante (Vercel + Supabase), puis envoie un message WhatsApp de prospection via Twilio.



## **1.1 Pipeline en 6 étapes**

| Étape | Description |
|---|---|
| 1 — Apify | Recherche les entreprises locales via Google Maps Scraper (Apify). Filtre : note ≤ 3,5 ET site web présent. |
| 2 — Scraper + Assets + Claude | Playwright visite le site existant, extrait contenu/contact + liste d'images. Le pipeline télécharge les images retenues, puis Claude génère une vitrine (HTML + assets) en s'appuyant sur des infos factuelles (pas d'invention). |
| 3 — Publication (Supabase + Vercel) | Upload des fichiers (HTML + assets) dans Supabase Storage + enregistrement d'un mapping `{slug → chemin storage + metadata}`. La vitrine est servie publiquement par Next.js sur Vercel via `https://vitrine.popey.academy/{slug}`. |
| 4 — Dashboard (Web) | Dashboard dans l'admin existant (Vercel) : validation/rejet, inspection erreurs, et envoi WhatsApp. |
| 5 — Twilio WhatsApp | Après validation, envoi automatique des messages WhatsApp via template WhatsApp approuvé (Meta) sur Twilio. |
| 6 — Résultat | Les prospects reçoivent le message + lien démo. Réponses → devis → clients. |

## **1.2 Comptes déjà en place (ne pas recréer)**

- Apify : compte existant avec token API — utiliser l'actor apify/google-maps-scraper
- Twilio : compte existant avec WhatsApp Business configuré — récupérer Account SID, Auth Token et numéro From
- Vercel : projet existant (déjà utilisé). Il suffit d'ajouter le domaine `vitrine.popey.academy` au même projet.
- Supabase : projet existant (déjà utilisé). Un bucket Storage dédié aux vitrines sera créé si nécessaire.

💡 *Ces deux comptes sont déjà opérationnels sur d'autres projets de Jean-Philippe. Ne pas créer de nouveaux comptes.*



## **1.3 Comptes à créer**

- Anthropic API : console.anthropic.com/settings/keys — créer une clé API
- OVH (DNS) : créer l'entrée DNS pour `vitrine.popey.academy` selon l'assistant Vercel (CNAME).

\


\


# **2. Architecture des fichiers**

Voici la structure complète du projet à mettre en place :

```text
vitrine-auto/
├── main.py                          # point d'entrée principal
├── requirements.txt                 # dépendances Python
├── .env                             # variables d'environnement (NE PAS committer)
├── .env.example                     # template de configuration
├── vitrine_auto.log                 # logs (créé automatiquement)
├── state.json                       # état persistant (créé automatiquement)
├── output/                          # sites générés (créé automatiquement)
│   ├── dashboard_data.json          # données du dashboard
│   └── {slug-entreprise}/
│       ├── index.html               # site généré
│       ├── scraped.json             # données scrapées
│       ├── assets/                  # images téléchargées depuis le site source
│       └── screenshots/             # screenshots (fichiers), pas base64 dans state.json
└── modules/
    ├── __init__.py
    ├── apify_search.py              # recherche Apify (remplace google_places.py)
    ├── scraper.py                   # scraping Playwright
    ├── assets.py                    # téléchargement + réécriture des URLs images
    ├── quality_gate.py              # contrôles automatiques avant dashboard
    ├── site_generator.py            # génération Claude API
    ├── supabase_uploader.py         # upload Supabase Storage + mapping slug
    ├── twilio_sender.py             # envoi WhatsApp Twilio (templates)
    └── state.py                     # gestion état
```

Intégration dans l'app existante (Next.js / Vercel) :

```text
src/
├── middleware.ts                    # routing host-based pour vitrine.popey.academy
└── app/
    ├── admin/
    │   └── humain/
    │       └── vitrines/            # dashboard de pilotage (validation + envoi WhatsApp)
    └── vitrine/
        ├── page.tsx                 # homepage minimaliste vitrine.popey.academy/
        └── [slug]/
            └── page.tsx             # vitrine publique vitrine.popey.academy/{slug}
```



## **2.1 Flux de données**

Apify JSON

↓ (liste d'entreprises filtrées)

scraper.py → site\_generator.py → supabase_uploader.py

↓ ↓ ↓

scraped.json index.html + assets (upload) → URL publique

↓ ↓

state.json ←────────────────┘

↓

Admin web (Vercel) : `/admin/humain/vitrines`

↓ (après validation Jean-Philippe)

twilio\_sender.py → WhatsApp envoyé

\

## 2.2 Quality gate (avant dashboard)

Objectif : éviter que Jean-Philippe perde du temps sur des vitrines “creuses” ou incohérentes.

Contrôles minimum recommandés :
- Données contact : au moins 1 canal exploitable (téléphone OU email), et idéalement une adresse.
- CTA : présence d'un CTA principal (devis / appel / WhatsApp) et cohérence avec la donnée contact (numéro WhatsApp formattable si CTA WhatsApp).
- Matière scrapée : longueur minimale de texte utile (ex: `>= 800` caractères) ou présence de sections “services” détectables.
- HTML : taille raisonnable (ex: `20 KB <= index.html <= 300 KB`) et présence de sections obligatoires.
- Démo : si déployé, l'URL publique renvoie HTTP 200 et un contenu HTML non vide.

Sortie :
- Si un contrôle échoue : statut `rejected_auto` (ou `error`) + `error_reason` explicite (ex: `missing_contact`, `too_little_content`, `deploy_not_200`).
- Seules les entrées `deployed` et `passed_gate=true` remontent dans `dashboard_data.json`.

## 2.3 Assets (images) : réutiliser sans hotlinking

Décision : réutiliser les images du site source est autorisé, mais elles doivent être copiées dans la vitrine.

Approche :
- `scraper.py` extrait une liste d'URLs candidates (max N, ex: 10–20).
- `assets.py` télécharge les fichiers (timeout, taille max, types autorisés) dans `output/{slug}/assets/`.
- Le pipeline réécrit ensuite le HTML généré pour pointer vers des chemins relatifs (`assets/...`) avant upload Supabase.

Garde-fous :
- Filtrer les images `data:` et les URLs manifestement tracking.
- Limiter taille et nombre pour éviter des vitrines lourdes.
- Prévoir un mode fallback : si 0 image téléchargeable, autoriser une vitrine “texte + bloc couleurs” plutôt que planter.

Note légale/pratique :
- Prévoir une suppression rapide si un prospect le demande.
- Ne pas récupérer de contenus derrière authentification / paywall.

## 2.4 WhatsApp (Twilio) : templates obligatoires

Pour le premier message (prospection à froid), utiliser un template WhatsApp approuvé (Meta) via Twilio.

À faire côté Twilio :
- Créer un template “utilitaire” ou “marketing” selon le wording, avec variables (ex: `{{1}}` nom, `{{2}}` URL démo, `{{3}}` ville/secteur).
- Attendre validation Meta, puis utiliser ce template comme unique canal “first touch”.

Contraintes de wording :
- Éviter les formulations trop agressives ou promesses (“ROI”, “gratuit” si ça pose problème de conformité). Préférer “démo personnalisée” / “proposition”.
- Ajouter une phrase simple d'opt-out (“Si ce message vous dérange, dites STOP.”) si souhaité.

## 2.5 Stratégie d'URL (confiance + simplicité)

Objectif : maximiser la confiance (URL propre) tout en évitant la complexité/risque d'une explosion de sous-domaines.

Choix recommandé (v1) :
- Une seule vitrine “hub” sur un sous-domaine dédié : `vitrine.popey.academy`
- Chaque entreprise est accessible par chemin : `https://vitrine.popey.academy/{slug}`

Pourquoi ce choix :
- Pas d'URL d'hébergeur visible.
- Pas besoin de créer/maintenir des centaines de sous-domaines (reputation/routing/certificats).
- Déploiement plus simple : une seule surface publique (Vercel) + un stockage central (Supabase Storage).

Pré-requis DNS :
- Créer `vitrine.popey.academy` et le faire pointer vers Vercel (DNS OVH, cf. section 2.6).

Alternative (non recommandée en v1) :
- Un sous-domaine par entreprise : `{slug}.popey.academy` (meilleure “illusion site officiel” mais plus risqué/complexe à grande échelle).

## 2.6 Hébergement Vercel + DNS OVH + homepage

Décision v1 :
- Hébergement : utiliser l'app Next.js existante déployée sur Vercel.
- Domaine : ajouter `vitrine.popey.academy` sur le même projet Vercel.
- Homepage `https://vitrine.popey.academy/` : une page minimaliste “Popey Academy – Démonstrations personnalisées” (pas de liste publique des entreprises).

Routage (principe) :
- Un middleware route les requêtes dont le `Host` vaut `vitrine.popey.academy`.
- `/` → page vitrine homepage (`/vitrine` côté app).
- `/{slug}` → vitrine publique (`/vitrine/{slug}` côté app), URL affichée inchangée.

DNS OVH (principe) :
- Dans le dashboard Vercel, ajouter le domaine `vitrine.popey.academy` et suivre l'assistant.
- Dans OVH (zone DNS), créer l'entrée demandée par Vercel (souvent un `CNAME` `vitrine` → cible fournie par Vercel).


\

## **3.1 Prérequis système**

- Python 3.10 ou supérieur
- Node.js 18+ (non requis pour le pipeline, mais utile pour tester)
- Git
- Un terminal (Mac/Linux) ou PowerShell (Windows)



## **3.2 Installation des dépendances**

```bash
# 1. Créer et activer l'environnement virtuel
python -m venv venv
source venv/bin/activate  # Mac/Linux

# venv\Scripts\activate    # Windows

# 2. Installer les dépendances Python
pip install aiohttp playwright python-dotenv

# 3. Installer Playwright + navigateur Chromium
playwright install chromium

# 4. Vérifier l'installation
python -c "import aiohttp, playwright; print('OK')"
```



## **3.3 Fichier requirements.txt**

```txt
aiohttp>=3.9.0
playwright>=1.40.0
python-dotenv>=1.0.0
```



## **3.4 Configuration — fichier .env**

Créer le fichier .env à la racine du projet avec les valeurs suivantes :



\# ── Apify (compte existant Jean-Philippe) ──────────────

\# → https\://console.apify.com/account/integrations

APIFY\_TOKEN=apify\_api\_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX



\# ── Anthropic Claude API (nouveau) ─────────────────────

\# → https\://console.anthropic.com/settings/keys

ANTHROPIC\_API\_KEY=sk-ant-api03-XXXXXXXXXXXXXXXXXXXXXXX


\# ── Supabase (existant) ────────────────────────────────
\#
\# Utilisé pour stocker les vitrines (HTML + assets) et le mapping slug → chemin.
\#
\# Valeurs déjà présentes côté app (Vercel). Pour le pipeline local, utiliser la clé SERVICE ROLE.
\#
SUPABASE\_URL=https\://xxxx.supabase.co
SUPABASE\_SERVICE\_ROLE\_KEY=your\_service\_role\_key
SUPABASE\_VITRINES\_BUCKET=vitrines



\# ── Twilio WhatsApp (compte existant Jean-Philippe) ────

\# → https\://console.twilio.com


TWILIO\_AUTH\_TOKEN=your\_auth\_token\_here

TWILIO\_WHATSAPP\_FROM=whatsapp:+14155238886



\# ── Notification email (optionnel) ─────────────────────

NOTIFY\_EMAIL=jeanphilippe\@email.fr

SMTP\_HOST=smtp.gmail.com

SMTP\_PORT=587

SMTP\_USER=jeanphilippe\@gmail.com

SMTP\_PASS=votre\_app\_password\_gmail

⚠️ **Ne jamais committer le fichier .env sur Git. Vérifier que .gitignore contient bien '.env'.**

\


\


# **4. Spécification d’implémentation (Vercel + Supabase)**

Le code sera livré directement sous forme de fichiers dans le repo, en s’appuyant sur l’infra existante (Next.js + Vercel + Supabase). Le document décrit ce qui doit être implémenté, pas un copier-coller de code.

## 4.1 Publication “URL propre” (principe)

- Les vitrines sont accessibles publiquement sur `https://vitrine.popey.academy/{slug}`.
- Les fichiers (HTML + assets) sont stockés dans Supabase Storage (bucket `vitrines`) sous `{slug}/...`.
- Une table Supabase (ex: `vitrine_sites`) fait le mapping `slug → storage_prefix + metadata + status`.

## 4.2 Routage Vercel (principe)

- Ajouter `vitrine.popey.academy` au projet Vercel existant.
- Ajouter un middleware qui route :
  - `Host = vitrine.popey.academy` + `/` → `/vitrine` (homepage minimaliste)
  - `Host = vitrine.popey.academy` + `/{slug}` → `/vitrine/{slug}` (vitrine publique)

## 4.3 Homepage (décision v1)

`https://vitrine.popey.academy/` affiche une page simple “Popey Academy – Démonstrations personnalisées” (branding + explication + contact). Pas de listing public.

## 4.4 SQL Supabase

Une migration SQL sera fournie (prête à copier-coller dans Supabase) pour créer `vitrine_sites` (+ indexes). Cette migration est nécessaire pour la mise en prod.

## **4.A Annexe (ancienne version Netlify) — À ignorer**

💡 *Contenu historique. Ne pas copier-coller : la version retenue est Vercel + Supabase (pas Netlify).*



## **4.1 main.py — Orchestrateur principal**

Point d'entrée du pipeline. Coordonne toutes les étapes. À modifier : remplacer l'import google\_places par apify\_search, et notifier par twilio\_sender.



"""

VITRINE AUTO - Orchestrateur Principal

Usage : python main.py --ville "Dax" --categorie "restaurant" --batch 10

"""

import os, sys, json, asyncio, argparse, logging

from pathlib import Path

from datetime import datetime

from dotenv import load\_dotenv



load\_dotenv() # charge le fichier .env



\# ── IMPORTANT : utiliser apify\_search, PAS google\_places ──

from modules.apify\_search import search\_businesses

from modules.scraper import scrape\_website

from modules.site\_generator import generate\_site

from modules.netlify import deploy\_to\_netlify

from modules.twilio\_sender import TwilioWhatsApp

from modules.state import load\_state, save\_state



logging.basicConfig(

level=logging.INFO,

format='%(asctime)s \[%(levelname)s] %(message)s',

handlers=\[

logging.FileHandler('vitrine\_auto.log'),

logging.StreamHandler(sys.stdout)

]

)

log = logging.getLogger(\_\_name\_\_)



CONFIG = {

'APIFY\_TOKEN' : os.getenv('APIFY\_TOKEN', ''),

'ANTHROPIC\_API\_KEY' : os.getenv('ANTHROPIC\_API\_KEY', ''),

'NETLIFY\_TOKEN' : os.getenv('NETLIFY\_TOKEN', ''),

'NOTIFY\_EMAIL' : os.getenv('NOTIFY\_EMAIL', ''),

'RATING\_MAX' : 3.5,

'BATCH\_SIZE' : 10,

'OUTPUT\_DIR' : Path('output'),

'STATE\_FILE' : Path('state.json'),

'DASHBOARD\_PORT' : 8765,

}



async def process\_business(biz: dict, output\_dir: Path) -> dict:

slug = biz\['slug']

log.info(f'▶ Traitement : {biz\["name"]}')

result = {

'slug': slug, 'name': biz\['name'], 'website': biz\['website'],

'phone': biz.get('phone',''), 'email': biz.get('email',''),

'contact\_name': biz.get('contact\_name',''),

'rating': biz.get('rating', 0), 'status': 'pending',

'demo\_url': '', 'error': '',

'created\_at': datetime.now().isoformat(),

}

site\_dir = output\_dir / slug

site\_dir.mkdir(parents=True, exist\_ok=True)



\# 1. Scraping

try:

scraped = await scrape\_website(biz\['website'])

result\['scraped'] = scraped

(site\_dir / 'scraped.json').write\_text(

json.dumps(scraped, ensure\_ascii=False, indent=2))

except Exception as e:

result\['status'] = 'error'

result\['error'] = f'Scraping failed: {e}'

return result



\# 2. Génération HTML avec Claude

try:

html = await generate\_site(

scraped, biz, CONFIG\['ANTHROPIC\_API\_KEY'])

(site\_dir / 'index.html').write\_text(html, encoding='utf-8')

except Exception as e:

result\['status'] = 'error'

result\['error'] = f'Generation failed: {e}'

return result



\# 3. Déploiement Netlify

try:

demo\_url = await deploy\_to\_netlify(

site\_dir, slug, CONFIG\['NETLIFY\_TOKEN'])

result\['demo\_url'] = demo\_url

result\['status'] = 'deployed'

except Exception as e:

result\['status'] = 'error'

result\['error'] = f'Deploy failed: {e}'

return result



return result



async def run\_pipeline(ville: str, categorie: str, batch\_size: int):

output\_dir = CONFIG\['OUTPUT\_DIR']

output\_dir.mkdir(exist\_ok=True)

state = load\_state(CONFIG\['STATE\_FILE'])



businesses = await search\_businesses(

query=f'{categorie} {ville}',

api\_key=CONFIG\['APIFY\_TOKEN'],

max\_rating=CONFIG\['RATING\_MAX'],

max\_results=batch\_size \* 3,

)



done\_slugs = {r\['slug'] for r in state.get('results', \[])}

businesses = \[b for b in businesses if b\['slug'] not in done\_slugs]

businesses = businesses\[:batch\_size]



if not businesses:

log.info('Aucune nouvelle entreprise à traiter.')

return



sem = asyncio.Semaphore(3) # max 3 en parallèle

async def process\_with\_sem(biz):

async with sem:

return await process\_business(biz, output\_dir)



batch\_results = await asyncio.gather(

\*\[process\_with\_sem(b) for b in businesses],

return\_exceptions=True

)

batch\_results = \[r for r in batch\_results if isinstance(r, dict)]



state.setdefault('results', \[]).extend(batch\_results)

save\_state(CONFIG\['STATE\_FILE'], state)



deployed = \[r for r in batch\_results if r\['status'] == 'deployed']

log.info(f'{len(deployed)} sites déployés sur {len(businesses)}')



if deployed:

data\_file = output\_dir / 'dashboard\_data.json'

all\_deployed = \[r for r in state\['results'] if r\['status'] == 'deployed']

data\_file.write\_text(

json.dumps(all\_deployed, ensure\_ascii=False, indent=2))

log.info(f'Dashboard : http\://localhost:{CONFIG\["DASHBOARD\_PORT"]}')



if \_\_name\_\_ == '\_\_main\_\_':

parser = argparse.ArgumentParser()

parser.add\_argument('--ville', default='Dax')

parser.add\_argument('--categorie', default='restaurant')

parser.add\_argument('--batch', type=int, default=10)

parser.add\_argument('--dashboard', action='store\_true')

parser.add\_argument('--send', action='store\_true',

help='Envoyer WA aux sites approuvés')

args = parser.parse\_args()



if args.dashboard:

from modules.dashboard\_server import start\_dashboard

start\_dashboard(CONFIG\['OUTPUT\_DIR'], CONFIG\['DASHBOARD\_PORT'])

elif args.send:

import json

data = json.loads((CONFIG\['OUTPUT\_DIR']/'dashboard\_data.json').read\_text())

approved = \[r for r in data if r.get('validation') == 'approved']

twilio = TwilioWhatsApp()

asyncio.run(twilio.send\_batch(approved,

sender\_name='Jean-Philippe Roth'))

else:

asyncio.run(run\_pipeline(

args.ville, args.categorie, args.batch))



## **4.2 modules/\_\_init\_\_.py**

\# vide — nécessaire pour que Python traite le dossier comme un package



## **4.3 modules/state.py — Gestion de l'état**

"""Persistance de l'état entre les runs"""

import json

from pathlib import Path



def load\_state(path: Path) -> dict:

if path.exists():

return json.loads(path.read\_text())

return {'results': \[], 'batches': \[]}



def save\_state(path: Path, state: dict):

path.write\_text(json.dumps(state, ensure\_ascii=False, indent=2))



\


## **4.4 modules/apify\_search.py — Recherche Apify**

💡 *Ce fichier remplace google\_places.py. Il utilise le compte Apify existant de Jean-Philippe.*



"""

Recherche d'entreprises via Apify Google Maps Scraper.

Utilise le compte Apify existant.

"""

import aiohttp, asyncio, logging, re

from datetime import datetime



log = logging.getLogger(\_\_name\_\_)



def slugify(text: str) -> str:

text = text.lower().strip()

text = re.sub(r'\[^\w\s-]', '', text)

text = re.sub(r'\[\s\_-]+', '-', text)

return text\[:50]



async def search\_businesses(query, api\_key,

max\_rating=3.5, max\_results=30):

if not api\_key:

log.warning('APIFY\_TOKEN manquant — données de démo')

return \_demo\_businesses()



run\_id = await \_start\_run(api\_key, query, max\_results \* 3)

results\_raw = await \_wait\_for\_results(api\_key, run\_id)



businesses = \[]

for item in results\_raw:

try:

rating = float(item.get('totalScore') or

item.get('rating') or 5.0)

except (TypeError, ValueError):

continue

if rating > max\_rating:

continue

website = (item.get('website') or item.get('url') or '').strip()

if not website or not website.startswith('http'):

continue

phone = (item.get('phone') or

item.get('phoneUnformatted') or

item.get('internationalPhoneNumber') or '').strip()

name = item.get('title') or item.get('name') or 'Entreprise'

businesses.append({

'slug' : slugify(name),

'name' : name,

'website' : website,

'phone' : phone,

'email' : item.get('email', ''),

'contact\_name' : '',

'address' : item.get('address') or '',

'rating' : rating,

'reviews\_count': item.get('reviewsCount') or 0,

'category' : item.get('categoryName') or '',

'scraped\_at' : datetime.now().isoformat(),

})

if len(businesses) >= max\_results:

break

return businesses



async def \_start\_run(token, query, max\_results):

actor\_input = {

'searchStringsArray': \[query],

'maxCrawledPlacesPerSearch': max\_results,

'language': 'fr',

'countryCode': 'FR',

'includeWebResults': True,

'additionalInfo': True,

}

url = 'https\://api.apify.com/v2/acts/apify\~google-maps-scraper/runs'

async with aiohttp.ClientSession() as session:

async with session.post(

url, json={'input': actor\_input},

headers={'Authorization': f'Bearer {token}'},

params={'token': token},

timeout=aiohttp.ClientTimeout(total=30),

) as r:

if r.status not in (200, 201):

raise RuntimeError(f'Apify start error {r.status}')

data = await r.json()

return data\['data']\['id']



async def \_wait\_for\_results(token, run\_id, timeout\_s=300):

status\_url = f'https\://api.apify.com/v2/actor-runs/{run\_id}'

dataset\_url = f'{status\_url}/dataset/items'

headers = {'Authorization': f'Bearer {token}'}

elapsed = 0

async with aiohttp.ClientSession(headers=headers) as session:

while elapsed < timeout\_s:

await asyncio.sleep(10)

elapsed += 10

async with session.get(status\_url) as r:

data = await r.json()

status = data\['data']\['status']

log.info(f'Apify run {run\_id}: {status} ({elapsed}s)')

if status == 'SUCCEEDED':

async with session.get(dataset\_url,

params={'format':'json','clean':'true'}) as r:

items = await r.json()

return items if isinstance(items, list) else \[]

if status in ('FAILED', 'TIMED-OUT', 'ABORTED'):

raise RuntimeError(f'Apify run failed: {status}')

raise TimeoutError(f'Apify timeout après {timeout\_s}s')



def \_demo\_businesses():

return \[{'slug':'demo-boulangerie','name':'Boulangerie Test',

'website':'https\://example.com','phone':'0558000001',

'email':'','contact\_name':'','address':'Dax 40100',

'rating':3.1,'reviews\_count':42,'category':'Boulangerie'}]



\


## **4.5 modules/scraper.py — Scraping Playwright**

Visite chaque site avec un vrai navigateur headless, extrait le contenu utile pour la génération.



import asyncio, re, logging

from urllib.parse import urljoin



log = logging.getLogger(\_\_name\_\_)



async def scrape\_website(url: str) -> dict:

try:

from playwright.async\_api import async\_playwright

return await \_scrape\_with\_playwright(url)

except ImportError:

log.warning('Playwright non installé — fallback urllib')

return await \_scrape\_with\_urllib(url)



async def \_scrape\_with\_playwright(url: str) -> dict:

from playwright.async\_api import async\_playwright

async with async\_playwright() as p:

browser = await p.chromium.launch(headless=True)

page = await browser.new\_page(

viewport={'width':1280,'height':800},

user\_agent='Mozilla/5.0 (compatible; VitrineBot/1.0)'

)

await page.goto(url, wait\_until='networkidle', timeout=30000)

await page.wait\_for\_timeout(2000)

screenshot = await page.screenshot(

full\_page=False, type='jpeg', quality=60)

text = await page.evaluate('() => document.body.innerText')

title = await page.title()

meta\_desc = await page.evaluate(

'() => document.querySelector(

\\'meta\[name="description"]\\')

?.content || ""'

)

images = await page.evaluate("""() =>

Array.from(document.images)

.map(i => i.src)

.filter(s => s && !s.includes('data:'))

.slice(0, 20)""")

logo = await page.evaluate("""() => {

const l = document.querySelector(

'img\[class\*="logo"],header img,.logo img');

return l ? l.src : ''; }""")

primary\_color = await page.evaluate("""() => {

const h = document.querySelector(

'header,.header,nav,.navbar');

return h ?

window\.getComputedStyle(h).backgroundColor

: '#1C1F22'; }""")

nav\_links = await page.evaluate("""() =>

Array.from(document.querySelectorAll('nav a,.menu a'))

.map(a => ({text:a.innerText.trim(),href:a.href}))

.filter(a => a.text.length > 0).slice(0,15)""")

phone = ''

m = re.search(r'(\\+33|0)\[1-9]\[\s.\\-]?(\d{2}\[\s.\\-]?){4}',

text)

if m: phone = m.group(0).strip()

email = ''

m2 = re.search(r'\[\w.+-]+@\[\w-]+\\.\[a-z]{2,}', text)

if m2: email = m2.group(0)

address = ''

m3 = re.search(

r'\d{1,4}\[,\s]+(rue|avenue|boulevard|chemin)\[^,\n]{5,60}',

text, re.IGNORECASE)

if m3: address = m3.group(0).strip()

await browser.close()

import base64

return {

'url': url, 'title': title, 'meta\_desc': meta\_desc,

'text': text\[:8000], 'images': images, 'logo': logo,

'primary\_color': primary\_color, 'nav\_links': nav\_links,

'phone': phone, 'email': email, 'address': address,

'screenshot\_b64': base64.b64encode(

screenshot).decode() if screenshot else '',

}



async def \_scrape\_with\_urllib(url: str) -> dict:

"""Fallback sans Playwright (moins complet)"""

import urllib.request

from html.parser import HTMLParser

\# ... (implémentation minimale, voir fichier complet)

headers = {'User-Agent': 'Mozilla/5.0 (compatible; VitrineBot/1.0)'}

req = urllib.request.Request(url, headers=headers)

try:

with urllib.request.urlopen(req, timeout=15) as r:

html = r.read().decode('utf-8', errors='ignore')

except Exception as e:

return {'url': url, 'error': str(e), 'text': '', 'images': \[]}

phone\_m = re.search(

r'(\\+33|0)\[1-9]\[\s.\\-]?(\d{2}\[\s.\\-]?){4}', html)

email\_m = re.search(r'\[\w.+-]+@\[\w-]+\\.\[a-z]{2,}', html)

import re as re2

clean = re2.sub(r'<\[^>]+>', ' ', html)

return {

'url': url, 'title': '', 'meta\_desc': '', 'text': clean\[:8000],

'images': \[], 'logo': '', 'primary\_color': '#1C1F22',

'nav\_links': \[],

'phone': phone\_m.group(0).strip() if phone\_m else '',

'email': email\_m.group(0) if email\_m else '',

'address': '', 'screenshot\_b64': '',

}



\


## **4.6 modules/site\_generator.py — Génération Claude API**

Appelle Claude claude-sonnet-4-20250514 avec le Master Prompt pour générer un index.html premium personnalisé.



import aiohttp, json, logging, re



log = logging.getLogger(\_\_name\_\_)



MASTER\_PROMPT = """

Tu es un expert en création de sites web Conversion-First pour PME locales.



À partir des données scrapées, génère un fichier index.html COMPLET

et AUTONOME (CSS dans \<style>).



DONNÉES DU SITE SOURCE :

{data}



RÈGLES STRICTES :

1\. HTML/CSS pur uniquement — zéro framework externe sauf Google Fonts

2\. Responsive : mobile-first ET desktop

3\. Toutes les images : balises \<img> avec src URL absolue

4\. Bouton WhatsApp sticky bas mobile : href=https\://wa.me/{phone\_clean}

5\. Style : anthracite #1C1F22 + or #B8A87A + blanc #F5F6F7

6\. Typographie : Cormorant Garamond (titres) + DM Sans (corps)

7\. Sections : Hero, Services, Pourquoi nous, Contact

8\. Utilise les VRAIES infos : nom, téléphone, adresse, services

9\. Bouton CTA principal vert : #25D366 Devis gratuit WhatsApp

10\. Navigation desktop avec dropdowns si sous-pages détectées



IMPORTANT : retourne UNIQUEMENT le HTML, sans markdown ni explication.

Commence directement par \<!DOCTYPE html>

"""



async def generate\_site(scraped, biz, api\_key):

if not api\_key:

return \_demo\_html(biz)



phone\_raw = scraped.get('phone') or biz.get('phone', '')

phone\_clean = re.sub(r'\[\s.\\-()]', '', phone\_raw)

if phone\_clean.startswith('0'):

phone\_clean = '33' + phone\_clean\[1:]

phone\_clean = phone\_clean.lstrip('+')



data\_summary = {

'nom\_entreprise' : biz\['name'],

'site\_url' : biz\['website'],

'titre\_page' : scraped.get('title', ''),

'description' : scraped.get('meta\_desc', ''),

'texte\_principal': scraped.get('text', '')\[:3000],

'telephone' : scraped.get('phone') or biz.get('phone',''),

'email' : scraped.get('email') or biz.get('email',''),

'adresse' : scraped.get('address') or biz.get('address',''),

'note\_google' : f"{biz.get('rating','')} / 5",

'images\_dispo' : scraped.get('images', \[])\[:8],

'navigation' : scraped.get('nav\_links', \[]),

}



prompt = MASTER\_PROMPT.format(

data=json.dumps(data\_summary, ensure\_ascii=False, indent=2),

phone\_clean=phone\_clean

)



payload = {

'model' : 'claude-sonnet-4-20250514',

'max\_tokens': 8000,

'messages' : \[{'role': 'user', 'content': prompt}]

}

headers = {

'Content-Type' : 'application/json',

'x-api-key' : api\_key,

'anthropic-version': '2023-06-01',

}

async with aiohttp.ClientSession() as session:

async with session.post(

'https\://api.anthropic.com/v1/messages',

json=payload, headers=headers,

timeout=aiohttp.ClientTimeout(total=120)

) as r:

if r.status != 200:

raise RuntimeError(f'Claude API error {r.status}')

data = await r.json()



html = data\['content']\[0]\['text'].strip()

if not html.startswith('\<!DOCTYPE'):

m = re.search(r'\<!DOCTYPE html>.\*', html,

re.DOTALL | re.IGNORECASE)

if m: html = m.group(0)

else: raise ValueError('Claude: HTML invalide')

return html



def \_demo\_html(biz):

name = biz.get('name', 'Entreprise')

phone = biz.get('phone', '0500000000')

return f'\<!DOCTYPE html>\<html>\<head>\<title>{name}\</title>

\</head>\<body>\<h1>{name}\</h1>

\<p>Démo — clé ANTHROPIC\_API\_KEY manquante.\</p>

\<p>Tél: {phone}\</p>\</body>\</html>'



\


## **4.7 modules/netlify.py — Déploiement automatique**

Crée un site Netlify, zippe le contenu, déploie et attend que le site soit disponible.



import aiohttp, asyncio, logging, zipfile, io

from pathlib import Path



log = logging.getLogger(\_\_name\_\_)

NETLIFY\_API = 'https\://api.netlify.com/api/v1'



async def deploy\_to\_netlify(site\_dir: Path,

slug: str, token: str) -> str:

if not token:

return f'https\://demo-{slug}.netlify.app'



headers = {'Authorization': f'Bearer {token}',

'Content-Type': 'application/json'}



async with aiohttp.ClientSession(headers=headers) as session:

\# 1. Créer le site

site\_name = f'vitrine-{slug}'\[:63]

async with session.post(

f'{NETLIFY\_API}/sites',

json={'name': site\_name}

) as r:

if r.status not in (200, 201):

async with session.post(

f'{NETLIFY\_API}/sites', json={}) as r2:

data = await r2.json()

else:

data = await r.json()

site\_id = data\['id']



\# 2. Zipper le dossier

buf = io.BytesIO()

with zipfile.ZipFile(buf, 'w',

zipfile.ZIP\_DEFLATED) as zf:

html\_file = site\_dir / 'index.html'

if html\_file.exists():

zf.write(html\_file, 'index.html')

buf.seek(0)



\# 3. Déployer

deploy\_headers = {

'Authorization': f'Bearer {token}',

'Content-Type': 'application/zip',

}

async with aiohttp.ClientSession() as s2:

async with s2.post(

f'{NETLIFY\_API}/sites/{site\_id}/deploys',

data=buf.read(), headers=deploy\_headers,

timeout=aiohttp.ClientTimeout(total=120)

) as r:

deploy\_data = await r.json()

deploy\_id = deploy\_data\['id']



\# 4. Attendre que le site soit en ligne

for \_ in range(20):

await asyncio.sleep(3)

async with session.get(

f'{NETLIFY\_API}/deploys/{deploy\_id}') as r:

s = await r.json()

state = s.get('state', '')

if state == 'ready':

return s.get('ssl\_url') or s.get('url', '')

if state in ('error', 'failed'):

raise RuntimeError('Netlify deploy failed')

raise TimeoutError('Netlify timeout après 60s')



\


## **4.8 modules/twilio\_sender.py — Envoi WhatsApp**

Utilise le compte Twilio existant de Jean-Philippe. Envoie les messages avec un délai de 3s entre chaque envoi pour éviter la détection spam.



import aiohttp, asyncio, logging, re, os



log = logging.getLogger(\_\_name\_\_)



class TwilioWhatsApp:

BASE\_URL = 'https\://api.twilio.com/2010-04-01'



def \_\_init\_\_(self):

self.account\_sid = os.getenv('TWILIO\_ACCOUNT\_SID', '')

self.auth\_token = os.getenv('TWILIO\_AUTH\_TOKEN', '')

self.from\_number = os.getenv('TWILIO\_WHATSAPP\_FROM', '')

self.\_simulated = not all(\[

self.account\_sid,

self.auth\_token,

self.from\_number

])

if self.\_simulated:

log.warning('Twilio non configuré — mode simulation')



async def send(self, to\_phone: str, message: str) -> dict:

to\_wa = self.\_format\_number(to\_phone)

if not to\_wa:

return {'status':'error',

'error':f'Numéro invalide: {to\_phone}'}

if self.\_simulated:

log.info(f'\[SIM] WA → {to\_wa}: {message\[:60]}…')

return {'status':'simulated','to':to\_wa}



url = (f'{self.BASE\_URL}/Accounts/'

f'{self.account\_sid}/Messages.json')

data = {'From':self.from\_number,'To':to\_wa,'Body':message}

async with aiohttp.ClientSession() as session:

async with session.post(

url, data=data,

auth=aiohttp.BasicAuth(

self.account\_sid, self.auth\_token),

timeout=aiohttp.ClientTimeout(total=30),

) as r:

resp = await r.json()

if r.status in (200, 201):

return {'status':'sent','to':to\_wa,

'sid':resp.get('sid','')}

return {'status':'error',

'error':resp.get('message',''),

'to':to\_wa}



async def send\_batch(self, results, sender\_name=

'Jean-Philippe Roth', delay\_s=3.0):

send\_results = \[]

for i, r in enumerate(results):

phone = r.get('phone', '')

if not phone:

send\_results.append({'slug':r\['slug'],

'status':'skipped','reason':'no\_phone'})

continue

msg = build\_message(r, sender\_name)

result = await self.send(phone, msg)

result\['slug'] = r\['slug']

result\['name'] = r\['name']

send\_results.append(result)

if i < len(results) - 1:

await asyncio.sleep(delay\_s)

return send\_results



def \_format\_number(self, phone: str) -> str:

digits = re.sub(r'\D', '', phone)

if digits.startswith('33'): digits = digits\[2:]

elif digits.startswith('0'): digits = digits\[1:]

if len(digits) != 9: return ''

return f'whatsapp:+33{digits}'



def build\_message(result, sender\_name='Jean-Philippe Roth'):

contact = result.get('contact\_name', '').strip()

name = result.get('name', 'votre entreprise')

demo\_url = result.get('demo\_url', '')

category = result.get('category', '')

greeting = f'Bonjour {contact},' if contact else 'Bonjour,'

sector = \_sector\_phrase(category)

return (

f'{greeting}\n\n'

f'C\\'est {sender\_name}. Je me permets de vous contacter '

f'car je travaille sur l\\'optimisation digitale des '

f'entreprises de Dax.\n\n'

f'En tombant sur le site de \*{name}\*, j\\'ai remarqué '

f"qu'il n'était pas encore optimisé pour les smartphones"

f' — ce qui freine pas mal les prises de contact. '

f'J\\'ai pris la liberté de vous préparer une \*Vitrine '

f'Mobile\* gratuite{sector}.\n\n'

f'👉 Voir la démo : {demo\_url}\n\n'

f'C\\'est ultra-rapide, vos services en avant, et un '

f'bouton WhatsApp direct pour vos clients.\n\n'

f'On peut s\\'appeler 2 minutes demain ?\n\n'

f'Bonne journée ! 🙂'

)



def \_sector\_phrase(category: str) -> str:

cat = category.lower()

if any(w in cat for w in \['restaurant','brasserie','café']):

return ' avec votre menu et vos horaires mis en avant'

if any(w in cat for w in \['coiffeur','beauté','spa']):

return ' avec votre galerie de réalisations'

if any(w in cat for w in \['garage','auto','mécanique']):

return ' avec vos prestations et zone d\\'intervention'

if any(w in cat for w in \['boulangerie','pâtisserie']):

return ' avec vos spécialités et horaires'

return ''



\


## **4.9 modules/dashboard\_server.py — Interface de validation**

Serveur HTTP local sur le port 8765. Sert l'interface de validation. Le code HTML complet du dashboard est généré par la fonction \_build\_dashboard\_html(). Se référer au fichier fourni séparément (dashboard\_server.py) pour le code complet — il contient \~400 lignes de HTML/CSS/JS.



import http.server, socketserver, json, logging, webbrowser, threading

from pathlib import Path

from urllib.parse import urlparse, parse\_qs

from modules.twilio\_sender import TwilioWhatsApp, build\_message

from urllib.parse import quote



log = logging.getLogger(\_\_name\_\_)



def start\_dashboard(output\_dir: Path, port: int = 8765):

handler = \_make\_handler(output\_dir)

with socketserver.TCPServer(('', port), handler) as httpd:

url = f'http\://localhost:{port}'

log.info(f'Dashboard: {url}')

threading.Timer(1.0,

lambda: webbrowser.open(url)).start()

httpd.serve\_forever()



\# Routes :

\# GET / → dashboard HTML

\# GET /api/data → liste JSON des sites déployés

\# GET /api/approve?slug=X → approuver un site

\# GET /api/reject?slug=X → rejeter un site

\# GET /api/send-all → envoyer WA aux sites approuvés (Twilio)



\# IMPORTANT : dans /api/send-all, remplacer les liens wa.me manuels

\# par l'appel Twilio :

\#

\# twilio = TwilioWhatsApp()

\# approved = \[r for r in data if r.get('validation')=='approved']

\# import asyncio

\# results = asyncio.run(twilio.send\_batch(approved,

\# sender\_name='Jean-Philippe Roth'))

\# return json.dumps({'sent': len(results), 'results': results})

\


\


# **5. Utilisation au quotidien**

## **5.1 Lancer le pipeline complet**

\# Depuis le dossier vitrine-auto/

source venv/bin/activate



\# Lancer le pipeline (durée : \~20-30 min pour 10 sites)

python main.py --ville "Dax" --categorie "restaurant" --batch 10



\# Autres catégories utiles :

python main.py --ville "Dax" --categorie "coiffeur" --batch 10

python main.py --ville "Dax" --categorie "garage" --batch 10

python main.py --ville "Dax" --categorie "boulangerie" --batch 10

python main.py --ville "Dax" --categorie "plombier" --batch 10


## **5.2 Ouvrir le dashboard (pilotage & validation)**

- Ouvrir le dashboard web (depuis n'importe où) :
  - `https://popey.academy/admin/humain/vitrines`

## **5.3 Envoyer les WhatsApp après validation**

Depuis le dashboard web : sélectionner les vitrines `approved` puis lancer l'envoi (Twilio template).



## **5.4 Workflow quotidien de Jean-Philippe**



**Étape**

**Action**

1 — Matin (2 min)

Terminal : python main.py --ville "Dax" --categorie "restaurant" --batch 10

2 — Attendre (\~25 min)

Le pipeline tourne en arrière-plan, logs dans vitrine\_auto.log

3 — Notification email

Recevoir l'email avec les liens des sites déployés

Admin web : `https://popey.academy/admin/humain/vitrines` → aperçu de chaque site → ✓ ou ✗

python main.py --dashboard → aperçu de chaque site → ✓ ou ✗
Cliquer "Envoyer les approuvés" → Twilio envoie les WA automatiquement (template)

Total

< 10 minutes d'interaction pour 10 prospects contactés

\


\


# **6. Tests et validation**

## **6.1 Test en mode simulation (sans clés API)**

Sans configurer les clés, le pipeline fonctionne en mode démo : Apify retourne des données fictives, Claude génère un HTML minimal, la publication Supabase/Vercel simule une `public_url`.

\# Tester sans aucune clé API (mode 100% simulation)

python main.py --ville "Dax" --categorie "test" --batch 2



\# Vérifier que les fichiers sont créés :

ls output/

ls output/demo-boulangerie/

cat output/dashboard\_data.json | python -m json.tool



## **6.2 Test de chaque module séparément**

\# Tester Apify seul

python -c "

import asyncio, os

from modules.apify\_search import search\_businesses

results = asyncio.run(search\_businesses(

'restaurant Dax', os.getenv('APIFY\_TOKEN'), max\_results=3))

print(f'{len(results)} entreprises trouvées')

for r in results: print(f' {r\["name"]} — {r\["rating"]} — {r\["website"]}')"



\# Tester Playwright

python -c "

import asyncio

from modules.scraper import scrape\_website

data = asyncio.run(scrape\_website('https\://miroiteriedeladour.fr'))

print('Titre:', data\['title'])

print('Téléphone:', data\['phone'])

print('Texte (100 chars):', data\['text']\[:100])"



\# Tester Twilio (simulation si pas de clé)

python -c "

import asyncio

from modules.twilio\_sender import TwilioWhatsApp

twilio = TwilioWhatsApp()

r = asyncio.run(twilio.send('0612345678', 'Test message'))

print(r)"



## **6.3 Test de bout en bout sur 1 site réel**

\# Test avec 1 seul site pour valider le pipeline complet

python main.py --ville "Dax" --categorie "menuisier" --batch 1



\# Vérifier le résultat :

cat output/dashboard\_data.json

\# → doit contenir 1 entrée avec public\_url remplie (ex: https://vitrine.popey.academy/{slug})



\# Ouvrir le dashboard pour voir le site :

python main.py --dashboard

\


\


# **7. Dépannage**



**Erreur**

**Cause probable**

**Solution**

APIFY\_TOKEN manquant

Variable d'env non chargée

Vérifier le .env et relancer avec 'source venv/bin/activate'

Playwright: browser not found

Chromium non installé

'playwright install chromium'

Claude API error 401

Clé Anthropic invalide

Vérifier ANTHROPIC\_API\_KEY dans .env

Claude API error 529

Surcharge API

Attendre 30s et relancer — normal en heure de pointe

Vitrine URL inaccessible (404/timeout)

Mapping Supabase manquant ou routage Vercel/DNS pas propagé

Vérifier l'entrée `vitrine_sites` (slug), le contenu du bucket Storage, et le domaine `vitrine.popey.academy` dans Vercel (puis attendre la propagation DNS si besoin)

Twilio error 21211

Numéro WhatsApp non validé

Vérifier que le numéro destinataire a opt-in WhatsApp Business

Twilio error 63007

Template non approuvé

Utiliser un message template approuvé dans la console Twilio

state.json corrompu

Arrêt brutal du pipeline

Supprimer state.json et relancer — les slugs déjà traités seront re-traités

Apify run TIMED-OUT

Trop de résultats demandés

Réduire max\_results ou augmenter timeout\_s dans apify\_search.py



## **7.1 Point critique Twilio WhatsApp**

⚠️ **WhatsApp Business impose que le destinataire ait préalablement envoyé un message au numéro Twilio, OU que vous utilisiez des templates de messages pré-approuvés par Meta.**

Pour la prospection à froid (premier message), il faut soit :

- Utiliser un template approuvé : créer un template dans la console Twilio → soumettre à Meta → attendre validation (24-48h)
- Utiliser le sandbox Twilio pour les tests : chaque destinataire test doit envoyer 'join \<sandbox-keyword>' au numéro sandbox

💡 *Si Jean-Philippe utilise déjà Twilio WhatsApp sur un autre projet, il a probablement déjà des templates approuvés. Lui demander lesquels sont disponibles et adapter le message dans build\_message().*

\


\


# **8. Checklist de livraison**

À valider dans l'ordre avant de considérer le projet terminé :



## **8.1 Setup infrastructure**

- \[ ] Clé Anthropic API créée et testée
- \[ ] Domaine `vitrine.popey.academy` ajouté au projet Vercel + DNS OVH configuré
- \[ ] Token Apify récupéré depuis le compte de Jean-Philippe
- \[ ] Credentials Twilio récupérés depuis le compte de Jean-Philippe
- \[ ] Bucket Supabase Storage `vitrines` créé (si nécessaire) + clé SERVICE ROLE disponible pour le pipeline local
- \[ ] Fichier .env créé et rempli
- \[ ] .gitignore contient .env et output/



## **8.2 Tests fonctionnels**

- \[ ] python main.py --batch 1 → 1 site généré et publié
- \[ ] URL `https://vitrine.popey.academy/{slug}` accessible depuis un navigateur mobile
- \[ ] Dashboard web accessible sur `https://popey.academy/admin/humain/vitrines`
- \[ ] Boutons ✓ et ✗ du dashboard fonctionnent
- \[ ] Twilio simulation envoie sans erreur
- \[ ] Twilio réel : 1 message WA envoyé au téléphone de test



## **8.3 Test pipeline complet**

- \[ ] Batch de 10 sites : Apify → Claude → Supabase (upload) → Dashboard → Twilio
- \[ ] Durée totale < 30 minutes pour 10 sites
- \[ ] Logs propres dans vitrine\_auto.log
- \[ ] state.json persiste correctement entre deux runs
- \[ ] Les entreprises déjà traitées ne sont pas re-traitées



## **8.4 Qualité des sites générés**

- \[ ] Chaque site est responsive mobile et desktop
- \[ ] Le bouton WhatsApp sticky fonctionne sur iPhone
- \[ ] Les infos de l'entreprise (nom, téléphone, adresse) sont correctes
- \[ ] Les images du site source sont bien récupérées
- \[ ] Le site se charge en moins de 2 secondes

\


\


# **9. Notes pour l'ingénieur**

## **9.1 Points d'attention importants**

- Apify : si Jean-Philippe utilise un actor différent de apify/google-maps-scraper, adapter les noms de champs dans apify\_search.py (totalScore → rating, title → name, etc.)
- Twilio : le délai de 3 secondes entre envois (delay\_s=3.0) est important — ne pas le supprimer pour éviter les blocages WhatsApp
- Claude API : le modèle est claude-sonnet-4-20250514 — ne pas changer sans tester, les autres modèles peuvent retourner du markdown autour du HTML
- Publication : `vitrine.popey.academy` doit rester sur le même projet Vercel (cohérence infra). Le stockage Supabase doit limiter taille/nombre d'assets par vitrine.
- Playwright : nécessite \~300 MB de disque pour Chromium — prévoir de l'espace sur le serveur



## **9.2 Améliorations futures possibles**

- Webhook Apify : au lieu du polling, configurer un webhook qui déclenche automatiquement le pipeline quand un run Apify se termine
- Interface de config web : formulaire HTML pour changer ville/catégorie sans terminal
- Suivi des réponses : intégrer Twilio webhooks pour tracker les réponses WhatsApp et les afficher dans le dashboard
- Export CSV : bouton dans le dashboard pour exporter la liste des prospects avec statut
- Cron job : planifier le pipeline tous les matins à 8h avec cron ou Task Scheduler Windows



## **9.3 Commandes utiles résumées**

\# Démarrer le pipeline

python main.py --ville "Dax" --categorie "restaurant" --batch 10



\# Ouvrir le dashboard

python main.py --dashboard



\# Envoyer les WhatsApp approuvés

python main.py --send



\# Voir les logs en temps réel

tail -f vitrine\_auto.log



\# Voir les sites déployés

cat output/dashboard\_data.json | python -m json.tool



\# Réinitialiser l'état (recommencer à zéro)

rm state.json



\# Tester un site spécifique

python -c "

import asyncio

from modules.scraper import scrape\_website

r = asyncio.run(scrape\_website('https\://example.com'))

print(r\['title'], r\['phone'])"



─────────────────────────────────────────

*Document généré pour Jean-Philippe Roth*

Vitrine Auto — Pipeline automatisé · Dax (40)
