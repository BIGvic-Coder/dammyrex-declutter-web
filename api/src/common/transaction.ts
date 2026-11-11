/**
 * Options for interactive Prisma transactions ($transaction(async tx => ...)).
 * Prisma's defaults (2s to start, 5s to run) are too tight for a remote Neon database
 * that may be waking from auto-suspend, so we allow more headroom.
 */
export const TX_OPTIONS = { maxWait: 10_000, timeout: 20_000 } as const;

/** True if at least one property was actually sent (ignores undefined fields). */
export function hasAnyField(obj: object): boolean {
  return Object.values(obj).some((v) => v !== undefined);
}
