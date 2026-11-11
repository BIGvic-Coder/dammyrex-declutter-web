// Browser-side helpers for forms (sell + inspection booking).

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');

/** Same rules as the API: 080…, +234 80…, 80… all become 23480… */
export function normalizeNgPhone(raw: string): string {
  let d = raw.replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('0')) d = '234' + d.slice(1);
  else if (d.length === 10 && /^[789]/.test(d)) d = '234' + d;
  return d;
}
export const isValidNgPhone = (raw: string) => /^234[789][01]\d{8}$/.test(normalizeNgPhone(raw));

export class RequestError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Turn a NestJS error body into one readable sentence. */
function errorMessage(status: number, body: unknown): string {
  if (status === 429) return 'Too many attempts. Please wait a while and try again.';
  if (status === 0) return 'No internet connection, or our server is unreachable. Please check your data and try again.';
  const msg = (body as { message?: unknown } | null)?.message;
  const first = Array.isArray(msg) ? msg[0] : msg;
  if (typeof first === 'string' && first) return first.charAt(0).toUpperCase() + first.slice(1);
  if (status >= 500) return 'Something went wrong on our side. Please try again in a moment.';
  return 'Please check the form and try again.';
}

export async function postJson<T>(path: string, data: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch {
    throw new RequestError(0, errorMessage(0, null));
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new RequestError(res.status, errorMessage(res.status, body));
  return body as T;
}

/** Multipart POST with upload progress (0-1), important feedback on slow mobile data. */
export function postFormWithProgress<T>(path: string, form: FormData, onProgress: (p: number) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}${path}`);
    xhr.timeout = 5 * 60 * 1000;
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      let body: unknown = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300) resolve(body as T);
      else reject(new RequestError(xhr.status, errorMessage(xhr.status, body)));
    };
    xhr.onerror = () => reject(new RequestError(0, errorMessage(0, null)));
    xhr.ontimeout = () => reject(new RequestError(0, 'The upload took too long. Try fewer photos or a stronger connection.'));
    xhr.send(form);
  });
}

/**
 * Shrink a phone photo before upload (max 1600px, JPEG ~80%).
 * A 4 MB camera photo typically becomes 200-400 KB, which is a big saving on mobile data.
 * Falls back to the original file if the browser can't decode it (e.g. HEIC on Android).
 */
export async function compressImage(file: File, maxSide = 1600, quality = 0.8): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', quality));
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], name, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

export const formatBytes = (n: number) => (n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);
