# Popey Human - Alliances Smart Scan (Apify + Twilio WhatsApp)

## 1) Objectif

Sur la route `/popey-human/entrepreneur-smart-scan-test`, l’onglet “Alliances” doit:

- Lancer automatiquement une recherche de prospects via Apify dès l’ouverture de l’onglet
- Persister les résultats (prospects + runs de recherche)
- Permettre l’envoi d’un message WhatsApp “pro” via Twilio avec suivi de statuts
- Centraliser les réponses et statuts dans l’admin inbox

## 2) Variables d’environnement

### Apify

- `APIFY_TOKEN` (obligatoire en prod)
- `APIFY_TASK_SLUG` (obligatoire en prod)

Le fallback “prospects demo” n’est autorisé que si `SMART_SCAN_STRICT_VALIDATION=false`.

### Twilio WhatsApp

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM` (ex: `whatsapp:+14155238886`)
- `TWILIO_WHATSAPP_CONTENT_SID` (template Content API)
- `TWILIO_WHATSAPP_INBOUND_WEBHOOK_URL` (URL publique vers `/api/popey-human/whatsapp/twilio-webhook`)
- `TWILIO_WHATSAPP_STATUS_CALLBACK_URL` (URL publique vers `/api/popey-human/whatsapp/twilio-webhook`)
- `TWILIO_WHATSAPP_VALIDATE_WEBHOOK_SIGNATURE` (`true` recommandé)
- `TWILIO_WHATSAPP_SANDBOX_MODE` (`true` en sandbox, `false` en prod)

## 3) SQL (Supabase)

Migrations à exécuter (déjà présentes dans le repo):

- `supabase/migrations/20260423162000_create_human_smart_scan_alliances_v1.sql`
- `supabase/migrations/20260429134000_create_human_whatsapp_360dialog_stack.sql`

Tables principales:

- Alliances: `human_smart_scan_alliance_prospects`, `human_smart_scan_alliance_search_runs`, `human_smart_scan_alliance_invites`
- WhatsApp: `human_whatsapp_outbound_queue`, `human_whatsapp_events`, `human_whatsapp_blacklist`

## 4) Flux technique (résumé)

### 4.1 Déclenchement auto (UI)

À l’ouverture de l’onglet “Alliances”, le client déclenche automatiquement `POST /api/popey-human/smart-scan/alliances/search`.

- UI: `src/app/popey-human/entrepreneur-smart-scan-test/page.tsx`

### 4.2 Recherche Apify + persistance (API)

- API: `POST /api/popey-human/smart-scan/alliances/search`
- Action: `searchAllianceProspects()` dans `src/lib/actions/human-smart-scan.ts`

Comportements:

- Appel Apify (provider `b2b`) puis normalisation des résultats
- Calcul `fit_score` et `fit_reasons`
- Upsert des prospects puis insertion d’un run dans `human_smart_scan_alliance_search_runs`

### 4.3 Envoi WhatsApp pro (Twilio)

Déclenché depuis le CTA “Envoyer via WhatsApp Pro (Twilio)”:

- API: `POST /api/popey-human/smart-scan/send-partner-outreach`
- Action: `sendPartnerOutreach()` dans `src/lib/actions/whatsapp-twilio.ts`

Persistance:

- `human_whatsapp_outbound_queue` (statuts: queued/sent/delivered/read/failed…)
- `human_whatsapp_events` (status callbacks + inbound replies)

### 4.4 Réception réponses + statuts

Webhook:

- `GET/POST /api/popey-human/whatsapp/twilio-webhook`

Inbox admin:

- UI: `/admin/humain/chat`
- API: `GET/POST /api/admin/humain/whatsapp/chat`

## 5) Monitoring

### 5.1 WhatsApp queue monitoring

`GET /api/popey-human/whatsapp/monitoring?owner_member_id=<uuid>&hours=24`

Retourne: compteurs de statuts, alert STOP, indicateurs de qualité.

### 5.2 Alliances monitoring

`GET /api/popey-human/smart-scan/alliances/monitoring?provider=b2b&hours=24`

Retourne: derniers runs de recherche Alliances, compteurs d’invites, + snapshot WhatsApp queue.

## 6) Tests

### 6.1 E2E (déclenchement auto)

Script: `scripts/e2e-human-alliances.mjs`

Pré-requis:

- `HUMAN_E2E_SPHERE_EMAIL`
- `HUMAN_E2E_SPHERE_PASSWORD`
- `E2E_BASE_URL` (optionnel, défaut `http://localhost:3000`)

Commande:

- `npm run e2e:human-alliances`

Critère: présence d’un `POST /api/popey-human/smart-scan/alliances/search` lors de l’ouverture avec `?panel=alliances`.

## 7) Checklist go-live

- Apify: `APIFY_TOKEN` issu d’un compte payant (plan actif) + `APIFY_TASK_SLUG` correct
- Twilio: WhatsApp Business “production” (pas sandbox) + `TWILIO_WHATSAPP_CONTENT_SID` validé
- Webhooks Twilio: inbound + status callback pointent sur les URLs Vercel de prod
- Signature webhook: activée si possible (`TWILIO_WHATSAPP_VALIDATE_WEBHOOK_SIGNATURE=true`)
- Admin: `/admin/humain/chat` reçoit bien inbound + statuts (delivered/read/failed)

