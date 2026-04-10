# Popey Human - Plan d'Execution (Post Mock-up)

## 1) Objectif Produit

Construire une experience **100% independante** pour Popey Human:

- Entree publique: `https://www.popey.academy/popey-human`
- Bouton `Connexion` dedie
- Auth dediee Popey Human
- Redirection vers une interface privee Popey Human (membre/admin)
- Separation claire vis-a-vis des autres formations et parcours deja presents sur `popey.academy`


## 2) Decision Architecture (a figer)

### 2.1 Separation fonctionnelle

- Front public: `src/app/popey-human/page.tsx`
- Espace connecte: `src/app/popey-human/app/...`
- Admin Popey Human: `src/app/admin/humain/...` (integre au socle `/admin`, mais isole dans un onglet dedie)

### 2.2 Dans l'admin existant (`/admin`)

Ajouter un onglet explicite:

- `Admin Global` (existant)
- `100% Humain` (nouvel espace dedie Popey Human)

Objectif: reutiliser votre base admin actuelle tout en dissociant le pilotage Popey Human.


## 3) Regle Metier Centrale (Permissions Reseau)

**Vous etes l'unique decisionnaire** des permissions de mise en relation.

Chaque membre Popey Human suit ce cycle:

1. `BINOME_ONLY` (demarrage): acces uniquement au binome attribue
2. `SELECTED_MEMBERS`: acces a une liste ciblee de membres autorises
3. `SPHERE_FULL`: acces a toute la sphere

Cette regle pilote:

- annuaire visible
- notifications visibles
- dispatch possibles
- suggestions/recommandations


## 4) Routage Cible

### 4.1 Public

- `GET /popey-human` (landing)
- CTA principal: `Connexion`
- CTA secondaire optionnel: `Demander un audit`

### 4.2 Auth Popey Human

- `GET /popey-human/login`
- `POST /popey-human/login` (email + mot de passe / magic link selon choix)
- Redirect success:
  - membre -> `/popey-human/app`
  - admin -> `/admin/humain`

### 4.3 Espace membre Popey Human

- `/popey-human/app` (cockpit membre)
- `/popey-human/app/notifications`
- `/popey-human/app/profile`
- `/popey-human/app/annuaire`

### 4.4 Espace admin Popey Human

- `/admin/humain` (dashboard admin humain)
- `/admin/humain/membres`
- `/admin/humain/permissions`
- `/admin/humain/sphere`
- `/admin/humain/notifications`


## 5) Data Model (V1)

## 5.1 Tables coeur

- `human_members`
  - `id`
  - `user_id`
  - `first_name`, `last_name`, `metier`, `ville`, `phone`
  - `status` (active, paused, archived)
  - `created_at`, `updated_at`

- `human_permissions`
  - `id`
  - `member_id`
  - `access_mode` (`BINOME_ONLY` | `SELECTED_MEMBERS` | `SPHERE_FULL`)
  - `decided_by_admin_id`
  - `decided_at`
  - `note`

- `human_allowed_members`
  - `id`
  - `member_id` (celui qui recoit l'acces)
  - `allowed_member_id` (membre autorise)
  - `granted_by_admin_id`
  - `granted_at`

- `human_buddy_links`
  - `id`
  - `member_a_id`
  - `member_b_id`
  - `assigned_by_admin_id`
  - `assigned_at`

- `human_leads`
  - `id`
  - `owner_member_id`
  - `source_member_id`
  - `client_name`, `budget`, `besoin`, `phone`, `adresse`, `notes`
  - `status` (`nouveau`, `pris`, `signe`, `perdu`)
  - `opened_at` (pour suivi lecture)
  - `created_at`, `updated_at`

- `human_notifications`
  - `id`
  - `member_id`
  - `type` (`generale`, `personnelle`, `felicitation`)
  - `title`, `message`, `impact`
  - `is_read`
  - `created_at`

- `human_commissions`
  - `id`
  - `lead_id`
  - `signed_amount`
  - `commission_amount`
  - `payer_member_id`
  - `receiver_member_id`
  - `payment_status`
  - `created_at`, `updated_at`

## 5.2 RLS / securite

- Un membre ne lit que ses donnees + celles autorisees par son `access_mode`
- Seuls les admins Popey Human modifient `human_permissions`, `human_allowed_members`, `human_buddy_links`
- Audit log obligatoire sur changements de permissions


## 6) API/Actions a creer

- `human.auth.login`
- `human.members.getMe`
- `human.members.updateProfile`
- `human.permissions.getMyScope`
- `human.permissions.adminSetMode`
- `human.permissions.adminGrantMember`
- `human.permissions.adminRevokeMember`
- `human.permissions.adminAssignBuddy`
- `human.leads.listVisible`
- `human.leads.take`
- `human.leads.markSigned`
- `human.leads.markLost`
- `human.notifications.list`
- `human.notifications.markRead`
- `human.commissions.summary`


## 7) Plan de Livraison (ordre strict recommande)

### Sprint 1 - Socle Independance + Auth

- Ajouter bouton `Connexion` sur `/popey-human`
- Creer `/popey-human/login`
- Creer guard Popey Human (session + role)
- Redirection post-login vers espace dedie

**Done quand:**
- aucun passage involontaire vers autres formations
- login Popey Human fonctionne de bout en bout

### Sprint 2 - Permissions reseau admin (prioritaire)

- Ecran admin `100% Humain` dans `/admin`
- Gestion `BINOME_ONLY / SELECTED_MEMBERS / SPHERE_FULL`
- Attribution binome initial
- Ajout/suppression membres autorises

**Done quand:**
- un membre en mode binome ne voit qu'un binome
- un membre en mode full sphere voit la sphere complete

### Sprint 3 - Flux Membre (Clients + Signal)

- Brancher les ecrans mockes `Clients` + `Signal` aux vraies donnees
- Lecture fiche client tracee (point bleu admin)
- Talkie en mode clic start/stop (deja maquetté, a brancher au backend)

### Sprint 4 - Cash + Notifications

- Brancher commissions reelles
- Refondre notifications (deja maquette conversationnelle) avec persistence
- Filtres `Mes deals`, reactions, lecture

### Sprint 5 - Stabilisation / QA / lancement pilote

- Tests E2E mobile
- securite + RLS
- observabilite erreurs et usage
- beta fermee


## 8) UX/Produit - Regles de coherence

- Navigation membre simple: `Clients / Signal / Cash`
- `Annuaire` et `Profil` toujours accessibles
- Admin dans espace dedie `100% Humain` (pas de confusion avec autres programmes)
- Theme clair/sombre: contraste valide partout
- Aucune action critique sans feedback clair (ex: prise de deal, permissions modifiees)


## 9) Checklist Technique "New Task" (copier/coller)

1. Creer route login dediee `popey-human`
2. Ajouter middleware guard Popey Human (role + namespace)
3. Ajouter onglet admin `/admin/humain`
4. Creer migrations `human_*` (members, permissions, buddy, leads, notifications, commissions)
5. Implementer actions server `human.permissions.*`
6. Brancher ecran admin permissions
7. Brancher ecran membre annuaire selon scope
8. Brancher ecran leads selon scope
9. Brancher notifications conversationnelles reelles
10. Ecrire tests E2E des 3 niveaux d'acces


## 10) Risques et Parades

- Risque: fuite de donnees entre formations
  - Parade: namespace Popey Human + guards + RLS strictes
- Risque: complexite permissions
  - Parade: 3 niveaux simples + whitelist explicite
- Risque: confusion admin
  - Parade: onglet `100% Humain` dedie, wording clair, ACL admin specifique


## 11) Definition of Done (globale)

- Le bouton `Connexion` de `/popey-human` mene au login dedie
- L'interface Popey Human est operationnelle sans dependance aux autres parcours
- Le controle d'acces reseau est 100% admin-driven
- Les ecrans mockes critiques sont branches a de vraies donnees
- L'UX mobile est fluide et les themes lisibles

