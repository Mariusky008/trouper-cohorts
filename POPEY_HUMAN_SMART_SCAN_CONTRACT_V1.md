# Popey Human Smart Scan - Contrat V1 (Sprint 1)

## Perimetre ecrans

### 1) Scan
- Objectif: qualifier rapidement des contacts issus du scan.
- Actions clefs: `trust`, `qualification`, `action`, `favorite`, `prepare-whatsapp-payload`.
- Donnees minimales: `externalContactRef`, `fullName`, `actionType`/`status` selon action.

### 2) Daily
- Objectif: suivre la progression quotidienne et convertir en actions envoyees.
- Source: `bootstrap.metrics`, `bootstrap.session`, `bootstrap.followupOps`.
- Regle: progression incrementee uniquement sur actions non `passer` avec statut `sent` ou `validated_without_send`.

### 3) Recherche / Favoris
- Objectif: retrouver un contact et prioriser les favoris.
- Source: `bootstrap.contacts` avec `is_favorite`.
- Ecriture: endpoint `favorite` (bool obligatoire).

### 4) Loupe (fiche contact)
- Objectif: vue consolidee contact (qualification + confiance + historique + vigilance).
- Sources: `contacts`, `qualifications`, `history`, `alerts`, `followups`.
- Ecritures: `trust`, `qualification`, `action`, `outcome`, `followup-job`.

### 5) Historique
- Objectif: tracer actions envoyees et leurs outcomes.
- Source: `history` + `followups`.
- Ecriture: `outcome`, `followup-job`.

### 6) Profil
- Objectif: edition des informations membre Popey Human.
- Lecture: `GET /api/popey-human/smart-scan/profile`.
- Ecriture: `POST /api/popey-human/smart-scan/profile` (champs limites et valides).

### 7) Signal
- Hors API Smart Scan directe dans ce lot; impact indirect via qualif/actions du contact.

### 8) Accueil test
- Objectif: sandbox fonctionnelle pour valider flux bout en bout.
- Regle: toutes les ecritures passent par les routes Smart Scan strictes.

## Dictionnaire analytics V1 (fige)

Event `contact_opened`
- Source ecran: Scan/Loupe.
- Payload minimal: `ownerMemberId`, `contactId`.

Event `trust_level_set`
- Source ecran: Scan/Loupe.
- Payload minimal: `ownerMemberId`, `contactId`, `trustLevel`.

Event `whatsapp_sent`
- Source ecran: Scan (CTA WhatsApp).
- Payload minimal: `ownerMemberId`, `contactId`, `actionType`, `actionId`.

Event `daily_goal_progressed`
- Source ecran: Daily/Scan.
- Payload minimal: `ownerMemberId`, `contactId`, `actionType`, `opportunitiesActivated`.

## Feature Flags V1

Server flags:
- `SMART_SCAN_ENABLED` (default: `true`): kill switch global Smart Scan (routes GET/POST).
- `SMART_SCAN_STRICT_VALIDATION` (default: `true`): reference de mode validation stricte.
- `SMART_SCAN_ANALYTICS_ENABLED` (default: `true`): active/desactive `analytics-event`.
- `SMART_SCAN_EXTERNAL_CLICK_TRACKING_ENABLED` (default: `true`): active/desactive `external-click`.
- `SMART_SCAN_PROMPT_VERSION` (default: `smart_scan_prompt_v1`): version prompt AI courante.

Convention rollout:
- Nouveau comportement derriere un flag explicite.
- Activation progressive par environnement.
- Rollback par bascule de flag, sans redeploy.
