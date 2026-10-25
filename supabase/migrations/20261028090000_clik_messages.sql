-- 📲 LES MESSAGES ENVOYÉS DEPUIS LE COMPTOIR — « Oui, préviens-les » (étape 3 des cages, `docs/les-cages.md`).
--
-- Quelqu'un a laissé son numéro à la fin d'une vidéo (`clik_contact`) pour être
-- prévenu. Mike, l'assistant du comptoir, écrit le message ; le commerçant
-- l'envoie depuis SON WhatsApp (un lien wa.me) : ClikMe n'envoie rien. On garde
-- ici qu'il l'a envoyé, quand, son texte, et le petit plus offert.
--
-- C'est ce qui tient les règles du carnet de messages : deux messages par
-- semaine au plus, pas deux le même jour, un petit plus au plus un message sur
-- cinq et jamais deux fois le même. Et ce que comptera le ticket de Mike.
--
-- Seul le serveur écrit ici (clé de service) ; la sécurité par ligne est
-- activée sans règle, pour qu'aucun navigateur ne puisse lire ni écrire.
CREATE TABLE IF NOT EXISTS public.clik_message (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL,
  habitant_id uuid NOT NULL,
  texte text NOT NULL CHECK (char_length(texte) BETWEEN 1 AND 1000),
  plus text NOT NULL DEFAULT '' CHECK (char_length(plus) <= 60),
  envoye_le timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS clik_message_site_idx ON public.clik_message (site_id, envoye_le DESC);
CREATE INDEX IF NOT EXISTS clik_message_habitant_idx ON public.clik_message (site_id, habitant_id, envoye_le DESC);
ALTER TABLE public.clik_message ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.clik_message IS
  'Un message qu''un commerçant a envoyé depuis son WhatsApp à quelqu''un qui voulait être prévenu (« Oui, préviens-les »), écrit par Mike au comptoir. Avec le petit plus offert, s''il y en avait un.';
