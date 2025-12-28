-- Create a storage bucket for proofs
insert into storage.buckets (id, name, public) 
values ('proofs', 'proofs', true);

-- Policy to allow authenticated users to upload proofs
create policy "Users can upload proofs"
on storage.objects for insert
with check (
  bucket_id = 'proofs' AND
  auth.role() = 'authenticated'
);

-- Policy to allow everyone to view proofs (for squad verification later)
create policy "Anyone can view proofs"
on storage.objects for select
using ( bucket_id = 'proofs' );
