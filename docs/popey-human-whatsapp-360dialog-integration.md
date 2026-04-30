# Popey Human - Integration WhatsApp Cloud API (Meta)

## 1) Variables d'environnement

Configurer ces variables dans Vercel/serveur:

- `WHATSAPP_META_GRAPH_BASE_URL` (defaut: `https://graph.facebook.com`)
- `WHATSAPP_META_API_VERSION` (defaut: `v21.0`)
- `WHATSAPP_META_PERMANENT_ACCESS_TOKEN` (obligatoire, System User token)
- `WHATSAPP_META_PHONE_NUMBER_ID` (obligatoire)
- `WHATSAPP_META_WABA_ID` (obligatoire pour la soumission de templates)
- `WHATSAPP_META_WEBHOOK_VERIFY_TOKEN` (recommande)
- `WHATSAPP_CRM_WEBHOOK_URL` (optionnel, push des réponses boutons vers Airtable/Make)
- `WHATSAPP_CRM_WEBHOOK_BEARER` (optionnel)
- `CRON_SECRET` (recommande pour `/api/cron/whatsapp-queue`)

Warm-up / anti-spam:

- `WHATSAPP_QUEUE_BATCH_SIZE` (defaut: `20`)
- `WHATSAPP_QUEUE_PER_MINUTE_LIMIT` (defaut: `20`)
- `WHATSAPP_QUEUE_MIN_DELAY_MS` (defaut: `900`)
- `WHATSAPP_QUEUE_MAX_DELAY_MS` (defaut: `2600`)
- `WHATSAPP_QUEUE_RETRY_BASE_DELAY_SEC` (defaut: `30`)
- `WHATSAPP_QUEUE_MAX_ATTEMPTS` (defaut: `4`)
- `WHATSAPP_QUEUE_DAILY_LIMIT` (defaut: `50`)
- `WHATSAPP_STOP_ALERT_THRESHOLD` (defaut: `0.05`)

## 2) SQL a executer (Supabase)

Executer la migration:

- `supabase/migrations/20260429134000_create_human_whatsapp_360dialog_stack.sql`

Cette migration cree:

- `human_whatsapp_outbound_queue` (file d'envoi + statuts)
- `human_whatsapp_events` (inbound/status/outbound logs)
- `human_whatsapp_blacklist` (STOP immediate)
- `human_whatsapp_templates` (suivi soumission templates)

## 3) Endpoints internes

### Enqueue d'un template

`POST /api/popey-human/whatsapp/send-template`

Payload:

```json
{
  "phone": "+33612345678",
  "template_name": "nom_du_template",
  "vars": ["Jean", "Agent Immo", "Dax"],
  "language_code": "fr"
}
```

### Soumettre un template a Meta

`POST /api/popey-human/whatsapp/templates/submit`

Payload:

```json
{
  "template_name": "prospection_partenariat_v1",
  "language_code": "fr",
  "category": "MARKETING",
  "body_text": "Bonjour {{1}}, je suis {{2}} a {{3}}...",
  "variables": ["Prenom", "Metier", "Ville"],
  "quick_replies": ["Oui, avec plaisir", "Pas pour le moment"]
}
```

### Webhook Meta

- `GET /api/popey-human/whatsapp/webhook` (verification token/challenge Meta)
- `POST /api/popey-human/whatsapp/webhook` (reponses + statuts)

Comportements:

- Si reponse contient `STOP`, contact ajoute a `human_whatsapp_blacklist`.
- Les messages en attente pour ce contact sont annules.
- Les reponses entrantes sont stockees dans `human_whatsapp_events`.
- Les clics boutons quick reply remontent le `button_payload` et sont pushes vers `WHATSAPP_CRM_WEBHOOK_URL` (si configure).

### Worker queue (cron)

- `GET|POST /api/cron/whatsapp-queue`
- Auth via `Authorization: Bearer <CRON_SECRET>` ou `?secret=<CRON_SECRET>`

### Inbox et monitoring

- `GET /api/popey-human/whatsapp/inbox?classification=positive&limit=50`
- `GET /api/popey-human/whatsapp/monitoring?hours=24`

## 4) Procedure validation template (courte)

1. Rediger `body_text` avec placeholders `{{1}}`, `{{2}}`, `{{3}}`.
2. Ajouter les quick replies: `Oui, avec plaisir` et `Pas pour le moment`.
3. Appeler `/api/popey-human/whatsapp/templates/submit`.
4. Verifier le statut dans `human_whatsapp_templates` (`submitted`, `approved`, `rejected`) et dans Business Manager.
5. N'utiliser en production que les templates `approved`.

## 5) Routage Messagerie app

- Les reponses positives sont etiquetees `classification=positive` dans `human_whatsapp_events`.
- L'onglet messagerie peut consommer `GET /api/popey-human/whatsapp/inbox`.
- Les statuts d'envoi (`sent`, `delivered`, `read`) sont dans `human_whatsapp_outbound_queue`.
- Le monitoring inclut aussi la qualite du numero Meta (`qualityRating`) via `GET /api/popey-human/whatsapp/monitoring`.

## 6) Modifier un template dans Business Manager

1. Ouvrir Meta Business Manager > WhatsApp Manager > Message templates.
2. Creer/modifier un template de categorie `Marketing`.
3. Conserver les placeholders `{{1}}`, `{{2}}`, `{{3}}`.
4. Ajouter 2 boutons quick reply.
5. Soumettre a validation, attendre `approved`.
6. Utiliser ensuite exactement le meme `template_name` via `/send-template`.
