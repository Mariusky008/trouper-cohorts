# Popey Human - Integration WhatsApp 360dialog

## 1) Variables d'environnement

Configurer ces variables dans Vercel/serveur:

- `WHATSAPP_360D_API_BASE_URL` (defaut: `https://waba-v2.360dialog.io`)
- `WHATSAPP_360D_API_KEY` (obligatoire)
- `WHATSAPP_360D_NAMESPACE` (optionnel, selon config template)
- `WHATSAPP_360D_TEMPLATE_SUBMIT_PATH` (defaut: `/v1/configs/templates`)
- `WHATSAPP_360D_WEBHOOK_VERIFY_TOKEN` (recommande)
- `CRON_SECRET` (recommande pour `/api/cron/whatsapp-queue`)

Warm-up / anti-spam:

- `WHATSAPP_QUEUE_BATCH_SIZE` (defaut: `20`)
- `WHATSAPP_QUEUE_PER_MINUTE_LIMIT` (defaut: `20`)
- `WHATSAPP_QUEUE_MIN_DELAY_MS` (defaut: `900`)
- `WHATSAPP_QUEUE_MAX_DELAY_MS` (defaut: `2600`)
- `WHATSAPP_QUEUE_RETRY_BASE_DELAY_SEC` (defaut: `30`)
- `WHATSAPP_QUEUE_MAX_ATTEMPTS` (defaut: `4`)
- `WHATSAPP_BLOCK_ALERT_THRESHOLD` (defaut: `0.05`)

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

### Soumettre un template a 360dialog

`POST /api/popey-human/whatsapp/templates/submit`

Payload:

```json
{
  "template_name": "prospection_partenariat_v1",
  "language_code": "fr",
  "category": "MARKETING",
  "body_text": "Bonjour {{1}}, je suis {{2}} a {{3}}...",
  "variables": ["Prenom", "Metier", "Ville"],
  "quick_replies": ["En savoir plus", "Pas intéressé"]
}
```

### Webhook 360dialog

- `GET /api/popey-human/whatsapp/webhook` (verification token/challenge)
- `POST /api/popey-human/whatsapp/webhook` (reponses + statuts)

Comportements:

- Si reponse contient `STOP`, contact ajoute a `human_whatsapp_blacklist`.
- Les messages en attente pour ce contact sont annules.
- Les reponses entrantes sont stockees dans `human_whatsapp_events`.

### Worker queue (cron)

- `GET|POST /api/cron/whatsapp-queue`
- Auth via `Authorization: Bearer <CRON_SECRET>` ou `?secret=<CRON_SECRET>`

### Inbox et monitoring

- `GET /api/popey-human/whatsapp/inbox?classification=positive&limit=50`
- `GET /api/popey-human/whatsapp/monitoring?hours=24`

## 4) Procedure validation template (courte)

1. Rediger `body_text` avec placeholders `{{1}}`, `{{2}}`, `{{3}}`.
2. Ajouter les quick replies: `En savoir plus` et `Pas intéressé`.
3. Appeler `/api/popey-human/whatsapp/templates/submit`.
4. Verifier le statut dans `human_whatsapp_templates` (`submitted`, `approved`, `rejected`).
5. N'utiliser en production que les templates `approved`.

## 5) Routage Messagerie app

- Les reponses positives sont etiquetees `classification=positive` dans `human_whatsapp_events`.
- L'onglet messagerie peut consommer `GET /api/popey-human/whatsapp/inbox`.
- Les statuts d'envoi (`sent`, `delivered`, `read`) sont dans `human_whatsapp_outbound_queue`.
