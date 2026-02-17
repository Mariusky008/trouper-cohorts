-- Script pour configurer le stockage des preuves de mission

-- 1. Créer le bucket 'mission-proofs' s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('mission-proofs', 'mission-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Configurer les politiques de sécurité (RLS) pour le bucket

-- Autoriser l'accès public en lecture (pour que les coachs/admins puissent voir les preuves)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'mission-proofs' );

-- Autoriser les utilisateurs authentifiés à uploader des fichiers
-- Ils ne peuvent uploader que dans leur propre dossier (basé sur leur user_id) pour éviter le chaos
CREATE POLICY "Authenticated users can upload proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'mission-proofs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Autoriser les utilisateurs à mettre à jour/supprimer leurs propres fichiers
CREATE POLICY "Users can update their own proofs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'mission-proofs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own proofs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'mission-proofs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
