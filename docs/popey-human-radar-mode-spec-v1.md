# Popey Human — Mode Radar V1 (Spec Produit + Tech)

## 1) Objectif
- Ajouter un **Mode Radar** dans `Alliances` pour générer rapidement des prospects synergiques et préparer des WhatsApp personnalisés.
- Promesse UX: `1 bouton` -> `10 WhatsApp prêts` -> envoi assisté en `2-3 minutes`.
- Contrainte clé: **pas d'envoi automatique WhatsApp**, uniquement ouverture de liens `wa.me` préremplis avec validation humaine.

## 2) Référence Design
- Maquette source: `src/app/popey-human/accueil-test/radar.html`
- Écran 1 (Alliances): bloc CTA `Mode Radar · IA` au-dessus de la recherche manuelle.
- Écran 2 (Radar): entête radar, filtres synergies, file de cartes WhatsApp, sélection multiple, CTA `Envoyer les X sélectionnés`.

## 3) Périmètre MVP (V1)
### In scope
- Bouton `Mode Radar` dans l'écran `Alliances`.
- Génération auto des synergies métiers (5 à 8 métiers max).
- Recherche de prospects B2B par ville/rayon/métiers (10 prospects max affichés par défaut).
- Préparation des messages WhatsApp personnalisés par prospect.
- File d'envoi avec:
  - sélection/désélection,
  - aperçu message,
  - ouverture WhatsApp individuelle,
  - ouverture séquentielle des sélectionnés.
- Tracking analytics minimal (run, prepared, opened, sent_declared).

### Out of scope (V1)
- Envoi WhatsApp automatique via API Business.
- Relances automatiques multi-canal.
- Scoring IA avancé multi-signaux historiques.
- A/B testing message à grande échelle.

## 4) Flux Utilisateur
### Écran Alliances
1. L'utilisateur clique sur `Mode Radar`.
2. UI affiche état `Analyse en cours` (loader 30-60s, avec étapes).
3. Redirection vers écran `Mode Radar` avec résultats prêts.

### Écran Mode Radar
1. Header: contexte `métier + ville` analysé.
2. Chips synergies (Tous + métiers proposés).
3. Cartes prospects avec:
  - nom, métier, ville, distance,
  - justification synergie,
  - message pré-rempli.
4. Action:
  - `Ouvrir WhatsApp` (unitaire),
  - `Envoyer les X sélectionnés` (séquentiel côté client, ouverture onglet/app par prospect).
5. Après ouverture WhatsApp, statut carte passe en `ouvert` (et `envoyé` déclaré si l'utilisateur confirme dans l'UI).

## 5) Règles Métier
- Limite V1: 10 prospects préparés par run.
- Fallback synergies si IA indisponible:
  - utiliser mapping local par métier source (ex. agent immo -> courtier/notaire/diagnostiqueur/architecte intérieur/déménageur).
- Déduplication stricte:
  - même téléphone E.164 ou même `(nom + ville + métier)` approximé.
- Filtrage qualité:
  - exclure contacts sans numéro valide.
  - exclure métiers hors cible.
- Personnalisation message:
  - prénom,
  - métier prospect,
  - synergie métier source -> métier prospect,
  - angle spécifique par métier.

## 6) Architecture Technique
### Réutilisation existante (déjà en place)
- `POST /api/popey-human/smart-scan/alliances/search`
- `POST /api/popey-human/smart-scan/generate-message`
- `POST /api/popey-human/smart-scan/prepare-whatsapp-payload`

### Nouveau endpoint recommandé (orchestration V1)
- `POST /api/popey-human/smart-scan/radar/run`
  - rôle: encapsuler pipeline complet (synergies -> prospects -> messages -> payloads WhatsApp)
  - évite 10-20 appels front parallèles et simplifie l'UX.

## 7) Contrat API Proposé
### `POST /api/popey-human/smart-scan/radar/run`
Request:
```json
{
  "city": "Dax",
  "sourceMetier": "Agent immobilier",
  "radiusKm": 15,
  "targetCount": 10,
  "provider": "b2b"
}
```

Response:
```json
{
  "runId": "uuid",
  "sourceContext": {
    "city": "Dax",
    "sourceMetier": "Agent immobilier"
  },
  "synergies": [
    {"metier":"Courtier","reason":"...","count":3},
    {"metier":"Notaire","reason":"...","count":2}
  ],
  "contacts": [
    {
      "prospectId":"uuid",
      "fullName":"Camille Petit",
      "metier":"Avocate",
      "city":"Dax",
      "distanceKm":1.2,
      "phoneE164":"+33612345678",
      "synergyReason":"...",
      "messageDraft":"Bonjour Camille ...",
      "whatsappUrl":"https://wa.me/33612345678?text=..."
    }
  ],
  "stats": {
    "prepared": 10,
    "filteredOut": 4,
    "estimatedTimeSavedMin": 40
  }
}
```

### `POST /api/popey-human/smart-scan/radar/event`
- Events: `radar_run_started`, `radar_run_completed`, `radar_contact_selected`, `radar_whatsapp_opened`, `radar_send_declared`.

## 8) UI/Composants (mapping maquette)
- `RadarEntryCard` (écran Alliances)
  - badge `Mode Radar · IA`
  - titre `Préparer 10 WhatsApp en 1 tap`
- `RadarRunHeader`
  - statut `X prêts`
  - contexte métier/ville
- `RadarSynergyChips`
  - filtre horizontal par métier
- `RadarQueueStats`
  - `sélectionnés`, `envoyés`, `préparés`, `temps économisé`
- `RadarProspectCard`
  - checkbox, avatar initials, métier chip, synergie, aperçu message, CTA WhatsApp
- `RadarSendAllButton`
  - ouverture séquentielle des `selected && !sent`

## 9) Data Model (minimal)
- Table `human_radar_runs`
  - `id`, `owner_user_id`, `city`, `source_metier`, `radius_km`, `status`, `prepared_count`, `created_at`
- Table `human_radar_contacts`
  - `id`, `run_id`, `prospect_id?`, `full_name`, `metier`, `city`, `phone_e164`, `distance_km`, `synergy_reason`, `message_draft`, `whatsapp_url`, `selected`, `opened_at`, `sent_declared_at`
- Table `human_radar_events`
  - `id`, `run_id`, `contact_id?`, `event_type`, `metadata_json`, `created_at`

## 10) Sécurité / Conformité
- Aucune automatisation d'envoi WhatsApp.
- Limite par session et par jour (anti spam).
- Journalisation événements de prospection.
- Mention UI explicite: `Vous validez chaque envoi manuellement`.

## 11) Critères d'acceptation (MVP)
- L'utilisateur clique `Mode Radar` et obtient 10 WhatsApp prêts en moins de 60s (hors indisponibilité provider).
- Chaque carte ouvre un lien `wa.me` valide.
- Sélection multiple + envoi séquentiel fonctionnels.
- Dédoublonnage actif, pas de contact répété dans un run.
- Tracking analytics visible dans les événements Smart Scan.

## 12) Plan d'implémentation
### Sprint A — Produit visible
- Intégrer bouton Radar dans `Alliances`.
- Créer écran Radar (UI statique + interactions sélection/envoi).
- Brancher ouverture `wa.me` sur données mock.

### Sprint B — Données réelles
- Implémenter endpoint `radar/run` avec orchestration.
- Brancher provider B2B existant (`alliances/search`) + génération message.
- Ajouter déduplication + filtres qualité.

### Sprint C — Fiabilité
- Persistance run/contact/event.
- Gestion erreurs/fallback IA.
- Optimisation perf et instrumentation.

## 13) Risques / Mitigations
- Qualité numéros variable -> validation E.164 + exclusion si doute.
- Temps de réponse provider -> timeout + fallback + état partiel.
- Message trop générique -> templates par métier + variantes d'angles.

## 14) Décisions à valider avant dev
- Nom final: `Mode Radar` (proposé).
- Limite run V1: `10` ou `12` contacts.
- Règle de statut `envoyé`: auto après ouverture WhatsApp ou confirmation utilisateur.
- Niveau de persistance V1: mémoire session vs tables dédiées.
