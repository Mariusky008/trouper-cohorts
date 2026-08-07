-- LE DIRECT — le pouls de la ville en temps réel.
--
-- POURQUOI UNE TABLE, ALORS QUE `current_offer` EXISTE DÉJÀ
--
-- `human_vitrine_sites.current_offer` est UN objet jsonb par commerce. Il a fait
-- son travail tant qu'un commerçant n'avait qu'une chose à dire à la fois et
-- qu'elle s'affichait sur son propre site. Le Direct demande autre chose :
--
--   · plusieurs publications vivantes en même temps chez le même commerce ;
--   · un identifiant stable par publication (on garde une offre précise, on la
--     retire, on compte ses vues — pas « l'offre du moment » de quelqu'un) ;
--   · une FAMILLE (place libre / offre / événement / info de la ville), qui
--     porte la pastille et le filtre du fil ;
--   · une échéance par publication, parce qu'« une publication expirée
--     disparaît du fil » est la traduction directe du positionnement ;
--   · un auteur qui n'est pas toujours un commerce — la collectivité publie
--     aussi, et elle n'a pas de ligne dans human_vitrine_sites.
--
-- `current_offer` n'est pas supprimé : il reste la source du bandeau sur le site
-- du commerçant. La route pro écrit désormais aux DEUX endroits, et le fil ne
-- lit que cette table. Une seule vérité pour le fil.

BEGIN;

-- ── Les publications ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.human_publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Regroupement géographique. `ville_slug` est la clé de lecture du fil ; le
  -- nom exact est conservé pour l'affichage, les deux divergent (« Dax, France »).
  ville text NOT NULL DEFAULT '',
  ville_slug text NOT NULL,

  -- AUTEUR. `site_id` pointe le commerce ; il est NULL pour les publications de
  -- la collectivité, qui n'a pas de vitrine. `auteur_nom` et `auteur_metier`
  -- sont recopiés à la publication plutôt que joints à la lecture : le fil est
  -- l'écran le plus chargé de l'application, et une publication doit rester
  -- lisible telle qu'elle a été émise même si la fiche change ensuite.
  site_id uuid REFERENCES public.human_vitrine_sites(id) ON DELETE CASCADE,
  auteur_nom text NOT NULL DEFAULT '',
  auteur_metier text NOT NULL DEFAULT '',
  auteur_slug text NOT NULL DEFAULT '',

  -- FAMILLE : 'place' (place libre) · 'offre' · 'evenement' · 'ville'.
  -- Contrainte plutôt qu'enum : ajouter une famille ne doit pas demander une
  -- migration de type sur une table en production.
  famille text NOT NULL DEFAULT 'offre'
    CHECK (famille IN ('place', 'offre', 'evenement', 'ville')),

  texte text NOT NULL,
  photo text,
  -- Lien externe optionnel (une info de la ville renvoie souvent à son site).
  lien text,

  -- ÉCHÉANCE. NULL = pas de limite annoncée ; la publication sort du fil au bout
  -- de `FENETRE_SANS_ECHEANCE` (côté applicatif) pour qu'un fil « temps réel »
  -- ne se transforme pas en archive.
  expire_le timestamptz,
  publie_le timestamptz NOT NULL DEFAULT now(),
  -- Retrait manuel par l'auteur : on marque, on ne supprime pas (les gardées des
  -- habitants pointent dessus, et on veut pouvoir expliquer une disparition).
  retire_le timestamptz,

  vues integer NOT NULL DEFAULT 0,
  clics integer NOT NULL DEFAULT 0,

  created_at timestamptz NOT NULL DEFAULT now()
);

-- La lecture du fil : une ville, ce qui n'est pas retiré, du plus récent au plus
-- ancien. C'est la requête de l'écran d'accueil — elle doit être servie par
-- l'index, tri compris.
--
-- INDEX PARTIEL, et c'est le point : `retire_le IS NULL` est dans TOUTES les
-- lectures du fil, jamais en variable. Le mettre en colonne d'index (plutôt
-- qu'en condition) intercalerait une colonne non contrainte par égalité entre
-- `ville_slug` et `publie_le`, et Postgres devrait alors trier le résultat au
-- lieu de parcourir l'index dans l'ordre. Vérifié au plan d'exécution : en
-- partiel, le tri disparaît.
--
-- `expire_le` n'y figure pas : l'expiration se juge en applicatif (la fenêtre
-- dépend du volume de la ville), pas en SQL.
CREATE INDEX IF NOT EXISTS human_publications_fil_idx
  ON public.human_publications (ville_slug, publie_le DESC)
  WHERE retire_le IS NULL;

CREATE INDEX IF NOT EXISTS human_publications_site_idx
  ON public.human_publications (site_id, publie_le DESC);

-- ── L'habitant ──────────────────────────────────────────────────────────────
--
-- CANAL : e-mail. Le SMS coûte à l'envoi (~0,06 € pièce) : à trois cents
-- abonnés et un envoi par jour, la facture arrive avant le premier euro de
-- revenu — c'est déjà l'arbitrage retenu pour human_ville_abonnes, et il n'y a
-- pas de raison d'en changer ici. `telephone` existe et reste NULL : le jour où
-- les alertes de dernière minute justifieront le SMS, c'est un canal à activer,
-- pas une table à réécrire.
--
-- CONSULTER NE DEMANDE RIEN. Aucune ligne n'est créée pour lire Le Direct. Elle
-- n'apparaît qu'au premier geste qui engage : garder une offre, suivre un
-- commerce, demander le résumé du jour.
CREATE TABLE IF NOT EXISTS public.human_habitants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identité d'APPAREIL, posée avant toute identité de personne. Elle permet de
  -- garder une offre sans rien demander, et de rattacher ces gardées le jour où
  -- la personne donne son adresse. Sans elle, le premier ♥ ouvrirait un
  -- formulaire — et le geste serait perdu.
  device_token text NOT NULL DEFAULT encode(gen_random_bytes(18), 'hex'),

  email text,
  telephone text,
  prenom text NOT NULL DEFAULT '',

  ville text NOT NULL DEFAULT '',
  ville_slug text NOT NULL DEFAULT '',
  -- Secteur et rayon : ils servent le repli de distance quand la géolocalisation
  -- est refusée (« Centre-ville » au lieu de « 280 m »).
  quartier text NOT NULL DEFAULT '',
  rayon_m integer NOT NULL DEFAULT 2000,
  categories text[] NOT NULL DEFAULT '{}',

  -- Chaque canal est indépendant et désactivable. `ville_infos` est à FALSE par
  -- défaut : les publications de la collectivité intéressent moins que les
  -- commerces, et un canal qu'on n'a pas demandé n'est pas un canal.
  recoit_resume boolean NOT NULL DEFAULT true,
  recoit_alertes boolean NOT NULL DEFAULT true,
  recoit_suivis boolean NOT NULL DEFAULT true,
  recoit_ville_infos boolean NOT NULL DEFAULT false,
  -- Heures de tranquillité, en heure locale (0–23).
  silence_avant smallint NOT NULL DEFAULT 9,
  silence_apres smallint NOT NULL DEFAULT 20,

  confirm_token text NOT NULL DEFAULT encode(gen_random_bytes(18), 'hex'),
  unsub_token text NOT NULL DEFAULT encode(gen_random_bytes(18), 'hex'),
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  consent_text text,
  consent_at timestamptz,
  last_sent_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS human_habitants_device_idx
  ON public.human_habitants (device_token);
-- Une adresse par ville : la même personne peut suivre deux villes.
CREATE UNIQUE INDEX IF NOT EXISTS human_habitants_email_idx
  ON public.human_habitants (ville_slug, lower(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS human_habitants_confirm_idx
  ON public.human_habitants (confirm_token);
CREATE UNIQUE INDEX IF NOT EXISTS human_habitants_unsub_idx
  ON public.human_habitants (unsub_token);

-- ── Ce que l'habitant garde ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.human_gardees (
  habitant_id uuid NOT NULL REFERENCES public.human_habitants(id) ON DELETE CASCADE,
  publication_id uuid NOT NULL REFERENCES public.human_publications(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (habitant_id, publication_id)
);

-- ── Les commerces suivis ────────────────────────────────────────────────────
-- `visites` compte les ouvertures de fiche depuis Le Direct. C'est ce qui
-- alimente le niveau de relation en cœurs. Rien d'inventé : un compteur réel,
-- incrémenté sur un geste réel.
CREATE TABLE IF NOT EXISTS public.human_suivis (
  habitant_id uuid NOT NULL REFERENCES public.human_habitants(id) ON DELETE CASCADE,
  site_id uuid NOT NULL REFERENCES public.human_vitrine_sites(id) ON DELETE CASCADE,
  visites integer NOT NULL DEFAULT 0,
  derniere_visite_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (habitant_id, site_id)
);

CREATE INDEX IF NOT EXISTS human_suivis_site_idx ON public.human_suivis (site_id);

-- ── Réglages par ville ──────────────────────────────────────────────────────
--
-- Le seuil du compteur du pouls DOIT être réglable par ville : « 24 choses se
-- passent aujourd'hui » est excellent à 24 et un aveu de faiblesse à 3. Une
-- ville qui démarre avec vingt commerçants et une ville installée n'ont pas le
-- même seuil, et c'est une décision éditoriale — pas une constante de code.
CREATE TABLE IF NOT EXISTS public.human_villes_config (
  ville_slug text PRIMARY KEY,
  ville text NOT NULL DEFAULT '',
  seuil_compteur integer NOT NULL DEFAULT 12,
  -- Quartiers proposés dans l'onglet Moi, et servant de repli d'affichage quand
  -- la position est refusée.
  quartiers text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Position des commerces ──────────────────────────────────────────────────
-- Sans coordonnées, pas de distance. Elles sont renseignées quand on les a ; la
-- règle de repli (quartier, puis ville) fait que leur absence n'empêche jamais
-- une carte de s'afficher.
ALTER TABLE public.human_vitrine_sites
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS quartier text NOT NULL DEFAULT '';

NOTIFY pgrst, 'reload schema';

COMMIT;
