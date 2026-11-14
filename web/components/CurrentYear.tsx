'use client';

import { useEffect, useState } from 'react';

/** Current year. Static pages are built ahead of time, so the browser corrects it after New Year. */
export function CurrentYear() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  useEffect(() => setYear(new Date().getFullYear()), []);
  return <span suppressHydrationWarning>{year}</span>;
}
