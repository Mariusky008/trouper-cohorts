-- 💬 LES MESSAGES DE MIKE, DANS MA MAISON — le moteur de messages (étape 4 des cages, `docs/les-cages.md`).
--
-- Jusqu'ici, `clik_message` ne gardait que les invitations datées envoyées depuis
-- le WhatsApp du commerçant (« Oui, préviens-les »). Le moteur de messages
-- (`lib/direct/moteur-messages.ts`) en propose d'autres — merci, une question
-- facile, ce dont elle a parlé, une porte ouverte —, que le commerçant valide et
-- qui arrivent dans la Maison de l'habitant (« Mes messages »). On y répond d'un
-- appui ; la réponse revient dans son carnet, et le moteur s'en souvient.
--
--   · canal : 'whatsapp' (son WhatsApp à lui) ou 'maison' (Ma Maison) ;
--   · modele : le modèle du moteur (`merci`, `memoire`…), vide pour une invitation ;
--   · choix : les une ou deux réponses faciles proposées ;
--   · reponse, repondu_le : ce qu'elle a répondu, et quand. Pour un message WhatsApp,
--     c'est le commerçant qui note « A répondu » (ClikMe ne lit pas son WhatsApp).
--
-- Le stop dans Ma Maison est celui de `clik_contact.stop_le`, pour ce commerce.
-- Se rejoue sans casser.
ALTER TABLE public.clik_message ADD COLUMN IF NOT EXISTS canal text NOT NULL DEFAULT 'whatsapp';
ALTER TABLE public.clik_message ADD COLUMN IF NOT EXISTS modele text NOT NULL DEFAULT '';
ALTER TABLE public.clik_message ADD COLUMN IF NOT EXISTS choix jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.clik_message ADD COLUMN IF NOT EXISTS reponse text NOT NULL DEFAULT '';
ALTER TABLE public.clik_message ADD COLUMN IF NOT EXISTS repondu_le timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clik_message_canal_check') THEN
    ALTER TABLE public.clik_message ADD CONSTRAINT clik_message_canal_check CHECK (canal IN ('whatsapp', 'maison'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clik_message_reponse_check') THEN
    ALTER TABLE public.clik_message ADD CONSTRAINT clik_message_reponse_check CHECK (char_length(reponse) <= 40);
  END IF;
END $$;

-- Ses messages, dans sa Maison : du plus récent au plus ancien.
CREATE INDEX IF NOT EXISTS clik_message_maison_idx ON public.clik_message (habitant_id, envoye_le DESC) WHERE canal = 'maison';
