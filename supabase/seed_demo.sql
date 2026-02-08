begin;

insert into public.cohorts (slug, trade, title, start_date, end_date, status)
values ('demo-coach', 'Coach', 'Cohorte Démo Coachs', current_date, current_date + 13, 'live')
on conflict (slug) do update
set trade = excluded.trade,
    title = excluded.title,
    start_date = excluded.start_date,
    end_date = excluded.end_date,
    status = excluded.status;

insert into public.missions (cohort_id, day_index, title, description)
select c.id, gs, 'Jour ' || gs || ' — Mission', 'Décris la mission ici.'
from public.cohorts c
cross join generate_series(1, 14) gs
where c.slug = 'demo-coach'
on conflict (cohort_id, day_index) do nothing;

commit;
