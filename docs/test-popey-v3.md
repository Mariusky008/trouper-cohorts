# Guide de test — Popey v3 (fidélité, Coup de feu, match)

Test bout‑en‑bout de la plateforme v3. À faire idéalement avec **2 appareils**
(ou 1 téléphone côté **client** + 1 navigateur en **navigation privée** côté **pro**).

> Remplace `bordeaux` par ta ville et `<ton-slug>` par le slug du commerçant testé.
> Utilise **ton vrai numéro WhatsApp** côté client pour recevoir les notifications.

## URLs de référence

| Rôle | URL |
|------|-----|
| Catalogue client | `https://www.popey.academy/m/bordeaux` |
| Espace pro | `https://www.popey.academy/pro?p=<ton-slug>` |
| Fiche Coup de feu (deep‑link) | `https://www.popey.academy/o/<campaignId>` *(généré au lancement)* |
| Atterrissage « match » | `https://www.popey.academy/m/bordeaux?match=<placeId>` *(envoyé en WhatsApp)* |

---

## Phase 1 — Réservation + identité (client)

1. Ouvre **`/m/bordeaux`** en **navigation privée** (état neuf, pas de numéro mémorisé).
2. Sur une offre : **❤ Je veux** → dans le volet, **Réserver**.
3. ✅ *Attendu* : un formulaire **prénom + numéro** s'affiche (tu es « nouveau »). Saisis ton **numéro WhatsApp**, coche le consentement, valide.
4. ✅ *Attendu* : écran **« C'est réservé »** + un **code à 4 chiffres** + « niveau 0/5 ».
5. *Vérif Supabase* :
   - `human_privilege_members` → 1 ligne (ton numéro)
   - `human_privilege_relationships` → `level = 0`
   - `human_privilege_reservations` → 1 ligne
   - `human_privilege_visits` → 1 ligne **`pending`** avec le code
   - `human_privilege_alert_subscribers` → 1 ligne **`confirmed`** (si consentement coché)

## Phase 2 — Validation → notif match (pro)

6. Sur l'autre appareil : **`/pro?p=<ton-slug>`**.
7. Onglet **✅ Valider** → tape le **code à 4 chiffres** → valide.
8. ✅ *Attendu (pro)* : overlay succès **niveau 0 → 1**, récompense débloquée, cœurs.
9. ✅ *Attendu (client, sur WhatsApp)* : message **« 💚 Ta visite chez … est validée… 👉 lien »**.
10. *Vérif Supabase* : `…visits.status = validated` · `…relationships.level = 1`.

## Phase 3 — Animation match + avis vérifié (client)

11. **Clique le lien WhatsApp** (= `/m/bordeaux?match=<placeId>`), **sur l'appareil où tu as réservé**.
12. ✅ *Attendu* : overlay **« C'est un match ! »** + bouton **« ⭐ Noter … »**.
13. Tape **Noter** → étoiles + commentaire → envoie.
14. *Vérif* : l'avis apparaît avec le badge **vérifié** sur la fiche du pro.
15. Rouvre **`/m/bordeaux`** → la carte de ce commerçant affiche **« 💚 1/5 »**.

> ⚠️ L'animation `?match=` ne s'affiche que sur l'appareil où le numéro est mémorisé
> (celui de la réservation). Sur un appareil neuf, le catalogue se charge normalement
> mais sans l'overlay forcé.

## Phase 4 — Coup de feu (pro → client)

16. Pro → onglet **⚡ Coup de feu** → décris l'offre + places + durée → **Lancer la 1ʳᵉ vague**.
17. ✅ *Attendu (pro)* : vue live « X / Y places réservées », vague envoyée.
    *(Les fans niveau 5 d'abord reçoivent un WhatsApp « ⚡ … Réserver ».)*
18. Côté client : ouvre **`/o/<id>`** (lien du message) → fiche (places restantes,
    badge **prioritaire** si niveau ≥ 3) → **Réserver ma place** → nouveau code.
19. *Vérif Supabase* : `…coup_campaigns.places_taken` +1 ; nouvelles lignes
    `…reservations` (avec `campaign_id`) + `…visits`.
20. Sur **`/m/bordeaux`**, un **bandeau ⚡** « coup de feu en cours » apparaît en haut du deck.
21. Pro → **Élargir → vague suivante** envoie au niveau inférieur (4, puis 3, puis tous).

## Phase 5 — Espace pro (canaux gratuits + fans)

22. Onglet **📊 Activité** : bloc **« 🔗 Ton lien à partager »** (`/c/<slug>` + copier + WhatsApp)
    et **« 🏆 Classement & mission »** (rang ville, clics, coupons).
23. Onglet **⚡** → section **« 👥 Tes fans »** (liste + quota mensuel) → **Ajouter un client** :
    saisis un numéro → ce numéro reçoit un **opt‑in** ; il devient fan **seulement s'il répond OUI**.

## Phase 6 — Écrans bonus (client)

24. **Carte mystère** : une offre `is_mystery_offer` apparaît voilée « 🎁 Offre mystère » →
    **Révéler** → l'offre réelle se dévoile (mémorisé).
25. **Agenda** : pill **📅** dans l'en‑tête → sheet des événements de la ville →
    **« 📅 Ajouter »** (Google Agenda) + **« 📲 Partager »**.

---

## Dépannage rapide

| Symptôme | Cause probable |
|----------|----------------|
| Pas de formulaire prénom/numéro à l'étape 3 | Un numéro est déjà mémorisé localement → re‑teste en navigation privée. |
| Pas de WhatsApp reçu (étapes 9 / 17) | Numéro pas au format WhatsApp valide, **ou** template Meta concerné pas encore approuvé. |
| Tout marche mais aucune donnée ne se crée | Table `human_privilege_coup_campaigns` absente → repasser la migration `20260617120000_create_coup_campaigns.sql`. |
| L'animation match ne s'affiche pas via le lien | Appareil sans numéro mémorisé (différent de celui de la réservation). |

---

## Annexes

### Tables Supabase (RLS deny‑all, accès service‑role)
`human_privilege_members` · `…relationships` (niveau = nb visites validées) ·
`…visits` (code 4 chiffres, pending → validated) · `…loyalty_tiers` (paliers éditables) ·
`…reservations` (+ `campaign_id`) · `…coup_campaigns` · `…alert_subscribers` (fans opt‑in).

### Variables d'environnement WhatsApp (Twilio)
| Variable | Usage |
|----------|-------|
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_WHATSAPP_FROM` | Compte Twilio |
| `TWILIO_WHATSAPP_CONTENT_SID_ALERT_OPTIN` | Double opt‑in ({{1}}=commerçant, {{2}}=ville) |
| `TWILIO_WHATSAPP_CONTENT_SID_ALERT_BROADCAST` | Diffusion / Coup de feu ({{1}}=commerçant, {{2}}=offre, {{3}}=lien) |
| `TWILIO_WHATSAPP_CONTENT_SID_MATCH` | Notif match ({{1}}=commerçant, {{2}}=récompense, {{3}}=lien) |

### Règle d'or
**Seule la visite validée par le pro** (code 4 chiffres) fait monter le niveau,
débloque la récompense, autorise l'avis vérifié et compte le revenu.
Aucune offre (catalogue ou Coup de feu) ne fait monter de niveau.
