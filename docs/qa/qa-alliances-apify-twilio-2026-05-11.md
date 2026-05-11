# QA - Alliances (Apify -> Twilio -> Admin Inbox) - 2026-05-11

## 1) Constat production (popey.academy)

Sur `https://www.popey.academy/popey-human/entrepreneur-smart-scan-test`:

- L’ouverture de l’onglet “Alliances” déclenche:
  - `GET /api/popey-human/smart-scan/alliances/prospects?provider=b2b`
  - `GET /api/popey-human/smart-scan/alliances/invites`
- La recherche Apify doit être déclenchée uniquement après action utilisateur:
  - clic sur “Trouver mes éclaireurs” -> `POST /api/popey-human/smart-scan/alliances/search`

## 2) Correctifs code ajoutés

- Déclenchement uniquement sur clic “Trouver mes éclaireurs” + protection anti-blocage (abort/timeout)
  - `src/app/popey-human/entrepreneur-smart-scan-test/page.tsx`
- Apify: suppression du fallback “demo prospects” en mode strict (prod)
  - `src/lib/actions/human-smart-scan.ts`
- Endpoint monitoring Alliances (runs + invites + WhatsApp queue snapshot)
  - `src/app/api/popey-human/smart-scan/alliances/monitoring/route.ts`
- Script E2E dédié au déclenchement manuel
  - `scripts/e2e-human-alliances.mjs`

## 3) Scénarios à valider en conditions réelles

### 3.1 Apify

- Cas OK: clic “Trouver mes éclaireurs” -> `POST /alliances/search` -> prospects persistés + run créé
- Cas KO (token manquant): `POST /alliances/search` retourne 400 avec message “Apify non configuré…”
- Cas KO (quota/plan): `POST /alliances/search` retourne 400 “Apify: quota dépassé ou plan insuffisant.”

### 3.2 Twilio outbound

- Cas OK: clic “Envoyer via WhatsApp Pro (Twilio)” -> `POST /smart-scan/send-partner-outreach` -> queue + events créés -> webhook met à jour delivered/read
- Cas KO (Twilio non configuré): API renvoie une erreur + `fallback.whatsappUrl`

### 3.3 Inbox admin

- Cas OK: réponse inbound WhatsApp -> webhook -> event `direction=inbound` -> visible dans `/admin/humain/chat`

## 4) Monitoring

- WhatsApp: `GET /api/popey-human/whatsapp/monitoring`
- Alliances: `GET /api/popey-human/smart-scan/alliances/monitoring?provider=b2b&hours=24`

Critères:

- `alliance.searchRuns` non vide après une recherche
- `whatsapp.counts.failed` faible + `stopAlert` vide

## 5) Go / No-Go

Go si:

- Apify configuré (compte payant) et retours `200` sur `POST /alliances/search`
- Twilio WhatsApp Business configuré (production) + callbacks OK
- Inbox admin reçoit bien inbound + statuts (delivered/read)
- Monitoring: pas d’alerte STOP, taux d’échec acceptable
