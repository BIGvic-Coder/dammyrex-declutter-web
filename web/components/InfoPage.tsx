import Link from 'next/link';

/** Shared layout for the About / Help / Legal pages. */
export function InfoPage({
  eyebrow,
  title,
  intro,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  /** "Last updated" line for policy pages */
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <article>
      <header className="bg-gradient-to-b from-brand-800 to-brand-700 text-white">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-200">{eyebrow}</p>
          <h1 className="mt-2 font-display text-3xl leading-tight tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-base text-brand-100 sm:text-lg">{intro}</p>
          {updated && <p className="mt-3 text-xs text-brand-200">Last updated: {updated}</p>}
        </div>
      </header>
      <div className="prose-info mx-auto max-w-3xl px-4 py-8 sm:py-10">{children}</div>
      <div className="mx-auto max-w-3xl px-4 pb-4">
        <div className="flex flex-col gap-3 rounded-2xl bg-brand-50 p-5 ring-1 ring-brand-100 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold text-brand-900">Still have a question?</p>
          <div className="flex gap-2">
            <Link href="/contact" className="inline-flex min-h-11 items-center rounded-xl bg-brand-700 px-4 font-semibold text-white hover:bg-brand-800">Contact us</Link>
            <Link href="/items" className="inline-flex min-h-11 items-center rounded-xl px-4 font-semibold text-brand-800 ring-2 ring-brand-700 hover:bg-white">Browse items</Link>
          </div>
        </div>
      </div>
    </article>
  );
}

/** Simple question/answer list that works without JavaScript. */
export function Faq({ items }: { items: { q: string; a: React.ReactNode }[] }) {
  return (
    <div className="divide-y divide-black/5 rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
      {items.map((f) => (
        <details key={f.q} className="group px-4">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 py-3 font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
            {f.q}
            <span className="text-brand-700 transition-transform group-open:rotate-45" aria-hidden="true">＋</span>
          </summary>
          <div className="pb-4 text-[15px] leading-relaxed text-gray-700">{f.a}</div>
        </details>
      ))}
    </div>
  );
}
