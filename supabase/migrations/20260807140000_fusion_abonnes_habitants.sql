-- FUSION : `human_ville_abonnes` disparaît dans `human_habitants`.
--
-- POURQUOI
--
-- Les deux tables décrivent le même sujet : quelqu'un qui habite une ville et
-- veut en recevoir des nouvelles. Deux tables pour un sujet, c'est deux vérités
-- qui divergent — l'une sait qu'on s'est désabonné, l'autre continue d'écrire.
--
-- `human_habitants` est un sur-ensemble strict de `human_ville_abonnes` : mêmes
-- colonnes, plus l'identité d'appareil, les préférences de canal et le secteur.
-- La seule différence de forme est `email`, qui passe de NOT NULL à nullable —
-- et c'est le sens même du produit : on peut être un habitant du Direct sans
-- jamais donner d'adresse.
--
-- LES JETONS SONT RECOPIÉS TELS QUELS. C'est le point non négociable : des
-- abonnés ont un lien de confirmation ou de retrait dans leur boîte mail. Les
-- régénérer casserait ces liens, et casser un lien de désinscription n'est pas
-- une maladresse, c'est une faute.
--
-- L'ANCIENNE TABLE EST RENOMMÉE, PAS SUPPRIMÉE. La recopie porte sur de vrais
-- abonnés ; si elle s'avérait incomplète, la supprimer rendrait la perte
-- définitive. Renommée, elle sort du champ du code (plus aucune requête ne la
-- nomme) tout en restant récupérable. Elle pourra être supprimée une fois la
-- fusion vérifiée en production.

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.human_ville_abonnes') IS NULL THEN
    RAISE NOTICE 'human_ville_abonnes absente — rien à fusionner.';
    RETURN;
  END IF;

  -- Les préférences de canal des abonnés historiques : ils se sont inscrits au
  -- résumé quotidien, et à rien d'autre. Leur activer d'office les alertes de
  -- dernière minute serait leur imposer un canal qu'ils n'ont pas demandé.
  INSERT INTO public.human_habitants (
    ville, ville_slug, email,
    confirm_token, unsub_token, confirmed_at, unsubscribed_at,
    consent_text, consent_at, last_sent_at, created_at,
    recoit_resume, recoit_alertes, recoit_suivis, recoit_ville_infos
  )
  SELECT
    a.ville, a.ville_slug, lower(a.email),
    a.confirm_token, a.unsub_token, a.confirmed_at, a.unsubscribed_at,
    a.consent_text, a.consent_at, a.last_sent_at, a.created_at,
    true, false, false, false
  FROM public.human_ville_abonnes a
  -- Rejouable : une seconde exécution ne duplique personne. Le doublon se juge
  -- sur (ville, adresse), exactement la contrainte que porte la table cible.
  WHERE NOT EXISTS (
    SELECT 1 FROM public.human_habitants h
    WHERE h.ville_slug = a.ville_slug AND lower(h.email) = lower(a.email)
  );

  ALTER TABLE public.human_ville_abonnes RENAME TO human_ville_abonnes_avant_direct;
END
$$;

NOTIFY pgrst, 'reload schema';

COMMIT;
