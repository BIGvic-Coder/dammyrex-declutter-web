/**
 * next/image loader that asks Cloudinary for a resized, auto-format (WebP/AVIF),
 * auto-compressed version of each photo. q_auto:eco favours small files for slow data.
 */
export default function cloudinaryLoader({ src, width }: { src: string; width: number; quality?: number }) {
  return cldUrl(src, { width });
}

export function cldUrl(src: string, opts: { width: number; height?: number; crop?: 'limit' | 'fill' }) {
  if (!src.includes('res.cloudinary.com') || !src.includes('/image/upload/')) return src;
  const t = ['f_auto', 'q_auto:eco', `w_${opts.width}`];
  if (opts.height) t.push(`h_${opts.height}`);
  t.push(`c_${opts.crop ?? 'limit'}`);
  return src.replace('/image/upload/', `/image/upload/${t.join(',')}/`);
}
