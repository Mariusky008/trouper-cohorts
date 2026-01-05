-- Migration pour supporter l'Algorithme V2 (Comportemental)

-- 1. Enrichir la table bounties
ALTER TABLE bounties 
ADD COLUMN IF NOT EXISTS scenario_type TEXT DEFAULT 'standard', -- 'full_engagement', 'partial_watch', 'reply_loop', 'share_link'
ADD COLUMN IF NOT EXISTS action_sequence JSONB DEFAULT '["watch_full", "like"]'::jsonb, -- Liste des étapes
ADD COLUMN IF NOT EXISTS comment_templates JSONB DEFAULT '[]'::jsonb, -- Suggestions de commentaires
ADD COLUMN IF NOT EXISTS execute_window_start TIMESTAMPTZ, -- Début de la fenêtre d'action
ADD COLUMN IF NOT EXISTS execute_window_end TIMESTAMPTZ; -- Fin de la fenêtre

-- 2. Créer un type pour les actions possibles (optionnel mais propre)
-- On reste en TEXT pour la flexibilité JSONB pour l'instant

-- 3. Mettre à jour les données existantes (migration)
UPDATE bounties 
SET action_sequence = '["watch_full", "like"]'::jsonb 
WHERE type = 'like';

UPDATE bounties 
SET action_sequence = '["watch_full", "comment"]'::jsonb 
WHERE type = 'comment';

-- 4. Index pour les requêtes de temps
CREATE INDEX IF NOT EXISTS idx_bounties_execute_window ON bounties(execute_window_start);
