import { supabase } from '../supabase/config';

async function compressImage(file, maxWidth = 1200, quality = 0.78) {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    const fallback = () => { URL.revokeObjectURL(objectUrl); resolve(file); };

    // If canvas.toBlob never fires, fall back after 10s
    const timer = setTimeout(fallback, 10000);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          clearTimeout(timer);
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
            type: 'image/jpeg',
            lastModified: Date.now(),
          }));
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => { clearTimeout(timer); fallback(); };
    img.src = objectUrl;
  });
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}

// Only raster images are accepted — never SVG (XSS vector) or arbitrary files.
// Mirrors the server-side allowed_mime_types on the storage buckets.
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB, matches bucket file_size_limit
const EXT_BY_TYPE = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

function randomToken(bytes = 8) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function uploadCore(bucket, file, path, retries) {
  const mime = (file.type || '').toLowerCase();
  if (!ALLOWED_TYPES.includes(mime)) {
    throw new Error('Only JPG, PNG, or WebP images are allowed.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('Image is too large — maximum size is 8 MB.');
  }

  file = await compressImage(file);

  // Extension comes from the verified MIME type, never from the user's filename.
  const fileExt = EXT_BY_TYPE[(file.type || '').toLowerCase()] || 'jpg';
  const safePrefix = String(path || 'file').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 80) || 'file';
  const fileName = `${safePrefix}_${randomToken()}.${fileExt}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const uploadPromise = supabase.storage.from(bucket).upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'image/jpeg',
      });
      const { error } = await withTimeout(uploadPromise, 30000, 'Storage upload');

      if (error) {
        if (attempt === retries) throw error;
        await new Promise(r => setTimeout(r, 1500 * attempt));
        continue;
      }

      break;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 1500 * attempt));
    }
  }

  return fileName;
}

/** Upload to a public bucket (posters, logos) — returns the public URL. */
export async function uploadFile(bucket, file, path = null, retries = 2) {
  if (!file) return null;
  const fileName = await uploadCore(bucket, file, path, retries);
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return publicUrl;
}

/** Upload to a private bucket (proofs) — returns the object path, not a URL. */
export async function uploadPrivateFile(bucket, file, path = null, retries = 2) {
  if (!file) return null;
  return uploadCore(bucket, file, path, retries);
}

/**
 * Resolve a viewable URL for a proof entry. ze-proofs is a private bucket, so
 * entries are object paths that need a short-lived signed URL (admin-only via
 * RLS). Legacy entries that were stored as full public URLs are re-signed too.
 */
export async function getSignedProofUrl(entry, expiresInSeconds = 3600) {
  if (!entry) return null;
  const path = entry.startsWith('http')
    ? (entry.match(/\/ze-proofs\/([^?]+)/)?.[1] ?? null)
    : entry;
  if (!path) return entry;
  const { data, error } = await supabase.storage.from('ze-proofs').createSignedUrl(path, expiresInSeconds);
  return error ? entry : data.signedUrl;
}
