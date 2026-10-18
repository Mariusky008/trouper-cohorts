-- Seed fake public opportunities
-- We need to find valid user IDs for giver and buyer.
-- Since we don't know IDs, we will use a subquery to pick any users.
-- If no users exist, this will do nothing (safe).

WITH users AS (
    SELECT id FROM auth.users LIMIT 2
),
first_user AS (
    SELECT id FROM users LIMIT 1
),
second_user AS (
    SELECT id FROM users OFFSET 1 LIMIT 1
)
INSERT INTO network_opportunities (
    giver_id,
    type,
    points,
    details,
    status,
    visibility,
    public_title,
    private_details,
    price,
    buyer_id,
    created_at
)
SELECT
    (SELECT id FROM first_user), -- Giver
    'clients',
    20,
    'Lead qualifié pour rénovation complète maison 120m2 Bordeaux centre.',
    'sold', -- Status SOLD so they are visible but locked/sold
    'public',
    'Rénovation Maison 120m2 - Bordeaux Centre',
    'Contact Mr Martin 0606060606. Budget 150k.',
    20,
    (SELECT id FROM second_user), -- Buyer
    NOW() - INTERVAL '2 days'
WHERE EXISTS (SELECT 1 FROM first_user) AND EXISTS (SELECT 1 FROM second_user);

-- Second fake opportunity (Available)
WITH users AS (
    SELECT id FROM auth.users LIMIT 1
)
INSERT INTO network_opportunities (
    giver_id,
    type,
    'intro',
    points,
    details,
    status,
    visibility,
    public_title,
    private_details,
    price,
    created_at
)
SELECT
    (SELECT id FROM users),
    'intro',
    15,
    'Mise en relation avec DGA Marketing grand groupe retail.',
    'available',
    'public',
    'Intro DGA Marketing - Retail (400 magasins)',
    'Directeur Marketing Carrefour Sud-Ouest. Cherche agences locales.',
    15,
    NOW() - INTERVAL '4 hours'
WHERE EXISTS (SELECT 1 FROM users);
