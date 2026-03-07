-- ============================================
-- Storage bucket for farmer listing images (crop, quality, packaging)
-- ============================================

-- 1) Create public bucket so listing images are reachable via public URL
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-images',
  'listing-images',
  true,
  5242880,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2) RLS: allow anyone to read (SELECT) objects in listing-images (public bucket)
drop policy if exists "listing_images_public_read" on storage.objects;
create policy "listing_images_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'listing-images');

-- 3) RLS: allow authenticated users to upload (INSERT) only to their own folder: {user_id}/*
drop policy if exists "listing_images_authenticated_upload" on storage.objects;
create policy "listing_images_authenticated_upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4) RLS: allow authenticated users to update/delete their own files
drop policy if exists "listing_images_authenticated_update" on storage.objects;
create policy "listing_images_authenticated_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "listing_images_authenticated_delete" on storage.objects;
create policy "listing_images_authenticated_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
