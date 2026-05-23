import { supabase } from '../supabase/config';

/**
 * Compress an image file via Canvas before uploading.
 * Shrinks to maxWidth px and re-encodes as JPEG at the given quality.
 */
async function compressImage(file, maxWidth = 1200, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

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

    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
    img.src = objectUrl;
  });
}

/**
 * uploadFile — generic helper to upload a file to a Supabase bucket.
 * Images are compressed automatically before upload.
 * @param {string} bucket - Bucket name (e.g. 'ze-posters' or 'ze-logos')
 * @param {File} file - The file object from <input type="file" />
 * @param {string} path - Optional sub-path/filename prefix
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
export async function uploadFile(bucket, file, path = null, retries = 3) {
  if (!file) return null;

  // Compress images before upload to save storage space
  if (file.type.startsWith('image/')) {
    file = await compressImage(file);
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${path || Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
  const filePath = fileName;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (error) {
        console.error(`Upload error attempt ${attempt} in [${bucket}]:`, error.message);
        if (attempt === retries) throw error;
        await new Promise(r => setTimeout(r, 1000 * attempt));
        continue;
      }

      break;
    } catch (err) {
      console.error(`Attempt ${attempt} failed:`, err.message);
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return publicUrl;
}
