/** Nigerian mobile number in normalised form: 234 + 10 digits (e.g. 2348012345678). */
export const NG_PHONE_REGEX = /^234[789][01]\d{8}$/;

export const NG_PHONE_MESSAGE =
  'Enter a valid Nigerian phone number, e.g. 08012345678 or +2348012345678';

/**
 * Accepts 08012345678, +234 801 234 5678, 234-801-234-5678, 8012345678
 * and returns 2348012345678. Leaves anything else for the validator to reject.
 */
export function normalizeNgPhone(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw;
  let d = raw.replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('0')) d = '234' + d.slice(1);
  else if (d.length === 10 && /^[789]/.test(d)) d = '234' + d;
  return d;
}
