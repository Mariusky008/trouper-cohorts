-- 1. Function to ensure trust score row exists
create or replace function public.ensure_trust_score(uid uuid)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.trust_scores (user_id) values (uid)
  on conflict (user_id) do nothing;
end;
$$;

-- 2. RPC to increment trust score safely
create or replace function public.increment_trust_score(target_user_id uuid, amount numeric)
returns void
language plpgsql
security definer
as $$
begin
  -- Ensure record exists first
  perform public.ensure_trust_score(target_user_id);

  -- Update score
  update public.trust_scores
  set score = least(5.0, score + amount),
      last_updated = timezone('utc'::text, now())
  where user_id = target_user_id;
end;
$$;

-- 3. Trigger to update stats on opportunity validation
create or replace function public.handle_opportunity_validation()
returns trigger as $$
begin
  if new.status = 'validated' and old.status != 'validated' then
    -- Ensure trust scores exist
    perform public.ensure_trust_score(new.giver_id);
    perform public.ensure_trust_score(new.receiver_id);

    -- Increment given count for giver
    update public.trust_scores
    set opportunities_given = opportunities_given + 1
    where user_id = new.giver_id;
    
    -- Increment received count for receiver
    update public.trust_scores
    set opportunities_received = opportunities_received + 1
    where user_id = new.receiver_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_opportunity_validated on public.network_opportunities;
create trigger on_opportunity_validated
  after update on public.network_opportunities
  for each row execute procedure public.handle_opportunity_validation();
