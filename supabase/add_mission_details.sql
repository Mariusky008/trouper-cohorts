-- Add visual details to missions to make them look "dense"
alter table public.missions 
add column if not exists duration text, -- ex: '2h00', '45min'
add column if not exists energy_level text default 'high'; -- 'normal', 'high', 'extreme'
