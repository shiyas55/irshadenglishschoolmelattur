import { CloudinaryConfig } from '../types/schoolCms';

const LS_CLOUDINARY_KEY = 'ies_cloudinary_config_v1';

export function getCloudinaryConfig(): CloudinaryConfig {
  let cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || '';
  let uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || process.env.CLOUDINARY_UPLOAD_PRESET || '';
  let apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY || '';
  let apiSecret = process.env.CLOUDINARY_API_SECRET || '';

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(LS_CLOUDINARY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.cloudName) cloudName = parsed.cloudName;
        if (parsed.uploadPreset) uploadPreset = parsed.uploadPreset;
        if (parsed.apiKey) apiKey = parsed.apiKey;
        if (parsed.apiSecret) apiSecret = parsed.apiSecret;
      }
    } catch (e) {
      console.warn('Error reading Cloudinary config:', e);
    }
  }

  return {
    cloudName: cloudName.trim(),
    uploadPreset: uploadPreset.trim(),
    apiKey: apiKey.trim(),
    apiSecret: apiSecret.trim(),
  };
}

export function saveCloudinaryConfig(config: Partial<CloudinaryConfig>): void {
  if (typeof window === 'undefined') return;
  const current = getCloudinaryConfig();
  const updated = { ...current, ...config };
  localStorage.setItem(LS_CLOUDINARY_KEY, JSON.stringify(updated));
}

/**
 * Optimizes Cloudinary URLs for fast delivery:
 * Adds f_auto,q_auto (automatic modern format like WebP/AVIF and optimal compression)
 */
export function getOptimizedImageUrl(
  url: string,
  options?: { width?: number; height?: number; crop?: string }
): string {
  if (!url) return '';
  if (!url.includes('res.cloudinary.com')) return url;

  const uploadSegment = '/upload/';
  const index = url.indexOf(uploadSegment);
  if (index === -1) return url;

  // Build transformation flags
  const transformations: string[] = ['f_auto', 'q_auto'];
  if (options?.width) transformations.push(`w_${options.width}`);
  if (options?.height) transformations.push(`h_${options.height}`);
  if (options?.crop) transformations.push(`c_${options.crop}`);

  const transformString = transformations.join(',');

  // Check if transformations already exist right after /upload/
  const before = url.substring(0, index + uploadSegment.length);
  const after = url.substring(index + uploadSegment.length);

  // If already contains f_auto, return as is
  if (after.startsWith('f_auto') || after.includes('/f_auto')) {
    return url;
  }

  return `${before}${transformString}/${after}`;
}

/**
 * Upload an image (File or base64 data URL) to Cloudinary.
 * Falls back to returning data URL if Cloudinary is not configured.
 */
export async function uploadImageToCloudinary(
  fileOrDataUrl: File | string,
  folder = 'irshad-school-cms'
): Promise<{ url: string; publicId?: string; isCloudinary: boolean }> {
  const config = getCloudinaryConfig();

  // Try server API first
  try {
    let payload: string;
    if (typeof fileOrDataUrl === 'string') {
      payload = fileOrDataUrl;
    } else {
      payload = await fileToDataUrl(fileOrDataUrl);
    }

    const res = await fetch('/api/upload/cloudinary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: payload,
        folder,
        cloudName: config.cloudName,
        uploadPreset: config.uploadPreset,
        apiKey: config.apiKey,
        apiSecret: config.apiSecret,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        return {
          url: getOptimizedImageUrl(data.url),
          publicId: data.public_id,
          isCloudinary: true,
        };
      }
    }
  } catch (err) {
    console.warn('Server upload to Cloudinary failed, trying client upload:', err);
  }

  // Client-side fallback if unsigned preset configured
  if (config.cloudName && config.uploadPreset) {
    try {
      const formData = new FormData();
      if (typeof fileOrDataUrl === 'string') {
        formData.append('file', fileOrDataUrl);
      } else {
        formData.append('file', fileOrDataUrl);
      }
      formData.append('upload_preset', config.uploadPreset);
      formData.append('folder', folder);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (response.ok) {
        const json = await response.json();
        return {
          url: getOptimizedImageUrl(json.secure_url || json.url),
          publicId: json.public_id,
          isCloudinary: true,
        };
      }
    } catch (err) {
      console.warn('Direct Cloudinary upload failed:', err);
    }
  }

  // Fallback to local data URL if Cloudinary is offline or unconfigured
  const localUrl = typeof fileOrDataUrl === 'string' 
    ? fileOrDataUrl 
    : await fileToDataUrl(fileOrDataUrl);

  return { url: localUrl, isCloudinary: false };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
