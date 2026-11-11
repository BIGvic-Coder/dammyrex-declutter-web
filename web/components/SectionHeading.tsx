import Link from 'next/link';

export function SectionHeading({ title, href, linkText = 'See all' }: { title: string; href?: string; linkText?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">{title}</h2>
      {href && (
        <Link href={href} className="shrink-0 text-sm font-semibold text-brand-700 hover:underline">
          {linkText} →
        </Link>
      )}
    </div>
  );
}
