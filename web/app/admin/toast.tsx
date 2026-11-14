'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';

type Toast = { id: number; text: string; kind: 'success' | 'error' };
const Ctx = createContext<(text: string, kind?: Toast['kind']) => void>(() => {});

/** Small toast messages ("Item posted", "Ad saved") that slide in at the bottom and fade after 3 s. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const show = useCallback((text: string, kind: Toast['kind'] = 'success') => {
    const id = nextId.current++;
    setToasts((t) => [...t.slice(-2), { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  return (
    <Ctx.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4" aria-live="polite" role="status">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-in pointer-events-auto flex min-h-11 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg ${t.kind === 'success' ? 'bg-brand-800' : 'bg-red-700'}`}
          >
            <span aria-hidden="true">{t.kind === 'success' ? '✓' : '!'}</span>
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
