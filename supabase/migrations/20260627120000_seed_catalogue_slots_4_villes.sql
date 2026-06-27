-- Pré-remplit le catalogue avec des emplacements VIDES (libres) pour 4 villes.
-- Chaque emplacement = status 'dispo', sans commerce_slug → prêt à recevoir un prospect.
-- Idempotent : on n'insère un (city_slug, metier_slug) que s'il n'existe pas déjà.
--
-- sphere_label = titre de section affiché dans le catalogue (texte libre).
-- sphere_key   = valeur interne contrainte à ('sante','habitat','digital','mariage','finance').
BEGIN;

WITH cities(city, city_slug) AS (
  VALUES
    ('Grand Dax', 'grand-dax'),
    ('Pau', 'pau'),
    ('Bayonne-Anglet-Biarritz', 'bayonne-anglet-biarritz'),
    ('Bordeaux', 'bordeaux')
),
metiers(metier, metier_slug, sphere_key, sphere_label) AS (
  VALUES
    -- 🍽️ Bouche & Gourmandise (10)
    ('Boulangerie-pâtisserie',         'boulangerie-patisserie',         'digital', 'Bouche & Gourmandise'),
    ('Boucherie-charcuterie',          'boucherie-charcuterie',          'digital', 'Bouche & Gourmandise'),
    ('Fromagerie',                     'fromagerie',                     'digital', 'Bouche & Gourmandise'),
    ('Primeur',                        'primeur',                        'digital', 'Bouche & Gourmandise'),
    ('Caviste',                        'caviste',                        'digital', 'Bouche & Gourmandise'),
    ('Chocolatier',                    'chocolatier',                    'digital', 'Bouche & Gourmandise'),
    ('Poissonnerie',                   'poissonnerie',                   'digital', 'Bouche & Gourmandise'),
    ('Épicerie fine',                  'epicerie-fine',                  'digital', 'Bouche & Gourmandise'),
    ('Torréfacteur · salon de thé',    'torrefacteur-salon-de-the',      'digital', 'Bouche & Gourmandise'),
    ('Bar à vins · micro-brasserie',   'bar-a-vins-micro-brasserie',     'digital', 'Bouche & Gourmandise'),
    -- 💇 Beauté & Bien-être (10)
    ('Coiffeur femme',                 'coiffeur-femme',                 'sante',   'Beauté & Bien-être'),
    ('Barbier · coiffeur homme',       'barbier-coiffeur-homme',         'sante',   'Beauté & Bien-être'),
    ('Institut de beauté',             'institut-de-beaute',             'sante',   'Beauté & Bien-être'),
    ('Onglerie',                       'onglerie',                       'sante',   'Beauté & Bien-être'),
    ('Masseur bien-être · spa',        'masseur-bien-etre-spa',          'sante',   'Beauté & Bien-être'),
    ('Praticien shiatsu · réflexologie','praticien-shiatsu-reflexologie','sante',   'Beauté & Bien-être'),
    ('Naturopathe · sophrologue',      'naturopathe-sophrologue',        'sante',   'Beauté & Bien-être'),
    ('Salon de tatouage',             'salon-de-tatouage',              'sante',   'Beauté & Bien-être'),
    ('Maquilleuse',                    'maquilleuse',                    'sante',   'Beauté & Bien-être'),
    ('Coach sportif · studio fitness', 'coach-sportif-studio-fitness',   'sante',   'Beauté & Bien-être'),
    -- 🏠 Maison & Déco (7)
    ('Décoration · cadeaux',           'decoration-cadeaux',             'habitat', 'Maison & Déco'),
    ('Brocante · dépôt-vente',         'brocante-depot-vente',           'habitat', 'Maison & Déco'),
    ('Encadreur · atelier d''art',     'encadreur-atelier-d-art',        'habitat', 'Maison & Déco'),
    ('Magasin de meubles',             'magasin-de-meubles',             'habitat', 'Maison & Déco'),
    ('Literie · matelas',              'literie-matelas',                'habitat', 'Maison & Déco'),
    ('Cuisiniste',                     'cuisiniste',                     'habitat', 'Maison & Déco'),
    ('Jardinerie · plantes',           'jardinerie-plantes',             'habitat', 'Maison & Déco'),
    -- 👗 Mode & Accessoires (7)
    ('Boutique vêtements femme',       'boutique-vetements-femme',       'digital', 'Mode & Accessoires'),
    ('Boutique vêtements homme',       'boutique-vetements-homme',       'digital', 'Mode & Accessoires'),
    ('Chaussures',                     'chaussures',                     'digital', 'Mode & Accessoires'),
    ('Bijouterie · créateur',          'bijouterie-createur',            'digital', 'Mode & Accessoires'),
    ('Maroquinerie · accessoires',     'maroquinerie-accessoires',       'digital', 'Mode & Accessoires'),
    ('Opticien',                       'opticien',                       'digital', 'Mode & Accessoires'),
    ('Boutique enfant · puériculture', 'boutique-enfant-puericulture',   'digital', 'Mode & Accessoires'),
    -- 🔧 Artisans & Création (5)
    ('Tapissier · réfection sièges',   'tapissier-refection-sieges',     'habitat', 'Artisans & Création'),
    ('Couturière · retouches',         'couturiere-retouches',           'habitat', 'Artisans & Création'),
    ('Paysagiste · entretien jardin',  'paysagiste-entretien-jardin',    'habitat', 'Artisans & Création'),
    ('Home-stager · décorateur',       'home-stager-decorateur',         'habitat', 'Artisans & Création'),
    ('Artisan créateur (céramiste, ébéniste…)', 'artisan-createur',      'habitat', 'Artisans & Création'),
    -- 🛠️ Services & Proximité (8)
    ('Réparateur smartphone · informatique', 'reparateur-smartphone-informatique', 'digital', 'Services & Proximité'),
    ('Cordonnier · réparation',        'cordonnier-reparation',          'digital', 'Services & Proximité'),
    ('Toiletteur canin',               'toiletteur-canin',               'digital', 'Services & Proximité'),
    ('Animalerie',                     'animalerie',                     'digital', 'Services & Proximité'),
    ('Pressing · blanchisserie',       'pressing-blanchisserie',         'digital', 'Services & Proximité'),
    ('Auto-école',                     'auto-ecole',                     'digital', 'Services & Proximité'),
    ('Vélociste · réparation vélos',   'velociste-reparation-velos',     'digital', 'Services & Proximité'),
    ('Magasin bio · vrac',             'magasin-bio-vrac',               'digital', 'Services & Proximité'),
    -- 🎉 Événementiel (3)
    ('Fleuriste',                      'fleuriste',                      'mariage', 'Événementiel'),
    ('Photographe',                    'photographe',                    'mariage', 'Événementiel'),
    ('Traiteur',                       'traiteur',                       'mariage', 'Événementiel'),
    -- ➕ Emplacement libre pour un métier hors liste (51e)
    ('Autre métier',                   'autre-metier',                   'digital', 'Autres')
),
combos AS (
  SELECT
    c.city, c.city_slug,
    m.metier, m.metier_slug, m.sphere_key, m.sphere_label
  FROM cities c
  CROSS JOIN metiers m
)
INSERT INTO public.human_marketplace_places
  (city, city_slug, sphere_key, sphere_label, metier, metier_slug, status, is_seeded)
SELECT
  combos.city, combos.city_slug, combos.sphere_key, combos.sphere_label,
  combos.metier, combos.metier_slug, 'dispo', true
FROM combos
WHERE NOT EXISTS (
  SELECT 1 FROM public.human_marketplace_places p
  WHERE p.city_slug = combos.city_slug
    AND p.metier_slug = combos.metier_slug
);

COMMIT;
