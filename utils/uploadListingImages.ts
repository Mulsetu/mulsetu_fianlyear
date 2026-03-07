import type { SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'listing-images';
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/** Get image Blob from a local URI (file://, blob:, or https) */
async function uriToBlob(uri: string, mimeType: string = 'image/jpeg'): Promise<Blob> {
  if (uri.startsWith('file://')) {
    try {
      const { File } = await import('expo-file-system');
      const file = new File(uri);
      const ab = await file.arrayBuffer();
      return new Blob([ab], { type: mimeType });
    } catch (e) {
      console.warn('expo-file-system File read failed, trying fetch:', e);
    }
  }
  const res = await fetch(uri, { method: 'GET' });
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  return await res.blob();
}

export type ListingPhotoKind = 'crop' | 'quality' | 'packaging';

export interface UploadListingImagesResult {
  cropPhotoUrl: string;
  qualityPhotoUrl: string;
  packagingPhotoUrl: string;
}

/**
 * Upload the three listing photos to Supabase Storage and return their public URLs.
 * Paths: listing-images/{userId}/{timestamp}_crop.jpg, _quality.jpg, _packaging.jpg
 */
export async function uploadListingImages(
  supabase: SupabaseClient,
  userId: string,
  uris: { crop: string; quality: string; packaging: string }
): Promise<UploadListingImagesResult> {
  const prefix = `${userId}/${Date.now()}`;
  const mime = 'image/jpeg';

  const uploadOne = async (kind: ListingPhotoKind, fileUri: string): Promise<string> => {
    const blob = await uriToBlob(fileUri, mime);
    if (blob.size > MAX_SIZE) throw new Error(`Image ${kind} is too large (max 5MB)`);
    const path = `${prefix}_${kind}.jpg`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
      contentType: mime,
      upsert: true,
    });
    if (error) throw new Error(`Upload ${kind} failed: ${error.message}`);
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  };

  const [cropPhotoUrl, qualityPhotoUrl, packagingPhotoUrl] = await Promise.all([
    uploadOne('crop', uris.crop),
    uploadOne('quality', uris.quality),
    uploadOne('packaging', uris.packaging),
  ]);

  return { cropPhotoUrl, qualityPhotoUrl, packagingPhotoUrl };
}
