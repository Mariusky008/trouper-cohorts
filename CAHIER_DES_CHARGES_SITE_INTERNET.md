# Cahier des charges — Prospection « Site internet » (lettre + diagnostic)

> Objectif : ajouter à l'admin un **onglet « Site internet »** qui permet de générer,
> valider et imprimer des **lettres de prospection remises en main propre** proposant
> aux artisans / commerçants de **refaire (ou créer) leur site web** — même logique de
> prospection que les lettres d'invitation Popey, mais avec une offre « refonte / création
> de site » et un diagnostic personnalisé.

Auteur : équipe Popey — Version : v1 (brouillon validé) — Date : 2026-07-02

---

## 1. Contexte

Deux briques existent déjà dans le repo et servent de fondations :

| Brique existante | Emplacement | Ce qu'on réutilise |
|---|---|---|
| **Lettres d'invitation Popey** (remise en main propre) | `src/app/admin/rejoindre/lettre/` + `src/templates/popey-invitation-*.html` | Le patron complet : lecture d'un prospect en base → injection `{{variables}}` dans un template recto/verso → aperçu `→ Cmd+P → PDF`, export PNG, QR, bouton « marquer envoyée ». |
| **Onglet Vitrines** (pipeline auto sites web) | `src/app/admin/humain/vitrines/` + table `human_vitrine_sites` + `vitrine-auto/` | La table de prospects « site web » (`human_vitrine_sites`), les routes admin (create / approve / reject), l'infra Apify/diagnostic. C'est « ce qu'on avait commencé sans aller au bout ». |

Les documents fournis (`INTEGRATION.md`, `prospectionnbtemplate.html`, `diagnostic.py`,
`photo_base64.py`) décrivent le **chaînon manquant** : la lettre N&B de diagnostic
(variante **A** « pas de site » / **B** « refonte ») pilotée par un diagnostic automatique,
avec un écran de validation avant impression.

**Ce cahier des charges = faire le pont** : brancher un canal *lettre* de prospection
« refonte de site » sur la table `human_vitrine_sites`, avec diagnostic full-auto et un QR
qui mène à une prise de contact directe.

## 2. Décisions validées (v1)

| # | Décision | Choix retenu |
|---|---|---|
| D1 | **Niveau d'automatisation du diagnostic** | **Full-auto** : Google Places + analyse du vrai site + Claude Haiku rédige les constats. Jean-Philippe ne fait que **valider**. |
| D2 | **Cible du QR de la lettre** | **Prise de contact directe** : page de RDV / WhatsApp / rappel. **Pas** de génération de démo de site en v1. |
| D3 | **Stockage des prospects** | **Étendre `human_vitrine_sites`** (table déjà en place) avec les champs propres à la lettre. |
| D4 | **Formats de lettre** | **N&B uniquement** (template photocopie fourni), variantes **A** et **B**. |

Conséquences directes :
- Le pipeline lourd de **génération de vitrine** (`site_generator`, upload Supabase, `vitrine.popey.academy/{slug}`) **n'est pas requis en v1** (D2). On garde la table, pas la génération.
- Le diagnostic **doit** analyser le site réel (screenshot / âge / mobile) → composant serveur avec fetch + éventuellement rendu (D1).
- `GOOGLE_PLACES_API_KEY` existe déjà dans le repo (`src/app/api/cron/review-booster-update-counters/route.ts`) → réutilisable.
- `ANTHROPIC_API_KEY` **n'existe pas encore** côté serveur → à ajouter (D1).

## 3. Périmètre

### 3.1 Dans le périmètre v1
1. Onglet admin **« Site internet »** (nav + page liste).
2. **Ajout d'un prospect** (nom + ville + activité) → lance le **diagnostic full-auto**.
3. **Diagnostic full-auto** : Places (fiche, note, avis, horaires, site déclaré) + analyse du site (réponse, HTTPS, viewport mobile, année copyright) + décision variante **A / B / SKIP** + rédaction des 3 constats (rule-based, polis par Claude Haiku).
4. **Écran de validation** : nom + variante + les 3 constats + lien vers le site trouvé → on relit, on ajuste, on valide.
5. **Génération de la lettre N&B** (recto + verso) par injection de variables dans le template fourni → aperçu → `Cmd+P → PDF` + export **PNG** (réutilise le patron `rejoindre/lettre`).
6. **QR → page de contact directe** publique par prospect (RDV / WhatsApp / rappel) + **tracking du scan**.
7. **Suivi** : statut prospect, « lettre imprimée / remise le », relance.
8. **Migration SQL** d'extension de `human_vitrine_sites`.

### 3.2 Hors périmètre v1 (backlog)
- Génération d'une vraie démo de site derrière le QR (pipeline Vitrines complet) — reporté (D2).
- Version **couleur** de la lettre (D4).
- Envoi WhatsApp/email automatisé de masse (le canal v1 est la remise en main propre).
- Recherche/scraping de masse type Apify (on ajoute les prospects un par un ou par petit lot).
- Récupération auto des concurrents (`concurrents_lookup`) pour la variante A (optionnel, cf. §7.4).

## 4. Architecture cible

```
Admin « Site internet »
  └─ Liste prospects (human_vitrine_sites, channel = 'letter')
      ├─ [+] Ajouter : nom + ville + activité
      │       └─ POST /api/admin/humain/site-internet/diagnose
      │             └─ diagnostic full-auto (Places + site + Claude) → variante + 3 constats
      ├─ Écran de validation (relire / éditer / valider)
      │       └─ POST /api/admin/humain/site-internet/update
      └─ Lettre → /admin/humain/site-internet/lettre/[slug]
              ├─ injecte les variables dans prospection-nb (A/B)
              ├─ QR → https://<host>/site-internet/[slug]  (contact direct)
              ├─ Aperçu recto/verso → Cmd+P → PDF + export PNG
              └─ « Marquer imprimée / remise »

Public
  └─ /site-internet/[slug]  (landing contact direct : RDV / WhatsApp / rappel)
        └─ POST scan + lead → tracking dans human_vitrine_sites
```

## 5. Modèle de données — extension `human_vitrine_sites`

Nouvelle migration `supabase/migrations/<ts>_site_internet_letter_channel.sql`.
On **étend** la table existante (schéma actuel : `slug, business_name, city, category,
source_website, status, public_url, storage_prefix, error_reason, metadata, whatsapp_phone_e164,
preview_url, revision_instructions, created_at/updated_at/approved_at/rejected_at/sent_at`).

Colonnes à ajouter :

| Colonne | Type | Rôle |
|---|---|---|
| `channel` | `text default 'vitrine'` | `'letter'` pour ce canal (discrimine des vitrines auto). |
| `activite` | `text` | Ligne d'activité (mockup lettre). |
| `contact_prenom` | `text` | Prénom du gérant si connu (adresse / message). |
| `address` | `text` | Adresse complète (recto lettre). |
| `variant` | `text` | `'A'` (pas de site) / `'B'` (refonte). Contrainte `check`. |
| `google_rating` | `numeric` | Note Google. |
| `google_reviews` | `int` | Nombre d'avis. |
| `google_place_id` | `text` | Fiche Places. |
| `site_annee` | `int` | Année estimée du site (variante B). |
| `diagnostic` | `jsonb default '{}'` | Constats bruts + valeurs (note, secondes, viewport, horaires…). |
| `constats` | `jsonb default '[]'` | 3 constats validés `[{statut,label,titre,texte}]`. |
| `synthese` | `text` | Phrase choc du recto. |
| `prix` | `int default 690` | Prix affiché au verso. |
| `letter_status` | `text default 'draft'` | `draft` → `validated` → `printed` → `delivered` → `contacted`. |
| `letter_printed_at` | `timestamptz` | Impression. |
| `letter_delivered_at` | `timestamptz` | Remise en main propre. |
| `contact_scanned_at` | `timestamptz` | 1er scan du QR. |
| `contact_lead_at` | `timestamptz` | Lead laissé sur la landing. |

- Étendre la contrainte `status` **ou** piloter le cycle de vie du canal lettre par `letter_status` (recommandé, laisse `status` aux vitrines auto).
- Réutiliser l'index `slug` unique existant.
- RLS : réutiliser les policies `is_human_admin()` déjà présentes ; ajouter un accès **lecture publique minimal** (nom + variante) pour la landing `/site-internet/[slug]`, ou passer par une route serveur avec `service_role` (recommandé — pas d'exposition table).

## 6. Onglet admin « Site internet »

1. **Nav** : ajouter le lien dans `src/app/admin/layout.tsx` (à côté de « Vitrines ») et dans la grille `src/app/admin/humain/page.tsx`.
2. **Page liste** `src/app/admin/humain/site-internet/page.tsx` (calquée sur `vitrines/page.tsx` + `rejoindre/lettre/page.tsx`) :
   - Stat cards : total, à valider, validées, imprimées, remises, contactées.
   - Tableau : commerce, ville, activité, variante A/B, note Google, `letter_status`, lien **Lettre →**, actions (valider / marquer imprimée / remise / libérer).
   - Filtre par `channel = 'letter'`.
3. **Formulaire d'ajout** `_components/site-add-form.tsx` : nom + ville + activité → `POST /diagnose`. Spinner pendant le diagnostic (~quelques s).
4. **Écran de validation** `_components/site-validation-drawer.tsx` (calqué sur `vitrines-drawer-dashboard.tsx`) : variante proposée (modifiable A/B), les 3 constats éditables, synthèse, prix, lien vers le site détecté, bouton **Valider**.

## 7. Diagnostic full-auto (D1)

Portage de la logique de `diagnostic.py` en **route serveur Next.js** (cohérent avec « tout sur l'admin »).
`POST /api/admin/humain/site-internet/diagnose` → body `{ business_name, city, activite }`.

### 7.1 Étape Places
- Appel Google Places (**Find Place** puis **Place Details**) avec `GOOGLE_PLACES_API_KEY` (déjà présent).
- Récupère : `place_id`, note, nb d'avis, horaires, adresse, **site déclaré**.
- Réutiliser/rassembler le helper existant du cron review-booster.

### 7.2 Étape site
- Si **pas de site déclaré** → variante **A**.
- Sinon `fetch` du site : temps de réponse, HTTPS, présence `<meta viewport>` (mobile), année du copyright dans le footer (indice d'âge → `site_annee`). Site en défaut → variante **B** ; site correct → **SKIP** (statut `skipped`, rien à imprimer).
- (Optionnel) rendu Playwright pour un screenshot « site écrasé sur mobile » (variante B). En v1 le template affiche un **mockup CSS** paramétré par `{{annee_site}}` → screenshot = amélioration.

### 7.3 Rédaction des constats
- Rule-based avec les **vraies valeurs** (note, secondes, année) : 3 constats, dont **le 3e toujours positif** (`good`, réputation/potentiel) — on flatte avant de proposer.
- **Claude Haiku** (`claude-haiku-4-5-20251001`) reformule les constats pour coller au commerce précis. Ajouter `ANTHROPIC_API_KEY`. Dégradation propre si clé absente (on garde le rule-based).
- Génère aussi `synthese` (phrase choc, `<br>`/`<em>` autorisés).

### 7.4 Concurrents (variante A, optionnel)
- Requête Places `activite + ville` → 2 premiers concurrents pour `{{concurrent1}}` / `{{concurrent2}}` + `{{requete}}`. Peut être différé.

### 7.5 Sortie
- Écrit/upsert la ligne `human_vitrine_sites` (`channel='letter'`, `variant`, `constats`, `diagnostic`, `google_*`, `site_annee`, `synthese`, `letter_status='draft'`).
- SKIP → `letter_status='skipped'` (non affiché par défaut).

## 8. Lettre N&B (D4)

1. **Déposer le template** fourni dans `src/templates/prospection-nb-template.html` (celui de `prospectionnbtemplate.html`, self-contained, polices embarquées, imprimable vectoriel).
2. **Page lettre** `src/app/admin/humain/site-internet/lettre/[slug]/page.tsx` — **copie adaptée** de `rejoindre/lettre/[slug]/page.tsx` :
   - Lit le prospect (`human_vitrine_sites` via slug).
   - Injecte les variables (fonction `injectVars` déjà écrite là-bas).
   - QR généré côté serveur (réutiliser le pattern `api.qrserver.com` → data-URI base64 déjà en place) encodant l'URL de contact `https://<host>/site-internet/[slug]`.
   - Barre `no-print` : aperçu, bouton impression (`print-button.tsx`), export PNG (`letter-actions.tsx`), retour.
   - Un seul template N&B, le contenu bascule A/B via `{{variante_classe}}` = `vA`/`vB`.
3. **Variables** (réf. `INTEGRATION.md`) — recto/verso : `date, nom, adresse, ville, activite, depuis, jours1/horaires1, jours2/horaires2, constat1..3 (statut/label/titre), synthese, offre_titre/sub, prix, demo_titre/texte, qr_svg, telephone` ; N&B en plus : `variante_classe, requete, concurrent1/2, annee_site, photo_html`.
   - `photo_html` : généré via `photo_base64.py` (portrait N&B) — coller le résultat une fois dans une constante/asset ; fallback monogramme « M ».
   - `telephone`, nom d'expéditeur, prix par défaut (690) : à personnaliser avant la 1re impression (cf. §11).
4. **Impression** : réutiliser les règles `@page { margin:0; size:A4 }` + aplatissement 3D déjà présentes dans `rejoindre/lettre/[slug]/page.tsx`.

## 9. Landing « prise de contact directe » (D2)

Page publique `src/app/(public)/site-internet/[slug]/page.tsx` (ou route sous le host approprié) :
- Affiche : nom du commerce, accroche « Votre nouveau site en 72 h », et **3 CTA** : appeler, **WhatsApp** (lien `wa.me` vers le numéro Popey, message pré-rempli avec le nom), **formulaire de rappel** (nom + téléphone).
- **Tracking** : au chargement → `contact_scanned_at` (1er scan) ; à la soumission du formulaire → `contact_lead_at` + notification (email/WhatsApp interne). Passer par une route serveur `POST /api/site-internet/[slug]/lead` (service_role, pas d'exposition table).
- Design sobre, mobile-first, cohérent branding Popey.

## 10. Env / secrets

| Variable | Statut | Usage |
|---|---|---|
| `GOOGLE_PLACES_API_KEY` | **déjà présent** | Diagnostic Places. |
| `ANTHROPIC_API_KEY` | **à ajouter** (`.env.example` + Vercel) | Rédaction Claude Haiku des constats. |
| `NEXT_PUBLIC_APP_URL` | déjà présent | Base URL du QR / landing. |
| Numéro WhatsApp/tel Popey | à confirmer | CTA landing + `{{telephone}}` lettre. |

## 11. À personnaliser avant la 1re impression
- `{{telephone}}` : le vrai numéro.
- Nom expéditeur dans en-tête + footer du template (« Marius » par défaut → nom/marque Popey).
- Prix par défaut (690) selon l'offre réelle.
- `{{photo_html}}` : portrait N&B via `photo_base64.py`.

## 12. Sécurité / conformité
- Toutes les routes admin derrière `is_human_admin()` (comme l'existant).
- Landing publique : **ne pas** exposer la table ; lecture via route serveur `service_role` renvoyant le strict minimum (nom, variante).
- RGPD : le diagnostic stocke des données publiques (fiche Google) ; prévoir suppression rapide d'un prospect sur demande (action « libérer » déjà dans le patron lettre).
- Respecter les quotas/CGU Google Places ; cacher les résultats Places (déjà le cas côté cron) pour limiter les appels.

## 13. Tests & recette
- **Diagnostic** : commerce sans site → variante A ; commerce avec vieux site → B ; site correct → SKIP. Vérifier valeurs (note, année) réelles.
- **Dégradation** : sans `ANTHROPIC_API_KEY` → constats rule-based, aucune erreur. Sans `GOOGLE_PLACES_API_KEY` → message clair.
- **Lettre** : aperçu recto/verso net, QR scannable, `Cmd+P → PDF` sans marges, export PNG correct, bascule A/B.
- **Landing** : scan → `contact_scanned_at` ; formulaire → `contact_lead_at` + notif.
- **Cycle de vie** : draft → validated → printed → delivered → contacted.
- Build : `npm run build` + lint OK ; migration appliquée sur une base de test.

## 14. Découpage en tickets (ordre de livraison conseillé)

1. **DB** — migration extension `human_vitrine_sites` (§5). *(petit)*
2. **Template** — déposer `prospection-nb-template.html` + générer `photo_html` (§8.1). *(petit)*
3. **Page lettre** — `site-internet/lettre/[slug]` par copie/adaptation de `rejoindre/lettre` (§8). *(moyen)* — livrable visible tôt, testable avec données saisies à la main.
4. **Landing contact** — `/site-internet/[slug]` + route lead + tracking (§9). *(moyen)*
5. **Onglet admin** — nav + page liste + formulaire d'ajout + actions statut (§6). *(moyen)*
6. **Diagnostic Places** — route `/diagnose` étape Places + décision A/B/SKIP (§7.1-7.2). *(moyen)*
7. **Diagnostic constats + Claude** — rédaction rule-based + Haiku + écran de validation (§7.3, §6.4). *(moyen)*
8. **Finitions** — screenshot mobile variante B, concurrents variante A, notifications lead (§7.2, §7.4, §9). *(backlog)*

> Ordre pensé pour livrer un **artefact imprimable dès le ticket 3** (avec données manuelles),
> puis brancher l'automatisation derrière — on « va au bout » par tranches utilisables.

## 15. Risques & points ouverts
- **Analyse du site réel** en environnement serverless (Vercel) : `fetch` OK, mais screenshot Playwright nécessite un runtime adapté (edge/functions limitées). → v1 sans screenshot (mockup CSS), screenshot en tranche 8 si besoin, éventuellement via le pipeline `vitrine-auto/` Python.
- **Détection de l'année du site** (copyright footer) : heuristique faillible → toujours passer par l'écran de validation humaine.
- **Coût/quotas Places & Claude** : négligeables à ce volume (~0,1 c/lettre pour Claude), mais cacher les appels Places.
- **Numéro de contact / branding** de la lettre et de la landing : à figer avant impression (§11).
- **`status` vs `letter_status`** : garder les deux cycles séparés pour ne pas casser l'onglet Vitrines existant.
```
