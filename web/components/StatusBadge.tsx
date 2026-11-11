import { STATUS_LABEL } from '@/lib/format';
import type { ItemStatus } from '@/lib/types';

const STYLES: Partial<Record<ItemStatus, string>> = {
  AVAILABLE: 'bg-brand-600 text-white',
  RESERVED: 'bg-amber-400 text-amber-950',
  SOLD: 'bg-red-600 text-white',
};

export function StatusBadge({ status, className = '' }: { status: ItemStatus; className?: string }) {
  return (
    <span
      className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${STYLES[status] ?? 'bg-gray-200 text-gray-800'} ${className}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
