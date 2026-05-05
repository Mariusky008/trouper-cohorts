BEGIN;

-- Reset global: all marketplace places become free/available until real accepted members exist.
UPDATE public.human_marketplace_places
SET
  status = 'dispo',
  owner_member_id = NULL,
  list_price_eur = 0,
  monthly_ca_eur = 0,
  recos_per_year = 0,
  conversion_rate = 0,
  months_active = 0,
  reciprocity_score = 0,
  partners_count = 0,
  value_growth_pct = 0,
  company_name = NULL,
  privilege_badge = NULL,
  logo_url = NULL,
  category_key = NULL,
  partner_phone = NULL,
  partner_whatsapp = NULL,
  external_ref = NULL,
  claimed_at = NULL,
  claimed_by_offer_id = NULL,
  updated_at = timezone('utc', now());

COMMIT;
