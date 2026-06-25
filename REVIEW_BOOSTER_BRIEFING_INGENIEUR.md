# 🌟 REVIEW BOOSTER — Briefing Technique Complet
### Système automatisé de collecte d'avis Google pour PME locales
**Client : Jean-Philippe Roth · Dax (40)**
**Destinataire : Ingénieur développeur**

---

## 1. VISION DU PROJET

### Le problème résolu
Un artisan ou commerçant local a des clients satisfaits mais ne reçoit presque jamais d'avis Google. Pourquoi ? Parce qu'il oublie de demander, qu'il est pudique, ou que ses clients ne pensent pas à le faire spontanément. Résultat : sa fiche Google stagne à 12 avis alors que son concurrent en a 80 — et c'est son concurrent qui décroche les appels.

### La solution
Un système automatisé qui :
1. Reçoit la liste des clients récents du commerçant (via formulaire de saisie ou fichier CSV)
2. Envoie automatiquement un WhatsApp personnalisé à J+1 ou J+2 après la prestation
3. Dirige le client vers une **page de filtrage intelligente** avant Google
4. Si client satisfait → redirige vers le lien Google qui ouvre directement les 5 étoiles
5. Si client insatisfait → capture le mécontentement dans un formulaire privé (jamais sur Google)
6. Relance automatique à J+6 si pas de réponse
7. Jean-Philippe supervise tout depuis un dashboard clair

---

### Comment le commerçant transmet ses clients — 2 méthodes à développer

#### Méthode principale — Formulaire de saisie sur téléphone

Chaque commerçant reçoit une URL unique et secrète :
`app.vitrines-dax.fr/saisie/TOKEN-SECRET-DU-COMMERCE`

Il met cette page en favori sur son téléphone. Après chaque prestation, il saisit en 15 secondes le prénom et le numéro du client. L'interface doit être ultra-simple, pensée pour être utilisée d'une seule main entre deux clients.

**Interface à développer (mobile-first, même design que les vitrines) :**
```
┌─────────────────────────────┐
│  Boulangerie Martin         │
│  Nouveau client             │
├─────────────────────────────┤
│  Prénom                     │
│  ┌─────────────────────┐    │
│  │ Marie               │    │
│  └─────────────────────┘    │
│                             │
│  Téléphone                  │
│  ┌─────────────────────┐    │
│  │ 06 12 34 56 78      │    │
│  └─────────────────────┘    │
│                             │
│  [ ✓  Ajouter ce client ]   │
└─────────────────────────────┘
```

Règles techniques pour cette page :
- Champ téléphone : clavier numérique automatique (`inputmode="tel"`)
- Validation en temps réel du format téléphone (10 chiffres FR)
- Confirmation visuelle immédiate après ajout ("✅ Marie ajoutée !")
- Champs remis à zéro automatiquement pour la saisie suivante
- Fonctionne sans connexion stable (Progressive Web App si possible)
- Pas de login requis — le token dans l'URL suffit à identifier le commerce

#### Méthode de secours — Import CSV

Pour les commerçants qui préfèrent envoyer un fichier en une fois (export de leur logiciel de caisse, tableau Excel...), le dashboard accepte un CSV en drag & drop.

**Format CSV attendu :**
```
prenom,telephone,date_prestation
Marie,0612345678,2025-05-10
Pierre,0687654321,2025-05-11
```

Le système valide automatiquement chaque ligne, ignore les doublons et les numéros invalides, et affiche un résumé avant import ("23 clients valides, 2 ignorés").

### Pourquoi ce système est puissant
- **Valeur perçue énorme** pour le commerçant : passer de 15 à 80 avis en 3 mois
- **Revenus récurrents** pour Jean-Philippe : abonnement mensuel
- **Automatisation quasi-totale** : Jean-Philippe passe 10 min/jour max
- **Légalité** : la page intermédiaire est un "formulaire de satisfaction" — c'est une pratique marketing standard

---

## 2. ARCHITECTURE GLOBALE

```
┌─────────────────────────────────────────────────────────┐
│                    JEAN-PHILIPPE                         │
│              (seule interaction humaine)                 │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  DASHBOARD ADMIN                         │
│  • Ajouter un client (commerçant)                       │
│  • Importer la liste des clients finaux (CSV)           │
│  • Valider/modifier les messages avant envoi            │
│  • Voir les stats en temps réel                         │
│  • Gérer les abonnements                                │
└──────────────────────┬──────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
   ┌──────────┐  ┌──────────┐  ┌──────────┐
   │  Twilio  │  │ Base de  │  │  Pages   │
   │ WhatsApp │  │ données  │  │filtrage  │
   │  Envois  │  │(clients, │  │(une par  │
   │automatis.│  │ avis,    │  │ commerce)│
   └──────────┘  │ stats)   │  └──────────┘
                 └──────────┘
```

---

## 3. STACK TECHNIQUE RECOMMANDÉE

```
Backend    : Python (FastAPI) ou Node.js (Express)
Base de données : PostgreSQL (via Supabase — gratuit jusqu'à 500MB)
Frontend   : HTML/CSS/JS vanilla (même stack que les vitrines)
             OU React si l'ingénieur préfère
WhatsApp   : Twilio API (compte existant de Jean-Philippe)
Hébergement: Railway ou Render (gratuit/5$/mois)
Emails     : SendGrid (notifications) ou Resend
Fichiers   : Upload CSV en local, parsing Python/Node
```

**Pourquoi Supabase ?**
- Gratuit pour commencer
- Interface visuelle pour voir les données
- API REST automatique
- Auth intégrée pour le dashboard

---

## 4. SCHÉMA DE BASE DE DONNÉES

```sql
-- Les commerçants clients de Jean-Philippe
TABLE commercants (
  id              UUID PRIMARY KEY,
  nom             TEXT NOT NULL,           -- "Boulangerie Martin"
  proprietaire    TEXT,                    -- "M. Martin"
  telephone       TEXT,                    -- numéro du commerçant
  email           TEXT,
  ville           TEXT DEFAULT 'Dax',
  secteur         TEXT,                    -- "boulangerie", "garage"...
  place_id        TEXT,                    -- ID Google Maps
  lien_avis       TEXT,                    -- lien direct Google reviews
  lien_filtrage   TEXT,                    -- URL de la page intermédiaire
  abonnement      TEXT DEFAULT 'actif',    -- actif / pause / résilié
  mensualite      INTEGER DEFAULT 79,      -- € par mois
  date_debut      DATE,
  nb_avis_debut   INTEGER DEFAULT 0,       -- nb avis au démarrage
  nb_avis_actuel  INTEGER DEFAULT 0,       -- mis à jour par cron
  created_at      TIMESTAMP DEFAULT NOW()
)

-- Les clients finaux (ceux qui reçoivent le WA)
TABLE clients_finaux (
  id              UUID PRIMARY KEY,
  commercant_id   UUID REFERENCES commercants(id),
  prenom          TEXT NOT NULL,
  telephone       TEXT NOT NULL,           -- format international +33...
  date_prestation DATE NOT NULL,
  statut          TEXT DEFAULT 'en_attente',
                  -- en_attente / envoyé / cliqué / avis_laissé
                  -- / insatisfait / relancé / terminé
  date_envoi_j1   TIMESTAMP,
  date_envoi_j6   TIMESTAMP,              -- relance
  lien_unique     TEXT UNIQUE,            -- token UUID pour tracking
  satisfaction    TEXT,                   -- 'positif' / 'negatif' / NULL
  avis_prive      TEXT,                   -- texte si insatisfait
  created_at      TIMESTAMP DEFAULT NOW()
)

-- Log de tous les envois WhatsApp
TABLE envois_whatsapp (
  id              UUID PRIMARY KEY,
  client_final_id UUID REFERENCES clients_finaux(id),
  type_envoi      TEXT,                   -- 'j1' ou 'j6_relance'
  message_envoye  TEXT,
  twilio_sid      TEXT,
  statut_twilio   TEXT,                   -- sent / delivered / failed
  created_at      TIMESTAMP DEFAULT NOW()
)

-- Avis négatifs capturés (jamais envoyés sur Google)
TABLE avis_negatifs (
  id              UUID PRIMARY KEY,
  client_final_id UUID REFERENCES clients_finaux(id),
  commercant_id   UUID REFERENCES commercants(id),
  message         TEXT NOT NULL,
  traite          BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT NOW()
)
```

---

## 5. WORKFLOW DÉTAILLÉ ÉTAPE PAR ÉTAPE

### Étape 1 — Onboarding d'un nouveau commerçant

Jean-Philippe ajoute un nouveau client depuis le dashboard :
1. Saisit le nom, téléphone, secteur, ville
2. Cherche le Place ID Google (via l'API Places ou manuellement)
3. Le système génère automatiquement :
   - Le lien direct avis : `https://search.google.com/local/writereview?placeid=PLACE_ID`
   - L'URL de la page de filtrage : `https://avis.vitrines-dax.fr/SLUG-COMMERCE`
4. Le système note le nombre d'avis actuel (baseline)

**Comment récupérer le Place ID automatiquement :**
```python
# Via l'API Google Places (même clé que pour Apify)
import requests

def get_place_id(nom_commerce, ville="Dax"):
    url = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
    params = {
        "input": f"{nom_commerce} {ville}",
        "inputtype": "textquery",
        "fields": "place_id,name,rating,user_ratings_total",
        "key": GOOGLE_API_KEY
    }
    r = requests.get(url, params=params)
    data = r.json()
    if data["candidates"]:
        return data["candidates"][0]
    return None
```

---

### Étape 2 — Import des clients finaux

Jean-Philippe reçoit du commerçant un fichier CSV avec ses clients récents.

**Format CSV attendu (à documenter pour les commerçants) :**
```
prenom,telephone,date_prestation
Marie,0612345678,2025-05-10
Pierre,0687654321,2025-05-11
Sophie,0698765432,2025-05-09
```

**Traitement backend :**
```python
import pandas as pd
from datetime import datetime, timedelta

def importer_clients(fichier_csv, commercant_id):
    df = pd.read_csv(fichier_csv)
    clients_valides = []
    
    for _, row in df.iterrows():
        date_prest = pd.to_datetime(row['date_prestation'])
        
        # Ne cibler que les 30 derniers jours
        if (datetime.now() - date_prest).days > 30:
            continue
        
        # Formater le téléphone en international
        tel = formater_telephone(row['telephone'])
        if not tel:
            continue
            
        # Générer token unique pour tracking
        token = str(uuid.uuid4())
        
        clients_valides.append({
            "commercant_id" : commercant_id,
            "prenom"        : row['prenom'].strip().capitalize(),
            "telephone"     : tel,
            "date_prestation": date_prest,
            "lien_unique"   : token,
            "statut"        : "en_attente"
        })
    
    # Insérer en base
    db.insert("clients_finaux", clients_valides)
    return len(clients_valides)

def formater_telephone(tel):
    # Nettoyer et convertir en +33XXXXXXXXX
    digits = re.sub(r'\D', '', str(tel))
    if digits.startswith('0') and len(digits) == 10:
        return '+33' + digits[1:]
    if digits.startswith('33') and len(digits) == 11:
        return '+' + digits
    return None
```

---

### Étape 3 — Envoi WhatsApp automatique à J+1

Un job planifié (cron toutes les heures) vérifie les clients à contacter :

```python
from datetime import datetime, timedelta

def job_envois_whatsapp():
    now = datetime.now()
    
    # Clients à contacter pour la première fois (J+1)
    clients_j1 = db.query("""
        SELECT cf.*, c.nom as nom_commerce, c.lien_filtrage,
               c.proprietaire
        FROM clients_finaux cf
        JOIN commercants c ON cf.commercant_id = c.id
        WHERE cf.statut = 'en_attente'
        AND cf.date_prestation <= NOW() - INTERVAL '1 day'
        AND cf.date_prestation >= NOW() - INTERVAL '2 days'
        AND cf.date_envoi_j1 IS NULL
    """)
    
    for client in clients_j1:
        envoyer_whatsapp_j1(client)
    
    # Clients à relancer (J+6, pas de réponse)
    clients_relance = db.query("""
        SELECT cf.*, c.nom as nom_commerce, c.lien_filtrage
        FROM clients_finaux cf
        JOIN commercants c ON cf.commercant_id = c.id
        WHERE cf.statut = 'envoyé'
        AND cf.date_envoi_j1 <= NOW() - INTERVAL '5 days'
        AND cf.date_envoi_j6 IS NULL
    """)
    
    for client in clients_relance:
        envoyer_relance(client)
```

---

### Étape 4 — Messages WhatsApp (templates Twilio approuvés)

**Message J+1 (premier envoi) :**
```
Bonjour {{1}},

C'est {{2}}. Votre satisfaction compte beaucoup pour nous.
30 secondes pour nous aider ? 👉 {{3}}

Merci !
```
- `{{1}}` = prénom du client final
- `{{2}}` = prénom du propriétaire du commerce
- `{{3}}` = lien de la page de filtrage avec token unique

**Message J+6 (relance) :**
```
Bonjour {{1}}, juste un petit rappel 🙂 👉 {{2}}
```

**Code d'envoi Twilio :**
```python
from twilio.rest import Client

def envoyer_whatsapp_j1(client):
    twilio_client = Client(TWILIO_SID, TWILIO_TOKEN)
    
    lien_tracking = f"{client['lien_filtrage']}?t={client['lien_unique']}"
    
    message = twilio_client.messages.create(
        from_=TWILIO_WHATSAPP_FROM,
        to=f"whatsapp:{client['telephone']}",
        # Utiliser le Content SID du template approuvé Meta
        content_sid=TEMPLATE_SID_J1,
        content_variables=json.dumps({
            "1": client['prenom'],
            "2": extraire_prenom(client['proprietaire']),
            "3": lien_tracking
        })
    )
    
    # Logger l'envoi
    db.insert("envois_whatsapp", {
        "client_final_id": client['id'],
        "type_envoi"     : "j1",
        "message_envoye" : f"Template J1 → {lien_tracking}",
        "twilio_sid"     : message.sid,
        "statut_twilio"  : message.status
    })
    
    # Mettre à jour le statut
    db.update("clients_finaux", client['id'], {
        "statut"      : "envoyé",
        "date_envoi_j1": datetime.now()
    })
```

---

### Étape 5 — Page de filtrage (le cœur du système)

Chaque commerçant a une URL unique : `https://avis.vitrines-dax.fr/boulangerie-martin?t=TOKEN`

Cette page est **ultra-simple, ultra-rapide, mobile-first**.

**Design de la page de filtrage :**

```
┌─────────────────────────────────┐
│  Logo/nom du commerce           │
│                                 │
│  "Bonjour Marie,                │
│   Êtes-vous satisfait(e) de     │
│   notre prestation ?"           │
│                                 │
│  ┌─────────┐    ┌─────────┐    │
│  │  😊 OUI │    │  😞 NON │    │
│  │ C'était │    │ Pas tout│    │
│  │  super  │    │  à fait │    │
│  └─────────┘    └─────────┘    │
└─────────────────────────────────┘
```

**Si OUI → redirect immédiat vers Google :**
```python
@app.get("/avis/{slug}")
def page_filtrage(slug: str, t: str):
    # Récupérer le client et le commerce
    client = db.get_client_by_token(t)
    commerce = db.get_commercant_by_slug(slug)
    
    if not client or not commerce:
        return redirect("/")
    
    # Logger le clic
    db.update_client(t, {"statut": "cliqué"})
    
    return render_template("filtrage.html",
        prenom=client['prenom'],
        nom_commerce=commerce['nom'],
        lien_avis=commerce['lien_avis'],
        token=t,
        slug=slug
    )

@app.post("/avis/{slug}/satisfaction")
def reponse_satisfaction(slug: str, t: str, choix: str):
    if choix == "oui":
        # Mise à jour statut
        db.update_client(t, {"statut": "avis_laissé", "satisfaction": "positif"})
        # Redirect vers Google → ouvre directement les 5 étoiles
        commerce = db.get_commercant_by_slug(slug)
        return redirect(commerce['lien_avis'])
    
    elif choix == "non":
        db.update_client(t, {"satisfaction": "negatif"})
        return redirect(f"/avis/{slug}/feedback?t={t}")

@app.get("/avis/{slug}/feedback")
def page_feedback(slug: str, t: str):
    # Page formulaire pour capturer l'insatisfaction
    return render_template("feedback.html", token=t, slug=slug)

@app.post("/avis/{slug}/feedback")
def soumettre_feedback(slug: str, t: str, message: str):
    client = db.get_client_by_token(t)
    commerce = db.get_commercant_by_slug(slug)
    
    # Sauvegarder l'avis négatif (jamais publié)
    db.insert("avis_negatifs", {
        "client_final_id": client['id'],
        "commercant_id"  : commerce['id'],
        "message"        : message
    })
    db.update_client(t, {"statut": "insatisfait"})
    
    # Notifier le commerçant par WhatsApp
    notifier_commercant_avis_negatif(commerce, message)
    
    return render_template("merci_feedback.html")
```

**Design de la page feedback (si NON) :**
```
┌─────────────────────────────────┐
│  "Nous sommes désolés que       │
│   votre expérience n'ait pas    │
│   été parfaite."                │
│                                 │
│  "Dites-nous ce qui s'est       │
│   passé — M. Martin vous        │
│   recontacte personnellement."  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ Votre message...          │  │
│  │                           │  │
│  └───────────────────────────┘  │
│                                 │
│  [  Envoyer au gérant  ]        │
└─────────────────────────────────┘
```

---

### Étape 6 — Mise à jour automatique du compteur d'avis

Un cron quotidien récupère le nombre d'avis actuel sur Google pour chaque commerçant :

```python
import requests

def maj_compteur_avis():
    commercants = db.get_all_commercants_actifs()
    
    for commerce in commercants:
        url = "https://maps.googleapis.com/maps/api/place/details/json"
        params = {
            "place_id": commerce['place_id'],
            "fields"  : "rating,user_ratings_total",
            "key"     : GOOGLE_API_KEY
        }
        r = requests.get(url, params=params)
        data = r.json().get("result", {})
        
        nb_avis = data.get("user_ratings_total", 0)
        note    = data.get("rating", 0)
        
        db.update_commercant(commerce['id'], {
            "nb_avis_actuel": nb_avis,
            "note_actuelle" : note
        })
        
    print(f"Compteurs mis à jour pour {len(commercants)} commerces")
```

---

## 6. DASHBOARD ADMIN — INTERFACE JEAN-PHILIPPE

### Philosophie UX
- **Une page = une action** : pas de menus imbriqués, pas de confusion
- **Chiffres gros et visibles** : Jean-Philippe doit voir en 3 secondes si ça marche
- **Actions en 1 clic** : import CSV, validation, envoi
- **Mobile compatible** : Jean-Philippe peut tout gérer depuis son téléphone

---

### Page 1 — Vue d'ensemble (accueil dashboard)

```
┌─────────────────────────────────────────────────────────┐
│  REVIEW BOOSTER                          [+ Ajouter]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │  Clients │  │  Envois  │  │  Avis    │  │Revenus │  │
│  │  actifs  │  │ ce mois  │  │générés   │  │/mois   │  │
│  │    12    │  │   247    │  │    89    │  │ 948€   │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  MES CLIENTS                                            │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🥐 Boulangerie Martin    ★4.8  +23 avis  [→]   │    │
│  │ 🔧 Garage du Stade       ★4.2  +18 avis  [→]   │    │
│  │ ✂️  Salon Coiffure B.    ★4.6  +31 avis  [→]   │    │
│  │ 🚿 Plombier Express      ★3.9   +9 avis  [→]   │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ⚠️  3 avis négatifs à traiter           [Voir tout]   │
└─────────────────────────────────────────────────────────┘
```

---

### Page 2 — Fiche d'un commerçant

```
┌─────────────────────────────────────────────────────────┐
│  ← Boulangerie Martin                    [Modifier]     │
├────────────────────────┬────────────────────────────────┤
│  PERFORMANCE           │  PIPELINE                      │
│                        │                                │
│  Avis au départ : 15   │  En attente    : 12            │
│  Avis aujourd'hui: 38  │  Envoyés       : 34            │
│  Progression : +23 ★   │  Cliqués       : 28  (82%)     │
│                        │  Avis laissés  : 21  (75%)     │
│  Note : 3.8 → 4.6      │  Insatisfaits  :  3   (9%)     │
│         ↑ +0.8 ★       │                                │
├────────────────────────┴────────────────────────────────┤
│  IMPORTER DES CLIENTS                                   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  📎 Glissez votre fichier CSV ici               │    │
│  │     ou cliquez pour choisir                     │    │
│  │                                                 │    │
│  │  Format attendu : prenom, telephone,            │    │
│  │  date_prestation                                │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  Dernier import : 14 mai — 23 clients importés         │
│                                                         │
│  [  Voir les clients importés  ]                        │
├─────────────────────────────────────────────────────────┤
│  LIENS                                                  │
│  Page filtrage : avis.vitrines-dax.fr/boulangerie-martin│
│  Lien Google   : [Copier] [Tester]                      │
│  QR Code       : [Télécharger PNG] [Télécharger SVG]    │
└─────────────────────────────────────────────────────────┘
```

---

### Page 3 — Avis négatifs (prioritaire)

```
┌─────────────────────────────────────────────────────────┐
│  ← AVIS NÉGATIFS À TRAITER               3 en attente  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  🔧 Garage du Stade · il y a 2 jours            │    │
│  │  Client : Pierre M.  · 06 87 65 43 21           │    │
│  │                                                 │    │
│  │  "Le devis était de 350€ et la facture          │    │
│  │   finale était de 480€ sans explication..."     │    │
│  │                                                 │    │
│  │  [✓ Marqué comme traité]  [📞 Appeler]          │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  ✂️  Salon Coiffure B. · il y a 5 jours         │    │
│  │  Client : Marie D.  · 06 12 34 56 78            │    │
│  │                                                 │    │
│  │  "Pas très satisfaite de la couleur,            │    │
│  │   pas ce que j'avais demandé..."                │    │
│  │                                                 │    │
│  │  [✓ Marqué comme traité]  [📞 Appeler]          │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

### Page 4 — Clients d'un commerçant (pipeline détaillé)

```
┌─────────────────────────────────────────────────────────┐
│  ← Clients · Boulangerie Martin          [Importer CSV] │
├─────────────────────────────────────────────────────────┤
│  Filtres : [Tous ▾]  [Ce mois ▾]  [Rechercher...]      │
├─────────────────────────────────────────────────────────┤
│  NOM          DATE        STATUT              ACTION    │
│  Marie L.     14/05       ✅ Avis laissé      —         │
│  Pierre M.    13/05       📤 Envoyé            Relancer │
│  Sophie B.    12/05       👁 Cliqué            —        │
│  Jean D.      11/05       ⏳ En attente        Envoyer  │
│  Claire R.    10/05       ⚠️  Insatisfait      Voir     │
│  Thomas V.    09/05       🔄 Relancé           —        │
├─────────────────────────────────────────────────────────┤
│  Total : 34 · ✅ 21 avis · ⚠️  3 insatisfaits          │
└─────────────────────────────────────────────────────────┘
```

---

### Page 5 — Statistiques globales

```
┌─────────────────────────────────────────────────────────┐
│  STATISTIQUES                    [Ce mois ▾]            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Taux de conversion global        63%                   │
│  ████████████████████░░░░░░░░░░                         │
│                                                         │
│  Avis générés ce mois              89                   │
│  Messages envoyés                 247                   │
│  Taux d'ouverture WhatsApp         84%                  │
│  Taux de clic page filtrage        71%                  │
│  Taux d'avis positif               89%                  │
│  Taux d'insatisfaction             11%                  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  TOP CLIENTS DU MOIS                                    │
│  1. Salon Coiffure B.   +31 avis  ★4.9                 │
│  2. Boulangerie Martin  +23 avis  ★4.6                 │
│  3. Garage du Stade     +18 avis  ★4.2                 │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  REVENUS RÉCURRENTS                                     │
│  Actifs : 12 × 79€ = 948€/mois                         │
│  Annualisé : 11 376€/an                                 │
└─────────────────────────────────────────────────────────┘
```

---

## 7. PAGES PUBLIQUES (côté client final)

### Design de la page de filtrage

**Contraintes impératives :**
- Chargement < 1 seconde (pas de framework JS lourd)
- 100% mobile (les clients cliquent depuis leur téléphone)
- Le nom du commerce et le prénom du client doivent être visibles
- Deux boutons énormes (zone tactile minimum 60px de hauteur)
- Zéro navigation, zéro menu, zéro distraction

**Code HTML de référence :**
```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Votre avis — {{nom_commerce}}</title>
  <style>
    /* Même palette que les vitrines */
    :root {
      --ant: #1C1F22;
      --gold: #D4C89A;
      --green: #25D366;
      --white: #F5F6F7;
      --radius: 14px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'DM Sans', sans-serif;
      background: var(--white);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #fff;
      border-radius: 20px;
      padding: 40px 28px;
      max-width: 400px;
      width: 100%;
      text-align: center;
      box-shadow: 0 4px 32px rgba(0,0,0,0.08);
    }
    .commerce-name {
      font-size: 13px;
      letter-spacing: .12em;
      text-transform: uppercase;
      color: var(--gold);
      margin-bottom: 20px;
      font-weight: 500;
    }
    h1 {
      font-family: 'Cormorant Garamond', serif;
      font-weight: 300;
      font-size: 28px;
      color: var(--ant);
      line-height: 1.3;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: 14px;
      color: #6B7280;
      margin-bottom: 36px;
      line-height: 1.5;
    }
    .btn-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .btn-oui {
      background: var(--green);
      color: #fff;
      border: none;
      border-radius: var(--radius);
      padding: 20px 16px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .btn-non {
      background: var(--white);
      color: #6B7280;
      border: 1.5px solid #E5E7EB;
      border-radius: var(--radius);
      padding: 20px 16px;
      font-size: 16px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .emoji { font-size: 28px; }
  </style>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet"/>
</head>
<body>
  <div class="card">
    <div class="commerce-name">{{nom_commerce}}</div>
    <h1>Bonjour {{prenom}},<br/>votre avis compte.</h1>
    <p class="subtitle">Êtes-vous satisfait(e) de notre prestation ?</p>
    <div class="btn-group">
      <button class="btn-oui" onclick="repondre('oui')">
        <span class="emoji">😊</span>
        Oui, super !
      </button>
      <button class="btn-non" onclick="repondre('non')">
        <span class="emoji">😞</span>
        Pas tout à fait
      </button>
    </div>
  </div>
  <script>
    function repondre(choix) {
      const token = new URLSearchParams(window.location.search).get('t');
      fetch('/satisfaction', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({choix, token})
      }).then(r => r.json()).then(data => {
        if (data.redirect) window.location.href = data.redirect;
      });
    }
  </script>
</body>
</html>
```

---

## 8. QR CODE — GÉNÉRATION AUTOMATIQUE

Pour chaque commerçant, le système génère un QR code pointant vers la page de filtrage.

```python
import qrcode
import io
import base64

def generer_qr_code(lien_filtrage: str, nom_commerce: str):
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(lien_filtrage)
    qr.make(fit=True)
    
    img = qr.make_image(
        fill_color="#1C1F22",   # anthracite
        back_color="#F5F6F7"    # blanc cassé
    )
    
    # Retourner en base64 pour affichage dans le dashboard
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    b64 = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/png;base64,{b64}"
```

**Le chevalet physique :**
Jean-Philippe peut proposer un chevalet en bois ou carton avec le QR code imprimé.
Le système génère le fichier PNG haute résolution (300 DPI minimum) prêt à l'impression.

```python
def generer_qr_haute_resolution(lien_filtrage: str):
    qr = qrcode.QRCode(box_size=30, border=6)  # haute résolution
    qr.add_data(lien_filtrage)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#1C1F22", back_color="#F5F6F7")
    img.save(f"qr_codes/{slug}.png")  # 300+ DPI automatique avec box_size=30
```

---

## 9. NOTIFICATIONS ET ALERTES

### Ce que Jean-Philippe reçoit automatiquement

**Chaque matin (résumé quotidien) :**
```
📊 Review Booster — Résumé du 14/05

✅ Avis générés hier : 7
📤 Messages envoyés : 23
⚠️  Avis négatifs : 1 (Garage du Stade — traiter)

Top du jour : Salon Coiffure B. → 3 avis ★5

→ Dashboard : https://dashboard.vitrines-dax.fr
```

**En temps réel (avis négatif) :**
```
⚠️  Avis négatif capturé

Commerce : Garage du Stade
Client : Pierre M. · 06 87 65 43 21
Message : "Le devis était de 350€..."

→ Voir dans le dashboard
```

**En temps réel (milestone) :**
```
🎉 Boulangerie Martin vient de passer 
   la barre des 50 avis Google !
   (était à 15 au départ)
```

---

## 10. DÉPLOIEMENT ET INFRASTRUCTURE

### Structure des URLs
```
Dashboard admin    : dashboard.vitrines-dax.fr
Pages de filtrage  : avis.vitrines-dax.fr/{slug-commerce}
API backend        : api.vitrines-dax.fr
```

### Variables d'environnement (.env)
```bash
# Base de données
DATABASE_URL=postgresql://...

# Twilio (compte existant Jean-Philippe)
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_TEMPLATE_SID_J1=HXxxxxxxxx   # template premier message
TWILIO_TEMPLATE_SID_J6=HXxxxxxxxx   # template relance

# Google Places (même clé que pipeline vitrines)
GOOGLE_API_KEY=AIzaxxxxxxxx

# Notifications Jean-Philippe
JP_WHATSAPP=+33XXXXXXXXX
JP_EMAIL=jean-philippe@...

# Sécurité dashboard
ADMIN_PASSWORD=xxxxxxxx
JWT_SECRET=xxxxxxxx
```

### Déploiement recommandé
```bash
# Railway (le plus simple, ~5$/mois)
railway init
railway add postgresql
railway deploy

# Ou Render (gratuit pour commencer)
# render.com → New Web Service → connecter GitHub
```

### Crons à configurer
```
Toutes les heures   : job_envois_whatsapp()
Tous les jours 8h   : maj_compteur_avis()
Tous les jours 9h   : envoyer_resume_quotidien()
```

---

## 11. CHECKLIST DE LIVRAISON

### Infrastructure
- [ ] Base de données Supabase créée avec toutes les tables
- [ ] Backend déployé sur Railway/Render
- [ ] Domaines configurés (dashboard + avis)
- [ ] Variables d'environnement configurées
- [ ] Templates Twilio créés et approuvés par Meta

### Fonctionnalités
- [ ] Ajout d'un commerçant avec récupération automatique du Place ID
- [ ] Import CSV avec validation et détection d'erreurs
- [ ] Envoi automatique J+1 fonctionnel
- [ ] Relance automatique J+6 fonctionnel
- [ ] Page de filtrage mobile (OUI → Google, NON → formulaire)
- [ ] Capture des avis négatifs en base
- [ ] Notification WhatsApp à Jean-Philippe pour les avis négatifs
- [ ] Génération QR code PNG haute résolution
- [ ] Cron mise à jour compteurs Google

### Dashboard
- [ ] Vue d'ensemble avec 4 métriques clés
- [ ] Liste des commerçants avec progression
- [ ] Fiche commerçant avec import CSV
- [ ] Page avis négatifs avec bouton "Traité"
- [ ] Pipeline clients avec statuts colorés
- [ ] Page statistiques globales
- [ ] Auth sécurisée (login/password)

### Tests
- [ ] Test complet bout en bout sur 1 commerçant de test
- [ ] Test page filtrage sur iPhone Safari
- [ ] Test réception WhatsApp réel
- [ ] Test import CSV avec données invalides (robustesse)
- [ ] Test cron jobs en conditions réelles

---

## 12. PRIORITÉ DE DÉVELOPPEMENT

Ordre recommandé pour livrer une première version fonctionnelle rapidement :

**Semaine 1 — Le cœur du système**
1. Base de données + backend API de base
2. Import CSV + envoi WhatsApp J+1
3. Page de filtrage (OUI/NON)

**Semaine 2 — Le dashboard**
4. Dashboard admin pages 1 et 2 (vue globale + fiche commerçant)
5. Page avis négatifs
6. Relance J+6 automatique

**Semaine 3 — Le polish**
7. Statistiques et métriques
8. Notifications quotidiennes
9. Génération QR code
10. Tests complets + déploiement production

---

*Document rédigé pour Jean-Philippe Roth · Projet Review Booster · Dax (40)*
*Version 1.0 — Mai 2025*
