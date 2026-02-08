-- 1. Create bucket if not exists
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- 2. Drop existing policies to avoid conflicts
drop policy if exists "Avatar Public Access" on storage.objects;
drop policy if exists "Avatar Upload" on storage.objects;
drop policy if exists "Avatar Update" on storage.objects;
drop policy if exists "Avatar Delete" on storage.objects;
drop policy if exists "Give me access" on storage.objects; -- Cleaning potential old policies

-- 3. Create permissive policies for the 'avatars' bucket

-- Allow public read access to everyone
create policy "Avatar Public Access"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- Allow authenticated users to upload files to 'avatars' bucket
create policy "Avatar Upload"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'avatars' );

-- Allow users to update their own files (or any file in this bucket for MVP simplicity)
create policy "Avatar Update"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'avatars' );

-- Allow users to delete files
create policy "Avatar Delete"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'avatars' );
