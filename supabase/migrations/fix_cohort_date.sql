-- Corriger la date de la cohorte créée automatiquement pour qu'elle commence le 10 Février 2026
UPDATE public.cohorts
SET start_date = '2026-02-10', status = 'active'
WHERE title LIKE 'Cohorte Emploi 40%';
