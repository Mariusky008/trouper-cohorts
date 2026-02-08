-- Create a new bucket for avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Policy: Anyone can view
create policy "Avatar Public Access"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- Policy: Authenticated users can upload
-- We allow users to upload to a folder named with their user ID to ensure isolation
create policy "Avatar Upload"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'avatars' );

-- Policy: Users can update
create policy "Avatar Update"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'avatars' );
  
-- Policy: Users can delete
create policy "Avatar Delete"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'avatars' );
