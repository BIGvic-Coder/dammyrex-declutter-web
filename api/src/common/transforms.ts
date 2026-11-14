import { Transform } from 'class-transformer';

/** Trim strings and collapse runs of spaces; leave other values untouched. */
export const Trim = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim().replace(/[ \t]+/g, ' ') : value));

/** Query-string boolean: "true"/"1" -> true, "false"/"0" -> false. */
export const ToBoolean = () =>
  Transform(({ value }) => {
    if (value === true || value === 'true' || value === '1') return true;
    if (value === false || value === 'false' || value === '0') return false;
    return value;
  });

/**
 * Naira amount from a form field: accepts 45000, "45000", "45,000", "₦45,000".
 * Multipart fields always arrive as strings; JSON bodies may send numbers.
 */
export const ToNaira = () =>
  Transform(({ obj, key }) => {
    const raw = obj[key];
    if (typeof raw !== 'string') return raw;
    const cleaned = raw.replace(/[,\s₦]/g, '');
    return cleaned === '' ? NaN : Number(cleaned);
  });
