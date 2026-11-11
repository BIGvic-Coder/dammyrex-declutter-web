import Link from 'next/link';

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-10 text-center">
      <p className="font-semibold text-gray-900">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-gray-600">{text}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-4 inline-block rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
