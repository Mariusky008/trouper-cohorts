# Audit de sécurité — Popey / trouper-cohorts

**Date :** 2026-06-10
**Périmètre :** routes API (`src/app/api/**`), server actions (`src/lib/actions/**`), gating admin, catalogue statique (`public/popey-privilege-catalogue.html`), config (`next.config.ts`, `middleware`/`proxy`), gestion des secrets.
**Méthode :** exploration multi-agents **puis vérification manuelle** de chaque point critique (les agents ont produit plusieurs faux positifs, corrigés ci-dessous).

> **Verdict global : 🟠 À corriger, mais pas de catastrophe ouverte.**
> Pas de secret committé, pas de clé service-role exposée au navigateur, séparation client/admin propre. Les vrais problèmes sont : un endpoint de debug non protégé, des crons sans authentification, et 2 XSS dans le catalogue (dont 1 réfléchie via l'URL). Aucune « injection SQL » ni fuite de données admin généralisée — voir les faux positifs en fin de doc.

---

## 1. Synthèse priorisée

| # | Sévérité | Problème | Emplacement |
|---|----------|----------|-------------|
| 1 | 🔴 Haute | Endpoint `/api/admin/bootstrap` **sans auth** (insère dans `admins` via service-role) | `src/app/api/admin/bootstrap/route.ts` |
| 2 | 🔴 Haute | **5 crons sans authentification** (matching, emails, missions) | `src/app/api/cron/{generate-daily-matches,rotate-pairs,send-daily-match-emails,send-human-daily-emails,validate-missions-j1}/route.ts` |
| 3 | 🔴 Haute | **XSS réfléchie** via `?ref_name=` injecté en `innerHTML` | `public/popey-privilege-catalogue.html:3907` |
| 4 | 🟠 Moyenne-haute | **XSS stockée** (contenu événement) dans le feed d'accueil + modale | `public/popey-privilege-catalogue.html:4158-4170`, `4187-4198` |
| 5 | 🟠 Moyenne | **Aucun header de sécurité** (pas de X-Frame-Options / CSP) → clickjacking | `next.config.ts` |
| 6 | 🟠 Moyenne | Rôle admin vérifié à la couche data, **pas au middleware/layout** (défense en profondeur) | `src/proxy.ts`, `src/app/admin/layout.tsx` |
| 7 | 🟠 Moyenne | **Pas de rate-limiting** sur écritures publiques (avis, candidatures, tracking) | `src/app/api/{avis/feedback,commando/apply,popey-human/.../track}/route.ts` |
| 8 | 🟡 Basse | `verify…Token` n'interdit pas un secret vide ; token marchand valable **1 an** | `src/lib/popey-human/marketplace-landing-token.ts` |
| 9 | 🟡 Basse | Pas de validation du **protocole des URLs d'images** (`javascript:`/`data:`) | `public/popey-privilege-catalogue.html` (sink `onerror`) |
| 10 | 🟡 Basse | `typescript.ignoreBuildErrors: true` (les erreurs TS ne cassent pas le build) | `next.config.ts:8` |

---

## 2. Détail des findings vérifiés

### 🔴 1 — `/api/admin/bootstrap` sans authentification
`src/app/api/admin/bootstrap/route.ts` — un `GET` public crée un client **service-role** et insère un `user_id` dans la table `admins`.

```ts
export async function GET() {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {...});
  const userId = '94e3b401-6320-45cc-aba5-db7bc1d38908'; // ID en dur
  await supabase.from('admins').insert({ user_id: userId });
}
```

**Réalité (nuance vs agents) :** l'UUID est **codé en dur**, donc un attaquant ne peut pas se promouvoir lui-même — il ne peut que (ré)insérer **ce** compte précis. L'impact direct est donc limité. **Mais** c'est un endpoint de debug oublié qui expose un usage service-role non authentifié et écrit dans la table d'autorisation la plus sensible.
**Action :** **supprimer le fichier** (ou le passer en POST gardé par `requireAdminUser()` + `CRON_SECRET`). Coût : 1 min.

### 🔴 2 — Crons sans authentification
Vérifié intégralement sur `generate-daily-matches/route.ts` :

```ts
export async function GET(request: Request) { return handleMatching(request); }
// handleMatching → generateMatches(targetDate)   ❌ aucun secret, aucune vérif
```

Les 4 autres (`rotate-pairs`, `send-daily-match-emails`, `send-human-daily-emails`, `validate-missions-j1`) ne contiennent **aucun** marqueur d'auth (`CRON_SECRET` / `isAuthorized` / `Bearer` / `x-vercel-cron`). D'autres crons du repo (`voice-queue`, `review-booster-send-j1`, `scout-referral-nudges`…) appellent bien `isAuthorized()` → **le pattern est incohérent**.

**Impact :** n'importe qui peut déclencher la génération de matchs, l'envoi d'emails en masse (coût + spam + réputation), la validation de missions, avec `?date=` arbitraire.
**Action :** factoriser un helper `assertCronAuthorized(request)` (vérifie `Authorization: Bearer ${CRON_SECRET}` **ou** l'en-tête Vercel Cron) et l'appeler en tête de **chaque** cron. Fail-closed si `CRON_SECRET` absent.

### 🔴 3 — XSS réfléchie via `ref_name` (la plus exploitable)
`public/popey-privilege-catalogue.html:3907`

```js
var refName = (params.get('ref_name') || params.get('referrer') || params.get('pro') || 'Jean Roth').trim();
var first   = refName.split(/\s+/)[0] || 'Jean';
heroTitle.innerHTML = 'Vos avantages<br><em>exclusifs</em><br>grâce à ' + first + '.'; // ❌ brut
```

`first` vient de l'URL et est injecté **sans échappement** dans `innerHTML`. Le split sur les espaces empêche les payloads avec espace, mais pas ceux sans espace (ex. `?ref_name=<svg/onload=alert(document.cookie)>`).
**Impact :** exécution JS arbitraire dans le contexte du catalogue (vol de session, redirection phishing) — déclenchable par un simple **lien piégé**, sans aucun compte.
**Action :** `heroTitle.textContent = ...` **ou** `escapeHtml(first)`. (Ligne 3905 utilise déjà `textContent` correctement pour `senderName` — appliquer le même réflexe.)

### 🟠 4 — XSS stockée dans le feed d'événements d'accueil
`public/popey-privilege-catalogue.html:4158-4170` (`renderLocalEventsFeed`) et `4187-4198` (modale) :

```js
feedEl.innerHTML = events.map(function (ev) {
  '<img src="' + ev.imageUrl + '" alt="' + ev.title + '" onerror="...innerHTML=\'' + ev.emoji + '\'">' // ❌
  + '<div class="event-name">' + ev.title + '</div>'      // ❌ brut
  + '<div class="event-loc">📍 ' + ev.spot + '</div>'     // ❌
  + ev.badge + ... + ev.sponsor + ...                     // ❌
});
```

`ev.title/day/spot/badge/sponsor/detail/imageUrl/emoji` sont injectés **bruts**. Pire : `emoji` est injecté **dans un handler `onerror`** et `imageUrl` dans `src` sans validation de protocole.

**Nuance importante :** le **seul** chemin d'écriture de ces événements est le formulaire admin (gardé). C'est donc une XSS **stockée déclenchable par un admin** (malveillant ou compromis), pas par le public. À l'inverse, **le code récent que j'ai écrit est sûr** : la carte swipe `buildEventCard`, `openEventSheet`, et les profils Tinder `showSwipeTinder` échappent **tout** via `escapeHtml`/`escapeAttr` (vérifié). Le problème est circonscrit à l'**ancien** feed d'accueil.
**Action :** envelopper chaque champ dynamique dans `escapeHtml()` ; ne pas injecter `emoji` dans `onerror` (utiliser un fallback statique) ; valider le protocole de `imageUrl`. **Alternative recommandée** : ce feed d'accueil legacy est-il encore utile maintenant que le swipe est le catalogue par défaut ? Si non, **le supprimer** élimine la surface d'un coup.

### 🟠 5 — Aucun header de sécurité
`next.config.ts` n'exporte **aucune** fonction `headers()`. Donc pas de `X-Frame-Options` / `Content-Security-Policy` / `frame-ancestors`.
**Impact :** le site (et le catalogue) peut être **embarqué en iframe par n'importe quel domaine** (clickjacking), et aucune CSP ne limite l'impact d'une XSS.
**Action :** ajouter dans `next.config.ts` :
```ts
async headers() {
  return [{ source: "/:path*", headers: [
    { key: "X-Frame-Options", value: "SAMEORIGIN" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Content-Security-Policy", value: "frame-ancestors 'self'" }, // élargir progressivement
  ]}];
}
```
(Le catalogue est servi **same-origin** → `SAMEORIGIN` ne casse pas l'iframe interne.)

### 🟠 6 — Rôle admin : défense en profondeur manquante
`src/proxy.ts` protège `/admin/humain` mais ne vérifie que l'**authentification** (redirige vers `/popey-human/admin-login` si `!user`), **pas le rôle**. Le rôle est bien contrôlé **plus bas** : `getAdminMarketplaceSnapshot()` → `requireHumanAdmin()` (table `admins`), et toutes les routes POST admin vérifiées (`local-events`, `tinder-profiles`, `places/update`…) revérifient `admins`.

**Réalité (nuance vs agents) :** ce **n'est pas** une fuite ouverte — un non-admin authentifié tombe sur une page qui renvoie une erreur (data gardée). Mais c'est fragile : **une future page admin qui oublie d'appeler une fonction gardée fuiterait**.
**Action :** ajouter un garde unique au niveau `src/app/admin/layout.tsx` (ou enrichir le middleware pour vérifier l'appartenance à `admins`). Une seule barrière, plus de page oubliée possible.

### 🟠 7 — Pas de rate-limiting sur les écritures publiques
`avis/feedback`, `commando/apply`, et les endpoints de tracking acceptent des POST publics sans limite. (Note : `avis/feedback` et `saisie/[token]` sont **token-gated** — il faut un lien unique valide — donc l'abus est limité à qui possède un token ; je n'ai pas tracé l'unicité/entropie du token en profondeur.)
**Impact :** spam/flood, coût d'insertion, pollution des tables, e-mails.
**Action :** rate-limit par IP (Upstash Ratelimit / `@vercel/firewall`) sur les routes d'écriture publiques, + un quota applicatif là où il manque.

### 🟡 8 — Durcissement des tokens HMAC
`marketplace-landing-token.ts` : ✅ HMAC-SHA256, ✅ comparaison constant-time (`timingSafeEqual`), ✅ `exp` vérifié. Deux réserves :
- `signMarketplaceLandingContext` **throw** si secret vide, mais `verifyMarketplaceLandingContext` **ne rejette pas** explicitement un secret vide (compare avec une clé HMAC vide). Risque réel faible (en prod `MARKETPLACE_LANDING_TOKEN_SECRET` est défini, et la création de liens casserait visiblement sinon), mais à durcir : `if (!secret) return { valid:false }`.
- `signMerchantStatsToken` : expiration par défaut **1 an** → un lien stats fuité reste valable très longtemps. Réduire (ex. 30-90 j) ou prévoir une rotation.

### 🟡 9 — Validation du protocole des URLs d'images
`escapeHtml/escapeAttr` (lignes ~3465) sont corrects pour l'échappement, mais ne **valident pas le protocole**. Pour `<img src>`, l'impact est faible (les navigateurs n'exécutent pas `javascript:` dans `src`), le vrai risque est le sink `onerror` du point #4. À traiter avec #4 via un `isHttpUrl(url)`.

### 🟡 10 — `ignoreBuildErrors`
`next.config.ts:8` : `typescript.ignoreBuildErrors: true`. Les erreurs de types ne cassent pas le déploiement → des régressions de sécurité typées peuvent passer. À terme : viser `false` (corriger la dette TS d'abord) et lancer `tsc --noEmit` en CI.

---

## 3. Ce qui est SAIN (vérifié) ✅
- **Pas de secret committé.** `.env*` gitignoré, `.env.example` = placeholders, aucun JWT/clé en dur trouvé.
- **Clé service-role jamais exposée au client.** `src/lib/env.ts` rejette une `service_role` en `NEXT_PUBLIC`; aucun import de `createAdminClient` dans du code `'use client'`. Séparation nette `supabase/client.ts` (anon) vs `admin.ts` (service-role).
- **Routes POST admin correctement gardées** (`getServerUserIdWithProxyFallback` + table `admins`).
- **HMAC constant-time + expiration** sur les tokens.
- **`/api/internal/send-notification` fail-closed** (`!CRON_SECRET → 401`).
- **Mon code récent** (carte événement, écran « J'y vais », profils Tinder) **échappe tout** (`escapeHtml`/`escapeAttr`).
- **`/c/[handle]`** : pas d'open-redirect (lookup DB only, redirection interne).

---

## 4. Faux positifs des agents (corrigés après vérification)
À garder en tête : ne pas « corriger » ces points, ils sont déjà OK.

- ❌ **« Injection SQL / DROP TABLE via `.or()` »** (activate, offers/delete) — **FAUX**. PostgREST n'est pas du SQL brut. De plus `normalizePersonName` (ligne 70-79) réduit l'entrée à `[a-z0-9\s'-]` → impossible d'injecter `,`/`.`/opérateurs PostgREST. `offers/delete` interpole un `place_id` **issu de la BD** (UUID). → simple **code-smell**, non exploitable.
- ❌ **« `send-notification` accepte si secret vide »** — **FAUX**. `if (!CRON_SECRET || secret !== CRON_SECRET) → 401` est **fail-closed**.
- ❌ **« Pages admin lisibles par tous / fuite de données »** — **EXAGÉRÉ**. Auth exigée par le middleware, rôle exigé par la couche data. Voir #6 (durcissement, pas fuite ouverte).
- ❌ **« Clé service-role exposée au client »** — **FAUX** (vérifié, aucune exposition).
- ❌ **« 29 lignes XSS innerHTML »** — **EXAGÉRÉ**. Seuls le feed d'accueil (#4) et le titre hero (#3) sont réels ; le code récent échappe correctement.

---

## 5. Plan d'action recommandé

**P0 — aujourd'hui (≈1-2 h)**
1. Supprimer `src/app/api/admin/bootstrap/route.ts`.
2. Garde d'auth sur les 5 crons (helper `assertCronAuthorized`).
3. Corriger la XSS réfléchie ligne 3907 (`textContent`/`escapeHtml`).

**P1 — cette semaine**
4. Échapper le feed d'événements legacy (#4) **ou le supprimer** s'il est mort.
5. Headers de sécurité dans `next.config.ts` (#5).
6. Garde admin au niveau `layout.tsx`/middleware (#6).

**P2 — backlog**
7. Rate-limiting écritures publiques (#7).
8. Durcir `verify…Token` + réduire l'expiration des tokens stats (#8).
9. Plan pour repasser `ignoreBuildErrors` à `false` + `tsc` en CI (#10).
10. Revue des **policies RLS** Supabase (non couverte par cet audit côté code — à faire dans le dashboard) : confirmer que les tables sensibles ne sont pas lisibles avec la clé **anon**, puisque beaucoup d'endpoints publics s'appuient sur le service-role.
